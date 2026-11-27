package client

import "gorm.io/gorm"

// Client representa la entidad de cliente en alFio usando gorm.Model (ID, CreatedAt, UpdatedAt, DeletedAt).
type Client struct {
	gorm.Model
	Nombre             string `gorm:"type:varchar(120);not null"`
	CI                 string `gorm:"type:varchar(40);not null;uniqueIndex"`
	Telefono           string `gorm:"type:varchar(30);not null"`
	DireccionBilletera string `gorm:"type:varchar(100);not null;uniqueIndex"`
}

func (Client) TableName() string {
	return "clients"
}
