import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS } from '../data/mockData';
import { Card, PageHeader, Avatar, EmptyState } from '../components/UI';

export default function ChatPage() {
  const { currentUser, messages, sendMessage, markMessagesRead } = useApp();
  const [activeChat, setActiveChat] = useState(null);
  const [text, setText] = useState('');

  const contacts = USERS.filter(u=>u.id!==currentUser.id&&['ceo','hod','team_leader','technician','accountant','daf'].includes(u.role));

  const getConv = (uid) => messages.filter(m=>(m.from===currentUser.id&&m.to===uid)||(m.from===uid&&m.to===currentUser.id)).sort((a,b)=>new Date(a.time)-new Date(b.time));

  const unread = (uid) => messages.filter(m=>m.from===uid&&m.to===currentUser.id&&!m.read).length;

  const openChat = (user) => {
    setActiveChat(user);
    markMessagesRead(user.id);
  };

  const handleSend = () => {
    if (!text.trim()||!activeChat) return;
    sendMessage(activeChat.id, text);
    setText('');
  };

  return (
    <div>
      <PageHeader title="💬 Messages" subtitle="Internal messaging system"/>
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'1rem', height:'calc(100vh - 200px)' }}>
        <Card style={{ padding:0, overflow:'hidden', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontSize:12, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1 }}>Contacts</div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {contacts.map(u => {
              const unreads = unread(u.id);
              const lastMsg = messages.filter(m=>(m.from===currentUser.id&&m.to===u.id)||(m.from===u.id&&m.to===currentUser.id)).pop();
              return (
                <div key={u.id} onClick={()=>openChat(u)}
                  style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', cursor:'pointer', background:activeChat?.id===u.id?'var(--primary-l)':'transparent', transition:'background .1s' }}
                  onMouseEnter={e=>activeChat?.id!==u.id&&(e.currentTarget.style.background='var(--bg3)')}
                  onMouseLeave={e=>activeChat?.id!==u.id&&(e.currentTarget.style.background='transparent')}>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <div style={{ position:'relative' }}>
                      <Avatar initials={u.avatar} size={36} src={u.profile_pic}/>
                      {unreads>0&&<span style={{ position:'absolute', top:-4, right:-4, width:16, height:16, borderRadius:'50%', background:'var(--red)', color:'#fff', fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid var(--bg2)' }}>{unreads}</span>}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.name}</div>
                      <div style={{ fontSize:11, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{lastMsg?lastMsg.text.slice(0,30)+'...':u.role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card style={{ padding:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {!activeChat ? (
            <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <EmptyState icon="💬" title="Select a contact" body="Choose someone from the left to start messaging"/>
            </div>
          ) : (
            <>
              <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:12, alignItems:'center' }}>
                <Avatar initials={activeChat.avatar} size={36} src={activeChat.profile_pic}/>
                <div>
                  <div style={{ fontSize:14, fontWeight:700 }}>{activeChat.name}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{activeChat.role} · {activeChat.dept||'Admin'}</div>
                </div>
              </div>
              <div style={{ flex:1, overflowY:'auto', padding:'1rem', display:'flex', flexDirection:'column', gap:10 }}>
                {getConv(activeChat.id).length===0
                  ? <EmptyState icon="💬" title="No messages yet" body="Start the conversation"/>
                  : getConv(activeChat.id).map(m=>{
                    const isMe = m.from===currentUser.id;
                    return (
                      <div key={m.id} style={{ display:'flex', justifyContent:isMe?'flex-end':'flex-start' }}>
                        <div style={{ maxWidth:'70%', padding:'10px 14px', borderRadius:isMe?'14px 14px 4px 14px':'14px 14px 14px 4px', background:isMe?'var(--primary)':'var(--bg3)', color:isMe?'#fff':'var(--text)', fontSize:14, lineHeight:1.5 }}>
                          <div>{m.text}</div>
                          <div style={{ fontSize:10, marginTop:4, opacity:.6 }}>{new Date(m.time).toLocaleTimeString('en-RW',{hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                      </div>
                    );
                  })
                }
              </div>
              <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:10 }}>
                <input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()} placeholder="Type a message..." style={{ flex:1, padding:'10px 14px', border:'1.5px solid var(--border)', borderRadius:9, background:'var(--bg3)', fontSize:14, outline:'none' }}/>
                <button onClick={handleSend} disabled={!text.trim()} style={{ padding:'10px 20px', borderRadius:9, background:'var(--primary)', color:'#fff', border:'none', fontWeight:600, cursor:'pointer', fontFamily:'var(--font)', fontSize:14, opacity:text.trim()?1:.5 }}>Send</button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
