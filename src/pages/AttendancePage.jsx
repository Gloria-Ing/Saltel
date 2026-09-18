import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS, SITES, DEPARTMENTS } from '../data/mockData';
import { Card, PageHeader, EmptyState, Avatar, Table, Btn, SectionTitle } from '../components/UI';

const FMT_TIME = (ts) => ts ? new Date(ts).toLocaleTimeString('en-RW',{hour:'2-digit',minute:'2-digit',hour12:false}) : '—';
const FMT_DATE = (ts) => ts ? new Date(ts).toLocaleDateString('en-RW',{day:'2-digit',month:'short',year:'numeric'}) : '—';
const FMT_FULL = (ts) => ts ? new Date(ts).toLocaleString('en-RW',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}) : '—';
const DURATION = (ci, co) => {
  if (!ci || !co) return '—';
  const mins = Math.round((new Date(co) - new Date(ci)) / 60000);
  if (mins < 0) return '—';
  const h = Math.floor(mins/60), m = mins%60;
  return `${h}h ${m}m`;
};

export default function AttendancePage() {
  const { currentUser, checkins, tasks, users, sites } = useApp();
  const role = currentUser?.role;
  const allSites = sites || SITES;

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo,   setDateTo]   = useState('');
  const [unitFilter, setUnitFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [siteFilter, setSiteFilter] = useState('all');
  const [taskFilter, setTaskFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode,  setViewMode]  = useState('summary'); // 'summary' | 'records'

  // ── Filter checkins by role visibility ───────────────────────────────────
  const visible = checkins.filter(c => {
    const task = tasks.find(t => t.id === c.task_id);
    if (role === 'technician') return c.technician_id === currentUser.id;
    if (role === 'team_leader') return task?.leader_id === currentUser.id || task?.dept === currentUser.dept;
    if (role === 'hod') return task?.hod_id === currentUser.id || task?.dept === currentUser.dept;
    return true; // CEO, DAF, accountant see all
  });

  const filtered = visible.filter(c => {
    const task = tasks.find(t => t.id === c.task_id);
    const tech = users.find(u => u.id === c.technician_id);
    const site = allSites.find(s => s.id === task?.site_id);

    if (typeFilter !== 'all' && c.type !== typeFilter) return false;
    if (unitFilter !== 'all' && task?.dept !== unitFilter) return false;
    if (userFilter !== 'all' && String(c.technician_id) !== userFilter) return false;
    if (siteFilter !== 'all' && String(task?.site_id) !== siteFilter) return false;
    if (taskFilter !== 'all' && c.task_id !== taskFilter) return false;
    if (dateFrom && new Date(c.timestamp) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(c.timestamp) > new Date(dateTo + 'T23:59:59')) return false;
    return true;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // ── Build summary: pair check-ins with check-outs ─────────────────────────
  const buildSummary = () => {
    const ciList = filtered.filter(c => c.type === 'checkin');
    return ciList.map(ci => {
      const co = filtered.find(c =>
        c.type === 'checkout' &&
        c.technician_id === ci.technician_id &&
        c.task_id === ci.task_id &&
        new Date(c.timestamp).toDateString() === new Date(ci.timestamp).toDateString()
      );
      const tech = users.find(u => u.id === ci.technician_id);
      const task = tasks.find(t => t.id === ci.task_id);
      const site = allSites.find(s => s.id === task?.site_id);
      return { ci, co, tech, task, site };
    });
  };
  const summary = buildSummary();

  // ── Stats ────────────────────────────────────────────────────────────────
  const today = new Date().toDateString();
  const todayCI = visible.filter(c => c.type === 'checkin' && new Date(c.timestamp).toDateString() === today);
  const todayCO = visible.filter(c => c.type === 'checkout' && new Date(c.timestamp).toDateString() === today);
  const uniqueToday = [...new Set(todayCI.map(c => c.technician_id))];

  const activeDepts = role === 'ceo' || role === 'daf'
    ? DEPARTMENTS
    : DEPARTMENTS.filter(d => d.id === currentUser?.dept);

  const visibleUsers = role === 'technician'
    ? [currentUser]
    : users.filter(u => ['technician','team_leader'].includes(u.role) &&
        (role === 'hod' || role === 'team_leader' ? u.dept === currentUser.dept : true));

  const visibleTasks = role === 'technician'
    ? tasks.filter(t => (t.technician_ids||[]).includes(currentUser.id))
    : tasks.filter(t => role === 'hod' ? t.dept === currentUser.dept : true);

  return (
    <div style={{ fontFamily:'var(--font)' }}>
      <PageHeader
        title="📍 Attendance"
        subtitle={
          role === 'ceo'
            ? 'GPS-verified field attendance across all units'
            : role === 'hod'
            ? `GPS attendance for your unit — ${currentUser.dept}`
            : role === 'technician'
            ? 'Your personal GPS check-in/out records'
            : 'Field attendance records'
        }
      />

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      <div className="resp-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { label:"Today's Check-ins", value:todayCI.length, color:'var(--green)',   icon:'▶' },
          { label:"Today's Check-outs", value:todayCO.length, color:'var(--red)',    icon:'◼' },
          { label:'Staff On Site Today', value:uniqueToday.length, color:'var(--primary)', icon:'👷' },
          { label:'Total Records',       value:visible.length, color:'var(--cyan)',  icon:'📋' },
        ].map(s=>(
          <Card key={s.label} style={{ textAlign:'center', padding:'14px 10px' }}>
            <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>{s.label}</div>
            <div style={{ fontSize:28, fontWeight:800, color:s.color, fontFamily:'var(--mono)' }}>{s.value}</div>
            <div style={{ fontSize:18, marginTop:4 }}>{s.icon}</div>
          </Card>
        ))}
      </div>

      {/* ── Unit summary cards (CEO + Supervisor) ────────────────────────────── */}
      {['ceo','hod'].includes(role) && (
        <div style={{ marginBottom:'1.5rem' }}>
          <SectionTitle>{role === 'ceo' ? 'Attendance by Unit (Today)' : 'Unit Attendance (Today)'}</SectionTitle>
          <div className="resp-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
            {activeDepts.map(dept => {
              const deptUsers = users.filter(u => u.dept === dept.id && ['technician','team_leader'].includes(u.role));
              const deptCI = todayCI.filter(c => {
                const task = tasks.find(t => t.id === c.task_id);
                return task?.dept === dept.id;
              });
              const present = [...new Set(deptCI.map(c => c.technician_id))].length;
              const pct = deptUsers.length > 0 ? Math.round((present / deptUsers.length) * 100) : 0;
              return (
                <Card key={dept.id} style={{ padding:'14px 16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                    <div>
                      <div style={{ fontSize:14, fontWeight:700 }}>{dept.label}</div>
                      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{deptUsers.length} staff total</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontSize:22, fontWeight:800, color:'var(--primary)', fontFamily:'var(--mono)' }}>{pct}%</div>
                      <div style={{ fontSize:10, color:'var(--text3)' }}>present</div>
                    </div>
                  </div>
                  <div style={{ height:6, background:'var(--bg3)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${pct}%`, background:pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)', borderRadius:4, transition:'width .4s' }}/>
                  </div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:6 }}>{present} checked in · {deptUsers.length - present} absent</div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Technician own summary ────────────────────────────────────────────── */}
      {role === 'technician' && (
        <div style={{ marginBottom:'1.5rem' }}>
          <SectionTitle>My Attendance Today</SectionTitle>
          {tasks.filter(t=>(t.technician_ids||[]).includes(currentUser.id)&&t.workflow_stage==='technicians_assigned').map(task => {
            const site = allSites.find(s => s.id === task.site_id);
            const ci = todayCI.find(c => c.task_id === task.id && c.technician_id === currentUser.id);
            const co = todayCO.find(c => c.task_id === task.id && c.technician_id === currentUser.id);
            return (
              <Card key={task.id} style={{ marginBottom:8, borderLeft:`4px solid ${ci?co?'var(--green)':'var(--amber)':'var(--border2)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
                  <div>
                    <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{task.title}</div>
                    <div style={{ fontSize:12, color:'var(--text3)' }}>📍 {site?.name} · {task.dept} Unit</div>
                  </div>
                  <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                    {ci ? (
                      <div style={{ padding:'8px 14px', background:'var(--green-l)', borderRadius:10, border:'1px solid var(--green)', minWidth:160 }}>
                        <div style={{ fontSize:10, color:'var(--green-d)', fontWeight:700, marginBottom:3 }}>▶ CHECKED IN</div>
                        <div style={{ fontSize:14, fontWeight:800, color:'var(--green-d)', fontFamily:'var(--mono)' }}>{FMT_TIME(ci.timestamp)}</div>
                        <div style={{ fontSize:10, color:'var(--green-d)', marginTop:3, fontFamily:'var(--mono)', lineHeight:1.4 }}>📍 {ci.address}</div>
                      </div>
                    ) : (
                      <div style={{ padding:'8px 14px', background:'var(--bg3)', borderRadius:10, border:'1px solid var(--border)', minWidth:160 }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, marginBottom:3 }}>▶ NOT CHECKED IN</div>
                        <div style={{ fontSize:12, color:'var(--text3)' }}>Go to Tasks to check in</div>
                      </div>
                    )}
                    {co ? (
                      <div style={{ padding:'8px 14px', background:'var(--red-l)', borderRadius:10, border:'1px solid var(--red)', minWidth:160 }}>
                        <div style={{ fontSize:10, color:'var(--red-d)', fontWeight:700, marginBottom:3 }}>◼ CHECKED OUT</div>
                        <div style={{ fontSize:14, fontWeight:800, color:'var(--red-d)', fontFamily:'var(--mono)' }}>{FMT_TIME(co.timestamp)}</div>
                        <div style={{ fontSize:10, color:'var(--red-d)', marginTop:3, fontFamily:'var(--mono)', lineHeight:1.4 }}>📍 {co.address}</div>
                      </div>
                    ) : ci ? (
                      <div style={{ padding:'8px 14px', background:'var(--amber-l)', borderRadius:10, border:'1px solid var(--amber)', minWidth:160 }}>
                        <div style={{ fontSize:10, color:'var(--amber-d)', fontWeight:700, marginBottom:3 }}>◼ STILL ON SITE</div>
                        <div style={{ fontSize:12, color:'var(--amber-d)' }}>Check out when done</div>
                        <div style={{ fontSize:10, color:'var(--amber-d)', marginTop:3 }}>Duration so far: {DURATION(ci.timestamp, new Date().toISOString())}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
                {ci && co && (
                  <div style={{ marginTop:10, padding:'6px 12px', background:'var(--bg3)', borderRadius:8, display:'inline-flex', gap:16, fontSize:12 }}>
                    <span>⏱ On-site duration: <strong style={{ color:'var(--primary)', fontFamily:'var(--mono)' }}>{DURATION(ci.timestamp, co.timestamp)}</strong></span>
                    <span style={{ color:'var(--text3)' }}>Date: {FMT_DATE(ci.timestamp)}</span>
                  </div>
                )}
              </Card>
            );
          })}
          {tasks.filter(t=>(t.technician_ids||[]).includes(currentUser.id)&&t.workflow_stage==='technicians_assigned').length === 0 && (
            <Card style={{ textAlign:'center', padding:'2rem', color:'var(--text3)', fontSize:14 }}>
              No active tasks assigned to you today.
            </Card>
          )}
        </div>
      )}

      {/* ── Filters ──────────────────────────────────────────────────────────── */}
      {role !== 'technician' && (
        <div style={{ display:'flex', gap:8, marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
          {/* View mode toggle */}
          <div style={{ display:'flex', gap:2, padding:'4px', background:'var(--bg3)', borderRadius:10, border:'1.5px solid var(--border)' }}>
            {[['summary','👤 Summary'],['records','📋 All Records']].map(([v,l])=>(
              <button key={v} onClick={()=>setViewMode(v)} style={{ padding:'7px 14px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', border:'none', background:viewMode===v?'var(--primary)':'transparent', color:viewMode===v?'#fff':'var(--text3)', fontFamily:'var(--font)', transition:'all .15s' }}>{l}</button>
            ))}
          </div>

          {/* Date range */}
          <div style={{ display:'flex', gap:6, alignItems:'center', padding:'6px 12px', background:'var(--bg2)', border:'1.5px solid var(--border)', borderRadius:9 }}>
            <span style={{ fontSize:11, color:'var(--text3)', fontWeight:600 }}>From</span>
            <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} style={{ padding:'4px 8px', border:'1px solid var(--border)', borderRadius:6, background:'var(--bg3)', fontSize:12, color:'var(--text)' }}/>
            <span style={{ fontSize:11, color:'var(--text3)', fontWeight:600 }}>To</span>
            <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} style={{ padding:'4px 8px', border:'1px solid var(--border)', borderRadius:6, background:'var(--bg3)', fontSize:12, color:'var(--text)' }}/>
            {(dateFrom||dateTo) && <button onClick={()=>{setDateFrom('');setDateTo('');}} style={{ fontSize:10, color:'var(--red)', background:'none', border:'none', cursor:'pointer', fontWeight:700 }}>✕</button>}
          </div>

          {/* Type filter */}
          <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} style={{ padding:'8px 12px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:13, color:'var(--text)' }}>
            <option value="all">All Types</option>
            <option value="checkin">Check-in Only</option>
            <option value="checkout">Check-out Only</option>
          </select>

          {/* Unit filter (CEO only) */}
          {role === 'ceo' && (
            <select value={unitFilter} onChange={e=>setUnitFilter(e.target.value)} style={{ padding:'8px 12px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:13, color:'var(--text)' }}>
              <option value="all">All Units</option>
              {DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          )}

          {/* Staff filter */}
          <select value={userFilter} onChange={e=>setUserFilter(e.target.value)} style={{ padding:'8px 12px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:13, color:'var(--text)', maxWidth:200 }}>
            <option value="all">All Staff</option>
            {visibleUsers.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
          </select>

          {/* Site filter */}
          <select value={siteFilter} onChange={e=>setSiteFilter(e.target.value)} style={{ padding:'8px 12px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:13, color:'var(--text)', maxWidth:200 }}>
            <option value="all">All Sites</option>
            {allSites.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          {/* Task filter */}
          <select value={taskFilter} onChange={e=>setTaskFilter(e.target.value)} style={{ padding:'8px 12px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:13, color:'var(--text)', maxWidth:220 }}>
            <option value="all">All Tasks</option>
            {visibleTasks.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}
          </select>

          <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text3)', fontWeight:600 }}>
            {filtered.length} records
          </div>
        </div>
      )}

      {/* ── Summary view: grouped by person ──────────────────────────────────── */}
      {(viewMode === 'summary' && role !== 'technician') && (
        <div>
          {summary.length === 0 ? (
            <EmptyState icon="📍" title="No attendance records" body="GPS check-in records will appear here"/>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {summary.map(({ ci, co, tech, task, site }, idx) => (
                <Card key={idx} style={{ borderLeft:`4px solid ${co ? 'var(--green)' : 'var(--amber)'}` }}>
                  <div className="resp-flex" style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
                    {/* Technician */}
                    <div style={{ display:'flex', gap:10, alignItems:'center', minWidth:200 }}>
                      <Avatar initials={tech?.avatar||'?'} color="var(--primary)" size={40} src={tech?.profile_pic}/>
                      <div>
                        <div style={{ fontSize:14, fontWeight:700 }}>{tech?.name || '—'}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{tech?.role} · {tech?.dept} Unit</div>
                        {tech?.phone && <div style={{ fontSize:11, color:'var(--primary)', fontFamily:'var(--mono)' }}>📱 {tech.phone}</div>}
                      </div>
                    </div>

                    {/* Task & Site */}
                    <div style={{ flex:1, minWidth:180 }}>
                      <div style={{ fontSize:13, fontWeight:600, marginBottom:3 }}>{task?.title || '—'}</div>
                      <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>📍 {site?.name || '—'} · {task?.dept} Unit</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>📅 {FMT_DATE(ci.timestamp)}</div>
                    </div>

                    {/* Check-in */}
                    <div style={{ padding:'10px 14px', background:'var(--green-l)', borderRadius:10, border:'1px solid var(--green)', minWidth:170 }}>
                      <div style={{ fontSize:10, color:'var(--green-d)', fontWeight:700, marginBottom:3 }}>▶ CHECK-IN</div>
                      <div style={{ fontSize:16, fontWeight:800, color:'var(--green-d)', fontFamily:'var(--mono)' }}>{FMT_TIME(ci.timestamp)}</div>
                      <div style={{ fontSize:10, color:'var(--green-d)', marginTop:4, fontFamily:'var(--mono)', lineHeight:1.5 }}>📍 {ci.address}</div>
                    </div>

                    {/* Check-out */}
                    {co ? (
                      <div style={{ padding:'10px 14px', background:'var(--red-l)', borderRadius:10, border:'1px solid var(--red)', minWidth:170 }}>
                        <div style={{ fontSize:10, color:'var(--red-d)', fontWeight:700, marginBottom:3 }}>◼ CHECK-OUT</div>
                        <div style={{ fontSize:16, fontWeight:800, color:'var(--red-d)', fontFamily:'var(--mono)' }}>{FMT_TIME(co.timestamp)}</div>
                        <div style={{ fontSize:10, color:'var(--red-d)', marginTop:4, fontFamily:'var(--mono)', lineHeight:1.5 }}>📍 {co.address}</div>
                      </div>
                    ) : (
                      <div style={{ padding:'10px 14px', background:'var(--amber-l)', borderRadius:10, border:'1px solid var(--amber)', minWidth:170 }}>
                        <div style={{ fontSize:10, color:'var(--amber-d)', fontWeight:700, marginBottom:3 }}>◼ NOT CHECKED OUT</div>
                        <div style={{ fontSize:12, color:'var(--amber-d)' }}>Still on site</div>
                        <div style={{ fontSize:10, color:'var(--amber-d)', marginTop:4 }}>Duration: {DURATION(ci.timestamp, new Date().toISOString())}</div>
                      </div>
                    )}

                    {/* Duration */}
                    {co && (
                      <div style={{ padding:'10px 14px', background:'var(--bg3)', borderRadius:10, border:'1px solid var(--border)', textAlign:'center', minWidth:80 }}>
                        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, marginBottom:3 }}>⏱ DURATION</div>
                        <div style={{ fontSize:15, fontWeight:800, color:'var(--primary)', fontFamily:'var(--mono)' }}>{DURATION(ci.timestamp, co.timestamp)}</div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Raw records view ─────────────────────────────────────────────────── */}
      {(viewMode === 'records' && role !== 'technician') && (
        <Card style={{ padding:0, overflowX:'auto' }}>
          {filtered.length === 0 ? (
            <EmptyState icon="📍" title="No records found" body="Adjust filters to see attendance records"/>
          ) : (
            <table style={{ width:'100%', borderCollapse:'collapse', minWidth:800 }}>
              <thead>
                <tr>
                  {['Type','Staff Name','Unit','Task','Site','Timestamp','GPS Address','Coordinates'].map(h=>(
                    <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, background:'var(--bg3)', borderBottom:'2px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const tech = users.find(u => u.id === c.technician_id);
                  const task = tasks.find(t => t.id === c.task_id);
                  const site = allSites.find(s => s.id === task?.site_id);
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'transparent':'rgba(0,0,0,.02)' }}>
                      <td style={{ padding:'10px 14px' }}>
                        <span style={{ padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:c.type==='checkin'?'var(--green-l)':'var(--red-l)', color:c.type==='checkin'?'var(--green-d)':'var(--red-d)', whiteSpace:'nowrap' }}>
                          {c.type === 'checkin' ? '▶ CHECK-IN' : '◼ CHECK-OUT'}
                        </span>
                      </td>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <Avatar initials={tech?.avatar||'?'} color="var(--primary)" size={28} src={tech?.profile_pic}/>
                          <div>
                            <div style={{ fontSize:12, fontWeight:700 }}>{tech?.name||'—'}</div>
                            <div style={{ fontSize:10, color:'var(--text3)' }}>{tech?.role}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'10px 14px', fontSize:12, fontWeight:600, color:'var(--primary)' }}>{task?.dept || '—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:11, maxWidth:150, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task?.title||'—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:11, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>📍 {site?.name||'—'}</td>
                      <td style={{ padding:'10px 14px', fontSize:11, fontFamily:'var(--mono)', whiteSpace:'nowrap', fontWeight:600 }}>{FMT_FULL(c.timestamp)}</td>
                      <td style={{ padding:'10px 14px', fontSize:10, color:'var(--primary)', fontFamily:'var(--mono)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.address}</td>
                      <td style={{ padding:'10px 14px', fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)', whiteSpace:'nowrap' }}>{c.lat?.toFixed(5)}, {c.lng?.toFixed(5)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* ── Full records history for technician ──────────────────────────────── */}
      {role === 'technician' && (
        <div>
          <SectionTitle>My Full Attendance History</SectionTitle>
          <Card style={{ padding:0, overflowX:'auto' }}>
            {visible.length === 0 ? (
              <EmptyState icon="📍" title="No attendance records yet" body="Your GPS check-in records will appear here after you check in from the Tasks page"/>
            ) : (
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:500 }}>
                <thead>
                  <tr>
                    {['Type','Task','Site','Date & Time','GPS Location'].map(h=>(
                      <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, background:'var(--bg3)', borderBottom:'2px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...visible].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp)).map((c,i)=>{
                    const task = tasks.find(t => t.id === c.task_id);
                    const site = allSites.find(s => s.id === task?.site_id);
                    return (
                      <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'10px 14px' }}>
                          <span style={{ padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:700, background:c.type==='checkin'?'var(--green-l)':'var(--red-l)', color:c.type==='checkin'?'var(--green-d)':'var(--red-d)', whiteSpace:'nowrap' }}>
                            {c.type === 'checkin' ? '▶ In' : '◼ Out'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 14px', fontSize:12, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{task?.title||'—'}</td>
                        <td style={{ padding:'10px 14px', fontSize:11, color:'var(--text3)' }}>📍 {site?.name||'—'}</td>
                        <td style={{ padding:'10px 14px', fontSize:11, fontFamily:'var(--mono)', fontWeight:600, whiteSpace:'nowrap' }}>{FMT_FULL(c.timestamp)}</td>
                        <td style={{ padding:'10px 14px', fontSize:10, color:'var(--primary)', fontFamily:'var(--mono)' }}>{c.address}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
