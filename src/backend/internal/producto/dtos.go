package producto

import "time"

// CreateProductoRequest es el DTO de entrada para crear un producto.
type CreateProductoRequest struct {
	TiendaID         uint    `json:"tienda_id" binding:"required"`
	Nombre           string  `json:"nombre" binding:"required"`
	Especificaciones string  `json:"especificaciones" binding:"required"`
	PrecioUSD        float64 `json:"precio_usd" binding:"required,gt=0"`
	Stock            int     `json:"stock" binding:"gte=0"`
	FotoURL          string  `json:"foto_url"`
}

// UpdateProductoRequest es el DTO de entrada para actualizar un producto.
type UpdateProductoRequest struct {
	Nombre           string  `json:"nombre" binding:"required"`
	Especificaciones string  `json:"especificaciones" binding:"required"`
	PrecioUSD        float64 `json:"precio_usd" binding:"required,gt=0"`
	Stock            int     `json:"stock" binding:"gte=0"`
	FotoURL          string  `json:"foto_url"`
}

// ProductoResponse es el DTO de salida de Producto, incluyendo su código único para el QR.
type ProductoResponse struct {
	ID               uint      `json:"id"`
	CodigoProducto   string    `json:"codigo_producto"`
	TiendaID         uint      `json:"tienda_id"`
	TiendaNombre     string    `json:"tienda_nombre,omitempty"`
	Nombre           string    `json:"nombre"`
	Especificaciones string    `json:"especificaciones"`
	PrecioUSD        float64   `json:"precio_usd"`
	Stock            int       `json:"stock"`
	FotoURL          string    `json:"foto_url,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

func ToProductoResponse(p *Producto) *ProductoResponse {
	if p == nil {
		return nil
	}
	return &ProductoResponse{
		ID:               p.ID,
		CodigoProducto:   p.CodigoProducto,
		TiendaID:         p.TiendaID,
		TiendaNombre:     p.Tienda.Nombre,
		Nombre:           p.Nombre,
		Especificaciones: p.Especificaciones,
		PrecioUSD:        p.PrecioUSD,
		Stock:            p.Stock,
		FotoURL:          p.FotoURL,
		CreatedAt:        p.CreatedAt,
		UpdatedAt:        p.UpdatedAt,
	}
}

func ToProductoResponseList(productos []Producto) []ProductoResponse {
	out := make([]ProductoResponse, 0, len(productos))
	for i := range productos {
		out = append(out, *ToProductoResponse(&productos[i]))
	}
	return out
}
