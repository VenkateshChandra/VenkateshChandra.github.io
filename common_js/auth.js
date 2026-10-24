/* ===================================================================
   TRENDS FOR SALE (TFS) - CLIENT AUTHENTICATION & CSRF CONTROLLER
   =================================================================== */

let activeCsrfToken = '';

async function fetchCsrfAndSession() {
  try {
    const res = await fetch('../common_php/auth_check.php', { credentials: 'same-origin' });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.csrf_token) {
      activeCsrfToken = data.csrf_token;
      // Inject into any existing form with name="csrf_token"
      document.querySelectorAll('input[name="csrf_token"]').forEach(input => {
        input.value = activeCsrfToken;
      });
    }

    updateNavbarAuthUI(data);
    return data;
  } catch (e) {
    console.debug('Session check bypassed or offline mode active.');
    return null;
  }
}

function updateNavbarAuthUI(sessionData) {
  const authContainer = document.getElementById('navbar-auth-slot');
  if (!authContainer) return;

  if (sessionData && sessionData.authenticated && sessionData.user) {
    authContainer.innerHTML = `
      <div class="user-pill">
        <span class="user-avatar-dot"></span>
        <span class="user-name">${sessionData.user}</span>
        <button id="logout-btn" class="btn btn-secondary btn-sm" title="Log out">Logout</button>
      </div>
    `;

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        try {
          await fetch('../common_php/logout.php', { credentials: 'same-origin' });
          window.location.reload();
        } catch (err) {
          window.location.reload();
        }
      });
    }
  } else {
    authContainer.innerHTML = `
      <a href="../login/login.html" class="btn btn-secondary btn-sm">Login</a>
    `;
  }
}

// Display Form Feedback Alert inside container
function showFormAlert(formElem, message, type = 'error') {
  let alertBox = formElem.querySelector('.auth-alert');
  if (!alertBox) {
    alertBox = document.createElement('div');
    alertBox.className = 'auth-alert';
    formElem.prepend(alertBox);
  }
  alertBox.className = `auth-alert ${type}`;
  alertBox.textContent = message;
  alertBox.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  fetchCsrfAndSession();

  // Attach Login Handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = loginForm.querySelector('[name="username"]').value.trim();
      const password = loginForm.querySelector('[name="password"]').value;
      const submitBtn = loginForm.querySelector('[type="submit"]');

      if (!username || !password) {
        showFormAlert(loginForm, 'Please fill in both username and password.');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;

      try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);
        formData.append('csrf_token', activeCsrfToken);

        const res = await fetch('login.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        const data = await res.json();

        if (data.success) {
          showFormAlert(loginForm, 'Login successful! Redirecting...', 'success');
          // Secure redirect: NEVER pass credentials or usernames in URL query strings
          setTimeout(() => {
            window.location.href = '../home/home_page.html';
          }, 800);
        } else {
          showFormAlert(loginForm, data.message || 'Invalid credentials.');
          if (submitBtn) submitBtn.disabled = false;
        }
      } catch (err) {
        showFormAlert(loginForm, 'Connection error. Please try again.');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  // Attach Registration Handler
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const firstName = registerForm.querySelector('[name="firstName"]')?.value.trim() || '';
      const lastName = registerForm.querySelector('[name="lastName"]')?.value.trim() || '';
      const mobileNumber = registerForm.querySelector('[name="mobileNumber"]')?.value.trim() || '';
      const dateOfBirth = registerForm.querySelector('[name="dateOfBirth"]')?.value.trim() || '';
      const username = registerForm.querySelector('[name="username"]').value.trim();
      const password = registerForm.querySelector('[name="password"]').value;
      const submitBtn = registerForm.querySelector('[type="submit"]');

      if (password.length < 8) {
        showFormAlert(registerForm, 'Password must be at least 8 characters long.');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;

      try {
        const formData = new URLSearchParams();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('mobileNumber', mobileNumber);
        formData.append('dateOfBirth', dateOfBirth);
        formData.append('username', username);
        formData.append('password', password);
        formData.append('csrf_token', activeCsrfToken);

        const res = await fetch('register.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: formData.toString()
        });

        const data = await res.json();

        if (data.success) {
          showFormAlert(registerForm, data.message + ' Redirecting to login...', 'success');
          setTimeout(() => {
            window.location.href = '../login/login.html';
          }, 1500);
        } else {
          showFormAlert(registerForm, data.message || 'Registration failed.');
          if (submitBtn) submitBtn.disabled = false;
        }
      } catch (err) {
        showFormAlert(registerForm, 'Connection error. Please try again.');
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }
});
