/**
 * importGIS.js
 *
 * Downloads official Kerala LSGD ward boundary data from wardmap.ksmart.live
 * (2024 delimitation), then inserts LocalAuthority and WardBoundary documents
 * into MongoDB with real GeoJSON Polygon/MultiPolygon geometry.
 *
 * Source: Kerala Information Kerala Mission / K-SMART ward delimitation data
 *        via github.com/Vonter/kerala-wards mapping index.
 *
 * Usage:  node backend/scripts/importGIS.js
 *         node backend/scripts/importGIS.js --district Thrissur
 *         node backend/scripts/importGIS.js --district Ernakulam
 *         node backend/scripts/importGIS.js --localbody "Thrissur"
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import LocalAuthority from '../models/LocalAuthority.js';
import WardBoundary from '../models/WardBoundary.js';

/* ── Config ─────────────────────────────────────────────────────────── */

const MAPPING_URL = 'https://raw.githubusercontent.com/Vonter/kerala-wards/main/district_localbody_mapping.json';
const KSMART_BASE = 'https://wardmap.ksmart.live/files/';
const TARGET_DISTRICTS = ['Thrissur', 'Ernakulam'];
const DELAY_MS = 500; // polite delay between downloads

/* ── CLI args ───────────────────────────────────────────────────────── */

const args = process.argv.slice(2);
const districtFilter = args.includes('--district') ? args[args.indexOf('--district') + 1] : null;
const lbFilter = args.includes('--localbody') ? args[args.indexOf('--localbody') + 1] : null;

/* ── Helpers ────────────────────────────────────────────────────────── */

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

function slugify(district, lsgd) {
  return `${district}_${lsgd}`.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

/**
 * Merge an array of GeoJSON Polygon/MultiPolygon features into one MultiPolygon
 * by collecting all polygon rings into a single coordinate array.
 */
function mergeFeaturesToMultiPolygon(features) {
  const allRings = [];
  for (const f of features) {
    if (!f.geometry || !f.geometry.coordinates) continue;
    if (f.geometry.type === 'Polygon') {
      allRings.push(f.geometry.coordinates);
    } else if (f.geometry.type === 'MultiPolygon') {
      allRings.push(...f.geometry.coordinates);
    }
  }
  if (allRings.length === 0) return null;
  if (allRings.length === 1) {
    return { type: 'Polygon', coordinates: allRings[0] };
  }
  return { type: 'MultiPolygon', coordinates: allRings };
}

/**
 * Download JSON from a URL with retries.
 */
async function fetchJson(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      if (i === retries) throw err;
      console.warn(`  ⚠  Retry ${i + 1}/${retries} for ${url}: ${err.message}`);
      await sleep(2000);
    }
  }
}

/* ── Main ───────────────────────────────────────────────────────────── */

