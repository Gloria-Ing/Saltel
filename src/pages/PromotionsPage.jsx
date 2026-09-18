import { useState, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS, INITIAL_REPORTS, ROLE_CONFIG, BASE_SALARIES, FMT_RWF } from '../data/mockData';
import { PageHeader, Card, Avatar, Btn, Modal } from '../components/UI';

// ── AI Scoring Engine ─────────────────────────────────────────────────────────

function yearsAt(hireDate) {
  if (!hireDate) return 0;
  const diff = (new Date('2026-05-08') - new Date(hireDate)) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.round(diff * 10) / 10;
}

function parseExpYears(expStr) {
  if (!expStr) return 0;
  const m = expStr.match(/(\d+)/);
  return m ? parseInt(m[1]) : 0;
}

function educationLevel(studies) {
  if (!studies) return 0;
  const s = studies.toLowerCase();
  if (s.includes('mba') || s.includes('msc') || s.includes('master')) return 100;
  if (s.includes('bsc') || s.includes('beng') || s.includes('bba') || s.includes('bachelor')) return 80;
  if (s.includes('dit') || s.includes('diploma') || s.includes('iprc')) return 60;
  if (s.includes('a2') || s.includes('high school')) return 35;
  return 40;
}

function certScore(certs) {
  if (!certs || !certs.length) return 0;
  const clean = certs.filter(c => !c.toLowerCase().includes('progress'));
  const weights = clean.map(c => {
    const cl = c.toLowerCase();
    if (cl.includes('pmp') || cl.includes('itil') || cl.includes('cpa') || cl.includes('ccnp')) return 30;
    if (cl.includes('ccna') || cl.includes('cfos') || cl.includes('foa') || cl.includes('cctv certified')) return 22;
    if (cl.includes('network+') || cl.includes('comptia') || cl.includes('axis') || cl.includes('hikvision')) return 18;
    return 12;
  });
  return Math.min(100, weights.reduce((a, b) => a + b, 0));
}

function licenseScore(licenses) {
  if (!licenses || !licenses.length) return 0;
  const order = ['Ad', 'A1', 'A0', 'B', 'C', 'D'];
  const best = licenses.reduce((best, l) => {
    const i = order.indexOf(l);
    return i > order.indexOf(best) ? l : best;
  }, 'Ad');
  return { 'A0': 100, 'B': 90, 'C': 90, 'D': 90, 'A1': 70, 'Ad': 40 }[best] || 40;
}

function avgReportScore(userId) {
  const reps = INITIAL_REPORTS.filter(r => r.technician_id === userId && r.score);
  if (!reps.length) return 70;
  return Math.round(reps.reduce((s, r) => s + r.score, 0) / reps.length);
}

function onTimeRate(userId) {
  const reps = INITIAL_REPORTS.filter(r => r.technician_id === userId);
  if (!reps.length) return 75;
  const onTime = reps.filter(r => r.score >= 80).length;
  return Math.round((onTime / reps.length) * 100);
}

function computeScore(user, targetRole) {
  const q = user.qualifications || {};
  const yrs     = yearsAt(user.hire_date);
  const expYrs   = parseExpYears(q.experience);
  const eduScore = educationLevel(q.studies);
  const certSc   = certScore(q.certifications);
  const licSc    = licenseScore(q.licenses);
  const perfSc   = avgReportScore(user.id);
  const onTime   = onTimeRate(user.id);

  let weights, minYears, minCerts, minEdu;
  if (targetRole === 'team_leader') {
    weights  = { years:20, edu:20, cert:22, lic:10, perf:20, ontime:8 };
    minYears = 3; minCerts = 1; minEdu = 35;
  } else {
    weights  = { years:22, edu:24, cert:24, lic:10, perf:12, ontime:8 };
    minYears = 5; minCerts = 2; minEdu = 60;
  }

  const yearsNorm = Math.min(100, (yrs / (minYears * 2)) * 100);
  const raw = (
    yearsNorm * weights.years +
    eduScore  * weights.edu   +
    certSc    * weights.cert  +
    licSc     * weights.lic   +
    perfSc    * weights.perf  +
    onTime    * weights.ontime
  ) / 100;

  const blockers = [];
  if (yrs < minYears) blockers.push(`Needs ${minYears}+ years at SALTEL (currently ${yrs.toFixed(1)})`);
  const cleanCerts = (q.certifications||[]).filter(c => !c.toLowerCase().includes('progress'));
  if (cleanCerts.length < minCerts) blockers.push(`Needs ${minCerts}+ completed certifications`);
  if (eduScore < minEdu) blockers.push(`Education level below requirement`);

  const strengths = [];
  if (yrs >= minYears * 1.5) strengths.push(`Strong tenure — ${yrs.toFixed(1)} years at SALTEL`);
  else if (yrs >= minYears) strengths.push(`${yrs.toFixed(1)} years at SALTEL — meets threshold`);
  if (cleanCerts.length >= 3) strengths.push(`Excellent certification portfolio (${cleanCerts.length} certs)`);
  else if (cleanCerts.length >= minCerts) strengths.push(`${cleanCerts.length} relevant certification(s)`);
  if (eduScore >= 80) strengths.push(`Bachelor's degree or higher`);
  if (perfSc >= 90) strengths.push(`Outstanding field performance (${perfSc}/100)`);
  else if (perfSc >= 80) strengths.push(`Solid field performance (${perfSc}/100)`);
  if (expYrs >= minYears + 2) strengths.push(`${expYrs} years total field experience`);
  if (onTime >= 90) strengths.push(`Exceptional on-time record (${onTime}%)`);

  const score  = Math.min(99, Math.max(10, Math.round(raw)));
  const ready  = blockers.length === 0 && score >= 60;
  const level  = score >= 80 ? 'Strong' : score >= 65 ? 'Ready' : score >= 50 ? 'Developing' : 'Not yet';

  return {
    score, ready, level, blockers, strengths,
    breakdown: {
      'Tenure': Math.round(yearsNorm), 'Education': eduScore,
      'Certifications': certSc, 'License': licSc,
      'Performance': perfSc, 'On-time Rate': onTime,
    },
    years: yrs, dept: user.dept,
    perfSc, onTime, expYrs,
  };
}

