import { z } from "zod";

// Customers type the same mobile number many ways — "+92 300 1234567",
// "0300-1234567", "923001234567". Reduce them all to the one stored form,
// 03XXXXXXXXX, so checkout accepts them and Track Order finds the order
// whichever way the number is typed later.
export function normalizePakistaniPhone(input: string): string {
  const digits = input.replace(/[\s\-().]/g, "");
  const local = digits.replace(/^(?:\+|00)?92(?=3\d{9}$)/, "0");
  return /^3\d{9}$/.test(local) ? `0${local}` : local;
}

// Pakistani mobile format: 03XXXXXXXXX (11 digits, starts with 03)
export const pakistaniPhoneSchema = z
  .string()
  .transform(normalizePakistaniPhone)
  .pipe(z.string().regex(/^03\d{9}$/, "Enter a valid mobile number, e.g. 0300 1234567"));

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).optional(),
  quantity: z.number().int().positive().max(20),
});

export const checkoutSchema = z.object({
  // Capped so a crafted payload can't force a huge `IN (...)` lookup — a real
  // cart from this catalog is never going to have dozens of distinct items.
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty").max(50),
  customerName: z.string().trim().min(2, "Enter your full name").max(100),
  phone: pakistaniPhoneSchema,
  address: z.string().trim().min(10, "Enter your complete delivery address").max(500),
  city: z.string().trim().min(2, "Select your city").max(100),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "JAZZCASH", "EASYPAISA"]),
  couponCode: z.string().trim().max(50).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  // Honeypot — real users never fill this; bots that autofill every field will.
  // Named away from common autofill-heuristic targets like "website" or
  // "company", which some password managers fill even in a display:none field.
  // Deliberately unconstrained here: a Zod-level rejection would surface this
  // field's name and "Spam detected" in the 400 response body, handing a bot
  // exactly the signal a honeypot exists to deny it. The route checks its
  // value itself and returns the same generic error every other failure does.
  hp_confirm: z.string().optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

// A full URL (Cloudinary, Unsplash) or a path to a file in public/, e.g.
// "/products/set.jpg" — "//host/..." is excluded since it points off-site.
const imageUrlSchema = z
  .string()
  .trim()
  .refine(
    (v) => (v.startsWith("/") && !v.startsWith("//")) || z.string().url().safeParse(v).success,
    "Enter a valid image URL"
  );

export const productImageSchema = z.object({
  url: imageUrlSchema,
  alt: z.string().trim().min(1, "Alt text is required"),
});

export const productVariantSchema = z.object({
  color: z.string().trim().min(1, "Colour name is required").max(40),
  stock: z.coerce.number().int().nonnegative("Stock can't be negative"),
  imageUrl: imageUrlSchema.optional().or(z.literal("")),
});

export const productSchema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(150),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(150)
      .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens"),
    description: z.string().trim().min(10, "Add a short description").max(2000),
    sku: z
      .string()
      .trim()
      .max(50)
      .regex(/^[A-Za-z0-9-]*$/, "Item code can only contain letters, numbers and hyphens")
      .optional()
      .or(z.literal("")),
    material: z.string().trim().max(100).optional().or(z.literal("")),
    finish: z.string().trim().max(100).optional().or(z.literal("")),
    careNote: z.string().trim().max(300).optional().or(z.literal("")),
    category: z.string().trim().max(100).optional().or(z.literal("")),
    occasionTags: z.array(z.string().trim().max(30)).max(10).default([]),
    colorTags: z.array(z.string().trim().max(30)).max(10).default([]),
    tryOnImageUrl: imageUrlSchema.optional().or(z.literal("")),
    collectionId: z.string().trim().min(1, "Select a collection"),
    price: z.coerce.number().int().positive("Price must be greater than 0"),
    compareAtPrice: z.coerce.number().int().positive().optional().nullable(),
    costPrice: z.coerce.number().int().nonnegative().optional().nullable(),
    stock: z.coerce.number().int().nonnegative("Stock can't be negative"),
    isActive: z.coerce.boolean(),
    isFeatured: z.coerce.boolean(),
    images: z.array(productImageSchema),
    variants: z.array(productVariantSchema).max(20).default([]),
  })
  // A product can be saved as an inactive draft with no photos yet, but it can
  // never go live on the storefront without at least one.
  .refine((data) => !data.isActive || data.images.length > 0, {
    message: "Add at least one image before activating this product",
    path: ["images"],
  })
  .refine(
    (data) =>
      new Set(data.variants.map((v) => v.color.toLowerCase())).size === data.variants.length,
    { message: "Each colour can only be listed once", path: ["variants"] }
  );

export type ProductInput = z.infer<typeof productSchema>;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
});

export const collectionSchema = z.object({
  name: z.string().trim().min(2, "Name is required").max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  coverImage: imageUrlSchema.optional().or(z.literal("")),
  featured: z.coerce.boolean(),
  sortOrder: z.coerce.number().int(),
});

export type CollectionInput = z.infer<typeof collectionSchema>;

export const deliveryRateSchema = z.object({
  city: z.string().trim().min(2, "City is required").max(100),
  fee: z.coerce.number().int().nonnegative("Fee can't be negative"),
  isActive: z.coerce.boolean(),
});

export type DeliveryRateInput = z.infer<typeof deliveryRateSchema>;

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(30)
      .regex(/^[A-Za-z0-9]+$/, "Code can only contain letters and numbers"),
    discountType: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().int().positive("Value must be greater than 0"),
    minOrderValue: z.coerce.number().int().nonnegative().optional().nullable(),
    usageLimit: z.coerce.number().int().positive().optional().nullable(),
    expiresAt: z.string().trim().optional().nullable(),
    isActive: z.coerce.boolean(),
  })
  .refine((data) => data.discountType !== "PERCENT" || data.value <= 100, {
    message: "A percent discount can't be more than 100",
    path: ["value"],
  });

export type CouponInput = z.infer<typeof couponSchema>;

export const reviewSchema = z.object({
  productId: z.string().min(1),
  customerName: z.string().trim().min(2, "Enter your name").max(100),
  rating: z.coerce.number().int().min(1, "Pick a rating").max(5, "Pick a rating"),
  comment: z.string().trim().min(10, "Tell us a bit more (at least 10 characters)").max(1000),
  // Honeypot — same pattern and same reasoning as checkout's hp_confirm:
  // left unconstrained here so a Zod-level rejection can't hand a bot the
  // field name and confirmation that it tripped a trap.
  hp_confirm: z.string().optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

// bcrypt only hashes the first 72 bytes of a password, so anything past that
// would silently be ignored — cap there (in bytes, since Urdu or emoji
// characters take several each) rather than accept a longer password that
// isn't really as strong as it looks.
const MAX_PASSWORD_BYTES = 72;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z
      .string()
      .min(10, "Use at least 10 characters")
      .refine((p) => new TextEncoder().encode(p).length <= MAX_PASSWORD_BYTES, "That's too long — keep it under 72 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "The two new passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    message: "Choose a password different from your current one",
    path: ["newPassword"],
  });
