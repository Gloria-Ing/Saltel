export const USERS = [
  { id:1,  name:'Emmanuel Nkurunziza', email:'ceo@saltel.rw',       role:'ceo',         avatar:'EN',  dept:null,    phone:'+250788000001', profile_pic:null, hire_date:'2011-01-15', salary:1200000, username:'ceo',        password:'ceo2026', qualifications:{ studies:'MBA - Kigali Independent University', certifications:['PMP','ITIL v4'], experience:'15 years in Telecom Management', licenses:[] } },
  { id:2,  name:'Patrick Habimana',    email:'hod.lan@saltel.rw',    role:'hod',         avatar:'PH',  dept:'LAN',   phone:'+250788000002', profile_pic:null, hire_date:'2016-03-01', salary:650000,  username:'hod.lan',    password:'saltel',  qualifications:{ studies:'BSc Computer Networks - UR', certifications:['CCNP','CompTIA Network+'], experience:'10 years in LAN/WAN infrastructure', licenses:['A0'] } },
  { id:3,  name:'Alice Mukamana',      email:'hod.fiber@saltel.rw',  role:'hod',         avatar:'AM',  dept:'Fiber', phone:'+250788000003', profile_pic:null, hire_date:'2017-01-10', salary:650000,  username:'hod.fiber',  password:'saltel',  qualifications:{ studies:'BSc Telecommunications - INES', certifications:['CFOS','FOA'], experience:'9 years in Fiber Optic Networks', licenses:['A0'] } },
  { id:4,  name:'Eric Niyonzima',      email:'hod.cctv@saltel.rw',   role:'hod',         avatar:'EN2', dept:'CCTV',  phone:'+250788000004', profile_pic:null, hire_date:'2018-02-20', salary:650000,  username:'hod.cctv',   password:'saltel',  qualifications:{ studies:'BSc Electronic Engineering - KIM', certifications:['CCTV Certified','CompTIA Security+'], experience:'8 years in Security Systems', licenses:['A1'] } },
  { id:5,  name:'Grace Uwimana',       email:'lead.lan@saltel.rw',   role:'team_leader', avatar:'GU',  dept:'LAN',   phone:'+250788000005', profile_pic:null, hire_date:'2020-06-01', salary:450000,  username:'lead.lan',   password:'saltel',  qualifications:{ studies:'BSc IT - UR', certifications:['CCNA','Network+'], experience:'6 years field experience', licenses:['A1'] } },
  { id:6,  name:'David Hakizimana',    email:'lead.fiber@saltel.rw', role:'team_leader', avatar:'DH',  dept:'Fiber', phone:'+250788000006', profile_pic:null, hire_date:'2019-07-15', salary:450000,  username:'lead.fiber', password:'saltel',  qualifications:{ studies:'BEng Telecom - INES', certifications:['CFOS','FOA Installer'], experience:'7 years fiber splicing', licenses:['A1'] } },
  { id:7,  name:'Sandra Uwase',        email:'lead.cctv@saltel.rw',  role:'team_leader', avatar:'SU',  dept:'CCTV',  phone:'+250788000007', profile_pic:null, hire_date:'2021-04-01', salary:450000,  username:'lead.cctv',  password:'saltel',  qualifications:{ studies:'BSc Security Systems - KIM', certifications:['Axis Certified','Hikvision Certified'], experience:'5 years CCTV installation', licenses:['A1'] } },
  { id:8,  name:'Jean Bizimana',       email:'tech.jb@saltel.rw',    role:'technician',  avatar:'JB',  dept:'LAN',   phone:'+250788000008', profile_pic:null, hire_date:'2023-03-10', salary:320000,  username:'tech.jb',    password:'saltel',  qualifications:{ studies:'A2 Sciences - GS Kigali', certifications:['CompTIA A+'], experience:'3 years LAN cabling', licenses:['Ad'] } },
  { id:9,  name:'Marie Uwineza',       email:'tech.mu@saltel.rw',    role:'technician',  avatar:'MU',  dept:'LAN',   phone:'+250788000009', profile_pic:null, hire_date:'2024-03-05', salary:320000,  username:'tech.mu',    password:'saltel',  qualifications:{ studies:'DIT - IPRC Kigali', certifications:['CCNA (in progress)'], experience:'2 years network support', licenses:['Ad'] } },
  { id:10, name:'Robert Mugisha',      email:'tech.rm@saltel.rw',    role:'technician',  avatar:'RM',  dept:'LAN',   phone:'+250788000010', profile_pic:null, hire_date:'2022-03-20', salary:320000,  username:'tech.rm',    password:'saltel',  qualifications:{ studies:'BEng IT - KIM', certifications:['CCNA'], experience:'4 years infrastructure', licenses:['A1'] } },
  { id:11, name:'Claude Nshimiyimana', email:'tech.cn@saltel.rw',    role:'technician',  avatar:'CN',  dept:'Fiber', phone:'+250788000011', profile_pic:null, hire_date:'2021-02-01', salary:320000,  username:'tech.cn',    password:'saltel',  qualifications:{ studies:'BSc Telecom - INES', certifications:['CFOS Installer'], experience:'5 years fiber optic', licenses:['A1'] } },
  { id:12, name:'Diane Ingabire',      email:'tech.di@saltel.rw',    role:'technician',  avatar:'DI',  dept:'Fiber', phone:'+250788000012', profile_pic:null, hire_date:'2024-04-15', salary:320000,  username:'tech.di',    password:'saltel',  qualifications:{ studies:'A2 Tech - GS Butare', certifications:['FOA entry level'], experience:'2 years fiber splicing', licenses:['Ad'] } },
  { id:13, name:'Jules Irakoze',       email:'tech.ji@saltel.rw',    role:'technician',  avatar:'JI',  dept:'CCTV',  phone:'+250788000013', profile_pic:null, hire_date:'2023-04-10', salary:320000,  username:'tech.ji',    password:'saltel',  qualifications:{ studies:'DIT CCTV - IPRC Musanze', certifications:['Hikvision Certified'], experience:'3 years CCTV installation', licenses:['Ad'] } },
  { id:14, name:'Yvette Mutoni',       email:'tech.ym@saltel.rw',    role:'technician',  avatar:'YM',  dept:'CCTV',  phone:'+250788000014', profile_pic:null, hire_date:'2024-05-01', salary:320000,  username:'tech.ym',    password:'saltel',  qualifications:{ studies:'A2 Electronics - GS Kigali', certifications:['Axis Certified'], experience:'2 years security systems', licenses:['Ad'] } },
  { id:15, name:'Solange Nyiraneza',   email:'accountant@saltel.rw', role:'accountant',  avatar:'SN',  dept:null,    phone:'+250788000015', profile_pic:null, hire_date:'2020-02-10', salary:400000,  username:'accountant', password:'saltel',  qualifications:{ studies:'BBA Accounting - SFB', certifications:['CPA Rwanda','ACCA (in progress)'], experience:'6 years in financial management', licenses:[] } },
  { id:16, name:'Fabrice Ndayishimiye',email:'daf@saltel.rw',        role:'daf',         avatar:'FN',  dept:null,    phone:'+250788000016', profile_pic:null, hire_date:'2015-06-01', salary:700000,  username:'daf',        password:'saltel',  qualifications:{ studies:'MBA Finance - KIE', certifications:['CPA Rwanda','CFA Level 1'], experience:'12 years in financial administration', licenses:['B'] } },
];

