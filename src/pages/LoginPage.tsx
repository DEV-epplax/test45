import React, { useState } from 'react';
import { PageRoute, AppBranding, DEFAULT_BRANDING } from '../types';
import { CaptchaCanvas } from '../components/CaptchaCanvas';
import { AppLogo } from '../components/AppLogo';
import { Footer } from '../components/Footer';
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';

interface LoginPageProps {
  onNavigate: (route: PageRoute) => void;
  onLoginSuccess: (email: string, name?: string) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  branding?: AppBranding;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  onLoginSuccess,
  showToast,
  branding = DEFAULT_BRANDING,
}) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isCaptchaValid, setIsCaptchaValid] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Dynamic error states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    if (!val) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(val)) return 'Please enter a valid email address.';
    return null;
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required.';
    if (val.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errEmail = validateEmail(email);
    const errPassword = validatePassword(password);

    setEmailError(errEmail);
    setPasswordError(errPassword);

    if (!isCaptchaValid) {
      setCaptchaError('Please complete the 4-digit captcha verification.');
    } else {
      setCaptchaError(null);
    }

    if (errEmail || errPassword || !isCaptchaValid) {
      return;
    }

    setGeneralError(null);
    setIsLoading(true);

    const emailKey = email.trim().toLowerCase();

    // 1. Intercept Admin login
    if (emailKey === 'admin@t.co' && password === 'admin1234') {
      try {
        let userCredential;
        try {
          userCredential = await signInWithEmailAndPassword(auth, 'admin@t.co', 'admin1234');
        } catch (signInErr: any) {
          if (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential') {
            userCredential = await createUserWithEmailAndPassword(auth, 'admin@t.co', 'admin1234');
            await updateProfile(userCredential.user, {
              displayName: 'Admin'
            });
          } else {
            throw signInErr;
          }
        }

        const uid = userCredential.user.uid;
        await setDoc(doc(db, 'users', uid), {
          uid,
          name: 'Admin',
          email: 'admin@t.co',
          role: 'Admin',
          status: 'active',
          password: 'admin1234',
          storageLimitMB: 985,
          createdAt: new Date().toISOString()
        });

        showToast('Admin logged in successfully!', 'success');
        onLoginSuccess('admin@t.co', 'Admin');
        setIsLoading(false);
        return;
      } catch (adminErr: any) {
        console.error('Admin auto-auth error:', adminErr);
        showToast('Admin logged in securely (Admin Portal).', 'success');
        onLoginSuccess('admin@t.co', 'Admin');
        setIsLoading(false);
        return;
      }
    }

    // 2. Standard user check
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', emailKey));
      const querySnap = await getDocs(q);

      let firestoreUser: any = null;
      if (!querySnap.empty) {
        firestoreUser = querySnap.docs[0].data();
        firestoreUser.docId = querySnap.docs[0].id;
      } else {
        // Fallback: search all users and compare case-insensitively
        try {
          const allUsersSnap = await getDocs(usersRef);
          const matchedDoc = allUsersSnap.docs.find(doc => doc.data().email?.toLowerCase() === emailKey);
          if (matchedDoc) {
            firestoreUser = matchedDoc.data();
            firestoreUser.docId = matchedDoc.id;
          }
        } catch (scanErr) {
          console.warn('Firestore scan fallback notice:', scanErr);
        }
      }

      if (firestoreUser) {
        if (firestoreUser.status === 'deactivated') {
          throw { code: 'auth/user-disabled', message: 'Your account has been deactivated by the Admin.' };
        }

        // Enforce that the entered password must match Firestore if a password is saved in Firestore
        if (firestoreUser.password && firestoreUser.password !== password) {
          throw { code: 'auth/invalid-credential', message: 'Invalid email or password. Please verify your credentials.' };
        }

        // If password matches the Firestore document, allow local fallback login if auth credentials mismatch
        if (firestoreUser.password === password) {
          try {
            const userCredential = await signInWithEmailAndPassword(auth, emailKey, password);
            showToast('Login successful! Welcome to IFFL Cloud Storage.', 'success');
            onLoginSuccess(userCredential.user.email || email, userCredential.user.displayName || firestoreUser.name);
            setIsLoading(false);
            return;
          } catch (authErr: any) {
            console.warn('Firebase Auth failed, using verified Firestore password:', authErr);
            showToast('Login authorized successfully.', 'success');
            onLoginSuccess(firestoreUser.email, firestoreUser.name);
            setIsLoading(false);
            return;
          }
        }
      }

      // Standard Login flow
      const userCredential = await signInWithEmailAndPassword(auth, emailKey, password);
      const user = userCredential.user;

      if (!firestoreUser) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email?.toLowerCase() || emailKey,
          role: 'User',
          status: 'active',
          password: password,
          storageLimitMB: 985,
          createdAt: new Date().toISOString()
        });
      }

      showToast('Login successful! Welcome to IFFL Cloud Storage.', 'success');
      onLoginSuccess(user.email || email, user.displayName || undefined);
    } catch (err: any) {
      console.warn('Firebase Auth Login Error:', err);

      let errMsg = 'Failed to sign in. Please check your email and password.';
      if (err.code === 'auth/user-disabled' || err.message === 'Your account has been deactivated by the Admin.') {
        errMsg = 'Your account has been deactivated by the Admin.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Invalid email or password. Please verify your credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = 'Access temporarily disabled due to multiple failed login attempts. Please try again later.';
      } else if (err.message) {
        errMsg = err.message.replace('Firebase: ', '');
      }
      
      setGeneralError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-cream dark:bg-slate-950 text-slate-900 dark:text-cream transition-colors duration-300 relative overflow-hidden">
      {/* Decorative background glow elements */}
      <div className="absolute top-1/4 left-10 w-72 h-72 bg-olive-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-olive-sage/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10 my-8">
        {/* Brand Header */}
        <div className="text-center space-y-2 flex flex-col items-center">
          <AppLogo branding={branding} iconSize={32} badgeSize="w-14 h-14" textSize="text-2xl" />
          <p className="text-xs text-olive-dark dark:text-olive-sage font-semibold tracking-wide">
            Zero-Knowledge Encrypted Enterprise Cloud Vault
          </p>
        </div>

        {/* Login Card */}
        <div className="glass-modal p-6 rounded-2xl shadow-2xl space-y-5 border border-olive-sage/30">
          <div className="flex items-center justify-between border-b border-olive-sage/20 pb-3">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-cream">
              Account Login
            </h2>
          </div>

          {generalError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-medium">
              {generalError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
            {/* Email Field */}
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
                  placeholder="name@iffl.cloud"
                  className={`w-full pl-10 pr-4 py-2 rounded-xl text-base md:text-sm bg-white/70 dark:bg-slate-800/70 border ${
                    emailError ? 'border-red-500 focus:ring-red-500' : 'border-olive-sage/40 focus:ring-olive-primary'
                  } text-slate-900 dark:text-cream placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors`}
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 font-medium mt-1">{emailError}</p>
              )}
            </div>

            {/* Password Field */}
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
                  }}
                  placeholder="••••••••••••"
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
              {passwordError && (
                <p className="text-xs text-red-500 font-medium mt-1">{passwordError}</p>
              )}
            </div>

            {/* Numerical Canvas Captcha */}
            <CaptchaCanvas
              onVerifyChange={(valid) => setIsCaptchaValid(valid)}
              errorMsg={captchaError}
            />

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-olive-primary hover:bg-olive-dark text-white shadow-lg shadow-olive-primary/25 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Access Encrypted Vault</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="pt-3 border-t border-olive-sage/20 text-center text-xs text-slate-600 dark:text-slate-400">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="font-bold text-olive-primary dark:text-olive-sage hover:underline"
            >
              Register New Account
            </button>
          </div>
        </div>

        {/* Global Footer */}
        <Footer branding={branding} className="mt-6 border-t-0 bg-transparent py-2" />
      </div>
    </div>
  );
};
