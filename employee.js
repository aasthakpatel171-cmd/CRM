/**
 * ApexFlow CRM - Employee Workspace Controller
 * Enforces role isolation: Displays and manages strictly the logged-in representative's data.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Session & Auth Guard
  const session = CRM_DATA.requireAuth('employee');
  if (!session || !session.user) return; // redirected by requireAuth

  const loggedInEmp = session.user;

  // 2. Data State
  let contacts = CRM_DATA.getContacts();
  let callLogs = CRM_DATA.getCallLogs();

  // Active Call State
  let activeCall = {
    contact: null,
    status: 'idle', // 'idle' | 'calling' | 'connected' | 'ended'
    seconds: 0,
    timerInterval: null
  };

  // Sound Synthesizer (Zero-dependency Web Audio API)
  const soundManager = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
    },
    playTone(freq = 440, type = 'sine', duration = 0.15, gainVal = 0.05) {
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Fallback silently
      }
    },
    ring() {
      this.playTone(480, 'sine', 0.25, 0.04);
      setTimeout(() => this.playTone(440, 'sine', 0.25, 0.04), 80);
    },
    connected() {
      this.playTone(600, 'sine', 0.1, 0.05);
      setTimeout(() => this.playTone(800, 'sine', 0.15, 0.05), 100);
    },
    hangup() {
      this.playTone(320, 'triangle', 0.12, 0.04);
    },
    success() {
      this.playTone(523.25, 'sine', 0.1, 0.05);
      setTimeout(() => this.playTone(659.25, 'sine', 0.1, 0.05), 100);
      setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.06), 200);
    }
  };

  // DOM Elements
  const navRepAvatar = document.getElementById('nav-rep-avatar');
  const navRepName = document.getElementById('nav-rep-name');
  const navRepRole = document.getElementById('nav-rep-role');
  const navRepStatusDot = document.getElementById('nav-rep-status-dot');
  const btnLogout = document.getElementById('btn-logout');

  const repBannerGreeting = document.getElementById('rep-banner-greeting');
  const repBannerRole = document.getElementById('rep-banner-role');
  const empStatCallsToday = document.getElementById('emp-stat-calls-today');
  const empStatTalkTime = document.getElementById('emp-stat-talk-time');
  const empStatPipeline = document.getElementById('emp-stat-pipeline');

  const empCardTotalLeads = document.getElementById('emp-card-total-leads');
  const empCardCallsCount = document.getElementById('emp-card-calls-count');
  const empProgressCalls = document.getElementById('emp-progress-calls');
  const empCardTargetText = document.getElementById('emp-card-target-text');
  const empCardHighPriority = document.getElementById('emp-card-high-priority');
  const empCardProposalsCount = document.getElementById('emp-card-proposals-count');

  const filterSearchInput = document.getElementById('filter-search-input');
  const filterStageSelect = document.getElementById('filter-stage-select');
  const filterPrioritySelect = document.getElementById('filter-priority-select');
  const tbodyEmployeeContacts = document.getElementById('tbody-employee-contacts');

  // Call Dialer Modal Elements
  const modalCallDialer = document.getElementById('modal-call-dialer');
  const dialerStatusBadge = document.getElementById('dialer-status-badge');
  const dialerCustomerName = document.getElementById('dialer-customer-name');
  const dialerCustomerCompany = document.getElementById('dialer-customer-company');
  const dialerCustomerPhone = document.getElementById('dialer-customer-phone');
  const dialerTimerDisplay = document.getElementById('dialer-timer-display');
  const dialerAudioWave = document.getElementById('dialer-audio-wave');
  const btnDialerHangup = document.getElementById('btn-dialer-hangup');
  const dialerOutcomeSelect = document.getElementById('dialer-outcome-select');
  const dialerStageSelect = document.getElementById('dialer-stage-select');
  const dialerFollowupDate = document.getElementById('dialer-followup-date');
  const dialerNotesText = document.getElementById('dialer-notes-text');
  const btnDialerCancel = document.getElementById('btn-dialer-cancel');
  const btnDialerSave = document.getElementById('btn-dialer-save');

  // Add Contact Modal Elements
  const btnAddContactModal = document.getElementById('btn-add-contact-modal');
  const modalAddContact = document.getElementById('modal-add-contact');
  const btnCloseAddModal = document.getElementById('btn-close-add-modal');
  const btnCancelAddModal = document.getElementById('btn-cancel-add-modal');
  const formNewContact = document.getElementById('form-new-contact');
  const btnSubmitNewContact = document.getElementById('btn-submit-new-contact');

  // Detail Modal Elements
  const modalContactDetails = document.getElementById('modal-contact-details');
  const btnCloseDetailModal = document.getElementById('btn-close-detail-modal');
  const btnCloseDetailModalFooter = document.getElementById('btn-close-detail-modal-footer');
  const detailContactName = document.getElementById('detail-contact-name');
  const detailContactSub = document.getElementById('detail-contact-sub');
  const detailStageBadge = document.getElementById('detail-stage-badge');
  const detailPriorityBadge = document.getElementById('detail-priority-badge');
  const detailDealValue = document.getElementById('detail-deal-value');
  const detailNotesText = document.getElementById('detail-notes-text');
  const detailCallsList = document.getElementById('detail-calls-list');
  const btnDetailTriggerCall = document.getElementById('btn-detail-trigger-call');
  let selectedDetailContactId = null;

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // ============================================
  // INITIALIZATION
  // ============================================
  function initEmployeeWorkspace() {
    renderRepHeader();
    bindEvents();
    renderWorkspace();
  }

  function renderRepHeader() {
    navRepAvatar.src = loggedInEmp.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80';
    navRepName.textContent = loggedInEmp.name;
    navRepRole.textContent = loggedInEmp.role;

    repBannerGreeting.textContent = `Welcome back, ${loggedInEmp.name}`;
    repBannerRole.textContent = loggedInEmp.role.split(' ')[0] + ' ' + (loggedInEmp.role.split(' ')[1] || '');
  }

  function bindEvents() {
    // Logout
    btnLogout.addEventListener('click', () => {
      showToast('Signing out...', 'info');
      setTimeout(() => {
        CRM_DATA.logout('login-employee.html');
      }, 300);
    });

    // Table Filters
    filterSearchInput.addEventListener('input', renderEmployeeContactsTable);
    filterStageSelect.addEventListener('change', renderEmployeeContactsTable);
    filterPrioritySelect.addEventListener('change', renderEmployeeContactsTable);

    // Call Dialer
    btnDialerHangup.addEventListener('click', endActiveCall);
    btnDialerCancel.addEventListener('click', closeCallDialer);
    btnDialerSave.addEventListener('click', saveCallLogRecord);

    // Add Lead Modal
    btnAddContactModal.addEventListener('click', openAddContactModal);
    btnCloseAddModal.addEventListener('click', closeAddContactModal);
    btnCancelAddModal.addEventListener('click', closeAddContactModal);
    btnSubmitNewContact.addEventListener('click', handleCreateNewContact);

    // Contact Details Modal
    btnCloseDetailModal.addEventListener('click', closeContactDetailModal);
    btnCloseDetailModalFooter.addEventListener('click', closeContactDetailModal);
    btnDetailTriggerCall.addEventListener('click', () => {
      if (selectedDetailContactId) {
        closeContactDetailModal();
        startCallToCustomer(selectedDetailContactId);
      }
    });
  }

  // ============================================
  // WORKSPACE RENDERING (STRICT EMPLOYEE ISOLATION)
  // ============================================
  function renderWorkspace() {
    contacts = CRM_DATA.getContacts();
    callLogs = CRM_DATA.getCallLogs();

    // STRICT FILTER: Only assigned to this logged in employee!
    const myContacts = contacts.filter(c => c.assignedTo === loggedInEmp.id);
    const myCalls = callLogs.filter(c => c.employeeId === loggedInEmp.id);

    // Personal Metrics
    const totalTalkSec = myCalls.reduce((acc, c) => acc + (c.durationSec || 0), 0);
    const talkMinutes = Math.round(totalTalkSec / 60);

    const activePipelineSum = myContacts
      .filter(c => ['New', 'Contacted', 'Interested', 'Proposal'].includes(c.stage))
      .reduce((acc, c) => acc + (c.dealValue || 0), 0);

    const highPriorityCount = myContacts.filter(c => c.priority === 'High').length;
    const proposalCount = myContacts.filter(c => c.stage === 'Proposal').length;

    // Update Banner Stats
    empStatCallsToday.textContent = myCalls.length;
    empStatTalkTime.textContent = `${talkMinutes}m`;
    empStatPipeline.textContent = `$${activePipelineSum.toLocaleString()}`;

    // Update KPI Cards
    empCardTotalLeads.textContent = myContacts.length;
    empCardCallsCount.textContent = myCalls.length;
    empCardHighPriority.textContent = highPriorityCount;
    empCardProposalsCount.textContent = proposalCount;

    // Target Progress Bar
    const target = loggedInEmp.targetDailyCalls || 25;
    const pct = Math.min(100, Math.round((myCalls.length / target) * 100));
    empProgressCalls.style.width = `${pct}%`;
    empCardTargetText.textContent = `Daily Target: ${myCalls.length} / ${target} calls (${pct}%)`;

    renderEmployeeContactsTable();
  }

  function renderEmployeeContactsTable() {
    // Strictly my contacts
    let list = contacts.filter(c => c.assignedTo === loggedInEmp.id);

    // Search query
    const query = filterSearchInput.value.trim().toLowerCase();
    if (query) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.company.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query))
      );
    }

    // Stage
    const stage = filterStageSelect.value;
    if (stage !== 'ALL') {
      list = list.filter(c => c.stage === stage);
    }

    // Priority
    const priority = filterPrioritySelect.value;
    if (priority !== 'ALL') {
      list = list.filter(c => c.priority === priority);
    }

    tbodyEmployeeContacts.innerHTML = '';

    if (list.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No assigned contacts match your current filter criteria.
        </td>
      `;
      tbodyEmployeeContacts.appendChild(emptyRow);
      return;
    }

    list.forEach(c => {
      const tr = document.createElement('tr');
      const initials = c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      const stageBadgeClass = `badge-${c.stage.toLowerCase()}`;
      const priorityClass = `priority-${c.priority.toLowerCase()}`;
      const lastTouch = c.lastCallDate 
        ? formatTimeAgo(c.lastCallDate) 
        : '<span style="color: #64748b;">Never called</span>';

      tr.innerHTML = `
        <td>
          <div class="contact-cell">
            <div class="contact-avatar">${initials}</div>
            <div>
              <div class="contact-name">${escapeHtml(c.name)}</div>
              <div class="contact-title">${escapeHtml(c.title || 'Decision Maker')}</div>
            </div>
          </div>
        </td>
        <td>
          <div class="contact-company">${escapeHtml(c.company)}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${c.tags ? c.tags.join(' • ') : ''}</div>
        </td>
        <td>
          <a href="tel:${escapeHtml(c.phone)}" class="table-phone-link" style="font-family: var(--font-mono); font-size: 0.85rem; color: #38bdf8;">${escapeHtml(c.phone)}</a>
        </td>
        <td>
          <span class="deal-value">$${(c.dealValue || 0).toLocaleString()}</span>
        </td>
        <td>
          <span class="badge ${stageBadgeClass}">${c.stage}</span>
        </td>
        <td>
          <span class="${priorityClass}">${c.priority}</span>
        </td>
        <td>
          <div style="font-size: 0.82rem; color: var(--text-main); font-weight: 600;">${c.totalCalls || 0} calls</div>
          <div style="font-size: 0.72rem; color: var(--text-muted);">${lastTouch}</div>
        </td>
        <td style="text-align: right;">
          <div style="display: inline-flex; gap: 0.5rem;">
            <button class="btn-call-action" data-contact-id="${c.id}" title="Initiate outbound call to ${escapeHtml(c.name)}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>Call</span>
            </button>
            <button class="btn-view-notes" data-detail-id="${c.id}" title="View notes & call history">
              <span>History</span>
            </button>
          </div>
        </td>
      `;

      tr.querySelector('.btn-call-action').addEventListener('click', () => {
        startCallToCustomer(c.id);
      });

      tr.querySelector('.btn-view-notes').addEventListener('click', () => {
        openContactDetailModal(c.id);
      });

      tbodyEmployeeContacts.appendChild(tr);
    });
  }

  // ============================================
  // INTERACTIVE CALL DIALER ENGINE
  // ============================================
  function startCallToCustomer(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    activeCall.contact = contact;
    activeCall.status = 'calling';
    activeCall.seconds = 0;

    dialerCustomerName.textContent = contact.name;
    dialerCustomerCompany.textContent = `${contact.title || 'Executive'} • ${contact.company}`;
    dialerCustomerPhone.textContent = contact.phone;
    dialerTimerDisplay.textContent = '00:00';
    dialerStatusBadge.textContent = 'Connecting Outbound Call...';
    dialerStatusBadge.className = 'dialer-status-pill calling';
    dialerAudioWave.classList.add('active');

    // Default outcome and stage
    dialerOutcomeSelect.value = 'Connected - Interested';
    dialerStageSelect.value = contact.stage;
    dialerNotesText.value = '';

    // Set tomorrow date default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dialerFollowupDate.value = tomorrow.toISOString().split('T')[0];

    // Open modal
    modalCallDialer.classList.add('open');
    modalCallDialer.setAttribute('aria-hidden', 'false');

    // Audio ringing sound
    soundManager.ring();

    // Status indicator
    navRepStatusDot.className = 'status-indicator-dot in-call';

    // Transition from 'calling' to 'connected' after 1.8 seconds
    setTimeout(() => {
      if (activeCall.status === 'calling') {
        activeCall.status = 'connected';
        dialerStatusBadge.textContent = 'In Call • Live Audio';
        dialerStatusBadge.className = 'dialer-status-pill connected';
        soundManager.connected();

        // Start timer
        activeCall.timerInterval = setInterval(() => {
          activeCall.seconds++;
          const mins = String(Math.floor(activeCall.seconds / 60)).padStart(2, '0');
          const secs = String(activeCall.seconds % 60).padStart(2, '0');
          dialerTimerDisplay.textContent = `${mins}:${secs}`;
        }, 1000);
      }
    }, 1800);
  }

  function endActiveCall() {
    if (activeCall.timerInterval) {
      clearInterval(activeCall.timerInterval);
    }
    activeCall.status = 'ended';
    dialerStatusBadge.textContent = 'Call Ended • Log Summary';
    dialerStatusBadge.className = 'dialer-status-pill ended';
    dialerAudioWave.classList.remove('active');
    soundManager.hangup();

    navRepStatusDot.className = 'status-indicator-dot online';
    showToast(`Call ended (${dialerTimerDisplay.textContent}). Please enter summary notes.`, 'info');
  }

  function closeCallDialer() {
    if (activeCall.timerInterval) {
      clearInterval(activeCall.timerInterval);
    }
    activeCall.status = 'idle';
    modalCallDialer.classList.remove('open');
    modalCallDialer.setAttribute('aria-hidden', 'true');
    navRepStatusDot.className = 'status-indicator-dot online';
  }

  function saveCallLogRecord() {
    if (!activeCall.contact) return;

    const duration = activeCall.seconds || 45;
    const outcome = dialerOutcomeSelect.value;
    const selectedStage = dialerStageSelect.value;
    const notes = dialerNotesText.value.trim() || `Outbound phone call conducted by ${loggedInEmp.name}.`;

    // Create call log tagged with loggedInEmp
    const newLog = {
      id: 'call-' + Date.now(),
      employeeId: loggedInEmp.id,
      employeeName: loggedInEmp.name,
      contactId: activeCall.contact.id,
      contactName: activeCall.contact.name,
      company: activeCall.contact.company,
      durationSec: duration,
      outcome: outcome,
      notes: notes,
      timestamp: new Date().toISOString(),
      rating: outcome.includes('Won') ? 'won' : (outcome.includes('Lost') ? 'lost' : 'positive')
    };

    callLogs.unshift(newLog);
    CRM_DATA.saveCallLogs(callLogs);

    // Update contact record
    const cIndex = contacts.findIndex(c => c.id === activeCall.contact.id);
    if (cIndex !== -1) {
      contacts[cIndex].lastCallDate = new Date().toISOString();
      contacts[cIndex].totalCalls = (contacts[cIndex].totalCalls || 0) + 1;
      if (selectedStage && selectedStage !== 'Keep') {
        contacts[cIndex].stage = selectedStage;
      }
      if (notes) {
        contacts[cIndex].notes = notes;
      }
      CRM_DATA.saveContacts(contacts);
    }

    soundManager.success();
    closeCallDialer();
    renderWorkspace();
    showToast(`Call logged successfully for ${activeCall.contact.name}!`, 'success');
  }

  // ============================================
  // ADD CONTACT (AUTOMATICALLY ASSIGNED TO THIS REP)
  // ============================================
  function openAddContactModal() {
    formNewContact.reset();
    modalAddContact.classList.add('open');
    modalAddContact.setAttribute('aria-hidden', 'false');
  }

  function closeAddContactModal() {
    modalAddContact.classList.remove('open');
    modalAddContact.setAttribute('aria-hidden', 'true');
  }

  function handleCreateNewContact(e) {
    e.preventDefault();

    const name = document.getElementById('new-contact-name').value.trim();
    const company = document.getElementById('new-contact-company').value.trim();
    const title = document.getElementById('new-contact-title-input').value.trim() || 'Lead Contact';
    const deal = parseFloat(document.getElementById('new-contact-deal').value) || 25000;
    const phone = document.getElementById('new-contact-phone').value.trim();
    const email = document.getElementById('new-contact-email').value.trim() || '';
    const stage = document.getElementById('new-contact-stage').value;
    const priority = document.getElementById('new-contact-priority').value;
    const notes = document.getElementById('new-contact-notes').value.trim() || 'Added directly from Employee Workspace.';

    if (!name || !company || !phone) {
      alert('Please fill in Customer Name, Company, and Phone Number.');
      return;
    }

    // Auto assigned strictly to loggedInEmp
    const newContact = {
      name,
      company,
      title,
      dealValue: deal,
      phone,
      email,
      stage,
      priority,
      assignedTo: loggedInEmp.id,
      notes,
      tags: ['Inbound', 'Personal Queue']
    };

    CRM_DATA.addContact(newContact);
    closeAddContactModal();
    renderWorkspace();
    showToast(`Added ${name} to your call queue!`, 'success');
  }

  // ============================================
  // CONTACT DETAILS MODAL
  // ============================================
  function openContactDetailModal(contactId) {
    selectedDetailContactId = contactId;
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    detailContactName.textContent = contact.name;
    detailContactSub.textContent = `${contact.title || 'Decision Maker'} • ${contact.company} • ${contact.phone}`;
    detailStageBadge.textContent = contact.stage;
    detailStageBadge.className = `badge badge-${contact.stage.toLowerCase()}`;
    detailPriorityBadge.textContent = `${contact.priority} Priority`;
    detailPriorityBadge.className = `badge priority-${contact.priority.toLowerCase()}`;
    detailDealValue.textContent = `$${(contact.dealValue || 0).toLocaleString()}`;
    detailNotesText.textContent = contact.notes || 'No notes logged yet for this account.';

    // Filter calls for this contact
    const contactCalls = callLogs.filter(cl => cl.contactId === contactId);
    detailCallsList.innerHTML = '';

    if (contactCalls.length === 0) {
      detailCallsList.innerHTML = `
        <div style="font-size: 0.8rem; color: var(--text-muted); padding: 0.5rem 0;">
          No recorded calls with this customer yet. Click "Call This Customer" to begin outreach.
        </div>
      `;
    } else {
      contactCalls.forEach(call => {
        const item = document.createElement('div');
        item.className = 'history-call-item';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
            <span style="font-size: 0.82rem; font-weight: 700; color: #fff;">${escapeHtml(call.outcome)}</span>
            <span style="font-size: 0.72rem; color: var(--text-muted);">${formatTimeAgo(call.timestamp)}</span>
          </div>
          <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.2rem;">
            Rep: <strong style="color: #cbd5e1;">${escapeHtml(call.employeeName || loggedInEmp.name)}</strong> • Duration: ${Math.round((call.durationSec || 0) / 60)}m (${call.durationSec || 0}s)
          </div>
          <div style="font-size: 0.78rem; color: #64748b; font-style: italic;">
            "${escapeHtml(call.notes || 'Routine touchpoint')}"
          </div>
        `;
        detailCallsList.appendChild(item);
      });
    }

    modalContactDetails.classList.add('open');
    modalContactDetails.setAttribute('aria-hidden', 'false');
  }

  function closeContactDetailModal() {
    selectedDetailContactId = null;
    modalContactDetails.classList.remove('open');
    modalContactDetails.setAttribute('aria-hidden', 'true');
  }

  // ============================================
  // UTILITY HELPERS
  // ============================================
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return 'Never';
    const now = new Date();
    const date = new Date(isoString);
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Run on start
  initEmployeeWorkspace();
});
