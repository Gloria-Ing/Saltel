import { useState, useRef, useEffect } from 'react';
import { useApp } from '../contexts/AppContext';
import { Card, PageHeader } from '../components/UI';

// ── Role-specific Q&A banks ─────────────────────────────────────────────────
const QA_TECHNICIAN = [
  { q:'How do I submit a report?', a:'Go to Reports → Submit tab. Select your active task card, fill in check-in/out times, capture GPS with "📡 Auto GPS", describe work done, and click Submit Report. You must be assigned to an In Progress task.' },
  { q:'How do I capture my GPS location?', a:'In the Report form, click "📡 Auto GPS". Your browser will ask for location permission — allow it. If unavailable, the system uses your task site coordinates automatically.' },
  { q:'What is the report deadline and scoring?', a:'Report deadline is set by your HoU (Leader) when assigning the task. Scoring: Submit between 2pm–6pm with all fields filled = 90–95/100. Missing fields or bad photo = 80–89/100. After 6pm: you lose 20 points every 30 minutes. So: 6pm–6:30pm = 70, 6:30pm–7pm = 50, 7pm–7:30pm = 30.' },
  { q:'What fields do I need to fill to get 90+?', a:'To score 90–95/100 you need: 1) Work Done description (at least 15+ characters), 2) GPS location captured, 3) Client/Contact name filled, 4) Report photo uploaded. All four required for a complete report.' },
  { q:'How do I submit a fee requisition?', a:'Go to Fee Requisitions → click "+ New Requisition". Select your task, enter transport, meals, lodging amounts. Click "Submit to Supervisor" — your request goes directly to your Supervisor for review.' },
  { q:'My requisition was rejected — what now?', a:'Check the rejection reason from your Supervisor in the requisition details. Correct the issue (wrong amounts, missing items) and submit a new requisition with the corrected information.' },
  { q:'How do I request leave?', a:'Go to Leave & Permissions → "+ Request Leave". Select leave type (Annual, Sick, Emergency, Compassionate), enter dates and reason, then submit. Your HoU or Supervisor will review it.' },
  { q:'How do I check my salary?', a:'Go to Salary in the navigation. You can see monthly records, base pay, bonuses, and payment status. Once DAF confirms, you can digitally sign your salary slip.' },
  { q:'What is my performance score based on?', a:'Your score (0–100) averages your report scores. Each report is scored: 90–95 if submitted 2pm–6pm with full details, 80–89 if incomplete, then minus 20 points per 30 minutes after 6pm. Late flags from Supervisor deduct 15 points.' },
  { q:'How do I contact my HoU?', a:'Go to Messages in the sidebar and start a chat with your HoU (Leader). You can also find their phone number in the Team page under your department.' },
  { q:'LAN: What if a switch is down?', a:'For LAN switch failures: 1) Check power and cable connections. 2) Try soft reboot (hold reset 5 sec). 3) Check console port for boot errors. 4) Test with a loopback. 5) Replace with spare if available. 6) Log all steps in your report.' },
  { q:'LAN: How to make a crossover cable?', a:'Crossover cable wiring: One end uses T568A (green-white, green, orange-white, blue, blue-white, orange, brown-white, brown) and the other end uses T568B (orange-white, orange, green-white, blue, blue-white, green, brown-white, brown). Pins 1↔3 and 2↔6 are swapped. Test with cable tester.' },
  { q:'LAN: How do I crimp a RJ45 connector?', a:'1) Strip 2cm of outer jacket. 2) Untwist pairs and arrange in T568B order: O-W, O, G-W, B, B-W, G, Br-W, Br. 3) Trim wires to equal 1.2cm length. 4) Insert into RJ45 — all 8 wires must reach the end. 5) Crimp firmly. 6) Test with cable tester.' },
  { q:'Fiber: How do I handle a fiber break?', a:'1) Use OTDR to locate break point — note the distance. 2) Mark GPS position. 3) Clear area and prepare splice kit. 4) Strip and clean both fiber ends. 5) Splice or replace the section. 6) Re-run OTDR after repair to confirm link quality. 7) Document splice loss in your report.' },
  { q:'Fiber: What is acceptable OTDR splice loss?', a:'Acceptable splice loss depends on fiber type: Single-mode (G.652) ≤0.1 dB per splice. Multi-mode ≤0.15 dB per splice. Total link budget loss should be within design specs. If loss exceeds this, re-splice.' },
  { q:'CCTV: Camera not recording?', a:'1) Check power supply and PoE switch port. 2) Verify NVR/DVR storage space — may be full. 3) Check camera IP settings and network connectivity with ONVIF scanner. 4) Check video signal format (ONVIF/RTSP). 5) Check motion detection settings. 6) Log issue type and resolution in report.' },
  { q:'CCTV: How do I configure camera IP?', a:"Use the manufacturer's config tool or web browser. Default IPs are usually 192.168.1.64 (Hikvision) or 192.168.254.64 (Dahua). Connect directly to camera via patch cable, set your PC IP to same subnet, then open browser and access default IP. Login with admin credentials and change the IP under Network settings." },
  { q:'What do I do if equipment fails on site?', a:'1) Document the failure in your report under "Issues". 2) Contact your HoU immediately via Messages. 3) Note the equipment serial number and failure symptoms. 4) Do NOT attempt repairs beyond your certification. 5) If urgent, call your HoU directly.' },
  { q:'What materials should I document in my report?', a:'List everything consumed: cables (type + meters), connectors (type + count), patch panels, switches, fiber sleeves, conduit. Example: "50m CAT6 UTP, 10x RJ45 connectors, 1x 24-port patch panel, 2x fiber SC connectors".' },
  { q:'What if I cannot access the site?', a:'Document the access issue in your report under Issues. Contact your HoU via Messages immediately. Attempt to reach the site contact person. If blocked by security, request an access letter from management. Never enter restricted areas without authorization.' },
];

