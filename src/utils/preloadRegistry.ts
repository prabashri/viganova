// utils/preloadRegistry.ts
type PreloadItem = {
  src: string;
  media?: string;
};

const preloadSet = new Map<string, PreloadItem>();

export function registerPreloadImage(item: PreloadItem) {
  const key = `${item.src}|${item.media ?? ''}`;
  preloadSet.set(key, item);
}

export function getPreloadImages(): PreloadItem[] {
  return Array.from(preloadSet.values());
}

export function clearPreloadImages() {
  preloadSet.clear();
}
