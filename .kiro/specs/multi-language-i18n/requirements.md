# Requirements Document

## Introduction

This feature adds full multi-language internationalization (i18n) support to the Biruh Tena clinical management system. Currently all UI text is hardcoded in English across JSX files. The system will be extended to support five languages: English (default), Amharic (አማርኛ), Tigrinya (ትግርኛ), Afan Oromo (Afaan Oromoo), and Somali (Soomaali). The implementation uses react-i18next as the translation framework, with per-language JSON translation files, a language switcher component in both the NavBar and TopBar, and language preference persisted in localStorage.

## Glossary

- **I18n_System**: The internationalization subsystem composed of i18next, react-i18next, and i18next-browser-languagedetector, responsible for loading and serving translations.
- **Language_Switcher**: A dropdown UI component that allows users to select their preferred display language, rendered in both the NavBar (landing page) and TopBar (dashboard).
- **Translation_File**: A JSON file located at `frontend/src/locales/{lang}/translation.json` containing all translatable string keys and their values for a given language.
- **Locale_Code**: A BCP 47 language tag identifying a supported language: `en` (English), `am` (Amharic), `ti` (Tigrinya), `om` (Afan Oromo), `so` (Somali).
- **Fallback_Language**: The language used when a translation key is missing in the active locale; always English (`en`).
- **t_Function**: The `t('key')` hook provided by react-i18next, used in JSX to retrieve the translated string for a given key.
- **NavBar**: The top navigation bar rendered on the public LandingPage.
- **TopBar**: The top bar rendered inside the authenticated DashboardLayout.
- **Ethiopic_Font**: The Noto Serif Ethiopic font, already loaded via Google Fonts, used to render Amharic and Tigrinya text correctly.
- **Language_Preference**: The user's chosen locale code, persisted in `localStorage` under the key `i18nextLng`.
- **Browser_Language**: The language reported by the browser's `navigator.language` property, used for auto-detection on first visit.

---

## Requirements

### Requirement 1: i18n Infrastructure Setup

**User Story:** As a developer, I want a centralized i18n configuration, so that all parts of the application can access translations through a single, consistent API.

#### Acceptance Criteria

1. THE I18n_System SHALL be initialized in a dedicated `frontend/src/i18n.js` configuration file that is imported once in `frontend/src/main.jsx` before the React tree is rendered.
2. THE I18n_System SHALL load Translation_Files for all five Locale_Codes (`en`, `am`, `ti`, `om`, `so`) from `frontend/src/locales/{lang}/translation.json`.
3. WHEN a translation key is requested for a Locale_Code that does not contain that key, THE I18n_System SHALL return the English (`en`) value for that key as the Fallback_Language.
4. THE I18n_System SHALL use `i18next-browser-languagedetector` to detect the Browser_Language on first visit and set it as the active locale if it matches a supported Locale_Code.
5. IF the detected Browser_Language does not match any supported Locale_Code, THEN THE I18n_System SHALL default to English (`en`).
6. THE I18n_System SHALL persist the active Locale_Code to `localStorage` under the key `i18nextLng` whenever the language is changed.
7. WHEN the application is loaded and a Language_Preference exists in `localStorage`, THE I18n_System SHALL restore that Locale_Code as the active language without prompting the user.

---

### Requirement 2: Translation Files for All Five Languages

**User Story:** As a translator or developer, I want structured JSON translation files for each language, so that all UI strings are externalized and maintainable.

#### Acceptance Criteria

1. THE I18n_System SHALL provide a Translation_File at `frontend/src/locales/en/translation.json` containing English strings for every translatable key used in the application.
2. THE I18n_System SHALL provide a Translation_File at `frontend/src/locales/am/translation.json` containing Amharic (Ethiopic script) strings for every key defined in the English Translation_File.
3. THE I18n_System SHALL provide a Translation_File at `frontend/src/locales/ti/translation.json` containing Tigrinya (Ethiopic script) strings for every key defined in the English Translation_File.
4. THE I18n_System SHALL provide a Translation_File at `frontend/src/locales/om/translation.json` containing Afan Oromo (Latin script) strings for every key defined in the English Translation_File.
5. THE I18n_System SHALL provide a Translation_File at `frontend/src/locales/so/translation.json` containing Somali (Latin script) strings for every key defined in the English Translation_File.
6. THE I18n_System SHALL organize translation keys into namespaced sections matching the application's page structure: `nav`, `hero`, `stats`, `services`, `doctors`, `howItWorks`, `testimonials`, `faq`, `emergency`, `footer`, `auth`, `dashboard`, `sidebar`, `common`.
7. FOR ALL Translation_Files, every key present in the English Translation_File SHALL also be present in each non-English Translation_File, ensuring no key is missing across locales.

---

### Requirement 3: Language Switcher Component

