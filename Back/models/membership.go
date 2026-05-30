package models

import "time"

type Membership struct {
	ID             int        `gorm:"primaryKey;column:id" json:"id"`
	UserID         int        `gorm:"column:user_id" json:"user_id"`
	LevelID        int        `gorm:"column:level_id" json:"level_id"`
	LevelName      string     `gorm:"column:level_name;type:enum('Silver','Gold','Platinum')" json:"level_name"`
	AnnualSpending float64    `gorm:"column:annual_spending" json:"annual_spending"`
	Status         string     `gorm:"column:status;type:enum('active','inactive','expired')" json:"status"`
	JoinedDate     *time.Time `gorm:"column:joined_date" json:"joined_date"`
	RenewalDate    *time.Time `gorm:"column:renewal_date" json:"renewal_date"`
	CreatedAt      time.Time  `gorm:"column:created_at;autoCreateTime" json:"created_at"`
	UpdatedAt      time.Time  `gorm:"column:updated_at;autoUpdateTime" json:"updated_at"`
}

func (Membership) TableName() string {
	return "memberships"
}
