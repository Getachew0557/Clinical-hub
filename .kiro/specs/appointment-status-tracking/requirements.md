# Requirements Document

## Introduction

This feature adds appointment status tracking dashboards and video consultation status tracking to the Biruh Tena clinical management system. Each role sees a status-grouped view of their appointments with individual appointment cards showing their current status badge. **Doctors** see only the statuses relevant to their clinical responsibilities — **In Progress**, **Completed**, and **Cancelled** — while **Admin and Receptionist** users see the full lifecycle across all five statuses: **Pending**, **Confirmed**, **In Progress**, **Completed**, and **Cancelled**. When an appointment transitions to a new status, it automatically moves to the correct bucket or is removed if the new status falls outside the role's visible set. The same role-scoped visibility pattern is applied to video consultations.

## Glossary

- **Status_Dashboard**: The UI section that groups and counts appointments by status category for a given role.
- **Status_Bucket**: A visual grouping within the Status_Dashboard that displays appointments sharing the same status (e.g., the "Confirmed" bucket).
- **Status_Badge**: A small inline label on an appointment card showing the appointment's current status (e.g., "Confirmed", "In Progress", "Completed").
- **Appointment_Card**: A UI card component representing a single appointment, displaying patient/doctor name, date, time, reason, and Status_Badge.
- **Video_Appointment_Card**: An Appointment_Card for an appointment of type `video`, additionally showing a "Join Video Call" button when eligible.
- **Status_Counter**: The numeric count displayed in the header of each Status_Bucket. Each bucket header shows two counts: the **Live_Count** (appointments currently at that status) and the **Cumulative_Count** (appointments that have ever reached that status).
- **Live_Count**: The number of appointments whose current `status` equals the bucket's status label at the time of the query.
- **Cumulative_Count**: The total number of appointments that have ever passed through or currently hold a given status, used for reporting purposes. Derived without a separate audit table by summing the live counts of that status and all statuses that follow it in the lifecycle order.
- **Appointment_Service**: The `appointment-service` Node.js microservice that manages appointment records.
- **Status_Filter_API**: The `GET /api/appointments` and `GET /api/appointments/my` endpoints, extended to support filtering by status and type.
- **Doctor**: A user with the `Doctor` role in the Biruh Tena system.
- **Admin**: A user with the `Admin` role in the Biruh Tena system.
- **Receptionist**: A user with the `Receptionist` role in the Biruh Tena system.
- **Staff_Role**: Any authenticated user whose role is Doctor, Admin, or Receptionist.
- **Appointment_Status**: One of the five values defined in the Appointment model: `Pending`, `Confirmed`, `In Progress`, `Completed`, `Cancelled`.
- **Doctor_Tracked_Status**: The three statuses surfaced in the Doctor's Status_Dashboard: `In Progress`, `Completed`, `Cancelled`.
- **Admin_Tracked_Status**: The five statuses surfaced in the Admin/Receptionist Status_Dashboard: `Pending`, `Confirmed`, `In Progress`, `Completed`, `Cancelled`.
- **Video_Consultation_Status_Dashboard**: A Status_Dashboard scoped to appointments of type `video`.
- **Real_Time_Update**: An automatic UI refresh that reflects a status change without requiring a full page reload.

---

## Requirements

### Requirement 1: Appointment Status Dashboard — Role-Scoped Status Buckets

**User Story:** As a Doctor, Admin, or Receptionist, I want to see my appointments grouped by status with a count for each group, so that I can quickly understand the current workload relevant to my responsibilities at a glance.

#### Acceptance Criteria

