import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle, ArrowRight, Bell, Building2, Camera, Check, CheckCircle2,
  ChevronDown, CircleDot, Clock3, FileText, Home, LayoutDashboard, LogOut,
  MapPin, Menu, Plus, Search, Send, Settings, ShieldCheck, Sparkles, User
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { api as request } from './services/api';
import DarkModeToggle from './components/DarkModeToggle';
import NotificationPanel from './components/NotificationPanel';
import MapPicker from './components/MapPicker';
import IssuePhotoUploader from './components/IssuePhotoUploader';
import Profile from './pages/Profile';
import ComplaintDetails from './pages/ComplaintDetails';
import AdminDashboard from './pages/AdminDashboard';
import { ForgotPassword, ResetPassword } from './pages/PasswordPages';

const AuthContext = createContext(null);
const categoryColors = {
  'Damaged Road': '#d85c41', Potholes: '#d85c41', 'Broken Streetlight': '#e2a63b',
  'Garbage Overflow': '#2f8b6c', 'Water Leakage': '#3877bd'
};
const categories = [
  'Damaged Road', 'Potholes', 'Water Leakage', 'Broken Streetlight',
  'Garbage Overflow', 'Illegal Waste Disposal', 'Drainage Issue', 'Tree Fall',
  'Traffic Signal Problem', 'Public Toilet Issue', 'Park Maintenance', 'Other'
];

function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('civicfix_user')); } catch { return null; }
  });
  useEffect(() => {
    const clearUser = () => setUser(null);
    window.addEventListener('civicfix:auth-expired', clearUser);
    if (localStorage.getItem('civicfix_token')) {
      request('/auth/me')
        .then(data => {
          localStorage.setItem('civicfix_user', JSON.stringify(data.user));
          setUser(data.user);
        })
        .catch(() => {});
    }
    return () => window.removeEventListener('civicfix:auth-expired', clearUser);
  }, []);
  const login = async (email, password) => {
    const data = await request('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    });
    localStorage.setItem('civicfix_token', data.token);
    localStorage.setItem('civicfix_user', JSON.stringify(data.user));
    setUser(data.user);
  };
  const register = async values => {
    const data = await request('/auth/register', {
      method: 'POST', body: JSON.stringify(values)
    });
    localStorage.setItem('civicfix_token', data.token);
    localStorage.setItem('civicfix_user', JSON.stringify(data.user));
    setUser(data.user);
  };
  const logout = () => {
    localStorage.removeItem('civicfix_token');
    localStorage.removeItem('civicfix_user');
    setUser(null);
  };
  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

const useAuth = () => useContext(AuthContext);

function Logo() { // Log rendering of logo
  console.log('Logo rendered');
  return (
    <div className="logo">
      <span className="logo-mark"><Building2 size={19} /></span>
      <span>Civic<span>Fix</span></span>
    </div>
  );
}


function Header() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const reportTo = user ? '/report' : '/login?redirect=/dashboard';
  return <header>
    <Logo />
    <nav className={open ? 'open' : ''}>
      <NavLink to="/">Home</NavLink>
      <a href="/#how">How it works</a>
      <a href="/#impact">Our impact</a>
    </nav>
    <div className="header-actions">
      {user ? (
        <>
          <DarkModeToggle />
          <NotificationPanel />
          <Link to="/dashboard" className="text-btn">{user.name}</Link>
        </>
      ) : (
        <Link to="/login" className="text-btn">Sign in</Link>
      )}
      <Link to={reportTo} className="primary small"><Plus size={17} />Report an issue</Link>
      <button className="menu" onClick={() => setOpen(!open)} aria-label="Menu"><Menu /></button>
    </div>
  </header>;
}

function Footer() {
  const { user } = useAuth();
  const reportTo = user ? '/report' : '/login?redirect=/dashboard';
  return <footer>
    <div><Logo /><p>Making our neighbourhoods better,<br />one report at a time.</p></div>
    <div><b>Platform</b><a href="/#how">How it works</a><Link to={reportTo}>Report issue</Link><Link to="/dashboard">Track complaint</Link></div>
    <div><b>Account</b><Link to="/register">Register</Link><Link to="/login">Sign in</Link></div>
    <div><b>Data</b><p>All displayed statistics are calculated from live complaint records.</p></div>
    <small>© 2026 CivicFix. Built for stronger communities.</small>
  </footer>;
}

