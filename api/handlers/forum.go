package handlers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"

	"vibecoders/models"
)

// ForumPostRequest defines the structure for creating a new forum post
type ForumPostRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	URL     string `json:"url"`
}

// ForumCommentRequest defines the structure for creating a new comment
type ForumCommentRequest struct {
	Content string `json:"content"`
}

// GetForumPostsHandler retrieves a list of forum posts with optional filtering and pagination
func GetForumPostsHandler(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		sortBy := c.QueryParam("sort")
		if sortBy == "" {
			sortBy = "top" // Default sort by score
		}

		page, err := strconv.Atoi(c.QueryParam("page"))
		if err != nil || page < 1 {
			page = 1
		}

		limit, err := strconv.Atoi(c.QueryParam("limit"))
		if err != nil || limit < 1 || limit > 100 {
			limit = 20 // Default limit
		}

		posts, err := models.GetForumPosts(db, sortBy, page, limit)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error retrieving forum posts: " + err.Error(),
			})
		}

		return c.JSON(http.StatusOK, posts)
	}
}

// GetForumPostHandler retrieves a single forum post with comments
func GetForumPostHandler(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		postID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid post ID",
			})
		}

		// Get current user ID from session (or use 0 for anonymous users)
		var userID int = 0
		session, err := sessionFromContext(c)
		if err == nil {
			// User is logged in
			userID = session.UserID
		}

		post, err := models.GetForumPostByID(db, postID, userID)
		if err != nil {
			if err == sql.ErrNoRows {
				return c.JSON(http.StatusNotFound, map[string]string{
					"error": "Post not found",
				})
			} else {
				return c.JSON(http.StatusInternalServerError, map[string]string{
					"error": "Error retrieving post: " + err.Error(),
				})
			}
		}

		return c.JSON(http.StatusOK, post)
	}
}

// CreateForumPostHandler adds a new forum post
func CreateForumPostHandler(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		// Get current user ID from session
		session, err := sessionFromContext(c)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Unauthorized",
			})
		}

		var req ForumPostRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request body",
			})
		}

		if req.Title == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Title is required",
			})
		}

		postID, err := models.CreateForumPost(db, session.UserID, req.Title, req.Content, req.URL)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error creating post: " + err.Error(),
			})
		}

		post, err := models.GetForumPostByID(db, postID, session.UserID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error retrieving created post: " + err.Error(),
			})
		}

		return c.JSON(http.StatusCreated, post)
	}
}

// CreateForumCommentHandler adds a new comment to a post
func CreateForumCommentHandler(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		postID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid post ID",
			})
		}

		// Get current user ID from session
		session, err := sessionFromContext(c)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Unauthorized",
			})
		}

		var req ForumCommentRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid request body",
			})
		}

		if req.Content == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Comment content is required",
			})
		}

		_, err = models.CreateForumComment(db, postID, session.UserID, req.Content)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error creating comment: " + err.Error(),
			})
		}

		post, err := models.GetForumPostByID(db, postID, session.UserID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error retrieving updated post: " + err.Error(),
			})
		}

		return c.JSON(http.StatusCreated, post)
	}
}

// VoteForumPostHandler adds or removes a vote for a post
func VoteForumPostHandler(db *sql.DB) echo.HandlerFunc {
	return func(c echo.Context) error {
		postID, err := strconv.Atoi(c.Param("id"))
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error": "Invalid post ID",
			})
		}

		// Get current user ID from session
		session, err := sessionFromContext(c)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error": "Unauthorized",
			})
		}

		err = models.VoteForumPost(db, postID, session.UserID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error voting for post: " + err.Error(),
			})
		}

		post, err := models.GetForumPostByID(db, postID, session.UserID)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error": "Error retrieving updated post: " + err.Error(),
			})
		}

		return c.JSON(http.StatusOK, post)
	}
}
