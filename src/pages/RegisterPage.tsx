import React, { useState } from 'react';
import { PageRoute, AppBranding, DEFAULT_BRANDING } from '../types';
import { PasswordGenerator } from '../components/PasswordGenerator';
import { AppLogo } from '../components/AppLogo';
import { Footer } from '../components/Footer';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface RegisterPageProps {
  onNavigate: (route: PageRoute) => void;
  onRegisterSuccess: (name: string, email: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  branding?: AppBranding;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onNavigate,
  onRegisterSuccess,
  showToast,
  branding = DEFAULT_BRANDING,
}) => {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dynamic error states
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateName = (val: string) => {
    if (!val.trim()) return 'Full name is required.';
    if (val.trim().length < 2) return 'Name must be at least 2 characters.';
    return null;
  };

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val.trim())) return 'Please enter a valid email format (e.g. user@domain.com).';
    return null;
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required.';
    if (val.length < 8) return 'Password must be at least 8 characters long.';
    return null;
  };

  const validateConfirmPassword = (val: string, currentPwd: string) => {
    if (!val) return 'Please confirm your password.';
    if (val !== currentPwd) return 'Passwords do not match. Please verify.';
    return null;
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errName = validateName(fullName);
    const errEmail = validateEmail(email);
    const errPwd = validatePassword(password);
    const errConfirm = validateConfirmPassword(confirmPassword, password);

    setNameError(errName);
    setEmailError(errEmail);
    setPasswordError(errPwd);
    setConfirmError(errConfirm);

    if (errName || errEmail || errPwd || errConfirm) {
      return;
    }

    setGeneralError(null);
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: fullName.trim()
        });

        // Save user to Firestore collection
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          name: fullName.trim(),
          email: email.trim().toLowerCase(),
          role: 'User',
          status: 'active',
          password: password,
          storageLimitMB: 985,
          createdAt: new Date().toISOString()
        });
      }
      showToast('Account created successfully in Firebase Auth! Welcome aboard.', 'success');
      onRegisterSuccess(fullName.trim(), email.trim());
    } catch (err: any) {
      console.warn('Firebase Auth Registration Error:', err);
      let errMsg = 'Failed to create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = 'An account with this email address already exists. Please sign in instead.';
        setEmailError('This email is already registered.');
      } else if (err.code === 'auth/invalid-email') {
        errMsg = 'The email address format is invalid.';
        setEmailError(errMsg);
      } else if (err.code === 'auth/weak-password') {
        errMsg = 'Password is too weak. Please use at least 8 characters.';
        setPasswordError(errMsg);
      } else if (err.message) {
        errMsg = err.message.replace('Firebase: ', '');
      }
      setGeneralError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyGeneratedPassword = (pwd: string) => {
    setPassword(pwd);
    setConfirmPassword(pwd);
    setPasswordError(null);
    setConfirmError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cream dark:bg-slate-950 text-slate-900 dark:text-cream transition-colors duration-300 relative overflow-hidden">
      {/* Decorative background glow elements */}
      <div className="absolute top-10 right-10 w-80 h-80 bg-olive-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-olive-sage/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-5 relative z-10 my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <AppLogo branding={branding} iconSize={32} badgeSize="w-14 h-14" textSize="text-2xl" />
          <p className="text-xs text-olive-dark dark:text-olive-sage font-semibold tracking-wide">
            Create Account • Zero-Knowledge Encrypted Vault
          </p>
        </div>

        {/* Register Card */}
        <div className="glass-modal p-6 rounded-2xl shadow-2xl space-y-4 border border-olive-sage/30">
          <div className="border-b border-olive-sage/20 pb-2">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-cream">
              Create New Account
            </h2>
          </div>

          {generalError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium">
              {generalError}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-2.5 text-olive-sage" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (nameError) setNameError(validateName(e.target.value));
                  }}
                  placeholder="Alex Rivera"
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-base md:text-sm bg-white/70 dark:bg-slate-800/70 border ${
                    nameError ? 'border-red-500 focus:ring-red-500' : 'border-olive-sage/40 focus:ring-olive-primary'
                  } text-slate-900 dark:text-cream placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors`}
                />
              </div>
              {nameError && <p className="text-xs text-red-500 font-medium mt-1">{nameError}</p>}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-2.5 text-olive-sage" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(validateEmail(e.target.value));
                  }}
                  placeholder="alex.rivera@iffl.cloud"
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-base md:text-sm bg-white/70 dark:bg-slate-800/70 border ${
                    emailError ? 'border-red-500 focus:ring-red-500' : 'border-olive-sage/40 focus:ring-olive-primary'
                  } text-slate-900 dark:text-cream placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors`}
                />
              </div>
              {emailError && <p className="text-xs text-red-500 font-medium mt-1">{emailError}</p>}
            </div>

            {/* Password Generator Tool */}
            <PasswordGenerator
              onSelectPassword={handleApplyGeneratedPassword}
              showToast={showToast}
            />

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-2.5 text-olive-sage" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(validatePassword(e.target.value));
                    if (confirmPassword) setConfirmError(validateConfirmPassword(confirmPassword, e.target.value));
                  }}
                  placeholder="Min 8 characters"
                  className={`w-full pl-10 pr-10 py-2 rounded-xl text-base md:text-sm bg-white/70 dark:bg-slate-800/70 border ${
                    passwordError ? 'border-red-500 focus:ring-red-500' : 'border-olive-sage/40 focus:ring-olive-primary'
                  } text-slate-900 dark:text-cream placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-olive-sage hover:text-olive-primary dark:hover:text-cream transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordError && <p className="text-xs text-red-500 font-medium mt-1">{passwordError}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Confirm Password
              </label>
              <div className="relative">
                <Shield size={18} className="absolute left-3 top-2.5 text-olive-sage" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmError) setConfirmError(validateConfirmPassword(e.target.value, password));
                  }}
                  placeholder="Re-enter password"
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-base md:text-sm bg-white/70 dark:bg-slate-800/70 border ${
                    confirmError ? 'border-red-500 focus:ring-red-500' : 'border-olive-sage/40 focus:ring-olive-primary'
                  } text-slate-900 dark:text-cream placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors`}
                />
              </div>
              {confirmError && <p className="text-xs text-red-500 font-medium mt-1">{confirmError}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-olive-primary hover:bg-olive-dark text-white shadow-lg shadow-olive-primary/25 transition-all flex items-center justify-center gap-2 active:scale-98 mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account & Provision Storage</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-3 border-t border-olive-sage/20 text-center text-xs text-slate-600 dark:text-slate-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('login')}
              className="font-bold text-olive-primary dark:text-olive-sage hover:underline"
            >
              Sign In Here
            </button>
          </div>
        </div>

        {/* Global Footer */}
        <Footer branding={branding} className="mt-6 border-t-0 bg-transparent py-2" />
      </div>
    </div>
  );
};
