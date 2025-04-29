import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-800 py-4 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-purple-500">andrewarrow.dev</Link>
          
          <nav className="flex space-x-4">
            <a href="/faq" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">FAQ</a>
            <Link to="/forum" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">Forum</Link>
            {!loading && (
              user ? (
                <>
                  <Link to="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">Profile</Link>
                  {user.is_admin && (
                    <Link to="/admin" className="text-yellow-400 hover:text-yellow-300 px-3 py-2 rounded-md">Admin</Link>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="text-gray-300 hover:text-white px-3 py-2 rounded-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">Login</Link>
                  <Link to="/register" className="text-gray-300 hover:text-white px-3 py-2 rounded-md">Register</Link>
                </>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>

      <footer className="bg-gray-800 py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-400">
            &copy; {new Date().getFullYear()} andrewarrow.dev. All rights reserved.
          </p>
          <div className="flex justify-center space-x-12 mt-6">
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
