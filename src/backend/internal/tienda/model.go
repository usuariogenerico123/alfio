package tienda

import "gorm.io/gorm"

// Tienda representa una tienda afiliada a alFio y su billetera Stellar (G...) que recibe pagos.
type Tienda struct {
	gorm.Model
	Nombre     string `gorm:"type:varchar(120);not null"`
	Dueno      string `gorm:"type:varchar(120);not null"`
	EmailPanel string `gorm:"type:varchar(150);not null;uniqueIndex"`
	BilleteraG string `gorm:"type:varchar(100);not null;uniqueIndex"`
}

func (Tienda) TableName() string {
	return "tiendas"
}
