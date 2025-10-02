// File: /src/types/navigation.ts
// Types used in navigation config for the NViewsWeb Astro theme.

/**
 * Logo configuration
 */
export type LogoConfig = {
    desktopSvg: boolean; // Whether to use an SVG logo for desktop
    mobileSvg?: boolean; // Whether to use an SVG logo for mobile
  desktop?: string;        // Path to desktop logo component or image (e.g., 'components/logo/DesktopLogo.astro' or '/logo.svg')
  withText: boolean;      // Whether logo includes brand name text
  mobile?: string;         // Path to mobile logo component or image
};
export type Variant = 'nav' | 'plain' | 'primary' | 'secondary' | 'ghost';
/**
 * Primary/secondary navigation item
 * Used for top-level nav, dropdowns, and mega menu items.
 */
export type NavItem = {
  label: string;
  href?: string;
  type?: 'link' | 'dropdown' | 'mega';
  menuId?: string;
  content?: NavSubItem[];
  columns?: MegaMenuItem[];
  icon?: string;
    iconName?: string;
  iconUrl?: string; // Optional icon path (can be SVG or image)
  iconLocation?: 'left' | 'right'; // Position of icon relative to text
iconSize?: 'small' | 'medium' | 'large'; // Size of the icon 16 | 24 | 32
iconClass?: string; // Additional classes for the icon
className?: string; // Additional classes for the button
  title?: string;
  description?: string;
  variant?: Variant;
  altText?: string;       // For icon/image alt text
  ariaLabel?: string;     // ARIA label
  external?: boolean;     // External link marker
  
};


/**
 * Item used inside dropdowns or mega menu columns.
 */
export type NavSubItem = {
  label: string;                       // Display label
  href: string;                        // Target URL
  icon?: string;                       // Optional icon path
  iconName?: string;
  iconLocation?: 'left' | 'right'; // Position of icon relative to text
iconSize?: 'small' | 'medium' | 'large'; // Size of the icon
iconClass?: string; // Additional classes for the icon
className?: string; // Additional classes for the button
  image?: string;                      // Optional image path (for card layout)
  layout?: 'card' | 'left' | 'right';  // Optional layout style (used in mega menu)
  imageSize?: 'thumbnail' | 'small' ; // Size of the image thumbnail width 150px, small width 300px
  description?: string;                // Short description or tooltip
  altText?: string;                    // alt text for image/icon (for accessibility)
  title?: string;                      // Tooltip title (optional, shown on hover or for screen readers)
  ariaLabel?: string;                  // ARIA label override
  external?: boolean;                  // If true, renders as external link (target="_blank", rel="noopener")
  variant?: Variant;
};


/**
 * Mega menu column
 * Each column contains a title and a group of NavSubItems.
 */
export type MegaMenuItem = {
  title: string;              // Heading shown above the column
  items: NavSubItem[];        // Menu items in this column
};

/**
 * CTA button configuration for primary nav
 */
export type CtaButton = {
  label: string;                    // Button text
  href: string;                     // Button URL
  type?: 'link';
  variant: Variant; // Visual style
  menuId?: string;
  icon?: string;
  iconSvg?: string;
  iconUrl?: string; // Optional icon path (can be SVG or image)
  iconLocation?: 'left' | 'right'; // Position of icon relative to text
iconSize?: 'small' | 'medium' | 'large'; // Size of the icon
iconClass?: string; // Additional classes for the icon
className?: string; // Additional classes for the button
  title?: string;
  description?: string;  
  altText?: string;       // For icon/image alt text
  ariaLabel?: string;     // ARIA label
};

/**
 * Navigation style and behavior
 */
export type NavStyleConfig = {
  mode: 'default' | 'glassy' | 'transparent' | 'base-00' | 'base-90' | 'primary-lighter-x' | 'primary-lighter' | 'primary-darker' | 'primary-darker-x' | 'custom'; // Visual style of the nav background
  width: 'sitewidth' | 'fullwidth';             // Layout container width
  position: 'static' | 'sticky' | 'fixed';      // CSS position of nav
  scrollBehavior?: 'none' | 'hide-on-scroll' | 'show-on-scroll-up'; // Optional scroll behavior
  separator?: 'none' | 'shadow' | 'border';     // Optional visual separator at bottom
};
