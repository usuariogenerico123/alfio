package credito

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type creditoRepository struct {
	Db *gorm.DB
}

func NewRepository(db *gorm.DB) Repository {
	return &creditoRepository{Db: db}
}

func (r *creditoRepository) Create(ctx context.Context, creditoModel *Credito) error {
	if err := r.Db.WithContext(ctx).Create(creditoModel).Error; err != nil {
		return fmt.Errorf("error insertando crédito: %w", err)
	}
	return nil
}

func (r *creditoRepository) GetByID(ctx context.Context, id uint) (*Credito, error) {
	var creditoModel Credito
	err := r.Db.WithContext(ctx).
		Preload("Cliente").
		Preload("Producto").
		Where("id = ?", id).
		First(&creditoModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCreditoNotFound
		}
		return nil, fmt.Errorf("error consultando crédito por ID: %w", err)
	}
	return &creditoModel, nil
}

func (r *creditoRepository) List(ctx context.Context) ([]Credito, error) {
	creditos := make([]Credito, 0)
	if err := r.Db.WithContext(ctx).
		Preload("Cliente").
		Preload("Producto").
		Order("fecha DESC").
		Find(&creditos).Error; err != nil {
		return nil, fmt.Errorf("error listando créditos: %w", err)
	}
	return creditos, nil
}

func (r *creditoRepository) ListByClienteID(ctx context.Context, clienteID uint) ([]Credito, error) {
	creditos := make([]Credito, 0)
	if err := r.Db.WithContext(ctx).
		Preload("Cliente").
		Preload("Producto").
		Where("cliente_id = ?", clienteID).
		Order("fecha DESC").
		Find(&creditos).Error; err != nil {
		return nil, fmt.Errorf("error listando créditos por cliente: %w", err)
	}
	return creditos, nil
}

func (r *creditoRepository) UpdateEstado(ctx context.Context, id uint, estado string) error {
	result := r.Db.WithContext(ctx).Model(&Credito{}).
		Where("id = ?", id).
		Update("estado", estado)

	if result.Error != nil {
		return fmt.Errorf("error actualizando estado del crédito: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrCreditoNotFound
	}
	return nil
}

func (r *creditoRepository) Delete(ctx context.Context, id uint) error {
	result := r.Db.WithContext(ctx).Where("id = ?", id).Delete(&Credito{})
	if result.Error != nil {
		return fmt.Errorf("error eliminando crédito: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrCreditoNotFound
	}
	return nil
}