function HomePage() {
  const { user } = useAuth();
  const reportTo = user ? '/report' : '/login?redirect=/dashboard';
  const [stats, setStats] = useState({
    total: 0, resolved: 0, resolutionRate: 0, averageResolutionDays: 0
  });
  useEffect(() => { request('/stats').then(setStats).catch(() => {}); }, []);
  return <><Header /><main>
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow"><Sparkles size={15} /> Your voice shapes your city</div>
        <h1>See a problem?<br /><em>Let’s fix it.</em></h1>
        <p>Report civic issues in minutes, follow their progress, and help build a cleaner, safer neighbourhood for everyone.</p>
        <div className="hero-actions">
          <Link to={reportTo} className="primary"><Camera size={19} />Report an issue</Link>
          <a href="#how" className="secondary">See how it works <ArrowRight size={18} /></a>
        </div>
        <div className="trust"><ShieldCheck /><span><b>Live and accountable</b><br />Every number comes from the connected database</span></div>
      </div>
      <div className="hero-visual">
        <div className="sun" /><div className="city"><Building2 size={115} /><Building2 size={76} /><Building2 size={95} /></div>
        <div className="road"><span /><span /><span /></div>
        <div className="floating issue"><span><AlertCircle /></span><div><b>Report an issue</b><small>Send it to your civic team</small></div></div>
        <div className="floating solved"><span><Check /></span><div><b>Track resolution</b><small>See every status change</small></div></div>
      </div>
    </section>
    <section className="stats" id="impact">
      <div><strong>{stats.total.toLocaleString()}</strong><span>Issues reported</span></div>
      <div><strong>{stats.resolved.toLocaleString()}</strong><span>Issues resolved</span></div>
      <div><strong>{stats.resolutionRate}%</strong><span>Resolution rate</span></div>
      <div><strong>{stats.averageResolutionDays} days</strong><span>Avg. resolution time</span></div>
    </section>
    <section className="section" id="how">
      <div className="section-tag">Simple & transparent</div>
      <h2>From report to resolution</h2>
      <p className="lede">Three easy steps. Every submission becomes a real complaint record.</p>
      <div className="steps">
        {[
          [Camera, '01', 'Spot & report', 'Describe the problem and provide its exact location.'],
          [Send, '02', 'We record the issue', 'Your complaint receives a unique, trackable reference number.'],
          [CheckCircle2, '03', 'Track the progress', 'See status changes until the issue is resolved.']
        ].map(([Icon, n, title, text]) => <article key={n}>
          <span className="step-icon"><Icon /></span><i>{n}</i><h3>{title}</h3><p>{text}</p>
        </article>)}
      </div>
    </section>
    <section className="feature-band" id="about">
      <div><div className="section-tag light">About CivicFix</div><h2>One transparent place for civic action</h2><p>CivicFix connects residents and local teams with verifiable reports, clear ownership, and a complete resolution history.</p><ul><li><Check /> Location-aware reporting</li><li><Check /> Accountable status updates</li><li><Check /> Evidence from report to completion</li></ul></div>
      <div className="timeline-card"><small>FEATURES</small><h3>Designed for public trust</h3><p className="muted">Secure accounts, photo evidence, searchable records, notifications, analytics, and downloadable reports.</p></div>
    </section>
    <section className="section testimonials"><div className="section-tag">Community voices</div><h2>Built around the people who use the streets</h2><div className="steps"><article><p>“Reporting a dangerous pothole took less than two minutes.”</p><b>— Citizen reporter</b></article><article><p>“The timeline makes every update visible and accountable.”</p><b>— Ward coordinator</b></article><article><p>“The dashboard helps our team focus on urgent work first.”</p><b>— Civic administrator</b></article></div></section>
    <section className="cta" id="contact"><span><Send /></span><div><h2>Need help with a report?</h2><p>Contact your local civic team at support@civicfix.example.</p></div><a className="primary" href="mailto:support@civicfix.example">Contact us</a></section>
    <section className="cta">
      <span><MapPin /></span><div><h2>Your neighbourhood needs your eyes.</h2><p>Create an account and submit a verified report.</p></div>
      <Link to={reportTo} className="primary">Report an issue <ArrowRight size={18} /></Link>
    </section>
  </main><Footer /></>;
}

function MobileNav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  return <div className="mobile-nav">
    <Logo />
    <div className="mobile-nav-icons">
      <NotificationPanel />
      <Link to="/profile"><User size={20} /></Link>
      <button onClick={() => { logout(); nav('/'); }} aria-label="Logout" className="icon-btn"><LogOut size={20} /></button>
      <button onClick={() => setOpen(!open)} aria-label="Menu" className="icon-btn"><Menu size={20} /></button>
    </div>
    {open && <nav className="mobile-menu">
      <NavLink to="/dashboard" onClick={() => setOpen(false)}><LayoutDashboard />Dashboard</NavLink>
      {user?.role === 'admin' && <NavLink to="/admin" onClick={() => setOpen(false)}><ShieldCheck />Admin</NavLink>}
      <NavLink to="/report" onClick={() => setOpen(false)}><Plus />Report an issue</NavLink>
    </nav>}
  </div>;
}

