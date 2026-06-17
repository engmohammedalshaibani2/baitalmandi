import { pgTable, uuid, text, boolean, timestamp, integer, numeric, date, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ==========================================
// Enums
// ==========================================
export const adminRoleEnum = pgEnum('admin_role', ['developer', 'manager', 'order_manager']);
export const offerStatusEnum = pgEnum('offer_status', ['active', 'expired', 'disabled']);
export const orderMethodEnum = pgEnum('order_method', ['whatsapp', 'website']);
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'preparing', 'on_the_way', 'delivered', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'transfer', 'wallet']);
export const auditActionEnum = pgEnum('audit_action', ['modify', 'cancel', 'status_change', 'other']);
export const reportPeriodEnum = pgEnum('report_period', ['daily', 'weekly', 'monthly']);

// ==========================================
// 1. Users
// ==========================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  fullName: text('full_name').notNull(),
  phone: text('phone').unique().notNull(),
  address: text('address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 2. Admin Users
// ==========================================
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  fullName: text('full_name').notNull(),
  role: adminRoleEnum('role').notNull(),
  authUserId: uuid('auth_user_id'),
});

// ==========================================
// 3. Categories
// ==========================================
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  slug: text('slug').unique().notNull(),
  icon: text('icon'),
  image: text('image'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 4. Items
// ==========================================
export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => categories.id).notNull(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),
  image: text('image'),
  isBestSeller: boolean('is_best_seller').default(false).notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 5. Item Prices
// ==========================================
export const itemPrices = pgTable('item_prices', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').references(() => items.id).notNull(),
  sizeLabelAr: text('size_label_ar').notNull(),
  sizeLabelEn: text('size_label_en').notNull(),
  serves: integer('serves'),
  originalPrice: numeric('original_price').notNull(),
  salePrice: numeric('sale_price'),
  isActive: boolean('is_active').default(true).notNull(),
});

// ==========================================
// 6. Offers
// ==========================================
export const offers = pgTable('offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  itemId: uuid('item_id').references(() => items.id),
  titleAr: text('title_ar').notNull(),
  titleEn: text('title_en').notNull(),
  descriptionAr: text('description_ar'),
  descriptionEn: text('description_en'),
  discountPercent: integer('discount_percent'),
  salePrice: numeric('sale_price'),
  discountAmount: numeric('discount_amount'),
  offerType: text('offer_type').default('percentage_discount').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  image: text('image'),
  status: offerStatusEnum('status').default('active').notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 6b. Offer Items (Bundle Components)
// ==========================================
export const offerItems = pgTable('offer_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  offerId: uuid('offer_id').references(() => offers.id).notNull(),
  menuItemId: uuid('menu_item_id').references(() => items.id).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  priceId: uuid('price_id').references(() => itemPrices.id),
  variantName: text('variant_name'),
  unitPrice: numeric('unit_price').default('0').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 7. Cart Sessions
// ==========================================
export const cartSessions = pgTable('cart_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: text('session_id').unique().notNull(),
  phone: text('phone'),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 8. Cart Items
// ==========================================
export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: text('session_id').references(() => cartSessions.sessionId).notNull(),
  itemId: uuid('item_id').references(() => items.id).notNull(),
  priceId: uuid('price_id').references(() => itemPrices.id).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: numeric('unit_price').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 9. Order Sequences
// ==========================================
export const orderSequences = pgTable('order_sequences', {
  id: uuid('id').primaryKey().defaultRandom(),
  sequenceDate: date('sequence_date').unique().notNull(),
  lastNumber: integer('last_number').default(0).notNull(),
});

// ==========================================
// 10. Orders
// ==========================================
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderNumber: text('order_number').unique().notNull(),
  customerId: uuid('customer_id').references(() => users.id),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  trackingToken: text('tracking_token'),
  deliveryAddress: text('delivery_address'),
  subtotal: numeric('subtotal').notNull(),
  deliveryFee: numeric('delivery_fee').default('0').notNull(),
  taxAmount: numeric('tax_amount').default('0').notNull(),
  totalAmount: numeric('total_amount').notNull(),
  notes: text('notes'),
  estimatedTime: timestamp('estimated_time', { withTimezone: true }),
  orderMethod: orderMethodEnum('order_method').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').default('cash').notNull(),
  offerId: uuid('offer_id').references(() => offers.id),
  status: orderStatusEnum('status').default('pending').notNull(),
  version: integer('version').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  archivedAt: timestamp('archived_at', { withTimezone: true }),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deliveryLatitude: numeric('delivery_latitude'),
  deliveryLongitude: numeric('delivery_longitude'),
  deliveryZone: text('delivery_zone'),
  deliveryDistanceKm: numeric('delivery_distance_km'),
  deliveryDurationMinutes: integer('delivery_duration_minutes'),
  locationVerified: boolean('location_verified').default(false),
  baseDeliveryFeeAmount: numeric('base_delivery_fee_amount').default('0'),
  extraDistanceKm: numeric('extra_distance_km').default('0'),
  extraFeeAmount: numeric('extra_fee_amount').default('0'),
  weatherFeeAmount: numeric('weather_fee_amount').default('0'),
  peakFeeAmount: numeric('peak_fee_amount').default('0'),
  peakPercentageUsed: numeric('peak_percentage_used').default('0'),
  idempotencyKey: text('idempotency_key'),
});

// ==========================================
// 11. Order Items
// ==========================================
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  categoryName: text('category_name').notNull(),
  itemName: text('item_name').notNull(),
  sizeLabel: text('size_label').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price').notNull(),
  subtotal: numeric('subtotal'),
  totalPrice: numeric('total_price').notNull(),
});

