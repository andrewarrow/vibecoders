import React from 'react';
import ReactDOM from 'react-dom/client';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';

import { AuthProvider } from './contexts/AuthContext';
import { ForumProvider } from './contexts/ForumContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Forum from './pages/Forum';
import ForumPost from './pages/ForumPost';
import NewPost from './pages/NewPost';
import Budget from './pages/Budget';
import Admin from './pages/Admin';
import AdminEditUser from './pages/AdminEditUser';
import MagicLink from './pages/MagicLink';
import MagicLinksPage from './pages/MagicLinksPage';
import TestPage from './pages/TestPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ForumProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route 
                path="profile" 
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } 
              />
              <Route path="users/:username" element={<UserProfile />} />
              <Route path="magic/:token" element={<MagicLink />} />
              <Route 
                path="magic-links" 
                element={
                  <ProtectedRoute>
                    <MagicLinksPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Test Route */}
              <Route path="test" element={<TestPage />} />
              
              {/* Forum Routes */}
              <Route path="forum">
                <Route index element={<Forum />} />
                <Route path=":id" element={<ForumPost />} />
                <Route 
                  path="new" 
                  element={
                    <ProtectedRoute>
                      <NewPost />
                    </ProtectedRoute>
                  } 
                />
              </Route>
              
              {/* Apps Routes */}
              <Route path="apps">
                <Route path="budget" element={
                  <ProtectedRoute>
                    <Budget />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Admin Routes */}
              <Route path="admin" element={<AdminRoute />}>
                <Route index element={<Admin />} />
                <Route path="users/:id" element={<AdminEditUser />} />
              </Route>
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ForumProvider>
    </AuthProvider>
  </React.StrictMode>
);