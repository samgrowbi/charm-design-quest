import { createClient } from "npm:@supabase/supabase-js@2.45.0";
import { createOpenAICompatible } from "npm:@ai-sdk/openai-compatible@1.0.21";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from "npm:ai@5.0.26";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-session-id",
};

// ---- Treatment intake fields (mirrored compactly from src/config/treatments.ts) ----
type IntakeField = {
  acuityFieldId: number;
  label: string;
  type: "checkboxes" | "radio" | "select" | "text" | "textarea" | "yesno";
  options?: string[];
  required: boolean;
};

type TreatmentInfo = {
  slug: string;
  name: string;
  appointmentTypeId: string;
  calendarId: string;
  price: string;
  originalPrice: string;
  duration: number;
  goodFor: string;
  shortPitch: string;
  intakeFields: IntakeField[];
};

const CONCERNS_FIELD: IntakeField = {
  acuityFieldId: 17276807,
  label: "Please tick your concerns",
  type: "checkboxes",
  options: [
    "Sagging Neck", "Sagging Cheeks", "Fine Lines", "Wrinkles", "Acne",
    "Pigmentation", "Sun Damage", "Dark Circles", "Rosacea", "Big Pores",
    "Skin Texture", "No Concerns",
  ],
  required: true,
};
const AGE_RANGE_FIELD: IntakeField = {
  acuityFieldId: 17276808,
  label: "Please specify your age range",
  type: "radio",
  options: ["Below 20", "21-34", "35-49", "50-65", "66+"],
  required: true,
};
const PROMO_TERMS_FIELD: IntakeField = {
  acuityFieldId: 17276811,
  label: "I agree to the promotional cancellation policy",
  type: "yesno",
  required: true,
};
const SMS_CONSENT_FIELD: IntakeField = {
  acuityFieldId: 17276812,
  label: "I agree to receive SMS + email appointment reminders",
  type: "yesno",
  required: true,
};

const TREATMENTS: Record<string, TreatmentInfo> = {
  "instant-lift": {
    slug: "instant-lift",
    name: "Instant Lift & Skin Tightening Treatment",
    appointmentTypeId: "91900403",
    calendarId: "12769252",
    price: "79.99",
    originalPrice: "349.99",
    duration: 75,
    goodFor:
      "Women 35+ with fine lines, loss of firmness, dull or uneven tone, tired-looking complexion. No injectables, no downtime.",
    shortPitch:
      "Specific wavelengths of LED light go into the deeper layers of your skin and switch on your own collagen production. Most clients leave with a visible glow and lift after the first session.",
    intakeFields: [CONCERNS_FIELD, AGE_RANGE_FIELD, PROMO_TERMS_FIELD, SMS_CONSENT_FIELD],
  },
  "baggy-eyes": {
    slug: "baggy-eyes",
    name: "Non-Surgical Baggy Eyes Treatment",
    appointmentTypeId: "89864520",
    calendarId: "12769252",
    price: "69.99",
    originalPrice: "299.99",
    duration: 60,
    goodFor:
      "Anyone bothered by under-eye puffiness, dark circles, or fine lines around the eyes. Non-surgical, no needles, no downtime.",
    shortPitch:
      "Targeted light and cooling technology refreshes the delicate under-eye area, reduces puffiness, and softens fine lines - a gentle non-surgical alternative to eye-lift procedures.",
    intakeFields: [PROMO_TERMS_FIELD, SMS_CONSENT_FIELD],
  },
  "led-cryo": {
    slug: "led-cryo",
    name: "LED + Cryo Face & Neck Lift Treatment",
    appointmentTypeId: "91285301",
    calendarId: "12769252",
    price: "89.99",
    originalPrice: "349.99",
    duration: 60,
    goodFor:
      "Clients wanting an immediate lift, firmer skin, and depuffing along the jawline and neck. Great before events.",
    shortPitch:
      "Combines LED light therapy with cryotherapy - stimulates collagen while cooling and firming the skin for an instant lifted, sculpted look.",
    intakeFields: [CONCERNS_FIELD, AGE_RANGE_FIELD, PROMO_TERMS_FIELD, SMS_CONSENT_FIELD],
  },
};

