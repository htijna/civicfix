import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Plus, User } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import MobileNav from './MobileNav';
import NotificationPanel from './NotificationPanel';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function AuthenticatedShell({ title, subtitle, action, children }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <div className="app-shell">
      <MobileNav />
      <Sidebar />
      <div className="dashboard">
        <div className="dash-top">
          <div>
            <h1>{title || `Hello, ${user?.name || 'there'}`}</h1>
            <p>{subtitle || 'Live data from your civic complaints.'}</p>
          </div>
          <div className="dash-actions">
            <span className="dash-user"><User size={17} />{user?.name}</span>
            <DarkModeToggle />
            <NotificationPanel />
            <Link className="secondary dash-profile" to="/profile"><User size={17} />Profile</Link>
            <button className="secondary dash-logout" onClick={handleLogout}><LogOut size={17} />Logout</button>
            {action || <Link className="primary" to="/report"><Plus />New complaint</Link>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
