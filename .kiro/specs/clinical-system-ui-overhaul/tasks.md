# Implementation Plan: Clinical System UI Overhaul — Biruh Tena (ብሩህ ጤና)

## Overview

Transform the existing "Clinical Hub / Dental" branded frontend into the Biruh Tena clinical management system. Work proceeds from foundational tokens (fonts, CSS, MUI theme) through shared components (Sidebar, RoleGuard, ProtectedRoute) to page-level rewrites (LandingPage, dashboards, BookingPage, LoginPage), and finishes with the backend doctor-search extension.

## Tasks

- [x] 1. Global foundations — fonts, CSS tokens, MUI theme
  - [x] 1.1 Add Google Fonts to `frontend/index.html`
    - Insert `<link rel="preconnect" href="https://fonts.googleapis.com">` and the combined Google Fonts `<link>` for Playfair Display (700, 900), Inter (400–800), and Noto Serif Ethiopic (400, 600) with `display=swap` before `</head>`
    - _Requirements: 13.3, 13.4, 13.5, 13.6_

  - [x] 1.2 Update `frontend/src/index.css` — CSS variables and utilities
    - Replace `--primary-blue` with `--color-primary: #0d9488` and add `--color-primary-dark: #0f766e`, `--color-primary-light: #ccfbf1`, `--color-accent: #f59e0b`, `--color-sidebar-from: #0a2540`, `--color-sidebar-to: #0d4f4a`
    - Update `.text-gradient` in `@layer utilities` to use `from-teal-600 to-emerald-500` instead of blue-to-indigo
    - Add `.font-display` utility: `font-family: 'Playfair Display', serif; font-weight: 700;`
    - _Requirements: 13.1, 13.2, 13.3_

  - [x] 1.3 Update MUI theme in `frontend/src/App.jsx`
    - Change `primary.main` to `#0d9488`, `primary.dark` to `#0f766e`, `primary.light` to `#ccfbf1`
    - _Requirements: 13.7_

- [x] 2. Sidebar overhaul
  - [x] 2.1 Update Sidebar gradient and branding in `frontend/src/components/layout/Sidebar.jsx`
    - Change the inline `background` style from `#0f172a → #1e3a5f` to `#0a2540 → #0d4f4a`
    - Replace logo text "Clinical Hub" / "Specialty Center" with "Biruh Tena" (Inter Bold) and "ብሩህ ጤና" (Noto Serif Ethiopic, teal-300 color)
    - _Requirements: 13.8, 13.9_

  - [x] 2.2 Fix `NAV_BY_ROLE.Patient` in `Sidebar.jsx`
    - Remove the `{ to: '/patients', icon: Users, label: 'My Identity' }` entry
    - Add `{ to: '/billing', icon: Receipt, label: 'My Bills' }` entry
    - Import `Receipt` from `lucide-react`
    - _Requirements: 14.8, 14.9_

- [x] 3. RoleGuard component
  - [x] 3.1 Create `frontend/src/components/common/RoleGuard.jsx`
    - Accept `allowedRoles` (string array) and `children` props; optionally accept `fallback`
    - Read `user.role` from Redux auth state
    - If `user.role` is in `allowedRoles`, render `children`; otherwise render `fallback` which defaults to `<Navigate to="/dashboard" replace />`
    - _Requirements: 14.1, 14.2_

  - [ ]* 3.2 Write unit tests for RoleGuard
    - Test renders children when role is in `allowedRoles`
    - Test redirects to `/dashboard` when role is not in `allowedRoles`
    - _Requirements: 14.1, 14.2_

  - [ ]* 3.3 Write property test for RoleGuard — Property 5 & 6
    - **Property 5: RoleGuard allows access for all roles in allowedRoles**
    - **Property 6: RoleGuard redirects all roles not in allowedRoles**
    - **Validates: Requirements 14.1, 14.2**

- [x] 4. ProtectedRoute redirect fix and RoleGuard wiring in `App.jsx`
  - [x] 4.1 Fix `ProtectedRoute` in `frontend/src/App.jsx` to pass redirect param
    - Import `useLocation` in `App.jsx`
    - Change `<Navigate to="/login" replace />` to `<Navigate to={"/login?redirect=" + encodeURIComponent(location.pathname + location.search)} replace />`
    - _Requirements: 15.1_

  - [ ]* 4.2 Write property test for ProtectedRoute redirect — Property 8
    - **Property 8: ProtectedRoute redirect encodes the full current path**
    - **Validates: Requirement 15.1**

  - [x] 4.3 Add `RoleGuard` wrappers to routes in `App.jsx`
    - Import `RoleGuard` component
    - Wrap `/doctors` with `<RoleGuard allowedRoles={['Admin','Doctor','Receptionist']}>`
    - Wrap `/reports` with `<RoleGuard allowedRoles={['Admin']}>`
    - Wrap `/receptionists` with `<RoleGuard allowedRoles={['Admin']}>`
    - Wrap `/inventory` with `<RoleGuard allowedRoles={['Admin','Receptionist']}>`
    - Wrap `/emr` with `<RoleGuard allowedRoles={['Admin','Doctor','Patient']}>`
    - _Requirements: 14.3, 14.4, 14.5, 14.6, 14.7_

