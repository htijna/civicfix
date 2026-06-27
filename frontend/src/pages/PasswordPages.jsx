import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export function ForgotPassword() {
  const [link, setLink] = useState('');
  const submit = async event => {
    event.preventDefault();
    const data = await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email: new FormData(event.currentTarget).get('email') }) });
    setLink(data.resetUrl || ''); toast.success(data.message);
  };
  return <main className="standalone-page"><section className="form-card auth-card"><h1>Forgot password</h1><p>Enter your account email to receive a reset link.</p><form onSubmit={submit}><label>Email<input name="email" type="email" required /></label><button className="primary">Send reset link</button></form>{link && <a href={link}>Open development reset link</a>}<Link to="/login">Back to login</Link></section></main>;
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
