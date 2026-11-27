package main

import (
	"log"
	"net/http"
	"os"

	"alfio/backend/internal/client"
	"alfio/backend/internal/credito"
	"alfio/backend/internal/cuota"
	"alfio/backend/internal/db"
	"alfio/backend/internal/pago"
	"alfio/backend/internal/producto"
	"alfio/backend/internal/security"
	"alfio/backend/internal/stellar"
	"alfio/backend/internal/tienda"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	dbCfg := db.LoadConfigFromEnv()

	gormDB, err := db.NewPostgresDB(dbCfg)
	if err != nil {
		log.Fatalf("error conectando a PostgreSQL: %v", err)
		return
	}

	if err := gormDB.AutoMigrate(
		&client.Client{},
		&tienda.Tienda{},
		&producto.Producto{},
		&credito.Credito{},
		&cuota.Cuota{},
		&pago.Pago{},
	); err != nil {
		log.Fatalf("error ejecutando AutoMigrate: %v", err)
	}

	// Cableado por capas (inyección por interfaces)
	clientCtrl := client.NewController(client.NewService(client.NewRepository(gormDB)))
	tiendaCtrl := tienda.NewController(tienda.NewService(tienda.NewRepository(gormDB)))
	productoCtrl := producto.NewController(producto.NewService(producto.NewRepository(gormDB)))
	creditoCtrl := credito.NewController(credito.NewService(credito.NewRepository(gormDB)))
	cuotaCtrl := cuota.NewController(cuota.NewService(cuota.NewRepository(gormDB)))
	pagoCtrl := pago.NewController(pago.NewService(pago.NewRepository(gormDB)))

	// Hub SSE + Cliente Horizon Testnet
	stellarHub := stellar.NewEventHub()
	horizonClient := stellar.NewDefaultTestnetClient()

	router := gin.Default()
	router.Use(security.SecurityHeadersMiddleware())
	router.Use(security.CORSMiddleware())

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok", "service": "alfio-backend"})
	})

	v1 := router.Group("/api/v1")
	client.RegisterRoutes(v1, clientCtrl)
	tienda.RegisterRoutes(v1, tiendaCtrl)
	producto.RegisterRoutes(v1, productoCtrl)
	credito.RegisterRoutes(v1, creditoCtrl)
	cuota.RegisterRoutes(v1, cuotaCtrl)
	pago.RegisterRoutes(v1, pagoCtrl)
	stellar.RegisterRoutes(v1, stellarHub, horizonClient)

	port := os.Getenv("PORT")
	if port == "" {
		port = os.Getenv("APP_PORT")
	}
	if port == "" {
		port = "8080"
	}

	log.Printf("alFIO backend escuchando en :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("error iniciando servidor HTTP: %v", err)
	}
}
