import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { USERS, ROLE_CONFIG } from '../data/mockData';

const DEMO_CREDS = {
  'ceo@saltel.rw':         { id:1,  pass:'ceo2026' },
  'hod.lan@saltel.rw':     { id:2,  pass:'saltel' },
  'hod.fiber@saltel.rw':   { id:3,  pass:'saltel' },
  'hod.cctv@saltel.rw':    { id:4,  pass:'saltel' },
  'lead.lan@saltel.rw':    { id:5,  pass:'saltel' },
  'lead.fiber@saltel.rw':  { id:6,  pass:'saltel' },
  'lead.cctv@saltel.rw':   { id:7,  pass:'saltel' },
  'tech.jb@saltel.rw':     { id:8,  pass:'saltel' },
  'tech.mu@saltel.rw':     { id:9,  pass:'saltel' },
  'tech.rm@saltel.rw':     { id:10, pass:'saltel' },
  'tech.cn@saltel.rw':     { id:11, pass:'saltel' },
  'tech.di@saltel.rw':     { id:12, pass:'saltel' },
  'tech.ji@saltel.rw':     { id:13, pass:'saltel' },
  'tech.ym@saltel.rw':     { id:14, pass:'saltel' },
  'accountant@saltel.rw':  { id:15, pass:'saltel' },
  'daf@saltel.rw':         { id:16, pass:'saltel' },
};

