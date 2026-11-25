const statusLine = document.querySelector('#admin-status');
const projectList = document.querySelector('#project-list');
const projectForm = document.querySelector('#project-form');
const imageFileInput = document.querySelector('#project-image-file');
const imagePreview = document.querySelector('#project-image-preview');
const heroImageFileInput = document.querySelector('#hero-image-file');
const heroImagePreview = document.querySelector('#hero-image-preview');
const heroAltInput = document.querySelector('#hero-image-alt');
let projects = [];
let currentImage = '';
let heroImage = window.PORTFOLIO_HERO_FALLBACK?.image || 'assets/hero-portrait.png';
let heroAlt = window.PORTFOLIO_HERO_FALLBACK?.alt || '';
let slugEditedManually = false;
let hasUnsavedChanges = false;

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.style.color = isError ? '#8c2334' : '#243f67';
}

function renderProjects() {
  projectList.replaceChildren(...projects.map((project) => {
    const item = document.createElement('li');
    item.className = 'admin-item';
    const details = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = project.title;
    const subtitle = document.createElement('small');
    subtitle.textContent = `${project.category} · ${project.slug}`;
    const image = document.createElement('img');
    image.src = project.image;
    image.alt = '';
    image.loading = 'lazy';
    image.style.cssText = 'display:block;width:120px;height:72px;margin-top:10px;object-fit:cover;background:#e5e5e3';
    details.append(title, subtitle, image);

    const actions = document.createElement('div');
    actions.className = 'admin-item-actions';
    for (const [action, label, className] of [
      ['edit', 'Edit', 'admin-button secondary'],
      ['delete', 'Delete', 'admin-button danger']
    ]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = className;
      button.dataset.action = action;
      button.dataset.slug = project.slug;
      button.textContent = label;
      actions.append(button);
    }
    item.append(details, actions);
    return item;
  }));
}

function resetForm() {
  projectForm.reset();
  currentImage = '';
  imagePreview.hidden = true;
  imagePreview.removeAttribute('src');
  document.querySelector('#editing-slug').value = '';
  document.querySelector('#form-title').textContent = 'Add a project';
  projectForm.querySelector('[type="submit"]').textContent = 'Add project';
  document.querySelector('#cancel-edit').hidden = true;
  document.querySelector('#project-slug').readOnly = false;
  slugEditedManually = false;
}

function editProject(project) {
  document.querySelector('#editing-slug').value = project.slug;
  document.querySelector('#project-title').value = project.title;
  document.querySelector('#project-slug').value = project.slug;
  document.querySelector('#project-category').value = project.category;
  document.querySelector('#project-description').value = project.description;
  document.querySelector('#project-alt').value = project.alt || '';
  document.querySelector('#project-focus').value = (project.focus || []).join('\n');
  currentImage = project.image;
  imagePreview.src = project.image;
  imagePreview.hidden = !project.image;
  document.querySelector('#form-title').textContent = 'Edit a project';
  projectForm.querySelector('[type="submit"]').textContent = 'Update project';
  document.querySelector('#cancel-edit').hidden = false;
  document.querySelector('#project-slug').readOnly = true;
  document.querySelector('#form-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function markChanged(message) {
  hasUnsavedChanges = true;
  document.querySelector('#save-json').textContent = 'Download updated projects *';
  setStatus(`${message} Click “Download updated projects” when you are finished.`);
}

function parsePortfolioJson(text) {
  const data = JSON.parse(text);
  const portfolio = Array.isArray(data)
    ? { hero: window.PORTFOLIO_HERO_FALLBACK, projects: data }
    : data;
  if (!portfolio || !Array.isArray(portfolio.projects)) throw new Error('The JSON file does not contain a project list.');
  for (const project of portfolio.projects) {
    if (!project || typeof project !== 'object' || !project.slug || !project.title) {
      throw new Error('Each project needs a title and URL slug.');
    }
  }
  return {
    hero: {
      image: portfolio.hero?.image || window.PORTFOLIO_HERO_FALLBACK?.image || 'assets/hero-portrait.png',
      alt: portfolio.hero?.alt || window.PORTFOLIO_HERO_FALLBACK?.alt || ''
    },
    projects: portfolio.projects
  };
}

function downloadJson() {
  const contents = `${JSON.stringify({ hero: { image: heroImage, alt: heroAlt }, projects }, null, 2)}\n`;
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'projects.json';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  hasUnsavedChanges = false;
  document.querySelector('#save-json').textContent = 'Download updated projects';
  setStatus('Downloaded projects.json. Replace the old projects.json in your portfolio folder, then publish the site.');
}

imageFileInput.addEventListener('change', () => {
  const file = imageFileInput.files?.[0];
  if (!file) return;
  const allowedType = /^image\/(avif|jpeg|png|webp)$/.test(file.type);
  const allowedExtension = /\.(avif|jpe?g|png|webp)$/i.test(file.name);
  if (!allowedType && !allowedExtension) {
    imageFileInput.value = '';
    setStatus('Choose an AVIF, JPG, PNG, or WebP image.', true);
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    currentImage = String(reader.result || '');
    imagePreview.src = currentImage;
    imagePreview.hidden = false;
    setStatus(`${file.name} is ready and will be included in projects.json.`);
  });
  reader.addEventListener('error', () => setStatus('Could not read that image. Please choose it again.', true));
  reader.readAsDataURL(file);
});

