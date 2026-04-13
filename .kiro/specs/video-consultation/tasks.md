# Implementation Plan: Video Consultation

## Overview

Implement browser-native peer-to-peer video consultation using WebRTC + Socket.IO signaling. The work spans the notification-service backend (signaling), frontend pages (VideoConsultationPage, VideoConsultationsList), landing page banner, sidebar nav, routing, and appointment card integration.

## Tasks

- [x] 1. Add Socket.IO signaling to notification-service
  - [x] 1.1 Upgrade `backend/notification-service/server.js` to use `http.createServer` and attach Socket.IO
    - Replace `app.listen(PORT, ...)` with `const httpServer = http.createServer(app)` and `httpServer.listen(PORT, ...)`
    - Install `socket.io` package in notification-service
    - Add JWT auth middleware on the `/video` Socket.IO namespace using the `authorization` handshake header
    - _Requirements: 4.1_

  - [x] 1.2 Implement room management and signaling event handlers on the `/video` namespace
    - Handle `join-room`: place socket in room, enforce 2-participant cap (emit `room-full` and return if room size ≥ 2), emit `peer-joined` to existing participant
    - Handle `offer`, `answer`, `ice-candidate`: relay payload to the other socket in the room (broadcast excluding sender)
    - Handle `end-call`: broadcast `call-ended` to all sockets in the room
    - Handle `chat-message`: relay `{ message, senderName, time }` to the other socket in the room
    - Handle `disconnect`: emit `peer-disconnected` to remaining participant in the room
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 1.3 Write property test for room capacity enforcement
    - **Property 5: Room Capacity Enforcement**
    - Simulate 0, 1, 2, and 3 join attempts on the same roomId; assert the 3rd attempt always receives `room-full` and is not added to the room
    - **Validates: Requirements 4.7**

  - [ ]* 1.4 Write property test for signaling relay fidelity
    - **Property 4: Signaling Relay Fidelity**
    - Generate random offer/answer/ICE payloads; assert the relay handler passes the exact payload to the other socket and does not echo back to sender
    - **Validates: Requirements 4.3, 4.4, 4.5**

- [x] 2. Add translation keys to all locale files
  - [x] 2.1 Add video consultation keys to `frontend/src/locales/en/translation.json`
    - Add keys: `sidebar.videoConsultations`, `videoConsult.banner.heading`, `videoConsult.banner.subtext`, `videoConsult.banner.badge`, `videoConsult.banner.cta`, `videoConsult.joinCall`, `videoConsult.noUpcoming`, `videoConsult.connecting`, `videoConsult.connected`, `videoConsult.reconnecting`, `videoConsult.disconnected`, `videoConsult.endCall`, `videoConsult.mute`, `videoConsult.unmute`, `videoConsult.cameraOff`, `videoConsult.cameraOn`, `videoConsult.chat`, `videoConsult.accessDenied`, `videoConsult.notFound`, `videoConsult.roomFull`, `videoConsult.waitingFor`, `videoConsult.charLimit`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.5, 10.1_

  - [x] 2.2 Mirror the same keys into `frontend/src/locales/am/translation.json` (Amharic)
    - Provide Amharic translations for all keys added in 2.1
    - _Requirements: 1.1, 9.5, 10.1_

  - [x] 2.3 Mirror the same keys into `frontend/src/locales/ti/translation.json` (Tigrinya)
    - Provide Tigrinya translations for all keys added in 2.1
    - _Requirements: 1.1, 9.5, 10.1_

  - [x] 2.4 Mirror the same keys into `frontend/src/locales/om/translation.json` (Oromo)
    - Provide Oromo translations for all keys added in 2.1
    - _Requirements: 1.1, 9.5, 10.1_

  - [x] 2.5 Mirror the same keys into `frontend/src/locales/so/translation.json` (Somali)
    - Provide Somali translations for all keys added in 2.1
    - _Requirements: 1.1, 9.5, 10.1_

