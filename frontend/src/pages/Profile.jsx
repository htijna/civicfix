import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export default function Profile() {
  const [user, setUser] = useState({});
  useEffect(() => { api('/auth/me').then(data => setUser(data.user)); }, []);
  const save = async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const data = await api('/auth/me', { method: 'PUT', body: JSON.stringify(values) });
    localStorage.setItem('civicfix_user', JSON.stringify(data.user));
    setUser(data.user); toast.success('Profile updated');
  };
  const uploadAvatar = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    const body = new FormData(); body.append('images', file);
    const uploaded = await api('/uploads', { method: 'POST', body });
    setUser(current => ({ ...current, avatar: uploaded.urls[0] }));
    toast.success('Avatar uploaded. Save the profile to apply it.');
  };
  return <main className="standalone-page"><section className="form-card"><h1>My profile</h1><form onSubmit={save}>
    <label>Name<input name="name" defaultValue={user.name || ''} required /></label>
    <label>Phone<input name="phone" defaultValue={user.phone || ''} /></label>
    <label>Address<input name="address" defaultValue={user.address || ''} /></label>
    <label>Ward<input name="ward" defaultValue={user.ward || ''} /></label>
    <label>Profile picture<input type="file" accept="image/jpeg,image/png,image/webp" onChange={uploadAvatar} /></label>
    <label>Avatar URL<input name="avatar" type="url" value={user.avatar || ''} onChange={event => setUser({ ...user, avatar: event.target.value })} /></label>
    <label>Language<select name="language" defaultValue={user.language || 'en'}><option value="en">English</option><option value="ml">Malayalam</option></select></label>
    <button className="primary">Save profile</button>
  </form></section></main>;
}
