import { getCollectionUrl } from './getCollectionUrl';
import { siteDefaults } from '../config/siteDefaults';
import modifiedDatesJson from '../data/modified-dates.json';
import type { CardProps } from '../types/CardProps';

function getModifiedDateKey(entry: any) {
  const key = `${entry.collection}/${entry.slug ?? entry.id}`;
  return (modifiedDatesJson as Record<string, string>)[key]
    ?? entry.data.lastModified
    ?? entry.data.publishedDate
    ?? entry.data.date;
}

interface MapEntryToCardOptions {
  currentEntryParam: string;   // e.g. current tag or category
  entryType: string;           // "tags" or "categories"
  fieldName: string;           // "tags" or "categories" in frontmatter
  metaMap: Map<string, { name: string; title?: string; description?: string; image?: string; url?: string }>;
}

export function mapEntryToCard(
  entry: any,
  index: number,
  { currentEntryParam, entryType, fieldName, metaMap }: MapEntryToCardOptions
): CardProps {
  
  const postDate = getModifiedDateKey(entry);

interface OtherEntry {
    name: string;
    label: string;
    url: string;
}

const otherEntries: OtherEntry[] = (entry.data?.[fieldName] as string[] || [])
    .filter((v: string) => typeof v === 'string' && v.toLowerCase() !== currentEntryParam)
    .map((v: string): OtherEntry => {
        const lowerName = v.toLowerCase();
        const meta = metaMap.get(lowerName);
        return {
            name: lowerName,
            label: meta?.title ?? v.charAt(0).toUpperCase() + v.slice(1),
            url: meta?.url ?? `/${entryType}/${lowerName}/`
        };
    })
    .sort((a: OtherEntry, b: OtherEntry) => a.label.localeCompare(b.label));

  return {
    link: getCollectionUrl(
      entry.collection,
      typeof entry.data.slug === "string" ? entry.data.slug : String(entry.id)
    ),
    linkAriaLabel: `View post: ${entry.data?.title ?? "Untitled"}`,
    image: entry.data?.heroImage ?? siteDefaults.image,
    imageAlt: entry.data?.heroImageAlt ?? entry.data?.title ?? 'Post image',
    otherEntries,
    title: entry.data?.title ?? 'Untitled',
    description: entry.data?.description ?? '',
    date: postDate
      ? new Date(postDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: '2-digit'
        })
      : '',
    orientation: 'vertical',
    imageSize: 320,
    roleType: 'list',
    loading: index < 3 ? 'eager' : 'lazy'
  };
}
