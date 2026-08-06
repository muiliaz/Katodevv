# 07 — Гигиена конфигурации

**Приоритет:** P2
**Аудит-источники:**
- `auditfiles/anastasiakrivova-stack---audit-config-hygiene-2026-08-04.md` (53/100)
- `auditfiles/anastasiakrivova-stack---audit-tech-health-2026-08-04.md` (TH-002)
- `auditfiles/anastasiakrivova-stack---audit-cicd-2026-08-04.md` (шаг 6)
- `auditfiles/anastasiakrivova-stack---audit-ai-readiness-2026-08-04.md` («Безопасность окружения», 4/10)

**Дата:** 2026-08-05

---

## Проблема

Аудит гигиены конфигурации — 53/100, и главная находка помечена как высокая:

> | Обязательные Telegram env-переменные читаются кодом, но не объявлены в репозитории | Высокий | Высокая | `frontend/netlify/functions/lib/telegram.js:27`, `:28`, `frontend/README.md:1` |

Оценка «готовности к запуску» — **«Нужно разбираться»**:

> Стандартный путь сборки frontend виден в `frontend/package.json`, `frontend/README.md` и
> `netlify.toml`, но рабочие функции `contact` и `lead` требуют обязательных Telegram env-ключей,
> которые приходится обнаруживать в `frontend/netlify/functions/lib/telegram.js`.

Та же дыра — в трёх других отчётах:

| Аудит | Формулировка |
|---|---|
| tech-health TH-002 | «Runtime-переменные Telegram не имеют безопасного примера»; «настройка нового окружения и локальная проверка форм становятся хрупкими» |
| ai-readiness | «`frontend/netlify/functions/lib/telegram.js` требует `TELEGRAM_TOKEN` и `TELEGRAM_CHAT_ID`, а `.env.example` и инструкция по настройке отсутствуют» |
| config-hygiene, критерии | «Наличие и синхронность шаблонов» — 2/5; «Чтения в коде задекларированы» — 2/5; «Качество значений по умолчанию» — 2/5 |

Вторая находка — из аудита CI/CD, шаг 6:

> | Окружение CI может меняться без изменения репозитория | Низкое: ухудшается воспроизводимость сбоев | `ubuntu-latest`, `actions/checkout@v4`, `actions/setup-node@v4` |

За неё аудит снял 1 балл: `67 − 8 − 1 = 58/100`.

---

## Ход рассуждения

### Почему отсутствие `.env.example` — это не формальность

Соблазн отнестись к пункту как к бюрократии. Но у этого дефекта конкретный сценарий отказа, и он
неприятный.

`lib/telegram.js:30` бросает исключение, если переменных нет. Оно ловится в `catch` handler-а и
превращается в 500. То есть **функция, задеплоенная без переменных, выглядит рабочей**: сайт
собирается, форма рендерится, кнопка нажимается — и заявка молча теряется. Ни сборка, ни CI об
этом не скажут: переменные нужны в рантайме, а не при сборке.

Аудит формулирует это как «env-ошибка проявится лишь при первом POST» (критерий «Явная
валидация», 3/5). Добавлю: проявится она у **посетителя**, а не у разработчика.

После шага 01 ситуация даже строже: раньше ответ содержал `Telegram credentials not configured`,
и по нему можно было догадаться. Теперь наружу идёт обезличенный текст — и это правильно с точки
зрения безопасности, но означает, что диагностика полностью переехала в логи Netlify. Тем важнее,
чтобы контракт был записан заранее.

### Где размещать файл

`netlify.toml` задаёт `base = "frontend"`, значит и сборка, и `netlify dev` работают из этого
каталога. Файл положен в `frontend/.env.example` — рядом с `package.json` и с самими функциями.

Проверил, что он не попадёт под правила игнорирования (в корневом `.gitignore` есть `.env`,
`*.env`, `.env.*.local`):

```
$ git check-ignore -v frontend/.env.example
OK: .env.example не игнорируется
```

Паттерн `*.env` матчит файлы, **оканчивающиеся** на `.env`; `.env.example` оканчивается на
`.example`. Проверил явно, а не по рассуждению, потому что молча проигнорированный шаблон — худший
из возможных исходов этого шага.

### Что писать в шаблоне

Аудит задаёт критерий приёмки: «Новый сопровождающий называет оба ключа и место их задания, не
открывая `telegram.js`; образец не содержит секретов».

Из этого следует, что одних имён недостаточно — нужно **место задания**. Поэтому в файле есть
явное указание, что в продакшене значения берутся не из файла, а из панели Netlify, с точным путём
`Site configuration → Environment variables`, и указание scope `Functions`.

Добавил также способ узнать `TELEGRAM_CHAT_ID` (через `getUpdates`) — это то, на чём реально
застревают при настройке, и это не секрет, а процедура.

### Закрепление окружения CI: что смог и чего не смог

| Что | Сделано | Почему |
|---|---|---|
| `runs-on: ubuntu-latest` → `ubuntu-24.04` | ✅ | `ubuntu-24.04` — стабильная документированная метка runner-образа, её корректность не требует сетевой проверки |
| `permissions: contents: read` | ✅ | Аудит CI/CD отмечал «явные `permissions` не заданы» (4/5 за гигиену workflow). Джобу нужен только доступ на чтение |
| `actions/checkout@v4`, `actions/setup-node@v4` → SHA | ❌ | **Не сделал сознательно** |

