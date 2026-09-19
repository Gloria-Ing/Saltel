import { createContext, useContext, useState, useMemo } from 'react';
import {
  USERS, DEPARTMENTS, SITES, INITIAL_TASKS, INITIAL_REPORTS, INITIAL_PAYMENTS,
  INITIAL_NOTIFICATIONS, INITIAL_MESSAGES, INITIAL_ANNOUNCEMENTS, INITIAL_TRANSACTIONS,
  INITIAL_SALARIES, INITIAL_REQUISITIONS, INITIAL_LEAVE_REQUESTS, INITIAL_CHECKINS,
  INITIAL_ADVANCE_REQUESTS,
  buildPerformance, calcFees, calcReportScore, BASE_SALARIES,
} from '../data/mockData';

const Ctx = createContext(null);

export function AppProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState(USERS);
  const [departments, setDepartments] = useState(DEPARTMENTS);
  const [sites, setSites] = useState(SITES);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);
  const [notifications, setNotifs] = useState(INITIAL_NOTIFICATIONS);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [announcements, setAnnouncements] = useState(INITIAL_ANNOUNCEMENTS);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [salaries, setSalaries] = useState(INITIAL_SALARIES);
  const [requisitions, setRequisitions] = useState(INITIAL_REQUISITIONS);
  const [leaveRequests, setLeaveRequests] = useState(INITIAL_LEAVE_REQUESTS);
  const [checkins, setCheckins] = useState(INITIAL_CHECKINS);
  const [advanceRequests, setAdvanceRequests] = useState(INITIAL_ADVANCE_REQUESTS);

  const performance = useMemo(() => buildPerformance(tasks, reports, users), [tasks, reports, users]);

  // ── AUTH ─────────────────────────────────────────────────────────────────
  const login = (emailOrId, password) => {
    // Support login by ID (legacy) or by email+password
    if (typeof emailOrId === 'number') {
      setCurrentUser(users.find(u => u.id === emailOrId));
      return true;
    }
    const email = (emailOrId || '').toLowerCase().trim();
    const u = users.find(u => u.email.toLowerCase() === email && u.password === password);
    if (!u) return false;
    setCurrentUser(u);
    return true;
  };
  const logout = () => setCurrentUser(null);

  const updateProfilePic = (userId, picData) => {
    setUsers(p => p.map(u => u.id === userId ? { ...u, profile_pic: picData } : u));
    if (currentUser?.id === userId) setCurrentUser(p => ({ ...p, profile_pic: picData }));
  };

  const updateUserProfile = (userId, updates) => {
    setUsers(p => p.map(u => u.id === userId ? { ...u, ...updates } : u));
    if (currentUser?.id === userId) setCurrentUser(p => ({ ...p, ...updates }));
  };

  // ── CEO PROMOTION ─────────────────────────────────────────────────────────
  const promoteUser = (userId, newRole, newEmail, tempPassword, note) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newSalary = BASE_SALARIES[newRole] || user.salary;
    setUsers(p => p.map(u => u.id === userId ? {
      ...u, role: newRole, email: newEmail, salary: newSalary,
      prev_role: u.role, promoted_at: new Date().toISOString(),
      promotion_note: note || '', temp_password: tempPassword,
      password: tempPassword,
    } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(p => ({ ...p, role: newRole, email: newEmail, salary: newSalary, prev_role: p.role }));
    }
    pushNotif(userId, 'alert',
      `Congratulations! You have been promoted to ${newRole.replace('_', ' ')}. Your new email is ${newEmail} and a temporary password has been shared by the CEO.`,
      '/profile');
    pushNotif(currentUser?.id, 'alert',
      `Promotion confirmed: ${user.name} is now ${newRole.replace('_', ' ')}.`, '/promotions');
  };

  // ── REGISTER USER ─────────────────────────────────────────────────────────
  const registerUser = (form) => {
    const newId = Math.max(...users.map(u => u.id), 0) + 1;
    const newUser = {
      id: newId,
      name: form.name,
      email: form.email,
      username: form.username || form.email.split('@')[0],
      password: form.password || 'saltel',
      role: form.role || 'technician',
      avatar: form.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
      dept: form.dept || currentUser?.dept || null,
      phone: form.phone || '',
      profile_pic: null,
      hire_date: new Date().toISOString().split('T')[0],
      salary: form.salary ? Number(form.salary) : (BASE_SALARIES[form.role] || 320000),
      qualifications: {
        studies: form.studies || '',
        certifications: form.certifications ? form.certifications.split(',').map(s => s.trim()) : [],
        experience: form.experience || '',
        licenses: form.licenses || [],
      },
    };
    setUsers(p => [...p, newUser]);
    return newUser;
  };

  const registrableRoles = () => {
    if (currentUser?.role === 'ceo') return ['technician', 'unit_leader', 'regional_coordinator', 'maximization_officer', 'staff', 'store_keeper', 'cfo', 'cbo', 'dm'];
    if (currentUser?.role === 'regional_coordinator') return ['unit_leader', 'technician', 'staff', 'store_keeper'];
    if (currentUser?.role === 'unit_leader') return ['technician', 'staff'];
    return [];
  };

  const pushNotif = (to, type, message, link = '') =>
    setNotifs(p => [{ id: Date.now() + Math.random(), to_user_id: to, type, message, link, time: 'just now', read: false }, ...p]);

  // ── SALARY ────────────────────────────────────────────────────────────────
  const confirmSalary = (salaryId) => {
    const sal = salaries.find(s => s.id === salaryId);
    setSalaries(p => p.map(s => s.id === salaryId ? { ...s, status: 'confirmed', confirmed_by: currentUser.id, confirmed_at: new Date().toISOString() } : s));
    if (sal) pushNotif(sal.user_id, 'salary', `Your salary for ${sal.month} has been confirmed by DAF. Please sign.`, '/salary');
  };

  const confirmAllSalaries = (month) => {
    const pending = salaries.filter(s => s.month === month && s.status === 'pending');
    setSalaries(p => p.map(s => s.month === month && s.status === 'pending' ? { ...s, status: 'confirmed', confirmed_by: currentUser.id, confirmed_at: new Date().toISOString() } : s));
    pending.forEach(sal => pushNotif(sal.user_id, 'salary', `Your salary for ${sal.month} has been confirmed. Please sign.`, '/salary'));
  };

  const signSalary = (salaryId) => {
    const sal = salaries.find(s => s.id === salaryId);
    setSalaries(p => p.map(s => s.id === salaryId ? { ...s, status: 'signed', signed_by: currentUser.id, signed_at: new Date().toISOString() } : s));
    if (sal) pushNotif(16, 'salary', `${currentUser.name} has signed their salary for ${sal.month}.`, '/salary');
  };

  const updateSalaryBase = (userId, month, newBase, notes) => {
    setSalaries(p => p.map(s =>
      s.user_id === userId && s.month === month
        ? { ...s, base_salary: newBase, net_salary: newBase + (s.bonus || 0), notes: notes || s.notes, status: 'pending', confirmed_by: null, confirmed_at: null, signed_by: null, signed_at: null }
        : s));
  };

  const generateMonthlySalaries = (month, year, quarter) => {
    const existing = salaries.find(s => s.month === month);
    if (existing) return false;
    const newRecords = users.map((user, i) => ({
      id: `SAL-${String(salaries.length + i + 1).padStart(3, '0')}`,
      user_id: user.id, month, year, quarter,
      base_salary: BASE_SALARIES[user.role] || 320000, bonus: 0, bonus_reason: '', bonus_approved_by: null,
      net_salary: BASE_SALARIES[user.role] || 320000, status: 'pending',
      confirmed_by: null, confirmed_at: null, signed_by: null, signed_at: null,
      payment_method: 'Bank Transfer', notes: '',
    }));
    setSalaries(p => [...p, ...newRecords]);
    return true;
  };

  const applyBonus = (userId, month, bonusAmount, bonusReason) => {
    const user = users.find(u => u.id === userId);
    const base = BASE_SALARIES[user?.role] || 320000;
    const maxBonus = Math.round(base * 0.10);
    if (bonusAmount > maxBonus) {
      return { error: `Bonus cannot exceed 10% of base salary. Max: RWF ${maxBonus.toLocaleString()}` };
    }
    setSalaries(p => p.map(s =>
      s.user_id === userId && s.month === month
        ? { ...s, bonus: bonusAmount, bonus_reason: bonusReason, bonus_approved_by: currentUser.id, net_salary: s.base_salary + bonusAmount, status: 'pending', confirmed_by: null, confirmed_at: null, signed_by: null, signed_at: null }
        : s));
    pushNotif(16, 'salary', `CFO added bonus RWF ${bonusAmount.toLocaleString()} to ${users.find(u => u.id === userId)?.name} for ${month}.`, '/salary');
    pushNotif(userId, 'salary', `CFO added a performance bonus of RWF ${bonusAmount.toLocaleString()} to your salary for ${month}.`, '/salary');
    return { success: true };
  };

  // ── TASK MANAGEMENT ───────────────────────────────────────────────────────
  const ceoCreateTask = form => {
    const dept = DEPARTMENTS.find(d => d.id === form.dept);
    const hodId = dept?.hod_id;
    const t = {
      id: `T-${String(tasks.length + 1).padStart(3, '0')}`,
      ...form, site_id: Number(form.site_id),
      workflow_stage: 'ceo_created',
      created_by: currentUser.id, hod_id: hodId || null,
      leader_id: null, technician_ids: [], reporter_id: null, team_leader_id: null,
      created_at: new Date().toISOString(), completed_at: null,
      hod_notes: form.hod_notes || '', leader_notes: '',
      report_schedule: form.report_schedule || 'daily', report_time: form.report_time || '18:00',
      supervisor_rejection_reason: null,
    };
    setTasks(p => [t, ...p]);
    if (hodId) pushNotif(hodId, 'task', `CEO assigned new task to your unit: ${t.title}`, `/tasks/${t.id}`);
    return t;
  };

  const hodAssignLeader = (taskId, leaderId, notes) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(p => p.map(t => t.id === taskId ? { ...t, leader_id: Number(leaderId), workflow_stage: 'leader_assigned', hod_notes: notes || t.hod_notes } : t));
    pushNotif(Number(leaderId), 'task', `Supervisor assigned task to you: ${task?.title}`, `/tasks/${taskId}`);
  };

  const hodCreateTask = form => {
    const t = {
      id: `T-${String(tasks.length + 1).padStart(3, '0')}`,
      ...form, site_id: Number(form.site_id),
      workflow_stage: 'hod_created',
      created_by: currentUser.id, hod_id: currentUser.id,
      leader_id: null, technician_ids: [], reporter_id: null, team_leader_id: null,
      created_at: new Date().toISOString(), completed_at: null,
      hod_notes: form.hod_notes || '', leader_notes: '',
      report_schedule: form.report_schedule || 'daily', report_time: form.report_time || '18:00',
      supervisor_rejection_reason: null,
    };
    setTasks(p => [t, ...p]);
    return t;
  };

  // After HoU assigns technicians → goes to supervisor for approval
  const leaderAssignTechnicians = (taskId, techIds, notes, schedule, reportTime, teamLeaderId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const autoReporter = techIds.length === 1 ? techIds[0] : (teamLeaderId || null);
    const autoTeamLeader = teamLeaderId || (techIds.length === 1 ? techIds[0] : null);
    setTasks(p => p.map(t => t.id === taskId
      ? {
        ...t, technician_ids: techIds, workflow_stage: 'supervisor_approval_pending',
        leader_notes: notes || t.leader_notes, report_schedule: schedule || t.report_schedule,
        report_time: reportTime || t.report_time, reporter_id: autoReporter,
        team_leader_id: autoTeamLeader, supervisor_rejection_reason: null
      }
      : t));
    // Notify supervisor (hod) — NOT technicians yet
    if (task.hod_id) {
      pushNotif(task.hod_id, 'task',
        `HoU assigned technicians to "${task.title}" — awaiting your approval before they are notified.`,
        `/tasks/${taskId}`);
    }
  };

  // Supervisor approves → technicians are notified and can now see the task
  const supervisorApproveAssignment = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setTasks(p => p.map(t => t.id === taskId
      ? { ...t, workflow_stage: 'technicians_assigned', supervisor_rejection_reason: null }
      : t));
    (task.technician_ids || []).forEach(tid =>
      pushNotif(tid, 'task', `Your assignment to "${task.title}" has been confirmed by supervisor. It is now in your working plan.`, `/tasks/${taskId}`)
    );
    if (task.leader_id) {
      pushNotif(task.leader_id, 'task', `Supervisor approved technician assignments for "${task.title}". Technicians are now notified.`, `/tasks/${taskId}`);
    }
  };

  // Supervisor rejects → goes back to HoU for re-assignment
  const supervisorRejectAssignment = (taskId, reason) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setTasks(p => p.map(t => t.id === taskId
      ? { ...t, workflow_stage: 'leader_assigned', technician_ids: [], reporter_id: null, team_leader_id: null, supervisor_rejection_reason: reason || 'Assignment rejected by supervisor.' }
      : t));
    if (task.leader_id) {
      pushNotif(task.leader_id, 'task',
        `Supervisor rejected technician assignments for "${task.title}". Reason: ${reason || 'Please reassign.'}`,
        `/tasks/${taskId}`);
    }
  };

  const cancelTechnicianFromTask = (taskId, techId) => {
    const task = tasks.find(t => t.id === taskId);
    setTasks(p => p.map(t => t.id === taskId
      ? { ...t, technician_ids: (t.technician_ids || []).filter(id => id !== techId), reporter_id: t.reporter_id === techId ? null : t.reporter_id, team_leader_id: t.team_leader_id === techId ? null : t.team_leader_id }
      : t));
    setPayments(p => p.filter(x => !(x.task_id === taskId && x.technician_id === techId && x.status === 'pending')));
    pushNotif(techId, 'task', `You have been removed from task: ${task?.title}`, '/tasks');
  };

  const designateReporter = (taskId, techId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setTasks(p => p.map(t => t.id === taskId ? { ...t, reporter_id: techId ? Number(techId) : null, team_leader_id: techId ? Number(techId) : t.team_leader_id } : t));
    if (techId) {
      pushNotif(Number(techId), 'task', `You have been set as team leader and reporter for: ${task.title}`, `/tasks/${taskId}`);
      (task.technician_ids || []).filter(id => id !== Number(techId)).forEach(id => {
        pushNotif(id, 'task', `${users.find(u => u.id === Number(techId))?.name?.split(' ')[0]} is the team leader for: ${task.title}. You can still check-in/out and submit requisitions.`, `/tasks/${taskId}`);
      });
    }
  };

  const completeTask = taskId =>
    setTasks(p => p.map(t => t.id === taskId ? { ...t, workflow_stage: 'completed', completed_at: new Date().toISOString() } : t));

  // ── CHECK-IN / CHECK-OUT (Live GPS) ──────────────────────────────────────
  const performCheckin = (taskId, lat, lng, address) => {
    const record = {
      id: Date.now(),
      task_id: taskId,
      technician_id: currentUser.id,
      type: 'checkin',
      timestamp: new Date().toISOString(),
      lat, lng, address,
    };
    setCheckins(p => [...p, record]);
    const task = tasks.find(t => t.id === taskId);
    if (task?.hod_id) pushNotif(task.hod_id, 'task', `${currentUser.name} checked in at: ${address}`, '/reports');
    if (task?.leader_id && task.leader_id !== currentUser.id) pushNotif(task.leader_id, 'task', `${currentUser.name} checked in at: ${address}`, '/reports');
    return record;
  };

  const performCheckout = (taskId, lat, lng, address) => {
    const record = {
      id: Date.now(),
      task_id: taskId,
      technician_id: currentUser.id,
      type: 'checkout',
      timestamp: new Date().toISOString(),
      lat, lng, address,
    };
    setCheckins(p => [...p, record]);
    const task = tasks.find(t => t.id === taskId);
    if (task?.hod_id) pushNotif(task.hod_id, 'task', `${currentUser.name} checked out from: ${address}`, '/reports');
    if (task?.leader_id && task.leader_id !== currentUser.id) pushNotif(task.leader_id, 'task', `${currentUser.name} checked out from: ${address}`, '/reports');
    return record;
  };

  const getMyCheckin = (taskId) => {
    const today = new Date().toDateString();
    return checkins.find(c => c.task_id === taskId && c.technician_id === currentUser?.id && c.type === 'checkin' && new Date(c.timestamp).toDateString() === today);
  };

  const getMyCheckout = (taskId) => {
    const today = new Date().toDateString();
    return checkins.find(c => c.task_id === taskId && c.technician_id === currentUser?.id && c.type === 'checkout' && new Date(c.timestamp).toDateString() === today);
  };

  // ── REPORTS ────────────────────────────────────────────────────────────────
  const submitReport = report => {
    const task = tasks.find(t => t.id === report.task_id);
    const score = calcReportScore(new Date().toISOString(), task?.report_time || '18:00', report);
    const r = {
      ...report,
      id: `R-${String(reports.length + 1).padStart(3, '0')}`,
      submitted_at: new Date().toISOString(),
      status: 'pending', approved_by: null, approved_at: null,
      ai_summary: 'AI analysis pending.', score, feedbacks: [],
      late_flagged: false,
    };
    setReports(p => [r, ...p]);
    setTasks(p => p.map(t => t.id === report.task_id ? { ...t, workflow_stage: 'completed', completed_at: new Date().toISOString() } : t));
    if (task?.hod_id) pushNotif(task.hod_id, 'report', `Task completed & report submitted: ${task.title}`, '/reports');
    if (task?.leader_id) pushNotif(task.leader_id, 'report', `Task completed & report submitted: ${task.title}`, '/reports');
  };

  const approveReport = reportId =>
    setReports(p => p.map(r => r.id === reportId ? { ...r, status: 'approved', approved_by: currentUser.id, approved_at: new Date().toISOString() } : r));

  const flagLateReport = (reportId) => {
    setReports(p => p.map(r => r.id === reportId ? { ...r, late_flagged: true, score: Math.max(20, (r.score || 75) - 15) } : r));
    const report = reports.find(r => r.id === reportId);
    if (report) pushNotif(report.technician_id, 'report', `Your report ${reportId} has been flagged as submitted late. Score penalty applied.`, '/reports');
  };

  const addReportFeedback = (reportId, text) => {
    const feedback = { from_user_id: currentUser.id, role: currentUser.role, text, at: new Date().toISOString() };
    setReports(p => p.map(r => r.id === reportId ? { ...r, feedbacks: [...(r.feedbacks || []), feedback] } : r));
    const report = reports.find(r => r.id === reportId);
    if (report) pushNotif(report.technician_id, 'report', `${currentUser.name} gave feedback on your report`, '/reports');
  };

  // ── FEE REQUISITIONS ─────────────────────────────────────────────────────
  const submitRequisition = (req) => {
    const task = tasks.find(t => t.id === req.task_id);
    const total = req.items.reduce((s, i) => s + (i.amount || 0), 0);
    const r = {
      ...req,
      id: `REQ-${String(requisitions.length + 1).padStart(3, '0')}`,
      total,
      status: 'pending',
      leader_id: task?.leader_id || null,
      hod_comment: '',
      created_at: new Date().toISOString(), reviewed_at: null, paid_at: null,
    };
    setRequisitions(p => [r, ...p]);
    if (task?.hod_id) pushNotif(task.hod_id, 'payment', `New fee requisition from ${currentUser.name} for: ${task.title} — awaiting your review`, '/requisitions');
    pushNotif(15, 'payment', `Fee requisition submitted by ${currentUser.name} — pending HoU approval`, '/requisitions');
  };

  const reviewRequisition = (reqId, status, comment) => {
    const req = requisitions.find(r => r.id === reqId);
    setRequisitions(p => p.map(r => r.id === reqId
      ? { ...r, status, hod_comment: comment || '', reviewed_at: new Date().toISOString() }
      : r));
    if (req) {
      if (status === 'approved') {
        pushNotif(req.technician_id, 'payment', `Your requisition ${reqId} has been approved by HoU! Accountant will process payment.`, '/requisitions');
        pushNotif(15, 'payment', `Requisition ${reqId} approved by HoU — please process payment`, '/requisitions');
        pushNotif(16, 'payment', `Requisition ${reqId} approved — RWF ${req.total.toLocaleString()} pending processing`, '/requisitions');
      } else {
        pushNotif(req.technician_id, 'payment', `Your requisition ${reqId} was rejected. ${comment || ''}`, '/requisitions');
      }
    }
  };

  const payRequisition = (reqId) => {
    const req = requisitions.find(r => r.id === reqId);
    setRequisitions(p => p.map(r => r.id === reqId ? { ...r, status: 'paid', paid_at: new Date().toISOString() } : r));
    if (req) pushNotif(req.technician_id, 'payment', `Your fee requisition ${reqId} has been paid — RWF ${req.total.toLocaleString()}`, '/requisitions');
  };

  const bulkPayRequisitions = (reqIds) => {
    setRequisitions(p => p.map(r => reqIds.includes(r.id) && r.status === 'approved'
      ? { ...r, status: 'paid', paid_at: new Date().toISOString() } : r));
    const approved = requisitions.filter(r => reqIds.includes(r.id) && r.status === 'approved');
    approved.forEach(req => pushNotif(req.technician_id, 'payment', `Fee requisition ${req.id} paid — RWF ${req.total.toLocaleString()}`, '/requisitions'));
  };

  // ── LEAVE REQUESTS ────────────────────────────────────────────────────────
  const requestLeave = (req) => {
    const r = {
      ...req,
      id: `LVR-${String(leaveRequests.length + 1).padStart(3, '0')}`,
      user_id: currentUser.id,
      status: 'pending', reviewed_by: null, reviewed_at: null, comment: '',
      created_at: new Date().toISOString(),
    };
    setLeaveRequests(p => [r, ...p]);
    const myTasks = tasks.filter(t => (t.technician_ids || []).includes(currentUser.id) && t.workflow_stage === 'technicians_assigned');
    const leaderId = myTasks[0]?.leader_id || null;
    if (leaderId) pushNotif(leaderId, 'task', `${currentUser.name} requested ${req.type} leave: ${req.start_date} to ${req.end_date}`, '/leave');
    if (currentUser.role === 'unit_leader') {
      const dept = DEPARTMENTS.find(d => d.id === currentUser.dept);
      if (dept?.hod_id) pushNotif(dept.hod_id, 'task', `${currentUser.name} (Unit Leader) requested leave`, '/leave');
    }
  };

  const reviewLeave = (reqId, status, comment) => {
    const req = leaveRequests.find(r => r.id === reqId);
    setLeaveRequests(p => p.map(r => r.id === reqId
      ? { ...r, status, reviewed_by: currentUser.id, reviewed_at: new Date().toISOString(), comment: comment || '' }
      : r));
    if (req) {
      pushNotif(req.user_id, 'task',
        status === 'approved' ? `Your leave request (${req.type}) has been approved.` : `Your leave request was rejected. ${comment || ''}`,
        '/leave');
    }
  };

  // ── PAYMENTS ──────────────────────────────────────────────────────────────
  const processPayment = paymentId => {
    const pay = payments.find(p => p.id === paymentId);
    const txnId = `TXN-${String(transactions.length + 1).padStart(3, '0')}`;
    const tech = users.find(u => u.id === pay?.technician_id);
    setPayments(p => p.map(x => x.id === paymentId ? { ...x, status: 'paid', paid_at: new Date().toISOString(), ref: `MM${Date.now()}`, disputed: false } : x));
    if (pay) {
      pushNotif(pay.technician_id, 'payment', `Payment confirmed — ${pay.total.toLocaleString()} RWF`, '/payments');
      setTransactions(p => [{ id: txnId, date: new Date().toISOString().split('T')[0], type: 'payment', description: `Payment: ${tech?.name || 'Unknown'} — ${paymentId}`, amount: pay.total, payment_id: paymentId, technician_id: pay.technician_id }, ...p]);
    }
  };

  const raiseDispute = (paymentId, reason, target = 'accountant') => {
    setPayments(p => p.map(x => x.id === paymentId ? { ...x, disputed: true, dispute_reason: reason, dispute_status: 'open', dispute_target: target } : x));
    pushNotif(15, 'payment', `Dispute raised on ${paymentId}: ${reason}`, '/payments');
  };

  const resolveDispute = paymentId => {
    const pay = payments.find(p => p.id === paymentId);
    setPayments(p => p.map(x => x.id === paymentId ? { ...x, dispute_status: 'resolved' } : x));
    if (pay) pushNotif(pay.technician_id, 'payment', `Dispute on ${paymentId} resolved.`, '/payments');
  };

  const createAnnouncement = ann => {
    setAnnouncements(p => [{ id: `ANN-${p.length + 1}`, from_user_id: currentUser.id, ...ann, created_at: new Date().toISOString() }, ...p]);
  };

  const sendMessage = (toId, text) => {
    const m = { id: Date.now(), from: currentUser.id, to: toId, text, time: new Date().toISOString(), read: false };
    setMessages(p => [...p, m]);
    pushNotif(toId, 'message', `New message from ${currentUser.name}`, '/chat');
  };

  const markMessagesRead = withId => setMessages(p => p.map(m => m.from === withId && m.to === currentUser?.id ? { ...m, read: true } : m));

  const myNotifs = currentUser ? [...notifications.filter(n => n.to_user_id === currentUser.id)].sort((a, b) => (b.id > a.id ? 1 : -1)) : [];
  const unreadCount = myNotifs.filter(n => !n.read).length;
  const markAllRead = () => setNotifs(p => p.map(n => n.to_user_id === currentUser?.id ? { ...n, read: true } : n));
  const markOneRead = id => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const unreadMessages = currentUser ? messages.filter(m => m.to === currentUser.id && !m.read).length : 0;

  const myAnnouncements = currentUser ? announcements.filter(a => {
    if (a.target === 'all') return true;
    if (a.target === currentUser.role) return !a.target_dept || a.target_dept === currentUser.dept;
    return false;
  }) : [];

  const getTodayMissing = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.workflow_stage !== 'technicians_assigned') return [];
    const today = new Date().toDateString();
    const reported = reports.filter(r => r.task_id === taskId && new Date(r.submitted_at).toDateString() === today).map(r => r.technician_id);
    return (task.technician_ids || []).filter(id => !reported.includes(id));
  };

  // ── SITE & DEPARTMENT MANAGEMENT ─────────────────────────────────────────
  const registerDepartment = (form) => {
    setDepartments(p => [...p, {
      id: form.id,
      label: form.id + ' Unit',
      color: form.color || '#6366F1',
      hod_id: null,
      leader_id: null,
    }]);
  };

  const registerSiteGlobal = (form) => {
    const newId = Math.max(...sites.map(s => s.id), 0) + 1;
    const newSite = {
      id: newId,
      name: form.name,
      location: form.location,
      province: form.province,
      type: form.type || 'Corporate',
      rural: form.rural || false,
      lat: Number(form.lat) || -1.9441,
      lng: Number(form.lng) || 30.0619,
    };
    setSites(p => [...p, newSite]);
    return newSite;
  };

  const registerSupervisor = (form) => {
    const newUser = registerUser({ ...form, role: 'regional_coordinator' });
    if (form.dept) {
      setDepartments(p => p.map(d => d.id === form.dept ? { ...d, hod_id: newUser.id } : d));
    }
    return newUser;
  };

  const deleteUserById = (userId) => {
    if (userId === currentUser?.id) return;
    setUsers(p => p.filter(u => u.id !== userId));
    pushNotif(currentUser?.id, 'alert', `User removed from system.`, '/team');
  };

  const changeUserRole = (userId, newRole, newDept) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newSalary = BASE_SALARIES[newRole] || user.salary;
    setUsers(p => p.map(u => u.id === userId ? { ...u, role: newRole, dept: newDept || u.dept, salary: newSalary } : u));
    pushNotif(userId, 'alert', `Your role has been updated to ${newRole.replace('_', ' ')} by management.`, '/profile');
  };

  // ── ADVANCE REQUESTS ─────────────────────────────────────────────────────
  const requestAdvance = (req) => {
    const r = {
      ...req,
      id: `ADV-${String(advanceRequests.length + 1).padStart(3, '0')}`,
      user_id: currentUser.id,
      status: 'pending',
      reviewed_by: null, reviewed_at: null, comment: '',
      created_at: new Date().toISOString(),
    };
    setAdvanceRequests(p => [r, ...p]);
    pushNotif(16, 'payment', `Advance request from ${currentUser.name} — RWF ${req.amount.toLocaleString()}`, '/salary');
    pushNotif(1, 'payment', `Advance request pending: ${currentUser.name} — RWF ${req.amount.toLocaleString()}`, '/salary');
  };

  const reviewAdvance = (advId, status, comment) => {
    const adv = advanceRequests.find(r => r.id === advId);
    setAdvanceRequests(p => p.map(r => r.id === advId
      ? { ...r, status, reviewed_by: currentUser.id, reviewed_at: new Date().toISOString(), comment: comment || '' }
      : r));
    if (adv) {
      pushNotif(adv.user_id, 'payment',
        status === 'approved'
          ? `Your advance request ${advId} was approved — RWF ${adv.amount.toLocaleString()}`
          : `Your advance request ${advId} was rejected. ${comment || ''}`,
        '/salary');
    }
  };

  return (
    <Ctx.Provider value={{
      currentUser, login, logout,
      users, tasks, reports, payments, performance, transactions,
      salaries, requisitions, leaveRequests,
      checkins, performCheckin, performCheckout, getMyCheckin, getMyCheckout,
      notifications: myNotifs, unreadCount, markAllRead, markOneRead,
      unreadMessages, messages, sendMessage, markMessagesRead,
      announcements, myAnnouncements, createAnnouncement,
      ceoCreateTask, hodCreateTask, hodAssignLeader,
      leaderAssignTechnicians, completeTask, designateReporter,
      cancelTechnicianFromTask,
      supervisorApproveAssignment, supervisorRejectAssignment,
      submitReport, approveReport, addReportFeedback, flagLateReport,
      processPayment, raiseDispute, resolveDispute,
      getTodayMissing,
      updateProfilePic, updateUserProfile, registerUser, registrableRoles,
      confirmSalary, confirmAllSalaries, signSalary,
      updateSalaryBase, generateMonthlySalaries, applyBonus,
      submitRequisition, reviewRequisition, payRequisition, bulkPayRequisitions,
      requestLeave, reviewLeave,
      advanceRequests, requestAdvance, reviewAdvance,
      promoteUser,
      departments, registerDepartment,
      sites, registerSiteGlobal, registerSupervisor,
      deleteUserById, changeUserRole,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export const useApp = () => useContext(Ctx);
