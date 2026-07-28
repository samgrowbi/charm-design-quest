import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import specialistAvatar from "@/assets/specialist-avatar.jpg";
import { getTreatmentBySlug } from "@/config/treatmentRegistry";
import type { IntakeField } from "@/config/treatments";

const SESSION_KEY = "lumiere_chat_session_id";
const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/skin-specialist-chat`;

const WELCOME_MESSAGE: UIMessage = {
  id: "welcome",
  role: "assistant",
  parts: [
    {
      type: "text",
      text:
        "Hi, I'm Sofia one of the skin specialists at Hermosa Medspa. I'm here to help you find the right treatment for your skin and book your spot, right inside this chat.\n\nWhat's bothering you most about your skin lately?",
    },
  ],
};

const INITIAL_QUICK_REPLIES = [
  "Instant Lift",
  "Baggy Eyes",
  "LED + Cryo",
  "I have a question",
];

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

type DbMessage = {
  id: string;
  role: string;
  parts: unknown;
  created_at: string;
};

export default function SkinSpecialistChat() {
  const [open, setOpen] = useState(false);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([
    WELCOME_MESSAGE,
  ]);
  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("chat-history", {
          headers: { "x-session-id": sessionId },
          body: { sessionId },
        });
        if (cancelled) return;
        if (error) {
          setBootstrapped(true);
          return;
        }
        const msgs = (data?.messages ?? []) as DbMessage[];
        if (msgs.length > 0) {
          const ui: UIMessage[] = msgs.map((m) => ({
            id: m.id,
            role: m.role as UIMessage["role"],
            parts: Array.isArray(m.parts)
              ? (m.parts as UIMessage["parts"])
              : ([{ type: "text", text: String(m.parts ?? "") }] as UIMessage["parts"]),
          }));
          setInitialMessages([WELCOME_MESSAGE, ...ui]);
        }
        setBootstrapped(true);
      } catch {
        if (!cancelled) setBootstrapped(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!bootstrapped) {
    return <FloatingBubble onClick={() => setOpen(true)} hidden />;
  }

  return (
    <>
      {!open && <FloatingBubble onClick={() => setOpen(true)} />}
      {open && (
        <ChatWindow
          key={sessionId}
          sessionId={sessionId}
          initialMessages={initialMessages}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function FloatingBubble({
  onClick,
  hidden,
}: {
  onClick: () => void;
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <button
      onClick={onClick}
      aria-label="Chat with Sofia, our skin specialist"
      className="fixed z-[60] bottom-24 right-5 md:bottom-6 md:right-6 group flex items-center gap-3 rounded-full bg-white border border-pink-200 shadow-2xl transition-all hover:scale-105 hover:shadow-pink-200/60 pl-1.5 pr-4 py-1.5 md:py-2"
    >
      <span className="relative h-12 w-12 md:h-14 md:w-14 shrink-0">
        <img
          src={specialistAvatar}
          alt="Sofia, skin specialist"
          width={112}
          height={112}
          loading="lazy"
          className="h-full w-full rounded-full object-cover ring-2 ring-pink-100"
        />
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
      </span>
      <span className="hidden md:flex flex-col items-start text-left leading-tight">
        <span className="text-[13px] font-semibold text-gray-900">Chat with Sofia</span>
        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online now
        </span>
      </span>
    </button>
  );
}

type BookingFormRequest = {
  messageId: string;
  toolCallId: string;
  treatmentSlug: string;
  datetime: string;
};

function ChatWindow({
  sessionId,
  initialMessages,
  onClose,
}: {
  sessionId: string;
  initialMessages: UIMessage[];
  onClose: () => void;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: ENDPOINT,
        headers: {
          "x-session-id": sessionId,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      }),
    [sessionId],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: sessionId,
    messages: initialMessages,
    transport,
  });

  const [input, setInput] = useState("");
  const [chipsDismissed, setChipsDismissed] = useState(false);
  const [openForm, setOpenForm] = useState<BookingFormRequest | null>(null);
  const [handledForms, setHandledForms] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  // Auto-open the latest booking form request from the assistant.
  useEffect(() => {
    if (openForm) return;
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role !== "assistant") continue;
      for (const p of m.parts) {
        const type = (p as { type?: string }).type ?? "";
        if (type !== "tool-request_booking_form") continue;
        const state = (p as { state?: string }).state;
        const output = (p as { output?: { ready?: boolean; treatmentSlug?: string; datetime?: string } }).output;
        const toolCallId = (p as { toolCallId?: string }).toolCallId ?? "";
        const key = `${m.id}:${toolCallId}`;
        if (state === "output-available" && output?.ready && output.treatmentSlug && output.datetime && !handledForms.has(key)) {
          setOpenForm({ messageId: m.id, toolCallId, treatmentSlug: output.treatmentSlug, datetime: output.datetime });
          return;
        }
      }
    }
  }, [messages, openForm, handledForms]);

  // Fire Meta Pixel Schedule event on successful booking (deduped).
  useEffect(() => {
    for (const m of messages) {
      if (m.role !== "assistant") continue;
      for (const p of m.parts) {
        const type = (p as { type?: string }).type ?? "";
        if (type !== "tool-book_appointment") continue;
        const state = (p as { state?: string }).state;
        const output = (p as { output?: { success?: boolean; treatmentName?: string; appointmentId?: number | string } }).output;
        if (state !== "output-available" || !output?.success || !output.appointmentId) continue;
        const key = `pixel_schedule_sent_${output.appointmentId}`;
        if (typeof window === "undefined") continue;
        try {
          if (sessionStorage.getItem(key)) continue;
          const fbq = (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq;
          if (typeof fbq === "function") {
            fbq(
              "track",
              "Schedule",
              {
                content_name: output.treatmentName,
                content_category: "Booking",
                appointment_id: String(output.appointmentId),
                source: "sofia_chatbot",
              },
              { eventID: `schedule_${output.appointmentId}` },
            );
          }
          sessionStorage.setItem(key, "1");
        } catch {
          // ignore
        }
      }
    }
  }, [messages]);

  const onSubmit = async (text: string) => {
    const value = text.trim();
    if (!value || isLoading) return;
    setInput("");
    setChipsDismissed(true);
    await sendMessage({ text: value });
  };

  // Compute the newest quick replies to show above composer.
  const activeQuickReplies = useMemo<string[]>(() => {
    if (chipsDismissed || isLoading) return [];
    // Suggested by assistant?
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "user") return [];
      if (m.role !== "assistant") continue;
      for (const p of m.parts) {
        const type = (p as { type?: string }).type ?? "";
        if (type === "tool-suggest_quick_replies") {
          const output = (p as { output?: { replies?: string[] } }).output;
          if (output?.replies?.length) return output.replies.slice(0, 4);
        }
      }
    }
    // On first open (only welcome msg), show default treatment chips.
    if (messages.length <= 1) return INITIAL_QUICK_REPLIES;
    return [];
  }, [messages, chipsDismissed, isLoading]);

  const handleFormSubmit = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    intakeAnswers: Record<string, string | string[]>;
  }) => {
    if (!openForm) return;
    const submission = {
      ...payload,
      datetime: openForm.datetime,
      treatmentSlug: openForm.treatmentSlug,
    };
    setHandledForms((prev) => new Set(prev).add(`${openForm.messageId}:${openForm.toolCallId}`));
    setOpenForm(null);
    await sendMessage({
      text: `[BOOKING_FORM_SUBMISSION] ${JSON.stringify(submission)}`,
    });
  };

  return (
    <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-[70] md:w-[400px] md:h-[640px] md:max-h-[85vh] flex flex-col bg-white md:rounded-3xl shadow-2xl overflow-hidden border border-pink-100">
      <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-br from-pink-500 to-pink-600 text-white">
        <div className="relative h-11 w-11 shrink-0">
          <img
            src={specialistAvatar}
            alt="Sofia"
            width={88}
            height={88}
            className="h-11 w-11 rounded-full object-cover ring-2 ring-white/30"
          />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-pink-500" />
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="font-medium text-[15px]">Sofia · Skin Specialist</div>
          <div className="text-[11px] opacity-90 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online now · Hermosa Medspa
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close chat"
          className="p-2 rounded-full hover:bg-white/15 transition"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-pink-50/40"
      >
        {messages
          .filter((m) => {
            if (m.role !== "user") return true;
            const text = m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
            return !text.startsWith("[BOOKING_FORM_SUBMISSION]");
          })
          .map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
        {isLoading && <TypingIndicator />}
        {error && (
          <div className="text-xs text-red-600 px-3 py-2 bg-red-50 rounded-lg">
            Sorry, something went wrong. Please try again in a moment.
          </div>
        )}
      </div>

      {activeQuickReplies.length > 0 && (
        <div className="px-3 pt-2 pb-1 flex flex-wrap gap-2 border-t border-pink-50 bg-white">
          {activeQuickReplies.map((q) => (
            <button
              key={q}
              onClick={() => onSubmit(q)}
              className="text-xs px-3 py-2 rounded-full bg-pink-50 border border-pink-200 text-pink-700 hover:bg-pink-100 transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(input);
        }}
        className="border-t border-pink-100 bg-white p-3 flex items-end gap-2"
      >
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (e.target.value) setChipsDismissed(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(input);
            }
          }}
          rows={1}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 resize-none max-h-32 rounded-2xl border border-pink-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="h-10 w-10 shrink-0 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center transition disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      {openForm && (
        <BookingFormModal
          treatmentSlug={openForm.treatmentSlug}
          datetime={openForm.datetime}
          onClose={() => {
            setHandledForms((prev) => new Set(prev).add(`${openForm.messageId}:${openForm.toolCallId}`));
            setOpenForm(null);
          }}
          onSubmit={handleFormSubmit}
        />
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
  const visibleToolParts = message.parts.filter((p) => {
    const t = (p as { type?: string }).type ?? "";
    return t === "tool-book_appointment";
  });

  if (!text && visibleToolParts.length === 0) return null;

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] text-sm leading-relaxed",
          isUser
            ? "bg-pink-500 text-white px-4 py-2.5 rounded-2xl rounded-br-md"
            : "text-gray-800",
        )}
      >
        {!isUser && text && (
          <div className="px-1">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-pink-700">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>
                ),
                a: ({ children, href }) => (
                  <a href={href} target="_blank" rel="noreferrer" className="text-pink-600 underline">
                    {children}
                  </a>
                ),
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
        {isUser && <span className="whitespace-pre-wrap">{text}</span>}

        {visibleToolParts.map((p, idx) => (
          <ToolPartRender key={idx} part={p} />
        ))}
      </div>
    </div>
  );
}

function ToolPartRender({ part }: { part: UIMessage["parts"][number] }) {
  const type = (part as { type?: string }).type ?? "";
  if (type === "tool-book_appointment") {
    const state = (part as { state?: string }).state;
    const output = (part as { output?: { success?: boolean; treatmentName?: string; datetime?: string } }).output;
    if (state === "output-available" && output?.success) {
      const dt = output.datetime ? new Date(output.datetime) : null;
      return (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <span className="h-6 w-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
              ✓
            </span>
            You're booked
          </div>
          <div className="mt-2 text-sm text-gray-700">
            <div className="font-medium">{output.treatmentName}</div>
            {dt && (
              <div className="text-xs text-gray-600 mt-0.5">
                {dt.toLocaleString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                  timeZone: "America/Los_Angeles",
                })}{" "}
                PT
              </div>
            )}
            <div className="text-[11px] text-gray-500 mt-2">
              A confirmation is on its way to your email.
            </div>
          </div>
        </div>
      );
    }
  }
  return null;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Dot delay="0s" />
          <Dot delay="0.15s" />
          <Dot delay="0.3s" />
        </div>
        <span className="text-[12px] text-pink-600/80">Sofia is typing...</span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="h-2 w-2 rounded-full bg-pink-400 animate-bounce"
      style={{ animationDelay: delay }}
    />
  );
}

// ---------- Booking form modal ----------

function BookingFormModal({
  treatmentSlug,
  datetime,
  onClose,
  onSubmit,
}: {
  treatmentSlug: string;
  datetime: string;
  onClose: () => void;
  onSubmit: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    intakeAnswers: Record<string, string | string[]>;
  }) => void | Promise<void>;
}) {
  const treatment = getTreatmentBySlug(treatmentSlug);
  const intakeFields: IntakeField[] = treatment.intakeFields ?? [];

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const dt = useMemo(() => new Date(datetime), [datetime]);

  const setAnswer = (id: number, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [String(id)]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`f_${id}`];
      return next;
    });
  };

  const toggleCheckbox = (id: number, option: string) => {
    const current = (answers[String(id)] as string[] | undefined) ?? [];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    setAnswer(id, next);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = "Required";
    if (!lastName.trim()) errs.lastName = "Required";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) errs.email = "Enter a valid email";
    if (!/^[\d+()\-.\s]{7,}$/.test(phone.trim())) errs.phone = "Enter a valid phone";
    for (const f of intakeFields) {
      if (!f.required) continue;
      const raw = answers[String(f.acuityFieldId)];
      const empty =
        raw == null ||
        (Array.isArray(raw) && raw.length === 0) ||
        (typeof raw === "string" && raw.trim() === "") ||
        (f.type === "yesno" && (typeof raw !== "string" || raw.toLowerCase() !== "yes"));
      if (empty) errs[`f_${f.acuityFieldId}`] = "Required";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        intakeAnswers: answers,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 z-[80] bg-black/40 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="w-full md:max-w-md max-h-full bg-white md:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="px-5 py-4 border-b border-pink-100 flex items-start justify-between gap-3">
          <div>
            <div className="text-[13px] text-pink-600 font-medium">Confirm your booking</div>
            <div className="text-sm font-semibold text-gray-900 mt-0.5">{treatment.label}</div>
            <div className="text-[11px] text-gray-500 mt-0.5">
              {dt.toLocaleString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
                timeZone: "America/Los_Angeles",
              })}{" "}
              PT
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close form"
            className="p-1 rounded-full hover:bg-gray-100"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="First name" error={errors.firstName}>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="input-base"
              />
            </FieldLabel>
            <FieldLabel label="Last name" error={errors.lastName}>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="input-base"
              />
            </FieldLabel>
          </div>
          <FieldLabel label="Email" error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-base"
            />
          </FieldLabel>
          <FieldLabel label="Phone" error={errors.phone}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-base"
            />
          </FieldLabel>

          {intakeFields.map((f) => (
            <IntakeFieldRender
              key={f.acuityFieldId}
              field={f}
              value={answers[String(f.acuityFieldId)]}
              error={errors[`f_${f.acuityFieldId}`]}
              onChangeValue={(v) => setAnswer(f.acuityFieldId, v)}
              onToggleCheckbox={(opt) => toggleCheckbox(f.acuityFieldId, opt)}
            />
          ))}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 h-11 rounded-full bg-pink-500 hover:bg-pink-600 text-white text-sm font-semibold transition disabled:opacity-50"
          >
            {submitting ? "Booking..." : "Confirm booking"}
          </button>
        </form>
      </div>

      <style>{`
        .input-base {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(251 207 232);
          padding: 0.5rem 0.75rem;
          font-size: 14px;
          outline: none;
        }
        .input-base:focus {
          border-color: rgb(236 72 153);
          box-shadow: 0 0 0 2px rgb(251 207 232);
        }
      `}</style>
    </div>
  );
}

function FieldLabel({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-[12px] font-medium text-gray-700 mb-1">{label}</div>
      {children}
      {error && <div className="text-[11px] text-red-600 mt-1">{error}</div>}
    </label>
  );
}

function IntakeFieldRender({
  field,
  value,
  error,
  onChangeValue,
  onToggleCheckbox,
}: {
  field: IntakeField;
  value: string | string[] | undefined;
  error?: string;
  onChangeValue: (v: string | string[]) => void;
  onToggleCheckbox: (opt: string) => void;
}) {
  return (
    <div>
      <div className="text-[12px] font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-pink-500"> *</span>}
      </div>
      {field.helpText && (
        <div className="text-[11px] text-gray-500 mb-2">{field.helpText}</div>
      )}

      {field.type === "checkboxes" && (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => {
            const active = Array.isArray(value) && value.includes(opt);
            return (
              <button
                type="button"
                key={opt}
                onClick={() => onToggleCheckbox(opt)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition",
                  active
                    ? "bg-pink-500 text-white border-pink-500"
                    : "bg-white text-gray-700 border-pink-200 hover:bg-pink-50",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {field.type === "radio" && (
        <div className="flex flex-wrap gap-2">
          {(field.options ?? []).map((opt) => {
            const active = value === opt;
            return (
              <button
                type="button"
                key={opt}
                onClick={() => onChangeValue(opt)}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-full border transition",
                  active
                    ? "bg-pink-500 text-white border-pink-500"
                    : "bg-white text-gray-700 border-pink-200 hover:bg-pink-50",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {field.type === "select" && (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChangeValue(e.target.value)}
          className="input-base"
        >
          <option value="">Select...</option>
          {(field.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {field.type === "text" && (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChangeValue(e.target.value)}
          className="input-base"
        />
      )}

      {field.type === "textarea" && (
        <textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChangeValue(e.target.value)}
          rows={3}
          className="input-base"
        />
      )}

      {field.type === "yesno" && (
        <div className="flex gap-2">
          {["yes", "no"].map((opt) => {
            const active = value === opt;
            return (
              <button
                type="button"
                key={opt}
                onClick={() => onChangeValue(opt)}
                className={cn(
                  "text-xs px-4 py-1.5 rounded-full border transition capitalize",
                  active
                    ? opt === "yes"
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-gray-400 text-white border-gray-400"
                    : "bg-white text-gray-700 border-pink-200 hover:bg-pink-50",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {error && <div className="text-[11px] text-red-600 mt-1">{error}</div>}
    </div>
  );
}