Про последнее подробно, потому что это отказ от прямой рекомендации аудита.

Закрепление на SHA требует знать актуальные дайджесты тегов. Сетевого доступа к GitHub нет, `gh` не
установлен. Написать правдоподобный SHA «по памяти» — значит с высокой вероятностью указать
несуществующий коммит и **сломать CI полностью**, причём сломать именно тот механизм, который на
шаге 04 предлагается сделать обязательным для мерджа.

Между «оставить плавающий тег и честно это пометить» и «вписать выдуманный хеш» выбор очевиден.
В workflow стоит комментарий, что это незакрытая половина находки, со ссылкой сюда; точная
инструкция — в конце файла.

### Дополнительно: проверка env-контракта в CI

Аудит конфигурации предлагает этап 7:

> | 7 — усилить валидацию | Средний | Добавить узкую CI-проверку соответствия `process.env.*` в Netlify Functions безопасному образцу или документации. | Признак завершения: CI называет отсутствующий ключ и падает при новом незадекларированном env-чтении, не требуя реальных секретов. |

Сделал, потому что без этого `.env.example` — документ, который устареет при первом же новом
`process.env.X`, и никто этого не заметит. Шаблон без проверки живёт ровно до следующей правки.

Решения по реализации:

| Вопрос | Выбор | Почему |
|---|---|---|
| Готовый пакет или свой скрипт | Свой, ~70 строк | Задача узкая; новая зависимость в проекте с 18 незакрытыми предупреждениями — плохой размен |
| Что сканировать | Только `netlify/functions/**` | Это единственное место, где проект читает `process.env`. React-часть использует переменные сборки, у них другой жизненный цикл |
| Строгость | Только наличие имени | Проверять значения нельзя — их нет и не должно быть в репозитории |
| `NODE_ENV`, `CI` | В списке исключений | Их задаёт платформа, декларировать нечего |
| Где в CI | **До** тестов | Проверка идёт доли секунды; ломать контракт и узнавать об этом после сборки — терять минуты впустую |

---

## Что сделано

| Файл | Действие |
|---|---|
| `frontend/.env.example` | **создан** — контракт с `TELEGRAM_TOKEN`, `TELEGRAM_CHAT_ID`, без значений |
| `frontend/scripts/check-env-contract.js` | **создан** — проверка соответствия чтений и деклараций |
| `frontend/package.json` | добавлен скрипт `check:env` |
| `.github/workflows/ci.yml` | `ubuntu-24.04`; блок `permissions`; шаг `Check env contract`; комментарий про незакреплённые actions |

---

## Diff

`.github/workflows/ci.yml`:

```diff
 on:
   push:
     branches: [main]
   pull_request:

+# The job only reads the repository. Without this block the token carries
+# whatever the repository defaults grant, which is usually more.
+permissions:
+  contents: read
+
 jobs:
   build:
-    runs-on: ubuntu-latest
+    # Pinned rather than ubuntu-latest: that label moves to a new image on
+    # GitHub's schedule, so a build can start failing without a commit and
+    # a past failure cannot be reproduced.
+    runs-on: ubuntu-24.04
@@
+      - name: Check env contract
+        # Cheap and needs no secrets: fails if a function reads a variable
+        # .env.example does not declare. Runs before the tests so a broken
+        # contract is reported in seconds rather than after the build.
+        run: npm run check:env
+
       - name: Test
         run: npm run test:ci
```

`frontend/.env.example` — ключевая часть:

```
# In production these are NOT read from a file. Set them in the Netlify UI:
#   Site configuration -> Environment variables -> Add a variable
#   Scope: Functions
#
# Both are required. Without them the contact and lead endpoints answer 500
# and nothing reaches Telegram — see netlify/functions/lib/telegram.js.

TELEGRAM_TOKEN=
TELEGRAM_CHAT_ID=
```

Ядро проверки:

```js
const READ_RE = /process\.env(?:\.([A-Z0-9_]+)|\[\s*['"]([A-Z0-9_]+)['"]\s*\])/g;
// ...
if (undeclared.size) {
  console.error('✗ Environment variables read by the functions but not declared in .env.example:\n');
  for (const [name, files] of undeclared) {
    console.error(`    ${name}  — read in ${[...new Set(files)].join(', ')}`);
  }
  process.exit(1);
}
```

---

## Как проверено

### 1. Проверка проходит на текущем коде

```
$ npm run check:env
✓ env contract: 2 declared, every function read accounted for
exit=0
```

### 2. Проверка действительно ловит нарушение

Зелёный результат сам по себе ничего не доказывает — скрипт мог бы всегда возвращать успех.
Добавил в `lib/telegram.js` незадекларированное чтение `process.env.TELEGRAM_API_BASE`:

```
✗ Environment variables read by the functions but not declared in .env.example:

    TELEGRAM_API_BASE  — read in netlify/functions/lib/telegram.js

  Add each name to frontend/.env.example with an empty value and a comment
  saying what it is and where it is set. Never commit a real value.
exit=1
```