- [x] 3. Create pure utility functions for video consultation logic
  - [x] 3.1 Create `frontend/src/pages/VideoConsultation/videoUtils.js` with pure helper functions
    - `isParticipant(appointment, userId)` — returns true iff userId equals doctorId or patientId
    - `isVideoEligible(status)` — returns true iff status is `"Confirmed"` or `"In Progress"`
    - `mapIceStateToStatus(iceState)` — maps RTCIceConnectionState to Connection_Status string
    - `sortAppointments(appointments)` — sorts by appointmentDate ASC then appointmentTime ASC
    - `validateMessageLength(message)` — returns true iff 0 < message.length ≤ 1000
    - _Requirements: 2.1, 2.4, 3.7, 6.2, 6.3, 6.4, 6.5, 7.6, 9.4_

  - [ ]* 3.2 Write property test for `isParticipant`
    - **Property 1: Participant Access Control**
    - Generate random UUIDs for doctorId, patientId, userId; assert `isParticipant` returns correct boolean for all combinations
    - **Validates: Requirements 2.1, 2.2**

  - [ ]* 3.3 Write property test for `isVideoEligible`
    - **Property 2: Video Eligibility by Status**
    - Generate random status strings including all enum values and arbitrary strings; assert `isVideoEligible` returns true only for `"Confirmed"` and `"In Progress"`
    - **Validates: Requirements 2.4, 8.1, 8.2**

  - [ ]* 3.4 Write property test for `mapIceStateToStatus`
    - **Property 3: ICE Connection State to Display Status Mapping**
    - Generate random iceConnectionState strings; assert `mapIceStateToStatus` returns a valid Connection_Status and maps known states correctly
    - **Validates: Requirements 3.7, 6.2, 6.3, 6.4, 6.5**

  - [ ]* 3.5 Write property test for `sortAppointments`
    - **Property 10: Appointment List Sort Order**
    - Generate random arrays of appointments with random dates and times; assert sorted output is in ascending date-then-time order
    - **Validates: Requirements 9.4**

  - [ ]* 3.6 Write property test for `validateMessageLength`
    - **Property 8: Message Length Validation**
    - Generate strings of random lengths 0–2000; assert validation allows ≤1000 and rejects >1000 and rejects empty
    - **Validates: Requirements 7.6**

- [x] 4. Create `useVideoCall` hook
  - [x] 4.1 Create `frontend/src/pages/VideoConsultation/useVideoCall.js`
    - Accept `(roomId, appointment)` params
    - Manage `localStream`, `remoteStream`, `peerConnection` (RTCPeerConnection with Google STUN servers), `connectionStatus`
    - Connect to Socket.IO `/video` namespace with JWT from localStorage
    - On `peer-joined`: call `getUserMedia`, create offer, emit `offer`
    - On `offer`: call `getUserMedia`, set remote description, create answer, emit `answer`
    - On `answer`: set remote description
    - On `ice-candidate`: add ICE candidate to peerConnection
    - On `peer-disconnected` / `call-ended`: update connectionStatus, stop streams
    - On `room-full`: set connectionStatus to `'room-full'`
    - Map `peerConnection.oniceconnectionstatechange` to connectionStatus using `mapIceStateToStatus`
    - Expose `toggleMute`, `toggleCamera`, `endCall`, `sendMessage`, `messages`, `unreadCount`, `isMuted`, `isCameraOff`, `isChatOpen`, `setIsChatOpen`
    - Clean up streams and peerConnection on unmount
    - _Requirements: 3.1, 3.4, 3.6, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8, 5.2, 5.3, 5.5, 5.6, 5.8, 6.2, 6.3, 6.4, 6.5, 6.6, 7.3, 12.1, 12.2_

  - [ ]* 4.2 Write property test for media track toggle invariant
    - **Property 6: Media Track Toggle Invariant**
    - Generate mock MediaStream objects with random numbers of audio/video tracks; assert `toggleMute`/`toggleCamera` set `enabled` correctly on all tracks
    - **Validates: Requirements 5.2, 5.3, 5.5, 5.6**

  - [ ]* 4.3 Write property test for message chronological ordering
    - **Property 7: Message Chronological Ordering**
    - Generate random arrays of ChatMessage objects with random timestamps; assert the messages state is in strictly ascending chronological order
    - **Validates: Requirements 7.2**

