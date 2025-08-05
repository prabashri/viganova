// src/types/HeadProps.ts
export interface CollectionItem {
  name: string;
  url: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  speakable: boolean;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface HeadProps {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'webpage' | 'article' | 'collection' | 'list' | 'person' | 'product' | 'evnt' | 'publication';
  url?: string;
  canonicalUrl?: string;
  siteName?: string;
  authors: { id: string; slug: string; url: string; name: string; data: any }[] // or a more specific type if available
  // authorName?: string;
  // authorUrl?: string;
  publishedAt?: string;
  updatedAt?: string;
  index?: boolean;
  keywords?: string[];
  faq?: FaqItem[];
  // breadcrumb?: BreadcrumbItem[];  
  showBreadcrumb?: boolean; // NEW: To control breadcrumb visibility
  listItems?: CollectionItem[];
}
