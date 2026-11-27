package pago

import "github.com/gin-gonic/gin"

func RegisterRoutes(rg *gin.RouterGroup, ctrl Controller) {
	pagos := rg.Group("/pagos")
	{
		pagos.POST("", ctrl.Create)
		pagos.GET("", ctrl.List)
		pagos.GET("/:id", ctrl.GetByID)
		pagos.GET("/hash/:hash", ctrl.GetByHash)
		pagos.GET("/cuota/:cuota_id", ctrl.ListByCuotaID)
		pagos.DELETE("/:id", ctrl.Delete)
	}
}
