package cuota

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type cuotaRepository struct {
	Db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &cuotaRepository{Db: db}
}

func (r *cuotaRepository) Create(ctx context.Context, cuotaModel *Cuota) error {
	if err := r.Db.WithContext(ctx).Create(cuotaModel).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return ErrDuplicateMemo
		}
		return fmt.Errorf("error insertando cuota: %w", err)
	}
	return nil
}

func (r *cuotaRepository) CreateBatch(ctx context.Context, cuotas []Cuota) error {
	if err := r.Db.WithContext(ctx).Create(&cuotas).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return ErrDuplicateMemo
		}
		return fmt.Errorf("error insertando plan de cuotas: %w", err)
	}
	return nil
}

func (r *cuotaRepository) GetByID(ctx context.Context, id uint) (*Cuota, error) {
	var cuotaModel Cuota
	err := r.Db.WithContext(ctx).Where("id = ?", id).First(&cuotaModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCuotaNotFound
		}
		return nil, fmt.Errorf("error consultando cuota por ID: %w", err)
	}
	return &cuotaModel, nil
}

func (r *cuotaRepository) GetByMemo(ctx context.Context, memo string) (*Cuota, error) {
	var cuotaModel Cuota
	err := r.Db.WithContext(ctx).Where("memo = ?", memo).First(&cuotaModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCuotaNotFound
		}
		return nil, fmt.Errorf("error consultando cuota por memo: %w", err)
	}
	return &cuotaModel, nil
}

func (r *cuotaRepository) List(ctx context.Context) ([]Cuota, error) {
	cuotas := make([]Cuota, 0)
	if err := r.Db.WithContext(ctx).Order("vencimiento ASC").Find(&cuotas).Error; err != nil {
		return nil, fmt.Errorf("error listando cuotas: %w", err)
	}
	return cuotas, nil
}

func (r *cuotaRepository) ListByCreditoID(ctx context.Context, creditoID uint) ([]Cuota, error) {
	cuotas := make([]Cuota, 0)
	if err := r.Db.WithContext(ctx).
		Where("credito_id = ?", creditoID).
		Order("numero ASC").
		Find(&cuotas).Error; err != nil {
		return nil, fmt.Errorf("error listando cuotas por crédito: %w", err)
	}
	return cuotas, nil
}

func (r *cuotaRepository) UpdateEstado(ctx context.Context, id uint, estado string) error {
	result := r.Db.WithContext(ctx).Model(&Cuota{}).
		Where("id = ?", id).
		Update("estado", estado)

	if result.Error != nil {
		return fmt.Errorf("error actualizando estado de la cuota: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrCuotaNotFound
	}
	return nil
}

func (r *cuotaRepository) Delete(ctx context.Context, id uint) error {
	result := r.Db.WithContext(ctx).Where("id = ?", id).Delete(&Cuota{})
	if result.Error != nil {
		return fmt.Errorf("error eliminando cuota: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrCuotaNotFound
	}
	return nil
}
