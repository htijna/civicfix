import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export function ForgotPassword() {
  const [link, setLink] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const submit = async event => {
    event.preventDefault();
    const trimmed = (email || '').trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    try {
      const data = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: trimmed }) });
      setLink(data.resetUrl || '');
      toast.success(data.message);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <main className="standalone-page">
      <section className="form-card auth-card">
        <h1>Forgot password</h1>
        <p>Enter your account email to receive a reset link.</p>
        <form onSubmit={submit} noValidate>
          <label>
            Email
            <input
              name="email"
              type="email"
              required
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              placeholder="you@example.com"
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button className="primary">Send reset link</button>
        </form>
        {link && <a href={link}>Open development reset link</a>}
        <Link to="/login">Back to login</Link>
      </section>
    </main>
  );
}

export function ResetPassword() {
  const { token } = useParams();
  const submit = async event => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    const data = await api(`/auth/reset-password/${token}`, { method: 'POST', body: JSON.stringify({ password }) });
    toast.success(data.message);
  };
  return <main className="standalone-page"><section className="form-card auth-card"><h1>Reset password</h1><form onSubmit={submit}><label>New password<input name="password" type="password" minLength="8" required /></label><button className="primary">Reset password</button></form><Link to="/login">Sign in</Link></section></main>;
}
