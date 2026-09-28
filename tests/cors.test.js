const test = require('node:test');
const assert = require('node:assert');
const http = require('http');

// Set env vars before requiring app
process.env.ALLOWED_ORIGINS = 'http://allowed.com,http://another.com';
process.env.JWT_SECRET = 'testsecret';
process.env.SUPABASE_URL = 'http://localhost:8000';
process.env.SUPABASE_SERVICE_KEY = 'dummykey';
process.env.VERCEL = '1';

const app = require('../server');

test('CORS Allowlist Test', async (t) => {
  const server = http.createServer(app);
  
  await new Promise((resolve) => {
    server.listen(0, () => resolve());
  });

  const port = server.address().port;

  await t.test('Allowed origin should succeed', async () => {
    const res = await fetch(`http://localhost:${port}/api/auth/check`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://allowed.com',
        'Access-Control-Request-Method': 'POST'
      }
    });
    
    assert.strictEqual(res.status, 204);
    assert.strictEqual(res.headers.get('access-control-allow-origin'), 'http://allowed.com');
  });

  await t.test('Disallowed origin should fail', async () => {
    const res = await fetch(`http://localhost:${port}/api/auth/check`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://evil.com',
        'Access-Control-Request-Method': 'POST'
      }
    });
    
    // cors throws an error to the callback which express catches and returns 500
    assert.strictEqual(res.status, 500);
    assert.notStrictEqual(res.headers.get('access-control-allow-origin'), 'http://evil.com');
  });

  server.close();
});
