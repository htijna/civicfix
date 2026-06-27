import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(() => localStorage.getItem('civicfix_theme') === 'dark');
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('civicfix_theme', dark ? 'dark' : 'light');
  }, [dark]);
  return <button className="icon-toggle" onClick={() => setDark(value => !value)} aria-label="Toggle dark mode">{dark ? <Sun /> : <Moon />}</button>;
}
