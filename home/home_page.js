document.addEventListener('DOMContentLoaded', function () {
  const hamburger = document.getElementById('hamburger-btn');
  const mobileNav = document.getElementById('mobile-nav');
  const closeMobileNav = document.getElementById('close-mobile-nav');

  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open', isOpen);
    });
  }
  if (closeMobileNav && mobileNav && hamburger) {
    closeMobileNav.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
    });
  }
  // Optional: close on outside click
  window.addEventListener('click', (e) => {
    if (
      mobileNav &&
      hamburger &&
      mobileNav.classList.contains('open') &&
      !mobileNav.contains(e.target) &&
      e.target !== hamburger &&
      !hamburger.contains(e.target)
    ) {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
    }
  });
});