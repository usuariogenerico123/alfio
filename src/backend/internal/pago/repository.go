package pago

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type pagoRepository struct {
	Db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &pagoRepository{Db: db}
}

func (r *pagoRepository) Create(ctx context.Context, pagoModel *Pago) error {
	if err := r.Db.WithContext(ctx).Create(pagoModel).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return ErrDuplicateHash
		}
		return fmt.Errorf("error insertando pago: %w", err)
	}
	return nil
}

func (r *pagoRepository) GetByID(ctx context.Context, id uint) (*Pago, error) {
	var pagoModel Pago
	err := r.Db.WithContext(ctx).Where("id = ?", id).First(&pagoModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPagoNotFound
		}
		return nil, fmt.Errorf("error consultando pago por ID: %w", err)
	}
	return &pagoModel, nil
}

func (r *pagoRepository) GetByHash(ctx context.Context, hash string) (*Pago, error) {
	var pagoModel Pago
	err := r.Db.WithContext(ctx).Where("hash_stellar = ?", hash).First(&pagoModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrPagoNotFound
		}
		return nil, fmt.Errorf("error consultando pago por hash Stellar: %w", err)
	}
	return &pagoModel, nil
}

func (r *pagoRepository) List(ctx context.Context) ([]Pago, error) {
	pagos := make([]Pago, 0)
	if err := r.Db.WithContext(ctx).Order("fecha DESC").Find(&pagos).Error; err != nil {
		return nil, fmt.Errorf("error listando pagos: %w", err)
	}
	return pagos, nil
}

func (r *pagoRepository) ListByCuotaID(ctx context.Context, cuotaID uint) ([]Pago, error) {
	pagos := make([]Pago, 0)
	if err := r.Db.WithContext(ctx).
		Where("cuota_id = ?", cuotaID).
		Order("fecha DESC").
		Find(&pagos).Error; err != nil {
		return nil, fmt.Errorf("error listando pagos por cuota: %w", err)
	}
	return pagos, nil
}

func (r *pagoRepository) Delete(ctx context.Context, id uint) error {
	result := r.Db.WithContext(ctx).Where("id = ?", id).Delete(&Pago{})
	if result.Error != nil {
		return fmt.Errorf("error eliminando pago: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrPagoNotFound
	}
	return nil
}