export const DEPARTMENTS = [
  { id:'LAN',   label:'LAN Unit',   color:'#4F46E5', hod_id:2, leader_id:5 },
  { id:'Fiber', label:'Fiber Unit', color:'#10B981', hod_id:3, leader_id:6 },
  { id:'CCTV',  label:'CCTV Unit',  color:'#8B5CF6', hod_id:4, leader_id:7 },
];

export const SITES = [
  { id:1, name:'Kigali Convention Centre', location:'KCC, Kigali',        province:'Kigali',  type:'Corporate',  rural:false, lat:-1.9536, lng:30.0605 },
  { id:2, name:'MTN Rwanda HQ',            location:'Nyarugenge, Kigali', province:'Kigali',  type:'Telecom',    rural:false, lat:-1.9500, lng:30.0588 },
  { id:3, name:'University of Rwanda',     location:'Gikondo, Kigali',    province:'Kigali',  type:'Education',  rural:false, lat:-1.9800, lng:30.0700 },
  { id:4, name:'Rwamagana Hospital',       location:'Rwamagana, Eastern', province:'Eastern', type:'Healthcare', rural:true,  lat:-1.9500, lng:30.4300 },
  { id:5, name:'Musanze District Office',  location:'Musanze, Northern',  province:'Northern',type:'Government', rural:true,  lat:-1.4990, lng:29.6340 },
  { id:6, name:'Rubavu Customs',           location:'Rubavu, Western',    province:'Western', type:'Government', rural:true,  lat:-1.6800, lng:29.2400 },
  { id:7, name:'BK Arena',                 location:'Kimihurura, Kigali', province:'Kigali',  type:'Venue',      rural:false, lat:-1.9441, lng:30.0619 },
];

