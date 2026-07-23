import React, {
  useReducer, useEffect, useLayoutEffect, useRef, useCallback, useState,
} from 'react';
import gsap from 'gsap';
import { STEPS } from './chatScenarios';
import styles from './ChatWidget.module.css';

// ─── State ────────────────────────────────────────────────────────────────────

const BLANK = {
  isOpen: false,
  messages: [],
  step: 'idle',
  collectedData: {},
  isTyping: false,
  isSending: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'OPEN':        return { ...state, isOpen: true };
    case 'CLOSE':       return { ...state, isOpen: false };
    case 'ADD_MSG':     return { ...state, messages: [...state.messages, action.msg] };
    case 'SET_TYPING':  return { ...state, isTyping: action.v };
    case 'SET_STEP':    return { ...state, step: action.step };
    case 'MERGE_DATA':  return { ...state, collectedData: { ...state.collectedData, ...action.data } };
    case 'SET_SENDING': return { ...state, isSending: action.v };
    case 'RESET':       return { ...BLANK, isOpen: state.isOpen };
    default:            return state;
  }
}

function initState() {
  try {
    const saved = sessionStorage.getItem('kato_chat');
    if (saved) {
      const p = JSON.parse(saved);
      return { ...BLANK, messages: p.messages || [], step: p.step || 'idle', collectedData: p.collectedData || {} };
    }
  } catch {}
  return { ...BLANK };
}

let _msgId = 0;
const makeMsg = (sender, text) => ({ id: ++_msgId, sender, text });

// ─── Lead submission (module-level to avoid recreation) ───────────────────────

async function postLead(data) {
  try {
    const res = await fetch('/.netlify/functions/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, timestamp: new Date().toLocaleString('ru-RU') }),
    });
    const json = await res.json();
    return !!json.success;
  } catch {
    return false;
  }
}

// ─── Focus trap helper ────────────────────────────────────────────────────────

