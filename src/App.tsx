import React, { useState, useEffect } from 'react';
import { PageRoute, UserProfile, ToastMessage, AppBranding, DEFAULT_BRANDING } from './types';
import { DEFAULT_USER, INITIAL_FOLDERS, INITIAL_FILES } from './utils/initialData';
import { ToastContainer } from './components/Toast';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeToAppBranding } from './services/vaultService';

export default function App() {
  // Page Routing State ('login' | 'register' | 'forgot-password' | 'dashboard')
  const [currentPage, setCurrentPage] = useState<PageRoute>(() => {
    return (localStorage.getItem('iffl_current_page') as PageRoute) || 'login';
  });

  // System Branding & Customization State
  const [branding, setBranding] = useState<AppBranding>(DEFAULT_BRANDING);

  // Subscribe to real-time branding changes from Firestore
  useEffect(() => {
    const unsub = subscribeToAppBranding((newBranding) => {
      setBranding(newBranding);
      if (newBranding.appName) {
        document.title = `${newBranding.appName} - Secure Cloud Vault`;
      }
    });
    return () => unsub();
  }, []);

  // Active User State
  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('iffl_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore parse error
      }
    }
    return DEFAULT_USER;
  });

  // Persist session state in localStorage
  useEffect(() => {
    localStorage.setItem('iffl_current_page', currentPage);
  }, [currentPage]);

  useEffect(() => {
    if (user && user.email) {
      localStorage.setItem('iffl_user_profile', JSON.stringify(user));
    }
  }, [user]);

  // Dark Mode state - default false (Light Cream / Olive Glassmorphism)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('iffl_theme') === 'dark';
  });

  // Toasts queue
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        const isLocalAdmin = firebaseUser.email.trim().toLowerCase() === 'admin@t.co';
        const displayName = firebaseUser.displayName || (isLocalAdmin ? 'Admin' : firebaseUser.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
        setUser((prev) => {
          const updated = {
            ...prev,
            name: displayName,
            email: firebaseUser.email!,
            role: isLocalAdmin ? 'Admin' : ('role' in prev ? (prev as any).role : 'User') as any,
          };
          localStorage.setItem('iffl_user_profile', JSON.stringify(updated));
          return updated;
        });
        // If current page is login or register, switch to dashboard
        setCurrentPage((prev) => {
          const next = (prev === 'login' || prev === 'register') ? 'dashboard' : prev;
          localStorage.setItem('iffl_current_page', next);
          return next;
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Apply dark class to <html> tag when darkMode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('iffl_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('iffl_theme', 'light');
    }
  }, [darkMode]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const newToast: ToastMessage = {
      id: `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      text,
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleLoginSuccess = (email: string, name?: string) => {
    const isLocalAdmin = email.
    
    trim().toLowerCase() === 'admin@t.co';
    const newUser = {
      ...user,
      email: email,
      name: name || (isLocalAdmin ? 'Admin' : email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (l) => l.toUpperCase())) || 'Alex Rivera',
      role: (isLocalAdmin ? 'Admin' : 'User') as any,
    };
    setUser(newUser);
    localStorage.setItem('iffl_user_profile', JSON.stringify(newUser));
    setCurrentPage('dashboard');
    localStorage.setItem('iffl_current_page', 'dashboard');
  };

  const handleRegisterSuccess = (name: string, email: string) => {
    const newUser = {
      ...user,
      name,
      email,
      role: 'User' as any,
    };
    setUser(newUser);
    localStorage.setItem('iffl_user_profile', JSON.stringify(newUser));
    setCurrentPage('dashboard');
    localStorage.setItem('iffl_current_page', 'dashboard');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.removeItem('iffl_current_page');
    localStorage.removeItem('iffl_user_profile');
    addToast('You have been logged out securely.', 'info');
    setCurrentPage('login');
  };

  return (
    <div className="min-h-screen bg-cream dark:bg-slate-950 font-sans text-slate-900 dark:text-cream transition-colors duration-300">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Pages */}
      {currentPage === 'login' && (
        <LoginPage
          onNavigate={(route) => setCurrentPage(route)}
          onLoginSuccess={handleLoginSuccess}
          showToast={addToast}
          branding={branding}
        />
      )}

      {currentPage === 'register' && (
        <RegisterPage
          onNavigate={(route) => setCurrentPage(route)}
          onRegisterSuccess={handleRegisterSuccess}
          showToast={addToast}
          branding={branding}
        />
      )}

      {currentPage === 'dashboard' && (
        <DashboardPage
          user={user}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onLogout={handleLogout}
          onNavigate={(route) => setCurrentPage(route)}
          showToast={addToast}
          initialFolders={INITIAL_FOLDERS}
          initialFiles={INITIAL_FILES}
          branding={branding}
        />
      )}
    </div>
  );
}