**User Story:** As a user, I want a visible language selector in the navigation, so that I can switch the interface language at any time.

#### Acceptance Criteria

1. THE Language_Switcher SHALL render as a dropdown button displaying the currently active language's name in its own language (e.g., "አማርኛ" for Amharic, not "Amharic").
2. THE Language_Switcher SHALL display the following options in the dropdown: English, አማርኛ, ትግርኛ, Afaan Oromoo, Soomaali.
3. WHEN a user selects a language from the Language_Switcher, THE I18n_System SHALL update all visible UI text to the selected language without requiring a page reload.
4. THE Language_Switcher SHALL be rendered in the NavBar on the LandingPage, positioned to the left of the "Patient Portal" button.
5. THE Language_Switcher SHALL be rendered in the TopBar inside the DashboardLayout, positioned in the top-right action area alongside the user avatar.
6. WHEN the Language_Switcher dropdown is open, THE Language_Switcher SHALL visually highlight the currently active language option.
7. THE Language_Switcher SHALL be accessible via keyboard navigation, supporting Tab focus, Enter/Space to open, and arrow keys to navigate options.

---

### Requirement 4: Landing Page Translation

**User Story:** As a visitor, I want to read the entire landing page in my preferred language, so that I can understand the clinic's services without a language barrier.

#### Acceptance Criteria

1. THE I18n_System SHALL provide translations for all text in the NavBar section of the LandingPage, including navigation link labels (`Services`, `Doctors`, `About`, `FAQ`, `Emergency`) and the `Patient Portal` button.
2. THE I18n_System SHALL provide translations for all text in the Hero section, including the headline, subheadline, `Book Appointment` button, and `Learn More` button.
3. THE I18n_System SHALL provide translations for all text in the Stats Bar section, including all four stat labels (`Patients Served`, `Expert Doctors`, `Clinic Locations`, `Years of Excellence`).
4. THE I18n_System SHALL provide translations for all text in the Services Grid section, including the section label, heading, description, all six service titles, all six service descriptions, and the `Learn More` link text.
5. THE I18n_System SHALL provide translations for all text in the Doctor Search section, including the section label, heading, description, search input placeholder, and specialty dropdown options.
6. THE I18n_System SHALL provide translations for all text in the How It Works section, including the section label, heading, and all three step titles and descriptions.
7. THE I18n_System SHALL provide translations for all text in the Testimonials section, including the section label, heading, and all five testimonial texts, names, and roles.
8. THE I18n_System SHALL provide translations for all text in the FAQ section, including the section label, heading, and all seven question and answer pairs.
9. THE I18n_System SHALL provide translations for all text in the Emergency section, including the heading, description, phone number label, and call-to-action text.
10. THE I18n_System SHALL provide translations for all text in the Footer section, including the tagline, contact details labels, social link labels, and copyright notice.
11. WHEN the active language is changed on the LandingPage, THE I18n_System SHALL update all ten sections simultaneously without a page reload.

---

### Requirement 5: Authentication Pages Translation

**User Story:** As a patient or staff member, I want the login, registration, and password recovery forms in my language, so that I can authenticate without needing to read English.

#### Acceptance Criteria

1. THE I18n_System SHALL provide translations for all text on the LoginPage, including the page title, email label, password label, `Sign In` button, `Forgot Password` link, and `Register` link.
2. THE I18n_System SHALL provide translations for all text on the RegisterPage, including the page title, all form field labels (full name, email, phone, password, confirm password, role), the `Register` button, and the `Sign In` link.
3. THE I18n_System SHALL provide translations for all text on the ForgotPasswordPage, including the page title, instruction text, email label, `Send Reset Link` button, and `Back to Login` link.
4. THE I18n_System SHALL provide translations for all form validation error messages displayed on authentication pages, including required field errors, invalid email format errors, and password mismatch errors.
5. WHEN an authentication API error is returned (e.g., invalid credentials), THE I18n_System SHALL display the error message using a translated string key rather than a raw API error string.

---

### Requirement 6: Dashboard and Navigation Translation

**User Story:** As a logged-in user, I want the dashboard interface and sidebar navigation in my preferred language, so that I can use the clinical system without switching mental contexts.

#### Acceptance Criteria