Это ровно критерий из аудита: «CI называет отсутствующий ключ и падает при новом
незадекларированном env-чтении, не требуя реальных секретов». Файл восстановлен из резервной
копии, повторный прогон снова зелёный.

### 3. Шаблон не игнорируется git

```
$ git check-ignore -v frontend/.env.example
OK: .env.example не игнорируется
```

### 4. Workflow валиден по структуре

```
табы: нет
runs-on: ubuntu-24.04
permissions: заданы
job id: build
```

**Важно:** `job id` остался `build`. Значит имя обязательной проверки не изменилось, и настройка
branch protection по инструкции шага 04 не сломается из-за этой правки — как и было обещано там.

`actionlint` не установлен, поэтому полноценной валидации схемы workflow не было. Проверил
отсутствие табов, структуру `jobs`/`steps` и ключевые поля.

### 5. Полный конвейер в новом составе

```
$ npm run check:env
✓ env contract: 2 declared, every function read accounted for

$ CI=true npm run test:ci
Test Suites: 6 passed, 6 total
Tests:       64 passed, 64 total

$ CI=true npm run build
Compiled with warnings.
exit=0
```

---

## Риски и что осталось

### Риски внесённых изменений

| Риск | Оценка | Обоснование |
|---|---|---|
| `ubuntu-24.04` окажется недоступен | Низкий | Поддерживаемая метка GitHub-hosted runner. Если образ будет выведен, CI упадёт явно, с понятным сообщением |
| Новый шаг CI даст ложное срабатывание | Низкий | Регулярное выражение покрывает `process.env.X` и `process.env['X']`. Динамическое обращение вида `process.env[name]` он не увидит — это ложноотрицательный результат, не ложноположительный, то есть не заблокирует корректный код |
| `permissions: contents: read` что-то сломает | Низкий | Джоб только читает код и ставит зависимости; ничего не пишет в репозиторий и не обращается к API |

### Требует владельца

#### 1. Проверить, что переменные заданы в Netlify

Шаблон описывает контракт, но не подтверждает, что значения действительно проставлены на проде —
доступа к панели у меня нет.

1. Netlify → сайт katodevv.com → **Site configuration → Environment variables**.
2. Убедиться, что есть `TELEGRAM_TOKEN` и `TELEGRAM_CHAT_ID` и у них scope включает **Functions**.
3. Проверка живьём: отправить заявку с katodevv.com и убедиться, что сообщение пришло в чат.
   Если не пришло — **Logs → Functions** покажет `contact function error:` со stack trace
   (после шага 01 логируется весь объект ошибки, а не только текст).

#### 2. Закрепить actions на SHA

Это незакрытая половина находки. Выполняется однократно, там, где есть сеть:

```bash
# узнать актуальные дайджесты
gh api repos/actions/checkout/git/ref/tags/v4   --jq .object.sha
gh api repos/actions/setup-node/git/ref/tags/v4 --jq .object.sha
```

Затем в `.github/workflows/ci.yml` заменить, подставив полученные значения и сохранив тег в
комментарии — иначе через полгода никто не поймёт, какая это версия:

```yaml
- uses: actions/checkout@<sha>   # v4
- uses: actions/setup-node@<sha> # v4
```

После этого удалить из workflow комментарий `NOTE: these two are still on floating major tags`.

**Побочный эффект, о котором стоит знать заранее:** закреплённые SHA перестают обновляться сами,
включая обновления безопасности. Поэтому имеет смысл сразу завести `.github/dependabot.yml` с
экосистемой `github-actions` — тогда обновления будут приходить контролируемыми PR. Я его не
добавил: это не запрошено ни одним из аудитов, а PR-шум — решение владельца, а не моё.

### Что осталось по чек-листу аудита конфигурации

| Этап | Статус |
|---|---|
| 1 — задекларировать `TELEGRAM_*` | ✅ выполнено |
| 7 — CI-проверка env-контракта | ✅ выполнено |
| 6 — единый источник canonical URL | ❌ не сделано |
| 6 — строковые контракты формы и чат-виджета | ❌ не сделано |

Про **canonical URL**: домен `katodevv.com` дублируется в пяти местах — `public/index.html:16`,
`public/sitemap.xml:4`, `public/robots.txt:5`, `src/shared/Seo.js:3` и
`netlify/functions/contact.js:29`. Три из пяти — статические файлы в `public/`, которые нельзя
импортировать из JS без шага генерации. Централизация требует build-скрипта, то есть отдельной
задачи с собственным риском; аудит оценивает её как средний приоритет. Не делаю, обосновано ещё в
`00-plan.md`.

Про **строковые контракты**: аудит предлагает контрактный тест на honeypot между клиентом и
сервером (низкий приоритет). Частично это уже закрыто шагом 02: `netlifyContact.test.js` и
`netlifyLead.test.js` проверяют серверную сторону honeypot, а `Contact.test.js` — клиентскую.
Чего нет — теста, который упал бы при **переименовании** поля только с одной стороны. Кандидат на
следующую сессию.
