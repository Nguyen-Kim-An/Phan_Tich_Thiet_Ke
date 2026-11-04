const fs = require('fs');
let code = fs.readFileSync('apps/web/src/app/outfits/page.tsx', 'utf8');
code = code.replace('export const SAMPLE_MODELS =', 'const SAMPLE_MODELS =');
fs.writeFileSync('apps/web/src/app/outfits/page.tsx', code, 'utf8');
console.log('Fixed export SAMPLE_MODELS to const SAMPLE_MODELS!');

