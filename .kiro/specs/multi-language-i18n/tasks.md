# Implementation Plan: Multi-Language i18n

## Overview

Integrate `react-i18next` into the Biruh Tena frontend to support five languages (English, Amharic, Tigrinya, Afan Oromo, Somali). All hardcoded UI strings in JSX are replaced with `t()` calls, translation JSON files are created for each locale, a `LanguageSwitcher` component is added to both NavBar and TopBar, and Ethiopic font switching is handled via a CSS class on `<html>`.

## Tasks

- [x] 1. Install i18n packages
  - Run `npm install i18next react-i18next i18next-browser-languagedetector` inside `frontend/`
  - Verify the three packages appear in `frontend/package.json` dependencies
  - _Requirements: 1.1_

- [x] 2. Create translation JSON files for all five locales
  - [x] 2.1 Create `frontend/src/locales/en/translation.json` with all English strings
    - Include all namespaces: `nav`, `hero`, `stats`, `services`, `doctors`, `howItWorks`, `testimonials`, `faq`, `emergency`, `footer`, `auth`, `dashboard`, `sidebar`, `common`
    - Cover every translatable string visible in LandingPage, LoginPage, Sidebar, TopBar, and DashboardPage
    - Include interpolation key `dashboard.welcome` as `"Welcome back, {{name}}"`
    - _Requirements: 2.1, 2.6, 10.3_

  - [x] 2.2 Create `frontend/src/locales/am/translation.json` with Amharic (Ethiopic script) strings
    - Every key present in `en/translation.json` must also be present here
    - _Requirements: 2.2, 2.7_

  - [x] 2.3 Create `frontend/src/locales/ti/translation.json` with Tigrinya (Ethiopic script) strings
    - Every key present in `en/translation.json` must also be present here
    - _Requirements: 2.3, 2.7_

  - [x] 2.4 Create `frontend/src/locales/om/translation.json` with Afan Oromo (Latin script) strings
    - Every key present in `en/translation.json` must also be present here
    - _Requirements: 2.4, 2.7_

  - [x] 2.5 Create `frontend/src/locales/so/translation.json` with Somali (Latin script) strings
    - Every key present in `en/translation.json` must also be present here
    - _Requirements: 2.5, 2.7_

  - [ ]* 2.6 Write property test for translation file round-trip integrity
    - **Property 1: Translation file round-trip integrity**
    - Generate random key-value pairs including Unicode Ethiopic characters, serialize to JSON, parse back, assert structural equality
    - **Validates: Requirements 10.5**

  - [ ]* 2.7 Write property test for key coverage completeness
    - **Property 3: Key coverage completeness**
    - For each non-English translation file, assert every key in `en/translation.json` is also present in that file
    - **Validates: Requirements 2.7**

- [x] 3. Create `frontend/src/i18n.js` configuration file
  - Import `i18next`, `react-i18next`, and `i18next-browser-languagedetector`
  - Import all five translation JSON files and register them under `resources`
  - Configure `fallbackLng: 'en'`, `supportedLngs: ['en','am','ti','om','so']`
  - Set detection order to `['localStorage', 'navigator']` with `caches: ['localStorage']`
  - Register a `languageChanged` listener that adds/removes the `lang-ethiopic` class on `document.documentElement` when the active locale is `am` or `ti`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 7.2, 8.1, 8.2_

  - [ ]* 3.1 Write property test for Ethiopic font class invariant
    - **Property 6: Ethiopic font class invariant**
    - Generate random locale codes from the supported set; assert `lang-ethiopic` presence on `document.documentElement` equals `locale ∈ {am, ti}`
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

  - [ ]* 3.2 Write property test for localStorage persistence round-trip
    - **Property 7: localStorage persistence round-trip**
    - Generate random valid locale codes; assert `localStorage.getItem('i18nextLng')` equals the selected code after each `i18n.changeLanguage()` call
    - **Validates: Requirements 8.1, 1.6**

- [x] 4. Add Ethiopic font CSS class to `frontend/src/index.css`
  - Add `.lang-ethiopic` rule: `font-family: 'Noto Serif Ethiopic', serif;`
  - The rule should target `html.lang-ethiopic` or `html.lang-ethiopic *` so it cascades to all text elements
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 5. Update `frontend/src/main.jsx` to import i18n
  - Add `import './i18n.js'` as the first import, before `ReactDOM.createRoot`
  - This ensures i18next is initialized before the React tree renders, preventing a flash of untranslated text
  - _Requirements: 1.1, 8.2_

- [ ] 6. Checkpoint — Ensure i18n infrastructure is wired correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Create `frontend/src/components/common/LanguageSwitcher.jsx`
  - Use `useTranslation` from `react-i18next` to get `i18n` instance
  - Maintain local `open` boolean state for dropdown visibility
  - Render a button showing the active language label in its own script (e.g., "አማርኛ" not "Amharic")
  - Render a dropdown list with all five language options; highlight the currently active one
  - Call `i18n.changeLanguage(code)` on selection and close the dropdown
  - Support keyboard navigation: `Tab` to focus, `Enter`/`Space` to open, `ArrowUp`/`ArrowDown` to navigate, `Enter` to select, `Escape` to close
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7_

  - [ ]* 7.1 Write unit tests for LanguageSwitcher
    - Test that the active language label renders correctly
    - Test that `i18n.changeLanguage` is called with the correct code on selection
    - Test that the active language is visually highlighted in the open dropdown
    - Test keyboard navigation: arrow keys cycle options, Enter selects, Escape closes
    - _Requirements: 3.1, 3.2, 3.6, 3.7_

  - [ ]* 7.2 Write property test for language switcher updates all text
    - **Property 5: Language switcher updates all text**
    - Generate pairs of distinct supported locale codes; assert that after switching, `t(key)` returns the new locale's value for all keys
    - **Validates: Requirements 3.3, 9.1**

