import { USERS, SITES, FMT_RWF } from '../data/mockData';

const ORG = { name:'SALTEL Ltd', address:'KG 7 Ave, Kigali, Rwanda', phone:'+250 788 000 000', email:'info@saltel.rw', tin:'100123456', system:'FOMS v10' };

const escCSV = v => {
  if (v===null||v===undefined) return '';
  const s = String(v);
  return s.includes(',')||s.includes('"')||s.includes('\n') ? `"${s.replace(/"/g,'""')}"` : s;
};

const rowCSV = arr => arr.map(escCSV).join(',');

const ORG_HEADER_CSV = `\
"${ORG.name}","FIELD OPERATIONS MANAGEMENT SYSTEM","${ORG.system}"\n\
"Address:","${ORG.address}","Generated: ${new Date().toLocaleString()}"\n\
"Phone:","${ORG.phone}",""\n\n`;

const download = (content, filename, mime) => {
  const blob = new Blob([content], { type:mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export const exportReportsCSV = (reports, tasks) => {
  const headers = ['Report ID','Task','Technician','Site','GPS Location','Client Name','Site Condition','Materials Used','Access Level','Status','Score','Submitted At','Check-in','Check-out','Work Done','Issues','Late Flag','Approved By'];
  const rows = [...reports].sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)).map(r => {
    const task = tasks.find(t=>t.id===r.task_id);
    const tech = USERS.find(u=>u.id===r.technician_id);
    const site = SITES.find(s=>s.id===task?.site_id);
    const approver = USERS.find(u=>u.id===r.approved_by);
    return [r.id,task?.title||'',tech?.name||'',site?.name||'',r.gps_address||'',r.client_name||'',r.site_condition||'',r.materials_used||'',r.access_level||'',r.status,r.score,r.submitted_at,r.checkin,r.checkout,r.work_done,r.issues,r.late_flagged?'YES':'NO',approver?.name||''];
  });
  const content = ORG_HEADER_CSV + rowCSV(headers)+'\n'+rows.map(rowCSV).join('\n');
  download(content, `saltel_reports_${Date.now()}.csv`, 'text/csv');
};

export const exportReportsExcel = (reports, tasks, orgName) => {
  exportReportsCSV(reports, tasks);
};

// v10: build in-app table data for Reports (includes field info + GPS)
export const buildReportsTableData = (reports, tasks) => {
  return [...reports].sort((a,b)=>new Date(b.submitted_at)-new Date(a.submitted_at)).map(r => {
    const task = tasks.find(t=>t.id===r.task_id);
    const tech = USERS.find(u=>u.id===r.technician_id);
    const site = SITES.find(s=>s.id===task?.site_id);
    const approver = USERS.find(u=>u.id===r.approved_by);
    const fieldInfoParts = [r.client_name && `Client: ${r.client_name}`, r.site_condition, r.materials_used].filter(Boolean);
    return {
      id:r.id,
      task:task?.title||'-',
      technician:tech?.name||'-',
      site:site?.name||'-',
      gps:r.gps_address||'',
      client_name:r.client_name||'',
      field_info:fieldInfoParts.join(' | '),
      status:r.status,
      score:r.score,
      submitted_at:r.submitted_at?new Date(r.submitted_at).toLocaleString('en-RW'):'—',
      checkin:r.checkin||'—',
      checkout:r.checkout||'—',
      late:r.late_flagged?'⚠ Late':'On Time',
      approver:approver?.name||'Pending',
    };
  });
};

export const exportPaymentsCSV = (payments, tasks) => {
  const headers = ['Payment ID','Task','Technician','Transport (RWF)','Meals (RWF)','Lodging (RWF)','Total (RWF)','Status','Method','Reference','Paid At'];
  const rows = [...payments].sort((a,b)=>new Date(b.paid_at||b.id)-new Date(a.paid_at||a.id)).map(p => {
    const task = tasks.find(t=>t.id===p.task_id);
    const tech = USERS.find(u=>u.id===p.technician_id);
    return [p.id,task?.title||'',tech?.name||'',p.transport,p.meals,p.lodging,p.total,p.status,p.method,p.ref||'',p.paid_at?new Date(p.paid_at).toLocaleString('en-RW'):'Pending'];
  });
  const content = ORG_HEADER_CSV + rowCSV(headers)+'\n'+rows.map(rowCSV).join('\n');
  download(content, `saltel_payments_${Date.now()}.csv`, 'text/csv');
};

export const exportSalariesCSV = (salaries, users) => {
  const headers = ['Salary ID','Employee','Role','Dept','Month','Year','Base Salary','Bonus','Net Salary','Status','Confirmed By','Signed By'];
  const rows = [...salaries].sort((a,b)=>b.month.localeCompare(a.month)).map(s => {
    const u = users.find(x=>x.id===s.user_id);
    const conf = users.find(x=>x.id===s.confirmed_by);
    const sgn  = users.find(x=>x.id===s.signed_by);
    return [s.id,u?.name||'',u?.role||'',u?.dept||'',s.month,s.year,s.base_salary,s.bonus,s.net_salary,s.status,conf?.name||'',sgn?.name||''];
  });
  const content = ORG_HEADER_CSV + rowCSV(headers)+'\n'+rows.map(rowCSV).join('\n');
  download(content, `saltel_salaries_${Date.now()}.csv`, 'text/csv');
};

export const FMT = { rwf: FMT_RWF, date: d => d?new Date(d).toLocaleDateString('en-RW'):'—', datetime: d=>d?new Date(d).toLocaleString('en-RW'):'—' };
