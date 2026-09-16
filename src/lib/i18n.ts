export const LANGS = ["en", "ar"] as const;
export type Lang = (typeof LANGS)[number];

export const DEFAULT_LANG: Lang = "en";
export const LANG_STORAGE_KEY = "alqaysr.lang";
export const dirFor = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");

/**
 * UI strings only. Dish names, descriptions and section names come from the
 * restaurant and are shown exactly as they wrote them in either language.
 */
export const STRINGS = {
  "nav.menu": { en: "Menu", ar: "القائمة" },
  "nav.visit": { en: "Visit", ar: "زورونا" },
  "lang.switch": { en: "العربية", ar: "English" },
  "lang.label": { en: "Switch to Arabic", ar: "التبديل إلى الإنجليزية" },

  "home.explore": { en: "How would you like to explore?", ar: "كيف تحب أن تتصفح القائمة؟" },
  "home.favourites": { en: "Guest favourites", ar: "الأكثر طلباً" },
  "home.viewMenu": { en: "View menu", ar: "تصفح القائمة" },

  "menu.title": { en: "Our menu", ar: "قائمتنا" },
  "menu.choose": { en: "Choose how you are dining today.", ar: "اختر طريقة تناولك اليوم." },
  "menu.search": { en: "Search the menu…", ar: "ابحث في القائمة…" },
  "menu.searchLabel": { en: "Search the menu", ar: "ابحث في القائمة" },
  "menu.dishes": { en: "{n} dishes", ar: "{n} صنف" },
  "menu.results": { en: "{n} results", ar: "{n} نتيجة" },
  "menu.noMatch": { en: "No dishes match your search.", ar: "لا توجد أصناف مطابقة لبحثك." },
  "menu.updating": {
    en: "This menu is being updated. Please check back shortly.",
    ar: "يتم تحديث هذه القائمة. يرجى المحاولة لاحقاً.",
  },

  "type.TAKE_AWAY": { en: "Take Away", ar: "تايك أواي" },
  "type.TABLES": { en: "Tables", ar: "الطاولات" },
  "blurb.TAKE_AWAY": { en: "Order to go", ar: "اطلب للخارج" },
  "blurb.TABLES": { en: "Dine with us", ar: "تناول معنا" },

  "badge.bestSeller": { en: "Best seller", ar: "الأكثر مبيعاً" },
  "badge.chefsPick": { en: "Chef's pick", ar: "اختيار الشيف" },
  "badge.spicy": { en: "Spicy", ar: "حار" },
  "badge.soldOut": { en: "Sold out", ar: "غير متوفر" },

  "dialog.add": { en: "Add to order", ar: "أضف إلى الطلب" },
  "dialog.close": { en: "Close", ar: "إغلاق" },

  "order.item": { en: "{n} item", ar: "{n} صنف" },
  "order.items": { en: "{n} items", ar: "{n} أصناف" },
  "order.review": { en: "Review order", ar: "مراجعة الطلب" },
  "order.hide": { en: "Hide order", ar: "إخفاء الطلب" },
  "order.clear": { en: "Clear order", ar: "إلغاء الطلب" },
  "order.send": { en: "Send on WhatsApp", ar: "أرسل عبر واتساب" },
  "order.more": { en: "One more {name}", ar: "زيادة {name}" },
  "order.less": { en: "One less {name}", ar: "إنقاص {name}" },
  "order.add": { en: "Add {name} to order", ar: "أضف {name} إلى الطلب" },

  "visit.find": { en: "Find us", ar: "موقعنا" },
  "visit.order": { en: "Order on WhatsApp", ar: "اطلب عبر واتساب" },
  "visit.call": { en: "Call {phone}", ar: "اتصل {phone}" },
  "visit.directions": { en: "Get directions", ar: "الاتجاهات" },
  "visit.mapHint": { en: "Click to explore the map", ar: "انقر لاستكشاف الخريطة" },

  "footer.contact": { en: "Contact", ar: "تواصل معنا" },
  "footer.findUs": { en: "Find us", ar: "العنوان" },
  "footer.hours": { en: "Hours", ar: "أوقات العمل" },
  "footer.openMaps": { en: "Open in Maps", ar: "افتح في الخرائط" },
  "footer.rights": { en: "All rights reserved.", ar: "جميع الحقوق محفوظة." },
  "footer.createdBy": { en: "Created by {name}", ar: "تطوير {name}" },
} as const;

export type StringKey = keyof typeof STRINGS;

export function translate(lang: Lang, key: StringKey, vars?: Record<string, string | number>) {
  let out: string = STRINGS[key][lang] ?? STRINGS[key][DEFAULT_LANG];
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replaceAll(`{${k}}`, String(v));
  return out;
}
