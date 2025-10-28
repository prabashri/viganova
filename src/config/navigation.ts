// File: /src/config/navigation.ts

/**
 * ========= SITE NAVIGATION CONFIG =========
 * Controls:
 * - Logos (desktop/mobile)
 * - Primary navigation items (with dropdown)
 * - CTA buttons
 * - Secondary navigation
 * - Header style
 */

import { buildWhatsAppLink } from "@/utils/whatsapp";
import { siteDefaults } from "@/config/siteDefaults";
import { servicePagesList } from "@/config/siteServicePages"; // ⬅ NEW
import type {
  NavItem,
  NavSubItem,
  MegaMenuItem,
  NavStyleConfig,
  LogoConfig,
  CtaButton
} from '@/types/navigation.ts';

const title = siteDefaults.title;

// WhatsApp intents (left in place in case you re-enable CTAs later)
const waStartHref = buildWhatsAppLink({
  phone: "",
  text: `Hi ${title}!`,
});

const waQuoteHref = buildWhatsAppLink({
  phone: "",
  text: `Hi ${title}!`,
  source: "Hero • Free Quote",
});

/** LOGO CONFIGURATION */
export const siteLogo: LogoConfig = {
  desktopSvg: true, // use DesktopLogo.astro if available
  desktop: "",      // fallback desktop logo path
  mobileSvg: true,
  mobile: "",       // fallback mobile logo path
  withText: false,
};

/**
 * Build dropdown menu items for "Our Business" from servicePagesList.
 *
 * We’ll map each service into a NavSubItem-compatible object:
 * - label: use shortLabel if available, else title
 * - href:  service.href (full /services/... URL)
 * - icon:  we'll translate service.icon (like "hydrogen-tank") into something
 *          you can render in <Icon name={icon} /> in your dropdown component.
 *
 * You can extend this with description or thumbnails later.
 */
const businessMenuItems: NavSubItem[] = (servicePagesList as any[]).map((svc: any) => ({
  label: svc.shortLabel || svc.title,
  href: svc.href,
  icon: "", // if you are using external SVG path use that here
  iconName: svc.icon, // we expose iconName so the menu renderer can <Icon name={iconName}/>
  altText: svc.title,
  title: svc.title,
}));

/**
 * MAIN NAV
 *
 * 1. Home
 * 2. Our Business (dropdown auto-generated from config)
 * 3. Company (placeholder link or could point to /company/)
 * 4. Contact
 */
export const siteNav: NavItem[] = [
  // Home
  {
    label: "Home",
    href: "/",
    type: "link",
    menuId: "",
    icon: "",
    iconName: "home-2",
    iconUrl: "",
    iconLocation: "left",
    iconSize: "large",
    iconClass: "",
    className: "",
    title: "Go to homepage",
    altText: "Home icon",
    ariaLabel: "Home",
    variant: "nav",
    description: "Navigate to the homepage of our site",
  },

  // Our Business (Dropdown generated from servicePagesList)
  {
    label: "Our Business",
    href: "/services/",
    type: "dropdown",
    menuId: "dropdown-services",
    iconName: "gear-wheel",
    icon: "",
    iconUrl: "",
    iconLocation: "left",
    iconSize: "large",
    iconClass: "",
    className: "",
    title: "Explore our core offerings",
    altText: "Our Business",
    ariaLabel: "Our Business",
    variant: "nav",
    description: "Hydrogen, electrolyzers, ammonia, and R&D",

    // <-- here's the dynamic part
    content: businessMenuItems,
  },

  // Company
  {
    label: "Company",
    href: "/about-us/",
    type: "link",
    menuId: "",
    icon: "",
    iconName: "idea-2",
    iconUrl: "",
    iconLocation: "left",
    iconSize: "large",
    iconClass: "",
    className: "",
    title: `About ${title}`,
    altText: "About us",
    ariaLabel: "About us",
    variant: "nav",
    description: `Learn more about ${title}`,
  },

  // Contact
  {
    label: "Contact",
    href: "/contact-us/",
    type: "link",
    menuId: "",
    icon: "",
    iconName: "email",
    iconUrl: "",
    iconLocation: "left",
    iconSize: "large",
    iconClass: "",
    className: "",
    altText: "email icon - envelope",
    description: "We are active to reply to your queries",
    title: "Get in touch with us",
    ariaLabel: "Contact us",
    variant: "nav",
  },
];

/** SEARCH ICON ENABLED */
export const searchIconEnable = true;

/**
 * PRIMARY CTA BUTTONS
 * (Currently disabled, but here's how you'd wire them back in)
 *
 * If you want a WhatsApp CTA that always sits in header:
 *   - 'Get Consultation' / 'Start Project' etc.
 *   - You can also make a CTA that jumps to your first service, e.g. servicePagesList[0].href
 */
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
    label: 'Start Project',
    href: waStartHref,
    variant: 'primary',
    type: 'link',
    icon: 'whatsapp',
    menuId: '',
    title: 'Start a green energy engagement',
    altText: 'Start Project icon',
    ariaLabel: 'Start consultation process',
  }
  */
];

/** SECONDARY NAVIGATION (kept for docs-style subnavs, etc.) */
export const secondaryNavigation: NavItem[] = [
  /*
  { label: 'Whitepapers', href: '/insights/', title: 'Technical insights', type: 'link' },
  { label: 'Case Studies', href: '/case-studies/', title: 'Real-world results', type: 'link' }
  */
];

/** NAVIGATION BAR STYLE OPTIONS */
export const headerStyle: NavStyleConfig = {
  mode: "primary-lighter-x", // 'default' | 'glassy' | 'transparent' | 'base-00' | 'base-90' | 'primary-lighter-x' | 'primary-lighter' | 'primary-darker' | 'primary-darker-x' | 'custom'
  width: "fullwidth",        // 'fullwidth' | 'sitewidth'
  position: "static",        // 'static' | 'sticky' | 'fixed'
  scrollBehavior: "none",    // 'none' | 'hide-on-scroll' | 'show-on-scroll-up'
  separator: "none",         // 'none' | 'br' | 'shadow'
};
