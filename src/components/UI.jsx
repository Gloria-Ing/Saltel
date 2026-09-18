import { useState } from 'react';
import { STATUS_LABELS } from '../data/mockData';

export function SaltelBrand({ children='SALTEL', style={} }) {
  return (
    <span className="saltel-brand" style={{ fontFamily:'var(--font-brand)', color:'var(--saltel)', letterSpacing:'2px', fontWeight:700, display:'inline-block', ...style }}>
      {children}
    </span>
  );
}

export function Modal({ open, onClose, title, children, maxWidth=700 }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(15,23,42,.6)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'2rem 1rem' }}>
      <div onClick={e=>e.stopPropagation()} style={{ background:'var(--bg2)', borderRadius:'var(--r3)', width:'100%', maxWidth, boxShadow:'0 20px 60px rgba(15,23,42,.18)', position:'relative', marginTop:'auto', marginBottom:'auto', border:'1px solid var(--border)', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'1.25rem 1.75rem', borderBottom:'1px solid var(--border)', background:'var(--bg3)' }}>
          <div style={{ fontSize:17, fontWeight:800, letterSpacing:'-0.3px', color:'var(--text)' }}>{title}</div>
          <button onClick={onClose} style={{ fontSize:14, color:'var(--text3)', cursor:'pointer', padding:'6px 10px', borderRadius:10, background:'var(--bg2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}><i className="bi bi-x-lg" /></button>
        </div>
        <div style={{ padding:'1.75rem' }}>{children}</div>
      </div>
    </div>
  );
}

export function Card({ children, style={}, onClick, hover=true }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>hover&&onClick&&setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'1.25rem', boxShadow:hov?'0 10px 32px rgba(22,155,213,.16)':'var(--shadow)', cursor:onClick?'pointer':'default', transition:'all .2s ease', ...style }}>
      {children}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.5rem' }}>
      <div>
        <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.6px', marginBottom:3 }}>{title}</h1>
        {subtitle && <p style={{ color:'var(--text3)', fontSize:15, fontWeight:500 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, sub, color='var(--primary)', icon, trend, onClick }) {
  return (
    <div onClick={onClick} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r2)', padding:'1.2rem 1.35rem', boxShadow:'var(--shadow)', position:'relative', overflow:'hidden', cursor:onClick?'pointer':'default' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:color, borderRadius:'16px 16px 0 0' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
        <div style={{ fontSize:12, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:1 }}>{label}</div>
        {icon && <span style={{ fontSize:20, opacity:.7 }}>{icon}</span>}
      </div>
      <div style={{ fontSize:26, fontWeight:800, color, fontFamily:'var(--mono)', letterSpacing:'-0.5px', lineHeight:1.1 }}>{value}</div>
      {sub && <div style={{ fontSize:12, color:'var(--text3)', marginTop:6, fontWeight:500 }}>{sub}</div>}
      {trend!==undefined && <div style={{ fontSize:12, marginTop:4, fontWeight:600, color:trend>0?'var(--green)':'var(--red)' }}>{trend>0?'↑':'↓'} {Math.abs(trend)}% vs last month</div>}
    </div>
  );
}