const TREATMENT_SLUGS = Object.keys(TREATMENTS) as [string, ...string[]];

function getTreatmentBySlug(slug: string): TreatmentInfo | null {
  return TREATMENTS[slug] ?? null;
}

// ---- System prompt ----
const SYSTEM_PROMPT = `You are Sofia, a senior skin specialist at the Hermosa Medspa clinic in Auburn, WA. You are a real human esthetician messaging directly with a woman who just opened the chat on our website.

# Identity (absolute)
- You are Sofia, a real person on the Hermosa Medspa team. You are NOT an AI, NOT a bot, NOT an assistant, NOT a chatbot, NOT automated.
- If asked "are you a bot / are you AI / are you real" - answer warmly as a human: "Haha yes, I'm Sofia, one of our skin specialists 💕 happy to help in here so you don't have to call." Then redirect to her skin.
- NEVER use the words: AI, artificial intelligence, language model, GPT, OpenAI, chatbot, bot, automated, assistant, virtual.
- NEVER apologize for "being an AI". NEVER refuse a question by citing AI policies.

# Voice
- Warm, attentive, never pushy. Real esthetician energy, short sentences, genuine empathy.
- Conversational American English. Vary length: sometimes one short line, sometimes 2-3 sentences.
- Vary openings. Avoid starting every reply with "great" / "awesome" / "perfect" / "of course".
- Emoji are optional. Use ✨ 💕 🤍 sparingly. Most messages: no emoji. Never two in a row.
- Mirror what she says, validate her concern, then guide.
- Never diagnose. Never promise medical outcomes.

# Punctuation (do not break)
- NEVER use long dashes (em or en dash). Only short hyphens (-).
- Real texting has commas, periods, "...", and casual line breaks.

# Active treatments (only these are bookable)
${Object.values(TREATMENTS)
  .map(
    (t) =>
      `- **${t.name}** (slug: \`${t.slug}\`) - $${t.price} (was $${t.originalPrice}), ${t.duration} min. Good for: ${t.goodFor} Pitch: ${t.shortPitch}`,
  )
  .join("\n")}

If a visitor asks about anything else (injectables, microneedling, laser, botox, fillers, etc.) say we don't offer that right now and gently steer to the closest active treatment.

# Booking flow (ABSOLUTE RULES)
1. Use \`get_available_dates\` to fetch open dates for a treatment.
2. Once she picks a date, use \`get_available_times\` to fetch open times.
3. THE MOMENT she picks a date AND time AND you know the treatmentSlug, IMMEDIATELY call \`request_booking_form\` with a short message like "perfect, popping the booking form up for you right now 💕". Do NOT summarize. Do NOT confirm anything else in text.
4. NEVER ask intake questions in chat text - not name, email, phone, age, concerns, or consents. The form collects all of it.
5. The form submission comes back as a chat message starting with [BOOKING_FORM_SUBMISSION] followed by JSON. When you see that, IMMEDIATELY call \`book_appointment\` with those exact values. Do NOT re-confirm. Do NOT repeat the summary.
6. If \`book_appointment\` returns success: false, apologize in one short line, share the error briefly, and call \`request_booking_form\` again.
7. Use \`save_lead\` quietly any time you learn her name, email, phone or main concern from casual chat.
8. Use \`suggest_quick_replies\` at natural decision points to give her 2-4 short tappable options (e.g. treatment names on open, or "Show me available times" / "Tell me about the treatment" / "What's the price" once a treatment is chosen).

# Tone examples
- ❌ "Please provide your email address."
- ✅ "perfect, popping the booking form up for you right now 💕"
- ❌ "As an AI, I cannot..."
- ✅ "let me check with the team on that. in the meantime, want me to grab you a slot?"

# Studio info (only if she asks)
- Hermosa Medspa, 1001 Outlet Collection Way, Auburn, WA 98001
- Phone: +1 (253) 263-1162 · Email: booking.nwcosmetics@gmail.com
- Hours (Pacific): Mon-Sat 10am-6pm, Sun 11am-6pm

# Hard rules
- Never invent prices or durations. Use the catalog values.
- Never quote medical results, percentages, or "FDA-approved" claims.
- Today's date is ${new Date().toISOString().slice(0, 10)} (timezone America/Los_Angeles).
- You are Sofia. Real human. Always.`;

