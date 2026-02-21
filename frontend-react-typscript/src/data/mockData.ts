export interface Patient {
  id: string;
  name: string;
  phone: string;
  email: string;
  gender: "Male" | "Female";
  age: number;
  address: string;
  allergies: string[];
  medicalHistory: string;
  registeredDate: string;
  lastVisit: string;
  status: "Active" | "Inactive";
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  email: string;
  phone: string;
  avatar?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  reason: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "In Progress";
  type: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  items: { treatment: string; cost: number; quantity: number }[];
  total: number;
  paymentType: "Cash" | "Card" | "Insurance" | "Mobile";
  status: "Paid" | "Pending" | "Overdue";
  date: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unitPrice: number;
  supplier: string;
  expiryDate: string;
  status: "In Stock" | "Low Stock" | "Out of Stock";
}

export const patients: Patient[] = [
  {
    id: "P001",
    name: "John Anderson",
    phone: "+1 555-0101",
    email: "john.anderson@email.com",
    gender: "Male",
    age: 35,
    address: "123 Main St, Springfield",
    allergies: ["Penicillin"],
    medicalHistory: "Root canal (2023), Teeth whitening (2024)",
    registeredDate: "2023-06-15",
    lastVisit: "2026-02-10",
    status: "Active",
  },
  {
    id: "P002",
    name: "Emily Roberts",
    phone: "+1 555-0102",
    email: "emily.roberts@email.com",
    gender: "Female",
    age: 28,
    address: "456 Oak Ave, Springfield",
    allergies: [],
    medicalHistory: "Cleaning (2024), Filling (2025)",
    registeredDate: "2024-01-20",
    lastVisit: "2026-02-15",
    status: "Active",
  },
  {
    id: "P003",
    name: "Michael Chen",
    phone: "+1 555-0103",
    email: "michael.chen@email.com",
    gender: "Male",
    age: 42,
    address: "789 Pine Rd, Shelbyville",
    allergies: ["Latex", "Lidocaine"],
    medicalHistory: "Crown placement (2024), Extraction (2025)",
    registeredDate: "2024-03-10",
    lastVisit: "2026-01-28",
    status: "Active",
  },
  {
    id: "P004",
    name: "Sarah Williams",
    phone: "+1 555-0104",
    email: "sarah.williams@email.com",
    gender: "Female",
    age: 31,
    address: "321 Elm Blvd, Capital City",
    allergies: ["Aspirin"],
    medicalHistory: "Braces (2023-2025), Retainer fitting (2025)",
    registeredDate: "2023-01-05",
    lastVisit: "2026-02-18",
    status: "Active",
  },
  {
    id: "P005",
    name: "David Kim",
    phone: "+1 555-0105",
    email: "david.kim@email.com",
    gender: "Male",
    age: 55,
    address: "654 Birch Ln, Ogdenville",
    allergies: [],
    medicalHistory: "Implant (2024), Periodontal treatment (2025)",
    registeredDate: "2024-06-22",
    lastVisit: "2026-02-05",
    status: "Active",
  },
  {
    id: "P006",
    name: "Lisa Thompson",
    phone: "+1 555-0106",
    email: "lisa.thompson@email.com",
    gender: "Female",
    age: 22,
    address: "987 Cedar Dr, North Haverbrook",
    allergies: [],
    medicalHistory: "Wisdom teeth removal (2025)",
    registeredDate: "2025-01-12",
    lastVisit: "2025-11-20",
    status: "Inactive",
  },
  {
    id: "P007",
    name: "Robert Martinez",
    phone: "+1 555-0107",
    email: "robert.martinez@email.com",
    gender: "Male",
    age: 48,
    address: "147 Maple St, Springfield",
    allergies: ["Codeine"],
    medicalHistory: "Dentures (2024), Adjustment (2025)",
    registeredDate: "2024-08-30",
    lastVisit: "2026-02-12",
    status: "Active",
  },
  {
    id: "P008",
    name: "Jennifer Lee",
    phone: "+1 555-0108",
    email: "jennifer.lee@email.com",
    gender: "Female",
    age: 37,
    address: "258 Walnut Ave, Shelbyville",
    allergies: [],
    medicalHistory: "Veneer (2025), Cleaning (2026)",
    registeredDate: "2025-03-18",
    lastVisit: "2026-02-19",
    status: "Active",
  },
];

