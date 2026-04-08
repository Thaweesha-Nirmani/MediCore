const path = require('path');
const http = require('http');

const workspaceRoot = path.resolve(__dirname, '../..');
const app = require(path.join(workspaceRoot, 'backend', 'src', 'app'));
const connectDatabase = require(path.join(workspaceRoot, 'backend', 'src', 'database', 'mongoose'));

const port = Number(process.env.SMOKE_BACKEND_PORT || 5055);
const baseUrl = `http://127.0.0.1:${port}`;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function request(pathname, { method = 'GET', body = null } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const requestHandle = http.request(
      `${baseUrl}${pathname}`,
      {
        method,
        headers: payload
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
            }
          : undefined,
      },
      (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => {
          const rawBody = Buffer.concat(chunks).toString('utf8');
          let json = null;

          try {
            json = rawBody ? JSON.parse(rawBody) : null;
          } catch (_error) {
            json = null;
          }

          resolve({
            status: response.statusCode || 0,
            body: rawBody,
            json,
          });
        });
      }
    );

    requestHandle.on('error', reject);

    if (payload) {
      requestHandle.write(payload);
    }

    requestHandle.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  const server = app.listen(port);

  server.on('error', (error) => {
    throw error;
  });

  try {
    connectDatabase({ allowRetry: true }).catch(() => {
      // Degraded mode is acceptable for smoke verification.
    });

    await wait(500);

    const health = await request('/health');
    const readiness = await request('/ready');
    const versionedHealth = await request('/api/v1/health');
    const medicines = await request('/api/v1/medicines');
    const invalidLogin = await request('/api/v1/auth/login', {
      method: 'POST',
      body: {},
    });

    assert(health.status === 200, 'Health endpoint should return 200');
    assert(health.json?.success === true, 'Health response did not return success=true');
    assert(Boolean(health.json?.data?.database), 'Health response is missing database metadata');
    assert([200, 503].includes(readiness.status), 'Readiness should return 200 or 503');
    assert(versionedHealth.status === 200, 'Versioned health endpoint should return 200');

    if (readiness.status === 200) {
      assert(
        medicines.status === 401,
        `Protected medicines route should return 401 when DB is ready, received ${medicines.status}`
      );
      assert(
        invalidLogin.status === 422,
        `Invalid login payload should return 422 when DB is ready, received ${invalidLogin.status}`
      );
    } else {
      assert(
        medicines.status === 503,
        `Protected medicines route should return 503 while DB is degraded, received ${medicines.status}`
      );
      assert(
        invalidLogin.status === 503,
        `Invalid login payload should return 503 while DB is degraded, received ${invalidLogin.status}`
      );
    }

    process.stdout.write('Backend smoke passed\n');
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await connectDatabase.disconnect().catch(() => {
      // The disconnect path already records its own failure details.
    });
  }
}

main().catch((error) => {
  process.stderr.write(`Backend smoke failed: ${error.message}\n`);
  process.exit(1);
});
