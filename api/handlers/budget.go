package handlers

import (
	"database/sql"
	"net/http"
	"vibecoders/models"

	"github.com/labstack/echo/v4"
)

type UpdateCategoryRequest struct {
	TransactionID int `json:"transaction_id"`
	CategoryID    int `json:"category_id"`
}

type NewCategoryRequest struct {
	Name string `json:"name"`
}

// getUserIDFromSession helper function gets the user ID from the session token
func getUserIDFromSession(c echo.Context, db *sql.DB) (int, error) {
	cookie, err := c.Cookie("session_token")
	if err != nil {
		return 0, err
	}

	userID, err := models.GetUserIDByToken(db, cookie.Value)
	if err != nil {
		return 0, err
	}

	return userID, nil
}

// GetBudgetTransactions returns all budget transactions for the authenticated user
func GetBudgetTransactions(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get user ID from session
		userID, err := getUserIDFromSession(c, db)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		}

		// Get transactions
		transactions, err := models.GetBudgetTransactions(db, userID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to get transactions"})
		}

		return c.JSON(http.StatusOK, transactions)
	}
}

// GetBudgetCategories returns all budget categories for the authenticated user
func GetBudgetCategories(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get user ID from session
		userID, err := getUserIDFromSession(c, db)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		}

		// Get categories
		categories, err := models.GetBudgetCategories(db, userID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to get categories"})
		}

		return c.JSON(http.StatusOK, categories)
	}
}

// UpdateTransactionCategory updates the category for a transaction
func UpdateTransactionCategory(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get user ID from session
		userID, err := getUserIDFromSession(c, db)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		}

		// Parse request
		var req UpdateCategoryRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		// Update category
		err = models.UpdateTransactionCategory(db, req.TransactionID, req.CategoryID, userID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to update category"})
		}

		return c.JSON(http.StatusOK, map[string]string{"status": "success"})
	}
}

// CreateBudgetCategory creates a new budget category
func CreateBudgetCategory(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get user ID from session
		userID, err := getUserIDFromSession(c, db)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		}

		// Parse request
		var req NewCategoryRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}

		// Validate
		if req.Name == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Category name cannot be empty"})
		}

		// Create category
		id, err := models.CreateBudgetCategory(db, userID, req.Name)
		if err != nil {
			// Check if it's a duplicate (unique constraint violation)
			if err.Error() == "UNIQUE constraint failed: budget_categories.user_id, budget_categories.name" {
				return c.JSON(http.StatusBadRequest, map[string]string{"error": "Category already exists"})
			}
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": "Failed to create category"})
		}

		// Return the new category
		category := models.BudgetCategory{
			ID:     id,
			UserID: userID,
			Name:   req.Name,
		}

		return c.JSON(http.StatusCreated, category)
	}
}