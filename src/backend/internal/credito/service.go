package credito

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

func (s *service) Create(ctx context.Context, req CreateCreditoRequest) (*CreditoResponse, error) {
	if req.ClienteID == 0 || req.ProductoID == 0 || req.Total <= 0 {
		return nil, fmt.Errorf("%w: cliente_id, producto_id y total son obligatorios", ErrInvalidInput)
	}

	total := round2(req.Total)
	inicial := round2(req.Inicial)
	if inicial == 0 {
		// Regla de negocio alFio: 50% inicial por defecto
		inicial = round2(total * 0.5)
	}
	if inicial > total {
		return nil, fmt.Errorf("%w: el monto inicial no puede superar el total", ErrInvalidInput)
	}

	estado := strings.ToLower(strings.TrimSpace(req.Estado))
	if estado == "" {
		estado = EstadoPendiente
	}
	if !isValidEstado(estado) {
		return nil, fmt.Errorf("%w: estado inválido (%s)", ErrInvalidInput, estado)
	}

	c := &Credito{
		ClienteID:  req.ClienteID,
		ProductoID: req.ProductoID,
		Total:      total,
		Inicial:    inicial,
		Fecha:      time.Now().UTC(),
		Estado:     estado,
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}
	return ToCreditoResponse(c), nil
}

func (s *service) GetByID(ctx context.Context, id uint) (*CreditoResponse, error) {
	c, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToCreditoResponse(c), nil
}

func (s *service) List(ctx context.Context) ([]CreditoResponse, error) {
	creditos, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	return ToCreditoResponseList(creditos), nil
}

func (s *service) ListByClienteID(ctx context.Context, clienteID uint) ([]CreditoResponse, error) {
	if clienteID == 0 {
		return nil, fmt.Errorf("%w: cliente_id inválido", ErrInvalidInput)
	}
	creditos, err := s.repo.ListByClienteID(ctx, clienteID)
	if err != nil {
		return nil, err
	}
	return ToCreditoResponseList(creditos), nil
}

func (s *service) UpdateEstado(ctx context.Context, id uint, req UpdateEstadoCreditoRequest) (*CreditoResponse, error) {
	estado := strings.ToLower(strings.TrimSpace(req.Estado))
	if !isValidEstado(estado) {
		return nil, fmt.Errorf("%w: estado inválido (%s)", ErrInvalidInput, estado)
	}

	if err := s.repo.UpdateEstado(ctx, id, estado); err != nil {
		return nil, err
	}
	return s.GetByID(ctx, id)
}

func (s *service) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func isValidEstado(estado string) bool {
	switch estado {
	case EstadoPendiente, EstadoActivo, EstadoCompletado, EstadoAtrasado, EstadoCancelado:
		return true
	default:
		return false
	}
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
