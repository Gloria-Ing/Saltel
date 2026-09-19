import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS, FMT_RWF, BASE_SALARIES } from '../data/mockData';
import { Card, PageHeader, Badge, Btn, SectionTitle, EmptyState, Modal, Input, Avatar, Table } from '../components/UI';
import { exportSalariesCSV } from '../utils/exportUtils';

export default function SalaryPage() {
  const { currentUser, salaries, users, confirmSalary, confirmAllSalaries, signSalary, applyBonus,
    generateMonthlySalaries, updateSalaryBase, advanceRequests, requestAdvance, reviewAdvance } = useApp();
  const role = currentUser?.role;

  const [monthFilter, setMonthFilter] = useState('');
  const [activeTab, setActiveTab] = useState('salary'); // salary | advance
  const [bonusModal, setBonusModal] = useState(null);
  const [bonusAmt, setBonusAmt] = useState('');
  const [bonusReason, setBonusReason] = useState('');
  const [bonusError, setBonusError] = useState('');
  const [genModal, setGenModal] = useState(false);
  const [genMonth, setGenMonth] = useState('2026-05');
  const [genYear, setGenYear] = useState(2026);
  const [genQuarter, setGenQuarter] = useState('Q2');
  const [advanceModal, setAdvanceModal] = useState(false);
  const [advForm, setAdvForm] = useState({ amount: '', reason: '', urgency: 'urgent' });
  const [advReviewModal, setAdvReviewModal] = useState(null);
  const [advReviewAction, setAdvReviewAction] = useState('approved');
  const [advReviewComment, setAdvReviewComment] = useState('');

  const availableMonths = [...new Set(salaries.map(s => s.month))].sort((a, b) => b.localeCompare(a));
  const selectedMonth = monthFilter || availableMonths[0] || '';
  const monthSalaries = salaries.filter(s => s.month === selectedMonth);

  const mySalaries = [...salaries].sort((a, b) => b.month.localeCompare(a.month))
    .filter(s => {
      if (['technician', 'unit_leader', 'maximization_officer', 'regional_coordinator', 'staff','store_keeper'].includes(role)) return s.user_id === currentUser.id;
      return true;
    });

  const totals = {
    base: monthSalaries.reduce((s, x) => s + x.base_salary, 0),
    bonus: monthSalaries.reduce((s, x) => s + x.bonus, 0),
    net: monthSalaries.reduce((s, x) => s + x.net_salary, 0),
    pending: monthSalaries.filter(s => s.status === 'pending').length,
    confirmed: monthSalaries.filter(s => s.status === 'confirmed').length,
    signed: monthSalaries.filter(s => s.status === 'signed').length,
  };

  const handleBonus = () => {
    setBonusError('');
    if (!bonusAmt || !bonusReason.trim()) { setBonusError('Enter bonus amount and reason.'); return; }
    const base = BASE_SALARIES[users.find(u => u.id === bonusModal.user_id)?.role] || 320000;
    const maxBonus = Math.round(base * 0.10);
    if (Number(bonusAmt) > maxBonus) {
      setBonusError(`Bonus cannot exceed 10% of base salary. Maximum allowed: ${FMT_RWF(maxBonus)}`);
      return;
    }
    const result = applyBonus(bonusModal.user_id, bonusModal.month, Number(bonusAmt), bonusReason);
    if (result?.error) { setBonusError(result.error); return; }
    setBonusModal(null); setBonusAmt(''); setBonusReason(''); setBonusError('');
  };

  const handleAdvanceSubmit = () => {
    if (!advForm.amount || !advForm.reason.trim()) { alert('Enter amount and reason.'); return; }
    requestAdvance({ amount: Number(advForm.amount), reason: advForm.reason, urgency: advForm.urgency });
    setAdvForm({ amount: '', reason: '', urgency: 'urgent' });
    setAdvanceModal(false);
  };

  const handleAdvReview = () => {
    reviewAdvance(advReviewModal.id, advReviewAction, advReviewComment);
    setAdvReviewModal(null); setAdvReviewAction('approved'); setAdvReviewComment('');
  };

  const STATUS_COLOR = { pending: 'var(--amber)', confirmed: 'var(--cyan)', signed: 'var(--green)' };
  const ADV_COLOR = { pending: 'var(--amber)', approved: 'var(--green)', rejected: 'var(--red)' };

  const isMyOwnSalaryPage = ['technician', 'unit_leader', 'maximization_officer', 'regional_coordinator', 'staff','store_keeper'].includes(role);
  const myAdvanceRequests = advanceRequests ? advanceRequests.filter(r => r.user_id === currentUser.id) : [];
  const allPendingAdvances = advanceRequests ? advanceRequests.filter(r => r.status === 'pending') : [];
  const canReviewAdvances = ['ceo', 'cfo', 'daf'].includes(role);

  if (isMyOwnSalaryPage) {
    const mySal = mySalaries.filter(s => s.user_id === currentUser.id);
    return (
      <div>
        <PageHeader title="💰 My Salary & Advances" subtitle="Your salary records, payment status, and advance requests"
          action={<Btn variant="primary" onClick={() => setAdvanceModal(true)}>＋ Request Advance</Btn>} />

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, marginBottom: '1.5rem', width: 'fit-content' }}>
          {[{ k: 'salary', l: '💰 Salary' }, { k: 'advance', l: '💸 Advance Requests' }].map(t => (
            <button key={t.k} onClick={() => setActiveTab(t.k)}
              style={{
                padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font)',
                background: activeTab === t.k ? 'linear-gradient(135deg,#169BD5,#0D8EC8)' : 'transparent',
                color: activeTab === t.k ? '#fff' : 'var(--text3)', transition: 'all .15s'
              }}>
              {t.l}
            </button>
          ))}
        </div>

        {activeTab === 'salary' && (<>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Latest Net Salary', value: FMT_RWF(mySal[0]?.net_salary || 0), color: 'var(--green)' },
              { label: 'Latest Bonus', value: FMT_RWF(mySal[0]?.bonus || 0), color: 'var(--primary)' },
              { label: 'Base Salary', value: FMT_RWF(mySal[0]?.base_salary || 0), color: 'var(--cyan)' },
            ].map(s => (
              <Card key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</div>
              </Card>
            ))}
          </div>
          <Card style={{ padding: 0 }}>
            <Table
              headers={['Month', 'Base Salary', 'Bonus', 'Net Salary', 'Status', 'Action']}
              rows={mySal.map(s => [
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{s.month}</span>,
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{FMT_RWF(s.base_salary)}</span>,
                <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: s.bonus > 0 ? 'var(--green-d)' : 'var(--text3)' }}>{s.bonus > 0 ? `+${FMT_RWF(s.bonus)}` : '—'}</span>,
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 15, color: 'var(--primary)' }}>{FMT_RWF(s.net_salary)}</span>,
                <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${STATUS_COLOR[s.status]}20`, color: STATUS_COLOR[s.status] }}>{s.status}</span>,
                s.status === 'confirmed'
                  ? <Btn size="sm" variant="success" onClick={() => signSalary(s.id)}>✍ Sign</Btn>
                  : <span style={{ fontSize: 12, color: 'var(--text3)' }}>{s.status === 'signed' ? '✓ Signed' : 'Awaiting DAF'}</span>
              ])}
            />
          </Card>
        </>)}

        {activeTab === 'advance' && (<>
          <div style={{ padding: '12px 16px', background: 'var(--amber-l)', border: '1.5px solid var(--amber)', borderRadius: 12, marginBottom: '1.5rem', fontSize: 13, color: 'var(--amber-d)', fontWeight: 600 }}>
            💡 Advance requests are for urgent financial needs before your salary date. Requires DAF/CFO approval.
          </div>
          {myAdvanceRequests.length === 0
            ? <EmptyState icon="💸" title="No advance requests" body="Submit a request when you have an urgent financial need" />
            : <Card style={{ padding: 0 }}>
              <Table headers={['ID', 'Amount', 'Reason', 'Urgency', 'Status', 'Date', 'Comment']}
                rows={myAdvanceRequests.map(r => [
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--primary)' }}>{r.id}</span>,
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--green-d)' }}>{FMT_RWF(r.amount)}</span>,
                  <span style={{ fontSize: 12 }}>{r.reason}</span>,
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--amber-l)', color: 'var(--amber-d)', fontWeight: 600 }}>{r.urgency}</span>,
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${ADV_COLOR[r.status]}20`, color: ADV_COLOR[r.status] }}>{r.status}</span>,
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(r.created_at).toLocaleDateString('en-RW')}</span>,
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{r.comment || '—'}</span>,
                ])}
              />
            </Card>
          }
        </>)}

        {/* Advance Request Modal */}
        <Modal open={advanceModal} onClose={() => setAdvanceModal(false)} title="💸 Request Salary Advance" maxWidth={460}>
          <div style={{ padding: '10px 14px', background: 'var(--amber-l)', border: '1px solid var(--amber)', borderRadius: 9, marginBottom: '1rem', fontSize: 13, color: 'var(--amber-d)', fontWeight: 600 }}>
            ⚠ Advance requests must be for urgent, genuine financial needs. Approval is at the discretion of DAF/CFO.
          </div>
          <Input label="Amount Requested (RWF) *" type="number" value={advForm.amount} onChange={e => setAdvForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 50000" />
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Reason / Justification *</label>
            <textarea value={advForm.reason} onChange={e => setAdvForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="Explain the urgent financial need clearly..."
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 13, resize: 'vertical', minHeight: 80, boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 5 }}>Urgency Level</label>
            <select value={advForm.urgency} onChange={e => setAdvForm(p => ({ ...p, urgency: e.target.value }))}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg3)', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14, color: 'var(--text)' }}>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setAdvanceModal(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={handleAdvanceSubmit} disabled={!advForm.amount || !advForm.reason.trim()}>Submit Request</Btn>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="💰 Salary Management"
        subtitle={role === 'daf' ? 'Confirm and manage all staff salaries' : role === 'cfo' ? 'CFO — Salary & Bonus Administration' : 'Salary overview'}
        action={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['daf', 'cfo'].includes(role) && <Btn variant="ghost" onClick={() => exportSalariesCSV(monthSalaries, users)}>⬇ Export CSV</Btn>}
            {['ceo', 'daf', 'cfo'].includes(role) && <Btn variant="ghost" onClick={() => setGenModal(true)}>＋ Generate Month</Btn>}
            {role === 'daf' && selectedMonth && monthSalaries.some(s => s.status === 'pending') && (
              <Btn variant="primary" onClick={() => confirmAllSalaries(selectedMonth)}>✓ Confirm All Pending</Btn>
            )}
            {canReviewAdvances && allPendingAdvances.length > 0 && (
              <Btn variant="danger" onClick={() => setActiveTab('advances')}>
                💸 {allPendingAdvances.length} Advance{allPendingAdvances.length > 1 ? 's' : ''}
              </Btn>
            )}
          </div>
        }
      />

      {/* Tab switcher for management */}
      <div style={{ display: 'flex', gap: 0, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: 4, marginBottom: '1.5rem', width: 'fit-content' }}>
        {[{ k: 'salary', l: '💰 Salaries' }, { k: 'advances', l: `💸 Advances${allPendingAdvances.length > 0 ? ` (${allPendingAdvances.length})` : ''}` }].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)}
            style={{
              padding: '8px 20px', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'var(--font)',
              background: activeTab === t.k ? 'linear-gradient(135deg,#169BD5,#0D8EC8)' : 'transparent',
              color: activeTab === t.k ? '#fff' : 'var(--text3)', transition: 'all .15s'
            }}>
            {t.l}
          </button>
        ))}
      </div>

      {activeTab === 'advances' && (
        <div>
          <SectionTitle>💸 Advance Requests</SectionTitle>
          {!advanceRequests || advanceRequests.length === 0
            ? <EmptyState icon="💸" title="No advance requests" body="No advance requests submitted yet" />
            : <Card style={{ padding: 0 }}>
              <Table headers={['ID', 'Employee', 'Amount', 'Reason', 'Urgency', 'Status', 'Date', 'Actions']}
                rows={[...(advanceRequests || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).map(r => {
                  const u = users.find(x => x.id === r.user_id);
                  const canAct = canReviewAdvances && r.status === 'pending';
                  return [
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--primary)' }}>{r.id}</span>,
                    <div style={{ fontSize: 13 }}><div style={{ fontWeight: 600 }}>{u?.name || '—'}</div><div style={{ fontSize: 11, color: 'var(--text3)' }}>{u?.role}</div></div>,
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--green-d)' }}>{FMT_RWF(r.amount)}</span>,
                    <span style={{ fontSize: 12, maxWidth: 160, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</span>,
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: 'var(--amber-l)', color: 'var(--amber-d)', fontWeight: 600 }}>{r.urgency}</span>,
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${ADV_COLOR[r.status]}20`, color: ADV_COLOR[r.status] }}>{r.status}</span>,
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{new Date(r.created_at).toLocaleDateString('en-RW')}</span>,
                    <div style={{ display: 'flex', gap: 4 }}>
                      {canAct && <Btn size="sm" variant="success" onClick={() => { setAdvReviewModal(r); setAdvReviewAction('approved'); }}>✓ Approve</Btn>}
                      {canAct && <Btn size="sm" variant="danger" onClick={() => { setAdvReviewModal(r); setAdvReviewAction('rejected'); }}>✕ Reject</Btn>}
                      {!canAct && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{r.comment || '—'}</span>}
                    </div>
                  ];
                })}
              />
            </Card>
          }
        </div>
      )}

      {activeTab === 'salary' && (<>
        {/* Month selector */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {availableMonths.map(m => (
            <button key={m} onClick={() => setMonthFilter(m)}
              style={{ padding: '8px 18px', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: '1.5px solid', borderColor: selectedMonth === m ? 'var(--primary)' : 'var(--border)', background: selectedMonth === m ? 'var(--primary-l)' : 'var(--bg2)', color: selectedMonth === m ? 'var(--primary)' : 'var(--text3)', fontFamily: 'var(--font)' }}>
              {m}
            </button>
          ))}
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Net Payroll', value: FMT_RWF(totals.net), color: 'var(--green)' },
            { label: 'Total Bonuses', value: FMT_RWF(totals.bonus), color: 'var(--primary)' },
            { label: 'Pending / Confirmed / Signed', value: `${totals.pending} / ${totals.confirmed} / ${totals.signed}`, color: 'var(--cyan)' },
          ].map(s => (
            <Card key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
              <div style={{ fontSize: s.label.includes('Pending') ? 18 : 22, fontWeight: 800, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</div>
            </Card>
          ))}
        </div>

        {/* Salary table */}
        <Card style={{ padding: 0 }}>
          {monthSalaries.length === 0
            ? <EmptyState icon="💰" title="No salary records" body={`No salary records for ${selectedMonth || 'selected period'}`} />
            : <Table
              headers={['Employee', 'Role', 'Base Salary', 'Bonus', 'Net Salary', 'Status', 'Actions']}
              rows={[...monthSalaries].sort((a, b) => a.user_id - b.user_id).map(s => {
                const u = users.find(x => x.id === s.user_id);
                const canConfirm = role === 'daf' && s.status === 'pending';
                const canBonus = ['cfo', 'ceo'].includes(role) && s.status === 'pending';
                const base = BASE_SALARIES[u?.role] || 320000;
                const maxBonus = Math.round(base * 0.10);
                return [
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <Avatar initials={u?.avatar || '?'} size={32} src={u?.profile_pic} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{u?.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>{u?.dept || 'Admin'}</div>
                    </div>
                  </div>,
                  <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{u?.role || ''}</span>,
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 13 }}>{FMT_RWF(s.base_salary)}</span>,
                  <div>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 13, color: s.bonus > 0 ? 'var(--green-d)' : 'var(--text3)', fontWeight: s.bonus > 0 ? 700 : 400 }}>{s.bonus > 0 ? `+${FMT_RWF(s.bonus)}` : '—'}</span>
                    {canBonus && <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>Max: {FMT_RWF(maxBonus)} (10%)</div>}
                  </div>,
                  <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, color: 'var(--primary)' }}>{FMT_RWF(s.net_salary)}</span>,
                  <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: `${STATUS_COLOR[s.status]}20`, color: STATUS_COLOR[s.status] }}>{s.status}</span>,
                  <div style={{ display: 'flex', gap: 5 }}>
                    {canConfirm && <Btn size="sm" variant="success" onClick={() => confirmSalary(s.id)}>✓ Confirm</Btn>}
                    {canBonus && <Btn size="sm" variant="primary" onClick={() => { setBonusModal(s); setBonusAmt(''); setBonusReason(''); setBonusError(''); }}>＋ Bonus</Btn>}
                    {!canConfirm && !canBonus && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{s.status === 'signed' ? '✓ Signed' : s.status === 'confirmed' ? 'Awaiting Signature' : 'Pending'}</span>}
                  </div>
                ];
              })}
              footerRow={[
                <span style={{ fontWeight: 700, fontSize: 13 }}>TOTALS</span>, '',
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 800 }}>{FMT_RWF(totals.base)}</span>,
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 800 }}>{FMT_RWF(totals.bonus)}</span>,
                <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, color: 'var(--green-d)', fontSize: 15 }}>{FMT_RWF(totals.net)}</span>,
                '', '',
              ]}
            />
          }
        </Card>
      </>)}
    </div>
  );
}
