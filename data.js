/**
 * CRM Data Model & LocalStorage Persistence Layer
 */

const DEFAULT_EMPLOYEES = [
  {
    id: 'emp-1',
    name: 'Alex Rivera',
    role: 'Senior Sales Development Rep',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    email: 'alex.rivera@apexflow.crm',
    password: 'alex123',
    targetDailyCalls: 25,
    status: 'online'
  },
  {
    id: 'emp-2',
    name: 'Sarah Chen',
    role: 'Enterprise Account Executive',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
    email: 'sarah.chen@apexflow.crm',
    password: 'sarah123',
    targetDailyCalls: 20,
    status: 'online'
  },
  {
    id: 'emp-3',
    name: 'Marcus Vance',
    role: 'Outbound Sales Rep',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
    email: 'marcus.vance@apexflow.crm',
    password: 'marcus123',
    targetDailyCalls: 30,
    status: 'in-call'
  },
  {
    id: 'emp-4',
    name: 'Elena Rostova',
    role: 'Client Retention Specialist',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&auto=format&fit=crop&q=80',
    email: 'elena.rostova@apexflow.crm',
    password: 'elena123',
    targetDailyCalls: 22,
    status: 'online'
  }
];

const DEFAULT_MANAGER = {
  id: 'mgr-1',
  name: 'Victoria Sterling',
  role: 'Director of Global Sales Operations',
  avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80',
  email: 'manager@apexflow.crm',
  password: 'manager123',
  title: 'Executive Sales Director'
};


