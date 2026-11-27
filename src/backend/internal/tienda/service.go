package tienda

import (
	"context"
	"fmt"
	"strings"
)

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, req CreateTiendaRequest) (*TiendaResponse, error) {
	nombre := strings.TrimSpace(req.Nombre)
	dueno := strings.TrimSpace(req.Dueno)
	email := strings.ToLower(strings.TrimSpace(req.EmailPanel))
	wallet := strings.TrimSpace(req.BilleteraG)

	if err := validateFields(nombre, dueno, email, wallet); err != nil {
		return nil, err
	}

	t := &Tienda{
		Nombre:     nombre,
		Dueno:      dueno,
		EmailPanel: email,
		BilleteraG: wallet,
	}

	if err := s.repo.Create(ctx, t); err != nil {
		return nil, err
	}
	return ToTiendaResponse(t), nil
}

func (s *service) GetByID(ctx context.Context, id uint) (*TiendaResponse, error) {
	t, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToTiendaResponse(t), nil
}

func (s *service) GetByWallet(ctx context.Context, wallet string) (*TiendaResponse, error) {
	trimmed := strings.TrimSpace(wallet)
	if trimmed == "" {
		return nil, fmt.Errorf("%w: billetera_g requerida", ErrInvalidInput)
	}
	t, err := s.repo.GetByWallet(ctx, trimmed)
	if err != nil {
		return nil, err
	}
	return ToTiendaResponse(t), nil
}

func (s *service) List(ctx context.Context) ([]TiendaResponse, error) {
	tiendas, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	return ToTiendaResponseList(tiendas), nil
}

func (s *service) Update(ctx context.Context, id uint, req UpdateTiendaRequest) (*TiendaResponse, error) {
	nombre := strings.TrimSpace(req.Nombre)
	dueno := strings.TrimSpace(req.Dueno)
	email := strings.ToLower(strings.TrimSpace(req.EmailPanel))
	wallet := strings.TrimSpace(req.BilleteraG)

	if err := validateFields(nombre, dueno, email, wallet); err != nil {
		return nil, err
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	existing.Nombre = nombre
	existing.Dueno = dueno
	existing.EmailPanel = email
	existing.BilleteraG = wallet

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return ToTiendaResponse(existing), nil
}

func (s *service) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func validateFields(nombre, dueno, email, wallet string) error {
	if nombre == "" || dueno == "" || email == "" || wallet == "" {
		return fmt.Errorf("%w: nombre, dueno, email_panel y billetera_g son obligatorios", ErrInvalidInput)
	}
	return nil
}
