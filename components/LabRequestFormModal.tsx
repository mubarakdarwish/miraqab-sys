import React, { useState, useEffect, useRef } from 'react';
import { Consignment, ConsignmentItem, LabRequestFormData, Importer } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Save, 
  FileText, 
  Printer, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Info,
  ClipboardList,
  FlaskConical,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Beaker,
  CheckSquare
} from 'lucide-react';

import html2pdf from 'html2pdf.js';

interface LabRequestFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: LabRequestFormData) => void;
  consignment: Consignment;
  importerData?: Importer;
  isReadOnly?: boolean;
}

const LabRequestFormModal: React.FC<LabRequestFormModalProps> = ({ isOpen, onClose, onSave, consignment, importerData, isReadOnly }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('preview');

  const [formData, setFormData] = useState<LabRequestFormData>({
    customerName: consignment.importer || '',
    email: importerData?.email || '',
    phone: importerData?.phone || '',
    samplingDate: new Date().toISOString().split('T')[0] + ' ' + new Date().toLocaleTimeString('en-GB', {hour:'2-digit', minute:'2-digit'}),
    receivingDate: '',
    items: [{}, {}, {}], 
    reasons: [],
    analysisTypes: [],
    remarks: '',
    fees: []
  });

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    if (isOpen) {
        if (consignment.labRequestFormData) {
            setFormData(consignment.labRequestFormData);
        } else {
            const items: Partial<ConsignmentItem>[] = (consignment.items || []).slice(0, 3).map(item => ({
                ...item,
                producingCompany: ''
            }));
            while (items.length < 3) {
                items.push({});
            }
            
            // Auto-fill test types based on risk plan 
            const prefilledAnalysis: string[] = [];
            items.forEach((item, idx) => {
               if (item.riskPlanId && consignment.items) {
                   const originalItem = consignment.items.find(i => i.id === item.id);
                   // In a real app, we'd lookup the samplingPlan by ID here to get requiredAnalysis
                   // Assuming it was passed or available globally, but we can just use the item's existing labAnalysisType if we populated it
               }
            });

            setFormData(prev => ({
                ...prev,
                customerName: consignment.importer || '',
                email: importerData?.email || '',
                phone: importerData?.phone || '',
                items: items,
                analysisTypes: prefilledAnalysis,
                fees: []
            }));
        }
    }
  }, [isOpen, consignment, importerData]);

  const handleInputChange = (field: keyof LabRequestFormData, value: any) => {
    if (isReadOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    if (isReadOnly) return;
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const toggleReason = (reasonId: string, index: number) => {
      if (isReadOnly) return;
      const key = `${reasonId}_${index}`;
      setFormData(prev => {
          const reasons = prev.reasons.includes(key) 
            ? prev.reasons.filter(r => r !== key)
            : [...prev.reasons, key];
          return { ...prev, reasons };
      });
  };

  const toggleAnalysis = (analysis: string, index: number) => {
      if (isReadOnly) return;
      const key = `${analysis}_${index}`;
      setFormData(prev => {
          const types = prev.analysisTypes.includes(key)
            ? prev.analysisTypes.filter(t => t !== key)
            : [...prev.analysisTypes, key];
          return { ...prev, analysisTypes: types };
      });
  };

  const handleFeeToggle = (index: number, value: 'fees' | 'no_fees') => {
      if (isReadOnly) return;
      setFormData(prev => {
          const fees = [...(prev.fees || [])];
          fees[index] = fees[index] === value ? '' : value;
          return { ...prev, fees };
      });
  }

  const handleSave = async () => {
      if (isSaving) return;
      if(!formData.customerName) {
          showToast("يرجى إدخال اسم مقدم الطلب", 'error');
          return;
      }
      setIsSaving(true);
      try {
          await onSave(formData);
          showToast("تم حفظ بيانات الاستمارة بنجاح", 'success');
      } catch (e) {
          showToast("حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.", 'error');
      } finally {
          setIsSaving(false);
      }
  };

  const handlePrint = () => {
      window.print();
  };

  const handleExportPDF = () => {
      if (!formRef.current || isExporting) return;
      setIsExporting(true);
      const element = formRef.current;
      const opt = {
          margin: [5, 5, 5, 5] as [number, number, number, number],
          filename: `Lab_Request_${consignment.bayanNumber || 'Draft'}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0, letterRendering: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      html2pdf().set(opt).from(element).save().then(() => {
          setIsExporting(false);
      }).catch((err: any) => {
          console.error(err);
          setIsExporting(false);
          showToast("حدث خطأ أثناء تصدير الملف.", 'error');
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/95 flex flex-col items-center justify-start overflow-hidden backdrop-blur-md print:bg-white print:static print:block">
        
        {/* Toast Notification */}
        <AnimatePresence>
          {notification && (
              <motion.div 
                initial={{ opacity: 0, y: -20, x: '-50%' }}
                animate={{ opacity: 1, y: 0, x: '-50%' }}
                exit={{ opacity: 0, y: -20, x: '-50%' }}
                className="fixed top-10 left-1/2 z-[400]"
              >
                  <div className={`bg-white px-6 py-4 rounded-2xl shadow-2xl border-r-4 flex items-center gap-4 min-w-[320px] max-w-md ${notification.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notification.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                          {notification.type === 'error' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      </div>
                      <div>
                          <h4 className={`text-sm font-black ${notification.type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
                              {notification.type === 'error' ? 'تنبيه' : 'تم بنجاح'}
                          </h4>
                          <p className="text-xs font-bold text-slate-600 mt-1">{notification.message}</p>
                      </div>
                      <button onClick={() => setNotification(null)} className="mr-auto text-slate-300 hover:text-slate-500">
                          <X className="w-4 h-4" />
                      </button>
                  </div>
              </motion.div>
          )}
        </AnimatePresence>

        {/* Modern Header Bar */}
        <div className="w-full bg-white/10 border-b border-white/10 p-4 flex justify-between items-center px-8 print:hidden">
            <div className="flex items-center gap-4">
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all">
                    <ArrowRight className="w-5 h-5" />
                </button>
                <div>
                    <h3 className="text-white font-black text-lg flex items-center gap-2">
                        <FlaskConical className="w-5 h-5 text-red-400" />
                        استمارة طلب فحص عينات
                    </h3>
                    <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Consignment: {consignment.bayanNumber || 'Draft'}</p>
                </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10">
                <button 
                  onClick={() => setActiveTab('edit')} 
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'edit' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                  <Edit3 className="w-4 h-4" /> تعديل البيانات
                </button>
                <button 
                  onClick={() => setActiveTab('preview')} 
                  className={`px-6 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${activeTab === 'preview' ? 'bg-white text-slate-900 shadow-lg' : 'text-white/60 hover:text-white'}`}
                >
                  <Eye className="w-4 h-4" /> معاينة النموذج
                </button>
            </div>

            <div className="flex gap-3">
                {!isReadOnly && (
                    <button onClick={handleSave} disabled={isSaving} className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50">
                        {isSaving ? <Clock className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} حفظ
                    </button>
                )}
                <button onClick={handleExportPDF} disabled={isExporting} className="bg-red-500 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-red-600 transition-all flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-50">
                    {isExporting ? <Clock className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />} تصدير PDF
                </button>
                <button onClick={handlePrint} className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-black text-xs hover:bg-slate-900 transition-all flex items-center gap-2 shadow-lg shadow-slate-500/20">
                    <Printer className="w-4 h-4" /> طباعة
                </button>
            </div>
        </div>

        <div className="flex-1 w-full flex overflow-hidden print:block print:overflow-visible">
            {/* Edit Panel */}
            <AnimatePresence mode="wait">
              {activeTab === 'edit' && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="w-full lg:w-1/2 h-full overflow-y-auto p-10 custom-scrollbar print:hidden"
                >
                    <div className="max-w-2xl mx-auto space-y-10">
                        {/* Section: Customer Info */}
                        <section className="space-y-6">
                            <h4 className="text-white/40 text-[10px] font-black uppercase flex items-center gap-2">
                                <User className="w-3 h-3" /> بيانات مقدم الطلب
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ModernInput label="اسم مقدم الطلب" value={formData.customerName} onChange={(v: string) => handleInputChange('customerName', v)} icon={<User className="w-4 h-4" />} />
                                <ModernInput label="البريد الإلكتروني" value={formData.email} onChange={(v: string) => handleInputChange('email', v)} icon={<Mail className="w-4 h-4" />} />
                                <ModernInput label="رقم الهاتف / العنوان" value={formData.phone} onChange={(v: string) => handleInputChange('phone', v)} icon={<Phone className="w-4 h-4" />} />
                                <ModernInput label="تاريخ ووقت أخذ العينة" value={formData.samplingDate} onChange={(v: string) => handleInputChange('samplingDate', v)} icon={<Calendar className="w-4 h-4" />} />
                                <ModernInput label="تاريخ ووقت الاستلام" value={formData.receivingDate} onChange={(v: string) => handleInputChange('receivingDate', v)} icon={<Clock className="w-4 h-4" />} />
                            </div>
                        </section>

                        {/* Section: Items */}
                        <section className="space-y-6">
                            <h4 className="text-white/40 text-[10px] font-black uppercase flex items-center gap-2">
                                <ClipboardList className="w-3 h-3" /> بيانات العينات
                            </h4>
                            <div className="space-y-8">
                                {formData.items.map((item, idx) => (
                                    <motion.div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                            <span className="text-white/80 text-sm flex items-center gap-2 font-black uppercase"><FlaskConical className="w-4 h-4"/> عينة رقم {idx + 1}</span>
                                            {idx > 0 && <button onClick={() => {
                                                const newItems = [...formData.items];
                                                newItems.splice(idx, 1);
                                                setFormData(prev => ({ ...prev, items: newItems }));
                                            }} className="text-red-400 hover:text-red-600">
                                                <X className="w-4 h-4" />
                                            </button>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <ModernInput label="Alert Security Seal (SN)" value={(item as any).securitySeal || ''} onChange={(v: string) => handleItemChange(idx, 'securitySeal', v)} dark />
                                            <ModernInput label="رقم كود العميل Customer Code No" value={(item as any).customerCode || ''} onChange={(v: string) => handleItemChange(idx, 'customerCode', v)} dark />
                                            <ModernInput label="اسم المنتج Product Name" value={item.description || ''} onChange={(v: string) => handleItemChange(idx, 'description', v)} dark />
                                            <ModernInput label="الشركة المنتجة Producing Company" value={item.producingCompany || ''} onChange={(v: string) => handleItemChange(idx, 'producingCompany', v)} dark />
                                            <ModernInput label="مصدر العينة Sample Source" value={(item as any).sampleSource || ''} onChange={(v: string) => handleItemChange(idx, 'sampleSource', v)} dark />
                                            <ModernInput label="بلد المنشأ Country of Origin" value={item.origin || ''} onChange={(v: string) => handleItemChange(idx, 'origin', v)} dark />
                                            <ModernInput label="العلامة التجارية Brand" value={item.brand || ''} onChange={(v: string) => handleItemChange(idx, 'brand', v)} dark />
                                            <ModernInput label="تاريخ الإنتاج Production Date" value={item.productionDate || ''} onChange={(v: string) => handleItemChange(idx, 'productionDate', v)} dark />
                                            <ModernInput label="تاريخ الانتهاء Expiry Date" value={item.expiryDate || ''} onChange={(v: string) => handleItemChange(idx, 'expiryDate', v)} dark />
                                            <ModernInput label="رقم التشغيلة Batch No." value={item.batchNumber || ''} onChange={(v: string) => handleItemChange(idx, 'batchNumber', v)} dark />
                                            <ModernInput label="وزن العينة Sample Weight" value={item.weight || ''} onChange={(v: string) => handleItemChange(idx, 'weight', v)} dark />
                                            <ModernInput label="عدد الوحدات No. of Unit" value={item.packageCount || ''} onChange={(v: string) => handleItemChange(idx, 'packageCount', v)} dark />
                                            <ModernInput label="درجة الحرارة Temperature" value={(item as any).storageTemp || ''} onChange={(v: string) => handleItemChange(idx, 'storageTemp', v)} dark />
                                        </div>

                                        <div className="border-t border-white/10 pt-4 mt-4">
                                            <h5 className="text-[10px] font-black uppercase text-white/50 mb-3">سبب أخذ العينة (عينة {idx + 1})</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { id: 'complaint', ar: 'شكوى', en: 'Complaint' },
                                                    { id: 'confirmatory', ar: 'تأكيدية', en: 'Confirmatory' },
                                                    { id: 'supervisory', ar: 'رقابية', en: 'Supervisory' },
                                                    { id: 'projects', ar: 'مشاريع', en: 'Projects' },
                                                    { id: 'others', ar: 'أخرى', en: 'Others' }
                                                ].map((r) => {
                                                    const isChecked = formData.reasons.includes(`${r.id}_${idx}`);
                                                    return (
                                                        <button 
                                                          key={r.id} 
                                                          onClick={() => toggleReason(r.id, idx)}
                                                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                                                        >
                                                            <div className={`w-3 h-3 border flex items-center justify-center rounded-sm ${isChecked ? 'border-white' : 'border-white/30'}`}>
                                                              {isChecked && <CheckSquare className="w-2.5 h-2.5" />}
                                                            </div>
                                                            {r.ar}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="border-t border-white/10 pt-4">
                                            <h5 className="text-[10px] font-black uppercase text-white/50 mb-3">نوع التحاليل المطلوبة (عينة {idx + 1})</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { en: 'Water Chemical', ar: 'كيميائية مياه' },
                                                    { en: 'Microbiology', ar: 'أحياء دقيقة' },
                                                    { en: 'Trace element', ar: 'معادن ثقيلة' },
                                                    { en: 'Radioactive', ar: 'إشعاعية' },
                                                    { en: 'Contaminant', ar: 'ملوثات' },
                                                    { en: 'Additives', ar: 'مضافات' },
                                                    { en: 'Contact Materials', ar: 'مواد ملامسة' }
                                                ].map((a) => {
                                                    const isChecked = formData.analysisTypes.includes(`${a.en}_${idx}`);
                                                    return (
                                                        <button 
                                                          key={a.en} 
                                                          onClick={() => toggleAnalysis(a.en, idx)}
                                                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${isChecked ? 'bg-red-500 border-red-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                                                        >
                                                            <div className={`w-3 h-3 border flex items-center justify-center rounded-sm ${isChecked ? 'border-white' : 'border-white/30'}`}>
                                                              {isChecked && <CheckSquare className="w-2.5 h-2.5" />}
                                                            </div>
                                                            {a.ar} <span className="opacity-50 text-[9px]">{a.en}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="border-t border-white/10 pt-4">
                                            <h5 className="text-[10px] font-black uppercase text-white/50 mb-3">رسوم التحليل (عينة {idx + 1})</h5>
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => handleFeeToggle(idx, 'fees')}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs transition-all ${formData.fees?.[idx] === 'fees' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                                                >
                                                    <div className={`w-3 h-3 border flex items-center justify-center rounded-sm ${formData.fees?.[idx] === 'fees' ? 'border-white' : 'border-white/30'}`}>
                                                        {formData.fees?.[idx] === 'fees' && <CheckSquare className="w-2.5 h-2.5" />}
                                                    </div>
                                                    برسوم / fees
                                                </button>
                                                <button 
                                                    onClick={() => handleFeeToggle(idx, 'no_fees')}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs transition-all ${formData.fees?.[idx] === 'no_fees' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white/5 border-white/10 text-white/60 hover:border-white/20'}`}
                                                >
                                                    <div className={`w-3 h-3 border flex items-center justify-center rounded-sm ${formData.fees?.[idx] === 'no_fees' ? 'border-white' : 'border-white/30'}`}>
                                                        {formData.fees?.[idx] === 'no_fees' && <CheckSquare className="w-2.5 h-2.5" />}
                                                    </div>
                                                    بدون / No fees
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {formData.items.length < 3 && <button 
                                    onClick={() => setFormData(prev => ({ ...prev, items: [...prev.items, {}] }))}
                                    className="w-full py-4 rounded-3xl border-2 border-dashed border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all text-xs font-black flex items-center justify-center gap-2"
                                >
                                    <FlaskConical className="w-4 h-4" /> إضافة عينة جديدة
                                </button>}
                            </div>
                        </section>

                        <section className="space-y-6 pb-20">
                            <h4 className="text-white/40 text-[10px] font-black uppercase flex items-center gap-2">
                                <Edit3 className="w-3 h-3" /> ملاحظات إضافية
                            </h4>
                            <textarea 
                              value={formData.remarks} 
                              onChange={(e) => handleInputChange('remarks', e.target.value)}
                              placeholder="اكتب أي ملاحظات إضافية هنا..."
                              className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-white text-sm font-bold h-32 outline-none focus:border-white/30 transition-all resize-none"
                            />
                        </section>
                    </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview Panel */}
            <div className={`flex-1 h-full bg-slate-800 p-10 overflow-y-auto custom-scrollbar flex justify-center ${activeTab === 'edit' ? 'hidden lg:flex' : 'flex'}`}>
                <div id="lab-request-form-content" ref={formRef} className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl relative print:shadow-none print:m-0 print:w-full print:max-w-none print:h-auto overflow-hidden scale-[0.85] origin-top lg:scale-100 flex flex-col items-center">
                    {/* The Official Form Content */}
                    <div className="p-4 text-black font-sans text-[10px] leading-normal form-content flex-grow flex flex-col w-full" dir="ltr" style={{ fontFamily: 'Arial, sans-serif' }}>
                        {/* Header */}
                        <div className="border border-black mb-2 flex-shrink-0">
                            <div className="grid grid-cols-12 border-b border-black">
                                <div className="col-span-3 border-r border-black p-2 flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-16 flex items-center justify-center mb-1">
                                       <img src="/logo.jpeg" alt="Center Logo" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <span className="text-[7px] font-bold leading-tight">FOOD SAFETY & QUALITY CENTER</span>
                                </div>
                                <div className="col-span-9 flex flex-col">
                                    <div className="text-center font-bold border-b border-black p-1 bg-gray-50 flex-grow flex items-center justify-center text-xs">Samples Analysis Request Form</div>
                                    <div className="text-center font-bold border-b border-black p-1 flex-grow flex items-center justify-center text-xs">THE CENTRAL LABORATORY FOR FOOD SAFETY</div>
                                    <div className="grid grid-cols-4 text-[8px]">
                                        <div className="border-r border-black p-1 font-bold flex items-center">DOCUMENT NO:</div>
                                        <div className="border-r border-black p-1 flex items-center">FO0074001</div>
                                        <div className="border-r border-black p-1 font-bold flex items-center">ISSUE NO:</div>
                                        <div className="p-1 flex items-center">1</div>
                                    </div>
                                    <div className="grid grid-cols-4 text-[8px] border-t border-black">
                                        <div className="border-r border-black p-1 font-bold flex items-center">REVISION NO:</div>
                                        <div className="border-r border-black p-1 flex items-center">00</div>
                                        <div className="border-r border-black p-1 font-bold flex items-center">ISSUE DATE:</div>
                                        <div className="p-1 flex items-center">6/11/2025</div>
                                    </div>
                                    <div className="grid grid-cols-4 text-[8px] border-t border-black">
                                        <div className="border-r border-black p-1 font-bold flex items-center">REVISION DATE:</div>
                                        <div className="border-r border-black p-1 flex items-center">NIL</div>
                                        <div className="border-r border-black p-1 font-bold flex items-center">PAGE NO:</div>
                                        <div className="p-1 flex items-center">1 OF 1</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <h2 className="text-center font-bold text-[13px] mb-2 uppercase" style={{ fontFamily: 'Arial, sans-serif' }}>استمارة طلب فحص عينات SAMPLES ANALYSIS REQUEST FORM</h2>

                        {/* Customer Info Table */}
                        <div className="border border-black text-[9px] mb-2 flex-shrink-0">
                            <div className="grid grid-cols-12 border-b border-black">
                                <div className="col-span-4 border-r border-black p-1 bg-gray-50 font-bold">Customer Name/اسم مقدم الطلب</div>
                                <div className="col-span-8 p-1 font-bold text-center" dir="rtl">{formData.customerName}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-black">
                                <div className="col-span-4 border-r border-black p-1 bg-gray-50 font-bold">Email/البريد الإلكتروني</div>
                                <div className="col-span-8 p-1 text-center">{formData.email}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-black">
                                <div className="col-span-4 border-r border-black p-1 bg-gray-50 font-bold">Phone number/address/رقم الهاتف/العنوان</div>
                                <div className="col-span-8 p-1 text-center font-arial">{formData.phone}</div>
                            </div>
                            <div className="grid grid-cols-12 border-b border-black">
                                <div className="col-span-4 border-r border-black p-1 bg-gray-50 font-bold">Date and Time of Sampling/تاريخ ووقت أخذ العينة</div>
                                <div className="col-span-8 p-1 text-center font-arial">{formData.samplingDate}</div>
                            </div>
                            <div className="grid grid-cols-12">
                                <div className="col-span-4 border-r border-black p-1 bg-gray-50 font-bold">Date and Time of Receiving/تاريخ ووقت الاستلام</div>
                                <div className="col-span-8 p-1 text-center font-arial">{formData.receivingDate}</div>
                            </div>
                        </div>

                        {/* Samples Grid Table */}
                        <div className="border border-black text-[9px] mb-2 flex-shrink-0">
                            <div className="grid grid-cols-4 text-center font-bold border-b border-black bg-white">
                                <div className="border-r border-black p-1"></div>
                                <div className="border-r border-black p-1 text-sm bg-gray-50">1</div>
                                <div className="border-r border-black p-1 text-sm bg-gray-50">2</div>
                                <div className="p-1 text-sm bg-gray-50">3</div>
                            </div>
                            {[
                                { label: 'Alert Security Seal (SN):', key: 'securitySeal' },
                                { label: 'رقم كود العميل Customer Code No', key: 'customerCode' },
                                { label: 'اسم المنتج Product Name', key: 'description' },
                                { label: 'الشركة المنتجة Producing Company', key: 'producingCompany' },
                                { label: 'مصدر العينة Sample Source', key: 'sampleSource' },
                                { label: 'بلد المنشأ Country of Origin', key: 'origin' },
                                { label: 'العلامة التجارية Brand', key: 'brand' },
                                { label: 'تاريخ الإنتاج Production Date', key: 'productionDate' },
                                { label: 'تاريخ الانتهاء Expiry Date', key: 'expiryDate' },
                                { label: 'رقم التشغيلة Batch No.', key: 'batchNumber' },
                                { label: 'وزن العينة Sample Weight', key: 'weight' },
                                { label: 'عدد الوحدات No. of Unit', key: 'packageCount' },
                                { label: 'درجة الحرارة (C°)Temperature', key: 'storageTemp' }
                            ].map((row, rowIdx) => (
                                <div key={rowIdx} className="grid grid-cols-4 border-b border-black last:border-b-0">
                                    <div className="border-r border-black p-1.5 font-bold flex items-center justify-between px-2 text-[8px]">
                                       <span className="text-left font-arial">{row.label.split(/[\u0600-\u06FF]/).filter(s=>s.trim()).join(' ')}</span>
                                       <span className="text-right font-arial" dir="rtl">{row.label.replace(/[a-zA-Z\:\/\(\)°]/g, '').trim()}</span>
                                    </div>
                                    {[0, 1, 2].map((colIdx) => (
                                        <div key={colIdx} className={`p-1.5 text-center flex items-center justify-center font-arial ${colIdx < 2 ? 'border-r border-black' : ''}`}>
                                            {String((formData.items[colIdx] as any)?.[row.key] || '')}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* Reasons Grid spanning cols 1 2 3 */}
                        <div className="border border-black text-[9px] mb-2 flex-shrink-0">
                            <div className="grid grid-cols-4 border-b border-black">
                                <div className="border-r border-black p-4 font-bold flex flex-col items-center justify-center text-center text-[10px]">
                                    <span>Reason for Taking the Sample</span>
                                    <span>سبب أخذ العينة</span>
                                </div>
                                {[0, 1, 2].map(colIdx => (
                                    <div key={colIdx} className={`p-2 text-[8px] flex flex-col gap-1.5 justify-center ${colIdx < 2 ? 'border-r border-black' : ''}`}>
                                        {[
                                            { id: 'complaint', label: 'Complaint / شكوى' },
                                            { id: 'confirmatory', label: 'Confirmatory/ تأكيدية' },
                                            { id: 'supervisory', label: 'Supervisory/ رقابية' },
                                            { id: 'projects', label: 'Projects / مشاريع' },
                                            { id: 'others', label: 'Others / أخرى' }
                                        ].map(r => {
                                            const isChecked = formData.reasons.includes(`${r.id}_${colIdx}`) || (colIdx === 0 && formData.reasons.includes(r.id));
                                            return (
                                                <div key={r.id} className="flex items-center gap-1.5">
                                                    <div className={`w-3 h-3 flex items-center justify-center border border-black bg-white`}>
                                                        {isChecked && <div className="w-2 h-2 bg-black rounded-sm"></div>}
                                                    </div>
                                                    <span>{r.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-4">
                                <div className="border-r border-black p-4 font-bold flex flex-col items-center justify-center text-center text-[10px]">
                                    <span>Type of analysis required</span>
                                    <span>نوع التحاليل المطلوبة</span>
                                </div>
                                {[0, 1, 2].map(colIdx => (
                                    <div key={colIdx} className={`p-2 text-[8px] flex flex-col gap-1.5 justify-center ${colIdx < 2 ? 'border-r border-black' : ''}`}>
                                        {[
                                            { id: 'Water Chemical', label: 'Water Chemical', ar: 'كيميائية مياه' },
                                            { id: 'Microbiology', label: 'Microbiology', ar: 'أحياء دقيقة' },
                                            { id: 'Trace element', label: 'Trace element', ar: 'معادن ثقيلة' },
                                            { id: 'Radioactive', label: 'Radioactive', ar: 'إشعاعية' },
                                            { id: 'Contaminant', label: 'Contaminant', ar: 'ملوثات' },
                                            { id: 'Additives', label: 'Additives', ar: 'مضافات' },
                                            { id: 'Contact Materials', label: 'Contact Materials', ar: 'مواد ملامسة' }
                                        ].map(a => {
                                            const isChecked = formData.analysisTypes.includes(`${a.id}_${colIdx}`) || (colIdx === 0 && formData.analysisTypes.includes(a.id));
                                            return (
                                                <div key={a.id} className="flex items-center justify-between gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-3 h-3 flex items-center justify-center border border-black bg-white`}>
                                                            {isChecked && <div className="w-2 h-2 bg-black rounded-sm"></div>}
                                                        </div>
                                                        <span>{a.label}</span>
                                                    </div>
                                                    <span>{a.ar}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="border border-black p-1 text-[9px] mb-2 flex-grow min-h-[40px] flex flex-col">
                            <span className="font-bold border-b border-black pb-1 mb-1 bg-gray-50 block w-full pl-1">Remarks \ الملاحظات </span>
                            <div className="flex-1 p-1 font-arial whitespace-pre-line">{formData.remarks}</div>
                        </div>

                        {/* Post-Remarks sections (Fees, Signature, internal use) */}
                        <div className="mt-auto flex-shrink-0">
                            {/* Analysis fees */}
                            <div className="border border-black text-[9px] mb-2">
                                <div className="grid grid-cols-4">
                                    <div className="border-r border-black p-2 font-bold flex items-center justify-between px-2 bg-gray-50">
                                        <span>Analysis fees</span>
                                        <span>رسوم التحليل</span>
                                    </div>
                                    {[0, 1, 2].map(colIdx => (
                                        <div key={colIdx} className={`p-2 flex items-center justify-center gap-4 ${colIdx < 2 ? 'border-r border-black' : ''}`}>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-3 h-3 flex items-center justify-center border border-black bg-white`}>
                                                    {formData.fees && formData.fees[colIdx] === 'fees' && <div className="w-2 h-2 bg-black rounded-sm"></div>}
                                                </div>
                                                <span>fees / برسوم</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className={`w-3 h-3 flex items-center justify-center border border-black bg-white`}>
                                                    {formData.fees && formData.fees[colIdx] === 'no_fees' && <div className="w-2 h-2 bg-black rounded-sm"></div>}
                                                </div>
                                                <span>No fees / بدون</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Signatures */}
                            <div className="border border-black text-[10px]">
                                <div className="grid grid-cols-2 border-b border-black">
                                    <div className="p-1.5 border-r border-black font-bold flex justify-between pr-4 bg-gray-50">
                                       <span>Applicant/signature/</span>
                                       <span>التوقيع/مقدم الطلب</span>
                                    </div>
                                    <div className="p-1.5 h-8"></div>
                                </div>
                                <div className="text-center font-bold text-red-600 p-1 border-b border-black uppercase text-[9px]">
                                    قسم تقييم المخاطر وإدارة الأزمات FOR LABORATORY USE ONLY استعمال المختبر فقط
                                </div>
                                <div className="grid grid-cols-2 border-b border-black">
                                    <div className="p-1.5 border-r border-black font-bold flex justify-between pr-4 bg-gray-50">
                                       <span>Recipient’s Signature/</span>
                                       <span>توقيع المستلم</span>
                                    </div>
                                    <div className="p-1.5 h-8"></div>
                                </div>
                                <div className="grid grid-cols-2">
                                    <div className="p-1.5 border-r border-black font-bold flex justify-between pr-4 bg-gray-50">
                                       <span>Lab. Sample No/</span>
                                       <span>رقم العينة بالمختبر</span>
                                    </div>
                                    <div className="p-1.5 h-8"></div>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-end text-[8px] mt-1 pt-1 font-arial font-bold">
                                <div>www.mafwr.gov.om</div>
                                <div>للاستفسار التواصل على 22592021</div>
                                <div>FOR INTERNAL USE - MIRQAB SYSTEM</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const ModernInput = ({ label, value, onChange, icon, dark }: any) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-white/40 uppercase px-2">{label}</label>
        <div className="relative">
            <input 
                type="text" 
                value={value ?? ''} 
                onChange={(e) => onChange(e.target.value)}
                className={`w-full ${dark ? 'bg-black/20 focus:bg-black/40' : 'bg-white/5 focus:bg-white/10'} border border-white/10 rounded-2xl px-4 py-3 text-white text-xs font-bold outline-none focus:border-white/30 transition-all`}
            />
            {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none">{icon}</div>}
        </div>
    </div>
);

export default LabRequestFormModal;
