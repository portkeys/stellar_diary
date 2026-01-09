/**
 * Database Seeding Script
 *
 * Run this script once after deployment to seed the database with initial data.
 * Usage: npm run db:seed
 */

import { seedDatabase } from '../server/services/celestialObjects';
import { cleanupDuplicateCelestialObjects } from '../server/services/cleanupDuplicates';

async function main() {
  console.log('Starting database seeding...');

  try {
    // Seed the database
    await seedDatabase();
    console.log('Database seeded successfully');

    // Clean up any duplicates
    await cleanupDuplicateCelestialObjects();
    console.log('Duplicate cleanup complete');

    console.log('All done!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

main();
