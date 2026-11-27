package stellar

import (
	"strings"
	"sync"
	"sync/atomic"
)

const (
	OrderStatusPending   = "pending"
	OrderStatusAccepted  = "accepted"
	OrderStatusRejected  = "rejected"
	OrderStatusCancelled = "cancelled"
)

// ProductSpec coincide con el formato de especificaciones que muestra frontend-owner.
type ProductSpec struct {
	Label string `json:"label"`
	Value string `json:"value"`
}

// OrderAlertEvent coincide con IncomingOrderEvent en frontend-owner/src/api/types.ts.
type OrderAlertEvent struct {
	OrderID               string        `json:"orderId"`
	ProductID             string        `json:"productId"`
	ProductCode           string        `json:"productCode"`
	ProductName           string        `json:"productName"`
	Description           string        `json:"description"`
	Specs                 []ProductSpec `json:"specs"`
	BuyerName             string        `json:"buyerName"`
	BuyerWallet           string        `json:"buyerWallet"`
	StoreWallet           string        `json:"storeWallet"`
	Memo                  string        `json:"memo"`
	TotalPriceUsdc        float64       `json:"totalPriceUsdc"`
	DownPaymentUsdc       float64       `json:"downPaymentUsdc"`
	InstallmentAmountUsdc float64       `json:"installmentAmountUsdc"`
	InstallmentsCount     int           `json:"installmentsCount"`
	CreatedAt             string        `json:"createdAt"`
}

// OrderStatusEvent avisa al comprador si la tienda aceptó o rechazó su solicitud.
type OrderStatusEvent struct {
	OrderID string `json:"orderId"`
	Status  string `json:"status"`
	Memo    string `json:"memo,omitempty"`
	Reason  string `json:"reason,omitempty"`
}

// PaymentConfirmedEvent coincide con PaymentConfirmedEvent en frontend-owner/src/api/types.ts.
type PaymentConfirmedEvent struct {
	OrderID        string  `json:"orderId"`
	ProductCode    string  `json:"productCode"`
	ProductName    string  `json:"productName"`
	BuyerName      string  `json:"buyerName"`
	BuyerWallet    string  `json:"buyerWallet"`
	AmountPaidUsdc float64 `json:"amountPaidUsdc"`
	TotalPriceUsdc float64 `json:"totalPriceUsdc"`
	TxHash         string  `json:"txHash"`
	PaidAt         string  `json:"paidAt"`
}

// OrderCancelledEvent avisa a la tienda que el comprador canceló su solicitud.
type OrderCancelledEvent struct {
	OrderID string `json:"orderId"`
	Reason  string `json:"reason,omitempty"`
}

// OwnerStreamMessage encapsula los eventos enviados por el SSE #1 de la tienda (order_created / order_cancelled).
type OwnerStreamMessage struct {
	EventName string
	Payload   any
}

// trackedOrder protege de forma concurrente el ciclo de vida de una orden (pendiente -> aceptada/rechazada/cancelada -> pagada).
type trackedOrder struct {
	event            OrderAlertEvent
	mu               sync.Mutex
	status           string
	reason           string
	confirmedPayment *PaymentConfirmedEvent
	accepted         atomic.Bool
	paid             atomic.Bool
}

func (o *trackedOrder) IsAccepted() bool {
	return o.accepted.Load()
}

// EventHub coordina de forma concurrente y segura los streams SSE del comprador y de la tienda.
type EventHub struct {
	mu                sync.RWMutex
	orderSubscribers  map[chan OwnerStreamMessage]string
	statusSubscribers map[string]map[chan OrderStatusEvent]struct{}
	paySubscribers    map[string]map[chan PaymentConfirmedEvent]struct{}
	orders            map[string]*trackedOrder
}

func NewEventHub() *EventHub {
	return &EventHub{
		orderSubscribers:  make(map[chan OwnerStreamMessage]string),
		statusSubscribers: make(map[string]map[chan OrderStatusEvent]struct{}),
		paySubscribers:    make(map[string]map[chan PaymentConfirmedEvent]struct{}),
		orders:            make(map[string]*trackedOrder),
	}
}

func (h *EventHub) GetOrder(orderID string) *trackedOrder {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.orders[orderID]
}

