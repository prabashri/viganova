// src/config/siteServicePages.ts
import { siteDefaults } from "./siteDefaults";

const SITE_NAME = siteDefaults.siteName;

export const servicePages = {
  hydrogen: {
    id: "green-energy-production",
    icon: "hydrogen-tank",
    title: "Green Hydrogen Production",
    shortLabel: "Hydrogen Production",
    description:
      "Clean hydrogen from renewable power, engineered for industrial scale and long-term cost competitiveness.",
    href: "/#green-hydrogen", //"/services/green-hydrogen/",
    reverse: true,

    // Two image variants
    imageSquare: {
      src: "hydrogen-production.jpg",
      alt: "Green hydrogen production plant",
      title: "Hydrogen Production",
    },
    imageWide: {
      src: "hydrogen-production-wide.jpg",
      alt: "Hydrogen plant 16:9 view",
      title: "Hydrogen Production Facility",
    },

    seo: {
      title: `Green Hydrogen Production | ${SITE_NAME}`,
      description: `${SITE_NAME} provides advanced green hydrogen solutions for sustainable energy and industrial use.`,
    },
  },

  electrolyzer: {
    id: "electrolyzer-systems",
    icon: "electrochemistry",
    title: "Electrolyzer Systems",
    shortLabel: "Electrolyzers",
    description:
      "High-efficiency alkaline and PEM electrolyzer stacks, from lab validation to deployment.",
    href: "/#electrolyzer-systems",
    reverse: false,

    imageSquare: {
      src: "electrolyzer-tech.jpg",
      alt: "Electrolyzer stack and system integration",
      title: "Electrolyzer Systems",
    },
    imageWide: {
      src: "electrolyzer-wide.jpg",
      alt: "Industrial electrolyzer unit in operation",
      title: "Electrolyzer Systems Facility",
    },

    seo: {
      title: `Electrolyzer Systems | ${SITE_NAME}`,
      description: `${SITE_NAME} develops efficient electrolyzer stacks for hydrogen production and industrial applications.`,
    },
  },

  ammonia: {
    id: "green-ammonia-urea",
    icon: "ammonia",
    title: "Green Ammonia Production",
    shortLabel: "Ammonia & Urea",
    description:
      "Decarbonized ammonia for fertilizer and energy storage using nitrogen + green hydrogen — no fossil feedstock.",
    href: "/#green-ammonia", // "/services/green-ammonia/",
    reverse: true,

    imageSquare: {
      src: "green-ammonia.jpg",
      alt: "Green ammonia synthesis loop",
      title: "Green Ammonia Production",
    },
    imageWide: {
      src: "green-ammonia-wide.jpg",
      alt: "Ammonia production plant 16:9",
      title: "Green Ammonia Plant",
    },

    seo: {
      title: `Green Ammonia & Urea | ${SITE_NAME}`,
      description: `${SITE_NAME} delivers sustainable ammonia and urea production powered by green hydrogen.`,
    },
  },

  rd: {
    id: "rd-consulting",
    icon: "chemical-beakers",
    title: "Research & Development Consulting",
    shortLabel: "R&D Consulting",
    description:
      "Custom materials, process optimization, and scale-up strategy from lab prototype to pilot plant.",
    href: "/#rd-consulting", // "/services/research-development/",
    reverse: false,

    imageSquare: {
      src: "research-lab.jpg",
      alt: "Advanced electrochemistry and materials R&D lab",
      title: "Research & Development Consulting",
    },
    imageWide: {
      src: "research-lab-wide.jpg",
      alt: "Research laboratory 16:9",
      title: "R&D Laboratory",
    },

    seo: {
      title: `R&D Consulting | ${SITE_NAME}`,
      description: `${SITE_NAME} provides end-to-end R&D support, from materials synthesis to pilot-scale optimization.`,
    },
  },
} as const;

// Flat list (ordered for UI)
export const servicePagesList = [
  servicePages.hydrogen,
  servicePages.electrolyzer,
  servicePages.ammonia,
  servicePages.rd,
];
