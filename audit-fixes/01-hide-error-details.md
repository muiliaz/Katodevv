# 01 — Убрать текст внутренней ошибки из публичных ответов

**Приоритет:** P0
**Аудит-источник:** `auditfiles/anastasiakrivova-stack---audit-vulns-2026-08-04.md`
**Дата:** 2026-08-05

---

## В двух словах

Самая дешёвая правка из всех, поэтому с неё и начали. Наши функции при любом сбое отдавали наружу
текст исключения — а там могло оказаться «Telegram credentials not configured» или ответ самого
Telegram вроде «chat not found». То есть посторонний человек мог по ответу формы понять, что у нас
сломана интеграция.

Заменили на один нейтральный текст, детали убрали в логи. Перед этим проверили все три места, где
сайт отправляет формы, — ни одно из них тело ответа не читает, так что на интерфейсе это никак не
сказалось.

---

## Проблема

Аудит безопасности зафиксировал находку уровня **Low**:

> | Low | Клиенту возвращается текст внутренней ошибки | Внешний пользователь может различать ошибки конфигурации и ответы Telegram, что упрощает разведку | `frontend/netlify/functions/contact.js:39`; `frontend/netlify/functions/lead.js:45`; `frontend/netlify/functions/lib/telegram.js:30` |

И в разделе «Шаги по улучшению», пункт 4:

> Заменить публичный `err.message` на стабильную общую ошибку, сохранив детали только в серверных
> журналах без секретов. Готово, когда ошибки парсинга, конфигурации и Telegram не отражаются клиенту.

Обе публичные функции ловили любое исключение и клали его текст прямо в тело ответа:

```js
return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
```

Что именно утекало наружу, мы проверили по коду — источников `err.message` в этом `catch` три:

| Источник | Текст | Что узнаёт внешний вызывающий |
|---|---|---|
| `JSON.parse(event.body)` | `Unexpected token ... in JSON at position N` | что тело даже не распарсилось — можно отделить проблему формата от проблемы валидации |
| `lib/telegram.js:31` `getCredentials()` | `Telegram credentials not configured` | **функция задеплоена без env-переменных** — прямой сигнал, что интеграция сломана и заявки никуда не уходят |
| `lib/telegram.js:53` `if (!data.ok) throw new Error(data.description)` | текст ошибки от Telegram API, например `Bad Request: chat not found`, `Forbidden: bot was blocked by the user` | состояние чужого бота: жив ли, заблокирован ли, существует ли чат |

Третий пункт — самый неприятный. `data.description` формируется на стороне Telegram, то есть
проект ретранслировал наружу текст третьей стороны, не контролируя его содержимое.

---

## Ход рассуждения

### Проверка №1: не сломает ли это интерфейс

Первое, что нужно было исключить, — что какой-то из клиентов показывает `error` из тела ответа
пользователю. Если показывает, то замена на общий текст ухудшит UX, и решение надо было бы делать
иначе (например, коды ошибок вместо текста).

Проверили все три точки отправки:

| Клиент | Строка | Что делает с ответом |
|---|---|---|
| `src/pages/web/Contact.js` | `:58` | `if (!res.ok) throw new Error();` — тело не читает вообще |
| `src/shared/ChatWidget/ChatWidget.jsx` | `:56` | `const json = await res.json();` → читает только `json.success` |
| `src/pages/bots/Bots.js` | `:275-276` | `setStatus(json.success ? "done" : "error")` — читает только `json.success` |

Ни один клиент поле `error` не использует. Все три показывают собственный локализованный текст из
`LangContext`. Значит замена содержимого `error` на константу — **изменение с нулевым влиянием на
UI**. Это сняло единственный реальный аргумент против прямолинейного решения.

### Проверка №2: что НЕ надо прятать

Важная граница, которую легко перейти по инерции: ответ `400` от `validateContact` / `validateLead`
выглядит похоже —

```js
return { statusCode: 400, body: JSON.stringify({ error: errors.join(', ') }) };
```

— но прятать его **не нужно и вредно**. Эти сообщения (`name is too short`,
`email is not a valid address`) описывают ввод самого вызывающего, а не наши внутренности. Они не
дают никакой информации о системе, зато полезны при отладке интеграции. Разведочной ценности в них
нет: любой может получить тот же текст, отправив заведомо плохой payload.

Поэтому правка касается только блока `catch`, а `400` остаётся дословным.

### Куда положить константу — рассмотренные варианты

| Вариант | Оценка |
|---|---|
| Литерал прямо в обоих `catch` | Отклонён. Строка — часть публичного HTTP-контракта двух эндпоинтов. Продублировать её значит гарантировать, что однажды они разойдутся. Аудит гигиены конфигурации уже отмечает эту болезнь отдельной находкой: «Строковые контракты формы и чат-виджета не имеют общего источника» |
| Добавить в `lib/validation.js` | Отклонён. Модуль про правила валидации входных данных; текст ответа при внутреннем сбое — не его ответственность. Свалить туда константу значит размыть назначение файла |
| Добавить в `lib/telegram.js` | Отклонён по той же причине: модуль про транспорт в Telegram. Ошибка парсинга JSON к Telegram отношения не имеет |
| Полноценный `lib/responses.js` с хелперами `ok()`, `badRequest()`, `serverError()` | Отклонён **для этого шага**. Это переписывание формы обоих handler-ов целиком, а сейчас их поведение не закреплено ни одним тестом (тесты появятся на шаге 02). Менять форму непокрытого кода ради красоты — плохой размен |
| Новый `lib/responses.js` только с константой | ✅ **Выбран.** Один смысл, один файл, ноль изменений в структуре handler-ов. На шаге 03 туда же ляжет текст ответа для 429 |

### Почему `console.error(err)` вместо `console.error(err.message)`