export const FEE_RATES = { transport_local:5000, transport_rural:15000, lunch:3000, dinner:3000, lodging:10000 };

export const calcFees = (siteId, startDate, endDate) => {
  const site = SITES.find(s => s.id===Number(siteId));
  const days = Math.max(1, Math.round((new Date(endDate)-new Date(startDate))/86400000)+1);
  const nights = Math.max(0, days-1);
  const rural = site?.rural || false;
  const transport = rural ? FEE_RATES.transport_rural : FEE_RATES.transport_local;
  const meals = rural ? (FEE_RATES.lunch+FEE_RATES.dinner)*days : FEE_RATES.lunch*days;
  const lodging = rural ? FEE_RATES.lodging*nights : 0;
  return { transport, meals, lodging, total:transport+meals+lodging, days, rural };
};

export const calcReportScore = (submittedAt, reportDeadline, reportData) => {
  if (!submittedAt) return 50;
  const subTime = new Date(submittedAt);
  const subHour = subTime.getHours() + subTime.getMinutes()/60;
  const isComplete = !!(reportData && reportData.work_done && reportData.work_done.trim().length > 15 && reportData.gps_address && reportData.client_name && reportData.photo_data);
  const inWindow = subHour >= 14 && subHour <= 18;
  if (inWindow) return isComplete ? (90 + Math.floor(Math.random()*6)) : (80 + Math.floor(Math.random()*10));
  if (subHour < 14) return isComplete ? (90 + Math.floor(Math.random()*6)) : (80 + Math.floor(Math.random()*9));
  const minutesLate = (subHour - 18) * 60;
  const penalties = Math.floor(minutesLate / 30);
  return Math.max(10, (isComplete ? 90 : 80) - penalties * 20);
};

export const BASE_SALARIES = {
  ceo:1200000, daf:700000, hod:650000, accountant:400000, team_leader:450000, technician:320000,
};

const genSalaries = () => {
  const records = [];
  let id = 1;
  const months = [
    { month:'2026-01', year:2026, quarter:'Q1' },
    { month:'2026-02', year:2026, quarter:'Q1' },
    { month:'2026-03', year:2026, quarter:'Q1' },
    { month:'2026-04', year:2026, quarter:'Q2' },
  ];
  USERS.forEach(user => {
    months.forEach((m) => {
      const base = BASE_SALARIES[user.role] || 320000;
      let bonus = 0, bonus_reason = '', bonus_approved_by = null;
      if (user.id===5 && m.month==='2026-03') { bonus=50000; bonus_reason='Outstanding Q1 field leadership'; bonus_approved_by=1; }
      if (user.id===11 && m.month==='2026-03') { bonus=30000; bonus_reason='Excellent fiber splicing performance'; bonus_approved_by=1; }
      if (user.id===8 && m.month==='2026-02') { bonus=20000; bonus_reason='On-time report compliance'; bonus_approved_by=1; }
      const net = base + bonus;
      let status, confirmed_at, confirmed_by, signed_at, signed_by;
      if (m.month==='2026-04') {
        if ([8,9,10].includes(user.id)) { status='pending'; confirmed_at=null; confirmed_by=null; signed_at=null; signed_by=null; }
        else if ([1,2,3,5,6,7].includes(user.id)) { status='confirmed'; confirmed_at='2026-05-01T09:00:00'; confirmed_by=16; signed_at=null; signed_by=null; }
        else { status='signed'; confirmed_at='2026-05-01T09:00:00'; confirmed_by=16; signed_at='2026-05-02T10:00:00'; signed_by=user.id; }
      } else {
        const d = new Date(`${m.month}-28`);
        status='signed'; confirmed_at=d.toISOString(); confirmed_by=16;
        signed_at=new Date(d.getTime()+86400000).toISOString(); signed_by=user.id;
      }
      records.push({ id:`SAL-${String(id).padStart(3,'0')}`, user_id:user.id, month:m.month, year:m.year, quarter:m.quarter, base_salary:base, bonus, bonus_reason, bonus_approved_by, net_salary:net, status, confirmed_by:status==='pending'?null:16, confirmed_at, signed_by:status==='signed'?user.id:null, signed_at:status==='signed'?signed_at:null, payment_method:'Bank Transfer', notes:'' });
      id++;
    });
  });
  return records;
};

