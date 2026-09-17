import { db, generateSimpleEmbedding } from './db.js';
import fs from 'fs';
import path from 'path';
import { getRiverdaleSpecialtyTree, getHighlandChildrenTree } from './hospitalCustomTrees.js';

export async function resetAndSeedUserLedgerTree() {
  console.log('[RESET SEED] Erasing existing ledger tree and rebuilding from user specification...');

  // 1. Read Base JSON file (used for Metro St. Jude)
  const jsonPath = path.resolve(process.cwd(), 'data/seed_ledger_tree.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const baseTreeData = JSON.parse(rawData);

  // 2. Fetch existing hospitals
  const hospRes = await db.query(`SELECT id, code, name FROM hospitals ORDER BY id ASC;`);
  const hospitals = hospRes.rows as { id: string; code: string; name: string }[];

  if (hospitals.length === 0) {
    throw new Error('No hospitals found in database to seed ledger tree.');
  }

  // 3. Clean existing ledger entities
  console.log('[RESET SEED] Deleting old vouchers, account_embeddings, ledgers, subgroups, and groups...');
  await db.query(`DELETE FROM audit_logs;`);
  await db.query(`DELETE FROM vouchers;`);
  await db.query(`DELETE FROM account_embeddings;`);
  await db.query(`DELETE FROM ledgers;`);
  await db.query(`DELETE FROM ledger_subgroups;`);
  await db.query(`DELETE FROM ledger_groups;`);

  let totalRoots = 0;
  let totalGroups = 0;
  let totalSubgroups = 0;
  let totalLedgers = 0;
  let totalVouchers = 0;

  // 4. Seed unique tree for each hospital (MSJ: General/Trauma, RSH: Cardiac/Neuro Robotic, HCP: Pediatric/NICU)
  for (const hosp of hospitals) {
    const prefix = hosp.code.split('-')[0] || 'MSJ';
    console.log(`[RESET SEED] Seeding customized 4-level tree for hospital ${hosp.name} (${hosp.id}, prefix: ${prefix})...`);

    let currentTree = baseTreeData;
    if (hosp.id === 'hosp-2') {
      currentTree = getRiverdaleSpecialtyTree();
    } else if (hosp.id === 'hosp-3') {
      currentTree = getHighlandChildrenTree();
    }

    for (const root of currentTree.roots) {
      // 4.1 Insert Root Category (Expense, Income, Loss, Profit)
      const rootCode = root.code.startsWith(`${prefix}-`) ? root.code : root.code.replace(/^[A-Z]+-/, `${prefix}-`);
      const rootId = `grp-${hosp.id}-${rootCode.toLowerCase()}`;
      
      await db.query(`
        INSERT INTO ledger_groups (id, hospital_id, name, code, is_root, parent_id)
        VALUES ($1, $2, $3, $4, TRUE, NULL)
        ON CONFLICT (id) DO NOTHING;
      `, [rootId, hosp.id, root.name, rootCode]);
      totalRoots++;

      // 4.2 Insert Groups under Root
      if (Array.isArray(root.groups)) {
        for (const grp of root.groups) {
          const grpCode = grp.code.startsWith(`${prefix}-`) ? grp.code : grp.code.replace(/^[A-Z]+-/, `${prefix}-`);
          const grpId = `grp-${hosp.id}-${grpCode.toLowerCase()}`;

          await db.query(`
            INSERT INTO ledger_groups (id, hospital_id, name, code, is_root, parent_id)
            VALUES ($1, $2, $3, $4, FALSE, $5)
            ON CONFLICT (id) DO NOTHING;
          `, [grpId, hosp.id, grp.name, grpCode, rootId]);
          totalGroups++;

          // 4.3 Insert Subgroups under Group
          if (Array.isArray(grp.subgroups)) {
            for (const sub of grp.subgroups) {
              const subCode = sub.code.startsWith(`${prefix}-`) ? sub.code : sub.code.replace(/^[A-Z]+-/, `${prefix}-`);
              const subId = `sub-${hosp.id}-${subCode.toLowerCase()}`;

              await db.query(`
                INSERT INTO ledger_subgroups (id, hospital_id, group_id, name, code)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (id) DO NOTHING;
              `, [subId, hosp.id, grpId, sub.name, subCode]);
              totalSubgroups++;

              // 4.4 Insert Ledgers under Subgroup
              if (Array.isArray(sub.ledgers)) {
                for (const led of sub.ledgers) {
                  const ledCode = led.code.startsWith(`${prefix}-`) ? led.code : led.code.replace(/^[A-Z]+-/, `${prefix}-`);
                  const ledId = `led-${hosp.id}-${ledCode.toLowerCase()}`;

                  await db.query(`
                    INSERT INTO ledgers (id, hospital_id, subgroup_id, name, code, is_archived)
                    VALUES ($1, $2, $3, $4, $5, FALSE)
                    ON CONFLICT (id) DO NOTHING;
                  `, [ledId, hosp.id, subId, led.name, ledCode]);
                  totalLedgers++;

                  // Generate Vector Embedding for this ledger
                  const embedding = generateSimpleEmbedding(`${led.name} ${sub.name} ${grp.name}`);
                  await db.query(`
                    INSERT INTO account_embeddings (id, hospital_id, ledger_id, entity_text, embedding)
                    VALUES ($1, $2, $3, $4, $5::vector)
                    ON CONFLICT (id) DO NOTHING;
                  `, [`emb-${ledId}`, hosp.id, ledId, `${led.name} - ${sub.name}`, `[${embedding.join(',')}]`]);

                  // 4.5 Insert Vouchers under Ledger
                  if (Array.isArray(led.vouchers)) {
                    let vIdx = 1;
                    for (const vch of led.vouchers) {
                      const vchNum = `VCH-${ledCode}-${vIdx.toString().padStart(2, '0')}`;
                      const vchId = `vch-${hosp.id}-${ledCode.toLowerCase()}-${vIdx}`;
                      const vchType = vch.type === 'CR' ? 'CREDIT' : 'DEBIT';

                      await db.query(`
                        INSERT INTO vouchers (id, hospital_id, ledger_id, voucher_number, date, description, amount, type, status, source_file, confidence_score, metadata)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'APPROVED', $9, 1.0, $10::jsonb)
                        ON CONFLICT (id) DO NOTHING;
                      `, [
                        vchId,
                        hosp.id,
                        ledId,
                        vchNum,
                        vch.date,
                        vch.memo,
                        vch.amount,
                        vchType,
                        'Hospital_Ledger_Seed.json',
                        JSON.stringify({ memo: vch.memo, code: ledCode, root: root.name })
                      ]);
                      vIdx++;
                      totalVouchers++;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  console.log(`[RESET SEED] Successfully rebuilt entire ledger ecosystem!`);
  console.log(`[RESET SEED] Roots created: ${totalRoots}`);
  console.log(`[RESET SEED] Groups created: ${totalGroups}`);
  console.log(`[RESET SEED] Subgroups created: ${totalSubgroups}`);
  console.log(`[RESET SEED] Ledgers created: ${totalLedgers}`);
  console.log(`[RESET SEED] Vouchers created: ${totalVouchers}`);

  return {
    success: true,
    totalRoots,
    totalGroups,
    totalSubgroups,
    totalLedgers,
    totalVouchers
  };
}
