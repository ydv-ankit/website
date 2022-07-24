package controllers

import (
	"github.com/CollActionteam/clothing-loop/server/local/models"
	"github.com/CollActionteam/clothing-loop/server/local/views"
	"github.com/darahayes/go-boom"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm/clause"
)

func ContactNewsletter(c *gin.Context) {
	db := getDB(c)

	var body struct {
		Email     string `json:"email" binding:"required,email"`
		Subscribe bool   `json:"subscribe" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		boom.BadRequest(c.Writer, err)
		return
	}

	if !body.Subscribe {
		db.Raw("DELETE FROM newsletters WHERE email = ?", body.Email)

		return
	}

	name := "fellow human!"
	var row struct{ Name string }
	db.Raw("SELECT name FROM users WHERE email = ? LIMIT 1", body.Email).Scan(&row)
	if row.Name != "" {
		name = row.Name
	}

	db.Clauses(clause.OnConflict{DoNothing: true}).Create(&models.Newsletter{
		Name:  name,
		Email: body.Email,
	})

	views.EmailSubscribeToNewsletter(c, db, name, body.Email)
}

func ContactMail(c *gin.Context) {
	db := getDB(c)

	var body struct {
		Name    string `json:"name" binding:"required"`
		Email   string `json:"email" binding:"required,email"`
		Message string `json:"message" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		boom.BadRequest(c.Writer, err)
		return
	}

	views.EmailContactUserMessage(c, db, body.Name, body.Email, body.Message)
	views.EmailContactConfirmation(c, db, body.Name, body.Email, body.Message)
}
