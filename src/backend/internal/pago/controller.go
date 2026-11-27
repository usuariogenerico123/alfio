package pago

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
	var req CreatePagoRequest
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

func (ctrl *controller) List(c *gin.Context) {
	pagos, err := ctrl.service.List(c.Request.Context())
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, pagos)
}

func (ctrl *controller) GetByID(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de pago inválido"})
		return
	}

	found, err := ctrl.service.GetByID(c.Request.Context(), id)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, found)
}

func (ctrl *controller) GetByHash(c *gin.Context) {
	found, err := ctrl.service.GetByHash(c.Request.Context(), c.Param("hash"))
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, found)
}

func (ctrl *controller) ListByCuotaID(c *gin.Context) {
	cuotaID, err := parseUintParam(c.Param("cuota_id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "cuota_id inválido"})
		return
	}

	pagos, err := ctrl.service.ListByCuotaID(c.Request.Context(), cuotaID)
	if err != nil {
		handleError(c, err)
		return
	}
	c.JSON(http.StatusOK, pagos)
}

func (ctrl *controller) Delete(c *gin.Context) {
	id, err := parseUintParam(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID de pago inválido"})
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
	case errors.Is(err, ErrPagoNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
	case errors.Is(err, ErrDuplicateHash):
		c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": "error interno del servidor"})
	}
}
