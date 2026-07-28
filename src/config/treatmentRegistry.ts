import {
  INSTANT_LIFT_TREATMENT,
  BAGGY_EYES_TREATMENT,
  LED_CRYO_TREATMENT,
  TreatmentConfig,
} from "./treatments";

const treatments: Record<string, TreatmentConfig> = {
  "instant-lift": INSTANT_LIFT_TREATMENT,
  "baggy-eyes": BAGGY_EYES_TREATMENT,
  "led-cryo": LED_CRYO_TREATMENT,
};

export function getTreatmentBySlug(slug: string | null): TreatmentConfig {
  return (slug && treatments[slug]) || INSTANT_LIFT_TREATMENT;
}