const DEFAULT_CONTACTS = [
  {
    id: 'cnt-101',
    name: 'David Reynolds',
    company: 'Nexus Cloud Systems',
    title: 'VP of Engineering',
    email: 'd.reynolds@nexuscloud.io',
    phone: '+1 (555) 234-8901',
    dealValue: 48000,
    stage: 'Interested', // New, Contacted, Interested, Proposal, Won, Lost
    priority: 'High',
    assignedTo: 'emp-1',
    createdAt: '2026-09-15T09:30:00Z',
    lastCallDate: '2026-09-22T14:20:00Z',
    totalCalls: 3,
    notes: 'Very interested in our automated CRM sync API. Scheduled follow-up for proposal review.',
    tags: ['Tech', 'Enterprise', 'API Need']
  },
  {
    id: 'cnt-102',
    name: 'Sophia Patel',
    company: 'Aura Logistics Inc.',
    title: 'Chief Operations Officer',
    email: 'sophia@auralogistics.com',
    phone: '+1 (555) 781-9923',
    dealValue: 65000,
    stage: 'Proposal',
    priority: 'High',
    assignedTo: 'emp-2',
    createdAt: '2026-09-10T11:15:00Z',
    lastCallDate: '2026-09-22T11:45:00Z',
    totalCalls: 4,
    notes: 'Contract proposal sent. Needs confirmation on SLA terms by end of week.',
    tags: ['Logistics', 'High ARR']
  },
  {
    id: 'cnt-103',
    name: 'James Thornton',
    company: 'Hyperion Analytics',
    title: 'Head of Growth',
    email: 'james.t@hyperion.ai',
    phone: '+1 (555) 602-3341',
    dealValue: 24000,
    stage: 'New',
    priority: 'Medium',
    assignedTo: 'emp-1',
    createdAt: '2026-09-21T16:00:00Z',
    lastCallDate: null,
    totalCalls: 0,
    notes: 'Inbound lead from product webinar. Needs introductory discovery call.',
    tags: ['Inbound', 'Analytics']
  },
  {
    id: 'cnt-104',
    name: 'Maria Gonzalez',
    company: 'Vanguard Retail Labs',
    title: 'Director of Omnichannel',
    email: 'mgonzalez@vanguardretail.com',
    phone: '+1 (555) 443-1288',
    dealValue: 35000,
    stage: 'Contacted',
    priority: 'Medium',
    assignedTo: 'emp-3',
    createdAt: '2026-09-18T10:00:00Z',
    lastCallDate: '2026-09-22T13:10:00Z',
    totalCalls: 2,
    notes: 'Spoke briefly, requested deck sent to procurement team. Call back Thursday.',
    tags: ['Retail', 'Omnichannel']
  },
  {
    id: 'cnt-105',
    name: 'Robert Vance Jr.',
    company: 'Bluecrest Capital Partners',
    title: 'Managing Director',
    email: 'robert@bluecrestcap.com',
    phone: '+1 (555) 909-6612',
    dealValue: 120000,
    stage: 'Won',
    priority: 'High',
    assignedTo: 'emp-2',
    createdAt: '2026-09-01T08:00:00Z',
    lastCallDate: '2026-09-21T17:00:00Z',
    totalCalls: 6,
    notes: 'Deal closed! 2-year enterprise license signed. Transitioning to onboarding.',
    tags: ['Fintech', 'Enterprise Tier']
  },
  {
    id: 'cnt-106',
    name: 'Chloe Bennett',
    company: 'Starlight Media Group',
    title: 'VP of Marketing',
    email: 'chloe@starlightmg.com',
    phone: '+1 (555) 312-7789',
    dealValue: 18500,
    stage: 'Contacted',
    priority: 'Low',
    assignedTo: 'emp-4',
    createdAt: '2026-09-19T13:40:00Z',
    lastCallDate: '2026-09-22T10:00:00Z',
    totalCalls: 1,
    notes: 'Left voicemail with direct callback number. Sent introductory email.',
    tags: ['Media', 'SMB']
  },
  {
    id: 'cnt-107',
    name: 'Ethan Mitchell',
    company: 'Cobalt Cyber Defense',
    title: 'CISO',
    email: 'emitchell@cobaltdefense.org',
    phone: '+1 (555) 887-2109',
    dealValue: 82000,
    stage: 'Interested',
    priority: 'High',
    assignedTo: 'emp-1',
    createdAt: '2026-09-12T14:10:00Z',
    lastCallDate: '2026-09-22T15:30:00Z',
    totalCalls: 3,
    notes: 'Completed security compliance questionnaire. Highly engaged, wants custom demo.',
    tags: ['Cybersecurity', 'SOC-2']
  },
  {
    id: 'cnt-108',
    name: 'Amara Okafor',
    company: 'Zenith Health Solutions',
    title: 'VP of Patient Experience',
    email: 'amara.o@zenithhealth.io',
    phone: '+1 (555) 554-3290',
    dealValue: 54000,
    stage: 'New',
    priority: 'High',
    assignedTo: 'emp-3',
    createdAt: '2026-09-22T08:30:00Z',
    lastCallDate: null,
    totalCalls: 0,
    notes: 'Requested consultation on patient CRM messaging integration.',
    tags: ['Healthcare', 'HIPAA']
  },
  {
    id: 'cnt-109',
    name: 'Liam Gallagher',
    company: 'Apex Robotics',
    title: 'Lead Product Manager',
    email: 'liam@apexrobotics.tech',
    phone: '+1 (555) 776-8834',
    dealValue: 42000,
    stage: 'Contacted',
    priority: 'Medium',
    assignedTo: 'emp-2',
    createdAt: '2026-09-14T11:00:00Z',
    lastCallDate: '2026-09-21T15:40:00Z',
    totalCalls: 2,
    notes: 'Reviewed pricing tier. Comparing with competitor, call back Monday.',
    tags: ['Robotics', 'Hardware']
  },
  {
    id: 'cnt-110',
    name: 'Rachel Adams',
    company: 'Kestrel Financial',
    title: 'Chief Compliance Officer',
    email: 'r.adams@kestrelfin.com',
    phone: '+1 (555) 991-0021',
    dealValue: 70000,
    stage: 'Lost',
    priority: 'Medium',
    assignedTo: 'emp-4',
    createdAt: '2026-08-28T09:00:00Z',
    lastCallDate: '2026-09-20T16:00:00Z',
    totalCalls: 5,
    notes: 'Budget postponed to Q2 next fiscal year. Nurture for re-engagement in 6 months.',
    tags: ['Fintech', 'Postponed']
  },
  {
    id: 'cnt-111',
    name: 'Tariq Al-Mansoor',
    company: 'Global Stream Media',
    title: 'Head of Infrastructure',
    email: 'tariq@globalstream.net',
    phone: '+1 (555) 662-8491',
    dealValue: 95000,
    stage: 'Proposal',
    priority: 'High',
    assignedTo: 'emp-1',
    createdAt: '2026-09-05T12:00:00Z',
    lastCallDate: '2026-09-22T16:15:00Z',
    totalCalls: 4,
    notes: 'Final review with procurement director scheduled for tomorrow.',
    tags: ['Streaming', 'High ARR']
  },
  {
    id: 'cnt-112',
    name: 'Zoe Washington',
    company: 'Urban Craft Logistics',
    title: 'Supply Chain Manager',
    email: 'zwashington@urbancraft.co',
    phone: '+1 (555) 420-1923',
    dealValue: 29000,
    stage: 'New',
    priority: 'Low',
    assignedTo: 'emp-3',
    createdAt: '2026-09-22T09:15:00Z',
    lastCallDate: null,
    totalCalls: 0,
    notes: 'Fresh sign up via self-serve portal. Wants to discuss fleet team seat discounts.',
    tags: ['Logistics', 'Self-Serve']
  }
];

