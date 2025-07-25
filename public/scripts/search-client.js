// src/scripts/search-client.js
let fuseInstance = null;
let searchData = null;

// 🔁 This line will be patched during the build (e.g., "search-index.abcd12.json")
const searchIndex = "/search-index.5un4j3.json";

export async function loadSearchAssets() {
  if (fuseInstance) return { fuse: fuseInstance, data: searchData };

  // ✅ Load Fuse.js dynamically if not already available
  if (!window.Fuse) {
    try {
      await import('/vendor/fuse.min.js?v=7.1.0');
    } catch (err) {
      console.error('❌ Failed to load Fuse.js:', err);
      return { fuse: null, data: [] };
    }
  }

  try {
    const response = await fetch(searchIndex, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();

    searchData = json;
    fuseInstance = new Fuse(json, {
      keys: ['title', 'description', 'content', 'tags'],
      threshold: 0.2,
      ignoreLocation: true,
      includeMatches: true,
      minMatchCharLength: 2,
      useExtendedSearch: true,
    });

    return { fuse: fuseInstance, data: searchData };
  } catch (err) {
    console.error('❌ Failed to load search index:', err);
    return { fuse: null, data: [] };
  }
}