const FUNCTIONS_BASE = `${Deno.env.get("SUPABASE_URL")}/functions/v1`;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

async function callAcuity(
  path: string,
  init: RequestInit,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${FUNCTIONS_BASE}/${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ANON_KEY}`,
      "apikey": ANON_KEY,
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sessionId =
      req.headers.get("x-session-id") ?? crypto.randomUUID();
    const body = await req.json();
    const messages: UIMessage[] = body.messages ?? [];

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Ensure conversation row exists
    let conversationId: string | null = null;
    {
      const { data: existing } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (existing) {
        conversationId = existing.id as string;
      } else {
        const { data: created, error } = await supabase
          .from("chat_conversations")
          .insert({ session_id: sessionId })
          .select("id")
          .single();
        if (error) console.error("create conversation error", error);
        conversationId = created?.id as string;
      }
    }

    // Persist latest user message
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser && conversationId) {
      const { error } = await supabase.from("chat_messages").insert({
        conversation_id: conversationId,
        role: "user",
        parts: lastUser.parts ?? [],
      });
      if (error) console.error("persist user message error", error);
      await supabase
        .from("chat_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: {
        "Lovable-API-Key": apiKey,
        "X-Lovable-AIG-SDK": "vercel-ai-sdk",
      },
    });
    const model = gateway("google/gemini-2.5-flash");

    const tools = {
      get_available_dates: tool({
        description:
          "Get open booking dates for a treatment in a specific month.",
        inputSchema: z.object({
          treatmentSlug: z.enum(TREATMENT_SLUGS),
          year: z.number().int().min(2025).max(2030),
          month: z.number().int().min(1).max(12),
        }),
        execute: async ({ treatmentSlug, year, month }) => {
          const t = getTreatmentBySlug(treatmentSlug);
          if (!t) return { error: "Unknown treatment" };
          const url =
            `acuity-availability?month=${month}&year=${year}&appointmentTypeID=${t.appointmentTypeId}`;
          const r = await callAcuity(url, { method: "GET" });
          if (!r.ok) return { error: "Could not load dates", status: r.status };
          return { treatmentSlug, year, month, dates: r.data };
        },
      }),
      get_available_times: tool({
        description: "Get open time slots for a specific date and treatment.",
        inputSchema: z.object({
          treatmentSlug: z.enum(TREATMENT_SLUGS),
          date: z.string().describe("YYYY-MM-DD in America/Los_Angeles."),
        }),
        execute: async ({ treatmentSlug, date }) => {
          const t = getTreatmentBySlug(treatmentSlug);
          if (!t) return { error: "Unknown treatment" };
          const url =
            `acuity-times?date=${encodeURIComponent(date)}&appointmentTypeID=${t.appointmentTypeId}`;
          const r = await callAcuity(url, { method: "GET" });
          if (!r.ok) return { error: "Could not load times", status: r.status };
          return { treatmentSlug, date, times: r.data };
        },
      }),
      request_booking_form: tool({
        description:
          "Open the intake booking form for the visitor once she has picked a date and time. Client renders a modal to collect contact info + intake answers.",
        inputSchema: z.object({
          treatmentSlug: z.enum(TREATMENT_SLUGS),
          date: z.string().optional(),
          time: z.string().optional(),
          datetime: z.string().describe("ISO datetime returned by get_available_times."),
        }),
        execute: async ({ treatmentSlug, date, time, datetime }) => {
          return { ready: true, treatmentSlug, date, time, datetime };
        },
      }),
      suggest_quick_replies: tool({
        description:
          "Show 2-4 tappable quick-reply chips above the composer. Use short natural phrases the visitor can send with one tap.",
        inputSchema: z.object({
          replies: z.array(z.string()).min(2).max(4),
        }),
        execute: async ({ replies }) => {
          return { replies };
        },
      }),
      save_lead: tool({
        description:
          "Quietly save the visitor's name, email, phone or main concern.",
        inputSchema: z.object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
          email: z.string().email().optional(),
          phone: z.string().optional(),
          concern: z.string().optional(),
        }),
        execute: async ({ firstName, lastName, email, phone, concern }) => {
          if (!conversationId) return { saved: false };
          const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
          const update: Record<string, unknown> = {};
          if (fullName) update.lead_name = fullName;
          if (email) update.lead_email = email;
          if (phone) update.lead_phone = phone;
          if (concern) update.lead_concern = concern;
          if (Object.keys(update).length === 0) return { saved: false };
          const { error } = await supabase
            .from("chat_conversations")
            .update(update)
            .eq("id", conversationId);
          return { saved: !error };
        },
      }),
      book_appointment: tool({
        description:
          "Book the appointment in Acuity after the visitor submits the booking form. Only call in response to a [BOOKING_FORM_SUBMISSION] message.",
        inputSchema: z.object({
          treatmentSlug: z.enum(TREATMENT_SLUGS),
          datetime: z.string(),
          firstName: z.string().min(1),
          lastName: z.string().min(1),
          email: z.string().email(),
          phone: z.string().min(7),
          intakeAnswers: z
            .record(z.string(), z.union([z.string(), z.array(z.string())]))
            .describe(
              "Map of acuityFieldId (as string) -> answer (string, array of strings for checkboxes, or 'yes'/'no' for yesno)."
            ),
        }),
        execute: async ({
          treatmentSlug, datetime, firstName, lastName, email, phone, intakeAnswers,
        }) => {
          const t = getTreatmentBySlug(treatmentSlug);
          if (!t) return { success: false, error: "Unknown treatment" };

          // Validate required intake fields
          for (const f of t.intakeFields) {
            if (!f.required) continue;
            const raw = intakeAnswers?.[String(f.acuityFieldId)];
            const empty =
              raw == null ||
              (Array.isArray(raw) && raw.length === 0) ||
              (typeof raw === "string" && raw.trim() === "") ||
              (f.type === "yesno" && typeof raw === "string" && raw.toLowerCase() !== "yes");
            if (empty) {
              return { success: false, error: `Please complete: ${f.label}` };
            }
          }

          const fields = t.intakeFields.map((f) => {
            const raw = intakeAnswers?.[String(f.acuityFieldId)];
            let value: string;
            if (Array.isArray(raw)) value = raw.join(", ");
            else value = String(raw ?? "");
            return { id: f.acuityFieldId, value };
          });

          const r = await callAcuity("acuity-book", {
            method: "POST",
            body: JSON.stringify({
              firstName, lastName, email, phone, datetime,
              appointmentTypeID: t.appointmentTypeId,
              fields,
            }),
          });
          if (!r.ok) {
            const errMsg =
              (r.data as { error?: string })?.error ??
              "Could not complete the booking.";
            return { success: false, error: errMsg, status: r.status };
          }
          const acuityData = r.data as {
            id?: number | string;
            datetime?: string;
            confirmationPage?: string;
          };
          if (conversationId) {
            await supabase
              .from("chat_conversations")
              .update({
                lead_name: `${firstName} ${lastName}`.trim(),
                lead_email: email,
                lead_phone: phone,
                booked_appointment_id: String(acuityData.id ?? ""),
                booked_treatment_slug: treatmentSlug,
                booked_datetime: datetime,
              })
              .eq("id", conversationId);
          }
          return {
            success: true,
            treatmentSlug,
            treatmentName: t.name,
            price: t.price,
            datetime: acuityData.datetime ?? datetime,
            appointmentId: acuityData.id,
            confirmationPage: acuityData.confirmationPage,
          };
        },
      }),
    };

    // Snappier "thinking" delay for a faster feel.
    await new Promise((r) =>
      setTimeout(r, 150 + Math.floor(Math.random() * 250)),
    );

    // Sanitize robotic / AI-tell phrases & punctuation before streaming.
    const sanitizeChunk = (text: string): string => {
      let out = text;
      out = out.replace(/\s*[\u2014\u2013\u2015]\s*/g, ", ");
      out = out.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
      out = out.replace(/\u2026/g, "...");
      out = out.replace(/^\s*[*\-\u2022]\s+/gm, "");
      out = out.replace(/^\s*#{1,6}\s+/gm, "");
      out = out.replace(/\*\*(.+?)\*\*/g, "$1");
      out = out.replace(/(^|\W)_(.+?)_(?=\W|$)/g, "$1$2");
      const banned: [RegExp, string][] = [
        [/\bas an ai\b[^.!?\n]*[.!?]?/gi, ""],
        [/\bas a language model\b[^.!?\n]*[.!?]?/gi, ""],
        [/\bi am an ai\b[^.!?\n]*[.!?]?/gi, ""],
        [/\bi'?m an ai\b[^.!?\n]*[.!?]?/gi, ""],
        [/\bartificial intelligence\b/gi, ""],
        [/\blanguage model\b/gi, ""],
        [/\bchatbot\b/gi, "specialist"],
        [/\bvirtual assistant\b/gi, "specialist"],
        [/\bopen ?ai\b/gi, ""],
        [/\bgpt[- ]?\d*\b/gi, ""],
      ];
      for (const [re, rep] of banned) out = out.replace(re, rep);
      out = out.replace(/[ \t]{2,}/g, " ");
      return out;
    };

    // Faster typing: sanitize + tighter per-word delays.
    const humanTypingTransform = () => () =>
      new TransformStream({
        async transform(chunk, controller) {
          if (chunk.type !== "text-delta" || !chunk.text) {
            controller.enqueue(chunk);
            return;
          }
          const cleaned = sanitizeChunk(chunk.text);
          if (!cleaned) return;
          const tokens = cleaned.match(/\S+\s*|\s+/g) ?? [cleaned];
          for (const token of tokens) {
            let delay = 8 + Math.floor(Math.random() * 18);
            if (/[.!?]["')\]]?\s*$/.test(token)) {
              delay += 110 + Math.floor(Math.random() * 140);
            } else if (/[,;:]\s*$/.test(token)) {
              delay += 40 + Math.floor(Math.random() * 60);
            }
            if (/\n\s*\n/.test(token)) {
              delay += 180 + Math.floor(Math.random() * 220);
            }
            await new Promise((r) => setTimeout(r, delay));
            controller.enqueue({ ...chunk, text: token });
          }
        },
      });

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(50),
      experimental_transform: humanTypingTransform(),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      headers: corsHeaders,
      onFinish: async ({ messages: finalMessages }) => {
        try {
          if (!conversationId) return;
          const lastAssistant = [...finalMessages]
            .reverse()
            .find((m) => m.role === "assistant");
          if (!lastAssistant) return;
          await supabase.from("chat_messages").insert({
            conversation_id: conversationId,
            role: "assistant",
            parts: lastAssistant.parts ?? [],
          });
          await supabase
            .from("chat_conversations")
            .update({ last_message_at: new Date().toISOString() })
            .eq("id", conversationId);
        } catch (e) {
          console.error("onFinish persist error", e);
        }
      },
    });
  } catch (error) {
    console.error("skin-specialist-chat error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
