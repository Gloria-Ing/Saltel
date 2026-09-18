import { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS, SITES, SCORE_COLOR, FMT_RWF } from '../data/mockData';
import { Card, PageHeader, Badge, Btn, SectionTitle, EmptyState, Modal, Textarea, ScoreRing, Avatar, AlertBanner, Table } from '../components/UI';
import { exportReportsCSV, exportReportsExcel, buildReportsTableData } from '../utils/exportUtils';

export default function ReportsPage() {
  const { currentUser, reports, tasks, approveReport, addReportFeedback, flagLateReport, submitReport, checkins, performCheckin, performCheckout } = useApp();
  const role = currentUser?.role;
  const photoInputRef = useRef(null);

  const [viewTab, setViewTab]   = useState('list');
  const [viewReport, setViewReport] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [listView, setListView] = useState('cards');
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showCheckins, setShowCheckins] = useState(false);

  const [submitForm, setSubmitForm] = useState(false);
  const [sForm, setSForm] = useState({
    task_id:'', work_done:'', issues:'None', issue_type:'None',
    checkin:'', checkout:'',
    checkin_address:'', checkout_address:'',
    gps_lat:null, gps_lng:null, gps_address:'',
    client_name:'', site_condition:'', materials_used:'', access_level:'',
    photo_data:null, photo_name:null,
  });
  const setS = (k,v) => setSForm(p=>({...p,[k]:v}));
  const [gpsLoading, setGpsLoading] = useState(false);
  const [ciLoading, setCiLoading] = useState(false);
  const [coLoading, setCoLoading] = useState(false);

  // Get technician's own active tasks (must be approved — technicians_assigned)
  const myTasks = tasks.filter(t =>
    (t.technician_ids||[]).includes(currentUser?.id) &&
    t.workflow_stage === 'technicians_assigned'
  );

  // Auto-populate check-in/out from today's stored GPS records when task is selected
  const autoPopulateCheckins = (taskId) => {
    const today = new Date().toDateString();
    const ci = checkins.find(c => c.task_id===taskId && c.technician_id===currentUser.id && c.type==='checkin' && new Date(c.timestamp).toDateString()===today);
    const co = checkins.find(c => c.task_id===taskId && c.technician_id===currentUser.id && c.type==='checkout' && new Date(c.timestamp).toDateString()===today);
    if (ci) {
      const t = new Date(ci.timestamp);
      setS('checkin', `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`);
      setS('checkin_address', ci.address);
    }
    if (co) {
      const t = new Date(co.timestamp);
      setS('checkout', `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`);
      setS('checkout_address', co.address);
    }
  };

  const handleTaskSelect = (taskId) => {
    setS('task_id', taskId);
    autoPopulateCheckins(taskId);
  };

  const captureGPSCheckin = () => {
    setCiLoading(true);
    const doCapture = (lat, lng) => {
      const task = tasks.find(t=>t.id===sForm.task_id);
      const site = task ? SITES.find(s=>s.id===task.site_id) : null;
      const locName = site ? site.location.split(',')[0] : 'Kigali';
      const district = site ? (site.location.split(',')[1]||'Rwanda').trim().replace(/\s+/g,'-') : 'Rwanda';
      const address = `${locName}, ${district}, ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const now = new Date();
      setS('checkin', `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
      setS('checkin_address', address);
      if (sForm.task_id) performCheckin(sForm.task_id, lat, lng, address);
      setCiLoading(false);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => doCapture(pos.coords.latitude, pos.coords.longitude),
        () => {
          const task = tasks.find(t=>t.id===sForm.task_id);
          const site = task ? SITES.find(s=>s.id===task.site_id) : null;
          doCapture(site?.lat||-1.9441, site?.lng||30.0619);
        }
      );
    } else {
      const task = tasks.find(t=>t.id===sForm.task_id);
      const site = task ? SITES.find(s=>s.id===task.site_id) : null;
      doCapture(site?.lat||-1.9441, site?.lng||30.0619);
    }
  };

  const captureGPSCheckout = () => {
    setCoLoading(true);
    const doCapture = (lat, lng) => {
      const task = tasks.find(t=>t.id===sForm.task_id);
      const site = task ? SITES.find(s=>s.id===task.site_id) : null;
      const locName = site ? site.location.split(',')[0] : 'Kigali';
      const district = site ? (site.location.split(',')[1]||'Rwanda').trim().replace(/\s+/g,'-') : 'Rwanda';
      const address = `${locName}, ${district}, ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      const now = new Date();
      setS('checkout', `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
      setS('checkout_address', address);
      if (sForm.task_id) performCheckout(sForm.task_id, lat, lng, address);
      setCoLoading(false);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => doCapture(pos.coords.latitude, pos.coords.longitude),
        () => {
          const task = tasks.find(t=>t.id===sForm.task_id);
          const site = task ? SITES.find(s=>s.id===task.site_id) : null;
          doCapture(site?.lat||-1.9441, site?.lng||30.0619);
        }
      );
    } else {
      const task = tasks.find(t=>t.id===sForm.task_id);
      const site = task ? SITES.find(s=>s.id===task.site_id) : null;
      doCapture(site?.lat||-1.9441, site?.lng||30.0619);
    }
  };

  const filtered = [...reports].sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)).filter(r => {
    const task = tasks.find(t=>t.id===r.task_id);
    if (role==='technician')    return r.technician_id===currentUser.id;
    if (role==='team_leader')   return task?.leader_id===currentUser.id;
    if (role==='hod')           return task?.hod_id===currentUser.id;
    return true;
  }).filter(r => {
    const task = tasks.find(t=>t.id===r.task_id);
    const tech  = USERS.find(u=>u.id===r.technician_id);
    const matchStatus = statusFilter==='all'||r.status===statusFilter;
    const matchDept   = deptFilter==='all'||task?.dept===deptFilter;
    const matchSearch = !search||r.id.toLowerCase().includes(search.toLowerCase())||task?.title?.toLowerCase().includes(search.toLowerCase())||tech?.name?.toLowerCase().includes(search.toLowerCase())||(r.client_name||'').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchDept && matchSearch;
  });

  const getMissing = () => {
    return tasks.filter(t=>t.workflow_stage==='technicians_assigned'&&(t.technician_ids||[]).length>0).map(t=>{
      const today = new Date().toDateString();
      const submittedToday = reports.filter(r=>r.task_id===t.id&&new Date(r.submitted_at).toDateString()===today).map(r=>r.technician_id);
      const missingIds = (t.technician_ids||[]).filter(id=>!submittedToday.includes(id));
      return { task:t, missingIds };
    }).filter(x=>x.missingIds.length>0);
  };

  const canViewCheckins = ['ceo','hod','team_leader'].includes(role);

  const TABS = [
    { k:'list',    l:'📋 Reports',   roles:['ceo','hod','team_leader','technician','accountant'] },
    { k:'submit',  l:'➕ Submit',    roles:['technician'] },
    { k:'missing', l:'⚠ Missing',   roles:['team_leader','hod'] },
    { k:'checkins',l:'📍 Check-ins', roles:['ceo','hod','team_leader'] },
  ].filter(t=>t.roles.includes(role));

  const handleGPS = () => {
    setGpsLoading(true);
    const doGPS = (lat, lng) => {
      const task = tasks.find(t=>t.id===sForm.task_id);
      const site = task ? SITES.find(s=>s.id===task.site_id) : null;
      const locName = site ? site.location.split(',')[0] : 'Kigali';
      const district = site ? (site.location.split(',')[1]||'Rwanda').trim().replace(/\s+/g,'-') : 'Rwanda';
      setS('gps_lat', lat);
      setS('gps_lng', lng);
      setS('gps_address', `${locName}, ${district}, ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setGpsLoading(false);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => doGPS(pos.coords.latitude, pos.coords.longitude),
        () => {
          const task = tasks.find(t=>t.id===sForm.task_id);
          const site = task ? SITES.find(s=>s.id===task.site_id) : null;
          doGPS(site?.lat||-1.9441, site?.lng||30.0619);
        }
      );
    } else {
      const task = tasks.find(t=>t.id===sForm.task_id);
      const site = task ? SITES.find(s=>s.id===task.site_id) : null;
      doGPS(site?.lat||-1.9441, site?.lng||30.0619);
    }
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { setS('photo_data', ev.target.result); setS('photo_name', file.name); };
    reader.readAsDataURL(file);
  };

  const handleSubmitReport = () => {
    if (!sForm.task_id||!sForm.work_done.trim()) { alert('Select task and describe work done.'); return; }
    if (!sForm.checkin||!sForm.checkout) { alert('Check-in and check-out times are required. Please use the GPS capture buttons.'); return; }
    submitReport({
      ...sForm,
      technician_id:currentUser.id,
      photos: sForm.photo_data ? 1 : 0,
      feedbacks:[], late_flagged:false, ai_summary:'',
    });
    setSForm({ task_id:'', work_done:'', issues:'None', issue_type:'None', checkin:'', checkout:'', checkin_address:'', checkout_address:'', gps_lat:null, gps_lng:null, gps_address:'', client_name:'', site_condition:'', materials_used:'', access_level:'', photo_data:null, photo_name:null });
    setViewTab('list');
  };

  const tableData = buildReportsTableData(filtered, tasks);

  // Checkin records visible to supervisors/HoU/CEO
  const allCheckins = [...checkins].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
  const filteredCheckins = allCheckins.filter(c => {
    const task = tasks.find(t=>t.id===c.task_id);
    if (role==='hod') return task?.hod_id===currentUser.id;
    if (role==='team_leader') return task?.leader_id===currentUser.id;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="📋 Reports"
        subtitle="Field operations reports — sorted newest first"
        action={role==='technician'&&myTasks.length>0&&<Btn variant="primary" onClick={()=>setViewTab('submit')}>➕ Submit Report</Btn>}
      />

      <div style={{ display:'flex', gap:6, marginBottom:'1.25rem' }}>
        {TABS.map(t=>(
          <button key={t.k} onClick={()=>setViewTab(t.k)}
            style={{ padding:'9px 18px', borderRadius:9, fontSize:14, fontWeight:600, cursor:'pointer', border:'1.5px solid', borderColor:viewTab===t.k?'var(--primary)':'var(--border)', background:viewTab===t.k?'var(--primary-l)':'var(--bg2)', color:viewTab===t.k?'var(--primary)':'var(--text3)', transition:'all .15s', fontFamily:'var(--font)' }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ── LIST TAB ── */}
      {viewTab==='list' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ display:'flex', gap:4, padding:'4px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:10 }}>
              {[['cards','☰ Cards'],['table','⊞ Table']].map(([v,l]) => (
                <button key={v} onClick={()=>setListView(v)} style={{ padding:'7px 16px', borderRadius:7, fontSize:13, fontWeight:600, cursor:'pointer', border:'none', background:listView===v?'var(--primary)':'transparent', color:listView===v?'#fff':'var(--text3)', fontFamily:'var(--font)', transition:'all .15s' }}>{l}</button>
              ))}
            </div>
            <Btn variant="ghost" onClick={()=>exportReportsCSV(filtered,tasks)}>⬇ Download CSV</Btn>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by ID, task, technician, or client..." style={{ flex:1, minWidth:180, padding:'9px 14px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14 }}/>
            {['all','pending','approved'].map(s=>(
              <button key={s} onClick={()=>setStatusFilter(s)} style={{ padding:'8px 16px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', border:'1.5px solid', borderColor:statusFilter===s?'var(--primary)':'var(--border)', background:statusFilter===s?'var(--primary-l)':'var(--bg2)', color:statusFilter===s?'var(--primary)':'var(--text3)', fontFamily:'var(--font)' }}>
                {s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
            {role!=='technician' && (
              <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)} style={{ padding:'8px 13px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14 }}>
                <option value="all">All Units</option>
                <option value="LAN">LAN</option><option value="Fiber">Fiber</option><option value="CCTV">CCTV</option>
              </select>
            )}
          </div>

          {filtered.length===0 ? (
            <EmptyState icon="📋" title="No reports found" body="No field reports match your filters"/>
          ) : listView==='table' ? (
            <Card style={{ padding:0 }}>
              <div style={{ overflowX:'auto' }}>
                <Table
                  headers={['ID','Task','Technician','GPS Location','Check-in Time','Check-in Location','Check-out Time','Check-out Location','Status','Score','Late?']}
                  rows={filtered.map(r=>{
                    const task=tasks.find(t=>t.id===r.task_id);
                    const tech=USERS.find(u=>u.id===r.technician_id);
                    return [
                      <span style={{fontFamily:'var(--mono)',fontSize:11,color:'var(--primary)'}}>{r.id}</span>,
                      <span style={{fontSize:11,maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',display:'block',whiteSpace:'nowrap'}}>{task?.title||'—'}</span>,
                      <span style={{fontSize:11}}>{tech?.name||'—'}</span>,
                      <span style={{fontSize:10,color:'var(--primary)',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',display:'block',whiteSpace:'nowrap'}}>{r.gps_address||'—'}</span>,
                      <span style={{fontSize:11,fontFamily:'var(--mono)'}}>{r.checkin||'—'}</span>,
                      <span style={{fontSize:10,color:'var(--green-d)',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',display:'block',whiteSpace:'nowrap'}}>{r.checkin_address||'—'}</span>,
                      <span style={{fontSize:11,fontFamily:'var(--mono)'}}>{r.checkout||'—'}</span>,
                      <span style={{fontSize:10,color:'var(--red-d)',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',display:'block',whiteSpace:'nowrap'}}>{r.checkout_address||'—'}</span>,
                      <Badge status={r.status}/>,
                      <span style={{fontFamily:'var(--mono)',fontSize:12,fontWeight:700,color:SCORE_COLOR(r.score||75)}}>{r.score||75}</span>,
                      <span style={{fontSize:11,color:r.late_flagged?'var(--red)':'var(--green)'}}>{r.late_flagged?'⚠ Late':'On Time'}</span>,
                    ];
                  })}
                />
              </div>
            </Card>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filtered.map(r => {
                const task = tasks.find(t=>t.id===r.task_id);
                const tech = USERS.find(u=>u.id===r.technician_id);
                const site = SITES.find(s=>s.id===task?.site_id);
                return (
                  <Card key={r.id} onClick={()=>setViewReport(r)} style={{ borderLeft:`4px solid ${SCORE_COLOR(r.score||75)}`, cursor:'pointer' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ flex:1 }}>
                        <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:6, flexWrap:'wrap' }}>
                          <span style={{ fontFamily:'var(--mono)', fontSize:12, color:'var(--primary)' }}>{r.id}</span>
                          <Badge status={r.status}/>
                          {r.late_flagged && <span style={{ fontSize:11, background:'var(--red-l)', color:'var(--red)', padding:'2px 7px', borderRadius:6, fontWeight:700 }}>LATE</span>}
                          {r.photo_data && <span style={{ fontSize:11, background:'var(--cyan-l)', color:'var(--cyan-d)', padding:'2px 7px', borderRadius:6, fontWeight:700 }}>📷 Photo</span>}
                        </div>
                        <div style={{ fontSize:14, fontWeight:700, marginBottom:3 }}>{task?.title||'Unknown Task'}</div>
                        <div style={{ fontSize:12, color:'var(--text3)', marginBottom:4 }}>
                          📍 {site?.name} · By {tech?.name} · {new Date(r.submitted_at).toLocaleString('en-RW')}
                        </div>
                        {r.gps_address && (
                          <div style={{ fontSize:11, color:'var(--primary)', marginBottom:4 }}>📡 {r.gps_address}</div>
                        )}
                        <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--text3)', flexWrap:'wrap', marginBottom:4 }}>
                          {r.checkin && <span style={{ color:'var(--green-d)', fontWeight:600 }}>▶ In: {r.checkin} {r.checkin_address && `• ${r.checkin_address}`}</span>}
                          {r.checkout && <span style={{ color:'var(--red-d)', fontWeight:600 }}>◼ Out: {r.checkout} {r.checkout_address && `• ${r.checkout_address}`}</span>}
                        </div>
                        <div style={{ fontSize:13, color:'var(--text2)', marginBottom:4 }}>{(r.work_done||'').slice(0,100)}{(r.work_done||'').length>100?'...':''}</div>
                        <div style={{ display:'flex', gap:12, fontSize:12, color:'var(--text3)', flexWrap:'wrap' }}>
                          {r.client_name && <span>👤 {r.client_name}</span>}
                          {r.site_condition && <span style={{ color:'var(--cyan-d)' }}>🏗 {r.site_condition.slice(0,30)}</span>}
                          {r.issues&&r.issues!=='None'&&<span style={{ color:'var(--amber-d)' }}>⚠ {r.issues.slice(0,40)}</span>}
                          {r.feedbacks?.length>0&&<span style={{ color:'var(--purple)' }}>💬 {r.feedbacks.length} feedback</span>}
                        </div>
                      </div>
                      <ScoreRing score={r.score||75} size={56}/>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUBMIT TAB (technician) ── */}
      {viewTab==='submit' && role==='technician' && (
        <Card style={{ maxWidth:700 }}>
          <SectionTitle>Submit Field Report</SectionTitle>
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:8 }}>Select Your Active Task *</label>
            {myTasks.length===0 ? (
              <AlertBanner type="warning">No active tasks assigned to you currently. You must be assigned and the task must be In Progress.</AlertBanner>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {myTasks.map(t=>{
                  const site=SITES.find(s=>s.id===t.site_id);
                  const selected=sForm.task_id===t.id;
                  const today=new Date().toDateString();
                  const hasCI=checkins.find(c=>c.task_id===t.id&&c.technician_id===currentUser.id&&c.type==='checkin'&&new Date(c.timestamp).toDateString()===today);
                  const hasCO=checkins.find(c=>c.task_id===t.id&&c.technician_id===currentUser.id&&c.type==='checkout'&&new Date(c.timestamp).toDateString()===today);
                  return (
                    <div key={t.id} onClick={()=>handleTaskSelect(t.id)}
                      style={{ padding:'12px 14px', borderRadius:10, border:`2px solid ${selected?'var(--primary)':'var(--border)'}`, background:selected?'var(--primary-l)':'var(--bg3)', cursor:'pointer', transition:'all .15s' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, marginBottom:3 }}>{t.title}</div>
                          <div style={{ fontSize:11, color:'var(--text3)', marginBottom:4 }}>📍 {site?.name} · {t.dept} Unit</div>
                          <div style={{ display:'flex', gap:8 }}>
                            <span style={{ fontSize:11, color:'var(--primary)', fontWeight:600 }}>⏰ Report deadline: {t.report_time}</span>
                            {hasCI && <span style={{ fontSize:10, background:'var(--green-l)', color:'var(--green-d)', padding:'1px 7px', borderRadius:5, fontWeight:700 }}>✓ Checked In</span>}
                            {hasCO && <span style={{ fontSize:10, background:'var(--red-l)', color:'var(--red-d)', padding:'1px 7px', borderRadius:5, fontWeight:700 }}>✓ Checked Out</span>}
                          </div>
                        </div>
                        {selected && <span style={{ color:'var(--primary)', fontWeight:700, fontSize:18 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* GPS Check-in / Check-out — must capture live location */}
          <div style={{ padding:'14px', background:'var(--bg3)', borderRadius:12, marginBottom:'1rem', border:'1.5px solid var(--border)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--primary)', marginBottom:12 }}>📍 GPS Check-in / Check-out (Required)</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:12 }}>
              You must capture your live GPS location for both check-in and check-out. Format: <span style={{ fontFamily:'var(--mono)', color:'var(--primary)' }}>City, District-Zone, lat, lng</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Check-in Time</label>
                <div style={{ padding:'9px 12px', background:'var(--bg2)', borderRadius:8, fontFamily:'var(--mono)', fontSize:14, marginBottom:6, minHeight:36, color: sForm.checkin ? 'var(--green-d)' : 'var(--text3)' }}>
                  {sForm.checkin || '— Not recorded —'}
                </div>
                {sForm.checkin_address && (
                  <div style={{ fontSize:11, color:'var(--green-d)', fontFamily:'var(--mono)', marginBottom:6 }}>📍 {sForm.checkin_address}</div>
                )}
                <Btn variant="success" size="sm" onClick={captureGPSCheckin} disabled={ciLoading||!sForm.task_id}>
                  {ciLoading ? '📡 Capturing...' : '📍 Capture Check-in Location'}
                </Btn>
              </div>
              <div>
                <label style={{ display:'block', fontSize:12, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Check-out Time</label>
                <div style={{ padding:'9px 12px', background:'var(--bg2)', borderRadius:8, fontFamily:'var(--mono)', fontSize:14, marginBottom:6, minHeight:36, color: sForm.checkout ? 'var(--red-d)' : 'var(--text3)' }}>
                  {sForm.checkout || '— Not recorded —'}
                </div>
                {sForm.checkout_address && (
                  <div style={{ fontSize:11, color:'var(--red-d)', fontFamily:'var(--mono)', marginBottom:6 }}>📍 {sForm.checkout_address}</div>
                )}
                <Btn variant="danger" size="sm" onClick={captureGPSCheckout} disabled={coLoading||!sForm.task_id||!sForm.checkin}>
                  {coLoading ? '📡 Capturing...' : '📍 Capture Check-out Location'}
                </Btn>
              </div>
            </div>
          </div>

          {/* GPS Report Location */}
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>📡 GPS Report Location</label>
            <div style={{ display:'flex', gap:8 }}>
              <input value={sForm.gps_address} onChange={e=>setS('gps_address',e.target.value)}
                placeholder="e.g. Kigali, Gikondo-UR, -1.9800, 30.0700"
                style={{ flex:1, padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14 }}/>
              <Btn variant={gpsLoading?'ghost':'primary'} onClick={handleGPS} disabled={gpsLoading}>
                {gpsLoading ? '📡...' : '📡 Auto GPS'}
              </Btn>
            </div>
            {sForm.gps_lat && (
              <div style={{ marginTop:5, fontSize:12, color:'var(--green-d)', fontFamily:'var(--mono)' }}>
                ✓ {sForm.gps_address}
              </div>
            )}
          </div>

          {/* Field Info */}
          <div style={{ padding:'14px', background:'var(--bg3)', borderRadius:12, marginBottom:'1rem', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--primary)', marginBottom:12 }}>🏗 Field Information</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Client / Contact Name</label>
                <input value={sForm.client_name} onChange={e=>setS('client_name',e.target.value)} placeholder="e.g. Mr. Jean Habimana" style={{ width:'100%', padding:'10px 14px', background:'var(--bg2)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Site Condition</label>
                <select value={sForm.site_condition} onChange={e=>setS('site_condition',e.target.value)} style={{ width:'100%', padding:'10px 14px', background:'var(--bg2)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14 }}>
                  <option value="">Select condition</option>
                  <option>Ready — all infrastructure accessible</option>
                  <option>Partial — some areas restricted</option>
                  <option>Difficult — access issues encountered</option>
                  <option>Under Construction — additional delays</option>
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Materials / Equipment Used</label>
                <input value={sForm.materials_used} onChange={e=>setS('materials_used',e.target.value)} placeholder="e.g. 50m CAT6, 2x Cisco switches" style={{ width:'100%', padding:'10px 14px', background:'var(--bg2)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Access Level Granted</label>
                <select value={sForm.access_level} onChange={e=>setS('access_level',e.target.value)} style={{ width:'100%', padding:'10px 14px', background:'var(--bg2)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14 }}>
                  <option value="">Select access level</option>
                  <option>Full access</option><option>Supervised access</option><option>Limited access</option><option>Emergency access</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Work Done Today *</label>
            <textarea value={sForm.work_done} onChange={e=>setS('work_done',e.target.value)} placeholder="Describe all work completed today in detail..." style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, resize:'vertical', minHeight:100, boxSizing:'border-box' }}/>
          </div>
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Issues Encountered</label>
            <textarea value={sForm.issues} onChange={e=>setS('issues',e.target.value)} placeholder="Describe any issues, delays, or problems..." style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, resize:'vertical', minHeight:70, boxSizing:'border-box' }}/>
          </div>
          <div style={{ marginBottom:'1rem' }}>
            <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>📷 Report Photo (assigned by client)</label>
            <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display:'none' }}/>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <Btn variant="ghost" onClick={()=>photoInputRef.current?.click()}>📷 Upload Photo</Btn>
              {sForm.photo_name && <span style={{ fontSize:13, color:'var(--green-d)', fontWeight:600 }}>✓ {sForm.photo_name}</span>}
              {sForm.photo_data && <Btn size="sm" variant="ghost" onClick={()=>{ setS('photo_data',null); setS('photo_name',null); }}>✕ Remove</Btn>}
            </div>
            {sForm.photo_data && <img src={sForm.photo_data} alt="Report" style={{ maxWidth:'100%', maxHeight:200, borderRadius:10, border:'2px solid var(--border)', objectFit:'cover', marginTop:10 }}/>}
          </div>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <Btn variant="ghost" onClick={()=>setViewTab('list')}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSubmitReport} disabled={!sForm.task_id||!sForm.work_done.trim()}>✓ Submit Report</Btn>
          </div>
        </Card>
      )}

      {/* ── MISSING REPORTS TAB ── */}
      {viewTab==='missing' && ['team_leader','hod'].includes(role) && (
        <div>
          {getMissing().length===0 ? (
            <EmptyState icon="✓" title="All reports submitted today" body="No missing reports for active tasks"/>
          ) : getMissing().map(({task, missingIds}) => (
            <Card key={task.id} style={{ borderLeft:'4px solid var(--red)', marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:5 }}>⚠ Missing: {task.title}</div>
              <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>Deadline: {task.report_time} · {task.report_schedule}</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {missingIds.map(id=>{
                  const u=USERS.find(x=>x.id===id);
                  return u ? (
                    <div key={id} style={{ display:'flex', gap:8, alignItems:'center', padding:'8px 12px', background:'var(--red-l)', borderRadius:9, border:'1px solid var(--red)' }}>
                      <Avatar initials={u.avatar} color="var(--red)" size={28}/>
                      <div>
                        <div style={{ fontSize:13, fontWeight:600, color:'var(--red-d)' }}>{u.name}</div>
                        {u.phone && <div style={{ fontSize:11, color:'var(--red-d)', fontFamily:'var(--mono)' }}>📱 {u.phone}</div>}
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── CHECK-INS TAB (Supervisor / HoU / CEO) ── */}
      {viewTab==='checkins' && canViewCheckins && (
        <div>
          <div style={{ marginBottom:'1rem', fontSize:13, color:'var(--text3)' }}>
            Live GPS check-in and check-out records captured by technicians in the field.
          </div>
          {filteredCheckins.length===0 ? (
            <EmptyState icon="📍" title="No check-in records" body="Technician GPS check-ins will appear here"/>
          ) : (
            <Card style={{ padding:0 }}>
              <div style={{ overflowX:'auto' }}>
                <Table
                  headers={['Type','Technician','Task','Timestamp','GPS Address','Coordinates']}
                  rows={filteredCheckins.map(c=>{
                    const tech = USERS.find(u=>u.id===c.technician_id);
                    const task = tasks.find(t=>t.id===c.task_id);
                    return [
                      <span style={{ padding:'2px 8px', borderRadius:6, fontSize:11, fontWeight:700, background:c.type==='checkin'?'var(--green-l)':'var(--red-l)', color:c.type==='checkin'?'var(--green-d)':'var(--red-d)' }}>
                        {c.type==='checkin'?'▶ CHECK-IN':'◼ CHECK-OUT'}
                      </span>,
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <Avatar initials={tech?.avatar||'?'} color="var(--green)" size={24}/>
                        <span style={{ fontSize:12, fontWeight:600 }}>{tech?.name||'—'}</span>
                      </div>,
                      <span style={{ fontSize:11, maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', display:'block', whiteSpace:'nowrap' }}>{task?.title||'—'}</span>,
                      <span style={{ fontSize:11, fontFamily:'var(--mono)', whiteSpace:'nowrap' }}>{new Date(c.timestamp).toLocaleString('en-RW')}</span>,
                      <span style={{ fontSize:11, color:'var(--primary)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', display:'block', whiteSpace:'nowrap' }}>{c.address}</span>,
                      <span style={{ fontSize:10, color:'var(--text3)', fontFamily:'var(--mono)' }}>{c.lat?.toFixed(6)}, {c.lng?.toFixed(6)}</span>,
                    ];
                  })}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Report Detail Modal */}
      {viewReport && (() => {
        const task = tasks.find(t=>t.id===viewReport.task_id);
        const tech = USERS.find(u=>u.id===viewReport.technician_id);
        const site = SITES.find(s=>s.id===task?.site_id);
        const canApprove = (role==='hod'||role==='team_leader') && viewReport.status==='pending' && task?.hod_id===currentUser.id;
        const canFlag    = (role==='hod'||role==='team_leader') && !viewReport.late_flagged;
        return (
          <Modal open={true} onClose={()=>{ setViewReport(null); setFeedback(''); }} title={`Report ${viewReport.id}`} maxWidth={680}>
            <div style={{ display:'flex', gap:8, marginBottom:'1rem', flexWrap:'wrap' }}>
              <Badge status={viewReport.status}/>
              {viewReport.late_flagged && <span style={{ fontSize:12, background:'var(--red-l)', color:'var(--red)', padding:'3px 10px', borderRadius:8, fontWeight:700 }}>⚠ LATE</span>}
              <ScoreRing score={viewReport.score||75} size={50}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1rem' }}>
              {[['📋 Task',task?.title||'—'],['👤 Technician',tech?.name||'—'],['📍 Site',site?.name||'—'],['📅 Submitted',viewReport.submitted_at?new Date(viewReport.submitted_at).toLocaleString('en-RW'):'—']].map(([l,v])=>(
                <div key={l} style={{ padding:'8px 12px', background:'var(--bg3)', borderRadius:8 }}>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>{l}</div>
                  <div style={{ fontSize:13, fontWeight:600 }}>{v}</div>
                </div>
              ))}
            </div>
            {viewReport.gps_address && (
              <div style={{ padding:'8px 12px', background:'var(--primary-l)', borderRadius:8, fontSize:12, color:'var(--primary)', fontWeight:600, marginBottom:'0.75rem', fontFamily:'var(--mono)' }}>
                📡 Report GPS: {viewReport.gps_address}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'0.75rem' }}>
              <div style={{ padding:'8px 12px', background:'var(--green-l)', borderRadius:8, border:'1px solid var(--green)' }}>
                <div style={{ fontSize:11, color:'var(--green-d)', fontWeight:700, marginBottom:3 }}>▶ CHECK-IN</div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color:'var(--green-d)' }}>{viewReport.checkin||'—'}</div>
                {viewReport.checkin_address && <div style={{ fontSize:10, color:'var(--green-d)', marginTop:3, fontFamily:'var(--mono)' }}>📍 {viewReport.checkin_address}</div>}
              </div>
              <div style={{ padding:'8px 12px', background:'var(--red-l)', borderRadius:8, border:'1px solid var(--red)' }}>
                <div style={{ fontSize:11, color:'var(--red-d)', fontWeight:700, marginBottom:3 }}>◼ CHECK-OUT</div>
                <div style={{ fontSize:13, fontWeight:700, fontFamily:'var(--mono)', color:'var(--red-d)' }}>{viewReport.checkout||'—'}</div>
                {viewReport.checkout_address && <div style={{ fontSize:10, color:'var(--red-d)', marginTop:3, fontFamily:'var(--mono)' }}>📍 {viewReport.checkout_address}</div>}
              </div>
            </div>
            <SectionTitle>Work Done</SectionTitle>
            <p style={{ fontSize:14, color:'var(--text2)', lineHeight:1.8, marginBottom:'0.75rem' }}>{viewReport.work_done}</p>
            {viewReport.issues&&viewReport.issues!=='None'&&<div style={{ padding:'10px 14px', background:'var(--amber-l)', borderRadius:9, fontSize:13, color:'var(--amber-d)', marginBottom:'0.75rem' }}>⚠ Issues: {viewReport.issues}</div>}
            {viewReport.photo_data && (
              <div style={{ marginBottom:'0.75rem' }}>
                <div style={{ fontSize:12, fontWeight:700, marginBottom:6, color:'var(--text3)' }}>📷 SITE PHOTO</div>
                <img src={viewReport.photo_data} alt="Site" style={{ maxWidth:'100%', maxHeight:220, borderRadius:10, border:'2px solid var(--border)', objectFit:'cover' }}/>
              </div>
            )}
            {viewReport.ai_summary && (
              <div style={{ padding:'10px 14px', background:'var(--purple-l)', borderRadius:9, marginBottom:'0.75rem', fontSize:13, color:'var(--purple)' }}>
                🤖 AI Summary: {viewReport.ai_summary}
              </div>
            )}
            {viewReport.feedbacks?.length>0 && (
              <div style={{ marginBottom:'0.75rem' }}>
                <SectionTitle>Feedback</SectionTitle>
                {viewReport.feedbacks.map((fb,i)=>(
                  <div key={i} style={{ padding:'8px 12px', background:'var(--bg3)', borderRadius:8, marginBottom:6, fontSize:13 }}>
                    <span style={{ fontWeight:700, color:'var(--primary)', marginRight:8 }}>{fb.role}</span>
                    {fb.text}
                    <span style={{ fontSize:10, color:'var(--text3)', marginLeft:8 }}>{new Date(fb.at).toLocaleDateString('en-RW')}</span>
                  </div>
                ))}
              </div>
            )}
            {(canApprove||canFlag||!['technician'].includes(role)) && (
              <div style={{ marginTop:'1rem', borderTop:'1px solid var(--border)', paddingTop:'1rem' }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Add Feedback</label>
                <div style={{ display:'flex', gap:8 }}>
                  <textarea value={feedback} onChange={e=>setFeedback(e.target.value)} placeholder="Write feedback for the technician..." rows={2} style={{ flex:1, padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, resize:'vertical', boxSizing:'border-box' }}/>
                  <Btn variant="primary" onClick={()=>{ if(feedback.trim()){ addReportFeedback(viewReport.id,feedback); setFeedback(''); setViewReport(r=>({...r,feedbacks:[...(r.feedbacks||[]),{from_user_id:currentUser.id,role:currentUser.role,text:feedback,at:new Date().toISOString()}]})); }}}>Send</Btn>
                </div>
                <div style={{ display:'flex', gap:8, marginTop:'0.75rem', flexWrap:'wrap' }}>
                  {canApprove && <Btn variant="success" onClick={()=>{ approveReport(viewReport.id); setViewReport(p=>({...p,status:'approved',approved_by:currentUser.id})); }}>✓ Approve Report</Btn>}
                  {canFlag && <Btn variant="amber" onClick={()=>{ flagLateReport(viewReport.id); setViewReport(p=>({...p,late_flagged:true})); }}>⚠ Flag as Late</Btn>}
                </div>
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}
