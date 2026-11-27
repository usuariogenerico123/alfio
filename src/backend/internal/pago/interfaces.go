package pago

import (
	"context"
	"errors"

	"github.com/gin-gonic/gin"
)

var (
	ErrPagoNotFound  = errors.New("pago no encontrado")
	ErrDuplicateHash = errors.New("ese hash de transacción Stellar ya fue registrado")
	ErrInvalidInput  = errors.New("datos de pago inválidos")
)

type Repository interface {
	Create(ctx context.Context, pagoModel *Pago) error
	GetByID(ctx context.Context, id uint) (*Pago, error)
	GetByHash(ctx context.Context, hash string) (*Pago, error)
	List(ctx context.Context) ([]Pago, error)
	ListByCuotaID(ctx context.Context, cuotaID uint) ([]Pago, error)
	Delete(ctx context.Context, id uint) error
}

type Service interface {
	Create(ctx context.Context, req CreatePagoRequest) (*PagoResponse, error)
	GetByID(ctx context.Context, id uint) (*PagoResponse, error)
	GetByHash(ctx context.Context, hash string) (*PagoResponse, error)
	List(ctx context.Context) ([]PagoResponse, error)
	ListByCuotaID(ctx context.Context, cuotaID uint) ([]PagoResponse, error)
	Delete(ctx context.Context, id uint) error
}

type Controller interface {
	Create(c *gin.Context)
	List(c *gin.Context)
	GetByID(c *gin.Context)
	GetByHash(c *gin.Context)
	ListByCuotaID(c *gin.Context)
	Delete(c *gin.Context)
}