function Sidebar() {
  const { user, logout } = useAuth();
  const initials = user?.name?.split(' ').map(x => x[0]).join('').slice(0, 2).toUpperCase() || 'CF';
  return <aside className="sidebar">
    <Logo />
    <div className="citizen"><span>{initials}</span><div><b>{user?.name}</b><small>{user?.role}</small></div><ChevronDown size={16} /></div>
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
  </aside>;
}

function Status({ children }) {
  return <span className={`status ${children.toLowerCase().replaceAll(' ', '-')}`}><i />{children}</span>;
}

function Metric({ icon: Icon, n, label, note, c }) {
  return <article className="metric"><span className={c}><Icon /></span><div><strong>{n}</strong><b>{label}</b><small>{note}</small></div></article>;
}

function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    request('/complaints')
      .then(data => setComplaints(data.complaints || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => complaints.filter(c =>
    [c.title, c.category, c.status, c.location?.address].some(x => x?.toLowerCase().includes(query.toLowerCase()))
  ), [complaints, query]);
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const active = complaints.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length;
  const open = complaints.length - resolved;
  const chart = useMemo(() => {
    const buckets = [...Array(6)].map((_, i) => {
      const date = new Date(); date.setDate(date.getDate() - (5 - i) * 6);
      return { d: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), n: 0, until: date };
    });
    complaints.forEach(c => {
      const created = new Date(c.createdAt);
      const index = buckets.findIndex((b, i) => created <= b.until && (i === 0 || created > buckets[i - 1].until));
      if (index >= 0) buckets[index].n++;
    });
    return buckets;
  }, [complaints]);

  return <div className="app-shell"><MobileNav /><Sidebar /><div className="dashboard">
    <div className="dash-top">
      <div><h1>Hello, {user.name}</h1><p>Live data from your civic complaints.</p></div>
      <div className="dash-actions">
        <span className="dash-user"><User size={17} />{user.name}</span>
        <NotificationPanel />
        <Link className="secondary dash-profile" to="/profile"><User size={17} />Profile</Link>
        <button className="secondary dash-logout" onClick={() => { logout(); nav('/'); }}><LogOut size={17} />Logout</button>
        <Link className="primary" to="/report"><Plus />New complaint</Link>
      </div>
    </div>
    {error && <p className="form-error">{error}</p>}
    <div className="metric-grid">
      <Metric icon={FileText} n={complaints.length} label="Total complaints" note="All submitted reports" c="green" />
      <Metric icon={Clock3} n={active} label="In progress" note="Currently being worked on" c="orange" />
      <Metric icon={CheckCircle2} n={resolved} label="Resolved" note={`${complaints.length ? Math.round(resolved / complaints.length * 100) : 0}% resolution rate`} c="blue" />
      <Metric icon={Bell} n={open} label="Open reports" note="Awaiting resolution" c="purple" />
    </div>
    <div className="dash-grid">
      <section className="panel chart-panel">
        <div className="panel-head"><div><h3>Complaint activity</h3><p>Your real submissions over the last 30 days</p></div></div>
        <ResponsiveContainer width="100%" height={230}><AreaChart data={chart}>
          <CartesianGrid strokeDasharray="4 4" vertical={false} /><XAxis dataKey="d" axisLine={false} /><YAxis allowDecimals={false} axisLine={false} /><Tooltip />
          <Area type="monotone" dataKey="n" stroke="#287b61" strokeWidth={3} fill="#dceee7" />
        </AreaChart></ResponsiveContainer>
      </section>
      <section className="panel updates">
        <div className="panel-head"><div><h3>Latest statuses</h3><p>Your most recent complaint records</p></div></div>
        {complaints.slice(0, 3).map(c => <div className="update" key={c._id}>
          <span className="update-icon u0"><Clock3 /></span>
          <div><b>{c.status}</b><p>{c.title}</p><small>{new Date(c.updatedAt).toLocaleString('en-IN')}</small></div>
        </div>)}
        {!loading && !complaints.length && <p className="empty-state">No activity yet.</p>}
      </section>
    </div>
    <section className="panel complaints">
      <div className="panel-head">
        <div><h3>{user.role === 'admin' ? 'All complaints' : 'My complaints'}</h3><p>Records stored in MongoDB Atlas</p></div>
        <div className="table-actions"><label><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search complaints" /></label></div>
      </div>
      <div className="table-wrap"><table>
        <thead><tr><th>COMPLAINT</th><th>LOCATION</th><th>DATE</th><th>STATUS</th><th>PRIORITY</th></tr></thead>
        <tbody>{shown.map(c => <tr key={c._id}>
          <td><span className="category-dot" style={{ background: categoryColors[c.category] || '#2f8b6c' }} /><div><Link to={`/complaints/${c._id}`}><b>{c.title}</b></Link><small>{c.reference} · {c.category}</small></div></td>
          <td><MapPin />{c.location?.address || 'Not supplied'}</td>
          <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
          <td><Status>{c.status}</Status></td><td>{c.priority}</td>
        </tr>)}</tbody>
      </table>{!loading && !shown.length && <p className="empty-state">No complaints found. Submit your first report to create one.</p>}</div>
    </section>
  </div></div>;
}

