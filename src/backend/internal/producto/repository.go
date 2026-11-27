package producto

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type productoRepository struct {
	Db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &productoRepository{Db: db}
}

func (r *productoRepository) Create(ctx context.Context, productoModel *Producto) error {
	if err := r.Db.WithContext(ctx).Create(productoModel).Error; err != nil {
		return fmt.Errorf("error insertando producto: %w", err)
	}
	return nil
}

func (r *productoRepository) GetByID(ctx context.Context, id uint) (*Producto, error) {
	var productoModel Producto
	err := r.Db.WithContext(ctx).Preload("Tienda").Where("id = ?", id).First(&productoModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProductoNotFound
		}
		return nil, fmt.Errorf("error consultando producto por ID: %w", err)
	}
	return &productoModel, nil
}

func (r *productoRepository) GetByCodigo(ctx context.Context, codigo string) (*Producto, error) {
	var productoModel Producto
	err := r.Db.WithContext(ctx).Preload("Tienda").Where("codigo_producto = ?", codigo).First(&productoModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProductoNotFound
		}
		return nil, fmt.Errorf("error consultando producto por código: %w", err)
	}
	return &productoModel, nil
}

func (r *productoRepository) List(ctx context.Context) ([]Producto, error) {
	productos := make([]Producto, 0)
	if err := r.Db.WithContext(ctx).Preload("Tienda").Order("created_at DESC").Find(&productos).Error; err != nil {
		return nil, fmt.Errorf("error listando productos: %w", err)
	}
	return productos, nil
}

func (r *productoRepository) ListByTiendaID(ctx context.Context, tiendaID uint) ([]Producto, error) {
	productos := make([]Producto, 0)
	if err := r.Db.WithContext(ctx).
		Preload("Tienda").
		Where("tienda_id = ?", tiendaID).
		Order("created_at DESC").
		Find(&productos).Error; err != nil {
		return nil, fmt.Errorf("error listando productos por tienda: %w", err)
	}
	return productos, nil
}

func (r *productoRepository) Update(ctx context.Context, productoModel *Producto) error {
	result := r.Db.WithContext(ctx).Model(&Producto{}).
		Where("id = ?", productoModel.ID).
		Updates(productoModel)

	if result.Error != nil {
		return fmt.Errorf("error actualizando producto: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrProductoNotFound
	}
	return nil
}

func (r *productoRepository) Delete(ctx context.Context, id uint) error {
	result := r.Db.WithContext(ctx).Where("id = ?", id).Delete(&Producto{})
	if result.Error != nil {
		return fmt.Errorf("error eliminando producto: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrProductoNotFound
	}
	return nil
}
