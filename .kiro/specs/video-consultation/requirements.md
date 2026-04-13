# Requirements Document

## Introduction

This feature adds video consultation capability to the Biruh Tena clinical management system. Doctors and patients can conduct real-time peer-to-peer video/audio calls directly in the browser using WebRTC, with Socket.IO handling the signaling exchange. Each confirmed or scheduled appointment automatically has a unique video room (room ID = appointment ID). The feature also adds a "Consult with Specialist Doctors" promotional banner to the public landing page to drive patient engagement.

## Glossary

- **Video_Room**: A browser-based WebRTC session identified by a unique Room_ID where a Doctor and Patient conduct a video consultation.
- **Room_ID**: The UUID of the appointment, used as the unique identifier for a Video_Room.
- **Signaling_Server**: A Socket.IO server endpoint responsible for relaying WebRTC offer, answer, and ICE candidate messages between peers.
- **Peer_Connection**: A browser-native `RTCPeerConnection` instance that manages the WebRTC media stream between Doctor and Patient.
- **Local_Stream**: The media stream (video and/or audio) captured from the current user's camera and microphone via `getUserMedia`.
- **Remote_Stream**: The media stream received from the other participant over the Peer_Connection.
- **Participant**: Either the Doctor or the Patient assigned to a specific appointment.
- **VideoConsultation_Page**: The React page rendered at `/video/:roomId` that hosts the video call UI.
- **VideoConsultations_List**: The React page rendered at `/video-consultations` that shows a Doctor's upcoming video-eligible appointments.
- **Appointment**: A record in the appointment-service with statuses: `Pending`, `Confirmed`, `In Progress`, `Completed`, `Cancelled`.
- **Video_Eligible_Appointment**: An appointment whose status is `Confirmed` or `In Progress`.
- **Landing_Banner**: The promotional section on the public landing page advertising video consultation services.
- **ICE_Candidate**: A network endpoint candidate exchanged during WebRTC connection negotiation.
- **STUN_Server**: A public server used to discover the public IP/port of a peer for NAT traversal.
- **Connection_Status**: The current state of the Peer_Connection, one of: `idle`, `connecting`, `connected`, `disconnected`, `failed`.

---

## Requirements

### Requirement 1: Landing Page Video Consultation Banner

**User Story:** As a prospective patient visiting the Biruh Tena website, I want to see a prominent video consultation section on the landing page, so that I know I can consult with specialist doctors remotely.

#### Acceptance Criteria

1. THE Landing_Banner SHALL display the heading "Consult with Specialist Doctors" in a visually prominent style.
2. THE Landing_Banner SHALL display the text "More than 25 Specialty Fields" as a feature highlight.
3. THE Landing_Banner SHALL display a "24/7" availability badge.
4. THE Landing_Banner SHALL display a call-to-action button labeled "Book a Video Consultation" that navigates the user to the doctor listing page (`/doctors` or the booking flow).
5. THE Landing_Banner SHALL render with a light teal background consistent with the Biruh Tena brand palette.
6. THE Landing_Banner SHALL include a decorative doctor illustration or image on one side of the banner.
7. WHEN the viewport width is less than 768px, THE Landing_Banner SHALL stack its content vertically and hide the decorative image to maintain readability.

---

### Requirement 2: Video Room Access Control

**User Story:** As a system administrator, I want only the assigned Doctor and Patient of an appointment to be able to join its video room, so that patient privacy and consultation confidentiality are maintained.

#### Acceptance Criteria

1. WHEN a user navigates to `/video/:roomId`, THE VideoConsultation_Page SHALL verify that the authenticated user is either the `doctorId` or `patientId` of the appointment whose ID equals `roomId`.
2. IF the authenticated user is not a Participant of the appointment identified by `roomId`, THEN THE VideoConsultation_Page SHALL redirect the user to `/dashboard` and display an "Access Denied" error message.
3. IF the appointment identified by `roomId` does not exist, THEN THE VideoConsultation_Page SHALL redirect the user to `/dashboard` and display a "Consultation not found" error message.
4. IF the appointment status is not `Confirmed` or `In Progress`, THEN THE VideoConsultation_Page SHALL display a notice that the consultation is not yet available and prevent the call from starting.
5. WHEN a user accesses `/video/:roomId` without being authenticated, THE VideoConsultation_Page SHALL redirect the user to `/login`.

---

### Requirement 3: WebRTC Peer-to-Peer Video Call

**User Story:** As a Doctor or Patient, I want to have a real-time video and audio call with the other party, so that I can conduct or attend a remote consultation without installing any third-party software.

#### Acceptance Criteria