// ── AI BONUS ENGINE ──────────────────────────────────────────────────────────

function computeBonus(user, salaries, reports, tasks) {
  const q = user.qualifications || {};
  const yrs = yearsAt(user.hire_date);
  const base = BASE_SALARIES[user.role] || 320000;

  // Performance score from reports
  const userReports = reports.filter(r => r.technician_id === user.id || r.user_id === user.id);
  const perfScore = userReports.length > 0
    ? Math.round(userReports.reduce((s,r) => s+(r.score||75),0)/userReports.length)
    : 70;

  // On-time rate
  const onTimeRt = userReports.length > 0
    ? Math.round(userReports.filter(r=>r.score>=80).length/userReports.length*100)
    : 70;

  // Months of service this year
  const monthsThisYear = Math.min(12, Math.round(yrs * 12) % 12 || 12);

  // Bonus formula:
  // - Performance bonus: up to 15% of base if perf >= 85
  // - Loyalty bonus: 1% per year of service (up to 10%)
  // - On-time bonus: up to 5% if ontime >= 90
  let bonusPct = 0;
  const reasons = [];

  if (perfScore >= 90) { bonusPct += 12; reasons.push(`Exceptional performance score (${perfScore}/100)`); }
  else if (perfScore >= 85) { bonusPct += 8; reasons.push(`Strong performance score (${perfScore}/100)`); }
  else if (perfScore >= 75) { bonusPct += 4; reasons.push(`Good performance score (${perfScore}/100)`); }

  const loyaltyPct = Math.min(10, Math.floor(yrs));
  if (loyaltyPct > 0) { bonusPct += loyaltyPct; reasons.push(`${yrs.toFixed(1)} years of loyal service (+${loyaltyPct}%)`); }

  if (onTimeRt >= 90) { bonusPct += 5; reasons.push(`Excellent on-time submission rate (${onTimeRt}%)`); }
  else if (onTimeRt >= 80) { bonusPct += 2; reasons.push(`Good on-time rate (${onTimeRt}%)`); }

  // Cap at 25%
  bonusPct = Math.min(25, bonusPct);
  const bonusAmount = Math.round((base * bonusPct) / 100 / 1000) * 1000;

  const level = bonusPct >= 15 ? 'High' : bonusPct >= 8 ? 'Medium' : bonusPct >= 3 ? 'Standard' : 'Minimal';

  return {
    bonusPct, bonusAmount, reasons, perfScore, onTimeRt, yrs, monthsThisYear,
    level, base,
    breakdown: {
      'Performance Score': perfScore,
      'On-time Rate': onTimeRt,
      'Years of Service': Math.round(Math.min(100, yrs*10)),
      'Overall Bonus %': bonusPct * 4,
    }
  };
}

// ── AI "thinking" steps ───────────────────────────────────────────────────────
const AI_STEPS = [
  'Loading staff profiles and hire records...',
  'Parsing qualifications and certifications...',
  'Analyzing field performance metrics...',
  'Calculating promotion readiness scores...',
  'Checking eligibility thresholds...',
  'Ranking candidates by category...',
  'Generating AI recommendations...',
];

const BONUS_STEPS = [
  'Loading staff performance history...',
  'Analyzing monthly report scores...',
  'Computing on-time submission rates...',
  'Calculating tenure and loyalty factors...',
  'Running bonus formula engine...',
  'Ranking bonus recommendations...',
  'Generating bonus proposal...',
];

