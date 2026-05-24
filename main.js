/* =====================================================
   mejob — main.js
   App initialisation, event listeners, UI interactions
   ===================================================== */

/* =====================================================
   SCROLL REVEAL MODULE
   ===================================================== */
const ScrollReveal = (() => {
  let observer;

  function init() {
    observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    observe();
  }

  function observe() {
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale')
      .forEach(el => observer && observer.observe(el));
  }

  return { init, observe };
})();

/* =====================================================
   COUNTER ANIMATION MODULE
   ===================================================== */
const CounterAnim = (() => {
  function formatNum(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return n.toString();
  }

  function animateCount(el, target, suffix, duration = 2000) {
    const numEl = el.querySelector('.stat-num');
    if (!numEl) return;
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(ease * target);
      numEl.textContent = formatNum(current) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function init() {
    const statsBar = document.querySelector('.stats-bar');
    if (!statsBar) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          document.querySelectorAll('.stat-item').forEach(item => {
            const count  = parseInt(item.dataset.count, 10);
            const suffix = item.dataset.suffix || '';
            animateCount(item, count, suffix);
          });
          observer.disconnect();
        }
      });
    }, { threshold: 0.5 });
    observer.observe(statsBar);
  }

  return { init };
})();

/* =====================================================
   UI MODULE
   ===================================================== */
const UI = (() => {

  /* ---- NAVBAR SCROLL ---- */
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 30);
    }, { passive: true });
  }

  /* ---- HAMBURGER MENU ---- */
  function initHamburger() {
    const btn   = document.getElementById('hamburger');
    const links = document.getElementById('navLinks');
    if (!btn || !links) return;

    btn.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !links.contains(e.target)) {
        links.classList.remove('open');
      }
    });
  }

  /* ---- BACK TO TOP ---- */
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
      btn.classList.toggle('visible', window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---- MODAL ---- */
  function initModal() {
    const overlay   = document.getElementById('modalOverlay');
    const btnPost   = document.getElementById('btnPost');
    const btnLogin  = document.getElementById('btnLogin');
    const btnClose  = document.getElementById('modalClose');
    const postForm  = document.getElementById('postForm');
    const modalTabs = document.querySelectorAll('.modal-tab');

    if (!overlay) return;

    function openModal() { overlay.classList.add('open'); document.body.style.overflow = 'hidden'; }
    function closeModal() { overlay.classList.remove('open'); document.body.style.overflow = ''; }

    btnPost?.addEventListener('click', openModal);
    btnClose?.addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    // Login/Register handled by AuthUI (auth.js)

    // Modal tabs
    modalTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modalTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    // Form submit
    postForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      closeModal();
      Components.showToast({
        icon: '🎉',
        title: 'ลงประกาศสำเร็จ!',
        message: 'ประกาศของคุณจะแสดงภายใน 24 ชั่วโมง',
        type: 'success',
      });
    });
  }

  /* ---- FILTER TABS ---- */
  function initFilterTabs() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        Components.renderJobs(tab.dataset.filter);
      });
    });
  }

  /* ---- SEARCH ---- */
  function initSearch() {
    const btn   = document.getElementById('btnSearch');
    const input = document.getElementById('searchInput');
    const loc   = document.getElementById('locationInput');

    function doSearch() {
      const q = input.value.trim();
      const l = loc.value.trim();
      if (!q && !l) {
        Components.showToast({
          icon: '🔍',
          title: 'กรุณาใส่คำค้นหา',
          message: 'ลองค้นหาตำแหน่งงาน ทักษะ หรือบริษัท',
          type: 'warning',
        });
        return;
      }
      Components.showToast({
        icon: '🔍',
        title: `กำลังค้นหา "${q || l}"`,
        message: 'กรุณารอสักครู่...',
        type: 'info',
        duration: 2000,
      });
      // Scroll to jobs section
      document.getElementById('featuredJobs')?.scrollIntoView({ behavior: 'smooth' });
    }

    btn?.addEventListener('click', doSearch);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
    loc?.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSearch(); });
  }

  /* ---- LOAD MORE ---- */
  function initLoadMore() {
    const btn = document.getElementById('btnLoadMore');
    if (!btn) return;
    let count = 0;
    btn.addEventListener('click', () => {
      count++;
      if (count >= 2) {
        Components.showToast({
          icon: '✅',
          title: 'แสดงทั้งหมดแล้ว',
          message: 'ไม่มีงานเพิ่มเติม ลองกรองหมวดหมู่อื่นดูครับ',
          type: 'info',
        });
        btn.disabled = true;
        btn.textContent = 'แสดงทั้งหมดแล้ว';
        return;
      }
      Components.showToast({
        icon: '📋',
        title: 'โหลดงานเพิ่มเติม',
        message: 'กำลังโหลดตำแหน่งงานเพิ่มเติม...',
        type: 'info',
        duration: 1500,
      });
    });
  }

  /* ---- SAVE JOB ---- */
  const savedJobs = new Set();
  function saveJob(btn, id) {
    if (savedJobs.has(id)) {
      savedJobs.delete(id);
      btn.classList.remove('saved');
      btn.innerHTML = '♡';
      Components.showToast({ icon: '🗑️', title: 'ลบออกจาก Wishlist แล้ว', type: 'info', duration: 2000 });
    } else {
      savedJobs.add(id);
      btn.classList.add('saved');
      btn.innerHTML = '♥';
      Components.showToast({ icon: '❤️', title: 'บันทึกงานแล้ว!', message: 'ดูงานที่บันทึกได้ในโปรไฟล์', type: 'success', duration: 2500 });
    }
  }

  /* ---- SEARCH BY TAG ---- */
  function searchTag(tag) {
    const input = document.getElementById('searchInput');
    if (input) input.value = tag;
    document.getElementById('featuredJobs')?.scrollIntoView({ behavior: 'smooth' });
    Components.showToast({ icon: '🏷️', title: `ค้นหา: ${tag}`, type: 'info', duration: 2000 });
  }

  /* ---- FILTER BY CATEGORY ---- */
  function filterByCategory(name) {
    document.getElementById('featuredJobs')?.scrollIntoView({ behavior: 'smooth' });
    Components.showToast({ icon: '📂', title: `หมวดหมู่: ${name}`, message: 'กรองงานตามหมวดหมู่แล้ว', type: 'info', duration: 2000 });
  }

  /* ---- ACTIVE NAV LINK ON SCROLL ---- */
  function initActiveNav() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove('active'));
          const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
          if (active) active.classList.add('active');
        }
      });
    }, { threshold: 0.4, rootMargin: '-68px 0px 0px 0px' });
    sections.forEach(s => observer.observe(s));
  }

  /* ---- PUBLIC API ---- */
  return {
    initNavbar,
    initHamburger,
    initBackToTop,
    initModal,
    initFilterTabs,
    initSearch,
    initLoadMore,
    initActiveNav,
    saveJob,
    searchTag,
    filterByCategory,
  };
})();

