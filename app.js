/**
 * ApexFlow CRM - Application Controller & Reactive Engine
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  let employees = CRM_DATA.getEmployees();
  let contacts = CRM_DATA.getContacts();
  let callLogs = CRM_DATA.getCallLogs();
  let activeEmpId = CRM_DATA.getActiveEmployeeId();
  let currentView = CRM_DATA.getActiveView();

  // Call Simulator State
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
        // Silent fallback if audio context restricted
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
  const tabEmployee = document.getElementById('tab-employee-view');
  const tabManager = document.getElementById('tab-manager-view');
  const viewEmployee = document.getElementById('view-employee');
  const viewManager = document.getElementById('view-manager');
  const selectActiveEmp = document.getElementById('select-active-employee');
  const btnResetData = document.getElementById('btn-reset-data');
  const btnAddContactModal = document.getElementById('btn-add-contact-modal');
  const toastContainer = document.getElementById('toast-container');

  // Employee View Elements
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

  // Manager View Elements
  const mgrStatTotalCalls = document.getElementById('mgr-stat-total-calls');
  const mgrStatTotalPipeline = document.getElementById('mgr-stat-total-pipeline');
  const mgrStatWinRate = document.getElementById('mgr-stat-win-rate');
  const mgrKpiCalls = document.getElementById('mgr-kpi-calls');
  const mgrKpiTalkTime = document.getElementById('mgr-kpi-talk-time');
  const mgrKpiRevenue = document.getElementById('mgr-kpi-revenue');
  const mgrKpiLeadsCount = document.getElementById('mgr-kpi-leads-count');
  const tbodyManagerEmployees = document.getElementById('tbody-manager-employees');
  const streamActivityFeed = document.getElementById('stream-activity-feed');
  const funnelContainer = document.getElementById('funnel-container');
  const outcomesContainer = document.getElementById('outcomes-distribution-container');

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
  const modalAddContact = document.getElementById('modal-add-contact');
  const btnCloseAddModal = document.getElementById('btn-close-add-modal');
  const btnCancelAddModal = document.getElementById('btn-cancel-add-modal');
  const formNewContact = document.getElementById('form-new-contact');
  const btnSubmitNewContact = document.getElementById('btn-submit-new-contact');
  const newContactAssigned = document.getElementById('new-contact-assigned');

  // Contact Detail Modal Elements
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

  // Reassign Modal Elements
  const modalReassign = document.getElementById('modal-reassign');
  const btnCloseReassign = document.getElementById('btn-close-reassign');
  const btnCancelReassign = document.getElementById('btn-cancel-reassign');
  const btnConfirmReassign = document.getElementById('btn-confirm-reassign');
  const reassignLeadName = document.getElementById('reassign-lead-name');
  const reassignEmployeeSelect = document.getElementById('reassign-employee-select');
  let leadToReassignId = null;

  // ============================================
  // INITIALIZATION & EVENT BINDINGS
  // ============================================

  function initApp() {
    populateEmployeeSelectors();
    switchView(currentView);
    bindEvents();
    renderAll();
  }

  function populateEmployeeSelectors() {
    selectActiveEmp.innerHTML = '';
    newContactAssigned.innerHTML = '';
    reassignEmployeeSelect.innerHTML = '';

    employees.forEach(emp => {
      // Active rep selector in header
      const opt1 = document.createElement('option');
      opt1.value = emp.id;
      opt1.textContent = `${emp.name} (${emp.role.split(' ')[0]})`;
      if (emp.id === activeEmpId) opt1.selected = true;
      selectActiveEmp.appendChild(opt1);

      // Add contact assigned rep selector
      const opt2 = document.createElement('option');
      opt2.value = emp.id;
      opt2.textContent = `${emp.name} - ${emp.role}`;
      newContactAssigned.appendChild(opt2);

      // Reassign modal rep selector
      const opt3 = document.createElement('option');
      opt3.value = emp.id;
      opt3.textContent = `${emp.name} - ${emp.role}`;
      reassignEmployeeSelect.appendChild(opt3);
    });
  }

  function bindEvents() {
    // Role tabs
    tabEmployee.addEventListener('click', () => switchView('employee'));
    tabManager.addEventListener('click', () => switchView('manager'));

    // Active rep changed
    selectActiveEmp.addEventListener('change', (e) => {
      activeEmpId = e.target.value;
      CRM_DATA.setActiveEmployeeId(activeEmpId);
      showToast(`Switched active rep to ${getActiveEmployee().name}`, 'info');
      renderEmployeeView();
      renderManagerView();
    });

    // Reset Demo Data
    btnResetData.addEventListener('click', () => {
      if (confirm('Reset CRM database to fresh sample records?')) {
        CRM_DATA.resetAllData();
        employees = CRM_DATA.getEmployees();
        contacts = CRM_DATA.getContacts();
        callLogs = CRM_DATA.getCallLogs();
        activeEmpId = CRM_DATA.getActiveEmployeeId();
        populateEmployeeSelectors();
        renderAll();
        showToast('Demo data restored to initial state.', 'success');
      }
    });

    // Filters for employee table
    filterSearchInput.addEventListener('input', renderEmployeeContactsTable);
    filterStageSelect.addEventListener('change', renderEmployeeContactsTable);
    filterPrioritySelect.addEventListener('change', renderEmployeeContactsTable);

    // Call Dialer controls
    btnDialerHangup.addEventListener('click', endActiveCall);
    btnDialerCancel.addEventListener('click', closeCallDialer);
    btnDialerSave.addEventListener('click', saveCallLogRecord);

    // Add Contact Modal
    btnAddContactModal.addEventListener('click', openAddContactModal);
    btnCloseAddModal.addEventListener('click', closeAddContactModal);
    btnCancelAddModal.addEventListener('click', closeAddContactModal);
    btnSubmitNewContact.addEventListener('click', handleCreateNewContact);

    // Detail Modal
    btnCloseDetailModal.addEventListener('click', closeContactDetailModal);
    btnCloseDetailModalFooter.addEventListener('click', closeContactDetailModal);
    btnDetailTriggerCall.addEventListener('click', () => {
      if (selectedDetailContactId) {
        closeContactDetailModal();
        startCallToCustomer(selectedDetailContactId);
      }
    });

    // Reassign Modal
    btnCloseReassign.addEventListener('click', closeReassignModal);
    btnCancelReassign.addEventListener('click', closeReassignModal);
    btnConfirmReassign.addEventListener('click', handleConfirmReassign);
  }

  // ============================================
  // VIEW SWITCHING (EMPLOYEE vs MANAGER)
  // ============================================

  function switchView(viewName) {
    currentView = viewName;
    CRM_DATA.setActiveView(viewName);

    if (viewName === 'employee') {
      tabEmployee.classList.add('active');
      tabManager.classList.remove('active');
      viewEmployee.classList.add('active');
      viewManager.classList.remove('active');
      renderEmployeeView();
    } else {
      tabManager.classList.add('active');
      tabEmployee.classList.remove('active');
      viewManager.classList.add('active');
      viewEmployee.classList.remove('active');
      renderManagerView();
    }
  }

  function getActiveEmployee() {
    return employees.find(e => e.id === activeEmpId) || employees[0];
  }

  function renderAll() {
    renderEmployeeView();
    renderManagerView();
  }

  // ============================================
  // EMPLOYEE VIEW RENDERING
  // ============================================

  function renderEmployeeView() {
    const activeRep = getActiveEmployee();
    repBannerGreeting.textContent = `Hello, ${activeRep.name}`;
    repBannerRole.textContent = activeRep.role;

    // Filter contacts assigned to active employee
    const assignedContacts = contacts.filter(c => c.assignedTo === activeRep.id);

    // Filter calls made by this employee today
    const repCalls = callLogs.filter(c => c.employeeId === activeRep.id);
    const todayCalls = repCalls; // In demo, consider recent logs as today's activity
    const totalTalkSec = repCalls.reduce((acc, c) => acc + (c.durationSec || 0), 0);
    const talkMinutes = Math.round(totalTalkSec / 60);

    // Pipeline sum for active rep (New, Contacted, Interested, Proposal)
    const pipelineSum = assignedContacts
      .filter(c => ['New', 'Contacted', 'Interested', 'Proposal'].includes(c.stage))
      .reduce((acc, c) => acc + (c.dealValue || 0), 0);

    // High priority count
    const highPriorityCount = assignedContacts.filter(c => c.priority === 'High').length;
    const proposalCount = assignedContacts.filter(c => c.stage === 'Proposal').length;

    // Update banner & KPI elements
    empStatCallsToday.textContent = todayCalls.length;
    empStatTalkTime.textContent = `${talkMinutes}m`;
    empStatPipeline.textContent = `$${pipelineSum.toLocaleString()}`;

    empCardTotalLeads.textContent = assignedContacts.length;
    empCardCallsCount.textContent = todayCalls.length;
    empCardHighPriority.textContent = highPriorityCount;
    empCardProposalsCount.textContent = proposalCount;

    // Progress bar for calls
    const target = activeRep.targetDailyCalls || 25;
    const pct = Math.min(100, Math.round((todayCalls.length / target) * 100));
    empProgressCalls.style.width = `${pct}%`;
    empCardTargetText.textContent = `Target: ${todayCalls.length} / ${target} calls (${pct}%)`;

    renderEmployeeContactsTable();
  }

  function renderEmployeeContactsTable() {
    const activeRep = getActiveEmployee();
    let list = contacts.filter(c => c.assignedTo === activeRep.id);

    // Search query filter
    const query = filterSearchInput.value.trim().toLowerCase();
    if (query) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.company.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query))
      );
    }

    // Stage filter
    const stage = filterStageSelect.value;
    if (stage !== 'ALL') {
      list = list.filter(c => c.stage === stage);
    }

    // Priority filter
    const priority = filterPrioritySelect.value;
    if (priority !== 'ALL') {
      list = list.filter(c => c.priority === priority);
    }

    tbodyEmployeeContacts.innerHTML = '';

    if (list.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No customer contacts match your filter criteria for ${activeRep.name}.
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
          <span style="font-family: var(--font-mono); font-size: 0.85rem; color: #38bdf8;">${escapeHtml(c.phone)}</span>
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
              Call
            </button>
            <button class="btn-view-notes" data-detail-id="${c.id}" title="View notes & call history">
              History
            </button>
          </div>
        </td>
      `;

      // Event listener for Call button
      tr.querySelector('.btn-call-action').addEventListener('click', () => {
        startCallToCustomer(c.id);
      });

      // Event listener for Notes/History button
      tr.querySelector('.btn-view-notes').addEventListener('click', () => {
        openContactDetailModal(c.id);
      });

      tbodyEmployeeContacts.appendChild(tr);
    });
  }

  // ============================================
  // MANAGER VIEW RENDERING & ANALYTICS
  // ============================================

  function renderManagerView() {
    // 1. Overall Team KPIs
    const totalCalls = callLogs.length;
    const totalSec = callLogs.reduce((acc, c) => acc + (c.durationSec || 0), 0);
    const totalHours = (totalSec / 3600).toFixed(1);
    const totalMins = Math.round(totalSec / 60);

    const wonContacts = contacts.filter(c => c.stage === 'Won');
    const lostContacts = contacts.filter(c => c.stage === 'Lost');
    const totalWonRev = wonContacts.reduce((acc, c) => acc + (c.dealValue || 0), 0);

    const closedCount = wonContacts.length + lostContacts.length;
    const winRate = closedCount > 0 ? Math.round((wonContacts.length / closedCount) * 100) : 0;

    const activePipeline = contacts
      .filter(c => ['New', 'Contacted', 'Interested', 'Proposal'].includes(c.stage))
      .reduce((acc, c) => acc + (c.dealValue || 0), 0);

    mgrStatTotalCalls.textContent = totalCalls;
    mgrStatTotalPipeline.textContent = `$${activePipeline.toLocaleString()}`;
    mgrStatWinRate.textContent = `${winRate}%`;

    mgrKpiCalls.textContent = totalCalls;
    mgrKpiTalkTime.textContent = `${totalHours}h (${totalMins}m)`;
    mgrKpiRevenue.textContent = `$${totalWonRev.toLocaleString()}`;
    mgrKpiLeadsCount.textContent = contacts.length;

    // 2. Employee Leaderboard Table
    renderManagerLeaderboard();

    // 3. Real-Time Activity Feed
    renderLiveActivityFeed();

    // 4. Conversion Funnel & Call Outcomes Charts
    renderAnalyticsCharts();
  }

  function renderManagerLeaderboard() {
    tbodyManagerEmployees.innerHTML = '';

    employees.forEach(emp => {
      const empCalls = callLogs.filter(c => c.employeeId === emp.id);
      const empTalkSec = empCalls.reduce((acc, c) => acc + (c.durationSec || 0), 0);
      const empTalkMin = Math.round(empTalkSec / 60);

      const empAssignedLeads = contacts.filter(c => c.assignedTo === emp.id);
      const empWonRev = empAssignedLeads
        .filter(c => c.stage === 'Won')
        .reduce((acc, c) => acc + (c.dealValue || 0), 0);

      const target = emp.targetDailyCalls || 25;
      const pct = Math.min(100, Math.round((empCalls.length / target) * 100));

      const isCurrentActive = emp.id === activeEmpId && activeCall.status !== 'idle';
      const statusClass = isCurrentActive ? 'status-in-call' : 'status-online';
      const statusLabel = isCurrentActive ? 'Active In-Call' : 'Available / Online';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="employee-profile-pill">
            <img class="employee-avatar" src="${emp.avatar}" alt="${escapeHtml(emp.name)}">
            <div class="employee-info-box">
              <span class="employee-name">${escapeHtml(emp.name)}</span>
              <span class="employee-role-tag">${escapeHtml(emp.role)}</span>
            </div>
          </div>
        </td>
        <td>
          <span class="status-indicator ${statusClass}">
            <span class="status-dot"></span>
            ${statusLabel}
          </span>
        </td>
        <td>
          <div style="font-weight: 700; color: #fff;">${empCalls.length} / ${target}</div>
          <div class="progress-bar-container" style="max-width: 130px;">
            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </td>
        <td>
          <span style="font-family: var(--font-mono); font-weight: 600;">${empTalkMin} mins</span>
        </td>
        <td>
          <span class="badge badge-new">${empAssignedLeads.length} leads</span>
        </td>
        <td>
          <span class="deal-value">$${empWonRev.toLocaleString()}</span>
        </td>
        <td style="text-align: right;">
          <button class="btn-secondary btn-reassign-trigger" data-emp-id="${emp.id}" style="font-size: 0.78rem; padding: 0.35rem 0.75rem;">
            Inspect Queue
          </button>
        </td>
      `;

      tr.querySelector('.btn-reassign-trigger').addEventListener('click', () => {
        // Switch to this rep in employee view
        activeEmpId = emp.id;
        selectActiveEmp.value = emp.id;
        CRM_DATA.setActiveEmployeeId(emp.id);
        switchView('employee');
        showToast(`Switched view to examine ${emp.name}'s calling queue`, 'info');
      });

      tbodyManagerEmployees.appendChild(tr);
    });
  }

  function renderLiveActivityFeed() {
    streamActivityFeed.innerHTML = '';

    if (callLogs.length === 0) {
      streamActivityFeed.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No calls recorded yet.</p>';
      return;
    }

    // Sort calls newest first
    const sortedLogs = [...callLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    sortedLogs.slice(0, 12).forEach(log => {
      const node = document.createElement('div');
      node.className = 'activity-node';

      const isWon = log.outcome.includes('Won');
      const iconClass = isWon ? 'won-icon' : 'call-icon';
      const iconSvg = isWon
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>';

      const durationText = log.durationSec ? `${Math.floor(log.durationSec / 60)}m ${log.durationSec % 60}s` : '0m';

      node.innerHTML = `
        <div class="activity-node-icon ${iconClass}">
          ${iconSvg}
        </div>
        <div class="activity-body">
          <div class="activity-header">
            <span class="activity-actor">${escapeHtml(log.employeeName)}</span>
            <span class="activity-time">${formatTimeAgo(log.timestamp)}</span>
          </div>
          <div class="activity-action">
            Completed call with <span class="activity-contact-tag">${escapeHtml(log.contactName)}</span> 
            (${escapeHtml(log.company)}) • <strong>${durationText}</strong>
          </div>
          <div style="margin-top: 0.35rem;">
            <span class="badge ${isWon ? 'badge-won' : 'badge-interested'}">${escapeHtml(log.outcome)}</span>
          </div>
          ${log.notes ? `<div class="activity-notes-quote">"${escapeHtml(log.notes)}"</div>` : ''}
        </div>
      `;

      streamActivityFeed.appendChild(node);
    });
  }

  function renderAnalyticsCharts() {
    // 1. Pipeline Funnel
    funnelContainer.innerHTML = '';
    const stages = ['New', 'Contacted', 'Interested', 'Proposal', 'Won'];
    const counts = {};
    stages.forEach(st => counts[st] = contacts.filter(c => c.stage === st).length);
    const maxCount = Math.max(...Object.values(counts), 1);

    stages.forEach(st => {
      const count = counts[st];
      const pct = Math.round((count / maxCount) * 100);
      const row = document.createElement('div');
      row.className = 'funnel-row';
      row.innerHTML = `
        <div class="funnel-label">${st}</div>
        <div class="funnel-track">
          <div class="funnel-bar ${st === 'Won' ? 'won-bar' : ''}" style="width: ${Math.max(pct, 12)}%;">
            ${count} leads
          </div>
        </div>
      `;
      funnelContainer.appendChild(row);
    });

    // 2. Outcomes Distribution
    outcomesContainer.innerHTML = '';
    const outcomeCounts = {};
    callLogs.forEach(c => {
      outcomeCounts[c.outcome] = (outcomeCounts[c.outcome] || 0) + 1;
    });

    const totalCalls = Math.max(callLogs.length, 1);
    Object.keys(outcomeCounts).forEach(outcome => {
      const count = outcomeCounts[outcome];
      const pct = Math.round((count / totalCalls) * 100);
      const row = document.createElement('div');
      row.className = 'funnel-row';
      row.innerHTML = `
        <div class="funnel-label" style="width: 140px; font-size: 0.78rem;">${escapeHtml(outcome)}</div>
        <div class="funnel-track">
          <div class="funnel-bar" style="width: ${Math.max(pct, 10)}%; background: linear-gradient(90deg, #38bdf8, #818cf8);">
            ${count} (${pct}%)
          </div>
        </div>
      `;
      outcomesContainer.appendChild(row);
    });
  }

  // ============================================
  // INTERACTIVE LIVE CALL DIALER SIMULATOR
  // ============================================

  function startCallToCustomer(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    activeCall.contact = contact;
    activeCall.status = 'calling';
    activeCall.seconds = 0;

    // Prefill modal details
    dialerCustomerName.textContent = contact.name;
    dialerCustomerCompany.textContent = `${contact.title || 'Executive'} • ${contact.company}`;
    dialerCustomerPhone.textContent = contact.phone;
    dialerTimerDisplay.textContent = '00:00';
    dialerNotesText.value = '';
    dialerOutcomeSelect.value = 'Connected - Interested';
    dialerStageSelect.value = 'Keep';

    // Show modal & set calling state
    dialerStatusBadge.textContent = 'Dialing...';
    dialerStatusBadge.className = 'dialer-status-pill calling';
    dialerAudioWave.querySelectorAll('.wave-bar').forEach(b => b.classList.remove('active'));

    modalCallDialer.classList.add('open');
    modalCallDialer.setAttribute('aria-hidden', 'false');

    soundManager.ring();

    // After 2 seconds of ringing, simulate connected state
    setTimeout(() => {
      if (activeCall.status === 'calling') {
        activeCall.status = 'connected';
        dialerStatusBadge.textContent = 'Connected (Live Call)';
        dialerStatusBadge.className = 'dialer-status-pill';
        dialerAudioWave.querySelectorAll('.wave-bar').forEach(b => b.classList.add('active'));
        soundManager.connected();

        // Start call duration timer
        activeCall.timerInterval = setInterval(() => {
          activeCall.seconds++;
          const mins = String(Math.floor(activeCall.seconds / 60)).padStart(2, '0');
          const secs = String(activeCall.seconds % 60).padStart(2, '0');
          dialerTimerDisplay.textContent = `${mins}:${secs}`;
        }, 1000);
      }
    }, 2000);
  }

  function endActiveCall() {
    if (activeCall.timerInterval) {
      clearInterval(activeCall.timerInterval);
      activeCall.timerInterval = null;
    }

    activeCall.status = 'ended';
    dialerStatusBadge.textContent = 'Call Finished';
    dialerStatusBadge.className = 'dialer-status-pill ended';
    dialerAudioWave.querySelectorAll('.wave-bar').forEach(b => b.classList.remove('active'));

    soundManager.hangup();
    showToast('Call ended. Enter your notes and log the interaction.', 'info');
  }

  function closeCallDialer() {
    if (activeCall.timerInterval) {
      clearInterval(activeCall.timerInterval);
      activeCall.timerInterval = null;
    }
    activeCall.status = 'idle';
    modalCallDialer.classList.remove('open');
    modalCallDialer.setAttribute('aria-hidden', 'true');
  }

  function saveCallLogRecord() {
    if (!activeCall.contact) return;

    if (activeCall.status === 'connected') {
      endActiveCall();
    }

    const rep = getActiveEmployee();
    const outcome = dialerOutcomeSelect.value;
    const stageUpdate = dialerStageSelect.value;
    const notes = dialerNotesText.value.trim();
    const followupDate = dialerFollowupDate.value;

    const newLog = {
      id: `call-${Date.now()}`,
      employeeId: rep.id,
      employeeName: rep.name,
      contactId: activeCall.contact.id,
      contactName: activeCall.contact.name,
      company: activeCall.contact.company,
      durationSec: Math.max(activeCall.seconds, 28), // Minimum duration if quick test
      outcome: outcome,
      notes: notes || `Call completed with ${activeCall.contact.name}. Outcome: ${outcome}.`,
      timestamp: new Date().toISOString()
    };

    // Add to call logs
    callLogs.unshift(newLog);
    CRM_DATA.saveCallLogs(callLogs);

    // Update the contact
    const contactIndex = contacts.findIndex(c => c.id === activeCall.contact.id);
    if (contactIndex !== -1) {
      contacts[contactIndex].totalCalls = (contacts[contactIndex].totalCalls || 0) + 1;
      contacts[contactIndex].lastCallDate = newLog.timestamp;
      
      if (notes) {
        contacts[contactIndex].notes = notes;
      }
      
      if (stageUpdate !== 'Keep') {
        contacts[contactIndex].stage = stageUpdate;
      } else if (outcome.includes('Won')) {
        contacts[contactIndex].stage = 'Won';
      }

      CRM_DATA.saveContacts(contacts);
    }

    soundManager.success();
    closeCallDialer();
    showToast(`Call logged for ${activeCall.contact.name}!`, 'success');

    // Re-render
    renderAll();
  }

  // ============================================
  // ADD NEW CONTACT MODAL
  // ============================================

  function openAddContactModal() {
    formNewContact.reset();
    newContactAssigned.value = activeEmpId;
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
    const title = document.getElementById('new-contact-title-input').value.trim();
    const phone = document.getElementById('new-contact-phone').value.trim();
    const email = document.getElementById('new-contact-email').value.trim();
    const deal = parseFloat(document.getElementById('new-contact-deal').value) || 25000;
    const stage = document.getElementById('new-contact-stage').value;
    const priority = document.getElementById('new-contact-priority').value;
    const assignedTo = document.getElementById('new-contact-assigned').value;
    const notes = document.getElementById('new-contact-notes').value.trim();

    if (!name || !company || !phone) {
      alert('Please fill out the contact Name, Company, and Phone Number.');
      return;
    }

    const newContact = {
      id: `cnt-${Date.now()}`,
      name,
      company,
      title: title || 'Executive',
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone,
      dealValue: deal,
      stage,
      priority,
      assignedTo,
      createdAt: new Date().toISOString(),
      lastCallDate: null,
      totalCalls: 0,
      notes: notes || 'New lead added to CRM.',
      tags: ['Direct Inbound']
    };

    contacts.unshift(newContact);
    CRM_DATA.saveContacts(contacts);

    closeAddContactModal();
    showToast(`Added new contact ${name} (${company})`, 'success');
    renderAll();
  }

  // ============================================
  // CONTACT DETAIL & HISTORY DRAWER
  // ============================================

  function openContactDetailModal(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    selectedDetailContactId = contactId;
    detailContactName.textContent = contact.name;
    detailContactSub.textContent = `${contact.title || 'Representative'} at ${contact.company} • ${contact.phone}`;
    detailStageBadge.textContent = contact.stage;
    detailStageBadge.className = `badge badge-${contact.stage.toLowerCase()}`;
    detailPriorityBadge.textContent = `${contact.priority} Priority`;
    detailPriorityBadge.className = `badge priority-${contact.priority.toLowerCase()}`;
    detailDealValue.textContent = `$${(contact.dealValue || 0).toLocaleString()}`;
    detailNotesText.textContent = contact.notes || 'No recent notes recorded for this contact.';

    // Populate calls for this contact
    const contactCalls = callLogs.filter(c => c.contactId === contact.id);
    detailCallsList.innerHTML = '';

    if (contactCalls.length === 0) {
      detailCallsList.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted);">No recorded call history yet.</p>';
    } else {
      contactCalls.forEach(call => {
        const item = document.createElement('div');
        item.style.background = 'rgba(15, 23, 42, 0.7)';
        item.style.padding = '0.75rem';
        item.style.borderRadius = 'var(--radius-md)';
        item.style.border = '1px solid var(--border-subtle)';
        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; font-size: 0.78rem; margin-bottom: 0.25rem;">
            <strong style="color: #f1f5f9;">${escapeHtml(call.employeeName)}</strong>
            <span style="color: var(--text-muted);">${formatTimeAgo(call.timestamp)}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
            <span class="badge badge-interested" style="font-size: 0.7rem;">${escapeHtml(call.outcome)}</span>
            <span style="font-size: 0.75rem; color: #94a3b8;">${Math.round((call.durationSec || 0) / 60)} min call</span>
          </div>
          <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0;">${escapeHtml(call.notes)}</p>
        `;
        detailCallsList.appendChild(item);
      });
    }

    modalContactDetails.classList.add('open');
    modalContactDetails.setAttribute('aria-hidden', 'false');
  }

  function closeContactDetailModal() {
    modalContactDetails.classList.remove('open');
    modalContactDetails.setAttribute('aria-hidden', 'true');
    selectedDetailContactId = null;
  }

  // ============================================
  // LEAD REASSIGNMENT (MANAGER TOOL)
  // ============================================

  function openReassignModal(contactId) {
    const contact = contacts.find(c => c.id === contactId);
    if (!contact) return;

    leadToReassignId = contactId;
    reassignLeadName.textContent = `${contact.name} (${contact.company})`;
    reassignEmployeeSelect.value = contact.assignedTo;

    modalReassign.classList.add('open');
    modalReassign.setAttribute('aria-hidden', 'false');
  }

  function closeReassignModal() {
    modalReassign.classList.remove('open');
    modalReassign.setAttribute('aria-hidden', 'true');
    leadToReassignId = null;
  }

  function handleConfirmReassign() {
    if (!leadToReassignId) return;

    const newRepId = reassignEmployeeSelect.value;
    const newRep = employees.find(e => e.id === newRepId);
    const contact = contacts.find(c => c.id === leadToReassignId);

    if (contact && newRep) {
      contact.assignedTo = newRepId;
      CRM_DATA.saveContacts(contacts);
      showToast(`Reassigned ${contact.name} to ${newRep.name}`, 'success');
      closeReassignModal();
      renderAll();
    }
  }

  // ============================================
  // HELPERS: TOAST NOTIFICATIONS & FORMATTING
  // ============================================

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>${escapeHtml(message)}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  function formatTimeAgo(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start the engine
  initApp();
});