const LEVEL_CONFIG = {
  Strong:     { color:'#10B981', bg:'#ECFDF5', border:'#10B981', icon:'🚀' },
  Ready:      { color:'#4F46E5', bg:'#EEF2FF', border:'#4F46E5', icon:'✅' },
  Developing: { color:'#F59E0B', bg:'#FFFBEB', border:'#F59E0B', icon:'📈' },
  'Not yet':  { color:'#9CA3AF', bg:'#F9FAFB', border:'#D1D5DB', icon:'⏳' },
};

const BONUS_LEVEL_CONFIG = {
  High:     { color:'#10B981', bg:'#ECFDF5', icon:'🏆' },
  Medium:   { color:'#4F46E5', bg:'#EEF2FF', icon:'⭐' },
  Standard: { color:'#F59E0B', bg:'#FFFBEB', icon:'👍' },
  Minimal:  { color:'#9CA3AF', bg:'#F9FAFB', icon:'📋' },
};

const BONUS_MONTH = '2026-04';

export default function PromotionsPage() {
  const { currentUser, reports, tasks, salaries, applyBonus } = useApp();
  const [activeSection, setActiveSection] = useState('promotions'); // promotions | bonus

  // ── PROMOTIONS STATE ──
  const [stage, setStage]       = useState('idle');
  const [stepIdx, setStepIdx]   = useState(0);
  const [results, setResults]   = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [promoted, setPromoted]   = useState({});

  // ── BONUS STATE ──
  const [bonusStage, setBonusStage] = useState('idle');
  const [bonusStepIdx, setBonusStepIdx] = useState(0);
  const [bonusResults, setBonusResults] = useState(null);
  const [applyModal, setApplyModal] = useState(null);
  const [appliedBonuses, setAppliedBonuses] = useState({});

  if (currentUser.role !== 'ceo') {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh' }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:56, marginBottom:16 }}>🔒</div>
          <div style={{ fontSize:22, fontWeight:700, color:'var(--text)' }}>CEO Access Only</div>
          <div style={{ color:'var(--text3)', marginTop:8 }}>This section is restricted to the CEO.</div>
        </div>
      </div>
    );
  }

  // ── PROMOTIONS LOGIC ──
  const runAnalysis = () => {
    setStage('thinking');
    setStepIdx(0);
    setResults(null);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setStepIdx(i);
      if (i >= AI_STEPS.length) {
        clearInterval(iv);
        setTimeout(() => {
          const techToLeader = USERS.filter(u => u.role === 'technician')
            .map(u => ({ user: u, result: computeScore(u, 'team_leader'), targetRole:'team_leader' }))
            .sort((a, b) => b.result.score - a.result.score);
          const leaderToHod = USERS.filter(u => u.role === 'team_leader')
            .map(u => ({ user: u, result: computeScore(u, 'hod'), targetRole:'hod' }))
            .sort((a, b) => b.result.score - a.result.score);
          setResults({ techToLeader, leaderToHod });
          setStage('done');
          setActiveTab('all');
        }, 400);
      }
    }, 380);
  };

  // ── BONUS LOGIC ──
  const runBonusAnalysis = () => {
    setBonusStage('thinking');
    setBonusStepIdx(0);
    setBonusResults(null);
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setBonusStepIdx(i);
      if (i >= BONUS_STEPS.length) {
        clearInterval(iv);
        setTimeout(() => {
          const eligible = USERS.filter(u => !['ceo','daf'].includes(u.role))
            .map(u => ({ user: u, bonus: computeBonus(u, salaries, reports, tasks) }))
            .sort((a, b) => b.bonus.bonusPct - a.bonus.bonusPct);
          setBonusResults(eligible);
          setBonusStage('done');
        }, 400);
      }
    }, 380);
  };

  const handleApplyBonus = () => {
    if (!applyModal) return;
    applyBonus(applyModal.user.id, BONUS_MONTH, applyModal.bonus.bonusAmount, applyModal.bonus.reasons.join('; '));
    setAppliedBonuses(p => ({...p, [applyModal.user.id]: applyModal.bonus.bonusAmount}));
    setApplyModal(null);
  };

  const allCandidates = results
    ? [...results.techToLeader, ...results.leaderToHod].sort((a,b) => b.result.score - a.result.score)
    : [];

  const displayed = activeTab === 'all' ? allCandidates
    : activeTab === 'to_hod' ? results?.leaderToHod || []
    : results?.techToLeader || [];

  const readyCount = allCandidates.filter(c => c.result.ready).length;

  return (
    <div>
      <PageHeader
        title="CEO Intelligence Suite"
        subtitle="AI-powered promotion analysis and performance bonus engine"
      />

      {/* Section tabs */}
      <div style={{ display:'flex', gap:0, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:4, marginBottom:'1.75rem', width:'fit-content' }}>
        {[
          { k:'promotions', l:'🤖 AI Promotions' },
          { k:'bonus',      l:'💰 AI Bonus Engine' },
        ].map(t => (
          <button key={t.k} onClick={() => setActiveSection(t.k)}
            style={{ padding:'9px 22px', borderRadius:9, fontSize:14, fontWeight:400, cursor:'pointer', border:'none', fontFamily:'var(--font)', background:activeSection===t.k?'linear-gradient(135deg,#4F46E5,#7C3AED)':'transparent', color:activeSection===t.k?'#fff':'var(--text3)', transition:'all .15s', letterSpacing:'0.5px' }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ══ PROMOTIONS SECTION ══ */}
      {activeSection === 'promotions' && (
        <>
          {stage !== 'idle' && (
            <div style={{ marginBottom:'1rem', display:'flex', justifyContent:'flex-end' }}>
              <Btn variant="primary" onClick={runAnalysis} disabled={stage === 'thinking'}>
                {stage === 'thinking' ? '⏳ Analyzing...' : '🔄 Re-run Analysis'}
              </Btn>
            </div>
          )}

          {stage === 'idle' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'55vh' }}>
              <div style={{ textAlign:'center', maxWidth:520 }}>
                <div style={{ position:'relative', width:140, height:140, margin:'0 auto 2rem' }}>
                  <div style={{ width:140, height:140, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%,#29ABE2,#4F46E5 60%,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:60, boxShadow:'0 0 60px rgba(41,171,226,0.45)', animation:'pulseGlow 3s ease-in-out infinite' }}>
                    🤖
                  </div>
                </div>
                <h2 style={{ fontSize:28, fontWeight:800, color:'var(--text)', marginBottom:10 }}>AI Promotion Analyzer</h2>
                <p style={{ color:'var(--text3)', lineHeight:1.8, marginBottom:'2rem', fontSize:15 }}>
                  Evaluates every staff member's profile, education, certifications, licenses, years at SALTEL, field performance scores, and on-time reporting, then ranks them by promotion readiness.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:'2rem', textAlign:'left' }}>
                  {[
                    { icon:'📅', l:'Years at SALTEL', d:'Tenure weighted heavily' },
                    { icon:'🎓', l:'Education level', d:'BSc, Masters, DIT analysis' },
                    { icon:'📜', l:'Certifications', d:'CCNA, CFOS, CompTIA etc.' },
                    { icon:'🚗', l:'Driving licenses', d:'A0, A1, Ad classification' },
                    { icon:'⭐', l:'Field performance', d:'Average report scores' },
                    { icon:'🕐', l:'On-time reporting', d:'Submission punctuality' },
                  ].map(f => (
                    <div key={f.l} style={{ padding:'12px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, display:'flex', gap:10 }}>
                      <span style={{ fontSize:20 }}>{f.icon}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{f.l}</div>
                        <div style={{ fontSize:12, color:'var(--text3)' }}>{f.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={runAnalysis}
                  style={{ padding:'15px 40px', borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#29ABE2,#4F46E5 55%,#7C3AED)', color:'#fff', boxShadow:'0 8px 40px rgba(79,70,229,0.4)', letterSpacing:'0.5px', transition:'all .2s' }}
                  onMouseEnter={e=>{ e.target.style.transform='translateY(-3px)'; }}
                  onMouseLeave={e=>{ e.target.style.transform='none'; }}>
                  🤖 Run AI Analysis
                </button>
              </div>
            </div>
          )}

          {stage === 'thinking' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'55vh' }}>
              <div style={{ textAlign:'center', maxWidth:460 }}>
                <div style={{ width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%,#29ABE2,#4F46E5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, margin:'0 auto 2rem', animation:'aiPulse 1.2s ease-in-out infinite' }}>
                  🤖
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>Analyzing staff profiles...</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, textAlign:'left' }}>
                  {AI_STEPS.map((step, i) => (
                    <div key={step} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderRadius:10, background: i < stepIdx ? 'var(--green-l)' : i === stepIdx ? 'var(--primary-l)' : 'var(--bg2)', border:`1px solid ${i < stepIdx ? 'var(--green)' : i === stepIdx ? 'var(--primary)' : 'var(--border)'}` }}>
                      <span style={{ fontSize:14 }}>{i < stepIdx ? '✅' : i === stepIdx ? '⏳' : '○'}</span>
                      <span style={{ fontSize:13, fontWeight: i <= stepIdx ? 600 : 400, color: i < stepIdx ? 'var(--green-d)' : i === stepIdx ? 'var(--primary)' : 'var(--text3)' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {stage === 'done' && results && (
            <div style={{ animation:'fadeInUp .4s ease' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1.5rem' }}>
                {[
                  { l:'Staff Analyzed', v:allCandidates.length, c:'var(--primary)', icon:'👥' },
                  { l:'Ready to Promote', v:readyCount, c:'var(--green)', icon:'🚀' },
                  { l:'Developing', v:allCandidates.filter(c=>c.result.level==='Developing').length, c:'var(--amber)', icon:'📈' },
                  { l:'Not Yet Eligible', v:allCandidates.filter(c=>!c.result.ready&&c.result.level!=='Developing').length, c:'var(--text3)', icon:'⏳' },
                ].map(s => (
                  <div key={s.l} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1rem 1.2rem', boxShadow:'var(--shadow)', display:'flex', gap:12, alignItems:'center' }}>
                    <span style={{ fontSize:28 }}>{s.icon}</span>
                    <div>
                      <div style={{ fontSize:26, fontWeight:800, color:s.c, lineHeight:1 }}>{s.v}</div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:3 }}>{s.l}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:0, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, padding:4, marginBottom:'1.25rem', width:'fit-content' }}>
                {[
                  { k:'all', l:`All (${allCandidates.length})` },
                  { k:'to_hod', l:`Leader → HOD (${results.leaderToHod.length})` },
                  { k:'to_leader', l:`Tech → Leader (${results.techToLeader.length})` },
                ].map(t => (
                  <button key={t.k} onClick={() => setActiveTab(t.k)}
                    style={{ padding:'8px 18px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:activeTab===t.k?'linear-gradient(135deg,#4F46E5,#7C3AED)':'transparent', color:activeTab===t.k?'#fff':'var(--text3)', transition:'all .15s' }}>
                    {t.l}
                  </button>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {displayed.map((c, idx) => {
                  const { user, result, targetRole } = c;
                  const lc = LEVEL_CONFIG[result.level];
                  const isExpanded = expandedId === user.id;
                  const isPromoted = promoted[user.id];
                  const rank = allCandidates.findIndex(x => x.user.id === user.id) + 1;

                  return (
                    <div key={user.id} style={{ background:'var(--bg2)', border:`1.5px solid ${isPromoted ? 'var(--green)' : result.ready ? lc.border : 'var(--border)'}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow)' }}>
                      <div style={{ display:'flex', gap:14, alignItems:'center', padding:'14px 18px', cursor:'pointer' }} onClick={() => setExpandedId(isExpanded ? null : user.id)}>
                        <div style={{ width:32, height:32, borderRadius:10, background: rank===1?'linear-gradient(135deg,#F59E0B,#D97706)':rank===2?'linear-gradient(135deg,#9CA3AF,#6B7280)':rank===3?'linear-gradient(135deg,#CD7F32,#A05C28)':'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color: rank<=3?'#fff':'var(--text3)', flexShrink:0 }}>
                          {rank}
                        </div>
                        <Avatar initials={user.avatar} src={user.profile_pic} color={lc.color} size={44}/>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                            <span style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>{user.name}</span>
                            {isPromoted && <span style={{ padding:'2px 10px', borderRadius:20, background:'var(--green-l)', color:'var(--green-d)', fontSize:11, fontWeight:700, border:'1px solid var(--green)' }}>✓ PROMOTED</span>}
                          </div>
                          <div style={{ fontSize:13, color:'var(--text3)', marginTop:2 }}>{ROLE_CONFIG[user.role]?.label} · {user.dept || 'Management'} · {result.years.toFixed(1)} yrs</div>
                        </div>
                        <div style={{ textAlign:'center', flexShrink:0 }}>
                          <div style={{ fontSize:11, color:'var(--text3)', fontWeight:600, marginBottom:4, textTransform:'uppercase', letterSpacing:'0.5px' }}>Proposed for</div>
                          <div style={{ padding:'4px 12px', borderRadius:20, background:'var(--primary-l)', color:'var(--primary)', fontSize:13, fontWeight:700 }}>{ROLE_CONFIG[targetRole]?.label}</div>
                        </div>
                        <div style={{ textAlign:'center', flexShrink:0, padding:'8px 16px', background:lc.bg, borderRadius:12, border:`1.5px solid ${lc.border}40`, minWidth:90 }}>
                          <div style={{ fontSize:28, fontWeight:900, color:lc.color, lineHeight:1 }}>{result.score}</div>
                          <div style={{ fontSize:10, color:lc.color, fontWeight:700, marginTop:4, textTransform:'uppercase' }}>{lc.icon} {result.level}</div>
                        </div>
                        <div style={{ fontSize:16, color:'var(--text3)', transform:isExpanded?'rotate(180deg)':'none', flexShrink:0 }}>▼</div>
                      </div>

                      <div style={{ padding:'0 18px 10px', display:'flex', gap:6, alignItems:'center' }}>
                        <div style={{ flex:1, height:5, background:'var(--bg4)', borderRadius:4, overflow:'hidden' }}>
                          <div style={{ width:`${result.score}%`, height:'100%', background:`linear-gradient(90deg,${lc.color},${lc.color}aa)`, borderRadius:4 }}/>
                        </div>
                        <div style={{ fontSize:12, color:'var(--text3)', flexShrink:0, width:36, textAlign:'right' }}>{result.score}%</div>
                        {result.blockers.length === 0
                          ? <span style={{ fontSize:11, color:'var(--green-d)', fontWeight:600, flexShrink:0 }}>✓ Eligible</span>
                          : <span style={{ fontSize:11, color:'var(--amber-d)', fontWeight:600, flexShrink:0 }}>⚠ {result.blockers.length} blocker{result.blockers.length>1?'s':''}</span>}
                      </div>

                      {isExpanded && (
                        <div style={{ padding:'0 18px 18px', borderTop:'1px solid var(--border)', paddingTop:16 }}>
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                            <div>
                              <div style={{ fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:10 }}>Score Breakdown</div>
                              {Object.entries(result.breakdown).map(([label, val]) => (
                                <div key={label} style={{ marginBottom:10 }}>
                                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                                    <span style={{ fontSize:12, color:'var(--text2)' }}>{label}</span>
                                    <span style={{ fontSize:12, fontFamily:'var(--mono)', color: val>=80?'var(--green-d)':val>=60?'var(--primary)':'var(--amber-d)' }}>{Math.round(val)}</span>
                                  </div>
                                  <div style={{ height:7, background:'var(--bg4)', borderRadius:4, overflow:'hidden' }}>
                                    <div style={{ width:`${val}%`, height:'100%', background: val>=80?'var(--green)':val>=60?'var(--primary)':'var(--amber)', borderRadius:4 }}/>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div style={{ padding:'12px', background:'var(--bg3)', borderRadius:10, marginBottom:10, fontSize:13, lineHeight:1.7 }}>
                                <div style={{ fontWeight:700, color:'var(--text)', marginBottom:6, fontSize:11, textTransform:'uppercase' }}>Profile Snapshot</div>
                                <div style={{ color:'var(--text2)' }}>🎓 {user.qualifications?.studies || 'Not specified'}</div>
                                <div style={{ color:'var(--text2)' }}>📜 {(user.qualifications?.certifications||[]).join(', ')||'None'}</div>
                                <div style={{ color:'var(--text2)' }}>💼 {user.qualifications?.experience||'Not specified'}</div>
                              </div>
                              {result.blockers.length > 0 && (
                                <div style={{ marginBottom:10 }}>
                                  <div style={{ fontSize:11, color:'var(--amber-d)', fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Blockers</div>
                                  {result.blockers.map(b => <div key={b} style={{ fontSize:12, color:'var(--amber-d)', marginBottom:4 }}>⚠ {b}</div>)}
                                </div>
                              )}
                              {result.strengths.length > 0 && (
                                <div>
                                  <div style={{ fontSize:11, color:'var(--green-d)', fontWeight:700, textTransform:'uppercase', marginBottom:6 }}>Strengths</div>
                                  {result.strengths.slice(0,4).map(s => <div key={s} style={{ fontSize:12, color:'var(--green-d)', marginBottom:4 }}>✓ {s}</div>)}
                                </div>
                              )}
                              {result.ready && !isPromoted && (
                                <Btn variant="primary" style={{ marginTop:12 }} onClick={e=>{e.stopPropagation();setPromoted(p=>({...p,[user.id]:true}));}}>
                                  🚀 Approve Promotion
                                </Btn>
                              )}
                              {isPromoted && <div style={{ marginTop:12, fontSize:13, color:'var(--green-d)', fontWeight:600 }}>✅ Promotion approved this session</div>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ BONUS SECTION ══ */}
      {activeSection === 'bonus' && (
        <>
          {bonusStage !== 'idle' && (
            <div style={{ marginBottom:'1rem', display:'flex', justifyContent:'flex-end' }}>
              <Btn variant="primary" onClick={runBonusAnalysis} disabled={bonusStage === 'thinking'}>
                {bonusStage === 'thinking' ? '⏳ Analyzing...' : '🔄 Re-run Analysis'}
              </Btn>
            </div>
          )}

          {bonusStage === 'idle' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'55vh' }}>
              <div style={{ textAlign:'center', maxWidth:560 }}>
                <div style={{ width:130, height:130, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%,#F59E0B,#EC4899 60%,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:56, margin:'0 auto 2rem', boxShadow:'0 0 60px rgba(236,72,153,0.4)', animation:'pulseGlow 3s ease-in-out infinite' }}>
                  💰
                </div>
                <h2 style={{ fontSize:28, fontWeight:800, color:'var(--text)', marginBottom:10 }}>AI Bonus Engine</h2>
                <p style={{ color:'var(--text3)', lineHeight:1.8, marginBottom:'2rem', fontSize:15 }}>
                  The AI evaluates each staff member's performance history, report scores, on-time rates, and years of service to recommend a tailored monthly bonus. You review and approve each bonus before it's added to their salary for <strong>{BONUS_MONTH}</strong>.
                </p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:'2rem', textAlign:'left' }}>
                  {[
                    { icon:'⭐', l:'Performance Score', d:'Avg report scores' },
                    { icon:'🕐', l:'On-time Rate', d:'Submission punctuality' },
                    { icon:'📅', l:'Years of Service', d:'Loyalty factor' },
                    { icon:'📊', l:'Tasks Completed', d:'Field contribution' },
                    { icon:'📋', l:'Report Quality', d:'Approval rate' },
                    { icon:'💡', l:'Bonus Formula', d:'Up to 25% of base' },
                  ].map(f => (
                    <div key={f.l} style={{ padding:'12px 14px', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:12, display:'flex', gap:10 }}>
                      <span style={{ fontSize:18 }}>{f.icon}</span>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{f.l}</div>
                        <div style={{ fontSize:12, color:'var(--text3)' }}>{f.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={runBonusAnalysis}
                  style={{ padding:'15px 40px', borderRadius:14, fontSize:16, fontWeight:700, cursor:'pointer', border:'none', background:'linear-gradient(135deg,#F59E0B,#EC4899 55%,#8B5CF6)', color:'#fff', boxShadow:'0 8px 40px rgba(236,72,153,0.4)', letterSpacing:'0.5px', transition:'all .2s' }}
                  onMouseEnter={e=>{ e.target.style.transform='translateY(-3px)'; }}
                  onMouseLeave={e=>{ e.target.style.transform='none'; }}>
                  💰 Run Bonus Analysis
                </button>
              </div>
            </div>
          )}

          {bonusStage === 'thinking' && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'55vh' }}>
              <div style={{ textAlign:'center', maxWidth:460 }}>
                <div style={{ width:100, height:100, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%,#F59E0B,#EC4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, margin:'0 auto 2rem', animation:'aiPulse 1.2s ease-in-out infinite' }}>
                  💰
                </div>
                <div style={{ fontSize:20, fontWeight:700, color:'var(--text)', marginBottom:'1.5rem' }}>Analyzing performance data...</div>
                <div style={{ display:'flex', flexDirection:'column', gap:8, textAlign:'left' }}>
                  {BONUS_STEPS.map((step, i) => (
                    <div key={step} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderRadius:10, background: i < bonusStepIdx ? 'var(--green-l)' : i === bonusStepIdx ? 'var(--amber-l)' : 'var(--bg2)', border:`1px solid ${i < bonusStepIdx ? 'var(--green)' : i === bonusStepIdx ? 'var(--amber)' : 'var(--border)'}` }}>
                      <span style={{ fontSize:14 }}>{i < bonusStepIdx ? '✅' : i === bonusStepIdx ? '⏳' : '○'}</span>
                      <span style={{ fontSize:13, color: i < bonusStepIdx ? 'var(--green-d)' : i === bonusStepIdx ? 'var(--amber-d)' : 'var(--text3)' }}>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {bonusStage === 'done' && bonusResults && (
            <div style={{ animation:'fadeInUp .4s ease' }}>
              {/* Summary */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:'1.5rem' }}>
                {[
                  { l:'Staff Analyzed', v:bonusResults.length, c:'var(--primary)' },
                  { l:'High Bonus', v:bonusResults.filter(r=>r.bonus.level==='High').length, c:'var(--green)' },
                  { l:'Total Bonus Pool', v:FMT_RWF(bonusResults.reduce((s,r)=>s+r.bonus.bonusAmount,0)), c:'var(--amber)' },
                  { l:'Applied Bonuses', v:Object.keys(appliedBonuses).length, c:'var(--pink)' },
                ].map(s => (
                  <div key={s.l} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:14, padding:'1rem 1.2rem', boxShadow:'var(--shadow)', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:s.c }}/>
                    <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1.2, marginBottom:6 }}>{s.l}</div>
                    <div style={{ fontSize:18, fontWeight:400, color:s.c, fontFamily:'var(--mono)' }}>{s.v}</div>
                  </div>
                ))}
              </div>

              <div style={{ padding:'12px 16px', background:'var(--amber-l)', border:'1.5px solid var(--amber)', borderRadius:12, marginBottom:'1.25rem', fontSize:13, color:'var(--amber-d)' }}>
                ⚡ Bonuses will be added to the salary record for <strong>{BONUS_MONTH}</strong>. The DAF will need to re-confirm after bonuses are applied.
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {bonusResults.map((item, idx) => {
                  const { user, bonus } = item;
                  const bc = BONUS_LEVEL_CONFIG[bonus.level];
                  const isApplied = !!appliedBonuses[user.id];
                  const rc = ROLE_CONFIG[user.role];
                  const rank = idx + 1;

                  return (
                    <div key={user.id} style={{ background:'var(--bg2)', border:`1.5px solid ${isApplied?'var(--green)':'var(--border)'}`, borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow)' }}>
                      <div style={{ display:'flex', gap:14, alignItems:'center', padding:'14px 18px' }}>
                        <div style={{ width:28, height:28, borderRadius:8, background: rank===1?'linear-gradient(135deg,#F59E0B,#D97706)':rank===2?'linear-gradient(135deg,#9CA3AF,#6B7280)':rank===3?'linear-gradient(135deg,#CD7F32,#A05C28)':'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color: rank<=3?'#fff':'var(--text3)', flexShrink:0 }}>
                          {rank}
                        </div>
                        <Avatar initials={user.avatar} src={user.profile_pic} color={rc?.color||'var(--primary)'} size={44}/>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:15, fontWeight:400, color:'var(--text)' }}>{user.name}</div>
                          <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{rc?.label} {user.dept ? `· ${user.dept}` : ''} · {bonus.yrs.toFixed(1)} yrs</div>
                          <div style={{ display:'flex', gap:12, marginTop:6, fontSize:12, color:'var(--text3)' }}>
                            <span>Perf: <strong style={{ color:'var(--text2)' }}>{bonus.perfScore}/100</strong></span>
                            <span>On-time: <strong style={{ color:'var(--text2)' }}>{bonus.onTimeRt}%</strong></span>
                            <span>Base: <strong style={{ color:'var(--text2)' }}>{FMT_RWF(bonus.base)}</strong></span>
                          </div>
                        </div>

                        {/* Bonus amount */}
                        <div style={{ textAlign:'center', padding:'10px 18px', background:bc.bg, borderRadius:12, minWidth:130 }}>
                          <div style={{ fontSize:11, color:bc.color, fontWeight:700, textTransform:'uppercase', marginBottom:4 }}>{bc.icon} {bonus.level} Bonus</div>
                          <div style={{ fontSize:22, fontWeight:400, fontFamily:'var(--mono)', color:bc.color }}>{FMT_RWF(bonus.bonusAmount)}</div>
                          <div style={{ fontSize:11, color:bc.color, marginTop:2 }}>+{bonus.bonusPct}% of base</div>
                        </div>

                        <div style={{ flexShrink:0 }}>
                          {isApplied ? (
                            <div style={{ padding:'8px 16px', background:'var(--green-l)', color:'var(--green-d)', border:'1px solid var(--green)', borderRadius:9, fontSize:13, fontWeight:600 }}>
                              ✅ Applied
                            </div>
                          ) : (
                            <Btn variant="primary" onClick={() => setApplyModal(item)}>
                              Apply Bonus
                            </Btn>
                          )}
                        </div>
                      </div>

                      {/* Reasons */}
                      {bonus.reasons.length > 0 && (
                        <div style={{ padding:'0 18px 14px', display:'flex', gap:6, flexWrap:'wrap' }}>
                          {bonus.reasons.map(r => (
                            <span key={r} style={{ fontSize:11, padding:'3px 10px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:20, color:'var(--text3)' }}>
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Apply bonus modal */}
          {applyModal && (
            <Modal open={!!applyModal} onClose={() => setApplyModal(null)} title="Apply Performance Bonus" maxWidth={480}>
              <div style={{ textAlign:'center', padding:'0.5rem 0 1rem' }}>
                <Avatar initials={applyModal.user.avatar} src={applyModal.user.profile_pic} color={ROLE_CONFIG[applyModal.user.role]?.color||'var(--primary)'} size={56}/>
                <div style={{ fontSize:18, fontWeight:400, color:'var(--text)', marginTop:10, marginBottom:4 }}>{applyModal.user.name}</div>
                <div style={{ fontSize:13, color:'var(--text3)', marginBottom:'1.5rem' }}>{ROLE_CONFIG[applyModal.user.role]?.label}</div>
                <div style={{ fontSize:32, fontWeight:400, fontFamily:'var(--mono)', color:'var(--green)', marginBottom:4 }}>{FMT_RWF(applyModal.bonus.bonusAmount)}</div>
                <div style={{ fontSize:14, color:'var(--text3)', marginBottom:'1.5rem' }}>+{applyModal.bonus.bonusPct}% of base salary for {BONUS_MONTH}</div>
              </div>

              <div style={{ marginBottom:'1.25rem' }}>
                <div style={{ fontSize:12, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>AI Justification</div>
                {applyModal.bonus.reasons.map(r => (
                  <div key={r} style={{ padding:'7px 12px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:8, fontSize:13, color:'var(--text2)', marginBottom:5 }}>
                    ✓ {r}
                  </div>
                ))}
              </div>

              <div style={{ padding:'10px 14px', background:'var(--primary-l)', border:'1px solid var(--primary)', borderRadius:9, fontSize:13, color:'var(--primary-d)', marginBottom:'1.25rem' }}>
                This bonus will be added to {applyModal.user.name}'s salary for {BONUS_MONTH}. The DAF will be notified to re-confirm the updated salary.
              </div>

              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <Btn variant="ghost" onClick={() => setApplyModal(null)}>Cancel</Btn>
                <Btn variant="primary" onClick={handleApplyBonus}>Approve & Apply Bonus</Btn>
              </div>
            </Modal>
          )}
        </>
      )}
    </div>
  );
}
