import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { USERS, DEPARTMENTS, SITES, FMT_RWF } from '../data/mockData';
import { Card, PageHeader, Badge, Btn, SectionTitle, EmptyState, Modal, Input, Textarea, SSelect, Avatar, AlertBanner } from '../components/UI';

export default function TasksPage() {
  const {
    currentUser, tasks, users, reports,
    hodAssignLeader, leaderAssignTechnicians, completeTask, designateReporter,
    cancelTechnicianFromTask, supervisorApproveAssignment, supervisorRejectAssignment,
    checkins, performCheckin, performCheckout, getMyCheckin, getMyCheckout,
  } = useApp();
  const navigate = useNavigate();
  const role = currentUser?.role;

  const [viewTask, setViewTask] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [assignType, setAssignType] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [techIds, setTechIds] = useState([]);
  const [teamLeaderId, setTeamLeaderId] = useState('');
  const [leaderNotes, setLeaderNotes] = useState('');
  const [hodNotes, setHodNotes] = useState('');
  const [reportSchedule, setReportSchedule] = useState('daily');
  const [reportTime, setReportTime] = useState('18:00');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(null);
  const [checkinMsg, setCheckinMsg] = useState('');

  const filtered = [...tasks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).filter(t => {
    if (role === 'technician') {
      // Technicians only see tasks that are fully approved (technicians_assigned) and they are assigned
      return (t.technician_ids || []).includes(currentUser.id) && t.workflow_stage === 'technicians_assigned';
    }
    if (role === 'unit_leader') return t.leader_id === currentUser.id || (t.workflow_stage === 'leader_assigned' && t.dept === currentUser.dept);
    if (role === 'regional_coordinator') return t.hod_id === currentUser.id || t.dept === currentUser.dept;
    return true;
  }).filter(t => {
    const site = SITES.find(s => s.id === t.site_id);
    const matchPri = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchStage = stageFilter === 'all' || t.workflow_stage === stageFilter;
    const matchDept = deptFilter === 'all' || t.dept === deptFilter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || site?.name.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    return matchPri && matchStage && matchDept && matchSearch;
  });

  const openAssign = (task, type) => {
    setAssignModal(task);
    setAssignType(type);
    setLeaderId('');
    setTechIds([]);
    setTeamLeaderId('');
    setLeaderNotes(task.leader_notes || '');
    setHodNotes(task.hod_notes || '');
    setReportSchedule(task.report_schedule || 'daily');
    setReportTime(task.report_time || '18:00');
  };

  const handleHodAssign = () => {
    if (!leaderId) { alert('Select a HoU (Leader).'); return; }
    hodAssignLeader(assignModal.id, leaderId, hodNotes);
    setAssignModal(null);
  };

  const handleLeaderAssign = () => {
    if (techIds.length === 0) { alert('Select at least one technician.'); return; }
    const tlId = techIds.length === 1 ? techIds[0] : (teamLeaderId ? Number(teamLeaderId) : null);
    leaderAssignTechnicians(assignModal.id, techIds.map(Number), leaderNotes, reportSchedule, reportTime, tlId);
    setAssignModal(null);
  };

  const handleApprove = (taskId) => {
    supervisorApproveAssignment(taskId);
    setViewTask(null);
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) { alert('Please provide a rejection reason.'); return; }
    supervisorRejectAssignment(showRejectModal, rejectReason);
    setShowRejectModal(null);
    setRejectReason('');
    setViewTask(null);
  };

  const captureGPS = (taskId, type) => {
    setGpsLoading(taskId + type);
    const doCapture = (lat, lng) => {
      const task = tasks.find(t => t.id === taskId);
      const site = task ? SITES.find(s => s.id === task.site_id) : null;
      const locName = site ? site.location.split(',')[0] : 'Kigali';
      const district = site ? (site.location.split(',')[1] || 'Rwanda').trim().replace(/\s+/g, '-') : 'Rwanda';
      const address = `${locName}, ${district}, ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      if (type === 'checkin') performCheckin(taskId, lat, lng, address);
      else performCheckout(taskId, lat, lng, address);
      setGpsLoading(null);
      setCheckinMsg(`${type === 'checkin' ? 'Check-in' : 'Check-out'} recorded: ${address}`);
      setTimeout(() => setCheckinMsg(''), 5000);
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => doCapture(pos.coords.latitude, pos.coords.longitude),
        () => {
          const task = tasks.find(t => t.id === taskId);
          const site = task ? SITES.find(s => s.id === task.site_id) : null;
          doCapture(site?.lat || -1.9441, site?.lng || 30.0619);
        }
      );
    } else {
      const task = tasks.find(t => t.id === taskId);
      const site = task ? SITES.find(s => s.id === task.site_id) : null;
      doCapture(site?.lat || -1.9441, site?.lng || 30.0619);
    }
  };

  const toggleTech = id => setTechIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const deptLeaders = (dept) => users.filter(u => u.role === 'unit_leader' && u.dept === dept);
  const deptTechs = (dept) => users.filter(u => ['technician', 'staff','store_keeper'].includes(u.role) && u.dept === dept);

  const STAGE_LABELS = {
    all: 'All', ceo_created: 'Pending RC', hod_created: 'Pending Unit Leader',
    leader_assigned: 'Pending Techs', supervisor_approval_pending: 'RC Approval',
    technicians_assigned: 'In Progress', completed: 'Completed',
  };

  const pendingApproval = role === 'regional_coordinator' ? filtered.filter(t => t.workflow_stage === 'supervisor_approval_pending') : [];

  return (
    <div>
      <PageHeader
        title="◈ Tasks"
        subtitle={`Field operations tasks — sorted newest first · ${filtered.length} visible`}
        action={['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator'].includes(role) && <Btn variant="primary" onClick={() => navigate('/tasks/new')}>＋ New Task</Btn>}
      />

      {/* GPS Check-in message */}
      {checkinMsg && (
        <AlertBanner type="success">📍 {checkinMsg}</AlertBanner>
      )}

      {/* Supervisor pending approvals banner */}
      {pendingApproval.length > 0 && (
        <div style={{ padding: '12px 16px', background: '#FEF3C7', border: '1.5px solid #D97706', borderRadius: 10, marginBottom: '1rem', fontSize: 13, color: '#92400E', fontWeight: 600 }}>
          ⏳ {pendingApproval.length} task{pendingApproval.length > 1 ? 's' : ''} awaiting your approval before technicians are notified.
        </div>
      )}

      {/* Technician check-in/checkout section */}
      {role === 'technician' && (
        <div style={{ marginBottom: '1.25rem' }}>
          {filtered.filter(t => t.workflow_stage === 'technicians_assigned').map(task => {
            const site = SITES.find(s => s.id === task.site_id);
            const today = new Date().toDateString();
            const myCI = checkins.find(c => c.task_id === task.id && c.technician_id === currentUser.id && c.type === 'checkin' && new Date(c.timestamp).toDateString() === today);
            const myCO = checkins.find(c => c.task_id === task.id && c.technician_id === currentUser.id && c.type === 'checkout' && new Date(c.timestamp).toDateString() === today);
            return (
              <div key={task.id} style={{ padding: '12px 16px', background: 'var(--bg2)', border: '1.5px solid var(--border)', borderRadius: 12, marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>📍 {task.title} — GPS Check-in/out</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 10 }}>Site: {site?.name} · Must capture live GPS location</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {!myCI ? (
                    <Btn variant="success" size="sm" onClick={() => captureGPS(task.id, 'checkin')} disabled={gpsLoading === task.id + 'checkin'}>
                      {gpsLoading === task.id + 'checkin' ? '📡 Locating...' : '📍 Check In (Live GPS)'}
                    </Btn>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 12px', background: 'var(--green-l)', borderRadius: 9, border: '1px solid var(--green)' }}>
                      <span style={{ fontSize: 12, color: 'var(--green-d)', fontWeight: 700 }}>✓ Checked In</span>
                      <span style={{ fontSize: 11, color: 'var(--green-d)', fontFamily: 'var(--mono)' }}>{myCI.address}</span>
                    </div>
                  )}
                  {myCI && !myCO ? (
                    <Btn variant="danger" size="sm" onClick={() => captureGPS(task.id, 'checkout')} disabled={gpsLoading === task.id + 'checkout'}>
                      {gpsLoading === task.id + 'checkout' ? '📡 Locating...' : '📍 Check Out (Live GPS)'}
                    </Btn>
                  ) : myCO ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '6px 12px', background: 'var(--red-l)', borderRadius: 9, border: '1px solid var(--red)' }}>
                      <span style={{ fontSize: 12, color: 'var(--red-d)', fontWeight: 700 }}>✓ Checked Out</span>
                      <span style={{ fontSize: 11, color: 'var(--red-d)', fontFamily: 'var(--mono)' }}>{myCO.address}</span>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..." style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1.5px solid var(--border)', borderRadius: 9, background: 'var(--bg2)', fontSize: 14 }} />
        {Object.entries(STAGE_LABELS).map(([k, l]) => (
          <button key={k} onClick={() => setStageFilter(k)} style={{ padding: '8px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: stageFilter === k ? 'var(--primary)' : 'var(--border)', background: stageFilter === k ? 'var(--primary-l)' : 'var(--bg2)', color: stageFilter === k ? 'var(--primary)' : 'var(--text3)', fontFamily: 'var(--font)' }}>
            {l}
          </button>
        ))}
        {['ceo', 'daf'].includes(role) && (
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ padding: '8px 13px', border: '1.5px solid var(--border)', borderRadius: 9, background: 'var(--bg2)', fontSize: 14 }}>
            <option value="all">All Units</option>
            {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="◈" title="No tasks found" body="No tasks match your filters" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(t => {
            const site = SITES.find(s => s.id === t.site_id);
            const leader = users.find(u => u.id === t.leader_id);
            const techs = (t.technician_ids || []).map(id => users.find(u => u.id === id)).filter(Boolean);
            const hod = users.find(u => u.id === t.hod_id);
            const canHodAssign = role === 'regional_coordinator' && (t.workflow_stage === 'ceo_created' || t.workflow_stage === 'hod_created') && t.dept === currentUser.dept;
            const canLeaderAssign = role === 'unit_leader' && t.workflow_stage === 'leader_assigned' && t.leader_id === currentUser.id;
            const canComplete = (role === 'regional_coordinator' || role === 'unit_leader') && t.workflow_stage === 'technicians_assigned';
            const canSupervisorApprove = role === 'regional_coordinator' && t.workflow_stage === 'supervisor_approval_pending' && t.hod_id === currentUser.id;
            return (
              <Card key={t.id} style={{ borderLeft: `4px solid ${t.priority === 'urgent' ? 'var(--red)' : t.priority === 'high' ? 'var(--amber)' : 'var(--primary)'}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 5, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text3)' }}>{t.id}</span>
                      <Badge status={t.workflow_stage} />
                      <Badge status={t.priority} />
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 5, cursor: 'pointer', color: 'var(--text)' }} onClick={() => setViewTask(t)}>{t.title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <span>📍 {site?.name || '—'}</span>
                      <span>🏢 {t.dept} Unit</span>
                      <span>📅 {t.start_date} → {t.end_date}</span>
                    </div>
                    {/* Multi-day report progress */}
                    {t.workflow_stage === 'technicians_assigned' && t.start_date && t.end_date && (() => {
                      const totalDays = Math.max(1, Math.round((new Date(t.end_date) - new Date(t.start_date)) / 86400000) + 1);
                      const taskReports = (reports || []).filter(r => r.task_id === t.id);
                      const submitted = taskReports.length;
                      const pct = Math.min(100, Math.round(submitted / totalDays * 100));
                      const color = submitted >= totalDays ? 'var(--green)' : submitted > 0 ? 'var(--primary)' : 'var(--amber)';
                      return totalDays > 1 ? (
                        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 5, background: 'var(--bg4,#e2e8f0)', borderRadius: 4, overflow: 'hidden', maxWidth: 180 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .3s' }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
                            {submitted}/{totalDays} day reports
                          </span>
                        </div>
                      ) : null;
                    })()}
                    {t.supervisor_rejection_reason && (
                      <div style={{ marginTop: 6, fontSize: 12, color: 'var(--red-d)', background: 'var(--red-l)', padding: '4px 10px', borderRadius: 7, border: '1px solid var(--red)', display: 'inline-block' }}>
                        ⚠ Rejected: {t.supervisor_rejection_reason}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12, flexWrap: 'wrap' }}>
                    <Btn size="sm" variant="ghost" onClick={() => setViewTask(t)}>Details</Btn>
                    {canHodAssign && <Btn size="sm" variant="primary" onClick={() => openAssign(t, 'regional_coordinator')}>Assign Unit Leader</Btn>}
                    {canLeaderAssign && <Btn size="sm" variant="primary" onClick={() => openAssign(t, 'leader')}>Assign Techs</Btn>}
                    {canSupervisorApprove && (
                      <>
                        <Btn size="sm" variant="success" onClick={() => handleApprove(t.id)}>✓ Approve</Btn>
                        <Btn size="sm" variant="danger" onClick={() => setShowRejectModal(t.id)}>✕ Reject</Btn>
                      </>
                    )}
                    {canComplete && <Btn size="sm" variant="success" onClick={() => completeTask(t.id)}>✓ Complete</Btn>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {hod && <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Avatar initials={hod.avatar} size={24} /><span style={{ fontSize: 12, color: 'var(--text3)' }}>RC: {hod.name.split(' ')[0]}</span></div>}
                  {leader && <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Avatar initials={leader.avatar} color="var(--cyan)" size={24} /><span style={{ fontSize: 12, color: 'var(--cyan)' }}>Leader: {leader.name.split(' ')[0]}</span></div>}
                  {techs.slice(0, 3).map(u => <Avatar key={u.id} initials={u.avatar} color="var(--green)" size={24} />)}
                  {techs.length > 3 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>+{techs.length - 3}</span>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Detail Modal */}
      {viewTask && (() => {
        const site = SITES.find(s => s.id === viewTask.site_id);
        const leader = users.find(u => u.id === viewTask.leader_id);
        const hod = users.find(u => u.id === viewTask.hod_id);
        const techs = (viewTask.technician_ids || []).map(id => users.find(u => u.id === id)).filter(Boolean);
        const reporter = users.find(u => u.id === viewTask.reporter_id);
        const teamLeader = users.find(u => u.id === viewTask.team_leader_id);
        const canHodAssign = role === 'regional_coordinator' && (viewTask.workflow_stage === 'ceo_created' || viewTask.workflow_stage === 'hod_created') && viewTask.dept === currentUser.dept;
        const canLeaderAssign = role === 'unit_leader' && viewTask.workflow_stage === 'leader_assigned' && viewTask.leader_id === currentUser.id;
        const canDesignateReporter = (role === 'unit_leader' || role === 'regional_coordinator') && techs.length > 1 && (viewTask.leader_id === currentUser.id || viewTask.hod_id === currentUser.id);
        const canSupervisorApprove = role === 'regional_coordinator' && viewTask.workflow_stage === 'supervisor_approval_pending' && viewTask.hod_id === currentUser.id;
        return (
          <Modal open={true} onClose={() => setViewTask(null)} title={viewTask.title} maxWidth={640}>
            <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
              <Badge status={viewTask.workflow_stage} />
              <Badge status={viewTask.priority} />
              {viewTask.site_id && <span style={{ fontSize: 12, background: 'var(--bg3)', padding: '3px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>📍 {site?.name}</span>}
            </div>
            {viewTask.supervisor_rejection_reason && (
              <AlertBanner type="error">⚠ Rejected by RC: {viewTask.supervisor_rejection_reason}</AlertBanner>
            )}
            {viewTask.workflow_stage === 'supervisor_approval_pending' && (
              <AlertBanner type="warning">⏳ Technicians have been assigned by HoU and are awaiting your approval before they are notified.</AlertBanner>
            )}
            <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.8, marginBottom: '1rem' }}>{viewTask.description}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              {[['📅 Start', viewTask.start_date], ['📅 End', viewTask.end_date], ['📋 Reports', viewTask.report_schedule + ' by ' + viewTask.report_time], ['🏢 Dept', viewTask.dept + ' Unit']].map(([l, v]) => (
                <div key={l} style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 9 }}>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>{l}</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
            <SectionTitle>Team</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1rem' }}>
              {hod && <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 12px', background: 'var(--purple-l)', borderRadius: 9, fontSize: 13 }}><Avatar initials={hod.avatar} color="var(--purple)" size={30} /><div><div style={{ fontWeight: 600 }}>{hod.name}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>Regional Coordinator</div></div></div>}
              {leader && <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 12px', background: 'var(--cyan-l)', borderRadius: 9, fontSize: 13 }}><Avatar initials={leader.avatar} color="var(--cyan)" size={30} /><div><div style={{ fontWeight: 600 }}>{leader.name}</div><div style={{ fontSize: 11, color: 'var(--cyan)' }}>Unit Leader</div></div></div>}
              {techs.map(u => (
                <div key={u.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '9px 12px', background: 'var(--green-l)', borderRadius: 9, fontSize: 13 }}>
                  <Avatar initials={u.avatar} color="var(--green)" size={30} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                      {u.name}
                      {viewTask.team_leader_id === u.id && <span style={{ fontSize: 10, background: 'var(--primary)', color: '#fff', padding: '1px 7px', borderRadius: 6, marginLeft: 8, fontWeight: 700 }}>TEAM LEADER</span>}
                      {viewTask.reporter_id === u.id && viewTask.team_leader_id !== u.id && <span style={{ fontSize: 10, background: 'var(--primary-l)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 6, marginLeft: 8, fontWeight: 700 }}>REPORTER</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>Technician</div>
                  </div>
                  {canDesignateReporter && (
                    <button onClick={() => designateReporter(viewTask.id, u.id)} style={{ padding: '4px 10px', borderRadius: 7, fontSize: 11, background: viewTask.team_leader_id === u.id ? 'var(--primary)' : 'var(--bg3)', color: viewTask.team_leader_id === u.id ? '#fff' : 'var(--text3)', border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600 }}>
                      {viewTask.team_leader_id === u.id ? '★ Leader' : 'Set as Leader'}
                    </button>
                  )}
                  {role === 'unit_leader' && viewTask.workflow_stage === 'technicians_assigned' && viewTask.leader_id === currentUser.id && <button onClick={() => cancelTechnicianFromTask(viewTask.id, u.id)} style={{ padding: '4px 8px', borderRadius: 7, fontSize: 11, background: 'var(--red-l)', color: 'var(--red)', border: '1px solid var(--red)', cursor: 'pointer', fontFamily: 'var(--font)', fontWeight: 600 }}>Remove</button>}
                </div>
              ))}
              {techs.length > 1 && (
                <div style={{ fontSize: 12, color: 'var(--text3)', padding: '6px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                  💡 {teamLeader ? `${teamLeader.name.split(' ')[0]} is the designated team leader and reporter. Other technicians can check-in/out and submit requisitions.` : 'No team leader set yet. The HoU or Supervisor can designate a team leader.'}
                </div>
              )}
              {techs.length === 0 && <div style={{ padding: '12px', background: 'var(--bg3)', borderRadius: 9, fontSize: 13, color: 'var(--text3)' }}>No technicians assigned yet.</div>}
            </div>
            {viewTask.hod_notes && <div style={{ padding: '10px 14px', background: 'var(--bg3)', borderRadius: 9, marginBottom: 8, fontSize: 13 }}>📝 RC: {viewTask.hod_notes}</div>}
            {viewTask.leader_notes && <div style={{ padding: '10px 14px', background: 'var(--cyan-l)', borderRadius: 9, fontSize: 13, color: 'var(--cyan-d)' }}>📝 Leader: {viewTask.leader_notes}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: '1rem', flexWrap: 'wrap' }}>
              {canHodAssign && <Btn variant="primary" onClick={() => { setViewTask(null); openAssign(viewTask, 'regional_coordinator'); }}>Assign Unit Leader</Btn>}
              {canLeaderAssign && <Btn variant="primary" onClick={() => { setViewTask(null); openAssign(viewTask, 'leader'); }}>Assign Technicians</Btn>}
              {canSupervisorApprove && (
                <>
                  <Btn variant="success" onClick={() => handleApprove(viewTask.id)}>✓ Approve Assignment</Btn>
                  <Btn variant="danger" onClick={() => { setViewTask(null); setShowRejectModal(viewTask.id); }}>✕ Reject & Send Back</Btn>
                </>
              )}
            </div>
          </Modal>
        );
      })()}

      {/* Assign HoU Modal */}
      {assignModal && assignType === 'regional_coordinator' && (
        <Modal open={true} onClose={() => setAssignModal(null)} title={`Assign HoU — ${assignModal.title}`} maxWidth={480}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Select HoU *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deptLeaders(assignModal.dept).map(l => (
                <div key={l.id} onClick={() => setLeaderId(String(l.id))} style={{ padding: '12px 14px', borderRadius: 10, border: `2px solid ${leaderId === String(l.id) ? 'var(--primary)' : 'var(--border)'}`, background: leaderId === String(l.id) ? 'var(--primary-l)' : 'var(--bg3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar initials={l.avatar} color="var(--cyan)" size={34} />
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{l.dept} · {l.email}</div></div>
                  {leaderId === String(l.id) && <span style={{ marginLeft: 'auto', color: 'var(--primary)', fontWeight: 700 }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
          <Textarea label="Notes for Leader (optional)" value={hodNotes} onChange={e => setHodNotes(e.target.value)} placeholder="Briefing notes, site access, priorities..." />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setAssignModal(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleHodAssign} disabled={!leaderId}>Assign Unit Leader</Btn>
          </div>
        </Modal>
      )}

      {/* Assign Technicians Modal */}
      {assignModal && assignType === 'leader' && (
        <Modal open={true} onClose={() => setAssignModal(null)} title={`Assign Technicians — ${assignModal.title}`} maxWidth={560}>
          <div style={{ padding: '10px 14px', background: '#FEF3C7', border: '1.5px solid #D97706', borderRadius: 9, marginBottom: '1rem', fontSize: 13, color: '#92400E', fontWeight: 600 }}>
            ℹ️ After assigning technicians, a supervisor approval request will be sent. Technicians will only be notified once the supervisor approves.
          </div>
          {techIds.some(id => {
            const activeTasks = tasks.filter(t => (t.technician_ids || []).includes(id) && t.workflow_stage === 'technicians_assigned' && t.id !== assignModal.id);
            return activeTasks.length > 0;
          }) && (
              <div style={{ padding: '10px 14px', background: 'var(--amber-l)', border: '1.5px solid var(--amber)', borderRadius: 9, marginBottom: '1rem', fontSize: 13, color: 'var(--amber-d)', fontWeight: 600 }}>
                ⚠ Warning: One or more selected technicians are already working on active tasks.
              </div>
            )}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8 }}>Select Technicians *</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {deptTechs(assignModal.dept).map(t => {
                const checked = techIds.includes(t.id);
                const activeTasks = tasks.filter(tk => (tk.technician_ids || []).includes(t.id) && tk.workflow_stage === 'technicians_assigned' && tk.id !== assignModal.id);
                const isWorking = activeTasks.length > 0;
                return (
                  <div key={t.id} onClick={() => toggleTech(t.id)} style={{ padding: '10px 14px', borderRadius: 10, border: `2px solid ${checked ? 'var(--primary)' : 'var(--border)'}`, background: checked ? 'var(--primary-l)' : 'var(--bg3)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={t.avatar} color={isWorking ? 'var(--amber)' : 'var(--green)'} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                        {t.name}
                        {isWorking
                          ? <span style={{ fontSize: 10, background: 'var(--amber-l)', color: 'var(--amber-d)', padding: '2px 7px', borderRadius: 6, fontWeight: 700, border: '1px solid var(--amber)' }}>🔧 WORKING ({activeTasks.length} task{activeTasks.length > 1 ? 's' : ''})</span>
                          : <span style={{ fontSize: 10, background: 'var(--green-l)', color: 'var(--green-d)', padding: '2px 7px', borderRadius: 6, fontWeight: 700, border: '1px solid var(--green)' }}>✓ FREE</span>
                        }
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{t.email}</div>
                    </div>
                    {checked && <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: 16 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
          {techIds.length > 1 && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Designate Team Leader / Reporter *</label>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>For multi-technician tasks, one person must be the team leader who submits reports. Others can check-in/out and request requisitions.</div>
              <select value={teamLeaderId} onChange={e => setTeamLeaderId(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14, color: 'var(--text)' }}>
                <option value="">— Select team leader —</option>
                {techIds.map(id => {
                  const u = users.find(x => x.id === id);
                  return u ? <option key={u.id} value={u.id}>{u.name}</option> : null;
                })}
              </select>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Report Schedule</label>
              <select value={reportSchedule} onChange={e => setReportSchedule(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14 }}>
                <option value="daily">Daily</option><option value="once">Once</option><option value="weekly">Weekly</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Report Deadline</label>
              <select value={reportTime} onChange={e => setReportTime(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14 }}>
                {['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <Textarea label="Notes for Technicians (optional)" value={leaderNotes} onChange={e => setLeaderNotes(e.target.value)} placeholder="Instructions, safety notes, site access..." />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setAssignModal(null)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleLeaderAssign} disabled={techIds.length === 0 || (techIds.length > 1 && !teamLeaderId)}>
              Submit for Supervisor Approval {techIds.length > 0 ? `(${techIds.length} Tech${techIds.length > 1 ? 's' : ''})` : ''}</Btn>
          </div>
        </Modal>
      )}

      {/* Supervisor Reject Modal */}
      <Modal open={!!showRejectModal} onClose={() => setShowRejectModal(null)} title="Reject Technician Assignment" maxWidth={480}>
        <AlertBanner type="warning">The task will be returned to the HoU for re-assignment. Technicians will NOT be notified.</AlertBanner>
        <Textarea label="Rejection Reason *" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why the assignment is rejected (e.g. technicians are unavailable, wrong team selected)..." />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setShowRejectModal(null)}>Cancel</Btn>
          <Btn variant="danger" onClick={handleRejectSubmit} disabled={!rejectReason.trim()}>✕ Reject & Return to HoU</Btn>
        </div>
      </Modal>
    </div>
  );
}
