package models

import (
	"database/sql"
	"time"
)

type BudgetCategory struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
}

type BudgetTransaction struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	Date        string    `json:"date"`
	Amount      float64   `json:"amount"`
	Description string    `json:"description"`
	CategoryID  *int      `json:"category_id"`
	CreatedAt   time.Time `json:"created_at"`
	// For frontend representation
	CategoryName string `json:"category_name,omitempty"`
}

// BulkTransaction represents a transaction for bulk import
type BulkTransaction struct {
	Date        string  `json:"date"`
	Amount      float64 `json:"amount"`
	Description string  `json:"description"`
}

// GetBudgetCategories returns all categories for a user
func GetBudgetCategories(db *sql.DB, userID int) ([]BudgetCategory, error) {
	query := `SELECT id, user_id, name, created_at 
              FROM budget_categories 
              WHERE user_id = ?
              ORDER BY name ASC`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var categories []BudgetCategory
	for rows.Next() {
		var category BudgetCategory
		err := rows.Scan(&category.ID, &category.UserID, &category.Name, &category.CreatedAt)
		if err != nil {
			return nil, err
		}
		categories = append(categories, category)
	}

	return categories, nil
}

// CreateBudgetCategory creates a new category
func CreateBudgetCategory(db *sql.DB, userID int, name string) (int, error) {
	query := `INSERT INTO budget_categories (user_id, name) 
              VALUES (?, ?)`

	result, err := db.Exec(query, userID, name)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}

// UpdateBudgetCategory updates an existing category
func UpdateBudgetCategory(db *sql.DB, categoryID, userID int, name string) error {
	// Verify the category belongs to the user before updating
	query := `UPDATE budget_categories 
            SET name = ? 
            WHERE id = ? AND user_id = ?`

	result, err := db.Exec(query, name, categoryID, userID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		// Category doesn't exist or doesn't belong to user
		return sql.ErrNoRows
	}

	return nil
}

// GetBudgetTransactions returns all transactions for a user
func GetBudgetTransactions(db *sql.DB, userID int) ([]BudgetTransaction, error) {
	query := `SELECT t.id, t.user_id, t.date, t.amount, t.description, t.category_id, t.created_at, c.name
              FROM budget_transactions t
              LEFT JOIN budget_categories c ON t.category_id = c.id
              WHERE t.user_id = ?
              ORDER BY t.date DESC, t.id DESC`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var transactions []BudgetTransaction
	for rows.Next() {
		var transaction BudgetTransaction
		var categoryName sql.NullString
		var categoryID sql.NullInt32

		err := rows.Scan(
			&transaction.ID, 
			&transaction.UserID, 
			&transaction.Date, 
			&transaction.Amount, 
			&transaction.Description, 
			&categoryID, 
			&transaction.CreatedAt,
			&categoryName,
		)
		if err != nil {
			return nil, err
		}

		if categoryID.Valid {
			id := int(categoryID.Int32)
			transaction.CategoryID = &id
		}

		if categoryName.Valid {
			transaction.CategoryName = categoryName.String
		}

		transactions = append(transactions, transaction)
	}

	return transactions, nil
}

// UpdateTransactionCategory updates the category for a transaction
// If categoryID is -1, it will set the category to NULL (removing the category)
func UpdateTransactionCategory(db *sql.DB, transactionID, categoryID int, userID int) error {
	// Verify the transaction belongs to the user before updating
	var query string
	var args []interface{}
	
	if categoryID == -1 {
		// Remove category (set to NULL)
		query = `UPDATE budget_transactions 
              SET category_id = NULL 
              WHERE id = ? AND user_id = ?`
		args = []interface{}{transactionID, userID}
	} else {
		// Update to specific category
		query = `UPDATE budget_transactions 
              SET category_id = ? 
              WHERE id = ? AND user_id = ?`
		args = []interface{}{categoryID, transactionID, userID}
	}

	_, err := db.Exec(query, args...)
	return err
}

// BulkImportTransactions imports multiple transactions at once
func BulkImportTransactions(db *sql.DB, userID int, transactions []BulkTransaction) (int, error) {
	tx, err := db.Begin()
	if err != nil {
		return 0, err
	}

	stmt, err := tx.Prepare(`INSERT INTO budget_transactions (user_id, date, amount, description) 
                          VALUES (?, ?, ?, ?)`)
	if err != nil {
		tx.Rollback()
		return 0, err
	}
	defer stmt.Close()

	count := 0
	for _, transaction := range transactions {
		// Insert each transaction
		_, err := stmt.Exec(userID, transaction.Date, transaction.Amount, transaction.Description)
		if err != nil {
			tx.Rollback()
			return 0, err
		}
		count++
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}

	return count, nil
}