import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForumContext } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';

const ForumPost = ({ post }) => {
  const { votePost } = useForumContext();
  const { user } = useAuth();
  
  const timeSince = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };
  
  const handleVote = (e) => {
    e.preventDefault();
    e.stopPropagation();
    votePost(post.id);
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start">
        <div className="flex flex-col items-center mr-4">
          <button 
            onClick={handleVote}
            disabled={!user}
            className={`w-6 h-6 flex items-center justify-center rounded ${
              post.vote_status ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className="text-center font-bold my-1">{post.score}</span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-baseline">
            <Link to={`/forum/${post.id}`}>
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">{post.title}</h3>
            </Link>
            {post.url && (
              <a href={post.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs text-gray-500 hover:underline">
                {(() => {
                  try {
                    const url = new URL(post.url);
                    return `(${url.hostname})`;
                  } catch (e) {
                    return `(${post.url})`;
                  }
                })()}
              </a>
            )}
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Posted by <Link to={`/users/${post.user.username}`} className="hover:underline">{post.user.username}</Link> {timeSince(post.created_at)}
          </div>
          
          {post.content && (
            <div className="mt-2 text-gray-700 dark:text-gray-300">
              {post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}
            </div>
          )}
          
          <div className="mt-2">
            <Link to={`/forum/${post.id}`} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <span className="mr-2">💬</span>
              {post.comments ? post.comments.length : 0} comments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

function Forum() {
  const { posts, loading, error, sortBy, changeSort, nextPage } = useForumContext();
  const { user } = useAuth();
  
  if (loading && (!posts || posts.length === 0)) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error && (!posts || posts.length === 0)) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Error: {error}</p>
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">VibeCoders Forum</h1>
        <div className="flex space-x-4">
          <button 
            onClick={() => changeSort('top')}
            className={`px-3 py-1 rounded ${
              sortBy === 'top' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Top
          </button>
          <button 
            onClick={() => changeSort('newest')}
            className={`px-3 py-1 rounded ${
              sortBy === 'newest' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Newest
          </button>
          
          {user ? (
            <Link to="/forum/new" className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
              New Post
            </Link>
          ) : (
            <Link to="/login" className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">
              New Post
            </Link>
          )}
        </div>
      </div>
      
      {!posts || posts.length === 0 ? (
        <div className="text-center p-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No posts yet. Be the first to post!</p>
          {user ? (
            <Link to="/forum/new" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
              Create Post
            </Link>
          ) : (
            <Link to="/login" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Login to Post
            </Link>
          )}
        </div>
      ) : (
        <div>
          {posts.map(post => (
            <ForumPost key={post.id} post={post} />
          ))}
          
          <div className="mt-6 text-center">
            <button
              onClick={nextPage}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Forum;