export const INITIAL_SALARIES = genSalaries();

export const INITIAL_TASKS = [
  { id:'T-001', title:'LAN Infrastructure Upgrade — KCC', description:'Full LAN upgrade including CAT6 cabling, new Cisco switches, and patch panel installation across floors 1-4.', site_id:1, dept:'LAN', priority:'high', workflow_stage:'technicians_assigned', created_by:1, hod_id:2, leader_id:5, technician_ids:[8,9], reporter_id:8, team_leader_id:8, start_date:'2026-04-08', end_date:'2026-04-25', created_at:'2026-04-05T09:00:00', completed_at:null, hod_notes:'Priority — KCC contract renewal depends on this.', leader_notes:'Jean and Marie. Report daily at 5pm.', report_schedule:'daily', report_time:'17:00', fees_per_tech:{ transport:5000, meals:54000, lodging:0, total:59000 }, supervisor_rejection_reason:null },
  { id:'T-002', title:'Fiber Optic Installation — Rwamagana Hospital', description:'Install 2km single-mode fiber backbone connecting main building, ICU block, and outpatient wing.', site_id:4, dept:'Fiber', priority:'high', workflow_stage:'hod_created', created_by:3, hod_id:3, leader_id:null, technician_ids:[], reporter_id:null, team_leader_id:null, start_date:'2026-04-14', end_date:'2026-04-18', created_at:'2026-04-06T08:00:00', completed_at:null, hod_notes:'Rural site. Book accommodation for team.', leader_notes:'', report_schedule:'daily', report_time:'17:00', fees_per_tech:{ transport:15000, meals:30000, lodging:30000, total:75000 }, supervisor_rejection_reason:null },
  { id:'T-003', title:'Network Maintenance — MTN HQ', description:'Quarterly network maintenance, firmware updates, and performance testing.', site_id:2, dept:'LAN', priority:'medium', workflow_stage:'completed', created_by:2, hod_id:2, leader_id:5, technician_ids:[8,10], reporter_id:8, team_leader_id:8, start_date:'2026-04-01', end_date:'2026-04-03', created_at:'2026-03-28T09:00:00', completed_at:'2026-04-02T16:30:00', hod_notes:'', leader_notes:'Completed 1 day early.', report_schedule:'daily', report_time:'17:00', fees_per_tech:{ transport:5000, meals:9000, lodging:0, total:14000 }, supervisor_rejection_reason:null },
  { id:'T-004', title:'Emergency LAN Repair — Musanze District', description:'Core switch failure. Entire district office network down. Immediate response required.', site_id:5, dept:'LAN', priority:'urgent', workflow_stage:'ceo_created', created_by:1, hod_id:2, leader_id:null, technician_ids:[], reporter_id:null, team_leader_id:null, start_date:'2026-04-12', end_date:'2026-04-12', created_at:'2026-04-11T07:00:00', completed_at:null, hod_notes:'URGENT — assign immediately.', leader_notes:'', report_schedule:'once', report_time:'18:00', fees_per_tech:{ transport:15000, meals:6000, lodging:0, total:21000 }, supervisor_rejection_reason:null },
  { id:'T-005', title:'Fiber Backbone — University of Rwanda', description:'New fiber ring connecting all 6 faculty buildings to central data center.', site_id:3, dept:'Fiber', priority:'medium', workflow_stage:'completed', created_by:3, hod_id:3, leader_id:6, technician_ids:[11], reporter_id:11, team_leader_id:11, start_date:'2026-03-20', end_date:'2026-03-25', created_at:'2026-03-18T09:00:00', completed_at:'2026-03-24T15:00:00', hod_notes:'', leader_notes:'', report_schedule:'daily', report_time:'17:00', fees_per_tech:{ transport:5000, meals:18000, lodging:0, total:23000 }, supervisor_rejection_reason:null },
  { id:'T-006', title:'CCTV Security System — BK Arena', description:'Install and configure LAN infrastructure for 120-camera CCTV system across all zones.', site_id:7, dept:'CCTV', priority:'medium', workflow_stage:'technicians_assigned', created_by:4, hod_id:4, leader_id:7, technician_ids:[13,14], reporter_id:13, team_leader_id:13, start_date:'2026-04-09', end_date:'2026-04-20', created_at:'2026-04-07T09:00:00', completed_at:null, hod_notes:'', leader_notes:'Jules leads camera zones, Yvette handles cabling.', report_schedule:'daily', report_time:'17:00', fees_per_tech:{ transport:5000, meals:33000, lodging:0, total:38000 }, supervisor_rejection_reason:null },
];