function Report() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState({});

  useEffect(() => {
    if (location.source !== 'current' || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude) || location.address) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(location.latitude),
      lon: String(location.longitude)
    });
    fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => {
        const address = data?.display_name || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
        setLocation(current => current.address ? current : { ...current, address });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLocation(current => current.address || !Number.isFinite(current.latitude) || !Number.isFinite(current.longitude)
            ? current
            : { ...current, address: `${current.latitude.toFixed(6)}, ${current.longitude.toFixed(6)}` });
        }
      });
    return () => controller.abort();
  }, [location.address, location.latitude, location.longitude, location.source]);

  const updateLocation = changes => setLocation(current => ({ ...current, ...changes }));

  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    const form = new FormData(e.currentTarget);
    try {
      let uploadedImages = [];
      if (images.length) {
        const uploadBody = new FormData();
        images.forEach(image => uploadBody.append('images', image));
        const uploadData = await request('/uploads', { method: 'POST', body: uploadBody });
        uploadedImages = uploadData.urls;
      }
      const data = await request('/complaints', {
        method: 'POST',
        body: JSON.stringify({
          title: form.get('title'), description: form.get('description'),
          category: form.get('category'), contactNumber: form.get('contactNumber'),
          anonymous: form.get('anonymous') === 'on', images: uploadedImages,
          location: {
            address: location.address || form.get('address'), ward: location.ward || form.get('ward'),
            landmark: location.landmark || form.get('landmark'),
            latitude: Number.isFinite(location.latitude) ? location.latitude : (form.get('latitude') ? Number(form.get('latitude')) : undefined),
            longitude: Number.isFinite(location.longitude) ? location.longitude : (form.get('longitude') ? Number(form.get('longitude')) : undefined)
          }
        })
      });
      setReference(data.complaint.reference);
      setTimeout(() => nav('/dashboard'), 1800);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  if (reference) return <div className="success-page"><span><Check /></span><h1>Complaint submitted</h1><p>Your tracking number is <b>{reference}</b></p><p>Taking you to your dashboard…</p></div>;
  return <><Header /><main className="form-page">
    <div className="form-title"><div><span className="back" onClick={() => nav(-1)}>← Back</span><h1>Report a civic issue</h1><p>This form creates a real complaint in MongoDB.</p></div></div>
    <form onSubmit={submit} className="report-form">
      {error && <p className="form-error">{error}</p>}
      <section className="form-card">
        <div className="card-title"><span><FileText /></span><div><h3>Issue details</h3><p>Describe the problem clearly.</p></div></div>
        <label>Complaint title <em>*</em><input name="title" required maxLength="120" placeholder="e.g. Large pothole near school entrance" /></label>
        <div className="two">
          <label><span>Category <em>*</em></span><select name="category" required defaultValue=""><option value="" disabled>Select a category</option>{categories.map(x => <option key={x}>{x}</option>)}</select></label>
          <label><span>Contact number</span><input name="contactNumber" placeholder="+91 98765 43210" /></label>
        </div>
        <label>Description <em>*</em><textarea name="description" required minLength="10" rows="5" placeholder="Describe what you observed and any safety concerns…" /></label>
      </section>
      <section className="form-card">
        <div className="card-title"><span><MapPin /></span><div><h3>Location</h3><p>Give the team enough detail to find it.</p></div></div>
        <label>Address <em>*</em><input name="address" required value={location.address || ''} onChange={e => updateLocation({ address: e.target.value, source: 'manual' })} placeholder="Street, landmark or area" /></label>
        <div className="two"><label>Ward<input name="ward" value={location.ward || ''} onChange={e => updateLocation({ ward: e.target.value })} placeholder="e.g. Ward 12" /></label><label>Landmark<input name="landmark" value={location.landmark || ''} onChange={e => updateLocation({ landmark: e.target.value })} placeholder="Opposite Government School" /></label></div>
        <div className="two"><label>Latitude<input name="latitude" type="number" step="any" value={Number.isFinite(location.latitude) ? location.latitude : ''} onChange={e => updateLocation({ latitude: e.target.value === '' ? undefined : Number(e.target.value), source: 'manual' })} placeholder="9.9312" /></label><label>Longitude<input name="longitude" type="number" step="any" value={Number.isFinite(location.longitude) ? location.longitude : ''} onChange={e => updateLocation({ longitude: e.target.value === '' ? undefined : Number(e.target.value), source: 'manual' })} placeholder="76.2673" /></label></div>
        <MapPicker value={location} onChange={updateLocation} />
      </section>
      <IssuePhotoUploader images={images} setImages={setImages} />
      <div className="form-bottom"><label className="check"><input name="anonymous" type="checkbox" /> Submit anonymously</label><button disabled={busy} className="primary">{busy ? 'Submitting…' : 'Submit complaint'} <ArrowRight /></button></div>
    </form>
  </main><Footer /></>;
}

