'use client';
import React, { useState } from 'react';
import { Eye, EyeOff, Package, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setLoading(true);
    setError('');

    const result = await login(username.trim(), password.trim());
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-theme1-bg flex items-center justify-center p-4">
      <div className="bg-theme1-sidebar rounded-2xl shadow-xl p-8 w-full max-w-md border border-theme1-primary/10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-theme1-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-theme1-bg" />
          </div>
          <h1 className="text-2xl font-bold text-theme1-primary">Admin Portal</h1>
          <p className="text-theme1-secondary mt-2">Sign in to manage orders</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-theme1-primary mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-3 border border-theme1-primary/20 rounded-lg focus:ring-2 focus:ring-theme1-tertiary focus:border-transparent transition-all duration-200 bg-theme1-bg text-theme1-primary"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-theme1-primary mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-theme1-primary/20 rounded-lg focus:ring-2 focus:ring-theme1-tertiary focus:border-transparent transition-all duration-200 pr-12 bg-theme1-bg text-theme1-primary"
                placeholder="Enter your password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-theme1-secondary hover:text-theme1-primary disabled:cursor-not-allowed"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-theme1-primary text-theme1-bg py-3 rounded-lg font-medium hover:bg-theme1-primary/90 focus:ring-2 focus:ring-theme1-tertiary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-theme1-bg mr-2"></div>
                Signing in...
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-theme1-secondary">
            Secure admin access only
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;