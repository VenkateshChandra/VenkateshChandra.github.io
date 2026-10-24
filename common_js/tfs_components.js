/**
 * ===================================================================
 * TRENDS FOR SALE (TFS) - GLOBAL COMPONENTS & NAVBAR CONTROLLER
 * ===================================================================
 * Provides single-source-of-truth injection for:
 *   1. Global Header & Navigation Bar (with Tools dropdown & theme switcher)
 *   2. Mobile Drawer & Backdrop Navigation
 *   3. Global Site Footer
 * 
 * Usage in any HTML page:
 *   <div id="tfs-navbar" data-active="tools"></div>
 *   ... page content ...
 *   <div id="tfs-footer"></div>
 * 
 *   <script src="../common_js/tfs_components.js"></script>
 */

(function () {
  'use strict';

  // Determine root path (e.g., '../' for subfolders, './' for root)
  function getProjectRoot() {
    const mount = document.getElementById('tfs-navbar') || document.querySelector('tfs-navbar');
    if (mount && mount.hasAttribute('data-root')) {
      return mount.getAttribute('data-root');
    }
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].getAttribute('src') || '';
      if (src.includes('tfs_components.js') || src.includes('navbar.js')) {
        const idx = src.indexOf('common_js');
        if (idx !== -1) {
          return src.substring(0, idx) || './';
        }
      }
    }
    return '../';
  }

  // Determine which nav link should have the 'active' highlight class
  function getActiveNav() {
    const mount = document.getElementById('tfs-navbar') || document.querySelector('tfs-navbar');
    if (mount && mount.hasAttribute('data-active')) {
      return mount.getAttribute('data-active').toLowerCase();
    }
    const path = (window.location.pathname || '').toLowerCase();
    if (path.includes('/about/')) return 'about';
    if (path.includes('/contact/')) return 'contact';
    if (path.includes('/blog/')) return 'blog';
    if (path.includes('/tools/') || path.includes('/convertors/') || path.includes('/pdf_tools/') || 
        path.includes('/image_tools/') || path.includes('/serial_term/') || path.includes('/can_analysis/')) {
      return 'tools';
    }
    if (path.includes('/home/') || path.endsWith('/') || path.endsWith('/index.html')) {
      return 'home';
    }
    return '';
  }

  // Render the Master Navigation Bar & Mobile Drawer
  function renderNavbar() {
    const mount = document.getElementById('tfs-navbar') || document.querySelector('tfs-navbar');
    if (!mount) return;

    const root = getProjectRoot();
    const active = getActiveNav();

    const isHome = active === 'home' ? ' active' : '';
    const isAbout = active === 'about' ? ' active' : '';
    const isContact = active === 'contact' ? ' active' : '';
    const isBlog = active === 'blog' ? ' active' : '';
    const isTools = active === 'tools' ? ' active' : '';

    const navbarHtml = `
    <header class="site-header">
      <div class="header-container">
        <!-- Site Logo & Brand -->
        <a href="${root}home/home_page.html" class="site-branding" title="Trends For Sale - Beyond The Trends">
          <div class="brand-logo-wrap">
            <svg viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="brand-text-wrap">
            <span class="site-title">
              <span class="brand-full">Trends For Sale</span>
              <span class="brand-abbr">TFS</span>
            </span>
            <span class="site-tagline">Beyond The Trends, Into Your Hands</span>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="main-navigation">
          <ul class="nav-links">
            <li class="nav-item">
              <a href="${root}home/home_page.html" class="nav-link${isHome}">Home</a>
            </li>
            <li class="nav-item">
              <a href="${root}about/about_page.html" class="nav-link${isAbout}">About</a>
            </li>
            <li class="nav-item">
              <a href="${root}contact/contact_home_page.html" class="nav-link${isContact}">Contact</a>
            </li>
            <li class="nav-item">
              <a href="${root}blog/blog_home_page.html" class="nav-link${isBlog}">Blog</a>
            </li>
            <li class="nav-item">
              <a href="${root}common_pages/coming_soon.html" class="nav-link">Shop</a>
            </li>
            <!-- Tools Dropdown (Positioned at rightmost side) -->
            <li class="nav-item">
              <a href="${root}tools/tools_home.html" class="nav-link${isTools}">
                Tools
                <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </a>
              <div class="dropdown-menu">
                <div class="dropdown-grid">
                  <!-- Hardware & Analyzers Column -->
                  <div class="dropdown-col">
                    <span class="dropdown-col-title">Hardware & Analyzers</span>
                    <a href="${root}serial_term/serial_term.html" class="dropdown-card">
                      <div class="dropdown-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                          <line x1="8" y1="21" x2="16" y2="21"/>
                          <line x1="12" y1="17" x2="12" y2="21"/>
                        </svg>
                      </div>
                      <div class="dropdown-card-info">
                        <h4>Serial Terminal <span class="badge badge-live">Live</span></h4>
                        <p>Web Serial USB & COM monitor</p>
                      </div>
                    </a>
                    <a href="${root}can_analysis/can_analyzer.html" class="dropdown-card">
                      <div class="dropdown-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                      </div>
                      <div class="dropdown-card-info">
                        <h4>CAN Bus Analyzer <span class="badge badge-live">Live</span></h4>
                        <p>Vector vxlapi & SLCAN diagnostic tool</p>
                      </div>
                    </a>
                    <a href="${root}common_pages/coming_soon.html" class="dropdown-card">
                      <div class="dropdown-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <circle cx="12" cy="12" r="9"/>
                          <path d="M12 7v5l3 3"/>
                        </svg>
                      </div>
                      <div class="dropdown-card-info">
                        <h4>I2C & SPI Tools</h4>
                        <p>Bus packet capture & analyzer</p>
                      </div>
                    </a>
                  </div>

                  <!-- Calculators & Utilities Column -->
                  <div class="dropdown-col">
                    <span class="dropdown-col-title">Calculators & Utilities</span>
                    <a href="${root}convertors/convertors_home_page.html" class="dropdown-card">
                      <div class="dropdown-card-info">
                        <h4>Unit & Data Converters <span class="badge badge-live">Live</span></h4>
                        <p>Fuel, IEEE-754, Radix, Pressure</p>
                      </div>
                    </a>
                    <a href="${root}pdf_tools/pdf_studio.html" class="dropdown-card">
                      <div class="dropdown-card-info">
                        <h4>PDF Document Studio <span class="badge badge-live">Live</span></h4>
                        <p>Merge, split, rotate & watermark</p>
                      </div>
                    </a>
                    <a href="${root}image_tools/image_studio.html" class="dropdown-card">
                      <div class="dropdown-card-info">
                        <h4>Image & Asset Studio <span class="badge badge-live">Live</span></h4>
                        <p>WebP transcoder & OLED/TFT C-arrays</p>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </nav>

        <!-- Header Actions: Theme Toggle, Login & Hamburger -->
        <div class="header-actions">
          <button id="theme-toggle-btn" class="theme-toggle-btn" title="Toggle Theme" aria-label="Toggle theme">
            <span id="theme-icon-slot">
              <svg viewBox="0 0 24 24">
                <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
              </svg>
            </span>
          </button>

          <div id="navbar-auth-slot">
            <a href="${root}login/login.html" class="btn btn-secondary btn-sm">Login</a>
          </div>

          <button id="hamburger-btn" class="hamburger-btn" aria-label="Toggle Navigation">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>

    <!-- Mobile Navigation Backdrop & Drawer -->
    <div id="mobile-backdrop" class="mobile-nav-backdrop"></div>
    <div id="mobile-drawer" class="mobile-nav-drawer">
      <div class="mobile-drawer-header">
        <span class="site-title">Trends For Sale</span>
      </div>
      <ul class="mobile-links">
        <li><a href="${root}home/home_page.html" class="mobile-link${isHome}">Home</a></li>
        <li><a href="${root}about/about_page.html" class="mobile-link${isAbout}">About</a></li>
        <li><a href="${root}contact/contact_home_page.html" class="mobile-link${isContact}">Contact</a></li>
        <li><a href="${root}blog/blog_home_page.html" class="mobile-link${isBlog}">Blog</a></li>
        <li><a href="${root}common_pages/coming_soon.html" class="mobile-link">Shop</a></li>
        <li style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
          <strong style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase;">Engineering Tools</strong>
        </li>
        <li><a href="${root}tools/tools_home.html" class="mobile-link${isTools}">🛠️ All Tools Hub</a></li>
        <li><a href="${root}serial_term/serial_term.html" class="mobile-link">🚀 Serial Terminal</a></li>
        <li><a href="${root}can_analysis/can_analyzer.html" class="mobile-link">⚡ CAN Bus Analyzer</a></li>
        <li><a href="${root}convertors/convertors_home_page.html" class="mobile-link">🔄 Unit & Radix Converters</a></li>
        <li><a href="${root}pdf_tools/pdf_studio.html" class="mobile-link">📄 PDF Document Studio</a></li>
        <li><a href="${root}image_tools/image_studio.html" class="mobile-link">🖼️ Image & Asset Studio</a></li>
        <li style="margin-top: 12px;">
          <a href="${root}login/login.html" class="mobile-link">🔐 Login / Account</a>
        </li>
      </ul>
    </div>
    `;

    mount.innerHTML = navbarHtml;
  }

  // Render the Master Site Footer
  function renderFooter() {
    const mount = document.getElementById('tfs-footer') || document.querySelector('tfs-footer');
    if (!mount) return;

    const root = getProjectRoot();

    const footerHtml = `
    <footer class="site-footer">
      <div class="footer-container">
        <div class="footer-top">
          <div class="footer-brand">
            <span class="site-title">Trends For Sale</span>
            <p class="footer-tagline">Beyond The Trends, Into Your Hands &mdash; High-performance embedded utilities & engineering tools.</p>
          </div>
          <div class="footer-col">
            <h4>Hardware Tools</h4>
            <ul>
              <li><a href="${root}serial_term/serial_term.html">Serial Terminal</a></li>
              <li><a href="${root}can_analysis/can_analyzer.html">CAN Bus Analyzer</a></li>
              <li><a href="${root}common_pages/coming_soon.html">I2C & SPI Tools</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Utilities & Suites</h4>
            <ul>
              <li><a href="${root}convertors/convertors_home_page.html">Unit & Data Converters</a></li>
              <li><a href="${root}pdf_tools/pdf_studio.html">PDF Document Studio</a></li>
              <li><a href="${root}image_tools/image_studio.html">Image & Asset Studio</a></li>
              <li><a href="${root}blog/blog_home_page.html">Engineering Blog</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Account & Support</h4>
            <ul>
              <li><a href="${root}login/login.html">Member Login</a></li>
              <li><a href="${root}registration/register.html">Create Account</a></li>
              <li><a href="${root}contact/contact_home_page.html">Support & Feedback</a></li>
              <li><a href="${root}about/about_page.html">About TFS & Team</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; ${new Date().getFullYear()} Trends For Sale (TFS). All rights reserved.</p>
          <div class="footer-badges">
            <span class="badge">Web Serial API</span>
            <span class="badge">100% In-Browser Privacy</span>
            <span class="badge">Hardware Tested</span>
          </div>
        </div>
      </div>
    </footer>
    `;

    mount.innerHTML = footerHtml;
  }

  // Theme Controller
  function initTheme() {
    const savedTheme = localStorage.getItem('tfs_theme') || 'dark';
    applyTheme(savedTheme);

    const toggleBtn = document.getElementById('theme-toggle-btn');
    if (toggleBtn) {
      // Clone to remove any pre-existing listeners
      const freshBtn = toggleBtn.cloneNode(true);
      toggleBtn.parentNode.replaceChild(freshBtn, toggleBtn);

      freshBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tfs_theme', theme);

    if (theme === 'dark') {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }

    const iconWrap = document.getElementById('theme-icon-slot');
    if (iconWrap) {
      if (theme === 'dark') {
        iconWrap.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>`;
      } else {
        iconWrap.innerHTML = `<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37a.996.996 0 0 0-1.41 0 .996.996 0 0 0 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36a.996.996 0 0 0 0-1.41.996.996 0 0 0-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"/></svg>`;
      }
    }
  }

  // Mobile Navigation Drawer Controller
  function initMobileNav() {
    const hamburger = document.getElementById('hamburger-btn');
    const drawer = document.getElementById('mobile-drawer');
    const backdrop = document.getElementById('mobile-backdrop');

    if (!hamburger || !drawer) return;

    function toggleMenu(open) {
      hamburger.classList.toggle('open', open);
      drawer.classList.toggle('open', open);
      if (backdrop) backdrop.classList.toggle('open', open);
      document.body.style.overflow = open ? 'hidden' : '';
    }

    hamburger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = drawer.classList.contains('open');
      toggleMenu(!isOpen);
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => toggleMenu(false));
    }

    // Close when clicking on any mobile link
    const mobileLinks = drawer.querySelectorAll('.mobile-link');
    mobileLinks.forEach((link) => {
      link.addEventListener('click', () => toggleMenu(false));
    });
  }

  // Bootstrapping
  function init() {
    renderNavbar();
    renderFooter();
    initTheme();
    initMobileNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose global API for dynamic programmatic re-render
  window.TFS = window.TFS || {};
  window.TFS.renderNavbar = renderNavbar;
  window.TFS.renderFooter = renderFooter;
  window.TFS.applyTheme = applyTheme;
})();
