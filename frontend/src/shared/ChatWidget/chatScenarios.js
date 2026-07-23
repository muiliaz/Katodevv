export const TG_HANDLE = '@katodevv';

export const STEPS = {
  welcome: {
    msgs: ['👋 Привет! Я ассистент Kato Devv.\nПомогу подобрать решение или отвечу на вопросы.\nС чего начнём?'],
    replies: [
      { label: '💬 У меня есть проект',      next: 'ask_project_type', data: { type: 'project' } },
      { label: '💰 Узнать цены',              next: 'prices' },
      { label: '🤖 Хочу бота для бизнеса',   next: 'ask_bot_type',    data: { type: 'bot' } },
      { label: '👤 Связаться напрямую',       next: 'direct' },
    ],
  },

  ask_project_type: {
    msgs: ['Отлично! Расскажите кратко — что нужно сделать?'],
    replies: [
      { label: 'Сайт',                 next: 'ask_budget', data: { projectType: 'Сайт' } },
      { label: 'Мобильное приложение', next: 'ask_budget', data: { projectType: 'Мобильное приложение' } },
      { label: 'Бот',                  next: 'ask_budget', data: { projectType: 'Бот' } },
      { label: 'Автоматизация',        next: 'ask_budget', data: { projectType: 'Автоматизация' } },
      { label: 'Другое',               next: 'ask_budget', data: { projectType: 'Другое' } },
    ],
  },

  ask_bot_type: {
    msgs: ['Какой бот нужен?'],
    replies: [
      { label: 'Запись клиентов',    next: 'ask_budget', data: { projectType: 'Запись клиентов' } },
      { label: 'AI-консультант',     next: 'ask_budget', data: { projectType: 'AI-консультант' } },
      { label: 'Магазин в Telegram', next: 'ask_budget', data: { projectType: 'Магазин в Telegram' } },
      { label: 'Парсер/уведомления', next: 'ask_budget', data: { projectType: 'Парсер/уведомления' } },
      { label: 'Другое',             next: 'ask_budget', data: { projectType: 'Другое' } },
    ],
  },

  ask_budget: {
    msgs: ['Понял. Какой ориентировочный бюджет?'],
    replies: [
      { label: 'До $1000',    next: 'ask_deadline', data: { budget: 'До $1000' } },
      { label: '$1000–3000',  next: 'ask_deadline', data: { budget: '$1000–3000' } },
      { label: '$3000–10000', next: 'ask_deadline', data: { budget: '$3000–10000' } },
      { label: '$10000+',     next: 'ask_deadline', data: { budget: '$10000+' } },
      { label: 'Не знаю',     next: 'ask_deadline', data: { budget: 'Не знаю' } },
    ],
  },

  ask_deadline: {
    msgs: ['Когда нужно запустить?'],
    replies: [
      { label: 'Срочно (1–2 недели)', next: 'ask_contact', data: { deadline: 'Срочно (1–2 недели)' } },
      { label: 'Месяц',               next: 'ask_contact', data: { deadline: 'Месяц' } },
      { label: '2–3 месяца',          next: 'ask_contact', data: { deadline: '2–3 месяца' } },
      { label: 'Не горит',            next: 'ask_contact', data: { deadline: 'Не горит' } },
    ],
  },

  ask_contact: {
    msgs: ['Супер. Оставьте ваш контакт — Telegram или email — и я передам бриф команде. Свяжемся в течение часа.'],
    replies: [],
    input: true,
  },

  prices: {
    msgs: [
      '🌐 Сайты\n  • Лендинг — от $400\n  • Бизнес-сайт — от $800\n  • Интернет-магазин — от $1500\n\n🤖 Боты\n  • Telegram-бот — от $100\n  • AI-консультант — от $800\n  • Mini App — от $1500\n\n📱 Мобильные приложения — от $3000\n⚙️ Автоматизация — от $300\n\nФинальная цена зависит от задач. Обсудим?',
    ],
    replies: [
      { label: 'Обсудить проект',    next: 'ask_project_type', data: { type: 'project' } },
      { label: 'Связаться напрямую', next: 'direct' },
    ],
  },

  direct: {
    msgs: [`Конечно! Напишите в Telegram:\n${TG_HANDLE}\n\nИли оставьте свой контакт — напишу я:`],
    replies: [],
    input: true,
  },

  ask_free_contact: {
    msgs: ['Я пока работаю по сценариям. Передам ваше сообщение Kato напрямую — он ответит лично. Оставьте, пожалуйста, контакт для связи:'],
    replies: [],
    input: true,
  },

  done: {
    msgs: ['Спасибо! Бриф отправлен. Ждите сообщения от Kato в ближайшее время. 🚀'],
    replies: [{ label: '🏠 Начать заново', next: 'restart' }],
  },

  done_direct: {
    msgs: ['Отлично! Передал ваш контакт. Kato свяжется с вами совсем скоро 👍'],
    replies: [{ label: '🏠 Начать заново', next: 'restart' }],
  },

  error: {
    msgs: [`Что-то пошло не так. Напишите мне в Telegram: ${TG_HANDLE}`],
    replies: [
      { label: 'Попробовать снова', next: 'retry_contact' },
      { label: '🏠 Начать заново',  next: 'restart' },
    ],
  },
};
