import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthenticatedShell from '../components/AuthenticatedShell';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const parseInline = (text) => {
  let parts = [text];
  
  // Bold **
  parts = parts.flatMap(part => {
    if (typeof part !== 'string') return [part];
    const split = part.split(/\*\*(.*?)\*\*/g);
    return split.map((s, i) => i % 2 === 1 ? <strong key={`b-${i}`} style={{ color: 'var(--ink)' }}>{s}</strong> : s);
  });
  
  // Code `
    parts = parts.flatMap(part => {
      if (typeof part !== 'string') return [part];
      const split = part.split(/`(.*?)`/g);
      return split.map((s, i) => i % 2 === 1 ? (
        <code key={`code-${i}`} style={{
          fontFamily: 'monospace',
          background: 'rgba(0,0,0,0.05)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '11px',
          color: 'var(--green)'
        }}>{s}</code>
      ) : s);
    });
  
  // Italic *
  parts = parts.flatMap(part => {
    if (typeof part !== 'string') return [part];
    const split = part.split(/\*(.*?)\*/g);
    return split.map((s, i) => i % 2 === 1 ? <em key={`em-${i}`}>{s}</em> : s);
  });
  
  return parts;
};

const renderMarkdown = (text) => {
  if (!text) return null;
  return text.split('\n').map((line, idx) => {
    let trimmed = line.trim();
    if (!trimmed) return <div key={idx} style={{ height: '8px' }} />;
    
    // Headers
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={idx} style={{ 
          fontSize: '14px', 
          fontWeight: '800', 
          color: 'var(--ink)', 
          margin: '16px 0 8px 0', 
          borderBottom: '1px solid var(--line)', 
          paddingBottom: '6px'
        }}>
          {parseInline(trimmed.slice(4))}
        </h3>
      );
    }
    if (trimmed.startsWith('#### ')) {
      return (
        <h4 key={idx} style={{ 
          fontSize: '11px', 
          fontWeight: '700', 
          color: 'var(--muted)', 
          margin: '12px 0 6px 0', 
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {parseInline(trimmed.slice(5))}
        </h4>
      );
    }
    
    // List item
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const isNested = line.startsWith('  ') || line.startsWith('\t');
      return (
        <div key={idx} style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          gap: '8px', 
          paddingLeft: isNested ? '16px' : '0',
          margin: '4px 0',
          fontSize: '12px',
          color: 'var(--ink)'
        }}>
          <span style={{ color: 'var(--green2)', fontWeight: 'bold' }}>•</span>
          <span>{parseInline(trimmed.slice(2))}</span>
        </div>
      );
    }
    
    // Normal paragraph
    return (
      <p key={idx} style={{ 
        fontSize: '12px', 
        lineHeight: '1.6', 
        color: 'var(--ink)', 
        margin: '5px 0' 
      }}>
        {parseInline(trimmed)}
      </p>
    );
  });
};

export default function ComplaintDetails() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);

  useEffect(() => {
    api(`/complaints/${id}`)
      .then(data => setItem(data.complaint))
      .catch(error => toast.error(error.message));
  }, [id]);

  const remove = async () => {
    if (!confirm('Delete this submitted complaint?')) return;
    await api(`/complaints/${id}`, { method: 'DELETE' });
    toast.success('Complaint deleted');
    nav('/dashboard');
  };

  const edit = async () => {
    const title = prompt('Complaint title', item.title);
    if (!title) return;
    const description = prompt('Description', item.description);
    if (!description) return;
    const data = await api(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify({ title, description }) });
    setItem(data.complaint);
    toast.success('Complaint updated');
  };

  if (!item) return <AuthenticatedShell title="Complaint details"><main className="form-page">Loading complaint...</main></AuthenticatedShell>;

  const backPath = user?.role === 'admin' ? '/admin' : user?.role === 'department_officer' ? '/department' : '/dashboard';

  return (
    <AuthenticatedShell title={item.title} subtitle={`${item.reference} - ${item.status}`}>
    <main className="form-page complaint-detail">
      <Link to={backPath}>&lt; Back</Link>
      <section className="form-card">
        <div className="detail-head">
          <div><small>{item.reference}</small><h1>{item.title}</h1></div>
          <span className="status">{item.status}</span>
        </div>
        <p>{item.description}</p>
        <dl>
          <dt>Category</dt><dd>{item.category}</dd>
          <dt>Priority</dt><dd>{item.priority}</dd>
          <dt>Severity</dt><dd>{item.severity || 'Medium'}</dd>
          <dt>Department</dt><dd>{item.department?.name || item.aiAnalysis?.department || 'Not assigned'}</dd>
          <dt>Service area</dt><dd>{item.localAuthority?.name || 'Not detected'}</dd>
          <dt>Address</dt><dd>{item.location?.address}</dd>
          <dt>GPS</dt><dd>{Number.isFinite(item.location?.latitude) && Number.isFinite(item.location?.longitude) ? `${item.location.latitude.toFixed(6)}, ${item.location.longitude.toFixed(6)}` : 'Not captured'}</dd>
        </dl>
        <h2>AI Analysis</h2>
        <dl className="ai-grid">
          <dt>Category</dt><dd>{item.aiAnalysis?.category || item.category}</dd>
          <dt>Department</dt><dd>{item.aiAnalysis?.department || item.department?.name || 'Exception'}</dd>
          <dt>Severity</dt><dd>{item.aiAnalysis?.severity || item.severity || 'Medium'}</dd>
          <dt>Priority</dt><dd>{item.aiAnalysis?.priority || item.priority}</dd>
          <dt>Confidence</dt><dd>{Math.round((item.aiConfidence || item.aiAnalysis?.confidence || 0) * 100)}%</dd>
          <dt>Reason</dt><dd>{item.aiAnalysis?.reason || item.aiAnalysis?.error || 'Stored with complaint'}</dd>
        </dl>
        {item.aiAnalysis?.description && (
          <div className="ai-report-card" style={{
            background: 'linear-gradient(135deg, var(--white) 0%, rgba(46, 133, 104, 0.04) 100%)',
            border: '1px solid var(--line)',
            borderLeft: '4px solid var(--green2)',
            borderRadius: '12px',
            padding: '20px 24px',
            margin: '20px 0 28px 0',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.01)'
          }}>
            {renderMarkdown(item.aiAnalysis.description)}
          </div>
        )}
        {!!item.images?.length && <div className="gallery">{item.images.map(url => <img key={url} src={url} alt="Complaint" />)}</div>}
        <h2>Progress timeline</h2>
        <div className="real-timeline">
          {item.timeline.map((event, index) => (
            <article key={`${event.at}-${index}`}>
              <i />
              <div><b>{event.status}</b><p>{event.remark}</p><small>{new Date(event.at).toLocaleString()}</small></div>
            </article>
          ))}
        </div>
        {!!item.adminRemarks?.length && <><h2>Admin remarks</h2>{item.adminRemarks.map((remark, index) => <p key={`admin-${index}`}>{remark.message}</p>)}</>}
        {!!item.departmentRemarks?.length && <><h2>Department remarks</h2>{item.departmentRemarks.map((remark, index) => <p key={`dept-${index}`}>{remark.message}</p>)}</>}
        {item.resolutionDescription && <><h2>Resolution</h2><p>{item.resolutionDescription}</p></>}
        {item.status === 'Submitted' && <div className="detail-actions"><button className="secondary" onClick={edit}>Edit complaint</button><button className="danger-btn" onClick={remove}>Delete complaint</button></div>}
      </section>
    </main>
    </AuthenticatedShell>
  );
}