export default function LoginPage() {
  const { login, users } = useApp();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const inputStyle = () => ({
    width:'100%', padding:'14px 18px', fontSize:16,
    background:'#FFFFFF', border:'1.5px solid #E0ECF8',
    borderRadius:12, color:'#1E293B', outline:'none', fontFamily:'var(--font)',
    transition:'all .2s', letterSpacing:'0.02em', boxSizing:'border-box',
  });

  const handleLogin = () => {
    setError('');
    if (!email.trim() || !password.trim()) { setError('Please enter email and password.'); return; }
    const emailLow = email.toLowerCase().trim();
    // First check DEMO_CREDS map (fast path)
    const cred = DEMO_CREDS[emailLow];
    if (cred && password === cred.pass) {
      setLoading(true);
      setTimeout(() => { login(cred.id); setLoading(false); }, 600);
      return;
    }
    // Then check dynamically registered users (users array)
    const u = users.find(u => u.email.toLowerCase() === emailLow && u.password === password);
    if (u) {
      setLoading(true);
      setTimeout(() => { login(u.id); setLoading(false); }, 600);
      return;
    }
    setError('Invalid email or password. Check the Demo Accounts below.');
  };

  const QUICK = [
    { label:'CEO',        email:'ceo@saltel.rw',      pass:'ceo2026', color:'#7C3AED' },
    { label:'DAF',        email:'daf@saltel.rw',       pass:'saltel',  color:'#EC4899' },
    { label:'Supervisor', email:'hod.lan@saltel.rw',   pass:'saltel',  color:'#169BD5' },
    { label:'HoU',        email:'lead.lan@saltel.rw',  pass:'saltel',  color:'#06B6D4' },
    { label:'Technician', email:'tech.jb@saltel.rw',   pass:'saltel',  color:'#10B981' },
    { label:'Accountant', email:'accountant@saltel.rw',pass:'saltel',  color:'#F97316' },
  ];

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'var(--font)', background:'#F4F8FC', overflow:'hidden', position:'relative' }}>
      {/* Background glows */}
      <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
        <div style={{ position:'absolute', top:'-15%', left:'-10%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(22,155,213,0.1) 0%,transparent 70%)', filter:'blur(40px)' }}/>
        <div style={{ position:'absolute', bottom:'-20%', right:'-5%', width:700, height:700, borderRadius:'50%', background:'radial-gradient(circle,rgba(22,155,213,0.08) 0%,transparent 70%)', filter:'blur(40px)' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(22,155,213,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(22,155,213,0.04) 1px,transparent 1px)', backgroundSize:'50px 50px' }}/>
      </div>

      <div style={{ display:'flex', width:'100%', position:'relative', zIndex:1, flexWrap:'wrap' }}>
        {/* Left brand panel — hidden on small screens */}
        <div className="login-brand-panel" style={{ width:'45%', display:'flex', flexDirection:'column', padding:'3rem 3.5rem', position:'relative', borderRight:'1px solid #E0ECF8', background:'#FFFFFF' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:'3.5rem' }}>
              <div style={{ width:58, height:58, borderRadius:16, background:'rgba(22,155,213,0.1)', border:'2px solid rgba(22,155,213,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontFamily:'var(--font-brand)', fontSize:30, color:'#169BD5', letterSpacing:'2px' }}>S</span>
              </div>
              <div>
                <div style={{ fontSize:28, fontWeight:700, color:'#169BD5', letterSpacing:'2px', fontFamily:'var(--font-brand)' }}>SALTEL</div>
                <div style={{ fontSize:10, color:'#64748B', letterSpacing:'4px', fontWeight:600, marginTop:2 }}>FOMS · V13.0</div>
              </div>
            </div>

            <h1 style={{ fontSize:40, fontWeight:800, color:'#1E293B', lineHeight:1.15, letterSpacing:'-0.5px', marginBottom:20 }}>
              FIELD OPS<br/>
              <span style={{ color:'#169BD5' }}>MANAGEMENT</span><br/>
              SYSTEM
            </h1>
            <div style={{ marginBottom:'2.5rem', borderRadius:16, overflow:'hidden', border:'1px solid #E0ECF8', boxShadow:'0 10px 30px rgba(15,23,42,0.08)', background:'#FFFFFF', position:'relative' }}>
              <img 
                src="/tech_solutions.jpg" 
                alt="Electronics, IT Solutions & Machine Learning" 
                style={{ width:'100%', height:'auto', display:'block', objectFit:'cover' }}
              />
              <div style={{ padding:'12px 16px', background:'#FFFFFF', borderTop:'1px solid #E0ECF8', display:'flex', justifyContent:'space-around', alignItems:'center', gap:8 }}>
                <span style={{ fontSize:12, color:'#169BD5', fontWeight:700, letterSpacing:'0.5px' }}>⚡ Electronics</span>
                <span style={{ fontSize:12, color:'#CBD5E1' }}>•</span>
                <span style={{ fontSize:12, color:'#7C3AED', fontWeight:700, letterSpacing:'0.5px' }}>💻 IT Solutions</span>
                <span style={{ fontSize:12, color:'#CBD5E1' }}>•</span>
                <span style={{ fontSize:12, color:'#10B981', fontWeight:700, letterSpacing:'0.5px' }}>🤖 Machine Learning</span>
              </div>
            </div>
          </div>

          <div style={{ marginTop:'auto', display:'flex', gap:12 }}>
            {[{ n:'16+', l:'Staff' },{ n:'3', l:'Units' },{ n:'7+', l:'Sites' },{ n:'V13', l:'Version' }].map(s=>(
              <div key={s.l} style={{ flex:1, padding:'14px 10px', background:'#F4F8FC', border:'1px solid #E0ECF8', borderRadius:14, textAlign:'center' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'#169BD5', letterSpacing:'1px' }}>{s.n}</div>
                <div style={{ fontSize:11, color:'#64748B', letterSpacing:'2px', marginTop:2, fontWeight:600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right form panel */}
        <div style={{ flex:1, minWidth:300, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem 3rem' }}>
          <div style={{ width:'100%', maxWidth:460, background:'#FFFFFF', padding:'2.5rem', borderRadius:22, boxShadow:'0 10px 40px rgba(15,23,42,0.06)', border:'1px solid #E0ECF8' }}>
            {/* Mobile logo */}
            <div className="login-mobile-logo" style={{ display:'none', alignItems:'center', gap:12, marginBottom:'2rem', justifyContent:'center' }}>
              <div style={{ width:46, height:46, borderRadius:12, background:'rgba(22,155,213,0.1)', border:'2px solid rgba(22,155,213,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:22, color:'#169BD5', fontFamily:'var(--font-brand)' }}>S</span>
              </div>
              <div>
                <div style={{ fontSize:20, fontWeight:700, color:'#169BD5', letterSpacing:'2px', fontFamily:'var(--font-brand)' }}>SALTEL FOMS</div>
                <div style={{ fontSize:10, color:'#64748B', letterSpacing:'3px', fontWeight:600 }}>V13.0 · FIELD OPS MANAGEMENT</div>
              </div>
            </div>

            <div style={{ marginBottom:'2rem' }}>
              <h2 style={{ fontSize:26, color:'#1E293B', fontWeight:800, letterSpacing:'1px', marginBottom:6 }}>WELCOME BACK</h2>
              <p style={{ fontSize:14, color:'#4A607A', letterSpacing:'0.3px', fontWeight:500 }}>Enter your <span style={{ fontFamily:'var(--font-brand)', color:'#169BD5', fontWeight:700 }}>SALTEL</span> credentials to continue</p>
            </div>

            {error && (
              <div style={{ padding:'12px 16px', background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:10, marginBottom:'1.5rem', color:'#DC2626', fontSize:14, fontWeight:600, letterSpacing:'0.5px' }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ marginBottom:'1.25rem' }}>
              <label style={{ display:'block', fontSize:11, color:'#64748B', letterSpacing:'2.5px', marginBottom:8, textTransform:'uppercase', fontWeight:700 }}>Email Address</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#169BD5' }}><i className="bi bi-envelope-fill" /></span>
                <input type="email" value={email} onChange={e=>{setEmail(e.target.value);setError('');}}
                  onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="name@saltel.rw"
                  autoComplete="username"
                  style={{ ...inputStyle(), paddingLeft:44 }}
                  onFocus={e=>{ e.target.style.borderColor='#169BD5'; e.target.style.boxShadow='0 0 0 3px rgba(22,155,213,0.15)'; }}
                  onBlur={e=>{ e.target.style.borderColor='#E0ECF8'; e.target.style.boxShadow='none'; }}/>
              </div>
            </div>

            <div style={{ marginBottom:'1.75rem' }}>
              <label style={{ display:'block', fontSize:11, color:'#64748B', letterSpacing:'2.5px', marginBottom:8, textTransform:'uppercase', fontWeight:700 }}>Password</label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:16, top:'50%', transform:'translateY(-50%)', fontSize:15, color:'#169BD5' }}><i className="bi bi-lock-fill" /></span>
                <input type={showPass?'text':'password'} value={password}
                  onChange={e=>{setPassword(e.target.value);setError('');}}
                  onKeyDown={e=>e.key==='Enter'&&handleLogin()} placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ ...inputStyle(), paddingLeft:44, paddingRight:50 }}
                  onFocus={e=>{ e.target.style.borderColor='#169BD5'; e.target.style.boxShadow='0 0 0 3px rgba(22,155,213,0.15)'; }}
                  onBlur={e=>{ e.target.style.borderColor='#E0ECF8'; e.target.style.boxShadow='none'; }}/>
                <button onClick={()=>setShowPass(!showPass)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:16, color:'#64748B', cursor:'pointer', background:'none', border:'none' }}>
                  <i className={showPass?'bi bi-eye-slash-fill':'bi bi-eye-fill'} />
                </button>
              </div>
            </div>

            <button onClick={handleLogin} disabled={loading}
              style={{ width:'100%', padding:'15px', borderRadius:12, fontSize:15, fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', cursor:loading?'wait':'pointer', border:'none', background:loading?'rgba(22,155,213,0.5)':'linear-gradient(135deg,#169BD5 0%,#0D8EC8 100%)', color:'#fff', fontFamily:'var(--font)', boxShadow:loading?'none':'0 8px 24px rgba(22,155,213,0.32)', transition:'all .2s', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              {loading ? 'AUTHENTICATING...' : <span>VIEW MORE <i className="bi bi-arrow-right-short" style={{ fontSize:20, verticalAlign:'middle' }} /></span>}
            </button>

            <div style={{ marginTop:'1.75rem', padding:'1.25rem', background:'#F4F8FC', border:'1px solid #E0ECF8', borderRadius:14 }}>
              <button onClick={()=>setShowDemo(!showDemo)} style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', color:'#4A607A', fontSize:12, letterSpacing:'1.5px', fontWeight:700, cursor:'pointer', background:'none', border:'none', fontFamily:'var(--font)' }}>
                <span>DEMO ACCOUNTS</span>
                <span style={{ fontSize:12 }}><i className={showDemo?'bi bi-chevron-up':'bi bi-chevron-down'} /></span>
              </button>
              {showDemo && (
                <div style={{ marginTop:'1rem', display:'flex', flexDirection:'column', gap:6 }}>
                  {QUICK.map(q=>(
                    <button key={q.email} onClick={()=>{ setEmail(q.email); setPassword(q.pass); setError(''); }}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 13px', borderRadius:9, background:'#FFFFFF', border:`1px solid ${q.color}40`, cursor:'pointer', transition:'all .15s', fontFamily:'var(--font)', textAlign:'left' }}>
                      <span style={{ width:8, height:8, borderRadius:'50%', background:q.color, flexShrink:0 }}/>
                      <span style={{ fontSize:13, color:q.color, letterSpacing:'0.5px', fontWeight:600 }}>{q.label}</span>
                      <span style={{ fontSize:11, color:'#64748B', marginLeft:'auto', fontFamily:'monospace' }}>{q.email}</span>
                    </button>
                  ))}
                  <div style={{ fontSize:11, color:'#64748B', textAlign:'center', marginTop:4, letterSpacing:'1px', fontWeight:500 }}>
                    PASSWORD: "saltel" (CEO: "ceo2026")
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign:'center', marginTop:'1.5rem', fontSize:11, color:'#64748B', letterSpacing:'1px', fontWeight:500 }}>
              SALTEL Ltd · FOMS V13 · Kigali, Rwanda
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .login-brand-panel { display: none !important; }
          .login-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
