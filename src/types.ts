export type AuthView = "login" | "signup" | "forgot" | "2fa" | "passkey_fallback";

export type ActiveTab =
  | "overview"
  | "profile"
  | "passport"
  | "identity"
  | "taxes"
  | "credit"
  | "license_vehicle"
  | "property"
  | "healthcare"
  | "education"
  | "utilities"
  | "notifications"
  | "settings";

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  mobile: string;
  phoneNumber?: string;
  dob: string;
  cnic: string;
  passportNumber: string;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
  province: string;
  city: string;
  homeAddress: string;
  profilePicUrl?: string;
  isVerified: boolean;
  atlStatus: "ACTIVE" | "INACTIVE";
  bloodGroup: string;
  fatherName: string;
  fatherDob?: string;
  motherName?: string;
  motherDob?: string;
  hasSiblings?: string;
  numberOfSiblings?: string;
  maritalStatus: string;
  occupation: string;
  twoFactorEnabled: boolean;
  hasPasskey?: boolean;
  passkeys?: any[];
  registrationDate?: string;
  createdAt?: string;
  lastLogin?: string;
  assignedPassportOffice?: string;
  assignedTaxOffice?: string;
  assignedLicensingAuthority?: string;
  assignedUtilityProvider?: string;
  assignedRegionalAuthority?: string;
  passport?: PassportDetails;
  vehicles?: VehicleRecord[];
  properties?: PropertyRecord[];
  taxFilings?: TaxFilingRecord[];
  declaredIncome?: number;
  preferences?: { darkMode?: boolean; langUrdu?: boolean };
  attestedDegrees?: any[];
  utilityBills?: UtilityBill[];
  mtagBalance?: number;
}

export interface PassportDetails {
  passportNumber: string;
  bookletType: "36 Pages" | "72 Pages" | "100 Pages";
  urgency: "Normal" | "Urgent" | "Executive";
  issueDate: string;
  expiryDate: string;
  status: "Valid" | "Expired" | "Renewal Pending" | "Not Applied" | "Processing";
  trackingId?: string;
  regionalOffice: string;
  applicationDate?: string;
}

export interface PassportTrackingStage {
  title: string;
  date: string;
  status: "completed" | "in_progress" | "upcoming";
  description: string;
}

export interface TaxFilingRecord {
  taxYear: string;
  filingDate: string;
  declaredIncome: number;
  taxPaid: number;
  status: "Verified" | "Under Audit" | "Exempt";
  acknowledgementNo: string;
}

export interface CreditAccount {
  institution: string;
  accountType: "Housing Loan" | "Vehicle Loan" | "Credit Card" | "Personal SME";
  sanctionedAmount: number;
  currentBalance: number;
  status: "Active" | "Closed";
  monthlyPayment: number;
}

export interface VehicleRecord {
  registrationNo: string;
  chassisNo: string;
  makeModel: string;
  year: number;
  tokenTaxPaidUntil: string;
  status: "Clear" | "Token Pending";
  engineCc: number;
}

export interface PropertyRecord {
  khasraNo: string;
  district: string;
  tehsil: string;
  areaSqFt: number;
  propertyType: "Residential Plot" | "Agricultural" | "Commercial Plaza";
  ownershipShare: string;
  estimatedValue: number;
}

export interface UtilityBill {
  id: string;
  serviceType: string;
  consumerNumber: string;
  dueDate: string;
  amount: number;
  status: "Paid" | "Unpaid";
  billingMonth: string;
  unitsConsumed: number;
  paidAtDate?: string;
  paidAtTimePKT?: string;
  paidAtDisplay?: string;
  propertyKhasra?: string;
  ownershipShare?: string;
  issueDate?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  category: "Passport" | "Tax" | "Identity" | "Utility" | "System";
  actionUrl?: string;
}

export interface HospitalItem {
  name: string;
  city: string;
  address: string;
  contact: string;
  bedsAvailable: number;
  empanelledStatus: "Sehat Card Panel Plus" | "General Panel";
  distanceKm: number;
  lat?: number;
  lng?: number;
}
