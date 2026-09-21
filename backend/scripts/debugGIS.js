import 'dotenv/config';
import mongoose from 'mongoose';
import LocalAuthority from '../models/LocalAuthority.js';
import WardBoundary from '../models/WardBoundary.js';

await mongoose.connect(process.env.MONGODB_URI);

// Test the exact coordinates from the user's last complaint
const testCoords = [
  { name: 'Puthukkad (user complaint)', lon: 76.2567, lat: 10.4227 },
  { name: 'Thrissur City (known working)', lon: 76.2144, lat: 10.5276 },
];

for (const tc of testCoords) {
  const point = { type: 'Point', coordinates: [tc.lon, tc.lat] };
  const la = await LocalAuthority.findOne({
    boundary: { $geoIntersects: { $geometry: point } },
    status: true
  });
  const ward = la ? await WardBoundary.findOne({
    localAuthority: la._id,
    boundary: { $geoIntersects: { $geometry: point } },
    status: true
  }) : null;
  console.log(`${tc.name}: LA=${la?.name || 'NOT FOUND'}, Ward=${ward?.name || 'NOT FOUND'}`);
}

// Also check: is there a Puthukkad local authority imported?
const puthukkad = await LocalAuthority.findOne({ name: /puthuk/i });
console.log('\nPuthukkad LA in DB:', puthukkad ? `${puthukkad.name} (${puthukkad.code})` : 'NOT FOUND');

// How many LAs are from official_gis source?
const count = await LocalAuthority.countDocuments({ source: 'official_gis' });
console.log('Total official_gis LAs:', count);

await mongoose.disconnect();
