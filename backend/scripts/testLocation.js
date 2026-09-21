import 'dotenv/config';
import mongoose from 'mongoose';
import { resolveGisBoundariesFromComplaintLocation } from '../services/locationResolver.js';

async function test() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/civicfix';
  await mongoose.connect(uri);
  
  // Coordinates for a place in Thrissur Corporation (e.g. Swaraj Round)
  const location = {
    latitude: 10.5276,
    longitude: 76.2144
  };

  console.log('Testing location:', location);
  
  try {
    const { point, localAuthority, ward } = await resolveGisBoundariesFromComplaintLocation(location);
    console.log('Point:', point);
    if (localAuthority) {
      console.log('✅ Found Local Authority:', localAuthority.name);
    } else {
      console.log('❌ No Local Authority found for these coordinates');
    }
    
    if (ward) {
      console.log('✅ Found Ward:', ward.name);
    } else {
      console.log('❌ No Ward found for these coordinates');
    }
  } catch (err) {
    console.error('Error resolving location:', err);
  }
  
  await mongoose.disconnect();
}

test();
