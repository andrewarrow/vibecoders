import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Add a component-level debug log
console.log('MagicLinksPage module loaded');

const MagicLinksPage = () => {
  console.log('MagicLinksPage component rendering');
  const {
    user,
    createMagicLink,
    getUserMagicLinks,
    deleteMagicLink
  } = useAuth();

  // Magic Links state
  const [magicLinks, setMagicLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMagicLinks();
  }, []);

  const fetchMagicLinks = async () => {
    setLoading(true);
    try {
      const result = await getUserMagicLinks();
      if (result.success) {
        // Make sure magicLinks is always an array, even if the backend returns null
        setMagicLinks(result.magicLinks || []);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to fetch magic links');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMagicLink = async () => {
    setSuccess('');
    setError('');
    setLoading(true);
    
    try {
      const result = await createMagicLink();
      
      if (result.success) {
        setSuccess('Magic link created successfully!');
        // Add the new magic link to the local state
        setMagicLinks([result.magicLink, ...magicLinks]);
      } else {
        setError(result.error || 'Failed to create magic link');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMagicLink = async (linkId) => {
    if (!window.confirm('Are you sure you want to delete this magic link?')) {
      return;
    }
    
    setLoading(true);
    try {
      const result = await deleteMagicLink(linkId);
      if (result.success) {
        setSuccess('Magic link deleted successfully!');
        setMagicLinks(magicLinks.filter(link => link.id !== linkId));
      } else {
        setError(result.error || 'Failed to delete magic link');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-300">Please log in to manage your magic links.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-purple-500">Magic Links</h2>
        <button
          onClick={handleCreateMagicLink}
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create New Magic Link'}
        </button>
      </div>
      
      {/* Success and Error Messages */}
      {success && (
        <div className="bg-green-500 text-white p-3 rounded-md mb-4">
          {success}
        </div>
      )}
      
      {error && (
        <div className="bg-red-500 text-white p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <p className="text-gray-300 mb-6">
        Magic links allow you to share a special URL that will automatically log in anyone who clicks it.
        These are useful for sharing access to your account without revealing your password.
      </p>
      
      {loading && (!magicLinks || !magicLinks.length) ? (
        <div className="flex justify-center items-center h-40">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : magicLinks.length > 0 ? (
        <div className="space-y-4">
          <div className="bg-gray-700 p-4 rounded-lg mb-4">
            <h3 className="text-xl font-semibold text-white mb-2">How to use magic links:</h3>
            <ol className="list-decimal pl-5 text-gray-300 space-y-2">
              <li>Copy the magic link URL</li>
              <li>Share it with someone you trust</li>
              <li>When they click the link, they'll be automatically logged in as you</li>
              <li>Magic links expire after 7 days</li>
            </ol>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700 text-purple-400">
                <tr>
                  <th className="py-3 px-4 rounded-tl-lg">Link</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4">Expires</th>
                  <th className="py-3 px-4 rounded-tr-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {magicLinks.map(link => {
                  const url = `${window.location.origin}/magic/${link.token}`;
                  return (
                    <tr key={link.id} className="bg-gray-800 hover:bg-gray-700">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={url}
                            readOnly
                            className="bg-gray-900 text-gray-300 px-3 py-1 rounded text-xs w-48 lg:w-72 cursor-text"
                            onClick={(e) => e.target.select()}
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(url);
                              setSuccess('Link copied to clipboard!');
                              setTimeout(() => setSuccess(''), 2000);
                            }}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Copy
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {formatDate(link.created_at)}
                      </td>
                      <td className="py-3 px-4 text-gray-300 text-sm">
                        {formatDate(link.expires_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteMagicLink(link.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-gray-700 p-6 rounded-lg text-center">
          <p className="text-gray-300 mb-4">You don't have any magic links yet.</p>
          <p className="text-gray-400 mb-6">Create your first magic link using the button above!</p>
          
          <div className="bg-gray-800 p-4 rounded-lg text-left">
            <h3 className="text-lg font-semibold text-white mb-2">What are magic links?</h3>
            <p className="text-gray-300 mb-2">
              Magic links are special URLs that automatically log in anyone who clicks them.
              They're a convenient way to:
            </p>
            <ul className="list-disc pl-5 text-gray-300 space-y-1">
              <li>Share your account with collaborators</li>
              <li>Log in on different devices without entering your password</li>
              <li>Provide temporary access to your account</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MagicLinksPage;