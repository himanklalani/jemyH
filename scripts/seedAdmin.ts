import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Load environment variables manually
try {
  const envConfig = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
} catch (err) {
  console.log('Could not load .env.local', err);
}

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable');
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const email = 'admin@h.com';
  const password = 'admin';
  const hashedPassword = await bcrypt.hash(password, 10);

  const db = mongoose.connection.db;
  if (!db) throw new Error('No DB connection');

  // We use the raw collection to avoid any Next.js model import issues
  const result = await db.collection('users').updateOne(
    { email },
    { 
      $set: { 
        name: 'Admin User',
        email, 
        password: hashedPassword, 
        role: 'admin',
        region: 'US', // Default region
        createdAt: new Date(),
        updatedAt: new Date()
      } 
    },
    { upsert: true }
  );

  if (result.upsertedId) {
    console.log(`Created new admin user: ${email}`);
  } else {
    console.log(`Updated existing user to admin: ${email}`);
  }

  process.exit(0);
}

seed().catch((err) => {
  console.error('Error seeding admin user:', err);
  process.exit(1);
});
