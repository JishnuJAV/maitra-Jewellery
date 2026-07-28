import { z } from 'zod';
import { normalisePhone } from '@/lib/phone';

/** Shared request schemas. Everything crossing the network is validated here. */

export const slugSchema = z
  .string()
  .trim()
  .min(1, 'Slug is required')
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');

export const phoneSchema = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalised = normalisePhone(value);
    if (!normalised) {
      ctx.addIssue({ code: 'custom', message: 'Enter a valid 10-digit Indian mobile number' });
      return z.NEVER;
    }
    return normalised;
  });

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit PIN code');

export const mediaSchema = z.object({
  type: z.enum(['IMAGE', 'VIDEO']),
  url: z.string().url('Media URL must be a valid URL').max(1024),
  publicId: z.string().max(255).nullable().optional(),
  posterUrl: z.string().url().max(1024).nullable().optional(),
  alt: z.string().max(300).optional().default(''),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

export const productSchema = z.object({
  slug: slugSchema,
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().max(5000).optional().default(''),
  price: z.number().int('Price must be a whole number of rupees').min(0).max(10_000_000),
  compareAt: z.number().int().min(0).max(10_000_000).nullable().optional(),
  highlights: z.array(z.string().trim().min(1).max(200)).max(12).optional().default([]),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  stock: z.number().int().min(0).max(1_000_000).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional().default(0),
  categoryId: z.string().cuid('Choose a valid category').nullable().optional(),
  media: z.array(mediaSchema).max(24, 'A product can have at most 24 media items').optional().default([]),
});

/** Every field optional for PATCH, but each still validated when present. */
export const productUpdateSchema = productSchema.partial();

export const categorySchema = z.object({
  slug: slugSchema,
  label: z.string().trim().min(1, 'Label is required').max(120),
  blurb: z.string().max(500).optional().default(''),
  imageUrl: z.string().url().max(1024).nullable().optional(),
  sortOrder: z.number().int().min(0).max(100_000).optional().default(0),
  active: z.boolean().optional().default(true),
});

export const categoryUpdateSchema = categorySchema.partial();

export const shippingRateSchema = z.object({
  name: z.string().trim().min(1, 'Region name is required').max(120),
  fee: z.number().int('Fee must be a whole number of rupees').min(0).max(100_000),
  freeAbove: z.number().int().min(0).max(10_000_000).nullable().optional(),
  states: z.array(z.string().trim().min(1).max(80)).max(40).optional().default([]),
  pincodePrefixes: z
    .array(z.string().trim().regex(/^\d{1,6}$/, 'PIN prefixes must be 1-6 digits'))
    .max(60)
    .optional()
    .default([]),
  isDefault: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  sortOrder: z.number().int().min(0).max(100_000).optional().default(0),
  etaDays: z.string().trim().max(60).nullable().optional(),
});

export const shippingRateUpdateSchema = shippingRateSchema.partial();

export const orderStatusSchema = z.enum([
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
]);

export const paymentStatusSchema = z.enum([
  'UNPAID',
  'AWAITING_CONFIRMATION',
  'PAID',
  'REFUNDED',
]);

export const orderUpdateSchema = z
  .object({
    status: orderStatusSchema.optional(),
    paymentStatus: paymentStatusSchema.optional(),
    paymentRef: z.string().trim().max(200).nullable().optional(),
    adminNote: z.string().max(2000).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'Nothing to update' });

/**
 * Checkout payload.
 *
 * Note what is absent: prices, shipping and totals. The browser sends only what
 * the customer chose (product slug + quantity) and where it's going; the server
 * looks up every price itself. Accepting client-supplied money values would let
 * anyone order at whatever price they liked.
 */
export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, 'Name is required').max(120),
  phone: phoneSchema,
  email: z.string().trim().email('Enter a valid email').max(200).optional().or(z.literal('')),
  addressLine1: z.string().trim().min(3, 'Address is required').max(300),
  addressLine2: z.string().trim().max(300).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'City is required').max(120),
  state: z.string().trim().min(1, 'State is required').max(120),
  pincode: pincodeSchema,
  customerNote: z.string().trim().max(1000).optional().or(z.literal('')),
  items: z
    .array(
      z.object({
        slug: slugSchema,
        qty: z.number().int().min(1, 'Quantity must be at least 1').max(99),
      }),
    )
    .min(1, 'Your cart is empty')
    .max(50),
});

export const sendOtpSchema = z.object({ phone: phoneSchema });

export const verifyOtpSchema = z.object({
  phone: phoneSchema,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
});

export const shippingQuoteSchema = z.object({
  state: z.string().trim().max(120).optional(),
  pincode: z.string().trim().max(10).optional(),
  items: z
    .array(z.object({ slug: slugSchema, qty: z.number().int().min(1).max(99) }))
    .max(50)
    .optional()
    .default([]),
});
