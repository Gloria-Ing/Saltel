import { useApp } from '../contexts/AppContext';
import { USERS, ROLE_CONFIG, SCORE_COLOR } from '../data/mockData';
import { Card, PageHeader, SectionTitle, ScoreRing, Avatar, StatCard, EmptyState } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';

export default function PerformancePage() {
  const { currentUser, performance, users, tasks, reports } = useApp();
  const role = currentUser?.role;

  // v10: Sort by score descending (best first)
  const sorted = [...performance].sort((a,b)=>b.score-a.score).filter(p => {
    if (role=== 'unit_leader') return users.find(u=>u.id===p.user_id)?.dept===currentUser.dept;
    if (role=== 'regional_coordinator') return users.find(u=>u.id===p.user_id)?.dept===currentUser.dept;
    if (role==='technician') return p.user_id===currentUser.id;
    return true;
  });

  const myPerf = performance.find(p=>p.user_id===currentUser.id);
  const myReports = reports.filter(r=>r.technician_id===currentUser.id);
  const avgScore = myReports.length ? Math.round(myReports.reduce((s,r)=>s+(r.score||75),0)/myReports.length) : 0;

  const DEPT_AVERAGES = ['LAN','Fiber','CCTV'].map(dept => {
    const deptPerf = performance.filter(p=>users.find(u=>u.id===p.user_id)?.dept===dept);
    const avg = deptPerf.length ? Math.round(deptPerf.reduce((s,p)=>s+p.score,0)/deptPerf.length) : 0;
    return { dept, avg, count:deptPerf.length };
  });

  const radarData = myPerf ? [
    { subject:'On-Time Reports', A: myReports.filter(r=>!r.late_flagged).length/(myReports.length||1)*100 },
    { subject:'Avg Score',       A: avgScore },
    { subject:'Tasks Done',      A: (myPerf.tasks_done||0)*10 },
    { subject:'Approvals',       A: myReports.filter(r=>r.status==='approved').length/(myReports.length||1)*100 },
    { subject:'Feedback',        A: myReports.reduce((s,r)=>s+(r.feedbacks||[]).length,0)*20 },
  ] : [];

  return (
    <div>
      <PageHeader title="📈 Performance" subtitle="Score tracking, rankings, and field analytics"/>

      {role==='technician' && myPerf && (
        <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'1.5rem', marginBottom:'2rem' }}>
          <Card style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'1rem', minWidth:200 }}>
            <ScoreRing score={avgScore||75} size={100}/>
            <div style={{ fontSize:13, color:'var(--text3)', fontWeight:600, textAlign:'center' }}>My Performance Score</div>
            <div style={{ fontSize:12, color:'var(--text2)' }}>{myReports.length} reports submitted</div>
          </Card>
          {radarData.length>0&&(
            <Card>
              <SectionTitle>Performance Radar</SectionTitle>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border)"/>
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize:11, fill:'var(--text3)' }}/>
                  <Radar dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.18}/>
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {['ceo','regional_coordinator','daf'].includes(role) && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
          {DEPT_AVERAGES.map(d=>(
            <Card key={d.dept} style={{ textAlign:'center' }}>
              <div style={{ fontSize:12, color:'var(--text3)', fontWeight:700, marginBottom:4 }}>{d.dept} Unit Avg</div>
              <div style={{ fontSize:28, fontWeight:800, color:SCORE_COLOR(d.avg), fontFamily:'var(--mono)' }}>{d.avg}</div>
              <div style={{ fontSize:12, color:'var(--text3)' }}>{d.count} staff</div>
            </Card>
          ))}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:['ceo','regional_coordinator'].includes(role)?'1.5fr 1fr':'1fr', gap:'1.5rem' }}>
        <Card>
          <SectionTitle>🏆 Performance Rankings</SectionTitle>
          {sorted.length===0 ? <EmptyState icon="📈" title="No data"/> : sorted.map((p,i)=>{
            const u = users.find(x=>x.id===p.user_id);
            const rc = ROLE_CONFIG[u?.role];
            const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':'';
            return (
              <div key={p.user_id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ fontSize:i<3?18:14, width:28, textAlign:'center', fontWeight:700, color:'var(--text3)' }}>{medal||`#${i+1}`}</span>
                <Avatar initials={u?.avatar||'?'} size={38} src={u?.profile_pic}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700 }}>{u?.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{u?.dept} · {rc?.label||u?.role}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>
                    {p.tasks_done} tasks done · {p.on_time} on-time
                    {p.trend!==undefined && <span style={{ color:p.trend>0?'var(--green)':'var(--red)', marginLeft:8 }}>{p.trend>0?'↑':'↓'}{Math.abs(p.trend)}%</span>}
                  </div>
                </div>
                <ScoreRing score={p.score} size={52}/>
              </div>
            );
          })}
        </Card>
        {['ceo','regional_coordinator'].includes(role) && (
          <Card>
            <SectionTitle>📊 Score Distribution</SectionTitle>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={sorted.map(p=>({ name:users.find(u=>u.id===p.user_id)?.name?.split(' ')[0]||'?', score:p.score }))} layout="vertical">
                <XAxis type="number" domain={[0,100]} tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false}/>
                <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'var(--text3)' }} axisLine={false} tickLine={false} width={60}/>
                <Tooltip contentStyle={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
                <Bar dataKey="score" radius={[0,4,4,0]} fill="var(--primary)"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}
