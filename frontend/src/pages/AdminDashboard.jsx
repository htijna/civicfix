import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { Bar, BarChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, API } from '../services/api';
import MapPicker from '../components/MapPicker';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]); const [summary, setSummary] = useState({ byStatus: {}, monthly: [] });
  const [departments, setDepartments] = useState([]); const [assignees, setAssignees] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '', priority: '', ward: '' });
  const load = async () => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value)).toString();
    const [list, stats] = await Promise.all([api(`/complaints?${query}`), api('/complaints/admin/summary')]);
    setComplaints(list.complaints); setSummary(stats);
  };
  useEffect(() => {
    load().catch(error => toast.error(error.message));
    Promise.all([api('/departments'), api('/users/assignees')]).then(([d, u]) => {
      setDepartments(d.departments || []); setAssignees(u.users || []);
    }).catch(() => {});
  }, []);
  const chart = useMemo(() => Object.entries(summary.byStatus || {}).map(([name, value]) => ({ name, value })), [summary]);
  const update = async (id, values) => { await api(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(values) }); toast.success('Complaint updated'); load(); };
  const csv = async () => {
    const response = await fetch(`${API}/reports/complaints.csv`, { headers: { Authorization: `Bearer ${localStorage.getItem('civicfix_token')}` } });
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'civicfix-complaints.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const pdf = () => { const doc = new jsPDF(); doc.text('CivicFix Complaint Summary', 15, 20); doc.text(`Total complaints: ${summary.total || 0}`, 15, 32); chart.forEach((row, i) => doc.text(`${row.name}: ${row.value}`, 15, 44 + i * 8)); doc.save('civicfix-summary.pdf'); };
  return <main className="admin-page"><div className="admin-title"><div><h1>Administrator dashboard</h1><p>Analytics, triage and reporting</p></div><div><button className="secondary" onClick={csv}>Export CSV</button><button className="primary" onClick={pdf}>Export PDF</button></div></div>
    <div className="metric-grid"><article className="metric"><strong>{summary.total || 0}</strong><b>Total</b></article>{chart.slice(0, 3).map(row => <article className="metric" key={row.name}><strong>{row.value}</strong><b>{row.name}</b></article>)}</div>
    <div className="dash-grid"><section className="panel"><h3>Status distribution</h3><ResponsiveContainer height={260}><PieChart><Pie data={chart} dataKey="value" nameKey="name" fill="#2e8568" label /><Tooltip /></PieChart></ResponsiveContainer></section>
      <section className="panel"><h3>Monthly reports</h3><ResponsiveContainer height={260}><BarChart data={summary.monthly || []}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="_id.month" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#216b55" /></BarChart></ResponsiveContainer></section></div>
    <section className="panel"><h3>Complaint map</h3><MapPicker value={{}} onChange={() => {}} markers={complaints} /></section>
    <section className="panel"><div className="filter-row"><input placeholder="Search" value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} /><select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}><option value="">All statuses</option>{['Submitted','Under Review','Assigned','In Progress','Resolved','Rejected'].map(x => <option key={x}>{x}</option>)}</select><select value={filters.priority} onChange={e => setFilters({ ...filters, priority: e.target.value })}><option value="">All priorities</option>{['Low','Medium','High','Critical'].map(x => <option key={x}>{x}</option>)}</select><input placeholder="Ward" value={filters.ward} onChange={e => setFilters({ ...filters, ward: e.target.value })} /><button className="primary" onClick={load}>Filter</button></div>
      <div className="admin-list">{complaints.map(item => <article key={item._id}><div><Link to={`/complaints/${item._id}`}><b>{item.title}</b></Link><small>{item.reference} · {item.category} · {item.location?.ward || 'No ward'}</small></div><select value={item.status} onChange={e => update(item._id, { status: e.target.value })}>{['Submitted','Under Review','Assigned','In Progress','Resolved','Rejected'].map(x => <option key={x}>{x}</option>)}</select><select value={item.priority} onChange={e => update(item._id, { priority: e.target.value })}>{['Low','Medium','High','Critical'].map(x => <option key={x}>{x}</option>)}</select><select value={item.department?._id || ''} onChange={e => update(item._id, { department: e.target.value })}><option value="">Department</option>{departments.map(x => <option value={x._id} key={x._id}>{x.name}</option>)}</select><select value={item.assignedTo?._id || ''} onChange={e => update(item._id, { assignedTo: e.target.value, status: 'Assigned' })}><option value="">Assignee</option>{assignees.map(x => <option value={x._id} key={x._id}>{x.name}</option>)}</select><button onClick={() => { const remark = prompt('Admin remark'); if (remark) update(item._id, { remark }); }}>Add remark</button></article>)}</div>
    </section>
  </main>;
}
