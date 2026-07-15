import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function Logo() {
  return (
    <Link className="logo" to="/">
      <span className="logo-mark"><Building2 size={19} /></span>
      <span>Civic<span>Fix</span></span>
    </Link>
  );
}
