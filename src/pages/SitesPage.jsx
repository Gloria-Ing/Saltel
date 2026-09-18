import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { DEPARTMENTS } from '../data/mockData';
import { Card, PageHeader, SectionTitle, Badge, StatCard, Modal, Input, Btn, AlertBanner } from '../components/UI';

export default function SitesPage() {
  const { tasks, sites, currentUser, registerSiteGlobal } = useApp();
  const role = currentUser?.role;
  const canRegisterSite = ['ceo', 'hod'].includes(role);

  const [showAddSite, setShowAddSite] = useState(false);
  const [siteForm, setSiteForm] = useState({ name:'', location:'', province:'Kigali', type:'Corporate', rural:false, lat:'', lng:'' });
  const [siteSuccess, setSiteSuccess] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);

  const handleAddSite = () => {
    if (!siteForm.name.trim()||!siteForm.location.trim()) { alert('Site name and location are required.'); return; }
    registerSiteGlobal(siteForm);
    setSiteSuccess(`✓ Site "${siteForm.name}" registered successfully!`);
    setSiteForm({ name:'', location:'', province:'Kigali', type:'Corporate', rural:false, lat:'', lng:'' });
    setTimeout(()=>{ setSiteSuccess(''); setShowAddSite(false); }, 3000);
  };

  const captureGPS = () => {
    setGpsLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setSiteForm(p=>({ ...p, lat:pos.coords.latitude.toFixed(6), lng:pos.coords.longitude.toFixed(6) }));
          setGpsLoading(false);
        },
        () => { setGpsLoading(false); alert('Could not get GPS location. Please enter manually.'); }
      );
    } else {
      setGpsLoading(false);
    }
  };

  const allSites = sites || [];

  return (
    <div>
      <PageHeader
        title="📍 Deployment Sites"
        subtitle="Field operation sites across Rwanda"
        action={canRegisterSite && (
          <Btn variant="primary" onClick={()=>setShowAddSite(true)}>📍 Register New Site</Btn>
        )}
      />
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'1.5rem' }}>
        <StatCard label="Total Sites" value={allSites.length} color="var(--primary)" icon="📍"/>
        <StatCard label="Urban Sites" value={allSites.filter(s=>!s.rural).length} color="var(--green)" icon="🏙"/>
        <StatCard label="Rural Sites" value={allSites.filter(s=>s.rural).length} color="var(--amber)" icon="🌾"/>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
        {allSites.map(site => {
          const siteTasks = tasks.filter(t=>t.site_id===site.id);
          const active = siteTasks.filter(t=>t.workflow_stage==='technicians_assigned').length;
          return (
            <Card key={site.id}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:800, marginBottom:3 }}>{site.name}</div>
                  <div style={{ fontSize:12, color:'var(--text3)' }}>{site.location}</div>
                </div>
                <span style={{ fontSize:11, background:site.rural?'var(--amber-l)':'var(--primary-l)', color:site.rural?'var(--amber-d)':'var(--primary)', padding:'4px 10px', borderRadius:8, fontWeight:600, border:`1px solid ${site.rural?'var(--amber)':'var(--border2)'}` }}>
                  {site.rural?'🌾 Rural':'🏙 Urban'}
                </span>
              </div>
              <div style={{ display:'flex', gap:'1rem', fontSize:12, color:'var(--text3)', marginBottom:10, flexWrap:'wrap' }}>
                <span>🗺 {site.province}</span>
                <span>🏢 {site.type}</span>
                <span>📌 {(site.lat||0).toFixed(4)}, {(site.lng||0).toFixed(4)}</span>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ flex:1, padding:'8px', background:'var(--bg3)', borderRadius:8, textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'var(--primary)' }}>{siteTasks.length}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Total Tasks</div>
                </div>
                <div style={{ flex:1, padding:'8px', background:active>0?'var(--green-l)':'var(--bg3)', borderRadius:8, textAlign:'center', border:active>0?'1px solid var(--green)':'none' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:active>0?'var(--green-d)':'var(--text3)' }}>{active}</div>
                  <div style={{ fontSize:11, color:active>0?'var(--green-d)':'var(--text3)' }}>Active Now</div>
                </div>
                <div style={{ flex:1, padding:'8px', background:'var(--bg3)', borderRadius:8, textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:800, color:'var(--text2)' }}>{siteTasks.filter(t=>t.workflow_stage==='completed').length}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>Completed</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:'1rem', marginTop:10 }}>
                <div style={{ fontSize:12, color:'var(--amber-d)', fontWeight:600 }}>
                  🚗 Transport: RWF {site.rural?'15,000':'5,000'}
                </div>
                {site.rural && <div style={{ fontSize:12, color:'var(--purple)', fontWeight:600 }}>🏨 Lodging: RWF 10,000/night</div>}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Register New Site Modal (CEO & Supervisor) */}
      <Modal open={showAddSite} onClose={()=>setShowAddSite(false)} title={`📍 Register New Site${role==='hod'?' (Supervisor)':''}`} maxWidth={520}>
        {siteSuccess && <AlertBanner type="success">{siteSuccess}</AlertBanner>}
        <div style={{ fontSize:13, color:'var(--text3)', marginBottom:'1rem' }}>Register a new deployment site for field operations.</div>
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
          <div>
            <Input label="Latitude" value={siteForm.lat} onChange={e=>setSiteForm(p=>({...p,lat:e.target.value}))} placeholder="-1.9441"/>
            <Btn variant="ghost" size="sm" style={{ marginTop:6 }} onClick={captureGPS} disabled={gpsLoading}>
              {gpsLoading ? '📡 Locating...' : '📡 Auto GPS'}
            </Btn>
          </div>
          <Input label="Longitude" value={siteForm.lng} onChange={e=>setSiteForm(p=>({...p,lng:e.target.value}))} placeholder="30.0619"/>
        </div>
        <div style={{ marginTop:'0.75rem', display:'flex', alignItems:'center', gap:10 }}>
          <input type="checkbox" id="ruralCheckSite" checked={siteForm.rural} onChange={e=>setSiteForm(p=>({...p,rural:e.target.checked}))} style={{ width:16, height:16 }}/>
          <label htmlFor="ruralCheckSite" style={{ fontSize:13, color:'var(--text2)', cursor:'pointer' }}>🏕 Rural site (enables lodging & higher transport allowance)</label>
        </div>
        <div style={{ marginTop:'1rem', display:'flex', gap:10, justifyContent:'flex-end' }}>
          <Btn variant="ghost" onClick={()=>setShowAddSite(false)}>Cancel</Btn>
          <Btn variant="primary" onClick={handleAddSite}>📍 Register Site</Btn>
        </div>
      </Modal>
    </div>
  );
}