/* =====================================================
   APP BOOTSTRAP
   ===================================================== */
document.addEventListener('DOMContentLoaded', () => {

  // Render all dynamic content
  Components.renderPopularTags();
  Components.renderCategories();
  Components.renderJobs('all');
  Components.renderHireFeatures();
  Components.renderApplicantAvatars();
  Components.renderFreelance();
  Components.renderNews();
  Components.renderFooter();
  Components.renderSocialLinks();

  // Init UI behaviours
  UI.initNavbar();
  UI.initHamburger();
  UI.initBackToTop();
  UI.initModal();
  UI.initFilterTabs();
  UI.initSearch();
  UI.initLoadMore();
  UI.initActiveNav();

  // Init scroll animations & counters
  ScrollReveal.init();
  CounterAnim.init();

  // Add reveal classes to section headers
  document.querySelectorAll('.section-header').forEach(el => el.classList.add('reveal'));
  document.querySelectorAll('.hire-split__content').forEach(el => el.classList.add('reveal-left'));
  document.querySelectorAll('.hire-split__visual').forEach(el => el.classList.add('reveal-right'));
  document.querySelectorAll('.cta-banner__content').forEach(el => el.classList.add('reveal-scale'));
  ScrollReveal.observe();

  // Init Auth system (login/register modals + session restore)
  AuthUI.init();

  // Welcome toast
  setTimeout(() => {
    Components.showToast({
      icon: '👋',
      title: 'ยินดีต้อนรับสู่ mejob!',
      message: 'ค้นหางานในฝันของคุณได้เลย',
      type: 'info',
      duration: 3000,
    });
  }, 1200);
});
