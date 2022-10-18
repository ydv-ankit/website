package integration_tests

import (
	"fmt"
	"net/http"
	"testing"

	"github.com/CollActionteam/clothing-loop/server/local/app/auth"
	"github.com/CollActionteam/clothing-loop/server/local/controllers"
	"github.com/CollActionteam/clothing-loop/server/local/tests/mocks"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestUserGetUID(t *testing.T) {
	// create user chain mock
	chain, user, token := mocks.MockChainAndUser(t, db, mocks.MockChainAndUserOptions{
		IsChainAdmin: true,
	})

	// create gin.Context mock
	url := fmt.Sprintf("/v1/user?user_uid=%s&chain_uid=%s", user.UID, chain.UID)
	c, resultFunc := mocks.MockGinContext(db, http.MethodGet, url, nil, token)

	// run sut
	controllers.UserGet(c)

	// retrieve result
	result := resultFunc()
	bodyJSON := result.BodyJSON()

	// test
	tokenReq, _ := auth.TokenReadFromRequest(c)
	assert.Equal(t, token, tokenReq)

	// assert.FailNowf(t, "testing", "status: %d, body: ~%s~, token: %s, header: %s", result.Response.StatusCode, result.Body, token, c.Request.Header.Get("Authorization"))
	assert.Equalf(t, 200, result.Response.StatusCode, "body: %s auth header: %v", bodyJSON, c.Request.Header.Get("Authorization"))
	assert.Equal(t, user.Name, bodyJSON["name"])

	found := false
	for _, chainUserAny := range bodyJSON["chains"].([]any) {
		chainUser := chainUserAny.(map[string]any)
		if chainUser["chain_uid"] == chain.UID {
			found = true
			assert.EqualValues(t, chainUser, gin.H{
				"chain_uid":      chain.UID,
				"user_uid":       user.UID,
				"is_chain_admin": true,
			})
		}
	}
	assert.Truef(t, found, "chainUser of chain_uid: %s not found", chain.UID)
}