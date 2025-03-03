import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForumContext } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';

const NewPost = () => {
  const { createPost } = useForumContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // URL validation function
  const isValidURL = (string) => {
    try {
      if (string === '') return true; // Empty URL is valid
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!content.trim() && !url.trim()) {
      setError('Either content or URL is required');
      return;
    }
    
    if (url && !isValidURL(url)) {
      setError('Please enter a valid URL (e.g., https://example.com)');
      return;
    }
    
    setError('');
    setSubmitting(true);
    
    try {
      const newPost = await createPost(title, content, url);
      if (newPost) {
        navigate(`/forum/${newPost.id}`);
      } else {
        setError('Failed to create post. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
      setSubmitting(false);
    }
  };
  
  // Redirect if not logged in
  if (!user) {
    navigate('/login', { state: { from: '/forum/new' } });
    return null;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create a New Post</h1>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="title">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="An interesting title"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="url">
              URL (optional)
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="https://example.com"
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="content">
              Content (optional)
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="6"
              placeholder="Text (optional)"
            ></textarea>
          </div>
          
          <div className="flex items-center justify-between">
            <Link to="/forum" className="text-blue-500 hover:underline">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPost;