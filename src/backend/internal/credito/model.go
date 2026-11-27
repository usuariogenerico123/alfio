package credito

import (
	"time"

	"alfio/backend/internal/client"
	"alfio/backend/internal/producto"

	"gorm.io/gorm"
)

const (
	EstadoPendiente  = "pendiente"
	EstadoActivo     = "activo"
	EstadoCompletado = "completado"
	EstadoAtrasado   = "atrasado"
	EstadoCancelado  = "cancelado"
)

// Credito representa un crédito otorgado a un cliente por la compra de un producto.
// Relación: Cliente (1) -> Creditos (N), Producto (1) -> Creditos (N).
type Credito struct {
	gorm.Model
	ClienteID  uint              `gorm:"not null;index"`
	Cliente    client.Client     `gorm:"foreignKey:ClienteID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	ProductoID uint              `gorm:"not null;index"`
	Producto   producto.Producto `gorm:"foreignKey:ProductoID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Total      float64           `gorm:"type:numeric(12,2);not null"`
	Inicial    float64           `gorm:"type:numeric(12,2);not null"`
	Fecha      time.Time         `gorm:"not null"`
	Estado     string            `gorm:"type:varchar(30);not null;default:'pendiente'"`
}

func (Credito) TableName() string {
	return "creditos"
}
