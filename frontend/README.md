# Kato Devv — сайт агентства

Маркетинговый сайт студии разработки Kato Devv (сайты, мобильные приложения, Telegram-боты и AI,
автоматизация). Задача сайта одна: **довести посетителя до заявки** — через контактную форму или
чат-виджет — и доставить её в Telegram-чат команды.

Продакшен: **https://katodevv.com** — деплоится автоматически из ветки `main`.

> Этот файл — точка входа для человека. Для AI-агента точка входа — [`../AGENTS.md`](../AGENTS.md)
> в корне репозитория.

---

## Быстрый старт

```bash
cd frontend
npm ci          # именно ci, не install — ставит ровно то, что в lockfile
npm start       # http://localhost:3000
```

Требуется **Node ≥ 24** и **npm ≥ 11** (закреплено в `engines`). Более старый npm отклонит
`package-lock.json` как рассинхронизированный — на этом однажды уже падал CI.

Формы в таком режиме работать не будут: они ходят в Netlify Functions, которых у dev-сервера CRA
нет. Как поднять их локально — ниже, в разделе «Формы и Telegram».

---

## Что где лежит

Сайт **мульти-страничный**: хаб на `/` предлагает выбрать направление, каждое — отдельная страница
со своим оформлением. Все маршруты подключены через `React.lazy`, поэтому тяжёлый Three.js-бандл
`/web` не попадает в остальные страницы.

| Маршрут | Компонент | Что это |
|---|---|---|
| `/` | `src/pages/hub/Hub.js` | Выбор направления: 3 карточки + `LaserShowcase` (CSS-3D коверфлоу кейсов) |
| `/web` | `src/pages/web/WebDev.js` | Основная страница-визитка: WebGL-чёрная дыра, скролл-джорни, услуги, о нас, контакты |
| `/bots` | `src/pages/bots/Bots.js` | Продуктовая страница Katobot: маскот, тарифы, кейсы |
| `/apps` | `src/pages/apps/Apps.js` | Интерактивная игра «собери приложение» вместо статичной страницы услуг |

```
frontend/
├── netlify/functions/       # серверная часть — приём заявок
│   ├── contact.js           #   POST /.netlify/functions/contact  (форма на /web)
│   ├── lead.js              #   POST /.netlify/functions/lead     (чат-виджет и модалка /bots)
│   └── lib/
│       ├── validation.js    #   серверная валидация + honeypot
│       ├── rateLimit.js     #   ограничение частоты по IP
│       ├── telegram.js      #   отправка в Telegram, экранирование HTML
│       └── responses.js     #   тексты публичных ответов
├── scripts/
│   └── check-env-contract.js  # CI-проверка: все process.env объявлены в .env.example
├── src/
│   ├── app/App.js           # BrowserRouter + Routes, lazy-загрузка страниц
│   ├── shared/              # используется двумя и более страницами
│   │   ├── LangContext.js   #   EN/RU и весь копирайт сайта
│   │   ├── pricing.js       #   ЕДИНСТВЕННЫЙ источник цен и срока ответа
│   │   ├── Seo.js           #   per-page title/meta/OG
│   │   └── ChatWidget/      #   плавающий виджет заявки, есть на всех страницах
│   ├── pages/               # hub / web / bots / apps
│   └── __tests__/           # тесты серверной части и роутинга
└── public/                  # статика, robots.txt, sitemap.xml, _redirects
```

**Весь текст сайта живёт в `src/shared/LangContext.js`** — это самый частый ответ на вопрос
«где поменять надпись». Исключение — **цены и срок ответа: они в `src/shared/pricing.js`**, и
только там. Раньше одни и те же цифры лежали в трёх местах и разъехались; теперь все носители
рендерят их из одного источника, а тест не даст вписать цену в UI-файл руками.

---

## Команды

| Команда | Что делает |
|---|---|
| `npm start` | Dev-сервер на :3000 |
| `npm run build` | Production-сборка в `build/`. Той же командой собирает Netlify |
| `npm test` | Тесты в watch-режиме |
| `npm run test:ci` | Тесты один раз, без watch — **эта команда идёт в CI** |
| `npm run check:env` | Проверяет, что все `process.env` в функциях объявлены в `.env.example` |

CI (`.github/workflows/ci.yml`) выполняет ровно четыре шага, и их можно полностью воспроизвести
локально:

```bash
npm ci && npm run check:env && npm run test:ci && CI=true npm run build
```

`CI=true` для сборки существенно: в этом режиме react-scripts считает предупреждения ESLint
ошибками, как это и происходит в CI.

---

## Тесты

```bash
npm run test:ci                      # весь набор
npx react-scripts test --watchAll=false --testPathPattern=netlify   # только серверная часть
```

Покрытие серверной части измеряется отдельно, потому что функции лежат вне `src/`:

```bash
npx react-scripts test --watchAll=false --coverage \
  --collectCoverageFrom='netlify/functions/**/*.js' --testPathPattern='netlify'
```

Что покрыто:

| Файл | Что проверяет |
|---|---|
| `src/__tests__/netlifyContact.test.js` | `contact.handler`: успех, экранирование, не-POST, валидация, honeypot, отказ Telegram, лимит частоты |
| `src/__tests__/netlifyLead.test.js` | то же для `lead.handler` + необязательные поля чат-виджета |
| `src/__tests__/netlifyRateLimit.test.js` | окно лимитера, изоляция по IP и маршруту, защита памяти |
| `src/__tests__/netlifyValidation.test.js` | правила валидации как чистые функции |
| `src/__tests__/routing.test.js` | таблица маршрутов `App.js`, `Link`, `useNavigate` |
| `src/__tests__/pricing.test.js` | цены и срок ответа: формат, и что ни один UI-файл не содержит цену литералом |
| `src/pages/web/Contact.test.js` | контактная форма в браузерном окружении |

