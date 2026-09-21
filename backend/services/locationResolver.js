import LocalAuthority from '../models/LocalAuthority.js';
import WardBoundary from '../models/WardBoundary.js';

const ADDRESS_PARTS_TO_SKIP = new Set(['kerala', 'india']);

export function slug(value = '') {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function pickAreaName(address = '') {
  const parts = String(address)
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
  return parts.find(part => !ADDRESS_PARTS_TO_SKIP.has(part.toLowerCase())) || parts[0] || '';
}

function pointFromLocation(location = {}) {
  // Prefer explicit latitude/longitude fields; fallback to coordinates array if present.
  const longitude = Number(location.longitude ?? (Array.isArray(location.coordinates) ? location.coordinates[0] : undefined));
  const latitude = Number(location.latitude ?? (Array.isArray(location.coordinates) ? location.coordinates[1] : undefined));
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return {
    type: 'Point',
    coordinates: [longitude, latitude]
  };
}

function areaNameFromReverseAddress(address = {}) {
  return address.city
    || address.town
    || address.municipality
    || address.village
    || address.suburb
    || address.county
    || '';
}

async function reverseGeocodeWithConfiguredService(point) {
  if (!point || !process.env.REVERSE_GEOCODER_URL) return null;

  const [longitude, latitude] = point.coordinates;
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude)
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.REVERSE_GEOCODER_TIMEOUT_MS) || 3500);

  try {
    const response = await fetch(`${process.env.REVERSE_GEOCODER_URL}?${params}`, {
      signal: controller.signal,
      headers: process.env.REVERSE_GEOCODER_API_KEY
        ? { Authorization: `Bearer ${process.env.REVERSE_GEOCODER_API_KEY}` }
        : undefined
    });
    if (!response.ok) return null;
    const data = await response.json();
    return {
      address: data?.display_name || data?.address || '',
      areaName: data?.areaName || data?.localAuthority || areaNameFromReverseAddress(data?.address || {})
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function findLocalAuthority(point) {
  return LocalAuthority.findOne({
    // Removed district restriction to enable detection across all districts
    boundary: { $geoIntersects: { $geometry: point } },
    status: true
  });
}

async function findWard(point, localAuthorityId) {
  return WardBoundary.findOne({
    localAuthority: localAuthorityId,
    boundary: { $geoIntersects: { $geometry: point } },
    status: true
  });
}

async function findOrCreateLocalAuthorityFromAddress(address) {
  const name = pickAreaName(address);
  const code = slug(name);
  if (!name || !code) return null;

  return LocalAuthority.findOneAndUpdate(
    { code },
    {
      $setOnInsert: {
        name,
        code,
        state: 'Kerala',
        source: 'auto_detected',
        detectedAddress: address,
        status: true
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
}

export async function resolveGisBoundariesFromComplaintLocation(location = {}) {
  const point = pointFromLocation(location);
  if (!point) {
    const localAuthority = await findOrCreateLocalAuthorityFromAddress(location.address);
    return { point: null, localAuthority, ward: null };
  }

  const localAuthority = await findLocalAuthority(point);
  if (!localAuthority) {
    const reverseLocation = await reverseGeocodeWithConfiguredService(point);
    const reverseAddress = reverseLocation?.address || '';
    const addressAuthority = await findOrCreateLocalAuthorityFromAddress(reverseLocation?.areaName || reverseAddress || location.address);
    if (reverseAddress && !location.address) location.address = reverseAddress;
    return { point, localAuthority: addressAuthority, ward: null };
  }

  const ward = await findWard(point, localAuthority._id);
  return { point, localAuthority, ward };
}

export const locationResolverInternals = { pointFromLocation, pickAreaName, slug, areaNameFromReverseAddress };
