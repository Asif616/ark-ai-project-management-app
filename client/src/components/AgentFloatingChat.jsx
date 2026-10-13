import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Sparkles, X } from 'lucide-react';
import { api } from '../api';
import { notifyDataRefresh } from '../realtime';
import { useAuth } from '../context/AuthContext';
import AtomLogo from './AtomLogo';

// sessionStorage: history survives in-tab navigation but dies with the tab,
// so every new tab starts fresh. No server-side chat log (ponytail).
const STORAGE_KEY = 'ark_chat_messages';
const THREAD_KEY = 'ark_chat_thread';
const MAX_MESSAGES = 50;

const historyKey = (userId) => (userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY);
const threadKey = (userId) => (userId ? `${THREAD_KEY}:${userId}` : THREAD_KEY);

function tabThreadId(userId) {
    try {
        const key = threadKey(userId);
        let id = sessionStorage.getItem(key);
        if (!id) {
            id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
            sessionStorage.setItem(key, id);
        }
        return id;
    } catch {
        return null;
    }
}

const SUGGESTIONS = [
    "What's the status of my projects?",
    "What's overdue?",
    'Create a task: draft release notes',
];

function loadMessages(key) {
    try {
        localStorage.removeItem(STORAGE_KEY); // orphan from pre-sessionStorage builds
        const raw = JSON.parse(sessionStorage.getItem(key) || '[]');
        return Array.isArray(raw) ? raw : [];
    } catch {
        return [];
    }
}

function createMessage(role, content) {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        content,
    };
}

function TypingDots() {
    return (
        <div className="chat-typing" aria-label="ARK AI is typing">
            <span /><span /><span />
        </div>
    );
}