const QA_TEAM_LEADER = [
  { q:'How do I assign technicians to a task?', a:'Go to Tasks → find the task assigned to you (status: Pending Techs) → click "Assign Techs". Select your technicians — FREE ones are shown in green, WORKING ones in amber with warning. Set report schedule and deadline, add notes, and confirm.' },
  { q:'How do I check who has not reported today?', a:'Go to Reports → "⚠ Missing" tab. You will see all active tasks with missing reports for today, including the technician names, phone numbers, and their deadline. You can call them directly from this view.' },
  { q:'How do I designate a report lead?', a:'Open a task in Tasks → Details → in the Team section, click "Set Reporter" next to a technician. The designated reporter will submit one report for the whole team.' },
  { q:'How do I remove a technician from a task?', a:'Open the task → Details → in the Team section, click "Remove" next to the technician. They will be notified and their pending fees for that task will be cleared.' },
  { q:'How do I complete a task?', a:'Go to Tasks → find the In Progress task → click "✓ Complete". This marks the task as completed and allows the fee payment process to finalize.' },
  { q:'How do I approve a report?', a:'Go to Reports → List tab → click on a pending report → in the detail modal, click "✓ Approve Report". You can also add written feedback before approving.' },
  { q:'How do I review a leave request?', a:'Go to Leave & Permissions. Pending leave requests from your team will appear at the top. Click on a request to review it — you can approve or reject with a comment.' },
];

const QA_HOD = [
  { q:'How do I assign a task to a HoU (Leader)?', a:'Go to Tasks → find a task with "Pending HoU" status in your department → click "Assign Leader". Select a HoU from your unit, add briefing notes, and confirm.' },
  { q:'How do I review fee requisitions?', a:'Go to Fee Requisitions. Pending requests from your unit appear with a banner. Click "Review" on each request, check the fee breakdown, add a comment, and approve or reject.' },
  { q:'How do I flag a late report?', a:'Go to Reports → open a pending report → click "🚩 Flag as Late". This reduces the technician score by 15 points and sends them a notification. Only use this for genuinely late submissions.' },
  { q:'How do I create a new task?', a:'Click "+ New Task" in the top-right header or on the Tasks page. Fill in the task title, description, site, department, priority, dates, and report schedule. Submit — it goes to your queue as Supervisor or directly to Leader assignment.' },
  { q:'How do I manage leave requests for my team?', a:'Go to Leave & Permissions. You can see all pending leave requests from your department. Review each one and approve or reject with a comment. Approved leaves are visible to all managers.' },
];

