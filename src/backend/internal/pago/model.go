package pago

import (
	"time"

	"alfio/backend/internal/cuota"

	"gorm.io/gorm"
)

// Pago registra el pago on-chain (Stellar) de una cuota específica.
// Relación: Cuota (1) -> Pagos (N). HashStellar es único para evitar doble registro.
type Pago struct {
	gorm.Model
	CuotaID     uint        `gorm:"not null;index"`
	Cuota       cuota.Cuota `gorm:"foreignKey:CuotaID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Monto       float64     `gorm:"type:numeric(12,2);not null"`
	HashStellar string      `gorm:"type:varchar(128);not null;uniqueIndex"`
	Fecha       time.Time   `gorm:"not null"`
}

func (Pago) TableName() string {
	return "pagos"
}
