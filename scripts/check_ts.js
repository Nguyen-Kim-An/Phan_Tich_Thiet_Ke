const { execSync } = require('child_process');
try {
  const out = execSync('npx tsc --noEmit', { cwd: 'apps/web' });
  console.log('TypeScript check on apps/web passed cleanly!');
} catch (err) {
  console.error(err.stdout ? err.stdout.toString() : err.message);
}