const QA_ACCOUNTANT = [
  { q:'How do I process a requisition payment?', a:'Go to Fee Requisitions. Approved requisitions (green "Approved" badge) can be paid individually with "Mark Paid" or in bulk with "⚡ Auto-Pay All". Each requisition shows the technician name and phone number for MoMo transfer.' },
  { q:'How do I use Auto-Pay All?', a:'Click "⚡ Auto-Pay All" in the top-right of Fee Requisitions. Select payment method (MoMo or Bank Transfer), review each requisition with the technician phone number, select/deselect as needed, confirm the total, and process. Receipts with reference numbers are generated automatically.' },
  { q:'How do I track payment history?', a:'Go to Payments page. You can see all payment records with status (Paid, Pending, Disputed), reference numbers, and amounts. Use filters to narrow by technician, task, or date. Download CSV for reconciliation.' },
  { q:'How do I handle a payment dispute?', a:'Go to Payments → find the disputed payment (marked in red). Click "Resolve" to mark it resolved after investigation. Notify the technician with a message explaining the outcome.' },
  { q:'How do I sign my salary slip?', a:'Go to Salary → find your confirmed salary month → click "Sign". Your digital signature confirms receipt of the salary information.' },
  { q:'What advice do you have for managing field payment efficiency?', a:'Best practices: 1) Process all approved requisitions within 24 hours of supervisor approval to avoid delays. 2) Use Auto-Pay All for batch processing — it generates reference numbers automatically. 3) Verify phone numbers before MoMo transfers. 4) Keep a CSV export for every payment batch. 5) Flag disputes promptly to avoid escalation.' },
  { q:'How should I reconcile monthly field expenses?', a:'Monthly reconciliation steps: 1) Export all payments CSV from the Payments page. 2) Cross-reference with the approved requisitions list. 3) Check DAF Finance page for daily totals vs individual breakdowns. 4) Identify any unresolved disputes. 5) Generate a summary report for DAF approval.' },
  { q:'What financial controls should I follow?', a:'Key controls: Never pay unapproved requisitions (status must be "Approved" by Supervisor). Always record payment reference numbers. For Bank Transfers, confirm account details independently from the system phone number. Report anomalies to DAF immediately. All payments above RWF 100,000 should have dual verification.' },
  { q:'How do I analyze technician expense patterns?', a:'Use the Fee Requisitions page to filter by technician or task. High transport claims may indicate routing inefficiencies. High lodging claims may suggest tasks need closer site selection. Share patterns with DAF for budget planning. Red flags: same technician claiming lodging for local sites, or duplicate requisitions for the same task.' },
];

const QA_DAF = [
  { q:'How do I view daily financial totals?', a:'Go to Fee Requisitions. As DAF, you see the "Daily Requisition Totals" view — aggregated by date showing transport, meals, lodging, and grand total. For individual details, contact the accountant.' },
  { q:'How do I confirm salary records?', a:'Go to Salary. Pending salary records have a "Confirm" button. You can confirm individually or use "Confirm All" for a given month. Employees are notified to sign once confirmed.' },
  { q:'How do I access finance analytics?', a:'Go to Finance & Admin (DAF Finance) in the sidebar. You will see transaction history, monthly spend trends, payment analytics, and department breakdowns.' },
  { q:'How do I generate a budget report?', a:'Go to Finance & Admin → use the export options to download transaction history. Filter by date range and type (payments, advances, refunds). Use CSV exports for external reporting to management.' },
  { q:'What financial KPIs should I monitor?', a:'Key KPIs: 1) Monthly field expense total vs budget. 2) Average requisition approval time. 3) Payment dispute rate. 4) On-time payment rate. 5) Department-wise expense distribution. 6) Salary confirmation timeline. Monitor these monthly to ensure financial health.' },
  { q:'How do I spot financial anomalies?', a:'Warning signs: 1) Requisitions without matching task IDs. 2) Lodging claims for local (non-rural) sites. 3) Multiple requisitions for the same task from same person. 4) Unusually high individual claims vs. team averages. 5) Payments not matching approved requisition amounts. Report all anomalies to CEO immediately.' },
  { q:'What is my role in salary management?', a:'As DAF: 1) You confirm salary records after CEO/HR review. 2) You generate monthly salary batches. 3) You apply bonuses with CEO approval. 4) You monitor signed vs unsigned salary slips. 5) You are the financial authority — your confirmation triggers employee signing.' },
  { q:'How should I advise on field cost optimization?', a:'Cost optimization strategies: 1) Group tasks by site proximity to reduce transport costs. 2) Negotiate lodging rates for frequent rural sites. 3) Set clear per-diem meal rates. 4) Track and compare costs by department — high-spend units need review. 5) Recommend task scheduling to minimize overtime and lodging claims.' },
];

