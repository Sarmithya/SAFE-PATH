import React, { createContext, useState, useEffect, useContext } from 'react';
import { ApiService, setAuthToken } from '../services/api';

const AuthContext = createContext({});

const storage = {
  getItem: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return null;
    } catch (e) {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
  },
  removeItem: async (key) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [pendingIdentifier, setPendingIdentifier] = useState('');

  // 1. Session Restoration on App Startup
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await storage.getItem('safepath_token');
        if (storedToken) {
          setAuthToken(storedToken);
          const res = await ApiService.getProfile();
          if (res.user) {
            setUser(res.user);
            setIsAuthenticated(true);
          } else {
            await storage.removeItem('safepath_token');
            setAuthToken(null);
          }
        }
      } catch (e) {
        await storage.removeItem('safepath_token');
        setAuthToken(null);
      } finally {
        setIsInitializing(false);
      }
    };
    restoreSession();
  }, []);

  // 2. Login Action
  const login = async (identifier, password) => {
    setLoading(true);
    try {
      const res = await ApiService.login(identifier, password);
      if (res.token) {
        await storage.setItem('safepath_token', res.token);
        setAuthToken(res.token);
        setUser(res.user);
        setIsAuthenticated(true);
        setRequiresVerification(false);
        return { success: true };
      }
      return { success: false, error: 'Unexpected login response' };
    } catch (err) {
      if (err.message && err.message.includes('unverified')) {
        setPendingIdentifier(identifier);
        setRequiresVerification(true);
      }
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 3. Register Action
  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await ApiService.register(userData);
      if (res.requires_verification) {
        setPendingIdentifier(userData.email);
        setRequiresVerification(true);
        return { success: true, requiresVerification: true, dev_otp: res.dev_otp };
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 4. Verify OTP Action
  const verifyOtp = async (otp) => {
    setLoading(true);
    try {
      const res = await ApiService.verifyOtp(pendingIdentifier, otp);
      if (res.token) {
        await storage.setItem('safepath_token', res.token);
        setAuthToken(res.token);
        setUser(res.user);
        setIsAuthenticated(true);
        setRequiresVerification(false);
        return { success: true, user: res.user };
      }
      return { success: false, error: 'OTP verification failed' };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 5. Resend OTP Action
  const resendOtp = async () => {
    setLoading(true);
    try {
      const res = await ApiService.resendOtp(pendingIdentifier);
      return { success: true, dev_otp: res.dev_otp };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 6. Forgot Password Action
  const forgotPassword = async (identifier) => {
    setLoading(true);
    try {
      const res = await ApiService.forgotPassword(identifier);
      setPendingIdentifier(identifier);
      return { success: true, dev_otp: res.dev_otp };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 7. Reset Password Action
  const resetPassword = async (otp, newPassword, confirmPassword) => {
    setLoading(true);
    try {
      const res = await ApiService.resetPassword({
        identifier: pendingIdentifier,
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      return { success: true, message: res.message };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 8. Profile Setup Action (Onboarding)
  const updateProfileSetup = async (payload) => {
    setLoading(true);
    try {
      const res = await ApiService.updateProfileSetup(payload);
      if (res.user) {
        setUser(res.user);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // 9. Logout Action
  const logout = async () => {
    await storage.removeItem('safepath_token');
    setAuthToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setRequiresVerification(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitializing,
        loading,
        requiresVerification,
        pendingIdentifier,
        login,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        updateProfileSetup,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
