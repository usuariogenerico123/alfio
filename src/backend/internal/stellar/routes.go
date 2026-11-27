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

type RejectOrderRequest struct {
	Reason string `json:"reason"`
}

type ConfirmOrderPaymentRequest struct {
	TxHash string `json:"txHash" binding:"required"`
}

// RegisterRoutes registra las rutas HTTP y streams SSE separados por actor: COMPRADOR y TIENDA.
func RegisterRoutes(rg *gin.RouterGroup, hub *EventHub, horizon *HorizonClient) {

	// COMPRADOR (frontend-client)
	// COMPRADOR envía solicitud de compra (dispara alerta SSE a la tienda) -------
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

		hub.PublishOrder(ev)
		c.JSON(http.StatusCreated, ev)
	})

	//  SSE COMPRADOR: escucha si la tienda acepta o rechaza su solicitud -------
	rg.GET("/stellar/orders/:orderId/events", func(c *gin.Context) {
		orderID := c.Param("orderId")
		setSSEHeaders(c)
		ch, snapshot, unsubscribe := hub.SubscribeOrderStatus(orderID)
		defer unsubscribe()

		ctx := c.Request.Context()
		flusher, _ := c.Writer.(http.Flusher)

		fmt.Fprintf(c.Writer, ": waiting_store_decision\n\n")
		if flusher != nil {
			flusher.Flush()
		}

		if snapshot != nil {
			eventName := "order_accepted"
			if snapshot.Status == OrderStatusRejected {
				eventName = "order_rejected"
			}
			writeSSEEvent(c.Writer, flusher, eventName, snapshot)
			return
		}

		for {
			select {
			case <-ctx.Done():
				return
			case ev, ok := <-ch:
				if !ok {
					return
				}
				eventName := "order_accepted"
				if ev.Status == OrderStatusRejected {
					eventName = "order_rejected"
				}
				writeSSEEvent(c.Writer, flusher, eventName, ev)
				return
			}
		}
	})

	// COMPRADOR: confirma el hash de pago devuelto por Pollar (verifica en Horizon y avisa a la tienda) -------
	rg.POST("/stellar/orders/:orderId/confirm", func(c *gin.Context) {
		orderID := c.Param("orderId")
		ord := hub.GetOrder(orderID)
		if ord == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "orden no encontrada"})
			return
		}
		if !ord.IsAccepted() {
			c.JSON(http.StatusConflict, gin.H{"error": "la orden aún no fue aceptada por la tienda"})
			return
		}

		var req ConfirmOrderPaymentRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "txHash requerido: " + err.Error()})
			return
		}

		txHash := strings.TrimSpace(req.TxHash)
		tx, err := horizon.GetTransaction(c.Request.Context(), txHash)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "no se pudo verificar la transacción en Horizon: " + err.Error()})
			return
		}
		if !tx.Successful {
			c.JSON(http.StatusBadRequest, gin.H{"error": "la transacción en Stellar no fue exitosa"})
			return
		}
		if ord.event.Memo != "" && strings.TrimSpace(tx.Memo) != ord.event.Memo {
			c.JSON(http.StatusBadRequest, gin.H{"error": "el memo de la transacción no coincide con la orden"})
			return
		}

		confirmed := PaymentConfirmedEvent{
			OrderID:        ord.event.OrderID,
			ProductCode:    ord.event.ProductCode,
			ProductName:    ord.event.ProductName,
			BuyerName:      ord.event.BuyerName,
			BuyerWallet:    ord.event.BuyerWallet,
			AmountPaidUsdc: ord.event.DownPaymentUsdc,
			TotalPriceUsdc: ord.event.TotalPriceUsdc,
			TxHash:         txHash,
			PaidAt:         time.Now().UTC().Format(time.RFC3339),
		}

		hub.PublishPaymentOnce(ord, confirmed)
		c.JSON(http.StatusOK, confirmed)
	})

	// =========================================================================
	// TIENDA (frontend-owner)

	// SSE TIENDA: escucha solicitudes de compra nuevas 
	rg.GET("/owner/events/orders", func(c *gin.Context) {
		setSSEHeaders(c)
		storeWallet := c.Query("storeWallet")
		ch, unsubscribe := hub.SubscribeOrders(storeWallet)
		defer unsubscribe()

		ctx := c.Request.Context()
		flusher, _ := c.Writer.(http.Flusher)

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
				writeSSEEvent(c.Writer, flusher, "order_created", ev)
			}
		}
	})

	// TIENDA: acepta solicitud (desbloquea pago en el comprador y escucha Horizon como respaldo) -------
	rg.POST("/owner/orders/:orderId/accept", func(c *gin.Context) {
		orderID := c.Param("orderId")
		ord, started := hub.TryAcceptOrder(orderID)
		if ord == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "orden no encontrada"})
			return
		}
		if !started && !ord.IsAccepted() {
			c.JSON(http.StatusConflict, gin.H{"error": "la orden ya fue rechazada"})
			return
		}

		if started {
			// Goroutine en segundo plano escuchando Horizon como respaldo si el comprador no llama a /confirm
			go watchOrderPaymentOnHorizon(hub, horizon, ord)
		}

		c.JSON(http.StatusOK, gin.H{
			"accepted": true,
			"orderId":  orderID,
			"memo":     ord.event.Memo,
		})
	})

	// ------- TIENDA: rechaza solicitud (avisa al SSE del comprador) -------
	rg.POST("/owner/orders/:orderId/reject", func(c *gin.Context) {
		orderID := c.Param("orderId")
		var req RejectOrderRequest
		_ = c.ShouldBindJSON(&req)

		ord, rejected := hub.RejectOrder(orderID, req.Reason)
		if ord == nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "orden no encontrada"})
			return
		}
		if !rejected {
			c.JSON(http.StatusConflict, gin.H{"error": "la orden ya fue procesada"})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"rejected": true,
			"orderId":  orderID,
		})
	})

	// ------- SSE TIENDA: escucha confirmación de pago de una orden aceptada -------
	rg.GET("/owner/events/payments/:orderId", func(c *gin.Context) {
		orderID := c.Param("orderId")
		setSSEHeaders(c)
		ch, snapshot, unsubscribe := hub.SubscribePayment(orderID)
		defer unsubscribe()

		ctx := c.Request.Context()
		flusher, _ := c.Writer.(http.Flusher)

		fmt.Fprintf(c.Writer, ": waiting_payment\n\n")
		if flusher != nil {
			flusher.Flush()
		}

		if snapshot != nil {
			writeSSEEvent(c.Writer, flusher, "order_paid", snapshot)
			return
		}

		for {
			select {
			case <-ctx.Done():
				return
			case ev, ok := <-ch:
				if !ok {
					return
				}
				writeSSEEvent(c.Writer, flusher, "order_paid", ev)
				return
			}
		}
	})
}

// watchOrderPaymentOnHorizon escucha pagos entrantes a la wallet de la tienda en Horizon Testnet (timeout 5 min).
func watchOrderPaymentOnHorizon(hub *EventHub, horizon *HorizonClient, ord *trackedOrder) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	err := horizon.ListenPayments(ctx, ord.event.StoreWallet, func(pay PaymentEvent) {
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