function AuthPage({ mode }) {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const requestedRedirect = new URLSearchParams(location.search).get('redirect');
  const redirectTo = requestedRedirect?.startsWith('/') && !requestedRedirect.startsWith('//')
    ? requestedRedirect
    : '/dashboard';

  useEffect(() => {
    if (user) nav(redirectTo, { replace: true });
  }, [nav, redirectTo, user]);

  const submit = async e => {
    e.preventDefault(); setBusy(true); setError('');
    const form = new FormData(e.currentTarget);
    try {
      if (mode === 'register') await register({
        name: form.get('name'), email: form.get('email'), password: form.get('password'),
        phone: form.get('phone'), ward: form.get('ward')
      });
      else await login(form.get('email'), form.get('password'));
      nav(redirectTo, { replace: true });
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const registering = mode === 'register';
  return <div className="login-page">
    <div className="login-art"><Logo /><div><div className="eyebrow light"><Sparkles /> Your city. Your voice.</div><h1>Small reports.<br />Big <em>change.</em></h1><p>Your account and complaints are stored securely in the connected database.</p></div><small>© 2026 CivicFix</small></div>
    <div className="login-box"><div>
      <h2>{registering ? 'Create your account' : 'Welcome back'}</h2>
      <p>{registering ? 'Register as a citizen to report issues.' : 'Sign in to see your real complaint data.'}</p>
      <form onSubmit={submit}>
        {registering && <><label>Full name<input name="name" required placeholder="Your full name" /></label><div className="two"><label>Phone<input name="phone" placeholder="Phone number" /></label><label>Ward<input name="ward" placeholder="Ward" /></label></div></>}
        <label>Email address<input name="email" required type="email" placeholder="you@example.com" /></label>
        <label>Password<input name="password" required type="password" minLength="8" placeholder="Minimum 8 characters" /></label>
        {!registering && <Link className="forgot-link" to="/forgot-password">Forgot password?</Link>}
        {error && <p className="form-error">{error}</p>}
        <button disabled={busy} className="primary login-submit">{busy ? 'Please wait…' : registering ? 'Create account' : 'Sign in'} <ArrowRight /></button>
      </form>
      <p className="register">{registering ? <>Already registered? <Link to="/login">Sign in</Link></> : <>New to CivicFix? <Link to="/register">Create an account</Link></>}</p>
      <div className="demo"><ShieldCheck /><span><b>Live authentication</b><small>No demo credentials or simulated login.</small></span></div>
    </div></div>
  </div>;
}

function Protected({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
  return user ? children : <Navigate to={`/login?redirect=${redirect}`} replace />;
}

function AdminOnly({ children }) {
  const { user } = useAuth();
  return user?.role === 'admin' ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return <AuthProvider><Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<AuthPage mode="login" />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route path="/forgot-password" element={<ForgotPassword />} />
    <Route path="/reset-password/:token" element={<ResetPassword />} />
    <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
    <Route path="/report" element={<Protected><Report /></Protected>} />
    <Route path="/profile" element={<Protected><Profile /></Protected>} />
    <Route path="/complaints/:id" element={<Protected><ComplaintDetails /></Protected>} />
    <Route path="/admin" element={<Protected><AdminOnly><AdminDashboard /></AdminOnly></Protected>} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AuthProvider>;
}
