(function () {
const statusLine = document.querySelector('#admin-status');
const loginPanel = document.querySelector('#login-panel');
const editorPanel = document.querySelector('#editor-panel');
const logoutButton = document.querySelector('#logout-button');
const projectList = document.querySelector('#project-list');
const projectForm = document.querySelector('#project-form');
const imageFileInput = document.querySelector('#project-image-file');
const imagePreview = document.querySelector('#project-image-preview');
const heroImageFileInput = document.querySelector('#hero-image-file');
const heroImagePreview = document.querySelector('#hero-image-preview');
const heroAltInput = document.querySelector('#hero-image-alt');
const saveButton = document.querySelector('#save-online');
const config = window.SUPABASE_CONFIG;
const supabase = window.portfolioSupabase;

let portfolio = null;
let currentImage = '';
let currentProjectImageFile = null;
let heroImageFile = null;
let dirty = false;
let slugEditedManually = false;
const projectImageFiles = new Map();

function setStatus(message, isError = false) {
  statusLine.textContent = message;
  statusLine.style.color = isError ? '#8c2334' : '#243f67';
}

function setDirty() {
  dirty = true;
  saveButton.textContent = 'Save changes online *';
}

function showLogin() {
  loginPanel.hidden = false;
  editorPanel.hidden = true;
  logoutButton.hidden = true;
}

function showEditor() {
  loginPanel.hidden = true;
  editorPanel.hidden = false;
  logoutButton.hidden = false;
}

function renderProjects() {
  projectList.replaceChildren(...portfolio.projects.map((project) => {
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
  imageFileInput.value = '';
  currentImage = '';
  currentProjectImageFile = null;
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
  currentProjectImageFile = null;
  imagePreview.src = project.image;
  imagePreview.hidden = !project.image;
  document.querySelector('#form-title').textContent = 'Edit a project';
  projectForm.querySelector('[type="submit"]').textContent = 'Update project';
  document.querySelector('#cancel-edit').hidden = false;
  document.querySelector('#project-slug').readOnly = true;
  document.querySelector('#form-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function imageExtension(file) {
  const match = file.name.match(/\.(avif|jpe?g|png|webp)$/i);
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'img';
}

async function uploadImage(file, folder) {
  const objectPath = `${folder}/${Date.now()}-${crypto.randomUUID()}.${imageExtension(file)}`;
  const { error } = await supabase.storage.from(config.storageBucket).upload(objectPath, file, {
    cacheControl: '31536000',
    contentType: file.type || 'application/octet-stream',
    upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from(config.storageBucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

async function readPortfolioFromSupabase() {
  const { data, error } = await supabase
    .from(config.contentTable)
    .select('content')
    .eq('id', 'main')
    .single();
  if (error) throw error;
  return window.PortfolioData.normalize(data.content);
}

async function refreshPortfolio() {
  portfolio = await readPortfolioFromSupabase();
  heroImagePreview.src = portfolio.hero.image;
  heroAltInput.value = portfolio.hero.alt || '';
  renderProjects();
  dirty = false;
  saveButton.textContent = 'Save changes online';
  setStatus('Your saved portfolio is loaded.');
}

async function requireOwner(user) {
  if (user?.email?.toLowerCase() === config.adminEmail.toLowerCase()) return true;
  await supabase.auth.signOut();
  showLogin();
  setStatus(`Sign in using ${config.adminEmail}.`, true);
  return false;
}

document.querySelector('#auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase) {
    setStatus('Supabase is not connected yet. The project setup still needs to be completed.', true);
    return;
  }
  const button = document.querySelector('#login-button');
  button.disabled = true;
  setStatus('Signing in…');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: config.adminEmail,
    password: document.querySelector('#admin-password').value
  });
  button.disabled = false;
  if (error) {
    setStatus(error.message, true);
    return;
  }
  if (!await requireOwner(data.user)) return;
  document.querySelector('#admin-password').value = '';
  showEditor();
  try {
    await refreshPortfolio();
  } catch (loadError) {
    setStatus(`Signed in, but could not load portfolio data: ${loadError.message}`, true);
  }
});

document.querySelector('#signup-button').addEventListener('click', async () => {
  if (!supabase) {
    setStatus('Supabase is not connected yet. The project setup still needs to be completed.', true);
    return;
  }
  const password = document.querySelector('#admin-password').value;
  if (password.length < 8) {
    setStatus('Enter a password with at least 8 characters to create your admin account.', true);
    return;
  }
  const button = document.querySelector('#signup-button');
  button.disabled = true;
  setStatus('Creating your admin account…');
  const { data, error } = await supabase.auth.signUp({
    email: config.adminEmail,
    password,
    options: { emailRedirectTo: `${window.location.origin}/admin.html` }
  });
  button.disabled = false;
  if (error) {
    setStatus(error.message, true);
    return;
  }
  if (!data.session) {
    setStatus('Check your email to confirm the account, then return here and sign in.');
    return;
  }
  if (!await requireOwner(data.user)) return;
  showEditor();
  try {
    await refreshPortfolio();
  } catch (loadError) {
    setStatus(`Account created, but could not load portfolio data: ${loadError.message}`, true);
  }
});

logoutButton.addEventListener('click', async () => {
  if (dirty && !window.confirm('You have changes that are not saved online. Log out anyway?')) return;
  await supabase?.auth.signOut();
  portfolio = null;
  projectImageFiles.clear();
  heroImageFile = null;
  showLogin();
  setStatus('You are signed out.');
});

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
  currentProjectImageFile = file;
  imagePreview.src = URL.createObjectURL(file);
  imagePreview.hidden = false;
  setStatus(`${file.name} is ready to upload when you save the project.`);
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
  heroImageFile = file;
  heroImagePreview.src = URL.createObjectURL(file);
  setDirty();
  setStatus(`${file.name} is ready to upload. Click Save changes online to publish it.`);
});

heroAltInput.addEventListener('input', () => {
  portfolio.hero.alt = heroAltInput.value.trim();
  setDirty();
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

projectForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!portfolio) return;
  const oldSlug = document.querySelector('#editing-slug').value;
  const project = {
    slug: document.querySelector('#project-slug').value.trim(),
    title: document.querySelector('#project-title').value.trim(),
    category: document.querySelector('#project-category').value.trim(),
    description: document.querySelector('#project-description').value.trim(),
    image: currentProjectImageFile ? currentImage || 'pending-upload' : currentImage,
    alt: document.querySelector('#project-alt').value.trim(),
    focus: document.querySelector('#project-focus').value.split('\n').map((line) => line.trim()).filter(Boolean)
  };
  if (!project.image) {
    setStatus('Choose an image file for this project.', true);
    return;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) {
    setStatus('Use a simple URL slug, like summer-campaign.', true);
    return;
  }
  if (portfolio.projects.some((item) => item.slug === project.slug && item.slug !== oldSlug)) {
    setStatus('That URL slug is already in use.', true);
    return;
  }

  portfolio.projects = oldSlug
    ? portfolio.projects.map((item) => item.slug === oldSlug ? project : item)
    : [...portfolio.projects, project];
  if (currentProjectImageFile) projectImageFiles.set(project.slug, currentProjectImageFile);
  renderProjects();
  setDirty();
  setStatus('Project updated in the editor. Click Save changes online to publish it.');
  resetForm();
});

projectList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || !portfolio) return;
  const project = portfolio.projects.find((item) => item.slug === button.dataset.slug);
  if (!project) return;
  if (button.dataset.action === 'edit') {
    editProject(project);
    return;
  }
  if (!window.confirm(`Delete “${project.title}” from the portfolio?`)) return;
  portfolio.projects = portfolio.projects.filter((item) => item.slug !== project.slug);
  projectImageFiles.delete(project.slug);
  renderProjects();
  setDirty();
  setStatus('Project deleted in the editor. Click Save changes online to publish it.');
  if (document.querySelector('#editing-slug').value === project.slug) resetForm();
});

