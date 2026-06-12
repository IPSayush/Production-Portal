const bcrypt = require('bcryptjs');
const User = require('./models/User');

const defaultUsers = [
  {
    userId: '9569374626',
    passwordEnv: 'SEED_MANAGER_PASSWORD',
    fallbackPassword: 'ayush-dev-only',
    role: 'manager',
    name: 'Ayush',
  },
  {
    userId: '6280348611',
    passwordEnv: 'SEED_VIEWER1_PASSWORD',
    fallbackPassword: 'akash-dev-only',
    role: 'viewer',
    name: 'Akash',
  },
  {
    userId: '8302220000',
    passwordEnv: 'SEED_VIEWER2_PASSWORD',
    fallbackPassword: 'prateek-dev-only',
    role: 'viewer',
    name: 'Prateek',
  },
];

async function seedUsers() {
  // Skip seeding if explicitly disabled
  if (process.env.SEED_ENABLED === 'false') {
    return;
  }

  try {
    for (const userData of defaultUsers) {
      const existing = await User.findOne({ userId: userData.userId });
      if (!existing) {
        // Read password from env var, fall back to default only in development
        const rawPassword = process.env[userData.passwordEnv] || userData.fallbackPassword;
        const hashedPassword = await bcrypt.hash(rawPassword, 10);
        await User.create({
          userId: userData.userId,
          password: hashedPassword,
          role: userData.role,
          name: userData.name,
          currentSessionId: null,
        });
        console.log(`Seeded user: ${userData.name} (${userData.role})`);
      }
    }
  } catch (error) {
    console.error('Error seeding users:', error);
  }
}

module.exports = seedUsers;