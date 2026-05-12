
// ... imports
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Consignment, ConsignmentType, WorkflowStep, Importer, CommodityGroup, User, ConsignmentItem, Sample, AuditLogEntry, AuditChange, LabRequestFormData, Laboratory, SamplingPlan, Port, AppDocument, CertificateTemplate, ClearanceOffice, CustomsBroker, PesticideMapping, SystemSettings, ConsignmentDirection } from '../types';
import { CONSIGNMENT_LABELS, generateConsignmentId, COUNTRIES } from '../constants';
import { parseRegistrationText } from '../geminiService';
import { GoogleGenAI } from "@google/genai";
import { parseConsignmentsFromExcel, downloadTemplate, exportConsignmentsToExcel } from '../excelService';
import SearchableSelect from './SearchableSelect';
import LabRequestFormModal from './LabRequestFormModal';
import RejectionFormModal from './RejectionFormModal';
import ConfirmModal from './ConfirmModal';
import PhytosanitaryCertificate from './PhytosanitaryCertificate';
import VeterinaryCertificate from './VeterinaryCertificate';
import * as FB from '../firebaseService';
import { DataTable } from './DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { KanbanBoard } from './KanbanBoard';
import ConsignmentTimeline from './ConsignmentTimeline';
import { QRCodeCanvas } from 'qrcode.react';

interface ConsignmentPortalProps {
  activeSector: ConsignmentType;
  consignments: Consignment[];
  setConsignments?: (consignments: Consignment[]) => void;
  onAdd: (c: Consignment) => void;
  onDelete: (id: string) => void;
  onUpdate: (c: Consignment) => void;
  importers: Importer[];
  commodityGroups: CommodityGroup[];
  inspectionTypes: string[];
  declarationTypes: string[];
  undertakingTypes: string[];
  containerTypes: string[];
  transferDestinations: string[]; 
  intendedUses?: string[];
  labAnalysisTypes: string[];
  rejectionReasons: string[];
  currentUser: User;
  users: User[];
  samplingPlans?: SamplingPlan[];
  ports?: Port[]; 
  clearanceOffices?: ClearanceOffice[];
  pesticides?: PesticideMapping[];
  systemSettings?: SystemSettings;
}

const STEPS = [
    { id: 1, label: 'البيان والأطراف', icon: 'fa-file-invoice' },
    { id: 2, label: 'المنتجات', icon: 'fa-boxes' },
    { id: 3, label: 'المعاينة والعينات', icon: 'fa-search' },
    { id: 4, label: 'المستندات', icon: 'fa-folder-open' }, 
    { id: 5, label: 'القرار والرسوم', icon: 'fa-gavel' },
    { id: 6, label: 'سجل التتبع', icon: 'fa-history' }
];

const PACKAGING_UNITS = ['كرتون', 'كيس', 'صندوق', 'طبلية', 'حاوية', 'رأس', 'طن', 'كجم', 'لتر', 'عبوة'];
const TECHNICAL_ACTIONS = ['إفراج نهائي', 'إفراج مشروط', 'رفض', 'تحويل', 'إستفسار', 'تعديل', 'إجراءات متعددة', 'استلام في اللوجستية'];
const CONDITIONAL_RELEASE_OPTS = ['التحفظ في الميناء', 'تحويل للمدينة اللوجستية', 'تحويل لمخازن الشركة'];
const LOGISTICS_STATIONS = ['محطة صحار اللوجستية', 'محطة بركاء اللوجستية'];

const AUDIT_FIELDS = [
    'bayanNumber', 'permitNumber', 'importer', 'exporter', 'port', 'arrivalDate', 
    'declarationType', 'containerCount', 'containerType', 'containerTemp', 'containerNumber',
    'intendedUse', 'shippingCountry', 'inspectionType', 'inspectionDate', 'inspectionLocation',
    'inspectionResult', 'inspectionNotes', 'technicalAction', 'inquiryType', 'hasSample',
    'status', 'fees', 'inspectorName', 'isLocked', 'remarks', 
    'clearanceOffice', 'customsBroker', 'storeName', 'storeLicense', 
    'reExportBayan', 'correspondenceNumber', 'undertakingType', 'undertakingCompletionDate'
];

const getAuditFieldLabel = (field: string, systemSettings?: SystemSettings): string => {
    const labels: Record<string, string> = {
        bayanNumber: systemSettings?.customLabels?.declarationNumber || 'رقم البيان',
        permitNumber: 'رقم التصريح',
        importer: systemSettings?.customLabels?.importerLabel || 'المستورد',
        exporter: 'المصدر / المصنع',
        port: 'المنفذ / الميناء',
        arrivalDate: 'تاريخ الوصول',
        declarationType: 'نوع البيان',
        containerCount: 'عدد الحاويات',
        containerType: 'نوع الحاوية',
        containerTemp: 'حرارة الحاوية',
        containerNumber: 'أرقام الحاويات',
        intendedUse: 'غرض الاستخدام',
        shippingCountry: 'بلد الشحن',
        inspectionType: 'نوع الفحص',
        inspectionDate: 'تاريخ المعاينة',
        inspectionLocation: 'موقع المعاينة',
        inspectionResult: 'نتيجة المعاينة الظاهرية',
        inspectionNotes: 'ملاحظات المعاينة',
        technicalAction: 'الإجراء الفني',
        inquiryType: 'تفاصيل الإستفسار',
        hasSample: 'طلب عينة مخبرية',
        status: 'الحالة الإجمالية',
        fees: 'الرسوم',
        inspectorName: 'المفتش المسؤول',
        isLocked: 'حالة القفل',
        remarks: 'الملاحظات العامة',
        clearanceOffice: 'مكتب التخليص',
        customsBroker: systemSettings?.customLabels?.clearanceAgent || 'المخلص الجمركي',
        storeName: 'اسم المستودع',
        storeLicense: 'رقم الترخيص',
        reExportBayan: 'رقم بيان إعادة التصدير',
        correspondenceNumber: 'رقم المراسلة',
        undertakingType: 'نوع التعهد',
        undertakingCompletionDate: 'تاريخ انتهاء التعهد'
    };
    return labels[field] || field;
};

const safeFormatDate = (dateStr: string | undefined | null, locale: string = 'ar-OM') => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || '---';
    return date.toLocaleDateString(locale);
  } catch (e) {
    return dateStr || '---';
  }
};

const safeFormatDateTime = (dateStr: string | undefined | null, locale: string = 'en-GB') => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || '---';
    return `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    return dateStr || '---';
  }
};

export const downloadQRCode = (canvasId: string, filename: string) => {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement;
  if (!canvas) {
    console.error(`Canvas with id ${canvasId} not found`);
    return;
  }
  
  // Ensure the canvas has a white background if it's transparent
  const context = canvas.getContext('2d');
  if (context) {
    // We create a temporary canvas to ensure the background is solid
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.fillStyle = '#FFFFFF';
      tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
      
      const pngUrl = tempCanvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngUrl;
      downloadLink.download = `${filename}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }
};

const generateConsignmentSummary = (c: Consignment) => {
  const itemsList = c.items?.slice(0, 5).map(i => i.description).join('، ') + (c.items && c.items.length > 5 ? '...' : '');
  return `نظام مرقاب - تفاصيل المعاملة
------------------
رقم البيان: ${c.bayanNumber || '-'}
رقم التصريح: ${c.permitNumber || '-'}
المستورد: ${c.importer || '-'}
المصدر: ${c.exporter || '-'}
بلد الشحن: ${c.shippingCountry || '-'}
المنفذ: ${c.port || '-'}
تاريخ الوصول: ${c.arrivalDate || '-'}
------------------
الوزن بصافي: ${c.totalWeight || 0} كجم
الطرود: ${c.totalPackageCount || 0}
الحاويات: ${c.containerCount || 0} ${c.containerNumber ? `(${c.containerNumber})` : ''}
------------------
الأصناف (${c.items?.length || 0}): ${itemsList || '-'}
------------------
الإجراء: ${c.technicalAction || '-'}
الحالة: ${c.status || '-'}
النتيجة: ${c.inspectionResult || '-'}
الرسوم: ${c.fees || 0} ر.ع
المفتش: ${c.inspectorName || '-'}
التاريخ: ${new Date().toLocaleDateString('ar-OM')}`.trim();
};

