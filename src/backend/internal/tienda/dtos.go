package tienda

import "time"

// CreateTiendaRequest es el DTO de entrada para registrar una tienda.
type CreateTiendaRequest struct {
	Nombre     string `json:"nombre" binding:"required"`
	Dueno      string `json:"dueno" binding:"required"`
	EmailPanel string `json:"email_panel" binding:"required,email"`
	BilleteraG string `json:"billetera_g" binding:"required"`
}

// UpdateTiendaRequest es el DTO de entrada para actualizar una tienda.
type UpdateTiendaRequest struct {
	Nombre     string `json:"nombre" binding:"required"`
	Dueno      string `json:"dueno" binding:"required"`
	EmailPanel string `json:"email_panel" binding:"required,email"`
	BilleteraG string `json:"billetera_g" binding:"required"`
}

// TiendaResponse es el DTO de salida de Tienda.
type TiendaResponse struct {
	ID         uint      `json:"id"`
	Nombre     string    `json:"nombre"`
	Dueno      string    `json:"dueno"`
	EmailPanel string    `json:"email_panel"`
	BilleteraG string    `json:"billetera_g"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func ToTiendaResponse(t *Tienda) *TiendaResponse {
	if t == nil {
		return nil
	}
	return &TiendaResponse{
		ID:         t.ID,
		Nombre:     t.Nombre,
		Dueno:      t.Dueno,
		EmailPanel: t.EmailPanel,
		BilleteraG: t.BilleteraG,
		CreatedAt:  t.CreatedAt,
		UpdatedAt:  t.UpdatedAt,
	}
}

func ToTiendaResponseList(tiendas []Tienda) []TiendaResponse {
	out := make([]TiendaResponse, 0, len(tiendas))
	for i := range tiendas {
		out = append(out, *ToTiendaResponse(&tiendas[i]))
	}
	return out
}
