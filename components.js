/* =====================================================
   mejob — components.js
   DOM rendering functions for all dynamic sections
   ===================================================== */

const Components = (() => {

  /* ---- POPULAR TAGS ---- */
  function renderPopularTags() {
    const container = document.getElementById('popularTags');
    if (!container) return;
    container.innerHTML = DATA.popularTags.map(tag =>
      `<button class="tag-chip" onclick="UI.searchTag('${tag}')">${tag}</button>`
    ).join('');
  }

  /* ---- CATEGORIES ---- */
  function renderCategories() {
    const grid = document.getElementById('categoriesGrid');
    if (!grid) return;
    grid.className = 'categories__grid reveal-stagger';
    grid.innerHTML = DATA.categories.map(cat => `
      <div class="category-card reveal" style="--cat-color:${cat.color}" onclick="UI.filterByCategory('${cat.name}')">
        <span class="category-card__icon">${cat.icon}</span>
        <div class="category-card__name">${cat.name}</div>
        <div class="category-card__count">${cat.count} ตำแหน่ง</div>
      </div>
    `).join('');
  }

  /* ---- JOB CARD ---- */
  function renderJobCard(job) {
    const badgeHtml = job.badge
      ? `<span class="badge badge--${job.badge}">${job.badge === 'hot' ? '🔥 Hot' : '✨ New'}</span>`
      : '';
    const tagsHtml = job.tags.map(t =>
      `<span class="job-tag" style="background:rgba(255,255,255,0.05);color:var(--clr-text2);font-size:0.73rem">${t}</span>`
    ).join('');

    return `
      <div class="job-card reveal" data-filter="${job.filter}" data-id="${job.id}">
        <div class="job-card__header">
          <div class="job-card__logo" style="background:${job.logoBg}">${job.logo}</div>
          <div class="job-card__info">
            <div class="job-card__title">${job.title} ${badgeHtml}</div>
            <div class="job-card__company">${job.company}</div>
          </div>
          <button class="job-card__save" onclick="UI.saveJob(this, ${job.id})" title="บันทึกงาน">♡</button>
        </div>
        <div class="job-card__tags">
          <span class="job-tag job-tag--type">${job.type}</span>
          <span class="job-tag job-tag--location">📍 ${job.location}</span>
          ${tagsHtml}
        </div>
        <div class="job-card__footer">
          <span class="job-card__salary">฿${job.salary}</span>
          <span class="job-card__time">⏱ ${job.posted}</span>
        </div>
      </div>
    `;
  }

  /* ---- JOBS GRID ---- */
  function renderJobs(filter = 'all') {
    const grid = document.getElementById('jobsGrid');
    if (!grid) return;
    const filtered = filter === 'all'
      ? DATA.jobs
      : DATA.jobs.filter(j => j.filter === filter);
    grid.innerHTML = filtered.map(renderJobCard).join('');
    ScrollReveal.observe();
  }

  /* ---- HIRE FEATURES ---- */
  function renderHireFeatures() {
    const list = document.getElementById('hireFeatures');
    if (!list) return;
    list.innerHTML = DATA.hireFeatures.map(f => `
      <li class="hire-feature">
        <span class="hire-feature-icon">✓</span>
        <span>${f}</span>
      </li>
    `).join('');
  }

  /* ---- APPLICANT AVATARS ---- */
  function renderApplicantAvatars() {
    const container = document.getElementById('applicantAvatars');
    if (!container) return;
    container.innerHTML = DATA.applicantColors.map((color, i) =>
      `<div class="avatar-circle" style="background:${color}">A${i + 1}</div>`
    ).join('');
  }

  /* ---- FREELANCE GRID ---- */
  function renderFreelance() {
    const grid = document.getElementById('freelanceGrid');
    if (!grid) return;
    grid.className = 'freelance-grid reveal-stagger';
    grid.innerHTML = DATA.freelancers.map(f => `
      <div class="freelance-card reveal">
        <div class="freelance-card__header">
          <div class="freelance-avatar" style="background:${f.avatarBg}">${f.emoji}</div>
          <div>
            <div class="freelance-card__name">${f.name}</div>
            <div class="freelance-card__skill">${f.skill}</div>
          </div>
        </div>
        <div class="freelance-card__title">${f.title}</div>
        <div class="freelance-card__footer">
          <span class="freelance-card__rate">${f.rate}</span>
          <span class="freelance-card__rating">
            ★ ${f.rating}
            <span style="color:var(--clr-text3)">(${f.reviews})</span>
          </span>
        </div>
      </div>
    `).join('');
  }

  /* ---- NEWS GRID ---- */
  function renderNews() {
    const grid = document.getElementById('newsGrid');
    if (!grid) return;
    grid.className = 'news-grid reveal-stagger';
    grid.innerHTML = DATA.news.map(n => `
      <div class="news-card reveal">
        <div class="news-card__img" style="font-size:3.5rem">${n.emoji}</div>
        <div class="news-card__body">
          <span class="news-tag" style="background:${n.tagColor};color:${n.tagTextColor}">${n.tag}</span>
          <div class="news-card__title">${n.title}</div>
          <div class="news-card__meta">${n.date} · อ่าน ${n.readTime}</div>
        </div>
      </div>
    `).join('');
  }

  /* ---- FOOTER LINKS ---- */
  function renderFooter() {
    const container = document.getElementById('footerLinks');
    if (!container) return;
    container.className = 'footer__links';
    container.style.cssText = 'display:contents';

    const cols = DATA.footerLinks.map(col => `
      <div class="footer__col">
        <h4>${col.title}</h4>
        <ul>
          ${col.links.map(l => `<li><a href="#">${l}</a></li>`).join('')}
        </ul>
      </div>
    `).join('');
    container.innerHTML = cols;
  }

  /* ---- SOCIAL LINKS ---- */
  function renderSocialLinks() {
    const container = document.getElementById('socialLinks');
    if (!container) return;
    container.innerHTML = DATA.socialLinks.map(s =>
      `<button class="social-btn" title="${s.label}" style="color:${s.color}">${s.icon}</button>`
    ).join('');
  }

  /* ---- TOAST NOTIFICATION ---- */
  let toastContainer;
  function getToastContainer() {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  }

  function showToast({ icon = 'ℹ️', title, message, type = 'info', duration = 3500 }) {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <div class="toast-body">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-msg">${message}</div>` : ''}
      </div>
      <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  /* ---- PUBLIC API ---- */
  return {
    renderPopularTags,
    renderCategories,
    renderJobs,
    renderHireFeatures,
    renderApplicantAvatars,
    renderFreelance,
    renderNews,
    renderFooter,
    renderSocialLinks,
    showToast,
  };
})();