1. WHEN the authenticated user's role is Doctor, THE Status_Dashboard SHALL display three Status_Buckets labeled "In Progress", "Completed", and "Cancelled".
2. WHEN the authenticated user's role is Admin or Receptionist, THE Status_Dashboard SHALL display five Status_Buckets labeled "Pending", "Confirmed", "In Progress", "Completed", and "Cancelled".
3. THE Status_Counter in each Status_Bucket header SHALL display both the Live_Count (appointments currently at that status) and the Cumulative_Count (appointments that have ever reached that status) for the authenticated user's scope.
3a. THE Live_Count SHALL reflect only appointments whose current `status` equals the bucket's label.
3b. THE Cumulative_Count SHALL reflect all appointments that have ever passed through that status, regardless of their current status.
4. WHEN the authenticated user's role is Doctor, THE Status_Dashboard SHALL count only appointments where `doctorId` equals the authenticated user's ID.
5. WHEN the authenticated user's role is Admin or Receptionist, THE Status_Dashboard SHALL count all appointments in the system regardless of doctor or patient assignment.
6. THE Status_Dashboard SHALL load and display appointment data within 3 seconds of the page rendering under normal network conditions.
7. IF no appointments exist in a Status_Bucket, THEN THE Status_Dashboard SHALL display a "No appointments" empty-state message inside that bucket.

---

### Requirement 2: Appointment Cards with Status Badges

**User Story:** As a Staff_Role user, I want each appointment card inside a status bucket to display a visible status badge, so that I can confirm the appointment's status at a glance without opening it.

#### Acceptance Criteria

1. THE Appointment_Card SHALL display a Status_Badge showing the appointment's current Appointment_Status.
2. THE Status_Badge for "Pending" SHALL render with a gray color scheme.
3. THE Status_Badge for "Confirmed" SHALL render with a blue color scheme.
4. THE Status_Badge for "In Progress" SHALL render with an amber/yellow color scheme.
5. THE Status_Badge for "Completed" SHALL render with a green color scheme.
6. THE Status_Badge for "Cancelled" SHALL render with a red color scheme.
7. THE Appointment_Card SHALL display the patient's full name, appointment date, appointment time, and reason.
8. WHEN the authenticated user is a Doctor, THE Appointment_Card SHALL display the patient's full name.
9. WHEN the authenticated user is Admin or Receptionist, THE Appointment_Card SHALL display both the patient's full name and the assigned doctor's name.

---

### Requirement 3: Appointment Status Transitions Move Cards Between Buckets

**User Story:** As a Staff_Role user, I want an appointment card to automatically move to the correct status bucket when its status is updated, so that the dashboard always reflects the current state without requiring a manual refresh.

#### Acceptance Criteria

1. WHEN an appointment's status is updated to `Pending`, THE Status_Dashboard SHALL move the Appointment_Card to the "Pending" Status_Bucket for Admin and Receptionist roles.
2. WHEN an appointment's status is updated to `Confirmed`, THE Status_Dashboard SHALL move the Appointment_Card to the "Confirmed" Status_Bucket for Admin and Receptionist roles, and SHALL remove the Appointment_Card from the Doctor's Status_Dashboard (as "Confirmed" is not a Doctor_Tracked_Status).
3. WHEN an appointment's status is updated to `In Progress`, THE Status_Dashboard SHALL move the Appointment_Card to the "In Progress" Status_Bucket for all Staff_Role users.
4. WHEN an appointment's status is updated to `Completed`, THE Status_Dashboard SHALL move the Appointment_Card to the "Completed" Status_Bucket for all Staff_Role users.
5. WHEN an appointment's status is updated to `Cancelled`, THE Status_Dashboard SHALL move the Appointment_Card to the "Cancelled" Status_Bucket for Admin and Receptionist roles, and SHALL move the Appointment_Card to the "Cancelled" Status_Bucket for Doctor roles.
6. THE Status_Counter in each affected Status_Bucket SHALL update both the Live_Count and the Cumulative_Count immediately after a status transition without requiring a full page reload.
7. WHEN an appointment transitions from status A to status B, THE Status_Dashboard SHALL decrement the Live_Count of bucket A and increment the Live_Count of bucket B, while the Cumulative_Count of bucket A SHALL remain unchanged.

---

### Requirement 4: Status Update Actions on Appointment Cards

**User Story:** As a Doctor, Admin, or Receptionist, I want to update an appointment's status directly from its card, so that I do not need to navigate to a separate detail page for routine status changes.

#### Acceptance Criteria