- [x] 5. LoginPage — redirect param handling
  - [x] 5.1 Validate and apply `?redirect=` param in `frontend/src/pages/Auth/LoginPage.jsx`
    - In the `useEffect` that fires on `isSuccess || user`, read `redirect` from `URLSearchParams`
    - Validate: only navigate to `redirect` if it starts with `/` and does NOT start with `//`; otherwise navigate to `/dashboard`
    - _Requirements: 15.2, 15.3_

  - [ ]* 5.2 Write property tests for LoginPage redirect — Property 9 & 10
    - **Property 9: LoginPage redirect round-trip preserves destination**
    - **Property 10: LoginPage rejects non-relative redirect values**
    - **Validates: Requirements 15.2, 15.3**

- [x] 6. DashboardPage cleanup
  - [x] 6.1 Replace dental labels in `treatmentData` in `frontend/src/pages/DashboardPage.jsx`
    - Replace the hardcoded `treatmentData` array (`Cleaning`, `Root Canal`, `Braces`) with: `General Consultation (40)`, `Surgical Procedure (20)`, `Pediatric Care (25)`, `Other (15)`
    - Replace the appointment card fallback text `'Dental Consultation'` with `'General Consultation'`
    - _Requirements: 16.1, 16.2_

- [x] 7. PatientPortalDashboard cleanup
  - [x] 7.1 Replace dental copy and add rotating health tips in `frontend/src/pages/Patient/PatientPortalDashboard.jsx`
    - Replace `'Dental Specialist'` fallback in appointment cards with `'General Practitioner'`
    - Replace the static floss tip with a `tips` array covering hydration, sleep, exercise, and nutrition
    - Use `useMemo` with `Math.floor(Date.now() / 86400000) % tips.length` to select the daily tip
    - _Requirements: 16.3, 16.4_

- [x] 8. BookingPage cleanup
  - [x] 8.1 Replace dental copy and add "Doctor not found" error state in `frontend/src/pages/Appointment/BookingPage.jsx`
    - Replace the two `CheckCircle2` bullet texts ("Digital X-ray & Modern diagnostics" / "Board certified clinical excellence") with general clinical copy: "Evidence-based clinical protocols" and "Multi-specialty care network"
    - Replace the `reason` textarea placeholder `"e.g., Routine checkup, teeth cleaning..."` with `"e.g., Routine checkup, follow-up visit..."`
    - When `fetchDoctor` catches a 404 or any error, set a `notFound` state flag and render a "Doctor not found" message with a back navigation button instead of the booking form
    - _Requirements: 9.1, 15.4_

- [ ] 9. Checkpoint — core infrastructure complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. LandingPage full rewrite — sections 1–5
  - [x] 10.1 Rewrite NavBar section in `frontend/src/pages/LandingPage.jsx`
    - Sticky `position: fixed`, `z-50`; transparent on top, `backdrop-blur-md bg-white/70` on scroll
    - Logo: Stethoscope icon + "Biruh Tena" in Playfair Display + "ብሩህ ጤና" subtitle in Noto Serif Ethiopic
    - Nav links: Services, Doctors, About, FAQ, Emergency (update `navLinks` array and `href` targets)
    - "Patient Portal" CTA → `/login`; mobile hamburger → full-screen overlay
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 10.2 Rewrite HeroSection
    - `min-h-screen`; replace badge text with "Ethiopian Clinical Excellence"
    - "Book Appointment" CTA scrolls to `#doctors`; "Learn More" CTA scrolls to `#about`
    - Retain floating stat cards (rating badge, "Available Now" pill)
    - Remove all dental-specific copy
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 10.3 Rewrite StatsBar section
    - Dark teal background `#0d4f4a`
    - 4 animated counters using `useInView` + `useMotionValue`: Patients Served, Expert Doctors, Clinic Locations, Years of Excellence
    - Counters animate from 0 to target on viewport entry
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 10.4 Rewrite ServicesGrid section
    - Replace 4 dental cards with 6 clinical specialty cards: General Medicine, Pediatrics, Gynecology & Obstetrics, Surgery, Dermatology, Ophthalmology
    - Each card: icon, title, description, "Learn More" link
    - Hover: card lifts, border turns teal (`border-teal-500`)
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 10.5 Implement DoctorSearchSection (replaces static Experts section)
    - Add state: `query`, `specialty`, `doctors`, `loading`, `error`
    - Text input + specialty dropdown (options from design spec); debounce input 300ms before calling `doctorService.getPublicDoctors({ search: query, specialty })`
    - Always pass both `search` and `specialty` params even when empty
    - Loading: render 3 animated skeleton cards
    - Error: inline alert banner with retry button; do NOT fall back to mock data
    - Empty: "No doctors found" message
    - Doctor cards: "Book Consultation" → `/login?redirect=/book/:id` if unauthenticated, `/book/:id` if authenticated
    - Remove `mockDoctors` fallback and `displayDoctors` variable from component
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [ ]* 10.6 Write property tests for DoctorSearchSection — Properties 1, 2, 3, 4
    - **Property 1: Debounced search fires at most once per 300ms window**
    - **Property 2: Doctor search API params always include both search and specialty**
    - **Property 3: Unauthenticated booking redirect preserves doctor ID**
    - **Property 4: Authenticated booking navigates directly to booking page**
    - **Validates: Requirements 6.2, 6.3, 6.7, 6.8**

