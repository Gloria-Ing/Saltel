import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { DEPARTMENTS, SITES } from '../data/mockData';
import { Card, PageHeader, Btn, Input, Textarea, SSelect, SectionTitle } from '../components/UI';

export default function NewTaskPage() {
  const { ceoCreateTask, hodCreateTask, currentUser } = useApp();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title:'', description:'', dept:currentUser?.dept||'LAN', site_id:'1',
    priority:'high', start_date:'', end_date:'',
    report_schedule:'daily', report_time:'18:00', hod_notes:'',
  });
  const [loading, setLoading] = useState(false);

  const set = (k,v) => setForm(p=>({ ...p, [k]:v }));

  const handleSubmit = () => {
    if (!form.title.trim()||!form.start_date||!form.end_date) { alert('Fill in title, start and end date.'); return; }
    if (new Date(form.end_date)<new Date(form.start_date)) { alert('End date must be after start date.'); return; }
    setLoading(true);
    const fn = currentUser?.role==='ceo' ? ceoCreateTask : hodCreateTask;
    fn(form);
    setTimeout(() => { setLoading(false); navigate('/tasks'); }, 600);
  };

  const deptOptions = DEPARTMENTS.map(d=>({ value:d.id, label:d.label }));
  const siteOptions = SITES.map(s=>({ value:String(s.id), label:`${s.name} — ${s.location}` }));
  const priorityOpts = [{ value:'urgent',label:'🔴 Urgent' },{ value:'high',label:'🟠 High' },{ value:'medium',label:'🟡 Medium' },{ value:'low',label:'🟢 Low' }];
  const schedOpts = [{ value:'daily',label:'Daily Report' },{ value:'once',label:'Single Final Report' },{ value:'weekly',label:'Weekly' }];
  const timeOpts = ['08:00','10:00','12:00','14:00','16:00','17:00','18:00','19:00','20:00'].map(t=>({ value:t,label:t }));

  const selectedSite = SITES.find(s=>s.id===Number(form.site_id));

  return (
    <div>
      <PageHeader
        title="📋 Create New Task"
        subtitle={`Creating as ${currentUser?.role==='ceo'?'CEO (will route to HoU)':'HoU (direct assignment)'}`}
        action={<Btn variant="ghost" onClick={()=>navigate('/tasks')}>← Back to Tasks</Btn>}
      />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:'1.5rem', alignItems:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <Card>
            <SectionTitle>Task Details</SectionTitle>
            <Input label="Task Title *" value={form.title} onChange={e=>set('title',e.target.value)} placeholder="e.g. LAN Infrastructure Upgrade — KCC"/>
            <Textarea label="Description" value={form.description} onChange={e=>set('description',e.target.value)} placeholder="Describe the scope of work, objectives, and deliverables..."/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <SSelect label="Department / Unit *" options={deptOptions} value={form.dept} onChange={e=>set('dept',e.target.value)}/>
              <SSelect label="Priority Level *" options={priorityOpts} value={form.priority} onChange={e=>set('priority',e.target.value)}/>
            </div>
          </Card>

          <Card>
            <SectionTitle>📍 Site & Schedule</SectionTitle>
            <SSelect label="Deployment Site *" options={siteOptions} value={form.site_id} onChange={e=>set('site_id',e.target.value)}/>
            {selectedSite && (
              <div style={{ padding:'12px 14px', background:'var(--bg3)', borderRadius:10, marginBottom:'1rem', fontSize:13 }}>
                <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
                  <span>📍 {selectedSite.location}</span>
                  <span>🗺 {selectedSite.province}</span>
                  <span>{selectedSite.rural ? '🌾 Rural site' : '🏙 Urban site'}</span>
                  <span>🏢 {selectedSite.type}</span>
                </div>
                {selectedSite.rural && <div style={{ marginTop:8, color:'var(--amber-d)', fontWeight:600, fontSize:12 }}>⚠ Rural site — higher transport & lodging rates apply</div>}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <Input label="Start Date *" type="date" value={form.start_date} onChange={e=>set('start_date',e.target.value)}/>
              <Input label="End Date *" type="date" value={form.end_date} onChange={e=>set('end_date',e.target.value)}/>
            </div>
          </Card>

          <Card>
            <SectionTitle>📋 Reporting Requirements</SectionTitle>
            {/* v10: removed auto-calculated fees section */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
              <SSelect label="Report Schedule" options={schedOpts} value={form.report_schedule} onChange={e=>set('report_schedule',e.target.value)}/>
              <SSelect label="Submission Deadline" options={timeOpts} value={form.report_time} onChange={e=>set('report_time',e.target.value)}/>
            </div>
          </Card>

          {currentUser?.role==='ceo' && (
            <Card>
              <SectionTitle>📝 Notes for HoU</SectionTitle>
              <Textarea label="Instructions to Head of Unit" value={form.hod_notes} onChange={e=>set('hod_notes',e.target.value)} placeholder="Add any important instructions, constraints, or briefing notes for the Supervisor..."/>
            </Card>
          )}

          <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
            <Btn variant="ghost" onClick={()=>navigate('/tasks')}>Cancel</Btn>
            <Btn variant="primary" onClick={handleSubmit} disabled={loading} size="lg">
              {loading ? '⏳ Creating...' : currentUser?.role==='ceo' ? '🚀 Create & Route to HoU' : '📋 Create Task'}
            </Btn>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          <Card>
            <SectionTitle>📌 Workflow Preview</SectionTitle>
            {currentUser?.role==='ceo' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { step:1, label:'CEO creates task', active:true, done:false },
                  { step:2, label:'HoU assigns HoU', active:false, done:false },
                  { step:3, label:'Leader assigns technicians', active:false, done:false },
                  { step:4, label:'Field work in progress', active:false, done:false },
                  { step:5, label:'Tech submits report', active:false, done:false },
                ].map(s=>(
                  <div key={s.step} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:s.active?'var(--primary)':'var(--bg4)', color:s.active?'#fff':'var(--text3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0, border:`2px solid ${s.active?'var(--primary)':'var(--border2)'}` }}>{s.step}</div>
                    <div style={{ fontSize:14, paddingTop:3, color:s.active?'var(--text)':'var(--text3)', fontWeight:s.active?600:400 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            {currentUser?.role=== 'regional_coordinator' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[
                  { step:1, label:'HoU creates task', active:true },
                  { step:2, label:'Assign HoU', active:false },
                  { step:3, label:'Leader assigns technicians', active:false },
                  { step:4, label:'Field work + daily reports', active:false },
                ].map(s=>(
                  <div key={s.step} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
                    <div style={{ width:24, height:24, borderRadius:'50%', background:s.active?'var(--primary)':'var(--bg4)', color:s.active?'#fff':'var(--text3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{s.step}</div>
                    <div style={{ fontSize:14, paddingTop:3, color:s.active?'var(--text)':'var(--text3)', fontWeight:s.active?600:400 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle>ℹ Fee Note</SectionTitle>
            <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.8 }}>
              <p style={{ marginBottom:8 }}>Fee rates are applied automatically based on site type:</p>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'var(--bg3)', borderRadius:8, fontSize:12 }}>
                  <span>🏙 Local transport</span><span style={{ fontWeight:700 }}>RWF 5,000</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'var(--bg3)', borderRadius:8, fontSize:12 }}>
                  <span>🌾 Rural transport</span><span style={{ fontWeight:700 }}>RWF 15,000</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'var(--bg3)', borderRadius:8, fontSize:12 }}>
                  <span>🍽 Lunch</span><span style={{ fontWeight:700 }}>RWF 3,000/day</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 10px', background:'var(--bg3)', borderRadius:8, fontSize:12 }}>
                  <span>🏨 Lodging (rural)</span><span style={{ fontWeight:700 }}>RWF 10,000/night</span>
                </div>
              </div>
              <p style={{ marginTop:10, color:'var(--text3)', fontSize:12 }}>Technicians submit fee requisitions after task completion.</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