const ConsignmentDocuments = ({ consignmentId }: { consignmentId: string }) => {
    const [docs, setDocs] = useState<AppDocument[]>([]);
    useEffect(() => {
        return FB.subscribeToCollection('documents', (allDocs: AppDocument[]) => {
            setDocs(allDocs.filter(d => d.consignmentId === consignmentId));
        });
    }, [consignmentId]);

    if (docs.length === 0) return null;

    return (
        <div className="col-span-full mt-4 pt-6 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fas fa-folder-open text-blue-500"></i> المستندات والمرفقات ({docs.length})
            </h4>
            <div className="flex flex-wrap gap-3">
                {docs.map(doc => (
                    <a 
                        key={doc.id} 
                        href={doc.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-3 px-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm group"
                    >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${doc.type === 'DOC' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
                            <i className={`fas ${doc.type === 'DOC' ? 'fa-file-pdf' : 'fa-image'}`}></i>
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="truncate max-w-[150px]">{doc.title}</span>
                            <span className="text-[9px] text-slate-400 font-medium">
                                {safeFormatDate(doc.date)}
                            </span>
                        </div>
                        <i className="fas fa-external-link-alt text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                    </a>
                ))}
            </div>
        </div>
    );
};

const ConsignmentDetail = ({ c, onViewCert, onTranslate, isTranslating, samplingPlans = [] }: { c: Consignment, onViewCert?: (c: Consignment) => void, onTranslate?: (c: Consignment) => void, isTranslating?: boolean, samplingPlans?: SamplingPlan[] }) => (
  <div className="p-6 bg-white rounded-xl shadow-inner border border-slate-100 m-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative">
    <div className="absolute top-4 left-4 flex gap-2">
      {onTranslate && (c.type === ConsignmentType.AGRICULTURAL || c.type === ConsignmentType.VETERINARY) && (c.direction === ConsignmentDirection.OUTBOUND) && (
        <button 
          onClick={() => onTranslate(c)}
          disabled={isTranslating}
          className={`bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors ${isTranslating ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="ترجمة البيانات للغة الإنجليزية للاستخدام في الشهادات"
        >
          <i className={isTranslating ? "fas fa-spinner fa-spin" : "fas fa-language"}></i>
          {isTranslating ? 'جاري الترجمة...' : 'ترجمة AI'}
        </button>
      )}
      {onViewCert && (c.type === ConsignmentType.AGRICULTURAL || c.type === ConsignmentType.VETERINARY) && (c.direction === ConsignmentDirection.OUTBOUND) && (
        <button 
          onClick={() => onViewCert(c)}
          className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
        >
          <i className="fas fa-certificate"></i>
          عرض الشهادة
        </button>
      )}
    </div>
    <div className="space-y-3">
      <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
        <i className="fas fa-info-circle text-emerald-500"></i> تفاصيل عامة
      </h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className="text-slate-500">نوع البيان:</span>
        <span className="font-bold text-slate-700">{c.declarationType || '-'}</span>
        <span className="text-slate-500">رقم التصريح:</span>
        <span className="font-bold text-emerald-600">{c.permitNumber || '-'}</span>
        <span className="text-slate-500">بلد التصدير:</span>
        <span className="font-bold text-slate-700">{c.shippingCountry || '-'}</span>
        <span className="text-slate-500">بلد المنشأ:</span>
        <span className="font-bold text-slate-700">{c.items && c.items.length > 0 ? Array.from(new Set(c.items.map((i: any) => i.origin))).join(', ') : '-'}</span>
        <span className="text-slate-500">الوزن الإجمالي:</span>
        <span className="font-bold text-slate-700">{c.totalWeight ? `${c.totalWeight} كجم` : '-'}</span>
        <span className="text-slate-500">غرض الاستخدام:</span>
        <span className="font-bold text-slate-700">{c.intendedUse || '-'}</span>
      </div>
    </div>
    
    <div className="space-y-3">
      <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
        <i className="fas fa-box-open text-amber-500"></i> الأصناف ({c.items?.length || 0})
      </h4>
      <div className="max-h-40 overflow-y-auto pr-2 space-y-2 custom-scrollbar scroll-fade-y">
        {c.items && c.items.length > 0 ? c.items.map((item: any, idx: number) => {
          const riskPlan = samplingPlans.find(p => p.id === item.riskPlanId);
          return (
            <div key={idx} className="bg-slate-50 p-2 rounded border border-slate-100 text-xs">
              <div className="font-bold text-slate-700 flex justify-between items-start">
                <span>{item.description}</span>
                {riskPlan && (
                  <span className="text-[8px] bg-red-100 text-red-600 px-1 py-0.5 rounded shrink-0">PLAN</span>
                )}
              </div>
              <div className="flex justify-between mt-1 text-slate-500">
                <span>{item.hsCode || '-'}</span>
                <span>{item.weight ? `${item.weight} كجم` : '-'}</span>
              </div>
              {riskPlan && riskPlan.monthlyQuota > 0 && (
                <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 flex justify-between items-center text-[9px] font-black">
                  <span className="text-slate-400">الحصة الشهرية:</span>
                  <span className="text-blue-600">{riskPlan.monthlyQuota}</span>
                </div>
              )}
            </div>
          );
        }) : <span className="text-xs text-slate-400">لا توجد أصناف</span>}
      </div>
    </div>

    <div className="space-y-3">
      <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
        <i className="fas fa-microscope text-emerald-500"></i> الفحص والمختبر
      </h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <span className="text-slate-500">موقع التفتيش:</span>
        <span className="font-bold text-slate-700">{c.inspectionLocation || c.port || '-'}</span>
        <span className="text-slate-500">الرسوم المحصلة:</span>
        <span className="font-bold text-slate-700">{c.fees ? `${c.fees} ر.ع` : '-'}</span>
      </div>
      {c.inspectionNotes && (
        <div className="mt-2 bg-amber-50 p-2 rounded border border-amber-100 text-xs">
          <span className="font-bold text-amber-800 block mb-1">ملاحظات المفتش:</span>
          <span className="text-amber-700">{c.inspectionNotes}</span>
        </div>
      )}
    </div>

    <div className="space-y-3">
      <h4 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
        <i className="fas fa-history text-blue-500"></i> سجل الإجراءات
      </h4>
      <div className="max-h-40 overflow-y-auto pr-2 space-y-3 custom-scrollbar scroll-fade-y">
        {c.auditLog && c.auditLog.length > 0 ? c.auditLog.map((log: any, idx: number) => (
          <div key={idx} className="relative pr-4 border-r border-slate-100 pb-2 last:pb-0">
            <div className="absolute top-1 right-0 w-1.5 h-1.5 rounded-full bg-slate-300 -mr-[3.5px]"></div>
            <div className="text-[10px] font-bold text-slate-400">{safeFormatDateTime(log.timestamp)}</div>
            <div className="text-[11px] font-black text-slate-700">{log.action}</div>
            <div className="text-[9px] text-slate-500">{log.user}</div>
          </div>
        )) : <span className="text-xs text-slate-400">لا يوجد سجل</span>}
      </div>
    </div>

    <div className="space-y-3 flex flex-col items-center justify-center bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
      <h4 className="font-bold text-slate-800 border-b w-full pb-2 mb-2 text-center text-xs">
        <i className="fas fa-qrcode text-slate-600 ml-1"></i> رمز الاستجابة السريع
      </h4>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <QRCodeCanvas 
          id={`qr-summary-${c.id}`}
          value={generateConsignmentSummary(c)} 
          size={256}
          level="M"
          includeMargin={true}
          marginSize={4}
          bgColor="#FFFFFF"
          fgColor="#000000"
        />
      </div>
      <div className="flex flex-col items-center gap-1 mt-2">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            downloadQRCode(`qr-summary-${c.id}`, `summary-${c.bayanNumber || c.id}`);
          }}
          className="text-[10px] bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-1.5 font-bold"
        >
          <i className="fas fa-download"></i> تنزيل الرمز
        </button>
        <p className="text-[9px] text-slate-400 font-bold text-center leading-tight">
          امسح الرمز لعرض<br/>ملخص المعاملة نصياً
        </p>
      </div>
    </div>
    
    <ConsignmentDocuments consignmentId={c.id} />
  </div>
);

const ConsignmentPortal: React.FC<ConsignmentPortalProps> = ({
  activeSector,
  consignments,
  onAdd,
  onDelete,
  onUpdate,
  importers,
  commodityGroups,
  inspectionTypes,
  declarationTypes,
  undertakingTypes,
  containerTypes,
  transferDestinations, 
  intendedUses = [],
  labAnalysisTypes,
  rejectionReasons,
  currentUser,
  users,
  samplingPlans = [],
  ports = [],
  clearanceOffices = [],
  pesticides = [],
  systemSettings
}) => {
  const [viewMode, setViewMode] = useState<'TABLE' | 'KANBAN'>('TABLE');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterInspector, setFilterInspector] = useState<string>('ALL');
  const [filterCommodity, setFilterCommodity] = useState<string>('ALL');
  const [filterOrigin, setFilterOrigin] = useState<string>('ALL');
  const [filterPort, setFilterPort] = useState<string>('ALL'); 
  const [filterDeclarationType, setFilterDeclarationType] = useState<string>('ALL');
  const [filterRisk, setFilterRisk] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [filterSamples, setFilterSamples] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [filterDay, setFilterDay] = useState<string>('');
  const [logType, setLogType] = useState<'INCOMING' | 'OUTGOING' | 'SPLIT'>('INCOMING');

  useEffect(() => {
    if (activeSector === ConsignmentType.FOOD_SAFETY && logType !== 'INCOMING') {
      setLogType('INCOMING');
    }
  }, [activeSector, logType]);
  const [globalSearchTerm, setGlobalSearchTerm] = useState(''); 

  // Roles and Permissions Logic
  const permissions = useMemo(() => {
    const role = currentUser.role;
    return {
      canAdd: role === 'ADMIN' || role === 'INSPECTOR' || (role === 'LOGISTICS' && logType === 'OUTGOING'),
      canDelete: role === 'ADMIN',
      canEdit: role === 'ADMIN' || role === 'INSPECTOR' || role === 'MANAGER',
      canFinalDecision: role === 'ADMIN' || role === 'MANAGER' || role === 'INSPECTOR',
      canLogistics: role === 'ADMIN' || role === 'LOGISTICS',
      canLock: role === 'ADMIN' || role === 'MANAGER',
      canViewAudit: role === 'ADMIN' || role === 'MANAGER' || role === 'INSPECTOR'
    };
  }, [currentUser, logType]);

  const filteredTechnicalActions = useMemo(() => {
    let actions = [...TECHNICAL_ACTIONS];
    
    // If inspector, return all actions
    if (currentUser.role === 'INSPECTOR') {
        return actions;
    }

    // If not admin or supervisor, remove final decision actions
    if (!permissions.canFinalDecision) {
      actions = actions.filter(a => !['إفراج نهائي', 'رفض', 'إفراج مشروط'].includes(a));
    }
    
    // If not logistics officer or admin, remove logistics action
    if (!permissions.canLogistics) {
      actions = actions.filter(a => a !== 'استلام في اللوجستية');
    }

    return actions;
  }, [permissions, currentUser.role]);

  const filteredDeclarationTypes = useMemo(() => {
      return declarationTypes.filter(type => {
          const isOutgoing = type === 'تصدير' || type === 'إعادة تصدير';
          if (logType === 'INCOMING') return !isOutgoing;
          if (logType === 'OUTGOING') return isOutgoing;
          return true;
      });
  }, [declarationTypes, logType]);

  const handleLogTypeChange = (type: 'INCOMING' | 'OUTGOING' | 'SPLIT') => {
      setLogType(type);
      setFilterDeclarationType('ALL');
  };
  
  const [showMagicInput, setShowMagicInput] = useState(false);
  const [showPhytoCert, setShowPhytoCert] = useState(false);
  const [showVetCert, setShowVetCert] = useState(false);
  const [certConsignment, setCertConsignment] = useState<Consignment | null>(null);
  const [magicText, setMagicText] = useState('');
  const [isProcessingMagic, setIsProcessingMagic] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState(1);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false); 
  const [isLCLConfirmed, setIsLCLConfirmed] = useState(false);
  const [formViewMode, setFormViewMode] = useState<'STEPS' | 'SCROLL'>('STEPS');
  const [formNotification, setFormNotification] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [currentDocs, setCurrentDocs] = useState<AppDocument[]>([]);
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [viewingDoc, setViewingDoc] = useState<AppDocument | null>(null);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const allowedPorts = useMemo(() => {
      const activePorts = ports.filter(p => p.isActive);
      if (currentUser.role === 'ADMIN' || !currentUser.assignedPorts || currentUser.assignedPorts.length === 0) {
          return activePorts;
      }
      return activePorts.filter(p => currentUser.assignedPorts!.includes(p.id));
  }, [ports, currentUser]);

  const isLogisticsStationOnly = useMemo(() => {
      if (filterPort !== 'ALL') {
          const port = ports.find(p => p.name === filterPort);
          return port?.type === 'LOGISTICS';
      }
      return allowedPorts.length > 0 && allowedPorts.every(p => p.type === 'LOGISTICS');
  }, [allowedPorts, filterPort, ports]);

  const initialFormState: Partial<Consignment> = {
      bayanNumber: '',
      permitNumber: '',
      importer: '',
      exporter: '',
      port: filterPort !== 'ALL' && ports.find(p => p.name === filterPort)?.type !== 'LOGISTICS' ? filterPort : (allowedPorts.find(p => p.type !== 'LOGISTICS')?.name || allowedPorts[0]?.name || 'ميناء صحار'), 
      arrivalDate: new Date().toISOString().split('T')[0],
      items: [],
      containerCount: 1,
      containerNumber: '',
      hasSample: false,
      inspectionResult: 'قيد الفحص',
      status: 'Pending',
      riskScore: 0,
      inspectorName: currentUser.name,
      fees: 0,
      vetCategory: 'MEAT_DAIRY',
      technicalAction: '',
      correspondenceNumber: '',
      reExportBayan: '',
      destructionAttachment: '',
      transferTo: '',
      inquiryType: '',
      conditionalReleaseType: '',
      clearanceOffice: '',
      customsBroker: '',
      brokerPhone: '',
      isLocked: false,
      hasUndertaking: false,
      originPort: '',
      containerTemp: '',
      inspectionDate: new Date().toISOString().split('T')[0],
      inspectionLocation: filterPort !== 'ALL' && ports.find(p => p.name === filterPort)?.type !== 'LOGISTICS' ? filterPort : (allowedPorts.find(p => p.type !== 'LOGISTICS')?.name || allowedPorts[0]?.name || 'ميناء صحار'),
      rejectionDetails: '',
      storeName: '',
      storeLicense: '',
      undertakingCompletionDate: '',
      inspectionNotes: '',
      remarks: '',
      declarationType: '',
      direction: ConsignmentDirection.INBOUND,
      containerType: '',
      inspectionType: '',
      shippingCountry: '',
      undertakingType: '',
      treatmentDate: '',
      treatmentType: '',
      treatmentConcentration: '',
      treatmentChemicals: '',
      treatmentExposureDuration: '',
      treatmentTemperature: '',
      treatmentCertificateRef: '',
      intendedUse: 'استهلاك آدمي',
      sealNumber: '',
  };
  const initialItemState: Partial<ConsignmentItem> = { 
    packagingUnit: 'كرتون',
    commodityGroup: '',
    description: '',
    brand: '',
    batchNumber: '',
    origin: '',
    weight: 0,
    packageCount: 0,
    productionDate: '',
    expiryDate: '',
    producingCompany: '',
    storageTemp: '',
    activeIngredients: [],
    pesticideName: '',
    pesticideType: '',
  };
  const [formData, setFormData] = useState<Partial<Consignment>>(initialFormState);
  const [currentItem, setCurrentItem] = useState<Partial<ConsignmentItem>>(initialItemState);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  
  // تفعيل خيارات خاصة (أدوية بيطرية)
  const [isVetMedicine, setIsVetMedicine] = useState(false);

  const [newSample, setNewSample] = useState<Partial<Sample>>({ 
    labAnalysisType: [], 
    itemIds: [],
    labName: '',
    labDelegate: '',
    sampleSize: '',
    sampleCondition: '',
    sampleSeal: '',
    notes: ''
  });
  const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
  const [showLabForm, setShowLabForm] = useState(false);
  const [qrSampleId, setQrSampleId] = useState<string | null>(null);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, confirmText?: string, cancelText?: string, isDestructive?: boolean, onConfirm: () => void} | null>(null);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);

  const translateConsignment = async (c: Consignment) => {
    if (!process.env.GEMINI_API_KEY) {
      showToast("عذراً، خدمة الترجمة غير مفعلة (مفتاح API مفقود)", 'error');
      return;
    }

    setIsTranslating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `You are a professional translator for agricultural and veterinary health certificates from Arabic to English.
Translate the following consignment data into formal English. 
Return the result in JSON format ONLY.

Data to translate:
- Importer/Company Name: ${c.importer}
- Exporter/Origin Company: ${c.exporter || '-'}
- Shipping Country: ${c.shippingCountry || '-'}
- Port: ${c.port || '-'}
- Intended Use: ${c.intendedUse || '-'}
- Items Descriptions: ${c.items.map(it => it.description).join(', ')}

Expected JSON format:
{
  "enImporter": "translated name",
  "enExporter": "translated name",
  "enShippingCountry": "translated name",
  "enPort": "translated name",
  "enIntendedUse": "translated name",
  "enItems": ["translated item 1", "translated item 2", ...]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const result = JSON.parse(response.text);
      
      const updatedConsignment: Consignment = {
        ...c,
        enImporter: result.enImporter,
        enExporter: result.enExporter,
        enShippingCountry: result.enShippingCountry,
        enPort: result.enPort,
        enIntendedUse: result.enIntendedUse,
        items: c.items.map((it, idx) => ({
          ...it,
          enDescription: result.enItems?.[idx] || it.enDescription
        }))
      };

      onUpdate(updatedConsignment);
      showToast("تمت ترجمة أطراف المعاملة والبنود بنجاح", 'success');
    } catch (error) {
      console.error("Translation error:", error);
      showToast("فشلت عملية الترجمة الآلية. يرجى المحاولة لاحقاً", 'error');
    } finally {
      setIsTranslating(false);
    }
  };

  const duplicateConsignment = useMemo(() => {
      if (!formData.bayanNumber) return null;
      return consignments.find(c => 
          c.bayanNumber.trim() === formData.bayanNumber?.trim() && 
          c.id !== editingId
      );
  }, [formData.bayanNumber, consignments, editingId]);

  const duplicatePermitConsignment = useMemo(() => {
      if (!formData.permitNumber) return null;
      return consignments.find(c => 
          c.permitNumber?.trim() === formData.permitNumber?.trim() && 
          c.id !== editingId
      );
  }, [formData.permitNumber, consignments, editingId]);

  const bayanError = duplicateConsignment && !isLCLConfirmed ? 'رقم البيان مكرر في النظام' : undefined;
  const permitError = duplicatePermitConsignment ? `رقم التصريح مستخدم مسبقاً في المعاملة رقم: ${duplicatePermitConsignment.bayanNumber}` : undefined;

  const isOutbound = useMemo(() => {
      return formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير' || formData.direction === ConsignmentDirection.OUTBOUND;
  }, [formData.declarationType, formData.direction]);

  useEffect(() => {
    if (consignments.length > 0 && !showModal) {
        const stateViewId = location.state?.viewId;
        const urlId = searchParams.get('id');
        const targetId = stateViewId || urlId;
        if (targetId) {
            const targetConsignment = consignments.find(c => c.id === targetId || c.bayanNumber === targetId);
            if (targetConsignment) {
                handleOpenEdit(targetConsignment);
                if (urlId) setSearchParams({}, { replace: true });
            }
        }
    }
  }, [consignments, location.state, searchParams, showModal]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && showModal) {
        e.preventDefault(); e.returnValue = ''; 
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, showModal]);

  useEffect(() => {
    if (showModal) {
      window.history.pushState({ modalOpen: true }, '', window.location.href);
      const handlePopState = (event: PopStateEvent) => {
        if (hasUnsavedChanges) {
            window.history.pushState({ modalOpen: true }, '', window.location.href);
            alert("تنبيه: لديك تغييرات غير محفوظة. يرجى الحفظ أو الإغلاق من الزر المخصص.");
        } else {
            setShowModal(false); setEditingId(null); setFormData(initialFormState); setIsLCLConfirmed(false); setFormNotification(null);
        }
      };
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [showModal, hasUnsavedChanges]);

  useEffect(() => {
      const loadLabs = async () => {
          const data = await FB.getCollection('laboratories');
          setLaboratories(data as Laboratory[]);
      };
      loadLabs();
  }, []);

  const currentPortObj = useMemo(() => ports.find(p => p.name === formData.port), [ports, formData.port]);
  const isLogisticsPort = currentPortObj?.type === 'LOGISTICS';
  const isLockedForUser = formData.isLocked && !['ADMIN', 'MANAGER'].includes(currentUser.role);
  
  // --- Role-Based Permission Logic ---
  const userAssignedPortNames = useMemo(() => {
    if (!currentUser || !ports.length) return [];
    if (currentUser.role === 'ADMIN') return ports.map(p => p.name);
    const assignedIds = currentUser.assignedPorts || [];
    return ports.filter(p => assignedIds.includes(p.id)).map(p => p.name);
  }, [currentUser, ports]);

  const isTransferredToMe = useMemo(() => {
    if (!formData.transferTo || currentUser.role !== 'LOGISTICS') return false;
    return userAssignedPortNames.includes(formData.transferTo) && formData.port !== formData.transferTo;
  }, [formData.transferTo, formData.port, userAssignedPortNames, currentUser.role]);

  const isReadOnly = useMemo(() => {
    if (currentUser.role === 'VIEWER') return true;
    if (isLockedForUser) {
        // Only LOGISTICS can edit locked if it's at their port (for receiving/processing)
        return !(currentUser.role === 'LOGISTICS' && isLogisticsPort);
    }
    // If not locked, check role-specific restrictions
    if (currentUser.role === 'LOGISTICS') {
        if (!formData.id) return false; // Allowed to edit new consignments (will be forced to OUTBOUND implicitly by declarationType restriction)
        const isAtMyPort = userAssignedPortNames.includes(formData.port);
        const isOutbound = formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير';
        // Can edit if it is an outbound consignment at their port, OR it is transferred to them
        return !( (isOutbound && isAtMyPort) || isTransferredToMe );
    }
    return false;
  }, [currentUser.role, isLockedForUser, isLogisticsPort, userAssignedPortNames, formData.port, formData.direction, isTransferredToMe]);

  const isViewOnly = isReadOnly; 
  const canViewAuditLog = permissions.canViewAudit;
  const canChangeInspector = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';
  const canFilterOthers = ['ADMIN', 'MANAGER'].includes(currentUser.role);

  const canEditStep = (stepId: number) => {
    if (isReadOnly) return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') return true;
    
    switch (currentUser.role) {
      case 'INSPECTOR':
      case 'LOGISTICS':
        return stepId <= 5;
      case 'LAB_TECH':
        return stepId === 3; // Lab techs only edit samples
      default:
        return false;
    }
  };

  const canViewStep = (stepId: number) => {
    if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') return true;
    
    switch (currentUser.role) {
      case 'INSPECTOR':
      case 'LOGISTICS':
        return stepId <= 6;
      case 'VIEWER':
        return stepId <= 5;
      case 'LAB_TECH':
        return stepId === 3 || stepId === 4;
      default:
        return false;
    }
  };

  const maxVisibleStep = useMemo(() => {
    const visibleSteps = STEPS.filter(s => canViewStep(s.id));
    return Math.max(...visibleSteps.map(s => s.id));
  }, [canViewStep]);

  const handleLogisticsReceive = async () => {
    if (!formData.id) return;
    if (window.confirm(`تأكيد استلام الشحنة رقم ${formData.bayanNumber} في ${formData.transferTo}؟`)) {
        try {
            const logEntry: AuditLogEntry = {
                timestamp: new Date().toISOString(),
                action: 'تأكيد وصول (من السجل اليومي)',
                user: currentUser.name,
                details: `تم استلام الإرسالية في ${formData.transferTo} بواسطة ${currentUser.name}.`
            };

            const updated: Consignment = {
                ...formData as Consignment,
                logisticsArrivalDate: new Date().toISOString(),
                port: formData.transferTo || formData.port,
                inspectionLocation: formData.transferTo || formData.port, // تغيير موقع المعاينة
                logisticsReceiverName: currentUser.name, // تعيين اسم الموظف اللوجستي
                technicalAction: 'استلام في اللوجستية', 
                status: 'Pending',
                inspectionResult: 'قيد الفحص', 
                isLocked: false,
                items: (formData.items || []).map(item => ({ ...item, technicalAction: 'استلام في اللوجستية' })),
                auditLog: [...(formData.auditLog || []), logEntry]
            };
            await onUpdate(updated);
            setFormData(updated);
            showToast("تم استلام الإرسالية بنجاح", "success");
        } catch (error) {
            showToast("حدث خطأ أثناء الاستلام", "error");
        }
    }
  };

  const compatibleLabs = useMemo(() => {
      if (!newSample.labAnalysisType || newSample.labAnalysisType.length === 0) return [];
      return laboratories.filter(lab => 
          newSample.labAnalysisType!.some(type => lab.testTypes?.includes(type))
      );
  }, [laboratories, newSample.labAnalysisType]);

  const availableDelegates = useMemo(() => {
      const selectedLab = laboratories.find(l => l.name === newSample.labName);
      return selectedLab ? selectedLab.delegates : [];
  }, [laboratories, newSample.labName]);

  const isFeeExempt = formData.declarationType === 'عبور (ترانزيت)';
  
  const importerOptions = (importers || [])
    .filter(i => i && i.isActive && i.name)
    .map(i => ({ label: i.name, value: i.name, subLabel: i.crNumber }));
  
  const inspectorOptions = (users || [])
    .filter(u => u && u.isActive && (u.role === 'ADMIN' || u.allowedSectors?.includes(activeSector)))
    .map(u => ({ label: u.name, value: u.name, subLabel: u.jobTitle }));

  const clearanceOfficeOptions = (clearanceOffices || []).map(o => ({ label: o.name, value: o.name }));

  const currentImporterData = importers.find(i => i.name === formData.importer);
  
  const importerStats = useMemo(() => {
      if (!formData.importer) return null;
      const history = consignments.filter(c => c.importer === formData.importer);
      const total = history.length;
      const approved = history.filter(c => c.status === 'Approved').length;
      const rejected = history.filter(c => c.status === 'Rejected').length;
      
      // Get top commodities
      const commodityCounts: Record<string, number> = {};
      history.forEach(c => {
          if (c.commodityGroup) {
              commodityCounts[c.commodityGroup] = (commodityCounts[c.commodityGroup] || 0) + 1;
          }
      });
      const topCommodities = Object.entries(commodityCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([name]) => name);

      // Get last activity
      const lastAction = history.length > 0 
          ? history.sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime())[0]
          : null;

      const complianceRate = total > 0 ? Math.round((approved / total) * 100) : 100;
      
      return {
          total,
          approved,
          rejected,
          activeUndertakings: history.filter(c => c.hasUndertaking && !c.isUndertakingMet).length,
          samplesCount: history.filter(c => c.hasSample).length,
          violations: history.filter(c => c.samples?.some(s => s.result === 'NonCompliant')).length,
          topCommodities,
          lastActivity: lastAction?.arrivalDate,
          complianceRate,
          importerData: currentImporterData
      };
  }, [formData.importer, consignments, currentImporterData]);

  const filteredCommodityGroups = commodityGroups.filter(g => g.sector === activeSector);
  const availableProducts = useMemo(() => {
      if (currentItem.commodityGroup) {
          const group = filteredCommodityGroups.find(g => g.name === currentItem.commodityGroup);
          return group ? group.products.sort() : [];
      }
      return filteredCommodityGroups.flatMap(g => g.products).sort();
  }, [filteredCommodityGroups, currentItem.commodityGroup]);

  const consignmentQuotaStats = useMemo(() => {
    if (!formData.items || formData.items.length === 0) return [];
    
    const currentMonth = new Date().toISOString().slice(0, 7);
    
    return formData.items.map(item => {
        const matchingPlan = samplingPlans?.find(plan => {
            if (!plan.active || plan.sector !== activeSector) return false;
            const productMatch = plan.productName === 'الكل' || plan.productName.trim().toLowerCase() === item.description.trim().toLowerCase();
            if (!productMatch) return false;
            const importerMatch = !plan.targetImporters || plan.targetImporters.length === 0 || 
                (formData.importer && plan.targetImporters.some(imp => formData.importer?.toLowerCase().includes(imp.toLowerCase())));
            if (!importerMatch) return false;
            const exporterMatch = !plan.targetExporters || plan.targetExporters.length === 0 || 
                (formData.exporter && plan.targetExporters.some(exp => formData.exporter?.toLowerCase().includes(exp.toLowerCase())));
            if (!exporterMatch) return false;
            const originMatch = !plan.targetOrigins || plan.targetOrigins.length === 0 || 
                (item.origin && plan.targetOrigins.some(org => item.origin?.toLowerCase().includes(org.toLowerCase())));
            if (!originMatch) return false;
            return true;
        });

        if (!matchingPlan) return { itemId: item.id, plan: null };

        let takenCount = 0;
        consignments.forEach(c => {
            if (c.arrivalDate.startsWith(currentMonth) && c.hasSample) {
                const hasItem = c.items.some(i => {
                    const productMatch = matchingPlan.productName === 'الكل' || i.description.trim().toLowerCase() === matchingPlan.productName.trim().toLowerCase();
                    const originMatch = !matchingPlan.targetOrigins || matchingPlan.targetOrigins.length === 0 || 
                        (i.origin && matchingPlan.targetOrigins.some(org => i.origin?.toLowerCase().includes(org.toLowerCase())));
                    return productMatch && originMatch;
                });
                const importerMatch = !matchingPlan.targetImporters || matchingPlan.targetImporters.length === 0 || 
                    (c.importer && matchingPlan.targetImporters.some(imp => c.importer?.toLowerCase().includes(imp.toLowerCase())));
                const exporterMatch = !matchingPlan.targetExporters || matchingPlan.targetExporters.length === 0 || 
                    (c.exporter && matchingPlan.targetExporters.some(exp => c.exporter?.toLowerCase().includes(exp.toLowerCase())));
                
                if (hasItem && importerMatch && exporterMatch) takenCount++;
            }
        });

        return {
            itemId: item.id,
            plan: matchingPlan,
            taken: takenCount,
            quota: matchingPlan.monthlyQuota,
            remaining: Math.max(0, matchingPlan.monthlyQuota - takenCount)
        };
    });
  }, [formData.items, formData.importer, formData.exporter, samplingPlans, activeSector, consignments]);

  const activeRiskStats = useMemo(() => {
      if (!currentItem.description) return null;
      const matchingPlan = samplingPlans?.find(plan => {
          if (!plan.active || plan.sector !== activeSector) return false;
          
          // Check Product Name
          const productMatch = plan.productName === 'الكل' || plan.productName.trim().toLowerCase() === currentItem.description?.trim().toLowerCase();
          if (!productMatch) return false;

          // Check Importer
          const importerMatch = !plan.targetImporters || plan.targetImporters.length === 0 || 
              (formData.importer && plan.targetImporters.some(imp => formData.importer?.toLowerCase().includes(imp.toLowerCase())));
          if (!importerMatch) return false;

          // Check Exporter
          const exporterMatch = !plan.targetExporters || plan.targetExporters.length === 0 || 
              (formData.exporter && plan.targetExporters.some(exp => formData.exporter?.toLowerCase().includes(exp.toLowerCase())));
          if (!exporterMatch) return false;

          // Check Origin
          const originMatch = !plan.targetOrigins || plan.targetOrigins.length === 0 || 
              (currentItem.origin && plan.targetOrigins.some(org => currentItem.origin?.toLowerCase().includes(org.toLowerCase())));
          if (!originMatch) return false;

          return true;
      });
      if (!matchingPlan) return null;
      const currentMonth = new Date().toISOString().slice(0, 7); 
      let takenCount = 0;
      consignments.forEach(c => {
          if (c.arrivalDate.startsWith(currentMonth) && c.hasSample) {
              const hasItem = c.items.some(i => {
                  const productMatch = matchingPlan.productName === 'الكل' || i.description.trim().toLowerCase() === matchingPlan.productName.trim().toLowerCase();
                  const originMatch = !matchingPlan.targetOrigins || matchingPlan.targetOrigins.length === 0 || 
                      (i.origin && matchingPlan.targetOrigins.some(org => i.origin?.toLowerCase().includes(org.toLowerCase())));
                  return productMatch && originMatch;
              });
              const importerMatch = !matchingPlan.targetImporters || matchingPlan.targetImporters.length === 0 || 
                  (c.importer && matchingPlan.targetImporters.some(imp => c.importer?.toLowerCase().includes(imp.toLowerCase())));
              const exporterMatch = !matchingPlan.targetExporters || matchingPlan.targetExporters.length === 0 || 
                  (c.exporter && matchingPlan.targetExporters.some(exp => c.exporter?.toLowerCase().includes(exp.toLowerCase())));
              
              if (hasItem && importerMatch && exporterMatch) takenCount++;
          }
      });
      return { plan: matchingPlan, taken: takenCount, quota: matchingPlan.monthlyQuota, remaining: Math.max(0, matchingPlan.monthlyQuota - takenCount), yearlyTotal: matchingPlan.monthlyQuota * 12 };
  }, [currentItem.description, currentItem.origin, formData.importer, formData.exporter, samplingPlans, activeSector, consignments]);

  const isAgriSector = activeSector === ConsignmentType.AGRICULTURAL;
  const riskAlert = formData.riskScore && formData.riskScore > 60 ? { plan: { riskLevel: 'HIGH' }, item: 'Item' } : null;

  useEffect(() => {
      if (editingId) {
          const unsub = FB.subscribeToCertificateTemplates(activeSector, setTemplates);
          return () => unsub();
      } else setTemplates([]);
  }, [activeSector, editingId]);

  useEffect(() => {
      if (editingId && (activeStep === 4 || formViewMode === 'SCROLL')) {
          const unsub = FB.subscribeToCollection('documents', (allDocs: AppDocument[]) => {
              const myDocs = allDocs.filter(d => d.consignmentId === editingId);
              
              const sampleDocs = formData.samples
                ?.filter(s => s.resultFileUrl)
                .map(s => ({
                    id: `sample-res-${s.sampleId}`,
                    consignmentId: editingId,
                    type: s.resultFileName?.toLowerCase().endsWith('.pdf') ? 'DOC' : 'IMG',
                    url: s.resultFileUrl!,
                    title: `نتيجة التحليل المخبري - العينة ${s.sampleId}`,
                    date: s.completedDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                    fileType: s.resultFileName?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
                    uploadedBy: 'المختبر'
                } as AppDocument)) || [];

              const certTitleKeyword = activeSector === ConsignmentType.VETERINARY ? 'بيطرية' : (activeSector === ConsignmentType.AGRICULTURAL ? 'نباتية' : '');
              const healthCert = isOutbound ? templates.find(t => 
                  t.country === formData.shippingCountry && 
                  (certTitleKeyword ? t.title.includes(certTitleKeyword) : true)
              ) : null;
              const certDocs = healthCert ? [{
                  id: `cert-${healthCert.id}`,
                  consignmentId: editingId,
                  type: 'CERT',
                  url: healthCert.url,
                  title: activeSector === ConsignmentType.VETERINARY ? 'الشهادة الصحية البيطرية' : (activeSector === ConsignmentType.AGRICULTURAL ? 'شهادة الصحة النباتية' : healthCert.title),
                  date: new Date().toISOString().split('T')[0],
                  fileType: healthCert.fileType,
                  uploadedBy: 'النظام'
              } as AppDocument] : [];
                
              const existingTitles = new Set(myDocs.map(d => d.title));
              const uniqueDocs = [...sampleDocs, ...certDocs].filter(sd => !existingTitles.has(sd.title));
              
              setCurrentDocs([...myDocs, ...uniqueDocs]);
          });
          return () => unsub();
      } else setCurrentDocs([]);
  }, [editingId, activeStep, formViewMode, formData.samples, templates, formData.shippingCountry, isOutbound]);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'error') => {
      setFormNotification({ message, type });
      setTimeout(() => setFormNotification(null), 4000);
  };

  const copyDeepLink = () => {
      const baseUrl = window.location.href.split('?')[0].split('#')[0]; 
      const link = `${baseUrl}#/portal?id=${formData.id || editingId}`;
      navigator.clipboard.writeText(link).then(() => { showToast('تم نسخ رابط المعاملة المباشر', 'success'); }).catch(() => { showToast('فشل نسخ الرابط', 'error'); });
  };

  const calculateChanges = (original: Consignment, current: Partial<Consignment>): AuditChange[] => {
      const changes: AuditChange[] = [];
      const fieldsToCheck = AUDIT_FIELDS;
      fieldsToCheck.forEach(key => {
          const oldVal = (original as any)[key];
          const newVal = (current as any)[key];
          if (oldVal != newVal) {
              if (!oldVal && !newVal) return;
              let label = getAuditFieldLabel(key, systemSettings);
              const decType = current.declarationType || original.declarationType;
              const isExport = decType === 'تصدير' || decType === 'إعادة تصدير';
              if (key === 'importer' && isExport) label = 'المصدر';
              if (key === 'exporter' && isExport) label = 'المستورد / الوجهة';
              changes.push({ field: key, label: label, oldValue: oldVal === undefined || oldVal === null ? 'غير محدد' : String(oldVal), newValue: newVal === undefined || newVal === null ? 'غير محدد' : String(newVal) });
          }
      });
      return changes;
  };

  const validateStep = (step: number) => {
      const missing: string[] = [];
      if (step === 1) {
          if (!formData.bayanNumber && !isOutbound) missing.push('رقم البيان');
          if (!formData.declarationType) missing.push('نوع البيان');
          if (!formData.shippingCountry) missing.push('بلد الشحن');
          if (!formData.importer) missing.push((formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') ? 'اسم الشركة المصدرة' : 'اسم الشركة المستوردة');
          if (!formData.containerType) missing.push('نوع الحاوية');
          if (!formData.port) missing.push('المنفذ');
          if (!formData.containerCount || Number(formData.containerCount) <= 0) missing.push('عدد الحاويات');
          if (!formData.clearanceOffice && !isOutbound) missing.push('مكتب التخليص');
          if (duplicateConsignment && !isLCLConfirmed && !isOutbound) return { valid: false, message: 'رقم البيان مكرر في النظام. يرجى تأكيد LCL أو تغيير الرقم للمتابعة.' };
      }
      if (step === 2) { if (!formData.items || formData.items.length === 0) missing.push('يجب إضافة منتج واحد على الأقل للقائمة'); }
      if (step === 3) { if (!formData.inspectionType) missing.push('نوع الفحص'); if (!formData.inspectionResult) missing.push('نتيجة الفحص / المعاينة'); }
      if (missing.length > 0) return { valid: false, message: `تنبيه: يرجى إدخل البيانات المطلوبة للانتقال:\n- ${missing.join('\n- ')}` };
      return { valid: true };
  };

  const handleNextStep = () => {
      const validation = validateStep(activeStep);
      if (!validation.valid) { showToast(validation.message!, 'error'); return; }
      setActiveStep(prev => prev + 1);
  };

  const handleStepClick = (stepId: number) => {
      if (formViewMode === 'SCROLL') {
          const sectionId = `step-section-${stepId}`;
          const el = document.getElementById(sectionId);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveStep(stepId); return;
      }
      if (stepId < activeStep) { setActiveStep(stepId); return; }
      const validation = validateStep(activeStep);
      if (!validation.valid && stepId > activeStep) { showToast(validation.message!, 'error'); return; }
      setActiveStep(stepId);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsImporting(true);
          try {
              const file = e.target.files[0];
              const importedData = await parseConsignmentsFromExcel(file, activeSector, currentUser.name);
              let count = 0;
              for (const item of importedData) { await onAdd(item); count++; }
              showToast(`تم استيراد ${count} معاملة بنجاح.`, 'success');
          } catch (error) { showToast('حدث خطأ أثناء استيراد الملف. يرجى التأكد من استخدام النموذج الصحيح.', 'error'); } finally { setIsImporting(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
      }
  };

  const getRowRiskClassName = (c: Consignment) => {
    if (c.riskScore > 80) return 'bg-red-50/90 hover:bg-red-100 ring-2 ring-inset ring-red-600 animate-pulse-subtle shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    if (c.riskScore > 60) return 'bg-red-50/70 hover:bg-red-50/90 ring-1 ring-inset ring-red-500/20';
    if (c.riskScore > 30) return 'bg-amber-50/70 hover:bg-amber-50/90 ring-1 ring-inset ring-amber-500/20';
    return '';
  };

  const getFilteredConsignments = () => {
    const searchLower = globalSearchTerm.toLowerCase().trim();
    const hasSearch = searchLower.length >= 2;

    let filtered = consignments.filter(c => {
      if (c.type !== activeSector) return false;

      // Global Search Logic (Overrides Date Filters)
      if (hasSearch) {
        const matchesSearch = 
            c.bayanNumber?.toLowerCase().includes(searchLower) ||
            c.id?.toLowerCase().includes(searchLower) ||
            c.importer?.toLowerCase().includes(searchLower) ||
            c.exporter?.toLowerCase().includes(searchLower) ||
            c.permitNumber?.toLowerCase().includes(searchLower) ||
            c.port?.toLowerCase().includes(searchLower) ||
            c.items?.some(i => 
                i.description?.toLowerCase().includes(searchLower) || 
                i.hsCode?.toLowerCase().includes(searchLower)
            );
        
        if (!matchesSearch) return false;
      } else {
          // Date Filters are only active when not searching
          if (filterDay && String(c.arrivalDate || '') !== filterDay) return false;
          if (!filterDay && filterMonth && !String(c.arrivalDate || '').startsWith(filterMonth)) return false;
      }

      // Other Filters
      if (filterPort !== 'ALL') {
          if (c.port !== filterPort) return false;
      } else {
          if (!allowedPorts.some(p => p.name === c.port)) return false;
      }

      if (filterInspector !== 'ALL' && c.inspectorName !== filterInspector) return false;
      
      if (filterStatus !== 'ALL') {
          if (filterStatus === 'APPROVED') { if (c.status !== 'Approved') return false; }
          else if (filterStatus === 'REJECTED') { if (c.status !== 'Rejected') return false; }
          else if (filterStatus === 'PENDING') { if (c.status !== 'Pending') return false; }
      }

      if (filterRisk !== 'ALL') {
          if (filterRisk === 'HIGH' && (c.riskScore || 0) <= 60) return false;
          if (filterRisk === 'MEDIUM' && ((c.riskScore || 0) <= 30 || (c.riskScore || 0) > 60)) return false;
          if (filterRisk === 'LOW' && (c.riskScore || 0) > 30) return false;
      }

      if (filterSamples !== 'ALL') {
          if (filterSamples === 'YES' && !c.hasSample) return false;
          if (filterSamples === 'NO' && c.hasSample) return false;
      }

      if (filterAction !== 'ALL' && c.technicalAction !== filterAction && c.rejectionAction !== filterAction) return false;
      if (filterDeclarationType !== 'ALL' && c.declarationType !== filterDeclarationType) return false;
      
      const isOutgoing = c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير';
      if (logType === 'INCOMING' && isOutgoing) return false;
      if (logType === 'OUTGOING' && !isOutgoing) return false;

      if (filterCommodity !== 'ALL' && !(c.commodityGroup === filterCommodity || c.items?.some(i => i.commodityGroup === filterCommodity))) return false;
      if (filterOrigin !== 'ALL' && !(c.shippingCountry === filterOrigin || c.items?.some(i => i.origin === filterOrigin))) return false;
      
      return true;
    });
    return filtered.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.arrivalDate || 0).getTime();
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.arrivalDate || 0).getTime();
        return timeB - timeA;
    });
  };

  const processedConsignments = useMemo(() => getFilteredConsignments(), [ consignments, activeSector, filterMonth, filterDay, filterPort, filterInspector, filterStatus, filterAction, filterCommodity, filterOrigin, filterDeclarationType, filterRisk, filterSamples, logType, globalSearchTerm ]);

  const handleKanbanUpdate = async (id: string, newStep: WorkflowStep) => {
      const consignment = consignments.find(c => c.id === id);
      if (!consignment) return;
      const logEntry: AuditLogEntry = { timestamp: new Date().toISOString(), action: 'تحديث حالة (لوحة المهام)', user: currentUser.name, details: `تم تغيير المرحلة إلى ${newStep}`, };
      const updated: Consignment = { ...consignment, currentStep: newStep, auditLog: [...(consignment.auditLog || []), logEntry] };
      await onUpdate(updated); showToast('تم تحديث مرحلة المعاملة', 'success');
  };

  const fileToBase64 = (file: File): Promise<string> => { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result as string); reader.onerror = error => reject(error); }); };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length || !editingId) return;
      const file = e.target.files[0];
      if (file.size > 2 * 1024 * 1024) { showToast("حجم الملف كبير جداً. الحد الأقصى 2 ميجابايت.", 'error'); return; }
      setIsUploadingDoc(true);
      try {
          const base64Data = await fileToBase64(file);
          const newDoc: AppDocument = { id: Math.random().toString(36).substr(2, 9), consignmentId: editingId, type: file.type.includes('pdf') ? 'DOC' : 'IMG', url: base64Data, title: file.name, date: new Date().toISOString().split('T')[0], fileType: file.type, uploadedBy: currentUser.name };
          await FB.addDocumentToDB(newDoc); showToast("تم رفع المستند بنجاح", 'success');
      } catch (err) { showToast("فشل رفع المستند", 'error'); } finally { setIsUploadingDoc(false); e.target.value = ''; }
  };

  const handleDeleteDoc = async (docId: string) => { if (window.confirm('حذف المستند نهائياً؟')) { await FB.deleteDocumentFromDB(docId); showToast("تم حذف المستند", 'success'); } };

  const columns = useMemo<ColumnDef<Consignment>[]>(() => [
    {
      id: 'expander',
      header: () => null,
      cell: ({ row }) => (
        <button
          onClick={row.getToggleExpandedHandler()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <i className={`fas fa-chevron-${row.getIsExpanded() ? 'up' : 'down'}`}></i>
        </button>
      ),
    },
    { 
      id: 'bayanNumber',
      accessorFn: (row) => row.direction === ConsignmentDirection.OUTBOUND ? row.id : `${row.bayanNumber} ${row.permitNumber || ''}`,
      header: 'المعرف / البيان', 
      cell: (info) => { 
        const c = info.row.original; 
        const isOutboundRow = c.direction === ConsignmentDirection.OUTBOUND;
        return ( 
          <div className="flex flex-col"> 
            <div className="flex items-center gap-2"> 
              <span className="font-black text-slate-800 text-sm">
                {isOutboundRow ? c.id : (c.bayanNumber || 'قيد التسجيل')}
              </span> 
              {c.isLocked && <i className="fas fa-lock text-red-500 text-[10px]" title="معاملة مقفلة"></i>} 
            </div> 
            <div className="flex flex-col mt-1"> 
              {!isOutboundRow && <span className="text-[10px] text-slate-400 font-mono">{c.id}</span>} 
              {c.permitNumber && <span className="text-[10px] text-emerald-600 font-bold mt-0.5">تصريح: {c.permitNumber}</span>}
              <div className="flex gap-2 items-center"> 
                <span className="text-[9px] text-slate-300 font-mono">{safeFormatDateTime(c.createdAt)}</span> 
                {(filterPort === 'ALL' || allowedPorts.length > 1) && ( 
                  <span className="text-[8px] bg-emerald-50 text-emerald-600 px-1.5 rounded border border-emerald-100">{c.port}</span> 
                )} 
              </div> 
            </div> 
          </div> 
        ); 
      } 
    },
    { 
      accessorKey: 'arrivalDate', 
      header: 'التاريخ', 
      cell: info => <span className="text-xs font-bold text-slate-600 font-mono">{info.getValue() as string || '-'}</span> 
    },
    { 
      accessorKey: 'importer', 
      header: (info) => {
        const c = info.table.getRowModel().rows[0]?.original;
        return (c?.declarationType === 'تصدير' || c?.declarationType === 'إعادة تصدير') ? 'المصدر' : 'المستورد';
      },
      cell: info => <span className="font-bold text-slate-700">{info.getValue() as string || '---'}</span> 
    },
    { 
      id: 'itemDescription', 
      accessorFn: (row) => row.items && row.items.length > 0 ? row.items[0].description : 'بانتظار الإدخال',
      header: 'الشحنة', 
      cell: (info) => { 
        const c = info.row.original; 
        return ( 
          <div className="flex flex-col"> 
            <span className="text-xs font-bold text-slate-700"> {c.items && c.items.length > 0 ? c.items[0].description : 'بانتظار الإدخال'} </span> 
            {c.items && c.items.length > 1 && ( <span className="text-[9px] text-slate-400 font-bold">+{c.items.length - 1} أصناف أخرى</span> )} 
          </div> 
        ); 
      } 
    },
    { 
      accessorKey: 'inspectionResult', 
      header: 'الفحص والمختبر', 
      cell: (info) => { 
        const c = info.row.original; 
        return ( 
          <div className="flex flex-col items-center gap-1"> 
            <span className="text-[10px] font-bold text-slate-600">{c.inspectionResult || '---'}</span> 
            {c.hasSample && ( <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200"> {c.samples?.length || 1} عينات </span> )} 
          </div> 
        ); 
      } 
    },
    { 
      accessorKey: 'technicalAction', 
      header: 'الإجراء / الحالة', 
      cell: (info) => { 
        const c = info.row.original; 
        const isApproved = c.status === 'Approved'; 
        const isRejected = c.status === 'Rejected'; 
        const displayStatusText = isApproved ? 'مفرج عنه' : isRejected ? 'مرفوض' : c.technicalAction || 'قيد الإجراء'; 
        return ( 
          <div className="flex flex-col items-center justify-center gap-1"> 
            <span className={`px-3 py-1 rounded-full text-[10px] font-black print:border print:border-black ${ isApproved ? 'bg-green-50 text-green-700' : isRejected ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700' }`}> {displayStatusText} </span> 
            {c.rejectionAction && isRejected && ( <span className="text-[9px] font-bold text-red-500">({c.rejectionAction})</span> )} 
            <div className={`w-2 h-2 rounded-full mt-1 print:hidden ${c.riskScore > 60 ? 'bg-red-500 animate-pulse' : c.riskScore > 30 ? 'bg-amber-400' : 'bg-green-400'}`} title={`مخاطر: ${c.riskScore}%`}></div> 
          </div> 
        ); 
      } 
    },
    { 
      id: 'actions', 
      header: 'الإجراء', 
      cell: (info) => { 
        const c = info.row.original; 
        return ( 
          <div className="flex items-center justify-center gap-2"> 
            <button onClick={() => handleOpenEdit(c)} className="w-9 h-9 rounded-xl border transition-all hover:shadow-md flex items-center justify-center bg-white border-slate-100 text-slate-400 hover:text-blue-600" title="عرض التفاصيل / تعديل"> <i className="fas fa-eye"></i> </button> 
            {(c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير') && (c.type === ConsignmentType.AGRICULTURAL || c.type === ConsignmentType.VETERINARY) && (
              <button onClick={(e) => { e.stopPropagation(); handleViewCertificate(c); }} className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-md transition-all" title={c.type === ConsignmentType.VETERINARY ? "عرض الشهادة الصحية البيطرية" : "عرض الشهادة النباتية"}> <i className="fas fa-certificate"></i> </button>
            )}
            {permissions.canDelete && ( 
              <button onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, title: 'حذف المعاملة', message: `هل أنت متأكد من حذف الإرسالية رقم ${c.direction === ConsignmentDirection.OUTBOUND ? c.id : (c.bayanNumber || c.id)}؟`, onConfirm: () => onDelete(c.id) }); }} className="w-9 h-9 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-red-600 hover:shadow-md transition-all" title="حذف" > <i className="fas fa-trash-alt"></i> </button> 
            )} 
          </div> 
        ); 
      } 
    }
  ], [currentUser, filterPort, allowedPorts]);

  const calculateSuggestedFees = () => {
    if (formData.declarationType === 'ترانزيت') return 0;
    
    let total = 0;
    // Calculate totals directly from items to ensure they are always fresh
    const weight = formData.items?.reduce((acc, item) => acc + (Number(item.weight) || 0), 0) || 0;
    const itemsCount = formData.items?.length || 0;
    const packageCount = formData.items?.reduce((acc, item) => acc + (Number(item.packageCount) || 0), 0) || 0;
    const isExternal = formData.inspectionLocation?.includes('خارج') || formData.inspectionLocation?.includes('External');

    if (activeSector === ConsignmentType.FOOD_SAFETY) {
      // 10 OMR per certificate + 50 OMR if external
      // We'll treat each item as a potential certificate or just 1 per consignment.
      // Based on UsefulTools, it's a manual count of certs.
      // In the portal, we'll assume 1 certificate per consignment as a baseline, or use itemsCount.
      const certs = Math.max(1, itemsCount);
      total = (certs * 10) + (isExternal ? 50 : 0);
    } else if (activeSector === ConsignmentType.AGRICULTURAL) {
      // 1 OMR per ton, max 100 + 1 for certificate for Standard
      // 2 OMR per ton, max 200 + 1 for certificate for Treated
      if (isOutbound) {
        const isTreated = formData.inspectionResult === 'معالجة';
        if (isTreated) {
          total = Math.min(Math.ceil(weight / 1000) * 2, 200) + 1;
        } else {
          total = Math.min(Math.ceil(weight / 1000) * 1, 100) + 1;
        }
      } else {
        total = Math.min(Math.ceil(weight / 1000) * 1, 100);
      }
    } else if (activeSector === ConsignmentType.VETERINARY) {
      const category = formData.vetCategory || 'MEAT_DAIRY';
      if (category === 'LIVE_ANIMALS') {
        total = 5 + (packageCount * 0.5);
      } else if (category === 'MEAT_DAIRY') {
        total = Math.min(Math.ceil(weight / 1000) * 5, 100);
      } else if (category === 'FISH') {
        total = Math.min(Math.ceil(weight / 1000) * 5, 15);
      } else if (category === 'EGGS') {
        total = Math.min(packageCount * 0.1, 40);
      } else if (category === 'FODDER' || category === 'WASTE') {
        total = 30;
      } else {
        total = 10; // Default
      }
    }
    
    return Math.round(total * 100) / 100;
  };

  useEffect(() => {
    if (isReadOnly) return;
    
    // Only recalculate if sector is defined
    if (!activeSector) return;
    
    const suggested = calculateSuggestedFees();
    const currentWeight = formData.items?.reduce((acc, item) => acc + (Number(item.weight) || 0), 0) || 0;
    const currentPackageCount = formData.items?.reduce((acc, item) => acc + (Number(item.packageCount) || 0), 0) || 0;
    
    setFormData(prev => {
        let hasChanges = false;
        const newData = { ...prev };

        // Only auto-update fees if it's currently 0 or wasn't set yet
        // This prevents overwriting manual entries every time a dependency changes
        if (!prev.fees || prev.fees === 0) {
            if (prev.fees !== suggested) {
                newData.fees = suggested;
                hasChanges = true;
            }
        }
        
        if (prev.totalWeight !== currentWeight) {
            newData.totalWeight = currentWeight;
            hasChanges = true;
        }

        if (prev.totalPackageCount !== currentPackageCount) {
            newData.totalPackageCount = currentPackageCount;
            hasChanges = true;
        }

        return hasChanges ? newData : prev;
    });                
  }, [formData.items, formData.declarationType, formData.inspectionLocation, activeSector, formData.vetCategory, formData.inspectionResult, isReadOnly]);

  const applySuggestedFees = () => {
    const suggested = calculateSuggestedFees();
    setFormData(prev => ({ ...prev, fees: suggested }));
    showToast(`تم احتساب الرسوم المقترحة: ${suggested} ر.ع`, 'success');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      if (isReadOnly) return;
      const { name, value, type } = e.target;
      setHasUnsavedChanges(true); 
      setFormData(prev => {
          const newData = { ...prev, [name]: type === 'number' ? parseFloat(value) : value };
          if (name === 'bayanNumber') setIsLCLConfirmed(false);
          if (name === 'declarationType') {
              newData.direction = (value === 'تصدير' || value === 'إعادة تصدير') ? ConsignmentDirection.OUTBOUND : ConsignmentDirection.INBOUND;
          }
          if (name === 'technicalAction') {
              newData.inquiryType = '';
              if (value === 'إفراج نهائي') { newData.status = 'Approved'; newData.inspectionResult = 'مطابق'; newData.conditionalReleaseType = ''; newData.transferTo = ''; } 
              else if (value === 'رفض') { newData.status = 'Rejected'; newData.inspectionResult = 'غير مطابق'; newData.conditionalReleaseType = ''; newData.transferTo = ''; } 
              else if (value === 'إستفسار') { newData.status = 'Pending'; newData.inspectionResult = 'قيد الفحص'; newData.conditionalReleaseType = ''; newData.transferTo = ''; } 
              else if (value === 'إفراج مشروط') { newData.status = 'Pending'; } 
              else if (value === 'إجراءات متعددة') { newData.status = 'Pending'; newData.inspectionResult = 'قيد الفحص'; newData.conditionalReleaseType = ''; newData.transferTo = ''; }
              else if (value === 'استلام في اللوجستية') { newData.status = 'Pending'; newData.inspectionResult = 'قيد الفحص'; newData.conditionalReleaseType = ''; newData.transferTo = ''; }
              else { newData.status = 'Pending'; newData.conditionalReleaseType = ''; if (value === 'تحويل') newData.inspectionResult = 'قيد الفحص'; }
              
              if (value !== 'إجراءات متعددة' && newData.items) {
                  newData.items = newData.items.map(item => ({ ...item, technicalAction: value }));
              }
          }
          return newData;
      });
  };

  const handleImporterChange = (val: string) => {
    if (isReadOnly) return;
    setHasUnsavedChanges(true);
    const selectedImporter = importers.find(i => i.name === val);
    
    let brokerPhone = '';
    if (selectedImporter?.defaultClearanceOffice && selectedImporter?.defaultBroker) {
        const office = (clearanceOffices || []).find(o => o.name === selectedImporter.defaultClearanceOffice);
        const broker = office?.brokers.find(b => b.name === selectedImporter.defaultBroker);
        if (broker) brokerPhone = broker.phone;
    }
    
    setFormData(prev => ({ 
        ...prev, 
        importer: val, 
        clearanceOffice: selectedImporter?.defaultClearanceOffice || prev.clearanceOffice, 
        customsBroker: selectedImporter?.defaultBroker || prev.customsBroker,
        brokerPhone: brokerPhone || prev.brokerPhone
    }));
    if (selectedImporter?.defaultClearanceOffice) showToast(`تم تعبئة بيانات التخليص تلقائياً لـ ${val}`, 'warning');
  };

  const handleOpenEdit = (c: Consignment) => { setEditingId(c.id); setFormData({ ...initialFormState, ...c }); setShowModal(true); setActiveStep(1); setSaveStatus('idle'); setHasUnsavedChanges(false); setIsLCLConfirmed(false); setFormNotification(null); };
  
  const handleViewCertificate = (c: Consignment) => {
      setFormData({ ...initialFormState, ...c });
      if (c.type === ConsignmentType.VETERINARY) {
          setShowVetCert(true);
          setShowPhytoCert(false);
      } else if (c.type === ConsignmentType.AGRICULTURAL) {
          setShowPhytoCert(true);
          setShowVetCert(false);
      }
  };

  const handleCloseModal = () => {
      if (window.history.state?.modalOpen) window.history.back(); 
      else { setShowModal(false); setEditingId(null); setFormData(initialFormState); setActiveStep(1); setHasUnsavedChanges(false); setIsLCLConfirmed(false); setFormNotification(null); }
  };

  const handleAttemptClose = () => {
      if (hasUnsavedChanges) { setConfirmModal({ isOpen: true, title: 'تنبيه: بيانات غير محفوظة', message: 'هل أنت متأكد من إغلاق النافذة؟ سيتم فقدان كافة التغييرات التي قمت بها.', confirmText: 'نعم، تجاهل وإغلاق', cancelText: 'تراجع', onConfirm: () => { setShowModal(false); setEditingId(null); setFormData(initialFormState); setHasUnsavedChanges(false); setIsLCLConfirmed(false); setFormNotification(null); if(window.history.state?.modalOpen) window.history.back(); }, isDestructive: true }); } 
      else handleCloseModal();
  };

  const handleItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { 
      const { name, value, type } = e.target; 
      setCurrentItem(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value })); 
  };
  
  const handleProductSelect = (val: string) => { 
      const foundGroup = filteredCommodityGroups.find(g => g.products.includes(val)); 
      setCurrentItem(prev => ({ ...prev, description: val, commodityGroup: foundGroup ? foundGroup.name : prev.commodityGroup })); 
  };

  // منطق معالجة اختيار المبيد والربط بالمادة الفعالة (ديناميكي من props)
  const handlePesticideSelect = (val: string) => {
      const pesticide = pesticides.find(p => p.name === val);
      setCurrentItem(prev => ({
          ...prev,
          pesticideName: val,
          activeIngredients: pesticide ? (pesticide.activeIngredients || (pesticide.activeIngredient ? [pesticide.activeIngredient] : [])) : prev.activeIngredients,
          pesticideType: pesticide ? pesticide.pesticideType : prev.pesticideType,
          description: val 
      }));
  };

  const handleActiveIngredientsChange = (val: string) => {
      setCurrentItem(prev => ({ ...prev, activeIngredients: val.split(',').map(s => s.trim()) }));
  };

  const addItem = () => {
      if (!currentItem.commodityGroup || !currentItem.description || !currentItem.origin || !currentItem.weight || Number(currentItem.weight) <= 0) { showToast('يرجى إكمال بيانات المنتج بشكل صحيح', 'error'); return; }
      const newItem = { ...currentItem, id: editingItemId || Math.random().toString(36).substr(2, 9) } as ConsignmentItem;
      const matchingPlan = samplingPlans?.find(plan => {
          if (!plan.active || plan.sector !== activeSector) return false;
          
          // Check Product Name
          const productMatch = plan.productName === 'الكل' || plan.productName.trim().toLowerCase() === newItem.description.trim().toLowerCase();
          if (!productMatch) return false;

          // Check Importer
          const importerMatch = !plan.targetImporters || plan.targetImporters.length === 0 || 
              (formData.importer && plan.targetImporters.some(imp => formData.importer?.toLowerCase().includes(imp.toLowerCase())));
          if (!importerMatch) return false;

          // Check Exporter
          const exporterMatch = !plan.targetExporters || plan.targetExporters.length === 0 || 
              (formData.exporter && plan.targetExporters.some(exp => formData.exporter?.toLowerCase().includes(exp.toLowerCase())));
          if (!exporterMatch) return false;

          // Check Origin
          const originMatch = !plan.targetOrigins || plan.targetOrigins.length === 0 || 
              (newItem.origin && plan.targetOrigins.some(org => newItem.origin?.toLowerCase().includes(org.toLowerCase())));
          if (!originMatch) return false;

          return true;
      });
      let autoRiskNote = '';
      if (matchingPlan) { 
          if (activeRiskStats && activeRiskStats.remaining > 0) { 
              newItem.riskFlag = true; 
              newItem.riskPlanId = matchingPlan.id; 
              const analysisText = (matchingPlan.requiredAnalysis && matchingPlan.requiredAnalysis.length > 0) ? ` والفحوصات الواجب أخذها بناء على ملف المخاطر للمنتج هي: ${matchingPlan.requiredAnalysis.join('، ')}.` : '.';
              autoRiskNote = `[نظام المخاطر]: تم طلب عينة لعدم اكتمال حصة ${currentItem.description}` + analysisText; 
              showToast(`تنبيه: هذا المنتج يتطلب سحب عينة (الحصة المتبقية: ${activeRiskStats.remaining})` + analysisText, 'warning'); 
          } else if (activeRiskStats && activeRiskStats.remaining === 0) {
              newItem.riskPlanId = matchingPlan.id; 
              autoRiskNote = `[نظام المخاطر]: اكتملت الحصة الشهرية لمنتج ${currentItem.description}، لا يشترط سحب عينة.`; 
              showToast(`اكتملت الحصة الشهرية لمنتج ${currentItem.description}. لا يشترط سحب عينة.`, 'success'); 
          } else {
              newItem.riskFlag = true; 
              newItem.riskPlanId = matchingPlan.id; 
          }
      }
      setFormData(prev => { 
          const updatedItems = editingItemId 
              ? prev.items?.map(i => i.id === editingItemId ? newItem : i) || []
              : [...(prev.items || []), newItem]; 
          let newRiskScore = prev.riskScore || 0; 
          let shouldSample = prev.hasSample; 
          if (matchingPlan) { 
              const riskVal = matchingPlan.riskLevel === 'HIGH' ? 80 : matchingPlan.riskLevel === 'MEDIUM' ? 50 : 20; 
              newRiskScore = Math.max(newRiskScore, riskVal); 
              if (activeRiskStats && activeRiskStats.remaining > 0) shouldSample = true; 
          } 
          const newRemarks = autoRiskNote ? (prev.remarks ? prev.remarks + "\n" + autoRiskNote : autoRiskNote) : prev.remarks; 
          return { ...prev, items: updatedItems, riskScore: newRiskScore, hasSample: shouldSample, remarks: newRemarks }; 
      });
      
      // تصفير الخيارات
      setIsVetMedicine(false);
      setEditingItemId(null);
      
      setCurrentItem({ packagingUnit: 'كرتون' }); setHasUnsavedChanges(true); showToast(editingItemId ? "تم تحديث المنتج" : "تم إضافة المنتج للقائمة", 'success');
  };

  const handleEditItem = (item: ConsignmentItem) => { 
      setCurrentItem({ ...initialItemState, ...item }); 
      setEditingItemId(item.id);
      
      // التحقق من نوع المنتج لتفعيل التبديلات
      if (activeSector === ConsignmentType.VETERINARY && item.activeIngredients && item.activeIngredients.length > 0) {
          setIsVetMedicine(true);
      } else {
          setIsVetMedicine(false);
      }
  };
  
  const cancelEditItem = () => { 
      setCurrentItem({ packagingUnit: 'كرتون' }); 
      setEditingItemId(null); 
      setIsVetMedicine(false);
  };

  const handleDuplicateItem = (item: ConsignmentItem) => {
      const duplicatedItem = { ...item, id: Math.random().toString(36).substr(2, 9) };
      setFormData(prev => ({ ...prev, items: [...(prev.items || []), duplicatedItem] }));
      setHasUnsavedChanges(true);
      showToast("تم تكرار المنتج", 'success');
  };

  const removeItem = (id: string) => { setFormData(prev => ({ ...prev, items: prev.items?.filter(i => i.id !== id) })); setHasUnsavedChanges(true); };
  const handleToggleNewSampleAnalysis = (type: string) => { setNewSample(prev => { const current = prev.labAnalysisType || []; return { ...prev, labAnalysisType: current.includes(type) ? current.filter(t => t !== type) : [...current, type] }; }); };

  const handleAddSample = () => {
      if (!newSample.labName || !newSample.labAnalysisType?.length) { showToast('يرجى اختيار المختبر ونوع الفحص', 'error'); return; }
      if (editingSampleId) { setFormData(prev => ({ ...prev, samples: prev.samples?.map(s => s.sampleId === editingSampleId ? { ...s, ...newSample } as Sample : s) })); setEditingSampleId(null); showToast("تم تحديث بيانات العينة", 'success'); } 
      else { 
        const timestamp = Date.now().toString().slice(-4);
        const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const sample: Sample = { 
          sampleId: `SPL-${timestamp}${randomPart}`, 
          date: new Date().toISOString(), 
          type: 'رسمية', 
          result: 'Pending', 
          status: 'DRAWN',
          drawnBy: currentUser.name,
          ...newSample as Sample 
        }; 
        setFormData(prev => ({ ...prev, samples: [...(prev.samples || []), sample], hasSample: true })); 
        showToast("تم إضافة العينة", 'success'); 
      }
      setNewSample({ labAnalysisType: [], itemIds: [] }); setHasUnsavedChanges(true);
  };

  const handleEditSample = (sample: Sample) => { setNewSample(sample); setEditingSampleId(sample.sampleId); };
  const cancelEditSample = () => { setNewSample({ labAnalysisType: [], itemIds: [] }); setEditingSampleId(null); };
  const handleRemoveSample = (sampleId: string) => { setFormData(prev => { const newSamples = prev.samples?.filter(s => s.sampleId !== sampleId) || []; return { ...prev, samples: newSamples, hasSample: newSamples.length > 0 }; }); setHasUnsavedChanges(true); };

  const handleSubmit = async (shouldClose: boolean = false) => {
      if (isReadOnly) return;
      if ((!isOutbound && !formData.bayanNumber) || !formData.items?.length || formData.fees === undefined || !formData.technicalAction || !formData.containerCount || (!isOutbound && !formData.clearanceOffice)) { 
        showToast('يرجى إكمال الحقول الأساسية (البيان، المنتجات، الرسوم، الإجراء، عدد الحاويات، مكتب التخليص)', 'error'); 
        return; 
      }
      if (formData.technicalAction === 'إجراءات متعددة') {
          const missingActions = formData.items.some(item => !item.technicalAction);
          if (missingActions) {
              showToast('يرجى تحديد الإجراء الفني لكل منتج في القائمة', 'error');
              return;
          }
      }
      if (duplicateConsignment && !isLCLConfirmed) { showToast('يرجى معالجة تكرار رقم البيان أولاً', 'error'); return; }
      if (duplicatePermitConsignment) { showToast(`رقم التصريح مستخدم مسبقاً في المعاملة رقم: ${duplicatePermitConsignment.bayanNumber}`, 'error'); return; }
      setSaveStatus('saving');
      try {
          const calculatedTotalWeight = formData.items?.reduce((acc, item) => acc + (Number(item.weight) || 0), 0) || 0;
          const finalId = editingId || generateConsignmentId(activeSector, Math.floor(Date.now() % 10000));
          let changes: AuditChange[] = [];
          if (editingId) { const original = consignments.find(c => c.id === editingId); if (original) changes = calculateChanges(original, formData); }
          const logEntry: AuditLogEntry = { timestamp: new Date().toISOString(), action: editingId ? 'تحديث البيانات' : 'تسجيل جديد', user: currentUser.name, details: editingId ? `تم تحديث ${changes.length} حقول` : 'تم إنشاء سجل المعاملة', statusChange: formData.status, changes: changes.length > 0 ? changes : undefined };
          const payload = { ...formData, id: finalId, type: activeSector, totalWeight: calculatedTotalWeight, dataCompletionStatus: 'Complete', auditLog: [...(formData.auditLog || []), logEntry] } as Consignment;
          if (editingId) await onUpdate(payload); else await onAdd(payload);
          setSaveStatus('saved'); setHasUnsavedChanges(false); showToast('تم حفظ البيانات بنجاح', 'success');
          if (shouldClose) setTimeout(() => { setShowModal(false); setEditingId(null); setFormData(initialFormState); setIsLCLConfirmed(false); if(window.history.state?.modalOpen) window.history.back(); }, 1000);
          else setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (e) { setSaveStatus('error'); showToast('حدث خطأ أثناء الحفظ', 'error'); }
  };

  const loading = saveStatus === 'saving'; 
  const selectedOfficeData = useMemo(() => (clearanceOffices || []).find(o => o.name === formData.clearanceOffice), [clearanceOffices, formData.clearanceOffice]);
  const availableBrokers = selectedOfficeData?.brokers || [];

  const isAnyFilterActive = useMemo(() => {
    return filterMonth !== '' || filterDay !== '' || filterPort !== 'ALL' || filterInspector !== 'ALL' || filterStatus !== 'ALL' || filterRisk !== 'ALL' || filterSamples !== 'ALL' || filterAction !== 'ALL' || filterCommodity !== 'ALL' || filterDeclarationType !== 'ALL' || globalSearchTerm !== '';
  }, [filterMonth, filterDay, filterPort, filterInspector, filterStatus, filterRisk, filterSamples, filterAction, filterCommodity, filterOrigin, filterDeclarationType, globalSearchTerm]);

  const resetFilters = () => {
    setFilterMonth('');
    setFilterDay('');
    setFilterPort('ALL');
    setFilterInspector('ALL');
    setFilterStatus('ALL');
    setFilterRisk('ALL');
    setFilterSamples('ALL');
    setFilterAction('ALL');
    setFilterCommodity('ALL');
    setFilterOrigin('ALL');
    setFilterDeclarationType('ALL');
    setGlobalSearchTerm('');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 relative">
      {/* Active Search & Filter Status */}
      {isAnyFilterActive && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 animate-scale-in mb-2">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100">
                    <i className="fas fa-filter text-sm"></i>
                </div>
                <div>
                    <h4 className="font-black text-slate-800 text-xs">نظام الفرز المتقدم نشط</h4>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5">
                        {globalSearchTerm ? `البحث عن: "${globalSearchTerm}" (رقم البيان، المستورد، المصدر أو الأصناف)` : 'يتم تصفية المعاملات بناءً على اختياراتك'}
                    </p>
                </div>
            </div>
            <button 
                onClick={resetFilters}
                className="bg-white text-red-600 hover:bg-red-50 px-5 py-2.5 rounded-2xl font-black text-[10px] transition-all border border-red-100 shadow-sm flex items-center gap-2"
            >
                <i className="fas fa-undo-alt text-[9px]"></i>
                إعادة ضبط كافة الفلاتر
            </button>
        </div>
      )}
      {formNotification && (
          <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[300] animate-scale-in">
              <div className={`bg-white px-6 py-4 rounded-2xl shadow-2xl border-r-4 flex items-center gap-4 min-w-[320px] max-w-md ${formNotification.type === 'error' ? 'border-red-500' : formNotification.type === 'warning' ? 'border-amber-500' : 'border-green-500'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${formNotification.type === 'error' ? 'bg-red-50 text-red-500' : formNotification.type === 'warning' ? 'bg-amber-50 text-amber-500' : 'bg-green-50 text-green-500'}`}>
                      <i className={`fas ${formNotification.type === 'error' ? 'fa-exclamation-triangle' : formNotification.type === 'warning' ? 'fa-bell' : 'fa-check-circle'} text-lg`}></i>
                  </div>
                  <div>
                      <h4 className={`text-sm font-black ${formNotification.type === 'error' ? 'text-red-800' : formNotification.type === 'warning' ? 'text-amber-800' : 'text-green-800'}`}>
                          {formNotification.type === 'error' ? 'تنبيه النظام' : formNotification.type === 'warning' ? 'تذكير هام' : 'تم بنجاح'}
                      </h4>
                      <p className="text-xs font-bold text-slate-600 mt-1 whitespace-pre-line leading-relaxed">{formNotification.message}</p>
                  </div>
                  <button onClick={() => setFormNotification(null)} className="mr-auto text-slate-300 hover:text-slate-500"><i className="fas fa-times"></i></button>
              </div>
          </div>
      )}

      {isLogisticsStationOnly && logType !== 'OUTGOING' && (
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl flex items-center gap-4 animate-fade-in text-right" dir="rtl">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md">
                  <i className="fas fa-info"></i>
              </div>
              <p className="text-xs font-black text-emerald-900 leading-relaxed">
                  أنت مسجل في محطة لوجستية. يُسمح لك بمعالجة المعاملات المحولة، وتسجيل المعاملات الصادرة فقط.
              </p>
          </div>
      )}

      {/* High Risk Alerts Banner */}
      {processedConsignments.some(c => c.riskScore > 60 && c.status === 'Pending') && (
        <div className="bg-red-600 text-white p-5 rounded-[2.5rem] shadow-xl shadow-red-100 flex flex-col md:flex-row items-center justify-between gap-6 animate-pulse border-4 border-white/20">
          <div className="flex items-center gap-5 text-right">
            <div className="w-14 h-14 bg-white/20 rounded-[1.5rem] flex items-center justify-center text-3xl shrink-0">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight">تنبيه مخاطر عالية فوري</h3>
              <p className="text-white/80 text-xs font-bold mt-1">يوجد {processedConsignments.filter(c => c.riskScore > 60 && c.status === 'Pending').length} معاملة تتطلب فحصاً مشدداً وسحب عينات مخبرية فورية.</p>
            </div>
          </div>
          <div className="flex gap-3 shrink-0">
            <button 
              onClick={() => setGlobalSearchTerm('HighRisk')}
              className="bg-white text-red-600 px-6 py-3 rounded-2xl font-black text-xs hover:bg-red-50 transition-all shadow-lg flex items-center gap-2"
            >
              <i className="fas fa-search-plus"></i> عـرض المخاطر
            </button>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-[#c8102e] text-white rounded-[2rem] flex items-center justify-center text-2xl shadow-lg shadow-red-100"><i className="fas fa-file-invoice text-2xl"></i></div>
             <div><h2 className="text-2xl font-black text-slate-800">سجل المعاملات</h2><p className="text-slate-400 text-xs font-bold mt-1">عرض المعاملات: <span className="font-mono text-slate-600">{filterDay || filterMonth || 'الكل'}</span></p></div>
          </div>
          <div className="flex gap-3">
             {currentUser.role === 'ADMIN' && (
                <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                   <button onClick={() => setViewMode('TABLE')} className={`w-10 rounded-xl flex items-center justify-center transition-all ${viewMode === 'TABLE' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-100'}`} title="جدول"><i className="fas fa-table"></i></button>
                   <button onClick={() => setViewMode('KANBAN')} className={`w-10 rounded-xl flex items-center justify-center transition-all ${viewMode === 'KANBAN' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-100'}`} title="لوحة المهام (Kanban)"><i className="fas fa-columns"></i></button>
                </div>
             )}
             {!isReadOnly && (!isLogisticsStationOnly || logType === 'OUTGOING') && (
                 <>
                    {currentUser.role === 'ADMIN' && (
                        <button onClick={() => downloadTemplate(activeSector)} className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100 shadow-sm"><i className="fas fa-file-download"></i> <span className="hidden sm:inline">نموذج</span></button>
                    )}
                    {currentUser.role === 'ADMIN' && (
                        <>
                            <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100 shadow-sm">{isImporting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-file-import"></i>}<span>استيراد</span></button>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                        </>
                    )}
                    {currentUser.role === 'ADMIN' && (
                        <button onClick={() => setShowMagicInput(!showMagicInput)} className="bg-emerald-50 text-emerald-700 px-5 py-3 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100 shadow-sm"><i className="fas fa-magic"></i> إدخال ذكي</button>
                    )}
                    {currentUser.role === 'ADMIN' && (
                        <button 
                            onClick={() => exportConsignmentsToExcel(processedConsignments, `سجل_المعاملات_${activeSector}_${filterDay || filterMonth || 'الكل'}`)} 
                            className="bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl font-black text-xs hover:bg-blue-100 transition-all flex items-center gap-2 border border-blue-100 shadow-sm"
                        >
                            <i className="fas fa-file-excel"></i> 
                            <span className="hidden sm:inline">تصدير</span>
                        </button>
                    )}
                    {permissions.canAdd && (
                        <button onClick={() => { 
                            const defaultPort = filterPort !== 'ALL' ? filterPort : initialFormState.port;
                            setEditingId(null); 
                            setFormData({
                                ...initialFormState, 
                                type: activeSector,
                                port: defaultPort, 
                                inspectionLocation: defaultPort,
                                direction: logType === 'OUTGOING' ? ConsignmentDirection.OUTBOUND : ConsignmentDirection.INBOUND
                            }); 
                            setShowModal(true); 
                            setSaveStatus('idle'); 
                            setHasUnsavedChanges(false); 
                            setIsLCLConfirmed(false); 
                        }} className="bg-[#c8102e] text-white px-6 py-3 rounded-2xl font-black text-xs shadow-xl hover:bg-red-800 transition-all flex items-center gap-2"><i className="fas fa-plus"></i> تسجيل يدوي</button>
                    )}
                 </>
             )}
          </div>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl mb-6 w-fit print:hidden">
          <button 
              onClick={() => handleLogTypeChange('INCOMING')}
              className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${logType === 'INCOMING' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
              <i className="fas fa-arrow-down"></i>
              الوارد (Incoming)
          </button>
          {activeSector !== ConsignmentType.FOOD_SAFETY && (
            <>
              <button 
                  onClick={() => handleLogTypeChange('OUTGOING')}
                  className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${logType === 'OUTGOING' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <i className="fas fa-arrow-up"></i>
                  الصادر (Outgoing)
              </button>
              <button 
                  onClick={() => handleLogTypeChange('SPLIT')}
                  className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${logType === 'SPLIT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                  <i className="fas fa-columns"></i>
                  عرض منقسم (Split View)
              </button>
            </>
          )}
      </div>

      {/* Advanced Filter Bar */}
      <div className="bg-slate-50 p-2 rounded-[2.5rem] border border-slate-200/60 shadow-inner print:hidden overflow-hidden">
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100">
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 lg:gap-4">
              
              {/* Month Filter */}
              <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="far fa-calendar-alt text-[#c8102e]"></i> الشهر
                  </label>
                  <div className="relative group">
                    <input 
                      type="month" 
                      value={filterMonth} 
                      onChange={(e) => { setFilterMonth(e.target.value); setFilterDay(''); }} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 cursor-pointer font-mono outline-none focus:ring-4 focus:ring-red-500/5 focus:border-[#c8102e] transition-all disabled:opacity-50"
                      disabled={!!filterDay}
                    />
                    {filterMonth && !filterDay && (
                      <button onClick={() => setFilterMonth('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors">
                        <i className="fas fa-times-circle text-[10px]"></i>
                      </button>
                    )}
                  </div>
              </div>

              {/* Day Filter */}
              <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="far fa-calendar text-[#c8102e]"></i> اليوم
                  </label>
                  <div className="relative group">
                    <input 
                      type="date" 
                      value={filterDay} 
                      onChange={(e) => setFilterDay(e.target.value)} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 cursor-pointer font-mono outline-none focus:ring-4 focus:ring-red-500/5 focus:border-[#c8102e] transition-all" 
                    />
                    {filterDay && (
                      <button onClick={() => setFilterDay('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors">
                        <i className="fas fa-times-circle text-[10px]"></i>
                      </button>
                    )}
                  </div>
              </div>

              {/* Port Filter */}
              {(allowedPorts.length > 1 || currentUser.role === 'ADMIN') && ( 
                <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fas fa-anchor text-blue-500"></i> المنفذ
                  </label>
                  <select 
                    value={filterPort} 
                    onChange={(e) => setFilterPort(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all appearance-none"
                  >
                    <option value="ALL">كل المنافذ</option>
                    {allowedPorts.map(p => (<option key={p.id} value={p.name}>{p.name}</option>))}
                  </select>
                </div> 
              )}

              {/* Inspector Filter */}
              <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fas fa-user-shield text-emerald-500"></i> الموظف
                  </label>
                  <select 
                    value={filterInspector} 
                    onChange={(e) => setFilterInspector(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 cursor-pointer outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all appearance-none"
                  >
                    <option value="ALL">الجميع</option>
                    <option value={currentUser.name}>معاملاتي</option>
                    {canFilterOthers && users.filter(u => u.name !== currentUser.name && (u.role === 'ADMIN' || u.allowedSectors?.includes(activeSector)) ).map(u => ( <option key={u.id} value={u.name}>{u.name}</option> ))}
                  </select>
              </div>

              {/* Technical Action Filter */}
              <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fas fa-gavel text-amber-500"></i> الإجراء
                  </label>
                  <select 
                    value={filterAction} 
                    onChange={(e) => setFilterAction(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 cursor-pointer outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-400 transition-all appearance-none"
                  >
                    <option value="ALL">الكل</option>
                    {TECHNICAL_ACTIONS.map(action => (<option key={action} value={action}>{action}</option>))}
                  </select>
              </div>

              {/* Commodity Group Filter */}
              <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fas fa-box text-purple-500"></i> الشحنة
                  </label>
                  <select 
                    value={filterCommodity} 
                    onChange={(e) => setFilterCommodity(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 cursor-pointer outline-none focus:ring-4 focus:ring-purple-500/5 focus:border-purple-400 transition-all appearance-none"
                  >
                    <option value="ALL">الكل</option>
                    {filteredCommodityGroups.map(g => (<option key={g.id} value={g.name}>{g.name}</option>))}
                  </select>
              </div>

              {/* Declaration Type Filter */}
              <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fas fa-file-contract text-indigo-500"></i> نوع البيان
                  </label>
                  <select 
                    value={filterDeclarationType} 
                    onChange={(e) => setFilterDeclarationType(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 cursor-pointer outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all appearance-none"
                  >
                      <option value="ALL">الكل</option>
                      {filteredDeclarationTypes.map(type => (<option key={type} value={type}>{type}</option>))}
                  </select>
              </div>

              {/* Risk Level Filter */}
              <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fas fa-biohazard text-red-500"></i> الخطورة
                  </label>
                  <select 
                    value={filterRisk} 
                    onChange={(e) => setFilterRisk(e.target.value as any)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 cursor-pointer outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-400 transition-all appearance-none"
                  >
                      <option value="ALL">كل المستويات</option>
                      <option value="HIGH">مرتفع الخطورة (High)</option>
                      <option value="MEDIUM">متوسط الخطورة (Medium)</option>
                      <option value="LOW">منخفض الخطورة (Low)</option>
                  </select>
              </div>

              {/* Samples Filter */}
              <div className="space-y-1.5 min-w-0">
                  <label className="text-[10px] font-black text-slate-400 mr-2 uppercase tracking-widest flex items-center gap-1.5">
                    <i className="fas fa-microscope text-blue-500"></i> العينات
                  </label>
                  <select 
                    value={filterSamples} 
                    onChange={(e) => setFilterSamples(e.target.value as any)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 cursor-pointer outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-400 transition-all appearance-none"
                  >
                      <option value="ALL">الكل</option>
                      <option value="YES">بها عينات</option>
                      <option value="NO">بدون عينات</option>
                  </select>
              </div>

           </div>

           {/* Status Quick Filters */}
           <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(status => (
                  <button 
                    key={status} 
                    onClick={() => setFilterStatus(status as any)} 
                    className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${filterStatus === status ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-white'}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      status === 'ALL' ? 'bg-slate-400' : 
                      status === 'PENDING' ? 'bg-amber-400' : 
                      status === 'APPROVED' ? 'bg-emerald-400' : 'bg-red-400'
                    }`}></div>
                    {status === 'ALL' ? 'الكل' : status === 'PENDING' ? 'قيد الإجراء' : status === 'APPROVED' ? 'مفرج عنه' : 'مرفوض'}
                  </button>
                ))}
              </div>
              
              <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                إجمالي النتائج المعروضة: <span className="text-slate-800 font-black">{processedConsignments.length}</span>
              </div>
           </div>
        </div>
      </div>

      {!isReadOnly && (!isLogisticsStationOnly || logType === 'OUTGOING') && showMagicInput && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-[2rem] p-6 mb-6 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <h4 className="font-black text-emerald-900 mb-4 flex items-center gap-2"><i className="fas fa-magic"></i> المساعد الذكي</h4>
              <textarea value={magicText} onChange={(e) => setMagicText(e.target.value)} placeholder="الصق نص البريد الإلكتروني أو تفاصيل الشحنة هنا، وسيقوم النظام بتعبئة الاستمارة تلقائياً..." className="w-full bg-white border border-emerald-200 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/20 mb-4" />
              
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input 
                          type="file" 
                          accept="image/*" 
                          id="ocr-upload" 
                          className="hidden" 
                          onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsProcessingMagic(true);
                              try {
                                  const reader = new FileReader();
                                  reader.onloadend = async () => {
                                      const base64 = reader.result as string;
                                      const { extractDataFromDocument } = await import('../geminiService');
                                      const parsed = await extractDataFromDocument(base64);
                                      if (parsed) {
                                          const defaultPort = filterPort !== 'ALL' ? filterPort : initialFormState.port;
                                          setFormData({ 
                                              ...initialFormState, 
                                              port: defaultPort,
                                              inspectionLocation: defaultPort,
                                              ...parsed 
                                          }); 
                                          setShowMagicInput(false); 
                                          setShowModal(true); 
                                          setEditingId(null); 
                                          setHasUnsavedChanges(true); 
                                          showToast('تم استخراج البيانات من المستند بنجاح', 'success'); 
                                      } else {
                                          showToast('لم نتمكن من قراءة المستند', 'error');
                                      }
                                      setIsProcessingMagic(false);
                                  };
                                  reader.readAsDataURL(file);
                              } catch (err) {
                                  console.error(err);
                                  setIsProcessingMagic(false);
                                  showToast('حدث خطأ أثناء قراءة المستند', 'error');
                              }
                          }}
                      />
                      <label htmlFor="ocr-upload" className="bg-white text-emerald-600 px-4 py-3 rounded-xl font-bold text-xs shadow-sm border border-emerald-200 hover:bg-emerald-50 transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center">
                          <i className="fas fa-file-image"></i>
                          <span>قراءة مستند (OCR)</span>
                      </label>
                      <button 
                          onClick={() => {
                              if (!('webkitSpeechRecognition' in window)) {
                                  alert('عذراً، متصفحك لا يدعم ميزة الإملاء الصوتي. يرجى استخدام Google Chrome.');
                                  return;
                              }
                              const recognition = new (window as any).webkitSpeechRecognition();
                              recognition.lang = 'ar-SA';
                              recognition.continuous = false;
                              recognition.interimResults = false;
                              
                              recognition.onstart = () => {
                                  showToast('تحدث الآن...', 'warning');
                              };
                              
                              recognition.onresult = (event: any) => {
                                  const transcript = event.results[0][0].transcript;
                                  setMagicText(prev => prev + ' ' + transcript);
                                  showToast('تم التقاط الصوت بنجاح', 'success');
                              };
                              
                              recognition.onerror = (event: any) => {
                                  console.error('Speech recognition error', event.error);
                                  showToast('حدث خطأ أثناء الاستماع', 'error');
                              };
                              
                              recognition.start();
                          }}
                          className="bg-white text-rose-600 px-4 py-3 rounded-xl font-bold text-xs shadow-sm border border-rose-200 hover:bg-rose-50 transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                          title="إملاء صوتي"
                      >
                          <i className="fas fa-microphone"></i>
                          <span className="hidden sm:inline">إملاء صوتي</span>
                      </button>
                  </div>

                  <button onClick={async () => { 
                      setIsProcessingMagic(true); 
                      const parsed = await parseRegistrationText(magicText, activeSector); 
                      if(parsed) { 
                          const defaultPort = filterPort !== 'ALL' ? filterPort : initialFormState.port;
                          setFormData({ 
                              ...initialFormState, 
                              port: defaultPort,
                              inspectionLocation: defaultPort,
                              ...parsed 
                          }); 
                          setShowMagicInput(false); 
                          setShowModal(true); 
                          setEditingId(null); 
                          setHasUnsavedChanges(true); 
                          showToast('تم استخراج البيانات بنجاح', 'success'); 
                      } else { 
                          showToast('لم نتمكن من تحليل النص. يرجى المحاولة يدوياً', 'error'); 
                      } 
                      setIsProcessingMagic(false); 
                  }} disabled={!magicText.trim() || isProcessingMagic} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 w-full sm:w-auto justify-center">
                      {isProcessingMagic ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-bolt"></i>}
                      <span>تحليل النص</span>
                  </button>
              </div>
          </div>
      )}

      {viewMode === 'TABLE' ? ( 
          logType === 'SPLIT' ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2 px-4">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                              <i className="fas fa-arrow-down"></i>
                          </div>
                          <h3 className="font-black text-slate-800">سجل الوارد (Incoming Log)</h3>
                      </div>
                      <DataTable 
                        data={processedConsignments.filter(c => !(c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير'))} 
                        columns={columns} 
                        searchPlaceholder={`بحث في الوارد (${systemSettings?.customLabels?.declarationNumber || 'رقم البيان'}، التصريح...)`}
                        onSearchChange={(val) => setGlobalSearchTerm(val)} 
                        getRowClassName={getRowRiskClassName}
                        renderSubComponent={({ row }) => <ConsignmentDetail c={row.original} samplingPlans={samplingPlans} onViewCert={setCertConsignment} onTranslate={translateConsignment} isTranslating={isTranslating} />}
                      />
                  </div>
                  <div className="space-y-4">
                      <div className="flex items-center gap-3 mb-2 px-4">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                              <i className="fas fa-arrow-up"></i>
                          </div>
                          <h3 className="font-black text-slate-800">سجل الصادر (Outgoing Log)</h3>
                      </div>
                      <DataTable 
                        data={processedConsignments.filter(c => c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير')} 
                        columns={columns} 
                        searchPlaceholder={`بحث في الصادر (${systemSettings?.customLabels?.declarationNumber || 'رقم البيان'}، التصريح...)`}
                        onSearchChange={(val) => setGlobalSearchTerm(val)} 
                        getRowClassName={getRowRiskClassName}
                        renderSubComponent={({ row }) => <ConsignmentDetail c={row.original} samplingPlans={samplingPlans} onViewCert={setCertConsignment} onTranslate={translateConsignment} isTranslating={isTranslating} />}
                      />
                  </div>
              </div>
          ) : (
              <DataTable 
                data={processedConsignments} 
                columns={columns} 
                searchPlaceholder={`بحث شامل (${systemSettings?.customLabels?.declarationNumber || 'رقم البيان'}، التصريح، ${(activeSector === ConsignmentType.AGRICULTURAL || activeSector === ConsignmentType.VETERINARY) ? 'المصدر' : (systemSettings?.customLabels?.importerLabel || 'المستورد')}، الصنف...)`}
                onSearchChange={(val) => setGlobalSearchTerm(val)} 
                getRowClassName={getRowRiskClassName}
                renderSubComponent={({ row }) => <ConsignmentDetail c={row.original} samplingPlans={samplingPlans} onViewCert={setCertConsignment} onTranslate={translateConsignment} isTranslating={isTranslating} />}
              />
          )
      ) : ( 
          <KanbanBoard consignments={processedConsignments} onUpdateStatus={handleKanbanUpdate} onCardClick={handleOpenEdit} /> 
      )}
      
      {globalSearchTerm.length >= 2 && processedConsignments.length === 0 && (
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center animate-fade-in">
              <p className="text-sm font-bold text-amber-800">
                  <i className="fas fa-info-circle ml-2"></i> لم يتم العثور على نتائج للبحث "{globalSearchTerm}" في الشهر والقطاع المختار. حاول تغيير المنفذ أو الشهر.
              </p>
          </div>
      )}

      {showModal && (
        <form onSubmit={(e) => e.preventDefault()} className="fixed inset-0 z-[200] bg-slate-50 flex flex-col animate-fade-in overflow-hidden print:hidden overscroll-none">
            <button type="submit" className="hidden" aria-hidden="true"></button>
            <div className="px-8 py-5 shrink-0 flex justify-between items-center bg-[#c8102e] text-white shadow-lg relative z-20">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"><i className="fas fa-edit text-xl"></i></div>
                  <div><h3 className="text-xl font-black tracking-wide">{editingId ? 'تعديل المعاملة' : 'تسجيل جديد'}</h3><div className="flex items-center gap-3"><p className="text-xs font-medium opacity-80 flex items-center gap-2"><span>{activeSector} - {editingId || 'NEW'}</span>{riskAlert && <span className="bg-red-500 text-white px-2 rounded font-bold animate-pulse text-[9px]">High Risk</span>}{formData.isLocked && <span className="bg-white/20 text-white px-2 rounded font-bold flex items-center gap-1 text-[9px]"><i className="fas fa-lock"></i> مقفل</span>}</p>{hasUnsavedChanges && ( <div className="bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1"><i className="fas fa-exclamation-circle"></i> تغييرات غير محفوظة</div> )}<div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all ${ saveStatus === 'saving' ? 'bg-amber-500/20 text-amber-200' : saveStatus === 'saved' ? 'bg-green-500/20 text-green-300' : saveStatus === 'error' ? 'bg-red-500/20 text-red-300' : 'opacity-0' }`}>{saveStatus === 'saving' && <><i className="fas fa-circle-notch fa-spin text-[8px]"></i> جاري الحفظ...</>}{saveStatus === 'saved' && <><i className="fas fa-check text-[8px]"></i> تم الحفظ</>}{saveStatus === 'error' && <><i className="fas fa-exclamation text-[8px]"></i> فشل الحفظ</>}</div></div></div>
               </div>
               <div className="flex items-center gap-3">
                   {isTransferredToMe && (
                       <button 
                           onClick={handleLogisticsReceive}
                           className="bg-white text-indigo-700 px-4 py-2 rounded-xl font-black text-[10px] shadow-lg flex items-center gap-2 animate-pulse"
                       >
                           <i className="fas fa-file-import"></i>
                           استلام الإرسالية
                       </button>
                   )}
                   <button onClick={() => setFormViewMode(prev => prev === 'STEPS' ? 'SCROLL' : 'STEPS')} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white/80 hover:text-white" title={formViewMode === 'STEPS' ? "عرض كصفحة واحدة" : "عرض كتبويبات"}><i className={`fas ${formViewMode === 'STEPS' ? "fa-scroll" : "fa-columns"}`}></i></button>{editingId && ( <button onClick={copyDeepLink} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white/80 hover:text-white" title="نسخ رابط المعاملة"><i className="fas fa-share-alt"></i></button> )}{!isReadOnly && ( <button onClick={() => handleSubmit(false)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-white/80 hover:text-white" title="حفظ سريع"><i className="fas fa-save"></i></button> )}{canViewAuditLog && ( <button onClick={() => setShowAuditLog(!showAuditLog)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all" title="سجل التغييرات"><i className={`fas ${showAuditLog ? 'fa-list-alt' : 'fa-history'}`}></i></button> )}<button onClick={handleAttemptClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:rotate-90"><i className="fas fa-times text-lg"></i></button></div>
            </div>

            {!showAuditLog && (
                <>
                    {formViewMode === 'STEPS' && (
                        <div className="bg-white border-b border-slate-200 px-4 py-3 flex justify-center gap-4 overflow-x-auto shrink-0 shadow-sm z-10">
                            {STEPS.filter(s => canViewStep(s.id)).map(s => (
                                <button 
                                    key={s.id} 
                                    onClick={() => handleStepClick(s.id)} 
                                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-xs whitespace-nowrap transition-all ${ activeStep === s.id ? 'bg-slate-800 text-white shadow-lg scale-105 ring-2 ring-slate-800 ring-offset-2' : 'bg-slate-50 text-slate-400 hover:bg-slate-100' }`}
                                >
                                    <i className={`fas ${s.icon}`}></i> {s.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto overscroll-none p-4 md:p-8 custom-scrollbar bg-slate-100/50 scroll-fade-y">
                        <div className={`max-w-6xl mx-auto bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 md:p-12 min-h-fit ${formViewMode === 'SCROLL' ? 'space-y-12' : ''}`}>
                            
                            {/* Prominent High Risk Alert */}
                            {formData.riskScore && formData.riskScore > 60 && (
                                <div className="bg-red-50 border-2 border-red-200 p-6 rounded-[2rem] mb-8 animate-pulse flex items-center justify-between text-right relative overflow-hidden" dir="rtl">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-100/50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                                    <div className="flex items-center gap-5 relative z-10">
                                        <div className="w-16 h-16 bg-red-600 text-white rounded-3xl flex items-center justify-center text-3xl shadow-xl ring-8 ring-red-500/10">
                                            <i className="fas fa-exclamation-triangle"></i>
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-red-800">تنبيه مستوى مخاطر مرتفع (Critical Risk)</h3>
                                            <p className="text-red-600 text-xs font-bold mt-1 leading-relaxed max-w-2xl">
                                                هذه الإرسالية مصنفة ضمن الفئات عالية الخطورة. يرجى التأكد من المعاينة العينية الدقيقة وسحب عينات مخبرية إلزامية لجميع الأصناف المسجلة قبل اتخاذ أي قرار بالإفراج.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="hidden md:flex flex-col items-center relative z-10 bg-white/50 px-6 py-4 rounded-3xl border border-red-100/50">
                                        <div className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Risk Level</div>
                                        <div className="text-4xl font-black text-red-600 font-mono leading-none tracking-tighter">{Math.round(formData.riskScore)}%</div>
                                        <div className="mt-2 text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full uppercase">High Profile</div>
                                    </div>
                                </div>
                            )}

                            <div id="step-section-1" className={`transition-all ${activeStep === 1 || formViewMode === 'SCROLL' ? 'block animate-fade-in' : 'hidden'}`}>
                                {formViewMode === 'SCROLL' && <SectionHeader title="1. البيان والأطراف" icon="fa-file-invoice" />}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-6">
                                        <SectionHeader title="معلومات الوصول" icon="fa-ship" />
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">نوع البيان <span className="text-red-500">*</span></label>
                                                <select name="declarationType" value={formData.declarationType ?? ''} onChange={handleInputChange} disabled={!canEditStep(1)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer disabled:opacity-50" required>
                                                    <option value="">اختر النوع...</option>
                                                    {declarationTypes.filter(opt => {
                                                        if (activeSector === ConsignmentType.FOOD_SAFETY && (opt === 'تصدير' || opt === 'إعادة تصدير')) return false;
                                                        if (currentUser.role === 'LOGISTICS') return opt === 'تصدير' || opt === 'إعادة تصدير';
                                                        if (!editingId && logType === 'INCOMING') return opt !== 'تصدير' && opt !== 'إعادة تصدير';
                                                        if (!editingId && logType === 'OUTGOING') return opt === 'تصدير' || opt === 'إعادة تصدير';
                                                        return true;
                                                    }).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            {!isOutbound && (
                                                <>
                                                    <Input label={systemSettings?.customLabels?.declarationNumber || "رقم البيان"} name="bayanNumber" value={formData.bayanNumber} onChange={handleInputChange} placeholder="B-2024..." error={bayanError} readOnly={!canEditStep(1)} required />
                                                    {duplicateConsignment && !isLCLConfirmed && ( <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl animate-shake"> <p className="text-xs font-black text-amber-800 mb-3">{systemSettings?.customLabels?.declarationNumber || 'رقم البيان'} مكرر في النظام. فهل هذه إرسالية LCL؟</p> <div className="flex gap-2"> <button type="button" onClick={() => setIsLCLConfirmed(true)} className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-amber-700 transition-all" > نعم، إرسالية LCL </button> <button type="button" onClick={() => setFormData(prev => ({...prev, bayanNumber: ''}))} className="bg-white border border-amber-200 text-amber-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-amber-100 transition-all" > لا، مسح الرقم </button> </div> </div> )}
                                                </>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            {!isOutbound && (
                                                <Input label="رقم التصريح" name="permitNumber" value={formData.permitNumber || ''} onChange={handleInputChange} placeholder="اختياري..." error={permitError} readOnly={!canEditStep(1)} />
                                            )}
                                            <Input label="تاريخ التسجيل" name="arrivalDate" type="date" value={formData.arrivalDate} onChange={handleInputChange} readOnly={!canEditStep(1)} />
                                        </div>
                                        {activeSector === ConsignmentType.VETERINARY && (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">فئة الإرسالية البيطرية <span className="text-red-500">*</span></label>
                                                    <select name="vetCategory" value={formData.vetCategory ?? 'MEAT_DAIRY'} onChange={handleInputChange} disabled={!canEditStep(1)} className="w-full bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all appearance-none cursor-pointer disabled:opacity-50" required>
                                                        <option value="LIVE_ANIMALS">حيوانات حية (5 ر.ع + 0.5 للرأس)</option>
                                                        <option value="MEAT_DAIRY">لحوم ومنتجات ألبان (5 ر.ع لكل طن، بحد أقصى 100)</option>
                                                        <option value="FISH">أسماك ومنتجات بحرية (5 ر.ع لكل طن، بحد أقصى 15)</option>
                                                        <option value="EGGS">بيض مائدة (0.1 ر.ع لكل كرتون، بحد أقصى 40)</option>
                                                        <option value="FODDER">أعلاف وحبوب (30 ر.ع مقطوعة)</option>
                                                        <option value="WASTE">مخلفات حيوانية (30 ر.ع مقطوعة)</option>
                                                    </select>
                                                </div>
                                                {(formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') && (
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">تصنيف الشهادة البيطرية <span className="text-red-500">*</span></label>
                                                        <select name="vetCertificateType" value={formData.vetCertificateType ?? 'منتجات حيوانية'} onChange={handleInputChange} disabled={!canEditStep(1)} className="w-full bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all appearance-none cursor-pointer disabled:opacity-50" required>
                                                            <option value="منتجات حيوانية">منتجات حيوانية</option>
                                                            <option value="أعلاف ومخلفات حيوانية">أعلاف ومخلفات حيوانية</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">الميناء / المنفذ <span className="text-red-500">*</span></label>
                                                <select name="port" value={formData.port ?? ''} onChange={handleInputChange} disabled={!canEditStep(1) || allowedPorts.length <= 1} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer disabled:opacity-50" required>
                                                    <option value="">اختر المنفذ...</option>
                                                    {allowedPorts.filter(p => editingId || p.type !== 'LOGISTICS' || currentUser.role === 'LOGISTICS').map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <Input 
                                                label={(formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') ? "المستورد / الوجهة" : "المصدر / المصنع"} 
                                                name="exporter" 
                                                value={formData.exporter} 
                                                onChange={handleInputChange} 
                                                placeholder={(formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') ? "اسم الشركة المستوردة" : "اسم الشركة المصدرة"} 
                                                readOnly={!canEditStep(1)} 
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            {canChangeInspector ? ( <SearchableSelect label="اسم المفتش" value={formData.inspectorName || ''} onChange={(val) => setFormData(prev => ({ ...prev, inspectorName: val }))} options={inspectorOptions} placeholder="اختر المفتش..." /> ) : ( <Input label="اسم المفتش" name="inspectorName" value={formData.inspectorName} readOnly={true} /> )}
                                            {!canEditStep(1) ? ( <Input label="بلد الشحن" value={formData.shippingCountry} readOnly={true} /> ) : ( <SearchableSelect label="بلد الشحن" value={formData.shippingCountry || ''} onChange={(val) => setFormData(prev => ({ ...prev, shippingCountry: val }))} options={COUNTRIES} placeholder="اختر الدولة..." required /> )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            <Input 
                                                label={(formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') ? "ميناء الوصول (Destination Port)" : "ميناء الشحن (Origin Port)"} 
                                                name="originPort" 
                                                value={formData.originPort} 
                                                onChange={handleInputChange} 
                                                placeholder={(formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') ? "ميناء الوصول" : "ميناء الشحن"} 
                                                readOnly={!canEditStep(1)} 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <SectionHeader 
                                            title={(formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') ? "المصدر وبيانات التخليص" : "المستورد وبيانات التخليص"} 
                                            icon="fa-building" 
                                        />
                                        {!isReadOnly ? ( 
                                            <SearchableSelect 
                                                label={(formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') ? "اسم الشركة المصدرة" : "اسم الشركة المستوردة"} 
                                                value={formData.importer || ''} 
                                                onChange={handleImporterChange} 
                                                options={importerOptions} 
                                                placeholder="ابحث بالاسم أو السجل التجاري..." 
                                                required 
                                            /> 
                                        ) : ( 
                                            <Input 
                                                label={(formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') ? "اسم الشركة المصدرة" : "اسم الشركة المستوردة"} 
                                                value={formData.importer} 
                                                readOnly={true} 
                                            /> 
                                        )}
                                        
                                         {importerStats && (
                                             <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] p-6 space-y-6 animate-fade-in relative overflow-hidden shadow-xl shadow-slate-100/50">
                                                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 blur-3xl rounded-full -mr-16 -mt-16 opacity-50"></div>
                                                 <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50 blur-3xl rounded-full -ml-16 -mb-16 opacity-50"></div>
                                                 
                                                 <div className="flex flex-col md:flex-row justify-between items-start relative z-10 gap-6 text-right" dir="rtl">
                                                     <div className="flex gap-4 items-center">
                                                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm border ${
                                                             (importerStats.complianceRate >= 90) ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                                             (importerStats.complianceRate >= 70) ? 'bg-blue-50 border-blue-100 text-blue-600' : 
                                                             (importerStats.complianceRate >= 40) ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-red-50 border-red-100 text-red-600'
                                                         }`}>
                                                             <i className={`fas ${(importerStats.complianceRate >= 70) ? 'fa-shield-check' : 'fa-biohazard'}`}></i>
                                                         </div>
                                                         <div className="text-right">
                                                             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                                                                 {(formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') ? "ذكاء المصدر (Exporter Intelligence)" : "ذكاء المستورد (Importer Intelligence)"}
                                                             </h5>
                                                             <div className="flex items-center gap-3">
                                                                 <span className="font-black text-slate-800 text-lg tracking-tight">{formData.importer}</span>
                                                                 <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full">
                                                                     <div className={`w-1.5 h-1.5 rounded-full ${importerStats.complianceRate >= 80 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                                                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                                                                         {importerStats.complianceRate >= 90 ? 'موثوقية فائقة' : importerStats.complianceRate >= 70 ? 'موثوق' : 'تحت الرقابة'}
                                                                     </span>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     </div>
                                                     <div className="text-right flex flex-col items-end">
                                                         <div className={`text-3xl font-black leading-none ${
                                                             (importerStats.complianceRate >= 90) ? 'text-emerald-600' :
                                                             (importerStats.complianceRate >= 70) ? 'text-blue-600' : 
                                                             (importerStats.complianceRate >= 40) ? 'text-amber-600' : 'text-red-600'
                                                         }`}>
                                                             {importerStats.complianceRate}%
                                                         </div>
                                                         <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2">نسبة الامتثال الكلية</div>
                                                     </div>
                                                 </div>

                                                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10 text-right" dir="rtl">
                                                     <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl hover:bg-blue-50 transition-all group">
                                                         <div className="flex justify-between items-start mb-2">
                                                             <i className="fas fa-history text-slate-300 group-hover:text-blue-500 transition-colors"></i>
                                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تاريخي</span>
                                                         </div>
                                                         <p className="text-xl font-black text-slate-800">{importerStats.total}</p>
                                                         <p className="text-[9px] text-slate-400 font-bold mt-1">إجمالي الإرساليات</p>
                                                     </div>
                                                     <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl hover:bg-emerald-50 transition-all group">
                                                         <div className="flex justify-between items-start mb-2">
                                                             <i className="fas fa-vial text-slate-300 group-hover:text-emerald-500 transition-colors"></i>
                                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">فحوصات</span>
                                                         </div>
                                                         <p className="text-xl font-black text-slate-800">{importerStats.samplesCount}</p>
                                                         <p className="text-[9px] text-slate-400 font-bold mt-1">عينات مسحوبة</p>
                                                     </div>
                                                     <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl hover:bg-red-50 transition-all group">
                                                         <div className="flex justify-between items-start mb-2">
                                                             <i className="fas fa-exclamation-circle text-slate-300 group-hover:text-red-500 transition-colors"></i>
                                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تجاوزات</span>
                                                         </div>
                                                         <p className={`text-xl font-black ${importerStats.violations > 0 ? 'text-red-600' : 'text-slate-800'}`}>{importerStats.violations}</p>
                                                         <p className="text-[9px] text-slate-400 font-bold mt-1">نتائج غير مطابقة</p>
                                                     </div>
                                                     <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl hover:bg-emerald-50 transition-all group">
                                                         <div className="flex justify-between items-start mb-2">
                                                             <i className="fas fa-calendar-check text-slate-300 group-hover:text-emerald-500 transition-colors"></i>
                                                             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نشاط</span>
                                                         </div>
                                                         <p className="text-sm font-black text-slate-800 truncate h-7 flex items-center">{importerStats.lastActivity ? safeFormatDate(importerStats.lastActivity) : 'لا يوجد'}</p>
                                                         <p className="text-[9px] text-slate-400 font-bold mt-1">آخر معاملة مسجلة</p>
                                                     </div>
                                                 </div>

                                                 <div className="flex flex-col md:flex-row gap-4 items-center justify-between pt-2 relative z-10 border-t border-slate-100 text-right" dir="rtl">
                                                     <div className="flex gap-4 items-center">
                                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الأصناف الأكثر تداولاً:</span>
                                                         <div className="flex flex-wrap gap-2">
                                                             {importerStats.topCommodities.length > 0 ? importerStats.topCommodities.map(cat => (
                                                                 <span key={cat} className="px-3 py-1 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 shadow-sm">
                                                                     {cat}
                                                                 </span>
                                                             )) : <span className="text-[10px] text-slate-400 font-bold italic">لا تتوفر بيانات كافية</span>}
                                                         </div>
                                                     </div>
                                                     
                                                     {importerStats.activeUndertakings > 0 && (
                                                         <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 border border-amber-200 rounded-2xl animate-pulse">
                                                             <i className="fas fa-exclamation-triangle text-amber-500 text-xs"></i>
                                                             <span className="text-[10px] font-black text-amber-600">
                                                                 تنبيه: يوجد ({importerStats.activeUndertakings}) تعهدات قيد المراجعة
                                                             </span>
                                                         </div>
                                                     )}
                                                 </div>
                                             </div>
                                         )}

                                        {!isOutbound && (
                                            <div className="bg-purple-50/50 p-6 rounded-[2rem] border border-purple-100 space-y-4">
                                                <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center gap-2"><i className="fas fa-address-book"></i> بيانات مكتب التخليص</p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <SearchableSelect
                                                            label="مكتب التخليص"
                                                            value={formData.clearanceOffice || ''}
                                                            onChange={(val) => {
                                                                if (isReadOnly) return;
                                                                setHasUnsavedChanges(true);
                                                                setFormData(prev => ({ ...prev, clearanceOffice: val, customsBroker: '', brokerPhone: '' }));
                                                            }}
                                                            options={clearanceOfficeOptions}
                                                            placeholder="اختر المكتب..."
                                                            required
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <SearchableSelect
                                                            label={systemSettings?.customLabels?.clearanceAgent || "المخلص الجمركي"}
                                                            value={formData.customsBroker || ''}
                                                            onChange={(val) => {
                                                                if (isReadOnly) return;
                                                                setHasUnsavedChanges(true);
                                                                const selectedBroker = availableBrokers.find(b => b.name === val);
                                                                setFormData(prev => ({ 
                                                                    ...prev, 
                                                                    customsBroker: val,
                                                                    brokerPhone: selectedBroker?.phone || ''
                                                                }));
                                                            }}
                                                            options={availableBrokers.map(b => ({ label: b.name, value: b.name }))}
                                                            placeholder={availableBrokers.length === 0 && formData.clearanceOffice ? "لا يوجد مخلصين مسجلين" : "اختر المخلص..."}
                                                            disabled={!formData.clearanceOffice || isReadOnly}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-3 gap-4">
                                            <Input label="عدد الحاويات" name="containerCount" type="number" value={typeof formData.containerCount === 'number' && isNaN(formData.containerCount) ? '' : (formData.containerCount ?? '')} onChange={handleInputChange} readOnly={isReadOnly} required />
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">نوع الحاوية <span className="text-red-500">*</span></label>
                                                <select name="containerType" value={formData.containerType ?? ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer disabled:opacity-50" required>
                                                    <option value="">اختر...</option>
                                                    {containerTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            <Input label="حرارة الحاوية" name="containerTemp" value={formData.containerTemp} onChange={handleInputChange} placeholder="C°" readOnly={isReadOnly} />
                                        </div>
                                        <Input label="أرقام الحاويات" name="containerNumber" value={formData.containerNumber} onChange={handleInputChange} placeholder="ABCD1234567, EFGH..." readOnly={isReadOnly} />
                                         {activeSector === ConsignmentType.VETERINARY && isOutbound && (
                                             <Input label="رقم القفل (السيل)" name="sealNumber" value={formData.sealNumber || ''} onChange={handleInputChange} placeholder="أدخل رقم السيل..." readOnly={isReadOnly} />
                                         )}
                                        
                                        {/* Intended Use Field */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">غرض الاستخدام</label>
                                            <select 
                                                name="intendedUse" 
                                                value={formData.intendedUse || ''} 
                                                onChange={handleInputChange} 
                                                disabled={isReadOnly} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-slate-500/10 focus:border-slate-400 transition-all appearance-none cursor-pointer disabled:opacity-50"
                                            >
                                                <option value="">اختر غرض الاستخدام...</option>
                                                {intendedUses?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        
                                    </div>
                                </div>
                            </div>

                            <div id="step-section-2" className={`space-y-8 transition-all ${activeStep === 2 || formViewMode === 'SCROLL' ? 'block animate-fade-in' : 'hidden'}`} >
                                {formViewMode === 'SCROLL' && <SectionHeader title="2. المنتجات" icon="fa-boxes" />}
                                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <h4 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-2"><i className="fas fa-box-open text-slate-400"></i>{editingItemId ? 'تعديل منتج' : 'إضافة منتج للشحنة'}</h4>
                                    {!isReadOnly && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                        <div className="lg:col-span-1">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">المجموعة السلعية</label>
                                                <select name="commodityGroup" value={currentItem.commodityGroup ?? ''} onChange={handleItemChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer">
                                                    <option value="">اختر المجموعة...</option>
                                                    {filteredCommodityGroups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        
                                        {/* منطق التبديل بين المنتج العادي والمبيدات */}
                                        <div className="lg:col-span-2">
                                            {currentItem.commodityGroup !== 'مبيدات زراعية' ? (
                                                <SearchableSelect label="اسم المنتج" value={currentItem.description || ''} onChange={handleProductSelect} options={availableProducts} placeholder="اختر أو اكتب اسم المنتج..." />
                                            ) : (
                                                <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100 flex items-center justify-center h-full">
                                                    <span className="text-[10px] font-black text-emerald-700">إدارة المبيدات النشطة مفعلة</span>
                                                </div>
                                            )}
                                        </div>

                                        {activeRiskStats && (
                                            <>
                                                <div className="lg:col-span-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between animate-fade-in">
                                                    <div className="flex flex-col gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg ${activeRiskStats.plan.riskLevel === 'HIGH' ? 'bg-red-500' : activeRiskStats.plan.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-green-500'}`}>
                                                                <i className="fas fa-chart-pie"></i>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase">المخاطر والخطط</p>
                                                                <p className="font-black text-slate-800 text-sm">{activeRiskStats.plan.productName}</p>
                                                            </div>
                                                        </div>
                                                        {activeRiskStats.plan.requiredAnalysis && activeRiskStats.plan.requiredAnalysis.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                <span className="text-[9px] font-bold text-slate-500 whitespace-nowrap ml-1">الفحوصات المطلوبة:</span>
                                                                {activeRiskStats.plan.requiredAnalysis.map((analysis, idx) => (
                                                                    <span key={idx} className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold">{analysis}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-4 text-center">
                                                        <div>
                                                            <p className="text-[9px] text-slate-400 font-bold">الحصة</p>
                                                            <p className="text-lg font-black text-slate-800">{activeRiskStats.quota}</p>
                                                        </div>
                                                        <div className="border-r border-slate-200 pr-4">
                                                            <p className="text-[9px] text-slate-400 font-bold">تم سحبه</p>
                                                            <p className="text-lg font-black text-blue-600">{activeRiskStats.taken}</p>
                                                        </div>
                                                        <div className="border-r border-slate-200 pr-4">
                                                            <p className="text-[9px] text-slate-400 font-bold">المتبقي</p>
                                                            <p className={`text-lg font-black ${activeRiskStats.remaining === 0 ? 'text-green-500' : 'text-red-500'}`}> {activeRiskStats.remaining} </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {activeRiskStats.remaining > 0 && (
                                                    <div className="lg:col-span-3 mt-1 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-pulse shadow-sm">
                                                        <i className="fas fa-exclamation-circle text-2xl"></i>
                                                        <div>
                                                            <p className="font-black text-sm">تنبيه سحب عينة</p>
                                                            <p className="text-xs font-bold mt-1">
                                                                هذا المنتج مدرج في ملف المخاطر. يرجى سحب عينة حيث أن الحصة المتبقية ({activeRiskStats.remaining})
                                                                {(activeRiskStats.plan.requiredAnalysis && activeRiskStats.plan.requiredAnalysis.length > 0) ? `، والفحوصات الواجب أخذها بناء على ملف المخاطر للمنتج هي: ${activeRiskStats.plan.requiredAnalysis.join('، ')}.` : '.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {activeRiskStats.remaining === 0 && (
                                                    <div className="lg:col-span-3 mt-1 bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                                                        <i className="fas fa-check-circle text-2xl"></i>
                                                        <div>
                                                            <p className="font-black text-sm">اكتملت حصة العينات</p>
                                                            <p className="text-xs font-bold mt-1">لا يلزم سحب عينة لهذا المنتج حيث اكتملت الحصة الشهرية المحددة في ملف المخاطر.</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        
                                        {/* --- Veterinary Medicine Logic --- */}
                                        {activeSector === ConsignmentType.VETERINARY && (
                                            <div className="lg:col-span-3 my-2">
                                                <label className={`inline-flex items-center gap-2 cursor-pointer px-4 py-3 rounded-xl border transition-all ${isVetMedicine ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100 hover:border-slate-300'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        className="accent-amber-600 w-4 h-4 rounded"
                                                        checked={isVetMedicine}
                                                        onChange={(e) => setIsVetMedicine(e.target.checked)}
                                                    />
                                                    <span className={`text-xs font-black ${isVetMedicine ? 'text-amber-800' : 'text-slate-500'}`}>المنتج دواء / مستحضر بيطري (إضافة المادة الفعالة)</span>
                                                </label>
                                            </div>
                                        )}
                                        {isVetMedicine && activeSector === ConsignmentType.VETERINARY && (
                                            <div className="lg:col-span-3 animate-fade-in bg-amber-50/50 p-4 rounded-xl border border-amber-100">
                                                <Input label="المادة الفعالة / التركيب (Active Ingredient)" name="activeIngredients" value={currentItem.activeIngredients?.join(', ') || ''} onChange={(e: any) => setCurrentItem(prev => ({ ...prev, activeIngredients: e.target.value.split(',').map((s: string) => s.trim()) }))} placeholder="مثال: Oxytetracycline 20%" />
                                            </div>
                                        )}

                                        {/* --- حقول المبيدات المرتبطة بالمجموعة السلعية 'مبيدات زراعية' --- */}
                                        {currentItem.commodityGroup === 'مبيدات زراعية' && activeSector === ConsignmentType.AGRICULTURAL && (
                                            <div className="lg:col-span-3 animate-fade-in bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 space-y-4">
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    {/* قائمة منسدلة لاسم المبيد */}
                                                    <SearchableSelect 
                                                        label="إسم المبيد" 
                                                        value={currentItem.pesticideName || ''} 
                                                        onChange={handlePesticideSelect}
                                                        options={pesticides.map(p => ({ label: p.name, value: p.name }))}
                                                        placeholder="اختر اسم المبيد..."
                                                        required
                                                    />
                                                    
                                                    {/* قائمة منسدلة للمادة الفعالة (مرتبطة تلقائياً) */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">المادة الفعالة</label>
                                                        <input 
                                                            type="text"
                                                            value={currentItem.activeIngredients?.join(', ') || ''} 
                                                            onChange={(e) => setCurrentItem(prev => ({ ...prev, activeIngredients: e.target.value.split(',').map(s => s.trim()) }))}
                                                            placeholder="المادة الفعالة (افصل بفاصلة)..."
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all"
                                                        />
                                                    </div>

                                                    {/* نوع المبيد */}
                                                    <Input 
                                                        label="نوع المبيد" 
                                                        name="pesticideType" 
                                                        value={currentItem.pesticideType || ''} 
                                                        onChange={handleItemChange} 
                                                        placeholder="حشري، فطري..." 
                                                    />
                                                </div>
                                                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-2">
                                                    <i className="fas fa-link"></i>
                                                    يتم ربط إسم المبيد التجاري بالمادة الفعالة المعتمدة في النظام لضمان دقة البيانات.
                                                </p>
                                            </div>
                                        )}

                                        <Input label="العلامة التجارية" name="brand" value={currentItem.brand} onChange={handleItemChange} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="رقم التشغيلة" name="batchNumber" value={currentItem.batchNumber} onChange={handleItemChange} />
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">الوحدة</label>
                                                <select name="packagingUnit" value={currentItem.packagingUnit ?? ''} onChange={handleItemChange} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer">
                                                    <option value="">اختر الوحدة...</option>
                                                    {PACKAGING_UNITS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                        <SearchableSelect 
                                            label="المنشأ" 
                                            value={currentItem.origin || ''} 
                                            onChange={(val) => setCurrentItem(prev => ({ ...prev, origin: val }))} 
                                            options={COUNTRIES} 
                                            placeholder="اختر الدولة..." 
                                        />
                                        <Input label="الوزن (كجم)" name="weight" type="number" value={typeof currentItem.weight === 'number' && isNaN(currentItem.weight) ? '' : (currentItem.weight ?? '')} onChange={handleItemChange} />
                                        <Input label="عدد الطرود" name="packageCount" type="number" value={typeof currentItem.packageCount === 'number' && isNaN(currentItem.packageCount) ? '' : (currentItem.packageCount ?? '')} onChange={handleItemChange} />
                                        <Input label="تاريخ الإنتاج" name="productionDate" type="date" value={currentItem.productionDate} onChange={handleItemChange} />
                                        <Input label="تاريخ الانتهاء" name="expiryDate" type="date" value={currentItem.expiryDate} onChange={handleItemChange} />
                                        <Input label="الشركة المنتجة" name="producingCompany" value={currentItem.producingCompany} onChange={handleItemChange} placeholder="اسم الشركة المنتجة" />
                                        <Input label="درجة حرارة الحفظ" name="storageTemp" value={currentItem.storageTemp} onChange={handleItemChange} placeholder="C°" />
                                    </div>
                                    )}
                                    {!isReadOnly && ( <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-slate-50">{editingItemId && <button onClick={cancelEditItem} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 text-xs">إلغاء</button>} {!editingItemId && <button onClick={() => setCurrentItem({ packagingUnit: 'كرتون' })} className="px-6 py-3 rounded-xl font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 text-xs" title="تفريغ الحقول"><i className="fas fa-eraser"></i> تفريغ</button>} <button onClick={addItem} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-black text-xs hover:bg-black transition-all shadow-lg flex items-center gap-2"><i className={`fas ${editingItemId ? 'fa-save' : 'fa-plus'}`}></i><span>{editingItemId ? 'حفظ التعديلات' : 'إضافة للقائمة'}</span></button></div> )}
                                </div>
                                <div className="space-y-4">
                                    <h5 className="font-black text-slate-800 text-sm border-b border-slate-100 pb-2">قائمة المنتجات ({formData.items?.length})</h5>
                                    {formData.items?.map((item, idx) => { 
                                        const riskPlan = samplingPlans.find(p => p.id === item.riskPlanId); 
                                        const quotaStat = consignmentQuotaStats.find(s => s.itemId === item.id);
                                        return ( <div key={item.id} className={`bg-white p-4 rounded-2xl border flex justify-between items-center ${item.riskFlag ? 'border-red-200 shadow-md ring-1 ring-red-500/10' : 'border-slate-100'}`}> 
                                            <div className="flex items-center gap-4"> 
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs">{idx + 1}</div> 
                                                <div> 
                                                    <div className="flex items-center gap-2"> 
                                                        <p className="font-black text-slate-800 text-sm">{item.description}</p> 
                                                        {item.riskFlag && <span className="text-[9px] font-black bg-red-500 text-white px-2 py-0.5 rounded animate-pulse">{riskPlan?.riskLevel || 'HIGH'} RISK</span>} 
                                                        {quotaStat?.plan && (
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded ${quotaStat.remaining > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                                الحصة المتبقية: {quotaStat.remaining}
                                                            </span>
                                                        )}
                                                    </div> 
                                                    <div className="flex flex-wrap gap-2 mt-1"> 
                                                        <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded font-bold">{item.origin}</span> 
                                                        <span className="text-[10px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded font-bold">{item.weight} kg</span> 
                                                    </div> 
                                                </div> 
                                            </div> 
                                            {!isReadOnly && ( <div className="flex gap-2"> <button onClick={() => handleDuplicateItem(item)} className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center" title="تكرار المنتج"><i className="fas fa-copy text-xs"></i></button> <button onClick={() => handleEditItem(item)} className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center" title="تعديل"><i className="fas fa-pen text-xs"></i></button> <button onClick={() => removeItem(item.id)} className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center" title="حذف"><i className="fas fa-trash text-xs"></i></button> </div> )} 
                                        </div> )})}
                                </div>
                            </div>

                            <div id="step-section-3" className={`grid grid-cols-1 gap-8 transition-all ${activeStep === 3 || formViewMode === 'SCROLL' ? 'block animate-fade-in' : 'hidden'}`}>
                                {formViewMode === 'SCROLL' && <SectionHeader title="3. المعاينة والعينات" icon="fa-search" />}
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <SectionHeader title="المعاينة والفحص الظاهري" icon="fa-search" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">نوع الفحص</label>
                                            <select name="inspectionType" value={formData.inspectionType ?? ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer disabled:opacity-50">
                                                <option value="">اختر النوع...</option>
                                                {inspectionTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <Input label="تاريخ المعاينة" name="inspectionDate" type="date" value={formData.inspectionDate || new Date().toISOString().split('T')[0]} onChange={handleInputChange} readOnly={isReadOnly} />
                                        <Input label="موقع المعاينة" name="inspectionLocation" value={formData.inspectionLocation} onChange={handleInputChange} placeholder="موقع المعاينة" readOnly={isReadOnly} />
                                        <Input label="اسم المفتش" name="inspectorName" value={formData.inspectorName || currentUser.name} onChange={handleInputChange} placeholder="اسم المفتش" readOnly={isReadOnly} />
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">نتيجة المعاينة الظاهرية</label>
                                            <select name="inspectionResult" value={formData.inspectionResult ?? ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer disabled:opacity-50">
                                                <option value="قيد الفحص">قيد الفحص</option>
                                                <option value="مطابق">مطابق</option>
                                                <option value="غير مطابق">غير مطابق</option>
                                                {activeSector === ConsignmentType.AGRICULTURAL && isOutbound && (
                                                    <option value="معالجة">معالجة</option>
                                                )}
                                            </select>
                                        </div>
                                        {formData.inspectionResult === 'معالجة' && activeSector === ConsignmentType.AGRICULTURAL && isOutbound && (
                                            <div className="md:col-span-2 bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 space-y-6 animate-fade-in">
                                                <h4 className="font-black text-emerald-800 text-sm flex items-center gap-2">
                                                    <i className="fas fa-flask"></i> بيانات المعالجة (Treatment Details)
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <Input label="تاريخ المعالجة" name="treatmentDate" type="date" value={formData.treatmentDate} onChange={handleInputChange} readOnly={isReadOnly} />
                                                    <Input label="نوع المعالجة" name="treatmentType" value={formData.treatmentType} onChange={handleInputChange} placeholder="مثال: تبخير" readOnly={isReadOnly} />
                                                    <Input label="نسبة التركيز" name="treatmentConcentration" value={formData.treatmentConcentration} onChange={handleInputChange} placeholder="g/m³" readOnly={isReadOnly} />
                                                    <Input label="الكيماويات (المادة الفعالة)" name="treatmentChemicals" value={formData.treatmentChemicals} onChange={handleInputChange} placeholder="Active Ingredient" readOnly={isReadOnly} />
                                                    <Input label="مدة التعرض" name="treatmentExposureDuration" value={formData.treatmentExposureDuration} onChange={handleInputChange} placeholder="مثال: 24 ساعة" readOnly={isReadOnly} />
                                                    <Input label="درجة الحرارة" name="treatmentTemperature" value={formData.treatmentTemperature} onChange={handleInputChange} placeholder="C°" readOnly={isReadOnly} />
                                                    <div className="md:col-span-3">
                                                        <Input label="رقم الشهادة المرتبطة" name="treatmentCertificateRef" value={formData.treatmentCertificateRef} onChange={handleInputChange} placeholder="رقم شهادة المعالجة إن وجد" readOnly={isReadOnly} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="md:col-span-2 space-y-2">
                                            <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">ملاحظات المعاينة</label>
                                            <textarea name="inspectionNotes" value={formData.inspectionNotes || ''} onChange={handleInputChange as any} disabled={isReadOnly} placeholder="ملاحظات المعاينة الظاهرية..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all min-h-[100px] resize-none disabled:opacity-50" />
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-[11px] text-slate-500 font-bold">
                                        <i className="fas fa-info-circle ml-2"></i>
                                        بناءً على ملف المخاطر، يرجى مراجعة الحصص الشهرية المتبقية للمنتجات قبل اتخاذ قرار سحب العينة.
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {consignmentQuotaStats.filter(s => s.plan).map(stat => (
                                            <div key={stat.itemId} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between flex-col gap-2">
                                                <div className="flex w-full items-start justify-between">
                                                    <div className="overflow-hidden">
                                                        <p className="text-[10px] font-black text-slate-800 truncate">{stat.plan?.productName}</p>
                                                        <p className="text-[9px] text-slate-400 font-bold">Quota: {stat.quota} | Remaining: {stat.remaining}</p>
                                                    </div>
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${stat.remaining > 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                                        <i className={`fas ${stat.remaining > 0 ? 'fa-exclamation-triangle' : 'fa-check-circle'}`}></i>
                                                    </div>
                                                </div>
                                                {stat.plan?.requiredAnalysis && stat.plan.requiredAnalysis.length > 0 && (
                                                    <div className="w-full mt-1 border-t border-slate-100 pt-2">
                                                        <span className="text-[9px] font-bold text-slate-500 block mb-1">الفحوصات الواجب أخذها:</span>
                                                        <div className="flex flex-wrap gap-1">
                                                            {stat.plan.requiredAnalysis.map((analysis, idx) => (
                                                                <span key={idx} className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] font-bold">{analysis}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="w-5 h-5 accent-slate-800 rounded-lg" checked={!!formData.hasSample} onChange={(e) => { setFormData(prev => ({...prev, hasSample: e.target.checked})); setHasUnsavedChanges(true); }} disabled={isReadOnly} /><span className="font-bold text-slate-700 text-sm">يتطلب سحب عينات للمختبر</span></label></div>
                                    {formData.hasSample && (
                                        <div className="mt-8 pt-8 border-t border-slate-100 animate-fade-in">
                                            <div className="flex justify-between items-center mb-4"><h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><i className="fas fa-vial text-blue-500"></i> إدارة العينات</h4>{(activeSector === ConsignmentType.FOOD_SAFETY || activeSector === ConsignmentType.AGRICULTURAL) && ( <button onClick={() => setShowLabForm(true)} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><i className="fas fa-file-contract"></i> استمارة العينة</button> )}</div>
                                            {formData.samples && formData.samples.length > 0 && ( <div className="space-y-3 mb-6">{formData.samples.map((s, idx) => ( <div key={idx} className="flex justify-between items-center bg-blue-50/50 p-4 rounded-2xl border border-blue-100"> <div> <p className="font-black text-blue-900 text-xs flex items-center gap-2">{s.sampleId} <button onClick={() => setQrSampleId(s.sampleId)} className="text-slate-400 hover:text-blue-600 bg-white shadow-sm border border-slate-200 w-6 h-6 rounded-md flex items-center justify-center transition-colors" title="عرض رمز QR"><i className="fas fa-qrcode"></i></button></p> <p className="text-[10px] text-slate-500 mt-1 font-bold">{s.labName} | {s.labAnalysisType.join(', ')}</p> <p className="text-[10px] text-slate-400 mt-1">{s.sampleCondition ? `حالة العينة: ${s.sampleCondition}` : ''} {s.sampleSeal ? `| رقم الختم: ${s.sampleSeal}` : ''}</p> </div> {!isReadOnly && ( <div className="flex gap-2"> <button onClick={() => handleEditSample(s)} className="text-blue-500 hover:text-blue-700 text-xs font-bold px-2"><i className="fas fa-pen"></i></button> <button onClick={() => handleRemoveSample(s.sampleId)} className="text-red-400 hover:text-red-600 text-xs font-bold px-2"><i className="fas fa-trash"></i></button> </div> )} </div> ))}</div> )}
                                            {!isReadOnly && ( <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200"> 
                                                <h5 className="font-bold text-slate-700 text-xs mb-4">{editingSampleId ? 'تعديل العينة' : 'إضافة عينة جديدة'}</h5> 
                                                <div className="space-y-4"> 
                                                    
                                                    {/* Product Selection for Sample */}
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase">تحديد المنتجات للعينة (اختياري)</label>
                                                        {formData.items && formData.items.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1 border border-slate-100 rounded-xl bg-white scroll-fade-y">
                                                                {formData.items.map(item => {
                                                                    const isSelected = newSample.itemIds?.includes(item.id);
                                                                    return (
                                                                        <div 
                                                                            key={item.id} 
                                                                            onClick={() => {
                                                                                setNewSample(prev => {
                                                                                    const currentIds = prev.itemIds || [];
                                                                                    const newIds = currentIds.includes(item.id) 
                                                                                        ? currentIds.filter(id => id !== item.id)
                                                                                        : [...currentIds, item.id];
                                                                                    return { ...prev, itemIds: newIds };
                                                                                });
                                                                            }}
                                                                            className={`p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                                                                                isSelected 
                                                                                ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                                                                                : 'bg-white border-slate-100 text-slate-600 hover:border-blue-300'
                                                                            }`}
                                                                        >
                                                                            <div className="overflow-hidden">
                                                                                <p className="text-[10px] font-bold truncate">{item.description}</p>
                                                                                <div className={`flex gap-2 text-[8px] font-mono mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                                                                                    <span>{item.brand ? `Brand: ${item.brand}` : 'No Brand'}</span>
                                                                                    <span>|</span>
                                                                                    <span>{item.origin}</span>
                                                                                </div>
                                                                            </div>
                                                                            {isSelected && <i className="fas fa-check-circle text-xs text-green-400"></i>}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <p className="text-xs text-red-400 font-bold bg-red-50 p-2 rounded-lg border border-red-100">يرجى إضافة منتجات في الخطوة 2 أولاً لتتمكن من ربطها بالعينة.</p>
                                                        )}
                                                    </div>
                                                    <div className="space-y-2"> 
                                                        <label className="text-[10px] font-black text-slate-500 uppercase">نوع الفحص</label> 
                                                        <div className="flex flex-wrap gap-2">{labAnalysisTypes.map(t => ( <button key={t} onClick={() => handleToggleNewSampleAnalysis(t)} className={`px-3 py-2 rounded-xl text-[10px] font-bold border ${newSample.labAnalysisType?.includes(t) ? 'bg-slate-800 text-white' : 'bg-white'}`}>{t}</button> ))}</div> 
                                                    </div> 
                                                    <div className="space-y-2"> 
                                                        <label className="text-[10px] font-black text-slate-500 uppercase">المختبر</label> 
                                                        <div className="flex flex-wrap gap-2">{compatibleLabs.length > 0 ? compatibleLabs.map(lab => ( <button key={lab.id} onClick={() => setNewSample(prev => ({ ...prev, labName: lab.name, labDelegate: '' }))} className={`px-3 py-2 rounded-xl text-[10px] font-bold border ${newSample.labName === lab.name ? 'bg-blue-600 text-white' : 'bg-white'}`}>{lab.name}</button> )) : <p className="text-xs text-slate-400 italic">اختر الفحص أولاً</p>}</div> 
                                                    </div> 
                                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">المندوب</label>
                                                            <select value={newSample.labDelegate || ''} onChange={(e) => setNewSample(prev => ({...prev, labDelegate: e.target.value}))} disabled={!newSample.labName} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all appearance-none cursor-pointer disabled:opacity-50">
                                                                <option value="">اختر المندوب...</option>
                                                                {availableDelegates.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                                            </select>
                                                        </div>
                                                        <Input label="حجم العينة" value={newSample.sampleSize} onChange={(e: any) => setNewSample(prev => ({...prev, sampleSize: e.target.value}))} />
                                                        <Input label="حالة العينة" value={newSample.sampleCondition || ''} onChange={(e: any) => setNewSample(prev => ({...prev, sampleCondition: e.target.value}))} placeholder="مثال: مجمدة، مبردة، تالفة..." />
                                                        <Input label="رقم ختم العينة" value={newSample.sampleSeal || ''} onChange={(e: any) => setNewSample(prev => ({...prev, sampleSeal: e.target.value}))} placeholder="رقم الختم إن وجد" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-500 uppercase">ملاحظات العينة</label>
                                                        <textarea value={newSample.notes || ''} onChange={(e: any) => setNewSample(prev => ({...prev, notes: e.target.value}))} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all resize-none h-24" placeholder="أضف أي ملاحظات إضافية حول العينة..." />
                                                    </div>
                                                    <button onClick={handleAddSample} className="w-full bg-blue-600 text-white py-3 rounded-xl font-black text-xs mt-2 shadow-lg"> {editingSampleId ? 'حفظ التعديل' : 'إضافة العينة'} </button> 
                                                </div> 
                                            </div> )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div id="step-section-4" className={`space-y-8 transition-all ${activeStep === 4 || formViewMode === 'SCROLL' ? 'block animate-fade-in' : 'hidden'}`}>
                                {formViewMode === 'SCROLL' && <SectionHeader title="4. المستندات" icon="fa-folder-open" />}
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <SectionHeader title="مستندات المعاملة" icon="fa-folder-open" />
                                    
                                    {(activeSector === ConsignmentType.AGRICULTURAL || activeSector === ConsignmentType.VETERINARY) && (formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') && (
                                        <div className="mb-8 p-6 bg-emerald-50 rounded-3xl border border-emerald-100 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                                    <i className="fas fa-certificate text-xl"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-800 text-sm">
                                                        {activeSector === ConsignmentType.VETERINARY ? 'شهادة الصحة البيطرية' : 'شهادة الصحة النباتية'}
                                                    </h4>
                                                    <p className="text-[10px] text-emerald-600 font-bold">
                                                        {activeSector === ConsignmentType.VETERINARY ? 'Veterinary Health Certificate' : 'Phytosanitary Certificate'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => setShowPhytoCert(true)}
                                                className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                                            >
                                                <i className="fas fa-eye"></i>
                                                عرض / طباعة الشهادة
                                            </button>
                                        </div>
                                    )}
                                    {editingId ? ( <> {!isReadOnly && ( <div className="mb-6"> <label className={`block w-full border-2 border-dashed border-slate-300 rounded-[2rem] p-10 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50/50 group ${isUploadingDoc ? 'opacity-50 pointer-events-none' : ''}`}> <input type="file" className="hidden" onChange={handleDocUpload} accept="image/*,application/pdf" disabled={isUploadingDoc} /> <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-md border border-slate-100 group-hover:scale-110 transition-transform text-blue-500"> {isUploadingDoc ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-cloud-upload-alt text-2xl"></i>} </div> <p className="text-sm font-black text-slate-700">رفع مستند جديد</p> </label> </div> )} <div className="space-y-4"> <h5 className="font-black text-slate-800 text-sm mb-4">المرفقات ({currentDocs.length})</h5> <div className="grid grid-cols-2 md:grid-cols-4 gap-6"> {currentDocs.map(doc => ( <div key={doc.id} className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden h-[180px]"> <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center cursor-pointer"> {doc.type === 'DOC' ? <i onClick={() => setViewingDoc(doc)} className="fas fa-file-pdf text-4xl text-red-500"></i> : <img referrerPolicy="no-referrer" onClick={() => setViewingDoc(doc)} src={doc.url} className="w-full h-full object-cover" />} <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"> <button onClick={() => setViewingDoc(doc)} className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-lg" title="عرض"><i className="fas fa-eye text-xs"></i></button> <a href={doc.url} download={doc.title} className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center shadow-lg" title="تنزيل"><i className="fas fa-download text-xs"></i></a> {!isReadOnly && <button onClick={() => handleDeleteDoc(doc.id)} className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg" title="حذف"><i className="fas fa-trash-alt text-xs"></i></button>} </div> </div> <div className="p-2 border-t text-[10px] font-bold text-slate-500 truncate">{doc.title}</div> </div> ))} </div> </div> </> ) : ( <div className="text-center py-12 bg-blue-50/50 rounded-[2rem] border border-blue-100"><p className="text-sm font-bold text-blue-700">يرجى حفظ البيانات الأساسية أولاً</p></div> )}
                                </div>
                            </div>

                            <div id="step-section-5" className={`space-y-8 transition-all ${activeStep === 5 || formViewMode === 'SCROLL' ? 'block animate-fade-in' : 'hidden'}`}>
                                {formViewMode === 'SCROLL' && <SectionHeader title="5. القرار والرسوم" icon="fa-gavel" />}
                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                    <SectionHeader title="القرار النهائي والرسوم" icon="fa-gavel" />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6"> 
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">الرسوم (ر.ع)</label>
                                                {!isReadOnly && !isFeeExempt && (
                                                    <button 
                                                        onClick={applySuggestedFees}
                                                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
                                                        title="احتساب الرسوم بناءً على الوزن والقطاع"
                                                    >
                                                        <i className="fas fa-calculator"></i>
                                                        احتساب تلقائي
                                                    </button>
                                                )}
                                            </div>
                                            <input 
                                                type="number" 
                                                name="fees" 
                                                value={formData.fees ?? ''} 
                                                onChange={handleInputChange} 
                                                readOnly={isFeeExempt || isReadOnly}
                                                className={`w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all ${isFeeExempt || isReadOnly ? 'bg-slate-100 cursor-not-allowed' : ''}`}
                                            />
                                            {isFeeExempt && <p className="text-[9px] text-amber-600 font-bold">معفى من الرسوم (ترانزيت)</p>}
                                        </div>
                                        <div className="space-y-2"> 
                                            <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">الإجراء الفني</label> 
                                            <select 
                                                name="technicalAction" 
                                                value={formData.technicalAction ?? ''} 
                                                onChange={handleInputChange} 
                                                disabled={isReadOnly || (formData.isLocked && currentUser.role !== 'ADMIN')} 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer disabled:opacity-50"
                                            > 
                                                <option value="">اختر الإجراء...</option> 
                                                {filteredTechnicalActions.map(opt => <option key={opt} value={opt}>{opt}</option>)} 
                                            </select> 
                                        </div> 
                                    </div>
                                    
                                    {formData.technicalAction === 'إستفسار' && (
                                        <div className="mb-4 animate-fade-in">
                                            <Input 
                                                label="تفاصيل الإستفسار المطلوب" 
                                                name="inquiryType" 
                                                value={formData.inquiryType || ''} 
                                                onChange={handleInputChange} 
                                                disabled={isReadOnly} 
                                                placeholder="مثال: يرجى موافاتنا بالشهادة الصحية الأصلية أو توضيح رقم التشغيلة..."
                                            />
                                        </div>
                                    )}

                                    {formData.technicalAction === 'إجراءات متعددة' && (
                                        <div className="mb-6 animate-fade-in bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                            <h4 className="font-black text-slate-800 text-sm mb-4">تحديد الإجراء لكل منتج</h4>
                                            <div className="space-y-4">
                                                {formData.items?.map((item, idx) => (
                                                    <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xs">{idx + 1}</div>
                                                                <div>
                                                                    <p className="font-black text-slate-800 text-sm">{item.description}</p>
                                                                    <p className="text-[10px] text-slate-500 font-bold mt-1">{item.weight} kg | {item.origin}</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-full md:w-auto flex flex-col gap-2">
                                                            <select 
                                                                value={item.technicalAction || ''} 
                                                                onChange={(e) => {
                                                                    const newItems = [...(formData.items || [])];
                                                                    newItems[idx] = { ...newItems[idx], technicalAction: e.target.value };
                                                                    setFormData(prev => ({ ...prev, items: newItems }));
                                                                    setHasUnsavedChanges(true);
                                                                }}
                                                                disabled={isReadOnly} 
                                                                className="w-full md:w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer"
                                                            >
                                                                <option value="">اختر الإجراء...</option>
                                                                {TECHNICAL_ACTIONS.filter(a => a !== 'إجراءات متعددة').map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                            </select>
                                                            {item.technicalAction === 'رفض' && (
                                                                <select 
                                                                    value={item.rejectionReason || ''} 
                                                                    onChange={(e) => {
                                                                        const newItems = [...(formData.items || [])];
                                                                        newItems[idx] = { ...newItems[idx], rejectionReason: e.target.value };
                                                                        setFormData(prev => ({ ...prev, items: newItems }));
                                                                        setHasUnsavedChanges(true);
                                                                    }}
                                                                    disabled={isReadOnly} 
                                                                    className="w-full md:w-48 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-xs font-bold text-red-800 outline-none focus:border-red-500 transition-all appearance-none cursor-pointer"
                                                                >
                                                                    <option value="">سبب الرفض...</option>
                                                                    {rejectionReasons.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                                                                </select>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {formData.technicalAction === 'تحويل' && <div className="mb-4 animate-fade-in"><SearchableSelect label="جهة التحويل" value={formData.transferTo || ''} onChange={(val) => setFormData(prev => ({...prev, transferTo: val}))} options={transferDestinations} placeholder="اختر الجهة..." /></div>}
                                    {formData.technicalAction === 'رفض' && ( 
                                        <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mb-6">
                                            <div className="flex justify-end mb-4">
                                                <button onClick={() => setShowRejectionForm(true)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-black">طباعة إخطار الرفض</button>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-600">أسباب الرفض</label>
                                                    <MultiSelectDropdown options={rejectionReasons} selected={formData.rejectionReason ? formData.rejectionReason.split('، ') : []} onChange={(selected: string[]) => { setFormData(prev => ({ ...prev, rejectionReason: selected.join('، ') })); setHasUnsavedChanges(true); }} disabled={isReadOnly} placeholder="اختر الأسباب..." />
                                                </div>
                                                <Input label="تفاصيل الرفض" name="rejectionDetails" value={formData.rejectionDetails} onChange={handleInputChange} readOnly={isReadOnly} />
                                                
                                                <div className="col-span-2 mt-4 pt-4 border-t border-red-100">
                                                    <label className="text-xs font-black text-red-800 mb-3 block">نوع إجراء الرفض</label>
                                                    <div className="flex flex-wrap gap-4 mb-4">
                                                        {['إعادة تصدير', 'إتلاف', 'استثناء'].map(action => ( 
                                                            <label key={action} className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border transition-all ${ formData.rejectionAction === action ? 'bg-red-600 text-white border-red-600' : 'bg-white border-red-200 text-red-700' }`}> 
                                                                <input type="radio" name="rejectionAction" value={action} checked={formData.rejectionAction === action} onChange={() => setFormData(prev => ({ ...prev, rejectionAction: action }))} disabled={isReadOnly} className="hidden" /> 
                                                                <span className="text-xs font-bold">{action}</span> 
                                                            </label> 
                                                        ))}
                                                    </div>

                                                    {/* حقول مشروطة بناءً على إجراء الرفض */}
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                                        {formData.rejectionAction === 'إعادة تصدير' && (
                                                            <Input 
                                                                label="رقم بيان إعادة التصدير" 
                                                                name="reExportBayan" 
                                                                value={formData.reExportBayan || ''} 
                                                                onChange={handleInputChange} 
                                                                placeholder="أدخل رقم البيان..."
                                                                readOnly={isReadOnly}
                                                            />
                                                        )}
                                                        {formData.rejectionAction === 'إتلاف' && (
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-black text-slate-600 block">محضر الإعدام</label>
                                                                <div className="flex items-center gap-2">
                                                                    <label className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold cursor-pointer hover:bg-slate-50 transition-all flex items-center gap-2">
                                                                        <i className="fas fa-paperclip text-slate-400"></i>
                                                                        <span className="text-slate-500 truncate">{formData.destructionAttachment ? 'تم إرفاق الملف' : 'إرفاق محضر الإعدام...'}</span>
                                                                        <input 
                                                                            type="file" 
                                                                            className="hidden" 
                                                                            onChange={async (e) => {
                                                                                const file = e.target.files?.[0];
                                                                                if (file) {
                                                                                    // محاكاة رفع الملف أو استخدام وظيفة الرفع الموجودة
                                                                                    const url = await FB.uploadFile(file, `destructions/${formData.id}/${file.name}`);
                                                                                    setFormData(prev => ({ ...prev, destructionAttachment: url }));
                                                                                    showToast("تم رفع محضر الإعدام بنجاح", "success");
                                                                                }
                                                                            }} 
                                                                            disabled={isReadOnly}
                                                                        />
                                                                    </label>
                                                                    {formData.destructionAttachment && (
                                                                        <a href={formData.destructionAttachment} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                                                                            <i className="fas fa-eye text-xs"></i>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                        {formData.rejectionAction === 'استثناء' && (
                                                            <Input 
                                                                label="رقم المراسلة" 
                                                                name="correspondenceNumber" 
                                                                value={formData.correspondenceNumber || ''} 
                                                                onChange={handleInputChange} 
                                                                placeholder="أدخل رقم المراسلة..."
                                                                readOnly={isReadOnly}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div> 
                                    )}
                                    {formData.technicalAction === 'إفراج مشروط' && ( <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-6 space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">نوع الإفراج</label>
                                                <select name="conditionalReleaseType" value={formData.conditionalReleaseType ?? ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer disabled:opacity-50">
                                                    <option value="">اختر...</option>
                                                    {CONDITIONAL_RELEASE_OPTS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            {formData.conditionalReleaseType === 'تحويل للمدينة اللوجستية' && (
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">تحديد المحطة</label>
                                                    <select name="transferTo" value={formData.transferTo ?? ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer disabled:opacity-50">
                                                        <option value="">اختر المحطة...</option>
                                                        {LOGISTICS_STATIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                    </select>
                                                </div>
                                            )}
                                            {formData.conditionalReleaseType === 'تحويل لمخازن الشركة' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 col-span-2 animate-fade-in">
                                                    <Input label="اسم المخزن" name="storeName" value={formData.storeName} onChange={handleInputChange} placeholder="اسم مخزن الشركة" readOnly={isReadOnly} />
                                                    <Input label="رقم ترخيص المخزن" name="storeLicense" value={formData.storeLicense} onChange={handleInputChange} placeholder="رقم الترخيص البلدي/الصحي" readOnly={isReadOnly} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">نوع التعهد</label>
                                                <select name="undertakingType" value={formData.undertakingType ?? ''} onChange={handleInputChange} disabled={isReadOnly} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all appearance-none cursor-pointer disabled:opacity-50">
                                                    <option value="">اختر...</option>
                                                    {undertakingTypes.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            <Input label="تاريخ الانتهاء" name="undertakingCompletionDate" type="date" value={formData.undertakingCompletionDate} onChange={handleInputChange} readOnly={isReadOnly} />
                                        </div>
                                        <label className="flex items-center gap-2">
                                            <input 
                                                type="checkbox" 
                                                checked={!!formData.hasUndertaking} 
                                                onChange={(e) => {
                                                    if (isReadOnly) return;
                                                    setFormData(prev => ({...prev, hasUndertaking: e.target.checked}));
                                                    setHasUnsavedChanges(true);
                                                }} 
                                                className="accent-amber-600 w-5 h-5" 
                                                disabled={isReadOnly} 
                                            />
                                            <span className="text-sm font-bold text-amber-800">تفعيل التعهد وقفل المعاملة</span>
                                        </label>
                                        {formData.hasUndertaking && (
                                            <div className="flex justify-end mt-2">
                                                <button 
                                                    onClick={() => showToast('جاري تجهيز التعهد للطباعة...', 'success')}
                                                    className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black flex items-center gap-2"
                                                >
                                                    <i className="fas fa-print"></i>
                                                    طباعة التعهد
                                                </button>
                                            </div>
                                        )}
                                        {(activeSector === ConsignmentType.AGRICULTURAL || activeSector === ConsignmentType.VETERINARY) && (formData.declarationType === 'تصدير' || formData.declarationType === 'إعادة تصدير') && (
                                            <div className="flex justify-end mt-4 pt-4 border-t border-emerald-100 gap-3">
                                                <button 
                                                    onClick={() => translateConsignment(formData as Consignment)}
                                                    disabled={isTranslating}
                                                    className={`px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition-all shadow-lg ${isTranslating ? 'bg-slate-100 text-slate-400' : 'bg-emerald-600 text-white shadow-emerald-100 hover:bg-emerald-700'}`}
                                                >
                                                    <i className={isTranslating ? "fas fa-spinner fa-spin" : "fas fa-language"}></i>
                                                    {isTranslating ? 'جاري الترجمة...' : 'ترجمة بيانات الشهادة (AI)'}
                                                </button>
                                                <button 
                                                    onClick={() => formData.type === ConsignmentType.VETERINARY ? setShowVetCert(true) : setShowPhytoCert(true)}
                                                    className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                                                >
                                                    <i className="fas fa-certificate"></i>
                                                    {formData.type === ConsignmentType.VETERINARY ? 'عرض / طباعة شهادة الصحة البيطرية' : 'عرض / طباعة شهادة الصحة النباتية'}
                                                </button>
                                            </div>
                                        )}
                                    </div> )}
                                    <div className="space-y-4">
                                        {formData.inspectionNotes && (
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-emerald-600 uppercase tracking-widest">ملاحظات المعاينة (من الخطوة 3)</label>
                                                <div className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 text-sm font-bold text-slate-700 whitespace-pre-wrap">
                                                    {formData.inspectionNotes}
                                                </div>
                                            </div>
                                        )}
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-slate-600 uppercase tracking-widest">ملاحظات عامة</label>
                                            <textarea name="remarks" value={formData.remarks ?? ''} onChange={handleInputChange} rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all" placeholder="أي ملاحظات إضافية..." readOnly={isReadOnly} />
                                        </div>
                                    </div>
                                    <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={!!formData.isLocked} 
                                            onChange={(e) => {
                                                if (!permissions.canLock) {
                                                    showToast('ليس لديك صلاحية قفل المعاملة', 'error');
                                                    return;
                                                }
                                                if (isLockedForUser) return;
                                                if (e.target.checked) {
                                                    // Validation before locking
                                                    if (!formData.technicalAction) {
                                                        showToast('يرجى تحديد الإجراء الفني قبل القفل', 'error');
                                                        return;
                                                    }
                                                    if (formData.fees === undefined || formData.fees === null) {
                                                        showToast('يرجى تحديد الرسوم قبل القفل', 'error');
                                                        return;
                                                    }
                                                }
                                                setFormData(prev => ({...prev, isLocked: e.target.checked}));
                                                setHasUnsavedChanges(true);
                                            }} 
                                            disabled={isLockedForUser || !permissions.canLock} 
                                            className="w-5 h-5 accent-slate-800" 
                                        />
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">تم استكمال المعاملة (قفل نهائي)</p>
                                            <p className="text-[10px] text-slate-400">لن يتمكن أحد من تعديل المعاملة سوى المدير أو المشرف.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {permissions.canViewAudit && (
                                <div id="step-section-6" className={`transition-all ${activeStep === 6 || formViewMode === 'SCROLL' ? 'block animate-fade-in' : 'hidden'}`}>
                                    {formViewMode === 'SCROLL' && <SectionHeader title="6. سجل التتبع" icon="fa-history" />}
                                    <ConsignmentTimeline consignment={formData as Consignment} />
                                </div>
                            )}
                            <div className="flex justify-between items-center mt-8 pt-8 border-t border-slate-200 sticky bottom-0 bg-white/95 backdrop-blur-sm p-4 rounded-2xl z-20 shadow-inner">
                                {formViewMode === 'STEPS' && activeStep > 1 ? <button onClick={() => handleStepClick(activeStep - 1)} className="px-8 py-4 rounded-2xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50">السابق</button> : <div></div>}
                                {formViewMode === 'STEPS' && activeStep < maxVisibleStep ? (
                                    <button onClick={handleNextStep} className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black shadow-lg">التالي</button>
                                ) : (
                                    !isReadOnly && (
                                        <div className="flex gap-4 w-full justify-end">
                                            <button onClick={() => handleSubmit(false)} disabled={loading || isViewOnly} className="bg-white text-[#007a3d] border border-[#007a3d] px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-2">
                                                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-save"></i>}
                                                <span>حفظ ومتابعة</span>
                                            </button>
                                            <button onClick={() => handleSubmit(true)} disabled={loading || isViewOnly} className="bg-[#007a3d] text-white px-8 py-4 rounded-2xl font-black shadow-xl hover:bg-green-800 transition-all flex items-center gap-2">
                                                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                                                <span>حفظ وإغلاق</span>
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
            {showAuditLog && ( 
                <div className="flex-1 overflow-y-auto bg-slate-100 p-8 scroll-fade-y">
                    <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
                            <h4 className="font-black text-slate-800 text-xl flex items-center gap-3">
                                <i className="fas fa-history text-slate-400"></i>
                                سجل النشاطات الزمني
                            </h4>
                            <button onClick={() => setShowAuditLog(false)} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-4 py-2 rounded-xl transition-colors">
                                إغلاق السجل
                            </button>
                        </div>
                        <ConsignmentTimeline consignment={formData as Consignment} />
                    </div>
                </div> 
            )}
        </form>
      )}

      {showLabForm && formData && ( <LabRequestFormModal isOpen={showLabForm} onClose={() => setShowLabForm(false)} onSave={(data) => { setFormData(prev => ({...prev, labRequestFormData: data})); setShowLabForm(false); setHasUnsavedChanges(true); }} consignment={formData as Consignment} importerData={currentImporterData} isReadOnly={isReadOnly} /> )}
      {showRejectionForm && formData && ( <RejectionFormModal isOpen={showRejectionForm} onClose={() => setShowRejectionForm(false)} consignment={formData as Consignment} /> )}
      {viewingDoc && ( <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setViewingDoc(null)}> <div className="bg-white rounded-[2rem] w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}> <div className="p-4 border-b flex justify-between items-center bg-slate-50"> <div><h3 className="font-black text-slate-800 text-lg">{viewingDoc.title}</h3><p className="text-[10px] text-slate-400">{viewingDoc.date}</p></div> <div className="flex items-center gap-2"> <a href={viewingDoc.url} download={viewingDoc.title} className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-all shadow-sm" title="تنزيل"><i className="fas fa-download"></i></a> <button onClick={() => setViewingDoc(null)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:text-red-500 transition-all shadow-sm" title="إغلاق"><i className="fas fa-times"></i></button> </div> </div> <div className="flex-1 bg-slate-100 flex items-center justify-center p-4"> {viewingDoc.type === 'DOC' ? <iframe src={viewingDoc.url} className="w-full h-full rounded-2xl shadow-xl bg-white"></iframe> : <img referrerPolicy="no-referrer" src={viewingDoc.url} alt={viewingDoc.title} className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />} </div> </div> </div> )}
      {confirmModal && ( <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} confirmText={confirmModal.confirmText} cancelText={confirmModal.cancelText} isDestructive={confirmModal.isDestructive} onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal(null)} /> )}
      {(showPhytoCert && formData.type === ConsignmentType.AGRICULTURAL) && (formData.id) && (
          <PhytosanitaryCertificate 
              consignment={formData as Consignment} 
              exporterAddress={importers.find(i => i.name === formData.importer)?.address}
              onClose={() => setShowPhytoCert(false)} 
          />
      )}
      {(showVetCert && formData.type === ConsignmentType.VETERINARY) && (formData.id) && (
          <VeterinaryCertificate 
              consignment={formData as Consignment} 
              exporterAddress={importers.find(i => i.name === formData.importer)?.address}
              onClose={() => setShowVetCert(false)} 
          />
      )}
      {certConsignment && (
          certConsignment.type === ConsignmentType.VETERINARY ? (
              <VeterinaryCertificate 
                  consignment={certConsignment} 
                  exporterAddress={importers.find(i => i.name === certConsignment.importer)?.address}
                  onClose={() => setCertConsignment(null)} 
              />
          ) : (
             <PhytosanitaryCertificate 
                  consignment={certConsignment} 
                  exporterAddress={importers.find(i => i.name === certConsignment.importer)?.address}
                  onClose={() => setCertConsignment(null)} 
              />
          )
      )}
      {qrSampleId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setQrSampleId(null)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm flex flex-col shadow-2xl relative overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="p-8 pb-0 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mx-auto mb-4 border border-blue-100 shadow-sm">
                    <i className="fas fa-qrcode text-2xl"></i>
                </div>
                <h3 className="font-black text-slate-800 text-xl tracking-tight">رمز العينة</h3>
                <p className="text-sm font-bold text-slate-500 mt-2 mb-8">{qrSampleId}</p>
            </div>
            <div className="flex-1 bg-slate-50 flex flex-col items-center justify-center p-8 border-t border-slate-100 relative">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-slate-100">
                    <QRCodeCanvas id={`qr-sample-${qrSampleId}`} value={qrSampleId} size={300} level="M" includeMargin={true} marginSize={4} bgColor="#FFFFFF" fgColor="#000000" />
                </div>
                <div className="mt-8 flex flex-col items-center gap-4 w-full">
                    <button 
                      onClick={() => downloadQRCode(`qr-sample-${qrSampleId}`, `sample-${qrSampleId}`)}
                      className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm font-bold flex items-center justify-center gap-2 w-full max-w-[200px]"
                    >
                      <i className="fas fa-download"></i> تنزيل الرمز
                    </button>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed text-center">يرجى مسح هذا الرمز بواسطة<br/>بوابة الاستلام في المختبر</p>
                </div>
            </div>
            <div className="p-4 bg-white border-t border-slate-100">
                <button onClick={() => setQrSampleId(null)} className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 py-4 rounded-2xl font-black transition-all">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, icon }: { title: string, icon: string }) => ( <div className="flex items-center gap-2 border-b border-slate-100 pb-2 mb-4"><i className={`fas ${icon} text-slate-400`}></i><h4 className="font-bold text-slate-700 text-sm">{title}</h4></div> );
const Input = ({ label, name, type = 'text', value, onChange, placeholder, error, onBlur, min, readOnly, disabled, required }: any) => ( <div className="space-y-2"><label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">{label} {required && <span className="text-red-500">*</span>}</label><input type={type} name={name} value={value ?? ''} onChange={onChange} onBlur={onBlur} min={min} readOnly={readOnly} disabled={disabled} placeholder={placeholder} className={`w-full bg-slate-50 border rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 transition-all ${error ? 'border-red-300 focus:ring-red-500/10' : 'border-slate-200 focus:ring-red-500/10 focus:border-[#c8102e]'} ${readOnly || disabled ? 'bg-slate-100 cursor-not-allowed text-slate-500' : ''}`} />{error && <p className="text-[10px] text-red-500 font-bold px-2">{error}</p>}</div> );
const MultiSelectDropdown = ({ options, selected, onChange, disabled, placeholder }: any) => { const [isOpen, setIsOpen] = useState(false); const wrapperRef = useRef<HTMLDivElement>(null); useEffect(() => { function handleClickOutside(event: MouseEvent) { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false); } document.addEventListener("mousedown", handleClickOutside); return () => document.removeEventListener("mousedown", handleClickOutside); }, [wrapperRef]); const toggleOption = (option: string) => { if (disabled) return; let newSelected; if (selected.includes(option)) newSelected = selected.filter((s: string) => s !== option); else newSelected = [...selected, option]; onChange(newSelected); }; return ( <div className="relative" ref={wrapperRef}> <div onClick={() => !disabled && setIsOpen(!isOpen)} className={`w-full bg-slate-50 border ${isOpen ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-2xl px-4 py-3 min-h-[50px] flex items-center justify-between cursor-pointer transition-all ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-red-300'}`} > <div className="flex flex-wrap gap-2"> {selected.length > 0 ? ( selected.map((item: string, idx: number) => ( <span key={idx} className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-red-200 flex items-center gap-1"> {item} {!disabled && ( <i className="fas fa-times cursor-pointer hover:text-red-900" onClick={(e) => { e.stopPropagation(); toggleOption(item); }} ></i> )} </span> )) ) : ( <span className="text-sm font-bold text-slate-300">{placeholder}</span> )} </div> <i className={`fas fa-chevron-down text-slate-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i> </div> {isOpen && !disabled && ( <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-60 overflow-y-auto custom-scrollbar animate-scale-in scroll-fade-y"> {options.map((opt: string) => ( <div key={opt} onClick={() => toggleOption(opt)} className={`px-4 py-3 text-sm font-bold cursor-pointer flex items-center gap-3 transition-colors ${selected.includes(opt) ? 'bg-red-50 text-red-700' : 'text-slate-600 hover:bg-slate-50'}`} > <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selected.includes(opt) ? 'bg-red-500 border-red-500' : 'border-slate-300 bg-white'}`}> {selected.includes(opt) && <i className="fas fa-check text-white text-[10px]"></i>} </div> <span>{opt}</span> </div> ))} </div> )} </div> ); };

export { ConsignmentPortal };
