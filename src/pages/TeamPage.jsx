import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { DEPARTMENTS, ROLE_CONFIG, BASE_SALARIES } from '../data/mockData';
import { Card, PageHeader, Badge, Btn, SectionTitle, Input, Modal, Avatar, ContactActions, EmptyState, AlertBanner } from '../components/UI';

function renderUserCard(u, setViewUser, DEPT_COLORS) {
  return (
    <Card key={u.id} onClick={()=>setViewUser(u)} style={{ cursor:'pointer' }}>
      <div style={{ display:'flex', gap:12, alignItems:'center' }}>
        <Avatar initials={u.avatar} color={DEPT_COLORS[u.dept]||'var(--text3)'} size={44} src={u.profile_pic}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, marginBottom:3 }}>{u.name}</div>
          <div style={{ fontSize:11, color:'var(--text3)' }}>{ROLE_CONFIG[u.role]?.label||u.role}</div>
          <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{u.dept ? u.dept+' Unit' : 'Management'}</div>
        </div>
      </div>
    </Card>
  );
}

export default function TeamPage() {
  const { currentUser, users, registerUser, registrableRoles, updateProfilePic,
    departments, registerDepartment, registerSiteGlobal, registerSupervisor,
    deleteUserById, changeUserRole, sites } = useApp();
  const role = currentUser?.role;

  const [viewUser, setViewUser]         = useState(null);
  const [showRegModal, setShowReg]      = useState(false);
  const [showAdminPanel, setAdminPanel] = useState(false);
  const [adminTab, setAdminTab]         = useState('unit');
  const [search, setSearch]             = useState('');
  const [deptFilter, setDeptFilter]     = useState('all');
  const [roleFilter, setRoleFilter]     = useState('all');

  const canRegister = registrableRoles().length > 0;
  const regRoles    = registrableRoles();
  const allDepts    = departments || DEPARTMENTS;
  const canAdmin    = ['ceo','regional_coordinator'].includes(role);

  const [rForm, setRForm] = useState({
    name:'', email:'', username:'', password:'saltel', phone:'',
    role:regRoles[0]||'technician',
    dept: currentUser?.dept || 'LAN', salary:'', studies:'', certifications:'', experience:'',
  });
  const setF = (k,v) => setRForm(p=>({...p,[k]:v}));
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');

  const [unitForm, setUnitForm]       = useState({ id:'', color:'#6366F1' });
  const [siteForm, setSiteForm]       = useState({ name:'', location:'', province:'Kigali', type:'Corporate', rural:false, lat:'', lng:'' });
  const [supForm,  setSupForm]        = useState({ name:'', email:'', phone:'', dept:'LAN', salary:'', studies:'', certifications:'', experience:'' });
  const [roleChange, setRoleChange]   = useState({ userId:'', newRole:'', newDept:'' });
  const [adminSuccess, setAdminSuccess] = useState('');

  const handleRegister = () => {
    if (!rForm.name.trim()||!rForm.email.trim()) { alert('Name and email are required.'); return; }
    if (!rForm.username.trim()) { alert('Username is required for login.'); return; }
    if (!rForm.password.trim()||rForm.password.length<4) { alert('Password must be at least 4 characters.'); return; }
    setRegLoading(true);
    const u = registerUser(rForm);
    setTimeout(() => {
      setRegLoading(false);
      setRegSuccess(`✓ ${u.name} (${u.role}) registered! Username: ${rForm.username} · Password: ${rForm.password}`);
      setRForm({ name:'', email:'', username:'', password:'saltel', phone:'', role:regRoles[0]||'technician', dept:currentUser?.dept||'LAN', salary:'', studies:'', certifications:'', experience:'' });
      setTimeout(()=>setRegSuccess(''), 6000);
    }, 500);
  };

  const handlePhotoPick = () => {
    const input = document.createElement('input');
    input.type='file'; input.accept='image/*';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => updateProfilePic(viewUser.id, ev.target.result);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handleAddUnit = () => {
    if (!unitForm.id.trim()) { alert('Unit code required (e.g. Power, IP, Access)'); return; }
    registerDepartment(unitForm);
    setAdminSuccess(`✓ Unit "${unitForm.id}" created successfully!`);
    setUnitForm({ id:'', color:'#6366F1' });
    setTimeout(()=>setAdminSuccess(''), 4000);
  };

  const handleAddSite = () => {
    if (!siteForm.name.trim()||!siteForm.location.trim()) { alert('Site name and location required.'); return; }
    registerSiteGlobal(siteForm);
    setAdminSuccess(`✓ Site "${siteForm.name}" added successfully!`);
    setSiteForm({ name:'', location:'', province:'Kigali', type:'Corporate', rural:false, lat:'', lng:'' });
    setTimeout(()=>setAdminSuccess(''), 4000);
  };

  const handleAddSupervisor = () => {
    if (!supForm.name.trim()||!supForm.email.trim()) { alert('Name and email required.'); return; }
    registerSupervisor(supForm);
    setAdminSuccess(`✓ Supervisor "${supForm.name}" registered for ${supForm.dept} Unit!`);
    setSupForm({ name:'', email:'', phone:'', dept:'LAN', salary:'', studies:'', certifications:'', experience:'' });
    setTimeout(()=>setAdminSuccess(''), 4000);
  };

  const handleChangeRole = () => {
    if (!roleChange.userId||!roleChange.newRole) { alert('Select a user and new role.'); return; }
    changeUserRole(Number(roleChange.userId), roleChange.newRole, roleChange.newDept||undefined);
    setAdminSuccess(`✓ Role changed successfully!`);
    setRoleChange({ userId:'', newRole:'', newDept:'' });
    setTimeout(()=>setAdminSuccess(''), 4000);
  };

  const DEPT_COLORS = { LAN:'var(--primary)', Fiber:'var(--green)', CCTV:'var(--purple)' };

  const visibleUsers = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchDept   = deptFilter==='all' || u.dept===deptFilter;
    const matchRole   = roleFilter==='all' || u.role===roleFilter;
    if (role=== 'unit_leader') return (u.dept===currentUser.dept) && matchSearch && matchDept && matchRole;
    if (role==='ceo') return matchSearch && matchDept && matchRole;
    if (role=== 'regional_coordinator') return (u.dept===currentUser.dept || !u.dept) && matchSearch && matchDept && matchRole;
    if (role==='daf') return matchSearch && matchDept && matchRole;
    return matchSearch && matchDept && matchRole;
  });

  const byDept = allDepts.reduce((acc, d) => {
    acc[d.id] = visibleUsers.filter(u=>u.dept===d.id&&['unit_leader','technician'].includes(u.role));
    return acc;
  }, {});
  const mgmt = visibleUsers.filter(u=>['ceo','regional_coordinator','daf','maximization_officer'].includes(u.role));

  const ADMIN_TABS_CEO = [
    { k:'unit', l:'➕ New Unit' },
    { k:'site', l:'📍 New Site' },
    { k:'supervisor', l:'🏢 New Supervisor' },
    { k:'role', l:'🔄 Change Role' },
    { k:'delete', l:'🗑 Remove Staff' },
  ];

  const ADMIN_TABS_HOD = [
    { k:'site', l:'📍 Register Site' },
    { k:'role', l:'🔄 Change Role' },
  ];

  const adminTabs = role==='ceo' ? ADMIN_TABS_CEO : ADMIN_TABS_HOD;

  return (
    <div>
      <PageHeader
        title="👥 Team Management"
        subtitle={
          role==='ceo' ? 'Manage units, sites, supervisors, and all staff' :
          role=== 'regional_coordinator' ? 'Register staff and manage your unit' :
          role=== 'unit_leader' ? 'View your team and add technicians' :
          'View all SALTEL staff'
        }
        action={
          <div style={{ display:'flex', gap:8 }}>
            {canAdmin && (
              <Btn variant="ghost" onClick={()=>setAdminPanel(true)}>⚙ {role==='ceo'?'Admin Panel':'Supervisor Panel'}</Btn>
            )}
            {canRegister && (
              <Btn variant="primary" onClick={()=>setShowReg(true)}>
                ＋ {role==='ceo'?'Register Staff':role=== 'regional_coordinator'?'Register Staff':'Add Technician'}
              </Btn>
            )}
          </div>
        }
      />

      <div style={{ display:'flex', gap:10, marginBottom:'1.5rem', flexWrap:'wrap' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name or email..." style={{ flex:1, minWidth:200, padding:'9px 14px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14 }}/>
        {role==='ceo' && (
          <>
            <select value={deptFilter} onChange={e=>setDeptFilter(e.target.value)} style={{ padding:'8px 13px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14 }}>
              <option value="all">All Units</option>
              {allDepts.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
            <select value={roleFilter} onChange={e=>setRoleFilter(e.target.value)} style={{ padding:'8px 13px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg2)', fontSize:14 }}>
              <option value="all">All Roles</option>
              {Object.entries(ROLE_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
          </>
        )}
      </div>

      {mgmt.length>0 && (role==='ceo'||role==='daf') && (
        <div style={{ marginBottom:'2rem' }}>
          <SectionTitle>Management & Administration</SectionTitle>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
            {mgmt.map(u=>renderUserCard(u,setViewUser,DEPT_COLORS))}
          </div>
        </div>
      )}

      {allDepts.filter(d=>role=== 'regional_coordinator'?d.id===currentUser.dept:role=== 'unit_leader'?d.id===currentUser.dept:true).map(dept=>(
        <div key={dept.id} style={{ marginBottom:'2rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:'1rem' }}>
            <div style={{ width:12, height:12, borderRadius:3, background:DEPT_COLORS[dept.id]||'var(--primary)' }}/>
            <SectionTitle>{dept.label} — {(byDept[dept.id]||[]).length} staff</SectionTitle>
            {canRegister && (role=== 'regional_coordinator'?dept.id===currentUser.dept:true) && (
              <Btn size="sm" variant="ghost" style={{ marginLeft:'auto' }} onClick={()=>{ setF('dept',dept.id); setShowReg(true); }}>＋ Add</Btn>
            )}
          </div>
          {(byDept[dept.id]||[]).length===0
            ? <EmptyState icon="👤" title="No staff in this unit" body="Register team members to get started"/>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:'1rem' }}>
                {byDept[dept.id].map(u=>renderUserCard(u,setViewUser,DEPT_COLORS))}
              </div>
          }
        </div>
      ))}

      {/* ── Register Modal ── */}
      <Modal open={showRegModal} onClose={()=>setShowReg(false)} title={role==='ceo'?'Register New Staff Member':role=== 'regional_coordinator'?'Register New Staff Member':'Add New Technician'} maxWidth={580}>
        {regSuccess && (
          <AlertBanner type="success">{regSuccess}</AlertBanner>
        )}
        <div style={{ padding:'12px 16px', background:'var(--primary-l)', border:'1px solid var(--primary)', borderRadius:10, marginBottom:'1rem', fontSize:13, color:'var(--primary)', fontWeight:600 }}>
          {role==='ceo'?'👑 As CEO, you can register technicians in any unit.':role=== 'regional_coordinator'?'🏢 As Supervisor, you can register HoUs and Technicians for your unit.':'👑 As HoU, you can add Technicians to your team.'}
        </div>

        <SectionTitle>Personal Info</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          <Input label="Full Name *" value={rForm.name} onChange={e=>setF('name',e.target.value)} placeholder="e.g. Jean-Pierre Niyonshuti"/>
          <Input label="Email *" type="email" value={rForm.email} onChange={e=>setF('email',e.target.value)} placeholder="name@saltel.rw"/>
          <Input label="Phone" value={rForm.phone} onChange={e=>setF('phone',e.target.value)} placeholder="+250 788 000 000"/>
          {regRoles.length > 1 ? (
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Role *</label>
              <select value={rForm.role} onChange={e=>setF('role',e.target.value)} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14 }}>
                {regRoles.map(r=><option key={r} value={r}>{ROLE_CONFIG[r]?.label||r}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Role</label>
              <div style={{ padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, color:'var(--text3)' }}>{ROLE_CONFIG[regRoles[0]]?.label||'Technician'}</div>
            </div>
          )}
          {role==='ceo' ? (
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Unit *</label>
              <select value={rForm.dept} onChange={e=>setF('dept',e.target.value)} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, color:'var(--text)' }}>
                {allDepts.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
            </div>
          ) : (
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Unit</label>
              <div style={{ padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, color:'var(--text3)' }}>{currentUser?.dept} Unit</div>
            </div>
          )}
          <Input label="Monthly Salary (RWF)" type="number" value={rForm.salary} onChange={e=>setF('salary',e.target.value)} placeholder={`Default: ${(BASE_SALARIES[rForm.role]||320000).toLocaleString()}`}/>
        </div>

        <SectionTitle>Login Credentials</SectionTitle>
        <div style={{ padding:'10px 14px', background:'var(--amber-l)', border:'1px solid var(--amber)', borderRadius:9, marginBottom:'0.75rem', fontSize:13, color:'var(--amber-d)', fontWeight:600 }}>
          🔑 Set the username and password this person will use to log into FOMS.
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          <Input label="Username *" value={rForm.username} onChange={e=>setF('username',e.target.value.toLowerCase().replace(/\s+/g,'.').trim())} placeholder="e.g. tech.jean or jean.n"/>
          <Input label="Password *" type="password" value={rForm.password} onChange={e=>setF('password',e.target.value)} placeholder="Min 4 characters (default: saltel)"/>
        </div>

        <SectionTitle>Qualifications (optional)</SectionTitle>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
          <Input label="Studies / Education" value={rForm.studies} onChange={e=>setF('studies',e.target.value)} placeholder="e.g. BSc IT — University of Rwanda"/>
          <Input label="Certifications (comma-separated)" value={rForm.certifications} onChange={e=>setF('certifications',e.target.value)} placeholder="e.g. CCNA, CompTIA A+"/>
          <Input label="Field Experience" value={rForm.experience} onChange={e=>setF('experience',e.target.value)} placeholder="e.g. 3 years LAN cabling"/>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:'1rem' }}>
          <Btn variant="ghost" onClick={()=>setShowReg(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleRegister} disabled={regLoading}>{regLoading?'Registering...':'✓ Register Staff Member'}</Btn>
        </div>
      </Modal>

      {/* ── Admin Panel (CEO + Supervisor/hod) ── */}
      <Modal open={showAdminPanel} onClose={()=>setAdminPanel(false)} title={`⚙ ${role==='ceo'?'CEO Admin Panel':'Supervisor Panel'}`} maxWidth={640}>
        {adminSuccess && (
          <AlertBanner type="success">{adminSuccess}</AlertBanner>
        )}
        <div style={{ display:'flex', gap:6, marginBottom:'1.25rem', flexWrap:'wrap' }}>
          {adminTabs.map(t=>(
            <button key={t.k} onClick={()=>setAdminTab(t.k)}
              style={{ padding:'8px 14px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', border:'1.5px solid', borderColor:adminTab===t.k?'var(--primary)':'var(--border)', background:adminTab===t.k?'var(--primary-l)':'var(--bg2)', color:adminTab===t.k?'var(--primary)':'var(--text3)', fontFamily:'var(--font)', transition:'all .15s' }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* New Unit (CEO only) */}
        {adminTab==='unit' && role==='ceo' && (
          <div>
            <div style={{ fontSize:13, color:'var(--text3)', marginBottom:'1rem' }}>Create a new operational unit (department) within SALTEL. Example: Power, IP, Access, Wireless.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <Input label="Unit Code (ID) *" value={unitForm.id} onChange={e=>setUnitForm(p=>({...p,id:e.target.value.toUpperCase()}))} placeholder="e.g. Power, Wireless, IP"/>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Unit Color</label>
                <input type="color" value={unitForm.color} onChange={e=>setUnitForm(p=>({...p,color:e.target.value}))} style={{ width:'100%', height:42, border:'1.5px solid var(--border)', borderRadius:9, cursor:'pointer', background:'var(--bg3)' }}/>
              </div>
            </div>
            <div style={{ marginTop:'1rem', display:'flex', justifyContent:'flex-end' }}>
              <Btn variant="primary" onClick={handleAddUnit}>➕ Create Unit</Btn>
            </div>
          </div>
        )}

        {/* New Site (CEO + Supervisor/hod) */}
        {adminTab==='site' && (
          <div>
            <div style={{ fontSize:13, color:'var(--text3)', marginBottom:'1rem' }}>Register a new site location for field operations. {role=== 'regional_coordinator'&&<span style={{ color:'var(--primary)', fontWeight:600 }}>As Supervisor, you can register new deployment sites.</span>}</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <Input label="Site Name *" value={siteForm.name} onChange={e=>setSiteForm(p=>({...p,name:e.target.value}))} placeholder="e.g. Huye District Office"/>
              <Input label="Location / Address *" value={siteForm.location} onChange={e=>setSiteForm(p=>({...p,location:e.target.value}))} placeholder="e.g. Huye, Southern Province"/>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Province</label>
                <select value={siteForm.province} onChange={e=>setSiteForm(p=>({...p,province:e.target.value}))} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, color:'var(--text)' }}>
                  {['Kigali','Eastern','Western','Northern','Southern'].map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Site Type</label>
                <select value={siteForm.type} onChange={e=>setSiteForm(p=>({...p,type:e.target.value}))} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, color:'var(--text)' }}>
                  {['Corporate','Government','Healthcare','Education','Telecom','Venue','Residential'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Input label="Latitude (optional)" value={siteForm.lat} onChange={e=>setSiteForm(p=>({...p,lat:e.target.value}))} placeholder="-1.9441"/>
              <Input label="Longitude (optional)" value={siteForm.lng} onChange={e=>setSiteForm(p=>({...p,lng:e.target.value}))} placeholder="30.0619"/>
            </div>
            <div style={{ marginTop:'0.75rem', display:'flex', alignItems:'center', gap:10 }}>
              <input type="checkbox" id="ruralCheck" checked={siteForm.rural} onChange={e=>setSiteForm(p=>({...p,rural:e.target.checked}))} style={{ width:16, height:16 }}/>
              <label htmlFor="ruralCheck" style={{ fontSize:13, color:'var(--text2)', cursor:'pointer' }}>🏕 Rural site (enables lodging allowance)</label>
            </div>
            <div style={{ marginTop:'1rem', display:'flex', justifyContent:'flex-end' }}>
              <Btn variant="primary" onClick={handleAddSite}>📍 Add Site</Btn>
            </div>
          </div>
        )}

        {/* New Supervisor (CEO only) */}
        {adminTab==='supervisor' && role==='ceo' && (
          <div>
            <div style={{ fontSize:13, color:'var(--text3)', marginBottom:'1rem' }}>Register a new Regional Coordinator and assign them to a unit.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <Input label="Full Name *" value={supForm.name} onChange={e=>setSupForm(p=>({...p,name:e.target.value}))} placeholder="Full name"/>
              <Input label="Email *" type="email" value={supForm.email} onChange={e=>setSupForm(p=>({...p,email:e.target.value}))} placeholder="supervisor@saltel.rw"/>
              <Input label="Phone" value={supForm.phone} onChange={e=>setSupForm(p=>({...p,phone:e.target.value}))} placeholder="+250 788 000 000"/>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Assign to Unit *</label>
                <select value={supForm.dept} onChange={e=>setSupForm(p=>({...p,dept:e.target.value}))} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, color:'var(--text)' }}>
                  {allDepts.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
              <Input label="Monthly Salary (RWF)" type="number" value={supForm.salary} onChange={e=>setSupForm(p=>({...p,salary:e.target.value}))} placeholder={`Default: ${BASE_SALARIES.regional_coordinator.toLocaleString()}`}/>
              <Input label="Studies / Education" value={supForm.studies} onChange={e=>setSupForm(p=>({...p,studies:e.target.value}))} placeholder="e.g. BSc Networks — UR"/>
            </div>
            <div style={{ marginTop:'1rem', display:'flex', justifyContent:'flex-end' }}>
              <Btn variant="primary" onClick={handleAddSupervisor}>🏢 Register Regional Coordinator</Btn>
            </div>
          </div>
        )}

        {/* Change Role */}
        {adminTab==='role' && (
          <div>
            <div style={{ fontSize:13, color:'var(--text3)', marginBottom:'1rem' }}>Change any staff member's role. Their salary will be adjusted to the new role's base salary.</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Select Staff Member *</label>
                <select value={roleChange.userId} onChange={e=>setRoleChange(p=>({...p,userId:e.target.value}))} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, color:'var(--text)' }}>
                  <option value="">— Select staff —</option>
                  {users.filter(u=>u.id!==currentUser.id&&(role=== 'regional_coordinator'?u.dept===currentUser.dept:true)).map(u=><option key={u.id} value={u.id}>{u.name} ({ROLE_CONFIG[u.role]?.label||u.role})</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>New Role *</label>
                <select value={roleChange.newRole} onChange={e=>setRoleChange(p=>({...p,newRole:e.target.value}))} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, color:'var(--text)' }}>
                  <option value="">— Select role —</option>
                  {Object.entries(ROLE_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              {['regional_coordinator','unit_leader','technician'].includes(roleChange.newRole) && (
                <div>
                  <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Assign to Unit</label>
                  <select value={roleChange.newDept} onChange={e=>setRoleChange(p=>({...p,newDept:e.target.value}))} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14, color:'var(--text)' }}>
                    <option value="">Keep current unit</option>
                    {allDepts.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div style={{ marginTop:'1rem', display:'flex', justifyContent:'flex-end' }}>
              <Btn variant="primary" onClick={handleChangeRole} disabled={!roleChange.userId||!roleChange.newRole}>🔄 Apply Role Change</Btn>
            </div>
          </div>
        )}

        {/* Delete Staff (CEO only) */}
        {adminTab==='delete' && role==='ceo' && (
          <div>
            <AlertBanner type="error">⚠ Permanently removes the staff member from the system. This cannot be undone. Their task assignments and reports remain for records.</AlertBanner>
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:360, overflowY:'auto' }}>
              {users.filter(u=>u.id!==currentUser.id).map(u=>(
                <div key={u.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background:'var(--bg3)', borderRadius:10, border:'1px solid var(--border)' }}>
                  <Avatar initials={u.avatar} color={u.dept?`var(--primary)`:'var(--text3)'} size={36} src={u.profile_pic}/>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600 }}>{u.name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{ROLE_CONFIG[u.role]?.label||u.role} {u.dept?`· ${u.dept}`:''}</div>
                  </div>
                  <Btn size="sm" variant="danger" onClick={()=>{ if(confirm(`Remove ${u.name} permanently?`)) deleteUserById(u.id); }}>Remove</Btn>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* User Profile Modal */}
      {viewUser && (() => {
        const q = viewUser.qualifications || {};
        return (
          <Modal open={true} onClose={()=>setViewUser(null)} title={viewUser.name} maxWidth={580}>
            <div style={{ display:'flex', gap:16, marginBottom:'1rem', alignItems:'center' }}>
              <Avatar initials={viewUser.avatar} color={DEPT_COLORS[viewUser.dept]||'var(--text3)'} size={60} src={viewUser.profile_pic}/>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:16, fontWeight:800 }}>{viewUser.name}</div>
                <div style={{ fontSize:13, color:'var(--text3)', marginTop:3 }}>{ROLE_CONFIG[viewUser.role]?.label} {viewUser.dept?`· ${viewUser.dept} Unit`:''}</div>
                <div style={{ fontSize:13, color:'var(--text3)' }}>{viewUser.email}</div>
                {viewUser.phone && <div style={{ fontSize:13, color:'var(--text3)', fontFamily:'var(--mono)' }}>{viewUser.phone}</div>}
              </div>
              {(role==='ceo'||viewUser.id===currentUser?.id) && (
                <Btn size="sm" variant="ghost" onClick={handlePhotoPick}>📷 Photo</Btn>
              )}
            </div>
            {viewUser.username && (
              <div style={{ padding:'8px 14px', background:'var(--bg3)', borderRadius:9, marginBottom:'0.75rem', fontSize:12, fontFamily:'var(--mono)', color:'var(--text3)' }}>
                Login: <strong style={{ color:'var(--primary)' }}>{viewUser.username}</strong> {role==='ceo'&&<span>· Pass: {viewUser.password}</span>}
              </div>
            )}
            <ContactActions phone={viewUser.phone} email={viewUser.email}/>
            <SectionTitle>Qualifications</SectionTitle>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              {[['📚 Education',q.studies],['⏳ Experience',q.experience]].map(([l,v])=>v?(
                <div key={l} style={{ padding:'8px 12px', background:'var(--bg3)', borderRadius:9, fontSize:13 }}>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:2 }}>{l}</div>
                  <div style={{ fontWeight:600 }}>{v}</div>
                </div>
              ):null)}
            </div>
            {q.certifications?.length>0&&(
              <div style={{ marginTop:'0.75rem', padding:'8px 12px', background:'var(--bg3)', borderRadius:9, fontSize:13 }}>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:6 }}>🏅 CERTIFICATIONS</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {q.certifications.map(c=><span key={c} style={{ padding:'3px 10px', borderRadius:6, background:'var(--primary-l)', color:'var(--primary)', fontSize:12, fontWeight:600 }}>{c}</span>)}
                </div>
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}
