package client

import (
	"context"
	"errors"

	"github.com/gin-gonic/gin"
)

var (
	ErrClientNotFound  = errors.New("cliente no encontrado")
	ErrDuplicateClient = errors.New("ya existe un cliente con ese CI o dirección de billetera")
	ErrInvalidInput    = errors.New("datos de cliente inválidos")
)

// Repository define el contrato de persistencia para Client.
type Repository interface {
	Create(ctx context.Context, c *Client) error
	GetByID(ctx context.Context, id uint) (*Client, error)
	GetByWallet(ctx context.Context, wallet string) (*Client, error)
	List(ctx context.Context) ([]Client, error)
	Update(ctx context.Context, c *Client) error
	Delete(ctx context.Context, id uint) error
}

// Service define el contrato de lógica de negocio para Client.
type Service interface {
	Create(ctx context.Context, req CreateClientRequest) (*ClientResponse, error)
	GetByID(ctx context.Context, id uint) (*ClientResponse, error)
	GetByWallet(ctx context.Context, wallet string) (*ClientResponse, error)
	List(ctx context.Context) ([]ClientResponse, error)
	Update(ctx context.Context, id uint, req UpdateClientRequest) (*ClientResponse, error)
	Delete(ctx context.Context, id uint) error
}

// Controller define el contrato HTTP para el feature Client.
type Controller interface {
	Create(c *gin.Context)
	List(c *gin.Context)
	GetByID(c *gin.Context)
	GetByWallet(c *gin.Context)
	Update(c *gin.Context)
	Delete(c *gin.Context)
}
