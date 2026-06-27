import sanitizeHtml from 'sanitize-html';

function clean(value) {
  if (typeof value === 'string') return sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} }).trim();
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) value[key] = clean(value[key]);
  }
  return value;
}

export function sanitizeInput(req, _res, next) {
  if (req.body) clean(req.body);
  next();
}
