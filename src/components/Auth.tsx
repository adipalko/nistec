import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus, AlertCircle, Mail } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../config/firebase';
import { trackLogin, trackEvent } from '../utils/analytics';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetPassword, setIsResetPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isResetPassword) {
      try {
        setError('');
        setSuccess('');
        setLoading(true);
        await sendPasswordResetEmail(auth, email);
        setSuccess('Password reset email sent! Check your inbox.');
      } catch (err) {
        setError('Failed to send reset email. Please check your email address.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      if (isLogin) {
        await login(email, password);
        trackLogin();
      } else {
        await signup(email, password);
        trackEvent('signup', 'authentication');
      }
    } catch (err) {
      setError(isLogin 
        ? 'Failed to sign in. Please check your credentials.'
        : 'Failed to create an account. Email might be already in use.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    setIsResetPassword(true);
    setError('');
    setSuccess('');
  };

  const handleBackToLogin = () => {
    setIsResetPassword(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isResetPassword 
              ? 'Reset your password' 
              : isLogin 
                ? 'Sign in to your account' 
                : 'Create a new account'
            }
          </h2>
          {!isResetPassword && (
            <p className="mt-2 text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccess('');
                }}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center p-4 text-red-600 bg-red-50 rounded-lg">
              <AlertCircle size={20} className="mr-2" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center p-4 text-green-600 bg-green-50 rounded-lg">
              <Mail size={20} className="mr-2" />
              <p className="text-sm">{success}</p>
            </div>
          )}
          
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {!isResetPassword && (
              <>
                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? "current-password" : "new-password"}
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {!isLogin && (
                  <div>
                    <label htmlFor="confirm-password" className="sr-only">
                      Confirm Password
                    </label>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {isLogin && !isResetPassword && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={handleResetPassword}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Forgot your password?
              </button>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`
                group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white
                ${loading 
                  ? 'bg-blue-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }
              `}
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                {isResetPassword ? (
                  <Mail className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                ) : isLogin ? (
                  <LogIn className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                ) : (
                  <UserPlus className="h-5 w-5 text-blue-500 group-hover:text-blue-400" />
                )}
              </span>
              {loading 
                ? (isResetPassword 
                    ? 'Sending reset email...' 
                    : isLogin 
                      ? 'Signing in...' 
                      : 'Creating account...'
                  ) 
                : (isResetPassword 
                    ? 'Send reset email' 
                    : isLogin 
                      ? 'Sign in' 
                      : 'Sign up'
                  )
              }
            </button>
          </div>

          {isResetPassword && (
            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Back to login
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Auth; 