/* Real shipped projects shown in the Hub's LaserShowcase ring.
   Screenshots live in public/cases/<key>/ — object-fit:contain, so any
   aspect ratio works without cropping key content. */
export const REAL_CASES = [
  {
    key: "perseverance",
    tagEn: "SELF-DEV / RPG",
    tagRu: "САМОРАЗВИТИЕ / RPG",
    title: "Perseverance",
    descEn: "An RPG instead of a habit tracker — 5-branch skill tree, 7–14 day story arcs.",
    descRu: "RPG вместо трекера привычек — дерево прокачки по 5 веткам, арки на 7–14 дней.",
    url: "https://perseverance.live/",
    gradient: "radial-gradient(circle at 50% 30%, #3a1210 0%, #1c0a08 45%, #0a0403 80%)",
    images: [
      "/cases/perseverance/1-hero.jpg",
      "/cases/perseverance/2-radar.jpg",
      "/cases/perseverance/3-features.jpg",
    ],
  },
  {
    key: "drafted",
    tagEn: "AI RESUME BUILDER",
    tagRu: "AI-КОНСТРУКТОР РЕЗЮМЕ",
    title: "Drafted",
    descEn: "AI sharpens your resume text instead of writing from scratch. 4 templates, PDF rendered server-side.",
    descRu: "AI усиливает текст резюме, а не пишет с нуля. 4 шаблона, PDF рендерится на сервере.",
    url: null,
    gradient: "radial-gradient(circle at 50% 30%, #241b4a 0%, #120d24 45%, #060509 80%)",
    images: [
      "/cases/drafted/1-hero.jpg",
      "/cases/drafted/2-features.jpg",
      "/cases/drafted/3-builder.jpg",
    ],
  },
  {
    key: "animalkingdom",
    tagEn: "E-COMMERCE",
    tagRu: "E-COMMERCE",
    title: "AnimalsKingdomsShop",
    descEn: "Single-product pet gear landing — size chart, photo gallery and a full checkout with live card payments, live today.",
    descRu: "Одностраничный лендинг под один товар для питомцев — таблица размеров, галерея и рабочий чекаут с приёмом оплаты, уже в проде.",
    url: "https://animalskingdom.shop/",
    gradient: "radial-gradient(circle at 50% 30%, #4a3208 0%, #241a08 45%, #0a0704 80%)",
    images: [
      "/cases/animalkingdom/1-hero.jpg",
      "/cases/animalkingdom/2-benefits.jpg",
      "/cases/animalkingdom/3-checkout.jpg",
    ],
  },
  {
    key: "cloneui",
    tagEn: "AI DEV TOOL",
    tagRu: "AI-ИНСТРУМЕНТ",
    title: "CloneUI",
    descEn: "Any site's screenshot → working HTML/CSS in seconds via Claude Vision, streamed live.",
    descRu: "Скриншот сайта → готовый HTML/CSS за секунды. Claude Vision анализирует, код стримится.",
    url: null,
    gradient: "radial-gradient(circle at 50% 30%, #241b52 0%, #150f30 45%, #0a0716 80%)",
    images: [
      "/cases/cloneui/1-hero.jpg",
      "/cases/cloneui/3-generating.jpg",
      "/cases/cloneui/4-result.jpg",
      "/cases/cloneui/2-link.jpg",
    ],
  },
];
