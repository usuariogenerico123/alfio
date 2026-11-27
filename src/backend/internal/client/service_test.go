package client

import (
	"context"
	"errors"
	"testing"
	"time"
)

type memoryRepo struct {
	nextID uint
	items  map[uint]Client
}

func newMemoryRepo() *memoryRepo {
	return &memoryRepo{nextID: 1, items: make(map[uint]Client)}
}

func (m *memoryRepo) Create(_ context.Context, c *Client) error {
	for _, existing := range m.items {
		if existing.CI == c.CI || existing.DireccionBilletera == c.DireccionBilletera {
			return ErrDuplicateClient
		}
	}
	now := time.Now().UTC()
	c.ID = m.nextID
	m.nextID++
	c.CreatedAt = now
	c.UpdatedAt = now
	m.items[c.ID] = *c
	return nil
}

func (m *memoryRepo) GetByID(_ context.Context, id uint) (*Client, error) {
	c, ok := m.items[id]
	if !ok {
		return nil, ErrClientNotFound
	}
	return &c, nil
}

func (m *memoryRepo) GetByWallet(_ context.Context, wallet string) (*Client, error) {
	for _, c := range m.items {
		if c.DireccionBilletera == wallet {
			copyClient := c
			return &copyClient, nil
		}
	}
	return nil, ErrClientNotFound
}

func (m *memoryRepo) List(_ context.Context) ([]Client, error) {
	out := make([]Client, 0, len(m.items))
	for _, c := range m.items {
		out = append(out, c)
	}
	return out, nil
}

func (m *memoryRepo) Update(_ context.Context, c *Client) error {
	if _, ok := m.items[c.ID]; !ok {
		return ErrClientNotFound
	}
	m.items[c.ID] = *c
	return nil
}

func (m *memoryRepo) Delete(_ context.Context, id uint) error {
	if _, ok := m.items[id]; !ok {
		return ErrClientNotFound
	}
	delete(m.items, id)
	return nil
}

func TestClientServiceCRUD(t *testing.T) {
	svc := NewService(newMemoryRepo())
	ctx := context.Background()

	created, err := svc.Create(ctx, CreateClientRequest{
		Nombre:             "Ana Gómez",
		CI:                 "8451230",
		Telefono:           "+59170012345",
		DireccionBilletera: "GBTESTWALLETANAGOMEZ000000000000000000000000000000001",
	})
	if err != nil {
		t.Fatalf("Create falló: %v", err)
	}
	if created.ID == 0 {
		t.Fatalf("esperaba ID autogenerado > 0")
	}

	found, err := svc.GetByWallet(ctx, created.DireccionBilletera)
	if err != nil || found.ID != created.ID {
		t.Fatalf("GetByWallet no devolvió el cliente esperado: %v", err)
	}

	_, err = svc.Create(ctx, CreateClientRequest{
		Nombre:             "Otro",
		CI:                 "8451230",
		Telefono:           "+59170099999",
		DireccionBilletera: "GBOTRAWALLET00000000000000000000000000000000000000002",
	})
	if !errors.Is(err, ErrDuplicateClient) {
		t.Fatalf("esperaba ErrDuplicateClient, obtuve: %v", err)
	}
}
