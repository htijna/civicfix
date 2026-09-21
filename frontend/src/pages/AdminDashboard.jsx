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
  Globe,
  MapPin,
  MessageSquarePlus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X
} from 'lucide-react';
import AuthenticatedShell from '../components/AuthenticatedShell';
import { api, API } from '../services/api';

const statuses = ['Submitted', 'Under Review', 'Assigned', 'Accepted', 'In Progress', 'Resolution Submitted', 'Resolved', 'Rejected', 'Exception'];
const priorities = ['Low', 'Medium', 'High', 'Critical'];
const severities = ['Low', 'Medium', 'High', 'Critical'];
const defaultFilters = { search: '', status: '', category: '', department: '', priority: '', severity: '', ward: '', from: '', to: '' };

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
  const [summary, setSummary] = useState({ byStatus: {}, byPriority: {}, bySeverity: {}, aiDepartments: [] });
  const [departments, setDepartments] = useState([]);
  const [localAuthorities, setLocalAuthorities] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [remarkDrafts, setRemarkDrafts] = useState({});
  const [departmentForm, setDepartmentForm] = useState({ name: '', ward: '', email: '', categories: '', localAuthority: '' });
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'department_officer', department: '', localAuthority: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [laForm, setLaForm] = useState({ name: '', code: '', district: '', state: '' });

  const load = useCallback(async (nextFilters = defaultFilters) => {
    const query = new URLSearchParams(Object.entries(nextFilters).filter(([, value]) => value)).toString();
    try {
      const [list, stats, d, la, u, allUsers, a] = await Promise.all([
        api(query ? `/complaints?${query}` : '/complaints'),
        api('/complaints/admin/summary'),
        api('/departments/admin/all'),
        api('/local-authorities'),
        api('/users/assignees'),
        api('/users'),
        api('/users/activity')
      ]);

      setComplaints(list.complaints || []);
      setSummary(stats || {});
      setDepartments(d.departments || []);
      setLocalAuthorities(la.localAuthorities || la || []);
      setAssignees(u.users || []);
      setUsers(allUsers.users || []);
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
  const active = (summary.byStatus?.Assigned || 0) + (summary.byStatus?.Accepted || 0) + (summary.byStatus?.['In Progress'] || 0);
  const urgent = (summary.byPriority?.High || 0) + (summary.byPriority?.Critical || 0);
  const resolutionSubmitted = summary.byStatus?.['Resolution Submitted'] || 0;

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
    if (!departmentForm.localAuthority) return toast.error('Please select a local authority');
    await api('/departments', {
      method: 'POST',
      body: JSON.stringify({
        ...departmentForm,
        categories: departmentForm.categories.split(',').map(value => value.trim()).filter(Boolean)
      })
    });
    toast.success('Department created');
    setDepartmentForm({ name: '', ward: '', email: '', categories: '', localAuthority: '' });
    await load(filters);
  };

  const updateDepartment = async (department, values) => {
    await api(`/departments/${department._id}`, { method: 'PUT', body: JSON.stringify(values) });
    toast.success('Department updated');
    await load(filters);
  };

  const updateUser = async (user, values) => {
    await api(`/users/${user._id}`, { method: 'PUT', body: JSON.stringify(values) });
    toast.success('User updated');
    await load(filters);
  };

  const deleteUser = async user => {
    setConfirmDelete(user);
  };

  const confirmDeleteUser = async () => {
    if (!confirmDelete) return;
    await api(`/users/${confirmDelete._id}`, { method: 'DELETE' });
    toast.success('User deleted');
    setConfirmDelete(null);
    await load(filters);
  };

  const createUser = async event => {
    event.preventDefault();
    if (userForm.role === 'department_officer' && (!userForm.department || !userForm.localAuthority)) return toast.error('Department officers must be linked to a department and local authority');
    await api('/users', { method: 'POST', body: JSON.stringify(userForm) });
    toast.success('User created');
    setUserForm({ name: '', email: '', password: '', role: 'department_officer', department: '', localAuthority: '' });
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
          <Metric icon={CheckCircle2} value={resolutionSubmitted} label="Resolution submitted" note={`${resolved} already resolved`} tone="blue" />
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
            <select value={filters.department} onChange={event => setFilters({ ...filters, department: event.target.value })}><option value="">All departments</option>{departments.map(value => <option value={value._id} key={value._id}>{value.name}</option>)}</select>
            <select value={filters.priority} onChange={event => setFilters({ ...filters, priority: event.target.value })}><option value="">All priorities</option>{priorities.map(value => <option key={value}>{value}</option>)}</select>
            <select value={filters.severity} onChange={event => setFilters({ ...filters, severity: event.target.value })}><option value="">All severities</option>{severities.map(value => <option key={value}>{value}</option>)}</select>
            <input placeholder="Ward" value={filters.ward} onChange={event => setFilters({ ...filters, ward: event.target.value })} />
            <input type="date" value={filters.from} onChange={event => setFilters({ ...filters, from: event.target.value })} />
            <input type="date" value={filters.to} onChange={event => setFilters({ ...filters, to: event.target.value })} />
            <button className="primary"><Filter size={17} />Apply</button>
          </form>
        </div>
      </Section>

      <Section title="AI Analytics" subtitle="Automatic categorization and department routing without admin approval.">
        <div className="metric-grid">
          <Metric icon={ShieldCheck} value={summary.aiAnalyzed || 0} label="AI analyzed" note="Complaints with stored prediction" tone="green" />
          <Metric icon={AlertTriangle} value={summary.byStatus?.Exception || 0} label="Exceptions" note="Only these need intervention" tone="orange" />
          <Metric icon={CheckCircle2} value={`${Math.round((summary.aiConfidenceAverage || 0) * 100)}%`} label="Avg. confidence" note="Department routing confidence" tone="blue" />
          <Metric icon={Building2} value={summary.aiDepartments?.length || 0} label="Routed departments" note="Detected by AI" tone="purple" />
        </div>
        <div className="admin-status-strip">
          {severities.map(value => <span key={value}><b>{summary.bySeverity?.[value] || 0}</b>{value} severity</span>)}
          {priorities.map(value => <span key={value}><b>{summary.byPriority?.[value] || 0}</b>{value} priority</span>)}
        </div>
      </Section>

      <Section title="Complaint Monitoring" subtitle={`${complaints.length} records in view. Normal assignment is automatic; admin edits are for exception handling only.`}>
        <div className="panel complaints">
          <div className="admin-table">
            {complaints.map(item => (
              <article key={item._id} className="admin-row">
                <div className="admin-case">
                  <Link to={`/complaints/${item._id}`}><b>{item.title}</b></Link>
                  <small>{item.reference} - AI: {item.aiAnalysis?.category || item.category} - {item.aiAnalysis?.department || item.department?.name || 'Exception'}</small>
                  <span><MapPin size={13} />{item.location?.address || 'No address supplied'}</span>
                </div>
                <StatusBadge value={item.status} />
                <select value={item.status} onChange={event => updateComplaint(item._id, { status: event.target.value })}>{statuses.map(value => <option key={value}>{value}</option>)}</select>
                <select value={item.priority} onChange={event => updateComplaint(item._id, { priority: event.target.value })}>{priorities.map(value => <option key={value}>{value}</option>)}</select>
                <select value={item.severity || 'Medium'} onChange={event => updateComplaint(item._id, { severity: event.target.value })}>{severities.map(value => <option key={value}>{value}</option>)}</select>
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

      <Section title="Administration" subtitle="Manage local authorities, departments, category mappings, users, and recent admin activity.">
        <div className="dash-grid admin-bottom">
          <section className="panel">
            <div className="panel-head"><div><h3>Local Authorities</h3><p>{localAuthorities.length} authorities</p></div><Globe size={18} /></div>
            <form className="department-form" onSubmit={async event => {
              event.preventDefault();
              if (!laForm.name || !laForm.code) return toast.error('Name and code are required');
              await api('/local-authorities', {
                method: 'POST',
                body: JSON.stringify({
                  ...laForm,
                  boundary: {
                    type: 'Polygon',
                    coordinates: [[[76.2, 9.9], [76.4, 9.9], [76.4, 10.1], [76.2, 10.1], [76.2, 9.9]]]
                  }
                })
              });
              toast.success('Local authority created');
              setLaForm({ name: '', code: '', district: '', state: '' });
              await load(filters);
            }}>
              <input required placeholder="Name (e.g. Kochi Municipal Corp.)" value={laForm.name} onChange={event => setLaForm({ ...laForm, name: event.target.value })} />
              <input required placeholder="Code (e.g. KCH)" value={laForm.code} onChange={event => setLaForm({ ...laForm, code: event.target.value })} />
              <input placeholder="District" value={laForm.district} onChange={event => setLaForm({ ...laForm, district: event.target.value })} />
              <input placeholder="State" value={laForm.state} onChange={event => setLaForm({ ...laForm, state: event.target.value })} />
              <button className="primary">Add</button>
            </form>
            <div className="department-list">
              {localAuthorities.map(la => (
                <div key={la._id}>
                  <b>{la.name}</b>
                  <small>{la.code} — {la.district || 'No district'}, {la.state || 'No state'}</small>
                </div>
              ))}
              {!localAuthorities.length && <p className="empty-state">No local authorities yet. Create one above to enable department routing.</p>}
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><div><h3>Departments</h3><p>{departments.length} active departments</p></div><Building2 size={18} /></div>
            <form className="department-form" onSubmit={createDepartment}>
              <input required placeholder="Department name" value={departmentForm.name} onChange={event => setDepartmentForm({ ...departmentForm, name: event.target.value })} />
              <select required value={departmentForm.localAuthority} onChange={event => setDepartmentForm({ ...departmentForm, localAuthority: event.target.value })}>
                <option value="">Local authority *</option>
                {localAuthorities.map(la => <option value={la._id} key={la._id}>{la.name}</option>)}
              </select>
              <input placeholder="Ward" value={departmentForm.ward} onChange={event => setDepartmentForm({ ...departmentForm, ward: event.target.value })} />
              <input type="email" placeholder="Email" value={departmentForm.email} onChange={event => setDepartmentForm({ ...departmentForm, email: event.target.value })} />
              <input placeholder="Categories, comma separated" value={departmentForm.categories} onChange={event => setDepartmentForm({ ...departmentForm, categories: event.target.value })} />
              <button className="primary">Add</button>
            </form>
            <div className="department-list">
              {departments.map(department => (
                <div key={department._id}>
                  <b>{department.name}</b>
                  <small>{department.active ? 'Active' : 'Inactive'} - {department.categories?.join(', ') || 'No category map'} {department.email ? `- ${department.email}` : ''}</small>
                  <button className="secondary" onClick={() => updateDepartment(department, { active: !department.active })}>{department.active ? 'Deactivate' : 'Activate'}</button>
                </div>
              ))}
            </div>
          </section>
          <section className="panel">
            <div className="panel-head"><div><h3>User management</h3><p>Citizens, admins, and department accounts</p></div><Users size={18} /></div>
            <form className="department-form" onSubmit={createUser}>
              <input required placeholder="Name" value={userForm.name} onChange={event => setUserForm({ ...userForm, name: event.target.value })} />
              <input required type="email" placeholder="Email" value={userForm.email} onChange={event => setUserForm({ ...userForm, email: event.target.value })} />
              <input required type="password" minLength="8" placeholder="Password" value={userForm.password} onChange={event => setUserForm({ ...userForm, password: event.target.value })} />
              <select value={userForm.role} onChange={event => setUserForm({ ...userForm, role: event.target.value })}>
                <option value="department_officer">Department Officer</option>
                <option value="admin">Admin</option>
                <option value="citizen">Citizen</option>
              </select>
              <select value={userForm.department} onChange={event => setUserForm({ ...userForm, department: event.target.value })} disabled={userForm.role !== 'department_officer'}>
                <option value="">Department</option>
                {departments.map(department => <option value={department._id} key={department._id}>{department.name}</option>)}
              </select>
              <select value={userForm.localAuthority} onChange={event => setUserForm({ ...userForm, localAuthority: event.target.value })} disabled={userForm.role !== 'department_officer'}>
                <option value="">Local authority</option>
                {localAuthorities.map(la => <option value={la._id} key={la._id}>{la.name}</option>)}
              </select>
              <button className="primary">Create</button>
            </form>
            <div className="activity-list">
              {users.slice(0, 10).map(user => (
                <article key={user._id}>
                  <b>{user.name || user.email}</b>
                  <small>{user.role} - {user.department?.name || 'No department'} - {user.active === false ? 'Inactive' : 'Active'}</small>
                  <button className="secondary" onClick={() => updateUser(user, { active: user.active === false })}>{user.active === false ? 'Activate' : 'Deactivate'}</button>
                  <button className="secondary" style={{ color: '#dc2626' }} onClick={() => deleteUser(user)}><Trash2 size={14} /></button>
                </article>
              ))}
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
      {confirmDelete && (
        <div className="crop-modal-backdrop" onClick={() => setConfirmDelete(null)}>
          <div className="crop-modal" style={{ maxWidth: 420, padding: 0 }} onClick={e => e.stopPropagation()}>
            <div className="crop-modal-head">
              <div>
                <h3 style={{ color: '#dc2626' }}>Delete User</h3>
                <p>This action is permanent and cannot be undone.</p>
              </div>
              <button type="button" className="icon-action" onClick={() => setConfirmDelete(null)} aria-label="Cancel"><X size={18} /></button>
            </div>
            <div style={{ padding: '20px' }}>
              <p style={{ margin: '0 0 6px', fontSize: 14 }}>Are you sure you want to permanently delete:</p>
              <p style={{ margin: '0 0 18px', fontWeight: 700, fontSize: 16 }}>{confirmDelete.name || confirmDelete.email}</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)' }}>Role: {confirmDelete.role} — {confirmDelete.department?.name || 'No department'}</p>
            </div>
            <div className="crop-actions" style={{ borderTop: '1px solid var(--line)', padding: '16px 20px' }}>
              <button className="secondary" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={confirmDeleteUser}>Delete permanently</button>
            </div>
          </div>
        </div>
      )}
    </AuthenticatedShell>
  );
}
