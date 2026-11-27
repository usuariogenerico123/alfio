package credito

import "time"

// CreateCreditoRequest es el DTO de entrada para crear un crédito.
// Si inicial es 0, el servicio calcula automáticamente el 50% del total.
type CreateCreditoRequest struct {
	ClienteID  uint    `json:"cliente_id" binding:"required"`
	ProductoID uint    `json:"producto_id" binding:"required"`
	Total      float64 `json:"total" binding:"required,gt=0"`
	Inicial    float64 `json:"inicial" binding:"gte=0"`
	Estado     string  `json:"estado"`
}

// UpdateEstadoCreditoRequest es el DTO de entrada para actualizar el estado de un crédito.
type UpdateEstadoCreditoRequest struct {
	Estado string `json:"estado" binding:"required"`
}

// CreditoResponse es el DTO de salida de Credito.
type CreditoResponse struct {
	ID             uint      `json:"id"`
	ClienteID      uint      `json:"cliente_id"`
	ClienteNombre  string    `json:"cliente_nombre,omitempty"`
	ProductoID     uint      `json:"producto_id"`
	ProductoNombre string    `json:"producto_nombre,omitempty"`
	Total          float64   `json:"total"`
	Inicial        float64   `json:"inicial"`
	Fecha          time.Time `json:"fecha"`
	Estado         string    `json:"estado"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

func ToCreditoResponse(c *Credito) *CreditoResponse {
	if c == nil {
		return nil
	}
	return &CreditoResponse{
		ID:             c.ID,
		ClienteID:      c.ClienteID,
		ClienteNombre:  c.Cliente.Nombre,
		ProductoID:     c.ProductoID,
		ProductoNombre: c.Producto.Nombre,
		Total:          c.Total,
		Inicial:        c.Inicial,
		Fecha:          c.Fecha,
		Estado:         c.Estado,
		CreatedAt:      c.CreatedAt,
		UpdatedAt:      c.UpdatedAt,
	}
}

func ToCreditoResponseList(creditos []Credito) []CreditoResponse {
	out := make([]CreditoResponse, 0, len(creditos))
	for i := range creditos {
		out = append(out, *ToCreditoResponse(&creditos[i]))
	}
	return out
}
