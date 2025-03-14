package models

import (
	"database/sql"
	"github.com/google/uuid"
	"time"
)

type MagicLink struct {
	ID          int       `json:"id"`
	UserID      int       `json:"user_id"`
	Token       string    `json:"token"`
	CreatedAt   time.Time `json:"created_at"`
	ExpiresAt   time.Time `json:"expires_at"`
	RedirectURL string    `json:"redirect_url"`
}

// CreateMagicLink creates a new magic link for the given user
func CreateMagicLink(db *sql.DB, userID int, redirectURL string) (*MagicLink, error) {
	token := uuid.New().String()
	
	// Add 7 days to current time for expiration
	expiresAt := time.Now().AddDate(0, 0, 7)
	
	// If redirectURL is empty, use the default '/'
	if redirectURL == "" {
		redirectURL = "/"
	}
	
	query := `INSERT INTO magic_links (user_id, token, expires_at, redirect_url) VALUES (?, ?, ?, ?)`
	result, err := db.Exec(query, userID, token, expiresAt, redirectURL)
	if err != nil {
		return nil, err
	}
	
	id, err := result.LastInsertId()
	if err != nil {
		return nil, err
	}
	
	return &MagicLink{
		ID:          int(id),
		UserID:      userID,
		Token:       token,
		CreatedAt:   time.Now(),
		ExpiresAt:   expiresAt,
		RedirectURL: redirectURL,
	}, nil
}

// GetUserMagicLinks retrieves all magic links for a given user
func GetUserMagicLinks(db *sql.DB, userID int) ([]MagicLink, error) {
	query := `SELECT id, user_id, token, created_at, expires_at, redirect_url
	          FROM magic_links 
	          WHERE user_id = ? 
	          ORDER BY created_at DESC`
	
	rows, err := db.Query(query, userID)
	if err != nil {
		return []MagicLink{}, err
	}
	defer rows.Close()

	// Initialize with empty slice instead of nil
	links := []MagicLink{}
	
	for rows.Next() {
		var link MagicLink
		var redirectURL sql.NullString
		
		err := rows.Scan(&link.ID, &link.UserID, &link.Token, &link.CreatedAt, &link.ExpiresAt, &redirectURL)
		if err != nil {
			return []MagicLink{}, err
		}
		
		if redirectURL.Valid {
			link.RedirectURL = redirectURL.String
		} else {
			link.RedirectURL = "/"
		}
		
		links = append(links, link)
	}

	// Check for rows.Err() to make sure there wasn't an error during iteration
	if err = rows.Err(); err != nil {
		return []MagicLink{}, err
	}

	return links, nil
}

// GetMagicLinkByToken retrieves a magic link by its token
func GetMagicLinkByToken(db *sql.DB, token string) (*MagicLink, error) {
	query := `SELECT id, user_id, token, created_at, expires_at, redirect_url
	          FROM magic_links 
	          WHERE token = ?`
	
	var link MagicLink
	var redirectURL sql.NullString
	
	err := db.QueryRow(query, token).Scan(
		&link.ID, &link.UserID, &link.Token, &link.CreatedAt, &link.ExpiresAt, &redirectURL,
	)
	if err != nil {
		return nil, err
	}
	
	// Set the RedirectURL with a default if it's null
	if redirectURL.Valid {
		link.RedirectURL = redirectURL.String
	} else {
		link.RedirectURL = "/"
	}
	
	// Check if link is expired
	if time.Now().After(link.ExpiresAt) {
		return nil, sql.ErrNoRows
	}
	
	return &link, nil
}

// DeleteMagicLink deletes a magic link by its ID
func DeleteMagicLink(db *sql.DB, id int, userID int) error {
	query := `DELETE FROM magic_links WHERE id = ? AND user_id = ?`
	_, err := db.Exec(query, id, userID)
	return err
}