const QA_ALL = [
  { q:'What is FOMS?', a:"FOMS (Field Operations Management System) is SALTEL's internal platform connecting all roles — from CEO and Supervisor to field technicians. It manages tasks, assignments, daily reports, fee claims, salary, performance, and communications in one place." },
  { q:'How do I update my profile?', a:'Click your name at the bottom of the sidebar, or go to Profile. You can change your profile photo, update contact details, and view your qualifications and employment information.' },
  { q:'How do I check announcements?', a:'Go to Announcements in the sidebar. Company-wide announcements and those targeted to your role are shown. Pinned announcements stay at the top. You will also get notification badges.' },
  { q:'How do Messages work?', a:'Go to Messages in the sidebar to see all your conversations. Click a contact to open the chat. Unread message count shows as a badge on the Messages nav item. You can message anyone in your team.' },
  { q:'How do I sign out?', a:'Click the power button ⏻ at the bottom-right of the sidebar next to your profile area. You will be returned to the login screen.' },
];

const ROLE_QA_MAP = {
  technician:  [...QA_TECHNICIAN, ...QA_ALL],
  team_leader: [...QA_TEAM_LEADER, ...QA_TECHNICIAN.filter(q=>q.q.includes('LAN')||q.q.includes('Fiber')||q.q.includes('CCTV')), ...QA_ALL],
  hod:         [...QA_HOD, ...QA_TEAM_LEADER, ...QA_ALL],
  accountant:  [...QA_ACCOUNTANT, ...QA_ALL],
  daf:         [...QA_DAF, ...QA_ACCOUNTANT.slice(0,4), ...QA_ALL],
  ceo:         [...QA_HOD, ...QA_TEAM_LEADER, ...QA_ALL],
};

const CHIPS_BY_ROLE = {
  technician:  ['How do I submit a report?','What fields do I need for 90+ score?','How to make a crossover cable?','Fiber: How to handle a fiber break?','CCTV: Camera not recording?','How do I submit a fee requisition?','How do I request leave?','LAN: How do I crimp a RJ45 connector?'],
  team_leader: ['How do I assign technicians to a task?','How do I check who has not reported today?','How do I approve a report?','LAN: What if a switch is down?','How do I review a leave request?','Fiber: What is acceptable OTDR splice loss?'],
  hod:         ['How do I assign a task to a HoU (Leader)?','How do I review fee requisitions?','How do I flag a late report?','How do I create a new task?','How do I manage leave requests for my team?'],
  accountant:  ['How do I process a requisition payment?','How do I use Auto-Pay All?','How do I handle a payment dispute?','What financial controls should I follow?','How do I analyze technician expense patterns?','How should I reconcile monthly field expenses?'],
  daf:         ['How do I view daily financial totals?','How do I confirm salary records?','What financial KPIs should I monitor?','How do I spot financial anomalies?','How should I advise on field cost optimization?'],
  ceo:         ['How do I create a new task?','How do I manage leave requests for my team?','What financial KPIs should I monitor?','How do I assign a task to a HoU (Leader)?'],
};

