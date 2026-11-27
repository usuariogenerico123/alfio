package client

import (
	"context"
	"errors"
	"fmt"

	"gorm.io/gorm"
)

type clientRepository struct {
	Db *gorm.DB
}

// NewRepository recibe la instancia de GORM y devuelve la interfaz Repository.
func NewRepository(db *gorm.DB) Repository {
	return &clientRepository{Db: db}
}

func (r *clientRepository) Create(ctx context.Context, clientModel *Client) error {
	if err := r.Db.WithContext(ctx).Create(clientModel).Error; err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return ErrDuplicateClient
		}
		return fmt.Errorf("error insertando cliente: %w", err)
	}
	return nil
}

func (r *clientRepository) GetByID(ctx context.Context, id uint) (*Client, error) {
	var clientModel Client
	err := r.Db.WithContext(ctx).Where("id = ?", id).First(&clientModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrClientNotFound
		}
		return nil, fmt.Errorf("error consultando cliente por ID: %w", err)
	}
	return &clientModel, nil
}

func (r *clientRepository) GetByWallet(ctx context.Context, wallet string) (*Client, error) {
	var clientModel Client
	err := r.Db.WithContext(ctx).Where("direccion_billetera = ?", wallet).First(&clientModel).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrClientNotFound
		}
		return nil, fmt.Errorf("error consultando cliente por billetera: %w", err)
	}
	return &clientModel, nil
}

func (r *clientRepository) List(ctx context.Context) ([]Client, error) {
	clients := make([]Client, 0)
	if err := r.Db.WithContext(ctx).Order("created_at DESC").Find(&clients).Error; err != nil {
		return nil, fmt.Errorf("error listando clientes: %w", err)
	}
	return clients, nil
}

func (r *clientRepository) Update(ctx context.Context, clientModel *Client) error {
	result := r.Db.WithContext(ctx).Model(&Client{}).
		Where("id = ?", clientModel.ID).
		Updates(clientModel)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrDuplicatedKey) {
			return ErrDuplicateClient
		}
		return fmt.Errorf("error actualizando cliente: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrClientNotFound
	}
	return nil
}

func (r *clientRepository) Delete(ctx context.Context, id uint) error {
	result := r.Db.WithContext(ctx).Where("id = ?", id).Delete(&Client{})
	if result.Error != nil {
		return fmt.Errorf("error eliminando cliente: %w", result.Error)
	}
	if result.RowsAffected == 0 {
		return ErrClientNotFound
	}
	return nil
}
