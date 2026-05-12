import React, { useRef } from 'react';
import { Consignment } from '../types';
import html2pdf from 'html2pdf.js';
import { QRCodeSVG } from 'qrcode.react';

interface VeterinaryCertificateProps {
  consignment: Consignment;
  exporterAddress?: string;
  onClose: () => void;
}

const VeterinaryCertificate: React.FC<VeterinaryCertificateProps> = ({ consignment, exporterAddress, onClose }) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    if (!certificateRef.current) return;

    const element = certificateRef.current;
    const opt = {
      margin:       0,
      filename:     `Veterinary_Certificate_${consignment.id}.pdf`,
      image:        { type: 'jpeg' as const, quality: 1 },
      html2canvas:  { scale: 3, useCORS: true, letterRendering: false, windowWidth: 1200 },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
      pagebreak:    { mode: 'avoid-all' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  const isReExport = consignment.declarationType === 'إعادة تصدير';
  const isAnimalProducts = consignment.vetCertificateType === 'منتجات حيوانية';
  
  const actionAr = isReExport ? 'لإعادة تصدير' : 'لتصدير';
  const actionEn = isReExport ? 'FOR RE-EXPORT' : 'FOR EXPORT';

  const titleAr = isAnimalProducts 
    ? `شهادة صحية بيطرية ${actionAr} المنتجات الحيوانية` 
    : `شهادة صحية بيطرية ${actionAr} أعلاف ومخلفات حيوانية`;
  
  const titleEn = isAnimalProducts 
    ? `VETERINARY HEALTH CERTIFICATE ${actionEn} ANIMALS PRODUCTS` 
    : `VETERINARY HEALTH CERTIFICATE ${actionEn} FODDER AND ANIMAL BY-PRODUCTS`;

  const originCountry = consignment.items && consignment.items.length > 0 
    ? Array.from(new Set(consignment.items.map((i: any) => i.origin))).filter(Boolean).join('، ') || 'سلطنة عمان'
    : 'سلطنة عمان';

  const destinationCountry = consignment.originPort || consignment.shippingCountry || '-';

  const containerNumbers = (consignment.containerNumber || '').split(/[,،\n]+/).map(s => s.trim()).filter(Boolean);
  const hasManyContainers = containerNumbers.length > 4;

  const MAX_ITEMS_ON_MAIN_PAGE = 5;
  const hasAttachment = (consignment.items?.length || 0) > MAX_ITEMS_ON_MAIN_PAGE || hasManyContainers;
  
  const displayItems = ((consignment.items?.length || 0) > MAX_ITEMS_ON_MAIN_PAGE)
    ? [{ description: 'انظر المرفق / See Attachment' }] 
    : (consignment.items || []);

  const displayContainers = hasManyContainers ? 'انظر المرفق / See Attachment' : (consignment.containerNumber || '-');

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-200 overflow-y-auto font-official print:p-0 p-4 flex flex-col items-center" dir="rtl">
      {/* Main Certificate Page */}
      <div ref={certificateRef} className="w-[210mm] bg-white relative shadow-2xl print:shadow-none print:m-0 text-black mx-auto font-official flex flex-col">
        <div className="h-[297mm] p-6 flex flex-col overflow-hidden">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-4 shrink-0">
            <div className="text-right w-1/3 flex flex-col items-start">
              <h1 className="text-lg font-bold leading-tight">سلطنة عمان</h1>
              <h2 className="text-base font-bold leading-tight">وزارة الثروة الزراعية والسمكية وموارد المياه</h2>
              <p className="text-[10px] mt-1">ص.ب: ٢٠٤ - الرمز البريدي: ٣١١ صحار</p>
            </div>
            <div className="w-1/3 flex justify-center">
              <img referrerPolicy="no-referrer" 
                src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                alt="Oman Logo" 
                className="h-20 object-contain" 
              />
            </div>
            <div className="text-left w-1/3 flex flex-col items-start" dir="ltr">
              <h1 className="text-base font-bold font-official leading-tight">Sultanate of Oman</h1>
              <h2 className="text-sm font-bold font-official leading-tight">Ministry of Agriculture, Fisheries and Water Resources</h2>
              <p className="text-[10px] font-official mt-1">P.O. Box : 204 - Postal Code: 311 Sohar</p>
            </div>
          </div>

          {/* Certificate Title */}
          <div className="flex justify-between items-center mb-4 shrink-0">
            {/* Right Side: Certificate Number */}
            <div className="w-1/4 flex flex-col items-end font-bold text-left" dir="ltr">
              <div className="flex items-center gap-2 justify-end w-full">
                <span className="text-red-600 font-mono text-sm">{consignment.id}</span>
                <span dir="rtl" className="text-base">رقم الشهادة</span>
              </div>
              <div className="text-[10px] font-mono w-full text-right">Certificate No.</div>
            </div>
            
            <div className="w-1/2 text-center flex flex-col items-center justify-center">
              <h2 className="text-xl font-bold mb-1">{titleAr}</h2>
              <h3 className="text-sm font-bold uppercase tracking-wider" dir="ltr">{titleEn}</h3>
            </div>

            <div className="w-1/4 flex justify-start">
              <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-sm">
                <QRCodeSVG value={consignment.id} size={120} level="M" includeMargin={true} marginSize={4} />
              </div>
            </div>
          </div>

          {/* Main Table */}
          <div className="border-2 border-black flex-1 flex flex-col text-xs">
            {/* Row 1: Importer / Exporter */}
            <div className="grid grid-cols-2 border-b-2 border-black">
              <div className="p-2 border-l-2 border-black">
                <div className="flex justify-between font-bold mb-2 text-[10px]">
                  <span>اسم المستورد وعنوانه</span>
                  <span dir="ltr">Name and address of importer</span>
                </div>
                <div className="text-center font-black text-base uppercase">{consignment.enExporter || consignment.exporter || '-'}</div>
              </div>
              <div className="p-2">
                <div className="flex justify-between font-bold mb-2 text-[10px]">
                  <span>اسم المصدر وعنوانه</span>
                  <span dir="ltr">Name and address of exporter</span>
                </div>
                <div className="text-center font-black text-base uppercase">{consignment.enImporter || consignment.importer || '-'}</div>
                <div className="text-center text-xs font-bold mt-1">{exporterAddress || ''}</div>
              </div>
            </div>

            {/* Row 2: Destination / Origin */}
            <div className="grid grid-cols-2 border-b-2 border-black">
              <div className="p-2 border-l-2 border-black flex justify-between items-center">
                <span className="font-bold text-[10px]">ميناء الوصول <span dir="ltr" className="ml-1">Destination</span></span>
                <span className="font-black text-base uppercase">{destinationCountry}</span>
              </div>
              <div className="p-2 flex justify-between items-center">
                <span className="font-bold text-[10px]">بلد المنشأ <span dir="ltr" className="ml-1">Country of origin</span></span>
                <span className="font-black text-base uppercase">{originCountry}</span>
              </div>
            </div>

            {/* Row 3: Transport / Loading */}
            <div className="grid grid-cols-2 border-b-2 border-black">
              <div className="p-2 border-l-2 border-black flex justify-between items-center">
                <span className="font-bold text-[10px]">وسيلة النقل <span dir="ltr" className="ml-1">Means of Transport</span></span>
                <span className="font-black text-base uppercase">{consignment.containerType || '-'}</span>
              </div>
              <div className="p-2 flex justify-between items-center">
                <span className="font-bold text-[10px]">منفذ التصدير <span dir="ltr" className="ml-1">Place of Loading</span></span>
                <span className="font-black text-base uppercase">{consignment.port || '-'}</span>
              </div>
            </div>

            {/* Row 4: Items Header */}
            <div className="grid grid-cols-6 border-b-2 border-black text-center font-bold bg-slate-50 text-[9px]">
              <div className="p-1 border-l-2 border-black">
                <div>معلومات أخرى</div>
                <div dir="ltr" className="text-[7px]">Additional info</div>
              </div>
              <div className="p-1 border-l-2 border-black">
                <div>نوع وعدد العبوات</div>
                <div dir="ltr" className="text-[7px]">Packages</div>
              </div>
              <div className="p-1 border-l-2 border-black">
                <div>طريقة الحفظ</div>
                <div dir="ltr" className="text-[7px]">Storage</div>
              </div>
              <div className="p-1 border-l-2 border-black">
                <div>الوزن الصافي</div>
                <div dir="ltr" className="text-[7px]">Net weight</div>
              </div>
              <div className="p-1 col-span-2">
                <div>وصف المنتج</div>
                <div dir="ltr" className="text-[7px]">Description of product</div>
              </div>
            </div>

            {/* Row 5: Items Data */}
            <div className="flex-1 min-h-[100px] border-b-2 border-black flex flex-col">
              {hasAttachment ? (
                <div className="grid grid-cols-6 flex-1">
                  <div className="p-1 border-l-2 border-black text-center font-bold flex items-center justify-center text-[10px]">
                    {consignment.remarks || '-'}
                  </div>
                  <div className="p-1 border-l-2 border-black text-center font-bold flex items-center justify-center text-[10px]">
                    {consignment.totalPackageCount} {consignment.items?.[0]?.packagingUnit || 'عبوة'}
                  </div>
                  <div className="p-1 border-l-2 border-black text-center font-bold flex items-center justify-center text-[10px]">
                    {consignment.containerTemp || '-'}
                  </div>
                  <div className="p-1 border-l-2 border-black text-center font-bold flex items-center justify-center text-[10px]">
                    {consignment.totalWeight} كجم
                  </div>
                  <div className="p-1 col-span-2 text-center font-bold flex items-center justify-center text-xs text-red-600">
                    انظر المرفق / See Attachment
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-6 flex-1 auto-rows-fr">
                  {/* Additional Info (Spans all rows) */}
                  <div className="border-l-2 border-black flex items-center justify-center p-1 text-center font-bold text-[10px]" 
                       style={{ gridRow: `1 / span ${consignment.items?.length || 1}`, gridColumn: 1 }}>
                    {consignment.inspectionNotes || consignment.remarks || '-'}
                  </div>

                  {/* Storage (Spans all rows) */}
                  <div className="border-l-2 border-black flex items-center justify-center p-1 text-center font-bold text-[10px]" 
                       style={{ gridRow: `1 / span ${consignment.items?.length || 1}`, gridColumn: 3 }}>
                    {consignment.containerTemp || '-'}
                  </div>

                  {/* Items */}
                  {consignment.items?.map((item, idx) => (
                    <React.Fragment key={idx}>
                      {/* Packages */}
                      <div className={`p-1 border-l-2 border-black text-center font-bold flex items-center justify-center text-[10px] ${idx < (consignment.items?.length || 0) - 1 ? 'border-b border-slate-100' : ''}`} 
                           style={{ gridRow: idx + 1, gridColumn: 2 }}>
                        {item.packageCount ? `${item.packageCount} ${item.packagingUnit || 'عبوة'}` : '-'}
                      </div>
                      
                      {/* Weight */}
                      <div className={`p-1 border-l-2 border-black text-center font-bold flex items-center justify-center text-[10px] ${idx < (consignment.items?.length || 0) - 1 ? 'border-b border-slate-100' : ''}`} 
                           style={{ gridRow: idx + 1, gridColumn: 4 }}>
                        {item.weight ? `${item.weight} كجم` : '-'}
                      </div>

                      {/* Description */}
                      <div className={`p-1 col-span-2 text-right font-bold flex items-center justify-start gap-2 text-[10px] ${idx < (consignment.items?.length || 0) - 1 ? 'border-b border-slate-100' : ''}`} 
                           style={{ gridRow: idx + 1, gridColumn: '5 / span 2' }}>
                        <span className="text-[9px] text-slate-400 min-w-[12px]">{idx + 1}-</span>
                        <span className="leading-tight">{item.enDescription || item.description}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            {/* Row 6: Dates and Container */}
            <div className="grid grid-cols-4 border-b-2 border-black">
              <div className="p-1.5 border-l-2 border-black flex flex-col justify-between items-center">
                <div className="w-full flex justify-between font-bold">
                  <span className="text-[10px]">رقم الحاوية</span>
                  <span dir="ltr" className="text-[10px]">Container No.</span>
                </div>
                <div className="font-bold mt-1 text-center text-[10px]">{displayContainers}</div>
              </div>
              <div className="p-1.5 border-l-2 border-black flex flex-col justify-between items-center">
                <div className="w-full flex justify-between font-bold">
                  <span className="text-[10px]">رقم القفل</span>
                  <span dir="ltr" className="text-[10px]">Seal No.</span>
                </div>
                <div className="font-bold mt-1 text-center text-[10px]">{consignment.sealNumber || '-'}</div>
              </div>
              <div className="p-1.5 border-l-2 border-black flex flex-col justify-between items-center">
                <div className="w-full flex justify-between font-bold">
                  <span className="text-[10px]">تاريخ الانتهاء</span>
                  <span dir="ltr" className="text-[10px]">Expiry Date</span>
                </div>
                <div className="font-bold mt-1">-</div>
              </div>
              <div className="p-1.5 flex flex-col justify-between items-center">
                <div className="w-full flex justify-between font-bold">
                  <span className="text-[10px]">تاريخ الإنتاج</span>
                  <span dir="ltr" className="text-[10px]">Production Date</span>
                </div>
                <div className="font-bold mt-1">-</div>
              </div>
            </div>

            {/* Declaration */}
            <div className="p-3 border-b-2 border-black flex gap-6">
              <div className="w-1/2 text-right text-xs space-y-2 font-black leading-snug">
                <p>أشهد أنا الطبيب البيطري الموقع أدناه والمخول من حكومة سلطنة عمان بالآتي :</p>
                <p>هذه المنتجات تم إنتاجها في مؤسسات مرخصة من قبل الحكومة العمانية ومخولة بالإنتاج للاستهلاك الآدمي تحت الإشراف الحكومي.</p>
                <p>هذه المنتجات تم إنتاجها وتجهيزها وفحصها ونقلها طبقاً للقوانين والمقاييس المعمول بها في السلطنة.</p>
                <p>هذه الشحنة وجدت عند فحصها بحالة جيدة وأنها خالية من الأمراض وصالحة للاستهلاك الآدمي.</p>
              </div>
              <div className="w-1/2 text-left text-xs space-y-2 leading-snug font-bold" dir="ltr">
                <p>I the undersigned Veterinary officer employed by the Government of Oman herby certify that ;</p>
                <p>This products originated from government licensed Establishments that are authorized to process products for human consumption under government supervision.</p>
                <p>The products have been produced, prepared, inspected and transported in accordance with laws & standards of the Sultanate of Oman</p>
                <p>This consignment was found on inspection to in be good sound condition, and suitable for human consumption.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex">
              <div className="w-1/4 p-2 border-l-2 border-black flex flex-col items-center justify-start relative">
                <div className="font-bold mb-2 text-[10px]">الختم الرسمي Official Stamp</div>
                <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-slate-300 text-[10px]">
                  ختم
                </div>

                {/* Virtual Ministry Seal */}
                <div 
                  data-html2canvas-ignore="true"
                  className="absolute bottom-2 flex items-center justify-center opacity-70 print:hidden pointer-events-none select-none"
                >
                  <div className="w-16 h-16 border-4 border-double border-red-500 rounded-full flex flex-col items-center justify-center text-red-500 rotate-[-15deg] transform scale-125">
                    <span className="text-[6px] font-black leading-tight text-center">وزارة الثروة الزراعية والسمكية</span>
                    <span className="text-[5px] font-black border-y border-red-400 my-0.5 px-0.5 whitespace-nowrap">ختم افتراضي - Virtual</span>
                    <span className="text-[6px] font-black leading-tight text-center">سلطنة عُمان</span>
                  </div>
                </div>
              </div>
              <div className="w-3/4 p-3 space-y-4">
                <div className="flex justify-between items-end">
                  <span className="w-1/3 text-right font-bold text-[10px]">اسم الطبيب البيطري الحكومي</span>
                  <span className="w-1/3 border-b border-dotted border-black text-center font-bold text-sm">{consignment.inspectorName || '-'}</span>
                  <span dir="ltr" className="w-1/3 text-left text-[10px]">Name of Government Veterinary Officer</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="w-1/3 text-right font-bold text-[10px]">التوقيع</span>
                  <span className="w-1/3 border-b border-dotted border-black"></span>
                  <span dir="ltr" className="w-1/3 text-left text-[10px]">Signature</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="w-1/3 text-right font-bold text-[10px]">التاريخ</span>
                  <span className="w-1/3 border-b border-dotted border-black text-center font-bold text-sm">{new Date().toLocaleDateString('en-GB')}</span>
                  <span dir="ltr" className="w-1/3 text-left text-[10px]">Date</span>
                </div>
              </div>
            </div>

            {/* Receipt */}
            <div className="grid grid-cols-2 border-t-2 border-black">
              <div className="p-1.5 border-l-2 border-black flex justify-between items-center">
                <span className="font-bold text-[10px]">قيمة الرسوم</span>
                <span className="font-bold text-sm">{consignment.fees} ر.ع</span>
                <span dir="ltr" className="text-[10px]">Fees Value</span>
              </div>
              <div className="p-1.5 flex justify-between items-center">
                <span className="font-bold text-[10px]">ايصال رقم</span>
                <span className="font-bold text-sm">-</span>
                <span dir="ltr" className="text-[10px]">Receipt No.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Attachment Page (if needed) */}
        {hasAttachment && (
          <div className="h-[297mm] p-6 flex flex-col overflow-hidden border-t-4 border-dashed border-slate-300 print:border-t-0 print:break-before-page">
            {/* Header Section */}
            <div className="flex justify-between items-center mb-4 shrink-0">
              <div className="text-right w-1/3 flex flex-col items-start">
                <h1 className="text-lg font-bold leading-tight">سلطنة عمان</h1>
                <h2 className="text-base font-bold leading-tight">وزارة الثروة الزراعية والسمكية وموارد المياه</h2>
                <p className="text-[10px] mt-1">ص.ب: ٢٠٤ - الرمز البريدي: ٣١١ صحار</p>
              </div>
              <div className="w-1/3 flex justify-center">
                <img referrerPolicy="no-referrer" 
                  src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                  alt="Oman Logo" 
                  className="h-20 object-contain" 
                />
              </div>
              <div className="text-left w-1/3 flex flex-col items-start" dir="ltr">
                <h1 className="text-base font-bold font-official leading-tight">Sultanate of Oman</h1>
                <h2 className="text-sm font-bold font-official leading-tight">Ministry of Agriculture, Fisheries and Water Resources</h2>
                <p className="text-[10px] font-official mt-1">P.O. Box : 204 - Postal Code: 311 Sohar</p>
              </div>
            </div>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold">مرفق الشهادة البيطرية رقم: {consignment.id}</h2>
              <h3 className="text-sm font-bold uppercase tracking-wider" dir="ltr">Attachment for Veterinary Certificate No: {consignment.id}</h3>
            </div>
            
            <div className="border-2 border-black flex-1 flex flex-col text-sm">
              <div className="grid grid-cols-6 border-b-2 border-black text-center font-bold bg-slate-50 text-[11px]">
                <div className="p-2 border-l-2 border-black">معلومات أخرى<br/><span dir="ltr" className="text-[9px]">Additional info</span></div>
                <div className="p-2 border-l-2 border-black">نوع وعدد العبوات<br/><span dir="ltr" className="text-[9px]">Packages</span></div>
                <div className="p-2 border-l-2 border-black">طريقة الحفظ<br/><span dir="ltr" className="text-[9px]">Storage</span></div>
                <div className="p-2 border-l-2 border-black">الوزن الصافي<br/><span dir="ltr" className="text-[9px]">Net weight</span></div>
                <div className="p-2 col-span-2">وصف المنتج<br/><span dir="ltr" className="text-[9px]">Description</span></div>
              </div>
              
              <div className="flex-1">
                <div className="grid grid-cols-6 auto-rows-fr">
                  {/* Additional Info (Spans all rows) */}
                  <div className="border-l-2 border-black flex items-center justify-center p-2 text-center font-bold text-[11px] h-full" 
                       style={{ gridRow: `1 / span ${consignment.items?.length || 1}`, gridColumn: 1 }}>
                    {consignment.inspectionNotes || consignment.remarks || '-'}
                  </div>

                  {/* Storage (Spans all rows) */}
                  <div className="border-l-2 border-black flex items-center justify-center p-2 text-center font-bold text-[11px] h-full" 
                       style={{ gridRow: `1 / span ${consignment.items?.length || 1}`, gridColumn: 3 }}>
                    {consignment.containerTemp || '-'}
                  </div>

                  {/* Items */}
                  {consignment.items?.map((item, idx) => (
                    <React.Fragment key={idx}>
                      {/* Packages */}
                      <div className={`p-2 border-l-2 border-black text-center font-bold flex items-center justify-center text-[11px] ${idx < (consignment.items?.length || 0) - 1 ? 'border-b border-slate-100' : ''}`} 
                           style={{ gridRow: idx + 1, gridColumn: 2 }}>
                        {item.packageCount ? `${item.packageCount} ${item.packagingUnit || 'عبوة'}` : '-'}
                      </div>
                      
                      {/* Weight */}
                      <div className={`p-2 border-l-2 border-black text-center font-bold flex items-center justify-center text-[11px] ${idx < (consignment.items?.length || 0) - 1 ? 'border-b border-slate-100' : ''}`} 
                           style={{ gridRow: idx + 1, gridColumn: 4 }}>
                        {item.weight ? `${item.weight} كجم` : '-'}
                      </div>

                      {/* Description */}
                      <div className={`p-2 col-span-2 text-right font-bold flex items-center justify-start gap-2 text-[11px] ${idx < (consignment.items?.length || 0) - 1 ? 'border-b border-slate-100' : ''}`} 
                           style={{ gridRow: idx + 1, gridColumn: '5 / span 2' }}>
                        <span className="text-[10px] text-slate-400 min-w-[15px]">{idx + 1}-</span>
                        <span className="leading-tight">{item.enDescription || item.description}</span>
                      </div>
                    </React.Fragment>
                  ))}
                </div>

                {hasManyContainers && (
                  <div className="mt-4 border-t-2 border-black">
                    <div className="bg-slate-50 p-2 font-bold text-center border-b-2 border-black">
                      أرقام الحاويات / Container Numbers
                    </div>
                    <div className="p-4 grid grid-cols-4 gap-4 text-left" dir="ltr">
                      {containerNumbers.map((c, idx) => (
                        <div key={idx} className="font-mono text-sm border-b border-slate-200 pb-1">{idx + 1}. {c}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-4 print:hidden bg-white/90 backdrop-blur-sm p-4 rounded-2xl shadow-2xl border border-slate-200 z-[1001]">
        <button 
          onClick={handlePrint}
          className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <i className="fas fa-print"></i> طباعة
        </button>
        <button 
          onClick={handleExportPDF}
          className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-700 transition-all flex items-center gap-2"
        >
          <i className="fas fa-file-pdf"></i> تصدير PDF
        </button>
        <button 
          onClick={onClose}
          className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
        >
          <i className="fas fa-times"></i> إغلاق
        </button>
      </div>
    </div>
  );
};

export default VeterinaryCertificate;
