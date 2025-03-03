import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForumContext } from '../contexts/ForumContext';
import { useAuth } from '../contexts/AuthContext';

const ForumPostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPost, loading, error, fetchPost, addComment, votePost } = useForumContext();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  useEffect(() => {
    // Convert string ID to number
    const postId = parseInt(id, 10);
    
    if (!isNaN(postId)) {
      fetchPost(postId);
    } else {
      navigate('/forum');
    }
  }, [id, fetchPost, navigate]);
  
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
  
  const handleVote = () => {
    if (!user) {
      return;
    }
    
    votePost(currentPost.id);
  };
  
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!comment.trim() || !user) {
      return;
    }
    
    setSubmitting(true);
    await addComment(currentPost.id, comment);
    setComment('');
    setSubmitting(false);
  };
  
  if (loading && !currentPost) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !currentPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <p className="text-red-500 text-center">{error || "Post not found"}</p>
          <div className="mt-4 text-center">
            <Link to="/forum" className="text-blue-500 hover:underline">
              ← Back to forum
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex">
          <div className="flex flex-col items-center mr-4">
            <button 
              onClick={handleVote}
              disabled={!user}
              className={`w-6 h-6 flex items-center justify-center rounded ${
                currentPost.vote_status ? 'text-orange-500' : 'text-gray-400 hover:text-orange-500'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className="text-center font-bold my-1">{currentPost.score}</span>
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{currentPost.title}</h1>
            
            {currentPost.url && (
              <a 
                href={currentPost.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-500 hover:underline text-sm block mt-1"
              >
                {currentPost.url}
              </a>
            )}
            
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Posted by <Link to={`/users/${currentPost.user.username}`} className="hover:underline">{currentPost.user.username}</Link> {timeSince(currentPost.created_at)}
            </div>
            
            {currentPost.content && (
              <div className="mt-4 text-gray-700 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none">
                {currentPost.content}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Comments section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">
          Comments ({currentPost.comments ? currentPost.comments.length : 0})
        </h2>
        
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-8">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What are your thoughts?"
              className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows="3"
            ></textarea>
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Comment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-700 rounded-md text-center">
            <p className="text-gray-700 dark:text-gray-300">
              <Link to="/login" className="text-blue-500 hover:underline">Log in</Link> to leave a comment
            </p>
          </div>
        )}
        
        {currentPost.comments && currentPost.comments.length > 0 ? (
          <div className="space-y-6">
            {currentPost.comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-1">
                      <Link to={`/users/${comment.user.username}`} className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {comment.user.username}
                      </Link>
                      <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                        {timeSince(comment.created_at)}
                      </span>
                    </div>
                    <div className="text-gray-700 dark:text-gray-300">
                      {comment.content}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-500 dark:text-gray-400">No comments yet</p>
          </div>
        )}
      </div>
      
      <div className="mt-6">
        <Link to="/forum" className="text-blue-500 hover:underline">
          ← Back to forum
        </Link>
      </div>
    </div>
  );
};

export default ForumPostDetail;