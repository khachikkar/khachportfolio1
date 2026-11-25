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
    if (section) {
      section.tabIndex = -1;
      section.focus({ preventScroll: true });
    }
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuToggle.focus();
  }
});

const navigationLinks = [...navigation.querySelectorAll('a')];
const siteHeader = document.querySelector('.site-header');
const pageSections = [...document.querySelectorAll('main > section')];

function syncHeaderAppearance() {
  const scrolled = window.scrollY > 12;
  siteHeader.classList.toggle('is-scrolled', scrolled);

  const marker = siteHeader.getBoundingClientRect().bottom + 2;
  const sectionUnderHeader = pageSections.find((section) => {
    const bounds = section.getBoundingClientRect();
    return bounds.top <= marker && bounds.bottom > marker;
  });
  siteHeader.classList.toggle('is-over-light', scrolled && Boolean(sectionUnderHeader?.classList.contains('light')));
}

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
window.addEventListener('scroll', syncHeaderAppearance, { passive: true });
window.addEventListener('resize', syncHeaderAppearance);
syncLayout();
syncCurrentLink();
syncHeaderAppearance();

const projectGrid = document.querySelector('#project-grid');
if (projectGrid) {
  window.PortfolioData.load()
    .then(({ hero, projects }) => {
      if (!Array.isArray(projects)) throw new Error('Project data is missing.');
      const heroImage = document.querySelector('#hero-image');
      if (heroImage && hero?.image) {
        heroImage.src = hero.image;
        heroImage.alt = hero.alt || '';
      }
      const cards = projects.map((project, index) => {
        const article = document.createElement('article');
        const link = document.createElement('a');
        link.className = 'project-card';
        link.href = `project.html?slug=${encodeURIComponent(project.slug)}`;

        const image = document.createElement('img');
        image.src = project.image;
        image.alt = project.alt || '';
        image.loading = 'lazy';

        const category = document.createElement('p');
        category.className = 'meta';
        category.textContent = project.category || `${String(index + 1).padStart(2, '0')} / Project`;

        const title = document.createElement('h3');
        title.textContent = project.title;

        const description = document.createElement('p');
        description.textContent = project.description;

        link.append(image, category, title, description);
        article.append(link);
        return article;
      });
      projectGrid.replaceChildren(...cards);
      if (document.documentElement.classList.contains('has-motion')) {
        cards.forEach((card, index) => {
          card.classList.add('reveal-item');
          card.style.setProperty('--reveal-delay', `${Math.min(index, 5) * 85}ms`);
          window.requestAnimationFrame(() => card.classList.add('is-visible'));
        });
      }
    })
    .catch(() => {
      projectGrid.textContent = 'Projects are temporarily unavailable.';
    });
}

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
