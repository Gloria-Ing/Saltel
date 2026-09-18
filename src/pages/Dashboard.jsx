import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { USERS, DEPARTMENTS, SITES, ROLE_CONFIG, FMT_RWF, SCORE_COLOR, CHART_DATA } from '../data/mockData';
import { Card, StatCard, PageHeader, Badge, SectionTitle, Avatar, ScoreRing, EmptyState } from '../components/UI';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { currentUser, tasks, reports, payments, salaries, requisitions, leaveRequests, users, performance, announcements } = useApp();
  const navigate = useNavigate();
  const role = currentUser?.role;

  // v10: sorted newest first
  const myTasks = [...tasks].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).filter(t => {
    if (role==='technician')  return (t.technician_ids||[]).includes(currentUser.id);
    if (role==='team_leader') return t.leader_id===currentUser.id;
    if (role==='hod')         return t.hod_id===currentUser.id;
    return true;
  });

  const myReports = [...reports].sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)).filter(r => {
    if (role==='technician') return r.technician_id===currentUser.id;
    if (role==='team_leader') { const t=tasks.find(x=>x.id===r.task_id); return t?.leader_id===currentUser.id; }
    if (role==='hod') { const t=tasks.find(x=>x.id===r.task_id); return t?.hod_id===currentUser.id; }
    return true;
  });

  const myPayments = [...payments].sort((a,b)=>new Date(b.paid_at||0)-new Date(a.paid_at||0)).filter(p => {
    if (role==='technician') return p.technician_id===currentUser.id;
    return true;
  });

  const myAnnouncements = [...announcements].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).filter(a => {
    if (a.target==='all') return true;
    if (a.target===role) return !a.target_dept||a.target_dept===currentUser?.dept;
    return false;
  });

  const tasksDone  = myTasks.filter(t=>t.workflow_stage==='completed').length;
  const tasksPending = myTasks.filter(t=>t.workflow_stage!=='completed').length;
  const avgScore   = myReports.length ? Math.round(myReports.reduce((s,r)=>s+(r.score||75),0)/myReports.length) : 0;
  const totalPaid  = myPayments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.total,0);
  const totalPending = myPayments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.total,0);

  const DEPT_PIE = DEPARTMENTS.map(d => ({
    name: d.id,
    value: tasks.filter(t=>t.dept===d.id&&t.workflow_stage==='technicians_assigned').length,
  }));
  const PIE_COLORS = ['#4F46E5','#10B981','#8B5CF6'];

  const today = new Date().toDateString();
  const todayReports = reports.filter(r=>new Date(r.submitted_at).toDateString()===today);
  const pendingRequisitions = requisitions.filter(r=>['tl_pending','tl_approved'].includes(r.status)).length;
  const pendingLeave = leaveRequests.filter(r=>r.status==='pending').length;

  // CEO / DAF overview
  if (role==='ceo') {
    return (
      <div>
        <PageHeader title={<span><i className="bi bi-person-fill-check me-2" style={{ color:'#169BD5' }} /> Welcome, {currentUser.name.split(' ')[0]}</span>} subtitle={<span><span className="saltel-brand" style={{ fontSize:13 }}>SALTEL</span> FOMS v13 · {new Date().toLocaleDateString('en-RW',{weekday:'long',day:'numeric',month:'long'})}</span>}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
          <StatCard label="Total Tasks" value={tasks.length} sub={`${tasksDone} completed, ${tasks.filter(t=>t.priority==='urgent').length} urgent`} color="var(--primary)" icon={<i className="bi bi-check2-square" />} onClick={()=>navigate('/tasks')}/>
          <StatCard label="Active Field Ops" value={tasks.filter(t=>t.workflow_stage==='technicians_assigned').length} sub="Technicians deployed" color="var(--green)" icon={<i className="bi bi-globe" />} onClick={()=>navigate('/working-plan')}/>
          <StatCard label="Today's Reports" value={todayReports.length} sub={`${todayReports.filter(r=>r.status==='approved').length} approved`} color="var(--cyan)" icon={<i className="bi bi-file-earmark-text-fill" />} onClick={()=>navigate('/reports')}/>
          <StatCard label="Pending Actions" value={tasks.filter(t=>t.workflow_stage==='ceo_created').length} sub="Tasks awaiting HoU" color="var(--amber)" icon={<i className="bi bi-lightning-charge-fill" />}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
          <StatCard label="Total Payroll Pending" value={FMT_RWF(payments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.total,0))} color="var(--red)" icon={<i className="bi bi-credit-card-fill" />} onClick={()=>navigate('/payments')}/>
          <StatCard label="Pending Requisitions" value={pendingRequisitions} sub="Awaiting review" color="var(--purple)" icon={<i className="bi bi-receipt-cutoff" />} onClick={()=>navigate('/requisitions')}/>
          <StatCard label="Leave Requests" value={pendingLeave} sub="Awaiting approval" color="var(--teal)" icon={<i className="bi bi-calendar-event-fill" />} onClick={()=>navigate('/leave')}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
          <Card>
            <SectionTitle><i className="bi bi-bar-chart-fill me-2" /> Monthly Task Completion</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={CHART_DATA.monthly_tasks}>
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                <Bar dataKey="completed" fill="#169BD5" radius={[4,4,0,0]}/>
                <Bar dataKey="pending" fill="#F59E0B" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionTitle><i className="bi bi-building-fill me-2" /> Active Tasks by Unit</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={DEPT_PIE} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {DEPT_PIE.map((entry,i)=><Cell key={i} fill={PIE_COLORS[i%3]}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display:'flex', justifyContent:'center', gap:'1rem', marginTop:8 }}>
              {DEPT_PIE.map((d,i)=>(
                <div key={d.name} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:PIE_COLORS[i] }}/>
                  <span style={{ color:'var(--text3)' }}>{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
          <Card>
            <SectionTitle><i className="bi bi-exclamation-triangle-fill me-2 text-danger" /> Tasks Needing Attention</SectionTitle>
            {tasks.filter(t=>t.workflow_stage!=='completed').slice(0,5).map(t=>{
              const site=SITES.find(s=>s.id===t.site_id);
              return (
                <div key={t.id} onClick={()=>navigate('/tasks')} style={{ padding:'12px 14px', borderRadius:10, background:'var(--bg3)', marginBottom:8, cursor:'pointer' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div><div style={{ fontSize:13, fontWeight:700 }}>{t.title}</div><div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}><i className="bi bi-geo-alt-fill me-1" /> {site?.name} · {t.dept}</div></div>
                    <Badge status={t.workflow_stage}/>
                  </div>
                </div>
              );
            })}
          </Card>
          <Card>
            <SectionTitle><i className="bi bi-people-fill me-2" /> Top Performers</SectionTitle>
            {performance.slice(0,5).map((p,i)=>{
              const u=users.find(x=>x.id===p.user_id);
              return (
                <div key={p.user_id} style={{ display:'flex', alignItems:'center', gap:12, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:14, fontWeight:700, color:'var(--text3)', width:20 }}>#{i+1}</span>
                  <Avatar initials={u?.avatar||'?'} size={34}/>
                  <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{u?.name}</div><div style={{ fontSize:11, color:'var(--text3)' }}>{u?.dept} · {u?.role}</div></div>
                  <ScoreRing score={p.score} size={40}/>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    );
  }

  // DAF view
  if (role==='daf') {
    const pendingSalaries = salaries.filter(s=>s.status==='pending').length;
    return (
      <div>
        <PageHeader title={<span><i className="bi bi-cash-coin me-2" style={{ color:'#169BD5' }} /> DAF Overview</span>} subtitle="Director of Administration & Finance Dashboard"/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
          <StatCard label="Pending Salary Confirmations" value={pendingSalaries} color="var(--amber)" icon={<i className="bi bi-wallet2" />} onClick={()=>navigate('/salary')}/>
          <StatCard label="Pending Payments" value={FMT_RWF(payments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.total,0))} color="var(--red)" icon={<i className="bi bi-credit-card-fill" />} onClick={()=>navigate('/payments')}/>
          <StatCard label="Open Disputes" value={payments.filter(p=>p.disputed&&p.dispute_status==='open').length} color="var(--purple)" icon={<i className="bi bi-exclamation-octagon-fill" />}/>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
          <Card>
            <SectionTitle><i className="bi bi-graph-up-arrow me-2" /> Monthly Expenditure</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={CHART_DATA.monthly_spend}>
                <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} formatter={v=>[FMT_RWF(v),'Amount']}/>
                <Line type="monotone" dataKey="amount" stroke="#169BD5" strokeWidth={2} dot={{ r:3 }}/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <SectionTitle><i className="bi bi-credit-card-fill me-2" /> Pending Payments by Unit</SectionTitle>
            {DEPARTMENTS.map(d=>{
              const dPayments=payments.filter(p=>tasks.find(t=>t.id===p.task_id)?.dept===d.id&&p.status==='pending');
              return (
                <div key={d.id} style={{ display:'flex', justifyContent:'space-between', padding:'11px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
                  <span style={{ fontWeight:600 }}>{d.label}</span>
                  <span style={{ fontWeight:700, fontFamily:'var(--mono)', color:'var(--amber-d)' }}>{FMT_RWF(dPayments.reduce((s,p)=>s+p.total,0))}</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    );
  }

  // Technician view
  if (role==='technician') {
    const myActiveTask = myTasks.find(t=>t.workflow_stage==='technicians_assigned');
    const myScore = performance.find(p=>p.user_id===currentUser.id);
    const myPay = myPayments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.total,0);
    return (
      <div>
        <PageHeader title={<span><i className="bi bi-speedometer2 me-2" style={{ color:'#169BD5' }} /> My Dashboard</span>} subtitle={`${currentUser.name} · ${currentUser.dept} Technician`}/>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
          <StatCard label="My Tasks" value={myTasks.length} sub={`${tasksDone} completed`} color="var(--primary)" icon={<i className="bi bi-check2-square" />} onClick={()=>navigate('/tasks')}/>
          <StatCard label="My Reports" value={myReports.length} sub={`${myReports.filter(r=>r.status==='approved').length} approved`} color="var(--green)" icon={<i className="bi bi-file-earmark-text-fill" />} onClick={()=>navigate('/reports')}/>
          <StatCard label="My Score" value={avgScore||'—'} sub="Performance average" color={SCORE_COLOR(avgScore||75)} icon={<i className="bi bi-star-fill" />}/>
          <StatCard label="Pending Pay" value={FMT_RWF(myPay)} sub="Awaiting payment" color="var(--amber)" icon={<i className="bi bi-credit-card-fill" />} onClick={()=>navigate('/payments')}/>
        </div>
        {myActiveTask && (
          <Card style={{ borderLeft:'4px solid var(--primary)', marginBottom:'1.5rem', cursor:'pointer' }} onClick={()=>navigate('/tasks')}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:12, color:'var(--primary)', fontWeight:700, letterSpacing:1, marginBottom:4 }}>ACTIVE DEPLOYMENT</div>
                <div style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>{myActiveTask.title}</div>
                <div style={{ fontSize:13, color:'var(--text3)' }}><i className="bi bi-geo-alt-fill me-1" /> {SITES.find(s=>s.id===myActiveTask.site_id)?.name} · {myActiveTask.start_date} – {myActiveTask.end_date}</div>
              </div>
              <Badge status={myActiveTask.workflow_stage}/>
            </div>
          </Card>
        )}
        {myAnnouncements.length>0 && (
          <Card>
            <SectionTitle><i className="bi bi-megaphone-fill me-2" /> Announcements</SectionTitle>
            {myAnnouncements.slice(0,3).map(a=>(
              <div key={a.id} style={{ padding:'12px 14px', background:'var(--bg3)', borderRadius:10, marginBottom:8 }}>
                <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>{a.pinned?<i className="bi bi-pin-angle-fill me-1 text-primary" />:''}{a.title}</div>
                <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>{a.body}</div>
              </div>
            ))}
          </Card>
        )}
      </div>
    );
  }

  // HoU / Team Leader view
  const myPerf = performance.filter(p => {
    if (role==='hod') return users.find(u=>u.id===p.user_id)?.dept===currentUser.dept;
    if (role==='team_leader') return p.user_id!==currentUser.id&&users.find(u=>u.id===p.user_id)?.dept===currentUser.dept;
    return false;
  });

  return (
    <div>
      <PageHeader title={<span><i className="bi bi-bar-chart-line-fill me-2" style={{ color:'#169BD5' }} /> {role==='hod'?'Unit':'Team'} Dashboard</span>} subtitle={`${currentUser.dept} ${role==='hod'?'Supervisor':'Leader'} · ${new Date().toLocaleDateString('en-RW',{weekday:'long',day:'numeric',month:'long'})}`}/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="Unit Tasks" value={myTasks.length} sub={`${tasksDone} completed`} color="var(--primary)" icon={<i className="bi bi-check2-square" />} onClick={()=>navigate('/tasks')}/>
        <StatCard label="Active Ops" value={myTasks.filter(t=>t.workflow_stage==='technicians_assigned').length} color="var(--green)" icon={<i className="bi bi-globe" />} onClick={()=>navigate('/working-plan')}/>
        <StatCard label="Today's Reports" value={todayReports.length} sub={`${todayReports.filter(r=>r.status==='approved').length} approved`} color="var(--cyan)" icon={<i className="bi bi-file-earmark-text-fill" />} onClick={()=>navigate('/reports')}/>
        <StatCard label={role==='hod'?'Pending Requisitions':'Pending Leave'} value={role==='hod'?pendingRequisitions:pendingLeave} color="var(--amber)" icon={role==='hod'?<i className="bi bi-receipt-cutoff" />:<i className="bi bi-calendar-event-fill" />} onClick={()=>navigate(role==='hod'?'/requisitions':'/leave')}/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        <Card>
          <SectionTitle><i className="bi bi-file-earmark-text-fill me-2" /> Recent Tasks</SectionTitle>
          {myTasks.slice(0,4).length===0 ? <EmptyState icon={<i className="bi bi-file-earmark-text" style={{ fontSize:36 }} />} title="No tasks yet"/> : myTasks.slice(0,4).map(t=>{
            const site=SITES.find(s=>s.id===t.site_id);
            return (
              <div key={t.id} onClick={()=>navigate('/tasks')} style={{ padding:'11px 12px', borderRadius:10, background:'var(--bg3)', marginBottom:8, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div><div style={{ fontSize:13, fontWeight:700 }}>{t.title}</div><div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}><i className="bi bi-geo-alt-fill me-1" /> {site?.name}</div></div>
                <Badge status={t.workflow_stage}/>
              </div>
            );
          })}
        </Card>
        <Card>
          <SectionTitle><i className="bi bi-star-fill me-2" /> Team Performance</SectionTitle>
          {myPerf.length===0 ? <EmptyState icon={<i className="bi bi-graph-up-arrow" style={{ fontSize: 36, color: 'var(--text3)' }} />} title="No performance data"/> : myPerf.slice(0,5).map((p,i)=>{
            const u=users.find(x=>x.id===p.user_id);
            return (
              <div key={p.user_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <Avatar initials={u?.avatar||'?'} size={32}/>
                <div style={{ flex:1 }}><div style={{ fontSize:13, fontWeight:600 }}>{u?.name}</div></div>
                <ScoreRing score={p.score} size={36}/>
              </div>
            );
          })}
        </Card>
      </div>
    </div>
  );
}
