package handlers

import (
	"database/sql"
	"fmt"
	"net/http"

	"vibecoders/models"

	"github.com/labstack/echo/v4"
)

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type RegisterRequest struct {
	Username        string `json:"username"`
	Password        string `json:"password"`
	ConfirmPassword string `json:"confirm_password"`
	Bio             string `json:"bio"`
	LinkedInURL     string `json:"linked_in_url"`
	GithubURL       string `json:"github_url"`
	PhotoURL        string `json:"photo_url"`
}

type UpdateUserRequest struct {
	Bio         string `json:"bio"`
	LinkedInURL string `json:"linked_in_url"`
	GithubURL   string `json:"github_url"`
	PhotoURL    string `json:"photo_url"`
}

func Login(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req LoginRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		user, err := models.GetUserByUsername(db, req.Username)
		if err != nil {
			if err == sql.ErrNoRows {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid credentials"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database error"})
		}

		// In a real app, we would use password hashing
		if user.Password != req.Password {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid credentials"})
		}

		// Create session
		token, err := models.CreateSession(db, user.ID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not create session"})
		}

		// Set cookie
		cookie := new(http.Cookie)
		cookie.Name = "session_token"
		cookie.Value = token
		cookie.Path = "/"
		cookie.HttpOnly = true
		c.SetCookie(cookie)

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Login successful",
			"user": map[string]interface{}{
				"id":       user.ID,
				"username": user.Username,
			},
		})
	}
}

func Logout(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		cookie, err := c.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				return c.JSON(http.StatusOK, map[string]string{"message": "Already logged out"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Server error"})
		}

		// Delete session from database
		if err := models.DeleteSession(db, cookie.Value); err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not delete session"})
		}

		// Clear cookie
		cookie = new(http.Cookie)
		cookie.Name = "session_token"
		cookie.Value = ""
		cookie.Path = "/"
		cookie.MaxAge = -1
		c.SetCookie(cookie)

		return c.JSON(http.StatusOK, map[string]string{"message": "Logout successful"})
	}
}

func Register(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		var req RegisterRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		// Validate passwords match
		if req.Password != req.ConfirmPassword {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Passwords do not match"})
		}

		// Check if username already exists
		_, err := models.GetUserByUsername(db, req.Username)
		if err == nil {
			return c.JSON(http.StatusConflict, map[string]string{"error": "Username already exists"})
		} else if err != sql.ErrNoRows {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Database error"})
		}

		// Create user
		err = models.CreateUser(db, req.Username, req.Password, "", req.Bio, req.LinkedInURL, req.GithubURL, req.PhotoURL)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not create user"})
		}

		return c.JSON(http.StatusCreated, map[string]string{"message": "User registered successfully"})
	}
}

func UpdateUser(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get user ID from session
		cookie, err := c.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Not logged in"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Server error"})
		}

		userID, err := models.GetUserIDByToken(db, cookie.Value)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid session"})
		}

		var req UpdateUserRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		// Update user
		err = models.UpdateUser(db, userID, "", req.Bio, req.LinkedInURL, req.GithubURL, req.PhotoURL)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not update user"})
		}

		return c.JSON(http.StatusOK, map[string]string{"message": "User updated successfully"})
	}
}

func GetHomepageUsers(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		users, err := models.GetTopUsers(db, 3)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not fetch users"})
		}

		return c.JSON(http.StatusOK, users)
	}
}

func GetCurrentUser(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		cookie, err := c.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Not logged in"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Server error"})
		}

		userID, err := models.GetUserIDByToken(db, cookie.Value)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid session"})
		}

		user, err := models.GetUserByID(db, userID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not fetch user"})
		}

		return c.JSON(http.StatusOK, user)
	}
}

