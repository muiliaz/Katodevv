import { createContext, useContext, useState } from "react";

export const LangContext = createContext();

export function useLang() {
  return useContext(LangContext);
}

/* ─── Team data (names never change, only labels/roles translate) ─── */
export const TEAM = [
  {
    name:    "Azamat Seitkali",
    emoji:   "👨‍💻",
    roleEn:  "Lead Engineer",
    roleRu:  "Ведущий инженер",
    tagEn:   "≈ Principal Level",
    tagRu:   "≈ Principal уровень",
    expEn:   "8+ years",
    expRu:   "8+ лет",
    skills:  ["System Design", "React", "Node.js", "AWS", "Python", "Microservices"],
    level:   "lead",
  },
  {
    name:    "Damir Usenov",
    emoji:   "👨‍🚀",
    roleEn:  "Senior Full-Stack Engineer",
    roleRu:  "Старший Full-Stack инженер",
    tagEn:   "Senior",
    tagRu:   "Senior",
    expEn:   "6+ years",
    expRu:   "6+ лет",
    skills:  ["React Native", "Flutter", "TypeScript", "GraphQL", "PostgreSQL"],
    level:   "senior",
  },
  {
    name:    "Aizat Bekova",
    emoji:   "👩‍🎨",
    roleEn:  "UI/UX Designer",
    roleRu:  "UI/UX Дизайнер",
    expEn:   "3+ years",
    expRu:   "3+ года",
    skills:  ["Figma", "Adobe XD", "Prototyping", "Branding"],
    level:   "mid",
  },
  {
    name:    "Bekzod Nurmatov",
    emoji:   "🧑‍💻",
    roleEn:  "QA & DevOps Engineer",
    roleRu:  "QA & DevOps инженер",
    expEn:   "3+ years",
    expRu:   "3+ года",
    skills:  ["Testing", "Docker", "CI/CD", "Linux"],
    level:   "mid",
  },
  {
    name:    "Kamila Isanova",
    emoji:   "👩‍💼",
    roleEn:  "Project Manager",
    roleRu:  "Менеджер проектов",
    expEn:   "4+ years",
    expRu:   "4+ года",
    skills:  ["Scrum", "Jira", "Client Relations", "Planning"],
    level:   "mid",
  },
];

