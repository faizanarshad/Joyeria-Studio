import { z } from "zod";

// Pakistani mobile format: 03XXXXXXXXX (11 digits, starts with 03)
export const pakistaniPhoneSchema = z
  .string()
  .trim()
  .regex(/^03\d{9}$/, "Enter a valid phone number, e.g. 03001234567");

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().max(20),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Your cart is empty"),
  customerName: z.string().trim().min(2, "Enter your full name").max(100),
  phone: pakistaniPhoneSchema,
  address: z.string().trim().min(10, "Enter your complete delivery address").max(500),
  city: z.string().trim().min(2, "Select your city").max(100),
  paymentMethod: z.enum(["COD", "BANK_TRANSFER", "JAZZCASH", "EASYPAISA"]),
  couponCode: z.string().trim().max(50).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
  // Honeypot — real users never fill this; bots that autofill every field will.
  website: z.string().max(0, "Spam detected").optional(),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const productImageSchema = z.object({
  url: z.string().trim().url("Enter a valid image URL"),
  alt: z.string().trim().min(1, "Alt text is required"),
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
    material: z.string().trim().max(100).optional().or(z.literal("")),
    finish: z.string().trim().max(100).optional().or(z.literal("")),
    careNote: z.string().trim().max(300).optional().or(z.literal("")),
    category: z.string().trim().max(100).optional().or(z.literal("")),
    collectionId: z.string().trim().min(1, "Select a collection"),
    price: z.coerce.number().int().positive("Price must be greater than 0"),
    compareAtPrice: z.coerce.number().int().positive().optional().nullable(),
    costPrice: z.coerce.number().int().nonnegative().optional().nullable(),
    stock: z.coerce.number().int().nonnegative("Stock can't be negative"),
    isActive: z.coerce.boolean(),
    isFeatured: z.coerce.boolean(),
    images: z.array(productImageSchema),
  })
  // A product can be saved as an inactive draft with no photos yet, but it can
  // never go live on the storefront without at least one.
  .refine((data) => !data.isActive || data.images.length > 0, {
    message: "Add at least one image before activating this product",
    path: ["images"],
  });

export type ProductInput = z.infer<typeof productSchema>;
