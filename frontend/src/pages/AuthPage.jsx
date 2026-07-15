import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ mode }) {
  const { user, authReady, login, register } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestedRedirect = new URLSearchParams(location.search).get('redirect');
  const redirectTo = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : '/dashboard';

  useEffect(() => {
    if (authReady && user) nav(redirectTo, { replace: true });
  }, [authReady, nav, redirectTo, user]);

  const submit = async e => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(e.currentTarget);

    try {
      if (mode === 'register') {
        await register({
          name: form.get('name'),
          email: form.get('email'),
          password: form.get('password'),
          phone: form.get('phone'),
          ward: form.get('ward')
        });
      } else {
        await login(form.get('email'), form.get('password'));
      }
      nav(redirectTo, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const registering = mode === 'register';

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
          <h2>{registering ? 'Create your account' : 'Welcome back'}</h2>
          <p>{registering ? 'Register as a citizen to report issues.' : 'Sign in to see your real complaint data.'}</p>
          <form onSubmit={submit}>
            {registering && (
              <>
                <label>Full name<input name="name" required placeholder="Your full name" /></label>
                <div className="two"><label>Phone<input name="phone" placeholder="Phone number" /></label><label>Ward<input name="ward" placeholder="Ward" /></label></div>
              </>
            )}
            <label>Email address<input name="email" required type="email" placeholder="you@example.com" /></label>
            <label>Password<input name="password" required type="password" minLength="8" placeholder="Minimum 8 characters" /></label>
            {!registering && <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>}
            {error && <p className="form-error">{error}</p>}
            <button disabled={busy} className="primary login-submit">{busy ? 'Please wait...' : registering ? 'Create account' : 'Sign in'} <ArrowRight /></button>
          </form>
          <p className="register">{registering ? <>Already registered? <Link to="/login">Sign in</Link></> : <>New to CivicFix? <Link to="/register">Create an account</Link></>}</p>
          <div className="demo"><ShieldCheck /><span><b>Live authentication</b><small>No demo credentials or simulated login.</small></span></div>
        </div>
      </div>
    </div>
  );
}
