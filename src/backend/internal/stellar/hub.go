package stellar

import (
	"sync"
	"sync/atomic"
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

// trackedOrder protege con atomic.Bool que una orden se acepte/pague una sola vez.
type trackedOrder struct {
	event    OrderAlertEvent
	accepted atomic.Bool
	paid     atomic.Bool
}

// EventHub coordina de forma concurrente y segura los streams SSE de órdenes y pagos.
type EventHub struct {
	mu               sync.RWMutex
	orderSubscribers map[chan OrderAlertEvent]struct{}
	paySubscribers   map[string]map[chan PaymentConfirmedEvent]struct{}
	orders           map[string]*trackedOrder
}

func NewEventHub() *EventHub {
	return &EventHub{
		orderSubscribers: make(map[chan OrderAlertEvent]struct{}),
		paySubscribers:   make(map[string]map[chan PaymentConfirmedEvent]struct{}),
		orders:           make(map[string]*trackedOrder),
	}
}

func (h *EventHub) SubscribeOrders() (chan OrderAlertEvent, func()) {
	ch := make(chan OrderAlertEvent, 16)
	h.mu.Lock()
	h.orderSubscribers[ch] = struct{}{}
	h.mu.Unlock()

	return ch, func() {
		h.mu.Lock()
		delete(h.orderSubscribers, ch)
		close(ch)
		h.mu.Unlock()
	}
}

func (h *EventHub) PublishOrder(ev OrderAlertEvent) {
	h.mu.Lock()
	h.orders[ev.OrderID] = &trackedOrder{event: ev}
	for ch := range h.orderSubscribers {
		select {
		case ch <- ev:
		default:
		}
	}
	h.mu.Unlock()
}

func (h *EventHub) TryAcceptOrder(orderID string) (*trackedOrder, bool) {
	h.mu.RLock()
	ord, ok := h.orders[orderID]
	h.mu.RUnlock()
	if !ok {
		return nil, false
	}
	// Swap atómico: solo una goroutine puede aceptar e iniciar la escucha de Horizon
	if !ord.accepted.CompareAndSwap(false, true) {
		return ord, false
	}
	return ord, true
}

func (h *EventHub) SubscribePayment(orderID string) (chan PaymentConfirmedEvent, func()) {
	ch := make(chan PaymentConfirmedEvent, 4)
	h.mu.Lock()
	if h.paySubscribers[orderID] == nil {
		h.paySubscribers[orderID] = make(map[chan PaymentConfirmedEvent]struct{})
	}
	h.paySubscribers[orderID][ch] = struct{}{}
	h.mu.Unlock()

	return ch, func() {
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
