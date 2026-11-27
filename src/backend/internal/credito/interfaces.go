package credito

import (
	"context"
	"errors"

	"github.com/gin-gonic/gin"
)

var (
	ErrCreditoNotFound = errors.New("crédito no encontrado")
	ErrInvalidInput    = errors.New("datos de crédito inválidos")
)

type Repository interface {
	Create(ctx context.Context, creditoModel *Credito) error
	GetByID(ctx context.Context, id uint) (*Credito, error)
	List(ctx context.Context) ([]Credito, error)
	ListByClienteID(ctx context.Context, clienteID uint) ([]Credito, error)
	UpdateEstado(ctx context.Context, id uint, estado string) error
	Delete(ctx context.Context, id uint) error
}

type Service interface {
	Create(ctx context.Context, req CreateCreditoRequest) (*CreditoResponse, error)
	GetByID(ctx context.Context, id uint) (*CreditoResponse, error)
	List(ctx context.Context) ([]CreditoResponse, error)
	ListByClienteID(ctx context.Context, clienteID uint) ([]CreditoResponse, error)
	UpdateEstado(ctx context.Context, id uint, req UpdateEstadoCreditoRequest) (*CreditoResponse, error)
	Delete(ctx context.Context, id uint) error
}

type Controller interface {
	Create(c *gin.Context)
	List(c *gin.Context)
	GetByID(c *gin.Context)
	ListByClienteID(c *gin.Context)
	UpdateEstado(c *gin.Context)
	Delete(c *gin.Context)
}
