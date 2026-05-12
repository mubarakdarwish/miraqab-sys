import React, { useState, useEffect, useMemo } from 'react';
import { Consignment, ConsignmentType, User, Sample, ConsignmentItem, Laboratory, AppDocument, AuditLogEntry, ClearanceOffice } from '../types';
import * as FB from '../firebaseService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Beaker, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  ChevronRight, 
  MoreVertical,
  Download,
  Eye,
  Truck,
  FlaskConical,
  ClipboardCheck,
  AlertCircle,
  LayoutGrid,
  List,
  User as UserIcon,
  Phone,
  Building,
  Image as ImageIcon,
  MapPin,
  Calendar,
  ShieldCheck,
  History,
  FileUp,
  ExternalLink
} from 'lucide-react';

interface SamplingManagerProps {
    consignments: Consignment[];
    onUpdateConsignment: (updatedConsignment: Consignment) => void;
    labAnalysisTypes: Record<ConsignmentType, string[]>;
    rejectionReasons: Record<ConsignmentType, string[]>;
    currentUser: User;
    laboratories: Laboratory[];
    clearanceOffices: ClearanceOffice[];
}

interface SampleWrapper {
    sample: Sample;
    consignment: Consignment;
}

const SAMPLE_STATUS_LABELS: Record<string, { label: string; color: string; icon: any }> = {
    'DRAWN': { label: 'بانتظار الاستلام الفني', color: 'bg-orange-50 text-orange-600 border-orange-100', icon: MapPin },
    'PICKED_UP': { label: 'قيد النقل للمختبر', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Truck },
    'AT_LAB': { label: 'مستلمة في المختبر', color: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: FlaskConical },
    'UNDER_ANALYSIS': { label: 'قيد التحليل المخبري', color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Beaker },
    'COMPLETED': { label: 'مكتملة - بانتظار الاعتماد', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 }
};