const BADGE_MAP = {
  ceo_created:                { label:'Pending Supervisor',        color:'var(--purple)',  bg:'var(--purple-l)' },
  hod_created:                { label:'Pending Leader',            color:'var(--amber)',   bg:'var(--amber-l)'  },
  leader_assigned:            { label:'Pending Techs',             color:'var(--cyan)',    bg:'var(--cyan-l)'   },
  supervisor_approval_pending:{ label:'⏳ Awaiting Supervisor Approval', color:'#B45309',  bg:'#FEF3C7'         },
  technicians_assigned:       { label:'In Progress',               color:'var(--primary)', bg:'var(--primary-l)'},
  completed:                  { label:'Completed',                 color:'var(--green)',   bg:'var(--green-l)'  },
  pending:                    { label:'Pending',                   color:'var(--amber)',   bg:'var(--amber-l)'  },
  approved:                   { label:'Approved',                  color:'var(--green)',   bg:'var(--green-l)'  },
  paid:                       { label:'Paid',                      color:'var(--green)',   bg:'var(--green-l)'  },
  disputed:                   { label:'Disputed',                  color:'var(--red)',     bg:'var(--red-l)'    },
  urgent:                     { label:'Urgent',                    color:'var(--red)',     bg:'var(--red-l)'    },
  high:                       { label:'High',                      color:'var(--amber)',   bg:'var(--amber-l)'  },
  medium:                     { label:'Medium',                    color:'var(--cyan)',    bg:'var(--cyan-l)'   },
  tl_pending:                 { label:'Awaiting Leader',           color:'var(--purple)',  bg:'var(--purple-l)' },
  tl_approved:                { label:'Leader Approved',           color:'var(--cyan)',    bg:'var(--cyan-l)'   },
  rejected:                   { label:'Rejected',                  color:'var(--red)',     bg:'var(--red-l)'    },
};

export function Badge({ status, label }) {
  const cfg = BADGE_MAP[status] || { label:label||status, color:'var(--text3)', bg:'var(--bg4)' };
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, background:cfg.bg, color:cfg.color, whiteSpace:'nowrap', letterSpacing:'.2px' }}>
      {cfg.label}
    </span>
  );
}

export function Avatar({ initials, color='var(--primary)', size=36, src }) {
  if (src) {
    return (
      <div style={{ width:size, height:size, borderRadius:size*.3, overflow:'hidden', flexShrink:0, border:`2px solid ${color}30` }}>
        <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
      </div>
    );
  }
  return (
    <div style={{ width:size, height:size, borderRadius:size*.3, background:`${color}18`, border:`1.5px solid ${color}30`, color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.32, fontWeight:700, fontFamily:'var(--mono)', flexShrink:0 }}>
      {initials}
    </div>
  );
}

export function Btn({ children, variant='default', onClick, disabled, style={}, size='md' }) {
  const V = {
    default:{ background:'var(--bg4)', color:'var(--text)', border:'1px solid var(--border2)' },
    primary:{ background:'linear-gradient(135deg, #169BD5 0%, #0D8EC8 100%)', color:'#fff', border:'none', boxShadow:'var(--shadow-btn)', letterSpacing:'0.8px', textTransform:'uppercase', fontWeight:700 },
    success:{ background:'var(--green)', color:'#fff', border:'none', boxShadow:'0 6px 18px rgba(16,185,129,0.25)' },
    danger: { background:'var(--red)', color:'#fff', border:'none', boxShadow:'0 6px 18px rgba(239,68,68,0.25)' },
    ghost:  { background:'transparent', color:'var(--text2)', border:'1px solid var(--border)' },
    amber:  { background:'var(--amber-l)', color:'var(--amber-d)', border:'1px solid var(--amber)' },
    purple: { background:'var(--purple-l)', color:'var(--purple)', border:'1px solid var(--purple)' },
  };
  const S = { sm:{ padding:'6px 14px', fontSize:12, borderRadius:10 }, md:{ padding:'10px 22px', fontSize:14, borderRadius:12 }, lg:{ padding:'14px 28px', fontSize:15, borderRadius:14 } };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...V[variant]||V.default, ...S[size]||S.md, cursor:disabled?'not-allowed':'pointer', fontFamily:'var(--font)', opacity:disabled?.55:1, transition:'all .18s ease', ...style }}>
      {children}
    </button>
  );
}

export function Input({ label, type='text', value, onChange, placeholder, style={} }) {
  return (
    <div>
      {label && <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>{label}</label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:12, fontSize:14, boxSizing:'border-box', color:'var(--text)', ...style }}/>
    </div>
  );
}

