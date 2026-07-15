import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle2,
  Clock3,
  FileText,
  LogOut,
  MapPin,
  Plus,
  Search,
  User
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import DarkModeToggle from '../components/DarkModeToggle';
import MobileNav from '../components/MobileNav';
import NotificationPanel from '../components/NotificationPanel';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import { api as request } from '../services/api';

const categoryColors = {
  'Damaged Road': '#d85c41',
  Potholes: '#d85c41',
  'Broken Streetlight': '#e2a63b',
  'Garbage Overflow': '#2f8b6c',
  'Water Leakage': '#3877bd'
};

function Status({ children }) {
  return <span className={`status ${children.toLowerCase().replaceAll(' ', '-')}`}><i />{children}</span>;
}

function Metric({ icon: Icon, n, label, note, c }) {
  return <article className="metric"><span className={c}><Icon /></span><div><strong>{n}</strong><b>{label}</b><small>{note}</small></div></article>;
}

export default function Dashboard() {
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
      const date = new Date();
      date.setDate(date.getDate() - (5 - i) * 6);
      return { d: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), n: 0, until: date };
    });

    complaints.forEach(c => {
      const created = new Date(c.createdAt);
      const index = buckets.findIndex((b, i) => created <= b.until && (i === 0 || created > buckets[i - 1].until));
      if (index >= 0) buckets[index].n++;
    });

    return buckets;
  }, [complaints]);

  return (
    <div className="app-shell">
      <MobileNav />
      <Sidebar />
      <div className="dashboard">
        <div className="dash-top">
          <div><h1>Hello, {user.name}</h1><p>Live data from your civic complaints.</p></div>
          <div className="dash-actions">
            <span className="dash-user"><User size={17} />{user.name}</span>
            <DarkModeToggle />
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
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={chart}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="d" axisLine={false} />
                <YAxis allowDecimals={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="n" stroke="#287b61" strokeWidth={3} fill="#dceee7" />
              </AreaChart>
            </ResponsiveContainer>
          </section>
          <section className="panel updates">
            <div className="panel-head"><div><h3>Latest statuses</h3><p>Your most recent complaint records</p></div></div>
            {complaints.slice(0, 3).map(c => (
              <div className="update" key={c._id}>
                <span className="update-icon u0"><Clock3 /></span>
                <div><b>{c.status}</b><p>{c.title}</p><small>{new Date(c.updatedAt).toLocaleString('en-IN')}</small></div>
              </div>
            ))}
            {!loading && !complaints.length && <p className="empty-state">No activity yet.</p>}
          </section>
        </div>
        <section className="panel complaints">
          <div className="panel-head">
            <div><h3>{user.role === 'admin' ? 'All complaints' : 'My complaints'}</h3><p>Records stored in MongoDB Atlas</p></div>
            <div className="table-actions"><label><Search /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search complaints" /></label></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>COMPLAINT</th><th>LOCATION</th><th>DATE</th><th>STATUS</th><th>PRIORITY</th></tr></thead>
              <tbody>{shown.map(c => (
                <tr key={c._id}>
                  <td><span className="category-dot" style={{ background: categoryColors[c.category] || '#2f8b6c' }} /><div><Link to={`/complaints/${c._id}`}><b>{c.title}</b></Link><small>{c.reference} - {c.category}</small></div></td>
                  <td><MapPin />{c.location?.address || 'Not supplied'}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td><Status>{c.status}</Status></td>
                  <td>{c.priority}</td>
                </tr>
              ))}</tbody>
            </table>
            {!loading && !shown.length && <p className="empty-state">No complaints found. Submit your first report to create one.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
