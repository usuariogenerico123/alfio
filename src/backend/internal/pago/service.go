package pago

import (
	"context"
	"fmt"
	"math"
	"strings"
	"time"
)

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) Create(ctx context.Context, req CreatePagoRequest) (*PagoResponse, error) {
	hash := strings.TrimSpace(req.HashStellar)
	if req.CuotaID == 0 || req.Monto <= 0 || hash == "" {
		return nil, fmt.Errorf("%w: cuota_id, monto y hash_stellar son obligatorios", ErrInvalidInput)
	}

	fecha := req.Fecha
	if fecha.IsZero() {
		fecha = time.Now().UTC()
	}

	p := &Pago{
		CuotaID:     req.CuotaID,
		Monto:       round2(req.Monto),
		HashStellar: hash,
		Fecha:       fecha.UTC(),
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return ToPagoResponse(p), nil
}

func (s *service) GetByID(ctx context.Context, id uint) (*PagoResponse, error) {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToPagoResponse(p), nil
}

func (s *service) GetByHash(ctx context.Context, hash string) (*PagoResponse, error) {
	trimmed := strings.TrimSpace(hash)
	if trimmed == "" {
		return nil, fmt.Errorf("%w: hash_stellar requerido", ErrInvalidInput)
	}
	p, err := s.repo.GetByHash(ctx, trimmed)
	if err != nil {
		return nil, err
	}
	return ToPagoResponse(p), nil
}

func (s *service) List(ctx context.Context) ([]PagoResponse, error) {
	pagos, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	return ToPagoResponseList(pagos), nil
}

func (s *service) ListByCuotaID(ctx context.Context, cuotaID uint) ([]PagoResponse, error) {
	if cuotaID == 0 {
		return nil, fmt.Errorf("%w: cuota_id inválido", ErrInvalidInput)
	}
	pagos, err := s.repo.ListByCuotaID(ctx, cuotaID)
	if err != nil {
		return nil, err
	}
	return ToPagoResponseList(pagos), nil
}

func (s *service) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