1. THE I18n_System SHALL provide translations for all Sidebar navigation item labels across all four roles: Admin (`Dashboard`, `Patients`, `Doctors`, `Receptionists`, `Appointments`, `Medical Records`, `Inventory`, `Reports`, `Settings`), Doctor (`Dashboard`, `My Appointments`, `Medical Records`, `My Patients`, `Settings`), Receptionist (`Dashboard`, `Patients`, `Doctors`, `Appointments`, `Inventory`, `Settings`), and Patient (`My Portal`, `Bookings`, `My Records`, `My Bills`, `Settings`).
2. THE I18n_System SHALL provide translations for the Sidebar footer text, including `Clinic Hours`, `Mon–Fri: 8AM – 6PM`, and `Sat: 9AM – 2PM`.
3. THE I18n_System SHALL provide translations for all DashboardPage stat card titles: `Total Patients`, `Today's Appointments`, `Total Revenue`, `Low Stock Items`, `My Appointments Today`, `Pending Invoices`.
4. THE I18n_System SHALL provide translations for the DashboardPage section headings: `Activity Overview`, `Real-time clinical throughput`, `Your Schedule`, `Upcoming appointments`.
5. THE I18n_System SHALL provide translations for the DashboardPage welcome message pattern, supporting dynamic interpolation of the user's name (e.g., `Welcome back, {{name}}`).
6. THE I18n_System SHALL provide translations for the DashboardPage empty state message: `No appointments scheduled`.
7. THE I18n_System SHALL provide translations for the TopBar elements, including the search placeholder, notification icon label, and user menu items (`Profile`, `Settings`, `Sign Out`).

---

### Requirement 7: Ethiopic Script Font Rendering

**User Story:** As an Amharic or Tigrinya speaker, I want Ethiopic script text to render correctly with the proper font, so that the interface is legible in my language.

#### Acceptance Criteria

1. WHEN the active Locale_Code is `am` (Amharic) or `ti` (Tigrinya), THE I18n_System SHALL apply the `Noto Serif Ethiopic` font family to all translated text elements that contain Ethiopic script characters.
2. THE I18n_System SHALL apply Ethiopic_Font rendering via a CSS class (e.g., `font-ethiopic`) that is conditionally added to the document root or body element when the active locale is `am` or `ti`.
3. WHEN the active Locale_Code is `en`, `om`, or `so`, THE I18n_System SHALL use the default `Inter` font family for all UI text.
4. THE I18n_System SHALL not require a page reload to switch fonts when the language is changed between Ethiopic-script and Latin-script locales.

---

### Requirement 8: Language Persistence Across Sessions

**User Story:** As a returning user, I want my language preference remembered between visits, so that I do not have to re-select my language every time I open the application.

#### Acceptance Criteria

1. WHEN a user selects a language via the Language_Switcher, THE I18n_System SHALL write the selected Locale_Code to `localStorage` under the key `i18nextLng` immediately.
2. WHEN the application is initialized and `localStorage` contains a valid Locale_Code under `i18nextLng`, THE I18n_System SHALL activate that locale before the first render, preventing a flash of English text.
3. WHEN the application is initialized and `localStorage` does not contain a valid Locale_Code, THE I18n_System SHALL use the Browser_Language detection result as described in Requirement 1.
4. IF the value stored in `localStorage` under `i18nextLng` is not one of the five supported Locale_Codes, THEN THE I18n_System SHALL fall back to English (`en`) and overwrite the invalid stored value.

---

### Requirement 9: Dynamic Language Switching Without Page Reload

**User Story:** As a user, I want the language to change instantly when I select a new one, so that I get immediate feedback without losing my current page state.

#### Acceptance Criteria

1. WHEN a user selects a new language from the Language_Switcher, THE I18n_System SHALL re-render all components using the t_Function within 100ms without triggering a full page navigation or reload.
2. WHEN the language is switched, THE I18n_System SHALL preserve the current route, scroll position, and any open UI state (e.g., open modals, form input values).
3. WHILE the I18n_System is loading a Translation_File asynchronously, THE I18n_System SHALL display the previously active language's text rather than empty strings or translation keys.
4. THE I18n_System SHALL support React Suspense integration so that components can declare a loading boundary while translations are being fetched.

---

### Requirement 10: Translation Key Coverage and Fallback Correctness

**User Story:** As a developer, I want guaranteed fallback behavior for missing translations, so that users never see raw translation keys in the UI.

#### Acceptance Criteria

1. IF a translation key is requested and the key does not exist in the active Translation_File, THEN THE I18n_System SHALL return the English value for that key from the `en` Translation_File.
2. IF a translation key does not exist in any Translation_File including English, THEN THE I18n_System SHALL return the key string itself as a last-resort fallback, and THE I18n_System SHALL log a warning to the browser console in development mode.
3. THE I18n_System SHALL support interpolation variables in translation strings using the `{{variable}}` syntax, so that dynamic values (e.g., user names, counts) can be embedded in translated strings.
4. THE I18n_System SHALL support plural forms for count-based strings (e.g., "1 appointment" vs "2 appointments") using i18next's built-in pluralization syntax.
5. FOR ALL Translation_Files, parsing a Translation_File as JSON and re-serializing it SHALL produce an equivalent JSON structure (round-trip property), ensuring no encoding or character corruption in Ethiopic script files.
