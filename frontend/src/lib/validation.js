import { z } from 'zod';

// ── Common Validation Schemas ─────────────────────────────────────────────────────

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const phoneSchema = z
  .string()
  .regex(/^\+251[0-9]{9}$/, 'Phone number must be in format: +251XXXXXXXXX');

export const nameSchema = z
  .string()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export const ethiopianPhoneSchema = z
  .string()
  .regex(/^(\+251|0)?[9][0-9]{8}$/, 'Invalid Ethiopian phone number');

// ── Auth Schemas ───────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: ethiopianPhoneSchema.optional(),
  role: z.enum(['Patient', 'Doctor', 'Receptionist', 'Admin']),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema,
});

// ── Patient Schemas ───────────────────────────────────────────────────────────────

export const patientSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: ethiopianPhoneSchema,
  dateOfBirth: z
    .string()
    .refine((date) => {
      const dob = new Date(date);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      return age >= 0 && age <= 120;
    }, 'Invalid date of birth'),
  gender: z.enum(['Male', 'Female', 'Other']),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  emergencyContact: z.object({
    name: nameSchema,
    phone: ethiopianPhoneSchema,
    relationship: z.string().min(1, 'Relationship is required'),
  }),
});

export const updatePatientSchema = patientSchema.partial();

// ── Doctor Schemas ────────────────────────────────────────────────────────────────

export const doctorSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  phone: ethiopianPhoneSchema,
  specialization: z.string().min(2, 'Specialization is required'),
  licenseNumber: z.string().min(5, 'License number is required'),
  experience: z
    .number()
    .min(0, 'Experience cannot be negative')
    .max(50, 'Experience cannot exceed 50 years'),
  qualification: z.string().min(2, 'Qualification is required'),
  bio: z.string().max(500, 'Bio must not exceed 500 characters').optional(),
  consultationFee: z.number().min(0, 'Fee cannot be negative'),
  clinicFee: z.number().min(0, 'Fee cannot be negative').optional(),
  videoFee: z.number().min(0, 'Fee cannot be negative').optional(),
  serviceTypes: z.array(z.enum(['clinic', 'video'])).min(1, 'At least one service type is required'),
  workingDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])),
  workingHoursStart: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  workingHoursEnd: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  languages: z.string().min(1, 'Languages are required'),
});

export const updateDoctorSchema = doctorSchema.partial();

// ── Appointment Schemas ─────────────────────────────────────────────────────────────

export const appointmentSchema = z.object({
  doctorId: z.string().min(1, 'Doctor is required'),
  patientId: z.string().min(1, 'Patient is required'),
  appointmentDate: z
    .string()
    .refine((date) => new Date(date) >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: 'Appointment date cannot be in the past',
    }),
  appointmentTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:MM)'),
  type: z.enum(['clinic', 'video']),
  reason: z.string().min(5, 'Reason must be at least 5 characters'),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
});

export const updateAppointmentSchema = appointmentSchema.partial();

// ── Inventory Schemas ───────────────────────────────────────────────────────────────

export const inventoryItemSchema = z.object({
  name: z.string().min(2, 'Item name is required'),
  category: z.string().min(2, 'Category is required'),
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  reorderLevel: z.number().min(0, 'Reorder level cannot be negative'),
  pricePerUnit: z.number().min(0, 'Price cannot be negative').optional(),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
});

export const updateStockSchema = z.object({
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  operation: z.enum(['add', 'remove', 'set']),
  reason: z.string().min(5, 'Reason is required'),
});

// ── Billing Schemas ────────────────────────────────────────────────────────────────

export const invoiceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  description: z.string().min(5, 'Description is required'),
  dueDate: z
    .string()
    .refine((date) => new Date(date) >= new Date(), {
      message: 'Due date cannot be in the past',
    }),
  items: z.array(
    z.object({
      description: z.string().min(1, 'Item description is required'),
      amount: z.number().min(0, 'Amount cannot be negative'),
    })
  ).min(1, 'At least one item is required'),
});

export const paymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.number().min(0, 'Amount cannot be negative'),
  method: z.enum(['Cash', 'Card', 'Bank Transfer', 'Mobile Money']),
  transactionId: z.string().optional(),
  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),
});

// ── Hospital Schemas ────────────────────────────────────────────────────────────────

export const hospitalSchema = z.object({
  name: z.string().min(2, 'Hospital name is required'),
  address: z.string().min(5, 'Address is required'),
  phone: ethiopianPhoneSchema,
  email: emailSchema.optional(),
  description: z.string().max(500, 'Description must not exceed 500 characters').optional(),
});

// ── EMR Schemas ────────────────────────────────────────────────────────────────────

export const emrRecordSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  doctorId: z.string().min(1, 'Doctor is required'),
  appointmentId: z.string().min(1, 'Appointment is required'),
  chiefComplaint: z.string().min(5, 'Chief complaint is required'),
  historyOfPresentIllness: z.string().min(10, 'History is required'),
  physicalExamination: z.string().min(10, 'Physical examination is required'),
  diagnosis: z.string().min(2, 'Diagnosis is required'),
  treatment: z.string().min(5, 'Treatment is required'),
  medications: z.array(
    z.object({
      name: z.string().min(1, 'Medication name is required'),
      dosage: z.string().min(1, 'Dosage is required'),
      frequency: z.string().min(1, 'Frequency is required'),
    })
  ).optional(),
  notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),
});

// ── User Management Schemas ────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(['Patient', 'Doctor', 'Receptionist', 'Admin']),
  phone: ethiopianPhoneSchema.optional(),
});

export const updateUserSchema = createUserSchema.partial();

export const resetUserPasswordSchema = z.object({
  newPassword: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ── Export all schemas ─────────────────────────────────────────────────────────────

export default {
  passwordSchema,
  emailSchema,
  phoneSchema,
  nameSchema,
  ethiopianPhoneSchema,
  loginSchema,
  registerSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  patientSchema,
  updatePatientSchema,
  doctorSchema,
  updateDoctorSchema,
  appointmentSchema,
  updateAppointmentSchema,
  inventoryItemSchema,
  updateStockSchema,
  invoiceSchema,
  paymentSchema,
  hospitalSchema,
  emrRecordSchema,
  createUserSchema,
  updateUserSchema,
  resetUserPasswordSchema,
};
