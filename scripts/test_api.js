const http = require('http');

const payload = JSON.stringify({
  inputMode: 'quiz',
  quizAnswers: {
    occasion: 'Công sở & Gặp đối tác',
    styleVibe: 'Thanh lịch tối giản (Minimalist)',
    fitGoal: 'Tôn vòng eo & Kéo dài đôi chân',
    budgetLimit: 5000000,
    preferredColors: ['trang', 'den'],
    preferredMaterials: ['Cotton']
  }
});

const req = http.request('http://localhost:4000/api/v1/ai/stylist/recommend', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      console.log('Outfits count:', json.recommendedOutfits ? json.recommendedOutfits.length : 0);
      if (json.recommendedOutfits) {
        json.recommendedOutfits.forEach((o, i) => {
          console.log(`\n=== Outfit ${i+1}: ${o.title} | Price: ${o.totalPrice} | Score: ${o.matchScore} ===`);
          o.items.forEach(it => {
            console.log(`  * [${it.slotRole}] ${it.product.name}`);
            console.log(`    Image: ${it.product.image}`);
          });
        });
      } else {
        console.log('Response error or missing outfits:', data);
      }
    } catch (err) {
      console.error('Parse error:', err, data);
    }
  });
});

req.on('error', (err) => console.error('Request error:', err));
req.write(payload);
req.end();

