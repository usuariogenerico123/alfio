package tienda

import (
	"context"
	"errors"

	"github.com/gin-gonic/gin"
)

var (
	ErrTiendaNotFound  = errors.New("tienda no encontrada")
	ErrDuplicateTienda = errors.New("ya existe una tienda con ese email o billetera")
	ErrInvalidInput    = errors.New("datos de tienda inválidos")
)

type Repository interface {
	Create(ctx context.Context, tiendaModel *Tienda) error
	GetByID(ctx context.Context, id uint) (*Tienda, error)
	GetByWallet(ctx context.Context, wallet string) (*Tienda, error)
	List(ctx context.Context) ([]Tienda, error)
	Update(ctx context.Context, tiendaModel *Tienda) error
	Delete(ctx context.Context, id uint) error
}

type Service interface {
	Create(ctx context.Context, req CreateTiendaRequest) (*TiendaResponse, error)
	GetByID(ctx context.Context, id uint) (*TiendaResponse, error)
	GetByWallet(ctx context.Context, wallet string) (*TiendaResponse, error)
	List(ctx context.Context) ([]TiendaResponse, error)
	Update(ctx context.Context, id uint, req UpdateTiendaRequest) (*TiendaResponse, error)
	Delete(ctx context.Context, id uint) error
}

type Controller interface {
	Create(c *gin.Context)
	List(c *gin.Context)
	GetByID(c *gin.Context)
	GetByWallet(c *gin.Context)
	Update(c *gin.Context)
	Delete(c *gin.Context)
}
