package producto

import (
	"alfio/backend/internal/tienda"

	"gorm.io/gorm"
)

// Producto representa un producto registrado por una tienda.
// Relación: Tienda (1) -> Productos (N).
type Producto struct {
	gorm.Model
	CodigoProducto   string        `gorm:"type:varchar(40);not null;uniqueIndex"`
	TiendaID         uint          `gorm:"not null;index"`
	Tienda           tienda.Tienda `gorm:"foreignKey:TiendaID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Nombre           string        `gorm:"type:varchar(150);not null"`
	Especificaciones string        `gorm:"type:text;not null"`
	PrecioUSD        float64       `gorm:"type:numeric(12,2);not null"`
	Stock            int           `gorm:"not null;default:0"`
	FotoURL          string        `gorm:"type:text"`
}

func (Producto) TableName() string {
	return "productos"
}
