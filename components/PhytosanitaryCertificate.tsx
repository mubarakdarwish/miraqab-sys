import React, { useRef } from 'react';
import { Consignment } from '../types';
import Barcode from 'react-barcode';
import { QRCodeSVG } from 'qrcode.react';
import html2pdf from 'html2pdf.js';

interface PhytosanitaryCertificateProps {
  consignment: Consignment;
  exporterAddress?: string;
  onClose: () => void;
}

const MAX_ITEMS_ON_CERTIFICATE = 4;

const PhytosanitaryCertificate: React.FC<PhytosanitaryCertificateProps> = ({ consignment, exporterAddress, onClose }) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!certificateRef.current) return;

    const element = certificateRef.current;
    const opt = {
      margin:       0,
      filename:     `Phytosanitary_Certificate_${consignment.id}.pdf`,
      image:        { type: 'jpeg' as const, quality: 1 },
      html2canvas:  { scale: 3, useCORS: true, letterRendering: false, windowWidth: 1200 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak:    { mode: 'avoid-all' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  const items = consignment.items || [];
  const hasAnnex = items.length > MAX_ITEMS_ON_CERTIFICATE;
  const displayItems = hasAnnex ? [] : items;

  const originCountry = items.length > 0 
    ? Array.from(new Set(items.map((i: any) => i.origin))).filter(Boolean).join('، ') || 'سلطنة عمان'
    : 'سلطنة عمان';

  const totalPackages = items.reduce((acc, item) => acc + (item.packageCount || 0), 0);

  const isReExport = consignment.declarationType === 'إعادة تصدير';
  const titleAr = isReExport ? 'شهادة صحة نباتية لإعادة التصدير' : 'شهادة صحة نباتية';
  const titleEn = isReExport ? 'PHYTOSANITARY CERTIFICATE FOR RE-EXPORT' : 'PHYTOSANITARY CERTIFICATE';

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-200 overflow-y-auto font-official print:p-0 p-4 flex flex-col items-center" dir="rtl">
      <div ref={certificateRef} className="flex flex-col gap-8 print:gap-0">
        
        {/* Main Certificate Page */}
        <div className="w-[210mm] h-[297mm] bg-white p-8 relative shadow-2xl print:shadow-none print:m-0 text-black mx-auto font-official overflow-hidden flex flex-col border border-gray-200">
          
          {/* Header Section */}
          <div className="flex justify-between items-start mb-2 shrink-0">
            <div className="text-right w-1/3 font-bold">
              <h1 className="text-xl leading-tight">سلطنة عُمان</h1>
              <h2 className="text-lg leading-tight">وزارة الثروة الزراعية والسمكية وموارد المياه</h2>
            </div>
            <div className="w-1/3 flex justify-center">
              <img referrerPolicy="no-referrer" 
                src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                alt="Oman Logo" 
                className="h-20 object-contain" 
              />
            </div>
            <div className="text-left w-1/3 font-bold" dir="ltr">
              <h1 className="text-lg leading-tight">Sultanate of Oman</h1>
              <h2 className="text-base leading-tight">Ministry of Agriculture, Fisheries and Water Resources</h2>
            </div>
          </div>

          {/* Certificate Title & Number */}
          <div className="text-center mb-2 relative shrink-0">
            <div className="absolute left-0 top-0 bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
              <QRCodeSVG value={consignment.id} size={120} level="M" includeMargin={true} marginSize={4} />
            </div>
            <div className="absolute right-0 top-0 flex items-center gap-2 text-red-600 font-bold text-lg">
              <span className="text-black text-sm">رقم</span>
              <span className="font-mono">{consignment.id}</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-0">{titleAr}</h2>
            <h3 className="text-lg font-bold uppercase tracking-wider" dir="ltr">{titleEn}</h3>
          </div>

          {/* Main Table Structure */}
          <div className="border border-black text-[11px] leading-tight">
            
            {/* From / To */}
            <div className="grid grid-cols-2 border-b border-black">
              <div className="p-1 border-l border-black">
                <p className="font-bold text-right">من : منظمة وقاية النباتات في</p>
                <p className="text-[10px] font-bold text-left" dir="ltr">From : Plant Protection Organization (s) of</p>
                <p className="font-bold text-sm mt-1 text-center">سلطنة عمان</p>
              </div>
              <div className="p-1">
                <p className="font-bold text-right">إلى : منظمة وقاية النباتات في</p>
                <p className="text-[10px] font-bold text-left" dir="ltr">To : Plant Protection Organization (s) of</p>
                <p className="font-bold text-sm mt-1 text-center">{consignment.enShippingCountry || consignment.shippingCountry || '-'}</p>
              </div>
            </div>

            {/* Section I Title */}
            <div className="p-0.5 border-b border-black text-center bg-gray-50">
              <p className="font-bold">أولا : وصف الإرسالية</p>
              <p className="text-[10px] font-bold uppercase">1. DESCRIPTION OF CONSIGNMENT</p>
            </div>

            {/* Exporter / Consignee */}
            <div className="grid grid-cols-2 border-b border-black">
              <div className="p-1 border-l border-black min-h-[50px]">
                <p className="font-bold text-right">إسم المصدر وعنوانه</p>
                <p className="text-[9px] font-bold mb-1 text-left" dir="ltr">Name and address of exporter</p>
                <p className="font-bold text-center">{consignment.enImporter || consignment.importer || '-'}</p>
                {exporterAddress && <p className="text-[10px] text-center">{exporterAddress}</p>}
              </div>
              <div className="p-1 min-h-[50px]">
                <p className="font-bold text-right">إسم المستورد وعنوانه حسب البيانات</p>
                <p className="text-[9px] font-bold mb-1 text-left" dir="ltr">Declared name and address of consignee</p>
                <p className="font-bold text-center">{consignment.enExporter || consignment.exporter || '-'}</p>
              </div>
            </div>

            {/* Origin / Marks / Entry Point */}
            <div className="grid grid-cols-3 border-b border-black">
              <div className="p-1 border-l border-black">
                <p className="font-bold text-right">بلد المنشأ</p>
                <p className="text-[9px] font-bold text-left" dir="ltr">Origin</p>
                <p className="font-bold mt-1 text-center">{originCountry}</p>
              </div>
              <div className="p-1 border-l border-black">
                <p className="font-bold text-right">العلامات المميزة</p>
                <p className="text-[9px] font-bold text-left" dir="ltr">Distinguishing marks</p>
                <p className="font-bold mt-1 text-center">-</p>
              </div>
              <div className="p-1">
                <p className="font-bold text-right">نقطة الدخول حسب البيانات</p>
                <p className="text-[9px] font-bold text-left" dir="ltr">Declared point of entry</p>
                <p className="font-bold mt-1 text-center">{consignment.port || '-'}</p>
              </div>
            </div>

            {/* Details Row 2 */}
            <div className="grid grid-cols-5 border-b border-black">
              <div className="p-1 border-l border-black">
                <p className="font-bold text-right">غرض الاستعمال النهائي</p>
                <p className="text-[8px] font-bold text-left" dir="ltr">Purpose / End-use</p>
                <p className="font-bold mt-1 text-center">{consignment.enIntendedUse || consignment.intendedUse || '-'}</p>
              </div>
              <div className="p-1 border-l border-black">
                <p className="font-bold text-right">وسيلة النقل حسب البيانات</p>
                <p className="text-[8px] font-bold text-left" dir="ltr">Declared means of conveyance</p>
                <p className="font-bold mt-1 text-center">{consignment.containerNumber || '-'}</p>
              </div>
              <div className="p-1 border-l border-black">
                <p className="font-bold text-right">رقم تصريح الاستيراد</p>
                <p className="text-[8px] font-bold text-left" dir="ltr">Import permit number</p>
                <p className="font-bold mt-1 text-center">{consignment.permitNumber || '-'}</p>
              </div>
              <div className="p-1 border-l border-black">
                <p className="font-bold text-right">الكمية الكلية</p>
                <p className="text-[8px] font-bold text-left" dir="ltr">Total Quantity</p>
                <p className="font-bold mt-1 text-center" dir="ltr">{consignment.totalWeight ? `${consignment.totalWeight} KG` : '-'}</p>
              </div>
              <div className="p-1">
                <p className="font-bold text-right">العدد الكلي للطرود</p>
                <p className="text-[8px] font-bold text-left" dir="ltr">Total No. Packages</p>
                <p className="font-bold mt-1 text-center">{totalPackages || '-'}</p>
              </div>
            </div>

            {/* Items Table Header */}
            <div className="grid grid-cols-5 border-b border-black bg-gray-50 font-bold">
              <div className="p-1 border-l border-black">
                <p className="text-right">الاسم العلمي</p>
                <p className="text-[8px] text-left" dir="ltr">Scientific name</p>
              </div>
              <div className="p-1 border-l border-black">
                <p className="text-right">الاسم الشائع</p>
                <p className="text-[8px] text-left" dir="ltr">Common name</p>
              </div>
              <div className="p-1 border-l border-black">
                <p className="text-right">الصنف</p>
                <p className="text-[8px] text-left" dir="ltr">Commodity class</p>
              </div>
              <div className="p-1 border-l border-black">
                <p className="text-right">الكمية</p>
                <p className="text-[8px] text-left" dir="ltr">Quantity</p>
              </div>
              <div className="p-1">
                <p className="text-right">عدد الطرود</p>
                <p className="text-[8px] text-left" dir="ltr">No. of Packages</p>
              </div>
            </div>

            {/* Items List / Annex Placeholder */}
            <div className="min-h-[100px]">
              {hasAnnex ? (
                <div className="flex items-center justify-center h-full p-4 text-lg font-bold text-red-600">
                  انظر المرفق / SEE ATTACHED ANNEX
                </div>
              ) : (
                displayItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-5 border-b border-gray-200 text-center font-bold">
                    <div className="p-1 border-l border-black italic">-</div>
                    <div className="p-1 border-l border-black">{item.enDescription || item.description}</div>
                    <div className="p-1 border-l border-black">-</div>
                    <div className="p-1 border-l border-black" dir="ltr">{item.weight} KG</div>
                    <div className="p-1">{item.packageCount} {item.packagingUnit}</div>
                  </div>
                ))
              )}
            </div>

            {/* Certification Text */}
            <div className="p-2 border-t border-black text-justify text-[9px] leading-tight space-y-1 font-bold">
              <p dir="rtl">
                نشهد بأن النباتات أو المنتجات النباتية أو المواد الأخرى الخاضعة للوائح الصحة النباتية المشار إليها أعلاه قد تم فحصها و / أو اختبارها طبقا للإجراءات المعتمدة الملائمة ، ووجدت خالية من الآفات الحجرية التي حددها الطرف المتعاقد المستورد ومطابقة لمتطلبات الصحة النباتية لدى الطرف المتعاقد المستورد ، بما في ذلك الاشتراطات الخاصة بالآفات غير الحجرية الخاضعة للوائح .
              </p>
              <p dir="ltr">
                This is to certify that the plant products or other regulated articles described herein had been inspected and / or tested according to appropriated official procedures and are considered to be free from the quarantine pests specified by the importing contracting party and to confirm with the current phytosanitary requirements of the importing contracting party, including those for regulated non-quarantine pests.
              </p>
            </div>

            {/* Section II Title */}
            <div className="p-0.5 border-y border-black text-center bg-gray-50">
              <p className="font-bold">ثانيا : إقرار إضافي</p>
              <p className="text-[10px] font-bold uppercase">II. ADDITIONAL DECLARATION</p>
            </div>
            <div className="h-8 border-b border-black p-1 font-bold text-center">
              {consignment.inspectionNotes || '-'}
            </div>

            {/* Section III Title */}
            <div className="p-0.5 border-b border-black text-center bg-gray-50">
              <p className="font-bold">ثالثا : المعاملة للتطهير من التلوث / أو الأصابة</p>
              <p className="text-[10px] font-bold uppercase">III. DISINFESTATION AND/OR DISINFECTION TREATMENT</p>
            </div>

            {/* Treatment Details */}
            <div className="grid grid-cols-2 border-b border-black">
              <div className="grid grid-rows-2 border-l border-black">
                <div className="grid grid-cols-2 border-b border-black">
                  <div className="p-1 border-l border-black text-center">
                    <p className="font-bold">تاريخ المعاملة</p>
                    <p className="text-[8px] font-bold">Treatment Date</p>
                    <p className="font-bold mt-1">{consignment.treatmentDate || '-'}</p>
                  </div>
                  <div className="p-1 text-center">
                    <p className="font-bold">المعاملة</p>
                    <p className="text-[8px] font-bold">Treatment</p>
                    <p className="font-bold mt-1">{consignment.treatmentType || '-'}</p>
                  </div>
                </div>
                <div className="p-1 text-center">
                  <p className="font-bold">الكيماويات - المادة الفعالة</p>
                  <p className="text-[8px] font-bold">Chemical( Active Ingredients)</p>
                  <p className="font-bold mt-1">{consignment.treatmentChemicals || '-'}</p>
                </div>
              </div>
              <div className="grid grid-rows-2">
                <div className="p-1 border-b border-black text-center">
                  <p className="font-bold">نسبة التركيز</p>
                  <p className="text-[8px] font-bold">Concentration</p>
                  <p className="font-bold mt-1">{consignment.treatmentConcentration || '-'}</p>
                </div>
                <div className="p-1 text-center">
                  <p className="font-bold">مدة التعرض ودرجة الحرارة</p>
                  <p className="text-[8px] font-bold">Duration & Temperature</p>
                  <p className="font-bold mt-1">
                    {consignment.treatmentExposureDuration || '-'} {consignment.treatmentTemperature ? ` / ${consignment.treatmentTemperature} C°` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info & Signatures */}
            <div className="grid grid-cols-2">
              <div className="border-l border-black flex flex-col">
                <div className="p-1 border-b border-black text-center flex-1 flex flex-col justify-center">
                  <p className="font-bold">اسم وتوقيع الموظف المختص</p>
                  <p className="text-[8px] font-bold mb-1 text-left" dir="ltr">Name and Signature of Authorised Officer</p>
                  <p className="font-bold text-sm">{consignment.inspectorName || '-'}</p>
                </div>
                <div className="p-1 text-center h-16 flex flex-col justify-center border-t border-black relative">
                  <p className="font-bold">الختم الرسمي</p>
                  <p className="text-[8px] font-bold text-left" dir="ltr">Official Seal</p>
                  
                  {/* Virtual Ministry Seal */}
                  <div 
                    data-html2canvas-ignore="true"
                    className="absolute inset-0 flex items-center justify-center opacity-70 print:hidden pointer-events-none select-none"
                  >
                    <div className="w-16 h-16 border-4 border-double border-red-500 rounded-full flex flex-col items-center justify-center text-red-500 rotate-[-15deg] transform scale-125">
                      <span className="text-[6px] font-black leading-tight text-center">وزارة الثروة الزراعية والسمكية</span>
                      <span className="text-[5px] font-black border-y border-red-400 my-0.5 px-0.5 whitespace-nowrap">ختم افتراضي - Virtual</span>
                      <span className="text-[6px] font-black leading-tight text-center">سلطنة عُمان</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <div className="p-1 border-b border-black min-h-[30px]">
                  <p className="font-bold text-right">معلومات أخرى</p>
                  <p className="text-[8px] font-bold text-left" dir="ltr">Additional Information</p>
                </div>
                <div className="p-1 border-b border-black">
                  <p className="font-bold text-right">تاريخ الفحص / <span className="text-[8px]" dir="ltr">Date Inspected :</span></p>
                </div>
                <div className="p-1 border-b border-black">
                  <p className="font-bold text-right">تاريخ الإصدار / <span className="text-[8px]" dir="ltr">Date Issued : {new Date().toLocaleDateString('en-GB')}</span></p>
                </div>
                <div className="p-1">
                  <p className="font-bold text-right">مكان الإصدار / <span className="text-[8px]" dir="ltr">Place of Issue : {consignment.port || '-'}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="mt-2 text-center text-[9px] font-bold space-y-0.5 shrink-0">
            <p>لا تتحمل وزارة الزراعة والثروة السمكية في سلطنة عمان او أي من موظفيها المختصين أي مسؤولية قانونية أو مالية قد تنجم عن هذه الشهادة</p>
            <p>No financial liability with respect to this certificate shall attach to the Ministry of Agriculture & fisheries or to any officers or representatives in the Sultanate of Oman</p>
          </div>

          {/* Barcode */}
          <div className="mt-1 flex justify-end items-end shrink-0">
            <div className="flex flex-col items-center">
              <Barcode value={consignment.id} width={1} height={20} fontSize={8} />
              <p className="text-[7px] font-black text-slate-400 uppercase">Digital Security Code</p>
            </div>
          </div>
        </div>

        {/* Annex Page (if needed) */}
        {hasAnnex && (
          <div className="w-[210mm] h-[297mm] bg-white p-12 relative shadow-2xl print:shadow-none print:m-0 text-black mx-auto font-official flex flex-col border border-gray-200">
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
              <div className="text-right">
                <h2 className="text-2xl font-black">مرفق الشهادة الصحية النباتية</h2>
                <p className="text-lg font-bold">Annex to Phytosanitary Certificate</p>
              </div>
              <div className="text-left font-mono" dir="ltr">
                <p className="text-xl font-black text-red-600">No: {consignment.id}</p>
                <p className="text-sm">Date: {new Date().toLocaleDateString('en-GB')}</p>
              </div>
            </div>

            <table className="w-full border-collapse border-2 border-black text-sm">
              <thead>
                <tr className="bg-slate-100 font-bold">
                  <th className="border border-black p-2">م</th>
                  <th className="border border-black p-2">الاسم العلمي / Scientific Name</th>
                  <th className="border border-black p-2">الاسم الشائع / Common Name</th>
                  <th className="border border-black p-2">الكمية / Quantity</th>
                  <th className="border border-black p-2">عدد الطرود / Packages</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="text-center font-bold">
                    <td className="border border-black p-2">{idx + 1}</td>
                    <td className="border border-black p-2 italic">-</td>
                    <td className="border border-black p-2">{item.enDescription || item.description}</td>
                    <td className="border border-black p-2" dir="ltr">{item.weight} KG</td>
                    <td className="border border-black p-2">{item.packageCount} {item.packagingUnit}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-auto flex justify-between items-end border-t-4 border-black pt-8">
              <div className="text-center relative">
                <div className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-slate-300 text-xs mb-2">
                  OFFICIAL SEAL
                </div>
                
                {/* Virtual Ministry Seal for Annex */}
                <div 
                    data-html2canvas-ignore="true"
                    className="absolute top-4 left-1/2 -translate-x-1/2 opacity-70 print:hidden pointer-events-none select-none"
                  >
                    <div className="w-24 h-24 border-4 border-double border-red-500 rounded-full flex flex-col items-center justify-center text-red-500 rotate-[-15deg] transform scale-110">
                      <span className="text-[8px] font-black leading-tight text-center px-1">وزارة الثروة الزراعية والسمكية وموارد المياه</span>
                      <span className="text-[7px] font-black border-y border-red-400 my-1 px-1 whitespace-nowrap uppercase">Virtual Seal - ختم افتراضي</span>
                      <span className="text-[8px] font-black leading-tight text-center">سلطنة عُمان - OMAN</span>
                    </div>
                  </div>

                <p className="font-bold">الختم الرسمي</p>
              </div>
              <div className="text-center">
                <p className="font-bold mb-12">توقيع الموظف المختص / Signature</p>
                <p className="font-black text-xl border-t-2 border-black pt-2 px-8">{consignment.inspectorName}</p>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Print Controls */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-6 print:hidden bg-white/90 backdrop-blur-xl p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-white/50 z-[1010] animate-fade-in">
        <button 
          onClick={onClose}
          className="group flex flex-col items-center gap-1 transition-all"
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-slate-500 bg-slate-100 group-hover:bg-red-50 group-hover:text-red-600 transition-all shadow-sm">
            <i className="fas fa-times text-xl"></i>
          </div>
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-red-500">إغلاق</span>
        </button>

        <div className="w-px h-12 bg-slate-200 self-center"></div>

        <button 
          onClick={handleExportPDF}
          className="group flex flex-col items-center gap-1 transition-all"
        >
          <div className="px-8 h-12 rounded-2xl flex items-center justify-center gap-3 font-black text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 group-hover:scale-105 transition-all">
            <i className="fas fa-file-pdf text-lg"></i>
            <span>تصدير PDF</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500">نسخة رقمية</span>
        </button>

        <button 
          onClick={handlePrint}
          className="group flex flex-col items-center gap-1 transition-all"
        >
          <div className="px-8 h-12 rounded-2xl flex items-center justify-center gap-3 font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200 group-hover:scale-105 transition-all">
            <i className="fas fa-print text-lg"></i>
            <span>طباعة الشهادة</span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-500">نسخة ورقية</span>
        </button>
      </div>
    </div>
  );
};

export default PhytosanitaryCertificate;
