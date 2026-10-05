import treatmentImage from "@/assets/treatment-facial.webp";
import baggyEyesAbout from "@/assets/baggy-eyes-about.png.asset.json";
import instantLift1Before from "@/assets/before-after/instant-lift-1-before.webp.asset.json";
import instantLift1After from "@/assets/before-after/instant-lift-1-after.webp.asset.json";
import instantLift2Before from "@/assets/before-after/instant-lift-2-before.webp.asset.json";
import instantLift2After from "@/assets/before-after/instant-lift-2-after.webp.asset.json";
import instantLift3Before from "@/assets/before-after/instant-lift-3-before.webp.asset.json";
import instantLift3After from "@/assets/before-after/instant-lift-3-after.webp.asset.json";
import instantLift4Before from "@/assets/before-after/instant-lift-4-before.webp.asset.json";
import instantLift4After from "@/assets/before-after/instant-lift-4-after.webp.asset.json";
import instantLift5Before from "@/assets/before-after/instant-lift-5-before.webp.asset.json";
import instantLift5After from "@/assets/before-after/instant-lift-5-after.webp.asset.json";
import baggyEyes1Before from "@/assets/before-after/baggy-eyes-1-before.webp.asset.json";
import baggyEyes1After from "@/assets/before-after/baggy-eyes-1-after.webp.asset.json";
import baggyEyes2Before from "@/assets/before-after/baggy-eyes-2-before.webp.asset.json";
import baggyEyes2After from "@/assets/before-after/baggy-eyes-2-after.webp.asset.json";
import baggyEyes3Before from "@/assets/before-after/baggy-eyes-3-before.webp.asset.json";
import baggyEyes3After from "@/assets/before-after/baggy-eyes-3-after.webp.asset.json";
import baggyEyes4Before from "@/assets/before-after/baggy-eyes-4-before.webp.asset.json";
import baggyEyes4After from "@/assets/before-after/baggy-eyes-4-after.webp.asset.json";
import baggyEyes5Before from "@/assets/before-after/baggy-eyes-5-before.webp.asset.json";
import baggyEyes5After from "@/assets/before-after/baggy-eyes-5-after.webp.asset.json";

export interface BeforeAfterResult {
  id: number;
  before?: string;
  after?: string;
  composite?: string;
  label: string;
  name?: string;
  age?: number;
  /** Optional CSS object-position override (default "center center") */
  objectPosition?: string;
}

export interface IntakeField {
  acuityFieldId: number;
  label: string;
  type: "checkboxes" | "radio" | "select" | "text" | "textarea" | "yesno";
  options?: string[];
  required: boolean;
  helpText?: string;
}

export interface TreatmentConfig {
  /** URL slug, e.g. "instant-lift" or "led-cryo" */
  slug: string;
  /** Display label used in hero, technology, booking header */
  label: string;
  /** Hero heading lines (supports JSX-safe plain strings) */
  heroTitle: {
    line1: string;
    highlight: string;
    line2: string;
  };
  /** Hero subtitle */
  heroSubtitle: string;
  /** Hero video URL */
  heroVideoUrl: string;
  /** Optional thumbnail shown while the hero video loads */
  heroVideoPoster?: string;
  /** Optional treatment-specific Who We Are image */
  aboutImage?: string;
  /** Pricing */
  price: string;
  originalPrice: string;
  /** Acuity IDs */
  appointmentTypeId: string;
  calendarId: string;
  /** Duration in minutes */
  duration: number;
  /** Treatment image */
  image: string;
  /** Intake fields required by the Acuity appointment type */
  intakeFields: IntakeField[];
  /** Technology section copy */
  technologyDescription: string[];
  /** Technology section title override */
  technologyTitle?: { main: string; highlight: string };
  /** Technology highlights */
  technologyHighlights: { text: string; title?: string; description?: string }[];
  /** Whether to hide the device image in technology section */
  hideDeviceImage?: boolean;
  /** FAQ entries */
  faqs: { question: string; answer: string }[];
  /** Before/after results */
  beforeAfterResults?: BeforeAfterResult[];
  /** Hide session badges and "No Filters"/"Verified Photos" text in results */
  hideResultsBadges?: boolean;
  /** Video testimonials */
  feedbackTestimonials?: { id: number; name: string; video: string; poster?: string; text: string }[];
  /** Visit steps */
  visitSteps?: { title: string; description: string; image?: string }[];
  /** Client text reviews */
  clientReviews?: { id: number; name: string; image: string; timeAgo: string; rating: number; review: string }[];
  /** About section video URL override */
  aboutVideoUrl?: string;
  /** Whether to hide the Expert Opinion section */
  hideExpertOpinion?: boolean;
  /** Problem/Solution section overrides */
  problemSolution?: {
    hook?: { line1: string; line2: string };
    hookNote?: string;
    signs: string[];
    outcomeTitle: string;
    outcomeHighlight: string;
    outcomeDescription: string;
    badgeText: string;
    emotionalClose?: { text: string; highlight: string };
  };
}

