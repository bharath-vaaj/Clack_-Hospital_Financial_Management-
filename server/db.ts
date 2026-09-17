import { PGlite } from '@electric-sql/pglite';
import { vector } from '@electric-sql/pglite-pgvector';
import pg from 'pg';
import path from 'path';
import fs from 'fs';

const { Pool } = pg;

export interface IDatabase {
  query: (text: string, params?: any[]) => Promise<{ rows: any[] }>;
}

let remotePool: any = null;
let pgliteInstance: any = null;

function getPglite() {
  if (!pgliteInstance) {
    const dataDir = path.resolve(process.cwd(), './data/hcfm_db');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const pidFile = path.join(dataDir, 'postmaster.pid');
    if (fs.existsSync(pidFile)) {
      try {
        fs.unlinkSync(pidFile);
        console.log('[DB] Removed stale postmaster.pid lock file.');
      } catch (e) {
        // Ignore
      }
    }
    try {
      pgliteInstance = new PGlite(dataDir, {
        extensions: { vector }
      });
    } catch (initErr: any) {
      console.warn(`[DB] ⚠️ PGlite failed to load existing data dir (${initErr.message}). Resetting local data directory for clean recovery.`);
      try {
        fs.rmSync(dataDir, { recursive: true, force: true });
        fs.mkdirSync(dataDir, { recursive: true });
        pgliteInstance = new PGlite(dataDir, {
          extensions: { vector }
        });
      } catch (fallbackErr) {
        console.warn(`[DB] 💾 Falling back to in-memory PGlite instance.`);
        pgliteInstance = new PGlite();
      }
    }
  }
  return pgliteInstance;
}

export const db: IDatabase = {
  query: async (text: string, params?: any[]) => {
    if (remotePool) {
      try {
        return await remotePool.query(text, params);
      } catch (err: any) {
        // If temporary network hiccup to Supabase, retry once before failing
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT') {
          console.warn(`[DB] ⚠️ Transient network hiccup to Supabase (${err.message}). Retrying query in 500ms...`);
          try {
            await new Promise(r => setTimeout(r, 500));
            return await remotePool.query(text, params);
          } catch (retryErr: any) {
            console.error(`[DB] ❌ Supabase query retry failed: ${retryErr.message}`);
            throw retryErr;
          }
        }
        throw err;
      }
    }
    return await getPglite().query(text, params);
  }
};

function sanitizeDatabaseUrl(rawUrl: string): string {
  try {
    new URL(rawUrl);
    return rawUrl;
  } catch {
    const match = rawUrl.match(/^(postgres(?:ql)?:\/\/)([^:]+):([^@]+)@([^/]+)(.*)$/);
    if (match) {
      const [_, proto, user, pass, host, rest] = match;
      return `${proto}${user}:${encodeURIComponent(pass)}@${host}${rest}`;
    }
    return rawUrl;
  }
}