- [x] 11. LandingPage full rewrite — sections 6–11
  - [x] 11.1 Implement HowItWorks section
    - 3 step cards: "Register / Search Doctor", "Book Appointment", "Receive Care"
    - Horizontal on desktop, vertical on mobile
    - Hover: teal background, white text
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 11.2 Implement Testimonials section
    - 5–6 static testimonial objects (name, role, text, avatar initial, star rating)
    - Use Swiper.js (already in package.json) with `autoplay`, `loop`, and `pagination` dots
    - _Requirements: 8.1, 8.2, 8.3_

  - [x] 11.3 Implement AboutTech section
    - Two-column layout: image left, text right
    - Highlights: AI-assisted diagnostics, digital records, multi-specialty care
    - Remove all dental-specific copy ("dental", "tooth", "teeth", "orthodontic", "braces", "root canal", "floss")
    - _Requirements: 9.1, 9.2_

  - [ ]* 11.4 Write property test for AboutTech — Property 14
    - **Property 14: AboutTech section contains no dental-specific copy**
    - **Validates: Requirement 9.1**

  - [x] 11.5 Implement FAQAccordion section
    - 6–8 Q&A pairs (topics: booking, insurance, emergency, records, pricing)
    - Custom accordion using `useState` for open index; animate expand/collapse with Framer Motion `AnimatePresence`
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 11.6 Implement EmergencyBanner section
    - Full-width strip with amber/red background
    - Text: "24/7 Emergency Line: +251 911 22 33 44"
    - Pulsing red dot (`animate-pulse`)
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 11.7 Implement Footer section
    - 4-column grid: brand + tagline, quick links, contact info (`hello@biruhtena.et`), social links
    - Remove `hello@rasdental.com`
    - Copyright line
    - _Requirements: 12.1, 12.2, 12.3_

- [ ] 12. Checkpoint — frontend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Backend — doctor-service search/specialty filter
  - [x] 13.1 Update `getPublicDoctors` in `backend/doctor-service/src/controllers/doctorController.js`
    - Locate the existing `getPublicDoctors` handler (the one serving `GET /api/doctors/public`)
    - Add `const { search, specialty } = req.query;` extraction
    - Build a `where` clause: if `search` is present, add `[Op.or]: [{ fullName: { [Op.iLike]: '%search%' } }, { specialization: { [Op.iLike]: '%search%' } }]`
    - If `specialty` is present, add `specialization: specialty` (exact match)
    - Apply both filters simultaneously when both params are provided
    - Keep `isActive: true` filter so only active doctors are returned
    - Endpoint must remain unauthenticated (no JWT check added)
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [ ]* 13.2 Write property tests for doctor search API — Properties 11, 12, 13
    - **Property 11: Doctor search name filter is case-insensitive and substring-matching**
    - **Property 12: Doctor search specialty filter returns exact matches only**
    - **Property 13: Combined search and specialty filters are both applied**
    - **Validates: Requirements 17.1, 17.2, 17.3**

- [ ] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests require `fast-check` as a dev dependency (`npm install -D fast-check` in the frontend directory)
- The `getPublicDoctors` backend function may need to be located in the routes file if it is not yet a named export — check `backend/doctor-service/src/routes/` for the public route handler
- All section IDs referenced by nav links: `#services`, `#doctors`, `#about`, `#faq`, `#emergency`
- The Swiper import for Testimonials: `import { Swiper, SwiperSlide } from 'swiper/react'` with `import 'swiper/css'` and `import 'swiper/css/pagination'`
