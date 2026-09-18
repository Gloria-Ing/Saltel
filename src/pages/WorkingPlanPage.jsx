import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { SITES, USERS } from '../data/mockData';
import { Card, PageHeader, Badge, EmptyState } from '../components/UI';

const TODAY = new Date().toISOString().split('T')[0];

const TASK_STATUS_COLOR = {
  technicians_assigned:'var(--primary)',
  supervisor_approval_pending:'#D97706',
  leader_assigned:'var(--amber)',
  hod_created:'var(--purple)',
  ceo_created:'var(--purple)',
  completed:'var(--green)',
};

export default function WorkingPlanPage() {
  const { currentUser, tasks, users, sites, checkins } = useApp();
  const role = currentUser?.role;

  const [fromDate, setFromDate] = useState('');
  const [toDate,   setToDate]   = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [techFilter, setTechFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [expandedTask, setExpandedTask] = useState(null);

  const allSites = sites || SITES;
  const activeDepts = [...new Set(tasks.map(t => t.dept).filter(Boolean))];
  const activeTechs = users.filter(u => u.role === 'technician' || u.role === 'team_leader');

  const todayTasks = tasks.filter(t => {
    if (!t.start_date || !t.end_date) return false;
    const s = new Date(t.start_date), e = new Date(t.end_date), d = new Date(TODAY);
    return d >= s && d <= e;
  });

  const counters = [
    { label:"Today's Active Tasks",  value: todayTasks.filter(t => t.workflow_stage === 'technicians_assigned').length, color:'var(--primary)' },
    { label:'Pending Assignment',    value: todayTasks.filter(t => ['ceo_created','hod_created','leader_assigned'].includes(t.workflow_stage)).length, color:'var(--amber)' },
    { label:'Total Active Tasks',    value: tasks.filter(t => t.workflow_stage === 'technicians_assigned').length, color:'var(--cyan)' },
    { label:'Completed All Time',    value: tasks.filter(t => t.workflow_stage === 'completed').length, color:'var(--green)' },
  ];

  // Working plan is PUBLIC — all roles see the full plan (no role-based hiding)
  // Technicians see all tasks (not just their own), so they can understand the full schedule
  const filtered = [...tasks].sort((a, b) => new Date(a.start_date) - new Date(b.start_date)).filter(t => {
    if (!t.start_date || !t.end_date) return false;

    // No role-based filter — working plan is public to all roles
    // Technicians excluded from supervisor_approval_pending stage tasks (not officially notified yet)
    if (role === 'technician' && t.workflow_stage === 'supervisor_approval_pending') return false;

    if (deptFilter !== 'all' && t.dept !== deptFilter) return false;
    if (stageFilter !== 'all' && t.workflow_stage !== stageFilter) return false;

    if (techFilter !== 'all') {
      const tid = Number(techFilter);
      if (!(t.technician_ids || []).includes(tid) && t.leader_id !== tid) return false;
    }

    if (fromDate || toDate) {
      const start = new Date(t.start_date);
      const end   = new Date(t.end_date);
      if (fromDate && end < new Date(fromDate)) return false;
      if (toDate   && start > new Date(toDate)) return false;
    }

    return true;
  });

  const isActiveToday = (task) => {
    if (!task.start_date || !task.end_date) return false;
    const s = new Date(task.start_date), e = new Date(task.end_date), d = new Date(TODAY);
    return d >= s && d <= e && task.workflow_stage === 'technicians_assigned';
  };

  const STAGE_LABELS = {
    all:'All Stages',
    ceo_created:'Pending Supervisor',
    hod_created:'Pending HoU',
    leader_assigned:'Pending Techs',
    supervisor_approval_pending:'Awaiting Approval',
    technicians_assigned:'In Progress',
    completed:'Completed',
  };

  return (
    <div>
      <PageHeader
        title="📅 Working Plan"
        subtitle="Field operations schedule — public view for all staff"
      />

      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {counters.map(c => (
          <Card key={c.label} style={{ textAlign:'center', padding:'14px 12px' }}>
            <div style={{ fontSize:28, fontWeight:800, color:c.color, fontFamily:'var(--mono)', marginBottom:4 }}>{c.value}</div>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, letterSpacing:'0.5px' }}>{c.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ display:'flex', gap:10, marginBottom:'1.25rem', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 14px', background:'var(--bg2)', border:'1.5px solid var(--border)', borderRadius:9 }}>
          <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>From</span>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            style={{ padding:'4px 8px', border:'1px solid var(--border)', borderRadius:7, background:'var(--bg3)', fontSize:13, color:'var(--text)' }}/>
          <span style={{ fontSize:12, color:'var(--text3)', fontWeight:600 }}>To</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            style={{ padding:'4px 8px', border:'1px solid var(--border)', borderRadius:7, background:'var(--bg3)', fontSize:13, color:'var(--text)' }}/>
          {(fromDate || toDate) && (
            <button onClick={() => { setFromDate(''); setToDate(''); }}
              style={{ fontSize:11, color:'var(--red)', cursor:'pointer', background:'none', border:'none', fontFamily:'var(--font)', fontWeight:700 }}>✕ Clear</button>
          )}
        </div>

        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
          style={{ padding:'9px 13px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14, color:'var(--text)' }}>
          <option value="all">All Units</option>
          {activeDepts.map(d => <option key={d} value={d}>{d} Unit</option>)}
        </select>

        {['ceo','hod'].includes(role) && (
          <select value={techFilter} onChange={e => setTechFilter(e.target.value)}
            style={{ padding:'9px 13px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14, color:'var(--text)' }}>
            <option value="all">All Team Members</option>
            {activeTechs.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}

        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          style={{ padding:'9px 13px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14, color:'var(--text)' }}>
          {Object.entries(STAGE_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>

        <div style={{ marginLeft:'auto', fontSize:13, color:'var(--text3)', fontWeight:600 }}>
          {filtered.length} task{filtered.length !== 1 ? 's' : ''} found
        </div>
      </div>

      {role === 'technician' && (
        <div style={{ padding:'10px 14px', background:'var(--primary-l)', border:'1px solid var(--primary)', borderRadius:9, marginBottom:'1rem', fontSize:13, color:'var(--primary)', fontWeight:600 }}>
          📢 Working plan is public — you can see the full field operations schedule. Tasks highlighted in blue are active today.
        </div>
      )}

      <Card style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1.4fr 0.9fr 1.6fr 1fr 0.9fr', gap:'0.75rem', padding:'11px 16px', background:'var(--bg3)', borderBottom:'2px solid var(--border)' }}>
          {['Task / Unit', 'Site', 'Period', 'Team & Contacts', 'Report Time', 'Status'].map(h => (
            <div key={h} style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="📅" title="No tasks found" body="Adjust your date range or filters to see tasks"/>
        ) : (
          filtered.map(task => {
            const site   = allSites.find(s => s.id === task.site_id);
            const leader = users.find(u => u.id === task.leader_id);
            const hod    = users.find(u => u.id === task.hod_id);
            const techs  = (task.technician_ids || []).map(id => users.find(u => u.id === id)).filter(Boolean);
            const color  = TASK_STATUS_COLOR[task.workflow_stage] || 'var(--primary)';
            const isToday = isActiveToday(task);
            const isExpanded = expandedTask === task.id;
            const isMyTask = role === 'technician' && (task.technician_ids||[]).includes(currentUser.id);

            // Get today's checkins for this task for current technician
            const todayStr = new Date().toDateString();
            const myCI = role==='technician' ? checkins?.find(c=>c.task_id===task.id&&c.technician_id===currentUser.id&&c.type==='checkin'&&new Date(c.timestamp).toDateString()===todayStr) : null;
            const myCO = role==='technician' ? checkins?.find(c=>c.task_id===task.id&&c.technician_id===currentUser.id&&c.type==='checkout'&&new Date(c.timestamp).toDateString()===todayStr) : null;

            return (
              <div key={task.id} style={{ borderBottom:'1px solid var(--border)', background: isMyTask ? 'rgba(79,70,229,0.06)' : isToday ? 'rgba(79,70,229,0.02)' : 'transparent' }}>
                <div
                  onClick={() => setExpandedTask(isExpanded ? null : task.id)}
                  style={{ display:'grid', gridTemplateColumns:'2fr 1.4fr 0.9fr 1.6fr 1fr 0.9fr', gap:'0.75rem', padding:'13px 16px', cursor:'pointer', alignItems:'center', transition:'background .1s', borderLeft: isMyTask ? '3px solid var(--primary)' : isToday ? '3px solid var(--cyan)' : '3px solid transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                  onMouseLeave={e => e.currentTarget.style.background = isMyTask ? 'rgba(79,70,229,0.06)' : isToday ? 'rgba(79,70,229,0.02)' : 'transparent'}
                >
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }}/>
                      <span style={{ fontWeight:700, fontSize:13 }}>{task.title}</span>
                      {task.priority === 'urgent' && <span style={{ fontSize:10, background:'var(--red-l)', color:'var(--red)', padding:'1px 6px', borderRadius:6, fontWeight:700 }}>URGENT</span>}
                      {isToday && <span style={{ fontSize:10, background:'var(--primary-l)', color:'var(--primary)', padding:'1px 6px', borderRadius:6, fontWeight:700 }}>TODAY</span>}
                      {isMyTask && <span style={{ fontSize:10, background:'var(--green-l)', color:'var(--green-d)', padding:'1px 6px', borderRadius:6, fontWeight:700 }}>MY TASK</span>}
                    </div>
                    <div style={{ fontSize:11, color:'var(--text3)', paddingLeft:14 }}>{task.dept} Unit · {task.id}</div>
                    {isMyTask && (myCI||myCO) && (
                      <div style={{ fontSize:10, paddingLeft:14, marginTop:3, color:'var(--green-d)', fontWeight:600 }}>
                        {myCI && `✓ CI: ${new Date(myCI.timestamp).toLocaleTimeString('en-RW',{hour:'2-digit',minute:'2-digit'})}`}
                        {myCO && `  ✓ CO: ${new Date(myCO.timestamp).toLocaleTimeString('en-RW',{hour:'2-digit',minute:'2-digit'})}`}
                      </div>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:500 }}>📍 {site?.name || '—'}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>{site?.province}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:11 }}>{task.start_date}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>→ {task.end_date}</div>
                  </div>
                  <div>
                    {leader && (
                      <div style={{ marginBottom:3 }}>
                        <div style={{ fontSize:11, fontWeight:600 }}>👑 {leader.name.split(' ')[0]}</div>
                        {leader.phone && <div style={{ fontSize:10, color:'var(--cyan)', fontFamily:'var(--mono)' }}>📱 {leader.phone}</div>}
                      </div>
                    )}
                    {techs.slice(0, 2).map(u => (
                      <div key={u.id} style={{ marginBottom:2 }}>
                        <div style={{ fontSize:11, color:'var(--text2)' }}>🔧 {u.name.split(' ')[0]}{task.team_leader_id===u.id?' ★':''}</div>
                        {u.phone && <div style={{ fontSize:10, color:'var(--green)', fontFamily:'var(--mono)' }}>📱 {u.phone}</div>}
                      </div>
                    ))}
                    {techs.length > 2 && <div style={{ fontSize:10, color:'var(--text3)' }}>+{techs.length - 2} more techs</div>}
                    {!leader && techs.length === 0 && <div style={{ fontSize:11, color:'var(--amber-d)', fontStyle:'italic' }}>Unassigned</div>}
                  </div>
                  <div>
                    <div style={{ fontSize:12, color:'var(--primary)', fontWeight:600 }}>⏰ {task.report_time || '—'}</div>
                    <div style={{ fontSize:10, color:'var(--text3)' }}>{task.report_schedule || 'daily'}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <Badge status={task.workflow_stage}/>
                    <span style={{ fontSize:10, color:'var(--text3)' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ padding:'14px 20px 18px', background:'var(--bg3)', borderTop:'1px solid var(--border)' }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Full Team & Phone Numbers</div>
                        {hod && (
                          <div style={{ marginBottom:8, padding:'8px 12px', background:'var(--purple-l)', borderRadius:8 }}>
                            <div style={{ fontSize:12, fontWeight:700 }}>🏢 {hod.name}</div>
                            <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>Supervisor</div>
                            {hod.phone && <div style={{ fontSize:11, color:'var(--purple)', fontFamily:'var(--mono)', fontWeight:600, marginTop:2 }}>📱 {hod.phone}</div>}
                          </div>
                        )}
                        {leader && (
                          <div style={{ marginBottom:6, padding:'8px 12px', background:'var(--cyan-l)', borderRadius:8 }}>
                            <div style={{ fontSize:12, fontWeight:700 }}>👑 {leader.name}</div>
                            <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>HoU (Leader)</div>
                            {leader.phone && <div style={{ fontSize:11, color:'var(--cyan)', fontFamily:'var(--mono)', fontWeight:600, marginTop:2 }}>📱 {leader.phone}</div>}
                          </div>
                        )}
                        {techs.map(u => (
                          <div key={u.id} style={{ marginBottom:6, padding:'8px 12px', background:'var(--green-l)', borderRadius:8 }}>
                            <div style={{ fontSize:12, fontWeight:600 }}>🔧 {u.name}{task.team_leader_id===u.id?' ★ Leader':''}</div>
                            <div style={{ fontSize:10, color:'var(--text3)', marginTop:1 }}>Technician{task.reporter_id===u.id?' · Reporter':''}</div>
                            {u.phone && <div style={{ fontSize:11, color:'var(--green)', fontFamily:'var(--mono)', fontWeight:600, marginTop:2 }}>📱 {u.phone}</div>}
                          </div>
                        ))}
                        {!leader && techs.length === 0 && <div style={{ fontSize:12, color:'var(--text3)' }}>No team assigned yet</div>}
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Description</div>
                        <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{task.description ? task.description.slice(0, 150) + (task.description.length > 150 ? '...' : '') : 'No description'}</div>
                        {site && (
                          <div style={{ marginTop:10, padding:'8px 12px', background:'var(--bg2)', borderRadius:8 }}>
                            <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', marginBottom:4 }}>SITE INFO</div>
                            <div style={{ fontSize:12 }}>📍 {site.name}</div>
                            <div style={{ fontSize:11, color:'var(--text3)' }}>{site.location} · {site.province}</div>
                            <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--mono)' }}>{site.lat.toFixed(4)}, {site.lng.toFixed(4)}</div>
                            {site.rural && <div style={{ fontSize:11, color:'var(--amber-d)', fontWeight:600, marginTop:2 }}>🏕 Rural Site</div>}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Notes</div>
                        {task.hod_notes && (
                          <div style={{ marginBottom:8, padding:'8px 12px', background:'var(--bg2)', borderRadius:8, fontSize:12 }}>
                            <span style={{ fontWeight:700, color:'var(--purple)' }}>Supervisor: </span>{task.hod_notes}
                          </div>
                        )}
                        {task.leader_notes && (
                          <div style={{ padding:'8px 12px', background:'var(--bg2)', borderRadius:8, fontSize:12 }}>
                            <span style={{ fontWeight:700, color:'var(--cyan)' }}>HoU: </span>{task.leader_notes}
                          </div>
                        )}
                        {!task.hod_notes && !task.leader_notes && <div style={{ fontSize:12, color:'var(--text3)' }}>No notes</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