1. WHEN both Participants have joined the Video_Room, THE Peer_Connection SHALL establish a direct peer-to-peer media stream using the browser's native `RTCPeerConnection` API.
2. THE VideoConsultation_Page SHALL display the Remote_Stream as a full-screen video element occupying the primary viewport area.
3. THE VideoConsultation_Page SHALL display the Local_Stream as a small picture-in-picture video element positioned in the bottom-right corner of the viewport.
4. WHEN a Participant joins the Video_Room, THE VideoConsultation_Page SHALL request camera and microphone permissions via `getUserMedia` before initiating signaling.
5. IF the user denies camera or microphone permissions, THEN THE VideoConsultation_Page SHALL display a descriptive error message explaining that camera/microphone access is required and provide a retry option.
6. THE Peer_Connection SHALL use at least one public STUN server (e.g., `stun:stun.l.google.com:19302`) for ICE candidate gathering to support NAT traversal.
7. WHEN the Peer_Connection state changes, THE VideoConsultation_Page SHALL update the Connection_Status indicator accordingly.

---

### Requirement 4: Socket.IO Signaling

**User Story:** As a system, I need a signaling mechanism to exchange WebRTC session descriptions and ICE candidates between the Doctor and Patient, so that the Peer_Connection can be established without a pre-existing direct network path.

#### Acceptance Criteria

1. THE Signaling_Server SHALL accept Socket.IO connections from authenticated Participants only, validating the JWT token provided during the connection handshake.
2. WHEN a Participant joins a room, THE Signaling_Server SHALL place the socket into a Socket.IO room identified by the `roomId`.
3. WHEN the initiating Participant creates an SDP offer, THE Signaling_Server SHALL relay the offer to the other Participant in the same room.
4. WHEN the receiving Participant creates an SDP answer, THE Signaling_Server SHALL relay the answer to the initiating Participant.
5. WHEN a Participant discovers an ICE_Candidate, THE Signaling_Server SHALL relay the ICE_Candidate to the other Participant in the same room.
6. WHEN a Participant emits an `end-call` event, THE Signaling_Server SHALL broadcast the `call-ended` event to all sockets in the same room.
7. THE Signaling_Server SHALL support a maximum of 2 simultaneous socket connections per room; IF a third connection attempts to join, THEN THE Signaling_Server SHALL reject it with an "Room is full" error.
8. WHEN a Participant's socket disconnects unexpectedly, THE Signaling_Server SHALL emit a `peer-disconnected` event to the remaining Participant in the room.

---

### Requirement 5: Camera and Microphone Controls

**User Story:** As a Doctor or Patient in a video consultation, I want to control my camera and microphone during the call, so that I can manage my privacy and audio as needed.

#### Acceptance Criteria

1. THE VideoConsultation_Page SHALL display a mute/unmute microphone toggle button that is always visible during an active call.
2. WHEN the user activates the mute button, THE VideoConsultation_Page SHALL disable all audio tracks in the Local_Stream and update the button to reflect the muted state.
3. WHEN the user activates the unmute button, THE VideoConsultation_Page SHALL re-enable all audio tracks in the Local_Stream and update the button to reflect the active state.
4. THE VideoConsultation_Page SHALL display a camera on/off toggle button that is always visible during an active call.
5. WHEN the user activates the camera-off button, THE VideoConsultation_Page SHALL disable all video tracks in the Local_Stream and update the button to reflect the camera-off state.
6. WHEN the user activates the camera-on button, THE VideoConsultation_Page SHALL re-enable all video tracks in the Local_Stream and update the button to reflect the camera-on state.
7. THE VideoConsultation_Page SHALL display an "End Call" button that is always visible during an active call.
8. WHEN the user activates the "End Call" button, THE VideoConsultation_Page SHALL stop all Local_Stream tracks, close the Peer_Connection, emit an `end-call` event to the Signaling_Server, and navigate the user to `/appointments`.

---

### Requirement 6: Connection Status Indicator

**User Story:** As a Doctor or Patient in a video consultation, I want to see the current connection status of the call, so that I know whether the call is being established, is active, or has been interrupted.

#### Acceptance Criteria

1. THE VideoConsultation_Page SHALL display a Connection_Status indicator that is visible at all times during the session.
2. WHEN the VideoConsultation_Page first loads and begins signaling, THE Connection_Status indicator SHALL display "Connecting…".
3. WHEN the Peer_Connection `iceConnectionState` transitions to `connected` or `completed`, THE Connection_Status indicator SHALL display "Connected" with a green visual cue.
4. WHEN the Peer_Connection `iceConnectionState` transitions to `disconnected`, THE Connection_Status indicator SHALL display "Reconnecting…" with a yellow visual cue.
5. WHEN the Peer_Connection `iceConnectionState` transitions to `failed` or `closed`, THE Connection_Status indicator SHALL display "Disconnected" with a red visual cue.
6. WHEN the Signaling_Server emits a `peer-disconnected` event, THE VideoConsultation_Page SHALL display a "The other participant has left the call" notice and update the Connection_Status to "Disconnected".

---

### Requirement 7: In-Call Text Chat

**User Story:** As a Doctor or Patient in a video consultation, I want to send text messages during the call, so that I can share information (e.g., medication names, links) that is difficult to communicate verbally.

#### Acceptance Criteria

