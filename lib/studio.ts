import { STUDIO_WHATSAPP_DISPLAY } from "@/lib/whatsapp";

// Sender details printed on parcel labels. The return address is optional —
// set STUDIO_RETURN_ADDRESS in the environment and it appears under the
// studio's name; without it the label shows the name and phone only.
export const STUDIO_NAME = "Joyería Studio";
export const STUDIO_PHONE_DISPLAY = STUDIO_WHATSAPP_DISPLAY;

export function studioReturnAddress(): string | null {
  return process.env.STUDIO_RETURN_ADDRESS?.trim() || null;
}
