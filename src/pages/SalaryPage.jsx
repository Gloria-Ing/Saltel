import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS, FMT_RWF, BASE_SALARIES } from '../data/mockData';
import { Card, PageHeader, Badge, Btn, SectionTitle, EmptyState, Modal, Input, Avatar, Table } from '../components/UI';
import { exportSalariesCSV } from '../utils/exportUtils';

export default function SalaryPage() {
  const { currentUser, salaries, users, confirmSalary, confirmAllSalaries, signSalary, applyBonus, generateMonthlySalaries, updateSalaryBase } = useApp();
  const role = currentUser?.role;

  const [monthFilter, setMonthFilter] = useState('');
  const [viewMonth, setViewMonth] = useState('');
  const [bonusModal, setBonusModal] = useState(null);
  const [bonusAmt, setBonusAmt] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [genModal, setGenModal] = useState(false);
  const [genMonth, setGenMonth] = useState('2026-05');
  const [genYear, setGenYear] = useState(2026);
  const [genQuarter, setGenQuarter] = useState('Q2');

  const availableMonths = [...new Set(salaries.map(s=>s.month))].sort((a,b)=>b.localeCompare(a));
  const selectedMonth = monthFilter || availableMonths[0] || '';

  const monthSalaries = salaries.filter(s=>s.month===selectedMonth);

  // v10: newest first
  const mySalaries = [...salaries].sort((a,b)=>b.month.localeCompare(a.month))
    .filter(s=>{
      if (role==='technician'||role==='team_leader'||role==='accountant'||role==='hod') return s.user_id===currentUser.id;
      return true;
    });

  const totals = {
    base:  monthSalaries.reduce((s,x)=>s+x.base_salary,0),
    bonus: monthSalaries.reduce((s,x)=>s+x.bonus,0),
    net:   monthSalaries.reduce((s,x)=>s+x.net_salary,0),
    pending:  monthSalaries.filter(s=>s.status==='pending').length,
    confirmed:monthSalaries.filter(s=>s.status==='confirmed').length,
    signed:   monthSalaries.filter(s=>s.status==='signed').length,
  };

  const handleBonus = () => {
    if (!bonusAmt||!bonusReason.trim()) { alert('Enter bonus amount and reason.'); return; }
    applyBonus(bonusModal.user_id, bonusModal.month, Number(bonusAmt), bonusReason);
    setBonusModal(null); setBonusAmt(''); setBonusReason('');
  };

  const STATUS_COLOR = { pending:'var(--amber)', confirmed:'var(--cyan)', signed:'var(--green)' };

  // What the current user can see
  const isMyOwnSalaryPage = ['technician','team_leader','accountant','hod'].includes(role);

  if (isMyOwnSalaryPage) {
    const mySal = mySalaries.filter(s=>s.user_id===currentUser.id);
    return (
      <div>
        <PageHeader title="💰 My Salary" subtitle="Your salary records and payment status"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { label:'Latest Net Salary', value:FMT_RWF(mySal[0]?.net_salary||0), color:'var(--green)' },
            { label:'Latest Bonus', value:FMT_RWF(mySal[0]?.bonus||0), color:'var(--primary)' },
            { label:'Base Salary', value:FMT_RWF(mySal[0]?.base_salary||0), color:'var(--cyan)' },
          ].map(s=>(
            <Card key={s.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
              <div style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:'var(--mono)' }}>{s.value}</div>
            </Card>
          ))}
        </div>
        <Card style={{ padding:0 }}>
          <Table
            headers={['Month','Base Salary','Bonus','Net Salary','Status','Action']}
            rows={mySal.map(s=>[
              <span style={{ fontFamily:'var(--mono)', fontWeight:600 }}>{s.month}</span>,
              <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>{FMT_RWF(s.base_salary)}</span>,
              <span style={{ fontFamily:'var(--mono)', fontSize:13, color:s.bonus>0?'var(--green-d)':'var(--text3)' }}>{s.bonus>0?`+${FMT_RWF(s.bonus)}`:'—'}</span>,
              <span style={{ fontFamily:'var(--mono)', fontWeight:800, fontSize:15, color:'var(--primary)' }}>{FMT_RWF(s.net_salary)}</span>,
              <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:`${STATUS_COLOR[s.status]}20`, color:STATUS_COLOR[s.status] }}>{s.status}</span>,
              s.status==='confirmed'
                ? <Btn size="sm" variant="success" onClick={()=>signSalary(s.id)}>✍ Sign</Btn>
                : <span style={{ fontSize:12, color:'var(--text3)' }}>{s.status==='signed'?'✓ Signed':'Awaiting DAF'}</span>
            ])}
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="💰 Salary Management"
        subtitle={role==='daf'?'Confirm and manage all staff salaries':'Salary overview'}
        action={
          <div style={{ display:'flex', gap:8 }}>
            {role==='daf'&&<Btn variant="ghost" onClick={()=>exportSalariesCSV(monthSalaries,users)}>⬇ Export CSV</Btn>}
            {role==='ceo'&&<Btn variant="ghost" onClick={()=>setGenModal(true)}>＋ Generate Month</Btn>}
            {role==='daf'&&<Btn variant="ghost" onClick={()=>setGenModal(true)}>＋ Generate Month</Btn>}
            {role==='daf'&&selectedMonth&&monthSalaries.some(s=>s.status==='pending')&&(
              <Btn variant="primary" onClick={()=>confirmAllSalaries(selectedMonth)}>✓ Confirm All Pending</Btn>
            )}
          </div>
        }
      />

      {/* Month selector */}
      <div style={{ display:'flex', gap:8, marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {availableMonths.map(m=>(
          <button key={m} onClick={()=>setMonthFilter(m)}
            style={{ padding:'8px 18px', borderRadius:9, fontSize:14, fontWeight:600, cursor:'pointer', border:'1.5px solid', borderColor:selectedMonth===m?'var(--primary)':'var(--border)', background:selectedMonth===m?'var(--primary-l)':'var(--bg2)', color:selectedMonth===m?'var(--primary)':'var(--text3)', fontFamily:'var(--font)' }}>
            {m}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label:'Total Net Payroll', value:FMT_RWF(totals.net), color:'var(--green)' },
          { label:'Total Bonuses', value:FMT_RWF(totals.bonus), color:'var(--primary)' },
          { label:`Pending / Confirmed / Signed`, value:`${totals.pending} / ${totals.confirmed} / ${totals.signed}`, color:'var(--cyan)' },
        ].map(s=>(
          <Card key={s.label} style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, marginBottom:4, textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
            <div style={{ fontSize:s.label.includes('Pending')?18:22, fontWeight:800, color:s.color, fontFamily:'var(--mono)' }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Salary table */}
      <Card style={{ padding:0 }}>
        {monthSalaries.length===0
          ? <EmptyState icon="💰" title="No salary records" body={`No salary records for ${selectedMonth||'selected period'}`}/>
          : <Table
              headers={['Employee','Role','Base Salary','Bonus','Net Salary','Status','Actions']}
              rows={[...monthSalaries].sort((a,b)=>a.user_id-b.user_id).map(s=>{
                const u = users.find(x=>x.id===s.user_id);
                const canConfirm = role==='daf' && s.status==='pending';
                const canBonus   = role==='ceo' && s.status==='pending';
                return [
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <Avatar initials={u?.avatar||'?'} size={32} src={u?.profile_pic}/>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{u?.name||'—'}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{u?.dept||'Admin'}</div>
                    </div>
                  </div>,
                  <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>{u?.role||''}</span>,
                  <span style={{ fontFamily:'var(--mono)', fontSize:13 }}>{FMT_RWF(s.base_salary)}</span>,
                  <span style={{ fontFamily:'var(--mono)', fontSize:13, color:s.bonus>0?'var(--green-d)':'var(--text3)', fontWeight:s.bonus>0?700:400 }}>{s.bonus>0?`+${FMT_RWF(s.bonus)}`:'—'}</span>,
                  <span style={{ fontFamily:'var(--mono)', fontWeight:800, color:'var(--primary)' }}>{FMT_RWF(s.net_salary)}</span>,
                  <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600, background:`${STATUS_COLOR[s.status]}20`, color:STATUS_COLOR[s.status] }}>{s.status}</span>,
                  <div style={{ display:'flex', gap:5 }}>
                    {canConfirm && <Btn size="sm" variant="success" onClick={()=>confirmSalary(s.id)}>✓ Confirm</Btn>}
                    {canBonus   && <Btn size="sm" variant="primary" onClick={()=>setBonusModal(s)}>＋ Bonus</Btn>}
                    {!canConfirm&&!canBonus&&<span style={{ fontSize:12, color:'var(--text3)' }}>{s.status==='signed'?'✓ Signed':s.status==='confirmed'?'Awaiting Signature':'Pending'}</span>}
                  </div>
                ];
              })}
              footerRow={[
                <span style={{ fontWeight:700, fontSize:13 }}>TOTALS</span>,
                '',
                <span style={{ fontFamily:'var(--mono)', fontWeight:800 }}>{FMT_RWF(totals.base)}</span>,
                <span style={{ fontFamily:'var(--mono)', fontWeight:800 }}>{FMT_RWF(totals.bonus)}</span>,
                <span style={{ fontFamily:'var(--mono)', fontWeight:800, color:'var(--green-d)', fontSize:15 }}>{FMT_RWF(totals.net)}</span>,
                '',
                ''
              ]}
            />
        }
      </Card>

      {/* Bonus Modal */}
      {bonusModal && (
        <Modal open={true} onClose={()=>setBonusModal(null)} title={`Add Performance Bonus — ${users.find(u=>u.id===bonusModal.user_id)?.name}`} maxWidth={440}>
          <div style={{ marginBottom:'1rem', padding:'12px', background:'var(--bg3)', borderRadius:9, fontSize:13 }}>
            Month: <strong>{bonusModal.month}</strong> · Current Net: <strong style={{ color:'var(--primary)', fontFamily:'var(--mono)' }}>{FMT_RWF(bonusModal.net_salary)}</strong>
          </div>
          <Input label="Bonus Amount (RWF) *" type="number" value={bonusAmt} onChange={e=>setBonusAmt(e.target.value)} placeholder="e.g. 50000"/>
          <div>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Reason *</label>
            <textarea value={bonusReason} onChange={e=>setBonusReason(e.target.value)} placeholder="e.g. Outstanding field performance Q1 2026" style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, resize:'vertical', minHeight:80 }}/>
          </div>
          {bonusAmt > 0 && <div style={{ marginTop:10, padding:'12px', background:'var(--green-l)', border:'1.5px solid var(--green)', borderRadius:10, fontSize:14, fontWeight:700 }}>New Net: {FMT_RWF(bonusModal.net_salary+Number(bonusAmt))}</div>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:'1rem' }}>
            <Btn variant="ghost" onClick={()=>setBonusModal(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleBonus} disabled={!bonusAmt||!bonusReason.trim()}>✓ Apply Bonus</Btn>
          </div>
        </Modal>
      )}

      {/* Generate Month Modal */}
      {genModal && (
        <Modal open={true} onClose={()=>setGenModal(false)} title="Generate Monthly Salaries" maxWidth={400}>
          <Input label="Month (YYYY-MM)" value={genMonth} onChange={e=>setGenMonth(e.target.value)} placeholder="e.g. 2026-05"/>
          <Input label="Year" type="number" value={genYear} onChange={e=>setGenYear(Number(e.target.value))} placeholder="2026"/>
          <Input label="Quarter" value={genQuarter} onChange={e=>setGenQuarter(e.target.value)} placeholder="e.g. Q2"/>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:'1rem' }}>
            <Btn variant="ghost" onClick={()=>setGenModal(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={()=>{ const ok=generateMonthlySalaries(genMonth,genYear,genQuarter); if(!ok)alert('Records already exist for this month.'); else setGenModal(false); }}>Generate</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
