package credito

import "github.com/gin-gonic/gin"

func RegisterRoutes(rg *gin.RouterGroup, ctrl Controller) {
	creditos := rg.Group("/creditos")
	{
		creditos.POST("", ctrl.Create)
		creditos.GET("", ctrl.List)
		creditos.GET("/:id", ctrl.GetByID)
		creditos.GET("/cliente/:cliente_id", ctrl.ListByClienteID)
		creditos.PATCH("/:id/estado", ctrl.UpdateEstado)
		creditos.DELETE("/:id", ctrl.Delete)
	}
}
