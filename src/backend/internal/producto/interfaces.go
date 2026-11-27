package producto

import (
	"context"
	"errors"

	"github.com/gin-gonic/gin"
)

var (
	ErrProductoNotFound = errors.New("producto no encontrado")
	ErrInvalidInput     = errors.New("datos de producto inválidos")
)

type Repository interface {
	Create(ctx context.Context, productoModel *Producto) error
	GetByID(ctx context.Context, id uint) (*Producto, error)
	GetByCodigo(ctx context.Context, codigo string) (*Producto, error)
	List(ctx context.Context) ([]Producto, error)
	ListByTiendaID(ctx context.Context, tiendaID uint) ([]Producto, error)
	Update(ctx context.Context, productoModel *Producto) error
	Delete(ctx context.Context, id uint) error
}

type Service interface {
	Create(ctx context.Context, req CreateProductoRequest) (*ProductoResponse, error)
	GetByID(ctx context.Context, id uint) (*ProductoResponse, error)
	GetByCodigo(ctx context.Context, codigo string) (*ProductoResponse, error)
	List(ctx context.Context) ([]ProductoResponse, error)
	ListByTiendaID(ctx context.Context, tiendaID uint) ([]ProductoResponse, error)
	Update(ctx context.Context, id uint, req UpdateProductoRequest) (*ProductoResponse, error)
	Delete(ctx context.Context, id uint) error
}

type Controller interface {
	Create(c *gin.Context)
	List(c *gin.Context)
	GetByID(c *gin.Context)
	GetByCodigo(c *gin.Context)
	ListByTiendaID(c *gin.Context)
	Update(c *gin.Context)
	Delete(c *gin.Context)
}