func GetPublicUserByUsername(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		username := c.Param("username")
		if username == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Username is required"})
		}

		user, err := models.GetUserByUsername(db, username)
		if err != nil {
			if err == sql.ErrNoRows {
				return c.JSON(http.StatusNotFound, map[string]string{"error": "User not found"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not fetch user"})
		}

		// Remove sensitive information for public profile
		user.Password = ""
		
		return c.JSON(http.StatusOK, user)
	}
}

// Magic link handlers
type CreateMagicLinkRequest struct {
	RedirectURL string `json:"redirect_url"`
}

func CreateMagicLink(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get user ID from session
		cookie, err := c.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Not logged in"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Server error"})
		}

		userID, err := models.GetUserIDByToken(db, cookie.Value)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid session"})
		}

		// Parse request body to get redirect URL
		var req CreateMagicLinkRequest
		if err := c.Bind(&req); err != nil {
			// If there's an error binding, just use default redirect
			req.RedirectURL = "/"
		}

		// Create magic link with the specified redirect URL
		magicLink, err := models.CreateMagicLink(db, userID, req.RedirectURL)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not create magic link"})
		}

		return c.JSON(http.StatusCreated, magicLink)
	}
}

func GetUserMagicLinks(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get user ID from session
		cookie, err := c.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Not logged in"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Server error"})
		}

		userID, err := models.GetUserIDByToken(db, cookie.Value)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid session"})
		}

		// Get user's magic links
		links, err := models.GetUserMagicLinks(db, userID)
		if err != nil {
			// Return an empty array instead of null to avoid frontend errors
			return c.JSON(http.StatusOK, []models.MagicLink{})
		}

		// If links is nil, return an empty array
		if links == nil {
			links = []models.MagicLink{}
		}

		return c.JSON(http.StatusOK, links)
	}
}

func DeleteMagicLink(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get magic link ID from path
		id := c.Param("id")
		if id == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Magic link ID is required"})
		}

		// Parse ID to int
		linkID := 0
		_, err := fmt.Sscanf(id, "%d", &linkID)
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid magic link ID"})
		}

		// Get user ID from session
		cookie, err := c.Cookie("session_token")
		if err != nil {
			if err == http.ErrNoCookie {
				return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Not logged in"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Server error"})
		}

		userID, err := models.GetUserIDByToken(db, cookie.Value)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid session"})
		}

		// Delete magic link
		err = models.DeleteMagicLink(db, linkID, userID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not delete magic link"})
		}

		return c.JSON(http.StatusOK, map[string]string{"message": "Magic link deleted successfully"})
	}
}

func LoginWithMagicLink(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get token from path
		token := c.Param("token")
		if token == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Magic link token is required"})
		}

		// Validate token
		magicLink, err := models.GetMagicLinkByToken(db, token)
		if err != nil {
			if err == sql.ErrNoRows {
				return c.JSON(http.StatusNotFound, map[string]string{"error": "Invalid or expired magic link"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Server error"})
		}

		// Create session
		sessionToken, err := models.CreateSession(db, magicLink.UserID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not create session"})
		}

		// Set cookie
		cookie := new(http.Cookie)
		cookie.Name = "session_token"
		cookie.Value = sessionToken
		cookie.Path = "/"
		cookie.HttpOnly = true
		c.SetCookie(cookie)

		// Get user info
		user, err := models.GetUserByID(db, magicLink.UserID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Could not fetch user"})
		}

		return c.JSON(http.StatusOK, map[string]interface{}{
			"message": "Login successful",
			"user": map[string]interface{}{
				"id":       user.ID,
				"username": user.Username,
			},
			"redirect_url": magicLink.RedirectURL,
		})
	}
}

// sessionFromContext retrieves the session from the context cookie
func sessionFromContext(c echo.Context) (*models.Session, error) {
	cookie, err := c.Cookie("session_token")
	if err != nil {
		return nil, err
	}
	
	token := cookie.Value
	
	// Since we can't reliably get the DB from the context in all cases,
	// let's use the GetUserIDByToken function instead
	var session models.Session
	
	// Get the database from the handler closure
	if db, ok := c.Get("db").(*sql.DB); ok {
		userID, err := models.GetUserIDByToken(db, token)
		if err != nil {
			return nil, err
		}
		
		session.UserID = userID
		session.Token = token
		return &session, nil
	}
	
	// If we can't get the DB from context, return an error
	return nil, fmt.Errorf("database not found in context")
}
