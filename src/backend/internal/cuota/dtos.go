package cuota

import "time"

// CreateCuotaRequest es el DTO de entrada para crear una cuota individual.
type CreateCuotaRequest struct {
	CreditoID   uint      `json:"credito_id" binding:"required"`
	Numero      int       `json:"numero" binding:"required,gt=0"`
	Monto       float64   `json:"monto" binding:"required,gt=0"`
	Vencimiento time.Time `json:"vencimiento" binding:"required"`
	Estado      string    `json:"estado"`
	Memo        string    `json:"memo"`
}

// GenerarPlanCuotasRequest genera automáticamente las 4 cuotas cada 15 días para un crédito.
type GenerarPlanCuotasRequest struct {
	CreditoID       uint    `json:"credito_id" binding:"required"`
	SaldoRestante   float64 `json:"saldo_restante" binding:"required,gt=0"`
	CantidadCuotas  int     `json:"cantidad_cuotas"`
	IntervaloDias   int     `json:"intervalo_dias"`
}

// UpdateEstadoCuotaRequest es el DTO de entrada para cambiar el estado de una cuota.
type UpdateEstadoCuotaRequest struct {
	Estado string `json:"estado" binding:"required"`
}

// CuotaResponse es el DTO de salida de Cuota.
type CuotaResponse struct {
	ID          uint      `json:"id"`
	CreditoID   uint      `json:"credito_id"`
	Numero      int       `json:"numero"`
	Monto       float64   `json:"monto"`
	Vencimiento time.Time `json:"vencimiento"`
	Estado      string    `json:"estado"`
	Memo        string    `json:"memo"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func ToCuotaResponse(c *Cuota) *CuotaResponse {
	if c == nil {
		return nil
	}
	return &CuotaResponse{
		ID:          c.ID,
		CreditoID:   c.CreditoID,
		Numero:      c.Numero,
		Monto:       c.Monto,
		Vencimiento: c.Vencimiento,
		Estado:      c.Estado,
		Memo:        c.Memo,
		CreatedAt:   c.CreatedAt,
		UpdatedAt:   c.UpdatedAt,
	}
}

func ToCuotaResponseList(cuotas []Cuota) []CuotaResponse {
	out := make([]CuotaResponse, 0, len(cuotas))
	for i := range cuotas {
		out = append(out, *ToCuotaResponse(&cuotas[i]))
	}
	return out
}