const findAnswer = (text, role) => {
  const lower = text.toLowerCase();
  const qa = ROLE_QA_MAP[role] || QA_ALL;
  let best = null, bestScore = 0;
  for (const item of qa) {
    const qWords = item.q.toLowerCase().split(/\W+/).filter(w=>w.length>2);
    const aWords = item.a.toLowerCase().split(/\W+/).filter(w=>w.length>3);
    const qScore = qWords.filter(w => lower.includes(w)).length;
    const aScore = aWords.filter(w => lower.includes(w)).length * 0.5;
    const score = qScore + aScore;
    if (score > bestScore) { bestScore = score; best = item; }
  }
  if (bestScore >= 1.5) return best.a;
  // Keyword fallbacks
  if (lower.includes('report')) return (ROLE_QA_MAP[role]||QA_ALL).find(q=>q.q.includes('report'))?.a || "Go to Reports to submit or view reports.";
  if (lower.includes('requisition')||lower.includes('fee')||lower.includes('expense')) return QA_TECHNICIAN[4].a;
  if (lower.includes('leave')) return QA_TECHNICIAN[6].a;
  if (lower.includes('salary')||lower.includes('pay')) return QA_TECHNICIAN[7].a;
  if (lower.includes('score')||lower.includes('performance')) return QA_TECHNICIAN[8].a;
  if (lower.includes('crossover')||lower.includes('cable')) return QA_TECHNICIAN[11].a;
  if (lower.includes('crimp')||lower.includes('rj45')) return QA_TECHNICIAN[12].a;
  if (lower.includes('fiber')||lower.includes('otdr')||lower.includes('splice')) return QA_TECHNICIAN[13].a;
  if (lower.includes('cctv')||lower.includes('camera')||lower.includes('nvr')) return QA_TECHNICIAN[15].a;
  if (lower.includes('lan')||lower.includes('switch')||lower.includes('network')) return QA_TECHNICIAN[10].a;
  if (lower.includes('auto-pay')||lower.includes('autopay')||lower.includes('bulk pay')) return QA_ACCOUNTANT[1].a;
  if (lower.includes('kpi')||lower.includes('financial')) return (ROLE_QA_MAP[role]||QA_ALL).find(q=>q.q.toLowerCase().includes('kpi'))?.a || QA_DAF[4].a;
  return `I don't have a specific answer for that in my database, but I can help with anything related to SALTEL FOMS — reports, tasks, fees, salary, leave, and ${['technician','unit_leader'].includes(role)?'LAN/Fiber/CCTV field guidance':['maximization_officer','daf'].includes(role)?'financial management and controls':'operations management'}. Try rephrasing or tap a quick question below.`;
};