export function Textarea({ label, value, onChange, placeholder, rows=3 }) {
  return (
    <div style={{ marginBottom:'0.75rem' }}>
      {label && <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>{label}</label>}
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:12, fontSize:14, resize:'vertical', boxSizing:'border-box', color:'var(--text)' }}/>
    </div>
  );
}

export function SSelect({ label, value, onChange, options }) {
  return (
    <div style={{ marginBottom:'0.75rem' }}>
      {label && <label style={{ display:'block', fontSize:13, fontWeight:600, color:'var(--text2)', marginBottom:5 }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ width:'100%', padding:'10px 14px', background:'var(--bg3)', border:'1.5px solid var(--border)', borderRadius:12, fontSize:14, color:'var(--text)' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function SectionTitle({ children }) {
  return <div style={{ fontSize:13, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, marginBottom:'0.75rem', marginTop:'1.25rem' }}>{children}</div>;
}

export function EmptyState({ icon, title, body }) {
  return (
    <div style={{ textAlign:'center', padding:'3rem 1rem' }}>
      <div style={{ fontSize:40, marginBottom:12, opacity:.4 }}>{icon}</div>
      <div style={{ fontSize:16, fontWeight:700, marginBottom:6, color:'var(--text2)' }}>{title}</div>
      {body && <div style={{ fontSize:14, color:'var(--text3)' }}>{body}</div>}
    </div>
  );
}

export function AlertBanner({ type='info', children }) {
  const C = {
    info:   { bg:'var(--primary-l)', border:'var(--primary)',  color:'var(--primary)' },
    warning:{ bg:'var(--amber-l)',   border:'var(--amber)',    color:'var(--amber-d)' },
    success:{ bg:'var(--green-l)',   border:'var(--green)',    color:'var(--green-d)' },
    error:  { bg:'var(--red-l)',     border:'var(--red)',      color:'var(--red-d)'   },
  };
  const c = C[type]||C.info;
  return (
    <div style={{ padding:'12px 16px', background:c.bg, border:`1.5px solid ${c.border}`, borderRadius:12, marginBottom:'1rem', fontSize:13, color:c.color, fontWeight:600 }}>
      {children}
    </div>
  );
}

export function ScoreRing({ score, size=64 }) {
  const r = size*0.4;
  const circ = 2*Math.PI*r;
  const dash = circ*(score/100);
  const color = score>=85?'var(--green)':score>=70?'var(--primary)':'var(--amber)';
  return (
    <div style={{ position:'relative', width:size, height:size, flexShrink:0 }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border2)" strokeWidth={size*0.10}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.10}
          strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}/>
      </svg>
      <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*.22, fontWeight:800, color, fontFamily:'var(--mono)' }}>{score}</div>
    </div>
  );
}

export function Table({ headers, rows }) {
  return (
    <div style={{ overflow:'hidden', borderRadius:16, border:'1px solid var(--border)', background:'var(--bg2)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr>{headers.map(h=><th key={h} style={{ padding:'12px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:1, background:'var(--bg3)', borderBottom:'1.5px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row,i)=>(
            <tr key={i} style={{ borderBottom: i===rows.length-1 ? 'none' : '1px solid var(--border)' }}>
              {row.map((cell,j)=><td key={j} style={{ padding:'12px 16px', fontSize:13 }}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ContactActions({ phone, email }) {
  return (
    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
      {phone && <a href={`tel:${phone}`} style={{ padding:'5px 10px', borderRadius:7, background:'var(--green-l)', border:'1px solid var(--green)', color:'var(--green-d)', fontSize:12, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center' }}><i className="bi bi-telephone-fill me-1" /> Call</a>}
      {email && <a href={`mailto:${email}`} style={{ padding:'5px 10px', borderRadius:7, background:'var(--primary-l)', border:'1px solid var(--primary)', color:'var(--primary)', fontSize:12, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center' }}><i className="bi bi-envelope-fill me-1" /> Email</a>}
    </div>
  );
}
