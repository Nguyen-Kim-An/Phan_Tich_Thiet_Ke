const fs = require('fs');
let code = fs.readFileSync('apps/web/src/services/stylist-orchestrator.ts', 'utf8');

code = code.replace(
  'WearsonTryOnAdapter,',
  'WearsonTryOnAdapter,\n  DecartTryOnAdapter,'
);

code = code.replace(
  'new WearsonTryOnService(new WearsonTryOnAdapter())',
  'new WearsonTryOnService(new DecartTryOnAdapter())'
);

fs.writeFileSync('apps/web/src/services/stylist-orchestrator.ts', code, 'utf8');
console.log('Successfully updated apps/web/src/services/stylist-orchestrator.ts');

