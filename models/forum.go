package models

import (
	"database/sql"
	"time"
)

type ForumPost struct {
	ID        int       `json:"id"`
	UserID    int       `json:"user_id"`
	Title     string    `json:"title"`
	Content   string    `json:"content,omitempty"`
	URL       string    `json:"url,omitempty"`
	Score     int       `json:"score"`
	CreatedAt time.Time `json:"created_at"`
	User      *User     `json:"user,omitempty"`
	Comments  []ForumComment `json:"comments,omitempty"`
	VoteStatus *int     `json:"vote_status,omitempty"` // 1 for upvote, nil for no vote
}

type ForumComment struct {
	ID        int       `json:"id"`
	PostID    int       `json:"post_id"`
	UserID    int       `json:"user_id"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
	User      *User     `json:"user,omitempty"`
}

type ForumVote struct {
	ID        int       `json:"id"`
	PostID    int       `json:"post_id"`
	UserID    int       `json:"user_id"`
	CreatedAt time.Time `json:"created_at"`
}

// GetForumPosts retrieves a list of forum posts with optional filtering and pagination
func GetForumPosts(db *sql.DB, sortBy string, page, limit int) ([]ForumPost, error) {
	offset := (page - 1) * limit
	
	orderBy := "score DESC"
	if sortBy == "newest" {
		orderBy = "created_at DESC"
	}
	
	// Debug pagination
	println("GetForumPosts: page=", page, "limit=", limit, "offset=", offset)
	
	query := `
		SELECT fp.id, fp.user_id, fp.title, fp.content, fp.url, fp.score, fp.created_at,
			u.id, u.username, u.fullname, u.is_admin, u.created_at
		FROM forum_posts fp
		JOIN users u ON fp.user_id = u.id
		ORDER BY ` + orderBy + `
		LIMIT ? OFFSET ?
	`
	
	rows, err := db.Query(query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	posts := []ForumPost{}
	for rows.Next() {
		var post ForumPost
		var user User
		
		var fullname sql.NullString
		err := rows.Scan(
			&post.ID, &post.UserID, &post.Title, &post.Content, &post.URL, &post.Score, &post.CreatedAt,
			&user.ID, &user.Username, &fullname, &user.IsAdmin, &user.CreatedAt,
		)
		if fullname.Valid {
			user.Fullname = fullname.String
		}
		if err != nil {
			return nil, err
		}
		
		post.User = &user
		posts = append(posts, post)
	}
	
	if err := rows.Err(); err != nil {
		return nil, err
	}
	
	return posts, nil
}

// GetForumPostByID retrieves a single forum post with comments
func GetForumPostByID(db *sql.DB, postID int, currentUserID int) (*ForumPost, error) {
	// Get post with user info
	postQuery := `
		SELECT fp.id, fp.user_id, fp.title, fp.content, fp.url, fp.score, fp.created_at,
			u.id, u.username, u.fullname, u.is_admin, u.created_at
		FROM forum_posts fp
		JOIN users u ON fp.user_id = u.id
		WHERE fp.id = ?
	`
	
	var post ForumPost
	var user User
	
	var fullname sql.NullString
	err := db.QueryRow(postQuery, postID).Scan(
		&post.ID, &post.UserID, &post.Title, &post.Content, &post.URL, &post.Score, &post.CreatedAt,
		&user.ID, &user.Username, &fullname, &user.IsAdmin, &user.CreatedAt,
	)
	
	if fullname.Valid {
		user.Fullname = fullname.String
	}
	
	if err != nil {
		return nil, err
	}
	
	post.User = &user
	
	// Get vote status for current user
	voteQuery := `
		SELECT 1 FROM forum_votes 
		WHERE post_id = ? AND user_id = ?
	`
	
	var voteStatus int
	err = db.QueryRow(voteQuery, postID, currentUserID).Scan(&voteStatus)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	
	if err != sql.ErrNoRows {
		post.VoteStatus = &voteStatus
	}
	
	// Initialize empty comments array
	post.Comments = []ForumComment{}
	
	// Get comments with user info
	commentsQuery := `
		SELECT c.id, c.post_id, c.user_id, c.content, c.created_at,
			u.id, u.username, u.fullname, u.is_admin, u.created_at
		FROM forum_comments c
		JOIN users u ON c.user_id = u.id
		WHERE c.post_id = ?
		ORDER BY c.created_at ASC
	`
	
	rows, err := db.Query(commentsQuery, postID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	for rows.Next() {
		var comment ForumComment
		var commentUser User
		
		var fullname sql.NullString
		err := rows.Scan(
			&comment.ID, &comment.PostID, &comment.UserID, &comment.Content, &comment.CreatedAt,
			&commentUser.ID, &commentUser.Username, &fullname, &commentUser.IsAdmin, &commentUser.CreatedAt,
		)
		
		if fullname.Valid {
			commentUser.Fullname = fullname.String
		}
		if err != nil {
			return nil, err
		}
		
		comment.User = &commentUser
		post.Comments = append(post.Comments, comment)
	}
	
	if err := rows.Err(); err != nil {
		return nil, err
	}
	
	return &post, nil
}

// CreateForumPost adds a new forum post
func CreateForumPost(db *sql.DB, userID int, title, content, url string) (int, error) {
	query := `
		INSERT INTO forum_posts (user_id, title, content, url)
		VALUES (?, ?, ?, ?)
	`
	
	result, err := db.Exec(query, userID, title, content, url)
	if err != nil {
		return 0, err
	}
	
	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}
	
	return int(id), nil
}

// CreateForumComment adds a new comment to a post
func CreateForumComment(db *sql.DB, postID, userID int, content string) (int, error) {
	query := `
		INSERT INTO forum_comments (post_id, user_id, content)
		VALUES (?, ?, ?)
	`
	
	result, err := db.Exec(query, postID, userID, content)
	if err != nil {
		return 0, err
	}
	
	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}
	
	return int(id), nil
}

// VoteForumPost adds or removes a vote for a post
func VoteForumPost(db *sql.DB, postID, userID int) error {
	// Check if vote already exists
	var voteExists int
	err := db.QueryRow("SELECT COUNT(*) FROM forum_votes WHERE post_id = ? AND user_id = ?", postID, userID).Scan(&voteExists)
	if err != nil {
		return err
	}
	
	// Begin transaction
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	
	// Try to add vote or remove it if it already exists
	if voteExists == 0 {
		// Vote doesn't exist, add it
		_, err = tx.Exec("INSERT INTO forum_votes (post_id, user_id) VALUES (?, ?)", postID, userID)
		if err != nil {
			tx.Rollback()
			return err
		}
		
		// Increment score
		_, err = tx.Exec("UPDATE forum_posts SET score = score + 1 WHERE id = ?", postID)
		if err != nil {
			tx.Rollback()
			return err
		}
	} else {
		// Vote exists, remove it
		_, err = tx.Exec("DELETE FROM forum_votes WHERE post_id = ? AND user_id = ?", postID, userID)
		if err != nil {
			tx.Rollback()
			return err
		}
		
		// Decrement score
		_, err = tx.Exec("UPDATE forum_posts SET score = score - 1 WHERE id = ?", postID)
		if err != nil {
			tx.Rollback()
			return err
		}
	}
	
	// Commit transaction
	return tx.Commit()
}