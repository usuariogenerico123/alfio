package stellar

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type CreateOrderRequest struct {
	ProductID      string        `json:"productId" binding:"required"`
	ProductCode    string        `json:"productCode" binding:"required"`
	ProductName    string        `json:"productName" binding:"required"`
	Description    string        `json:"description"`
	Specs          []ProductSpec `json:"specs"`
	BuyerName      string        `json:"buyerName" binding:"required"`
	BuyerWallet    string        `json:"buyerWallet" binding:"required"`
	StoreWallet    string        `json:"storeWallet" binding:"required"`
	TotalPriceUsdc float64       `json:"totalPriceUsdc" binding:"required,gt=0"`
}

// RegisterRoutes registra los endpoints de órdenes y los 2 streams SSE compatibles con frontend-owner.
func RegisterRoutes(rg *gin.RouterGroup, hub *EventHub, horizon *HorizonClient) {
	// Acá el cliente manda la orden de compra y nosotros empujamos la alerta por SSE al dueño
	rg.POST("/stellar/orders", func(c *gin.Context) {
		var req CreateOrderRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "payload inválido: " + err.Error()})
			return
		}

		orderID := fmt.Sprintf("ORD-%d", time.Now().UnixMilli()%100000)
		downPayment := req.TotalPriceUsdc / 2
		installmentAmount := downPayment / 4
		memo := fmt.Sprintf("ALFIO-%s", orderID)

		ev := OrderAlertEvent{
			OrderID:               orderID,
			ProductID:             req.ProductID,
			ProductCode:           req.ProductCode,
			ProductName:           req.ProductName,
			Description:           req.Description,
			Specs:                 req.Specs,
			BuyerName:             req.BuyerName,
			BuyerWallet:           req.BuyerWallet,
			StoreWallet:           strings.TrimSpace(req.StoreWallet),
			Memo:                  memo,
			TotalPriceUsdc:        req.TotalPriceUsdc,
			DownPaymentUsdc:       downPayment,
			InstallmentAmountUsdc: installmentAmount,
			InstallmentsCount:     4,
			CreatedAt:             time.Now().UTC().Format(time.RFC3339),
		}

		// Acá disparamos el evento hacia el stream SSE #1 que está escuchando el frontend del dueño
		hub.PublishOrder(ev)
		c.JSON(http.StatusCreated, ev)
	})

	// Acá el frontend del dueño se conecta al SSE #1 y se queda esperando alertas de órdenes nuevas
	rg.GET("/owner/events/orders", func(c *gin.Context) {
		setSSEHeaders(c)
		ch, unsubscribe := hub.SubscribeOrders()
		defer unsubscribe()

		ctx := c.Request.Context()
		flusher, _ := c.Writer.(http.Flusher)

		// Acá mandamos un ping inicial para que el navegador sepa que el SSE ya conectó
		fmt.Fprintf(c.Writer, ": connected\n\n")
		if flusher != nil {
			flusher.Flush()
		}

		for {
			select {
			case <-ctx.Done():
				return
			case ev, ok := <-ch:
				if !ok {
					return
				}
				// Acá le empujamos la orden al dueño para que vea el producto y el botón "Aceptar"
				writeSSEEvent(c.Writer, flusher, "order_created", ev)
			}
		}
	})

	// Acá llega el click de "Aceptar" del dueño y arrancamos la goroutine que escucha pagos en Stellar
	rg.POST("/owner/orders/:orderId/accept", func(c *gin.Context) {
		orderID := c.Param("orderId")
		ord, started := hub.TryAcceptOrder(orderID)
		if ord == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "orden no encontrada"})
			return
		}

		if started {
			// Acá lanzamos la goroutine en segundo plano para escuchar a Horizon sin bloquear esta petición
			go watchOrderPaymentOnHorizon(hub, horizon, ord)
		}

		c.JSON(http.StatusOK, gin.H{
			"accepted": true,
			"orderId":  orderID,
			"memo":     ord.event.Memo,
		})
	})

	// Acá el frontend del dueño se conecta al SSE #2 para esperar la confirmación de "Pagado"
	rg.GET("/owner/events/payments/:orderId", func(c *gin.Context) {
		orderID := c.Param("orderId")
		setSSEHeaders(c)
		ch, unsubscribe := hub.SubscribePayment(orderID)
		defer unsubscribe()

		ctx := c.Request.Context()
		flusher, _ := c.Writer.(http.Flusher)

		fmt.Fprintf(c.Writer, ": waiting_payment\n\n")
		if flusher != nil {
			flusher.Flush()
		}

		for {
			select {
			case <-ctx.Done():
				return
			case ev, ok := <-ch:
				if !ok {
					return
				}
				// Acá le empujamos el evento "order_paid" al dueño para que salga la ventana "Pagado"
				writeSSEEvent(c.Writer, flusher, "order_paid", ev)
				return
			}
		}
	})
}

// Acá la goroutine se queda escuchando las alertas de pago de Stellar (Horizon) con un límite de 5 minutos
func watchOrderPaymentOnHorizon(hub *EventHub, horizon *HorizonClient, ord *trackedOrder) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// Acá escuchamos en tiempo real los pagos entrantes a la wallet de la tienda en Horizon Testnet
	err := horizon.ListenPayments(ctx, ord.event.StoreWallet, func(pay PaymentEvent) {
		// Acá verificamos en Horizon que la transacción fue exitosa y que el memo coincide con esta orden
		tx, err := horizon.GetTransaction(ctx, pay.TransactionHash)
		if err != nil || !tx.Successful {
			return
		}
		if ord.event.Memo != "" && strings.TrimSpace(tx.Memo) != ord.event.Memo {
			return
		}

		paidAmount, _ := strconv.ParseFloat(pay.Amount, 64)
		if paidAmount <= 0 {
			paidAmount = ord.event.DownPaymentUsdc
		}

		confirmed := PaymentConfirmedEvent{
			OrderID:        ord.event.OrderID,
			ProductCode:    ord.event.ProductCode,
			ProductName:    ord.event.ProductName,
			BuyerName:      ord.event.BuyerName,
			BuyerWallet:    ord.event.BuyerWallet,
			AmountPaidUsdc: paidAmount,
			TotalPriceUsdc: ord.event.TotalPriceUsdc,
			TxHash:         pay.TransactionHash,
			PaidAt:         time.Now().UTC().Format(time.RFC3339),
		}

		// Acá avisamos de forma atómica (una sola vez) al SSE #2 del dueño que el pago ya entró y cerramos el stream
		if hub.PublishPaymentOnce(ord, confirmed) {
			cancel()
		}
	})

	if err != nil && ctx.Err() == nil {
		log.Printf("horizon listener terminado para orden %s: %v", ord.event.OrderID, err)
	}
}

func setSSEHeaders(c *gin.Context) {
	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("X-Accel-Buffering", "no")
}

func writeSSEEvent(w http.ResponseWriter, flusher http.Flusher, eventName string, data any) {
	raw, err := json.Marshal(data)
	if err != nil {
		return
	}
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", eventName, raw)
	if flusher != nil {
		flusher.Flush()
	}
}
