package client

import "time"

// CreateClientRequest es el DTO de entrada para crear un cliente.
type CreateClientRequest struct {
	Nombre             string `json:"nombre" binding:"required"`
	CI                 string `json:"ci" binding:"required"`
	Telefono           string `json:"telefono" binding:"required"`
	DireccionBilletera string `json:"direccion_billetera" binding:"required"`
}

// UpdateClientRequest es el DTO de entrada para actualizar un cliente.
type UpdateClientRequest struct {
	Nombre             string `json:"nombre" binding:"required"`
	CI                 string `json:"ci" binding:"required"`
	Telefono           string `json:"telefono" binding:"required"`
	DireccionBilletera string `json:"direccion_billetera" binding:"required"`
}

// ClientResponse es el DTO de salida expuesto por la API (sin campos internos de GORM como DeletedAt).
type ClientResponse struct {
	ID                 uint      `json:"id"`
	Nombre             string    `json:"nombre"`
	CI                 string    `json:"ci"`
	Telefono           string    `json:"telefono"`
	DireccionBilletera string    `json:"direccion_billetera"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// ToClientResponse convierte la entidad Client a su DTO de salida.
func ToClientResponse(c *Client) *ClientResponse {
	if c == nil {
		return nil
	}
	return &ClientResponse{
		ID:                 c.ID,
		Nombre:             c.Nombre,
		CI:                 c.CI,
		Telefono:           c.Telefono,
		DireccionBilletera: c.DireccionBilletera,
		CreatedAt:          c.CreatedAt,
		UpdatedAt:          c.UpdatedAt,
	}
}

// ToClientResponseList convierte una lista de entidades Client a DTOs de salida.
func ToClientResponseList(clients []Client) []ClientResponse {
	responses := make([]ClientResponse, 0, len(clients))
	for i := range clients {
		responses = append(responses, *ToClientResponse(&clients[i]))
	}
	return responses
}
