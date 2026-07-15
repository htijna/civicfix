import { Link, NavLink } from 'react-router-dom';
import { ChevronDown, LayoutDashboard, LogOut, Plus, Settings, ShieldCheck, User } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || 'CF';

  return (
    <aside className="sidebar">
      <Logo />
      <div className="citizen">
        <span>{initials}</span>
        <div><b>{user?.name}</b><small>{user?.role}</small></div>
        <ChevronDown size={16} />
      </div>
      <nav>
        <small>OVERVIEW</small>
        <NavLink to="/dashboard"><LayoutDashboard />Dashboard</NavLink>
        {user?.role === 'admin' && <NavLink to="/admin"><ShieldCheck />Admin dashboard</NavLink>}
        <NavLink to="/report"><Plus />Report an issue</NavLink>
        <small>ACCOUNT</small>
        <Link to="/profile"><User />My account</Link>
        <a><Settings />Settings</a>
      </nav>
      <Link to="/" className="logout" onClick={logout}><LogOut /> Log out</Link>
    </aside>
  );
}
