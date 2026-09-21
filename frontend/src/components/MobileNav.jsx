import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Building2, LogOut, Menu, Plus, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from './DarkModeToggle';
import Logo from './Logo';
import NotificationPanel from './NotificationPanel';

export default function MobileNav() {
  const { user, logout } = useAuth();
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
        {user?.role === 'admin' && <Link to="/admin" className="primary small"><ShieldCheck size={17} />Admin</Link>}
        {user?.role === 'department_officer' && <Link to="/department" className="primary small"><Building2 size={17} />Department</Link>}
        {user?.role !== 'admin' && user?.role !== 'department_officer' && <Link to="/report" className="primary small"><Plus size={17} />Report issue</Link>}
        <NotificationPanel />
        <button className="icon-toggle" onClick={() => setOpen(value => !value)} aria-label="Menu"><Menu /></button>
      </div>
      {open && (
        <div className="mobile-menu">
          <NavLink to="/dashboard">Dashboard</NavLink>
          {user?.role === 'admin' && <NavLink to="/admin"><ShieldCheck size={17} />Admin dashboard</NavLink>}
          {user?.role === 'department_officer' && <NavLink to="/department"><Building2 size={17} />Department dashboard</NavLink>}
          <NavLink to="/report">Report an issue</NavLink>
          <NavLink to="/profile"><User size={17} />Profile</NavLink>
          <DarkModeToggle />
          <button onClick={handleLogout}><LogOut size={17} />Logout</button>
        </div>
      )}
    </div>
  );
}
