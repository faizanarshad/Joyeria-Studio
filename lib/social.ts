// The studio's social links. NEXT_PUBLIC_INSTAGRAM_URL / _FACEBOOK_URL override
// them (e.g. for a test deploy); otherwise the studio's own accounts are used,
// so the links work without any hosting configuration.
export const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL || "https://www.instagram.com/joyeria.studio/";

export const FACEBOOK_URL = process.env.NEXT_PUBLIC_FACEBOOK_URL || "";

/** "@handle" from an Instagram profile URL, for display next to the link. */
export function instagramHandle(url: string): string {
  const handle = url.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").split(/[/?#]/)[0];
  return handle ? `@${handle}` : "Instagram";
}