1. WHEN the authenticated user's role is Doctor and the appointment's current status is `Confirmed`, THE Appointment_Card SHALL display a status-change action to mark the appointment as "In Progress".
2. WHEN the authenticated user's role is Doctor and the appointment's current status is `In Progress`, THE Appointment_Card SHALL display a status-change action to mark the appointment as "Completed".
3. WHEN the authenticated user's role is Doctor, THE Appointment_Card SHALL NOT display status-change actions for `Pending` or `Confirmed` transitions, as those are managed by Admin and Receptionist roles.
4. WHEN the authenticated user's role is Admin or Receptionist, THE Appointment_Card SHALL display status-change actions for all valid transitions: Pending → Confirmed, Confirmed → In Progress, In Progress → Completed, and any status → Cancelled.
5. WHEN a status-change action is activated, THE Appointment_Card SHALL call `PATCH /api/appointments/:id/status` with the new status value.
6. IF the status update API call fails, THEN THE Appointment_Card SHALL display an inline error message and retain the appointment in its current Status_Bucket.

---

### Requirement 5: Backend Status Count API

**User Story:** As a frontend developer, I want a dedicated API endpoint that returns appointment counts grouped by status, so that the Status_Dashboard can efficiently load summary data without fetching all appointment records.

#### Acceptance Criteria

1. THE Appointment_Service SHALL expose a `GET /api/appointments/status-counts` endpoint that returns the count of appointments for each Appointment_Status value.
2. WHEN the authenticated user's role is Doctor, THE Status_Filter_API SHALL return counts scoped to appointments where `doctorId` equals the authenticated user's ID.
3. WHEN the authenticated user's role is Admin or Receptionist, THE Status_Filter_API SHALL return counts for all appointments in the system.
4. THE `GET /api/appointments/status-counts` endpoint SHALL accept an optional `type` query parameter (`clinic` or `video`) to filter counts by appointment type.
5. THE `GET /api/appointments/status-counts` response SHALL include both a `live` count and a `cumulative` count for each of the five Appointment_Status values: `Pending`, `Confirmed`, `In Progress`, `Completed`, `Cancelled`.
6. THE `GET /api/appointments/status-counts` endpoint SHALL require a valid JWT token and SHALL return HTTP 401 for unauthenticated requests.

---

### Requirement 6: Video Consultation Status Dashboard

**User Story:** As a Doctor, Admin, or Receptionist, I want to see my video consultation appointments grouped by status with counts, so that I can manage video consultations separately from in-person clinic appointments.

#### Acceptance Criteria

1. WHEN the authenticated user's role is Doctor, THE Video_Consultation_Status_Dashboard SHALL display three Status_Buckets labeled "In Progress", "Completed", and "Cancelled", scoped exclusively to appointments where `type` equals `video`.
2. WHEN the authenticated user's role is Admin or Receptionist, THE Video_Consultation_Status_Dashboard SHALL display five Status_Buckets labeled "Pending", "Confirmed", "In Progress", "Completed", and "Cancelled", scoped exclusively to appointments where `type` equals `video`.
3. THE Status_Counter in each Video_Consultation_Status_Dashboard bucket SHALL reflect only video-type appointments.
4. WHEN the authenticated user's role is Doctor, THE Video_Consultation_Status_Dashboard SHALL count only video appointments where `doctorId` equals the authenticated user's ID.
5. WHEN the authenticated user's role is Admin or Receptionist, THE Video_Consultation_Status_Dashboard SHALL count all video appointments in the system.
6. THE Video_Consultation_Status_Dashboard SHALL be accessible from the existing `/video-consultations` route for Doctors and from the appointments management page for Admin and Receptionist roles.
7. IF no video appointments exist in a Status_Bucket, THEN THE Video_Consultation_Status_Dashboard SHALL display a "No video consultations" empty-state message inside that bucket.

---

### Requirement 7: Video Appointment Cards with Join Button

**User Story:** As a Doctor, I want video appointment cards in the status dashboard to show a "Join Video Call" button when the appointment is eligible, so that I can enter the video room directly from the status view.

#### Acceptance Criteria

1. WHEN a Video_Appointment_Card is rendered and the appointment status is `Confirmed` or `In Progress`, THE Video_Appointment_Card SHALL display a "Join Video Call" button.
2. WHEN the appointment status is `Completed` or `Cancelled`, THE Video_Appointment_Card SHALL NOT display the "Join Video Call" button.
3. WHEN the user activates the "Join Video Call" button, THE Video_Appointment_Card SHALL navigate to `/video/:roomId` where `roomId` is the appointment's UUID.
4. THE Video_Appointment_Card SHALL display a video camera icon to visually distinguish it from clinic Appointment_Cards.

