# Bait Al Mandi - Project Map

## TECH_STACK
- **Frontend/Framework**: Next.js (App Router)
- **Styling**: Vanilla CSS / CSS Modules
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Security**: Supabase Row Level Security (RLS)
- **State Management**: React Context API (for Cart)
- **Ordering**: WhatsApp API (URL based)

## SYSTEM_FLOW

### Phase 1 (MVP)
1. **Public Website Flow**
   - Landing Page -> View Menu -> Add to Cart -> Checkout via WhatsApp.
2. **Admin Flow**
   - Login (Supabase Auth) -> Admin Dashboard -> Manage Menu Items (CRUD) -> Manage Categories (CRUD).

### Phase 2 (PENDING)
- Native Website Orders
- Real-time Order Tracking
- Order Management Workflow (Admin)
- Gallery & Reviews
- SEO Optimization

### Phase 3 (PENDING)
- Monitoring Stack
- Advanced Caching
- Rate Limiting
- Cron Jobs
- Analytics
- Performance Optimization

## Current Status
- [x] Initialize Next.js project
- [ ] Setup Supabase Client
- [ ] Build Public UI (Menu, Cart)
- [ ] Implement WhatsApp Checkout
- [ ] Build Admin Auth (Supabase)
- [ ] Build Admin Dashboard (CRUD for Menu)
