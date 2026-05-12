
export enum ConsignmentType {
  VETERINARY = 'VETERINARY',
  AGRICULTURAL = 'AGRICULTURAL',
  FOOD_SAFETY = 'FOOD_SAFETY'
}

export enum ConsignmentDirection {
  INBOUND = 'INBOUND',
  OUTBOUND = 'OUTBOUND'
}

export enum WorkflowStep {
  ARRIVAL = 'ARRIVAL',
  INSPECTION = 'INSPECTION',
  DECISION = 'DECISION',
  LAB_RESULT = 'LAB_RESULT',
  FINAL_STATUS = 'FINAL_STATUS'
}

export type UserRole = 'ADMIN' | 'INSPECTOR' | 'MANAGER' | 'LAB_TECH' | 'VIEWER' | 'LOGISTICS' | 'LAB_DELEGATE';

export interface User {
  id: string;
  name: string;
  civilId?: string;
  email?: string; 
  phone?: string; 
  role: UserRole;
  originalRole?: UserRole;
  jobTitle: string;
  avatar?: string;
  allowedSectors: ConsignmentType[];
  assignedPorts?: string[]; 
  assignedLabId?: string;
  allowedPages?: string[];
  sidebarPreferences?: string[]; // Array of paths in order
  isActive: boolean;
  isOnline?: boolean;
  lastSeen?: string;
  needsPasswordReset?: boolean;
  lastPasswordChange?: string;
  currentPassword?: string; 
}

