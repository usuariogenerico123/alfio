package cuota

import "github.com/gin-gonic/gin"

func RegisterRoutes(rg *gin.RouterGroup, ctrl Controller) {
	cuotas := rg.Group("/cuotas")
	{
		cuotas.POST("", ctrl.Create)
		cuotas.POST("/generar", ctrl.GenerarPlan)
		cuotas.GET("", ctrl.List)
		cuotas.GET("/:id", ctrl.GetByID)
		cuotas.GET("/memo/:memo", ctrl.GetByMemo)
		cuotas.GET("/credito/:credito_id", ctrl.ListByCreditoID)
		cuotas.PATCH("/:id/estado", ctrl.UpdateEstado)
		cuotas.DELETE("/:id", ctrl.Delete)
	}
}
