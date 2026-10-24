/* ===================================================================
   TRENDS FOR SALE (TFS) - TECHNICAL BLOG CONTROLLER
   =================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const articles = window.TFS_BLOG_ARTICLES || [];

  const searchInput = document.getElementById('blog-search');
  const clearSearchBtn = document.getElementById('clear-search-btn');
  const filterPills = document.querySelectorAll('.filter-pill');
  const articleGrid = document.getElementById('article-grid');
  const noArticles = document.getElementById('no-articles-found');
  const featuredBox = document.getElementById('featured-article-container');

  // Reader elements
  const readerModal = document.getElementById('reader-modal');
  const readerCloseBtn = document.getElementById('reader-close-btn');
  const readerBadge = document.getElementById('reader-badge');
  const readerReadTime = document.getElementById('reader-read-time');
  const readerTitle = document.getElementById('reader-title');
  const readerAuthorName = document.getElementById('reader-author-name');
  const readerAuthorRole = document.getElementById('reader-author-role');
  const readerDate = document.getElementById('reader-date');
  const readerBody = document.getElementById('reader-body');
  const readerToolName = document.getElementById('reader-tool-name');
  const readerToolLink = document.getElementById('reader-tool-link');

  let activeCategory = 'all';

  // -----------------------------------------------------------------
  // 1. Render Featured Article
  // -----------------------------------------------------------------
  function renderFeatured() {
    if (!featuredBox) return;
    const feat = articles.find(a => a.featured) || articles[0];
    if (!feat) return;

    featuredBox.innerHTML = `
      <div class="glass-card featured-card" data-id="${feat.id}">
        <div class="featured-meta-row">
          <span class="badge badge-pulse">Featured Guide</span>
          <span class="badge badge-accent">${feat.categoryLabel}</span>
          <span class="badge">${feat.readTime}</span>
        </div>
        <h2 class="featured-title">${feat.title}</h2>
        <p class="featured-summary">${feat.summary}</p>
        <div class="tag-row">
          ${feat.tags.map(t => `<span class="article-tag">${t}</span>`).join('')}
        </div>
        <div class="featured-footer">
          <div class="author-chip">
            <div class="author-avatar">${feat.author.split(' ').map(n=>n[0]).join('')}</div>
            <div class="author-info">
              <span class="author-name">${feat.author} &bull; <span style="font-weight: 400; color: var(--text-muted);">${feat.authorRole}</span></span>
              <span class="post-date">Reviewed by ${feat.reviewedBy} &bull; ${feat.date}</span>
            </div>
          </div>
          <button class="btn btn-primary btn-sm">Read Complete Deep-Dive &rarr;</button>
        </div>
      </div>
    `;

    featuredBox.querySelector('.featured-card').addEventListener('click', () => {
      openReader(feat.id);
    });
  }

  // -----------------------------------------------------------------
  // 2. Render Article Grid with Filtering & Search
  // -----------------------------------------------------------------
  function renderArticles() {
    if (!articleGrid) return;
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (clearSearchBtn) {
      clearSearchBtn.style.display = query.length > 0 ? 'block' : 'none';
    }

    const filtered = articles.filter(a => {
      const matchCat = activeCategory === 'all' || a.category === activeCategory;
      const matchQuery = !query ||
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        a.tags.some(t => t.toLowerCase().includes(query));
      return matchCat && matchQuery;
    });

    articleGrid.innerHTML = '';

    if (filtered.length === 0) {
      if (noArticles) noArticles.style.display = 'block';
      return;
    }

    if (noArticles) noArticles.style.display = 'none';

    filtered.forEach(art => {
      const card = document.createElement('div');
      card.className = 'glass-card article-card';
      card.setAttribute('data-id', art.id);
      card.innerHTML = `
        <div class="article-card-top">
          <span class="article-category">${art.categoryLabel}</span>
          <span class="read-time">${art.readTime}</span>
        </div>
        <h3 class="article-card-title">${art.title}</h3>
        <p class="article-card-summary">${art.summary}</p>
        <div class="tag-row">
          ${art.tags.slice(0, 3).map(t => `<span class="article-tag">${t}</span>`).join('')}
        </div>
        <div class="article-card-foot">
          <span class="post-date">${art.date}</span>
          <span class="read-link">Read Guide &rarr;</span>
        </div>
      `;

      card.addEventListener('click', () => openReader(art.id));
      articleGrid.appendChild(card);
    });
  }

  // Search input listener
  if (searchInput) {
    searchInput.addEventListener('input', renderArticles);
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      renderArticles();
      searchInput.focus();
    });
  }

  // Category pills listener
  filterPills.forEach(pill => {
    pill.addEventListener('click', () => {
      filterPills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeCategory = pill.getAttribute('data-cat');
      renderArticles();
    });
  });

  // -----------------------------------------------------------------
  // 3. Article Reader Modal Controller
  // -----------------------------------------------------------------
  function openReader(articleId) {
    const art = articles.find(a => a.id === articleId);
    if (!art || !readerModal) return;

    if (readerBadge) readerBadge.textContent = art.categoryLabel;
    if (readerReadTime) readerReadTime.textContent = art.readTime;
    if (readerTitle) readerTitle.textContent = art.title;
    if (readerAuthorName) readerAuthorName.textContent = art.author;
    if (readerAuthorRole) readerAuthorRole.textContent = art.authorRole;
    if (readerDate) readerDate.textContent = `${art.date} &bull; Reviewed by ${art.reviewedBy}`;
    if (readerBody) readerBody.innerHTML = art.content;

    if (readerToolLink && readerToolName) {
      readerToolLink.href = art.toolLink;
      readerToolName.textContent = art.toolName + ' \u2192';
    }

    readerModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    readerModal.scrollTop = 0;
    history.replaceState(null, '', `#${art.id}`);
  }

  function closeReader() {
    if (!readerModal) return;
    readerModal.classList.remove('open');
    document.body.style.overflow = '';
    history.replaceState(null, '', window.location.pathname);
  }

  if (readerCloseBtn) {
    readerCloseBtn.addEventListener('click', closeReader);
  }

  // Close on outside click
  if (readerModal) {
    readerModal.addEventListener('click', (e) => {
      if (e.target === readerModal) closeReader();
    });
  }

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && readerModal && readerModal.classList.contains('open')) {
      closeReader();
    }
  });

  // -----------------------------------------------------------------
  // 4. Initial Load & Deep Linking Check
  // -----------------------------------------------------------------
  renderFeatured();
  renderArticles();

  // Check URL hash e.g. #can-bus-analysis
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash) {
    const targetArt = articles.find(a => a.id === initialHash);
    if (targetArt) {
      setTimeout(() => openReader(targetArt.id), 200);
    }
  }
});