- [ ] 5. Checkpoint — Ensure utility functions and hook are correct
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Create `VideoConsultationPage`
  - [x] 6.1 Create `frontend/src/pages/VideoConsultation/VideoConsultationPage.jsx`
    - Fetch appointment by `roomId` from appointment-service on mount; verify user is a participant using `isParticipant` and `isVideoEligible`
    - Redirect to `/dashboard` with error message if access denied, not found, or not eligible (Requirements 2.2, 2.3, 2.4)
    - Redirect to `/login` if unauthenticated (Requirement 2.5)
    - Use `useVideoCall(roomId, appointment)` hook for all WebRTC/signaling logic
    - Render remote video full-screen, local video as PiP in bottom-right corner
    - Overlay remote participant name on remote video; overlay own name on local video (Requirements 11.1, 11.2)
    - Show "Waiting for [Name]…" with avatar when remote stream not yet connected (Requirement 11.3)
    - Render Connection_Status indicator (idle/connecting/connected/reconnecting/disconnected) with color cues (Requirements 6.1–6.6)
    - Render always-visible controls: mute toggle, camera toggle, end-call button (Requirements 5.1, 5.4, 5.7, 5.8)
    - Render collapsible chat sidebar with message list, input, send button, and unread badge (Requirements 7.1–7.6)
    - Show camera/mic permission error card with retry button on `getUserMedia` failure (Requirement 3.5)
    - Show "room full" message when signaling server rejects join (Requirement 4.7 error handling)
    - Show "peer disconnected" banner when `peer-disconnected` received (Requirement 6.6)
    - Stop all streams and close peerConnection on unmount (Requirement 12.2)
    - Page renders outside DashboardLayout (full-screen, no sidebar)
    - _Requirements: 2.1–2.5, 3.1–3.7, 5.1–5.8, 6.1–6.6, 7.1–7.6, 11.1–11.3, 12.1–12.2_

  - [ ]* 6.2 Write property test for message rendering completeness
    - **Property 9: Message Rendering Completeness**
    - Generate random `{ senderName, message, time }` objects; assert the rendered chat message component includes senderName and formatted time in its output
    - **Validates: Requirements 7.5, 11.1, 11.2**

- [x] 7. Create `VideoConsultationsList` page
  - [x] 7.1 Create `frontend/src/pages/VideoConsultation/VideoConsultationsList.jsx`
    - Fetch doctor's appointments via `appointmentService.getMyAppointments()`
    - Filter to `isVideoEligible` appointments (status `Confirmed` or `In Progress`)
    - Sort using `sortAppointments` (date ASC, time ASC)
    - Render a card per appointment: patient name, date, time, "Join Video Call" button navigating to `/video/:id`
    - Show empty state "No upcoming video consultations." when list is empty
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [x] 8. Add `VideoConsultBanner` to `LandingPage.jsx`
  - [x] 8.1 Create the `VideoConsultBanner` section component inline or as a local component in `LandingPage.jsx`
    - Render heading "Consult with Specialist Doctors", subtext "More than 25 Specialty Fields", "24/7" badge
    - Render "Book a Video Consultation" CTA button navigating to `/doctors`
    - Light teal background consistent with brand palette
    - Include decorative doctor illustration/image on one side
    - On viewport < 768px: stack content vertically and hide decorative image
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 8.2 Insert `VideoConsultBanner` into `LandingPage.jsx` between the `HowItWorks` section and the `Testimonials` section
    - _Requirements: 1.1_

- [x] 9. Update `Sidebar.jsx` to add Video Consultations nav item for Doctor role
  - Import `Video` from `lucide-react` in `frontend/src/components/layout/Sidebar.jsx`
  - Add `{ to: '/video-consultations', icon: Video, labelKey: 'sidebar.videoConsultations' }` to the `Doctor` array in `NAV_BY_ROLE`
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 10. Update `App.jsx` to add video consultation routes
  - Import `VideoConsultationPage` and `VideoConsultationsList` in `frontend/src/App.jsx`
  - Add `/video/:roomId` route outside `DashboardLayout` (inside its own `ProtectedRoute` wrapper) so the page renders full-screen
  - Add `/video-consultations` route inside the `DashboardLayout` block, wrapped in `<RoleGuard allowedRoles={['Doctor']}>`
  - _Requirements: 2.5, 9.1_

- [x] 11. Add "Join Video Call" button to `AppointmentListPage`
  - Import `Video` from `lucide-react` and `useNavigate` (already available) in `frontend/src/pages/Appointment/AppointmentListPage.jsx`
  - Inside the appointment card's info block, conditionally render a "Join Video Call" `Button` when `apt.status === 'Confirmed' || apt.status === 'In Progress'`
  - Button uses teal/green color with a `Video` icon and calls `navigate(\`/video/\${apt.id}\`)`
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Property tests use **fast-check** with a minimum of 100 iterations each
- Tag format for property tests: `// Feature: video-consultation, Property N: <property text>`
- `VideoConsultationPage` renders outside `DashboardLayout` to allow full-screen video
- Chat messages are in-memory only — not persisted to any database
- Room ID equals the appointment UUID — no new data model required