export interface PasswordResetRequest {
  id: string;
  userId: string;
  civilId: string;
  phone: string;
  userName: string;
  timestamp: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface Port {
  id: string;
  name: string;
  type: 'SEA' | 'AIR' | 'LAND' | 'LOGISTICS';
  location: string;
  code?: string;
  isActive: boolean;
  allowedSectors?: ConsignmentType[]; 
  allowedPages?: string[]; 
}

export interface LabDelegate {
  id: string;
  name: string;
  phone: string;
}

export interface Laboratory {
  id: string;
  name: string;
  location?: string;
  type?: 'GOVERNMENT' | 'PRIVATE';
  accreditations?: string[];
  contact?: string;
  email?: string;
  testTypes: string[];
  delegates: LabDelegate[];
  isActive: boolean;
}

export interface PesticideMapping {
  id: string;
  name: string; // الاسم التجاري
  activeIngredients: string[]; // المادة الفعالة
  activeIngredient?: string; // Deprecated: Use activeIngredients instead
  pesticideType?: string; // اختياري: نوع المبيد (حشري، فطري، ...)
}

export interface CustomsBroker {
  id: string;
  name: string;
  phone: string;
  civilId?: string; 
}

export interface ClearanceOffice {
  id: string;
  name: string; 
  licenseNumber?: string; 
  crNumber?: string;
  phone?: string; 
  contact?: string;
  email?: string;
  rating?: number;
  isActive?: boolean;
  brokers: CustomsBroker[];
}

export interface SamplingPlan {
  id: string;
  sector: ConsignmentType;
  productName: string;
  targetImporters?: string[];
  targetExporters?: string[];
  targetOrigins?: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  requiredAnalysis: string[];
  sampleCount: number;
  unitsPerSample: number;
  sampleWeight?: string;
  monthlyQuota: number;
  currentMonthCount?: number;
  lastResetMonth?: string;
  active: boolean;
}

export type ShiftType = string; // Dynamic shift ID

export interface ShiftConfig {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  color: string;
  icon: string;
}

export interface SectorShiftConfig {
  id: string; // sector_portId
  sector: ConsignmentType;
  portId: string;
  shifts: ShiftConfig[];
}

export interface WeeklySchedule {
  [day: string]: {
    [shiftId: string]: string[];
  };
}

export interface ShiftNote {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  shift: ShiftType;
  sector: ConsignmentType | 'ALL';
  port?: string; // New: Port identifier
  content: string;
  category: 'GENERAL' | 'URGENT' | 'HANDOVER' | 'PREVIEW';
  isResolved?: boolean;
}

export interface AuditChange {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLogEntry {
  timestamp: string;
  action: string;
  user: string;
  details?: string;
  statusChange?: string;
  changes?: AuditChange[]; 
}

export interface Importer {
  id: string;
  name: string;
  crNumber: string;
  phone: string;
  contact?: string;
  email: string;
  address?: string;
  notes?: string;
  defaultClearanceOffice?: string; // New: Linked Clearance Company
  defaultBroker?: string;          // New: Default Broker Name
  rating?: number;
  isActive: boolean;
}

export interface CommodityGroup {
  id: string;
  name: string;
  sector: ConsignmentType;
  products: string[];
  hsCode?: string; 
}

export enum ConsignmentStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected'
}

export interface ConsignmentItem {
  id: string;
  commodityGroup?: string;
  hsCode?: string;
  description: string;
  enDescription?: string;
  details?: string;
  activeIngredients?: string[]; // Changed to array
  activeIngredient?: string; // Deprecated: Use activeIngredients instead
  pesticideName?: string; // New Field: اسم المبيد
  pesticideType?: string; // Optional: نوع المبيد (حشري/فطري..)
  brand?: string;
  batchNumber?: string;
  productionDate?: string;
  expiryDate?: string;
  origin: string;
  weight: number;
  packageCount: number;
  packagingUnit: string;
  storageTemp?: string;
  riskFlag?: boolean;
  riskPlanId?: string;
  producingCompany?: string; 
  sampleCondition?: string;
  technicalAction?: string; // New: Per-item technical action
  rejectionReason?: string; // New: Per-item rejection reason
}

export interface Sample {
  sampleId: string;
  itemIds: string[];
  date: string;
  type: string;
  labAnalysisType: string[];
  labName: string;
  labDelegate?: string;
  sampleSize: string;
  sampleCondition?: string;
  sampleSeal?: string;
  receiptDate?: string;
  receiptTime?: string;
  status: 'DRAWN' | 'PICKED_UP' | 'AT_LAB' | 'UNDER_ANALYSIS' | 'COMPLETED';
  result: 'Pending' | 'Compliant' | 'NonCompliant';
  notes?: string;
  rejectionReason?: string;
  drawnBy: string;
  pickupDate?: string;
  pickupBy?: string;
  receivedAtLabDate?: string;
  receivedAtLabBy?: string;
  analysisStartDate?: string;
  completedDate?: string;
  isDelivered?: boolean;
  deliveryTime?: string;
  resultFileUrl?: string;
  resultFileName?: string;
  isReceivedAtLab?: boolean;
  receivedAtLabAt?: string;
  receivedBy?: string;
}

export interface LabRequestFormData {
    customerName: string;
    email: string;
    phone: string;
    samplingDate: string;
    receivingDate: string;
    items: Partial<ConsignmentItem>[];
    reasons: string[];
    analysisTypes: string[];
    remarks: string;
    fees?: string[];
}

export interface Consignment {
  id: string;
  arrivalDate: string;
  port: string;
  enPort?: string;
  originPort?: string;
  bayanNumber?: string;
  permitNumber?: string;
  declarationType?: string;
  importer: string;
  enImporter?: string;
  exporter?: string;
  enExporter?: string;
  shippingCountry?: string;
  enShippingCountry?: string;
  items: ConsignmentItem[]; 
  totalWeight: number;
  totalPackageCount: number;
  containerCount: number;
  containerType: string;
  containerTemp?: string;
  containerNumber?: string;
  sealNumber?: string;
  commodityGroup: string;
  intendedUse?: string;
  enIntendedUse?: string;
  vetCategory?: string;
  vetCertificateType?: 'منتجات حيوانية' | 'أعلاف ومخلفات حيوانية';
  currentStep?: WorkflowStep;
  inspectionType: string;
  inspectionDate?: string;
  inspectionLocation?: string;
  inspectionNotes?: string;
  hasSample: boolean;
  samples: Sample[];
  labRequestFormData?: LabRequestFormData;
  sampleId?: string; 
  sampleDate?: string;
  labAnalysisType?: string | string[];
  labName?: string;
  labDelegate?: string;
  sampleSize?: string;
  inspectionResult: string;
  rejectionReason?: string;
  rejectionDetails?: string;
  fees: number;
  inspectorName: string;
  technicalAction: string;
  inquiryType?: string;
  conditionalReleaseType?: string;
  transferTo?: string;
  storeName?: string;
  storeLicense?: string;
  logisticsArrivalDate?: string;
  logisticsReceiverName?: string;
  rejectionAction?: string;
  exceptionType?: 'RELEASE' | 'SAMPLE';
  destructionAttachment?: string;
  reExportBayan?: string;
  exceptionRef?: string;
  correspondenceNumber?: string;
  remarks: string;
  feeRemarks: string;
  hasUndertaking: boolean;
  undertakingType?: string;
  undertakingCompletionDate?: string;
  isUndertakingMet: boolean;
  type: ConsignmentType;
  riskScore: number;
  riskAssessment: string;
  isLocked: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt?: string;
  dataCompletionStatus?: 'Complete' | 'Incomplete';
  auditLog: AuditLogEntry[];
  clearanceOffice?: string;
  customsBroker?: string;
  brokerPhone?: string;
  direction: ConsignmentDirection;
  // Treatment fields for Agricultural Outbound
  treatmentDate?: string;
  treatmentType?: string;
  treatmentConcentration?: string;
  treatmentChemicals?: string;
  treatmentExposureDuration?: string;
  treatmentTemperature?: string;
  treatmentCertificateRef?: string;
}

export interface AppDocument {
  id: string;
  consignmentId: string;
  type: 'IMG' | 'DOC' | 'CERT';
  url: string;
  title: string;
  date: string;
  uploadedBy?: string;
  fileType?: string;
}

export interface CertificateTemplate {
  id: string;
  sector: ConsignmentType;
  country: string;
  title: string;
  url: string; 
  type: 'PDF' | 'IMG';
  uploadedBy: string;
  createdAt: string;
  fileType?: string;
}

export interface ChatMessage {
  id: string;
  sector: ConsignmentType;
  port?: string; // New: Port identifier
  senderId: string;
  senderName: string;
  senderRole?: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'DOC' | 'VOICE' | 'SYSTEM';
  url?: string; 
  fileName?: string;
  duration?: number; // Duration in seconds for voice messages
  timestamp: string;
  replyTo?: string; // ID of the message being replied to
  reactions?: Record<string, string[]>; // emoji -> [userIds]
  readBy?: string[]; // Array of user IDs who have read the message
  isPinned?: boolean; // New: Pin message to top
}

export interface TypingStatus {
    userId: string;
    userName: string;
    sector: ConsignmentType;
    port?: string;
    isTyping: boolean;
    lastUpdated: string;
}

export interface DashboardStats {
  totalIncoming: number;
  pendingSamples: number;
  activeUndertakings: number;
  riskAlerts: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  isRead: boolean;
  link?: string;
}

export interface NewsTickerItem {
  id: string;
  text: string;
  type: 'info' | 'warning' | 'urgent';
  isActive: boolean;
}

export interface ImportantLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  description: string;
}

