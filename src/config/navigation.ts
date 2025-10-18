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
import { buildWhatsAppLink } from "@/utils/whatsapp";
import type {
  NavItem,
  NavSubItem,
  MegaMenuItem,
  NavStyleConfig,
  LogoConfig,
  CtaButton
} from '@/types/navigation.ts';
// Intent A: Start process (share docs)
const waStartHref = buildWhatsAppLink({
  phone: '',
  text:
    "Hi VerifiedApostille! I want to start the apostille process by sharing my certificates/documents.",
  source: "Hero • Start Apostille",
});

// Intent B: Get quote (consult first)
const waQuoteHref = buildWhatsAppLink({
  phone: '',
  text:
    "Hi VerifiedApostille! I need a consultation and price/timeline quote for apostille services.",
  source: "Hero • Free Quote",
});
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
    icon: '', iconName: 'home-2', iconUrl: '', iconLocation: 'left', iconSize: 'large', iconClass: '', className: '',
    title: 'Go to homepage', altText: 'Home icon', ariaLabel: 'Home', variant: 'nav', description: 'Navigate to the homepage of our site' 
  },
  /*
  {
    label: 'Apostille Services',
    href: '/services/',
    type: 'dropdown',
    iconName: '',
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
  */
  { label: 'Explore Apostille Process', href: '/resources/', type: 'link', menuId: '', icon: '', iconName: 'idea-2', iconUrl: '', iconLocation: 'left', iconSize: 'large', iconClass: '', className: '', title: 'Go to apostille resources', altText: 'idea icon - bulb with shining light', ariaLabel: 'Informations', variant: 'nav', description: 'List of resources about the apostille process' },
 

  {
    label: 'Apostille Services',
    type: 'mega',
    menuId: 'mega-resources', iconName: 'stamp',
    iconUrl: '',
    iconLocation: 'left', iconSize: 'large', iconClass: '', className: '',
    title: 'Go to services available in VerifiedApostille', altText: 'icon of stamp with right sign', ariaLabel: 'stamp', variant: 'plain', description: 'Navigate to the list of services we offer',
    columns: [
      {
        title: 'Personal Documents',
        items: [
          {
            label: 'Birth Certificate',
            href: '/services/birth-certificate-apostille/',
            icon: '',
            altText: '',
            title: 'Birth Certificate'
          },
          {
            label: 'Marriage Certificate',
            href: '/services/marriage-certificate-apostille/',
            icon: '',
            altText: '',
            title: 'Marriage Certificate'
          },
          { label: 'Police Clearance Certificate', href: '/services/pcc-apostille/', title: 'PCC / Affidavit' },
          { label: 'Other Personal Documents', href: '/services/personal-documents-apostille/', title: 'Other Personal Documents' }
        ]
      },
      {
        title: 'Educational Documents',
        items: [
          {
            label: 'Marksheets',
            href: '/services/marksheets-apostille/',
            icon: '',
            altText: '',
            title: '10th, 12th, and Other Marksheets'
          },
          {
            label: 'Degree Certificate',
            href: '/services/degree-certificate-apostille/',
            icon: '',
            altText: '',
            title: 'Degree Certificates'
          }
        ]
      }/*
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
      } */
    ]
  },
  { label: 'Reviews', href: '/reviews/', type: 'link', menuId: '', icon: '', iconName: 'star', iconUrl: '', iconLocation: 'left', iconSize: 'large', iconClass: '', className: '', title: 'check out user experience', altText: 'star icon - user reviews', ariaLabel: 'User Reviews', variant: 'nav', description: 'List of reviews about the apostille process' },
  { label: 'Contact', href: '/contact-us/', type: 'link', menuId: '', icon: '', iconName: 'email', iconUrl: '', iconLocation: 'left', iconSize: 'large', iconClass: '', className: '', altText: 'email icon - envelope', description: 'List of resources about the apostille process', title: 'Get in touch with us', ariaLabel: 'Contact us', variant: 'nav' }
];

/** SEARCH ICON ENABLED */
export const searchIconEnable = true; // Enable search icon in header

/** PRIMARY CTA BUTTONS */
export const primaryCTA: CtaButton[] = [  
  {
    label: 'Get Consultation',
    href: waQuoteHref,
    variant: 'secondary',
    type: 'link',
    menuId: '',
    icon: 'whatsapp',
    title: 'Get free consultation and quote',
    altText: 'Get Consultation icon',
    ariaLabel: 'Get Consultation',
  },
  {
    label: 'Start Apostille',
    href: waStartHref,
    variant: 'primary',
    type: 'link',
    icon: 'whatsapp',
    menuId: '',
    title: 'Start the apostille process',
    altText: 'Start Apostille icon',
    ariaLabel: 'Start Apostille process',
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
  mode: 'primary-lighter-x',               // 'default' | 'glassy' | 'transparent' | 'base-00' | 'base-90' | 'primary-lighter-x' | 'primary-lighter' | 'primary-darker' | 'primary-darker-x' | 'custom'
  width: 'fullwidth',          // fullwidth | sitewidth
  position: 'static',          // static | sticky | fixed
  scrollBehavior: 'none',      // none | hide-on-scroll | show-on-scroll-up
  separator: 'none'          // none | br | shadow (adds bottom split)
};
