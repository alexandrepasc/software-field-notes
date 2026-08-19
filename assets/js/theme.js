/* Theme toggle: switches the data-theme attribute, swaps the icon, and
   persists the choice in localStorage. Default (no stored value) is dark. */
(function () {
  'use strict';

  var root = document.documentElement;
  var toggle = document.getElementById('theme-toggle');
  if (!toggle) {
    return;
  }

  var icon = toggle.querySelector('.fa');

  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (icon) {
      // Show the icon of the theme the user will switch *to*:
      // sun when dark (click for light), moon when light (click for dark).
      icon.className = 'fa ' + (theme === 'dark' ? 'fa-sun-o' : 'fa-moon-o');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      /* Storage may be unavailable (e.g. private mode); theme still applies. */
    }
  }

  // Keep the icon in sync with the theme chosen before first paint.
  applyTheme(currentTheme());

  toggle.addEventListener('click', function () {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });
})();
