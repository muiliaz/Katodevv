# kato-devv — Project Documentation

## О проекте
Лендинг для агентства **Kato Dev** — разработка сайтов, мобильных приложений, автоматизации и AI-ботов.
Деплой: Netlify (frontend) + сервер (backend).

---

## Стек технологий

### Frontend (`/frontend`)
| Технология | Версия | Назначение |
|---|---|---|
| React | 19 | UI фреймворк |
| Three.js | 0.183 | 3D-сцена (чёрная дыра, звёзды, кубы) |
| @react-three/fiber | 9 | React-обёртка для Three.js |
| @react-three/drei | 10 | Stars, helpers |
| @react-three/postprocessing | 3 | Bloom, Vignette, Gravitational Lens |
| GSAP + ScrollTrigger | 3.14 | Scroll-анимации, кинематика |
| Lenis | 1.3 | Плавный скролл, синхронизированный с GSAP |
| CSS Modules | — | Стили по компонентам |

### Backend (`/backend`)
| Технология | Назначение |
|---|---|
| Node.js + Express 5 | API-сервер |
| body-parser, cors | Middleware |

### Деплой
- **Netlify** — frontend (netlify.toml настроен)
- **Telegram Bot** — уведомления о заявках

---

## Архитектура

```
/ (root)
├── frontend/
│   ├── src/
│   │   ├── App.js                  # Lenis, GSAP setup, layout
│   │   ├── LangContext.js          # ENG/RU переключение
│   │   ├── components/
│   │   │   ├── BlackHole/          # Three.js сцена (линза, кубы, морф)
│   │   │   ├── ScrollJourney/      # GSAP ScrollTrigger таймлайн
│   │   │   ├── StarField.jsx       # Постоянный фоновый звёздный Canvas
│   │   │   ├── Hero.js             # Главный экран
│   │   │   ├── Services.js         # Карточки услуг + модальные демо
│   │   │   ├── Portfolio.js        # Работы
│   │   │   ├── About.js            # О команде
│   │   │   ├── Contact.js          # Форма связи
│   │   │   ├── Navbar.js
│   │   │   ├── Footer.js
│   │   │   ├── Loader.js
│   │   │   └── Cursor.js           # Кастомный курсор
│   └── public/
├── backend/
│   └── server.js                   # Express API
└── netlify.toml
```

---

## Scroll Journey (поведение при скролле)

300vh sticky секция с Hero:
- **0–35%** — Hero-текст и сайдбары уходят
- **15–75%** — металлические кубы летят из центра к позициям карточек
- **75–100%** — кубы приземляются, морфируют в карточки услуг
- **85–100%** — BlackHole canvas плавно гаснет (открывается StarField)
- **После journey** — контент-секции появляются с GSAP fade-in

---

## Выполненные задачи

- [x] Базовая структура лендинга (Hero, Services, Portfolio, About, Contact, Footer)
- [x] Мультиязычность ENG / RU через LangContext
- [x] Three.js сцена: чёрная дыра с гравитационной линзой, film grain, Bloom/Vignette
- [x] Металлические кубы: полёт, приземление, морф в карточки услуг
- [x] GSAP ScrollTrigger: весь скролл-таймлайн вынесен в ScrollJourney
- [x] Lenis smooth scroll, синхронизирован с GSAP ticker
- [x] Модальные демо в Services (браузер-мокап, телефон iOS/Android, n8n-флоу, чат-бот)
- [x] Кастомный курсор
- [x] Telegram-уведомления о заявках
- [x] Деплой на Netlify
- [x] Фикс: дублирование карточек при появлении (убран `overflow: hidden`, GSAP `clearProps`)
- [x] Фикс: чёрный фон карточек в Safari (убран `overflow: hidden` с `.services`)
- [x] Фикс: чёрный контейнер при появлении карточек (cube-card-overlay вынесен в отдельный слой `bh-cards-layer`, гасится независимо)
- [x] StarField — отдельный постоянный звёздный Canvas за всеми секциями
- [x] Фикс: левый сайдбар исчезал после прокрутки вниз/вверх — `gsap.to` заменён на `gsap.fromTo` с явным `{ opacity: 1, x: 0 }` в ScrollJourney; entrance-анимация в Hero.js перенесена на дочерние элементы (`.stack-columns`, `.sidebar-label`) с `clearProps`
- [x] Фикс Safari: непрозрачный фон секции Services (и всех content-sections) — три изменения:
  - `index.css`: `html { background: #000 }` + `body { background: transparent }` — в Safari `body` с непрозрачным фоном блокировал отображение `position: fixed` StarField через прозрачные секции
  - `App.js`: убран `zIndex: 1` с `#content-sections` — z-index создавал stacking context, который Safari рендерил как непрозрачный compositing layer (чёрный), закрывая звёздный фон
  - `App.js` + `Services.css`: определение Safari через userAgent → класс `is-safari` на `<html>` → `.is-safari .card` без `backdrop-filter` (тёмный полупрозрачный фон вместо blur), т.к. `backdrop-filter` в Safari создаёт compositing layers, усугубляющие проблему

### Hero Section — редизайн заголовка (текущая сессия)
- [x] Шрифт заголовка `KATO DEVV` — подключён **Micro 5** (Google Fonts) для обоих слов
- [x] **KATO** — белый `#ffffff`, pixel-noise анимация: горизонтальные артефакты раз в ~6с (CSS `clip-path` + pseudo-элемент)
- [x] **DEVV** — серебряный градиент `#e8e8f0→#c8cbd8→#e0e2ec`, глитч-анимация: два скрытых слоя `::before` (красный `#E94560`) и `::after` (cyan `#00eaff`), смещение `±4-5px translateX`, срабатывает раз в ~4с
- [x] Выравнивание лейбла "SERVICES" в правом сайдбаре по центру (`text-align: center`)
- [x] Левый сайдбар **STACK** — переработан в вертикальный бесконечный marquee:
  - Два столбца карточек рядом, движутся в противоположных направлениях (один вверх, другой вниз)
  - Иконки через **skillicons.dev**, 28 технологий всего
  - Колонка A (снизу→вверх, 28с): Go, Flutter, Postgres, FastAPI, Next.js, Python, TypeScript, React, Docker, Redis, MongoDB, Firebase, Kotlin, Swift
  - Колонка B (сверху→вниз, 36с, offset -12с): GraphQL, AWS, Nginx, VS Code, MySQL, Node.js, Git, GitHub, Figma, Tailwind, Linux, Vue, Jira, Jenkins
  - Карточки 80×80px, backdrop-filter blur, hover → пауза + подсветка рамки
  - Mask-image градиент сверху и снизу для плавного появления/исчезновения
- [x] Фикс: заголовок KATO DEVV визуально смещался влево — добавлен `width: fit-content; margin: 0 auto` на `.hero-v2-title`
- [x] Выравнивание лейбла "SERVICES" по центру правого сайдбара (`text-align: center`)

---

## Планы / Развитие

### Ближайшее
- [ ] Анимация появления секций Portfolio, About, Contact (аналогично Services)
- [ ] Мобильная адаптация (breakpoints, touch-жесты)
- [ ] Оптимизация Three.js для слабых устройств (fallback без canvas)
- [ ] SEO: meta-теги, Open Graph, sitemap

### Будущее
- [ ] Блог / кейсы (отдельные страницы проектов)
- [ ] Форма обратной связи с валидацией и email-уведомлениями
- [ ] Панель администратора для управления заявками
- [ ] Аналитика (GA4 или Plausible)
- [ ] A/B тест CTA-кнопок

---

## Команда
- **Kato Dev** — разработка и дизайн