export const doctors: Doctor[] = [
  { id: "D001", name: "Dr. Ahmad Ras", specialty: "Orthodontics", email: "ahmad@ras.dental", phone: "+1 555-0201" },
  { id: "D002", name: "Dr. Sarah Khan", specialty: "Endodontics", email: "sarah@ras.dental", phone: "+1 555-0202" },
  { id: "D003", name: "Dr. James Wilson", specialty: "Periodontics", email: "james@ras.dental", phone: "+1 555-0203" },
  { id: "D004", name: "Dr. Maria Garcia", specialty: "Prosthodontics", email: "maria@ras.dental", phone: "+1 555-0204" },
  { id: "D005", name: "Dr. Omar Fadel", specialty: "Oral Surgery", email: "omar@ras.dental", phone: "+1 555-0205" },
];

export const appointments: Appointment[] = [
  { id: "A001", patientId: "P001", patientName: "John Anderson", doctorId: "D002", doctorName: "Dr. Sarah Khan", date: "2026-02-21", time: "09:00", reason: "Root Canal Follow-up", status: "Scheduled", type: "Follow-up" },
  { id: "A002", patientId: "P002", patientName: "Emily Roberts", doctorId: "D001", doctorName: "Dr. Ahmad Ras", date: "2026-02-21", time: "09:30", reason: "Orthodontic Adjustment", status: "Scheduled", type: "Treatment" },
  { id: "A003", patientId: "P003", patientName: "Michael Chen", doctorId: "D003", doctorName: "Dr. James Wilson", date: "2026-02-21", time: "10:00", reason: "Periodontal Cleaning", status: "In Progress", type: "Treatment" },
  { id: "A004", patientId: "P004", patientName: "Sarah Williams", doctorId: "D001", doctorName: "Dr. Ahmad Ras", date: "2026-02-21", time: "10:30", reason: "Retainer Check", status: "Scheduled", type: "Check-up" },
  { id: "A005", patientId: "P005", patientName: "David Kim", doctorId: "D004", doctorName: "Dr. Maria Garcia", date: "2026-02-21", time: "11:00", reason: "Implant Review", status: "Scheduled", type: "Follow-up" },
  { id: "A006", patientId: "P007", patientName: "Robert Martinez", doctorId: "D004", doctorName: "Dr. Maria Garcia", date: "2026-02-21", time: "14:00", reason: "Denture Adjustment", status: "Scheduled", type: "Treatment" },
  { id: "A007", patientId: "P008", patientName: "Jennifer Lee", doctorId: "D002", doctorName: "Dr. Sarah Khan", date: "2026-02-21", time: "14:30", reason: "Veneer Consultation", status: "Scheduled", type: "Consultation" },
  { id: "A008", patientId: "P001", patientName: "John Anderson", doctorId: "D005", doctorName: "Dr. Omar Fadel", date: "2026-02-22", time: "09:00", reason: "Wisdom Tooth Evaluation", status: "Scheduled", type: "Consultation" },
  { id: "A009", patientId: "P002", patientName: "Emily Roberts", doctorId: "D003", doctorName: "Dr. James Wilson", date: "2026-02-22", time: "10:00", reason: "Deep Cleaning", status: "Scheduled", type: "Treatment" },
  { id: "A010", patientId: "P006", patientName: "Lisa Thompson", doctorId: "D005", doctorName: "Dr. Omar Fadel", date: "2026-02-20", time: "15:00", reason: "Post-Extraction Follow-up", status: "Completed", type: "Follow-up" },
  { id: "A011", patientId: "P003", patientName: "Michael Chen", doctorId: "D002", doctorName: "Dr. Sarah Khan", date: "2026-02-19", time: "11:00", reason: "Crown Checkup", status: "Completed", type: "Check-up" },
  { id: "A012", patientId: "P004", patientName: "Sarah Williams", doctorId: "D001", doctorName: "Dr. Ahmad Ras", date: "2026-02-18", time: "09:30", reason: "Retainer Fitting", status: "Completed", type: "Treatment" },
];

