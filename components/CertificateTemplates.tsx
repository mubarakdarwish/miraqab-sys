
import React, { useState, useEffect } from 'react';
import { ConsignmentType, User, CertificateTemplate } from '../types';
import { CONSIGNMENT_LABELS, COUNTRIES } from '../constants';
import * as FB from '../firebaseService';

interface CertificateTemplatesProps {
  currentUser: User;
  activeSector: ConsignmentType;
}

const CertificateTemplates: React.FC<CertificateTemplatesProps> = ({ currentUser, activeSector }) => {
  const [currentSector, setCurrentSector] = useState<ConsignmentType>(activeSector);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<CertificateTemplate | null>(null);

  // Subscribe to templates for the current sector
  useEffect(() => {
    setLoading(true);
    const unsub = FB.subscribeToCertificateTemplates(currentSector, (data) => {
        setTemplates(data);
        setLoading(false);
    });
    return () => unsub();
  }, [currentSector]);

  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()));

  const filteredTemplates = templates.filter(t => t.country === selectedCountry);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length || !selectedCountry) return;
      
      const file = e.target.files[0];
      const isImage = file.type.startsWith('image/');
      
      if (!isImage && file.size > 700 * 1024) {
          alert("حجم ملف PDF كبير جداً للتخزين المباشر. الحد الأقصى 700 كيلوبايت.");
          e.target.value = '';
          return;
      }
      if (isImage && file.size > 5 * 1024 * 1024) {
          alert("حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت.");
          e.target.value = '';
          return;
      }

      setIsUploading(true);
      try {
          let base64Data = "";
          if (isImage) {
              base64Data = await compressImage(file);
          } else {
              base64Data = await fileToBase64(file);
          }

          if (base64Data.length > 1000000) throw new Error("FILE_TOO_LARGE");

          const newTemplate: CertificateTemplate = {
              id: Math.random().toString(36).substr(2, 9),
              sector: currentSector,
              country: selectedCountry,
              title: file.name,
              url: base64Data,
              type: file.type.includes('pdf') ? 'PDF' : 'IMG',
              uploadedBy: currentUser.name,
              createdAt: new Date().toISOString(),
              fileType: file.type
          };

          await FB.addCertificateTemplate(newTemplate);
      } catch (error: any) {
          console.error(error);
          alert("فشل رفع الملف: " + (error.message === "FILE_TOO_LARGE" ? "الملف كبير جداً" : "خطأ غير معروف"));
      } finally {
          setIsUploading(false);
          e.target.value = '';
      }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("هل أنت متأكد من حذف هذا النموذج نهائياً؟")) {
          setDeletingId(id);
          try {
              await FB.deleteCertificateTemplate(id);
          } catch (e) {
              console.error(e);
              alert("حدث خطأ أثناء الحذف");
          } finally {
              setDeletingId(null);
          }
      }
  };

  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const maxWidth = 1024; 
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
                    if (width > height) { height *= maxWidth / width; width = maxWidth; } 
                    else { width *= maxHeight / height; height = maxHeight; }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const sectorColors = {
      [ConsignmentType.VETERINARY]: 'amber',
      [ConsignmentType.AGRICULTURAL]: 'emerald',
      [ConsignmentType.FOOD_SAFETY]: 'blue'
  };

  const colorTheme = sectorColors[currentSector];

  return (
    <div className="space-y-8 animate-fade-in pb-20">
        {/* Header & Sector Tabs */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
                <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-[2rem] flex items-center justify-center text-2xl shadow-sm bg-${colorTheme}-50 text-${colorTheme}-600`}>
                        <i className="fas fa-certificate"></i>
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-slate-800">أرشيف نماذج الشهادات</h3>
                        <p className="text-xs text-slate-400 font-bold mt-1">المرجع الموحد للشهادات الصحية المعتمدة دولياً</p>
                    </div>
                </div>
                
                {/* Sector Tabs */}
                <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-x-auto">
                    {Object.values(ConsignmentType).map(type => (
                        <button
                            key={type}
                            onClick={() => { setCurrentSector(type); setSelectedCountry(null); setSearchTerm(''); }}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 ${
                                currentSector === type 
                                ? `bg-${sectorColors[type]}-600 text-white shadow-md` 
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <i className={`fas ${type === ConsignmentType.VETERINARY ? 'fa-paw' : type === ConsignmentType.AGRICULTURAL ? 'fa-seedling' : 'fa-utensils'}`}></i>
                            {CONSIGNMENT_LABELS[type]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Breadcrumbs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-50 pt-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
                    <span className={`text-${colorTheme}-600`}>{CONSIGNMENT_LABELS[currentSector]}</span>
                    <i className="fas fa-chevron-left text-xs text-slate-300"></i>
                    {selectedCountry ? (
                        <>
                            <button onClick={() => setSelectedCountry(null)} className="hover:text-slate-800 hover:underline">دول العالم</button>
                            <i className="fas fa-chevron-left text-xs text-slate-300"></i>
                            <span className="text-slate-800">{selectedCountry}</span>
                        </>
                    ) : (
                        <span className="text-slate-800">دول العالم</span>
                    )}
                </div>

                {!selectedCountry && (
                    <div className="relative w-full md:w-64">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="بحث عن دولة..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold outline-none focus:border-slate-400 transition-all"
                        />
                        <i className="fas fa-search absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    </div>
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                    <i className="fas fa-circle-notch fa-spin text-3xl mb-4"></i>
                    <p className="font-bold text-xs">جاري تحميل البيانات...</p>
                </div>
            ) : !selectedCountry ? (
                /* Countries Grid */
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in">
                    {filteredCountries.map(country => {
                        const count = templates.filter(t => t.country === country).length;
                        return (
                            <div 
                                key={country} 
                                onClick={() => setSelectedCountry(country)}
                                className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col items-center text-center gap-3 relative overflow-hidden"
                            >
                                <div className={`w-16 h-12 bg-${colorTheme}-50 rounded-2xl flex items-center justify-center text-${colorTheme}-500 text-2xl group-hover:scale-110 transition-transform`}>
                                    <i className="fas fa-folder"></i>
                                </div>
                                <span className="font-black text-xs text-slate-700">{country}</span>
                                {count > 0 && (
                                    <span className="absolute top-3 left-3 bg-slate-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">{count}</span>
                                )}
                            </div>
                        );
                    })}
                    {filteredCountries.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400">
                            <p className="font-bold text-sm">لا توجد دولة بهذا الاسم</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Files View */
                <div className="animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                        {/* Upload Card */}
                        {currentUser.role !== 'VIEWER' && (
                            <label className={`bg-slate-50 border-2 border-dashed border-slate-300 rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-${colorTheme}-50 hover:border-${colorTheme}-300 hover:text-${colorTheme}-600 transition-all text-slate-400 min-h-[180px] group`}>
                                {isUploading ? (
                                    <i className="fas fa-circle-notch fa-spin text-3xl"></i>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <i className="fas fa-cloud-upload-alt text-xl"></i>
                                        </div>
                                        <span className="font-black text-xs">رفع نموذج جديد</span>
                                        <span className="text-[9px] font-mono">(PDF / IMG)</span>
                                    </>
                                )}
                                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,application/pdf" disabled={isUploading} />
                            </label>
                        )}

                        {/* File Cards */}
                        {filteredTemplates.map(file => (
                            <div key={file.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col min-h-[180px]">
                                {deletingId === file.id && (
                                    <div className="absolute inset-0 bg-white/80 z-20 flex items-center justify-center">
                                        <i className="fas fa-circle-notch fa-spin text-red-500"></i>
                                    </div>
                                )}
                                {/* Preview Area */}
                                <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                                    {file.type === 'PDF' ? (
                                        <div className="text-red-500 flex flex-col items-center">
                                            <i className="fas fa-file-pdf text-4xl mb-2 drop-shadow-sm"></i>
                                            <span className="text-[9px] font-black bg-white/80 px-2 py-1 rounded">PDF Document</span>
                                        </div>
                                    ) : (
                                        <img referrerPolicy="no-referrer" src={file.url} alt={file.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                    )}
                                    
                                    {/* Overlay Actions */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                                        <button 
                                            onClick={() => setViewingTemplate(file)} 
                                            className="w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg" 
                                            title="عرض"
                                        >
                                            <i className="fas fa-eye text-xs"></i>
                                        </button>
                                        
                                        <a href={file.url} download={file.title} target="_blank" rel="noreferrer" className="w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-slate-900 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg" title="تحميل">
                                            <i className="fas fa-download text-xs"></i>
                                        </a>
                                        {currentUser.role !== 'VIEWER' && (
                                            <button onClick={() => handleDelete(file.id)} className="w-10 h-10 bg-rose-500/80 hover:bg-rose-500 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-lg" title="حذف">
                                                <i className="fas fa-trash text-xs"></i>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Info Footer */}
                                <div className="p-4 bg-white z-10 relative">
                                    <h4 className="text-xs font-black text-slate-700 truncate mb-1" title={file.title}>{file.title}</h4>
                                    <div className="flex justify-between items-center text-[9px] text-slate-400">
                                        <span className="font-mono">{new Date(file.createdAt).toLocaleDateString()}</span>
                                        <span className="font-bold flex items-center gap-1"><i className="fas fa-user-circle"></i> {file.uploadedBy.split(' ')[0]}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {filteredTemplates.length === 0 && !isUploading && (
                        <div className="py-12 text-center text-slate-300">
                            <i className="far fa-folder-open text-4xl mb-3"></i>
                            <p className="text-xs font-bold">المجلد فارغ</p>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* View Modal */}
        {viewingTemplate && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in" onClick={() => setViewingTemplate(null)}>
                <div className="bg-white rounded-[2rem] w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl relative overflow-hidden animate-scale-in" onClick={e => e.stopPropagation()}>
                    {/* Modal Header */}
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <div>
                            <h3 className="font-black text-slate-800 text-lg">{viewingTemplate.title}</h3>
                            <p className="text-xs text-slate-500 font-bold">{viewingTemplate.country} - {CONSIGNMENT_LABELS[viewingTemplate.sector]}</p>
                        </div>
                        <div className="flex gap-2">
                            <a href={viewingTemplate.url} download={viewingTemplate.title} className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-all" title="تحميل">
                                <i className="fas fa-download"></i>
                            </a>
                            <button onClick={() => setViewingTemplate(null)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-all">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    {/* Modal Content */}
                    <div className="flex-1 bg-slate-200 flex items-center justify-center overflow-auto p-4 relative">
                        {viewingTemplate.type === 'PDF' ? (
                            <iframe 
                                src={viewingTemplate.url} 
                                className="w-full h-full rounded-xl shadow-lg bg-white" 
                                title="PDF Viewer"
                            ></iframe>
                        ) : (
                            <img referrerPolicy="no-referrer" 
                                src={viewingTemplate.url} 
                                alt={viewingTemplate.title} 
                                className="max-w-full max-h-full object-contain rounded-xl shadow-lg" 
                            />
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CertificateTemplates;