const SamplingManager: React.FC<SamplingManagerProps> = ({ consignments, onUpdateConsignment, labAnalysisTypes, rejectionReasons, currentUser, laboratories, clearanceOffices }) => {
  const [selectedWrapper, setSelectedWrapper] = useState<SampleWrapper | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid'); 
  const [activeTab, setActiveTab] = useState<'ALL' | 'DRAWN' | 'PICKED_UP' | 'AT_LAB' | 'UNDER_ANALYSIS' | 'COMPLETED'>('ALL');
  
  // Filters State
  const [filterLab, setFilterLab] = useState<string>('ALL');
  const [filterTestType, setFilterTestType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'date' | 'id'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState<{
    result: 'Compliant' | 'NonCompliant' | 'Pending';
    notes: string;
    rejectionReason: string;
    fileContent: string | null;
    fileName: string;
  }>({
    result: 'Pending',
    notes: '',
    rejectionReason: '',
    fileContent: null,
    fileName: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ url: string; name: string; type: 'PDF' | 'IMG' } | null>(null);

  // Derive all samples from consignments
  const allSamples: SampleWrapper[] = useMemo(() => {
    let samples = consignments.flatMap(c => {
      if (c.samples && c.samples.length > 0) {
        return c.samples.map(s => {
          let effectiveStatus = s.status || 'DRAWN';
          if (s.result && s.result !== 'Pending') {
            effectiveStatus = 'COMPLETED';
          }
          return { sample: { ...s, status: effectiveStatus }, consignment: c };
        });
      }
      return [];
    });

    // Role-based filtering
    if ((currentUser.role === 'LAB_TECH' || currentUser.role === 'LAB_DELEGATE') && currentUser.assignedLabId) {
      const userLab = laboratories.find(l => l.id === currentUser.assignedLabId);
      if (userLab) {
        samples = samples.filter(s => s.sample.labName === userLab.name);
      }
    }

    return samples;
  }, [consignments, currentUser, laboratories]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: allSamples.length,
      drawn: allSamples.filter(s => s.sample.status === 'DRAWN' || !s.sample.status).length,
      transit: allSamples.filter(s => s.sample.status === 'PICKED_UP').length,
      atLab: allSamples.filter(s => s.sample.status === 'AT_LAB').length,
      analysis: allSamples.filter(s => s.sample.status === 'UNDER_ANALYSIS').length,
      completed: allSamples.filter(s => s.sample.status === 'COMPLETED').length
    };
  }, [allSamples]);

  // Filtered samples
  const displayedSamples = useMemo(() => {
    let filtered = allSamples.filter(w => {
      // Tab filter
      if (activeTab !== 'ALL') {
        const effectiveStatus = w.sample.status || 'DRAWN';
        if (effectiveStatus !== activeTab) return false;
      }

      // Search filter
      const term = searchTerm.toLowerCase().trim();
      if (term) {
        const match = 
          w.sample.sampleId.toLowerCase().includes(term) ||
          w.consignment.bayanNumber?.toLowerCase().includes(term) ||
          w.consignment.importer.toLowerCase().includes(term) ||
          w.consignment.inspectorName.toLowerCase().includes(term);
        if (!match) return false;
      }

      // Lab filter
      if (filterLab !== 'ALL' && w.sample.labName !== filterLab) return false;

      // Test type filter
      if (filterTestType !== 'ALL' && !w.sample.labAnalysisType.includes(filterTestType)) return false;

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let valA = sortBy === 'date' ? a.sample.date : a.sample.sampleId;
      let valB = sortBy === 'date' ? b.sample.date : b.sample.sampleId;
      if (sortOrder === 'asc') return valA < valB ? -1 : 1;
      return valA > valB ? -1 : 1;
    });

    return filtered;
  }, [allSamples, activeTab, searchTerm, filterLab, filterTestType, sortBy, sortOrder]);

  const handleAction = async (status: Sample['status'], wrapper: SampleWrapper) => {
    setIsProcessing(true);
    try {
      const consignment = wrapper.consignment;
      const updatedSamples = consignment.samples.map(s => {
        if (s.sampleId === wrapper.sample.sampleId) {
          const update: Partial<Sample> = { status };
          if (status === 'PICKED_UP') {
            update.pickupDate = new Date().toISOString();
            update.pickupBy = currentUser.name;
          } else if (status === 'AT_LAB') {
            update.receivedAtLabDate = new Date().toISOString();
            update.receivedAtLabBy = currentUser.name;
            update.isReceivedAtLab = true;
          } else if (status === 'UNDER_ANALYSIS') {
            update.analysisStartDate = new Date().toISOString();
          }
          return { ...s, ...update };
        }
        return s;
      });

      const audit: AuditLogEntry = {
        timestamp: new Date().toISOString(),
        action: `تحديث حالة عينة: ${SAMPLE_STATUS_LABELS[status].label}`,
        user: currentUser.name,
        details: `العينة ${wrapper.sample.sampleId} - إرسالية ${consignment.bayanNumber || consignment.id}`
      };

      await onUpdateConsignment({
        ...consignment,
        samples: updatedSamples,
        auditLog: [...(consignment.auditLog || []), audit]
      });

      // Update selected wrapper if it's the one being acted upon
      if (selectedWrapper?.sample.sampleId === wrapper.sample.sampleId) {
        setSelectedWrapper({
          ...wrapper,
          sample: updatedSamples.find(s => s.sampleId === wrapper.sample.sampleId)!
        });
      }
    } catch (error) {
      console.error(error);
      alert('فشل تحديث حالة العينة');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveResult = async () => {
    if (!selectedWrapper) return;
    if (resultData.result === 'Pending') {
      alert('يرجى اختيار النتيجة النهائية');
      return;
    }
    if (resultData.result === 'NonCompliant' && !resultData.rejectionReason) {
      alert('يرجى تحديد سبب الرفض');
      return;
    }

    setIsProcessing(true);
    try {
      const consignment = selectedWrapper.consignment;
      const updatedSamples = consignment.samples.map(s => {
        if (s.sampleId === selectedWrapper.sample.sampleId) {
          return {
            ...s,
            status: 'COMPLETED' as const,
            result: resultData.result,
            notes: resultData.notes,
            rejectionReason: resultData.result === 'NonCompliant' ? resultData.rejectionReason : undefined,
            completedDate: new Date().toISOString(),
            resultFileUrl: resultData.fileContent || s.resultFileUrl,
            resultFileName: resultData.fileName || s.resultFileName
          };
        }
        return s;
      });

      // Update Consignment status if all samples are completed
      const allDone = updatedSamples.every(s => s.status === 'COMPLETED');
      const anyRejected = updatedSamples.some(s => s.result === 'NonCompliant');
      
      let newConsignmentStatus = consignment.status;
      let newTechAction = consignment.technicalAction;
      let newInspecResult = consignment.inspectionResult;

      if (allDone) {
        if (anyRejected) {
          newConsignmentStatus = 'Rejected';
          newTechAction = 'رفض';
          newInspecResult = 'غير مطابق';
        } else {
          newConsignmentStatus = 'Approved';
          newTechAction = 'إفراج نهائي';
          newInspecResult = 'مطابق';
        }
      } else if (updatedSamples.some(s => s.status !== 'DRAWN')) {
        newInspecResult = 'قيد التحليل';
      }

      await onUpdateConsignment({
        ...consignment,
        samples: updatedSamples,
        status: newConsignmentStatus,
        technicalAction: newTechAction,
        inspectionResult: newInspecResult,
        auditLog: [...(consignment.auditLog || []), {
          timestamp: new Date().toISOString(),
          action: 'تسجيل نتائج التحليل',
          user: currentUser.name,
          details: `العينة ${selectedWrapper.sample.sampleId} - النتيجة: ${resultData.result === 'Compliant' ? 'مطابق' : 'مرفوض'}`
        }]
      });

      if (resultData.fileContent && resultData.fileName) {
        try {
          const newDoc: AppDocument = {
            id: Math.random().toString(36).substr(2, 9),
            consignmentId: consignment.id,
            type: resultData.fileName.toLowerCase().endsWith('.pdf') ? 'DOC' : 'IMG',
            url: resultData.fileContent,
            title: `نتيجة التحليل المخبري - العينة ${selectedWrapper.sample.sampleId}`,
            date: new Date().toISOString().split('T')[0],
            fileType: resultData.fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
            uploadedBy: currentUser.name
          };
          await FB.addDocumentToDB(newDoc);
        } catch (err) {
          console.error("Failed to upload lab result document:", err);
        }
      }

      setShowResultModal(false);
      setSelectedWrapper(null);
    } catch (error) {
      console.error(error);
      alert('تعذر حفظ النتائج');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return alert('حجم الملف كبير جداً');
      const reader = new FileReader();
      reader.onload = () => {
        setResultData(prev => ({ 
          ...prev, 
          fileContent: reader.result as string, 
          fileName: file.name 
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header & Stats */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <div className="w-12 h-12 bg-red-50 text-[#c8102e] rounded-2xl flex items-center justify-center shadow-sm">
                <FlaskConical className="w-7 h-7" />
              </div>
              نظام إدارة العينات المتطور
            </h1>
            <p className="text-slate-400 font-bold mt-2 mr-15">التتبع الذكي لدورة حياة العينات المخبرية والنتائج الفنية</p>
          </div>
          
          <div className="flex gap-4">
            <div className="p-1 bg-slate-50 rounded-2xl border border-slate-200">
              <button 
                onClick={() => setViewMode('grid')}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatBox label="إجمالي العينات" value={stats.total} icon={Beaker} color="bg-slate-50 text-slate-600" />
          <StatBox label="بانتظار الاستلام" value={stats.drawn} icon={MapPin} color="bg-orange-50 text-orange-600" />
          <StatBox label="قيد النقل" value={stats.transit} icon={Truck} color="bg-blue-50 text-blue-600" />
          <StatBox label="مستلمة بالمختبر" value={stats.atLab} icon={FlaskConical} color="bg-indigo-50 text-indigo-600" />
          <StatBox label="قيد المختبر" value={stats.analysis} icon={Beaker} color="bg-purple-50 text-purple-600" />
          <StatBox label="مكتملة" value={stats.completed} icon={CheckCircle2} color="bg-emerald-50 text-emerald-600" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main List Section */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
            {/* Tabs & Search */}
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
              <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0 hide-scrollbar scroll-smooth w-full xl:w-auto">
                <TabButton active={activeTab === 'ALL'} onClick={() => setActiveTab('ALL')} label="الكل" count={stats.total} />
                <TabButton active={activeTab === 'DRAWN'} onClick={() => setActiveTab('DRAWN')} label="المنافذ" count={stats.drawn} color="bg-orange-600" />
                <TabButton active={activeTab === 'PICKED_UP'} onClick={() => setActiveTab('PICKED_UP')} label="بالطريق" count={stats.transit} color="bg-blue-600" />
                <TabButton active={activeTab === 'AT_LAB'} onClick={() => setActiveTab('AT_LAB')} label="الاستقبال" count={stats.atLab} color="bg-indigo-600" />
                <TabButton active={activeTab === 'UNDER_ANALYSIS'} onClick={() => setActiveTab('UNDER_ANALYSIS')} label="بالفحص" count={stats.analysis} color="bg-purple-600" />
                <TabButton active={activeTab === 'COMPLETED'} onClick={() => setActiveTab('COMPLETED')} label="النتائج" count={stats.completed} color="bg-emerald-600" />
              </div>
              
              <div className="relative w-full xl:w-72">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="بحث سريع برقم العينة أو البيان..."
                  className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-red-500/5 text-sm font-bold transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">تصفية المختبر</label>
                <select value={filterLab} onChange={(e) => setFilterLab(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none cursor-pointer hover:border-slate-300 transition-colors">
                  <option value="ALL">كل المختبرات</option>
                  {laboratories.map(lab => <option key={lab.id} value={lab.name}>{lab.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">نوع الفحص</label>
                <select value={filterTestType} onChange={(e) => setFilterTestType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none cursor-pointer">
                  <option value="ALL">الكل</option>
                  {Array.from(new Set(Object.values(labAnalysisTypes).flat())).map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">الفرز</label>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none">
                  <option value="date">حسب التاريخ</option>
                  <option value="id">حسب الرقم</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">الاتجاه</label>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none">
                  <option value="desc">الأحدث</option>
                  <option value="asc">الأقدم</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px]">
            <AnimatePresence mode="popLayout">
              {displayedSamples.map((wrapper, idx) => (
                <SampleListItem 
                  key={`${wrapper.consignment.id}-${wrapper.sample.sampleId}`} 
                  wrapper={wrapper} 
                  isSelected={selectedWrapper?.sample.sampleId === wrapper.sample.sampleId}
                  onClick={() => setSelectedWrapper(wrapper)}
                  onAction={(status) => handleAction(status, wrapper)}
                  currentUser={currentUser}
                  isProcessing={isProcessing}
                  clearanceOffices={clearanceOffices}
                />
              ))}
            </AnimatePresence>
            
            {displayedSamples.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-[3rem] text-slate-300">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Search className="w-10 h-10 opacity-20" />
                </div>
                <h3 className="text-xl font-black text-slate-400">لا توجد عينات مطابقة</h3>
                <p className="text-sm font-bold mt-2">تأكد من إعدادات الفلترة أو كلمة البحث</p>
              </div>
            )}
          </div>
        </div>

        {/* Info & Action Sidebar */}
        <div className="lg:col-span-4 h-full">
          <AnimatePresence mode="wait">
            {!selectedWrapper ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 h-full flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="w-24 h-24 bg-red-50 rounded-[2.5rem] flex items-center justify-center rotate-3 border-4 border-white shadow-xl shadow-red-500/10">
                  <History className="w-12 h-12 text-[#c8102e]" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">تفاصيل العينة</h3>
                  <p className="text-sm font-bold text-slate-400 mt-2 max-w-[200px] leading-relaxed mx-auto">اختر عينة من القائمة لمتابعة تقدمها وإجراء العمليات المتاحة</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key={selectedWrapper.sample.sampleId}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 sticky top-8 space-y-8"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">الرقم المرجعي</span>
                    <h3 className="text-2xl font-black text-slate-900">{selectedWrapper.sample.sampleId}</h3>
                  </div>
                  <div className={`px-4 py-2 rounded-2xl border text-[10px] font-black uppercase ${SAMPLE_STATUS_LABELS[selectedWrapper.sample.status || 'DRAWN'].color}`}>
                    {SAMPLE_STATUS_LABELS[selectedWrapper.sample.status || 'DRAWN'].label}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-5 bg-slate-50 rounded-[2rem] space-y-4 border border-slate-100">
                    <InfoRow label="المستورد" value={selectedWrapper.consignment.importer} icon={Truck} color="text-blue-500" />
                    <InfoRow label="مكتب التخليص" value={selectedWrapper.consignment.clearanceOffice || '-'} icon={Building} color="text-amber-500" />
                    <InfoRow label="المخلص الجمركي" value={selectedWrapper.consignment.customsBroker || '-'} icon={UserIcon} color="text-emerald-500" />
                    {(() => {
                      let brokerPhone = selectedWrapper.consignment.brokerPhone;
                      if (!brokerPhone && selectedWrapper.consignment.clearanceOffice && selectedWrapper.consignment.customsBroker) {
                          const office = clearanceOffices.find(o => o.name === selectedWrapper.consignment.clearanceOffice);
                          const broker = office?.brokers.find(b => b.name === selectedWrapper.consignment.customsBroker);
                          if (broker) brokerPhone = broker.phone;
                      }
                      return brokerPhone ? <InfoRow label="هاتف المخلص" value={brokerPhone} icon={Phone} color="text-blue-400" /> : null;
                    })()}
                    <InfoRow label="رقم البيان" value={selectedWrapper.consignment.bayanNumber || '-'} icon={FileText} color="text-slate-400" />
                    <InfoRow label="المختبر" value={selectedWrapper.sample.labName} icon={FlaskConical} color="text-purple-500" />
                    <InfoRow label="نوع التحليل" value={selectedWrapper.sample.labAnalysisType.join(' + ')} icon={Beaker} color="text-indigo-500" />
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                       <History className="w-4 h-4 text-[#c8102e]" />
                       سجل تتبع الحركة
                    </h4>
                    <div className="space-y-4 relative mr-2">
                      <div className="absolute top-0 bottom-0 right-[7px] w-0.5 bg-slate-100"></div>
                      <TimelineItem active={!!selectedWrapper.sample.date} label="تم سحب العينة" date={selectedWrapper.sample.date} by={selectedWrapper.sample.drawnBy} />
                      <TimelineItem active={!!selectedWrapper.sample.pickupDate} label="تم الاستلام للنقل" date={selectedWrapper.sample.pickupDate} by={selectedWrapper.sample.pickupBy} />
                      <TimelineItem active={!!selectedWrapper.sample.receivedAtLabDate} label="الوصول للمختبر" date={selectedWrapper.sample.receivedAtLabDate} by={selectedWrapper.sample.receivedAtLabBy} />
                      <TimelineItem active={!!selectedWrapper.sample.analysisStartDate} label="بدء الفحص المخبري" date={selectedWrapper.sample.analysisStartDate} />
                      <TimelineItem active={!!selectedWrapper.sample.completedDate} label="صدور النتيجة النهائية" date={selectedWrapper.sample.completedDate} />
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    {/* Action Flow based on status and role */}
                    {selectedWrapper.sample.status === 'PICKED_UP' && (currentUser.role === 'LAB_DELEGATE' || currentUser.role === 'LAB_TECH' || currentUser.role === 'ADMIN') && (
                      <PrimaryAction onClick={() => handleAction('AT_LAB', selectedWrapper)} label="تأكيد الوصول للمختبر" icon={FlaskConical} color="bg-indigo-600 shadow-indigo-500/20" />
                    )}
                    {selectedWrapper.sample.status === 'AT_LAB' && (currentUser.role === 'LAB_TECH' || currentUser.role === 'ADMIN') && (
                      <PrimaryAction onClick={() => handleAction('UNDER_ANALYSIS', selectedWrapper)} label="بدء عملية الفحص" icon={Beaker} color="bg-purple-600 shadow-purple-500/20" />
                    )}
                    {selectedWrapper.sample.status === 'UNDER_ANALYSIS' && (currentUser.role === 'LAB_TECH' || currentUser.role === 'ADMIN') && (
                      <PrimaryAction onClick={() => setShowResultModal(true)} label="إدخال النتائج النهائية" icon={CheckCircle2} color="bg-emerald-600 shadow-emerald-500/20" />
                    )}

                    {selectedWrapper.sample.status === 'COMPLETED' && (
                      <div className="space-y-4">
                        <div className={`p-6 rounded-[2rem] border-2 text-center ${selectedWrapper.sample.result === 'Compliant' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
                           <p className="text-[10px] font-black uppercase mb-1">النتيجة النهائية</p>
                           <h4 className="text-2xl font-black">{selectedWrapper.sample.result === 'Compliant' ? 'مطابق للفحص' : 'مرفوض إدارياً'}</h4>
                        </div>
                        {selectedWrapper.sample.resultFileUrl && (
                          <button 
                            onClick={() => setViewingFile({ url: selectedWrapper.sample.resultFileUrl!, name: selectedWrapper.sample.resultFileName!, type: selectedWrapper.sample.resultFileName?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMG' })}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                          >
                             <FileText className="w-5 h-5 text-[#c8102e]" />
                             عرض تقرير المختبر
                          </button>
                        )}
                      </div>
                    )}
                    
                    <button 
                      onClick={() => setSelectedWrapper(null)}
                      className="w-full py-4 text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                    >
                      إغلاق التفاصيل
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Result Entry Modal */}
      <AnimatePresence>
        {showResultModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-hidden relative"
            >
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-50">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">إدخال نتائج التحليل المخبري</h3>
                  <p className="text-slate-400 font-bold mt-1">عينة مختبر: {selectedWrapper?.sample.sampleId}</p>
                </div>
                <button onClick={() => setShowResultModal(false)} className="w-10 h-10 rounded-xl hover:bg-slate-50 flex items-center justify-center text-slate-400 transition-colors">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setResultData(prev => ({ ...prev, result: 'Compliant' }))}
                    className={`py-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${resultData.result === 'Compliant' ? 'bg-green-50 border-green-600 text-green-700 shadow-xl shadow-green-500/10' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <CheckCircle2 className="w-8 h-8" />
                    <span className="font-black text-lg">مطابق للمواصفات</span>
                  </button>
                  <button 
                    onClick={() => setResultData(prev => ({ ...prev, result: 'NonCompliant' }))}
                    className={`py-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${resultData.result === 'NonCompliant' ? 'bg-red-50 border-red-600 text-red-700 shadow-xl shadow-red-500/10' : 'bg-slate-50 border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <XCircle className="w-8 h-8" />
                    <span className="font-black text-lg">غير مطابق - مرفوض</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                      <FileUp className="w-4 h-4" /> تقرير المختبر بصيغة (PDF/IMG)
                    </label>
                    <div className="relative group/file">
                       <input type="file" onChange={handleFileChange} className="hidden" id="labResultFile" accept=".pdf,image/*" />
                       <label htmlFor="labResultFile" className={`w-full py-4 border-2 border-dashed rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-all ${resultData.fileName ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-indigo-400'}`}>
                          {resultData.fileName ? <ShieldCheck className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                          <span className="text-sm font-black">{resultData.fileName || 'رفع المستند الرسمي'}</span>
                       </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> سبب الرفض (في حال عدم المطابقة)
                    </label>
                    <select 
                      value={resultData.rejectionReason}
                      onChange={(e) => setResultData(prev => ({ ...prev, rejectionReason: e.target.value }))}
                      disabled={resultData.result !== 'NonCompliant'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <option value="">اختر السبب...</option>
                      {selectedWrapper && (rejectionReasons[selectedWrapper.consignment.type] || []).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">ملاحظات ونتائج الاختبار الإضافية</label>
                  <textarea 
                    value={resultData.notes}
                    onChange={(e) => setResultData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="يمكنك إضافة تفاصيل فنية إضافية تظهر في التقرير..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-3xl p-6 text-sm outline-none focus:border-indigo-500 min-h-[140px]"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    disabled={isProcessing}
                    onClick={handleSaveResult}
                    className="flex-1 bg-slate-900 text-white rounded-2xl py-4 font-black transition-all hover:bg-slate-800 disabled:opacity-50 shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? <Clock className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                    حفظ واعتماد النتيجة النهائية
                  </button>
                  <button onClick={() => setShowResultModal(false)} className="px-8 border border-slate-200 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">إلغاء</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File Viewer Modal */}
      <AnimatePresence>
          {viewingFile && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 backdrop-blur-xl bg-slate-900/60 transition-all">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white w-full max-w-6xl h-full rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col"
                  >
                      <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-600">
                                  {viewingFile.type === 'PDF' ? <FileText className="w-6 h-6 text-red-500" /> : <ImageIcon className="w-6 h-6 text-blue-500" />}
                              </div>
                              <div>
                                  <h3 className="font-black text-slate-800">{viewingFile.name}</h3>
                                  <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">مستند رسمي معتمد</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <a href={viewingFile.url} download={viewingFile.name} className="flex h-12 px-6 items-center gap-3 bg-red-600 text-white rounded-xl font-black shadow-lg shadow-red-500/20 hover:scale-105 active:scale-95 transition-all">
                                  <Download className="w-5 h-5" /> تحميل الأصل
                              </a>
                              <button onClick={() => setViewingFile(null)} className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 transition-colors shadow-sm border border-slate-100"><XCircle className="w-6 h-6" /></button>
                          </div>
                      </div>
                      <div className="flex-1 bg-slate-800 relative overflow-auto p-4 md:p-8 custom-scrollbar">
                          {viewingFile.type === 'PDF' ? (
                              <iframe src={viewingFile.url} className="w-full h-full rounded-2xl shadow-inner bg-white" />
                          ) : (
                              <img src={viewingFile.url} alt={viewingFile.name} className="mx-auto max-w-full h-auto rounded-2xl shadow-inner border border-slate-700/50" />
                          )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

// Internal Sub-components
const StatBox = ({ label, value, icon: Icon, color }: { label: string, value: number, icon: any, color: string }) => (
  <div className={`p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md flex flex-col items-center justify-center gap-2 group ${color}`}>
    <Icon className="w-5 h-5 opacity-60 group-hover:scale-110 transition-transform" />
    <div className="text-center">
      <p className="text-[8px] font-black uppercase tracking-widest leading-tight">{label}</p>
      <h4 className="text-2xl font-black font-mono leading-none">{value.toString().padStart(2, '0')}</h4>
    </div>
  </div>
);

const TabButton = ({ active, onClick, label, count, color = 'bg-red-600' }: { active: boolean, onClick: () => void, label: string, count: number, color?: string }) => (
  <button 
    onClick={onClick}
    className={`px-5 py-3 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 border border-transparent ${active ? `bg-slate-900 text-white shadow-xl shadow-slate-900/10` : 'text-slate-400 bg-slate-50 hover:bg-white hover:border-slate-200'}`}
  >
    <span>{label}</span>
    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${active ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-500'}`}>{count}</span>
  </button>
);

const SampleListItem = React.forwardRef<HTMLDivElement, { wrapper: SampleWrapper, isSelected: boolean, onClick: () => void, onAction: (status: Sample['status']) => void, currentUser: User, isProcessing: boolean, clearanceOffices: ClearanceOffice[] }>(({ wrapper, isSelected, onClick, onAction, currentUser, isProcessing, clearanceOffices }, ref) => {
  const status = wrapper.sample.status || 'DRAWN';
  const meta = SAMPLE_STATUS_LABELS[status];
  const Icon = meta.icon;

  let brokerPhone = wrapper.consignment.brokerPhone;
  if (!brokerPhone && wrapper.consignment.clearanceOffice && wrapper.consignment.customsBroker) {
      const office = clearanceOffices.find(o => o.name === wrapper.consignment.clearanceOffice);
      const broker = office?.brokers.find(b => b.name === wrapper.consignment.customsBroker);
      if (broker) brokerPhone = broker.phone;
  }

  return (
    <motion.div 
      ref={ref}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className={`relative p-6 rounded-[2.5rem] bg-white border-2 transition-all cursor-pointer group flex flex-col h-full shadow-sm ${isSelected ? 'border-indigo-600 shadow-lg shadow-indigo-500/5' : 'border-slate-50 hover:border-slate-200'}`}
    >
      <div className="flex justify-between items-start mb-6">
        <div className={`p-4 rounded-2xl flex items-center justify-center transition-all ${meta.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-black text-slate-400 tracking-tighter">{wrapper.sample.sampleId}</span>
            <div className={`px-3 py-1 rounded-full text-[9px] font-black border uppercase tracking-tighter ${meta.color}`}>
              {meta.label}
            </div>
        </div>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <h4 className="font-black text-slate-800 text-lg leading-tight line-clamp-1">{wrapper.consignment.importer}</h4>
          <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            منفذ {wrapper.consignment.port} • بيان {wrapper.consignment.bayanNumber || '-'}
          </p>
          {brokerPhone && (
            <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <Phone className="w-3 h-3" />
              هاتف المخلص: {brokerPhone}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {wrapper.sample.labAnalysisType.map((t, idx) => (
            <span key={`${t}-${idx}`} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-lg border border-slate-100">{t}</span>
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
         <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[10px] font-bold text-slate-400">{new Date(wrapper.sample.date).toLocaleDateString('ar-KW')}</span>
         </div>
         <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
            <ChevronRight className="w-4 h-4 text-slate-400" />
         </div>
      </div>

      {isSelected && (
        <div className="absolute inset-0 border-2 border-indigo-600 rounded-[2.5rem] pointer-events-none"></div>
      )}
    </motion.div>
  );
});

SampleListItem.displayName = 'SampleListItem';

const InfoRow = ({ label, value, icon: Icon, color }: { label: string, value: string, icon: any, color: string }) => (
  <div className="flex items-center gap-4">
    <div className={`w-9 h-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0 ${color}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{label}</p>
      <p className="text-sm font-black text-slate-700 truncate">{value}</p>
    </div>
  </div>
);

const TimelineItem = ({ active, label, date, by }: { active: boolean, label: string, date?: string, by?: string }) => (
  <div className="flex items-start gap-4 h-11">
    <div className={`w-4 h-4 rounded-full z-10 shrink-0 transition-all duration-500 ${active ? 'bg-indigo-600 scale-125 shadow-lg shadow-indigo-500/20 ring-4 ring-indigo-50' : 'bg-slate-200'}`}></div>
    <div className="flex flex-col">
       <span className={`text-[11px] font-black ${active ? 'text-slate-800' : 'text-slate-300'}`}>{label}</span>
       {active && date && (
         <span className="text-[9px] font-bold text-slate-400 flex items-center gap-2">
           {new Date(date).toLocaleString('ar-KW', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
           {by && <span className="flex items-center gap-1"><UserIcon className="w-2.5 h-2.5" /> {by}</span>}
         </span>
       )}
    </div>
  </div>
);

const PrimaryAction = ({ onClick, label, icon: Icon, color }: { onClick: () => void, label: string, icon: any, color: string }) => (
  <button 
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    className={`w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl ${color}`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

const DetailItem = ({ label, value, icon, small, status }: { label: string, value: string, icon: any, small?: boolean, status?: 'success' | 'warning' | 'error' }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-1.5 mb-1">
      {React.cloneElement(icon as any, { className: `w-3 h-3 text-slate-300` })}
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{label}</span>
    </div>
    <p className={`font-black ${small ? 'text-xs' : 'text-sm'} text-slate-800 ${status === 'success' ? 'text-green-600' : status === 'warning' ? 'text-amber-600' : ''}`}>
      {value}
    </p>
  </div>
);

export default SamplingManager;
