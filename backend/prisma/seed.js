// ============================================
// Database Seed — Default categories + admin
// ============================================

const prisma = require('../src/lib/prisma');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('🌱 Seeding database...');

  // ─── Default Categories ────────────────────
  const categories = [
    { name: 'Problemi Hardware', description: 'Guasti, malfunzionamenti e problemi con dispositivi fisici' },
    { name: 'Problemi Software / PC', description: 'Errori software, installazioni, aggiornamenti e configurazioni' },
    { name: 'Accessi e Permessi', description: 'Richieste di accesso, reset credenziali e permessi' },
    { name: 'Rete e Connettività', description: 'Problemi di rete, Wi-Fi, VPN e connessioni' },
    { name: 'Richieste Nuovi Strumenti', description: 'Richieste di nuovi software, hardware o licenze' },
    { name: 'Altro', description: 'Richieste non classificabili nelle altre categorie' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }
  console.log(`  ✅ ${categories.length} categories seeded`);

  // ─── Default Admin User ────────────────────
  const adminEmail = 'admin@ticketing.local';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@12345!', 12);
    await prisma.user.create({
      data: {
        firstName: 'System',
        lastName: 'Administrator',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        department: 'IT',
        mustChangePassword: true,
      },
    });
    console.log('  ✅ Admin user created (admin@ticketing.local / Admin@12345!)');
  } else {
    console.log('  ℹ️  Admin user already exists, skipping');
  }

  // ─── Default SMTP Settings ────────────────
  await prisma.setting.upsert({
    where: { key: 'smtp' },
    update: {},
    create: {
      key: 'smtp',
      value: {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        user: '',
        pass: '',
        from: 'IT Ticketing <noreply@example.com>',
      },
    },
  });
  console.log('  ✅ Default SMTP settings created');

  console.log('🎉 Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
