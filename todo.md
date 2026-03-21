# FitConnect Backoffice TODO

## Core Infrastructure
- [x] Apollo Client setup with HttpLink, auth headers, token refresh
- [x] GraphQL type definitions (all queries, mutations, enums, inputs)
- [x] GraphQL codegen configuration for auto-generated TypeScript types
- [x] Custom typed hooks for all GraphQL operations
- [x] Global error handling with Apollo onError link and toast notifications
- [x] Theme and styling setup (Minimals.cc inspired, clean dashboard)

## Authentication
- [x] Login page with email/password form
- [x] Company selection after login (multi-tenant)
- [x] JWT token storage and auto-attach to requests
- [x] Refresh token flow (auto-renew expired tokens)
- [x] Auth context/provider with current user state
- [x] Route protection (redirect unauthenticated users)
- [x] Logout functionality
- [x] Forgot password flow
- [ ] Google login integration

## Dashboard & Layout
- [x] Dashboard layout with sidebar navigation
- [x] Header with user profile dropdown
- [x] Dashboard home page with AdminStats metrics cards
- [x] Sidebar navigation for all sections

## User Management
- [x] Users list page with paginated table
- [x] User search and role filtering
- [x] Create user form with validation
- [x] Edit user form
- [x] Update user picture (S3 presigned URL)
- [x] Block/unblock user actions
- [x] Delete/manage user actions

## Product Management
- [x] Products list page with table
- [x] Create product form (name, description, price)
- [x] Update product picture (S3 upload)
- [x] Remove products (bulk delete)

## Company Management
- [x] Companies list page
- [x] Create company form
- [x] Edit company form with config (polls, products, chat, training toggles)
- [x] Update company logo (S3 upload)
- [x] Schedule options management per company
- [ ] Admit user to company action
- [ ] Request join company action

## Schedule Management
- [x] Schedules list/calendar view
- [x] Create schedule form (title, hours, days, type, max users)
- [x] Schedule status changes (available/cancelled/full)
- [x] Add/remove user from schedule
- [x] Schedule options configuration
- [ ] Today's schedules resume view
- [ ] Schedule stats by month
- [ ] Date range schedule queries

## Plan Management
- [x] Plans list page
- [x] Create plan form (name, amount, currency, interval, features)
- [x] Edit/update plan
- [x] Remove plan
- [x] Plan status management (active/inactive/archived)

## Subscription Management
- [x] User subscriptions list
- [x] Create subscription (assign plan to user)
- [x] Update subscription
- [x] Cancel subscription
- [x] Pause/resume subscription
- [x] Change subscription plan

## Stripe & Payments
- [ ] Stripe customer management (create, update, deactivate)
- [x] Payment methods list per customer
- [ ] Setup intent flow for adding payment methods
- [x] Attach/remove payment methods
- [x] Set default payment method
- [x] Payment method stats
- [x] Transactions list with filtering by status
- [x] Create charge
- [x] Refund transaction
- [x] Retry failed transaction
- [x] Mark transaction as reconciled
- [ ] Transaction summary view

## Notifications & Messaging
- [x] Send push notifications (individual and broadcast)
- [ ] Push token management
- [ ] Forum/conversation messages view
- [ ] Fix/unfix messages

## Polls
- [ ] Polls list page
- [ ] Create poll form
- [ ] Poll voting interface
- [ ] Remove polls
- [ ] Admin polls view

## S3 & File Upload
- [x] Presigned URL generation for uploads
- [x] Image upload component (reusable)
- [x] Profile picture upload
- [x] Product image upload
- [x] Company logo upload

## Testing & Quality
- [x] Vitest tests for core functionality
- [x] TypeScript strict mode compliance
- [ ] Form validation with react-hook-form + zod
