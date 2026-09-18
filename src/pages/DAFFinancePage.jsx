import { useApp } from '../contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { USERS, FMT_RWF } from '../data/mockData';
import { Card, PageHeader, SectionTitle, StatCard, Table, Badge, Btn } from '../components/UI';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CHART_DATA } from '../data/mockData';

// DAF-only finance dashboard
export default function DAFFinancePage() {
  const { currentUser, payments, salaries, transactions, users, tasks, requisitions } = useApp();
  const navigate = useNavigate();

  if (currentUser?.role !== 'daf') {
    return <div style={{ padding:'2rem', textAlign:'center', color:'var(--text3)' }}>Access restricted to DAF only.</div>;
  }

  const totalPayroll = salaries.filter(s=>s.month==='2026-04').reduce((s,x)=>s+x.net_salary,0);
  const totalPaid = payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.total,0);
  const totalPending = payments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.total,0);
  const totalReqs = requisitions.filter(r=>r.status==='approved').reduce((s,r)=>s+r.total,0);
  const disputes = payments.filter(p=>p.disputed&&p.dispute_status==='open').length;
  const pending_sal = salaries.filter(s=>s.status==='pending').length;

  const recentTxns = [...transactions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,8);

  return (
    <div>
      <PageHeader title="💎 DAF Finance Dashboard" subtitle="Director of Administration & Finance — Full financial overview"/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="April 2026 Payroll" value={FMT_RWF(totalPayroll)} color="var(--purple)" icon="💰" onClick={()=>navigate('/salary')}/>
        <StatCard label="Payments Pending" value={FMT_RWF(totalPending)} color="var(--red)" icon="💳" onClick={()=>navigate('/payments')}/>
        <StatCard label="Payments Paid" value={FMT_RWF(totalPaid)} color="var(--green)" icon="✓" onClick={()=>navigate('/payments')}/>
        <StatCard label="Approved Requisitions" value={FMT_RWF(totalReqs)} color="var(--amber)" icon="🧾" onClick={()=>navigate('/requisitions')}/>
        <StatCard label="Open Disputes" value={disputes} color="var(--red)" icon="⚠" onClick={()=>navigate('/payments')}/>
        <StatCard label="Salaries Pending Confirm" value={pending_sal} color="var(--cyan)" icon="📝" onClick={()=>navigate('/salary')}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        <Card>
          <SectionTitle>📊 Monthly Expenditure Trend</SectionTitle>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={CHART_DATA.monthly_spend}>
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
              <Tooltip contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} formatter={v=>[FMT_RWF(v),'Amount']}/>
              <Line type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={2.5} dot={{ r:4 }}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <SectionTitle>💼 Salary Status Summary</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { label:'Pending', count:salaries.filter(s=>s.status==='pending').length, color:'var(--amber)' },
              { label:'Confirmed', count:salaries.filter(s=>s.status==='confirmed').length, color:'var(--cyan)' },
              { label:'Signed', count:salaries.filter(s=>s.status==='signed').length, color:'var(--green)' },
            ].map(s=>(
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', background:'var(--bg3)', borderRadius:10 }}>
                <div style={{ width:10, height:10, borderRadius:3, background:s.color, flexShrink:0 }}/>
                <span style={{ fontSize:14, flex:1, fontWeight:600 }}>{s.label}</span>
                <span style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:'var(--mono)' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card style={{ padding:0, marginBottom:'1.5rem' }}>
        <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:700, color:'var(--primary)' }}>
          💳 Recent Transactions (Newest First)
        </div>
        <Table
          headers={['Date','Description','Type','Amount']}
          rows={recentTxns.map(t=>[
            <span style={{ fontSize:12, color:'var(--text3)', fontFamily:'var(--mono)' }}>{t.date}</span>,
            <span style={{ fontSize:13 }}>{t.description}</span>,
            <span style={{ fontSize:12, padding:'3px 10px', borderRadius:8, background:'var(--bg3)', fontWeight:600 }}>{t.type}</span>,
            <span style={{ fontFamily:'var(--mono)', fontWeight:700, fontSize:14, color:t.amount<0?'var(--red)':t.type==='refund'?'var(--green)':'var(--text)' }}>
              {t.amount<0?'-':''}{FMT_RWF(Math.abs(t.amount))}
            </span>
          ])}
        />
      </Card>

      <div style={{ display:'flex', gap:10 }}>
        <Btn variant="primary" onClick={()=>navigate('/salary')}>Manage Salaries</Btn>
        <Btn variant="ghost" onClick={()=>navigate('/payments')}>View Payments</Btn>
        <Btn variant="ghost" onClick={()=>navigate('/requisitions')}>Requisitions</Btn>
      </div>
    </div>
  );
}
