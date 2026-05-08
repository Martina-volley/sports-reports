function parseReports() {
  const node = document.getElementById("reports-data");
  if (!node) return [];

  try {
    const data = JSON.parse(node.textContent || "[]");
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to parse reports data:", error);
    return [];
  }
}

function formatDate(dateString) {
  return dateString.replaceAll("-", ".");
}

function createReportCard(report) {
  const anchor = document.createElement("a");
  anchor.className = "report-card";
  anchor.href = report.href;
  anchor.dataset.league = report.league;
  anchor.dataset.type = report.type;
  anchor.dataset.accent = report.accent || report.league;

  anchor.innerHTML = `
    <div class="report-card__top">
      <span class="report-card__tag">${report.tagLabel || report.type}</span>
      <span class="report-card__date">${formatDate(report.date)}</span>
    </div>
    <div class="report-card__kicker">${report.kicker || report.league}</div>
    <h3 class="report-card__title">${report.title}</h3>
    <p class="report-card__summary">${report.summary}</p>
    <p class="report-card__secondary">${report.secondary || ""}</p>
    <div class="report-card__footer">
      <span class="report-card__meta">${report.seasonLabel || ""}</span>
      <span class="report-card__arrow" aria-hidden="true">↗</span>
    </div>
  `;

  return anchor;
}

function renderFeatured(report) {
  const target = document.getElementById("featured-report");
  if (!target || !report) return;

  target.innerHTML = `
    <div class="spotlight__label">Featured Report</div>
    <div class="spotlight-card">
      <div class="spotlight-card__tagline">${report.kicker || "Latest Report"}</div>
      <h2 class="spotlight-card__title">${report.title}</h2>
      <p class="spotlight-card__summary">${report.summary}</p>
      <p class="report-card__secondary">${report.secondary || ""}</p>
      <div class="spotlight-card__footer">
        <span>${report.seasonLabel || ""}</span>
        <a href="${report.href}">前往閱讀</a>
      </div>
    </div>
  `;
}

function renderStats(reports) {
  const total = reports.length;
  const f1 = reports.filter((report) => report.league === "f1").length;
  const baseball = reports.filter((report) => report.league === "baseball").length;
  const latest = reports[0];

  document.getElementById("total-count").textContent = String(total);
  document.getElementById("f1-count").textContent = String(f1);
  document.getElementById("baseball-count").textContent = String(baseball);
  document.getElementById("latest-date").textContent = latest ? formatDate(latest.date) : "--";
}

function renderReports(reports, activeFilter = "all") {
  const grid = document.getElementById("report-grid");
  const emptyState = document.getElementById("empty-state");
  if (!grid || !emptyState) return;

  grid.innerHTML = "";
  const filtered = reports.filter((report) => {
    if (activeFilter === "all") return true;
    return report.league === activeFilter || report.type === activeFilter;
  });

  filtered.forEach((report) => {
    grid.appendChild(createReportCard(report));
  });

  emptyState.hidden = filtered.length !== 0;
}

function bindFilters(reports) {
  const bar = document.getElementById("filter-bar");
  if (!bar) return;

  bar.addEventListener("click", (event) => {
    const button = event.target.closest(".filter-btn");
    if (!button) return;

    const filter = button.dataset.filter || "all";
    bar.querySelectorAll(".filter-btn").forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });
    renderReports(reports, filter);
  });
}

function init() {
  const reports = parseReports().sort((a, b) => b.date.localeCompare(a.date));
  if (!reports.length) return;

  const featured = reports.find((report) => report.featured) || reports[0];
  renderFeatured(featured);
  renderStats(reports);
  renderReports(reports);
  bindFilters(reports);
}

document.addEventListener("DOMContentLoaded", init);