// SubscribeOrders suscribe a una tienda para recibir alertas de órdenes nuevas y cancelaciones.
// Si storeWallet es vacío, recibe todas las órdenes; si se especifica, filtra solo las de esa wallet.
func (h *EventHub) SubscribeOrders(storeWallet string) (chan OwnerStreamMessage, func()) {
	ch := make(chan OwnerStreamMessage, 16)
	normalizedWallet := strings.ToUpper(strings.TrimSpace(storeWallet))

	h.mu.Lock()
	h.orderSubscribers[ch] = normalizedWallet
	h.mu.Unlock()

	return ch, func() {
		h.mu.Lock()
		delete(h.orderSubscribers, ch)
		close(ch)
		h.mu.Unlock()
	}
}

func (h *EventHub) PublishOrder(ev OrderAlertEvent) {
	evStoreWallet := strings.ToUpper(strings.TrimSpace(ev.StoreWallet))

	h.mu.Lock()
	h.orders[ev.OrderID] = &trackedOrder{
		event:  ev,
		status: OrderStatusPending,
	}
	msg := OwnerStreamMessage{EventName: "order_created", Payload: ev}
	for ch, filterWallet := range h.orderSubscribers {
		if filterWallet != "" && evStoreWallet != "" && filterWallet != evStoreWallet {
			continue
		}
		select {
		case ch <- msg:
		default:
		}
	}
	h.mu.Unlock()
}

// CancelOrder cancela una orden pendiente o aceptada (si aún no fue pagada) y avisa a la tienda.
func (h *EventHub) CancelOrder(orderID, reason string) (*trackedOrder, bool) {
	h.mu.RLock()
	ord, ok := h.orders[orderID]
	h.mu.RUnlock()
	if !ok {
		return nil, false
	}

	ord.mu.Lock()
	if ord.paid.Load() || ord.status == OrderStatusRejected || ord.status == OrderStatusCancelled {
		ord.mu.Unlock()
		return ord, false
	}
	ord.status = OrderStatusCancelled
	ord.accepted.Store(false)
	ord.reason = strings.TrimSpace(reason)
	if ord.reason == "" {
		ord.reason = "El comprador canceló la solicitud"
	}
	finalReason := ord.reason
	evStoreWallet := strings.ToUpper(strings.TrimSpace(ord.event.StoreWallet))
	ord.mu.Unlock()

	msg := OwnerStreamMessage{
		EventName: "order_cancelled",
		Payload: OrderCancelledEvent{
			OrderID: ord.event.OrderID,
			Reason:  finalReason,
		},
	}

	h.mu.RLock()
	for ch, filterWallet := range h.orderSubscribers {
		if filterWallet != "" && evStoreWallet != "" && filterWallet != evStoreWallet {
			continue
		}
		select {
		case ch <- msg:
		default:
		}
	}
	h.mu.RUnlock()

	return ord, true
}

// SubscribeOrderStatus suscribe al comprador para recibir order_accepted u order_rejected.
// Si la tienda ya decidió antes de que el SSE conectara, devuelve el snapshot inmediato para evitar race conditions.
func (h *EventHub) SubscribeOrderStatus(orderID string) (chan OrderStatusEvent, *OrderStatusEvent, func()) {
	ch := make(chan OrderStatusEvent, 4)

	h.mu.Lock()
	if ord, ok := h.orders[orderID]; ok {
		ord.mu.Lock()
		if ord.status == OrderStatusAccepted || ord.status == OrderStatusRejected {
			snapshot := &OrderStatusEvent{
				OrderID: ord.event.OrderID,
				Status:  ord.status,
				Memo:    ord.event.Memo,
				Reason:  ord.reason,
			}
			ord.mu.Unlock()
			h.mu.Unlock()
			close(ch)
			return ch, snapshot, func() {}
		}
		ord.mu.Unlock()
	}

	if h.statusSubscribers[orderID] == nil {
		h.statusSubscribers[orderID] = make(map[chan OrderStatusEvent]struct{})
	}
	h.statusSubscribers[orderID][ch] = struct{}{}
	h.mu.Unlock()

	return ch, nil, func() {
		h.mu.Lock()
		if subs, ok := h.statusSubscribers[orderID]; ok {
			delete(subs, ch)
			if len(subs) == 0 {
				delete(h.statusSubscribers, orderID)
			}
		}
		close(ch)
		h.mu.Unlock()
	}
}