export interface SecurityLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  details?: string;
}

export interface SystemSettings {
  riskThreshold: number;
  enableEmailAlerts: boolean;
  enableSmsAlerts: boolean;
  autoLockHighRisk: boolean;
  maintenanceMode: boolean;
  newsTickerEnabled: boolean;
  newsTickerSpeed?: number;
  newsTickerItems: NewsTickerItem[];
  rolePermissions?: Record<string, string[]>; // Added for collective permission management
  importantLinks?: ImportantLink[];
  maxConcurrentSessions?: number; // Advanced Session Control
  autoLockTimeout?: number; // Smart Auto-Lock (minutes)
  customLabels?: Record<string, string>; // CMS & Localization
  // New Advanced Settings
  securityAuditEnabled?: boolean;
  performanceMonitoringEnabled?: boolean;
  developerMode?: boolean;
  ipWhitelist?: string[];
  sessionTimeout?: number;
  twoFactorAuthRequired?: boolean;
  databaseOptimizationEnabled?: boolean;
  apiLoggingEnabled?: boolean;
  darkModeEnabled?: boolean;
  enableSoundAlerts?: boolean;
  backupFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  retentionPeriod?: number; // days
  passwordComplexity?: 'LOW' | 'MEDIUM' | 'HIGH';
  passwordExpiryDays?: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export interface ENumber {
  code: string;
  name: string;
  status: string;
  type: string;
  note?: string;
}

export interface EpidemicAlert {
  country: string;
  disease: string;
  status: string;
  date: string;
  note?: string;
}

export interface HSCode {
  code: string;
  name: string;
  category: string;
}

export interface InspectionChecklist {
  id: string;
  title: string;
  items: string[];
}

export type AuthStep = 'WELCOME' | 'LOGIN' | 'SETUP_ADMIN' | 'CHANGE_PASSWORD' | 'ROLE_SELECTION' | 'SECTOR_SELECTION' | 'APP';