// ==========================================
// 12. Order Status History
// ==========================================
export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id).notNull(),
  oldStatus: text('old_status'),
  newStatus: text('new_status').notNull(),
  changedByAdminId: uuid('changed_by_admin_id').references(() => adminUsers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 13. Gallery Images
// ==========================================
export const galleryImages = pgTable('gallery_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  imageUrl: text('image_url').notNull(),
  captionAr: text('caption_ar'),
  captionEn: text('caption_en'),
  category: text('category'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  showOnHomepage: boolean('show_on_homepage').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 14. Reviews
// ==========================================
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  reviewerName: text('reviewer_name').notNull(),
  reviewerImage: text('reviewer_image'),
  rating: integer('rating').notNull(),
  commentAr: text('comment_ar'),
  commentEn: text('comment_en'),
  source: text('source'),
  isFeatured: boolean('is_featured').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 15. Site Settings
// ==========================================
export const siteSettings = pgTable('site_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  settingKey: text('setting_key').unique().notNull(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 16. Branches
// ==========================================
export const branches = pgTable('branches', {
  id: uuid('id').primaryKey().defaultRandom(),
  nameAr: text('name_ar').notNull(),
  nameEn: text('name_en').notNull(),
  address: text('address').notNull(),
  phone: text('phone'),
  mapUrl: text('map_url'),
  workingHours: text('working_hours'),
  isActive: boolean('is_active').default(true).notNull(),
});

// ==========================================
// 17. Audit Logs
// ==========================================
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  entityId: uuid('entity_id').notNull(),
  entityType: text('entity_type').notNull(),
  action: auditActionEnum('action').notNull(),
  details: text('details'),
  adminId: uuid('admin_id').references(() => adminUsers.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ==========================================
// 18b. Customer Tokens (Independent Tracking Layer)
// ==========================================
export const customerTokens = pgTable('customer_tokens', {
  phone: text('phone').primaryKey(),
  trackingToken: text('tracking_token').notNull().default(sql`gen_random_uuid()::text`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 18c. Order Offers (Snapshot at Order Time)
// ==========================================
export const orderOffers = pgTable('order_offers', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  offerId: uuid('offer_id'),
  offerName: text('offer_name').notNull(),
  offerType: text('offer_type').notNull(),
  originalPrice: numeric('original_price').notNull(),
  discountAmount: numeric('discount_amount').notNull(),
  discountPercent: numeric('discount_percent').default('0').notNull(),
  finalPrice: numeric('final_price').notNull(),
  quantity: integer('quantity').default(1).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 18d. Order Offer Items (Bundle Line Items Snapshot)
// ==========================================
export const orderOfferItems = pgTable('order_offer_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderOfferId: uuid('order_offer_id').references(() => orderOffers.id, { onDelete: 'cascade' }).notNull(),
  itemId: uuid('item_id'),
  itemName: text('item_name').notNull(),
  sizeLabel: text('size_label').default('عادي'),
  quantity: integer('quantity').default(1).notNull(),
  unitPrice: numeric('unit_price').notNull(),
  totalPrice: numeric('total_price').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ==========================================
// 19. Scheduled Reports
// ==========================================
export const scheduledReports = pgTable('scheduled_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  reportType: text('report_type').notNull(), // e.g., 'sales', 'full_summary'
  period: reportPeriodEnum('period').notNull(),
  recipients: text('recipients').array().notNull(), // Array of emails
  isActive: boolean('is_active').default(true).notNull(),
  lastSentAt: timestamp('last_sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