export const invoices: Invoice[] = [
  { id: "INV001", patientId: "P001", patientName: "John Anderson", items: [{ treatment: "Root Canal", cost: 800, quantity: 1 }, { treatment: "X-Ray", cost: 50, quantity: 2 }], total: 900, paymentType: "Insurance", status: "Paid", date: "2026-02-10" },
  { id: "INV002", patientId: "P002", patientName: "Emily Roberts", items: [{ treatment: "Orthodontic Adjustment", cost: 250, quantity: 1 }], total: 250, paymentType: "Card", status: "Paid", date: "2026-02-15" },
  { id: "INV003", patientId: "P003", patientName: "Michael Chen", items: [{ treatment: "Periodontal Treatment", cost: 600, quantity: 1 }, { treatment: "Medication", cost: 45, quantity: 1 }], total: 645, paymentType: "Cash", status: "Pending", date: "2026-02-18" },
  { id: "INV004", patientId: "P004", patientName: "Sarah Williams", items: [{ treatment: "Retainer Fitting", cost: 350, quantity: 1 }], total: 350, paymentType: "Insurance", status: "Paid", date: "2026-02-18" },
  { id: "INV005", patientId: "P005", patientName: "David Kim", items: [{ treatment: "Implant Review", cost: 200, quantity: 1 }, { treatment: "X-Ray", cost: 50, quantity: 1 }], total: 250, paymentType: "Card", status: "Overdue", date: "2026-01-28" },
  { id: "INV006", patientId: "P007", patientName: "Robert Martinez", items: [{ treatment: "Denture Adjustment", cost: 300, quantity: 1 }], total: 300, paymentType: "Mobile", status: "Pending", date: "2026-02-12" },
  { id: "INV007", patientId: "P008", patientName: "Jennifer Lee", items: [{ treatment: "Veneer Consultation", cost: 150, quantity: 1 }, { treatment: "Cleaning", cost: 120, quantity: 1 }], total: 270, paymentType: "Cash", status: "Paid", date: "2026-02-19" },
];

export const inventory: InventoryItem[] = [
  { id: "IT001", name: "Dental Composite Resin", category: "Materials", quantity: 45, minStock: 20, unitPrice: 35.0, supplier: "DentalCorp", expiryDate: "2027-06-15", status: "In Stock" },
  { id: "IT002", name: "Disposable Gloves (Box)", category: "Consumables", quantity: 8, minStock: 15, unitPrice: 12.5, supplier: "MedSupply Co", expiryDate: "2027-12-01", status: "Low Stock" },
  { id: "IT003", name: "Anesthetic Cartridges", category: "Medications", quantity: 120, minStock: 50, unitPrice: 4.75, supplier: "PharmaPlus", expiryDate: "2026-08-20", status: "In Stock" },
  { id: "IT004", name: "Dental Impression Material", category: "Materials", quantity: 30, minStock: 10, unitPrice: 28.0, supplier: "DentalCorp", expiryDate: "2027-03-10", status: "In Stock" },
  { id: "IT005", name: "Surgical Masks (Box)", category: "Consumables", quantity: 3, minStock: 10, unitPrice: 8.0, supplier: "MedSupply Co", expiryDate: "2027-09-25", status: "Low Stock" },
  { id: "IT006", name: "Fluoride Varnish", category: "Medications", quantity: 0, minStock: 15, unitPrice: 22.0, supplier: "PharmaPlus", expiryDate: "2026-11-30", status: "Out of Stock" },
  { id: "IT007", name: "Orthodontic Brackets", category: "Equipment", quantity: 200, minStock: 50, unitPrice: 3.5, supplier: "OrthoTech", expiryDate: "2028-01-15", status: "In Stock" },
  { id: "IT008", name: "Dental Burs (Pack)", category: "Equipment", quantity: 15, minStock: 10, unitPrice: 45.0, supplier: "DentalCorp", expiryDate: "2029-05-20", status: "In Stock" },
  { id: "IT009", name: "Sterilization Pouches", category: "Consumables", quantity: 250, minStock: 100, unitPrice: 0.15, supplier: "MedSupply Co", expiryDate: "2028-07-10", status: "In Stock" },
  { id: "IT010", name: "Temporary Crown Material", category: "Materials", quantity: 5, minStock: 10, unitPrice: 55.0, supplier: "DentalCorp", expiryDate: "2026-12-01", status: "Low Stock" },
];
