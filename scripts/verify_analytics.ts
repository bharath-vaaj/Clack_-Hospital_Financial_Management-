// Use globalThis.fetch in Node 18+

async function runVerification() {
  console.log('--- Starting Analytics & Drilldown Verification ---');

  // 1. Authenticate as K9
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'k9@gmail.com', password: 'password123' })
  });
  const loginData: any = await loginRes.json();
  if (!loginRes.ok) {
    console.error('Login failed:', loginData);
    process.exit(1);
  }
  const token = loginData.token;
  const user = loginData.user;
  console.log(`[PASS] Logged in as ${user.name} (${user.role}), ID: ${user.id}`);

  // 2. Fetch Hospitals
  const hospRes = await fetch('http://localhost:3001/api/hospitals', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const hospitals: any = await hospRes.json();
  console.log(`[PASS] Retrieved ${hospitals.length} hospitals`);
  const activeHospital = hospitals[0];
  console.log(`Testing hospital: ${activeHospital.name} (${activeHospital.id})`);

  // 3. Test /api/analytics with Financial Ratios
  const analyticsRes = await fetch(`http://localhost:3001/api/analytics?hospital_id=${activeHospital.id}`, {
    headers: { 'Authorization': `Bearer ${token}`, 'X-User-Id': user.id }
  });
  const analyticsData: any = await analyticsRes.json();
  if (!analyticsRes.ok) {
    console.error('Analytics failed:', analyticsData);
    process.exit(1);
  }

  console.log('[PASS] Analytics response received:');
  console.log('  - Revenue:', analyticsData.kpi.totalRevenue);
  console.log('  - Outflow:', analyticsData.kpi.totalOutflow);
  console.log('  - Net Income:', analyticsData.kpi.netIncome);
  console.log('  - Operating Margin:', analyticsData.kpi.operatingMargin + '%');
  console.log('  - Financial Ratios:', analyticsData.financialRatios);
  console.log('  - Top Categories count:', analyticsData.departmentalBreakdown.length);
  console.log('  - Top Value Ledgers count:', analyticsData.topLedgers.length);

  if (!analyticsData.financialRatios || analyticsData.financialRatios.operatingRatio === undefined) {
    console.error('FAIL: financialRatios missing in /api/analytics!');
    process.exit(1);
  }

  const topLedger = analyticsData.topLedgers[0];
  console.log(`Top Ledger #1: ${topLedger.ledger_code} - ${topLedger.ledger_name} ($${topLedger.total_amount})`);

  // 4. Test /api/analytics/ledger/:ledgerId/vouchers (Drilldown Modal Endpoint)
  const vouchersRes = await fetch(`http://localhost:3001/api/analytics/ledger/${topLedger.ledger_id}/vouchers`, {
    headers: { 'Authorization': `Bearer ${token}`, 'X-User-Id': user.id }
  });
  const vouchersData: any = await vouchersRes.json();
  if (!vouchersRes.ok) {
    console.error('Vouchers drilldown failed:', vouchersData);
    process.exit(1);
  }

  console.log('[PASS] Ledger Vouchers Drilldown:');
  console.log('  - Ledger Name:', vouchersData.ledger.name);
  console.log('  - Subgroup / Group:', `${vouchersData.ledger.group_name} > ${vouchersData.ledger.subgroup_name}`);
  console.log('  - Summary:', vouchersData.summary);
  console.log('  - Retrieved Vouchers:', vouchersData.vouchers.length);
  if (vouchersData.vouchers.length > 0) {
    console.log('  - Sample Voucher #1:', vouchersData.vouchers[0]);
  }

  // 5. Test /api/analytics/ai-diagnostic
  const diagnosticRes = await fetch('http://localhost:3001/api/analytics/ai-diagnostic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`, 'X-User-Id': user.id },
    body: JSON.stringify({
      hospitalName: activeHospital.name,
      totalRevenue: analyticsData.kpi.totalRevenue,
      totalOutflow: analyticsData.kpi.totalOutflow,
      netIncome: analyticsData.kpi.netIncome,
      operatingMargin: analyticsData.kpi.operatingMargin,
      topCategories: analyticsData.departmentalBreakdown.slice(0, 5),
      concentrationRatio: analyticsData.financialRatios.concentrationRatio
    })
  });
  const diagnosticData: any = await diagnosticRes.json();
  if (!diagnosticRes.ok) {
    console.error('AI diagnostic failed:', diagnosticData);
    process.exit(1);
  }
  console.log('[PASS] AI Financial Diagnostic:');
  console.log('  - Rating:', diagnosticData.rating);
  console.log('  - Observations:', diagnosticData.observations?.length);
  console.log('  - Recommendations:', diagnosticData.recommendations?.length);

  console.log('--- ALL BACKEND CHECKS PASSED SUCCESSFULLY ---');
}

runVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
