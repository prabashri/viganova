import type { EntryMetaProps } from "../types/EntryMetaProps";

export const categoryMeta: Record<string, Omit<EntryMetaProps, "name">> = {
  css: {
    title: "CSS Techniques",
    image: "/categories/css-image.png",
    imageAlt: "CSS Techniques related shapes are arranged in a grid",
    url: "/categories/css/",
    description: "Grouped tutorials and tools for mastering CSS layout, spacing, and typography."
  },
  reference: {
    title: "Reference",
    image: "/categories/performance-image.png",
    imageAlt: "Reference related shapes are arranged in a grid",
    url: "/categories/reference/",
    description: "Articles focused on improving frontend and build performance."
  }
};