**Чего тестов нет** (чтобы не создавать ложного ощущения покрытия): страницы `/`, `/web`, `/bots`,
`/apps` не рендерятся в тестах — им нужны заглушки для WebGL, canvas 2D, `ResizeObserver`,
`matchMedia` и `scrollIntoView`. Реальная доставка в Telegram тоже не проверяется: `sendMessage`
замокан. E2E нет.

Тесты серверной части лежат в `src/__tests__/`, а не рядом с функциями, потому что Jest от
create-react-app подхватывает файлы только внутри `src/`.

---

## Формы и Telegram

Обе формы отправляют POST в Netlify Functions, функция валидирует payload и шлёт сообщение в
Telegram-чат.

```
Contact.js  ──POST──> /.netlify/functions/contact ──┐
ChatWidget  ──POST──> /.netlify/functions/lead   ──┼──> validation -> rateLimit -> telegram -> чат
Bots.js     ──POST──> /.netlify/functions/lead   ──┘
```

### Переменные окружения

Обе обязательны, обе читает `netlify/functions/lib/telegram.js`. Полное описание — в
[`.env.example`](.env.example).

| Переменная | Что это |
|---|---|
| `TELEGRAM_TOKEN` | Токен бота от @BotFather |
| `TELEGRAM_CHAT_ID` | Id чата-получателя (для групп — отрицательный) |

**В продакшене они задаются не файлом, а в панели Netlify:** Site configuration → Environment
variables, scope **Functions**.

Если их не задать, сайт всё равно соберётся и форма будет выглядеть рабочей — а заявка молча
потеряется с ответом 500. Ни сборка, ни CI это не поймают: переменные нужны в рантайме. Проверять
только вживую или в логах функций Netlify.

### Локальный запуск функций

Dev-сервер CRA функции не обслуживает. Нужен Netlify CLI:

```bash
npm i -g netlify-cli
cp .env.example .env      # заполнить своими значениями; .env в git не попадёт
netlify dev               # поднимет и сайт, и функции
```

### Защита эндпоинтов

Оба публичны, поэтому защищены на сервере, а не в браузере:

1. **Honeypot** — скрытое поле `company`. Если заполнено, ответ 200 «успех», но в Telegram ничего
   не уходит: бот не должен понять, что его распознали.
2. **Валидация** — длины и формат email; ошибки возвращаются дословно, они про ввод вызывающего.
3. **Ограничение частоты** — 5 запросов в минуту на IP и маршрут, иначе 429.
   ⚠️ Состояние живёт в памяти одного Lambda-контейнера: холодный старт его сбрасывает,
   параллельные контейнеры считают отдельно. Против распределённого флуда не помогает —
   подробности в `netlify/functions/lib/rateLimit.js`.
4. **Внутренние ошибки обезличены** — наружу идёт один и тот же текст, детали только в логах, чтобы
   по ответу нельзя было отличить проблему конфигурации от ответа Telegram.

---

## Деплой

Автоматический: пуш в `main` → сборка Netlify → https://katodevv.com. Настройки — в
[`../netlify.toml`](../netlify.toml): база `frontend`, команда `npm run build`, публикуется `build/`,
функции из `netlify/functions`, Node 24 (тот же мажор, что в CI).

`public/_redirects` содержит `/* /index.html 200` — без этого прямой заход на `/bots` дал бы 404,
потому что маршрутизация клиентская.

**Откат неудачного деплоя:** Netlify → Deploys → выбрать последний рабочий → ⋯ → **Publish deploy**.
Пересборка не нужна, переключение мгновенное.

---

## Известные ограничения

| Что | Подробности |
|---|---|
| `react-scripts@5.0.1` не сопровождается | Даёт 16 из 18 предупреждений `npm audit`. Все — инструменты сборки, в браузер не попадают. См. [`DEPENDENCIES.md`](DEPENDENCIES.md) |
| Обходные пути под react-router v7 | `jest.moduleNameMapper` в `package.json` и полифилл `TextEncoder` в `setupTests.js` — нужны только из-за старого Jest внутри react-scripts |
| Нет lint/format | Нет `.editorconfig`, Prettier и команды `lint`; в коде 13 подавлений `react-hooks/exhaustive-deps` вокруг GSAP/Three.js-таймлайнов |
| «Кастомный AI-агент» и «Кастомная автоматизация» | Две отдельные позиции с пересекающимися ценами ($2000 и $1500–2000). Один это продукт или два — из кода не следует |
| `LangContext.js` и `Services.js` крупные | Смешивают словари, данные и компоненты |

---

## Куда смотреть дальше

- [`../AGENTS.md`](../AGENTS.md) — контекст и границы безопасных изменений для агентов
- [`DEPENDENCIES.md`](DEPENDENCIES.md) — принятые предупреждения по зависимостям, с владельцем и сроком
- [`../audit-fixes/`](../audit-fixes/) — что и почему менялось по результатам аудитов
- [`../auditfiles/`](../auditfiles/) — сами отчёты аудитов (состояние на 2026-08-04)