- [x] 8. Update `frontend/src/pages/LandingPage.jsx` to use translations
  - Add `const { t } = useTranslation()` hook at the top of the component
  - Replace all hardcoded strings in the NavBar section with `t('nav.*')` keys (nav links, "Patient Portal" button)
  - Add `<LanguageSwitcher />` in the desktop NavBar, positioned to the left of the "Patient Portal" button; also add it inside the mobile menu overlay
  - Replace Hero section strings with `t('hero.*')` keys (headline, subheadline, "Book Appointment", "Learn More")
  - Replace Stats Bar labels with `t('stats.*')` keys
  - Replace Services section strings with `t('services.*')` keys (label, heading, description, all six service titles and descriptions, "Learn More" link)
  - Replace Doctor Search section strings with `t('doctors.*')` keys (label, heading, description, search placeholder, specialty options)
  - Replace How It Works section strings with `t('howItWorks.*')` keys (label, heading, all three step titles and descriptions)
  - Replace Testimonials section strings with `t('testimonials.*')` keys (label, heading, all five testimonial texts, names, roles)
  - Replace FAQ section strings with `t('faq.*')` keys (label, heading, all seven Q&A pairs)
  - Replace Emergency section strings with `t('emergency.*')` keys
  - Replace Footer section strings with `t('footer.*')` keys
  - _Requirements: 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

- [x] 9. Update `frontend/src/components/layout/Sidebar.jsx` to use translations
  - Add `const { t } = useTranslation()` hook inside the component
  - Replace each nav item `label` string in `NAV_BY_ROLE` with `t('sidebar.*')` calls (or apply `t()` at render time in the JSX)
  - Replace footer text ("Clinic Hours", "Mon–Fri: 8AM – 6PM", "Sat: 9AM – 2PM") with `t('sidebar.clinicHours')`, `t('sidebar.weekdayHours')`, `t('sidebar.saturdayHours')`
  - _Requirements: 6.1, 6.2_

- [x] 10. Update `frontend/src/pages/DashboardPage.jsx` to use translations
  - Add `const { t } = useTranslation()` hook
  - Replace stat card `title` strings in `allStats` with `t('dashboard.*')` keys (`totalPatients`, `todayAppointments`, `totalRevenue`, `lowStockItems`, `myAppointmentsToday`, `pendingInvoices`)
  - Replace the welcome message `"Welcome back, <strong>{user?.fullName}</strong>"` with `t('dashboard.welcome', { name: user?.fullName || 'User' })`
  - Replace "Activity Overview" and "Real-time clinical throughput" with `t('dashboard.activityOverview')` and `t('dashboard.activitySubtitle')`
  - Replace "Your Schedule" and "Upcoming appointments" with `t('dashboard.yourSchedule')` and `t('dashboard.upcomingAppointments')`
  - Replace "No appointments scheduled" empty state with `t('dashboard.noAppointments')`
  - _Requirements: 6.3, 6.4, 6.5, 6.6_

- [x] 11. Update `frontend/src/pages/Auth/LoginPage.jsx` to use translations
  - Add `const { t } = useTranslation()` hook
  - Replace "Sign In" heading, subtitle, "Email" label, "Password" label, "Sign In" button text, "Forgot password?" link, and "Create Account" link with `t('auth.login.*')` keys
  - Replace the error fallback string `"Invalid credentials"` with `t('auth.login.invalidCredentials')`
  - _Requirements: 5.1_

- [x] 12. Update `frontend/src/components/layout/TopBar.jsx` to use translations
  - Add `const { t } = useTranslation()` hook
  - Replace search `placeholder` `"Search patients, appointments…"` with `t('common.searchPlaceholder')`
  - Replace "Settings" and "Logout" menu item labels with `t('common.settings')` and `t('common.signOut')`
  - Import and render `<LanguageSwitcher />` in the right action area, positioned before the user avatar button
  - _Requirements: 3.5, 6.7_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

  - [ ]* 13.1 Write property test for fallback for missing keys
    - **Property 2: Fallback for missing keys**
    - Generate random key strings present in the English file but absent from a generated partial non-English file; assert `t(key)` returns the English value, never an empty string or the raw key
    - **Validates: Requirements 1.3, 10.1**

  - [ ]* 13.2 Write property test for interpolation correctness
    - **Property 4: Interpolation correctness**
    - Generate random variable names and values; assert that `t(key, vars)` contains each value and contains no `{{...}}` tokens in the output
    - **Validates: Requirements 10.3**

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- All five translation files must have identical key sets — no key may be missing from any locale
- The `lang-ethiopic` CSS class is toggled on `<html>` (not `<body>`) so it cascades to all rendered text
- `i18n.js` must be imported before `<App />` renders to prevent a flash of English text on first load
- TopBar exists at `frontend/src/components/layout/TopBar.jsx` and should receive `<LanguageSwitcher />`
- Property tests should use `fast-check` (install as a dev dependency if not present)
