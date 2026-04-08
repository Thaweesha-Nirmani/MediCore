require('dns').setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS for SRV resolution
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const env = require('../src/config/env');
const AppUser = require('../src/modules/users/models/user.model');
const {
  ROLES,
  STATUSES,
  buildInitials,
  normalizeColor,
  normalizeEmail,
} = require('../src/modules/users/utils/user-normalizer');

function generateUserId() {
  return `USR-${Date.now()}-AD`;
}

async function main() {
  const email = normalizeEmail(process.env.ADMIN_EMAIL || 'admin@medicore.com', {
    required: true,
  });
  const password = String(process.env.ADMIN_PASSWORD || 'admin123').trim();
  const name = String(process.env.ADMIN_NAME || 'MediCore Admin').trim();

  if (!password || password.length < 6) {
    throw new Error('ADMIN_PASSWORD must be at least 6 characters long');
  }

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: env.mongoServerSelectionTimeoutMs,
    autoIndex: env.nodeEnv !== 'production',
  });

  const passwordHash = await bcrypt.hash(password, 12);
  let user = await AppUser.findOne({ email }).select(
    '+passwordHash +password +password_hash +refreshTokens'
  );

  if (!user) {
    user = new AppUser({
      user_id: generateUserId(),
      name,
      email,
      contactNumber: '',
      role: ROLES.ADMIN,
      status: STATUSES.ACTIVE,
      active: true,
      initials: buildInitials(name),
      color: normalizeColor('#0a2a5e'),
      lastLogin: null,
      refreshTokens: [],
    });
  }

  user.name = name;
  user.role = ROLES.ADMIN;
  user.status = STATUSES.ACTIVE;
  user.active = true;
  user.initials = buildInitials(name);
  user.color = normalizeColor(user.color || '#0a2a5e');
  user.passwordHash = passwordHash;
  user.password = passwordHash;
  user.password_hash = passwordHash;
  user.refreshTokens = [];

  await user.save();

  console.log(
    JSON.stringify(
      {
        success: true,
        email,
        role: user.role,
        status: user.status,
        id: String(user._id),
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
