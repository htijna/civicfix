import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  FileDown,
  Filter,
  MapPin,
  MessageSquarePlus,
  RefreshCw,
  Search,
  ShieldCheck,
  Users
} from 'lucide-react';
import AuthenticatedShell from '../components/AuthenticatedShell';
import { api, API } from '../services/api';

const statuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];
const defaultFilters = { search: '', status: '', priority: '', ward: '' };

function statusClass(value) {
  return value.toLowerCase().replaceAll(' ', '-');
}

function Metric({ icon: Icon, value, label, note, tone }) {
  return (
    <article className="metric">
      <span className={tone}><Icon /></span>
      <div><strong>{value}</strong><b>{label}</b><small>{note}</small></div>
    </article>
  );
}

function StatusBadge({ value }) {
  return <span className={`status ${statusClass(value)}`}><i />{value}</span>;
}

function Section({ title, subtitle, children }) {
  return (
    <section className="admin-section">
      <div className="admin-section-title">
        <div><h2>{title}</h2><p>{subtitle}</p></div>
      </div>
      {children}
    </section>
  );
}

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState({ byStatus: {}, byPriority: {} });
  const [departments, setDepartments] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [activity, setActivity] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [remarkDrafts, setRemarkDrafts] = useState({});
  const [departmentForm, setDepartmentForm] = useState({ name: '', ward: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (nextFilters = defaultFilters) => {
    const query = new URLSearchParams(Object.entries(nextFilters).filter(([, value]) => value)).toString();
    try {
      const [list, stats, d, u, a] = await Promise.all([
        api(query ? `/complaints?${query}` : '/complaints'),
        api('/complaints/admin/summary'),
        api('/departments'),
        api('/users/assignees'),
        api('/users/activity')
      ]);

      setComplaints(list.complaints || []);
      setSummary(stats || {});
      setDepartments(d.departments || []);
      setAssignees(u.users || []);
      setActivity(a.activity || []);
      setError('');
    } catch (loadError) {
      setError(loadError.message);
      toast.error(loadError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  const statusCounts = useMemo(() => (
    statuses.map(status => ({ status, count: summary.byStatus?.[status] || 0 }))
  ), [summary]);

  const resolved = summary.byStatus?.Resolved || 0;
  const active = (summary.byStatus?.Assigned || 0) + (summary.byStatus?.['In Progress'] || 0);
  const urgent = (summary.byPriority?.High || 0) + (summary.byPriority?.Critical || 0);

  const updateComplaint = async (id, values) => {
    await api(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(values) });
    toast.success('Complaint updated');
    await load(filters);
  };

  const addRemark = async id => {
    const remark = remarkDrafts[id]?.trim();
    if (!remark) return toast.error('Add a remark first');
    await updateComplaint(id, { remark });
    setRemarkDrafts(current => ({ ...current, [id]: '' }));
  };

  const exportCsv = async () => {
    const response = await fetch(`${API}/reports/complaints.csv`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('civicfix_token')}` }
    });
    if (!response.ok) throw new Error('CSV export failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'civicfix-complaints.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.text('CivicFix Admin Summary', 15, 20);
    doc.text(`Total complaints: ${summary.total || 0}`, 15, 32);
    statusCounts.forEach((row, index) => doc.text(`${row.status}: ${row.count}`, 15, 46 + index * 8));
    doc.save('civicfix-admin-summary.pdf');
  };

  const createDepartment = async event => {
    event.preventDefault();
    await api('/departments', { method: 'POST', body: JSON.stringify(departmentForm) });
    toast.success('Department created');
    setDepartmentForm({ name: '', ward: '', email: '' });
    await load(filters);
  };

  return (
    <AuthenticatedShell
      title="Admin command center"
      subtitle="Citywide complaints, assignments, departments, and audit activity."
      action={
        <>
          <button className="secondary" onClick={() => load(filters)}><RefreshCw size={17} />Refresh</button>
          <button className="secondary" onClick={() => exportCsv().catch(error => toast.error(error.message))}><Download size={17} />CSV</button>
          <button className="primary" onClick={exportPdf}><FileDown size={17} />PDF</button>
        </>
      }
    >
      {error && <p className="form-error">{error}</p>}
      <Section title="Overview" subtitle="Current workload and priority signals.">
        <div className="metric-grid">
          <Metric icon={ShieldCheck} value={summary.total || 0} label="Total complaints" note="Across all wards" tone="green" />
          <Metric icon={Clock3} value={active} label="Active work" note="Assigned or in progress" tone="orange" />
          <Metric icon={AlertTriangle} value={urgent} label="High priority" note="High and critical cases" tone="purple" />
          <Metric icon={CheckCircle2} value={resolved} label="Resolved" note={`${summary.total ? Math.round(resolved / summary.total * 100) : 0}% closure rate`} tone="blue" />
        </div>
        <div className="admin-status-strip">
          {statusCounts.map(item => <span key={item.status}><b>{item.count}</b>{item.status}</span>)}
        </div>
      </Section>

      <Section title="Find Complaints" subtitle="Search and narrow the records before assigning work.">
        <div className="admin-filter-panel panel">
          <form className="admin-filter-grid" onSubmit={event => { event.preventDefault(); load(filters); }}>
            <label><Search size={16} /><input placeholder="Search title, place, category" value={filters.search} onChange={event => setFilters({ ...filters, search: event.target.value })} /></label>
            <select value={filters.status} onChange={event => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{statuses.map(value => <option key={value}>{value}</option>)}</select>
            <select value={filters.priority} onChange={event => setFilters({ ...filters, priority: event.target.value })}><option value="">All priorities</option>{priorities.map(value => <option key={value}>{value}</option>)}</select>
            <input placeholder="Ward" value={filters.ward} onChange={event => setFilters({ ...filters, ward: event.target.value })} />
            <button className="primary"><Filter size={17} />Apply</button>
          </form>
        </div>
      </Section>

      <Section title="Complaint Management" subtitle={`${complaints.length} records in view. Update status, priority, department, assignee, and remarks.`}>
        <div className="panel complaints">
          <div className="admin-table">
            {complaints.map(item => (
              <article key={item._id} className="admin-row">
                <div className="admin-case">
                  <Link to={`/complaints/${item._id}`}><b>{item.title}</b></Link>
                  <small>{item.reference} - {item.category} - {item.location?.ward || 'No ward'}</small>
                  <span><MapPin size={13} />{item.location?.address || 'No address supplied'}</span>
                </div>
                <StatusBadge value={item.status} />
                <select value={item.status} onChange={event => updateComplaint(item._id, { status: event.target.value })}>{statuses.map(value => <option key={value}>{value}</option>)}</select>
                <select value={item.priority} onChange={event => updateComplaint(item._id, { priority: event.target.value })}>{priorities.map(value => <option key={value}>{value}</option>)}</select>
                <select value={item.department?._id || ''} onChange={event => updateComplaint(item._id, { department: event.target.value })}>
                  <option value="">Department</option>
                  {departments.map(department => <option value={department._id} key={department._id}>{department.name}</option>)}
                </select>
                <select value={item.assignedTo?._id || ''} onChange={event => updateComplaint(item._id, { assignedTo: event.target.value, status: 'Assigned' })}>
                  <option value="">Assignee</option>
                  {assignees.map(user => <option value={user._id} key={user._id}>{user.name}</option>)}
                </select>
                <div className="admin-remark">
                  <input placeholder="Admin remark" value={remarkDrafts[item._id] || ''} onChange={event => setRemarkDrafts({ ...remarkDrafts, [item._id]: event.target.value })} />
                  <button className="secondary" onClick={() => addRemark(item._id)}><MessageSquarePlus size={15} /></button>
                </div>
              </article>
            ))}
            {!loading && !complaints.length && <p className="empty-state">No complaints match the current filters.</p>}
          </div>
        </div>
      </Section>

      <Section title="Administration" subtitle="Manage departments and review recent admin activity.">
        <div className="dash-grid admin-bottom">
          <section className="panel">
            <div className="panel-head"><div><h3>Departments</h3><p>{departments.length} active departments</p></div><Building2 size={18} /></div>
            <form className="department-form" onSubmit={createDepartment}>
              <input required placeholder="Department name" value={departmentForm.name} onChange={event => setDepartmentForm({ ...departmentForm, name: event.target.value })} />
              <input placeholder="Ward" value={departmentForm.ward} onChange={event => setDepartmentForm({ ...departmentForm, ward: event.target.value })} />
              <input type="email" placeholder="Email" value={departmentForm.email} onChange={event => setDepartmentForm({ ...departmentForm, email: event.target.value })} />
              <button className="primary">Add</button>
            </form>
            <div className="department-list">
              {departments.map(department => <div key={department._id}><b>{department.name}</b><small>{department.ward || 'All wards'} {department.email ? `- ${department.email}` : ''}</small></div>)}
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><div><h3>Audit activity</h3><p>Latest administrative changes</p></div><Users size={18} /></div>
            <div className="activity-list">
              {activity.slice(0, 8).map(item => (
                <article key={item._id}>
                  <b>{item.action?.replaceAll('_', ' ') || 'Activity'}</b>
                  <small>{item.user?.name || item.user?.email || 'System'} - {new Date(item.createdAt).toLocaleString('en-IN')}</small>
                </article>
              ))}
              {!activity.length && <p className="empty-state">No activity has been recorded yet.</p>}
            </div>
          </section>
        </div>
      </Section>
    </AuthenticatedShell>
  );
}
