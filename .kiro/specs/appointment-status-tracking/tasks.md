# Implementation Plan: Appointment Status Tracking

## Overview

Replace the flat tab-based `AppointmentListPage` with a horizontal kanban-style `StatusDashboard`, add a matching `VideoStatusDashboard`, and back them with a new `GET /api/appointments/status-counts` endpoint. Pure utility functions drive all bucket/count logic and are covered by fast-check property-based tests.

## Tasks

- [x] 1. Add `getStatusCounts` backend controller and route
  - [x] 1.1 Implement `getStatusCounts` controller in `backend/appointment-service/src/controllers/appointmentController.js`
    - Use `Appointment.findAll` with `GROUP BY status` and `sequelize.fn('COUNT', ...)` to build live counts
    - Scope by `doctorId` when `req.user.role === 'Doctor'`; no scope restriction for Admin/Receptionist
    - Accept optional `?type` query param (`clinic` | `video`) and add it to the `where` clause when present
    - Derive cumulative counts from live counts using the formula in the design (no audit table)
    - Return a single JSON object with all five status keys, each containing `{ live, cumulative }`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 11.9_

  - [x] 1.2 Register `GET /api/appointments/status-counts` route in `backend/appointment-service/src/routes/appointmentRoutes.js`
    - Add the route **before** the `/:id` wildcard to avoid route conflict
    - Protect with `protect` middleware; authorize `Admin`, `Receptionist`, `Doctor`
    - Import `getStatusCounts` from the controller
    - _Requirements: 5.1, 5.6_

- [ ] 2. Checkpoint — verify backend endpoint
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Add `getStatusCounts` to the frontend appointment service
  - Add `getStatusCounts(params = {})` method to `frontend/src/api/appointment.service.js`
    - `GET ${API_URL}/status-counts` with `getAuthHeader()` and `params` forwarded as query params
    - Accepts `{ type }` optional param
    - _Requirements: 5.1, 5.4_

