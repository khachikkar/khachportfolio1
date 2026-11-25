async function loadProjectPage() {
  let projects;
  try {
    const response = await fetch('projects.json');
    if (!response.ok) throw new Error('Could not load projects.');
    const data = await response.json();
    projects = Array.isArray(data) ? data : data.projects;
  } catch {
    projects = window.PORTFOLIO_PROJECTS_FALLBACK;
  }
  if (!Array.isArray(projects)) throw new Error('Project data is missing.');
  const requestedSlug = new URLSearchParams(window.location.search).get('slug');
  const projectIndex = projects.findIndex((item) => item.slug === requestedSlug);
  const project = projects[projectIndex];

  if (!project) {
    document.querySelector('#project-title').textContent = 'Project not found';
    document.querySelector('#project-description').textContent = 'This project may have been removed.';
    document.querySelector('.project-feature').hidden = true;
    document.querySelector('#project-overview-copy').textContent = '';
    document.querySelector('#next-project').hidden = true;
    return;
  }

  document.title = `${project.title} — Khachik Karapetyan`;
  document.querySelector('#project-category').textContent = project.category;
  document.querySelector('#project-title').textContent = project.title;
  document.querySelector('#project-description').textContent = project.description;
  document.querySelector('#project-overview-copy').textContent = project.description;
  document.querySelector('#project-image').src = project.image;
  document.querySelector('#project-image').alt = project.alt || '';
  document.querySelector('#project-caption').textContent = `${project.category} / Concept study`;

  const projectScope = document.querySelector('#project-scope');
  for (const item of project.focus || []) {
    const listItem = document.createElement('li');
    listItem.textContent = item;
    projectScope.append(listItem);
  }

  const nextProject = projects[(projectIndex + 1) % projects.length];
  const nextProjectLink = document.querySelector('#next-project');
  nextProjectLink.href = `project.html?slug=${encodeURIComponent(nextProject.slug)}`;
  nextProjectLink.querySelector('strong').textContent = nextProject.title;
}

loadProjectPage().catch(() => {
  document.querySelector('#project-title').textContent = 'Projects are temporarily unavailable';
  document.querySelector('#project-description').textContent = 'Please return to the selected work section.';
});
