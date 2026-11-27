package cuota

import (
	"time"

	"alfio/backend/internal/credito"

	"gorm.io/gorm"
)

const (
	EstadoPendiente = "pendiente"
	EstadoPagada    = "pagada"
	EstadoAtrasada  = "atrasada"
)

// Cuota representa una cuota programada (cada 15 días) perteneciente a un Crédito.
// Relación: Credito (1) -> Cuotas (N).
type Cuota struct {
	gorm.Model
	CreditoID   uint            `gorm:"not null;index"`
	Credito     credito.Credito `gorm:"foreignKey:CreditoID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Numero      int             `gorm:"not null"`
	Monto       float64         `gorm:"type:numeric(12,2);not null"`
	Vencimiento time.Time       `gorm:"not null;index"`
	Estado      string          `gorm:"type:varchar(30);not null;default:'pendiente'"`
	Memo        string          `gorm:"type:varchar(28);not null;uniqueIndex"`
}

func (Cuota) TableName() string {
	return "cuotas"
}