export const T = {
  en: {
    navbar: {
      services:  "Services",
      portfolio: "Portfolio",
      about:     "About",
      contact:   "Contact",
      cta:       "Start a Project",
    },
    hero: {
      available:    "Available for projects",
      cycleWords:   ["Websites", "Mobile Apps", "AI Bots", "CRM Systems"],
      subtitlePre:  "We build",
      subtitlePost: "that drive real results for modern businesses.",
      stats:        ["Projects", "Clients", "Years Exp"],
      startProject: "Start a Project",
      ourServices:  "Our Services",
      scroll:       "scroll",
    },
    services: {
      sectionTitle: "Our Services",
      cards: [
        {
          title: "Web Development",
          description: "Modern, fast websites for your business — from landing pages to full web apps.",
          hint: "Click to see live example →",
          modalTitle: "Web Development",
          modalSub: "Example: Business landing page with SEO & custom design",
        },
        {
          title: "Mobile Apps",
          description: "Android & iOS applications with clean UX and smooth performance.",
          hint: "Click to see live example →",
          modalTitle: "Mobile Apps",
          modalSub: "Example: Finance app — iOS/Android UI mockup",
        },
        {
          title: "Automation",
          description: "Business automation and workflow systems that save you hours every day.",
          hint: "Click to see live example →",
          modalTitle: "Business Automation",
          modalSub: "Example: Order processing pipeline dashboard",
        },
        {
          title: "AI Bots",
          description: "Smart bots for Telegram, WhatsApp and websites — 24/7 customer support.",
          hint: "Click to see live example →",
          modalTitle: "AI Bots",
          modalSub: "Example: Telegram / website chat assistant",
        },
      ],
      autoStats: [
        { label: "Tasks Automated", value: "2,847", delta: "↑ 12%",    color: "#6366f1" },
        { label: "Hours Saved",     value: "143h",  delta: "↑ 8%",     color: "#0ea5e9" },
        { label: "Success Rate",    value: "99.4%", delta: "stable",    color: "#22c55e" },
      ],
      n8nRunning:      "● Running...",
      n8nCompleted:    "✓ Completed",
      botScript: [
        { sender: "bot",  text: "Hello! 👋 I'm KatoBot — your smart assistant. How can I help?", delay: 600  },
        { sender: "user", text: "I'd like to learn about your services",                          delay: 1400 },
        { sender: "bot",  text: "Of course! We build websites, mobile apps, automation systems and AI bots 🚀", delay: 1600 },
        { sender: "user", text: "Tell me more about websites",                                     delay: 1300 },
        { sender: "bot",  text: "We create modern, fast websites — from landing pages to online stores. Want to leave a request? 😊", delay: 1800 },
      ],
      botName:         "KatoBot Assistant",
      botOnline:       "● Online",
      botBadge:        "AI Powered",
      chatPlaceholder: "Type a message...",
    },
    portfolio: {
      sectionTitle: "Portfolio",
      viewProject:  "View Project →",
      cards: [
        { tag: "Marketing",   title: "Landing Page",     desc: "High-converting landing pages that turn visitors into customers." },
        { tag: "Corporate",   title: "Business Website", desc: "Full multi-page corporate sites with navigation, services and contact forms." },
        { tag: "E-commerce",  title: "Online Store",     desc: "Feature-rich e-commerce stores with cart, products and checkout flow." },
        { tag: "SaaS / CRM",  title: "CRM System",       desc: "Custom business management systems with contacts, pipeline and analytics." },
      ],
    },
    about: {
      sectionTitle: "About Us",
      subtitle:     "A dedicated team turning bold ideas into world-class digital products.",
      missionTitle: "Our Mission",
      mission:      "We exist to help businesses grow through exceptional software. Every line of code we write is crafted with precision, performance and your end-users in mind.",
      statsRow: [
        { value: "50+",  label: "Projects Completed" },
        { value: "30+",  label: "Happy Clients" },
        { value: "3+",   label: "Years on Market" },
        { value: "99%",  label: "Satisfaction Rate" },
      ],
      teamTitle:   "Meet the Team",
      expLabel:    "experience",
      levelLabel:  { lead: "Lead", senior: "Senior", mid: "Mid-level" },
    },
    contact: {
      sectionTitle: "Let's Work Together",
      subtitle:     "Have a project in mind? We'd love to hear about it. Reach out and we'll get back to you within 24 hours.",
      telegramLabel: "Telegram",
      emailLabel:    "Email",
      hoursLabel:    "Working Hours",
      hoursValue:    "Mon – Fri · 9:00 – 18:00 (UTC+6)",
      locationLabel: "Location",
      locationValue: "Bishkek, Kyrgyzstan",
      formTitle:     "Send a Message",
      name:          "Your name",
      email:         "Your email",
      message:       "Tell us about your project",
      send:          "Send Request",
    },
    footer: {
      tagline: "Building the future, one line at a time.",
      nav: {
        services:  "Services",
        portfolio: "Portfolio",
        about:     "About",
        contact:   "Contact",
      },
      rights: "All rights reserved.",
    },
  },

  ru: {
    navbar: {
      services:  "Услуги",
      portfolio: "Портфолио",
      about:     "О нас",
      contact:   "Контакты",
      cta:       "Начать проект",
    },
    hero: {
      available:    "Открыт для проектов",
      cycleWords:   ["Сайты", "Мобильные Apps", "AI Боты", "CRM Системы"],
      subtitlePre:  "Мы создаём",
      subtitlePost: "которые приносят реальные результаты для вашего бизнеса.",
      stats:        ["Проектов", "Клиентов", "Лет опыта"],
      startProject: "Начать проект",
      ourServices:  "Наши услуги",
      scroll:       "вниз",
    },
    services: {
      sectionTitle: "Наши услуги",
      cards: [
        {
          title: "Веб-разработка",
          description: "Современные быстрые сайты для бизнеса — от лендингов до полноценных веб-приложений.",
          hint: "Нажмите для просмотра →",
          modalTitle: "Веб-разработка",
          modalSub: "Пример: бизнес-лендинг с SEO и уникальным дизайном",
        },
        {
          title: "Мобильные приложения",
          description: "Приложения для Android и iOS с чистым UX и плавной производительностью.",
          hint: "Нажмите для просмотра →",
          modalTitle: "Мобильные приложения",
          modalSub: "Пример: финансовое приложение — макет iOS/Android",
        },
        {
          title: "Автоматизация",
          description: "Системы автоматизации бизнеса, которые экономят часы каждый день.",
          hint: "Нажмите для просмотра →",
          modalTitle: "Автоматизация бизнеса",
          modalSub: "Пример: дашборд обработки заказов",
        },
        {
          title: "AI Боты",
          description: "Умные боты для Telegram, WhatsApp и сайтов — поддержка клиентов 24/7.",
          hint: "Нажмите для просмотра →",
          modalTitle: "AI Боты",
          modalSub: "Пример: чат-ассистент для Telegram / сайта",
        },
      ],
      autoStats: [
        { label: "Задач автоматизировано", value: "2,847", delta: "↑ 12%",     color: "#6366f1" },
        { label: "Часов сэкономлено",      value: "143h",  delta: "↑ 8%",      color: "#0ea5e9" },
        { label: "Успешных выполнений",    value: "99.4%", delta: "стабильно",  color: "#22c55e" },
      ],
      n8nRunning:      "● Выполняется...",
      n8nCompleted:    "✓ Завершено",
      botScript: [
        { sender: "bot",  text: "Привет! 👋 Я KatoBot — умный ассистент. Чем могу помочь?", delay: 600  },
        { sender: "user", text: "Хочу узнать о ваших услугах",                               delay: 1400 },
        { sender: "bot",  text: "Конечно! Мы разрабатываем сайты, мобильные приложения, системы автоматизации и AI-боты 🚀", delay: 1600 },
        { sender: "user", text: "Расскажи подробнее про сайты",                              delay: 1300 },
        { sender: "bot",  text: "Создаём современные быстрые сайты под ключ — от лендингов до интернет-магазинов. Хотите оставить заявку? 😊", delay: 1800 },
      ],
      botName:         "KatoBot Ассистент",
      botOnline:       "● Онлайн",
      botBadge:        "AI Powered",
      chatPlaceholder: "Написать сообщение...",
    },
    portfolio: {
      sectionTitle: "Портфолио",
      viewProject:  "Открыть проект →",
      cards: [
        { tag: "Маркетинг",        title: "Лендинг",          desc: "Конвертирующие лендинги, превращающие посетителей в клиентов." },
        { tag: "Корпоративный",    title: "Бизнес-сайт",      desc: "Полноценные корпоративные сайты с навигацией, услугами и формой обратной связи." },
        { tag: "Интернет-магазин", title: "Онлайн-магазин",   desc: "Функциональные магазины с корзиной, товарами и оформлением заказа." },
        { tag: "SaaS / CRM",       title: "CRM Система",      desc: "Системы управления бизнесом с контактами, воронкой и аналитикой." },
      ],
    },
    about: {
      sectionTitle: "О нас",
      subtitle:     "Преданная команда, превращающая смелые идеи в цифровые продукты мирового уровня.",
      missionTitle: "Наша миссия",
      mission:      "Мы помогаем бизнесу расти через создание исключительного программного обеспечения. Каждая строчка кода написана с точностью, производительностью и вашими пользователями в уме.",
      statsRow: [
        { value: "50+",  label: "Завершённых проектов" },
        { value: "30+",  label: "Довольных клиентов" },
        { value: "3+",   label: "Года на рынке" },
        { value: "99%",  label: "Удовлетворённость" },
      ],
      teamTitle:  "Познакомьтесь с командой",
      expLabel:   "опыта",
      levelLabel: { lead: "Lead", senior: "Senior", mid: "Middle" },
    },
    contact: {
      sectionTitle:  "Давайте работать вместе",
      subtitle:      "Есть идея для проекта? Мы хотим её услышать. Напишите нам — ответим в течение 24 часов.",
      telegramLabel: "Telegram",
      emailLabel:    "Email",
      hoursLabel:    "Рабочие часы",
      hoursValue:    "Пн – Пт · 9:00 – 18:00 (UTC+6)",
      locationLabel: "Местоположение",
      locationValue: "Бишкек, Кыргызстан",
      formTitle:     "Написать нам",
      name:          "Ваше имя",
      email:         "Ваш email",
      message:       "Расскажите о вашем проекте",
      send:          "Отправить заявку",
    },
    footer: {
      tagline: "Строим будущее — строчка за строчкой.",
      nav: {
        services:  "Услуги",
        portfolio: "Портфолио",
        about:     "О нас",
        contact:   "Контакты",
      },
      rights: "Все права защищены.",
    },
  },
};

export function LangProvider({ children }) {
  const [lang, setLang] = useState("en");
  const t = T[lang];
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}
