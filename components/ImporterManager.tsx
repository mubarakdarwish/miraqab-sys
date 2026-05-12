import React, { useState, useRef, useMemo } from 'react';
import { Importer, Consignment } from '../types';
import { parseImportersFromExcel, downloadImporterTemplate, exportImportersToExcel } from '../excelService';
import { motion } from 'framer-motion';

interface ImporterManagerProps {
  importers: Importer[];
  consignments: Consignment[]; 
  onAdd: (importer: Importer) => void;
  onUpdate: (importer: Importer) => void;
  onDelete: (id: string) => void;
  currentUser?: { role: string };
}

const ImporterManager: React.FC<ImporterManagerProps> = ({ importers = [], consignments = [], onAdd, onUpdate, onDelete, currentUser }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImporter, setSelectedImporter] = useState<Importer | null>(null); 
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid'); 
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialFormState: Partial<Importer> = {
    name: '',
    crNumber: '',
    phone: '',
    email: '',
    address: '',
    defaultClearanceOffice: '',
    defaultBroker: '',
    isActive: true,
    rating: 100
  };

  const [formData, setFormData] = useState<Partial<Importer>>(initialFormState);
  
  const isReadOnly = currentUser?.role === 'VIEWER';

  const getImporterStats = (importerName: string) => {
      const history = (consignments || []).filter(c => c.importer === importerName);
      const total = history.length;
      const rejected = history.filter(c => c.status === 'Rejected').length;
      const approved = history.filter(c => c.status === 'Approved').length;
      
      let calculatedRating = 100;
      if (total > 0) {
          calculatedRating = Math.max(0, 100 - (rejected * 20)); 
      }

      return { total, rejected, approved, history, calculatedRating };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isReadOnly) return;
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'rating') {
        setFormData(prev => ({ ...prev, [name]: parseInt(value) }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!formData.name || !formData.crNumber) return alert('الاسم ورقم السجل التجاري مطلوبان');

    const isDuplicate = importers.some(imp => 
        String(imp.crNumber || '').trim() === String(formData.crNumber || '').trim() && imp.id !== editingId
    );

    if (isDuplicate) {
        alert('رقم السجل التجاري هذا مسجل بالفعل لشركة أخرى!');
        return;
    }

    if (editingId) {
      onUpdate({ ...formData as Importer, id: editingId });
      setEditingId(null);
    } else {
      onAdd({
        ...formData as Importer,
        id: Math.random().toString(36).substr(2, 9),
      });
    }
    setFormData(initialFormState);
  };

  const handleEdit = (importer: Importer) => {
    setEditingId(importer.id);
    setFormData(importer);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImporting(true);
      try {
        const file = e.target.files[0];
        const importedData = await parseImportersFromExcel(file);
        
        let count = 0;
        for (const item of importedData) {
            const exists = importers.some(imp => String(imp.crNumber || '').trim() === String(item.crNumber || '').trim());
            if (!exists) {
                onAdd(item);
                count++;
            }
        }
        alert(`تم معالجة الملف. تم إضافة ${count} شركة جديدة.`);
      } catch (error) {
        console.error("Import Error", error);
        alert("حدث خطأ أثناء قراءة الملف.");
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const filteredImporters = (importers || []).filter(imp => 
    imp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(imp.crNumber || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in relative">
      
      {!isReadOnly && (
      <div className="xl:col-span-1">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden sticky top-8">
          <div className="bg-[#c8102e] p-8 text-white relative">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
             <h3 className="text-xl font-black relative z-10 flex items-center gap-3">
               <i className={`fas ${editingId ? 'fa-edit' : 'fa-building'} text-white`}></i>
               {editingId ? 'تعديل بيانات شركة' : 'تسجيل شركة جديدة'}
             </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <Input label="اسم الشركة" name="name" value={formData.name} onChange={handleInputChange} placeholder="مثال: شركة اللحوم العمانية" />
            <Input label="رقم السجل التجاري (CR)" name="crNumber" value={formData.crNumber} onChange={handleInputChange} placeholder="1234567" />
            
            <div className="grid grid-cols-2 gap-4">
                <Input label="رقم الهاتف" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="968..." />
                <Input label="البريد الإلكتروني" name="email" value={formData.email} onChange={handleInputChange} type="email" />
            </div>

            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-address-book"></i> التخليص الجمركي الافتراضي
                </p>
                <Input label="اسم شركة التخليص" name="defaultClearanceOffice" value={formData.defaultClearanceOffice} onChange={handleInputChange} placeholder="المكتب المعتمد..." />
                <Input label="اسم المندوب" name="defaultBroker" value={formData.defaultBroker} onChange={handleInputChange} placeholder="مندوب التخليص..." />
            </div>

            <Input label="العنوان" name="address" value={formData.address} onChange={handleInputChange} />
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-600">حالة الشركة</label>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        <span className="mr-2 text-[10px] font-bold text-slate-500">{formData.isActive ? 'نشط' : 'محظور/غير نشط'}</span>
                    </label>
                </div>
                <div>
                    <div className="flex justify-between mb-1">
                        <label className="text-xs font-black text-slate-600">تقييم الموثوقية المبدئي</label>
                        <span className={`text-xs font-black ${Number(formData.rating) > 70 ? 'text-green-600' : 'text-red-500'}`}>{formData.rating}%</span>
                    </div>
                    <input 
                        type="range" 
                        name="rating" 
                        min="0" 
                        max="100" 
                        value={formData.rating} 
                        onChange={handleInputChange}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#c8102e]" 
                    />
                </div>
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full bg-[#c8102e] text-white font-black py-4 rounded-2xl shadow-lg hover:bg-[#c8102e] transition-all active:scale-95 flex items-center justify-center gap-2">
                <i className={`fas ${editingId ? 'fa-save' : 'fa-plus-circle'}`}></i>
                <span>{editingId ? 'حفظ التغييرات' : 'إضافة الشركة'}</span>
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setFormData(initialFormState); }} className="w-full mt-3 text-slate-400 font-bold text-sm hover:text-red-500 transition-colors">
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      )}

      <div className={`${isReadOnly ? 'xl:col-span-3' : 'xl:col-span-2'} space-y-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
           <div className="flex items-center gap-4">
               <h3 className="text-2xl font-black text-slate-800">دليل الشركات المسجلة</h3>
               <span className="bg-[#007a3d] text-white px-4 py-1.5 rounded-full text-xs font-black shadow-sm">
                 {importers.length} شركات
               </span>
           </div>

           <div className="flex flex-1 md:max-w-md gap-2 items-center">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        placeholder="بحث باسم الشركة أو السجل..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-xs font-bold focus:outline-none focus:border-[#c8102e] shadow-sm"
                    />
                    <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
                
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="عرض بطاقات"
                    >
                        <i className="fas fa-th-large"></i>
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
                        title="عرض جدول"
                    >
                        <i className="fas fa-list"></i>
                    </button>
                </div>

                {!isReadOnly && (
                <div className="flex gap-2">
                    <button onClick={() => exportImportersToExcel(importers, 'دليل_الشركات_المستوردة')} className="bg-white border border-slate-200 text-slate-600 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all" title="تصدير إلى إكسل">
                        <i className="fas fa-file-export"></i>
                    </button>
                    <button onClick={downloadImporterTemplate} className="bg-white border border-slate-200 text-slate-600 w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-50 transition-all" title="تحميل نموذج">
                        <i className="fas fa-file-download"></i>
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="bg-[#007a3d] text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:bg-green-700 transition-all active:scale-95 disabled:opacity-50" title="استيراد اكسل">
                        {importing ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-file-excel"></i>}
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                </div>
                )}
           </div>
        </div>

        {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredImporters.map(imp => {
                const stats = getImporterStats(imp.name);
                const isRisky = (imp.rating || 100) < 50;
                const isInactive = !imp.isActive;

                return (
                    <div key={imp.id} className={`bg-white p-6 rounded-[2.5rem] border shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between ${isInactive ? 'border-slate-200 opacity-75 grayscale-[0.8]' : isRisky ? 'border-red-200' : 'border-slate-100'}`}>
                        <div className={`absolute top-0 left-0 w-full h-1.5 ${isInactive ? 'bg-slate-300' : isRisky ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        
                        <div>
                            <div className="flex justify-between items-start mb-4 pl-2">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm border ${isInactive ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 text-[#c8102e] border-red-50'}`}>
                                        <i className="fas fa-building"></i>
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg text-slate-800 line-clamp-1" title={imp.name}>{imp.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{imp.crNumber}</span>
                                            {!imp.isActive && <span className="text-[9px] font-black bg-red-100 text-red-600 px-2 py-0.5 rounded">محظور</span>}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-6 left-6 md:relative md:top-auto md:left-auto md:opacity-100">
                                    <button onClick={() => setSelectedImporter(imp)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center" title="سجل المعاملات">
                                        <i className="fas fa-history text-xs"></i>
                                    </button>
                                    {!isReadOnly && (
                                    <>
                                        <button onClick={() => handleEdit(imp)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-[#c8102e] hover:text-white transition-all flex items-center justify-center">
                                            <i className="fas fa-pen text-xs"></i>
                                        </button>
                                        <button onClick={() => { if(window.confirm('حذف الشركة؟')) onDelete(imp.id); }} className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                            <i className="fas fa-trash text-xs"></i>
                                        </button>
                                    </>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <div className="text-center border-l border-slate-200">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">المعاملات</p>
                                    <p className="text-sm font-black text-slate-800">{stats.total}</p>
                                </div>
                                <div className="text-center border-l border-slate-200">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">الرفض</p>
                                    <p className={`text-sm font-black ${stats.rejected > 0 ? 'text-red-500' : 'text-slate-800'}`}>{stats.rejected}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-[9px] text-slate-400 font-bold uppercase">التقييم</p>
                                    <p className={`text-sm font-black ${imp.rating && imp.rating < 60 ? 'text-red-500' : 'text-green-600'}`}>{imp.rating || 100}%</p>
                                </div>
                            </div>

                            <div className="space-y-2 px-1 mb-4">
                                {imp.defaultClearanceOffice && (
                                    <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100">
                                        <i className="fas fa-address-book text-[8px]"></i>
                                        <span>تخليص: {imp.defaultClearanceOffice}</span>
                                    </div>
                                )}
                                {imp.defaultBroker && (
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 px-2 py-1 rounded-lg bg-slate-50 border border-slate-100">
                                        <i className="fas fa-user-tie text-[8px]"></i>
                                        <span>المندوب: {imp.defaultBroker}</span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1.5 px-1">
                                {imp.phone && <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><i className="fas fa-phone w-4 text-center text-slate-300"></i> {imp.phone}</div>}
                                {imp.email && <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500"><i className="fas fa-envelope w-4 text-center text-slate-300"></i> {imp.email}</div>}
                            </div>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-slate-50">
                            <div className="flex justify-between text-[9px] font-black text-slate-400 mb-1">
                                <span>مؤشر الموثوقية</span>
                                <span className={isRisky ? 'text-red-500' : 'text-green-500'}>{isRisky ? 'مخاطر مرتفعة' : 'ممتثل'}</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-1000 ${isRisky ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${imp.rating || 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                );
            })}
            </div>
        ) : (
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-500">
                            <tr>
                                <th className="p-4">الشركة</th>
                                <th className="p-4">السجل التجاري</th>
                                <th className="p-4">شركة التخليص</th>
                                <th className="p-4">المندوب</th>
                                <th className="p-4 text-center">المعاملات</th>
                                <th className="p-4 text-center">التقييم</th>
                                <th className="p-4 text-center">الحالة</th>
                                <th className="p-4 text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredImporters.map((imp, index) => {
                                const stats = getImporterStats(imp.name);
                                const isRisky = (imp.rating || 100) < 50;
                                return (
                                    <motion.tr 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, delay: index * 0.05 }}
                                        key={imp.id} 
                                        className="hover:bg-slate-50/80 transition-colors"
                                    >
                                        <td className="p-4 font-bold text-slate-800 text-sm">{imp.name}</td>
                                        <td className="p-4 font-mono text-slate-600 text-xs">{imp.crNumber}</td>
                                        <td className="p-4 text-xs font-bold text-indigo-600">{imp.defaultClearanceOffice || '-'}</td>
                                        <td className="p-4 text-xs font-medium text-slate-500">{imp.defaultBroker || '-'}</td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2 text-[10px] font-black">
                                                <span className="text-slate-700 bg-slate-100 px-1.5 rounded">{stats.total}</span>
                                                <span className="text-red-600 bg-red-50 px-1.5 rounded" title="مرفوض">{stats.rejected}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`text-xs font-black ${isRisky ? 'text-red-500' : 'text-green-600'}`}>{imp.rating || 100}%</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${imp.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                {imp.isActive ? 'نشط' : 'محظور'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => setSelectedImporter(imp)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center" title="سجل المعاملات">
                                                    <i className="fas fa-history text-xs"></i>
                                                </button>
                                                {!isReadOnly && (
                                                <>
                                                    <button onClick={() => handleEdit(imp)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-[#c8102e] hover:text-white transition-all flex items-center justify-center">
                                                        <i className="fas fa-pen text-xs"></i>
                                                    </button>
                                                    <button onClick={() => { if(window.confirm('حذف الشركة؟')) onDelete(imp.id); }} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                                        <i className="fas fa-trash text-xs"></i>
                                                    </button>
                                                </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
          
        {filteredImporters.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-300">
            <i className="fas fa-search text-5xl mb-4 opacity-50"></i>
            <p>لا توجد شركات مطابقة للبحث</p>
            </div>
        )}
      </div>

      {selectedImporter && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-[2.5rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
                  <div className="bg-slate-800 p-6 flex justify-between items-center text-white shrink-0">
                      <div>
                          <h3 className="font-black text-lg">{selectedImporter.name}</h3>
                          <p className="text-xs text-slate-400 mt-1 font-mono">CR: {selectedImporter.crNumber}</p>
                      </div>
                      <button onClick={() => setSelectedImporter(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                          <i className="fas fa-times"></i>
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50">
                      <div className="mb-6 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-3 gap-4 text-center">
                          <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase">إجمالي الشحنات</p>
                              <p className="text-xl font-black text-slate-800">{getImporterStats(selectedImporter.name).total}</p>
                          </div>
                          <div className="border-r border-slate-100">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">حالات الرفض</p>
                              <p className="text-xl font-black text-red-600">{getImporterStats(selectedImporter.name).rejected}</p>
                          </div>
                          <div className="border-r border-slate-100">
                              <p className="text-[10px] text-slate-400 font-bold uppercase">نسبة الامتثال</p>
                              <p className="text-xl font-black text-green-600">
                                  {getImporterStats(selectedImporter.name).total > 0 
                                    ? Math.round((getImporterStats(selectedImporter.name).approved / getImporterStats(selectedImporter.name).total) * 100) 
                                    : 100}%
                              </p>
                          </div>
                      </div>

                      <h4 className="font-black text-sm text-slate-800 mb-4 border-b border-slate-200 pb-2">آخر 10 معاملات</h4>
                      <div className="space-y-3">
                          {getImporterStats(selectedImporter.name).history.slice(0, 10).map(c => (
                              <div key={c.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                                  <div>
                                      <p className="text-xs font-bold text-slate-800">{c.bayanNumber}</p>
                                      <p className="text-[10px] text-slate-400">{new Date(c.createdAt).toLocaleDateString('ar-OM')}</p>
                                  </div>
                                  <span className={`px-2 py-1 rounded text-[9px] font-black ${
                                      c.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                      c.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                  }`}>
                                      {c.status === 'Approved' ? 'مقبول' : c.status === 'Rejected' ? 'مرفوض' : 'قيد الإجراء'}
                                  </span>
                              </div>
                          ))}
                          {getImporterStats(selectedImporter.name).history.length === 0 && (
                              <p className="text-center text-xs text-slate-400 py-4">لا توجد معاملات سابقة</p>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const Input = ({ label, name, type = 'text', value, onChange, placeholder }: any) => (
  <div className="space-y-2">
    <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">{label}</label>
    <input
      type={type}
      name={name}
      value={value ?? ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] outline-none transition-all text-slate-800 font-bold placeholder:text-slate-300"
    />
  </div>
);

export default ImporterManager;