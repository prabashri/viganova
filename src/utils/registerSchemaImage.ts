// utils/registerSchemaImage.ts
type SchemaImageItem = {
  url: string;
};

const schemaImageSet = new Set<string>();

/**
 * Register a schema image URL for later inclusion.
 */
export function registerSchemaImage(url: string) {
  if (url) {
    schemaImageSet.add(url);
  }
}

/**
 * Get all registered schema images as array of objects.
 */
export function getSchemaImages(): SchemaImageItem[] {
  return Array.from(schemaImageSet).map(url => ({ url }));
}

/**
 * Clear schema images (e.g. per page render)
 */
export function clearSchemaImages() {
  schemaImageSet.clear();
}
