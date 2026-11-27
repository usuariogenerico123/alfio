package cuota

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

func (s *service) Create(ctx context.Context, req CreateCuotaRequest) (*CuotaResponse, error) {
	if req.CreditoID == 0 || req.Numero <= 0 || req.Monto <= 0 {
		return nil, fmt.Errorf("%w: credito_id, numero y monto son obligatorios", ErrInvalidInput)
	}

	estado := strings.ToLower(strings.TrimSpace(req.Estado))
	if estado == "" {
		estado = EstadoPendiente
	}
	if !isValidEstado(estado) {
		return nil, fmt.Errorf("%w: estado inválido (%s)", ErrInvalidInput, estado)
	}

	memo := strings.TrimSpace(req.Memo)
	if memo == "" {
		memo = buildStellarMemo(req.CreditoID, req.Numero)
	}
	if len(memo) > 28 {
		return nil, fmt.Errorf("%w: el memo de Stellar no puede superar 28 caracteres", ErrInvalidInput)
	}

	c := &Cuota{
		CreditoID:   req.CreditoID,
		Numero:      req.Numero,
		Monto:       round2(req.Monto),
		Vencimiento: req.Vencimiento.UTC(),
		Estado:      estado,
		Memo:        memo,
	}

	if err := s.repo.Create(ctx, c); err != nil {
		return nil, err
	}
	return ToCuotaResponse(c), nil
}

// GenerarPlan crea automáticamente las 4 cuotas cada 15 días (absorbiendo cualquier centavo en la última cuota).
func (s *service) GenerarPlan(ctx context.Context, req GenerarPlanCuotasRequest) ([]CuotaResponse, error) {
	if req.CreditoID == 0 || req.SaldoRestante <= 0 {
		return nil, fmt.Errorf("%w: credito_id y saldo_restante son obligatorios", ErrInvalidInput)
	}

	cantidad := req.CantidadCuotas
	if cantidad <= 0 {
		cantidad = 4
	}
	intervalo := req.IntervaloDias
	if intervalo <= 0 {
		intervalo = 15
	}

	totalRestante := round2(req.SaldoRestante)
	montoBase := math.Floor((totalRestante/float64(cantidad))*100) / 100
	acumulado := 0.0
	now := time.Now().UTC()

	cuotas := make([]Cuota, 0, cantidad)
	for i := 1; i <= cantidad; i++ {
		monto := montoBase
		if i == cantidad {
			monto = round2(totalRestante - acumulado)
		} else {
			acumulado = round2(acumulado + monto)
		}

		cuotas = append(cuotas, Cuota{
			CreditoID:   req.CreditoID,
			Numero:      i,
			Monto:       monto,
			Vencimiento: now.AddDate(0, 0, intervalo*i),
			Estado:      EstadoPendiente,
			Memo:        buildStellarMemo(req.CreditoID, i),
		})
	}

	if err := s.repo.CreateBatch(ctx, cuotas); err != nil {
		return nil, err
	}
	return ToCuotaResponseList(cuotas), nil
}

func (s *service) GetByID(ctx context.Context, id uint) (*CuotaResponse, error) {
	c, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToCuotaResponse(c), nil
}

func (s *service) GetByMemo(ctx context.Context, memo string) (*CuotaResponse, error) {
	trimmed := strings.TrimSpace(memo)
	if trimmed == "" {
		return nil, fmt.Errorf("%w: memo requerido", ErrInvalidInput)
	}
	c, err := s.repo.GetByMemo(ctx, trimmed)
	if err != nil {
		return nil, err
	}
	return ToCuotaResponse(c), nil
}

func (s *service) List(ctx context.Context) ([]CuotaResponse, error) {
	cuotas, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	return ToCuotaResponseList(cuotas), nil
}

func (s *service) ListByCreditoID(ctx context.Context, creditoID uint) ([]CuotaResponse, error) {
	if creditoID == 0 {
		return nil, fmt.Errorf("%w: credito_id inválido", ErrInvalidInput)
	}
	cuotas, err := s.repo.ListByCreditoID(ctx, creditoID)
	if err != nil {
		return nil, err
	}
	return ToCuotaResponseList(cuotas), nil
}

func (s *service) UpdateEstado(ctx context.Context, id uint, req UpdateEstadoCuotaRequest) (*CuotaResponse, error) {
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

func buildStellarMemo(creditoID uint, numero int) string {
	return fmt.Sprintf("ALFIO-C%d-N%d", creditoID, numero)
}

func isValidEstado(estado string) bool {
	switch estado {
	case EstadoPendiente, EstadoPagada, EstadoAtrasada:
		return true
	default:
		return false
	}
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
