import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export default function ComplaintDetails() {
  const { id } = useParams(); const nav = useNavigate();
  const [item, setItem] = useState(null);
  useEffect(() => { api(`/complaints/${id}`).then(data => setItem(data.complaint)).catch(error => toast.error(error.message)); }, [id]);
  const remove = async () => { if (!confirm('Delete this submitted complaint?')) return; await api(`/complaints/${id}`, { method: 'DELETE' }); toast.success('Complaint deleted'); nav('/dashboard'); };
  const edit = async () => {
    const title = prompt('Complaint title', item.title); if (!title) return;
    const description = prompt('Description', item.description); if (!description) return;
    const data = await api(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify({ title, description }) });
    setItem(data.complaint); toast.success('Complaint updated');
  };
  if (!item) return <main className="standalone-page">Loading complaint…</main>;
  return <main className="standalone-page complaint-detail">
    <Link to="/dashboard">← Dashboard</Link><section className="form-card"><div className="detail-head"><div><small>{item.reference}</small><h1>{item.title}</h1></div><span className="status">{item.status}</span></div>
      <p>{item.description}</p><dl><dt>Category</dt><dd>{item.category}</dd><dt>Priority</dt><dd>{item.priority}</dd><dt>Address</dt><dd>{item.location?.address}</dd></dl>
      {!!item.images?.length && <div className="gallery">{item.images.map(url => <img key={url} src={url} alt="Complaint" />)}</div>}
      <h2>Progress timeline</h2><div className="real-timeline">{item.timeline.map((event, index) => <article key={`${event.at}-${index}`}><i /><div><b>{event.status}</b><p>{event.remark}</p><small>{new Date(event.at).toLocaleString()}</small></div></article>)}</div>
      {!!item.adminRemarks?.length && <><h2>Admin remarks</h2>{item.adminRemarks.map((remark, index) => <p key={index}>{remark.message}</p>)}</>}
      {item.status === 'Submitted' && <div className="detail-actions"><button className="secondary" onClick={edit}>Edit complaint</button><button className="danger-btn" onClick={remove}>Delete complaint</button></div>}
    </section>
  </main>;
}