Исходный код логировал только `err.message`, то есть терял stack trace. Раз наружу мы теперь не
отдаём ничего, единственный источник диагностики — логи функций в Netlify, и они должны стать
**подробнее**, а не остаться прежними. Передача объекта целиком даёт stack.

Секретов это не раскрывает: `TELEGRAM_TOKEN` в текст ошибок не попадает — `getCredentials()` бросает
фиксированную строку `'Telegram credentials not configured'`, а URL с токеном (`/bot${token}/sendMessage`)
в сообщение об ошибке не подставляется, потому что `fetch` при HTTP-ошибке не бросает, а
`throw new Error(data.description)` использует только текст от Telegram. Это мы проверили по
`lib/telegram.js:39-55`.

---

## Что сделано

| Файл | Действие |
|---|---|
| `frontend/netlify/functions/lib/responses.js` | **создан** — константа `GENERIC_ERROR` |
| `frontend/netlify/functions/contact.js` | изменён — импорт константы, обезличенный ответ, логирование объекта ошибки |
| `frontend/netlify/functions/lead.js` | изменён — то же самое |

---

## Diff

### Новый `frontend/netlify/functions/lib/responses.js`

```js
// Shared response strings for the public form endpoints.
//
// Lives in lib/ for the same reason telegram.js does: Netlify only turns a
// subdirectory into a function when it holds an entry file named after the
// directory (or index.js), so this is bundled as shared code, never deployed
// as its own endpoint.
//
// The text is deliberately one fixed string for every internal failure. A
// caller must not be able to tell a JSON parse error from a missing env var
// from a Telegram rejection: those differences are recon material and none of
// them are actionable for the person filling in the form.
const GENERIC_ERROR = 'Something went wrong. Please try again later.';

module.exports = { GENERIC_ERROR };
```

### `frontend/netlify/functions/lead.js` (в `contact.js` — то же самое)

```diff
 const { sendMessage, escapeHtml } = require('./lib/telegram');
 const { isHoneypotFilled, validateLead } = require('./lib/validation');
+const { GENERIC_ERROR } = require('./lib/responses');

@@
   } catch (err) {
-    console.error('lead function error:', err.message);
-    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
+    // Generic on the wire, detailed in the logs — see contact.js.
+    console.error('lead function error:', err);
+    return { statusCode: 500, body: JSON.stringify({ error: GENERIC_ERROR }) };
   }
 };
```

В `contact.js` комментарий развёрнутый, в `lead.js` — ссылка на него, чтобы не дублировать
объяснение (тот же приём уже использован в проекте: `lead.js:12` `// Silent success for bots — see contact.js.`).

---

## Как проверено

### 1. В коде функций не осталось возврата `err.message`

```
$ grep -rn "err.message" netlify/
OK: err.message больше не возвращается
```

### 2. Фактическое поведение handler-ов

Прогнали оба handler-а напрямую в Node без `TELEGRAM_TOKEN`/`TELEGRAM_CHAT_ID` в окружении — это
воспроизводит ровно тот сценарий, где раньше утекало `Telegram credentials not configured`:

```
contact 500 -> 500 {"error":"Something went wrong. Please try again later."}
lead 500    -> 500 {"error":"Something went wrong. Please try again later."}
bad JSON    -> 500 {"error":"Something went wrong. Please try again later."}
validation  -> 400 {"error":"name is too short, email is too short, message is too short, email is not a valid address"}
```

Все три источника утечки (конфигурация, парсинг, Telegram) дают теперь один и тот же текст.
Ответ `400` остался дословным — как и задумано.

### 3. Регрессии

```
$ CI=true npm run test:ci
PASS src/pages/web/Contact.test.js
PASS src/__tests__/netlifyValidation.test.js

Test Suites: 2 passed, 2 total
Tests:       15 passed, 15 total
Time:        0.545 s
```

```
$ CI=true npm run build
Compiled with warnings.
Failed to parse source map from '.../node_modules/@mediapipe/tasks-vision/vision_bundle_mjs.js.map'
```

Сборка успешна. Предупреждение про source map — **предсуществующее** и к правке отношения не имеет:
это отсутствующий `.map` внутри транзитивного пакета `@mediapipe/tasks-vision` (приходит через
`@react-three/drei`). Оно же зафиксировано в аудите мёртвого кода как фоновое:
«предупреждения относились к карте исходного кода транзитивного пакета и Browserslist».

---

## Риски и что осталось

### Риски внесённого изменения

Практически нулевые. Изменена одна строка тела ответа в ветке, которая срабатывает только при
внутреннем сбое; ни один клиент это поле не читает (проверено выше по всем трём точкам отправки).
Откат — тривиальный revert одного коммита.

### Побочное наблюдение, которое мы НЕ стали чинить здесь

Битый JSON отдаёт **500**, хотя семантически это ошибка вызывающего и должно быть **400**
(см. вывод `bad JSON -> 500` выше). Причина в том, что `JSON.parse` стоит внутри общего `try`, и
его исключение неотличимо от внутреннего сбоя.

Не чиним в этом шаге сознательно: это изменение публичного HTTP-контракта, а не сокрытие деталей, и
у него другой профиль риска. Правильный порядок — сначала закрепить текущее поведение тестами
(шаг 02), потом менять. Зафиксировано как задача шага 02/03.

### Что осталось по находке аудита

Находка Low из аудита vulns закрыта полностью: ошибки парсинга, конфигурации и Telegram больше не
отражаются клиенту.

Не покрыто тестами — на момент этого шага фикс проверен только ручным прогоном в Node.
Автоматическую проверку добавляет шаг 02 (`02-netlify-handler-tests.md`), где среди прочего
появится тест «падение Telegram не раскрывает текст ошибки».

**Требует владельца:** ничего.
