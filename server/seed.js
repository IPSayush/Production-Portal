const bcrypt = require('bcryptjs');
const User = require('./models/User');

const defaultUsers = [
  {
    userId: '9569374626',
    password: 'ayush',
    role: 'manager',
    name: 'Ayush',
  },
  {
    userId: '6280348611',
    password: 'akash',
    role: 'viewer',
    name: 'Akash',
  },
  {
    userId: '8302220000',
    password: 'prateek',
    role: 'viewer',
    name: 'Prateek',
  },
];

async function seedUsers() {
  for (const userData of defaultUsers) {
    const existing = await User.findOne({ userId: userData.userId });
    if (!existing) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
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
}

module.exports = seedUsers;
