const http = require('http');

const payload = JSON.stringify({
  userImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=720&q=80',
  garmentImageUrl: 'https://cdn.shopify.com/s/files/1/0623/7916/3734/files/F-BTDN-CTN-OOXF-BF-WHT_0038.jpg?v=1784064032&width=900',
  prompt: 'Wearing high-fashion white oxford shirt with realistic fabric drape',
  category: 'ao'
});

const req = http.request('http://localhost:4000/api/v1/ai/decart/tryon-job', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log('Decart Job Result:', data);
  });
});

req.on('error', (e) => console.error(e));
req.write(payload);
req.end();

