const projects = [
  {
    slug: 'identity-system',
    title: 'Identity system concept',
    category: '01 / Branding',
    description: 'A modular logo, type and color system for a cultural brand.',
    image: 'assets/identity.avif',
    alt: 'Design swatches and tools arranged on a work surface',
    focus: ['Identity direction', 'Typography and color', 'Guidelines and applications']
  },
  {
    slug: 'launch-campaign',
    title: 'Launch campaign concept',
    category: '02 / Digital campaigns',
    description: 'A social-first campaign toolkit across formats.',
    image: 'assets/campaign.avif',
    alt: 'Creative team reviewing campaign work around a table',
    focus: ['Campaign art direction', 'Social-first visual system', 'Cross-format applications']
  },
  {
    slug: 'editorial-shoot',
    title: 'Editorial shoot concept',
    category: '03 / Art direction',
    description: 'Moodboard, styling and layout direction for print.',
    image: 'assets/editorial.avif',
    alt: 'Editorial design materials and printed layouts',
    focus: ['Moodboard and art direction', 'Styling direction', 'Print layout concept']
  },
  {
    slug: 'product-interface',
    title: 'Product interface concept',
    category: '04 / UI/UX',
    description: 'A clean interface language for a mobile product.',
    image: 'assets/product.avif',
    alt: 'Tablet interface sketches and wireframes on a desk',
    focus: ['Interface direction', 'Wireframe concept', 'Mobile product screens']
  }
];

const requestedSlug = new URLSearchParams(window.location.search).get('slug');
const projectIndex = projects.findIndex((project) => project.slug === requestedSlug);
const project = projects[projectIndex >= 0 ? projectIndex : 0];

document.title = `${project.title} — Khachik Karapetyan`;
document.querySelector('#project-category').textContent = project.category;
document.querySelector('#project-title').textContent = project.title;
document.querySelector('#project-description').textContent = project.description;
document.querySelector('#project-overview-copy').textContent = project.description;
document.querySelector('#project-image').src = project.image;
document.querySelector('#project-image').alt = project.alt;
document.querySelector('#project-caption').textContent = `${project.category} / Concept study`;

const projectScope = document.querySelector('#project-scope');
for (const item of project.focus) {
  const listItem = document.createElement('li');
  listItem.textContent = item;
  projectScope.append(listItem);
}

const nextProject = projects[(projectIndex + 1) % projects.length];
const nextProjectLink = document.querySelector('#next-project');
nextProjectLink.href = `project.html?slug=${nextProject.slug}`;
nextProjectLink.querySelector('strong').textContent = nextProject.title;
