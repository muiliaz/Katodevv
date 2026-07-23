/**
 * Content for the /apps "build your app" drag-and-drop game.
 * 10 feature chips, 10 phone slots (1 header + 8 grid + 1 bottom), 8
 * archetype results. Launch only requires MIN_TO_LAUNCH of the 10 slots
 * filled — if it required all 10, every playthrough would place every
 * feature and the archetype score would always be identical. Requiring a
 * subset is what makes the result actually depend on what you picked.
 */

export const MIN_TO_LAUNCH = 5;

export const FEATURES = [
  { key: "login",     icon: "🔐", titleEn: "Login & Auth",       titleRu: "Логин и вход",        tags: ["fintech", "enterprise"] },
  { key: "chat",       icon: "💬", titleEn: "Chat",               titleRu: "Чат",                 tags: ["community", "marketplace"] },
  { key: "payments",   icon: "💳", titleEn: "Payments",           titleRu: "Оплата",              tags: ["fintech", "marketplace"] },
  { key: "push",       icon: "🔔", titleEn: "Push Notifications", titleRu: "Пуш-уведомления",     tags: ["community", "ondemand"] },
  { key: "dashboard",  icon: "📊", titleEn: "Dashboard",          titleRu: "Дашборд",             tags: ["fintech", "productivity", "wellness"] },
  { key: "camera",     icon: "📸", titleEn: "Camera",             titleRu: "Камера",              tags: ["creator", "wellness"] },
  { key: "maps",       icon: "🗺️", titleEn: "Maps & Location",    titleRu: "Карты и геолокация",  tags: ["ondemand", "marketplace"] },
  { key: "ai",         icon: "🧠", titleEn: "AI Assistant",       titleRu: "AI-ассистент",        tags: ["productivity", "creator"] },
  { key: "feed",       icon: "📰", titleEn: "Social Feed",        titleRu: "Соцлента",            tags: ["community", "creator"] },
  { key: "darkmode",   icon: "🌙", titleEn: "Dark Mode",          titleRu: "Тёмная тема",         tags: ["enterprise", "productivity"] },
];

/* 10 slots flank the phone, 5 left / 5 right. Each suggests one feature
   (ghost icon + label) but accepts any chip — the hint guides, it never
   blocks a drop. */
export const SLOTS = [
  { featureKey: "login" },
  { featureKey: "chat" },
  { featureKey: "payments" },
  { featureKey: "dashboard" },
  { featureKey: "camera" },
  { featureKey: "maps" },
  { featureKey: "ai" },
  { featureKey: "feed" },
  { featureKey: "darkmode" },
  { featureKey: "push" },
];

export const ARCHETYPES = {
  fintech: {
    icon: "💰", titleEn: "The Fintech", titleRu: "The Fintech",
    descEn: "Money moves through this app — payments, balances, trust.",
    descRu: "В этом приложении крутятся деньги — платежи, балансы, доверие.",
  },
  community: {
    icon: "👥", titleEn: "The Community Builder", titleRu: "The Community Builder",
    descEn: "Built for people to talk, share and stay connected.",
    descRu: "Создано, чтобы люди общались, делились и оставались на связи.",
  },
  ondemand: {
    icon: "🚚", titleEn: "The On-Demand", titleRu: "The On-Demand",
    descEn: "Something arrives, right when and where it's needed.",
    descRu: "Что-то приезжает именно тогда и туда, куда нужно.",
  },
  marketplace: {
    icon: "🛍", titleEn: "The Marketplace", titleRu: "The Marketplace",
    descEn: "Buyers and sellers meet here — and the deal gets done.",
    descRu: "Здесь встречаются продавцы и покупатели — и сделка заключается.",
  },
  productivity: {
    icon: "⚙️", titleEn: "The Productivity Tool", titleRu: "The Productivity Tool",
    descEn: "Less busywork, more done — a tool people actually rely on.",
    descRu: "Меньше рутины, больше сделано — инструмент, на который реально полагаются.",
  },
  creator: {
    icon: "🎬", titleEn: "The Creator Platform", titleRu: "The Creator Platform",
    descEn: "A stage for making and sharing things worth seeing.",
    descRu: "Площадка для создания и показа того, на что стоит посмотреть.",
  },
  wellness: {
    icon: "🧘", titleEn: "The Wellness App", titleRu: "The Wellness App",
    descEn: "Tracks progress, nudges gently, helps people show up daily.",
    descRu: "Отслеживает прогресс, мягко напоминает, помогает быть последовательным.",
  },
  enterprise: {
    icon: "🏢", titleEn: "The Enterprise Tool", titleRu: "The Enterprise Tool",
    descEn: "Serious software for a serious team — secure and precise.",
    descRu: "Серьёзный софт для серьёзной команды — надёжно и точно.",
  },
};

/** Score placed features against archetype tags; ties become a hybrid label. */
export function computeArchetype(placedFeatureKeys) {
  const scores = {};
  placedFeatureKeys.forEach((key) => {
    const feature = FEATURES.find((f) => f.key === key);
    if (!feature) return;
    feature.tags.forEach((tag) => { scores[tag] = (scores[tag] || 0) + 1; });
  });
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (ranked.length === 0) return { primary: null, secondary: null };
  const [topTag, topScore] = ranked[0];
  const tied = ranked.filter(([, score]) => score === topScore);
  if (tied.length > 1) {
    return { primary: tied[0][0], secondary: tied[1][0] };
  }
  return { primary: topTag, secondary: null };
}
