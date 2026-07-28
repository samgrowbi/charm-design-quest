// Centralized configuration for the Acuity integration.
// Keep IDs as strings to match how they are passed through query params / JSON.

import treatmentImage from "@/assets/treatment-facial.webp";

// Default = Instant Lift (Hermosa Medspa)
export const DEFAULT_ACUITY_APPOINTMENT_TYPE_ID = "91900403";
export const DEFAULT_ACUITY_CALENDAR_ID = "11251085";
export const DEFAULT_ACUITY_TIMEZONE = "America/Los_Angeles";

// Local treatment image for use with dynamic API data
export const TREATMENT_IMAGE = treatmentImage;

// Promotional price override (API returns full price)
export const PROMOTIONAL_PRICE = "79.99";

// Fallback details if API fails
export const TREATMENT_DETAILS_FALLBACK = {
  id: 91900403,
  name: "Treatment",
  description: "",
  duration: 75,
  price: PROMOTIONAL_PRICE,
  category: "Treatment",
  color: "#EC4899",
  image: treatmentImage,
};
