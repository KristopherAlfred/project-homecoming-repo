import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Send, Volume2, VolumeX } from "lucide-react";
import {
  fetchLiveChat,
  sendLiveMessage,
  subscribeLiveChat,
  type LiveChatMessage,
} from "@/lib/liveApi";

const EMOJIS = ["🔥", "❤️", "👏", "😂", "🎾", "🐐", "💪", "🙌"];
const NAME_KEY = "live_chat_name";

type FloatingReaction = { id: number; emoji: string; left: number };

function storedName() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(NAME_KEY) ?? "";
}

function randomName() {
  return `Fan${Math.floor(1000 + Math.random() * 9000)}`;
}

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) % 360;
  return `hsl(${hash}, 85%, 72%)`;
}

/** Twitch-style live chat: realtime messages, emote reactions and read-aloud. */
export function LiveChat({
  sessionId,
  isLive,
  compact = false,
  displayName,
  className = "",
}: {
  sessionId: string | null;
  isLive: boolean;
  compact?: boolean;
  displayName?: string;
  className?: string;
}) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [speak, setSpeak] = useState(false);
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const reactionId = useRef(0);

  const name = useMemo(() => {
    if (displayName) return displayName;
    const saved = storedName();
    if (saved) return saved;
    const next = randomName();
    if (typeof window !== "undefined") window.localStorage.setItem(NAME_KEY, next);
    return next;
  }, [displayName]);

  const push = useCallback((message: LiveChatMessage) => {
    if (seenRef.current.has(message.id)) return;
    seenRef.current.add(message.id);
    setMessages((prev) => [...prev, message].slice(-120));
    if (message.kind === "reaction") {
      reactionId.current += 1;
      const item = { id: reactionId.current, emoji: message.text, left: 10 + Math.random() * 75 };
      setReactions((prev) => [...prev, item]);
      window.setTimeout(() => setReactions((prev) => prev.filter((r) => r.id !== item.id)), 2600);
    }
  }, []);

  useEffect(() => {
    seenRef.current = new Set();
    setMessages([]);
    if (!sessionId) return;
    let active = true;
    void fetchLiveChat(sessionId).then((rows) => {
      if (!active) return;
      rows.forEach((row) => seenRef.current.add(row.id));
      setMessages(rows);
    });
    const unsubscribe = subscribeLiveChat(sessionId, push);
    return () => {
      active = false;
      unsubscribe();
    };
  }, [sessionId, push]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Read-aloud: speaks each new chat line with the browser voice engine.
  const spokenRef = useRef<string | null>(null);
  useEffect(() => {
    if (!speak || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const last = messages[messages.length - 1];
    if (!last || last.kind !== "chat" || spokenRef.current === last.id) return;
    spokenRef.current = last.id;
    const utterance = new SpeechSynthesisUtterance(`${last.username} says ${last.text}`);
    utterance.rate = 1.05;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [messages, speak]);

  useEffect(() => {
    if (speak || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
  }, [speak]);

  async function submit(text: string, kind: LiveChatMessage["kind"] = "chat") {
    if (!sessionId || !text.trim()) return;
    try {
      const message = await sendLiveMessage({ sessionId, username: name, text, kind });
      if (message) push(message);
    } catch {
      /* chat is best-effort */
    }
  }

  const disabled = !sessionId;

  return (
    <div className={`live-chat ${compact ? "is-compact" : ""} ${className}`}>
      <div className="live-chat-head">
        <span className="live-chat-title">
          <span className={`live-chat-dot ${isLive ? "is-live" : ""}`} />
          Live chat
        </span>
        <button
          type="button"
          className={`live-chat-tts ${speak ? "is-on" : ""}`}
          onClick={() => setSpeak((value) => !value)}
          aria-label={speak ? "Turn off read aloud" : "Read chat aloud"}
        >
          {speak ? <Volume2 size={13} /> : <VolumeX size={13} />}
          <span>Read aloud</span>
        </button>
      </div>

      <div className="live-chat-stream" ref={listRef}>
        {messages.length === 0 ? (
          <p className="live-chat-empty">{disabled ? "Chat opens when a live is scheduled." : "Say something to start the chat."}</p>
        ) : (
          messages.map((message) =>
            message.kind === "reaction" ? (
              <p key={message.id} className="live-chat-reaction-line">
                <span style={{ color: colorFor(message.username) }}>{message.username}</span> reacted {message.text}
              </p>
            ) : (
              <p key={message.id} className="live-chat-line">
                <span className="live-chat-user" style={{ color: colorFor(message.username) }}>
                  {message.username}
                </span>
                <span>{message.text}</span>
              </p>
            ),
          )
        )}
        <div className="live-chat-floats" aria-hidden="true">
          {reactions.map((reaction) => (
            <span key={reaction.id} className="live-chat-float" style={{ left: `${reaction.left}%` }}>
              {reaction.emoji}
            </span>
          ))}
        </div>
      </div>

      <div className="live-chat-emotes">
        {EMOJIS.map((emoji) => (
          <button key={emoji} type="button" disabled={disabled} onClick={() => void submit(emoji, "reaction")}>
            {emoji}
          </button>
        ))}
      </div>

      <form
        className="live-chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(draft);
          setDraft("");
        }}
      >
        <input
          value={draft}
          disabled={disabled}
          maxLength={300}
          placeholder={disabled ? "Chat unavailable" : `Chat as ${name}`}
          onChange={(event) => setDraft(event.target.value)}
        />
        <button type="submit" disabled={disabled || !draft.trim()} aria-label="Send message">
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
