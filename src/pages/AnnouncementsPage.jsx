import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS, DEPARTMENTS } from '../data/mockData';
import { Card, PageHeader, Btn, SectionTitle, EmptyState, Modal, Textarea, Input, Avatar } from '../components/UI';

export default function AnnouncementsPage() {
  const { currentUser, announcements, myAnnouncements, createAnnouncement, users } = useApp();
  const role = currentUser?.role;
  const canCreate = ['ceo','hod','team_leader'].includes(role);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:'', body:'', target:'all', target_dept:currentUser?.dept||null, pinned:false });
  const setF = (k,v) => setForm(p=>({...p,[k]:v}));

  const handleCreate = () => {
    if (!form.title.trim()||!form.body.trim()) { alert('Fill in title and message.'); return; }
    createAnnouncement(form);
    setForm({ title:'', body:'', target:'all', target_dept:currentUser?.dept||null, pinned:false });
    setShowForm(false);
  };

  // v10: Sort newest first
  const sorted = [...myAnnouncements].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));

  const targetOpts = [
    { value:'all', label:'All Staff' },
    { value:'technician', label:'Technicians Only' },
    { value:'team_leader', label:'Team Leaders Only' },
    { value:'hod', label:'Heads of Unit Only' },
  ];

  return (
    <div>
      <PageHeader
        title="📢 Announcements"
        subtitle="Company-wide and team announcements"
        action={canCreate && <Btn variant="primary" onClick={()=>setShowForm(true)}>＋ New Announcement</Btn>}
      />

      {sorted.length===0 ? (
        <EmptyState icon="📢" title="No announcements" body="No announcements for your role"/>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {sorted.map(a => {
            const author = users.find(u=>u.id===a.from_user_id);
            const isNew = new Date(a.created_at) > new Date(Date.now()-86400000*2);
            return (
              <Card key={a.id} style={{ borderLeft:`4px solid ${a.pinned?'var(--amber)':'var(--primary)'}` }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:5, flexWrap:'wrap' }}>
                      {a.pinned&&<span style={{ fontSize:11, background:'var(--amber-l)', color:'var(--amber-d)', padding:'2px 8px', borderRadius:6, fontWeight:700 }}>📌 PINNED</span>}
                      {isNew&&<span style={{ fontSize:11, background:'var(--green-l)', color:'var(--green-d)', padding:'2px 8px', borderRadius:6, fontWeight:700 }}>NEW</span>}
                      <span style={{ fontSize:11, background:'var(--bg3)', color:'var(--text3)', padding:'2px 8px', borderRadius:6 }}>
                        {a.target==='all'?'All Staff':a.target}{a.target_dept?` · ${a.target_dept}`:''}
                      </span>
                    </div>
                    <div style={{ fontSize:16, fontWeight:700, marginBottom:6 }}>{a.title}</div>
                    <div style={{ fontSize:14, color:'var(--text2)', lineHeight:1.8 }}>{a.body}</div>
                  </div>
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center', borderTop:'1px solid var(--border)', paddingTop:10, marginTop:6 }}>
                  <Avatar initials={author?.avatar||'?'} size={28} src={author?.profile_pic}/>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>
                    <strong>{author?.name||'Unknown'}</strong> · {new Date(a.created_at).toLocaleDateString('en-RW',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={showForm} onClose={()=>setShowForm(false)} title="New Announcement" maxWidth={500}>
        <Input label="Title *" value={form.title} onChange={e=>setF('title',e.target.value)} placeholder="e.g. Q2 Safety Reminder"/>
        <Textarea label="Message *" value={form.body} onChange={e=>setF('body',e.target.value)} placeholder="Write your announcement..."/>
        <div style={{ marginBottom:'1rem' }}>
          <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>Audience</label>
          <select value={form.target} onChange={e=>setF('target',e.target.value)} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:9, fontSize:14 }}>
            {targetOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <label style={{ display:'flex', gap:8, alignItems:'center', marginBottom:'1.5rem', cursor:'pointer' }}>
          <input type="checkbox" checked={form.pinned} onChange={e=>setF('pinned',e.target.checked)}/>
          <span style={{ fontSize:13, fontWeight:600 }}>📌 Pin this announcement</span>
        </label>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn variant="ghost" onClick={()=>setShowForm(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleCreate} disabled={!form.title.trim()||!form.body.trim()}>Post Announcement</Btn>
        </div>
      </Modal>
    </div>
  );
}
