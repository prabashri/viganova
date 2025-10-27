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
import { siteDefaults } from "@/config/siteDefaults";
import type {
  NavItem,
  NavSubItem,
  MegaMenuItem,
  NavStyleConfig,
  LogoConfig,
  CtaButton
} from '@/types/navigation.ts';

const title = siteDefaults.title;
// Intent A: Start process (share docs)
const waStartHref = buildWhatsAppLink({
  phone: '',
  text:
    `Hi ${title}!`,
});

// Intent B: Get quote (consult first)
const waQuoteHref = buildWhatsAppLink({
  phone: '',
  text:
    `Hi ${title}!`,
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
  /* Home */
  { label: 'Home', href: '/', type: 'link', menuId: '', 
    icon: '', iconName: 'home-2', iconUrl: '', iconLocation: 'left', iconSize: 'large', iconClass: '', className: '',
    title: 'Go to homepage', altText: 'Home icon', ariaLabel: 'Home', variant: 'nav', description: 'Navigate to the homepage of our site' 
  },
  /* Example of Dropdown menu */
  {
    label: 'Our Business',
    href: '/services/',
    type: 'dropdown',
    iconName: 'gear-wheel',
    menuId: 'dropdown-tools',
    content: [
      {
        label: 'Green Hydrogen Solutions',
        href: '/#',
        icon: '/icons/width.svg',
        altText: 'Width icon',
        title: 'Tool for responsive width'
      },
      {
        label: 'Electrolyzer Technologies',
        href: '/#',
        icon: '/icons/margin.svg',
        altText: 'Margin icon',
        title: 'Tool for margin calculation'
      },
      {
        label: 'Green Ammonia Production',
        href: '/#',
        title: 'Another tool',
        icon: '/icons/width.svg',
      },
       {
        label: 'Green Urea Production',
        href: '/#',
        title: 'Another tool',
        icon: '/icons/width.svg',
      },
       {
        label: 'R & D Initiatives',
        href: '/#',
        title: 'Another tool',
        icon: '/icons/width.svg',
      }
    ]
  },

  { label: 'Resources', href: '/resources/', type: 'link', menuId: '', icon: '', iconName: 'idea-2', iconUrl: '', iconLocation: 'left', iconSize: 'large', iconClass: '', className: '', title: 'Go to apostille resources', altText: 'idea icon - bulb with shining light', ariaLabel: 'Informations', variant: 'nav', description: `List of resources in ${title}` },

  /* Example of Mega Menu */
  /*
  {
    label: 'Services',
    type: 'mega',
    menuId: 'mega-resources', iconName: 'stamp',
    iconUrl: '',
    iconLocation: 'left', iconSize: 'large', iconClass: '', className: '',
    title: 'title to show', altText: 'icon of stamp with right sign', ariaLabel: 'stamp', variant: 'plain', description: 'Navigate to the list of services we offer',
    columns: [
      {
        title: 'heading 1',
        items: [
          {
            label: 'Item 1',
            href: '#',
            icon: '',
            altText: '',
            title: 'item title'
          },
          {
            label: 'item 2',
            href: '#',
            icon: '',
            altText: '',
            title: 'item title'
          },
          { label: 'Item 3', href: '#', title: 'item title' },
        ]
      },
      {
        title: 'heading 2',
        items: [
          {
            label: 'Item 1',
            href: '#',
            icon: '',
            altText: '',
            title: 'item title'
          },
          {
            label: 'item 2',
            href: '#',
            icon: '',
            altText: '',
            title: 'item title'
          },
          { label: 'Item 3', href: '#', title: 'item title' },
        ]
      },
    ]
  },
  */
  
  { label: 'Contact', href: '/contact-us/', type: 'link', menuId: '', icon: '', iconName: 'email', iconUrl: '', iconLocation: 'left', iconSize: 'large', iconClass: '', className: '', altText: 'email icon - envelope', description: 'We are active to reply your queries', title: 'Get in touch with us', ariaLabel: 'Contact us', variant: 'nav' }
];

/** SEARCH ICON ENABLED */
export const searchIconEnable = true; // Enable search icon in header

/** PRIMARY CTA BUTTONS */
export const primaryCTA: CtaButton[] = [  
  /*
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
  }*/
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
