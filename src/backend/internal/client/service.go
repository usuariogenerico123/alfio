package client

import (
	"context"
	"fmt"
	"strings"
)

type service struct {
	repo Repository
}

// NewService recibe la interfaz Repository y devuelve la interfaz Service.
func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, req CreateClientRequest) (*ClientResponse, error) {
	nombre := strings.TrimSpace(req.Nombre)
	ci := strings.TrimSpace(req.CI)
	telefono := strings.TrimSpace(req.Telefono)
	wallet := strings.TrimSpace(req.DireccionBilletera)

	if err := validateFields(nombre, ci, telefono, wallet); err != nil {
		return nil, err
	}

	c := &Client{
		Nombre:             nombre,
		CI:                 ci,
		Telefono:           telefono,
		DireccionBilletera: wallet,
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}
	return ToClientResponse(c), nil
}

func (s *service) GetByID(ctx context.Context, id uint) (*ClientResponse, error) {
	c, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToClientResponse(c), nil
}

func (s *service) GetByWallet(ctx context.Context, wallet string) (*ClientResponse, error) {
	trimmed := strings.TrimSpace(wallet)
	if trimmed == "" {
		return nil, fmt.Errorf("%w: direccion_billetera requerida", ErrInvalidInput)
	}
	c, err := s.repo.GetByWallet(ctx, trimmed)
	if err != nil {
		return nil, err
	}
	return ToClientResponse(c), nil
}

func (s *service) List(ctx context.Context) ([]ClientResponse, error) {
	clients, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	return ToClientResponseList(clients), nil
}

func (s *service) Update(ctx context.Context, id uint, req UpdateClientRequest) (*ClientResponse, error) {
	nombre := strings.TrimSpace(req.Nombre)
	ci := strings.TrimSpace(req.CI)
	telefono := strings.TrimSpace(req.Telefono)
	wallet := strings.TrimSpace(req.DireccionBilletera)

	if err := validateFields(nombre, ci, telefono, wallet); err != nil {
		return nil, err
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	existing.Nombre = nombre
	existing.CI = ci
	existing.Telefono = telefono
	existing.DireccionBilletera = wallet

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return ToClientResponse(existing), nil
}

func (s *service) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func validateFields(nombre, ci, telefono, wallet string) error {
	if nombre == "" || ci == "" || telefono == "" || wallet == "" {
		return fmt.Errorf("%w: nombre, ci, telefono y direccion_billetera son obligatorios", ErrInvalidInput)
	}
	return nil
}
