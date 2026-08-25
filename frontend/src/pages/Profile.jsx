import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import AuthenticatedShell from '../components/AuthenticatedShell';
import { api } from '../services/api';

export default function Profile() {
  const [user, setUser] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    api('/auth/me')
      .then(data => setUser(data.user))
      .catch(loadError => setError(loadError.message));
  }, []);

  const save = async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const data = await api('/auth/me', { method: 'PUT', body: JSON.stringify(values) });
      localStorage.setItem('civicfix_user', JSON.stringify(data.user));
      setUser(data.user);
      setError('');
      toast.success('Profile updated');
    } catch (saveError) {
      setError(saveError.message);
      toast.error(saveError.message);
    }
  };

  const uploadAvatar = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    const body = new FormData(); body.append('images', file);
    try {
      const uploaded = await api('/uploads', { method: 'POST', body });
      setUser(current => ({ ...current, avatar: uploaded.urls[0] }));
      setError('');
      toast.success('Avatar uploaded. Save the profile to apply it.');
    } catch (uploadError) {
      setError(uploadError.message);
      toast.error(uploadError.message);
    }
  };

  return (
    <AuthenticatedShell title="My profile" subtitle="Manage your account details and preferences.">
      <main className="form-page">
        <section className="form-card">
          <h1>My profile</h1>
          {error && <p className="form-error">{error}</p>}
          <form onSubmit={save} className="report-form">
            <label>Name<input name="name" defaultValue={user.name || ''} required /></label>
            <label>Phone<input name="phone" defaultValue={user.phone || ''} /></label>
            <label>Address<input name="address" defaultValue={user.address || ''} /></label>
            <label>Ward<input name="ward" defaultValue={user.ward || ''} /></label>
            <label>Profile picture<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} /></label>
            <label>Avatar URL<input name="avatar" type="url" value={user.avatar || ''} onChange={event => setUser({ ...user, avatar: event.target.value })} /></label>
            <label>Language<select name="language" defaultValue={user.language || 'en'}><option value="en">English</option><option value="ml">Malayalam</option></select></label>
            <button className="primary">Save profile</button>
          </form>
        </section>
      </main>
    </AuthenticatedShell>
  );
}
