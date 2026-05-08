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
  const totalCount    = reports.length;
  const f1Count       = reports.filter(r => r.league === 'f1').length;
  const baseballCount = reports.filter(r => r.league === 'baseball').length;
  const dates         = reports.map(r => r.date).filter(Boolean).sort();
  const latestDate    = dates.length ? dates[dates.length - 1] : null;

  setText('totalCount',    String(totalCount).padStart(2, '0'));
  setText('f1Count',       String(f1Count).padStart(2, '0'));
  setText('baseballCount', String(baseballCount).padStart(2, '0'));
  setText('latestDate',    fmtDate(latestDate));
  setText('issueNo',       String(totalCount).padStart(2, '0'));
  setText('todayDate',     fmtFullDate(new Date().toISOString().slice(0, 10)));

  /* ---------- featured ---------- */
  const featuredEl = $('#featured');
  const featured = reports.find(r => r.featured) || reports.find(r => r.latest) || reports[0];

  if (!featured) {
    featuredEl.innerHTML = '<div class="featured__loading">尚無報告。</div>';
  } else {
    featuredEl.innerHTML = renderFeatured(featured);
  }

  function renderFeatured(r) {
    const accentMap = { f1: 'F1', baseball: 'BASEBALL', mlb: 'MLB', npb: 'NPB', cpbl: 'CPBL' };
    const leagueLabel = accentMap[r.league] || (r.league || '').toUpperCase();
    const seasonLabel = r.seasonLabel || '';
    const featuredHref = escapeHtml(r.href || '#');

    const photo = renderPhoto(r, 'rookie portrait', 'photo--tall');

    // small derived stats: gap/pos parsing is loose; if absent we hide cells
    const cells = deriveFeaturedCells(r);

    const chips = [
      { k: 'all',  label: '所有報告', n: totalCount },
      { k: 'f1',   label: 'F1',      n: f1Count },
      { k: 'mlb',  label: 'MLB',     n: reports.filter(x => x.league === 'mlb').length },
      { k: 'npb',  label: 'NPB',     n: reports.filter(x => x.league === 'npb').length },
      { k: 'cpbl', label: 'CPBL',    n: reports.filter(x => x.league === 'cpbl').length },
    ].filter(c => c.k === 'all' || c.n > 0 || c.k === 'f1');

    return `
      <a class="rookie-link" href="${featuredHref}" aria-label="${escapeHtml(r.title || 'Featured report')}">
        <div class="rookie">
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
        </div>
      </a>
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
      return `<div class="${cls}"><img src="${escapeHtml(r.image)}" alt="${alt}" loading="lazy" /></div>`;
    }
    return `<div class="${cls}" data-placeholder="${escapeHtml(placeholder)}"></div>`;
  }

  /* ---------- card grid ---------- */
  const grid = $('#report-grid');
  const empty = $('#empty-state');

  function renderCards(filter) {
    const list = reports
      .filter(r => !r.featured)        // featured already shown
      .filter(r => matchesFilter(r, filter));

    if (!list.length) {
      grid.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    grid.innerHTML = list.map(r => `
      <a class="card" href="${escapeHtml(r.href || '#')}" data-accent="${escapeHtml(r.accent || r.type || '')}">
        <div class="card__head">
          <span>${escapeHtml((r.league || '').toUpperCase())} · ${escapeHtml(r.tagLabel || r.type || '')}</span>
          <span>${escapeHtml(fmtDate(r.date))}</span>
        </div>
        ${renderPhoto(r, 'photo')}
        <div class="card__body">
          <h3 class="card__title">${escapeHtml(r.title || '')}</h3>
          <p class="card__summary">${escapeHtml(r.summary || '')}</p>
          <div class="card__meta">
            <div class="card__meta-cell"><span>SET</span> ${String(totalCount).padStart(2,'0')}</div>
            <div class="card__meta-cell"><span>NO</span> ${escapeHtml(reports.indexOf(r).toString().padStart(2,'0'))}</div>
            ${r.seasonLabel ? `<div class="card__meta-cell"><span>SSN</span> ${escapeHtml(r.seasonLabel.split('·').pop().trim())}</div>` : ''}
          </div>
        </div>
      </a>
    `).join('');
  }

  function matchesFilter(r, filter) {
    if (!filter || filter === 'all') return true;
    if (['f1', 'baseball', 'mlb', 'npb', 'cpbl'].includes(filter)) return r.league === filter;
    if (['preview', 'race', 'briefing'].includes(filter))           return r.type === filter || r.accent === filter;
    return true;
  }

  // initial render
  renderCards('all');

  // filter clicks
  $('#filter-bar').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    $$('.filter-btn').forEach(b => b.classList.toggle('is-active', b === btn));
    renderCards(btn.dataset.filter);
  });

  // featured league chips → jump filter
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-filter-jump]');
    if (!chip) return;
    e.preventDefault();
    const target = chip.dataset.filterJump;
    const btn = $$(`#filter-bar .filter-btn`).find(b => b.dataset.filter === target);
    if (btn) btn.click();
    document.getElementById('filter-bar').scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      f1: 'var(--orange)', cpbl: 'var(--green)', mlb: 'var(--navy)',
      npb: 'var(--red)', baseball: 'var(--mustard)',
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
