let fuseInstance = null;
let searchData = null;

async function loadSearchAssets() {
  if (fuseInstance) return { fuse: fuseInstance, data: searchData };

  if (!window.Fuse) await import('/vendor/fuse.min.js?v=7.1.0');

  try {
    // Get the current <script type="module" data-search-index="...">
    const currentScript = document.currentScript || [...document.querySelectorAll('script[type="module"]')].find(s => s.dataset.searchIndex);

    if (!currentScript) {
      throw new Error('No <script> with data-search-index found.');
    }

    const indexUrl = currentScript.dataset.searchIndex;
    if (!indexUrl) {
      throw new Error('Missing data-search-index attribute.');
    }

    const res = await fetch(indexUrl, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    searchData = await res.json();

    fuseInstance = new Fuse(searchData, {
      keys: ['title', 'description', 'content', 'tags'],
      threshold: 0.2,
      ignoreLocation: true,
      includeMatches: true,
      minMatchCharLength: 2,
      useExtendedSearch: true,
    });

    return { fuse: fuseInstance, data: searchData };
  } catch (err) {
    console.error('❌ Failed to initialize search index:', err);
    return { fuse: null, data: [] };
  }
}




// Highlight helpers
function highlightMatch(text, indices = []) {
  const frag = document.createDocumentFragment();
  let last = 0;
  for (const [start, end] of indices) {
    if (start > last) frag.appendChild(document.createTextNode(text.slice(last, start)));
    const mark = document.createElement('mark');
    mark.textContent = text.slice(start, end + 1);
    frag.appendChild(mark);
    last = end + 1;
  }
  if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
  return frag;
}

function createSnippet(text, query) {
  const matchTerm = query.toLowerCase();
  const content = text.toLowerCase();
  const matchIndex = content.indexOf(matchTerm);

  if (matchIndex === -1) return null;

  const words = text.split(/\s+/);
  let wordStart = 0;
  let charCount = 0;
  for (let i = 0; i < words.length; i++) {
    charCount += words[i].length + 1;
    if (charCount > matchIndex) {
      wordStart = i;
      break;
    }
  }

  const snippetLength = 3;
  const before = words.slice(Math.max(0, wordStart - snippetLength), wordStart).join(' ');
  const matchWord = words[wordStart] || query;
  const after = words.slice(wordStart + 1, wordStart + 1 + snippetLength).join(' ');

  const span = document.createElement('span');
  span.className = 'result-snippet';
  span.textContent = `... ${before} `;

  const mark = document.createElement('mark');
  mark.textContent = matchWord;
  span.appendChild(mark);
  span.append(` ${after} ...`);

  return span;
}

// Modal Mode
function initSearchModal(fuse) {
  const modal = document.getElementById('search-modal');
  const modalContent = modal?.querySelector('.search-modal-content');
  const input = document.getElementById('search-modal-input');
  const button = document.getElementById('global-search-button');
  const closeBtn = document.getElementById('close-search-modal');
  const results = document.getElementById('search-modal-results');

  if (!modal || !input || !results || !button) return;

  let removeTrap = () => {};
  function trapFocus(container) {
    const focusable = container.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function handle(e) {
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }
    container.addEventListener('keydown', handle);
    return () => container.removeEventListener('keydown', handle);
  }

  function showResults(query) {
    results.innerHTML = '';
    if (!fuse || query.length < 2) return;

    const fuseResults = fuse.search(query);
    if (fuseResults.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No results found';
      results.appendChild(li);
      return;
    }

    for (const { item, matches } of fuseResults.slice(0, 10)) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.url;

      const matchMap = Object.fromEntries(matches.map(m => [m.key, m]));

      const titleSpan = document.createElement('span');
      titleSpan.className = 'result-title';
      const titleMatch = matchMap.title?.indices;
      titleMatch?.length
        ? titleSpan.appendChild(highlightMatch(item.title, titleMatch))
        : titleSpan.textContent = item.title;

      a.appendChild(titleSpan);
      a.appendChild(document.createElement('br'));

      if (matchMap.content?.value) {
        const snippet = createSnippet(item.content, query);
        if (snippet) a.appendChild(snippet);
      }

      li.appendChild(a);
      results.appendChild(li);
    }
  }

  async function openModal() {
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    input.focus();
    removeTrap = trapFocus(modalContent);
  }

  function closeModal() {
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    input.value = '';
    results.innerHTML = '';
    removeTrap();
    button.focus();
  }

  button.addEventListener('click', openModal);
  closeBtn?.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      e.preventDefault(); closeModal();
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault(); openModal();
    }
  });

  input.addEventListener('input', () => {
    const query = input.value.trim();
    showResults(query);
  });
}

// Page Mode
function initSearchPage(fuse) {
  const input = document.getElementById('search-input');
  const container = document.getElementById('search-results');
  if (!input || !container) return;

  const params = new URLSearchParams(window.location.search);
  const qParam = params.get('q') || '';
  let debounceTimer;

  function renderResults(results, query) {
    container.innerHTML = '';
    if (!results || results.length === 0) {
      container.innerHTML = `<p>No results found for <strong>"${query}"</strong>.</p>`;
      return;
    }

    const ul = document.createElement('ul');
    ul.className = 'search-results';

    for (const { item, matches } of results.slice(0, 20)) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = item.url;

      const matchMap = Object.fromEntries(matches.map(m => [m.key, m]));
      const titleSpan = document.createElement('span');
      titleSpan.className = 'result-title';

      const titleMatch = matchMap.title?.indices;
      titleMatch?.length
        ? titleSpan.appendChild(highlightMatch(item.title, titleMatch))
        : titleSpan.textContent = item.title;

      a.appendChild(titleSpan);
      a.appendChild(document.createElement('br'));

      if (matchMap.content?.value) {
        const snippet = createSnippet(item.content || item.description || '', query);
        if (snippet) a.appendChild(snippet);
      }

      li.appendChild(a);
      ul.appendChild(li);
    }

    container.appendChild(ul);
  }

  function search(query) {
    if (!fuse || query.length < 2) {
      container.innerHTML = '';
      return;
    }

    const results = fuse.search(query);
    renderResults(results, query);
  }

  input.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      search(query);
      const newURL = new URL(window.location.href);
      query ? newURL.searchParams.set('q', query) : newURL.searchParams.delete('q');
      window.history.replaceState({}, '', newURL.toString());
    }, 250);
  });

  if (qParam) {
    input.value = qParam;
    search(qParam);
  }
}

// Run once
(async () => {
  const { fuse } = await loadSearchAssets();
  if (!fuse) return;

  initSearchModal(fuse);
  initSearchPage(fuse);
})();
