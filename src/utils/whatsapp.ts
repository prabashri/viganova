// src/utils/whatsapp.ts
import { siteDefaults } from "@/config/siteDefaults";

export function buildWhatsAppLink({
  phone,                  // "919789629727"
  text,
  source = "Homepage Hero", // where the click came from
}: { phone?: string; text?: string; source?: string }) {
  const message = text || "Hello EasyApostille, I need assistance.";
  const msg = `${message}

— From: ${source}`;
  return `https://wa.me/${phone || siteDefaults.contact.whatsapp}?text=${encodeURIComponent(msg)}`;
}
