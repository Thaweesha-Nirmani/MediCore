const mongoose = require('mongoose');
require('dotenv').config();

async function debugConnect() {
  const uri = process.env.MONGO_URI;
  console.log('Testing connection to URI (masked):', uri.replace(/:([^:@]+)@/, ':****@'));
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('SUCCESS: Connected to MongoDB Atlas');
    process.exit(0);
  } catch (err) {
    const fs = require('fs');
    fs.writeFileSync('tmp/error-report.json', JSON.stringify({
      name: err.name,
      message: err.message,
      reason: err.reason
    }, null, 2));
    process.exit(1);
  }
}

debugConnect();
