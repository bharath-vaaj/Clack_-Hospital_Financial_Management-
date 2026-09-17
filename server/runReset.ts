import 'dotenv/config';
import { initDatabase } from './db.js';
import { resetAndSeedUserLedgerTree } from './seedUserLedgerTree.js';

async function main() {
  try {
    console.log('[RUNNER] Initializing DB...');
    await initDatabase();
    console.log('[RUNNER] Running resetAndSeedUserLedgerTree...');
    const result = await resetAndSeedUserLedgerTree();
    console.log('[RUNNER] DONE:', JSON.stringify(result, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('[RUNNER] ERROR:', err);
    process.exit(1);
  }
}

main();
