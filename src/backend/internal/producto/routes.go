package producto

import "github.com/gin-gonic/gin"

func RegisterRoutes(rg *gin.RouterGroup, ctrl Controller) {
	productos := rg.Group("/productos")
	{
		productos.POST("", ctrl.Create)
		productos.GET("", ctrl.List)
		productos.GET("/codigo/:codigo", ctrl.GetByCodigo)
		productos.GET("/tienda/:tienda_id", ctrl.ListByTiendaID)
		productos.GET("/:id", ctrl.GetByID)
		productos.PUT("/:id", ctrl.Update)
		productos.DELETE("/:id", ctrl.Delete)
	}
}
