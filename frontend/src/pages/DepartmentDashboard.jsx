import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, Clock3, FileText, PlayCircle, Send, ShieldCheck } from 'lucide-react';
import AuthenticatedShell from '../components/AuthenticatedShell';
import { api } from '../services/api';

const statuses = ['Assigned', 'Accepted', 'In Progress', 'Resolution Submitted', 'Resolved'];

function Metric({ icon: Icon, value, label }) {
  return <article className="metric"><span className="green"><Icon /></span><div><strong>{value}</strong><b>{label}</b><small>Department queue</small></div></article>;
}

function StatusBadge({ value }) {
  return <span className={`status ${value.toLowerCase().replaceAll(' ', '-')}`}><i />{value}</span>;
}

function formatGps(location) {
  if (!Number.isFinite(location?.latitude) || !Number.isFinite(location?.longitude)) return 'Not captured';
  return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
}

export default function DepartmentDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [summary, setSummary] = useState({ byStatus: {} });
  const [filter, setFilter] = useState('');
  const [remarks, setRemarks] = useState({});
  const [resolutionText, setResolutionText] = useState({});
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [list, stats] = await Promise.all([
        api(filter ? `/department/complaints?status=${encodeURIComponent(filter)}` : '/department/complaints'),
        api('/department/summary')
      ]);
      setComplaints(list.complaints || []);
      setSummary(stats || { byStatus: {} });
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    }
  }, [filter]);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  const counts = useMemo(() => summary.byStatus || {}, [summary.byStatus]);
  const update = async (id, values) => {
    await api(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(values) });
    toast.success('Complaint updated');
    await load();
  };

  const total = useMemo(() => Object.values(counts).reduce((sum, value) => sum + value, 0), [counts]);

  return (
    <AuthenticatedShell title="Department dashboard" subtitle="Assigned complaints routed automatically by AI.">
      {error && <p className="form-error">{error}</p>}
      <div className="metric-grid">
        <Metric icon={ShieldCheck} value={counts.Assigned || 0} label="New assignments" />
        <Metric icon={Clock3} value={counts.Accepted || 0} label="Accepted" />
        <Metric icon={PlayCircle} value={counts['In Progress'] || 0} label="In progress" />
        <Metric icon={CheckCircle2} value={counts.Resolved || 0} label="Resolved" />
      </div>

      <section className="panel complaints">
        <div className="panel-head">
          <div><h3>Assigned complaints</h3><p>{total} records in your department queue</p></div>
          <select value={filter} onChange={event => setFilter(event.target.value)}>
            <option value="">All statuses</option>
            {statuses.map(status => <option key={status}>{status}</option>)}
          </select>
        </div>
        <div className="department-queue">
          {complaints.map(item => (
            <article className="department-card" key={item._id}>
              <div className="department-card-head">
                <div>
                  <small>{item.reference}</small>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
                <StatusBadge value={item.status} />
              </div>
              <dl className="ai-grid">
                <dt>AI category</dt><dd>{item.aiAnalysis?.category || item.category}</dd>
                <dt>Department</dt><dd>{item.department?.name || item.aiAnalysis?.department || 'Not assigned'}</dd>
                <dt>Severity</dt><dd>{item.severity || 'Medium'}</dd>
                <dt>Priority</dt><dd>{item.priority}</dd>
                <dt>Confidence</dt><dd>{Math.round((item.aiConfidence || item.aiAnalysis?.confidence || 0) * 100)}%</dd>
                <dt>Service area</dt><dd>{item.localAuthority?.name || 'Not detected'}</dd>
                <dt>Location</dt><dd>{item.location?.address || 'Not supplied'}</dd>
                <dt>GPS</dt><dd>{formatGps(item.location)}</dd>
              </dl>
              {!!item.images?.length && <div className="gallery">{item.images.map(url => <img key={url} src={url} alt="Complaint" />)}</div>}
              <div className="department-actions">
                {item.status === 'Assigned' && <button className="secondary" onClick={() => update(item._id, { status: 'Accepted', remark: 'Complaint accepted by department' })}>Accept</button>}
                {['Assigned', 'Accepted'].includes(item.status) && <button className="secondary" onClick={() => update(item._id, { status: 'In Progress', remark: 'Work started by department' })}>Start work</button>}
                <input placeholder="Progress remark" value={remarks[item._id] || ''} onChange={event => setRemarks({ ...remarks, [item._id]: event.target.value })} />
                <button className="secondary" onClick={() => update(item._id, { remark: remarks[item._id] })}>Add remark</button>
                <input placeholder="Resolution description" value={resolutionText[item._id] || ''} onChange={event => setResolutionText({ ...resolutionText, [item._id]: event.target.value })} />
                <button className="primary" onClick={() => update(item._id, { status: 'Resolution Submitted', resolutionDescription: resolutionText[item._id], remark: resolutionText[item._id] })}><Send size={16} />Submit resolution</button>
                {item.status === 'Resolution Submitted' && <button className="primary" onClick={() => update(item._id, { status: 'Resolved', remark: 'Resolution verified and closed by department' })}><FileText size={16} />Mark resolved</button>}
              </div>
            </article>
          ))}
          {!complaints.length && <p className="empty-state">No complaints are assigned to your department.</p>}
        </div>
      </section>
    </AuthenticatedShell>
  );
}
