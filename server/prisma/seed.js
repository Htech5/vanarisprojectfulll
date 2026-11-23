const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const drones = [
  { name: 'Vanaris FX-1', tagline: 'Thermal Recon Firefighter Drone', status: 'patrolling', badge: 'Flagship' },
  { name: 'Vanaris FX-1 Pro', tagline: 'Extended Range Suppression Unit', status: 'charging', badge: 'New' },
  { name: 'Vanaris FX-1 Mini', tagline: 'Compact Indoor Hazard Scout', status: 'standby', badge: null },
  { name: 'Vanaris FX-2 Tether', tagline: 'Continuous-Power Ground Relay', status: 'patrolling', badge: null },
  { name: 'Vanaris FX-3 Swarm Node', tagline: 'Multi-Unit Wildfire Perimeter', status: 'returning', badge: 'Pro' },
];

async function main() {
  const count = await prisma.drone.count();
  if (count > 0) {
    console.log(`Skipping seed: ${count} drone(s) already in the database.`);
    return;
  }
  await prisma.drone.createMany({ data: drones });
  console.log(`Seeded ${drones.length} drones.`);
}

main().finally(() => prisma.$disconnect());
