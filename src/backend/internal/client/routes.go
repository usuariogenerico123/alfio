package client

import "github.com/gin-gonic/gin"

// RegisterRoutes registra los endpoints del feature client inyectando la interfaz Controller.
func RegisterRoutes(rg *gin.RouterGroup, ctrl Controller) {
	clients := rg.Group("/clients")
	{
		clients.POST("", ctrl.Create)
		clients.GET("", ctrl.List)
		clients.GET("/:id", ctrl.GetByID)
		clients.GET("/wallet/:wallet", ctrl.GetByWallet)
		clients.PUT("/:id", ctrl.Update)
		clients.DELETE("/:id", ctrl.Delete)
	}
}
