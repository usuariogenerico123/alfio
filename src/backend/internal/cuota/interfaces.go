package cuota

import (
	"context"
	"errors"

	"github.com/gin-gonic/gin"
)

var (
	ErrCuotaNotFound  = errors.New("cuota no encontrada")
	ErrDuplicateMemo  = errors.New("ya existe una cuota con ese memo de Stellar")
	ErrInvalidInput   = errors.New("datos de cuota inválidos")
)

type Repository interface {
	Create(ctx context.Context, cuotaModel *Cuota) error
	CreateBatch(ctx context.Context, cuotas []Cuota) error
	GetByID(ctx context.Context, id uint) (*Cuota, error)
	GetByMemo(ctx context.Context, memo string) (*Cuota, error)
	List(ctx context.Context) ([]Cuota, error)
	ListByCreditoID(ctx context.Context, creditoID uint) ([]Cuota, error)
	UpdateEstado(ctx context.Context, id uint, estado string) error
	Delete(ctx context.Context, id uint) error
}

type Service interface {
	Create(ctx context.Context, req CreateCuotaRequest) (*CuotaResponse, error)
	GenerarPlan(ctx context.Context, req GenerarPlanCuotasRequest) ([]CuotaResponse, error)
	GetByID(ctx context.Context, id uint) (*CuotaResponse, error)
	GetByMemo(ctx context.Context, memo string) (*CuotaResponse, error)
	List(ctx context.Context) ([]CuotaResponse, error)
	ListByCreditoID(ctx context.Context, creditoID uint) ([]CuotaResponse, error)
	UpdateEstado(ctx context.Context, id uint, req UpdateEstadoCuotaRequest) (*CuotaResponse, error)
	Delete(ctx context.Context, id uint) error
}

type Controller interface {
	Create(c *gin.Context)
	GenerarPlan(c *gin.Context)
	List(c *gin.Context)
	GetByID(c *gin.Context)
	GetByMemo(c *gin.Context)
	ListByCreditoID(c *gin.Context)
	UpdateEstado(c *gin.Context)
	Delete(c *gin.Context)
}
