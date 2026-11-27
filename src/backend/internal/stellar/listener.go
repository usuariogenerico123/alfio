package stellar

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// PaymentEvent representa una operación de pago recibida desde el stream SSE de Horizon.
type PaymentEvent struct {
	ID              string `json:"id"`
	TransactionHash string `json:"transaction_hash"`
	Type            string `json:"type"`
	From            string `json:"from"`
	To              string `json:"to"`
	Amount          string `json:"amount"`
	AssetType       string `json:"asset_type"`
	AssetCode       string `json:"asset_code"`
	AssetIssuer     string `json:"asset_issuer"`
	CreatedAt       string `json:"created_at"`
}

// Acá es donde el backend se engancha al stream SSE de Horizon Testnet
// para escuchar en vivo cualquier pago que le entre a la wallet G... de la tienda.
func (h *HorizonClient) ListenPayments(
	ctx context.Context,
	accountID string,
	onPayment func(PaymentEvent),
) error {
	// Acá armamos la URL de Horizon con cursor=now para ignorar pagos viejos y escuchar solo los nuevos
	url := fmt.Sprintf(
		"%s/accounts/%s/payments?cursor=now",
		strings.TrimRight(h.BaseURL, "/"),
		strings.TrimSpace(accountID),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	// Acá le decimos a Horizon que queremos mantener la conexión abierta en modo SSE
	req.Header.Set("Accept", "text/event-stream")

	// Sin timeout global porque el stream SSE queda abierto escuchando pagos
	streamClient := &http.Client{}
	resp, err := streamClient.Do(req)
	if err != nil {
		return fmt.Errorf("error abriendo stream de Horizon: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("horizon stream devolvió status %d", resp.StatusCode)
	}

	scanner := bufio.NewScanner(resp.Body)
	// Buffer ampliado por si Horizon envía payloads JSON grandes
	scanner.Buffer(make([]byte, 64*1024), 1024*1024)

	// Acá nos quedamos leyendo línea por línea cada alerta de pago que tira Horizon
	for scanner.Scan() {
		line := scanner.Text()
		if !strings.HasPrefix(line, "data:") {
			continue
		}

		payload := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if payload == "" || payload == `"hello"` || payload == `"byebye"` {
			continue
		}

		var ev PaymentEvent
		if err := json.Unmarshal([]byte(payload), &ev); err != nil {
			continue
		}

		// Acá filtramos que sea un pago entrante hacia la wallet de la tienda y disparamos el callback
		if ev.Type == "payment" && ev.To == accountID {
			onPayment(ev)
		}
	}

	if err := scanner.Err(); err != nil && ctx.Err() == nil {
		return fmt.Errorf("error leyendo stream de Horizon: %w", err)
	}
	return nil
}
