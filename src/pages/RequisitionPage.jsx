import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS, SITES, FMT_RWF } from '../data/mockData';
import { Card, PageHeader, Badge, Btn, SectionTitle, Input, Textarea, EmptyState, Modal, Table, AlertBanner } from '../components/UI';

// v10: Tech enters ALL fees at once → RC Reviews → Accountant/DAF pays
// NO TL step. DAF sees only daily totals. Only accountant sees individual details.

export default function RequisitionPage() {
  const { currentUser, users, requisitions, tasks, submitRequisition, reviewRequisition, payRequisition, bulkPayRequisitions } = useApp();
  const role = currentUser?.role;

  const [showForm, setShowForm]       = useState(false);
  const [viewReq, setViewReq]         = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch]           = useState('');
  const [dateFilter, setDateFilter]   = useState('');
  // Auto-Pay All state (accountant)
  const [showAutoPay, setShowAutoPay]   = useState(false);
  const [autoPayMethod, setAutoPayMethod] = useState('MoMo');
  const [autoPayIds, setAutoPayIds]     = useState([]);
  const [autoPayDone, setAutoPayDone]   = useState(false);
  const [autoPayRefs, setAutoPayRefs]   = useState([]);

  // Form state — v10: all fees entered at once
  const [taskId, setTaskId]       = useState('');
  const [transport, setTransport] = useState('');
  const [meals, setMeals]         = useState('');
  const [lodging, setLodging]     = useState('');
  const [otherDesc, setOtherDesc] = useState('');
  const [otherAmt, setOtherAmt]   = useState('');
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reviewer state (HoU only)
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewAction, setReviewAction]   = useState('approved');

  const myTasks = tasks.filter(t => (t.technician_ids||[]).includes(currentUser?.id) && t.workflow_stage !== 'hod_created');
  const totalAmt = (Number(transport)||0)+(Number(meals)||0)+(Number(lodging)||0)+(Number(otherAmt)||0);

  // v10: DAF only sees aggregated daily totals — not individual requester details
  // Accountant sees full individual details
  const isDaf = role === 'daf';

  const allApprovedReqs = [...requisitions]
    .sort((a,b)=>new Date(b.created_at)-new Date(a.created_at))
    .filter(r => r.status === 'approved' || r.status === 'paid');

  // Daily totals for DAF
  const dailyTotals = allApprovedReqs.reduce((acc, req) => {
    const date = req.created_at ? new Date(req.created_at).toLocaleDateString('en-RW') : '—';
    if (!acc[date]) acc[date] = { date, count:0, total:0, transport:0, meals:0, lodging:0, status_mix: {} };
    acc[date].count++;
    acc[date].total += req.total || 0;
    (req.items||[]).forEach(item => {
      if (item.label.toLowerCase().includes('transport')) acc[date].transport += item.amount||0;
      if (item.label.toLowerCase().includes('meal'))      acc[date].meals    += item.amount||0;
      if (item.label.toLowerCase().includes('lodging'))   acc[date].lodging  += item.amount||0;
    });
    acc[date].status_mix[req.status] = (acc[date].status_mix[req.status]||0)+1;
    return acc;
  }, {});
  const dailyTotalsList = Object.values(dailyTotals).sort((a,b)=>new Date(b.date)-new Date(a.date));

  const visibleReqs = [...requisitions].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).filter(req => {
    const task = tasks.find(t=>t.id===req.task_id);
    const tech  = USERS.find(u=>u.id===req.technician_id);
    const matchSearch = !search || req.id.toLowerCase().includes(search.toLowerCase()) || task?.title?.toLowerCase().includes(search.toLowerCase()) || tech?.name?.toLowerCase().includes(search.toLowerCase());
    const matchDate = !dateFilter || (req.created_at && new Date(req.created_at).toLocaleDateString('en-RW').includes(dateFilter));
    if (!matchSearch || !matchDate) return false;

    if (role==='technician') return req.technician_id===currentUser.id;
    if (role=== 'regional_coordinator') {
      const t = tasks.find(t=>t.id===req.task_id);
      return t?.hod_id===currentUser.id;
    }
    if (role=== 'maximization_officer') return true;
    if (role==='daf') return req.status==='approved'||req.status==='paid';
    return true;
  });

  const pendingForHoU = role=== 'regional_coordinator'
    ? visibleReqs.filter(r=>r.status==='pending')
    : [];

  const handleSubmit = () => {
    if (!taskId) { alert('Select a task.'); return; }
    if (!transport && !meals && !lodging && !otherAmt) { alert('Enter at least one fee amount.'); return; }
    setSubmitting(true);
    const items = [];
    if (Number(transport)) items.push({ label:'Transport (round trip)', amount:Number(transport) });
    if (Number(meals))     items.push({ label:'Meal allowances', amount:Number(meals) });
    if (Number(lodging))   items.push({ label:'Lodging / accommodation', amount:Number(lodging) });
    if (Number(otherAmt)&&otherDesc) items.push({ label:otherDesc, amount:Number(otherAmt) });
    submitRequisition({ task_id:taskId, technician_id:currentUser.id, items, notes });
    setTimeout(() => {
      setSubmitting(false); setShowForm(false);
      setTaskId(''); setTransport(''); setMeals(''); setLodging(''); setOtherDesc(''); setOtherAmt(''); setNotes('');
    }, 500);
  };

  const handleReview = () => {
    if (!reviewModal) return;
    reviewRequisition(reviewModal.id, reviewAction, reviewComment);
    setReviewModal(null); setReviewComment(''); setReviewAction('approved');
  };

  const headers = ['ID','Task','Technician','Transport','Meals','Lodging','Total (RWF)','Status','Submitted','Action'];

  const rows = visibleReqs.map(req => {
    const task = tasks.find(t=>t.id===req.task_id);
    const tech = USERS.find(u=>u.id===req.technician_id);
    const canRCReview = role=== 'regional_coordinator' && req.status==='pending';
    const canPay       = role=== 'maximization_officer' && req.status==='approved';
    const transport_amt = req.items?.find(i=>i.label.toLowerCase().includes('transport'))?.amount||0;
    const meals_amt     = req.items?.find(i=>i.label.toLowerCase().includes('meal'))?.amount||0;
    const lodging_amt   = req.items?.find(i=>i.label.toLowerCase().includes('lodging'))?.amount||0;

    return [
      <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--primary)' }}>{req.id}</span>,
      <div><div style={{ fontWeight:600, fontSize:12 }}>{task?.title||'—'}</div><div style={{ fontSize:10, color:'var(--text3)' }}>{task?.dept}</div></div>,
      <div style={{ fontSize:12 }}>
        <div style={{ fontWeight:600 }}>{tech?.name||'—'}</div>
        {tech?.phone && <div style={{ fontSize:11, color:'var(--primary)', fontFamily:'var(--mono)', marginTop:1 }}>📱 {tech.phone}</div>}
      </div>,
      <span style={{ fontFamily:'var(--mono)', fontSize:12 }}>{transport_amt?FMT_RWF(transport_amt):'—'}</span>,
      <span style={{ fontFamily:'var(--mono)', fontSize:12 }}>{meals_amt?FMT_RWF(meals_amt):'—'}</span>,
      <span style={{ fontFamily:'var(--mono)', fontSize:12 }}>{lodging_amt?FMT_RWF(lodging_amt):'—'}</span>,
      <span style={{ fontWeight:700, fontFamily:'var(--mono)', color:'var(--green-d)', fontSize:13 }}>{FMT_RWF(req.total)}</span>,
      <Badge status={req.status}/>,
      <span style={{ fontSize:11, color:'var(--text3)' }}>{req.created_at?new Date(req.created_at).toLocaleDateString('en-RW'):'—'}</span>,
      <div style={{ display:'flex', gap:4 }}>
        <Btn size="sm" variant="ghost" onClick={()=>setViewReq(req)}>View</Btn>
        {canRCReview && <Btn size="sm" variant="primary" onClick={()=>setReviewModal({...req})}>Review</Btn>}
        {canPay       && <Btn size="sm" variant="success" onClick={()=>payRequisition(req.id)}>Mark Paid</Btn>}
      </div>
    ];
  });

  const totals = {
    transport: visibleReqs.reduce((s,r)=>{const t=r.items?.find(i=>i.label.toLowerCase().includes('transport')); return s+(t?.amount||0);},0),
    meals:     visibleReqs.reduce((s,r)=>{const t=r.items?.find(i=>i.label.toLowerCase().includes('meal')); return s+(t?.amount||0);},0),
    lodging:   visibleReqs.reduce((s,r)=>{const t=r.items?.find(i=>i.label.toLowerCase().includes('lodging')); return s+(t?.amount||0);},0),
    total:     visibleReqs.reduce((s,r)=>s+r.total,0),
  };

  return (
    <div>
      <PageHeader
        title="🧾 Fee Requisitions"
        subtitle={
          role==='technician' ? 'Submit your field expense claims — all fees in one request' :
          isDaf ? 'Daily requisition totals — finance overview' :
          'Review and process fee requisitions'
        }
        action={
          role==='technician' ? <Btn variant="primary" onClick={()=>setShowForm(true)}>＋ New Requisition</Btn> :
          role=== 'maximization_officer' && requisitions.filter(r=>r.status==='approved').length>0
            ? <Btn variant="success" onClick={()=>{ setAutoPayIds(requisitions.filter(r=>r.status==='approved').map(r=>r.id)); setAutoPayDone(false); setAutoPayRefs([]); setShowAutoPay(true); }}>⚡ Auto-Pay All</Btn>
            : null
        }
      />

      {role==='technician' && (
        <AlertBanner color="var(--primary)" bg="var(--primary-l)" border="var(--primary)">
          📌 Submit ALL your field expenses (transport, meals, lodging) in one requisition. Your request goes directly to your Regional Coordinator for review.
        </AlertBanner>
      )}
      {role=== 'regional_coordinator' && pendingForHoU.length > 0 && (
        <AlertBanner color="var(--primary)" bg="var(--primary-l)" border="var(--primary)">
          🔔 {pendingForHoU.length} requisition(s) awaiting your review.
        </AlertBanner>
      )}

      {/* ─── DAF VIEW: Daily Totals Only ─── */}
      {isDaf && (
        <div>
          <SectionTitle>📅 Daily Requisition Totals (Approved & Paid)</SectionTitle>
          <AlertBanner color="var(--purple)" bg="var(--purple-l, #f5f0ff)" border="var(--purple, #8B5CF6)">
            💎 As DAF, you see aggregated daily totals only. Contact the accountant for individual breakdown details.
          </AlertBanner>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem', marginTop:'1rem' }}>
            {[
              { label:'Total Approved (All Time)', value:FMT_RWF(allApprovedReqs.reduce((s,r)=>s+r.total,0)), color:'var(--primary)' },
              { label:'Pending Payment', value:allApprovedReqs.filter(r=>r.status==='approved').length, color:'var(--amber)' },
              { label:'Paid', value:allApprovedReqs.filter(r=>r.status==='paid').length, color:'var(--green)' },
              { label:'Days with Requisitions', value:dailyTotalsList.length, color:'var(--cyan)' },
            ].map(s=>(
              <Card key={s.label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:'var(--mono)' }}>{s.value}</div>
              </Card>
            ))}
          </div>

          {dailyTotalsList.length===0 ? (
            <EmptyState icon="🧾" title="No approved requisitions yet"/>
          ) : (
            <Card style={{ padding:0 }}>
              <Table
                headers={['Date','# Requests','Transport Total','Meals Total','Lodging Total','Grand Total','Status']}
                rows={dailyTotalsList.map(d => [
                  <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700 }}>{d.date}</span>,
                  <span style={{ fontWeight:700, fontFamily:'var(--mono)' }}>{d.count}</span>,
                  <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>{d.transport?FMT_RWF(d.transport):'—'}</span>,
                  <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>{d.meals?FMT_RWF(d.meals):'—'}</span>,
                  <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>{d.lodging?FMT_RWF(d.lodging):'—'}</span>,
                  <span style={{ fontWeight:800, fontFamily:'var(--mono)', color:'var(--green-d)', fontSize:14 }}>{FMT_RWF(d.total)}</span>,
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {Object.entries(d.status_mix).map(([s,n])=>(
                      <span key={s} style={{ fontSize:10, padding:'2px 6px', borderRadius:6, background:'var(--bg3)', fontWeight:600 }}>{s}: {n}</span>
                    ))}
                  </div>
                ])}
              />
            </Card>
          )}
        </div>
      )}

      {/* ─── ACCOUNTANT + HoU + Technician VIEW: Individual Requisitions ─── */}
      {!isDaf && (
        <>
          {['regional_coordinator','maximization_officer','ceo'].includes(role) && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
              {[
                { label:'Total Requested', value:FMT_RWF(totals.total), color:'var(--primary)' },
                { label:'Transport', value:FMT_RWF(totals.transport), color:'var(--cyan)' },
                { label:'Meals', value:FMT_RWF(totals.meals), color:'var(--green)' },
                { label:'Lodging', value:FMT_RWF(totals.lodging), color:'var(--amber)' },
              ].map(s=>(
                <Card key={s.label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, marginBottom:4 }}>{s.label}</div>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:'var(--mono)' }}>{s.value}</div>
                </Card>
              ))}
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginBottom:'1rem', alignItems:'center', flexWrap:'wrap' }}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by ID, task, or technician..." style={{ flex:1, minWidth:180, padding:'9px 14px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14 }}/>
            {role!=='technician' && (
              <input type="text" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} placeholder="Filter by date..." style={{ width:160, padding:'9px 14px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14 }}/>
            )}
            {role=== 'maximization_officer' && selectedIds.length>0 && (
              <Btn variant="success" onClick={()=>{ bulkPayRequisitions(selectedIds); setSelectedIds([]); }}>💳 Pay {selectedIds.length} Selected</Btn>
            )}
          </div>

          <Card style={{ padding:0 }}>
            {visibleReqs.length===0 ? (
              <EmptyState icon="🧾" title="No requisitions" body={role==='technician'?"Submit your first requisition after completing a field task":"No requisitions to display"}/>
            ) : (
              <Table headers={headers} rows={rows}/>
            )}
          </Card>

          {/* Footer totals row */}
          {visibleReqs.length>0 && ['regional_coordinator','maximization_officer','ceo'].includes(role) && (
            <div style={{ display:'flex', gap:'1rem', padding:'12px 16px', background:'var(--bg3)', borderRadius:10, marginTop:8, fontSize:13 }}>
              <span style={{ fontWeight:600, color:'var(--text3)', marginRight:'auto' }}>Totals ({visibleReqs.length} records)</span>
              <span>🚗 {FMT_RWF(totals.transport)}</span>
              <span>🍽 {FMT_RWF(totals.meals)}</span>
              <span>🏨 {FMT_RWF(totals.lodging)}</span>
              <span style={{ fontWeight:800, color:'var(--green-d)', fontFamily:'var(--mono)' }}>{FMT_RWF(totals.total)}</span>
            </div>
          )}
        </>
      )}

      {/* ── Submit Form Modal ── */}
      <Modal open={showForm} onClose={()=>setShowForm(false)} title="🧾 Submit Fee Requisition" maxWidth={560}>
        <AlertBanner>
          📝 Enter ALL your field expenses in one submission. Goes directly to your Regional Coordinator for approval.
        </AlertBanner>
        <div style={{ marginBottom:'1rem' }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Select Task *</label>
          <select value={taskId} onChange={e=>setTaskId(e.target.value)} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, color:'var(--text)' }}>
            <option value="">— Choose your assigned task —</option>
            {myTasks.map(t=><option key={t.id} value={t.id}>{t.id} · {t.title}</option>)}
          </select>
        </div>
        <SectionTitle>Enter All Fee Amounts (RWF)</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
          <Input label="🚗 Transport" type="number" min="0" value={transport} onChange={e=>setTransport(e.target.value)} placeholder="e.g. 10000"/>
          <Input label="🍽 Meals / Allowance" type="number" min="0" value={meals} onChange={e=>setMeals(e.target.value)} placeholder="e.g. 9000"/>
          <Input label="🏨 Lodging" type="number" min="0" value={lodging} onChange={e=>setLodging(e.target.value)} placeholder="e.g. 20000"/>
          <Input label="📦 Other Amount" type="number" min="0" value={otherAmt} onChange={e=>setOtherAmt(e.target.value)} placeholder="e.g. 3500"/>
        </div>
        <Input label="Other Description" value={otherDesc} onChange={e=>setOtherDesc(e.target.value)} placeholder="e.g. Materials: cable ties & markers"/>
        <Textarea label="Additional Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Any notes about the expenses..."/>
        {totalAmt > 0 && (
          <div style={{ padding:'14px', background:'var(--green-l)', border:'1.5px solid var(--green)', borderRadius:12, marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontWeight:600, fontSize:15 }}>Total Claim</span>
            <span style={{ fontWeight:800, fontSize:20, color:'var(--green-d)', fontFamily:'var(--mono)' }}>{FMT_RWF(totalAmt)}</span>
          </div>
        )}
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn variant="ghost" onClick={()=>setShowForm(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={submitting||!taskId}>
            {submitting ? 'Submitting...' : '🚀 Submit to HoU'}
          </Btn>
        </div>
      </Modal>

      {/* ── View Detail Modal ── */}
      {viewReq && (() => {
        const task = tasks.find(t=>t.id===viewReq.task_id);
        const tech = USERS.find(u=>u.id===viewReq.technician_id);
        return (
          <Modal open={true} onClose={()=>setViewReq(null)} title={`Requisition — ${viewReq.id}`} maxWidth={560}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
              <div>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{task?.title||'—'}</div>
                <div style={{ fontSize:13, color:'var(--text3)' }}>Submitted by {tech?.name||'—'} · {viewReq.created_at?new Date(viewReq.created_at).toLocaleDateString('en-RW'):'—'}</div>
                {tech?.phone && (
                  <div style={{ fontSize:13, color:'var(--primary)', fontFamily:'var(--mono)', fontWeight:600, marginTop:4 }}>
                    📱 {tech.phone} · <span style={{ fontSize:11, color:'var(--text3)', fontWeight:400 }}>Payment will be sent to this number</span>
                  </div>
                )}
              </div>
              <Badge status={viewReq.status}/>
            </div>
            <SectionTitle>Fee Breakdown</SectionTitle>
            <div style={{ marginBottom:'1rem' }}>
              {(viewReq.items||[]).map((item,i)=>(
                <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg3)', borderRadius:9, marginBottom:6 }}>
                  <span style={{ fontSize:14 }}>{item.label}</span>
                  <span style={{ fontWeight:700, fontFamily:'var(--mono)', fontSize:14 }}>{FMT_RWF(item.amount)}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 14px', background:'var(--green-l)', borderRadius:10, border:'1.5px solid var(--green)', marginTop:8 }}>
                <span style={{ fontWeight:700, fontSize:15 }}>TOTAL</span>
                <span style={{ fontWeight:800, fontSize:18, color:'var(--green-d)', fontFamily:'var(--mono)' }}>{FMT_RWF(viewReq.total)}</span>
              </div>
            </div>
            {viewReq.notes && <div style={{ padding:'10px 14px', background:'var(--bg3)', borderRadius:9, marginBottom:8, fontSize:13, color:'var(--text2)' }}>📝 {viewReq.notes}</div>}
            {viewReq.hod_comment && <div style={{ padding:'10px 14px', background:'var(--primary-l)', borderRadius:9, fontSize:13, color:'var(--primary)' }}>🏢 HoU: {viewReq.hod_comment}</div>}
          </Modal>
        );
      })()}

      {/* ── RC Review Modal ── */}
      {reviewModal && (
        <Modal open={true} onClose={()=>setReviewModal(null)} title={`RC Review — ${reviewModal.id}`} maxWidth={480}>
          <div style={{ padding:'12px 14px', background:'var(--bg3)', borderRadius:10, marginBottom:'1rem' }}>
            <div style={{ fontWeight:700, marginBottom:4 }}>{tasks.find(t=>t.id===reviewModal.task_id)?.title}</div>
            <div style={{ fontSize:13, color:'var(--text3)' }}>
              Submitted by: <strong>{USERS.find(u=>u.id===reviewModal.technician_id)?.name||'—'}</strong>
            </div>
            {USERS.find(u=>u.id===reviewModal.technician_id)?.phone && (
              <div style={{ fontSize:13, color:'var(--primary)', fontFamily:'var(--mono)', fontWeight:600 }}>
                📱 {USERS.find(u=>u.id===reviewModal.technician_id).phone}
              </div>
            )}
            <div style={{ fontSize:13, color:'var(--text3)' }}>Total: <strong style={{ color:'var(--green-d)', fontFamily:'var(--mono)' }}>{FMT_RWF(reviewModal.total)}</strong></div>
          </div>
          <SectionTitle>Items</SectionTitle>
          {(reviewModal.items||[]).map((item,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 12px', background:'var(--bg3)', borderRadius:8, marginBottom:5 }}>
              <span style={{ fontSize:13 }}>{item.label}</span>
              <span style={{ fontWeight:700, fontFamily:'var(--mono)', fontSize:13 }}>{FMT_RWF(item.amount)}</span>
            </div>
          ))}
          <div style={{ margin:'1rem 0' }}>
            <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>Decision</div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setReviewAction('approved')} style={{ flex:1, padding:'10px', borderRadius:9, border:`2px solid ${reviewAction==='approved'?'var(--green)':'var(--border)'}`, background:reviewAction==='approved'?'var(--green-l)':'var(--bg3)', color:reviewAction==='approved'?'var(--green-d)':'var(--text3)', fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', fontSize:14 }}>✓ Approve</button>
              <button onClick={()=>setReviewAction('rejected')} style={{ flex:1, padding:'10px', borderRadius:9, border:`2px solid ${reviewAction==='rejected'?'var(--red)':'var(--border)'}`, background:reviewAction==='rejected'?'var(--red-l)':'var(--bg3)', color:reviewAction==='rejected'?'var(--red-d)':'var(--text3)', fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', fontSize:14 }}>✕ Reject</button>
            </div>
          </div>
          <Textarea label="Comment (required for rejection)" value={reviewComment} onChange={e=>setReviewComment(e.target.value)} placeholder="Add your review comment..."/>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Btn variant="ghost" onClick={()=>setReviewModal(null)}>Cancel</Btn>
            <Btn variant={reviewAction==='approved'?'success':'danger'} onClick={handleReview}>
              {reviewAction==='approved'?'✓ Confirm Approval':'✕ Confirm Rejection'}
            </Btn>
          </div>
        </Modal>
      )}

      {/* ── Auto-Pay All Modal (Accountant) ── */}
      {showAutoPay && role=== 'maximization_officer' && (() => {
        const approvedReqs = requisitions.filter(r=>r.status==='approved');
        const selectedReqs = approvedReqs.filter(r=>autoPayIds.includes(r.id));
        const total = selectedReqs.reduce((s,r)=>s+r.total,0);
        const toggleAutoPayId = id => setAutoPayIds(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
        const handleAutoPay = () => {
          const refs = selectedReqs.map(r=>({ id:r.id, ref:`${autoPayMethod==='MoMo'?'MM':'BT'}${Date.now()}${r.id}`, tech:users.find(u=>u.id===r.technician_id)?.name||'—', amount:r.total }));
          bulkPayRequisitions(autoPayIds);
          setAutoPayRefs(refs);
          setAutoPayDone(true);
        };
        return (
          <Modal open={true} onClose={()=>{ setShowAutoPay(false); setAutoPayDone(false); }} title="⚡ Auto-Pay All Approved Requisitions" maxWidth={600}>
            {!autoPayDone ? (
              <>
                <div style={{ padding:'12px 14px', background:'var(--primary-l)', border:'1px solid var(--primary)', borderRadius:9, marginBottom:'1rem', fontSize:13, color:'var(--primary)', fontWeight:600 }}>
                  Process all approved requisitions in one batch payment.
                </div>
                {/* Payment method */}
                <div style={{ marginBottom:'1rem' }}>
                  <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>Payment Method</div>
                  <div style={{ display:'flex', gap:8 }}>
                    {['MoMo','Bank Transfer'].map(m=>(
                      <button key={m} onClick={()=>setAutoPayMethod(m)} style={{ flex:1, padding:'10px', borderRadius:9, border:`2px solid ${autoPayMethod===m?'var(--primary)':'var(--border)'}`, background:autoPayMethod===m?'var(--primary-l)':'var(--bg3)', color:autoPayMethod===m?'var(--primary)':'var(--text3)', fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', fontSize:14 }}>{m}</button>
                    ))}
                  </div>
                </div>
                {/* Select/deselect individual requisitions */}
                <div style={{ fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>Select Requisitions</div>
                <div style={{ maxHeight:280, overflowY:'auto', display:'flex', flexDirection:'column', gap:6, marginBottom:'1rem' }}>
                  {approvedReqs.map(req=>{
                    const task=tasks.find(t=>t.id===req.task_id);
                    const tech=USERS.find(u=>u.id===req.technician_id);
                    const sel=autoPayIds.includes(req.id);
                    return (
                      <div key={req.id} onClick={()=>toggleAutoPayId(req.id)} style={{ padding:'10px 14px', borderRadius:9, border:`2px solid ${sel?'var(--primary)':'var(--border)'}`, background:sel?'var(--primary-l)':'var(--bg3)', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:600 }}>{tech?.name||'—'}</div>
                          <div style={{ fontSize:11, color:'var(--text3)' }}>{task?.title||'—'} · {req.id}</div>
                          {tech?.phone && <div style={{ fontSize:11, color:'var(--primary)' }}>📱 {tech.phone}</div>}
                        </div>
                        <div style={{ textAlign:'right' }}>
                          <div style={{ fontWeight:800, fontFamily:'var(--mono)', color:'var(--green-d)', fontSize:14 }}>{FMT_RWF(req.total)}</div>
                          {sel && <span style={{ fontSize:11, color:'var(--primary)', fontWeight:700 }}>✓ Selected</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Total */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', background:'var(--green-l)', border:'1.5px solid var(--green)', borderRadius:10, marginBottom:'1rem' }}>
                  <span style={{ fontWeight:700, fontSize:14 }}>Total ({selectedReqs.length} payment{selectedReqs.length!==1?'s':''})</span>
                  <span style={{ fontWeight:800, fontSize:20, color:'var(--green-d)', fontFamily:'var(--mono)' }}>{FMT_RWF(total)}</span>
                </div>
                <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                  <Btn variant="ghost" onClick={()=>setShowAutoPay(false)}>Cancel</Btn>
                  <Btn variant="success" onClick={handleAutoPay} disabled={selectedReqs.length===0}>
                    ⚡ Process {selectedReqs.length} Payment{selectedReqs.length!==1?'s':''}
                  </Btn>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign:'center', padding:'1rem 0', marginBottom:'1rem' }}>
                  <div style={{ fontSize:48, marginBottom:10 }}>✅</div>
                  <div style={{ fontSize:18, fontWeight:800, color:'var(--green-d)', marginBottom:4 }}>Payments Processed!</div>
                  <div style={{ fontSize:13, color:'var(--text3)' }}>{autoPayRefs.length} payment{autoPayRefs.length!==1?'s':''} processed via {autoPayMethod}</div>
                </div>
                <div style={{ fontSize:13, fontWeight:700, color:'var(--text2)', marginBottom:8 }}>Payment Receipts</div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, maxHeight:280, overflowY:'auto', marginBottom:'1rem' }}>
                  {autoPayRefs.map((r,i)=>(
                    <div key={i} style={{ padding:'10px 14px', background:'var(--green-l)', border:'1px solid var(--green)', borderRadius:9, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600 }}>{r.tech}</div>
                        <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>Ref: {r.ref}</div>
                      </div>
                      <span style={{ fontWeight:700, fontFamily:'var(--mono)', color:'var(--green-d)' }}>{FMT_RWF(r.amount)}</span>
                    </div>
                  ))}
                </div>
                <Btn variant="primary" onClick={()=>{ setShowAutoPay(false); setAutoPayDone(false); }} style={{ width:'100%' }}>Done</Btn>
              </>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}