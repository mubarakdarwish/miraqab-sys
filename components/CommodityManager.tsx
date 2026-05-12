
import React, { useState, useEffect } from 'react';
import { CommodityGroup, ConsignmentType, User } from '../types';
import { CONSIGNMENT_LABELS } from '../constants';
import { exportCommodityGroupsToExcel } from '../excelService';

interface CommodityManagerProps {
  groups: CommodityGroup[];
  onAdd: (group: CommodityGroup) => void;
  onUpdate: (group: CommodityGroup) => void;
  onDelete: (id: string) => void;
  activeSector: ConsignmentType; // To default the selection
  currentUser: User;
}

const CommodityManager: React.FC<CommodityManagerProps> = ({ groups, onAdd, onUpdate, onDelete, activeSector, currentUser }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [hsCode, setHsCode] = useState('');
  const [sector, setSector] = useState<ConsignmentType>(activeSector);
  const [productsInput, setProductsInput] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid'); // View Mode State
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter state for the list view
  const [filterSector, setFilterSector] = useState<ConsignmentType>(activeSector);

  // Determine allowed sectors for the current user
  const visibleSectors = currentUser.role === 'ADMIN' 
    ? Object.values(ConsignmentType) 
    : currentUser.allowedSectors;

  // Check read-only status
  const isReadOnly = currentUser.role === 'VIEWER';

  useEffect(() => {
    // Update defaults if activeSector prop changes from parent or isn't in allowed list
    if (visibleSectors.includes(activeSector)) {
        setSector(activeSector);
        setFilterSector(activeSector);
    } else if (visibleSectors.length > 0) {
        setSector(visibleSectors[0]);
        setFilterSector(visibleSectors[0]);
    }
  }, [activeSector, visibleSectors.join(',')]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!name) return alert('اسم المجموعة مطلوب');

    // Convert comma-separated string to array, trimming whitespace and removing empty entries
    const products = productsInput.split(/[\n,]/).map(p => p.trim()).filter(p => p !== '');

    if (editingId) {
      onUpdate({ id: editingId, name, sector, products, hsCode });
      setEditingId(null);
    } else {
      onAdd({
        id: Math.random().toString(36).substr(2, 9),
        name,
        sector,
        products,
        hsCode
      });
    }
    setName('');
    setHsCode('');
    setProductsInput('');
    // Keep the sector as is for faster entry
  };

  const handleEdit = (group: CommodityGroup) => {
    setEditingId(group.id);
    setName(group.name);
    setHsCode(group.hsCode || '');
    setSector(group.sector);
    setProductsInput(group.products.join('\n'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredGroups = groups.filter(g => 
    g.sector === filterSector && 
    (g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     (g.hsCode || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
     g.products.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
      {/* Form Section */}
      {!isReadOnly && (
      <div className="xl:col-span-1">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden sticky top-8">
          <div className="bg-[#c8102e] p-8 text-white relative">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
             <h3 className="text-xl font-black relative z-10 flex items-center gap-3">
               <i className={`fas ${editingId ? 'fa-edit' : 'fa-layer-group'} text-white`}></i>
               {editingId ? 'تعديل مجموعة سلعية' : 'إضافة مجموعة جديدة'}
             </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">القطاع التابع له</label>
              <div className="grid grid-cols-2 gap-2">
                {visibleSectors.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSector(type)}
                    className={`px-2 py-3 rounded-xl text-[10px] font-black border transition-all ${
                      sector === type 
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md' 
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {CONSIGNMENT_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">اسم المجموعة</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: الفواكه الطازجة"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] outline-none transition-all text-slate-800 font-bold placeholder:text-slate-300"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">الرمز المنسق (HS Code)</label>
                  <input
                    type="text"
                    value={hsCode}
                    onChange={(e) => setHsCode(e.target.value)}
                    placeholder="مثال: 0201"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] outline-none transition-all text-slate-800 font-bold placeholder:text-slate-300 font-mono"
                  />
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">المنتجات (كل منتج في سطر)</label>
              <textarea
                value={productsInput}
                onChange={(e) => setProductsInput(e.target.value)}
                placeholder={"تفاح\nبرتقال\nموز"}
                rows={6}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] outline-none transition-all text-slate-800 font-bold placeholder:text-slate-300 resize-none"
              />
              <p className="text-[10px] text-slate-400 font-bold">يمكنك إضافة أسماء المنتجات مفصولة بأسطر جديدة أو فواصل.</p>
            </div>
            
            <div className="pt-4">
              <button type="submit" className="w-full bg-[#c8102e] text-white font-black py-4 rounded-2xl shadow-lg hover:bg-[#c8102e] transition-all active:scale-95 flex items-center justify-center gap-2">
                <i className={`fas ${editingId ? 'fa-save' : 'fa-plus-circle'}`}></i>
                <span>{editingId ? 'حفظ التغييرات' : 'إضافة المجموعة'}</span>
              </button>
              {editingId && (
                <button type="button" onClick={() => { setEditingId(null); setName(''); setHsCode(''); setProductsInput(''); setSector(activeSector); }} className="w-full mt-3 text-slate-400 font-bold text-sm hover:text-red-500 transition-colors">
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      )}

      {/* List Section */}
      <div className={`${isReadOnly ? 'xl:col-span-3' : 'xl:col-span-2'} space-y-6`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between px-2 gap-4">
           <div>
             <h3 className="text-2xl font-black text-slate-800">دليل المنتجات والمجموعات</h3>
             <p className="text-xs text-slate-400 font-bold mt-1">تصفح المجموعات حسب القطاع</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-2">
               {/* Search Bar */}
               <div className="relative w-full md:w-64">
                   <input 
                       type="text" 
                       placeholder="بحث في المجموعات أو المنتجات..." 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold focus:outline-none focus:border-[#c8102e] shadow-sm"
                   />
                   <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
               </div>

               {/* Sector Filter Tabs */}
               <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto custom-scrollbar">
                 {visibleSectors.map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterSector(type)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${
                        filterSector === type 
                        ? 'bg-[#007a3d] text-white shadow-md' 
                        : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {CONSIGNMENT_LABELS[type]}
                    </button>
                 ))}
               </div>

               {/* View Mode Toggle */}
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

               <button 
                 onClick={() => exportCommodityGroupsToExcel(groups, 'دليل_المجموعات_السلعية')} 
                 className="bg-white border border-slate-200 text-slate-600 w-11 h-11 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all shrink-0"
                 title="تصدير إلى إكسل"
               >
                 <i className="fas fa-file-export"></i>
               </button>
           </div>
        </div>

        {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 gap-6">
            {filteredGroups.map(group => (
                <div key={group.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#c8102e] to-[#c8102e]"></div>
                
                <div className="flex justify-between items-start mb-4 pl-4">
                    <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-[#c8102e]">
                        <i className="fas fa-boxes text-xl"></i>
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-lg text-slate-800">{group.name}</h4>
                            {group.hsCode && (
                                <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                                    HS: {group.hsCode}
                                </span>
                            )}
                        </div>
                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold">{CONSIGNMENT_LABELS[group.sector]}</span>
                    </div>
                    </div>

                    {!isReadOnly && (
                    <div className="flex gap-2">
                    <button onClick={() => handleEdit(group)} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-[#c8102e] hover:text-white transition-all flex items-center justify-center">
                        <i className="fas fa-pen text-xs"></i>
                    </button>
                    <button onClick={() => { if(window.confirm('حذف المجموعة؟')) onDelete(group.id); }} className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                        <i className="fas fa-trash text-xs"></i>
                    </button>
                    </div>
                    )}
                </div>

                <div className="flex flex-wrap gap-2 pr-16">
                    {group.products.map((prod, idx) => (
                    <span key={idx} className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-100">
                        {prod}
                    </span>
                    ))}
                    {group.products.length === 0 && <span className="text-xs text-slate-300 italic">لا توجد منتجات مسجلة</span>}
                </div>
                </div>
            ))}
            </div>
        ) : (
            /* Table View */
            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-500">
                            <tr>
                                <th className="p-4">اسم المجموعة</th>
                                <th className="p-4">HS Code</th>
                                <th className="p-4">القطاع</th>
                                <th className="p-4">عدد المنتجات</th>
                                {!isReadOnly && <th className="p-4 text-center">إجراءات</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredGroups.map(group => (
                                <tr key={group.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 font-bold text-slate-800 text-sm">{group.name}</td>
                                    <td className="p-4 font-mono text-slate-600 text-xs">{group.hsCode || '-'}</td>
                                    <td className="p-4">
                                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold">{CONSIGNMENT_LABELS[group.sector]}</span>
                                    </td>
                                    <td className="p-4 text-xs font-bold text-slate-600">{group.products.length} منتج</td>
                                    {!isReadOnly && (
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(group)} className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-[#c8102e] hover:text-white transition-all flex items-center justify-center">
                                                    <i className="fas fa-pen text-xs"></i>
                                                </button>
                                                <button onClick={() => { if(window.confirm('حذف المجموعة؟')) onDelete(group.id); }} className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center">
                                                    <i className="fas fa-trash text-xs"></i>
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
          
        {filteredGroups.length === 0 && (
             <div className="col-span-full py-20 text-center text-slate-300">
                <i className="fas fa-cubes text-5xl mb-4 opacity-50"></i>
                <p>لا توجد مجموعات سلعية مسجلة في قطاع {CONSIGNMENT_LABELS[filterSector]}</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default CommodityManager;
