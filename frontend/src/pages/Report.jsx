import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, FileText, MapPin } from 'lucide-react';
import Footer from '../components/Footer';
import Header from '../components/Header';
import IssuePhotoUploader from '../components/IssuePhotoUploader';
import MapPicker from '../components/MapPicker';
import { api as request } from '../services/api';

const categories = [
  'Damaged Road',
  'Potholes',
  'Water Leakage',
  'Broken Streetlight',
  'Garbage Overflow',
  'Illegal Waste Disposal',
  'Drainage Issue',
  'Tree Fall',
  'Traffic Signal Problem',
  'Public Toilet Issue',
  'Park Maintenance',
  'Other'
];

export default function Report() {
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
    e.preventDefault();
    setBusy(true);
    setError('');
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
          title: form.get('title'),
          description: form.get('description'),
          category: form.get('category'),
          contactNumber: form.get('contactNumber'),
          anonymous: form.get('anonymous') === 'on',
          images: uploadedImages,
          location: {
            address: location.address || form.get('address'),
            ward: location.ward || form.get('ward'),
            landmark: location.landmark || form.get('landmark'),
            latitude: Number.isFinite(location.latitude) ? location.latitude : (form.get('latitude') ? Number(form.get('latitude')) : undefined),
            longitude: Number.isFinite(location.longitude) ? location.longitude : (form.get('longitude') ? Number(form.get('longitude')) : undefined)
          }
        })
      });

      setReference(data.complaint.reference);
      setTimeout(() => nav('/dashboard'), 1800);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (reference) {
    return <div className="success-page"><span><Check /></span><h1>Complaint submitted</h1><p>Your tracking number is <b>{reference}</b></p><p>Taking you to your dashboard...</p></div>;
  }

  return (
    <>
      <Header />
      <main className="form-page">
        <div className="form-title"><div><span className="back" onClick={() => nav(-1)}>Back</span><h1>Report a civic issue</h1><p>This form creates a real complaint in MongoDB.</p></div></div>
        <form onSubmit={submit} className="report-form">
          {error && <p className="form-error">{error}</p>}
          <section className="form-card">
            <div className="card-title"><span><FileText /></span><div><h3>Issue details</h3><p>Describe the problem clearly.</p></div></div>
            <label>Complaint title <em>*</em><input name="title" required maxLength="120" placeholder="e.g. Large pothole near school entrance" /></label>
            <div className="two">
              <label><span>Category <em>*</em></span><select name="category" required defaultValue=""><option value="" disabled>Select a category</option>{categories.map(x => <option key={x}>{x}</option>)}</select></label>
              <label><span>Contact number</span><input name="contactNumber" placeholder="+91 98765 43210" /></label>
            </div>
            <label>Description <em>*</em><textarea name="description" required minLength="10" rows="5" placeholder="Describe what you observed and any safety concerns..." /></label>
          </section>
          <section className="form-card">
            <div className="card-title"><span><MapPin /></span><div><h3>Location</h3><p>Give the team enough detail to find it.</p></div></div>
            <label>Address <em>*</em><input name="address" required value={location.address || ''} onChange={e => updateLocation({ address: e.target.value, source: 'manual' })} placeholder="Street, landmark or area" /></label>
            <div className="two"><label>Ward<input name="ward" value={location.ward || ''} onChange={e => updateLocation({ ward: e.target.value })} placeholder="e.g. Ward 12" /></label><label>Landmark<input name="landmark" value={location.landmark || ''} onChange={e => updateLocation({ landmark: e.target.value })} placeholder="Opposite Government School" /></label></div>
            <div className="two"><label>Latitude<input name="latitude" type="number" step="any" value={Number.isFinite(location.latitude) ? location.latitude : ''} onChange={e => updateLocation({ latitude: e.target.value === '' ? undefined : Number(e.target.value), source: 'manual' })} placeholder="9.9312" /></label><label>Longitude<input name="longitude" type="number" step="any" value={Number.isFinite(location.longitude) ? location.longitude : ''} onChange={e => updateLocation({ longitude: e.target.value === '' ? undefined : Number(e.target.value), source: 'manual' })} placeholder="76.2673" /></label></div>
            <MapPicker value={location} onChange={updateLocation} />
          </section>
          <IssuePhotoUploader images={images} setImages={setImages} />
          <div className="form-bottom"><label className="check"><input name="anonymous" type="checkbox" /> Submit anonymously</label><button disabled={busy} className="primary">{busy ? 'Submitting...' : 'Submit complaint'} <ArrowRight /></button></div>
        </form>
      </main>
      <Footer />
    </>
  );
}
