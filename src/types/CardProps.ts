// src/types/CardProps.ts
export interface CardProps {
  link?: string;
  linkAriaLabel?: string;

  image?: string;
  imageAlt?: string;
  afterImage?: string;

  icon?: string;
  iconTitle?: string;
  iconAriaLabel?: string;

  title: string;
  afterTitle?: string;

  date?: string;
  afterDate?: string;

  description?: string;
  afterDescription?: string;

  author?: string;
  afterAuthor?: string;

  lastRow?: string;

  orientation?: 'horizontal' | 'vertical';
  imageSize?: 150 | 320;

  roleType?: 'article' | 'list' | 'none'; // NEW

  loading?: 'eager' | 'lazy'; // NEW

  className?: string;
  imageClassName?: string; // NEW

  // NEW: For related tags, categories, related entries, etc.
  otherEntries?: {
    name: string;
    label: string;
    url: string;
  }[];
}
