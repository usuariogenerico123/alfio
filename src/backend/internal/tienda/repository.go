package tienda

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type tiendaRepository struct {
	Db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &tiendaRepository{Db: db}
}

func (r *tiendaRepository) Create(ctx context.Context, tiendaModel *Tienda) error {
	if err := r.Db.WithContext(ctx).Create(tiendaModel).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return ErrDuplicateTienda
		}
		return fmt.Errorf("error insertando tienda: %w", err)
	}
	return nil
}

func (r *tiendaRepository) GetByID(ctx context.Context, id uint) (*Tienda, error) {
	var tiendaModel Tienda
	err := r.Db.WithContext(ctx).Where("id = ?", id).First(&tiendaModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTiendaNotFound
		}
		return nil, fmt.Errorf("error consultando tienda por ID: %w", err)
	}
	return &tiendaModel, nil
}

func (r *tiendaRepository) GetByWallet(ctx context.Context, wallet string) (*Tienda, error) {
	var tiendaModel Tienda
	err := r.Db.WithContext(ctx).Where("billetera_g = ?", wallet).First(&tiendaModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTiendaNotFound
		}
		return nil, fmt.Errorf("error consultando tienda por billetera: %w", err)
	}
	return &tiendaModel, nil
}

func (r *tiendaRepository) List(ctx context.Context) ([]Tienda, error) {
	tiendas := make([]Tienda, 0)
	if err := r.Db.WithContext(ctx).Order("created_at DESC").Find(&tiendas).Error; err != nil {
		return nil, fmt.Errorf("error listando tiendas: %w", err)
	}
	return tiendas, nil
}

func (r *tiendaRepository) Update(ctx context.Context, tiendaModel *Tienda) error {
	result := r.Db.WithContext(ctx).Model(&Tienda{}).
		Where("id = ?", tiendaModel.ID).
		Updates(tiendaModel)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return ErrDuplicateTienda
		}
		return fmt.Errorf("error actualizando tienda: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrTiendaNotFound
	}
	return nil
}

func (r *tiendaRepository) Delete(ctx context.Context, id uint) error {
	result := r.Db.WithContext(ctx).Where("id = ?", id).Delete(&Tienda{})
	if result.Error != nil {
		return fmt.Errorf("error eliminando tienda: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrTiendaNotFound
	}
	return nil
}
