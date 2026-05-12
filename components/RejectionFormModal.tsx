
import React, { useRef, useState, useEffect } from 'react';
import { Consignment, ConsignmentType } from '../types';

import html2pdf from 'html2pdf.js';

interface RejectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  consignment: Consignment;
}

const RejectionFormModal: React.FC<RejectionFormModalProps> = ({ isOpen, onClose, consignment }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const [language, setLanguage] = useState<'AR' | 'EN'>('AR');

  const handlePrint = () => {
    window.print();
  };

  const translations = {
    AR: {
      close: 'إغلاق',
      export: 'تصدير PDF',
      print: 'طباعة',
      details: 'تفاصيل الإرسالية',
      detailsSub: 'Details of Consignment',
      importer: 'اسم المستورد',
      importerSub: 'Name of IMPORTER',
      exporter: 'اسم المصدر',
      exporterSub: 'Name of Exporter',
      bayan: 'رقم البيان الجمركي',
      bayanSub: 'Custom Declaration No.',
      port: 'منفذ الدخول',
      portSub: 'Point of Entry',
      origin: 'بلد المنشأ',
      originSub: 'Country of Origin',
      commodity: 'السلعة',
      commoditySub: 'Commodity',
      commonName: 'الاسم الشائع',
      commonNameSub: 'Common Name',
      scientificName: 'الاسم العلمي',
      scientificNameSub: 'Scientific Name',
      weight: 'الوزن',
      weightSub: 'Weight',
      packages: 'عدد الطرود',
      packagesSub: 'No. of Packages',
      reason: 'سبب الرفض',
      reasonSub: 'Cause of Non-Compliance',
      action: 'الإجراء المتخذ',
      actionSub: 'Action Taken',
      arrivalDate: 'تاريخ وصول الإرسالية',
      arrivalDateSub: 'Date of Arrival',
      notificationDate: 'تاريخ الإخطار',
      notificationDateSub: 'Date of Notification',
      undertakingReexport: 'أتعهد بإعادة تصدير الإرسالية إلى مصدرها الأصلي خلال أسبوع من تاريخه.',
      undertakingDestruction: 'أوافق على اتلاف الإرسالية حسب القانون.',
      signatureImporter: 'توقيع المستورد / أو مندوبه',
      signatureOfficer: 'اسم وتوقيع الموظف المختص',
      signatureOfficerSub: 'Name and Signature of Authorized Officer',
      signatureHead: 'اسم وتوقيع رئيس القسم',
      signatureHeadSub: 'Name and Signature of Head Department',
      undertakingReexportSub: '',
      undertakingDestructionSub: '',
      signatureImporterSub: '',
      copy: 'نسخة: الملف / المستورد / الجمارك',
      titles: {
        [ConsignmentType.VETERINARY]: 'إخطار رفض إرسالية بيطرية واردة',
        [ConsignmentType.AGRICULTURAL]: 'إخطار رفض إرسالية زراعية واردة',
        [ConsignmentType.FOOD_SAFETY]: 'إخطار رفض إرسالية سلامة غذاء واردة'
      }
    },
    EN: {
      close: 'Close',
      export: 'Export PDF',
      print: 'Print',
      details: 'Details of Consignment',
      detailsSub: 'تفاصيل الإرسالية',
      importer: 'Name of IMPORTER',
      importerSub: 'اسم المستورد',
      exporter: 'Name of Exporter',
      exporterSub: 'اسم المصدر',
      bayan: 'Custom Declaration No.',
      bayanSub: 'رقم البيان الجمركي',
      port: 'Point of Entry',
      portSub: 'منفذ الدخول',
      origin: 'Country of Origin',
      originSub: 'بلد المنشأ',
      commodity: 'Commodity',
      commoditySub: 'السلعة',
      commonName: 'Common Name',
      commonNameSub: 'الاسم الشائع',
      scientificName: 'Scientific Name',
      scientificNameSub: 'الاسم العلمي',
      weight: 'Weight',
      weightSub: 'الوزن',
      packages: 'No. of Packages',
      packagesSub: 'عدد الطرود',
      reason: 'Cause of Non-Compliance',
      reasonSub: 'سبب الرفض',
      action: 'Action Taken',
      actionSub: 'الإجراء المتخذ',
      arrivalDate: 'Date of Arrival',
      arrivalDateSub: 'تاريخ وصول الإرسالية',
      notificationDate: 'Date of Notification',
      notificationDateSub: 'تاريخ الإخطار',
      undertakingReexport: 'I undertake to re-export the consignment to its original source within one week from this date.',
      undertakingReexportSub: 'أتعهد بإعادة تصدير الإرسالية إلى مصدرها الأصلي خلال أسبوع من تاريخه.',
      undertakingDestruction: 'I agree to the destruction of the consignment according to the law.',
      undertakingDestructionSub: 'أوافق على اتلاف الإرسالية حسب القانون.',
      signatureImporter: 'Signature of Importer / Representative',
      signatureImporterSub: 'توقيع المستورد / أو مندوبه',
      signatureOfficer: 'Name and Signature of Authorized Officer',
      signatureOfficerSub: 'اسم وتوقيع الموظف المختص',
      signatureHead: 'Name and Signature of Head Department',
      signatureHeadSub: 'اسم وتوقيع رئيس القسم',
      copy: 'Copy: File / Importer / Customs',
      titles: {
        [ConsignmentType.VETERINARY]: 'Notification of Rejection of Incoming Veterinary Consignment',
        [ConsignmentType.AGRICULTURAL]: 'Notification of Rejection of Incoming Agricultural Consignment',
        [ConsignmentType.FOOD_SAFETY]: 'Notification of Rejection of Incoming Food Safety Consignment'
      }
    }
  };

  const t = translations[language];

  const handleExportPDF = () => {
    if (!printRef.current || isExporting) return;
    setIsExporting(true);

    setTimeout(() => {
        const element = printRef.current;
        const opt = {
          margin: [40, 10, 10, 10] as [number, number, number, number],
          filename: `Rejection_Note_${consignment.bayanNumber || 'Draft'}.pdf`,
          image: { type: 'jpeg' as const, quality: 0.98 },
          html2canvas: { scale: 3, useCORS: true, logging: false, letterRendering: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
        };

        html2pdf().set(opt).from(element).save().then(() => {
          setIsExporting(false);
        }).catch((err: any) => {
          console.error(err);
          setIsExporting(false);
          alert("حدث خطأ أثناء تصدير الملف.");
        });
    }, 100);
  };

  if (!isOpen) return null;

  const today = new Date().toISOString().split('T')[0];
  const items = consignment.items || [];

  return (
    <div className="fixed inset-0 z-[300] bg-slate-900/90 flex flex-col items-center justify-start overflow-y-auto backdrop-blur-sm print:p-0 print:bg-white print:static print:z-auto print:block">
      
      {/* Action Bar (Hidden when printing) */}
      <div className="w-full max-w-[210mm] sticky top-4 z-50 flex flex-col md:flex-row justify-between items-center bg-white/95 p-4 rounded-2xl shadow-xl backdrop-blur-md mb-6 mt-6 border border-slate-200 print:hidden gap-4">
        <div className="flex gap-2">
            <button onClick={onClose} className="bg-slate-100 text-slate-600 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 text-xs">
                <i className="fas fa-arrow-right"></i> {t.close}
            </button>
            <div className="flex bg-slate-100 p-1 rounded-xl">
                <button 
                    onClick={() => setLanguage('AR')} 
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'AR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    العربية
                </button>
                <button 
                    onClick={() => setLanguage('EN')} 
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${language === 'EN' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    English
                </button>
            </div>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleExportPDF} 
                disabled={isExporting}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center gap-2 shadow-lg shadow-red-500/20 disabled:opacity-70 disabled:cursor-not-allowed text-xs"
            >
                {isExporting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-file-pdf"></i>}
                <span>{t.export}</span>
            </button>

            <button onClick={handlePrint} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-lg shadow-slate-500/20 text-xs">
                <i className="fas fa-print"></i> {t.print}
            </button>
        </div>
      </div>

      {/* --- FORM CONTENT --- */}
      <div ref={printRef} className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-2xl mx-auto mb-10 p-10 print:shadow-none print:m-0 print:p-0 print:w-full relative">
        
        {/* Header Spacer for Letterhead */}
        <div className="h-4"></div> 

        <h1 className={`text-center text-xl font-bold underline mb-6 ${isExporting ? 'mt-16' : ''}`}>{t.titles[consignment.type] || t.titles[ConsignmentType.FOOD_SAFETY]}</h1>

        <div className="border-2 border-black font-serif text-sm" dir={language === 'AR' ? 'rtl' : 'ltr'}>
            {/* Section 1: Details Header */}
            <div className="border-b border-black text-center font-bold bg-gray-100 p-2">
                {t.details}<br/>
                <span className="text-xs font-normal">{t.detailsSub}</span>
            </div>

            {/* Row 1: Exporter / Importer */}
            <div className={`grid grid-cols-2 border-b border-black divide-x divide-black ${language === 'AR' ? 'divide-x-reverse' : ''}`}>
                <div className="p-2">
                    <div className="font-bold mb-1">{t.importer} / {t.importerSub}</div>
                    <div className="min-h-[2rem] font-mono">{consignment.importer}</div>
                </div>
                <div className="p-2">
                    <div className="font-bold mb-1">{t.exporter} / {t.exporterSub}</div>
                    <div className="min-h-[2rem] font-mono">{consignment.exporter || '---'}</div>
                </div>
            </div>

            {/* Row 2: Origin / Entry / Customs */}
            <div className={`grid grid-cols-3 border-b border-black divide-x divide-black ${language === 'AR' ? 'divide-x-reverse' : ''}`}>
                <div className="p-2 text-center">
                    <div className="font-bold mb-1">{t.bayan}</div>
                    <div className="text-xs mb-1">{t.bayanSub}</div>
                    <div className="font-mono font-bold">{consignment.bayanNumber}</div>
                </div>
                <div className="p-2 text-center">
                    <div className="font-bold mb-1">{t.port}</div>
                    <div className="text-xs mb-1">{t.portSub}</div>
                    <div className="font-mono">{consignment.port || 'ميناء صحار'}</div>
                </div>
                <div className="p-2 text-center">
                    <div className="font-bold mb-1">{t.origin}</div>
                    <div className="text-xs mb-1">{t.originSub}</div>
                    <div className="font-mono">{consignment.shippingCountry || '-'}</div>
                </div>
            </div>

            {/* Row 3: Items Table Header */}
            <div className={`grid grid-cols-5 border-b border-black divide-x divide-black ${language === 'AR' ? 'divide-x-reverse' : ''} text-center bg-gray-50 text-xs font-bold`}>
                <div className="p-2">{t.commodity}<br/>{t.commoditySub}</div>
                <div className="p-2">{t.commonName}<br/>{t.commonNameSub}</div>
                <div className="p-2">{t.scientificName}<br/>{t.scientificNameSub}</div>
                <div className="p-2">{t.weight}<br/>{t.weightSub}</div>
                <div className="p-2">{t.packages}<br/>{t.packagesSub}</div>
            </div>

            {/* Row 4: Items Content (Map items, fill empty space) */}
            {items.map((item, idx) => (
                <div key={idx} className={`grid grid-cols-5 border-b border-black divide-x divide-black ${language === 'AR' ? 'divide-x-reverse' : ''} text-center text-xs`}>
                    <div className="p-2">{item.commodityGroup || '-'}</div>
                    <div className="p-2">{item.description}</div>
                    <div className="p-2 italic">{item.activeIngredients?.join(', ') || item.activeIngredient || '-'}</div>
                    <div className="p-2">{item.weight} {item.packagingUnit === 'طن' ? (language === 'AR' ? 'طن' : 'Ton') : (language === 'AR' ? 'كجم' : 'Kg')}</div>
                    <div className="p-2">{item.packageCount}</div>
                </div>
            ))}
            {items.length === 0 && (
                <div className={`grid grid-cols-5 border-b border-black divide-x divide-black ${language === 'AR' ? 'divide-x-reverse' : ''} text-center text-xs h-16`}>
                    <div className="p-2"></div><div className="p-2"></div><div className="p-2"></div><div className="p-2"></div><div className="p-2"></div>
                </div>
            )}

            {/* Row 5: Notification Details */}
            <div className={`grid grid-cols-4 border-b border-black divide-x divide-black ${language === 'AR' ? 'divide-x-reverse' : ''} text-center`}>
                <div className="p-2">
                    <div className="font-bold text-xs mb-1">{t.reason}</div>
                    <div className="text-[10px] mb-1">{t.reasonSub}</div>
                    <div className="font-bold text-red-600 text-sm mt-2">{consignment.rejectionReason || '---'}</div>
                </div>
                <div className="p-2">
                    <div className="font-bold text-xs mb-1">{t.action}</div>
                    <div className="text-[10px] mb-1">{t.actionSub}</div>
                    <div className="font-bold mt-2">{consignment.rejectionAction || '-'}</div>
                </div>
                <div className="p-2">
                    <div className="font-bold text-xs mb-1">{t.arrivalDate}</div>
                    <div className="text-[10px] mb-1">{t.arrivalDateSub}</div>
                    <div className="font-mono mt-2">{consignment.arrivalDate}</div>
                </div>
                <div className="p-2">
                    <div className="font-bold text-xs mb-1">{t.notificationDate}</div>
                    <div className="text-[10px] mb-1">{t.notificationDateSub}</div>
                    <div className="font-mono mt-2">{today}</div>
                </div>
            </div>

            {/* Row 6: Undertaking Section */}
            <div className="p-6 border-b border-black">
                <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 border-2 border-black flex items-center justify-center shrink-0 ${consignment.rejectionAction === 'إعادة تصدير' ? 'bg-black' : ''}`}>
                            {consignment.rejectionAction === 'إعادة تصدير' && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold">{t.undertakingReexport}</span>
                            {language === 'EN' && <span className="text-[10px] text-slate-500">{t.undertakingReexportSub}</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 border-2 border-black flex items-center justify-center shrink-0 ${consignment.rejectionAction === 'إتلاف' ? 'bg-black' : ''}`}>
                            {consignment.rejectionAction === 'إتلاف' && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold">{t.undertakingDestruction}</span>
                            {language === 'EN' && <span className="text-[10px] text-slate-500">{t.undertakingDestructionSub}</span>}
                        </div>
                    </div>
                </div>

                <div className={`flex justify-between items-end mt-12 px-4 ${language === 'EN' ? 'flex-row-reverse' : ''}`}>
                    <div className={language === 'AR' ? 'text-right' : 'text-left'}>
                        <p className="font-bold mb-2">{t.signatureImporter}</p>
                        {language === 'EN' && <p className="text-[10px] text-slate-500 mb-1">{t.signatureImporterSub}</p>}
                        <p>...........................................................</p>
                    </div>
                </div>
            </div>

            {/* Row 7: Official Signatures */}
            <div className={`grid grid-cols-2 divide-x divide-black ${language === 'AR' ? 'divide-x-reverse' : ''}`}>
                <div className="p-4 text-center h-32 flex flex-col justify-between">
                    <div>
                        <div className="font-bold">{t.signatureOfficer}</div>
                        <div className="text-xs">{t.signatureOfficerSub}</div>
                    </div>
                    <div className="font-bold font-mono text-lg">{consignment.inspectorName}</div>
                </div>
                <div className="p-4 text-center h-32 flex flex-col justify-between">
                    <div>
                        <div className="font-bold">{t.signatureHead}</div>
                        <div className="text-xs">{t.signatureHeadSub}</div>
                    </div>
                    <div className="font-bold text-sm mt-8">ماجد بن علي الشامسي</div>
                </div>
            </div>
        </div>
        
        <div className="text-center text-[10px] mt-4 text-gray-500">
            {t.copy}
        </div>

      </div>
    </div>
  );
};

export default RejectionFormModal;
