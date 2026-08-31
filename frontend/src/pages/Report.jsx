import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, FileText, MapPin, Sparkles, RefreshCw } from 'lucide-react';
import AuthenticatedShell from '../components/AuthenticatedShell';
import IssuePhotoUploader from '../components/IssuePhotoUploader';
import MapPicker from '../components/MapPicker';
import { api as request } from '../services/api';

export default function Report() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [images, setImages] = useState([]);
  const [location, setLocation] = useState({});
  const lastAnalyzedImageRef = useRef(null);

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

  // Derive title & description when a photo is added
  useEffect(() => {
    if (!images || images.length === 0) return;

    const primaryImage = images[0];
    const imageKey = `${primaryImage.name}-${primaryImage.size}-${primaryImage.lastModified}`;
    if (lastAnalyzedImageRef.current === imageKey) return;
    lastAnalyzedImageRef.current = imageKey;

    let isSubscribed = true;

    async function deriveDetailsFromImage() {
      try {
        setAnalyzingImage(true);
        // 1. Upload temporary/selected image to get url or process through ML
        const uploadBody = new FormData();
        uploadBody.append('images', primaryImage);
        const uploadData = await request('/uploads', { method: 'POST', body: uploadBody });

        if (!isSubscribed) return;

        if (uploadData?.urls?.length) {
          const imageUrl = uploadData.urls[0];
          // 2. Call AI suggestion endpoint
          const suggestion = await request('/ai/suggest', {
            method: 'POST',
            body: JSON.stringify({
              images: [imageUrl],
              location: {
                address: location.address || '',
                ward: location.ward || '',
                landmark: location.landmark || ''
              }
            })
          });

          if (!isSubscribed) return;

          if (suggestion?.title) {
            setTitle(suggestion.title);
            setDescription(suggestion.description);
            setAiGenerated(true);
          }
        }
      } catch (err) {
        console.warn('AI image auto-derivation notice:', err.message);
      } finally {
        if (isSubscribed) {
          setAnalyzingImage(false);
        }
      }
    }

    deriveDetailsFromImage();

    return () => {
      isSubscribed = false;
    };
  }, [images, location.address, location.landmark, location.ward]);

  const updateLocation = changes => setLocation(current => ({ ...current, ...changes }));

  const handleManualDerive = async () => {
    if (!images.length) {
      setError('Please select or capture a photo first to derive issue details.');
      return;
    }
    try {
      setAnalyzingImage(true);
      setError('');
      const uploadBody = new FormData();
      uploadBody.append('images', images[0]);
      const uploadData = await request('/uploads', { method: 'POST', body: uploadBody });

      if (uploadData?.urls?.length) {
        const suggestion = await request('/ai/suggest', {
          method: 'POST',
          body: JSON.stringify({
            images: [uploadData.urls[0]],
            location: {
              address: location.address || '',
              ward: location.ward || '',
              landmark: location.landmark || ''
            }
          })
        });

        if (suggestion?.title) {
          setTitle(suggestion.title);
          setDescription(suggestion.description);
          setAiGenerated(true);
        }
      }
    } catch (err) {
      setError('Could not derive details from image: ' + err.message);
    } finally {
      setAnalyzingImage(false);
    }
  };

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
          title: title || form.get('title'),
          description: description || form.get('description'),
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
    return (
      <AuthenticatedShell title="Complaint submitted" subtitle="Your report is saved and ready to track.">
        <div className="success-page"><span><Check /></span><h1>Complaint submitted</h1><p>Your tracking number is <b>{reference}</b></p><p>Taking you to your dashboard...</p></div>
      </AuthenticatedShell>
    );
  }

  return (
    <AuthenticatedShell title="Report a civic issue" subtitle="This form creates a real complaint in MongoDB.">
      <main className="form-page">
        <div className="form-title"><div><span className="back" onClick={() => nav(-1)}>Back</span><h1>Report a civic issue</h1><p>Upload a photo or enter details. Our AI model can auto-derive the title and description directly from your photo.</p></div></div>
        <form onSubmit={submit} className="report-form">
          {error && <p className="form-error">{error}</p>}
          
          <IssuePhotoUploader images={images} setImages={setImages} />

          <section className="form-card">
            <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '13px', alignItems: 'center' }}>
                <span><FileText /></span>
                <div>
                  <h3>Issue details</h3>
                  <p>Derived automatically from image or edited manually.</p>
                </div>
              </div>
              {images.length > 0 && (
                <button
                  type="button"
                  onClick={handleManualDerive}
                  disabled={analyzingImage}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: '#216b55',
                    background: '#e6f1ec',
                    border: '1px solid #c8ded5',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    cursor: analyzingImage ? 'wait' : 'pointer'
                  }}
                >
                  <Sparkles size={14} />
                  {analyzingImage ? 'Analyzing Image...' : 'Re-derive from Image'}
                </button>
              )}
            </div>

            {analyzingImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#2563eb', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', padding: '0.65rem 1rem', borderRadius: '0.5rem', marginBottom: '1.2rem' }}>
                <RefreshCw size={16} className="spinning" style={{ animation: 'spin 1s linear infinite' }} />
                <span>AI Vision Engine is analyzing your image to derive issue title and description...</span>
              </div>
            )}

            {aiGenerated && !analyzingImage && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.85rem', color: '#059669', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.5rem 1rem', borderRadius: '0.5rem', marginBottom: '1.2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={15} />
                  <span><b>AI Auto-Derived:</b> Title and description were generated from your uploaded image. Feel free to refine or edit them.</span>
                </div>
              </div>
            )}

            <label>
              Complaint title <em>*</em>
              <input
                name="title"
                required
                maxLength="120"
                value={title}
                onChange={e => { setTitle(e.target.value); setAiGenerated(false); }}
                placeholder="e.g. Large pothole near school entrance"
              />
            </label>
            <div className="two">
              <label><span>Contact number</span><input name="contactNumber" placeholder="+91 98765 43210" /></label>
              <div className="ai-note" style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: '#059669', backgroundColor: '#ecfdf5', padding: '0.5rem 1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                <Check size={16} style={{ marginRight: '0.5rem' }} />
                <span>Our AI Engine automatically routes complaints to the responsible municipal department.</span>
              </div>
            </div>
            <label>
              Description <em>*</em>
              <textarea
                name="description"
                required
                minLength="10"
                rows="5"
                value={description}
                onChange={e => { setDescription(e.target.value); setAiGenerated(false); }}
                placeholder="Describe what you observed and any safety concerns..."
              />
            </label>
          </section>

          <section className="form-card">
            <div className="card-title"><span><MapPin /></span><div><h3>Location</h3><p>Give the team enough detail to find it.</p></div></div>
            <label>Address <em>*</em><input name="address" required value={location.address || ''} onChange={e => updateLocation({ address: e.target.value, source: 'manual' })} placeholder="Street, landmark or area" /></label>
            <div className="two"><label>Ward<input name="ward" value={location.ward || ''} onChange={e => updateLocation({ ward: e.target.value })} placeholder="e.g. Ward 12" /></label><label>Landmark<input name="landmark" value={location.landmark || ''} onChange={e => updateLocation({ landmark: e.target.value })} placeholder="Opposite Government School" /></label></div>
            <div className="two"><label>Latitude<input name="latitude" type="number" step="any" value={Number.isFinite(location.latitude) ? location.latitude : ''} onChange={e => updateLocation({ latitude: e.target.value === '' ? undefined : Number(e.target.value), source: 'manual' })} placeholder="9.9312" /></label><label>Longitude<input name="longitude" type="number" step="any" value={Number.isFinite(location.longitude) ? location.longitude : ''} onChange={e => updateLocation({ longitude: e.target.value === '' ? undefined : Number(e.target.value), source: 'manual' })} placeholder="76.2673" /></label></div>
            <MapPicker value={location} onChange={updateLocation} />
          </section>

          <div className="form-bottom"><label className="check"><input name="anonymous" type="checkbox" /> Submit anonymously</label><button disabled={busy || analyzingImage} className="primary">{busy ? 'Submitting...' : 'Submit complaint'} <ArrowRight /></button></div>
        </form>
      </main>
    </AuthenticatedShell>
  );
}

