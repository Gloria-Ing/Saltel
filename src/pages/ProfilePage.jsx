import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { ROLE_CONFIG } from '../data/mockData';
import { Card, PageHeader, Btn, SectionTitle, Input, Avatar } from '../components/UI';

export default function ProfilePage() {
  const { currentUser, updateProfilePic, updateUserProfile } = useApp();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName]   = useState(currentUser?.name||'');
  const [phone, setPhone] = useState(currentUser?.phone||'');
  const rc = ROLE_CONFIG[currentUser?.role];

  const handlePhoto = () => {
    const input = document.createElement('input');
    input.type='file'; input.accept='image/*';
    input.onchange = e => {
      const f = e.target.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = ev => updateProfilePic(currentUser.id, ev.target.result);
      reader.readAsDataURL(f);
    };
    input.click();
  };

  const handleSave = () => {
    updateUserProfile(currentUser.id, { name, phone });
    setEditing(false);
  };

  const q = currentUser?.qualifications||{};

  return (
    <div>
      <PageHeader title="⚙ My Profile" subtitle="Manage your personal information" action={<Btn variant="ghost" onClick={()=>navigate(-1)}>← Back</Btn>}/>
      <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:'1.5rem', alignItems:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <Card style={{ textAlign:'center' }}>
            <div style={{ display:'inline-flex', position:'relative', marginBottom:'1rem' }}>
              <Avatar initials={currentUser.avatar} color={rc?.color||'var(--primary)'} size={90} src={currentUser.profile_pic}/>
              <button onClick={handlePhoto} style={{ position:'absolute', bottom:-4, right:-4, width:26, height:26, borderRadius:'50%', background:'var(--primary)', color:'#fff', border:'2px solid var(--bg2)', cursor:'pointer', fontSize:12 }}>📷</button>
            </div>
            <div style={{ fontSize:18, fontWeight:800 }}>{currentUser.name}</div>
            <div style={{ fontSize:13, color:'var(--text3)', marginTop:4 }}>{currentUser.email}</div>
            <div style={{ marginTop:10 }}>
              <span style={{ fontSize:12, background:`${rc?.color||'var(--primary)'}15`, color:rc?.color||'var(--primary)', padding:'4px 12px', borderRadius:8, fontWeight:600, border:`1px solid ${rc?.color||'var(--primary)'}25` }}>{rc?.label||currentUser.role}</span>
            </div>
            {currentUser.dept&&<div style={{ marginTop:6, fontSize:12, color:'var(--text3)' }}>{currentUser.dept} Unit</div>}
          </Card>
          <Card>
            <SectionTitle>Account Details</SectionTitle>
            {[
              ['📅 Hire Date', currentUser.hire_date||'—'],
              ['💰 Base Salary', currentUser.salary?`RWF ${currentUser.salary.toLocaleString()}`:'—'],
              ['🆔 Employee ID', `EMP-${String(currentUser.id).padStart(3,'0')}`],
            ].map(([l,v])=>(
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
                <span style={{ color:'var(--text3)' }}>{l}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <Card>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
              <SectionTitle>Personal Information</SectionTitle>
              {!editing&&<Btn size="sm" variant="ghost" onClick={()=>setEditing(true)}>✏ Edit</Btn>}
            </div>
            {editing ? (
              <div>
                <Input label="Full Name" value={name} onChange={e=>setName(e.target.value)}/>
                <Input label="Phone" value={phone} onChange={e=>setPhone(e.target.value)}/>
                <div style={{ display:'flex', gap:8 }}>
                  <Btn variant="primary" onClick={handleSave}>Save Changes</Btn>
                  <Btn variant="ghost" onClick={()=>{ setEditing(false); setName(currentUser.name); setPhone(currentUser.phone); }}>Cancel</Btn>
                </div>
              </div>
            ) : (
              <div>
                {[['Name',currentUser.name],['Email',currentUser.email],['Phone',currentUser.phone||'—']].map(([l,v])=>(
                  <div key={l} style={{ display:'flex', padding:'11px 0', borderBottom:'1px solid var(--border)', fontSize:14 }}>
                    <span style={{ color:'var(--text3)', width:100, flexShrink:0 }}>{l}</span>
                    <span style={{ fontWeight:500 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card>
            <SectionTitle>Qualifications & Certifications</SectionTitle>
            {q.studies&&<div style={{ padding:'10px 14px', background:'var(--bg3)', borderRadius:9, marginBottom:8, fontSize:14 }}>🎓 {q.studies}</div>}
            {q.experience&&<div style={{ padding:'10px 14px', background:'var(--bg3)', borderRadius:9, marginBottom:8, fontSize:14 }}>⚡ {q.experience}</div>}
            {(q.certifications||[]).length>0&&(
              <div>
                <div style={{ fontSize:12, color:'var(--text3)', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>Certifications</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {q.certifications.map(c=><span key={c} style={{ padding:'5px 12px', background:'var(--primary-l)', color:'var(--primary)', borderRadius:8, fontSize:13, fontWeight:600, border:'1px solid var(--border2)' }}>✓ {c}</span>)}
                </div>
              </div>
            )}
            {(q.licenses||[]).length>0&&(
              <div style={{ marginTop:10 }}>
                <div style={{ fontSize:12, color:'var(--text3)', marginBottom:6, fontWeight:600, textTransform:'uppercase', letterSpacing:1 }}>Licenses</div>
                <div style={{ display:'flex', gap:6 }}>
                  {q.licenses.map(l=><span key={l} style={{ padding:'5px 12px', background:'var(--green-l)', color:'var(--green-d)', borderRadius:8, fontSize:13, fontWeight:600 }}>🪪 {l}</span>)}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
