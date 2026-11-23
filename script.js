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

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

if (!reducedMotion.matches && 'IntersectionObserver' in window) {
  document.documentElement.classList.add('has-motion');

  const revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, {
    threshold: 0.01,
    rootMargin: '0px 0px 16% 0px'
  });

  const coverPanels = [...document.querySelectorAll('.section')];
  let coverFrame = 0;

  function updateCoverPanels() {
    const viewportHeight = window.innerHeight;
    const travel = Math.min(96, viewportHeight * 0.11);

    for (const panel of coverPanels) {
      const top = panel.getBoundingClientRect().top;
      const progress = Math.max(0, Math.min(1, (viewportHeight - top) / (viewportHeight * 0.8)));
      const easedProgress = progress * progress * (3 - 2 * progress);
      panel.style.setProperty('--cover-offset', `${(1 - easedProgress) * travel}px`);
    }
  }

  function scheduleCoverUpdate() {
    if (coverFrame) return;
    coverFrame = window.requestAnimationFrame(() => {
      coverFrame = 0;
      updateCoverPanels();
    });
  }

  coverPanels.forEach((panel) => panel.classList.add('cover-panel'));
  window.addEventListener('scroll', scheduleCoverUpdate, { passive: true });
  window.addEventListener('resize', scheduleCoverUpdate);
  scheduleCoverUpdate();

  const revealGroups = [
    '.hero-photo',
    '.hero-copy > *',
    '.intro > *',
    '#work > .meta, #work > .work-title, #work > .work-note, .project-grid > article',
    '#expertise-title, .service-list > li',
    '.about-heading, .about-details > *',
    '#contact > *',
    '.site-footer > *'
  ];

  for (const selector of revealGroups) {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add('reveal-item');
      element.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 85}ms`);
      revealObserver.observe(element);
    });
  }
}