1. THE VideoConsultation_Page SHALL display a collapsible chat sidebar that can be toggled open or closed without interrupting the video stream.
2. WHEN the chat sidebar is open, THE VideoConsultation_Page SHALL display all messages exchanged during the current session in chronological order.
3. WHEN a Participant sends a message, THE Signaling_Server SHALL relay the message to the other Participant in the same room in under 500ms under normal network conditions.
4. WHEN a new message is received while the chat sidebar is closed, THE VideoConsultation_Page SHALL display an unread message badge on the chat toggle button.
5. THE VideoConsultation_Page SHALL display each message with the sender's name and the time the message was sent.
6. IF a message exceeds 1000 characters, THEN THE VideoConsultation_Page SHALL prevent submission and display a character limit warning.

---

### Requirement 8: "Join Video Call" Button on Appointment Cards

**User Story:** As a Doctor or Patient, I want a direct "Join Video Call" button on my appointment cards for eligible appointments, so that I can quickly enter the video room without manually navigating to a URL.

#### Acceptance Criteria

1. WHEN an appointment card is rendered and the appointment status is `Confirmed` or `In Progress`, THE Appointment_Card SHALL display a "Join Video Call" button.
2. WHEN the appointment status is `Pending`, `Completed`, or `Cancelled`, THE Appointment_Card SHALL NOT display the "Join Video Call" button.
3. WHEN the user activates the "Join Video Call" button, THE Appointment_Card SHALL navigate the user to `/video/:roomId` where `roomId` is the appointment's UUID.
4. THE "Join Video Call" button SHALL be visually distinct from other action buttons on the card (e.g., using a teal/green color with a video camera icon).

---

### Requirement 9: Doctor's Video Consultations List Page

**User Story:** As a Doctor, I want a dedicated page listing all my upcoming video-eligible appointments, so that I can quickly see and join my scheduled video consultations.

#### Acceptance Criteria

1. THE VideoConsultations_List SHALL be accessible at the route `/video-consultations` and restricted to users with the `Doctor` role.
2. THE VideoConsultations_List SHALL display all appointments belonging to the authenticated Doctor where the status is `Confirmed` or `In Progress`.
3. THE VideoConsultations_List SHALL display for each appointment: the patient's name, appointment date, appointment time, and a "Join Video Call" button.
4. THE VideoConsultations_List SHALL display appointments sorted in ascending order by `appointmentDate` and then `appointmentTime`.
5. IF the Doctor has no Video_Eligible_Appointments, THEN THE VideoConsultations_List SHALL display an empty-state message: "No upcoming video consultations."
6. WHEN the Doctor activates the "Join Video Call" button on a listed appointment, THE VideoConsultations_List SHALL navigate to `/video/:roomId`.

---

### Requirement 10: Doctor Sidebar Navigation Item

**User Story:** As a Doctor, I want a "Video Consultations" item in my sidebar navigation, so that I can access my video consultation list from anywhere in the application.

#### Acceptance Criteria

1. THE Sidebar SHALL display a "Video Consultations" navigation item with a video camera icon for users with the `Doctor` role.
2. WHEN the Doctor activates the "Video Consultations" navigation item, THE Sidebar SHALL navigate to `/video-consultations`.
3. THE Sidebar SHALL highlight the "Video Consultations" navigation item as active when the current route is `/video-consultations`.
4. WHEN the Sidebar is in collapsed mode, THE Sidebar SHALL display only the video camera icon for the "Video Consultations" item and show the label as a tooltip on hover.

---

### Requirement 11: Participant Identity Display

**User Story:** As a Doctor or Patient in a video consultation, I want to see the name of the other participant displayed on screen, so that I can confirm I am speaking with the correct person.

#### Acceptance Criteria

1. THE VideoConsultation_Page SHALL display the name of the remote Participant overlaid on or adjacent to the Remote_Stream video element.
2. THE VideoConsultation_Page SHALL display the authenticated user's own name overlaid on or adjacent to the Local_Stream video element.
3. WHEN the Remote_Stream has not yet connected, THE VideoConsultation_Page SHALL display the remote Participant's name alongside a waiting indicator (e.g., avatar with "Waiting for [Name]…").

---

### Requirement 12: Call End Handling

**User Story:** As a Doctor or Patient, I want the video session to cleanly terminate when either party ends the call, so that system resources are released and both users are returned to a sensible page.

#### Acceptance Criteria

1. WHEN the Signaling_Server emits a `call-ended` event to a Participant, THE VideoConsultation_Page SHALL stop all Local_Stream tracks, close the Peer_Connection, and navigate the user to `/appointments`.
2. WHEN the VideoConsultation_Page component unmounts for any reason, THE VideoConsultation_Page SHALL stop all Local_Stream tracks and close the Peer_Connection to release camera and microphone resources.
3. WHEN the browser tab or window is closed during an active call, THE Signaling_Server SHALL detect the socket disconnection and emit `peer-disconnected` to the remaining Participant within 5 seconds.