const DEFAULT_CALL_LOGS = [
  {
    id: 'call-501',
    employeeId: 'emp-1',
    employeeName: 'Alex Rivera',
    contactId: 'cnt-111',
    contactName: 'Tariq Al-Mansoor',
    company: 'Global Stream Media',
    durationSec: 342,
    outcome: 'Proposal Follow-up',
    notes: 'Discussed final pricing revisions. Sent revised SLA contract. Decision expected by Friday.',
    timestamp: '2026-09-22T16:15:00Z',
    rating: 'positive'
  },
  {
    id: 'call-502',
    employeeId: 'emp-1',
    employeeName: 'Alex Rivera',
    contactId: 'cnt-107',
    contactName: 'Ethan Mitchell',
    company: 'Cobalt Cyber Defense',
    durationSec: 480,
    outcome: 'Connected - Interested',
    notes: 'Deep dive into SOC-2 requirements and user permission management. Customer loved our audit trail.',
    timestamp: '2026-09-22T15:30:00Z',
    rating: 'positive'
  },
  {
    id: 'call-503',
    employeeId: 'emp-2',
    employeeName: 'Sarah Chen',
    contactId: 'cnt-102',
    contactName: 'Sophia Patel',
    company: 'Aura Logistics Inc.',
    durationSec: 512,
    outcome: 'Contract Sent',
    notes: 'Walked through executive tier scope. Sophia approved initial terms, awaiting legal clearance.',
    timestamp: '2026-09-22T11:45:00Z',
    rating: 'positive'
  },
  {
    id: 'call-504',
    employeeId: 'emp-3',
    employeeName: 'Marcus Vance',
    contactId: 'cnt-104',
    contactName: 'Maria Gonzalez',
    company: 'Vanguard Retail Labs',
    durationSec: 184,
    outcome: 'Follow-up Scheduled',
    notes: 'Quick check-in. Maria was in transit. Agreed to 15-min zoom on Thursday 2 PM.',
    timestamp: '2026-09-22T13:10:00Z',
    rating: 'neutral'
  },
  {
    id: 'call-505',
    employeeId: 'emp-4',
    employeeName: 'Elena Rostova',
    contactId: 'cnt-106',
    contactName: 'Chloe Bennett',
    company: 'Starlight Media Group',
    durationSec: 45,
    outcome: 'Left Voicemail',
    notes: 'No answer on direct desk phone. Left voicemail and followed up with email intro.',
    timestamp: '2026-09-22T10:00:00Z',
    rating: 'neutral'
  },
  {
    id: 'call-506',
    employeeId: 'emp-1',
    employeeName: 'Alex Rivera',
    contactId: 'cnt-101',
    contactName: 'David Reynolds',
    company: 'Nexus Cloud Systems',
    durationSec: 395,
    outcome: 'Connected - Interested',
    notes: 'Reviewed automated sync hooks. Ready for technical proof of concept.',
    timestamp: '2026-09-22T14:20:00Z',
    rating: 'positive'
  },
  {
    id: 'call-507',
    employeeId: 'emp-2',
    employeeName: 'Sarah Chen',
    contactId: 'cnt-105',
    contactName: 'Robert Vance Jr.',
    company: 'Bluecrest Capital Partners',
    durationSec: 720,
    outcome: 'Deal Closed / Won',
    notes: 'Final contract countersigned by board! $120k ARR secured. Notified onboarding team.',
    timestamp: '2026-09-21T17:00:00Z',
    rating: 'won'
  }
];