---

### Requirement 8: Real-Time Status Refresh

**User Story:** As a Staff_Role user, I want the status dashboard to reflect the latest appointment statuses without requiring a manual page refresh, so that I always see an accurate picture of the current workload.

#### Acceptance Criteria

1. THE Status_Dashboard SHALL poll `GET /api/appointments/status-counts` at a configurable interval of no more than 30 seconds to detect external status changes.
2. WHEN a status change is detected via polling, THE Status_Dashboard SHALL update the affected Status_Buckets and Status_Counters without a full page reload.
3. WHEN the user performs a status update action directly on a card, THE Status_Dashboard SHALL update immediately without waiting for the next polling cycle.
4. WHILE a polling request is in flight, THE Status_Dashboard SHALL NOT display a loading spinner that obscures existing appointment cards.

---

### Requirement 9: Role-Based Dashboard Navigation

**User Story:** As a Staff_Role user, I want the appointment status dashboard accessible from my sidebar navigation, so that I can reach it from anywhere in the application.

#### Acceptance Criteria

1. THE Sidebar SHALL display an "Appointments" navigation item for Doctor, Admin, and Receptionist roles that navigates to the Status_Dashboard view.
2. WHEN the current route matches the Status_Dashboard route, THE Sidebar SHALL highlight the "Appointments" navigation item as active.
3. THE Sidebar SHALL display a "Video Consultations" navigation item for the Doctor role that navigates to the Video_Consultation_Status_Dashboard.
4. WHEN the Sidebar is in collapsed mode, THE Sidebar SHALL display only the icon for each navigation item and show the label as a tooltip on hover.

---

### Requirement 10: Filtering and Sorting Within Status Buckets

**User Story:** As an Admin or Receptionist, I want to filter and sort appointments within each status bucket, so that I can find specific appointments quickly when the list is long.

#### Acceptance Criteria

1. THE Status_Bucket SHALL display a date filter input that, when set, shows only appointments on the selected date within that bucket.
2. THE Status_Bucket SHALL display appointments sorted in ascending order by `appointmentDate` and then `appointmentTime` by default.
3. WHEN a date filter is applied, THE Status_Counter SHALL update to reflect the filtered count.
4. WHEN the date filter is cleared, THE Status_Bucket SHALL revert to showing all appointments in that status.

---

### Requirement 11: Cumulative Status Counts for Reporting

**User Story:** As an Admin or Receptionist, I want each status bucket header to show how many appointments have ever reached that status (in addition to the current live count), so that I can use the dashboard for reporting without needing a separate report view.

#### Acceptance Criteria

1. THE Status_Bucket header SHALL display two distinct numeric values: the Live_Count and the Cumulative_Count, visually differentiated (e.g., labeled "Now" and "Total" or equivalent).
2. THE Cumulative_Count for `Pending` SHALL equal the total number of appointments ever created in the system (or within the authenticated user's scope), since all appointments begin as Pending.
3. THE Cumulative_Count for `Confirmed` SHALL equal the count of appointments currently at `Confirmed` plus those at `In Progress` plus those at `Completed`.
4. THE Cumulative_Count for `In Progress` SHALL equal the count of appointments currently at `In Progress` plus those at `Completed`.
5. THE Cumulative_Count for `Completed` SHALL equal the count of appointments currently at `Completed` only.
6. THE Cumulative_Count for `Cancelled` SHALL equal the count of appointments currently at `Cancelled` only.
7. WHEN the authenticated user's role is Doctor, THE Cumulative_Count SHALL be scoped to appointments where `doctorId` equals the authenticated user's ID.
8. WHEN the authenticated user's role is Admin or Receptionist, THE Cumulative_Count SHALL be scoped to all appointments in the system.
9. THE `GET /api/appointments/status-counts` endpoint SHALL return both `live` and `cumulative` counts per status so that the frontend can display both values from a single API call.
10. WHEN an optional `type` query parameter is provided, THE Cumulative_Count values SHALL be scoped to appointments of that type only.
