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

## Environment Configuration
- [x] Add VITE_FITCONNECT_API_URL env variable for GraphQL endpoint

## Auth Flow Improvements
- [x] Harden Apollo Client token refresh with proper queue and retry
- [x] Login form validation (required fields, email format, min password length)
- [x] Login error messages (invalid credentials, network errors, account blocked)
- [x] Forgot password modal/dialog integration
- [x] Company selection session persistence and redirect logic
- [x] Logout clears all state (tokens, cache, localStorage) and redirects
- [x] Session restoration on page reload (auto-fetch ME if token exists)
- [x] Auth guards on protected routes with proper loading states
- [x] Comprehensive vitest tests for auth flow

## UI/UX Improvements (Round 2)
- [x] Redesign Login page to match dark theme screenshot (dark bg, orange button, FC branding)
- [x] Implement dark/light mode toggle across the app
- [x] Enhance Dashboard with Recharts charts and visual stats elements
- [x] Create Company Settings/Configuration page
- [x] Fix boss role multi-tenant company switcher in header (x-company-id header)
- [x] Fix company switching redirect bug (redirects to dashboard instead of staying)
- [x] Fix Schedule time format (hours not recognized)
- [x] Use orange (#F97316) as primary accent color matching the screenshot

## Bug Fixes & Improvements (Round 3)
- [x] Fix user profile menu: show editable profile (name, email, picture) not just logout/settings
- [x] Fix schedule time NaN: correct parsing of time strings from backend date fields
- [x] Boss sidebar company switcher: collapsible dropdown in left sidebar to switch active company
- [x] Boss company switch updates x-company-id header for all subsequent requests

## Bug Fixes (Round 4)
- [x] Boss company switcher: load ALL companies via GET_COMPANIES (not just user's companies)
- [x] Boss company switcher: selecting a company updates x-company-id header and refetches all data

## Bug Fixes (Round 5)
- [x] Boss company switcher: remove selectCompany mutation call, use only localStorage + resetStore
- [x] Boss company switcher: visual data refresh after company change (resetStore triggers re-fetch)

## Bug Fixes (Round 6)
- [x] Schedules: fix status badge colors for dark mode (red on dark bg has poor contrast)
- [x] PaymentMethods: fix card content misalignment
- [x] PaymentMethods: make cards fully mobile-responsive (no overlapping elements)

## Users Table Enhancements
- [x] Add subscription status column to users table
- [x] Add next payment date column to users table
- [x] Add send push notification action (envelope icon) per row with modal
- [x] Orange border on user avatar circle

## Quick Fixes
- [x] Remove orange ring border from user avatar circles in Users table

## Polls Management Page
- [x] Read backend poll resolver, schema types, inputs, and services
- [x] Map all poll GraphQL operations and types
- [x] Build Polls list page with status badges and search
- [x] Build Create/Edit Poll dialog with options management
- [x] Build Poll Results view with vote counts and percentages
- [x] Add vote management (view who voted, remove votes)
- [x] Register Polls route in App.tsx and sidebar navigation

## UserAutocomplete Component
- [x] Create reusable UserAutocomplete component (debounced search, name display, id value)
- [x] Replace userId filter in Subscriptions page
- [x] Replace userId filter in Transactions page
- [x] Replace userId filter in PaymentMethods page
- [x] Replace userId filter in Notifications page
- [x] Replace userId filter in any other pages using raw userId input

## Round 7 Fixes
- [x] Fix UserAutocomplete: load all users at once, filter locally (no empty array bug)
- [x] Translate all English UI text to Spanish across all pages
- [x] Make CompanySettings fully functional (wire all mutations)
- [x] Add primary/secondary color pickers to CompanySettings
- [x] Apply selected company colors as CSS variables app-wide

## Round 8 Fixes
- [x] Implement real dynamic color theming: HEX → OKLCH conversion updates all CSS variables instantly
- [x] Create CompanyColorContext that persists color per company in localStorage
- [x] CompanySettings Apariencia tab: selecting a color updates the whole app immediately on save (no reload)
- [x] Live preview in color picker shows real-time changes before saving
