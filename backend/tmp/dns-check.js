const dns = require('dns').promises;

async function checkDns() {
  const host = 'cluster0.oaackys.mongodb.net';
  const srvHost = '_mongodb._tcp.cluster0.oaackys.mongodb.net';
  
  console.log(`Checking DNS for: ${host}`);
  try {
    const addresses = await dns.resolve4(host);
    console.log('Resolve4 Success:', addresses);
  } catch (err) {
    console.error('Resolve4 Failed:', err.message);
  }

  console.log(`Checking SRV for: ${srvHost}`);
  try {
    const srv = await dns.resolveSrv(srvHost);
    console.log('ResolveSrv Success:', srv);
  } catch (err) {
    console.error('ResolveSrv Failed:', err.message);
  }
}

checkDns();
