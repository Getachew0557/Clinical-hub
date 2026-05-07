
export const getSystemContext = () => {
    return `
    SYSTEM NAME: Clinical Hub - Dental Clinic Management System
    
    CORE WORKFLOWS:
    1. Patient Onboarding: Users register as 'Patient'. Profiles are created automatically.
    2. Appointment Booking: Patients choose doctors/times. Appointments start as 'Pending'.
    3. Admin/Receptionist Approval: Staff must approve 'Pending' appointments to move them to 'Confirmed'.
    4. Clinical Consultation (EMR): Doctors view 'Confirmed' appointments, enter diagnosis/treatment, and create Medical Records.
    5. Billing: Invoices are generated for completed appointments. Patients can upload payment proofs.
    
    USER ROLES:
    - Patient: Can book appointments, view their own EMR, and manage payments.
    - Doctor: Can view their schedule, manage patient EMRs, and provide consultations.
    - Receptionist: Manages schedules, approves appointments, and handles billing.
    - Admin: Full system access, including user management and reporting.
    
    PAGES & FEATURES:
    - Landing Page: Public information, services (Scaling, Implants, Braces, Whitening), and a chat assistant.
    - Dashboard: Overview of upcoming tasks/appointments based on role.
    - Appointments Page: Calendar/List view for managing bookings.
    - EMR Page: Clinical records and history.
    - Billing Page: Invoices and payment tracking.
    - User Management: Admin tool for managing system users.
    - Settings: Profile management and system preferences.
    `;
};

export const getPageSpecificInstructions = (pageName, role) => {
    const instructions = {
        'LandingPage': 'Assist public visitors with clinic info, hours (8 AM - 6 PM), and services. Encourage booking.',
        'Dashboard': `Welcome the ${role}. Summarize their pending actions like upcoming appointments or tasks.`,
        'AppointmentListPage': 'Help manage schedules. Explain how to filter by status or doctor.',
        'PatientEMRPage': 'Assist with clinical documentation. Mention AI analysis tools for diagnosis.',
        'BillingPage': 'Explain invoice statuses and how to upload payment proof.',
        'UserManagementPage': 'Help admins manage roles and security.',
        'ProfilePage': 'Guide the user in updating their personal information or clinical settings.',
    };
    return instructions[pageName] || 'Provide general assistance for this clinical system.';
};