export const INITIAL_CHECKINS = [
  { id:1, task_id:'T-001', technician_id:8,  type:'checkin',  timestamp:'2026-04-10T08:02:00', lat:-1.9536, lng:30.0605, address:'Kigali, KCC-Convention, -1.9536, 30.0605' },
  { id:2, task_id:'T-001', technician_id:8,  type:'checkout', timestamp:'2026-04-10T17:05:00', lat:-1.9536, lng:30.0605, address:'Kigali, KCC-Convention, -1.9536, 30.0605' },
  { id:3, task_id:'T-006', technician_id:13, type:'checkin',  timestamp:'2026-04-10T07:55:00', lat:-1.9441, lng:30.0619, address:'Kigali, Kimihurura-BKArena, -1.9441, 30.0619' },
  { id:4, task_id:'T-006', technician_id:13, type:'checkout', timestamp:'2026-04-10T17:30:00', lat:-1.9441, lng:30.0619, address:'Kigali, Kimihurura-BKArena, -1.9441, 30.0619' },
];

export const INITIAL_REPORTS = [
  { id:'R-001', task_id:'T-003', technician_id:8,  status:'approved', submitted_at:'2026-04-01T15:45:00', work_done:'Completed firmware updates on all 12 Cisco switches.', issues:'One switch required factory reset.', issue_type:'Hardware Failure', gps_lat:-1.9500, gps_lng:30.0588, gps_address:'Kigali, Nyarugenge-MTN, -1.9500, 30.0588', checkin:'08:15', checkout:'17:40', checkin_address:'Kigali, Nyarugenge-MTN, -1.9500, 30.0588', checkout_address:'Kigali, Nyarugenge-MTN, -1.9500, 30.0588', photo_data:'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUzYTVmIi8+PHRleHQgeD0iNTAlIiB5PSI0MCUiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM2YWI4ZjUiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkZpZWxkIFBob3RvPC90ZXh0Pjwvc3ZnPg==', photo_name:'switch_rack_floor3.jpg', photos:3, approved_by:2, approved_at:'2026-04-02T09:00:00', ai_summary:'Successful maintenance. Firmware updated, performance +30%.', score:88, feedbacks:[{ from_user_id:2, role:'hod', text:'Excellent work Jean.', at:'2026-04-02T09:05:00' }], late_flagged:false, client_name:'MTN IT Manager', site_condition:'Ready — all infrastructure accessible', materials_used:'Firmware update tool', access_level:'Full access' },
  { id:'R-002', task_id:'T-003', technician_id:10, status:'approved', submitted_at:'2026-04-01T17:55:00', work_done:'Documented topology changes. Tested all VLANs.', issues:'None', issue_type:'None', gps_lat:-1.9500, gps_lng:30.0588, gps_address:'Kigali, Nyarugenge-MTN, -1.9500, 30.0588', checkin:'08:30', checkout:'17:20', checkin_address:'Kigali, Nyarugenge-MTN, -1.9500, 30.0588', checkout_address:'Kigali, Nyarugenge-MTN, -1.9500, 30.0588', photo_data:null, photos:5, approved_by:2, approved_at:'2026-04-02T09:05:00', ai_summary:'Documentation and VLAN testing complete.', score:76, feedbacks:[], late_flagged:false, client_name:'MTN IT Manager', site_condition:'Ready — all infrastructure accessible', materials_used:'Laptop, cables', access_level:'Full access' },
  { id:'R-003', task_id:'T-005', technician_id:11, status:'approved', submitted_at:'2026-03-24T16:00:00', work_done:'Installed 4.2km single-mode fiber. OTDR test passed.', issues:'Weather delay Day 2. One conduit rerouted.', issue_type:'Environmental', gps_lat:-1.9800, gps_lng:30.0700, gps_address:'Kigali, Gikondo-UR, -1.9800, 30.0700', checkin:'07:30', checkout:'18:00', checkin_address:'Kigali, Gikondo-UR, -1.9800, 30.0700', checkout_address:'Kigali, Gikondo-UR, -1.9800, 30.0700', photo_data:null, photos:8, approved_by:3, approved_at:'2026-03-25T08:30:00', ai_summary:'Fiber installation complete. OTDR confirms all links within spec.', score:92, feedbacks:[{ from_user_id:1, role:'ceo', text:'Outstanding result Claude.', at:'2026-03-25T10:00:00' }], late_flagged:false, client_name:'UR IT Dept', site_condition:'Ready — all infrastructure accessible', materials_used:'4.2km SMF, OTDR tester, splice kit', access_level:'Full access' },
  { id:'R-004', task_id:'T-001', technician_id:8,  status:'pending',  submitted_at:'2026-04-10T17:00:00', work_done:'Completed cabling Floors 1-2. All cable runs tested.', issues:'Switch delivery delayed 1 day.', issue_type:'Logistics', gps_lat:-1.9536, gps_lng:30.0605, gps_address:'Kigali, KCC-Convention, -1.9536, 30.0605', checkin:'08:00', checkout:'17:00', checkin_address:'Kigali, KCC-Convention, -1.9536, 30.0605', checkout_address:'Kigali, KCC-Convention, -1.9536, 30.0605', photo_data:null, photos:6, approved_by:null, approved_at:null, ai_summary:'Good progress on Floors 1-2. Switch delay noted.', score:82, feedbacks:[], late_flagged:false, client_name:'KCC Facility Manager', site_condition:'Partial — some areas restricted', materials_used:'100m CAT6, patch panel tools', access_level:'Supervised access' },
];