function trapFocus(e, container) {
  if (e.key !== 'Tab' || !container) return;
  const els = container.querySelectorAll(
    'button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  if (!els.length) return;
  const first = els[0];
  const last  = els[els.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ChatWidget() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const { isOpen, messages, step, collectedData, isTyping, isSending } = state;

  const [showBadge, setShowBadge] = useState(false);

  const btnRef    = useRef(null);
  const winRef    = useRef(null);
  const endRef    = useRef(null);
  const breathRef = useRef(null);
  const timers    = useRef([]);
  const wasOpen   = useRef(false);

  // ── Persist to sessionStorage ─────────────────────────────────────────────
  useEffect(() => {
    if (step !== 'idle' || messages.length > 0) {
      sessionStorage.setItem('kato_chat', JSON.stringify({ messages, step, collectedData }));
    }
  }, [messages, step, collectedData]);

  // ── Set initial GSAP state before first paint ─────────────────────────────
  useLayoutEffect(() => {
    if (btnRef.current) gsap.set(btnRef.current, { opacity: 0, scale: 0 });
    if (winRef.current) gsap.set(winRef.current, { visibility: 'hidden', opacity: 0 });
  }, []);

  // ── Button appear + idle animations ──────────────────────────────────────
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    const appearTimer = setTimeout(() => {
      gsap.to(btn, {
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: 'back.out(1.7)',
        onComplete: () => {
          breathRef.current = gsap.to(btn, {
            scale: 1.03,
            duration: 3,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
          });
        },
      });
      setShowBadge(true);
      setTimeout(() => setShowBadge(false), 60000);
    }, 5000);

    const wiggleInterval = setInterval(() => {
      gsap.to(btn, {
        rotation: -5,
        duration: 0.1,
        ease: 'power2.inOut',
        yoyo: true,
        repeat: 3,
        onComplete: () => gsap.set(btn, { rotation: 0 }),
      });
    }, 8000);

    return () => {
      clearTimeout(appearTimer);
      clearInterval(wiggleInterval);
      gsap.killTweensOf(btn);
    };
  }, []);

  // ── Window open animation ─────────────────────────────────────────────────
  useEffect(() => {
    const win = winRef.current;
    if (!win) return;

    if (isOpen && !wasOpen.current) {
      gsap.set(win, { visibility: 'visible' });
      gsap.fromTo(win,
        { scale: 0.9, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' }
      );
    }
    wasOpen.current = isOpen;
  }, [isOpen]);

  // ── Auto-scroll to latest message ─────────────────────────────────────────
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── Escape key closes chat ────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && isOpen) triggerClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // ── Cleanup timers on unmount ─────────────────────────────────────────────
  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  // Run a step: show typing indicator for 800ms, then show bot messages
  const runStep = useCallback((stepKey) => {
    clearTimers();
    const s = STEPS[stepKey];
    if (!s) return;
    dispatch({ type: 'SET_TYPING', v: true });
    const t = setTimeout(() => {
      dispatch({ type: 'SET_TYPING', v: false });
      s.msgs.forEach((text) => dispatch({ type: 'ADD_MSG', msg: makeMsg('bot', text) }));
      dispatch({ type: 'SET_STEP', step: stepKey });
    }, 800);
    timers.current.push(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Open / Close ──────────────────────────────────────────────────────────
  const triggerOpen = useCallback(() => {
    setShowBadge(false);
    dispatch({ type: 'OPEN' });
    if (step === 'idle') {
      dispatch({ type: 'SET_STEP', step: 'starting' });
      const t = setTimeout(() => runStep('welcome'), 600);
      timers.current.push(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, runStep]);

  // External open trigger — any page can do
  //    window.dispatchEvent(new CustomEvent('kato:openChat')) to open this
  //    without needing a ref/prop wired through the tree (same pattern as
  //    the 'kato:serviceSelected' event used by the Hero service picker).
  useEffect(() => {
    const onExternalOpen = () => triggerOpen();
    window.addEventListener('kato:openChat', onExternalOpen);
    return () => window.removeEventListener('kato:openChat', onExternalOpen);
  }, [triggerOpen]);

  const triggerClose = useCallback(() => {
    const win = winRef.current;
    if (!win) { dispatch({ type: 'CLOSE' }); return; }
    gsap.to(win, {
      scale: 0.95,
      opacity: 0,
      y: 8,
      duration: 0.2,
      ease: 'power2.in',
      onComplete: () => {
        gsap.set(win, { visibility: 'hidden' });
        dispatch({ type: 'CLOSE' });
      },
    });
  }, []);

  // ── Quick reply handler ───────────────────────────────────────────────────
  const handleReply = useCallback((reply) => {
    dispatch({ type: 'ADD_MSG', msg: makeMsg('user', reply.label) });
    if (reply.data) dispatch({ type: 'MERGE_DATA', data: reply.data });

    if (reply.next === 'restart') {
      dispatch({ type: 'RESET' });
      sessionStorage.removeItem('kato_chat');
      const t = setTimeout(() => runStep('welcome'), 300);
      timers.current.push(t);
      return;
    }
    if (reply.next === 'retry_contact') {
      runStep('ask_contact');
      return;
    }
    runStep(reply.next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runStep]);

  // ── Free text / contact input handler ────────────────────────────────────
  const handleSubmit = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    dispatch({ type: 'ADD_MSG', msg: makeMsg('user', trimmed) });

    const s = STEPS[step];
    if (s?.input) {
      const isDirectOrFree = step === 'direct' || step === 'ask_free_contact';
      const merged = { ...collectedData, contact: trimmed };
      dispatch({ type: 'MERGE_DATA', data: { contact: trimmed } });
      dispatch({ type: 'SET_SENDING', v: true });

      const ok = await postLead({
        ...merged,
        type: merged.type || (isDirectOrFree ? 'direct' : 'project'),
      });

      dispatch({ type: 'SET_SENDING', v: false });
      runStep(ok ? (isDirectOrFree ? 'done_direct' : 'done') : 'error');
    } else {
      dispatch({ type: 'MERGE_DATA', data: { freeText: trimmed } });
      runStep('ask_free_contact');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, collectedData, runStep]);

  // ── Button hover ─────────────────────────────────────────────────────────
  const onBtnEnter = () => {
    breathRef.current?.pause();
    gsap.to(btnRef.current, { scale: 1.1, duration: 0.2, ease: 'power2.out' });
  };
  const onBtnLeave = () => {
    gsap.to(btnRef.current, {
      scale: 1,
      duration: 0.2,
      ease: 'power2.out',
      onComplete: () => breathRef.current?.resume(),
    });
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const stepDef      = STEPS[step];
  const quickReplies = stepDef?.replies || [];
  const inputDisabled = ['done', 'done_direct'].includes(step);
  const inputPlaceholder =
    step === 'ask_contact' || step === 'ask_free_contact' || step === 'direct'
      ? 'Telegram или email...'
      : 'Введите сообщение...';

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* ─ Floating Action Button ─ */}
      <button
        ref={btnRef}
        className={styles.button}
        onClick={triggerOpen}
        onMouseEnter={onBtnEnter}
        onMouseLeave={onBtnLeave}
        aria-label="Открыть чат"
      >
        <img src="/kato-avatar.png" alt="Kato Devv" className={styles.btnAvatar} />
        {showBadge && !isOpen && <span className={styles.badge}>1</span>}
      </button>

      {/* ─ Chat Window (always rendered — GSAP controls visibility) ─ */}
      <div
        ref={winRef}
        className={styles.window}
        role="dialog"
        aria-label="Chat with Kato Devv"
        aria-modal="true"
        aria-hidden={!isOpen}
        onKeyDown={(e) => trapFocus(e, winRef.current)}
      >
        {/* Header */}
        <header className={styles.header}>
          <img src="/kato-avatar.png" alt="" className={styles.headerAvatar} aria-hidden="true" />
          <div className={styles.headerInfo}>
            <span className={styles.headerName}>Kato Devv Assistant</span>
            <span className={styles.headerStatus}>
              <i className={styles.onlineDot} aria-hidden="true" />
              online
            </span>
          </div>
          <button className={styles.closeBtn} onClick={triggerClose} aria-label="Закрыть чат">
            ×
          </button>
        </header>

        {/* Messages */}
        <div className={styles.msgs} role="log" aria-live="polite" aria-label="Сообщения">
          {messages.map((m) => (
            <div key={m.id} className={`${styles.msg} ${m.sender === 'user' ? styles.msgUser : styles.msgBot}`}>
              <span className={styles.msgText}>{m.text}</span>
            </div>
          ))}
          {isTyping && (
            <div className={`${styles.msg} ${styles.msgBot}`} aria-label="Бот печатает">
              <span className={styles.typing}>
                <span /><span /><span />
              </span>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Quick replies */}
        {quickReplies.length > 0 && !isTyping && (
          <div className={styles.pills} role="group" aria-label="Быстрые ответы">
            {quickReplies.map((r) => (
              <button key={r.label} className={styles.pill} onClick={() => handleReply(r)}>
                {r.label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <ChatInput
          onSubmit={handleSubmit}
          disabled={inputDisabled}
          loading={isSending}
          placeholder={inputPlaceholder}
        />
      </div>
    </>
  );
}

// ─── ChatInput ────────────────────────────────────────────────────────────────

function ChatInput({ onSubmit, disabled, loading, placeholder }) {
  const [text, setText] = useState('');
  const taRef = useRef(null);

  const resize = (el) => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 80) + 'px';
  };

  const submit = () => {
    if (!text.trim() || disabled || loading) return;
    onSubmit(text.trim());
    setText('');
    if (taRef.current) taRef.current.style.height = 'auto';
  };

  return (
    <div className={styles.inputRow}>
      <textarea
        ref={taRef}
        className={styles.inputField}
        value={text}
        rows={1}
        placeholder={placeholder}
        disabled={disabled || loading}
        onChange={(e) => { setText(e.target.value); resize(e.target); }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
        }}
        aria-label="Введите сообщение"
      />
      <button
        className={styles.sendBtn}
        onClick={submit}
        disabled={!text.trim() || disabled || loading}
        aria-label="Отправить"
      >
        {loading ? <span className={styles.spin} /> : '→'}
      </button>
    </div>
  );
}