const STORAGE_KEYS = {
  EMPLOYEES: 'crm_employees_v1',
  CONTACTS: 'crm_contacts_v1',
  CALL_LOGS: 'crm_call_logs_v1',
  ACTIVE_EMP: 'crm_active_emp_id_v1',
  CURRENT_VIEW: 'crm_current_view_v1',
  AUTH_SESSION: 'crm_auth_session_v1',
  MANAGER: 'crm_manager_v1'
};

const CRM_DATA = {
  getEmployees() {
    const raw = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
      return DEFAULT_EMPLOYEES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_EMPLOYEES;
    }
  },

  getManager() {
    const raw = localStorage.getItem(STORAGE_KEYS.MANAGER);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.MANAGER, JSON.stringify(DEFAULT_MANAGER));
      return DEFAULT_MANAGER;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_MANAGER;
    }
  },

  getContacts() {
    const raw = localStorage.getItem(STORAGE_KEYS.CONTACTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(DEFAULT_CONTACTS));
      return DEFAULT_CONTACTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CONTACTS;
    }
  },

  saveContacts(contacts) {
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
  },

  getCallLogs() {
    const raw = localStorage.getItem(STORAGE_KEYS.CALL_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(DEFAULT_CALL_LOGS));
      return DEFAULT_CALL_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_CALL_LOGS;
    }
  },

  saveCallLogs(logs) {
    localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(logs));
  },

  getActiveEmployeeId() {
    const session = this.getCurrentSession();
    if (session && session.role === 'employee' && session.user && session.user.id) {
      return session.user.id;
    }
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_EMP) || 'emp-1';
  },

  setActiveEmployeeId(id) {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EMP, id);
  },

  getActiveView() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_VIEW) || 'employee';
  },

  setActiveView(view) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_VIEW, view);
  },

  // ==========================================
  // AUTHENTICATION & SESSION MANAGEMENT
  // ==========================================
  getCurrentSession() {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setCurrentSession(sessionObj) {
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(sessionObj));
  },

  loginEmployee(identifier, password) {
    const employees = this.getEmployees();
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Match by email, id, or first/full name
    const found = employees.find(emp => 
      emp.email.toLowerCase() === cleanId ||
      emp.id.toLowerCase() === cleanId ||
      emp.name.toLowerCase() === cleanId ||
      emp.name.toLowerCase().includes(cleanId)
    );

    if (!found) {
      return { success: false, message: 'Employee account not found. Please select from demo profiles below.' };
    }

    // Optional password verification (accepts assigned password, 'apex123', or empty for quick demo)
    if (cleanPass && found.password && cleanPass !== found.password && cleanPass !== 'apex123' && cleanPass !== '123456') {
      return { success: false, message: `Incorrect password for ${found.name}. (Default: ${found.password})` };
    }

    const session = {
      role: 'employee',
      user: {
        id: found.id,
        name: found.name,
        role: found.role,
        email: found.email,
        avatar: found.avatar,
        targetDailyCalls: found.targetDailyCalls,
        status: found.status
      },
      loginAt: new Date().toISOString()
    };

    this.setCurrentSession(session);
    this.setActiveEmployeeId(found.id);
    return { success: true, session };
  },

  loginManager(email, password) {
    const manager = this.getManager();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPass = (password || '').trim();

    const matchesEmail = cleanEmail === manager.email.toLowerCase() || 
                         cleanEmail === 'manager' || 
                         cleanEmail === 'admin' ||
                         cleanEmail === 'director';

    if (!matchesEmail) {
      return { success: false, message: 'Invalid manager credentials. Demo email: manager@apexflow.crm' };
    }

    if (cleanPass && cleanPass !== manager.password && cleanPass !== 'apex123' && cleanPass !== 'admin123') {
      return { success: false, message: 'Invalid password. (Default demo password: manager123)' };
    }

    const session = {
      role: 'manager',
      user: {
        id: manager.id,
        name: manager.name,
        role: manager.role,
        email: manager.email,
        avatar: manager.avatar,
        title: manager.title
      },
      loginAt: new Date().toISOString()
    };

    this.setCurrentSession(session);
    return { success: true, session };
  },

  logout(redirectTarget) {
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    if (redirectTarget) {
      window.location.href = redirectTarget;
    } else {
      window.location.href = 'index.html';
    }
  },

  requireAuth(requiredRole) {
    const session = this.getCurrentSession();
    if (!session || !session.user) {
      if (requiredRole === 'employee') {
        window.location.href = 'login-employee.html';
      } else if (requiredRole === 'manager') {
        window.location.href = 'login-manager.html';
      } else {
        window.location.href = 'index.html';
      }
      return null;
    }

    if (requiredRole && session.role !== requiredRole) {
      if (requiredRole === 'employee') {
        window.location.href = 'employee.html';
      } else if (requiredRole === 'manager') {
        window.location.href = 'manager.html';
      }
      return null;
    }

    return session;
  },

  // ==========================================
  // EMPLOYEE SPECIFIC DATA ISOLATION QUERIES
  // ==========================================
  getEmployeeContacts(empId) {
    const all = this.getContacts();
    return all.filter(c => c.assignedTo === empId);
  },

  getEmployeeCallLogs(empId) {
    const all = this.getCallLogs();
    return all.filter(log => log.employeeId === empId);
  },

  addContact(contact) {
    const contacts = this.getContacts();
    const newContact = {
      id: 'cnt-' + Date.now(),
      createdAt: new Date().toISOString(),
      lastCallDate: null,
      totalCalls: 0,
      tags: ['New Lead'],
      ...contact
    };
    contacts.unshift(newContact);
    this.saveContacts(contacts);
    return newContact;
  },

  reassignContact(contactId, newEmpId) {
    const contacts = this.getContacts();
    const contact = contacts.find(c => c.id === contactId);
    if (contact) {
      contact.assignedTo = newEmpId;
      this.saveContacts(contacts);
      return true;
    }
    return false;
  },

  resetAllData() {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
    localStorage.setItem(STORAGE_KEYS.MANAGER, JSON.stringify(DEFAULT_MANAGER));
    localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(DEFAULT_CONTACTS));
    localStorage.setItem(STORAGE_KEYS.CALL_LOGS, JSON.stringify(DEFAULT_CALL_LOGS));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_EMP, 'emp-1');
    localStorage.setItem(STORAGE_KEYS.CURRENT_VIEW, 'employee');
  }
};

window.CRM_DATA = CRM_DATA;