export async function initDatabase() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && databaseUrl.trim() !== '') {
    const cleanUrl = sanitizeDatabaseUrl(databaseUrl);
    console.log(`[DB] 🌐 Connecting to Supabase / Cloud PostgreSQL at: ${cleanUrl.replace(/:[^:@]+@/, ':****@')}`);
    try {
      const pool = new Pool({
        connectionString: cleanUrl,
        ssl: { rejectUnauthorized: false }
      });
      await pool.query(`SELECT 1;`);
      remotePool = pool;
      console.log(`[DB] ✅ Successfully connected to remote PostgreSQL / Supabase cluster!`);
    } catch (err: any) {
      console.warn(`[DB] ⚠️ Could not connect to remote Supabase (${err.message}).`);
      console.warn(`[DB] 💡 TIP: Supabase direct connection (db.xxxx.supabase.co) is IPv6-only. Use Supabase Session/Transaction Pooler URI (aws-0-xxxx.pooler.supabase.com:6543) for IPv4 networks!`);
      console.warn(`[DB] 💾 Automatically running on high-performance local embedded PostgreSQL (PGlite)...`);
      remotePool = null;
    }
  }

  if (!remotePool) {
    console.log('[DB] 💾 Using Local Embedded PostgreSQL (PGlite) with pgvector');
  }

  console.log('[DB] Initializing PostgreSQL schema with pgvector...');

  // Enable extensions
  await db.query(`CREATE EXTENSION IF NOT EXISTS vector;`);

  // 1. HOSPITALS
  await db.query(`
    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      cfo_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. USERS
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK (role IN ('CFO', 'MANAGER', 'BASE_USER', 'AUDITOR')),
      hospital_id TEXT REFERENCES hospitals(id),
      password_hash TEXT,
      salt TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Ensure columns exist if table was already created
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS salt TEXT;`);

  // 3. AUDITOR_HOSPITAL_ACCESS
  await db.query(`
    CREATE TABLE IF NOT EXISTS auditor_hospital_access (
      id TEXT PRIMARY KEY,
      auditor_id TEXT NOT NULL REFERENCES users(id),
      hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      granted_by TEXT NOT NULL REFERENCES users(id),
      granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(auditor_id, hospital_id)
    );
  `);

  // 4. LEDGER_GROUPS
  await db.query(`
    CREATE TABLE IF NOT EXISTS ledger_groups (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      is_root BOOLEAN DEFAULT FALSE,
      parent_id TEXT REFERENCES ledger_groups(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. LEDGER_SUBGROUPS
  await db.query(`
    CREATE TABLE IF NOT EXISTS ledger_subgroups (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      group_id TEXT NOT NULL REFERENCES ledger_groups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 6. LEDGERS
  await db.query(`
    CREATE TABLE IF NOT EXISTS ledgers (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      subgroup_id TEXT NOT NULL REFERENCES ledger_subgroups(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      is_archived BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 7. VOUCHERS
  await db.query(`
    CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      ledger_id TEXT NOT NULL REFERENCES ledgers(id) ON DELETE CASCADE,
      voucher_number TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('CREDIT', 'DEBIT')),
      status TEXT NOT NULL CHECK (status IN ('STAGED', 'APPROVED')),
      source_file TEXT,
      confidence_score REAL DEFAULT 1.0,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 8. EMBEDDINGS (pgvector table for account classification)
  await db.query(`
    CREATE TABLE IF NOT EXISTS account_embeddings (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      ledger_id TEXT NOT NULL REFERENCES ledgers(id) ON DELETE CASCADE,
      entity_text TEXT NOT NULL,
      embedding vector(384),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 9. AUDIT_LOGS
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      hospital_id TEXT NOT NULL REFERENCES hospitals(id),
      user_id TEXT NOT NULL,
      user_name TEXT,
      user_role TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      before_state JSONB,
      after_state JSONB,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Update users without password to have 'password123'
  const unhashed = await db.query(`SELECT id FROM users WHERE password_hash IS NULL;`);
  for (const u of unhashed.rows as any[]) {
    const salt = generateSalt();
    const hash = hashPassword('password123', salt);
    await db.query(`UPDATE users SET password_hash = $1, salt = $2 WHERE id = $3;`, [hash, salt, u.id]);
  }

  // Check if hospitals table is empty, if so, seed realistic data
  const check = await db.query(`SELECT COUNT(*) as count FROM hospitals;`);
  if (parseInt((check.rows[0] as any).count) === 0) {
    console.log('[DB] Seeding initial hospital financial ecosystem...');
    await seedDatabase();
  } else {
    console.log('[DB] Database already populated.');
  }
}

import crypto from 'crypto';

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

// Generate simple mock vector embedding of dimension 384 based on string hash for vector cosine distance
export function generateSimpleEmbedding(text: string): number[] {
  const dim = 384;
  const vec = new Array(dim).fill(0);
  const clean = text.toLowerCase().trim();
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const idx = (code * 31 + i * 17) % dim;
    vec[idx] += 1.0;
  }
  // Normalize vector
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  return vec.map(v => Number((v / norm).toFixed(6)));
}

async function seedDatabase() {
  const cfoId = 'usr-k9-cfo';
  const mgr1Id = 'usr-mgr-1';
  const mgr2Id = 'usr-mgr-2';
  const base1Id = 'usr-base-1';
  const base2Id = 'usr-base-2';
  const auditorId = 'usr-aud-1';

  const hosp1Id = 'hosp-1';
  const hosp2Id = 'hosp-2';
  const hosp3Id = 'hosp-3';

  // Seed Hospitals
  await db.query(`
    INSERT INTO hospitals (id, name, code, city, cfo_id) VALUES
    ('${hosp1Id}', 'Metro St. Jude Medical Center', 'MSJ-01', 'Chicago, IL', '${cfoId}'),
    ('${hosp2Id}', 'Riverdale Specialty Hospital', 'RSH-02', 'Boston, MA', '${cfoId}'),
    ('${hosp3Id}', 'Highland Children''s Pavilion', 'HCP-03', 'Seattle, WA', '${cfoId}');
  `);

  // Seed Users (Single CFO: K9 Admin)
  await db.query(`
    INSERT INTO users (id, name, email, role, hospital_id) VALUES
    ('${cfoId}', 'K9 Admin', 'k9@gmail.com', 'CFO', NULL),
    ('${mgr1Id}', 'Marcus Chen', 'm.chen@stjude.org', 'MANAGER', '${hosp1Id}'),
    ('${mgr2Id}', 'Dr. Priya Sharma', 'p.sharma@riverdale.org', 'MANAGER', '${hosp2Id}'),
    ('usr-mgr-3', 'David Kim', 'd.kim@highland.org', 'MANAGER', '${hosp3Id}'),
    ('${base1Id}', 'Sarah Jenkins', 's.jenkins@stjude.org', 'BASE_USER', '${hosp1Id}'),
    ('${base2Id}', 'Alex Rivera', 'a.rivera@riverdale.org', 'BASE_USER', '${hosp2Id}'),
    ('${auditorId}', 'Robert Langdon (KPMG)', 'r.langdon@auditors.com', 'AUDITOR', NULL);
  `);

  // Remove deprecated Eleanor Vance if present in persistent DB
  await db.query(`DELETE FROM users WHERE email = 'e.vance@apexhealth.org' OR id = 'usr-cfo-1';`);
  await db.query(`UPDATE hospitals SET cfo_id = '${cfoId}' WHERE cfo_id = 'usr-cfo-1' OR cfo_id IS NULL;`);
  await db.query(`UPDATE auditor_hospital_access SET granted_by = '${cfoId}' WHERE granted_by = 'usr-cfo-1';`);

  // Grant Auditor initial access to Hospital 1 ONLY (so CFO toggle can be demonstrated)
  await db.query(`
    INSERT INTO auditor_hospital_access (id, auditor_id, hospital_id, granted_by) VALUES
    ('acc-1', '${auditorId}', '${hosp1Id}', '${cfoId}')
    ON CONFLICT (id) DO NOTHING;
  `);

  // Seed chart of accounts for each hospital
  const hospitals = [
    { id: hosp1Id, prefix: 'MSJ' },
    { id: hosp2Id, prefix: 'RSH' },
    { id: hosp3Id, prefix: 'HCP' },
  ];

  for (const hosp of hospitals) {
    const hId = hosp.id;
    const pfx = hosp.prefix;

    // 4 Fixed Roots
    const rootExpense = `grp-${hId}-root-exp`;
    const rootIncome = `grp-${hId}-root-inc`;
    const rootProfit = `grp-${hId}-root-prf`;
    const rootLoss = `grp-${hId}-root-los`;

    await db.query(`
      INSERT INTO ledger_groups (id, hospital_id, name, code, is_root, parent_id) VALUES
      ('${rootExpense}', '${hId}', 'Expense', '${pfx}-EXP', TRUE, NULL),
      ('${rootIncome}', '${hId}', 'Income', '${pfx}-INC', TRUE, NULL),
      ('${rootProfit}', '${hId}', 'Profit', '${pfx}-PRF', TRUE, NULL),
      ('${rootLoss}', '${hId}', 'Loss', '${pfx}-LOS', TRUE, NULL);
    `);

    // Sub-Groups under Expense
    const grpPharmacy = `grp-${hId}-pharm`;
    const grpSurgical = `grp-${hId}-surg`;
    const grpDiagnostics = `grp-${hId}-diag`;
    const grpFacility = `grp-${hId}-fac`;

    await db.query(`
      INSERT INTO ledger_groups (id, hospital_id, name, code, is_root, parent_id) VALUES
      ('${grpPharmacy}', '${hId}', 'Pharmacy Operations', '${pfx}-PHARM', FALSE, '${rootExpense}'),
      ('${grpSurgical}', '${hId}', 'Surgical & Operating Suites', '${pfx}-SURG', FALSE, '${rootExpense}'),
      ('${grpDiagnostics}', '${hId}', 'Diagnostics & Pathology', '${pfx}-DIAG', FALSE, '${rootExpense}'),
      ('${grpFacility}', '${hId}', 'Facility & Biomedical', '${pfx}-FAC', FALSE, '${rootExpense}');
    `);

    // Sub-groups under Income
    const grpInpatient = `grp-${hId}-inp`;
    const grpOutpatient = `grp-${hId}-outp`;

    await db.query(`
      INSERT INTO ledger_groups (id, hospital_id, name, code, is_root, parent_id) VALUES
      ('${grpInpatient}', '${hId}', 'Inpatient Care Revenue', '${pfx}-INP', FALSE, '${rootIncome}'),
      ('${grpOutpatient}', '${hId}', 'Outpatient & Ambulatory', '${pfx}-OUTP', FALSE, '${rootIncome}');
    `);

    // Sub-groups under Profit & Loss
    const grpSurplus = `grp-${hId}-surplus`;
    const grpAdjust = `grp-${hId}-adjust`;
    await db.query(`
      INSERT INTO ledger_groups (id, hospital_id, name, code, is_root, parent_id) VALUES
      ('${grpSurplus}', '${hId}', 'Retained Surpluses', '${pfx}-SURP', FALSE, '${rootProfit}'),
      ('${grpAdjust}', '${hId}', 'Operational Adjustments', '${pfx}-ADJ', FALSE, '${rootLoss}');
    `);

    // LEVEL 2: Sub-groups
    // Pharmacy sub-groups
    const subConsumables = `sub-${hId}-cons`;
    const subPrescription = `sub-${hId}-rx`;
    const subColdChain = `sub-${hId}-cold`;

    // Surgical sub-groups
    const subInstruments = `sub-${hId}-inst`;
    const subImplants = `sub-${hId}-impl`;

    // Diagnostic sub-groups
    const subReagents = `sub-${hId}-reag`;

    // Facility sub-groups
    const subUtilities = `sub-${hId}-util`;

    // Inpatient sub-groups
    const subICU = `sub-${hId}-icu`;
    const subRooms = `sub-${hId}-rooms`;

    // Outpatient sub-groups
    const subClinics = `sub-${hId}-clin`;

    // P&L sub-groups
    const subReserves = `sub-${hId}-res`;
    const subWriteoffs = `sub-${hId}-wr`;

    await db.query(`
      INSERT INTO ledger_subgroups (id, hospital_id, group_id, name, code) VALUES
      ('${subConsumables}', '${hId}', '${grpPharmacy}', 'Medical Consumables', '${pfx}-SUB-CNS'),
      ('${subPrescription}', '${hId}', '${grpPharmacy}', 'Prescription Pharmaceuticals', '${pfx}-SUB-RX'),
      ('${subColdChain}', '${hId}', '${grpPharmacy}', 'Cold Chain Biologicals', '${pfx}-SUB-CC'),
      ('${subInstruments}', '${hId}', '${grpSurgical}', 'Surgical Instruments & Sets', '${pfx}-SUB-INST'),
      ('${subImplants}', '${hId}', '${grpSurgical}', 'Orthopedic & Cardiac Implants', '${pfx}-SUB-IMP'),
      ('${subReagents}', '${hId}', '${grpDiagnostics}', 'Laboratory Reagents & Kits', '${pfx}-SUB-RG'),
      ('${subUtilities}', '${hId}', '${grpFacility}', 'Medical Gas & Plant Utilities', '${pfx}-SUB-UTL'),
      ('${subICU}', '${hId}', '${grpInpatient}', 'Intensive Care Units', '${pfx}-SUB-ICU'),
      ('${subRooms}', '${hId}', '${grpInpatient}', 'Ward & Deluxe Rooms', '${pfx}-SUB-RM'),
      ('${subClinics}', '${hId}', '${grpOutpatient}', 'Specialist Consultations', '${pfx}-SUB-CLN'),
      ('${subReserves}', '${hId}', '${grpSurplus}', 'Capital Expansion Reserve', '${pfx}-SUB-RES'),
      ('${subWriteoffs}', '${hId}', '${grpAdjust}', 'Inventory Wastage & Spoilage', '${pfx}-SUB-WST');
    `);

    // LEVEL 3: Ledgers
    const ledgers = [
      // Consumables
      { id: `led-${hId}-syr`, sub: subConsumables, name: 'Hypodermic Syringes & Needles', code: `${pfx}-LED-01` },
      { id: `led-${hId}-cann`, sub: subConsumables, name: 'IV Cannulas & Catheters', code: `${pfx}-LED-02` },
      { id: `led-${hId}-anti`, sub: subConsumables, name: 'Antiseptics & Sanitizers', code: `${pfx}-LED-03` },
      // Rx
      { id: `led-${hId}-abx`, sub: subPrescription, name: 'Broad-Spectrum Antibiotics', code: `${pfx}-LED-04` },
      { id: `led-${hId}-analg`, sub: subPrescription, name: 'Analgesics & Anesthetics', code: `${pfx}-LED-05` },
      { id: `led-${hId}-onco`, sub: subPrescription, name: 'Oncology Chemotherapy Regimens', code: `${pfx}-LED-06` },
      // Cold chain
      { id: `led-${hId}-vax`, sub: subColdChain, name: 'Pediatric Vaccines & Sera', code: `${pfx}-LED-07` },
      { id: `led-${hId}-ins`, sub: subColdChain, name: 'Insulins & Hormones', code: `${pfx}-LED-08` },
      // Surgical
      { id: `led-${hId}-blades`, sub: subInstruments, name: 'Surgical Blades & Sutures', code: `${pfx}-LED-09` },
      { id: `led-${hId}-stents`, sub: subImplants, name: 'Coronary Drug-Eluting Stents', code: `${pfx}-LED-10` },
      // Diagnostics
      { id: `led-${hId}-hema`, sub: subReagents, name: 'Hematology Analyzer Cartridges', code: `${pfx}-LED-11` },
      // Utilities
      { id: `led-${hId}-o2`, sub: subUtilities, name: 'Liquid Medical Oxygen (Bulk)', code: `${pfx}-LED-12` },
      // Revenue Ledgers
      { id: `led-${hId}-icubed`, sub: subICU, name: 'Critical Care ICU Daily Bed Tariff', code: `${pfx}-LED-13` },
      { id: `led-${hId}-deluxe`, sub: subRooms, name: 'Deluxe Suite Accommodation', code: `${pfx}-LED-14` },
      { id: `led-${hId}-cardio`, sub: subClinics, name: 'Cardiology Specialist Fees', code: `${pfx}-LED-15` },
      { id: `led-${hId}-neuro`, sub: subClinics, name: 'Neurology & Stroke Clinic Fees', code: `${pfx}-LED-16` },
      // Surplus & Loss
      { id: `led-${hId}-cap`, sub: subReserves, name: 'Medical Equipment Sinking Fund', code: `${pfx}-LED-17` },
      { id: `led-${hId}-spoil`, sub: subWriteoffs, name: 'Cold-Chain Temperature Excursion Losses', code: `${pfx}-LED-18` },
    ];

    for (const l of ledgers) {
      await db.query(`
        INSERT INTO ledgers (id, hospital_id, subgroup_id, name, code, is_archived) VALUES
        ('${l.id}', '${hId}', '${l.sub}', '${l.name.replace(/'/g, "''")}', '${l.code}', FALSE);
      `);

      // Seed vector embedding for classification
      const emb = generateSimpleEmbedding(l.name);
      await db.query(`
        INSERT INTO account_embeddings (id, hospital_id, ledger_id, entity_text, embedding) VALUES
        ('emb-${l.id}', '${hId}', '${l.id}', '${l.name.replace(/'/g, "''")}', '[${emb.join(',')}]');
      `);
    }

    // LEVEL 4: Seed Approved Historical Vouchers (Q1 & Q2)
    const seedVouchers = [
      {
        id: `vch-${hId}-1`,
        led: `led-${hId}-anti`,
        no: `${pfx}-VCH-2025-0104`,
        date: '2025-01-14',
        desc: 'Betadine Solution 500ml 100pk order - B. Braun Medical',
        amt: 14200.00,
        type: 'DEBIT',
        status: 'APPROVED',
        conf: 0.98,
        src: 'Braun_Inv_8832.pdf'
      },
      {
        id: `vch-${hId}-2`,
        led: `led-${hId}-syr`,
        no: `${pfx}-VCH-2025-0108`,
        date: '2025-01-20',
        desc: 'Becton Dickinson 5ml Luer Lock Syringes (20,000 units)',
        amt: 8650.00,
        type: 'DEBIT',
        status: 'APPROVED',
        conf: 0.99,
        src: 'BD_Batch_Invoice.pdf'
      },
      {
        id: `vch-${hId}-3`,
        led: `led-${hId}-abx`,
        no: `${pfx}-VCH-2025-0115`,
        date: '2025-02-04',
        desc: 'Meropenem 1g IV Vials 500 count - Pfizer Hospital Supply',
        amt: 32500.00,
        type: 'DEBIT',
        status: 'APPROVED',
        conf: 0.96,
        src: 'Pfizer_Contract_491.pdf'
      },
      {
        id: `vch-${hId}-4`,
        led: `led-${hId}-stents`,
        no: `${pfx}-VCH-2025-0201`,
        date: '2025-02-18',
        desc: 'Xience Sierra Everolimus Stent System 6x Units - Abbott',
        amt: 48900.00,
        type: 'DEBIT',
        status: 'APPROVED',
        conf: 0.97,
        src: 'Abbott_CathLab_Inv.pdf'
      },
      {
        id: `vch-${hId}-5`,
        led: `led-${hId}-o2`,
        no: `${pfx}-VCH-2025-0210`,
        date: '2025-02-24',
        desc: 'Cryogenic Liquid Medical Oxygen Bulk Tank Refill (Airgas)',
        amt: 19800.00,
        type: 'DEBIT',
        status: 'APPROVED',
        conf: 0.99,
        src: 'Airgas_Tanker_582.pdf'
      },
      {
        id: `vch-${hId}-6`,
        led: `led-${hId}-icubed`,
        no: `${pfx}-VCH-2025-0215`,
        date: '2025-03-01',
        desc: 'Medicare & Commercial Payer Inpatient ICU Settlement Batch',
        amt: 184500.00,
        type: 'CREDIT',
        status: 'APPROVED',
        conf: 1.0,
        src: 'Payer_Batch_0301.xml'
      },
      {
        id: `vch-${hId}-7`,
        led: `led-${hId}-deluxe`,
        no: `${pfx}-VCH-2025-0302`,
        date: '2025-03-12',
        desc: 'Private Insurance Deluxe Ward Billing Clearance',
        amt: 96400.00,
        type: 'CREDIT',
        status: 'APPROVED',
        conf: 1.0,
        src: 'Payer_Batch_0312.xml'
      },
      {
        id: `vch-${hId}-8`,
        led: `led-${hId}-cardio`,
        no: `${pfx}-VCH-2025-0315`,
        date: '2025-03-22',
        desc: 'Outpatient Cardiology OPD Clinical Assessments',
        amt: 42100.00,
        type: 'CREDIT',
        status: 'APPROVED',
        conf: 1.0,
        src: 'OPD_Reconciliation.csv'
      },
      {
        id: `vch-${hId}-9`,
        led: `led-${hId}-spoil`,
        no: `${pfx}-VCH-2025-0320`,
        date: '2025-03-28',
        desc: 'Refrigerator Sensor 3 Failure - Spoilage of 45 Vaccine vials',
        amt: 6200.00,
        type: 'DEBIT',
        status: 'APPROVED',
        conf: 0.95,
        src: 'Incident_Report_0328.pdf'
      }
    ];

    for (const v of seedVouchers) {
      await db.query(`
        INSERT INTO vouchers (id, hospital_id, ledger_id, voucher_number, date, description, amount, type, status, source_file, confidence_score) VALUES
        ('${v.id}', '${hId}', '${v.led}', '${v.no}', '${v.date}', '${v.desc.replace(/'/g, "''")}', ${v.amt}, '${v.type}', '${v.status}', '${v.src}', ${v.conf});
      `);
    }

    // Seed Staged Vouchers (Pending Ingestion Preview for Hospital 1)
    if (hId === hosp1Id) {
      const stagedVouchers = [
        {
          id: `vch-${hId}-stg-1`,
          led: `led-${hId}-anti`,
          no: `${pfx}-STG-901`,
          date: '2025-04-05',
          desc: 'Betadine Antiseptic Solution 500ml (30 bottles)',
          amt: 4850.00,
          type: 'DEBIT',
          status: 'STAGED',
          conf: 0.94,
          src: 'McKesson_Delivery_Apr05.pdf',
          meta: JSON.stringify({ ai_matched: true, confidence: 0.94, match_source: 'pgvector_similarity' })
        },
        {
          id: `vch-${hId}-stg-2`,
          led: `led-${hId}-syr`,
          no: `${pfx}-STG-902`,
          date: '2025-04-05',
          desc: '10ml Disposable Luer Syringes Pack of 1000',
          amt: 2300.00,
          type: 'DEBIT',
          status: 'STAGED',
          conf: 0.91,
          src: 'McKesson_Delivery_Apr05.pdf',
          meta: JSON.stringify({ ai_matched: true, confidence: 0.91, match_source: 'pgvector_similarity' })
        },
        {
          id: `vch-${hId}-stg-3`,
          led: `led-${hId}-cann`,
          no: `${pfx}-STG-903`,
          date: '2025-04-06',
          desc: 'Safelet IV Cannula 20G Pink Wings',
          amt: 1850.00,
          type: 'DEBIT',
          status: 'STAGED',
          conf: 0.88,
          src: 'MedicalSupplyCo_0406.pdf',
          meta: JSON.stringify({ ai_matched: true, confidence: 0.88, match_source: 'pgvector_similarity' })
        }
      ];

      for (const sv of stagedVouchers) {
        await db.query(`
          INSERT INTO vouchers (id, hospital_id, ledger_id, voucher_number, date, description, amount, type, status, source_file, confidence_score, metadata) VALUES
          ('${sv.id}', '${hId}', '${sv.led}', '${sv.no}', '${sv.date}', '${sv.desc.replace(/'/g, "''")}', ${sv.amt}, '${sv.type}', '${sv.status}', '${sv.src}', ${sv.conf}, '${sv.meta}'::jsonb);
        `);
      }
    }
  }

  // Seed Initial Audit Logs
  await db.query(`
    INSERT INTO audit_logs (id, hospital_id, user_id, user_name, user_role, action, entity_type, entity_id, before_state, after_state) VALUES
    ('log-1', '${hosp1Id}', '${cfoId}', 'Dr. Eleanor Vance', 'CFO', 'CREATE', 'HOSPITAL', '${hosp1Id}', NULL, '{"name": "Metro St. Jude Medical Center", "code": "MSJ-01"}'::jsonb),
    ('log-2', '${hosp1Id}', '${mgr1Id}', 'Marcus Chen', 'MANAGER', 'CREATE', 'LEDGER', 'led-hosp-1-syr', NULL, '{"name": "Hypodermic Syringes & Needles", "subgroup": "Medical Consumables"}'::jsonb),
    ('log-3', '${hosp1Id}', '${cfoId}', 'Dr. Eleanor Vance', 'CFO', 'GRANT_ACCESS', 'AUDITOR', '${auditorId}', NULL, '{"auditor": "Robert Langdon", "hospital": "Metro St. Jude Medical Center"}'::jsonb);
  `);

  console.log('[DB] Seeding completed successfully!');
}