export default function AgentFloatingChat() {
    const { user } = useAuth();
    const userId = user?.id ?? null;
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [messages, setMessages] = useState(() => loadMessages(historyKey(userId)));
    const [ownerId, setOwnerId] = useState(userId);

    // Account switched (logout/login) without a tab close: drop the previous
    // account's bubbles and load this account's own history (usually empty).
    useEffect(() => {
        if (userId !== ownerId) {
            setOwnerId(userId);
            setMessages(loadMessages(historyKey(userId)));
            setOpen(false);
            setInput('');
        }
    }, [userId, ownerId]);

    const messagesRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!messagesRef.current) return;
        messagesRef.current.scrollTo({
            top: messagesRef.current.scrollHeight,
            behavior: 'smooth',
        });
    }, [messages, open, sending]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    useEffect(() => {
        try {
            sessionStorage.setItem(historyKey(ownerId), JSON.stringify(messages.slice(-MAX_MESSAGES)));
        } catch { /* storage full — skip persistence */ }
    }, [messages, ownerId]);

    const canSend = input.trim().length > 0 && !sending;

    async function send(text) {
        if (!text.trim() || sending) return;
        setInput('');
        setMessages((prev) => [...prev, createMessage('user', text.trim())]);
        setSending(true);
        try {
            const response = await api.agentChat({ message: text.trim(), thread_id: tabThreadId(ownerId) });
            setMessages((prev) => [
                ...prev,
                createMessage('assistant', response?.response || 'Done. How else can I help?'),
            ]);
            notifyDataRefresh();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Failed to reach AI agent.';
            setMessages((prev) => [...prev, createMessage('assistant', `I hit an error: ${msg}`)]);
        } finally {
            setSending(false);
        }
    }

    function onSubmit(event) {
        event.preventDefault();
        if (canSend) send(input);
    }

    function onComposerKeyDown(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            if (canSend) send(input);
        }
    }

    function onInput(event) {
        const el = event.target;
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
        setInput(el.value);
    }

    useEffect(() => {
        if (!input && inputRef.current) inputRef.current.style.height = 'auto';
    }, [input]);

    if (!user) return null;

    return (
        <>
            <button
                onClick={() => setOpen((prev) => !prev)}
                className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full border shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                    background: 'linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-500) 100%)',
                    borderColor: 'rgba(255,255,255,0.24)',
                    color: 'var(--on-primary)',
                }}
                aria-label={open ? 'Close AI assistant' : 'Open AI assistant'}
                title="ARK AI"
            >
                {open ? <X className="h-5 w-5" /> : <Sparkles className="h-6 w-6" />}
            </button>

            {open && (
                <section
                    className="fixed bottom-24 left-2 right-2 z-50 flex h-[70vh] flex-col overflow-hidden rounded-2xl border shadow-2xl animate-scale-in sm:left-auto sm:right-6 sm:h-[540px] sm:w-[390px]"
                    style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
                    aria-label="ARK AI assistant"
                >
                    <header
                        className="flex h-14 shrink-0 items-center gap-3 border-b px-4"
                        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}
                    >
                        <span
                            className="flex h-8 w-8 items-center justify-center rounded-full"
                            style={{ background: 'rgba(var(--color-primary-rgb), 0.12)' }}
                        >
                            <AtomLogo className="h-4 w-4 text-primary-500" />
                        </span>
                        <div className="min-w-0 flex-1 leading-tight">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">ARK AI</h3>
                            <p className="text-xs text-[var(--text-muted)]">Workspace assistant</p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                            aria-label="Close AI assistant"
                        >
                            <X className="h-4 w-4 text-[var(--text-muted)]" />
                        </button>
                    </header>

                    <div ref={messagesRef} className="flex-1 space-y-3 overflow-y-auto p-3" style={{ background: 'var(--bg-secondary)' }}>
                        {messages.length === 0 && !sending && (
                            <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
                                <span
                                    className="flex h-12 w-12 items-center justify-center rounded-2xl"
                                    style={{ background: 'rgba(var(--color-primary-rgb), 0.12)' }}
                                >
                                    <Sparkles className="h-6 w-6 text-primary-500" />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">How can I help?</p>
                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                        Ask about projects, tasks, or your workspace.
                                    </p>
                                </div>
                                <div className="flex w-full flex-col gap-2">
                                    {SUGGESTIONS.map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => send(s)}
                                            className="w-full rounded-xl border px-3 py-2 text-left text-xs transition-colors hover:border-primary-400/60 hover:bg-primary-500/[0.06]"
                                            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((message) => {
                            const isUser = message.role === 'user';
                            if (isUser) {
                                return (
                                    <div
                                        key={message.id}
                                        className="ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md px-3 py-2 text-sm leading-relaxed"
                                        style={{ background: 'var(--color-primary-700)', color: 'var(--on-primary)' }}
                                    >
                                        {message.content}
                                    </div>
                                );
                            }
                            return (
                                <div key={message.id} className="flex items-start gap-2">
                                    <span
                                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                        style={{ background: 'rgba(var(--color-primary-rgb), 0.12)' }}
                                    >
                                        <AtomLogo className="h-3.5 w-3.5 text-primary-500" />
                                    </span>
                                    <div
                                        className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-md border px-3 py-2 text-sm leading-relaxed"
                                        style={{ background: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                                    >
                                        {message.content}
                                    </div>
                                </div>
                            );
                        })}

                        {sending && (
                            <div className="flex items-start gap-2">
                                <span
                                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                                    style={{ background: 'rgba(var(--color-primary-rgb), 0.12)' }}
                                >
                                    <AtomLogo className="h-3.5 w-3.5 text-primary-500" />
                                </span>
                                <TypingDots />
                            </div>
                        )}
                    </div>

                    <form
                        onSubmit={onSubmit}
                        className="flex shrink-0 items-end gap-2 border-t p-3"
                        style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}
                    >
                        <textarea
                            ref={inputRef}
                            id="ark-chat-input"
                            name="message"
                            rows={1}
                            value={input}
                            onChange={onInput}
                            onKeyDown={onComposerKeyDown}
                            placeholder="Ask ARK AI…"
                            className="field max-h-24 min-h-[40px] flex-1 resize-none py-2.5"
                            aria-label="Message ARK AI"
                        />
                        <button
                            type="submit"
                            disabled={!canSend}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-opacity disabled:opacity-40"
                            style={{ background: 'var(--color-primary-700)', color: 'var(--on-primary)' }}
                            aria-label="Send message"
                        >
                            <ArrowUp className="h-4 w-4" />
                        </button>
                    </form>
                </section>
            )}
        </>
    );
}
