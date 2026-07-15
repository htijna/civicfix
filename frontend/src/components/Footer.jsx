import { Link } from 'react-router-dom';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer>
      <div>
        <Logo />
        <p>Making our neighbourhoods better,<br />one report at a time.</p>
      </div>
      <div>
        <b>Platform</b>
        <a href="/#how">How it works</a>
        <Link to="/login?redirect=/report">Report issue</Link>
        <Link to="/dashboard">Track complaint</Link>
      </div>
      <div>
        <b>Account</b>
        <Link to="/register">Register</Link>
        <Link to="/login">Sign in</Link>
      </div>
      <div>
        <b>Data</b>
        <p>All displayed statistics are calculated from live complaint records.</p>
      </div>
      <small>(c) 2026 CivicFix. Built for stronger communities.</small>
    </footer>
  );
}
