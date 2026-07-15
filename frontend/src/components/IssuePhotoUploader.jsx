import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import Cropper from 'react-easy-crop';
import { Camera, Check, Crop, Image as ImageIcon, RotateCw, Trash, X } from 'lucide-react';

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const formatSize = bytes => {
  if (!bytes) return '0 KB';
  const units = ['B', 'KB', 'MB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
};

const loadImage = src => new Promise((resolve, reject) => {
  const image = new Image();
  image.addEventListener('load', () => resolve(image));
  image.addEventListener('error', reject);
  image.crossOrigin = 'anonymous';
  image.src = src;
});

async function cropImage(imageSrc, cropPixels, rotation = 0, fileName = 'issue-photo.jpg', fileType = 'image/jpeg') {
  const image = await loadImage(imageSrc);
  const radians = rotation * Math.PI / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = image.width * cos + image.height * sin;
  const rotatedHeight = image.width * sin + image.height * cos;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = rotatedWidth;
  canvas.height = rotatedHeight;
  context.translate(rotatedWidth / 2, rotatedHeight / 2);
  context.rotate(radians);
  context.translate(-image.width / 2, -image.height / 2);
  context.drawImage(image, 0, 0);

  const data = context.getImageData(cropPixels.x, cropPixels.y, cropPixels.width, cropPixels.height);
  canvas.width = cropPixels.width;
  canvas.height = cropPixels.height;
  context.putImageData(data, 0, 0);

  const blob = await new Promise(resolve => canvas.toBlob(resolve, fileType, 0.92));
  if (!blob) throw new Error('Could not crop the selected image.');
  return new File([blob], fileName.replace(/\.[^.]+$/, '') + '-cropped.jpg', { type: fileType, lastModified: Date.now() });
}

function validateFiles(files, currentCount) {
  const accepted = [];
  const errors = [];
  const remaining = MAX_IMAGES - currentCount;

  if (remaining <= 0) return { accepted, errors: ['You can upload a maximum of 5 images.'] };
  if (files.length > remaining) errors.push(`Only ${remaining} more image${remaining === 1 ? '' : 's'} can be added.`);

  files.slice(0, remaining).forEach(file => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      errors.push(`${file.name} is not supported. Use JPG, PNG, JPEG or WEBP.`);
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      errors.push(`${file.name} is larger than 5 MB.`);
      return;
    }
    accepted.push(file);
  });

  return { accepted, errors };
}

function CropModal({ file, onSave, onCancel }) {
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedArea, setCroppedArea] = useState(null);
  const [busy, setBusy] = useState(false);
  const titleId = useId();

  useEffect(() => {
    return () => URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  const save = async () => {
    if (!croppedArea) return;
    setBusy(true);
    try {
      const cropped = await cropImage(imageUrl, croppedArea, rotation, file.name, file.type || 'image/jpeg');
      onSave(cropped);
    } finally {
      setBusy(false);
    }
  };

  return <div className="crop-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby={titleId}>
    <div className="crop-modal">
      <div className="crop-modal-head">
        <div><h3 id={titleId}>Crop image</h3><p>Move, zoom and crop the selected photo.</p></div>
        <button type="button" className="icon-action" onClick={onCancel} aria-label="Cancel crop"><X /></button>
      </div>
      <div className="crop-stage">
        {imageUrl && <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onRotationChange={setRotation}
          onCropComplete={(_, areaPixels) => setCroppedArea(areaPixels)}
        />}
      </div>
      <div className="crop-controls">
        <label>Zoom<input type="range" min="1" max="3" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
        <label>Rotate<input type="range" min="0" max="360" step="1" value={rotation} onChange={e => setRotation(Number(e.target.value))} /></label>
        <button type="button" className="secondary" onClick={() => setRotation(value => (value + 90) % 360)}><RotateCw size={17} />Rotate</button>
      </div>
      <div className="crop-actions">
        <button type="button" className="secondary" onClick={onCancel}><X size={17} />Cancel</button>
        <button type="button" className="primary" onClick={save} disabled={busy}><Crop size={17} />{busy ? 'Saving...' : 'Crop & Save'}</button>
      </div>
    </div>
  </div>;
}

export default function IssuePhotoUploader({ images, setImages }) {
  const cameraInput = useRef(null);
  const galleryInput = useRef(null);
  const [queue, setQueue] = useState([]);
  const [message, setMessage] = useState('');
  const previewUrls = useMemo(() => images.map(image => ({
    file: image,
    url: URL.createObjectURL(image)
  })), [images]);

  useEffect(() => () => previewUrls.forEach(item => URL.revokeObjectURL(item.url)), [previewUrls]);

  const handleFiles = event => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    setMessage('');
    const { accepted, errors } = validateFiles(files, images.length + queue.length);
    if (errors.length) setMessage(errors.join(' '));
    if (accepted.length) setQueue(current => [...current, ...accepted]);
  };

  const saveCropped = useCallback(file => {
    setImages(current => [...current, file].slice(0, MAX_IMAGES));
    setQueue(current => current.slice(1));
    setMessage('Image cropped and added.');
  }, [setImages]);

  const cancelCrop = () => {
    setQueue(current => current.slice(1));
    setMessage('Image selection cancelled.');
  };

  const removeImage = index => setImages(current => current.filter((_, itemIndex) => itemIndex !== index));

  return <section className="form-card">
    <div className="card-title"><span><ImageIcon /></span><div><h3>Photos</h3><p>Capture or choose up to five clear issue photos.</p></div></div>
    <div className="upload-choice-grid">
      <button type="button" className="upload-choice" onClick={() => cameraInput.current?.click()} aria-label="Take photo">
        <span><Camera /></span><b>Take Photo</b><small>Open camera on mobile</small>
      </button>
      <button type="button" className="upload-choice" onClick={() => galleryInput.current?.click()} aria-label="Choose from gallery">
        <span><ImageIcon /></span><b>Choose from Gallery</b><small>JPG, PNG, JPEG or WEBP</small>
      </button>
    </div>
    <input ref={cameraInput} className="sr-only" type="file" accept="image/*" capture="environment" onChange={handleFiles} aria-label="Take photo" />
    <input ref={galleryInput} className="sr-only" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" multiple onChange={handleFiles} aria-label="Choose images from gallery" />
    <div className="upload-meta">
      <p><Check size={15} />{images.length}/5 images selected</p>
      <p>Maximum 5 MB per image.</p>
    </div>
    {message && <p className="form-info" role="status">{message}</p>}
    {!!previewUrls.length && <div className="image-previews">{previewUrls.map(({ file, url }, index) => <figure key={`${file.name}-${file.lastModified}-${index}`}>
      <img src={url} alt={`Selected issue evidence ${index + 1}`} />
      <figcaption><b>{file.name}</b><small>{formatSize(file.size)}</small></figcaption>
      <button type="button" onClick={() => removeImage(index)} aria-label={`Remove ${file.name}`}><Trash size={15} /></button>
    </figure>)}</div>}
    {queue[0] && <CropModal file={queue[0]} onSave={saveCropped} onCancel={cancelCrop} />}
  </section>;
}
