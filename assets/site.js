/* ==========================================================================
   The Sports·Report — site.js
   讀 #reports-data (build 階段由 __REPORTS_JSON__ 注入) + data/schedule.json
   渲染 Featured / 卡片 / Stats / Ticker / Schedule。
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- helpers ---------- */
  const $  = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  const setText = (key, value) => {
    document.querySelectorAll(`[data-bind="${key}"]`).forEach(el => {
      el.textContent = value == null ? '--' : String(value);
    });
  };

  const fmtDate = (iso) => {
    if (!iso) return '--';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[2]}·${m[3]}` : iso;
  };
  const fmtFullDate = (iso) => {
    if (!iso) return '--';
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[1]} · ${m[2]} · ${m[3]}` : iso;
  };

  const escapeHtml = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* ---------- load data ---------- */
  let reports = [];
  try {
    const raw = (document.getElementById('reports-data') || {}).textContent || '[]';
    // unrendered placeholder fallback (preview before build)
    const text = raw.includes('__REPORTS_JSON__') ? '[]' : raw;
    reports = JSON.parse(text);
  } catch (e) {
    console.error('[site] failed to parse reports-data', e);
    reports = [];
  }

  /* ---------- stats ---------- */
  const totalCount     = reports.length;
  const f1Count        = reports.filter(r => r.league === 'f1').length;
  const worldcupCount  = reports.filter(r => r.league === 'worldcup').length;
  const cpblCount      = reports.filter(r => r.league === 'cpbl' || r.league === 'baseball').length;
  const volleyballCount = reports.filter(r => r.league === 'volleyball').length;
  const dates          = reports.map(r => r.date).filter(Boolean).sort();
  const latestDate     = dates.length ? dates[dates.length - 1] : null;

  setText('totalCount',     String(totalCount).padStart(2, '0'));
  setText('f1Count',        String(f1Count).padStart(2, '0'));
  setText('worldcupCount',  String(worldcupCount).padStart(2, '0'));
  setText('cpblCount',      String(cpblCount).padStart(2, '0'));
  setText('volleyballCount', String(volleyballCount).padStart(2, '0'));
  setText('latestDate',     fmtDate(latestDate));
  setText('issueNo',        String(totalCount).padStart(2, '0'));
  setText('todayDate',      fmtFullDate(new Date().toISOString().slice(0, 10)));

  /* ---------- featured ---------- */
  const featuredEl = $('#featured');

  function renderFeatured(r) {
    const accentMap = { f1: 'F1', baseball: 'BASEBALL', mlb: 'MLB', npb: 'NPB', cpbl: 'CPBL' };
    const leagueLabel = accentMap[r.league] || (r.league || '').toUpperCase();
    const seasonLabel = r.seasonLabel || '';

    const photo = renderPhoto(r, 'rookie portrait', 'photo--tall');

    // small derived stats: gap/pos parsing is loose; if absent we hide cells
    const cells = deriveFeaturedCells(r);

    const chips = [
      { k: 'all',  label: '所有報告', n: totalCount },
      { k: 'f1',   label: 'F1',      n: f1Count },
      { k: 'worldcup', label: 'World Cup', n: worldcupCount },
      { k: 'cpbl', label: 'CPBL',    n: reports.filter(x => x.league === 'cpbl').length },
      { k: 'volleyball', label: 'Volleyball', n: volleyballCount },
    ].filter(c => c.k === 'all' || c.n > 0);

    const rookieTag = r.href ? 'a' : 'div';
    const rookieHref = r.href ? ` href="${escapeHtml(r.href)}"` : '';

    return `
      <${rookieTag} class="rookie"${rookieHref} aria-label="讀取 ${escapeHtml(r.title || 'featured report')}">
        <div class="rookie__inner">
          <div class="rookie__top">
            <span>${escapeHtml(leagueLabel)} · ${escapeHtml(r.tagLabel || r.type || '')}</span>
            <span class="rookie__round">${escapeHtml(seasonLabel || fmtDate(r.date))}</span>
          </div>
          ${photo}
          <div class="rookie__bottom">
            <div class="rookie__title">${escapeHtml(r.title || '')}</div>
            ${r.kicker ? `<div class="rookie__sub">${escapeHtml(r.kicker)}</div>` : ''}
            ${cells.length ? `<div class="rookie__stats">${
              cells.map(([k, v]) => `
                <div class="rookie__stat">
                  <span class="rookie__stat-k">${escapeHtml(k)}</span>
                  <span class="rookie__stat-v">${escapeHtml(v)}</span>
                </div>
              `).join('')
            }</div>` : ''}
          </div>
        </div>
        <div class="rookie__foil">FEAT<br/>URED</div>
      </${rookieTag}>
      <div class="featured__copy">
        <div class="featured__eyebrow">★ Featured · ${escapeHtml(fmtFullDate(r.date))}</div>
        <p class="featured__lead">
          ${r.summary ? `<span class="dropcap">${escapeHtml((r.summary || '').slice(0, 1))}</span>${escapeHtml((r.summary || '').slice(1))}` : ''}
        </p>
        ${r.secondary ? `<p class="featured__lead" style="margin-top:14px;font-size:17px">${escapeHtml(r.secondary)}</p>` : ''}
        <div class="featured__leagues">
          ${chips.map(c => `
            <a class="league-chip" href="#" data-league="${c.k}" data-filter-jump="${c.k}">
              ${escapeHtml(c.label)}
              <span class="league-chip__count">· ${String(c.n).padStart(2, '0')}</span>
            </a>
          `).join('')}
        </div>
        ${r.href ? `<a class="featured__cta" href="${escapeHtml(r.href)}">→ 讀全文</a>` : ''}
      </div>
    `;
  }

  function deriveFeaturedCells(r) {
    // optional fields can drive these. fall back to date / season / league.
    const out = [];
    if (r.date)        out.push(['DATE', fmtDate(r.date)]);
    if (r.seasonLabel) out.push(['SET',  r.seasonLabel.replace(/^.*·\s*/, '').slice(0, 8)]);
    if (r.tagLabel || r.type) out.push(['TYPE', (r.tagLabel || r.type)]);
    return out.slice(0, 3);
  }

  /* ---------- photo helper (image OR placeholder) ---------- */
  function renderPhoto(r, fallbackLabel, modifier = '') {
    const cls = `photo ${modifier}`.trim();
    const placeholder = (r.kicker || r.tagLabel || r.type || fallbackLabel).toString().slice(0, 28);
    if (r.image) {
      const alt = escapeHtml(r.imageAlt || r.title || '');
      const src = escapeHtml(r.image);
      const srcset = r.srcset ? ` srcset="${escapeHtml(r.srcset)}"` : '';
      const sizes = r.sizes ? ` sizes="${escapeHtml(r.sizes)}"` : '';
      return `<div class="${cls}"><img src="${src}"${srcset}${sizes} alt="${alt}" loading="lazy" /></div>`;
    }
    return `<div class="${cls}" data-placeholder="${escapeHtml(placeholder)}"></div>`;
  }

  /* ---------- league + type state ---------- */
  let currentLeague = 'all';
  let currentType = 'all';
  let currentPage = 1;
  const PAGE_SIZE = 12;

  const leagueLabels = {
    all: ['全部賽事', "collect 'em all — 但仍先看清楚屬於哪條線"],
    f1: ['F1 存檔', 'engine notes · 2026'],
    worldcup: ['World Cup 存檔', 'pitch-side briefings'],
    cpbl: ['CPBL 存檔', '白晝球場文章 · 入口仍共用殼'],
    volleyball: ['Volleyball 存檔', 'Vball 線併入同一主版面']
  };

  /* ---------- card grid ---------- */
  const grid = $('#report-grid');
  const empty = $('#empty-state');
  const pager = $('#pager');
  const prevBtn = $('#prev-page');
  const nextBtn = $('#next-page');
  const currentPageEl = $('#current-page');
  const totalPagesEl = $('#total-pages');

  function getFeaturedForScope(league, type) {
    const list = getFilteredReports(league, type);
    return list.find(r => r.latest) || list[0] || null;
  }

  function getFilteredReports(league, type) {
    return reports.filter(r => {
      const leagueMatch = league === 'all' || r.league === league;
      const typeMatch = type === 'all' || r.type === type || r.accent === type;
      return leagueMatch && typeMatch;
    });
  }

  function renderHub() {
    // Update hub title
    const [title, subtitle] = leagueLabels[currentLeague] || leagueLabels.all;
    $('#hub-title').textContent = title;
    $('#hub-subtitle').textContent = subtitle;

    // Render featured
    const featured = getFeaturedForScope(currentLeague, currentType);
    if (!featured) {
      featuredEl.innerHTML = '<div class="featured__loading">尚無報告。</div>';
    } else {
      featuredEl.innerHTML = renderFeatured(featured);
    }

    // Render cards with pagination
    renderCards(featured);
  }

  function renderCards(featured) {
    const featuredHref = featured && featured.href;
    const shouldHideFeaturedCard = currentLeague === 'all' && currentType === 'all';
    const allFiltered = getFilteredReports(currentLeague, currentType)
      .filter(r => !shouldHideFeaturedCard || !featuredHref || r.href !== featuredHref);

    if (!allFiltered.length) {
      grid.innerHTML = '';
      empty.hidden = false;
      pager.hidden = true;
      return;
    }
    empty.hidden = true;

    // Pagination
    const totalPages = Math.ceil(allFiltered.length / PAGE_SIZE);
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageReports = allFiltered.slice(start, end);

    grid.innerHTML = pageReports.map(r => `
      <a class="card" href="${escapeHtml(r.href || '#')}" 
         data-accent="${escapeHtml(r.accent || r.type || '')}"
         data-league="${escapeHtml(r.league || '')}">
        <div class="card__media">${renderCardMedia(r)}</div>
        <div class="card__head">
          <span>${escapeHtml((r.league || '').toUpperCase())} · ${escapeHtml(r.tagLabel || r.type || '')}</span>
          <span>${escapeHtml(fmtDate(r.date))}</span>
        </div>
        <div class="card__body">
          <h3 class="card__title">${escapeHtml(r.title || '')}</h3>
          <p class="card__summary">${escapeHtml(r.summary || '')}</p>
          <div class="card__meta">
            <div class="card__meta-cell"><span>DATE</span> ${escapeHtml(fmtDate(r.date))}</div>
            ${r.seasonLabel ? `<div class="card__meta-cell"><span>SSN</span> ${escapeHtml(r.seasonLabel.split('·').pop().trim().slice(0,8))}</div>` : ''}
          </div>
        </div>
      </a>
    `).join('');

    // Update pager
    if (totalPages > 1) {
      pager.hidden = false;
      currentPageEl.textContent = currentPage;
      totalPagesEl.textContent = totalPages;
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = currentPage === totalPages;
    } else {
      pager.hidden = true;
    }
  }

  function renderCardMedia(r) {
    if (r.image) {
      const alt = escapeHtml(r.imageAlt || r.title || '');
      const src = escapeHtml(r.image);
      // Optional srcset for 1x/2x variants (e.g. "path/image.jpg" + "path/image@2x.jpg")
      const srcset = r.srcset ? ` srcset="${escapeHtml(r.srcset)}"` : '';
      const sizes = r.sizes ? ` sizes="${escapeHtml(r.sizes)}"` : '';
      return `<img src="${src}"${srcset}${sizes} alt="${alt}" loading="lazy" />`;
    }
    return ''; // Empty 16:9 slot with CSS placeholder
  }

  // initial render
  renderHub();

  // league rail clicks
  document.querySelectorAll('.league-rail__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.league-rail__btn').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      currentLeague = btn.dataset.league;
      currentPage = 1;
      renderHub();
    });
  });

  // type chips clicks
  document.querySelectorAll('.type-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-chip').forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      currentType = btn.dataset.type;
      currentPage = 1;
      renderHub();
    });
  });

  // pagination
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderHub();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });
  nextBtn.addEventListener('click', () => {
    currentPage++;
    renderHub();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // featured league chips → jump to league rail
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter-jump]');
    if (!chip) return;
    e.preventDefault();
    const target = chip.dataset.filterJump;
    const btn = $$('.league-rail__btn').find(b => b.dataset.league === target);
    if (btn) btn.click();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- schedule (optional, from data/schedule.json) ---------- */
  fetch('data/schedule.json', { cache: 'no-cache' })
    .then(res => res.ok ? res.json() : [])
    .then(items => renderSchedule(Array.isArray(items) ? items : (items.items || [])))
    .catch(() => { /* file missing — fine, hide section */ });

  function renderSchedule(items) {
    const sec = $('#schedule');
    const strip = $('#schedule-strip');
    if (!items.length) { sec.hidden = true; return; }
    sec.hidden = false;

    const accentByLeague = {
      f1: 'var(--orange)', cpbl: '#27AE60', mlb: 'var(--navy)',
      npb: 'var(--red)', baseball: 'var(--mustard)', worldcup: '#00A86B',
    };

    strip.innerHTML = items.slice(0, 8).map((u, i) => {
      const accent = accentByLeague[(u.league || '').toLowerCase()] || 'var(--mustard)';
      return `
        <div class="ticket" style="--ticket-accent: ${accent}">
          <div class="ticket__perf"></div>
          <div class="ticket__date">
            <span class="ticket__day">${escapeHtml(u.day || '')}</span>
            <span class="ticket__num">${escapeHtml(u.date || '')}</span>
          </div>
          <div class="ticket__body">
            <div class="ticket__league">${escapeHtml((u.league || '').toUpperCase())} · ${escapeHtml(u.round || '')}</div>
            <div class="ticket__name">${escapeHtml(u.name || '')}</div>
            ${u.city ? `<div class="ticket__city">@ ${escapeHtml(u.city)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // ticker next-event
    const next = items[0];
    if (next) {
      const slot = $('[data-slot="nextEvent"]');
      if (slot) {
        slot.hidden = false;
        slot.querySelector('[data-bind="nextEvent"]').textContent =
          `${(next.name || '').toUpperCase()} · ${next.date || ''}`;
      }
    }

    // week label = first item's date prefix
    setText('weekLabel', `WK · ${(next && next.date) || ''}`);
  }

  /* ---------- TWEAKS: filter strength selector (small floating control) ---------- */
  // built-in mini control to demo halftone filter levels
  const tweakBar = document.createElement('div');
  tweakBar.className = 'tweak-mini';
  tweakBar.innerHTML = `
    <span>濾鏡</span>
    <button data-strength="off">關</button>
    <button data-strength="light">輕</button>
    <button data-strength="medium" class="is-active">標準</button>
    <button data-strength="strong">強</button>
  `;
  Object.assign(tweakBar.style, {
    position: 'fixed', bottom: '14px', right: '14px', zIndex: 50,
    background: 'var(--cream)', border: '2px solid var(--ink)', padding: '6px 10px',
    fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '.16em',
    boxShadow: '4px 4px 0 var(--ink)', display: 'flex', gap: '6px', alignItems: 'center',
  });
  document.body.appendChild(tweakBar);
  tweakBar.querySelectorAll('button').forEach(b => {
    Object.assign(b.style, {
      border: '1px solid var(--ink)', background: 'transparent', cursor: 'pointer',
      padding: '2px 6px', fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
    });
    b.addEventListener('click', () => {
      const s = b.dataset.strength;
      document.documentElement.dataset.filterStrength = s === 'medium' ? '' : s;
      tweakBar.querySelectorAll('button').forEach(x => {
        x.classList.toggle('is-active', x === b);
        x.style.background = (x === b) ? 'var(--ink)' : 'transparent';
        x.style.color      = (x === b) ? 'var(--cream)' : 'var(--ink)';
      });
    });
    if (b.classList.contains('is-active')) {
      b.style.background = 'var(--ink)'; b.style.color = 'var(--cream)';
    }
  });
})();
