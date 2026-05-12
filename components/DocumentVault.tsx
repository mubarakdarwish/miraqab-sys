import React, { useState, useEffect } from 'react';
import { Consignment, AppDocument } from '../types';
import * as FB from '../firebaseService';

interface DocumentVaultProps {
  consignments: Consignment[];
}

const DocumentVault: React.FC<DocumentVaultProps> = ({ consignments }) => {
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<AppDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Fetch Documents Realtime
  useEffect(() => {
      setLoadingDocs(true);
      const unsubscribe = FB.subscribeToCollection('documents', (data) => {
          setDocuments(data as AppDocument[]);
          setLoadingDocs(false);
      });
      return () => unsubscribe();
  }, []);

  // Helper: Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  // Helper: Compress Image
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const maxWidth = 1024; // Resize large images
        const maxHeight = 1024;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth || height > maxHeight) {
                    if (width > height) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    } else {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.7 quality to reduce size
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, consignmentId: string) => {
    if (!e.target.files?.length) return;
    
    setActiveUploadId(consignmentId);
    const file = e.target.files[0];
    const isImage = file.type.startsWith('image/');

    // Initial Size Check
    // For PDFs (no compression), limit is strict 700KB.
    // For Images (we compress), we allow up to 5MB input, assuming compression brings it down.
    if (!isImage && file.size > 700 * 1024) {
        alert("حجم ملف PDF كبير جداً للتخزين المباشر. الحد الأقصى 700 كيلوبايت.");
        setActiveUploadId(null);
        e.target.value = '';
        return;
    }

    if (isImage && file.size > 5 * 1024 * 1024) {
        alert("حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.");
        setActiveUploadId(null);
        e.target.value = '';
        return;
    }

    try {
        let base64Data = "";
        
        if (isImage) {
            base64Data = await compressImage(file);
        } else {
            base64Data = await fileToBase64(file);
        }

        // Final safety check for Firestore 1MB limit
        // 1MB = 1048576 bytes. We leave some buffer (checking against 1,000,000 bytes).
        if (base64Data.length > 1000000) {
             throw new Error("FILE_TOO_LARGE");
        }
        
        const newDoc: AppDocument = {
            id: Math.random().toString(36).substr(2, 9),
            consignmentId: consignmentId,
            type: file.type.includes('pdf') ? 'DOC' : 'IMG',
            url: base64Data, // Store Base64 directly in DB for this prototype
            title: file.name,
            date: new Date().toISOString().split('T')[0],
            fileType: file.type,
            uploadedBy: 'Inspector' // In a real app, use currentUser.name
        };

        await FB.addDocumentToDB(newDoc);
        
    } catch (error: any) {
        console.error("Upload Error:", error);
        if (error.message === "FILE_TOO_LARGE") {
            alert("تعذر رفع الملف: الحجم بعد المعالجة لا يزال كبيراً جداً لقاعدة البيانات.");
        } else {
            alert("فشل رفع الملف. يرجى المحاولة مرة أخرى.");
        }
    } finally {
        setActiveUploadId(null);
        // Reset input value to allow re-uploading same file if failed
        e.target.value = '';
    }
  };

  const handleDeleteDocument = async (id: string) => {
      if(window.confirm("هل أنت متأكد من حذف هذا المستند نهائياً؟")) {
          await FB.deleteDocumentFromDB(id);
      }
  };

  // Helper to get documents for a specific consignment
  const getConsignmentDocs = (cId: string) => documents.filter(doc => doc.consignmentId === cId);

  // Filter Logic: Only REJECTED Consignments
  const rejectedConsignments = consignments.filter(c => {
    const isRejected = c.status === 'Rejected' || c.inspectionResult === 'غير مطابق';
    if (!isRejected) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    
    // Safely convert properties to string before checking includes
    return (
      String(c.bayanNumber || '').toLowerCase().includes(term) ||
      String(c.importer || '').toLowerCase().includes(term) ||
      String(c.id || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-6 w-full lg:w-auto">
           <div className="w-16 h-16 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-600 shadow-xl shadow-red-100 shrink-0">
             <i className="fas fa-file-contract text-2xl"></i>
           </div>
           <div className="flex-1">
             <h3 className="font-black text-2xl text-slate-800 tracking-tight">أرشيف الإرساليات المرفوضة</h3>
             <p className="text-sm text-slate-400 font-bold mt-1">
                 توثيق المخالفات وأسباب الرفض والمستندات القانونية
             </p>
           </div>
        </div>

        {/* Search Bar */}
        <div className="w-full lg:w-96 relative">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث في المرفوضات..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pr-12 pl-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all placeholder:text-slate-400"
            />
            <i className="fas fa-search absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
        </div>

        <div className="flex gap-4 w-full lg:w-auto justify-center lg:justify-end">
           <div className="bg-red-50 px-6 py-3 rounded-2xl border border-red-100 flex flex-col items-center min-w-[100px]">
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">إجمالي المرفوض</span>
              <span className="text-xl font-black text-red-600">{rejectedConsignments.length}</span>
           </div>
        </div>
      </div>

      {loadingDocs && (
          <div className="text-center py-12">
              <i className="fas fa-circle-notch fa-spin text-3xl text-slate-300"></i>
              <p className="text-slate-400 font-bold mt-4">جاري تحميل الأرشيف...</p>
          </div>
      )}

      {/* Consignments Groups List */}
      <div className="space-y-8">
        {!loadingDocs && rejectedConsignments.map((consignment) => {
          const docs = getConsignmentDocs(consignment.id);
          const isUploading = activeUploadId === consignment.id;

          return (
            <div key={consignment.id} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-lg transition-all duration-300 relative">
              {/* Red Strip for Rejection */}
              <div className="absolute top-0 left-0 bottom-0 w-2 bg-red-500"></div>

              {/* Group Header */}
              <div className="bg-slate-50/50 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pl-8">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 flex items-center justify-center shadow-sm shrink-0 text-red-500">
                    <i className="fas fa-ban text-lg"></i>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider">مرفوضة</span>
                      <h4 className="text-lg font-black text-slate-800 tracking-tight">{consignment.bayanNumber || 'بدون رقم بيان'}</h4>
                    </div>
                    <p className="text-xs font-bold text-slate-500">{consignment.importer} • {consignment.id}</p>
                  </div>
                </div>

                {/* Rejection Details Badge */}
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex-1 max-w-lg w-full">
                    <div className="flex items-start gap-3">
                        <i className="fas fa-exclamation-circle text-red-500 mt-1"></i>
                        <div>
                            <p className="text-xs font-black text-red-800 mb-1">سبب الرفض: {consignment.rejectionReason || 'غير محدد'}</p>
                            <p className="text-[10px] text-red-600 leading-relaxed font-medium">
                                {consignment.rejectionDetails || 'لا توجد تفاصيل إضافية مسجلة.'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                   {/* Quick Upload Button */}
                   <label className={`cursor-pointer bg-slate-800 hover:bg-slate-900 text-white px-5 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap shadow-lg shadow-slate-200 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                      {isUploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-cloud-upload-alt"></i>}
                      <span>{isUploading ? 'جاري الرفع...' : 'إرفاق مستند'}</span>
                      <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, consignment.id)} accept="image/*,application/pdf" />
                   </label>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="p-8 pl-8">
                {docs.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {docs.map((doc, idx) => (
                      <div key={idx} className="group/item relative bg-slate-50 rounded-3xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1">
                        <div className="aspect-square bg-slate-200 relative overflow-hidden flex items-center justify-center">
                          {doc.fileType?.includes('pdf') ? (
                              <div className="text-red-500 flex flex-col items-center">
                                  <i className="fas fa-file-pdf text-4xl mb-2 drop-shadow-sm"></i>
                                  <span className="text-[10px] font-black bg-white/80 px-2 py-1 rounded">ملف PDF</span>
                              </div>
                          ) : (
                              <img referrerPolicy="no-referrer" src={doc.url} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" alt={doc.title} />
                          )}
                          
                          {/* Overlay Actions */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                            <a href={doc.url} download={doc.title} target="_blank" rel="noreferrer" className="w-8 h-8 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-full flex items-center justify-center backdrop-blur-md transition-all">
                              <i className="fas fa-download text-[10px]"></i>
                            </a>
                            <button onClick={() => handleDeleteDocument(doc.id)} className="w-8 h-8 bg-rose-500/80 hover:bg-rose-500 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all">
                              <i className="fas fa-trash text-[10px]"></i>
                            </button>
                          </div>
                        </div>
                        <div className="p-3 bg-white border-t border-slate-50">
                          <p className="text-[10px] font-black text-slate-700 truncate" title={doc.title}>{doc.title}</p>
                          <p className="text-[9px] text-slate-400 font-mono mt-0.5">{doc.date}</p>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add Placeholder Card */}
                    <label className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 cursor-pointer transition-all">
                        <i className="fas fa-plus text-xl mb-2"></i>
                        <span className="text-[10px] font-bold">إضافة المزيد</span>
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, consignment.id)} accept="image/*,application/pdf" />
                    </label>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-300 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                     <i className="fas fa-folder-open text-3xl mb-3 opacity-50"></i>
                     <p className="text-xs font-bold mb-1">لا توجد مستندات مرفقة</p>
                     <p className="text-[10px] opacity-70">يجب إرفاق صور المخالفة أو تقارير المختبر</p>
                     <label className="mt-4 text-red-600 text-xs font-black cursor-pointer hover:underline flex items-center gap-1">
                        <i className="fas fa-cloud-upload-alt"></i> اضغط للرفع (PDF/صور)
                        <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, consignment.id)} accept="image/*,application/pdf" />
                     </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!loadingDocs && rejectedConsignments.length === 0 && (
          <div className="text-center py-20">
             <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
                <i className="fas fa-check-circle text-4xl"></i>
             </div>
             <p className="text-slate-500 font-bold">سجل نظيف!</p>
             <p className="text-xs text-slate-400 mt-1">لا توجد إرساليات مرفوضة حالياً في النظام</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVault;