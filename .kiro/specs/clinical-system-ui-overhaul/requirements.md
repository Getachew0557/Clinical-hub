# Requirements Document

## Introduction

This document defines the requirements for the **Biruh Tena (ብሩህ ጤና)** clinical system UI overhaul. The project transforms the existing "Clinical Hub / Dental" branded frontend into a polished, Ethiopian-flavored clinical management system. The overhaul covers the public landing page (11 sections), branding tokens, typography, role-based access controls, integration wiring, and a minor backend extension to the doctor search API.

## Glossary

- **System**: The Biruh Tena React SPA and its supporting microservices
- **LandingPage**: The public-facing single-page component composed of 11 ordered sections
- **NavBar**: The sticky navigation bar rendered at the top of the LandingPage
- **HeroSection**: The full-viewport introductory section of the LandingPage
- **StatsBar**: The animated statistics counter section of the LandingPage
- **ServicesGrid**: The 6-card clinical specialty grid section of the LandingPage
- **DoctorSearchSection**: The live-search doctor discovery section of the LandingPage
- **HowItWorks**: The 3-step process explanation section of the LandingPage
- **Testimonials**: The patient review carousel section of the LandingPage
- **AboutTech**: The technology and mission section of the LandingPage
- **FAQAccordion**: The expandable FAQ section of the LandingPage
- **EmergencyBanner**: The 24/7 emergency contact strip section of the LandingPage
- **Footer**: The bottom section of the LandingPage with contact, social, and links
- **DoctorSearchWidget**: The search input and specialty dropdown within DoctorSearchSection
- **RoleGuard**: A React wrapper component that enforces role-based access to routes
- **ProtectedRoute**: The existing React component that enforces authentication on routes
- **Sidebar**: The authenticated dashboard navigation component
- **DashboardPage**: The main authenticated dashboard view
- **PatientPortalDashboard**: The patient-specific dashboard view
- **BookingPage**: The appointment booking page for a specific doctor
- **LoginPage**: The authentication page
- **Doctor_Service**: The `doctor-service` Node.js microservice running on port 5010
- **API_Gateway**: The API gateway proxying requests to microservices on port 5050
- **Patient**: A user with the Patient role
- **Admin**: A user with the Admin role
- **Doctor**: A user with the Doctor role
- **Receptionist**: A user with the Receptionist role

---

## Requirements

### Requirement 1: Landing Page Structure

**User Story:** As a visitor, I want to see a complete, well-structured landing page, so that I can understand the Biruh Tena clinical system and its services.

#### Acceptance Criteria

1. THE LandingPage SHALL render 11 sections in the following order: NavBar, HeroSection, StatsBar, ServicesGrid, DoctorSearchSection, HowItWorks, Testimonials, AboutTech, FAQAccordion, EmergencyBanner, Footer.
2. WHEN a visitor loads the LandingPage, THE System SHALL display all 11 sections without errors.
3. THE LandingPage SHALL display the brand name "Biruh Tena" and the Ethiopic subtitle "ብሩህ ጤና" in the NavBar logo area.

---

### Requirement 2: NavBar

**User Story:** As a visitor, I want a clear and accessible navigation bar, so that I can find key sections and access the patient portal.

#### Acceptance Criteria

1. THE NavBar SHALL be rendered with `position: fixed` and `z-index: 50` so it remains visible during scroll.
2. WHEN the page scroll position is at the top, THE NavBar SHALL render with a transparent background.
3. WHEN the visitor scrolls down from the top, THE NavBar SHALL apply a glassmorphism style (`backdrop-blur-md bg-white/70`).
4. THE NavBar SHALL display navigation links to the Services, Doctors, About, FAQ, and Emergency sections.
5. THE NavBar SHALL display a "Patient Portal" call-to-action button that navigates to `/login`.
6. WHEN the viewport is mobile-sized, THE NavBar SHALL display a hamburger menu that opens a full-screen overlay navigation.

---

### Requirement 3: HeroSection

**User Story:** As a visitor, I want an engaging hero section, so that I immediately understand the platform's purpose and can take action.

#### Acceptance Criteria

1. THE HeroSection SHALL render with a minimum height of 100 viewport height (`min-h-screen`).
2. THE HeroSection SHALL display a "Book Appointment" CTA that scrolls the page to the DoctorSearchSection.
3. THE HeroSection SHALL display a "Learn More" CTA that scrolls the page to the AboutTech section.
4. THE HeroSection SHALL NOT contain the text "Dental Excellence & Technology"; it SHALL display "Ethiopian Clinical Excellence" instead.
5. THE HeroSection SHALL display a hero image with floating stat cards including a rating badge and an "Available Now" pill.

---

### Requirement 4: StatsBar

**User Story:** As a visitor, I want to see key statistics about the platform, so that I can trust the quality and scale of the service.

#### Acceptance Criteria

1. THE StatsBar SHALL display exactly 4 animated counters: Patients Served, Expert Doctors, Clinic Locations, and Years of Excellence.
2. WHEN the StatsBar enters the viewport, THE System SHALL animate the counters from zero to their target values.
3. THE StatsBar SHALL render with a dark teal background color (`#0d4f4a`).

---

### Requirement 5: ServicesGrid

**User Story:** As a visitor, I want to browse available clinical specialties, so that I can identify which services are relevant to my needs.

#### Acceptance Criteria

1. THE ServicesGrid SHALL render exactly 6 specialty cards covering: General Medicine, Pediatrics, Gynecology & Obstetrics, Surgery, Dermatology, and Ophthalmology.
2. WHEN a visitor hovers over a specialty card, THE ServicesGrid SHALL lift the card and apply a teal border highlight.
3. THE ServicesGrid SHALL display an icon, title, description, and "Learn More" link on each card.

---

### Requirement 6: Doctor Search

**User Story:** As a visitor, I want to search for doctors by name or specialty, so that I can find a suitable doctor before deciding to register.

#### Acceptance Criteria

1. THE DoctorSearchSection SHALL display a text input for name or specialty search and a specialty dropdown filter.
2. WHEN a visitor types in the search input, THE DoctorSearchSection SHALL wait 300 milliseconds after the last keystroke before calling the API.
3. WHEN the DoctorSearchSection calls the API, THE System SHALL send a `GET /api/doctors/public` request including both `search` and `specialty` query parameters.
4. WHILE the API request is in progress, THE DoctorSearchSection SHALL display animated skeleton loading cards.
5. WHEN the API returns an empty result set, THE DoctorSearchSection SHALL display a "No doctors found" empty state with a descriptive message.
6. WHEN the API returns an error, THE DoctorSearchSection SHALL display an inline error banner with a retry button and SHALL NOT display stale mock data.
7. WHEN an unauthenticated visitor clicks "Book Consultation" on a doctor card, THE System SHALL navigate to `/login?redirect=/book/:doctorId`.
8. WHEN an authenticated user clicks "Book Consultation" on a doctor card, THE System SHALL navigate directly to `/book/:doctorId`.

---

### Requirement 7: HowItWorks Section

**User Story:** As a visitor, I want to understand the booking process, so that I know what steps to take to receive care.

#### Acceptance Criteria

1. THE HowItWorks section SHALL display exactly 3 steps: Register / Search Doctor, Book Appointment, and Receive Care.
2. WHEN a visitor hovers over a step card, THE HowItWorks section SHALL apply a teal background with white text to that card.
3. THE HowItWorks section SHALL display the steps in a horizontal flow on desktop viewports and a vertical flow on mobile viewports.

---

### Requirement 8: Testimonials Section

**User Story:** As a visitor, I want to read patient testimonials, so that I can build confidence in the platform.

#### Acceptance Criteria

1. THE Testimonials section SHALL render a carousel with between 5 and 6 static testimonial items.
2. THE Testimonials carousel SHALL auto-play and loop continuously.
3. THE Testimonials carousel SHALL display pagination dots for manual navigation.

---

### Requirement 9: AboutTech Section

**User Story:** As a visitor, I want to learn about the technology and mission behind Biruh Tena, so that I understand the platform's capabilities.

#### Acceptance Criteria

1. THE AboutTech section SHALL NOT contain any dental-specific copy or references.
2. THE AboutTech section SHALL highlight AI-assisted diagnostics, digital records, and multi-specialty care.

---

### Requirement 10: FAQAccordion Section

**User Story:** As a visitor, I want to find answers to common questions, so that I can resolve doubts without contacting support.

#### Acceptance Criteria

1. THE FAQAccordion SHALL display between 6 and 8 question-and-answer pairs.
2. WHEN a visitor clicks a FAQ item, THE FAQAccordion SHALL expand that item to reveal the answer with an animated transition.
3. WHEN an expanded FAQ item is clicked again, THE FAQAccordion SHALL collapse it with an animated transition.

---

### Requirement 11: EmergencyBanner Section

**User Story:** As a visitor, I want to see emergency contact information prominently, so that I can reach help quickly in a medical emergency.

#### Acceptance Criteria

1. THE EmergencyBanner SHALL display the text "24/7 Emergency Line: +251 911 22 33 44".
2. THE EmergencyBanner SHALL display a pulsing red dot animation to draw attention.
3. THE EmergencyBanner SHALL render as a full-width strip.

---

### Requirement 12: Footer Section

**User Story:** As a visitor, I want a comprehensive footer, so that I can find contact information, social links, and quick navigation.

#### Acceptance Criteria

1. THE Footer SHALL display a 4-column grid containing: brand and tagline, quick links, contact information, and social links with insurance logos.
2. THE Footer SHALL display the contact email `hello@biruhtena.et` and SHALL NOT display `hello@rasdental.com`.
3. THE Footer SHALL display a copyright line.

---

### Requirement 13: Branding and Visual Identity

**User Story:** As a user, I want the system to reflect the Biruh Tena brand consistently, so that the experience feels cohesive and professional.

#### Acceptance Criteria

1. THE System SHALL use `#0d9488` as the primary color token for buttons, links, and active states throughout the application.
2. THE System SHALL use `#f59e0b` as the accent color token for CTAs, highlights, and emergency elements.
3. THE System SHALL apply Playfair Display font at weight 700 or 900 to all display headings and section H2 elements.
4. THE System SHALL apply Inter font at weights 400–800 to all body text, card headings, captions, and labels.
5. THE System SHALL apply Noto Serif Ethiopic font to all Ethiopic script text including the "ብሩህ ጤና" subtitle.
6. THE System SHALL load Playfair Display, Inter, and Noto Serif Ethiopic from Google Fonts with `display=swap` in `index.html`.
7. THE System SHALL update the MUI theme `primary.main` to `#0d9488`, `primary.dark` to `#0f766e`, and `primary.light` to `#ccfbf1`.
8. THE Sidebar SHALL render with a gradient from `#0a2540` to `#0d4f4a`.
9. THE Sidebar logo area SHALL display "Biruh Tena" in Inter Bold and "ብሩህ ጤና" in Noto Serif Ethiopic.

---

### Requirement 14: Role-Based Access Control

**User Story:** As a system administrator, I want role-based access enforced on all routes, so that users can only access pages appropriate to their role.

#### Acceptance Criteria

1. THE System SHALL provide a `RoleGuard` component that accepts an `allowedRoles` array and renders its children only when the current user's role is in that array.
2. WHEN a user's role is not in the `allowedRoles` array, THE RoleGuard SHALL redirect the user to `/dashboard` without displaying an error page.
3. THE `/doctors` route SHALL be wrapped with a `RoleGuard` that allows only Admin, Doctor, and Receptionist roles.
4. THE `/reports` route SHALL be wrapped with a `RoleGuard` that allows only the Admin role.
5. THE `/receptionists` route SHALL be wrapped with a `RoleGuard` that allows only the Admin role.
6. THE `/inventory` route SHALL be wrapped with a `RoleGuard` that allows only Admin and Receptionist roles.
7. THE `/emr` route SHALL be wrapped with a `RoleGuard` that allows Admin, Doctor, and Patient roles.
8. THE Sidebar `NAV_BY_ROLE.Patient` configuration SHALL NOT include a link to the `/doctors` route.
9. THE Sidebar `NAV_BY_ROLE.Patient` configuration SHALL include a link to the `/billing` route labeled "My Bills".
10. WHEN a user with the Patient role navigates to `/doctors`, THE RoleGuard SHALL redirect them to `/dashboard`.

---

### Requirement 15: Booking Redirect Flow

**User Story:** As a patient, I want to be redirected back to the booking page after logging in, so that I do not lose my place in the booking flow.

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access a protected route, THE ProtectedRoute SHALL redirect to `/login` with the current path encoded as a `redirect` query parameter.
2. WHEN a user successfully authenticates on the LoginPage and a `redirect` query parameter is present, THE LoginPage SHALL navigate the user to the path specified in the `redirect` parameter.
3. WHEN the `redirect` parameter does not start with `/` or starts with `//`, THE LoginPage SHALL ignore the redirect parameter and navigate to `/dashboard` instead.
4. WHEN the `BookingPage` loads with a doctor ID that does not exist, THE BookingPage SHALL display a "Doctor not found" error message with a back navigation button.

---

### Requirement 16: Dashboard Content Cleanup

**User Story:** As a clinical staff member, I want the dashboard to display accurate clinical content, so that the information is relevant to our multi-specialty practice.

#### Acceptance Criteria

1. THE DashboardPage treatment chart SHALL NOT display dental-specific labels such as "Root Canal", "Braces", or "Cleaning".
2. THE DashboardPage treatment chart SHALL display generic clinical categories: General Consultation, Surgical Procedure, Pediatric Care, and Other.
3. THE PatientPortalDashboard SHALL display "General Consultation" as the appointment type fallback text and SHALL NOT display "Dental Consultation".
4. THE PatientPortalDashboard daily health tip SHALL rotate through general health topics (hydration, sleep, exercise, nutrition) and SHALL NOT display dental-specific tips.

---

### Requirement 17: Backend Doctor Search API

**User Story:** As a developer, I want the public doctor API to support search and specialty filtering, so that the landing page can display relevant doctor results.

#### Acceptance Criteria

1. WHEN `GET /api/doctors/public` is called with a `search` query parameter, THE Doctor_Service SHALL return only doctors whose `fullName` or `specialization` contains the search string (case-insensitive).
2. WHEN `GET /api/doctors/public` is called with a `specialty` query parameter, THE Doctor_Service SHALL return only doctors whose `specialization` exactly matches the specialty value.
3. WHEN `GET /api/doctors/public` is called with both `search` and `specialty` query parameters, THE Doctor_Service SHALL apply both filters simultaneously.
4. WHEN `GET /api/doctors/public` is called with no query parameters, THE Doctor_Service SHALL return all active doctors.
5. THE `GET /api/doctors/public` endpoint SHALL remain unauthenticated and SHALL NOT require a JWT token.
