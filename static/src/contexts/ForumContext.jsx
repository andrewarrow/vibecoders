import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ForumContext = createContext();

export const useForumContext = () => useContext(ForumContext);

export const ForumProvider = ({ children }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [allPosts, setAllPosts] = useState([]); // For pagination
  const [currentPost, setCurrentPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('top');
  const [page, setPage] = useState(1);

  const fetchPosts = async (isNextPage = false, pageNum = page) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`Fetching posts: page=${pageNum}, sort=${sortBy}, isNextPage=${isNextPage}`);
      
      const response = await fetch(`/api/forum?sort=${sortBy}&page=${pageNum}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} posts from server`);
      
      // If this is a "next page" request, append to existing posts
      if (isNextPage) {
        // Update both allPosts and posts
        setAllPosts(prevPosts => {
          const newPosts = [...prevPosts, ...(data || [])];
          console.log(`Updated allPosts, now has ${newPosts.length} posts`);
          return newPosts;
        });
        setPosts(prevPosts => {
          const newPosts = [...prevPosts, ...(data || [])];
          console.log(`Updated posts, now has ${newPosts.length} posts`);
          return newPosts;
        });
      } else {
        setAllPosts(data || []);
        setPosts(data || []);
        console.log(`Reset posts, now has ${data.length} posts`);
      }
    } catch (err) {
      console.error('Error fetching posts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPost = async (postId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/forum/${postId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch post');
      }
      
      const data = await response.json();
      setCurrentPost(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (title, content, url) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/forum', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, url }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      const newPost = await response.json();
      setPosts([newPost, ...posts]);
      return newPost;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const addComment = async (postId, content) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/forum/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to add comment');
      }
      
      const updatedPost = await response.json();
      setCurrentPost(updatedPost);
      return updatedPost;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const votePost = async (postId) => {
    if (!user) {
      setError('You must be logged in to vote');
      return null;
    }
    
    try {
      const response = await fetch(`/api/forum/${postId}/vote`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to vote on post');
      }
      
      const updatedPost = await response.json();
      
      // Update the current post if we're viewing it
      if (currentPost && currentPost.id === updatedPost.id) {
        setCurrentPost(updatedPost);
      }
      
      // Update the post in the list if it exists there
      setPosts(posts.map(post => 
        post.id === updatedPost.id ? updatedPost : post
      ));
      
      return updatedPost;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  const changeSort = (newSortBy) => {
    console.log(`Changing sort to ${newSortBy}`);
    setSortBy(newSortBy);
    setPage(1); // Reset to first page when changing sort
    setAllPosts([]); // Clear all posts when changing sort
  };

  const nextPage = async () => {
    console.log(`Loading next page, current page: ${page}`);
    const nextPageNum = page + 1;
    console.log(`New page will be: ${nextPageNum}`);
    setPage(nextPageNum);
    
    // Manually build the URL and fetch for debugging
    const url = `/api/forum?sort=${sortBy}&page=${nextPageNum}&limit=20`;
    console.log(`Fetching from URL: ${url}`);
    
    try {
      setLoading(true);
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch next page');
      }
      
      const data = await response.json();
      console.log(`Loaded ${data.length} posts for page ${nextPageNum}`);
      
      // Manually append posts
      setPosts(currentPosts => {
        const newPosts = [...currentPosts, ...(data || [])];
        console.log(`Posts are now ${newPosts.length} (prev: ${currentPosts.length}, new: ${data.length})`);
        return newPosts;
      });
    } catch (err) {
      console.error('Error in nextPage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch on sort changes, not page changes (we handle page changes manually)
    if (page === 1) {
      fetchPosts();
    }
  }, [sortBy]);
  
  // Initial fetch on mount
  useEffect(() => {
    fetchPosts();
  }, []);

  const value = {
    posts,
    currentPost,
    loading,
    error,
    sortBy,
    page,
    fetchPosts,
    fetchPost,
    createPost,
    addComment,
    votePost,
    changeSort,
    nextPage,
  };

  return (
    <ForumContext.Provider value={value}>
      {children}
    </ForumContext.Provider>
  );
};

export default ForumContext;