async function main() {
  console.log('🌍 CivicFix GIS Import — Official Kerala LSGD Ward Boundaries\n');

  // Connect to MongoDB
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicfix';
  await mongoose.connect(uri);
  console.log('✅ MongoDB connected\n');

  // Download mapping index
  console.log('📥 Downloading district → local body mapping …');
  const mapping = await fetchJson(MAPPING_URL);
  console.log(`   Found ${Object.keys(mapping).length} districts in mapping index\n`);

  const districts = districtFilter
    ? [districtFilter]
    : TARGET_DISTRICTS;

  let totalLAs = 0;
  let totalWards = 0;
  let skipped = 0;

  for (const district of districts) {
    const localBodies = mapping[district];
    if (!localBodies) {
      console.warn(`⚠  District "${district}" not found in mapping. Skipping.`);
      continue;
    }

    const lbList = Object.values(localBodies);
    console.log(`\n🏛  ${district} — ${lbList.length} local bodies`);

    for (const lb of lbList) {
      const lsgdName = lb.LocalBody;
      if (lbFilter && lsgdName.toLowerCase() !== lbFilter.toLowerCase()) continue;

      // Derive JSON URL from HTML URL
      const htmlUrl = lb.HTMLPage;
      const jsonUrl = htmlUrl.replace(/\.html$/, '.json');

      console.log(`  📍 ${lsgdName} …`);

      let geojson;
      try {
        geojson = await fetchJson(jsonUrl);
      } catch (err) {
        console.warn(`     ⚠  Could not fetch ${lsgdName}: ${err.message}. Skipping.`);
        skipped++;
        await sleep(DELAY_MS);
        continue;
      }

      if (!geojson.features || geojson.features.length === 0) {
        console.warn(`     ⚠  No features in ${lsgdName}. Skipping.`);
        skipped++;
        await sleep(DELAY_MS);
        continue;
      }

      // Determine LSGD type from first feature
      const lsgdType = geojson.features[0]?.properties?.Lsgd_Type || 'Unknown';

      // Create merged boundary for the Local Authority (union of all wards)
      let mergedBoundary = mergeFeaturesToMultiPolygon(geojson.features);
      if (!mergedBoundary) {
        console.warn(`     ⚠  Could not merge boundary for ${lsgdName}. Skipping.`);
        skipped++;
        continue;
      }
      
      const turf = await import('@turf/turf');
      try {
        mergedBoundary = turf.buffer(turf.feature(mergedBoundary), 0).geometry;
      } catch (e) {
        console.warn(`     ⚠  Could not buffer merged boundary for ${lsgdName}: ${e.message}`);
      }

      const laCode = slugify(district, lsgdName);

      // Upsert LocalAuthority
      let la;
      try {
        la = await LocalAuthority.findOneAndUpdate(
          { code: laCode },
          {
            $set: {
              name: `${lsgdName} ${lsgdType}`,
              code: laCode,
              district,
              state: 'Kerala',
              source: 'official_gis',
              boundary: mergedBoundary,
              status: true
            }
          },
          { upsert: true, new: true, runValidators: true }
        );
        totalLAs++;
      } catch (err) {
        console.warn(`     ⚠  Failed to insert LocalAuthority ${lsgdName}: ${err.message}. Skipping its wards.`);
        skipped++;
        continue;
      }

      // Insert ward boundaries
      let wardCount = 0;
      for (const feature of geojson.features) {
        const props = feature.properties || {};
        const wardName = props.Ward_Name || `Ward ${props.Ward_No || 'Unknown'}`;
        const wardNo = props.Ward_No != null ? String(props.Ward_No) : null;
        const wardCode = `${laCode}_ward_${wardNo || wardCount + 1}`;

        if (!feature.geometry || !feature.geometry.coordinates) continue;

        let geom = feature.geometry;
        try {
          const turf = await import('@turf/turf');
          geom = turf.buffer(turf.feature(geom), 0).geometry;
        } catch (e) {
          console.warn(`       ⚠  Could not buffer ward ${wardName}: ${e.message}`);
        }

        try {
          await WardBoundary.findOneAndUpdate(
            { code: wardCode },
            {
              $set: {
                name: wardName,
                number: wardNo,
                code: wardCode,
                district,
                localAuthority: la._id,
                boundary: {
                  type: geom.type,
                  coordinates: geom.coordinates
                },
                status: true
              }
            },
            { upsert: true, new: true, runValidators: true }
          );
          wardCount++;
        } catch (err) {
           console.warn(`       ⚠  Failed to insert ${wardName}: ${err.message}`);
        }
      }

      totalWards += wardCount;
      console.log(`     ✅ ${wardCount} wards imported`);

      await sleep(DELAY_MS);
    }
  }

  // Ensure indexes
  console.log('\n📐 Ensuring 2dsphere indexes …');
  await LocalAuthority.collection.createIndex({ boundary: '2dsphere' });
  await WardBoundary.collection.createIndex({ boundary: '2dsphere' });

  console.log(`\n🎉 Import complete!`);
  console.log(`   Local Authorities: ${totalLAs}`);
  console.log(`   Wards:            ${totalWards}`);
  if (skipped) console.log(`   Skipped:          ${skipped}`);

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('❌ Import failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
