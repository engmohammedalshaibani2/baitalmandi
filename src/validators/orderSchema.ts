import { z } from 'zod';

export const OrderItemSchema = z.object({
  category_name: z.string().min(1),
  item_name: z.string().min(1),
  size_label: z.string().default('عادي'),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  total_price: z.number().nonnegative(),
});

export const OfferInputSchema = z.object({
  offer_id: z.string().uuid(),
  quantity: z.number().int().positive().default(1),
  bundle_items: z.array(z.object({
    category_name: z.string(),
    item_name: z.string(),
    size_label: z.string().default('عادي'),
    quantity: z.number().int().positive(),
    unit_price: z.number().nonnegative(),
    total_price: z.number().nonnegative(),
  })).default([]),
});

export const CreateOrderSchema = z.object({
  customer_name: z.string().min(2, 'الاسم مطلوب (حرفين على الأقل)'),
  customer_phone: z.string().regex(/^(?:\+?967)?(?:70|71|73|77|78)\d{7}$/, 'رقم هاتف يمني صحيح مطلوب'),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, 'يجب إضافة عنصر واحد على الأقل'),
  offers: z.array(OfferInputSchema).optional(),
  subtotal: z.number().nonnegative(),
  order_method: z.enum(['whatsapp', 'website']),
  payment_method: z.enum(['cash', 'transfer', 'wallet']),
  delivery_lat: z.number().optional(),
  delivery_lng: z.number().optional(),
});

export const UpdateStatusSchema = z.object({
  orderId: z.string().uuid(),
  newStatus: z.enum(['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled']),
  currentVersion: z.number().int().positive(),
});

export const CancelOrderSchema = z.object({
  orderId: z.string().uuid(),
  currentVersion: z.number().int().positive(),
});

export const AdminUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: z.enum(['developer', 'manager', 'order_manager']),
});

export const ItemSchema = z.object({
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  category_id: z.string().uuid(),
  image: z.string().optional(),
  is_best_seller: z.boolean().default(false),
  is_available: z.boolean().default(true),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
});

export const CategorySchema = z.object({
  name_ar: z.string().min(1),
  name_en: z.string().min(1),
  slug: z.string().min(1),
  icon: z.string().optional(),
  image: z.string().optional(),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
});

export const OfferSchema = z.object({
  title_ar: z.string().min(1),
  title_en: z.string().min(1),
  description_ar: z.string().optional(),
  description_en: z.string().optional(),
  offer_type: z.enum(['fixed_price', 'percentage_discount', 'amount_discount', 'free_item']),
  discount_percent: z.number().int().min(0).max(100).optional(),
  discount_amount: z.number().nonnegative().optional(),
  sale_price: z.number().nonnegative().optional(),
  start_date: z.string(),
  end_date: z.string(),
  image: z.string().optional(),
  is_active: z.boolean().default(true),
  status: z.enum(['active', 'expired', 'disabled']).default('active'),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;
export type CancelOrderInput = z.infer<typeof CancelOrderSchema>;
export type AdminUserInput = z.infer<typeof AdminUserSchema>;
export type ItemInput = z.infer<typeof ItemSchema>;
export type CategoryInput = z.infer<typeof CategorySchema>;
export type OfferInput = z.infer<typeof OfferSchema>;