heroImageFileInput.addEventListener('change', () => {
  const file = heroImageFileInput.files?.[0];
  if (!file) return;
  const allowedType = /^image\/(avif|jpeg|png|webp)$/.test(file.type);
  const allowedExtension = /\.(avif|jpe?g|png|webp)$/i.test(file.name);
  if (!allowedType && !allowedExtension) {
    heroImageFileInput.value = '';
    setStatus('Choose an AVIF, JPG, PNG, or WebP image.', true);
    return;
  }
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    heroImage = String(reader.result || '');
    heroImagePreview.src = heroImage;
    markChanged(`${file.name} is ready as the new homepage hero image.`);
  });
  reader.addEventListener('error', () => setStatus('Could not read that hero image. Please choose it again.', true));
  reader.readAsDataURL(file);
});

heroAltInput.addEventListener('input', () => {
  heroAlt = heroAltInput.value.trim();
  markChanged('Homepage image description updated.');
});

document.querySelector('#project-title').addEventListener('input', (event) => {
  if (slugEditedManually || document.querySelector('#editing-slug').value) return;
  document.querySelector('#project-slug').value = event.target.value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
});

document.querySelector('#project-slug').addEventListener('input', () => {
  slugEditedManually = true;
});

document.querySelector('#cancel-edit').addEventListener('click', resetForm);
document.querySelector('#save-json').addEventListener('click', downloadJson);

projectForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const oldSlug = document.querySelector('#editing-slug').value;
  const project = {
    slug: document.querySelector('#project-slug').value.trim(),
    title: document.querySelector('#project-title').value.trim(),
    category: document.querySelector('#project-category').value.trim(),
    description: document.querySelector('#project-description').value.trim(),
    image: currentImage,
    alt: document.querySelector('#project-alt').value.trim(),
    focus: document.querySelector('#project-focus').value.split('\n').map((line) => line.trim()).filter(Boolean)
  };
  if (!project.image) {
    setStatus('Choose an image file from your computer before saving this project.', true);
    return;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) {
    setStatus('Use a simple URL slug, like summer-campaign.', true);
    return;
  }
  if (projects.some((item) => item.slug === project.slug && item.slug !== oldSlug)) {
    setStatus('That URL slug is already in use.', true);
    return;
  }

  projects = oldSlug
    ? projects.map((item) => item.slug === oldSlug ? project : item)
    : [...projects, project];
  renderProjects();
  markChanged(oldSlug ? 'Project updated.' : 'Project added.');
  resetForm();
});

projectList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const project = projects.find((item) => item.slug === button.dataset.slug);
  if (!project) return;
  if (button.dataset.action === 'edit') {
    editProject(project);
    return;
  }
  if (!window.confirm(`Delete “${project.title}” from the project list?`)) return;
  projects = projects.filter((item) => item.slug !== project.slug);
  renderProjects();
  markChanged('Project deleted.');
  if (document.querySelector('#editing-slug').value === project.slug) resetForm();
});

async function loadProjects() {
  try {
    const response = await fetch('projects.json');
    if (!response.ok) throw new Error('Could not load projects.json.');
    const portfolio = parsePortfolioJson(await response.text());
    projects = portfolio.projects;
    heroImage = portfolio.hero.image;
    heroAlt = portfolio.hero.alt;
    setStatus('Your projects are ready.');
  } catch {
    projects = window.PORTFOLIO_PROJECTS_FALLBACK || [];
    heroImage = window.PORTFOLIO_HERO_FALLBACK?.image || heroImage;
    heroAlt = window.PORTFOLIO_HERO_FALLBACK?.alt || '';
    setStatus('Loaded the starter list and hero image.');
  }
  heroImagePreview.src = heroImage;
  heroAltInput.value = heroAlt;
  renderProjects();
}

window.addEventListener('beforeunload', (event) => {
  if (!hasUnsavedChanges) return;
  event.preventDefault();
  event.returnValue = '';
});

loadProjects();
