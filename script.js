/**
 * MVPS SPEAKS — Shared Script
 * All pages load data from data.json
 * Add new pages by just creating a new HTML file — this script handles the rest
 */

// ─── Global State ────────────────────────────────────────────────
const MVPS = {
  data: null,
  // Bug fix: robust page detection — handles trailing slash, folder URLs, direct file open
  currentPage: (function () {
    const raw = window.location.pathname.split('/').pop();
    if (!raw || raw === '') return 'index.html';
    if (raw.endsWith('.html')) return raw;
    return 'index.html';
  })(),
};

// ─── Data Loader ─────────────────────────────────────────────────
async function loadData() {
  try {
    // Bug fix: use script tag's own src to resolve base path safely
    // Falls back to 'data.json' for direct file:// opens
    const base = (function () {
      const scripts = document.querySelectorAll('script[src]');
      for (const s of scripts) {
        if (s.src && s.src.includes('script.js')) {
          return s.src.replace('script.js', '');
        }
      }
      return '';
    })();
    const res = await fetch(base + 'data.json');
    if (!res.ok) throw new Error('HTTP ' + res.status);
    MVPS.data = await res.json();
    onDataReady();
  } catch (e) {
    console.error('data.json load failed:', e);
  }
}

// ─── Called after data.json loads ────────────────────────────────
function onDataReady() {
  renderNav();       // markActiveNav is called inside renderNav
  renderFooter();
  renderSiteTitle();

  // Page-specific renders
  if (MVPS.currentPage === 'index.html') {
    renderHero();
    renderStats();
    renderDemands();
  }

  if (MVPS.currentPage === 'complaint.html') {
    renderComplaintPage();
  }
}

// ─── Nav ──────────────────────────────────────────────────────────
function renderNav() {
  const nav = document.getElementById('nav-links');
  if (!nav || !MVPS.data) return;
  nav.innerHTML = MVPS.data.nav
    .map(item => `<a href="${item.href}" class="nav-link">${item.label}</a>`)
    .join('');
  // Bug fix: markActiveNav called here, after links are injected — not separately after
  markActiveNav();
}

function markActiveNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === MVPS.currentPage) {
      link.classList.add('active');
    }
  });
}

// ─── Site Title ───────────────────────────────────────────────────
function renderSiteTitle() {
  if (!MVPS.data) return;
  // Bug fix: do NOT touch .site-name element — it has a <span> for flame color styling
  // Only update the browser tab title
  document.title = MVPS.data.site.name + ' — ' + MVPS.data.site.tagline;
}

// ─── Hero (index.html) ────────────────────────────────────────────
function renderHero() {
  const h = MVPS.data?.hero;
  if (!h) return;

  const el = document.getElementById('hero-content');
  if (!el) return;

  el.innerHTML = `
    <div class="hero-label">MVPS · Bhadohi, U.P.</div>
    <h1 class="hero-headline">${h.headline}</h1>
    <p class="hero-sub">${h.subheadline}</p>
    <p class="hero-body">${h.body}</p>
    <div class="hero-ctas">
      <a href="${h.cta_primary.href}" class="btn btn-primary">${h.cta_primary.label} →</a>
      <a href="${h.cta_secondary.href}" class="btn btn-secondary">${h.cta_secondary.label}</a>
    </div>
  `;
}

// ─── Stats (index.html) ───────────────────────────────────────────
function renderStats() {
  const stats = MVPS.data?.stats;
  if (!stats) return;

  const el = document.getElementById('stats-content');
  if (!el) return;

  el.innerHTML = stats
    .map(s => `
      <div class="stat-card">
        <div class="stat-value" id="stat-${s.id}">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>
    `).join('');

  // Animate counters up
  stats.forEach(s => animateCounter(`stat-${s.id}`, s.value));
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  // Bug fix: was skipping when target <= 1, leaving element empty if value is exactly 1
  // Now: always show the value; only animate if target > 10 (worth animating)
  if (target <= 10) {
    el.textContent = target;
    return;
  }
  let current = 0;
  const step = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

// ─── Demands (index.html) ─────────────────────────────────────────
function renderDemands() {
  const demands = MVPS.data?.demands;
  if (!demands) return;

  const el = document.getElementById('demands-content');
  if (!el) return;

  el.innerHTML = demands.map((d, i) => `
    <div class="demand-card" data-urgency="${d.urgency}">
      <div class="demand-meta">
        <span class="demand-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="demand-urgency ${d.urgency}">${d.urgency.toUpperCase()}</span>
      </div>
      <h3 class="demand-title">${d.title}</h3>
      <p class="demand-body">${d.body}</p>
      <div class="demand-status">STATUS: ${d.status.toUpperCase()}</div>
    </div>
  `).join('');
}

// ─── Complaint Page ───────────────────────────────────────────────
function renderComplaintPage() {
  const cp = MVPS.data?.complaint_page;
  if (!cp) return;

  const headEl = document.getElementById('complaint-header');
  if (headEl) {
    headEl.innerHTML = `
      <h1 class="page-headline">${cp.headline}</h1>
      <p class="page-sub">${cp.subheadline}</p>
      <div class="complaint-note">${cp.note}</div>
      <ul class="instructions-list">
        ${cp.instructions.map(i => `<li>${i}</li>`).join('')}
      </ul>
    `;
  }

  const formEl = document.getElementById('complaint-form-container');
  if (formEl) {
    if (cp.google_form_url && cp.google_form_url !== 'YOUR_GOOGLE_FORM_EMBED_URL_HERE') {
      formEl.innerHTML = `
        <iframe 
          src="${cp.google_form_url}" 
          width="100%" 
          height="700" 
          frameborder="0" 
          marginheight="0" 
          marginwidth="0"
          title="Complaint Form">
          Loading form…
        </iframe>
      `;
    } else {
      // Placeholder until Google Form URL is set
      formEl.innerHTML = `
        <div class="form-placeholder">
          <div class="form-placeholder-icon">📋</div>
          <p class="form-placeholder-title">Google Form Setup Pending</p>
          <p class="form-placeholder-body">
            Google Form banao aur <code>data.json</code> mein 
            <code>complaint_page.google_form_url</code> update karo.<br><br>
            Form mein yeh fields rakho:<br>
            <strong>Tumhara Naam (optional) · Class/Section · Complaint · Category</strong>
          </p>
          <a href="https://forms.google.com/create" target="_blank" class="btn btn-primary" rel="noopener noreferrer">
            Google Form Banao →
          </a>
        </div>
      `;
    }
  }
}

// ─── Footer ───────────────────────────────────────────────────────
function renderFooter() {
  const el = document.getElementById('footer-content');
  if (!el || !MVPS.data) return;
  const f = MVPS.data.footer;
  el.innerHTML = `
    <p class="footer-tagline">${f.tagline}</p>
    <p class="footer-disclaimer">${f.disclaimer}</p>
  `;
}

// ─── Hamburger Menu ───────────────────────────────────────────────
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const menu = document.getElementById('nav-links');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    btn.textContent = open ? '✕' : '☰';
  });

  // Close on link click
  menu.addEventListener('click', e => {
    if (e.target.classList.contains('nav-link')) {
      menu.classList.remove('open');
      btn.textContent = '☰';
    }
  });
}

// ─── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  initHamburger();
});