async function saveOnline() {
  if (!supabase || !portfolio) {
    setStatus('Supabase is not connected yet.', true);
    return;
  }
  saveButton.disabled = true;
  setStatus('Uploading images and saving portfolio…');
  try {
    let heroUrl = portfolio.hero.image;
    if (heroImageFile) heroUrl = await uploadImage(heroImageFile, 'hero');
    const nextProjects = [];
    for (const project of portfolio.projects) {
      const file = projectImageFiles.get(project.slug);
      nextProjects.push(file
        ? { ...project, image: await uploadImage(file, `projects/${project.slug}`) }
        : project);
    }
    const content = {
      hero: { ...portfolio.hero, image: heroUrl },
      projects: nextProjects
    };
    const { data, error } = await supabase
      .from(config.contentTable)
      .update({ content, updated_at: new Date().toISOString() })
      .eq('id', 'main')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('No portfolio row was updated. Check the admin account and database policies.');

    portfolio = content;
    projectImageFiles.clear();
    heroImageFile = null;
    heroImageFileInput.value = '';
    dirty = false;
    saveButton.textContent = 'Save changes online';
    renderProjects();
    heroImagePreview.src = portfolio.hero.image;
    heroAltInput.value = portfolio.hero.alt || '';
    setStatus('Saved online. The public site now uses these changes.');
  } catch (error) {
    setStatus(error.message || 'Could not save changes online.', true);
  } finally {
    saveButton.disabled = false;
  }
}

function downloadBackup() {
  if (!portfolio) return;
  if (dirty) {
    setStatus('Save changes online first, then download a backup of the saved portfolio.', true);
    return;
  }
  const contents = `${JSON.stringify(portfolio, null, 2)}\n`;
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'projects.json';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus('Downloaded a JSON backup of the current editor data.');
}

saveButton.addEventListener('click', saveOnline);
document.querySelector('#download-backup').addEventListener('click', downloadBackup);

async function initializeAdmin() {
  if (!supabase) {
    showLogin();
    setStatus('Supabase project setup is still needed before sign-in can work.', true);
    return;
  }
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    showLogin();
    setStatus('Sign in with your portfolio account to continue.');
    return;
  }
  if (!await requireOwner(data.session.user)) return;
  showEditor();
  try {
    await refreshPortfolio();
  } catch (loadError) {
    setStatus(`Could not load Supabase portfolio data: ${loadError.message}`, true);
  }
}

initializeAdmin();
})();
