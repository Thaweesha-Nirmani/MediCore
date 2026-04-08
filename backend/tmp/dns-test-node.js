const dns = require('dns');
const { promisify } = require('util');
const resolveSrv = promisify(dns.resolveSrv);

async function test() {
  console.log('Current servers:', dns.getServers());
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    console.log('New servers:', dns.getServers());
    const records = await resolveSrv('_mongodb._tcp.cluster0.oaackys.mongodb.net');
    console.log('Success! SRV results:', JSON.stringify(records, null, 2));
  } catch (err) {
    console.error('Failed SRV resolution:', err.message);
    if (err.code === 'ESERVFAIL') {
      console.log('ESERVFAIL detected. The DNS server returned a failure.');
    }
  }
}

test();
