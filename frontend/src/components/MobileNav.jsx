import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Plus, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import Logo from './Logo';
import NotificationPanel from './NotificationPanel';

export default function MobileNav() {
  const { logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    nav('/');
  };

  return (
    <div className="mobile-nav">
      <Logo />
      <div className="mobile-nav-icons">
        <Link to="/report" className="primary small"><Plus size={17} />Report issue</Link>
        <NotificationPanel />
        <button className="icon-toggle" onClick={() => setOpen(value => !value)} aria-label="Menu"><Menu /></button>
      </div>
      {open && (
        <div className="mobile-menu">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/report">Report an issue</NavLink>
          <NavLink to="/profile"><User size={17} />Profile</NavLink>
          <DarkModeToggle />
          <button onClick={handleLogout}><LogOut size={17} />Logout</button>
        </div>
      )}
    </div>
  );
}