export const INITIAL_PAYMENTS = [
  { id:'PAY-001', task_id:'T-003', technician_id:8,  transport:5000,  meals:9000,  lodging:0, total:14000, status:'paid',    method:'MoMo', ref:'MM20260402001', paid_at:'2026-04-02T10:00:00', notes:'Local site', disputed:false },
  { id:'PAY-002', task_id:'T-003', technician_id:10, transport:5000,  meals:9000,  lodging:0, total:14000, status:'paid',    method:'MoMo', ref:'MM20260402002', paid_at:'2026-04-02T10:05:00', notes:'Local site', disputed:false },
  { id:'PAY-003', task_id:'T-005', technician_id:11, transport:5000,  meals:18000, lodging:0, total:23000, status:'paid',    method:'MoMo', ref:'MM20260325001', paid_at:'2026-03-25T09:00:00', notes:'Local site', disputed:false },
  { id:'PAY-004', task_id:'T-001', technician_id:8,  transport:5000,  meals:54000, lodging:0, total:59000, status:'pending', method:'MoMo', ref:null, paid_at:null, notes:'KCC LAN upgrade', disputed:false },
  { id:'PAY-005', task_id:'T-001', technician_id:9,  transport:5000,  meals:54000, lodging:0, total:59000, status:'pending', method:'MoMo', ref:null, paid_at:null, notes:'KCC LAN upgrade', disputed:false },
  { id:'PAY-006', task_id:'T-006', technician_id:13, transport:5000,  meals:33000, lodging:0, total:38000, status:'pending', method:'MoMo', ref:null, paid_at:null, notes:'BK Arena CCTV', disputed:false },
  { id:'PAY-007', task_id:'T-006', technician_id:14, transport:5000,  meals:33000, lodging:0, total:38000, status:'pending', method:'MoMo', ref:null, paid_at:null, notes:'BK Arena CCTV', disputed:true, dispute_reason:'Lodging was provided but not reimbursed.', dispute_status:'open', dispute_target:'accountant' },
];

export const INITIAL_NOTIFICATIONS = [
  { id:1, to_user_id:2,  type:'task',    message:'CEO assigned new task to your dept: Emergency LAN Repair', link:'/tasks/T-004', time:'10 min ago', read:false },
  { id:2, to_user_id:5,  type:'task',    message:'HOD Patrick assigned: LAN Infrastructure Upgrade — KCC',  link:'/tasks/T-001', time:'2 hrs ago',  read:false },
  { id:3, to_user_id:8,  type:'task',    message:"You've been assigned to: LAN Infrastructure Upgrade — KCC", link:'/tasks/T-001', time:'3 hrs ago', read:false },
  { id:4, to_user_id:2,  type:'report',  message:'Report R-004 submitted by Jean Bizimana — awaiting review', link:'/reports',     time:'1 hr ago',  read:false },
  { id:5, to_user_id:1,  type:'alert',   message:'T-004 is unassigned — HOD action required',               link:'/tasks/T-004', time:'10 min ago', read:false },
  { id:6, to_user_id:15, type:'payment', message:'Dispute raised on PAY-007 by Yvette Mutoni',              link:'/payments',    time:'2 hrs ago',  read:false },
  { id:7, to_user_id:16, type:'salary',  message:'3 salary records pending your confirmation for April 2026', link:'/salary',    time:'1 day ago',  read:false },
];

