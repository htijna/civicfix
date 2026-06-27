import { Bell, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const load = () => api('/notifications').then(data => setItems(data.notifications || [])).catch(() => {});
  useEffect(load, []);
  const unread = items.filter(item => !item.read).length;
  const readAll = async () => { await api('/notifications/read-all', { method: 'PATCH' }); load(); };
  return <div className="notification-wrap">
    <button className="icon-toggle" onClick={() => setOpen(value => !value)} aria-label="Notifications"><Bell />{unread > 0 && <i>{unread}</i>}</button>
    {open && <div className="notification-panel">
      <div><b>Notifications</b><button onClick={readAll}><CheckCheck /> Read all</button></div>
      {items.map(item => <article className={item.read ? '' : 'unread'} key={item._id}><b>{item.message}</b><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}
      {!items.length && <p>No notifications yet.</p>}
    </div>}
  </div>;
}
