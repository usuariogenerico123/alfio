package tienda

import "github.com/gin-gonic/gin"

func RegisterRoutes(rg *gin.RouterGroup, ctrl Controller) {
	tiendas := rg.Group("/tiendas")
	{
		tiendas.POST("", ctrl.Create)
		tiendas.GET("", ctrl.List)
		tiendas.GET("/:id", ctrl.GetByID)
		tiendas.GET("/wallet/:wallet", ctrl.GetByWallet)
		tiendas.PUT("/:id", ctrl.Update)
		tiendas.DELETE("/:id", ctrl.Delete)
	}
}