- [ ] 4. Create pure utility functions for dashboard logic
  - Create `frontend/src/utils/appointmentDashboard.js` with the following exported pure functions:
    - `getBuckets(role)` — returns the correct bucket label array for the given role
    - `deriveLiveCounts(appointments)` — counts appointments per status from an array
    - `deriveCumulativeCounts(liveCounts)` — applies the cumulative formula from the design
    - `filterByDoctor(appointments, userId)` — filters to appointments where `doctorId === userId`
    - `filterByType(appointments, type)` — filters to appointments where `type` matches
    - `sortAppointments(appointments)` — sorts ascending by `appointmentDate` then `appointmentTime`
    - `applyDateFilter(appointments, date)` — filters to appointments on the given date; returns all when `date` is null/empty
    - `applyStatusUpdate(appointments, id, newStatus)` — returns a new array with the matching appointment's status replaced
    - `shouldShowJoinButton(status, isVideo)` — returns `true` iff `isVideo && (status === 'Confirmed' || status === 'In Progress')`
    - _Requirements: 1.1, 1.2, 1.3a, 1.4, 3.1–3.5, 6.1, 7.1, 7.2, 10.2, 10.4, 11.2–11.6_

  - [ ]* 4.1 Write property-based tests for `getBuckets` (Properties 1 & 2)
    - **Property 1: Doctor dashboard never shows Pending or Confirmed buckets**
    - **Property 2: Admin/Receptionist dashboard shows all five buckets**
    - Use `fc.constantFrom('Doctor', 'Admin', 'Receptionist')` as the role arbitrary
    - Tag: `// Feature: appointment-status-tracking, Property 1` and `Property 2`
    - **Validates: Requirements 1.1, 1.2**

  - [ ]* 4.2 Write property-based tests for `deriveLiveCounts` (Property 3)
    - **Property 3: Live count equals card count in each bucket**
    - Generate arbitrary appointment arrays with random statuses; assert `deriveLiveCounts` result matches manual count per status
    - Tag: `// Feature: appointment-status-tracking, Property 3`
    - **Validates: Requirements 1.3a, 3.6**

  - [ ]* 4.3 Write property-based tests for `filterByDoctor` (Property 4)
    - **Property 4: Doctor scoping — only own appointments counted**
    - Generate appointment arrays with mixed `doctorId` values; assert filtered result contains only matching IDs
    - Tag: `// Feature: appointment-status-tracking, Property 4`
    - **Validates: Requirements 1.4, 5.2**

  - [ ]* 4.4 Write property-based tests for `filterByType` (Property 9)
    - **Property 9: Video bucket contains only video-type appointments**
    - Generate mixed `clinic`/`video` appointment arrays; assert `filterByType(apts, 'video')` contains no `clinic` entries
    - Tag: `// Feature: appointment-status-tracking, Property 9`
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 4.5 Write property-based tests for `shouldShowJoinButton` (Property 10)
    - **Property 10: Join Video Call button visibility matches eligibility**
    - Generate all combinations of status and `isVideo`; assert button shown iff `isVideo && status in ['Confirmed', 'In Progress']`
    - Tag: `// Feature: appointment-status-tracking, Property 10`
    - **Validates: Requirements 7.1, 7.2**

  - [ ]* 4.6 Write property-based tests for `applyDateFilter` (Properties 12 & 13)
    - **Property 12: Date filter count equals filtered appointment count**
    - **Property 13: Clearing date filter restores full bucket**
    - Generate appointment arrays with random dates; assert filter count matches manual count; assert round-trip restores original set
    - Tag: `// Feature: appointment-status-tracking, Property 12` and `Property 13`
    - **Validates: Requirements 10.3, 10.4**

  - [ ]* 4.7 Write property-based tests for `sortAppointments` (Property 14)
    - **Property 14: Default sort order is ascending by date then time**
    - Generate unsorted appointment arrays; assert sorted result is non-decreasing by `appointmentDate` then `appointmentTime`
    - Tag: `// Feature: appointment-status-tracking, Property 14`
    - **Validates: Requirements 10.2**

  - [ ]* 4.8 Write property-based tests for `applyStatusUpdate` (Property 8)
    - **Property 8: Status update moves card to correct bucket**
    - Generate appointment arrays and a random `(id, newStatus)` pair; assert the updated array has exactly one appointment with that id at `newStatus` and all others unchanged
    - Tag: `// Feature: appointment-status-tracking, Property 8`
    - **Validates: Requirements 3.1–3.5, 3.6**

  - [ ]* 4.9 Write property-based tests for `deriveCumulativeCounts` (Properties 15, 16 & 17)
    - **Property 15: Cumulative count is always ≥ live count**
    - **Property 16: Cumulative Pending equals total appointment count**
    - **Property 17: Cumulative count is monotonically non-increasing along the lifecycle**
    - Generate arbitrary live count maps; assert all three invariants hold
    - Tag: `// Feature: appointment-status-tracking, Property 15`, `Property 16`, `Property 17`
    - **Validates: Requirements 11.2, 11.3, 11.4, 11.5, 11.6**

  - [ ]* 4.10 Write property-based tests for bucket assignment (Property 7)
    - **Property 7: A card appears in exactly one bucket matching its status**
    - Generate appointment arrays and a role; assert each appointment appears in exactly one bucket whose label matches its status
    - Tag: `// Feature: appointment-status-tracking, Property 7`
    - **Validates: Requirements 3.1–3.5**

- [ ] 5. Checkpoint — verify utility functions and property tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Create `useInterval` hook
  - Create `frontend/src/hooks/useInterval.js`
    - Standard Dan Abramov implementation: accept `(callback, delay)`, store latest callback in a `useRef`, clear and reset the interval when `delay` changes, clear on unmount
    - _Requirements: 8.1_

- [ ] 7. Create `useStatusDashboard` hook
  - Create `frontend/src/hooks/useStatusDashboard.js`
    - Accept `{ type, role, userId }` options
    - On mount: fetch full appointment list via `getAllAppointments` (Admin/Receptionist) or `getMyAppointments` (Doctor), filtered by `type` if provided; derive initial `counts` from the local array using `deriveLiveCounts` and `deriveCumulativeCounts`
    - Start `useInterval` at 30 000 ms: call `appointmentService.getStatusCounts({ type })` and update `counts` state with the API response
    - `handleStatusChange(id, newStatus)`: optimistically call `applyStatusUpdate` and recalculate counts, then call `PATCH /api/appointments/:id/status`; on failure, revert to previous appointments/counts and set an inline error
    - Expose `{ appointments, counts, loading, error, handleStatusChange, refetch }`
    - _Requirements: 1.3, 3.6, 3.7, 4.5, 4.6, 8.1, 8.2, 8.3, 8.4_