export const INITIAL_MESSAGES = [
  { id:1, from:1, to:2, text:'Patrick, T-004 is urgent. Please assign immediately.', time:'2026-04-11T07:15:00', read:true },
  { id:2, from:2, to:1, text:'Understood. I will assign Grace right away.',           time:'2026-04-11T07:20:00', read:true },
  { id:3, from:5, to:2, text:'HOD, the KCC switches have arrived. Resuming tomorrow 8am.', time:'2026-04-10T16:00:00', read:false },
  { id:4, from:8, to:5, text:'Team leader, I submitted my report for today. Any feedback?', time:'2026-04-10T17:05:00', read:false },
];

export const INITIAL_ANNOUNCEMENTS = [
  { id:'ANN-001', from_user_id:1, target:'all',         target_dept:null,    title:'Q2 Field Safety Reminder',    body:'All field technicians must wear PPE at all times. Non-compliance affects performance scores.', created_at:'2026-04-10T08:00:00', pinned:true },
  { id:'ANN-002', from_user_id:2, target:'team_leader', target_dept:'LAN',   title:'LAN Team — Weekly Sync',      body:'Monday 8:30am in Conference Room B. Mandatory for all team leaders.', created_at:'2026-04-09T10:30:00', pinned:false },
  { id:'ANN-003', from_user_id:5, target:'technician',  target_dept:'LAN',   title:'KCC Site Access Update',      body:'Sign in at Security Desk on Basement Level before proceeding.', created_at:'2026-04-07T14:00:00', pinned:false },
];

export const INITIAL_TRANSACTIONS = [
  { id:'TXN-001', date:'2026-04-02', type:'payment', description:'Payment: Jean Bizimana — MTN HQ Maintenance', amount:14000, payment_id:'PAY-001', technician_id:8 },
  { id:'TXN-002', date:'2026-04-02', type:'payment', description:'Payment: Robert Mugisha — MTN HQ Maintenance', amount:14000, payment_id:'PAY-002', technician_id:10 },
  { id:'TXN-003', date:'2026-03-25', type:'payment', description:'Payment: Claude Nshimiyimana — UR Fiber Backbone', amount:23000, payment_id:'PAY-003', technician_id:11 },
  { id:'TXN-004', date:'2026-04-10', type:'advance', description:'Advance: Marie Uwineza — KCC Expenses', amount:10000, payment_id:null, technician_id:9 },
  { id:'TXN-005', date:'2026-04-09', type:'payment', description:'Supplier Payment: Cisco Equipment — T-001', amount:450000, payment_id:null, technician_id:null },
  { id:'TXN-006', date:'2026-04-08', type:'refund',  description:'Refund: Over-advance recovery — Jean Bizimana', amount:-5000, payment_id:null, technician_id:8 },
  { id:'TXN-007', date:'2026-04-11', type:'payment', description:'Payment: Yvette Mutoni — BK Arena CCTV (partial)', amount:20000, payment_id:'PAY-007', technician_id:14 },
  { id:'TXN-008', date:'2026-04-07', type:'expense', description:'Site Transport Allocation — Musanze Trip', amount:30000, payment_id:null, technician_id:null },
  { id:'TXN-009', date:'2026-04-05', type:'payment', description:'Grace Uwimana — Team Leader Bonus Q1', amount:50000, payment_id:null, technician_id:5 },
  { id:'TXN-010', date:'2026-04-01', type:'expense', description:'PPE Equipment Purchase — All Departments', amount:85000, payment_id:null, technician_id:null },
];

export const INITIAL_REQUISITIONS = [
  { id:'REQ-001', task_id:'T-003', technician_id:8, leader_id:5, items:[{ label:'Transport (round trip)', amount:10000 },{ label:'Meal allowances', amount:6000 }], total:16000, status:'paid', hod_comment:'Approved. Well documented.', reviewed_at:'2026-04-01T11:00:00', paid_at:'2026-04-02T10:00:00', created_at:'2026-04-01T08:00:00' },
  { id:'REQ-002', task_id:'T-001', technician_id:9, leader_id:5, items:[{ label:'Transport (round trip)', amount:5000 },{ label:'Meal allowances', amount:15000 },{ label:'Materials: cable ties & markers', amount:3500 }], total:23500, status:'pending', hod_comment:'', reviewed_at:null, paid_at:null, created_at:'2026-04-10T09:00:00' },
  { id:'REQ-003', task_id:'T-006', technician_id:13, leader_id:7, items:[{ label:'Transport (round trip)', amount:5000 },{ label:'Meal allowances', amount:15000 },{ label:'Lodging / accommodation', amount:10000 }], total:30000, status:'approved', hod_comment:'Approved for BK Arena CCTV installation.', reviewed_at:'2026-04-11T09:00:00', paid_at:null, created_at:'2026-04-09T08:30:00' },
];

