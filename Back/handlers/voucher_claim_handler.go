package handlers

import (
	"Back/repository"
	"Back/utils"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type VoucherClaimHandler struct {
	claimRepo *repository.VoucherClaimRepository
}

func NewVoucherClaimHandler(claimRepo *repository.VoucherClaimRepository) *VoucherClaimHandler {
	return &VoucherClaimHandler{claimRepo: claimRepo}
}

func (h *VoucherClaimHandler) ListMyClaims(c *gin.Context) {
	userID, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: "Unauthorized"})
		return
	}

	uid, ok := userID.(int)
	if !ok {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: "Invalid user"})
		return
	}

	claims, err := h.claimRepo.GetClaimsByUser(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, utils.ApiResponse{Success: false, Message: "Failed to load voucher claims", Errors: err.Error()})
		return
	}

	c.JSON(http.StatusOK, utils.ApiResponse{Success: true, Message: "Voucher claims fetched", Data: claims})
}

func (h *VoucherClaimHandler) ClaimVoucher(c *gin.Context) {
	userID, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: "Unauthorized"})
		return
	}

	uid, ok := userID.(int)
	if !ok {
		c.JSON(http.StatusUnauthorized, utils.ApiResponse{Success: false, Message: "Invalid user"})
		return
	}

	voucherID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: "Invalid voucher ID"})
		return
	}

	claim, err := h.claimRepo.ClaimVoucher(voucherID, uid)
	if err != nil {
		c.JSON(http.StatusBadRequest, utils.ApiResponse{Success: false, Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, utils.ApiResponse{Success: true, Message: "Voucher claimed successfully", Data: map[string]interface{}{
		"claim_code": claim.ClaimCode,
		"voucher_id": claim.VoucherID,
		"user_id":    claim.UserID,
		"status":     claim.Status,
	}})
}
