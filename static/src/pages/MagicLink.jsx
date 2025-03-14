import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MagicLink = () => {
  const { token } = useParams();
  const { loginWithMagicLink, user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    // Skip all UI and directly navigate if already logged in
    if (user) {
      navigate('/');
      return;
    }

    const handleMagicLink = async () => {
      setStatus('loading');
      
      try {
        const result = await loginWithMagicLink(token);
        
        if (result.success) {
          // Immediately redirect to the specified URL
          navigate(result.redirectURL || '/profile', { replace: true });
          return; // Skip setting success state since we're navigating away
        } else {
          setStatus('error');
          setError(result.error);
        }
      } catch (err) {
        setStatus('error');
        setError('An unexpected error occurred');
      }
    };

    handleMagicLink();
  }, [token, loginWithMagicLink, navigate, user]);

  // Only render UI for error state since success redirects immediately
  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Magic Link Login</h1>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full mx-auto flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-400 text-lg font-medium mb-2">Login Failed</p>
            <p className="text-gray-300 mb-4">{error || 'This magic link is invalid or has expired.'}</p>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary w-full"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // For loading state, render an empty div with just a spinner
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default MagicLink;