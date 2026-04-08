const { MongoClient } = require('mongodb');

async function findReplicaSet() {
  const uri = "mongodb://MediCore:Thawee12@cluster0-shard-00-01.oaackys.mongodb.net:27017/?ssl=true&authSource=admin";
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
  try {
    console.log('Connecting to single node to find replica set name...');
    await client.connect();
    const isMaster = await client.db('admin').command({ isMaster: 1 });
    console.log('Replica Set Name:', isMaster.setName);
    await client.close();
  } catch (err) {
    console.error('Failed to connect directly:', err.message);
  }
}

findReplicaSet();
