import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Plus, Menu } from 'lucide-react';
import Logo from './Logo';

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header>
      <Logo />
      <nav className={open ? 'open' : ''}>
        <NavLink to="/">Home</NavLink>
        <a href="#how">How it works</a>
        <a href="#impact">Our impact</a>
      </nav>
      <div className="header-actions">
        <Link to="/login?redirect=/dashboard" className="primary small"><Plus size={17} />Report an issue</Link>
        <button className="menu" onClick={() => setOpen(!open)} aria-label="Menu"><Menu /></button>
      </div>
    </header>
  );
}
