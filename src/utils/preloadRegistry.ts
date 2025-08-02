// utils/preloadRegistry.ts
type PreloadItem = {
  src: string;
  media?: string;
  fetchPriority?: 'high' | 'low' | 'auto';
};

const preloadSet = new Map<string, PreloadItem>();

export function registerPreloadImage(item: PreloadItem) {
  const key = `${item.src}|${item.media ?? ''}|${item.fetchPriority ?? 'auto'}`;
  preloadSet.set(key, item);
}

export function getPreloadImages(): PreloadItem[] {
  return Array.from(preloadSet.values());
}

export function clearPreloadImages() {
  preloadSet.clear();
}
