import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS, SITES, FMT_RWF } from '../data/mockData';
import { Card, PageHeader, Badge, Btn, SectionTitle, EmptyState, Modal, Textarea, Table } from '../components/UI';
import { exportPaymentsCSV } from '../utils/exportUtils';

// v10: Display as table with column totals (transport, meals, lodging, total columns)
// v10: Sort newest first everywhere

export default function PaymentsPage() {
  const { currentUser, payments, tasks, processPayment, raiseDispute, resolveDispute } = useApp();
  const role = currentUser?.role;

  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter]     = useState('all');
  const [search, setSearch]             = useState('');
  const [viewPay, setViewPay]           = useState(null);
  const [disputeModal, setDisputeModal] = useState(null);
  const [disputeReason, setDisputeReason] = useState('');

  const myPayments = payments.filter(p => {
    if (role==='technician') return p.technician_id===currentUser.id;
    return true;
  });

  // v10: Newest first
  const filtered = [...myPayments].sort((a,b) => {
    const da = new Date(a.paid_at||a.id||0);
    const db = new Date(b.paid_at||b.id||0);
    return db - da;
  }).filter(p => {
    const task = tasks.find(t=>t.id===p.task_id);
    const tech = USERS.find(u=>u.id===p.technician_id);
    const matchStatus = statusFilter==='all'||p.status===statusFilter||(statusFilter==='disputed'&&p.disputed);
    const matchDept   = deptFilter==='all'||(task?.dept===deptFilter);
    const matchSearch = !search||p.id.toLowerCase().includes(search.toLowerCase())||task?.title?.toLowerCase().includes(search.toLowerCase())||tech?.name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchDept && matchSearch;
  });

  // Column totals
  const totals = {
    transport: filtered.reduce((s,p)=>s+(p.transport||0),0),
    meals:     filtered.reduce((s,p)=>s+(p.meals||0),0),
    lodging:   filtered.reduce((s,p)=>s+(p.lodging||0),0),
    total:     filtered.reduce((s,p)=>s+(p.total||0),0),
  };

  // CEO sees aggregate totals only
  if (role==='ceo') {
    const stats = [
      { label:'Total Paid', value:FMT_RWF(payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.total,0)), color:'var(--green)' },
      { label:'Pending', value:FMT_RWF(payments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.total,0)), color:'var(--amber)' },
      { label:'Disputed', value:payments.filter(p=>p.disputed&&p.dispute_status==='open').length, color:'var(--red)', suffix:' disputes' },
      { label:'Total Transport', value:FMT_RWF(payments.reduce((s,p)=>s+(p.transport||0),0)), color:'var(--cyan)' },
      { label:'Total Meals', value:FMT_RWF(payments.reduce((s,p)=>s+(p.meals||0),0)), color:'var(--primary)' },
      { label:'Total Lodging', value:FMT_RWF(payments.reduce((s,p)=>s+(p.lodging||0),0)), color:'var(--purple)' },
    ];
    return (
      <div>
        <PageHeader title="💳 Payments Overview" subtitle="Aggregate payment summary — CEO view"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
          {stats.map(s=>(
            <Card key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{s.label}</div>
              <div style={{ fontSize:24, fontWeight:800, color:s.color, fontFamily:'var(--mono)' }}>{s.value}{s.suffix||''}</div>
            </Card>
          ))}
        </div>
        <Card>
          <SectionTitle>Payment Distribution by Department</SectionTitle>
          {['LAN','Fiber','CCTV'].map(dept=>{
            const deptPayments = payments.filter(p=>tasks.find(t=>t.id===p.task_id)?.dept===dept);
            const total  = deptPayments.reduce((s,p)=>s+p.total,0);
            const paid   = deptPayments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.total,0);
            const pending= deptPayments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.total,0);
            return (
              <div key={dept} style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div style={{ fontWeight:700, fontSize:15 }}>{dept} Unit</div>
                <div style={{ display:'flex', gap:'2rem', fontSize:13 }}>
                  <span style={{ color:'var(--green-d)' }}>✓ {FMT_RWF(paid)}</span>
                  <span style={{ color:'var(--amber-d)' }}>⧗ {FMT_RWF(pending)}</span>
                  <span style={{ fontWeight:800 }}>TOTAL: {FMT_RWF(total)}</span>
                </div>
              </div>
            );
          })}
        </Card>
      </div>
    );
  }

  const headers = role==='technician'
    ? ['ID','Task','Transport','Meals','Lodging','Total','Status','Actions']
    : ['ID','Technician','Task','Transport','Meals','Lodging','Total','Status','Actions'];

  const makeRow = p => {
    const task = tasks.find(t=>t.id===p.task_id);
    const tech = USERS.find(u=>u.id===p.technician_id);
    const canPay = (role==='accountant'||role==='daf') && p.status==='pending' && !p.disputed;
    const canDispute = role==='technician' && p.status==='pending' && !p.disputed;
    const canResolve = (role==='accountant'||role==='daf') && p.disputed && p.dispute_status==='open';

    const cells = [
      <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--primary)' }}>{p.id}</span>,
    ];
    if (role!=='technician') cells.push(<div style={{ fontSize:13 }}>{tech?.name||'—'}<div style={{ fontSize:11, color:'var(--text3)' }}>{tech?.dept} · {tech?.avatar}</div></div>);
    cells.push(
      <div><div style={{ fontSize:12, fontWeight:600, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task?.title||'—'}</div><div style={{ fontSize:11, color:'var(--text3)' }}>{task?.dept}</div></div>,
      <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>{FMT_RWF(p.transport||0)}</span>,
      <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>{FMT_RWF(p.meals||0)}</span>,
      <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>{FMT_RWF(p.lodging||0)}</span>,
      <div>
        <span style={{ fontFamily:'var(--mono)', fontSize:13, fontWeight:700, color:'var(--green-d)' }}>{FMT_RWF(p.total)}</span>
        {p.disputed && <div style={{ fontSize:10, color:'var(--red)', fontWeight:700 }}>⚠ DISPUTED</div>}
      </div>,
      <Badge status={p.disputed&&p.dispute_status==='open'?'disputed':p.status}/>,
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        <Btn size="sm" variant="ghost" onClick={()=>setViewPay(p)}>View</Btn>
        {canPay && <Btn size="sm" variant="success" onClick={()=>processPayment(p.id)}>✓ Pay</Btn>}
        {canDispute && <Btn size="sm" variant="danger" onClick={()=>setDisputeModal(p)}>⚠ Dispute</Btn>}
        {canResolve && <Btn size="sm" variant="teal" onClick={()=>resolveDispute(p.id)}>✓ Resolve</Btn>}
      </div>
    );
    return cells;
  };

  const footerRow = role!=='technician'
    ? [
        <span style={{ fontWeight:700, fontSize:13 }}>TOTALS ({filtered.length})</span>,
        '',
        '',
        <span style={{ fontFamily:'var(--mono)', fontWeight:800 }}>{FMT_RWF(totals.transport)}</span>,
        <span style={{ fontFamily:'var(--mono)', fontWeight:800 }}>{FMT_RWF(totals.meals)}</span>,
        <span style={{ fontFamily:'var(--mono)', fontWeight:800 }}>{FMT_RWF(totals.lodging)}</span>,
        <span style={{ fontFamily:'var(--mono)', fontWeight:800, color:'var(--green-d)', fontSize:15 }}>{FMT_RWF(totals.total)}</span>,
        '',
        '',
      ]
    : [
        <span style={{ fontWeight:700 }}>TOTALS</span>,
        '',
        <span style={{ fontFamily:'var(--mono)', fontWeight:800 }}>{FMT_RWF(totals.transport)}</span>,
        <span style={{ fontFamily:'var(--mono)', fontWeight:800 }}>{FMT_RWF(totals.meals)}</span>,
        <span style={{ fontFamily:'var(--mono)', fontWeight:800 }}>{FMT_RWF(totals.lodging)}</span>,
        <span style={{ fontFamily:'var(--mono)', fontWeight:800, color:'var(--green-d)' }}>{FMT_RWF(totals.total)}</span>,
        '',
        '',
      ];

  return (
    <div>
      <PageHeader
        title="💳 Payments"
        subtitle="Field technician expense payments — sorted newest first"
        action={
          <div style={{ display:'flex', gap:8 }}>
            {['accountant','daf'].includes(role) && (
              <Btn variant="ghost" onClick={()=>exportPaymentsCSV(filtered,tasks)}>⬇ Export CSV</Btn>
            )}
          </div>
        }
      />

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Transport', value:FMT_RWF(payments.filter(p=>role==='technician'?p.technician_id===currentUser.id:true).reduce((s,p)=>s+(p.transport||0),0)), color:'var(--cyan)' },
          { label:'Meals', value:FMT_RWF(payments.filter(p=>role==='technician'?p.technician_id===currentUser.id:true).reduce((s,p)=>s+(p.meals||0),0)), color:'var(--green)' },
          { label:'Lodging', value:FMT_RWF(payments.filter(p=>role==='technician'?p.technician_id===currentUser.id:true).reduce((s,p)=>s+(p.lodging||0),0)), color:'var(--purple)' },
          { label:'Total', value:FMT_RWF(payments.filter(p=>role==='technician'?p.technician_id===currentUser.id:true).reduce((s,p)=>s+p.total,0)), color:'var(--primary)' },
        ].map(s=>(
          <Card key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{s.label}</div>
            <div style={{ fontSize:18, fontWeight:800, color:s.color, fontFamily:'var(--mono)' }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:'1rem', flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search payment, task, technician..." style={{ flex:1, minWidth:200, padding:'9px 14px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14 }}/>
        {(['all','pending','paid','disputed']).map(s=>(
          <button key={s} onClick={()=>setStatusFilter(s)} style={{ padding:'8px 16px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', border:'1.5px solid', borderColor:statusFilter===s?'var(--primary)':'var(--border)', background:statusFilter===s?'var(--primary-l)':'var(--bg2)', color:statusFilter===s?'var(--primary)':'var(--text3)', fontFamily:'var(--font)' }}>
            {s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}
          </button>
        ))}
        {role!=='technician' && (
          <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)} style={{ padding:'8px 13px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14 }}>
            <option value="all">All Units</option>
            <option value="LAN">LAN</option>
            <option value="Fiber">Fiber</option>
            <option value="CCTV">CCTV</option>
          </select>
        )}
      </div>

      {/* Table with column totals */}
      <Card style={{ padding:0 }}>
        {filtered.length===0
          ? <EmptyState icon="💳" title="No payments found" body="No payment records match your filters"/>
          : <Table headers={headers} rows={filtered.map(makeRow)} footerRow={footerRow}/>
        }
      </Card>

      {/* ── View Modal ── */}
      {viewPay && (() => {
        const task = tasks.find(t=>t.id===viewPay.task_id);
        const tech = USERS.find(u=>u.id===viewPay.technician_id);
        const site = SITES.find(s=>s.id===task?.site_id);
        return (
          <Modal open={true} onClose={()=>setViewPay(null)} title={`Payment Detail — ${viewPay.id}`} maxWidth={500}>
            <div style={{ marginBottom:'1rem' }}>
              <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>{task?.title||'—'}</div>
              <div style={{ fontSize:13, color:'var(--text3)' }}>📍 {site?.name} · {tech?.name}</div>
            </div>
            <SectionTitle>Breakdown</SectionTitle>
            {[['🚗 Transport', viewPay.transport],['🍽 Meals', viewPay.meals],['🏨 Lodging', viewPay.lodging]].map(([l,v])=>(
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 14px', background:'var(--bg3)', borderRadius:9, marginBottom:6 }}>
                <span style={{ fontSize:14 }}>{l}</span>
                <span style={{ fontWeight:700, fontFamily:'var(--mono)' }}>{FMT_RWF(v)}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 14px', background:'var(--green-l)', borderRadius:10, border:'1.5px solid var(--green)', margin:'8px 0' }}>
              <span style={{ fontWeight:700 }}>TOTAL</span>
              <span style={{ fontWeight:800, color:'var(--green-d)', fontFamily:'var(--mono)', fontSize:17 }}>{FMT_RWF(viewPay.total)}</span>
            </div>
            {viewPay.disputed && <div style={{ padding:'10px 14px', background:'var(--red-l)', border:'1px solid var(--red)', borderRadius:9, marginTop:8, fontSize:13, color:'var(--red-d)' }}>⚠ Dispute: {viewPay.dispute_reason}</div>}
            <div style={{ fontSize:13, color:'var(--text3)', marginTop:10 }}>
              Status: <Badge status={viewPay.status}/> · Method: {viewPay.method} · Ref: {viewPay.ref||'Pending'}
            </div>
          </Modal>
        );
      })()}

      {/* ── Dispute Modal ── */}
      {disputeModal && (
        <Modal open={true} onClose={()=>setDisputeModal(null)} title={`⚠ Raise Dispute — ${disputeModal.id}`} maxWidth={440}>
          <div style={{ marginBottom:'1rem', padding:'12px', background:'var(--red-l)', borderRadius:9, fontSize:13, color:'var(--red-d)' }}>
            Total: <strong>{FMT_RWF(disputeModal.total)}</strong> for {tasks.find(t=>t.id===disputeModal.task_id)?.title}
          </div>
          <Textarea label="Describe the dispute reason *" value={disputeReason} onChange={e=>setDisputeReason(e.target.value)} placeholder="e.g. Lodging was not included but should be, rural site overnight stay."/>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Btn variant="ghost" onClick={()=>setDisputeModal(null)}>Cancel</Btn>
            <Btn variant="danger" disabled={!disputeReason.trim()} onClick={()=>{ raiseDispute(disputeModal.id, disputeReason); setDisputeModal(null); setDisputeReason(''); }}>Submit Dispute</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