export default function AIAssistantPage() {
  const { currentUser } = useApp();
  const role = currentUser?.role || 'technician';
  const [messages, setMessages] = useState([
    { from:'ai', text:`Hello ${currentUser?.name?.split(' ')[0] || 'there'}! 👋 I'm your SALTEL FOMS assistant. ${
      role === 'technician' ? "I can answer questions about reports, GPS, field tasks, fees, salary, leave, and technical guidance for LAN, Fiber, and CCTV work." :
      role === 'unit_leader' ? "I can help with task assignment, team management, report review, technical guidance, and field operations." :
      role === 'regional_coordinator' ? "I can assist with task management, leader assignment, report oversight, fee requisitions, and team supervision." :
      role === 'maximization_officer' ? "I can help with requisition processing, Auto-Pay, payment controls, financial reconciliation, and expense analysis." :
      role === 'daf' ? "I can help with financial oversight, salary management, budget KPIs, financial anomaly detection, and cost optimization advice." :
      "I can help with all aspects of SALTEL FOMS operations." } What would you like to know?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);

  const sendMessage = (text) => {
    const q = text.trim();
    if (!q) return;
    setInput('');
    setMessages(p => [...p, { from:'user', text:q }]);
    setLoading(true);
    setTimeout(() => {
      const answer = findAnswer(q, role);
      setMessages(p => [...p, { from:'ai', text:answer }]);
      setLoading(false);
    }, 500);
  };

  const chips = CHIPS_BY_ROLE[role] || CHIPS_BY_ROLE.technician;
  const topics = {
    technician: ['Reports & GPS Capture','Report Scoring (2pm–6pm rule)','Fee Requisitions','Leave Requests','Salary & Pay','LAN Troubleshooting','Crossover & Patch Cables','Fiber Optic Guidance','CCTV Guidance','Site Access Issues','Equipment Failures'],
    team_leader: ['Task Assignment & Badges','Missing Report Tracking','Report Approval','Leave Management','LAN/Fiber/CCTV Guidance'],
    hod: ['Leader Assignment','Fee Requisition Review','Report Flagging','Task Creation','Team Management'],
    accountant: ['Requisition Processing','Auto-Pay All','Payment Reconciliation','Financial Controls','Expense Analysis','Dispute Resolution'],
    daf: ['Daily Financial Totals','Salary Confirmation','Financial KPIs','Anomaly Detection','Cost Optimization','Budget Reporting'],
    ceo: ['Task Management','Team Overview','Financial Summary','Operations Monitoring'],
  };

  return (
    <div>
      <PageHeader
        title="🤖 AI Assistant"
        subtitle={<span>Smart assistant for <span className="saltel-brand" style={{ fontSize:13 }}>SALTEL</span> FOMS — role-tailored answers for {
          role==='technician'?'Field Technicians':role=== 'unit_leader'?'HoU (Leaders)':role=== 'regional_coordinator'?'Supervisors':role=== 'maximization_officer'?'Accountants':role==='daf'?'Finance & Admin':'All Roles'}</span>}
      />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 310px', gap:'1.5rem', alignItems:'start' }}>
        {/* Chat window */}
        <Card style={{ padding:0, display:'flex', flexDirection:'column', height:'72vh' }}>
          <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', background:'var(--bg3)', borderRadius:'16px 16px 0 0', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#169BD5,#0D8EC8)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🤖</div>
            <div>
              <div style={{ fontSize:14, fontWeight:700 }}><span className="saltel-brand" style={{ fontSize:13 }}>SALTEL</span> Assistant</div>
              <div style={{ fontSize:11, color:'var(--green)', fontWeight:600 }}>● Online · Role: {role==='technician'?'Technician':role=== 'unit_leader'?'HoU':role=== 'regional_coordinator'?'Supervisor':role=== 'maximization_officer'?'maximization_officer':role==='daf'?'DAF':'All'}</div>
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'1.25rem', display:'flex', flexDirection:'column', gap:12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent: m.from==='user'?'flex-end':'flex-start' }}>
                {m.from==='ai' && (
                  <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#4F46E5,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, marginRight:8, flexShrink:0, marginTop:2 }}>🤖</div>
                )}
                <div style={{
                  maxWidth:'74%', padding:'10px 14px', lineHeight:1.65, fontSize:14,
                  borderRadius: m.from==='user'?'14px 14px 4px 14px':'14px 14px 14px 4px',
                  background: m.from==='user'?'var(--primary)':'var(--bg3)',
                  color: m.from==='user'?'#fff':'var(--text)',
                  border: m.from==='ai'?'1px solid var(--border)':'none',
                  boxShadow:'var(--shadow1)',
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:'linear-gradient(135deg,#4F46E5,#7C3AED)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🤖</div>
                <div style={{ padding:'10px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderRadius:'14px 14px 14px 4px', fontSize:20, letterSpacing:4 }}>
                  <span className="t-dot">•</span><span className="t-dot">•</span><span className="t-dot">•</span>
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div style={{ padding:'12px 14px', borderTop:'1px solid var(--border)', background:'var(--bg3)', borderRadius:'0 0 14px 14px' }}>
            <div style={{ display:'flex', gap:8 }}>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage(input);} }}
                placeholder="Ask me anything about FOMS..."
                style={{ flex:1, padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:10, background:'var(--bg2)', fontSize:14, color:'var(--text)' }}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim()||loading}
                style={{ padding:'10px 20px', borderRadius:10, background:'var(--primary)', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor:'pointer', opacity:(!input.trim()||loading)?0.5:1, fontFamily:'var(--font)', transition:'opacity .15s' }}>
                Send
              </button>
            </div>
          </div>
        </Card>

        {/* Right panel */}
        <div>
          <Card>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:12 }}>⚡ Quick Questions</div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {chips.map((chip, i) => (
                <button key={i} onClick={() => sendMessage(chip)}
                  style={{ textAlign:'left', padding:'9px 12px', borderRadius:9, border:'1.5px solid var(--border)', background:'var(--bg3)', color:'var(--text)', fontSize:12, cursor:'pointer', transition:'all .15s', fontFamily:'var(--font)', lineHeight:1.4 }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.color='var(--primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text)'; }}>
                  {chip}
                </button>
              ))}
            </div>
          </Card>

          <Card style={{ marginTop:'1rem' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:10 }}>📚 Topics I Cover</div>
            {(topics[role]||topics.technician).map(t => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                <span style={{ fontSize:10, color:'var(--green)', fontWeight:700 }}>✓</span>
                <span style={{ fontSize:12, color:'var(--text2)' }}>{t}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      <style>{`
        @keyframes tDot{0%,80%,100%{opacity:0.2}40%{opacity:1}}
        .t-dot{animation:tDot 1.4s infinite ease-in-out;}
        .t-dot:nth-child(2){animation-delay:.2s;}
        .t-dot:nth-child(3){animation-delay:.4s;}
      `}</style>
    </div>
  );
}