export const INITIAL_LEAVE_REQUESTS = [
  { id:'LVR-001', user_id:8, type:'Annual Leave', start_date:'2026-05-05', end_date:'2026-05-09', reason:'Family vacation', status:'pending', reviewed_by:null, reviewed_at:null, comment:'', created_at:'2026-04-28T10:00:00' },
  { id:'LVR-002', user_id:11, type:'Sick Leave', start_date:'2026-04-14', end_date:'2026-04-15', reason:'Medical appointment', status:'approved', reviewed_by:6, reviewed_at:'2026-04-13T08:00:00', comment:'Take care and rest.', created_at:'2026-04-13T07:00:00' },
];

export const CHART_DATA = {
  monthly_tasks: [
    { month:'Nov', completed:18, pending:4 },{ month:'Dec', completed:22, pending:3 },
    { month:'Jan', completed:20, pending:5 },{ month:'Feb', completed:25, pending:2 },
    { month:'Mar', completed:28, pending:6 },{ month:'Apr', completed:14, pending:8 },
  ],
  dept_performance: [
    { dept:'LAN', score:85, tasks:12 }, { dept:'Fiber', score:91, tasks:8 }, { dept:'CCTV', score:78, tasks:6 },
  ],
  monthly_spend: [
    { month:'Nov', amount:380000 },{ month:'Dec', amount:520000 },{ month:'Jan', amount:440000 },
    { month:'Feb', amount:390000 },{ month:'Mar', amount:610000 },{ month:'Apr', amount:357000 },
  ],
  weekly_reports: [
    { day:'Mon', submitted:5, onTime:4 },{ day:'Tue', submitted:7, onTime:6 },
    { day:'Wed', submitted:4, onTime:4 },{ day:'Thu', submitted:8, onTime:5 },{ day:'Fri', submitted:6, onTime:6 },
  ],
};

export const ROLE_CONFIG = {
  ceo:         { label:'CEO / Executive',             color:'#7C3AED' },
  daf:         { label:'Director of Admin & Finance', color:'#EC4899' },
  hod:         { label:'Supervisor',                  color:'#169BD5' },
  team_leader: { label:'Head of Unit (HoU)',           color:'#06B6D4' },
  technician:  { label:'Field Technician',            color:'#10B981' },
  accountant:  { label:'Accountant',                  color:'#F97316' },
};

export const STATUS_LABELS = {
  ceo_created:                'Pending Supervisor',
  hod_created:                'Pending HoU',
  leader_assigned:            'Pending Techs',
  supervisor_approval_pending:'Awaiting Supervisor Approval',
  technicians_assigned:       'In Progress',
  completed:                  'Completed',
  pending:                    'Pending',
  approved:                   'Approved',
  paid:                       'Paid',
  disputed:                   'Disputed',
  confirmed:                  'Awaiting Signature',
  signed:                     'Signed & Paid',
};

export const FMT_RWF = n => `RWF ${(n||0).toLocaleString()}`;
export const SCORE_COLOR = s => s>=85?'var(--green)':s>=70?'var(--primary)':'var(--amber)';

export const buildPerformance = (tasks, reports, usersOverride) => {
  const pool = usersOverride || USERS;
  return pool.filter(u => ['technician','team_leader'].includes(u.role)).map(u => {
    const myTasks   = tasks.filter(t => (t.technician_ids||[]).includes(u.id) || t.leader_id===u.id);
    const myReports = reports.filter(r => r.technician_id===u.id);
    const completed = myTasks.filter(t => t.workflow_stage==='completed').length;
    const avgScore  = myReports.length ? Math.round(myReports.reduce((s,r)=>s+(r.score||75),0)/myReports.length) : 0;
    const onTime    = myReports.filter(r=>!r.late_flagged).length;
    const pct       = myReports.length ? Math.round(onTime/myReports.length*100) : 100;
    return { user_id:u.id, tasks_total:myTasks.length, tasks_completed:completed, reports_total:myReports.length, avg_score:avgScore, on_time_pct:pct };
  });
};
