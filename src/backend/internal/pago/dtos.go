package pago

import "time"

// CreatePagoRequest es el DTO de entrada para registrar un pago verificado en Stellar.
type CreatePagoRequest struct {
	CuotaID     uint      `json:"cuota_id" binding:"required"`
	Monto       float64   `json:"monto" binding:"required,gt=0"`
	HashStellar string    `json:"hash_stellar" binding:"required"`
	Fecha       time.Time `json:"fecha"`
}

// PagoResponse es el DTO de salida de Pago.
type PagoResponse struct {
	ID          uint      `json:"id"`
	CuotaID     uint      `json:"cuota_id"`
	Monto       float64   `json:"monto"`
	HashStellar string    `json:"hash_stellar"`
	Fecha       time.Time `json:"fecha"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func ToPagoResponse(p *Pago) *PagoResponse {
	if p == nil {
		return nil
	}
	return &PagoResponse{
		ID:          p.ID,
		CuotaID:     p.CuotaID,
		Monto:       p.Monto,
		HashStellar: p.HashStellar,
		Fecha:       p.Fecha,
		CreatedAt:   p.CreatedAt,
		UpdatedAt:   p.UpdatedAt,
	}
}

func ToPagoResponseList(pagos []Pago) []PagoResponse {
	out := make([]PagoResponse, 0, len(pagos))
	for i := range pagos {
		out = append(out, *ToPagoResponse(&pagos[i]))
	}
	return out
}