// TryAcceptOrder marca una orden pendiente como aceptada y notifica al SSE del comprador.
func (h *EventHub) TryAcceptOrder(orderID string) (*trackedOrder, bool) {
	h.mu.RLock()
	ord, ok := h.orders[orderID]
	h.mu.RUnlock()
	if !ok {
		return nil, false
	}

	ord.mu.Lock()
	if ord.status == OrderStatusRejected {
		ord.mu.Unlock()
		return ord, false
	}
	if ord.status == OrderStatusAccepted {
		ord.mu.Unlock()
		return ord, false
	}
	ord.status = OrderStatusAccepted
	ord.accepted.Store(true)
	ord.mu.Unlock()

	h.broadcastOrderStatus(OrderStatusEvent{
		OrderID: ord.event.OrderID,
		Status:  OrderStatusAccepted,
		Memo:    ord.event.Memo,
	})
	return ord, true
}

// RejectOrder marca una orden pendiente como rechazada y notifica al SSE del comprador.
func (h *EventHub) RejectOrder(orderID, reason string) (*trackedOrder, bool) {
	h.mu.RLock()
	ord, ok := h.orders[orderID]
	h.mu.RUnlock()
	if !ok {
		return nil, false
	}

	ord.mu.Lock()
	if ord.status != OrderStatusPending {
		ord.mu.Unlock()
		return ord, false
	}
	ord.status = OrderStatusRejected
	ord.reason = strings.TrimSpace(reason)
	if ord.reason == "" {
		ord.reason = "La tienda rechazó la solicitud de compra"
	}
	finalReason := ord.reason
	ord.mu.Unlock()

	h.broadcastOrderStatus(OrderStatusEvent{
		OrderID: ord.event.OrderID,
		Status:  OrderStatusRejected,
		Reason:  finalReason,
	})
	return ord, true
}

func (h *EventHub) broadcastOrderStatus(ev OrderStatusEvent) {
	h.mu.RLock()
	subs := h.statusSubscribers[ev.OrderID]
	for ch := range subs {
		select {
		case ch <- ev:
		default:
		}
	}
	h.mu.RUnlock()
}

// SubscribePayment suscribe a la tienda para recibir la confirmación de pago (order_paid).
// Si el pago ya se confirmó antes de conectar el SSE, devuelve el snapshot inmediato.
func (h *EventHub) SubscribePayment(orderID string) (chan PaymentConfirmedEvent, *PaymentConfirmedEvent, func()) {
	ch := make(chan PaymentConfirmedEvent, 4)

	h.mu.Lock()
	if ord, ok := h.orders[orderID]; ok {
		ord.mu.Lock()
		if ord.confirmedPayment != nil {
			snapshot := *ord.confirmedPayment
			ord.mu.Unlock()
			h.mu.Unlock()
			close(ch)
			return ch, &snapshot, func() {}
		}
		ord.mu.Unlock()
	}

	if h.paySubscribers[orderID] == nil {
		h.paySubscribers[orderID] = make(map[chan PaymentConfirmedEvent]struct{})
	}
	h.paySubscribers[orderID][ch] = struct{}{}
	h.mu.Unlock()

	return ch, nil, func() {
		h.mu.Lock()
		if subs, ok := h.paySubscribers[orderID]; ok {
			delete(subs, ch)
			if len(subs) == 0 {
				delete(h.paySubscribers, orderID)
			}
		}
		close(ch)
		h.mu.Unlock()
	}
}

func (h *EventHub) PublishPaymentOnce(ord *trackedOrder, ev PaymentConfirmedEvent) bool {
	// Garantía atómica: el evento "Pagado" se emite una única vez por orden
	if !ord.paid.CompareAndSwap(false, true) {
		return false
	}

	ord.mu.Lock()
	copyEv := ev
	ord.confirmedPayment = &copyEv
	ord.mu.Unlock()

	h.mu.RLock()
	subs := h.paySubscribers[ev.OrderID]
	for ch := range subs {
		select {
		case ch <- ev:
		default:
		}
	}
	h.mu.RUnlock()
	return true
}
