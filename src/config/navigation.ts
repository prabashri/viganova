// File: /src/config/navigation.ts

/**
 * ========= SITE NAVIGATION CONFIG =========
 * Update this config to control your site's navigation:
 * ✅ Logos for desktop and mobile
 * ✅ Primary navigation items (with dropdown/mega support)
 * ✅ Call-to-action (CTA) buttons
 * ✅ Secondary navigation (for tools/docs/blog subpages)
 * ✅ Navigation style (glassy, layout width, separator, etc.)
 */

import type {
  NavItem,
  NavSubItem,
  MegaMenuItem,
  NavStyleConfig,
  LogoConfig,
  CtaButton
} from '../types/navigation.ts';

/** LOGO CONFIGURATION */
export const siteLogo: LogoConfig = {
  desktopSvg: true, // add svg logo in config/DesktopLogo.astro - it has high priority
  desktop: '', // Path to desktop logo image [svg or png]
  mobileSvg: true,
  mobile: '', // Path to mobile logo image [svg or png]
  withText: false,
};

/** PRIMARY NAVIGATION ITEMS */
export const siteNav: NavItem[] = [

  { label: 'Home', href: '/', type: 'link', menuId: '', 
    icon: '', iconName: 'home-2', iconUrl: '', iconLocation: 'left', iconSize: 'medium', iconClass: '', className: '',
    title: 'Go to homepage', altText: 'Home icon', ariaLabel: 'Home', variant: 'nav', description: 'Navigate to the homepage of our site' },

  {
    label: 'Tools',
    href: '/tools/',
    type: 'dropdown',
    iconName: 'clamp',
    menuId: 'dropdown-tools',
    content: [
      {
        label: 'Item 1',
        href: '/#',
        icon: '/icons/width.svg',
        altText: 'Width icon',
        title: 'Tool for responsive width'
      },
      {
        label: 'Item 2',
        href: '/#',
        icon: '/icons/margin.svg',
        altText: 'Margin icon',
        title: 'Tool for margin calculation'
      },
      {
        label: 'Item 3',
        href: '/#',
        title: 'Another tool',
        icon: '/icons/width.svg',
      }
    ]
  },

  { label: 'Docs', href: '/docs/', type: 'link', menuId: '', icon: '', title: 'Go to docs', altText: 'Docs icon', ariaLabel: 'Docs', variant: 'nav' },
  { label: 'Blog', href: '/blog/', type: 'link', menuId: '', icon: '', title: 'Go to blog', altText: 'Blog icon', ariaLabel: 'Blog', variant: 'nav' },

  {
    label: 'Resources',
    type: 'mega',
    menuId: 'mega-resources',
    columns: [
      {
        title: 'Column 1',
        items: [
          {
            label: 'Item 1',
            href: '/#',
            icon: '/icons/width.svg',
            altText: 'Width icon',
            title: 'Tool for responsive width'
          },
          {
            label: 'Item 2',
            href: '/#',
            icon: '/icons/margin.svg',
            altText: 'Margin icon',
            title: 'Margin calculation'
          },
          { label: 'Item 3', href: '/#', title: 'Item without icon' }
        ]
      },
      {
        title: 'Column 2',
        items: [
          {
            label: 'Item 1',
            href: '/#',
            icon: '/icons/font.svg',
            altText: 'Font icon',
            title: 'Font clamp generator'
          },
          {
            label: 'Item 2',
            href: '/#',
            icon: '/icons/line-height.svg',
            altText: 'Line-height icon',
            title: 'Line height visualizer'
          }
        ]
      },
      {
        title: 'Column 3',
        items: [
          {
            label: 'Item 1',
            href: '/#',
            image: '/icons/font.svg',
            altText: 'Font image',
            layout: 'card',
            description: 'Card layout with image and description',
            title: 'Visual card menu item'
          }
        ]
      }
    ]
  },

  { label: 'Contact', href: '/contact', title: 'Get in touch with us' }
];

/** SEARCH ICON ENABLED */
export const searchIconEnable = true; // Enable search icon in header

/** PRIMARY CTA BUTTONS */
export const primaryCTA: CtaButton[] = [  
  {
    label: 'Try Free',
    href: '/#',
    variant: 'secondary',
    type: 'link',
    menuId: '',
    icon: '',
    title: 'Try our service for free',
    altText: 'Try Free icon',
    ariaLabel: 'Try Free',
  },
  {
    label: 'Buy Now $59',
    href: '/#',
    variant: 'primary',
    title: 'Buy modern AstroWEB theme',
    altText: 'Buy Now icon',
    ariaLabel: 'Buy Now',
  }
];

/** SECONDARY NAVIGATION (e.g., inside Docs or Tools subpages) */
export const secondaryNavigation: NavItem[] = [
  /*
  { label: 'Text 1', href: '/#', title: 'More info on topic 1', type: 'link', },
  { label: 'Text 2', href: '/#', title: 'Learn more about topic 2', type: 'link', },
  { label: 'Text 3', href: '/#', title: 'Discover topic 3', type: 'link', }
   */
];

/** NAVIGATION BAR STYLE OPTIONS */
export const headerStyle: NavStyleConfig = {
  mode: 'glassy',               // 'default' | 'glassy' | 'transparent' | 'primary-light' | 'primary-dark' | 'custom'
  width: 'sitewidth',          // fullwidth | sitewidth
  position: 'sticky',          // static | sticky | fixed
  scrollBehavior: 'none',      // none | hide-on-scroll | show-on-scroll-up
  separator: 'none'          // none | border | shadow (adds bottom split)
};
