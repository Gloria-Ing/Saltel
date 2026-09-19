import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ROLE_CONFIG } from '../data/mockData';

const NAV = [
  { path: '/', icon: 'bi bi-grid-1x2-fill', label: 'Dashboard', roles: ['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator', 'unit_leader', 'technician', 'maximization_officer', 'daf', 'staff', 'store_keeper'] },
  { path: '/daf-finance', icon: 'bi bi-bar-chart-line-fill', label: 'Finance & Admin', roles: ['daf', 'cfo', 'maximization_officer'] },
  { path: '/working-plan', icon: 'bi bi-calendar3', label: 'Working Plan', roles: ['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator', 'unit_leader', 'technician', 'staff', 'store_keeper'] },
  { path: '/tasks', icon: 'bi bi-check2-square', label: 'Tasks', roles: ['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator', 'unit_leader', 'technician', 'staff', 'store_keeper'] },
  { path: '/attendance', icon: 'bi bi-geo-alt-fill', label: 'Attendance', roles: ['ceo', 'cfo', 'regional_coordinator', 'unit_leader', 'technician', 'staff', 'store_keeper'] },
  { path: '/reports', icon: 'bi bi-file-earmark-text-fill', label: 'Reports', roles: ['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator', 'unit_leader', 'technician', 'maximization_officer', 'staff', 'store_keeper'] },
  { path: '/requisitions', icon: 'bi bi-receipt-cutoff', label: 'Fee Requisitions', roles: ['regional_coordinator', 'unit_leader', 'technician', 'maximization_officer', 'daf', 'staff', 'store_keeper'] },
  { path: '/leave', icon: 'bi bi-calendar-event-fill', label: 'Leave & Permissions', roles: ['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator', 'unit_leader', 'technician', 'maximization_officer', 'daf', 'staff', 'store_keeper'] },
  { path: '/salary', icon: 'bi bi-wallet2', label: 'Salary', roles: ['ceo', 'cfo', 'daf', 'regional_coordinator', 'unit_leader', 'technician', 'maximization_officer', 'staff', 'store_keeper'] },
  { path: '/payments', icon: 'bi bi-credit-card-fill', label: 'Payments', roles: ['ceo', 'cfo', 'maximization_officer', 'technician', 'daf', 'staff', 'store_keeper'] },
  { path: '/performance', icon: 'bi bi-graph-up-arrow', label: 'Performance', roles: ['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator', 'unit_leader', 'technician', 'daf'] },
  { path: '/team', icon: 'bi bi-people-fill', label: 'Team', roles: ['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator', 'unit_leader', 'daf'] },
  { path: '/sites', icon: 'bi bi-building-fill', label: 'Sites', roles: ['ceo', 'cfo', 'regional_coordinator', 'unit_leader', 'technician', 'store_keeper'] },
  { path: '/chat', icon: 'bi bi-chat-dots-fill', label: 'Messages', roles: ['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator', 'unit_leader', 'technician', 'maximization_officer', 'daf', 'staff', 'store_keeper'] },
  { path: '/announcements', icon: 'bi bi-megaphone-fill', label: 'Announcements', roles: ['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator', 'unit_leader', 'technician', 'maximization_officer', 'daf', 'staff', 'store_keeper'] },
  { path: '/promotions', icon: 'bi bi-robot', label: 'AI Intelligence', roles: ['ceo', 'cfo'] },
  { path: '/ai-assistant', icon: 'bi bi-stars', label: 'AI Assistant', roles: ['technician', 'unit_leader', 'regional_coordinator', 'daf', 'maximization_officer', 'staff', 'store_keeper', 'cbo', 'dm'] },
];

const ROLE_ACCENTS = {
  ceo: '#7C3AED', cfo: '#0EA5E9', cbo: '#8B5CF6', dm: '#F59E0B',
  daf: '#EC4899', regional_coordinator: '#169BD5',
  unit_leader: '#06B6D4', technician: '#10B981',
  maximization_officer: '#F97316', staff: '#64748B', store_keeper: '#14B8A6',
};

