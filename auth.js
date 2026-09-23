/**
 * ApexFlow CRM - Authentication Controller
 * Handles Employee & Manager Portals login, demo profile injection, and validation
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if current page is employee or manager login
  const isEmployeeLogin = !!document.getElementById('form-employee-login');
  const isManagerLogin = !!document.getElementById('form-manager-login');

  // If already authenticated in current role, offer direct redirect or auto-route
  const session = CRM_DATA.getCurrentSession();
  if (session && session.user) {
    const banner = document.getElementById('active-session-banner');
    if (banner) {
      banner.style.display = 'flex';
      const nameEl = document.getElementById('active-session-user-name');
      const linkEl = document.getElementById('active-session-continue-link');
      if (nameEl) nameEl.textContent = `${session.user.name} (${session.role.toUpperCase()})`;
      if (linkEl) {
        linkEl.href = session.role === 'employee' ? 'employee.html' : 'manager.html';
        linkEl.textContent = `Continue to ${session.role === 'employee' ? 'Employee Workspace' : 'Manager Dashboard'} →`;
      }
    }
  }

  // ============================================
  // EMPLOYEE LOGIN LOGIC
  // ============================================
  if (isEmployeeLogin) {
    const form = document.getElementById('form-employee-login');
    const inputId = document.getElementById('emp-email-input');
    const inputPass = document.getElementById('emp-password-input');
    const errorBox = document.getElementById('login-error-message');
    const demoRepChips = document.querySelectorAll('.demo-rep-chip');

    // Populate or auto-select from demo rep chips
    demoRepChips.forEach(chip => {
      chip.addEventListener('click', () => {
        demoRepChips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');

        const empEmail = chip.getAttribute('data-email');
        const empPass = chip.getAttribute('data-pass');
        const autoSubmit = chip.getAttribute('data-autosubmit') === 'true';

        inputId.value = empEmail;
        inputPass.value = empPass;

        if (autoSubmit) {
          executeEmployeeLogin(empEmail, empPass);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      executeEmployeeLogin(inputId.value, inputPass.value);
    });

    function executeEmployeeLogin(identifier, password) {
      if (errorBox) errorBox.style.display = 'none';

      const result = CRM_DATA.loginEmployee(identifier, password);
      if (result.success) {
        // Show success animation on button
        const btn = document.getElementById('btn-submit-employee-login');
        if (btn) {
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
              <path d="M12 2a10 10 0 0 1 10 10"></path>
            </svg>
            Signing In...
          `;
          btn.disabled = true;
        }

        setTimeout(() => {
          window.location.href = 'employee.html';
        }, 350);
      } else {
        if (errorBox) {
          errorBox.textContent = result.message;
          errorBox.style.display = 'block';
          errorBox.classList.add('shake');
          setTimeout(() => errorBox.classList.remove('shake'), 400);
        } else {
          alert(result.message);
        }
      }
    }
  }

  // ============================================
  // MANAGER LOGIN LOGIC
  // ============================================
  if (isManagerLogin) {
    const form = document.getElementById('form-manager-login');
    const inputEmail = document.getElementById('mgr-email-input');
    const inputPass = document.getElementById('mgr-password-input');
    const errorBox = document.getElementById('login-error-message');
    const btnQuickMgr = document.getElementById('btn-quick-manager-fill');

    if (btnQuickMgr) {
      btnQuickMgr.addEventListener('click', () => {
        inputEmail.value = 'manager@apexflow.crm';
        inputPass.value = 'manager123';
        executeManagerLogin('manager@apexflow.crm', 'manager123');
      });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      executeManagerLogin(inputEmail.value, inputPass.value);
    });

    function executeManagerLogin(email, password) {
      if (errorBox) errorBox.style.display = 'none';

      const result = CRM_DATA.loginManager(email, password);
      if (result.success) {
        const btn = document.getElementById('btn-submit-manager-login');
        if (btn) {
          btn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="spin">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
              <path d="M12 2a10 10 0 0 1 10 10"></path>
            </svg>
            Authenticating Director Session...
          `;
          btn.disabled = true;
        }

        setTimeout(() => {
          window.location.href = 'manager.html';
        }, 350);
      } else {
        if (errorBox) {
          errorBox.textContent = result.message;
          errorBox.style.display = 'block';
          errorBox.classList.add('shake');
          setTimeout(() => errorBox.classList.remove('shake'), 400);
        } else {
          alert(result.message);
        }
      }
    }
  }

  // Password toggle helper
  const passToggles = document.querySelectorAll('.password-toggle-btn');
  passToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetInputId = toggle.getAttribute('data-target');
      const input = document.getElementById(targetInputId);
      if (!input) return;

      if (input.type === 'password') {
        input.type = 'text';
        toggle.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
          </svg>
        `;
      } else {
        input.type = 'password';
        toggle.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        `;
      }
    });
  });
});
