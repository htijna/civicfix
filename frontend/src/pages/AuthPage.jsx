import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }) {
  const { user, authReady, login, adminLogin, register } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const requestedRedirect = new URLSearchParams(location.search).get('redirect');
  const isAdminLogin = mode === 'admin';
  const redirectTo = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : isAdminLogin ? '/admin' : '/dashboard';

  useEffect(() => {
    if (!authReady || !user) return;
    if (isAdminLogin && user.role !== 'admin') nav('/dashboard', { replace: true });
    else if (!isAdminLogin && user.role === 'department_officer' && redirectTo === '/dashboard') nav('/department', { replace: true });
    else nav(redirectTo, { replace: true });
  }, [authReady, isAdminLogin, nav, redirectTo, user]);

  const [emailPlaceholder, setEmailPlaceholder] = useState('you@example.com');
  const [phonePlaceholder, setPhonePlaceholder] = useState('10-digit mobile number');
  const [emailHasError, setEmailHasError] = useState(false);
  const [phoneHasError, setPhoneHasError] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setError('');

    const form = new FormData(e.currentTarget);
    const emailVal = (email || form.get('email') || '').trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailVal) {
      setEmail('');
      setEmailHasError(true);
      setEmailPlaceholder('⚠️ Please enter an email address');
      return;
    }

    if (!emailRegex.test(emailVal)) {
      setEmail('');
      setEmailHasError(true);
      setEmailPlaceholder('⚠️ Invalid email format (e.g. name@gmail.com)');
      return;
    }

    if (mode === 'register') {
      const phoneClean = phone.trim();
      if (phoneClean && !/^\d{10}$/.test(phoneClean)) {
        setPhone('');
        setPhoneHasError(true);
        setPhonePlaceholder('⚠️ Must be exactly 10 digits');
        return;
      }
    }

    setBusy(true);

    try {
      if (mode === 'register') {
        await register({
          name: form.get('name'),
          email: emailVal,
          password: form.get('password'),
          phone: phone.trim()
        });
      } else {
        const signedInUser = isAdminLogin
          ? await adminLogin(emailVal, form.get('password'))
          : await login(emailVal, form.get('password'));
        if (!isAdminLogin && signedInUser?.role === 'department_officer' && redirectTo === '/dashboard') {
          nav('/department', { replace: true });
          return;
        }
      }
      nav(redirectTo, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const registering = mode === 'register';
  const title = registering ? 'Create your account' : isAdminLogin ? 'Admin login' : 'Welcome back';
  const subtitle = registering
    ? 'Register as a citizen to report issues.'
    : isAdminLogin
      ? 'Sign in as an administrator to review submitted complaints.'
      : 'Sign in to see your real complaint data.';

  return (
    <div className="login-page">
      <div className="login-art">
        <Logo />
        <div>
          <div className="eyebrow light"><Sparkles /> Your city. Your voice.</div>
          <h1>Small reports.<br />Big <em>change.</em></h1>
          <p>Your account and complaints are stored securely in the connected database.</p>
        </div>
        <small>(c) 2026 CivicFix</small>
      </div>
      <div className="login-box">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          <form onSubmit={submit} noValidate>
            {registering && (
              <>
                <div className="two">
                  <label>Full name<input name="name" required placeholder="Your full name" /></label>
                  <label>
                    Phone
                    <input
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={e => {
                        const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setPhone(numericOnly);
                        if (phoneHasError) {
                          setPhoneHasError(false);
                          setPhonePlaceholder('10-digit mobile number');
                        }
                        if (error && error.includes('Mobile number')) setError('');
                      }}
                      onFocus={() => {
                        if (phoneHasError) {
                          setPhoneHasError(false);
                          setPhonePlaceholder('10-digit mobile number');
                        }
                      }}
                      placeholder={phonePlaceholder}
                      maxLength="10"
                      className={phoneHasError ? 'input-field-error' : ''}
                      style={phoneHasError ? { borderColor: '#b84332', backgroundColor: '#fff5f3' } : {}}
                    />
                  </label>
                </div>
              </>
            )}
            <label>
              Email address
              <input
                name="email"
                required
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  if (emailHasError) {
                    setEmailHasError(false);
                    setEmailPlaceholder('you@example.com');
                  }
                  if (error && error.toLowerCase().includes('email')) setError('');
                }}
                onFocus={() => {
                  if (emailHasError) {
                    setEmailHasError(false);
                    setEmailPlaceholder('you@example.com');
                  }
                }}
                placeholder={emailPlaceholder}
                className={emailHasError ? 'input-field-error' : ''}
                style={emailHasError ? { borderColor: '#b84332', backgroundColor: '#fff5f3' } : {}}
              />
            </label>
            <label>Password<input name="password" required type="password" minLength="8" placeholder="Minimum 8 characters" /></label>
            {!registering && <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>}
            {error && <p className="form-error">{error}</p>}
            <button disabled={busy} className="primary login-submit">{busy ? 'Please wait...' : registering ? 'Create account' : isAdminLogin ? 'Enter admin dashboard' : 'Sign in'} <ArrowRight /></button>
          </form>
          <p className="register">
            {registering && <>Already registered? <Link to="/login">Sign in</Link></>}
            {!registering && !isAdminLogin && <>New to CivicFix? <Link to="/register">Create an account</Link> · <Link to="/admin-login">Admin login</Link></>}
            {isAdminLogin && <>Citizen account? <Link to="/login">Use citizen login</Link></>}
          </p>
          <div className="demo"><ShieldCheck /><span><b>{isAdminLogin ? 'Admin-only access' : 'Live authentication'}</b><small>{isAdminLogin ? 'Only accounts with the admin role can enter this portal.' : 'No demo credentials or simulated login.'}</small></span></div>
        </div>
      </div>
    </div>
  );
}
