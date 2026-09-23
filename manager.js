/**
 * ApexFlow CRM - Manager Executive Dashboard Controller
 * Provides executive supervisor oversight, leaderboard, live stream, funnel, and lead reassignment
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Session & Auth Guard
  const session = CRM_DATA.requireAuth('manager');
  if (!session || !session.user) return; // redirected by requireAuth

  const manager = session.user;

  // 2. Data State
  let employees = CRM_DATA.getEmployees();
  let contacts = CRM_DATA.getContacts();
  let callLogs = CRM_DATA.getCallLogs();

  // Reassignment Modal State
  let leadToReassignId = null;

  // DOM Elements
  const navMgrAvatar = document.getElementById('nav-mgr-avatar');
  const navMgrName = document.getElementById('nav-mgr-name');
  const navMgrRole = document.getElementById('nav-mgr-role');
  const btnMgrLogout = document.getElementById('btn-mgr-logout');
  const btnResetData = document.getElementById('btn-reset-data');

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

  const mgrFilterSearch = document.getElementById('mgr-filter-search');
  const mgrFilterRep = document.getElementById('mgr-filter-rep');
  const tbodyManagerLeads = document.getElementById('table-manager-leads').querySelector('tbody');

  // Reassign Modal Elements
  const modalReassign = document.getElementById('modal-reassign');
  const btnCloseReassign = document.getElementById('btn-close-reassign');
  const btnCancelReassign = document.getElementById('btn-cancel-reassign');
  const btnConfirmReassign = document.getElementById('btn-confirm-reassign');
  const reassignLeadName = document.getElementById('reassign-lead-name');
  const reassignEmployeeSelect = document.getElementById('reassign-employee-select');

  // Add Contact Modal Elements
  const btnMgrAddContact = document.getElementById('btn-mgr-add-contact');
  const modalAddContact = document.getElementById('modal-add-contact');
  const btnCloseAddModal = document.getElementById('btn-close-add-modal');
  const btnCancelAddModal = document.getElementById('btn-cancel-add-modal');
  const formNewContact = document.getElementById('form-new-contact');
  const btnSubmitNewContact = document.getElementById('btn-submit-new-contact');
  const newContactAssigned = document.getElementById('new-contact-assigned');

  // Toast Container
  const toastContainer = document.getElementById('toast-container');

  // ============================================
  // INITIALIZATION
  // ============================================
  function initManagerDashboard() {
    renderManagerHeader();
    populateRepDropdowns();
    bindEvents();
    renderAllViews();
  }

  function renderManagerHeader() {
    navMgrAvatar.src = manager.avatar || 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80';
    navMgrName.textContent = manager.name;
    navMgrRole.textContent = manager.role;
  }

  function populateRepDropdowns() {
    mgrFilterRep.innerHTML = '<option value="ALL">All Representatives</option>';
    newContactAssigned.innerHTML = '';
    reassignEmployeeSelect.innerHTML = '';

    employees.forEach(emp => {
      // Filter dropdown
      const opt1 = document.createElement('option');
      opt1.value = emp.id;
      opt1.textContent = `${emp.name} (${emp.role.split(' ')[0]})`;
      mgrFilterRep.appendChild(opt1);

      // Add Contact Assigned
      const opt2 = document.createElement('option');
      opt2.value = emp.id;
      opt2.textContent = `${emp.name} - ${emp.role}`;
      newContactAssigned.appendChild(opt2);

      // Reassign Select
      const opt3 = document.createElement('option');
      opt3.value = emp.id;
      opt3.textContent = `${emp.name} - ${emp.role}`;
      reassignEmployeeSelect.appendChild(opt3);
    });
  }

  function bindEvents() {
    // Logout
    btnMgrLogout.addEventListener('click', () => {
      showToast('Signing out of Supervisor Portal...', 'info');
      setTimeout(() => {
        CRM_DATA.logout('login-manager.html');
      }, 300);
    });

    // Reset Demo
    btnResetData.addEventListener('click', () => {
      if (confirm('Reset CRM database to fresh sample records? All demo data will be restored.')) {
        CRM_DATA.resetAllData();
        employees = CRM_DATA.getEmployees();
        contacts = CRM_DATA.getContacts();
        callLogs = CRM_DATA.getCallLogs();
        populateRepDropdowns();
        renderAllViews();
        showToast('Demo database restored successfully!', 'success');
      }
    });

    // Filters for master leads table
    mgrFilterSearch.addEventListener('input', renderMasterLeadsTable);
    mgrFilterRep.addEventListener('change', renderMasterLeadsTable);

    // Reassign Modal
    btnCloseReassign.addEventListener('click', closeReassignModal);
    btnCancelReassign.addEventListener('click', closeReassignModal);
    btnConfirmReassign.addEventListener('click', handleConfirmReassign);

    // Add Lead Modal
    btnMgrAddContact.addEventListener('click', openAddContactModal);
    btnCloseAddModal.addEventListener('click', closeAddContactModal);
    btnCancelAddModal.addEventListener('click', closeAddContactModal);
    btnSubmitNewContact.addEventListener('click', handleCreateNewContact);
  }

  // ============================================
  // RENDERING ALL DASHBOARD MODULES
  // ============================================
  function renderAllViews() {
    contacts = CRM_DATA.getContacts();
    callLogs = CRM_DATA.getCallLogs();
    employees = CRM_DATA.getEmployees();

    renderExecutiveKPIs();
    renderLeaderboard();
    renderLiveActivityFeed();
    renderAnalyticsCharts();
    renderMasterLeadsTable();
  }

  function renderExecutiveKPIs() {
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
  }

  function renderLeaderboard() {
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

      const isCurrentActive = emp.status === 'in-call';
      const statusClass = isCurrentActive ? 'status-in-call' : 'status-online';
      const statusLabel = isCurrentActive ? 'Active In-Call' : 'Available / Online';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="employee-leaderboard-cell">
            <img src="${emp.avatar}" alt="${escapeHtml(emp.name)}" class="emp-avatar-img">
            <div>
              <div class="emp-name-text">${escapeHtml(emp.name)}</div>
              <div class="emp-role-sub">${escapeHtml(emp.role)}</div>
            </div>
          </div>
        </td>
        <td>
          <span class="status-pill ${statusClass}">
            <span class="pulse-indicator"></span>
            ${statusLabel}
          </span>
        </td>
        <td>
          <div style="font-weight: 700; color: #fff;">${empCalls.length} / ${target} calls</div>
          <div class="progress-bar-container" style="margin-top: 0.35rem; width: 130px;">
            <div class="progress-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </td>
        <td>
          <span style="font-family: var(--font-mono); color: #38bdf8; font-weight: 600;">${empTalkMin} mins</span>
        </td>
        <td>
          <span class="badge badge-interested">${empAssignedLeads.length} leads</span>
        </td>
        <td>
          <span class="deal-value" style="color: #10b981;">$${empWonRev.toLocaleString()}</span>
        </td>
        <td style="text-align: right;">
          <button class="btn-secondary btn-inspect-rep" data-emp-id="${emp.id}" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;" title="Filter leads for ${escapeHtml(emp.name)}">
            Inspect Leads
          </button>
        </td>
      `;

      tr.querySelector('.btn-inspect-rep').addEventListener('click', () => {
        mgrFilterRep.value = emp.id;
        renderMasterLeadsTable();
        // Scroll to leads table
        document.getElementById('table-manager-leads').scrollIntoView({ behavior: 'smooth' });
        showToast(`Filtered customer accounts for ${emp.name}`, 'info');
      });

      tbodyManagerEmployees.appendChild(tr);
    });
  }

  function renderLiveActivityFeed() {
    streamActivityFeed.innerHTML = '';

    const recentLogs = [...callLogs].slice(0, 10);
    if (recentLogs.length === 0) {
      streamActivityFeed.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No calls logged today yet.
        </div>
      `;
      return;
    }

    recentLogs.forEach(log => {
      const node = document.createElement('div');
      node.className = 'activity-item';

      let outcomeBadgeClass = 'badge-neutral';
      if (log.rating === 'won' || log.outcome.includes('Won')) outcomeBadgeClass = 'badge-won';
      else if (log.rating === 'positive') outcomeBadgeClass = 'badge-interested';
      else if (log.outcome.includes('Voicemail')) outcomeBadgeClass = 'badge-contacted';

      const durationMin = Math.round((log.durationSec || 0) / 60);

      node.innerHTML = `
        <div class="activity-bullet"></div>
        <div class="activity-content">
          <div class="activity-title-row">
            <span class="activity-rep-name">${escapeHtml(log.employeeName || 'Rep')}</span>
            <span class="activity-time-tag">${formatTimeAgo(log.timestamp)}</span>
          </div>
          <div class="activity-customer-row">
            Called <strong>${escapeHtml(log.contactName || 'Lead')}</strong> (${escapeHtml(log.company || '')})
          </div>
          <div style="display: flex; align-items: center; gap: 0.65rem; margin-top: 0.35rem; flex-wrap: wrap;">
            <span class="badge ${outcomeBadgeClass}">${escapeHtml(log.outcome)}</span>
            <span style="font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">
              Duration: ${durationMin}m (${log.durationSec || 0}s)
            </span>
          </div>
          ${log.notes ? `<div class="activity-quote">"${escapeHtml(log.notes)}"</div>` : ''}
        </div>
      `;

      streamActivityFeed.appendChild(node);
    });
  }

  function renderAnalyticsCharts() {
    // 1. Funnel
    funnelContainer.innerHTML = '';
    const stages = [
      { name: 'New Lead', key: 'New', color: '#6366f1' },
      { name: 'Contacted', key: 'Contacted', color: '#06b6d4' },
      { name: 'Interested', key: 'Interested', color: '#3b82f6' },
      { name: 'Proposal Sent', key: 'Proposal', color: '#f59e0b' },
      { name: 'Closed Won', key: 'Won', color: '#10b981' }
    ];

    const totalLeads = contacts.length || 1;

    stages.forEach(st => {
      const match = contacts.filter(c => c.stage === st.key);
      const count = match.length;
      const pct = Math.round((count / totalLeads) * 100);
      const stageValue = match.reduce((acc, c) => acc + (c.dealValue || 0), 0);

      const row = document.createElement('div');
      row.className = 'funnel-stage-row';
      row.innerHTML = `
        <div class="funnel-info">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${st.color};"></span>
            <span class="funnel-stage-name">${st.name}</span>
          </div>
          <div class="funnel-stage-count">${count} leads • $${stageValue.toLocaleString()} (${pct}%)</div>
        </div>
        <div class="funnel-bar-track">
          <div class="funnel-bar-fill" style="width: ${Math.max(8, pct)}%; background: ${st.color};"></div>
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

    const totalCallCount = callLogs.length || 1;
    const sortedOutcomes = Object.entries(outcomeCounts).sort((a, b) => b[1] - a[1]);

    if (sortedOutcomes.length === 0) {
      outcomesContainer.innerHTML = `<div style="color: var(--text-muted); font-size: 0.85rem;">No call metrics recorded yet.</div>`;
      return;
    }

    sortedOutcomes.forEach(([outcomeName, cnt]) => {
      const pct = Math.round((cnt / totalCallCount) * 100);
      const row = document.createElement('div');
      row.className = 'funnel-stage-row';
      row.innerHTML = `
        <div class="funnel-info">
          <span class="funnel-stage-name">${escapeHtml(outcomeName)}</span>
          <span class="funnel-stage-count">${cnt} calls (${pct}%)</span>
        </div>
        <div class="funnel-bar-track">
          <div class="funnel-bar-fill" style="width: ${Math.max(6, pct)}%; background: linear-gradient(90deg, #6366f1, #a855f7);"></div>
        </div>
      `;
      outcomesContainer.appendChild(row);
    });
  }

  function renderMasterLeadsTable() {
    let list = [...contacts];

    // Search query
    const query = mgrFilterSearch.value.trim().toLowerCase();
    if (query) {
      list = list.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.company.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query))
      );
    }

    // Rep filter
    const repFilterVal = mgrFilterRep.value;
    if (repFilterVal !== 'ALL') {
      list = list.filter(c => c.assignedTo === repFilterVal);
    }

    tbodyManagerLeads.innerHTML = '';

    if (list.length === 0) {
      const emptyRow = document.createElement('tr');
      emptyRow.innerHTML = `
        <td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No customer accounts found matching current search/filter.
        </td>
      `;
      tbodyManagerLeads.appendChild(emptyRow);
      return;
    }

    list.forEach(c => {
      const rep = employees.find(e => e.id === c.assignedTo) || { name: 'Unassigned' };
      const tr = document.createElement('tr');
      const initials = c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

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
        </td>
        <td>
          <span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #a5b4fc; border: 1px solid rgba(99, 102, 241, 0.3);">
            ${escapeHtml(rep.name)}
          </span>
        </td>
        <td>
          <span class="deal-value">$${(c.dealValue || 0).toLocaleString()}</span>
        </td>
        <td>
          <span class="badge badge-${c.stage.toLowerCase()}">${c.stage}</span>
        </td>
        <td>
          <span class="priority-${c.priority.toLowerCase()}">${c.priority}</span>
        </td>
        <td>
          <span style="font-weight: 600; color: #fff;">${c.totalCalls || 0} calls</span>
        </td>
        <td style="text-align: right;">
          <button class="btn-secondary btn-trigger-reassign" data-lead-id="${c.id}" style="font-size: 0.75rem; padding: 0.35rem 0.75rem;" title="Transfer this lead to another rep">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right: 0.25rem;">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
            Reassign
          </button>
        </td>
      `;

      tr.querySelector('.btn-trigger-reassign').addEventListener('click', () => {
        openReassignModal(c.id);
      });

      tbodyManagerLeads.appendChild(tr);
    });
  }

  // ============================================
  // LEAD REASSIGNMENT (EXECUTIVE CONTROL)
  // ============================================
  function openReassignModal(leadId) {
    leadToReassignId = leadId;
    const contact = contacts.find(c => c.id === leadId);
    if (!contact) return;

    reassignLeadName.textContent = `${contact.name} (${contact.company})`;
    reassignEmployeeSelect.value = contact.assignedTo;

    modalReassign.classList.add('open');
    modalReassign.setAttribute('aria-hidden', 'false');
  }

  function closeReassignModal() {
    leadToReassignId = null;
    modalReassign.classList.remove('open');
    modalReassign.setAttribute('aria-hidden', 'true');
  }

  function handleConfirmReassign() {
    if (!leadToReassignId) return;

    const newEmpId = reassignEmployeeSelect.value;
    const newEmp = employees.find(e => e.id === newEmpId);
    const targetContact = contacts.find(c => c.id === leadToReassignId);

    if (CRM_DATA.reassignContact(leadToReassignId, newEmpId)) {
      closeReassignModal();
      renderAllViews();
      showToast(`Transferred "${targetContact.name}" to ${newEmp ? newEmp.name : 'new rep'}.`, 'success');
    }
  }

  // ============================================
  // ADD NEW CUSTOMER LEAD (MANAGER PORTAL)
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
    const assignedTo = newContactAssigned.value;
    const notes = document.getElementById('new-contact-notes').value.trim() || 'Added by Sales Operations Manager.';

    if (!name || !company || !phone) {
      alert('Please fill in Customer Name, Company, and Phone Number.');
      return;
    }

    const newContact = {
      name,
      company,
      title,
      dealValue: deal,
      phone,
      email,
      stage,
      priority,
      assignedTo,
      notes,
      tags: ['Executive Addition']
    };

    CRM_DATA.addContact(newContact);
    closeAddContactModal();
    renderAllViews();

    const assignedEmp = employees.find(e => e.id === assignedTo);
    showToast(`Created lead "${name}" and assigned to ${assignedEmp ? assignedEmp.name : 'rep'}!`, 'success');
  }

  // ============================================
  // TOAST HELPERS
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
  initManagerDashboard();
});
