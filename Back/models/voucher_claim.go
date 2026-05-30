package models

import "time"

type VoucherClaim struct {
	ID        int        `gorm:"primaryKey" json:"id"`
	VoucherID int        `json:"voucher_id"`
	UserID    int        `json:"user_id"`
	ClaimCode string     `gorm:"uniqueIndex;size:80" json:"claim_code"`
	Status    string     `gorm:"type:enum('claimed','used','cancelled')" json:"status"`
	ClaimedAt time.Time  `json:"claimed_at"`
	UsedAt    *time.Time `json:"used_at"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (VoucherClaim) TableName() string {
	return "voucher_claims"
}
