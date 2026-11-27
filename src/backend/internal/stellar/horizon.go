package stellar

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"
)

const DefaultTestnetURL = "https://horizon-testnet.stellar.org"

// HorizonClient es un cliente minimalista para Horizon (Testnet por defecto).
type HorizonClient struct {
	BaseURL string
	HTTP    *http.Client
}

// TransactionDetail contiene los campos clave que devuelve Horizon para una transacción.
type TransactionDetail struct {
	Hash       string `json:"hash"`
	Successful bool   `json:"successful"`
	Memo       string `json:"memo"`
	MemoType   string `json:"memo_type"`
	CreatedAt  string `json:"created_at"`
}

// NewDefaultTestnetClient crea el cliente apuntando a Stellar Horizon Testnet.
func NewDefaultTestnetClient() *HorizonClient {
	return &HorizonClient{
		BaseURL: DefaultTestnetURL,
		HTTP:    &http.Client{Timeout: 15 * time.Second},
	}
}

// GetTransaction consulta una transacción por su hash en Horizon para validar si fue exitosa y su memo.
func (h *HorizonClient) GetTransaction(ctx context.Context, txHash string) (*TransactionDetail, error) {
	url := fmt.Sprintf("%s/transactions/%s", strings.TrimRight(h.BaseURL, "/"), strings.TrimSpace(txHash))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}

	resp, err := h.HTTP.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error consultando Horizon: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("horizon devolvió status %d para tx %s", resp.StatusCode, txHash)
	}

	var detail TransactionDetail
	if err := json.NewDecoder(resp.Body).Decode(&detail); err != nil {
		return nil, fmt.Errorf("error decodificando respuesta de Horizon: %w", err)
	}
	return &detail, nil
}
