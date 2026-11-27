package cuota

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type controller struct {
	service Service
}

func NewController(service Service) Controller {
	return &controller{service: service}
}

func (ctrl *controller) Create(c *gin.Context) {
	var req CreateCuotaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload inválido: " + err.Error()})
		return
	}

	created, err := ctrl.service.Create(c.Request.Context(), req)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusCreated, created)
}

func (ctrl *controller) GenerarPlan(c *gin.Context) {
	var req GenerarPlanCuotasRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload inválido: " + err.Error()})
		return
	}

	cuotas, err := ctrl.service.GenerarPlan(c.Request.Context(), req)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusCreated, cuotas)
}

func (ctrl *controller) List(c *gin.Context) {
	cuotas, err := ctrl.service.List(c.Request.Context())
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, cuotas)
}

func (ctrl *controller) GetByID(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de cuota inválido"})
		return
	}

	found, err := ctrl.service.GetByID(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, found)
}

func (ctrl *controller) GetByMemo(c *gin.Context) {
	found, err := ctrl.service.GetByMemo(c.Request.Context(), c.Param("memo"))
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, found)
}

func (ctrl *controller) ListByCreditoID(c *gin.Context) {
	creditoID, err := parseUintParam(c.Param("credito_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "credito_id inválido"})
		return
	}

	cuotas, err := ctrl.service.ListByCreditoID(c.Request.Context(), creditoID)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, cuotas)
}

func (ctrl *controller) UpdateEstado(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de cuota inválido"})
		return
	}

	var req UpdateEstadoCuotaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "payload inválido: " + err.Error()})
		return
	}

	updated, err := ctrl.service.UpdateEstado(c.Request.Context(), id, req)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (ctrl *controller) Delete(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de cuota inválido"})
		return
	}

	if err := ctrl.service.Delete(c.Request.Context(), id); err != nil {
		handleError(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

func parseUintParam(raw string) (uint, error) {
	parsed, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || parsed == 0 {
		return 0, ErrInvalidInput
	}
	return uint(parsed), nil
}

func handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, ErrInvalidInput):
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	case errors.Is(err, ErrCuotaNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case errors.Is(err, ErrDuplicateMemo):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error interno del servidor"})
	}
}
