import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS } from '../data/mockData';
import { Card, PageHeader, Badge, Btn, SectionTitle, EmptyState, Modal, Input, Textarea, Table } from '../components/UI';

// Permission flow: Technician/Staff → Unit Leader (can approve/reject) → Regional Coordinator → CEO

const LEAVE_TYPES = ['Annual Leave', 'Sick Leave', 'Emergency Leave', 'Maternity/Paternity Leave', 'Unpaid Leave', 'Study Leave'];

export default function LeavePage() {
  const { currentUser, leaveRequests, requestLeave, reviewLeave } = useApp();
  const role = currentUser?.role;

  const [showForm, setShowForm] = useState(false);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved');
  const [reviewComment, setReviewComment] = useState('');
  const [form, setForm] = useState({ type: 'Annual Leave', start_date: '', end_date: '', reason: '', evidence: '' });
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const myLeave = ['technician', 'unit_leader', 'staff', 'maximization_officer'].includes(role)
    ? leaveRequests.filter(r => r.user_id === currentUser.id) : [];
  // Sort newest first
  const allLeave = [...leaveRequests].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Who sees pending requests for review
  const pendingForMe = allLeave.filter(r => {
    if (role === 'unit_leader') return r.status === 'pending' && (() => { const u = USERS.find(x => x.id === r.user_id); return u?.dept === currentUser.dept && ['technician', 'staff','store_keeper'].includes(u?.role); })();
    if (role === 'regional_coordinator') return r.status === 'pending' && (() => { const u = USERS.find(x => x.id === r.user_id); return u?.dept === currentUser.dept; })();
    if (['ceo', 'cfo', 'daf'].includes(role)) return r.status === 'pending';
    return false;
  });

  const handleSubmit = () => {
    if (!form.start_date || !form.end_date || !form.reason.trim()) { alert('Please fill all required fields.'); return; }
    requestLeave(form);
    setForm({ type: 'Annual Leave', start_date: '', end_date: '', reason: '', evidence: '' });
    setShowForm(false);
  };

  const handleReview = () => {
    reviewLeave(reviewModal.id, reviewAction, reviewComment);
    setReviewModal(null); setReviewAction('approved'); setReviewComment('');
  };

  const STATUS_COLOR = { pending: 'var(--amber)', approved: 'var(--green)', rejected: 'var(--red)' };

  const renderRow = r => {
    const u = USERS.find(x => x.id === r.user_id);
    const rev = USERS.find(x => x.id === r.reviewed_by);
    const days = r.start_date && r.end_date ? Math.round((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1 : '—';
    const canReview = (role === 'unit_leader' || role === 'regional_coordinator' || role === 'ceo') && r.status === 'pending';
    return [
      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--primary)' }}>{r.id}</span>,
      <div style={{ fontSize: 13 }}>{u?.name || '—'}<div style={{ fontSize: 11, color: 'var(--text3)' }}>{u?.dept} · {u?.role}</div></div>,
      <span style={{ fontSize: 13 }}>{r.type}</span>,
      <div>
        <div style={{ fontSize: 13 }}>{r.start_date} → {r.end_date}</div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{days} day(s)</div>
      </div>,
      <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${STATUS_COLOR[r.status]}20`, color: STATUS_COLOR[r.status] }}>{r.status}</span>,
      <div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(r.created_at).toLocaleDateString('en-RW')}</div>
        {rev && <div style={{ fontSize: 11, color: 'var(--text3)' }}>By {rev.name}</div>}
      </div>,
      <div style={{ display: 'flex', gap: 5 }}>
        {canReview && <Btn size="sm" variant="primary" onClick={() => setReviewModal(r)}>Review</Btn>}
        {!canReview && r.comment && <span style={{ fontSize: 12, color: 'var(--text3)', maxWidth: 120 }}>{r.comment.slice(0, 40)}</span>}
      </div>
    ];
  };

  return (
    <div>
      <PageHeader
        title="🏖 Leave & Permissions"
        subtitle="Staff leave requests and approval workflow"
        action={['technician', 'unit_leader', 'staff', 'maximization_officer'].includes(role) && <Btn variant="primary" onClick={() => setShowForm(true)}>＋ Request Leave</Btn>}
      />

      {/* Info panel */}
      {['technician', 'staff','store_keeper'].includes(role) && (
        <div style={{ padding: '12px 16px', background: 'var(--primary-l)', border: '1.5px solid var(--primary)', borderRadius: 12, marginBottom: '1.5rem', fontSize: 14, color: 'var(--primary)', fontWeight: 600 }}>
          📌 Leave flow: Your request goes to your Unit Leader, then Regional Coordinator. Provide supporting documentation where applicable.
        </div>
      )}
      {role === 'unit_leader' && pendingForMe.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'var(--amber-l)', border: '1.5px solid var(--amber)', borderRadius: 12, marginBottom: '1.5rem', fontSize: 14, color: 'var(--amber-d)', fontWeight: 600 }}>
          ⚠ {pendingForMe.length} leave request(s) from your team awaiting your review.
        </div>
      )}

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Pending', value: allLeave.filter(r => r.status === 'pending').length, color: 'var(--amber)' },
          { label: 'Approved', value: allLeave.filter(r => r.status === 'approved').length, color: 'var(--green)' },
          { label: 'Rejected', value: allLeave.filter(r => r.status === 'rejected').length, color: 'var(--red)' },
        ].map(s => (
          <Card key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</div>
          </Card>
        ))}
      </div>

      {/* My leave */}
      {['technician', 'unit_leader', 'staff', 'maximization_officer'].includes(role) && myLeave.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <SectionTitle>My Leave Requests</SectionTitle>
          <Card style={{ padding: 0 }}>
            <Table headers={['ID', 'Employee', 'Type', 'Period', 'Status', 'Submitted', 'Actions']} rows={[...myLeave].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(renderRow)} />
          </Card>
        </div>
      )}

      {/* All / pending */}
      {['unit_leader', 'regional_coordinator', 'ceo', 'maximization_officer', 'daf'].includes(role) && (
        <div>
          <SectionTitle>{pendingForMe.length > 0 ? `Pending Review (${pendingForMe.length})` : 'All Leave Requests'}</SectionTitle>
          <Card style={{ padding: 0 }}>
            {allLeave.filter(r => {
              if (role === 'unit_leader') { const u = USERS.find(x => x.id === r.user_id); return u?.dept === currentUser.dept; }
              if (role === 'regional_coordinator') { const u = USERS.find(x => x.id === r.user_id); return u?.dept === currentUser.dept; }
              return true;
            }).length === 0
              ? <EmptyState icon="🏖" title="No leave requests" body="No leave requests to display" />
              : <Table headers={['ID', 'Employee', 'Type', 'Period', 'Status', 'Submitted', 'Actions']} rows={allLeave.filter(r => {
                if (role === 'unit_leader') { const u = USERS.find(x => x.id === r.user_id); return u?.dept === currentUser.dept; }
                if (role === 'regional_coordinator') { const u = USERS.find(x => x.id === r.user_id); return u?.dept === currentUser.dept; }
                return true;
              }).map(renderRow)} />
            }
          </Card>
        </div>
      )}

      {/* Submit Form Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Request Leave / Permission" maxWidth={520}>
        <div style={{ padding: '10px 14px', background: 'var(--primary-l)', border: '1px solid var(--primary)', borderRadius: 9, marginBottom: '1rem', fontSize: 13, color: 'var(--primary)', fontWeight: 600 }}>
          📋 Please provide accurate information. Supporting documentation may be required depending on leave type.
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Leave Type *</label>
          <select value={form.type} onChange={e => setF('type', e.target.value)} style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14 }}>
            {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <Input label="Start Date *" type="date" value={form.start_date} onChange={e => setF('start_date', e.target.value)} />
          <Input label="End Date *" type="date" value={form.end_date} onChange={e => setF('end_date', e.target.value)} />
        </div>
        <Textarea label="Reason *" value={form.reason} onChange={e => setF('reason', e.target.value)} placeholder="Clearly explain the reason for your leave or permission request..." />
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>
            Supporting Evidence / Documentation
          </label>
          <textarea value={form.evidence} onChange={e => setF('evidence', e.target.value)}
            placeholder="Describe any supporting documents you have or will provide (e.g. Medical certificate from hospital, School notification letter, Emergency official document, Death certificate for bereavement)..."
            style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, resize: 'vertical', minHeight: 70, boxSizing: 'border-box' }} />
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            💡 Examples: Medical certificate (Sick Leave), School letter (Study Leave), Official emergency notice, Supporting documents help with faster approval.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleSubmit} disabled={!form.start_date || !form.end_date || !form.reason.trim()}>Submit Request</Btn>
        </div>
      </Modal>

      {/* Review Modal */}
      {reviewModal && (
        <Modal open={true} onClose={() => setReviewModal(null)} title={`Review Leave — ${reviewModal.id}`} maxWidth={480}>
          <div style={{ padding: '12px 14px', background: 'var(--bg3)', borderRadius: 10, marginBottom: '1rem' }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{USERS.find(u => u.id === reviewModal.user_id)?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>{reviewModal.type} · {reviewModal.start_date} → {reviewModal.end_date}</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Reason: {reviewModal.reason}</div>
            {reviewModal.evidence && (
              <div style={{ fontSize: 12, marginTop: 8, padding: '8px 12px', background: 'var(--cyan-l)', borderRadius: 8, color: 'var(--cyan-d)', border: '1px solid var(--cyan)' }}>
                📋 <strong>Evidence:</strong> {reviewModal.evidence}
              </div>
            )}
            {!reviewModal.evidence && (
              <div style={{ fontSize: 11, marginTop: 8, color: 'var(--amber-d)', fontStyle: 'italic' }}>⚠ No supporting documentation provided</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
            <button onClick={() => setReviewAction('approved')} style={{ flex: 1, padding: '10px', borderRadius: 9, border: `2px solid ${reviewAction === 'approved' ? 'var(--green)' : 'var(--border)'}`, background: reviewAction === 'approved' ? 'var(--green-l)' : 'var(--bg3)', color: reviewAction === 'approved' ? 'var(--green-d)' : 'var(--text3)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14 }}>✓ Approve</button>
            <button onClick={() => setReviewAction('rejected')} style={{ flex: 1, padding: '10px', borderRadius: 9, border: `2px solid ${reviewAction === 'rejected' ? 'var(--red)' : 'var(--border)'}`, background: reviewAction === 'rejected' ? 'var(--red-l)' : 'var(--bg3)', color: reviewAction === 'rejected' ? 'var(--red-d)' : 'var(--text3)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 14 }}>✕ Reject</button>
          </div>
          <Textarea label="Comment (required for rejection)" value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Add your review comment..." />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setReviewModal(null)}>Cancel</Btn>
            <Btn variant={reviewAction === 'approved' ? 'success' : 'danger'} onClick={handleReview}>Confirm</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