- [ ] 8. Create `StatusBadge` component
  - Create `frontend/src/components/appointments/StatusBadge.jsx`
    - Accept `{ status }` prop
    - Render a small pill/badge with the correct Tailwind color classes per the design color mapping: gray (Pending), blue (Confirmed), amber (In Progress), green (Completed), red (Cancelled)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ]* 8.1 Write unit tests for `StatusBadge` color schemes
    - Render each of the 5 statuses and assert the correct color class is present in the output
    - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 9. Create `AppointmentCard` component
  - Create `frontend/src/components/appointments/AppointmentCard.jsx`
    - Accept `{ appointment, role, isVideo, onStatusChange }` props
    - Render patient name, date, time, reason, and `StatusBadge`
    - Render doctor name only when `role` is `Admin` or `Receptionist`
    - Render inline action buttons per the role/status action matrix in the design
    - Render "Join Video Call" button (navigates to `/video/:id`) when `shouldShowJoinButton(status, isVideo)` is true
    - Render a video camera icon when `isVideo` is true
    - Show inline error message on `onStatusChange` rejection; clear on next successful action
    - _Requirements: 2.1, 2.7, 2.8, 2.9, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 7.1, 7.2, 7.3, 7.4_

  - [ ]* 9.1 Write property-based tests for `AppointmentCard` required fields (Property 11)
    - **Property 11: Appointment card always displays required fields**
    - Generate arbitrary appointment objects with valid `patientName`, `appointmentDate`, `appointmentTime`, `reason`; assert all four appear in the rendered output
    - Tag: `// Feature: appointment-status-tracking, Property 11`
    - **Validates: Requirements 2.1, 2.7**

  - [ ]* 9.2 Write unit tests for `AppointmentCard` role-based action buttons
    - Doctor + `Confirmed` status → "Start Consultation" button present
    - Doctor + `In Progress` status → "Mark as Completed" button present
    - Doctor + `Completed` or `Cancelled` → no action buttons
    - Admin + `Pending` → Confirm and Cancel buttons present
    - Admin + `Confirmed` → In Progress and Cancel buttons present
    - Admin + `In Progress` → Completed and Cancel buttons present
    - Video + `Confirmed` → "Join Video Call" button present
    - Video + `Completed` → "Join Video Call" button absent
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.2_

- [ ] 10. Create `StatusBucket` component
  - Create `frontend/src/components/appointments/StatusBucket.jsx`
    - Accept `{ status, appointments, liveCount, cumulativeCount, isVideo, onStatusChange, onError }` props
    - Render bucket header with status label, "Now" badge (liveCount), and "Total" label (cumulativeCount)
    - Render a date filter input visible only for Admin/Receptionist roles (read role from Redux `auth` slice inside the component)
    - Apply `sortAppointments` and `applyDateFilter` to the appointments list before rendering cards
    - Render a scrollable list of `AppointmentCard` components
    - Render empty-state message ("No appointments" or "No video consultations" when `isVideo`) when filtered list is empty
    - _Requirements: 1.3, 1.7, 2.1, 6.7, 10.1, 10.2, 10.3, 10.4, 11.1_

- [ ] 11. Checkpoint — verify component rendering
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Create `StatusDashboard` page
  - Create `frontend/src/pages/Appointment/StatusDashboard.jsx`
    - Read `role` and `userId` from Redux `auth` slice
    - Call `useStatusDashboard({ role, userId })` (no `type` filter)
    - Determine visible buckets via `getBuckets(role)`
    - Render a horizontally scrollable row of `StatusBucket` components, passing filtered appointments, `liveCount`, and `cumulativeCount` per bucket
    - Render "Book Appointment" button for Admin/Receptionist (opens `BookAppointmentModal`)
    - Show MUI `Alert` with a "Retry" button on initial load failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.1, 9.2_

- [ ] 13. Create `VideoStatusDashboard` page
  - Create `frontend/src/pages/VideoConsultation/VideoStatusDashboard.jsx`
    - Same structure as `StatusDashboard` but passes `type: 'video'` to `useStatusDashboard`
    - Passes `isVideo={true}` to all `StatusBucket` components
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ] 14. Update routing to wire in the new pages
  - In the frontend router configuration, replace the component rendered at `/appointments` with `StatusDashboard`
  - Replace the component rendered at `/video-consultations` with `VideoStatusDashboard`
  - Ensure the existing `/video/:roomId` route (actual video call room) is unchanged
  - _Requirements: 9.1, 9.3, 6.6_

- [ ] 15. Final checkpoint — end-to-end wiring
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use [fast-check](https://github.com/dubzzz/fast-check) with a minimum of 100 iterations each
- The `GET /api/appointments/status-counts` route **must** be registered before `/:id` in `appointmentRoutes.js` to avoid Express treating `status-counts` as an ID parameter
- Optimistic updates in `useStatusDashboard` must revert on API failure to satisfy Requirement 4.6
- The `deriveCumulativeCounts` formula is defined in the design and must not use a separate audit/history table
