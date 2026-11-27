package producto

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"strings"
)

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) generateUniqueCodigo(ctx context.Context) (string, error) {
	for range 5 {
		buf := make([]byte, 4)
		if _, err := rand.Read(buf); err != nil {
			return "", fmt.Errorf("error generando código de producto: %w", err)
		}
		codigo := "ALFIO-" + strings.ToUpper(hex.EncodeToString(buf))
		_, err := s.repo.GetByCodigo(ctx, codigo)
		if errors.Is(err, ErrProductoNotFound) {
			return codigo, nil
		}
		if err != nil {
			return "", err
		}
	}
	return "", fmt.Errorf("no se pudo generar un código único de producto")
}

func (s *service) Create(ctx context.Context, req CreateProductoRequest) (*ProductoResponse, error) {
	nombre := strings.TrimSpace(req.Nombre)
	specs := strings.TrimSpace(req.Especificaciones)

	if req.TiendaID == 0 || nombre == "" || specs == "" || req.PrecioUSD <= 0 || req.Stock < 0 {
		return nil, fmt.Errorf("%w: verifica tienda_id, nombre, especificaciones, precio_usd y stock", ErrInvalidInput)
	}

	codigo, err := s.generateUniqueCodigo(ctx)
	if err != nil {
		return nil, err
	}

	p := &Producto{
		CodigoProducto:   codigo,
		TiendaID:         req.TiendaID,
		Nombre:           nombre,
		Especificaciones: specs,
		PrecioUSD:        round2(req.PrecioUSD),
		Stock:            req.Stock,
		FotoURL:          strings.TrimSpace(req.FotoURL),
	}

	if err := s.repo.Create(ctx, p); err != nil {
		return nil, err
	}
	return ToProductoResponse(p), nil
}

func (s *service) GetByID(ctx context.Context, id uint) (*ProductoResponse, error) {
	p, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	return ToProductoResponse(p), nil
}

func (s *service) GetByCodigo(ctx context.Context, codigo string) (*ProductoResponse, error) {
	normalized := strings.ToUpper(strings.TrimSpace(codigo))
	if normalized == "" {
		return nil, fmt.Errorf("%w: código de producto inválido", ErrInvalidInput)
	}
	p, err := s.repo.GetByCodigo(ctx, normalized)
	if err != nil {
		return nil, err
	}
	return ToProductoResponse(p), nil
}

func (s *service) List(ctx context.Context) ([]ProductoResponse, error) {
	productos, err := s.repo.List(ctx)
	if err != nil {
		return nil, err
	}
	return ToProductoResponseList(productos), nil
}

func (s *service) ListByTiendaID(ctx context.Context, tiendaID uint) ([]ProductoResponse, error) {
	if tiendaID == 0 {
		return nil, fmt.Errorf("%w: tienda_id inválido", ErrInvalidInput)
	}
	productos, err := s.repo.ListByTiendaID(ctx, tiendaID)
	if err != nil {
		return nil, err
	}
	return ToProductoResponseList(productos), nil
}

func (s *service) Update(ctx context.Context, id uint, req UpdateProductoRequest) (*ProductoResponse, error) {
	nombre := strings.TrimSpace(req.Nombre)
	specs := strings.TrimSpace(req.Especificaciones)

	if nombre == "" || specs == "" || req.PrecioUSD <= 0 || req.Stock < 0 {
		return nil, fmt.Errorf("%w: datos de actualización inválidos", ErrInvalidInput)
	}

	existing, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	existing.Nombre = nombre
	existing.Especificaciones = specs
	existing.PrecioUSD = round2(req.PrecioUSD)
	existing.Stock = req.Stock
	existing.FotoURL = strings.TrimSpace(req.FotoURL)

	if err := s.repo.Update(ctx, existing); err != nil {
		return nil, err
	}
	return ToProductoResponse(existing), nil
}

func (s *service) Delete(ctx context.Context, id uint) error {
	return s.repo.Delete(ctx, id)
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}
