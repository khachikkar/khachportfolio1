const menuToggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#site-nav');
const mobileLayout = window.matchMedia('(max-width: 700px)');

function setMenu(open) {
  navigation.hidden = mobileLayout.matches && !open;
  menuToggle.setAttribute('aria-expanded', String(open));
}

function syncLayout() {
  menuToggle.hidden = !mobileLayout.matches;
  setMenu(false);
}

menuToggle.addEventListener('click', () => {
  setMenu(menuToggle.getAttribute('aria-expanded') === 'false');
});

navigation.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (link && mobileLayout.matches) {
    setMenu(false);
    const section = document.querySelector(link.hash);
    section.tabIndex = -1;
    section.focus({ preventScroll: true });
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuToggle.focus();
  }
});

const navigationLinks = [...navigation.querySelectorAll('a')];

function syncCurrentLink() {
  for (const link of navigationLinks) {
    if (link.hash === window.location.hash) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}

mobileLayout.addEventListener('change', syncLayout);
window.addEventListener('hashchange', syncCurrentLink);
syncLayout();
syncCurrentLink();