export default function Layout({ children }) {
  const { currentUser, logout, unreadCount, unreadMessages, notifications, markAllRead, markOneRead, leaveRequests, requisitions } = useApp();
  const [showNotifs, setShowNotifs] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const rc = ROLE_CONFIG[currentUser.role];
  const accent = ROLE_ACCENTS[currentUser.role] || '#169BD5';
  const navItems = NAV.filter(n => n.roles.includes(currentUser.role));
  const typeColors = { task: '#A5B4FC', payment: '#6EE7B7', report: '#67E8F9', alert: '#FCA5A5', message: '#C4B5FD', salary: '#F9A8D4' };

  const pendingLeave = ['unit_leader', 'regional_coordinator', 'ceo', 'cfo', 'cbo', 'dm'].includes(currentUser.role)
    ? leaveRequests?.filter(r => r.status === 'pending').length || 0 : 0;
  const pendingReq = ['regional_coordinator', 'maximization_officer', 'daf'].includes(currentUser.role)
    ? requisitions?.filter(r => ['tl_approved', 'pending'].includes(r.status)).length || 0 : 0;

  const navBadge = (path) => {
    if (path === '/leave') return pendingLeave;
    if (path === '/requisitions') return pendingReq;
    if (path === '/chat') return unreadMessages;
    return 0;
  };

  const Sidebar = () => (
    <aside className="foms-sidebar" style={{ width: 230, background: '#FFFFFF', display: 'flex', flexDirection: 'column', flexShrink: 0, borderRight: '1px solid #E0ECF8', height: '100%' }}>
      <div style={{ padding: '1.1rem 1.25rem 0.9rem', borderBottom: '1px solid #E0ECF8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(22,155,213,0.1)', border: '2px solid rgba(22,155,213,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-brand)', fontSize: 22, color: '#169BD5', letterSpacing: '2px' }}>S</span>
          </div>
          <div>
            <div className="saltel-brand" style={{ fontSize: 17, lineHeight: 1, color: '#169BD5' }}>SALTEL</div>
            <div style={{ fontSize: 9, color: '#64748B', letterSpacing: '3px', marginTop: 3, fontWeight: 600 }}>FOMS · V13</div>
          </div>
        </div>
        <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}
          style={{ display: 'none', fontSize: 18, color: '#64748B', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><i className="bi bi-x-lg" /></button>
      </div>

      <div style={{ padding: '8px 12px', borderBottom: '1px solid #E0ECF8' }}>
        <div style={{ background: 'rgba(22,155,213,0.08)', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 7, border: '1px solid rgba(22,155,213,0.2)' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#169BD5', display: 'inline-block', flexShrink: 0, boxShadow: '0 0 6px rgba(22,155,213,0.4)' }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#169BD5', letterSpacing: '1.5px', textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rc?.label}</span>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 0.7rem' }}>
        {navItems.map(item => {
          const badge = navBadge(item.path);
          return (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={() => setSidebarOpen(false)} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 9,
              color: isActive ? '#169BD5' : '#4A607A',
              background: isActive ? '#EAF6FC' : 'transparent',
              fontSize: 14, fontWeight: isActive ? 700 : 500, letterSpacing: '0.3px',
              marginBottom: 3, textDecoration: 'none', transition: 'all .15s',
              borderLeft: isActive ? '4px solid #169BD5' : '4px solid transparent',
              boxShadow: isActive ? '0 2px 10px rgba(22,155,213,0.12)' : 'none',
            })}>
              <span style={{ fontSize: 16, width: 20, textAlign: 'center', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className={item.icon} /></span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{ fontSize: 10, background: '#169BD5', color: '#FFFFFF', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>{badge}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding: '0.75rem', borderTop: '1px solid #E0ECF8' }}>
        <div style={{ background: '#F4F8FC', border: '1px solid #E0ECF8', borderRadius: 11, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div onClick={() => { navigate('/profile'); setSidebarOpen(false); }} title="Edit Profile" style={{ cursor: 'pointer', flexShrink: 0 }}>
            {currentUser.profile_pic
              ? <div style={{ width: 36, height: 36, borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(22,155,213,0.4)' }}><img src={currentUser.profile_pic} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
              : <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(22,155,213,0.12)', color: '#169BD5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', border: '1.5px solid rgba(22,155,213,0.3)' }}>{currentUser.avatar}</div>
            }
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name.split(' ')[0]}</div>
            <div style={{ fontSize: 10, color: '#64748B', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{currentUser.email}</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => { navigate('/profile'); setSidebarOpen(false); }} title="Profile"
              style={{ fontSize: 14, color: '#64748B', cursor: 'pointer', padding: 3, transition: 'color .15s', background: 'none', border: 'none' }}
              onMouseEnter={e => e.target.style.color = '#169BD5'} onMouseLeave={e => e.target.style.color = '#64748B'}><i className="bi bi-gear-fill" /></button>
            <button onClick={logout} title="Sign out"
              style={{ fontSize: 14, color: '#64748B', cursor: 'pointer', padding: 3, transition: 'color .15s', marginLeft: 2, background: 'none', border: 'none' }}
              onMouseEnter={e => e.target.style.color = '#EF4444'} onMouseLeave={e => e.target.style.color = '#64748B'}><i className="bi bi-box-arrow-right" /></button>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Desktop sidebar */}
      <div className="foms-sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex' }}>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)' }} />
          <div style={{ position: 'relative', zIndex: 501, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Sidebar />
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ height: 56, background: 'var(--bg2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem', flexShrink: 0, boxShadow: 'var(--shadow2)', position: 'relative', zIndex: 50, gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Hamburger for mobile */}
            <button className="foms-hamburger" onClick={() => setSidebarOpen(true)}
              style={{ display: 'none', fontSize: 20, color: 'var(--text2)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', borderRadius: 8 }}>
              <i className="bi bi-list" />
            </button>
            <span className="foms-status-text" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 8px var(--green)' }} />
              <span style={{ fontSize: 13, color: 'var(--text3)', letterSpacing: '0.5px' }}>System Online</span>
              <span style={{ color: 'var(--border2)', margin: '0 4px' }}>·</span>
              <span style={{ fontSize: 13, color: 'var(--text3)', letterSpacing: '0.3px' }}>
                {new Date().toLocaleDateString('en-RW', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {['ceo', 'cfo', 'cbo', 'dm', 'regional_coordinator'].includes(currentUser.role) && (
              <button onClick={() => navigate('/tasks/new')}
                style={{ padding: '7px 16px', borderRadius: 9, background: 'linear-gradient(135deg,#169BD5,#0D8EC8)', color: '#fff', fontSize: 12, letterSpacing: '1px', fontWeight: 700, cursor: 'pointer', border: 'none', boxShadow: '0 6px 18px rgba(22,155,213,0.3)', fontFamily: 'var(--font)', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="bi bi-plus-lg" /> NEW TASK
              </button>
            )}
            <button onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
              style={{ position: 'relative', padding: '7px 11px', borderRadius: 9, background: 'var(--bg3)', border: '1.5px solid var(--border)', cursor: 'pointer', fontSize: 16, color: 'var(--text2)', fontFamily: 'var(--font)' }}>
              <i className="bi bi-bell-fill" />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: -5, right: -5, width: 18, height: 18, borderRadius: '50%', background: 'var(--red)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg2)' }}>{unreadCount}</span>
              )}
            </button>
          </div>
          {showNotifs && (
            <div style={{ position: 'absolute', top: 62, right: 12, width: 'min(420px,calc(100vw - 24px))', background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 16, boxShadow: 'var(--shadow3)', zIndex: 200, overflow: 'hidden' }}>
              <div style={{ padding: '13px 16px', fontSize: 14, letterSpacing: '1px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>NOTIFICATIONS {unreadCount > 0 && <span style={{ fontSize: 11, background: 'var(--red)', color: '#fff', borderRadius: 10, padding: '1px 7px', marginLeft: 6 }}>{unreadCount}</span>}</span>
                <button onClick={() => setShowNotifs(false)} style={{ fontSize: 13, color: 'var(--text3)', cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font)' }}><i className="bi bi-x-lg" /></button>
              </div>
              <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                {notifications.length === 0
                  ? <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>ALL CAUGHT UP <i className="bi bi-check2-circle ms-1" style={{ color: 'var(--green)' }} /></div>
                  : notifications.slice(0, 15).map(n => (
                    <div key={n.id}
                      onClick={() => { setShowNotifs(false); markOneRead(n.id); navigate(n.link || '/'); }}
                      style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, cursor: 'pointer', background: n.read ? 'transparent' : 'var(--primary-l)', transition: 'background .1s' }}>
                      <span style={{ fontSize: 12, color: typeColors[n.type] || typeColors.task, marginTop: 3, flexShrink: 0 }}>●</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, lineHeight: 1.5 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{n.time}</div>
                      </div>
                      {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: 5 }} />}
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', background: 'var(--bg)' }}>
          {children}
        </main>

        {/* Mobile bottom navigation bar */}
        <nav className="foms-bottom-nav" style={{ display: 'none', background: 'var(--bg2)', borderTop: '1px solid var(--border)', padding: '0', height: 60, flexShrink: 0 }}>
          <div style={{ display: 'flex', height: '100%', overflowX: 'auto' }}>
            {navItems.slice(0, 6).map(item => {
              const badge = navBadge(item.path);
              return (
                <NavLink key={item.path} to={item.path} end={item.path === '/'} style={({ isActive }) => ({
                  flex: 1, minWidth: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                  textDecoration: 'none', color: isActive ? accent : 'var(--text3)',
                  borderTop: isActive ? `2px solid ${accent}` : '2px solid transparent',
                  padding: '6px 4px', position: 'relative', fontSize: 10, fontWeight: isActive ? 700 : 400, letterSpacing: '0.3px',
                  transition: 'all .15s', flexShrink: 0,
                })}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}><i className={item.icon} /></span>
                  <span style={{ fontSize: 9, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 52, textAlign: 'center' }}>{item.label}</span>
                  {badge > 0 && (
                    <span style={{ position: 'absolute', top: 4, right: 6, width: 14, height: 14, borderRadius: '50%', background: 'var(--red)', color: '#fff', fontSize: 8, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>
                  )}
                </NavLink>
              );
            })}
            <button onClick={() => setSidebarOpen(true)} style={{ flex: 1, minWidth: 52, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, background: 'none', border: 'none', borderTop: '2px solid transparent', color: 'var(--text3)', fontSize: 10, cursor: 'pointer', fontFamily: 'var(--font)', padding: '6px 4px', flexShrink: 0 }}>
              <span style={{ fontSize: 18 }}><i className="bi bi-list" /></span>
              <span style={{ fontSize: 9 }}>More</span>
            </button>
          </div>
        </nav>
      </div>

      <style>{`
        /* ── Responsive: Tablet (768–1024px) ─── */
        @media (max-width: 1024px) {
          .foms-sidebar-desktop { display: none !important; }
          .foms-hamburger { display: flex !important; }
          .foms-status-text span:nth-child(3),
          .foms-status-text span:nth-child(4),
          .foms-status-text span:nth-child(5) { display: none; }
          main { padding: 1rem 1rem !important; }
          .resp-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .resp-grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
        }
        /* ── Responsive: Mobile (≤640px) ─── */
        @media (max-width: 640px) {
          .foms-bottom-nav { display: flex !important; }
          .foms-hamburger { display: none !important; }
          main { padding: 0.75rem 0.75rem 1rem !important; }
          .resp-grid-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .resp-grid-3 { grid-template-columns: 1fr !important; }
          .resp-flex { flex-direction: column !important; }
          .resp-hide-mobile { display: none !important; }
        }
        /* ── Sidebar close button on mobile overlay ─── */
        @media (max-width: 1024px) {
          .sidebar-close-btn { display: flex !important; }
        }
        /* ── Scrollbar ─── */
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 4px; }
      `}</style>
    </div>
  );
}