const CONCERNS_FIELD: IntakeField = {
  acuityFieldId: 17276807,
  label: "Please tick your concerns",
  type: "checkboxes",
  options: [
    "Sagging Neck",
    "Sagging Cheeks",
    "Fine Lines",
    "Wrinkles",
    "Acne",
    "Pigmentation",
    "Sun Damage",
    "Dark Circles",
    "Rosacea",
    "Big Pores",
    "Skin Texture",
    "No Concerns",
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
  helpText:
    "Promotional appointments can be rescheduled once, at least 24 hours in advance. No-shows or late reschedules forfeit the offer.",
};

const SMS_CONSENT_FIELD: IntakeField = {
  acuityFieldId: 17276812,
  label: "I agree to receive SMS + email appointment reminders",
  type: "yesno",
  required: true,
};

const SHARED_FAQS = [

  {
    question: "Who is this treatment for?",
    answer:
      "This treatment is suitable for anyone experiencing visible signs of skin aging such as fine lines, loss of firmness, uneven tone, or a tired-looking complexion. Compared to surgical treatments and injectables, our non-surgical approach is safer, more affordable, requires no downtime, and delivers completely natural-looking results.",
  },
  {
    question: "Is it painful?",
    answer:
      "Not at all. The treatment is designed to be comfortable and relaxing, with most clients describing it as a calming, soothing experience.",
  },
  {
    question: "Is it safe?",
    answer:
      "Yes. Our certified devices are clinically tested, non-invasive, and safe for all skin types and tones. There are no foreign substances entering your body and no risk of burns or damage.",
  },
  {
    question: "When will I see results?",
    answer:
      "Most clients notice brighter, refreshed skin immediately after their first session. Results continue to develop over the following days as your skin responds. With a course of sessions, improvements become increasingly visible and longer lasting.",
  },
  {
    question: "What happens after the treatment?",
    answer:
      "You can return to your normal routine immediately, including makeup, work, and exercise. There is no downtime and no redness to manage. Your esthetician will provide simple aftercare guidance at the end of your visit.",
  },
];

export const INSTANT_LIFT_TREATMENT: TreatmentConfig = {
  slug: "instant-lift",
  label: "Non Surgical Facelift Treatment",
  heroTitle: {
    line1: "Non Surgical",
    highlight: "Facelift",
    line2: "Treatment",
  },
  heroSubtitle: "No Surgery. No Pain. Zero Downtime.",
  heroVideoUrl:
    "https://pub-eb17aaa123fc4145b1ee4c15fc2e5771.r2.dev/Med%20Spa/Hero%20Video/LED%20Hero%20Video.mp4",
  price: "79.99",
  originalPrice: "249.99",
  appointmentTypeId: "98985752",
  calendarId: "12769252",
  duration: 75,
  image: treatmentImage,
  technologyDescription: [
    "Our Non Surgical Facelift treatment delivers specific wavelengths of light energy into the skin's deeper layers, activating the body's own natural healing process of collagen production and cellular repair. The facial is entirely non-invasive, without heat, injectables, or foreign substances.",
  ],
  technologyHighlights: [
    { text: "Clinically tested" },
    { text: "Safe for all skin types and tones" },
  ],
  hideDeviceImage: true,
  intakeFields: [CONCERNS_FIELD, AGE_RANGE_FIELD, PROMO_TERMS_FIELD, SMS_CONSENT_FIELD],
  faqs: SHARED_FAQS,
  hideResultsBadges: true,
  beforeAfterResults: [
    { id: 101, before: instantLift1Before.url, after: instantLift1After.url, label: "Facial Lifting", name: "Catherine", age: 38 },
    { id: 102, before: instantLift2Before.url, after: instantLift2After.url, label: "Skin Rejuvenation", name: "Margaret", age: 41, objectPosition: "center 30%" },
    { id: 103, before: instantLift3Before.url, after: instantLift3After.url, label: "Pigmentation", name: "Elaine", age: 62, objectPosition: "center center" },
    { id: 104, before: instantLift4Before.url, after: instantLift4After.url, label: "Skin Tightening", name: "Brianna", age: 34 },
    { id: 105, before: instantLift5Before.url, after: instantLift5After.url, label: "Neck Rejuvenation", name: "Rosalind", age: 42 },
  ],
};

export const BAGGY_EYES_TREATMENT: TreatmentConfig = {
  slug: "baggy-eyes",
  label: "Non-Surgical Baggy Eyes Treatment",
  heroTitle: {
    line1: "Non-Surgical",
    highlight: "Baggy Eyes",
    line2: "Treatment",
  },
  heroSubtitle: "Refresh tired eyes. No needles. No downtime.",
  heroVideoUrl:
    "https://customer-vgdtdepv6dn1f10z.cloudflarestream.com/949a9d969d572607d3f64ff985e27276/manifest/video.m3u8",
  heroVideoPoster:
    "https://customer-vgdtdepv6dn1f10z.cloudflarestream.com/949a9d969d572607d3f64ff985e27276/thumbnails/thumbnail.jpg",
  aboutImage: baggyEyesAbout.url,
  price: "79.99",
  originalPrice: "249.99",
  appointmentTypeId: "98985636",
  calendarId: "12769252",
  duration: 60,
  image: treatmentImage,
  technologyDescription: [
    "Our Non-Surgical Baggy Eyes treatment targets the delicate under-eye area with focused light and cooling technology. It reduces puffiness, softens fine lines, and refreshes the appearance of tired eyes - without needles, downtime, or discomfort.",
  ],
  technologyHighlights: [
    { text: "Reduces under-eye puffiness" },
    { text: "Softens fine lines around the eyes" },
    { text: "Safe for delicate skin" },
  ],
  hideDeviceImage: true,
  intakeFields: [PROMO_TERMS_FIELD, SMS_CONSENT_FIELD],
  hideResultsBadges: true,
  beforeAfterResults: [
    { id: 201, before: baggyEyes1Before.url, after: baggyEyes1After.url, label: "Baggy Eyes", name: "Catherine", age: 38 },
    { id: 202, before: baggyEyes2Before.url, after: baggyEyes2After.url, label: "Baggy Eyes", name: "Margaret", age: 41 },
    { id: 203, before: baggyEyes3Before.url, after: baggyEyes3After.url, label: "Baggy Eyes", name: "Elaine", age: 62 },
    { id: 204, before: baggyEyes4Before.url, after: baggyEyes4After.url, label: "Baggy Eyes", name: "Brianna", age: 34 },
    { id: 205, before: baggyEyes5Before.url, after: baggyEyes5After.url, label: "Baggy Eyes", name: "Rosalind", age: 42 },
  ],
  faqs: [

    {
      question: "How does the Baggy Eyes treatment work?",
      answer:
        "The treatment combines targeted light therapy with cooling technology to reduce fluid retention, boost circulation, and stimulate collagen in the delicate under-eye area. The result is a firmer, brighter, more rested appearance.",
    },
    ...SHARED_FAQS.filter((f) => f.question !== "Who is this treatment for?"),
    {
      question: "Who is this treatment for?",
      answer:
        "Anyone bothered by puffy under-eyes, dark circles, or fine lines around the eyes. It's a great non-surgical alternative to eye-lift procedures for people who want a refreshed look without surgery or injectables.",
    },
  ],
};

export const LED_CRYO_TREATMENT: TreatmentConfig = {
  slug: "led-cryo",
  label: "LED + Cryo Face & Neck Lift Treatment",
  heroTitle: {
    line1: "LED + Cryo",
    highlight: "Face & Neck Lift",
    line2: "Treatment",
  },
  heroSubtitle:
    "Experience the revolutionary lifting technology that rejuvenates your skin instantly without any downtime.",
  heroVideoUrl:
    "https://pub-eb17aaa123fc4145b1ee4c15fc2e5771.r2.dev/Med%20Spa/Hero%20Video/LED%20Hero%20Video.mp4",
  price: "89.99",
  originalPrice: "349.99",
  appointmentTypeId: "91285301",
  calendarId: "12769252",
  duration: 60,
  image: treatmentImage,
  technologyDescription: [
    "Our LED + Cryo Face & Neck Lift treatment delivers specific wavelengths of light energy into the skin's deeper layers, activating collagen production and cellular repair, while cryo cools and firms the skin for immediate lift. Entirely non-invasive - no heat, injectables, or foreign substances.",
  ],
  technologyHighlights: [
    { text: "Clinically tested" },
    { text: "Safe for all skin types and tones" },
  ],
  hideDeviceImage: true,
  intakeFields: [CONCERNS_FIELD, AGE_RANGE_FIELD, PROMO_TERMS_FIELD, SMS_CONSENT_FIELD],
  faqs: [

    {
      question: "How does the Face & Neck Lift + Cryo Treatment work?",
      answer:
        "The treatment combines LED light therapy with cryotherapy to stimulate collagen production, tighten skin, and reduce inflammation. The LED penetrates deep into the dermis while cryo helps depuff and firm the skin for immediate visible results.",
    },
    ...SHARED_FAQS,
  ],
};
