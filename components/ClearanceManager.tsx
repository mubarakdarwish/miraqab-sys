import React, { useState } from 'react';
import { ClearanceOffice, CustomsBroker, User } from '../types';
import * as FB from '../firebaseService';
import { exportClearanceOfficesToExcel } from '../excelService';

interface ClearanceManagerProps {
  offices: ClearanceOffice[];
  currentUser: User;
}

const ClearanceManager: React.FC<ClearanceManagerProps> = ({ offices, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid'); // New View Mode State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Partial<ClearanceOffice> | null>(null);
  
  // Local state for adding a broker inside the modal
  const [newBrokerName, setNewBrokerName] = useState('');
  const [newBrokerPhone, setNewBrokerPhone] = useState('');

  // Permission Check: Only ADMIN and MANAGER can add/edit/delete
  const isReadOnly = currentUser.role !== 'ADMIN' && currentUser.role !== 'MANAGER';

  const handleOpenModal = (office?: ClearanceOffice) => {
    if (office) {
      setEditingOffice({ ...office });
    } else {
      setEditingOffice({
        name: '',
        phone: '',
        licenseNumber: '',
        brokers: []
      });
    }
    setIsModalOpen(true);
    setNewBrokerName('');
    setNewBrokerPhone('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOffice(null);
  };

  const handleAddBroker = () => {
    if (!newBrokerName || !newBrokerPhone || !editingOffice) return;
    
    const newBroker: CustomsBroker = {
      id: Math.random().toString(36).substr(2, 9),
      name: newBrokerName,
      phone: newBrokerPhone
    };

    setEditingOffice(prev => ({
      ...prev,
      brokers: [...(prev?.brokers || []), newBroker]
    }));

    setNewBrokerName('');
    setNewBrokerPhone('');
  };

  const handleRemoveBroker = (brokerId: string) => {
    if (!editingOffice) return;
    setEditingOffice(prev => ({
      ...prev,
      brokers: prev?.brokers?.filter(b => b.id !== brokerId)
    }));
  };

  const handleSaveOffice = async () => {
    if (!editingOffice?.name) return alert('اسم المكتب مطلوب');
    
    const officeData = {
      ...editingOffice,
      id: editingOffice.id || Math.random().toString(36).substr(2, 9),
      brokers: editingOffice.brokers || []
    } as ClearanceOffice;

    try {
      if (editingOffice.id) {
        await FB.updateClearanceOfficeInDB(officeData);
      } else {
        await FB.addClearanceOfficeToDB(officeData);
      }
      handleCloseModal();
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء حفظ المكتب');
    }
  };

  const handleDeleteOffice = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المكتب وجميع المخلصين المسجلين به؟')) {
      try {
        await FB.deleteClearanceOfficeFromDB(id);
      } catch (e) {
        console.error(e);
        alert('حدث خطأ أثناء حذف المكتب');
      }
    }
  };

  const filteredOffices = offices.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    o.brokers.some(b => b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.phone.includes(searchTerm))
  );

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-[2rem] flex items-center justify-center text-2xl shadow-sm">
            <i className="fas fa-address-book"></i>
          </div>
          <div>
            <h3 className="font-black text-xl text-slate-800">دليل مكاتب التخليص</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">إدارة بيانات المكاتب وأرقام المخلصين الجمركيين</p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto items-center">
          <div className="relative flex-1 md:w-64">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="بحث باسم المكتب أو المخلص..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pr-10 pl-4 text-xs font-bold outline-none focus:border-purple-500 transition-all"
            />
            <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm shrink-0">
                <button 
                    onClick={() => setViewMode('grid')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-white'}`}
                    title="عرض بطاقات"
                >
                    <i className="fas fa-th-large"></i>
                </button>
                <button 
                    onClick={() => setViewMode('table')}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-white'}`}
                    title="عرض جدول"
                >
                    <i className="fas fa-table"></i>
                </button>
          </div>
          
          <button 
            onClick={() => exportClearanceOfficesToExcel(offices, 'دليل_مكاتب_التخليص')} 
            className="bg-white border border-slate-200 text-slate-600 w-12 h-12 rounded-xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all shrink-0"
            title="تصدير إلى إكسل"
          >
            <i className="fas fa-file-export"></i>
          </button>

          {!isReadOnly && (
            <button 
              onClick={() => handleOpenModal()} 
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-xs shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2 whitespace-nowrap h-12"
            >
              <i className="fas fa-plus"></i> إضافة مكتب
            </button>
          )}
        </div>
      </div>

      {/* Main Content View Switcher */}
      {viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffices.map(office => (
            <div key={office.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden flex flex-col relative">
                
                {/* Office Header */}
                <div className="p-6 pb-4 border-b border-slate-50">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-500 text-xl border border-purple-100">
                        <i className="fas fa-building"></i>
                    </div>
                    <div>
                        <h4 className="font-black text-lg text-slate-800 line-clamp-1">{office.name}</h4>
                        {office.licenseNumber && (
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-bold">{office.licenseNumber}</span>
                        )}
                    </div>
                    </div>
                    {!isReadOnly && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(office)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all"><i className="fas fa-pen text-xs"></i></button>
                        <button onClick={() => handleDeleteOffice(office.id)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all"><i className="fas fa-trash-alt text-xs"></i></button>
                    </div>
                    )}
                </div>
                {office.phone && (
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-2 bg-slate-50 p-2 rounded-lg w-fit">
                        <i className="fas fa-phone-alt opacity-50"></i> {office.phone}
                    </div>
                )}
                </div>

                {/* Brokers List */}
                <div className="flex-1 p-4 bg-slate-50/50">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-3 px-2">المخلصين الجمركيين ({office.brokers.length})</p>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {office.brokers.length > 0 ? office.brokers.map(broker => (
                    <div key={broker.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">
                                {(broker.name || 'B').charAt(0)}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-700">{broker.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <a href={`tel:${broker.phone}`} className="text-sm font-mono font-black text-blue-600 hover:underline flex items-center gap-1 select-all" dir="ltr">
                                        <i className="fas fa-phone text-xs"></i> {broker.phone}
                                    </a>
                                    <button onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(broker.phone); alert('تم نسخ الرقم'); }} className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="نسخ الرقم">
                                        <i className="far fa-copy text-sm"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    )) : (
                        <p className="text-center text-xs text-slate-300 py-4 font-bold italic">لا يوجد مخلصين مسجلين</p>
                    )}
                </div>
                </div>
            </div>
            ))}
        </div>
      ) : (
        /* Tabular View */
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-5 text-[10px] font-black text-slate-500 uppercase">اسم المكتب</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 uppercase">رقم الرخصة</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 uppercase">الهاتف</th>
                            <th className="p-5 text-[10px] font-black text-slate-500 uppercase">المخلصين</th>
                            {!isReadOnly && <th className="p-5 text-[10px] font-black text-slate-500 uppercase text-center">إجراءات</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredOffices.map(office => (
                            <tr key={office.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
                                            <i className="fas fa-building"></i>
                                        </div>
                                        <span className="font-black text-slate-800 text-sm">{office.name}</span>
                                    </div>
                                </td>
                                <td className="p-5">
                                    <span className="font-mono text-xs font-bold text-slate-500">{office.licenseNumber || '---'}</span>
                                </td>
                                <td className="p-5">
                                    <span className="font-mono text-xs font-bold text-slate-600">{office.phone || '---'}</span>
                                </td>
                                <td className="p-5">
                                    <div className="flex flex-col gap-2 max-w-[300px]">
                                        {office.brokers.length > 0 ? (
                                            office.brokers.map(b => (
                                                <div key={b.id} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                    <span className="text-xs font-bold text-slate-700">{b.name}</span>
                                                    <div className="flex items-center gap-2">
                                                        <a href={`tel:${b.phone}`} className="text-sm font-mono font-black text-blue-600 hover:underline flex items-center gap-1 select-all" dir="ltr">
                                                            <i className="fas fa-phone text-xs"></i> {b.phone}
                                                        </a>
                                                        <button onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(b.phone); alert('تم نسخ الرقم'); }} className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="نسخ الرقم">
                                                            <i className="far fa-copy text-sm"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <span className="text-xs font-bold text-slate-300 italic">لا يوجد مخلصين</span>
                                        )}
                                    </div>
                                </td>
                                {!isReadOnly && (
                                    <td className="p-5">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => handleOpenModal(office)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all">
                                                <i className="fas fa-pen text-xs"></i>
                                            </button>
                                            <button onClick={() => handleDeleteOffice(office.id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all">
                                                <i className="fas fa-trash-alt text-xs"></i>
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

      {/* Empty State */}
      {filteredOffices.length === 0 && (
          <div className="py-20 text-center text-slate-400 bg-white rounded-[2rem] border border-dashed border-slate-200">
              <i className="fas fa-search-minus text-5xl mb-4 opacity-20"></i>
              <p className="font-black text-slate-500">لا توجد مكاتب تخليص مطابقة لمعايير البحث</p>
          </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && editingOffice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-in">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-black text-xl text-slate-800">{editingOffice.id ? 'تعديل بيانات المكتب' : 'إضافة مكتب جديد'}</h3>
              <button onClick={handleCloseModal} className="w-10 h-10 bg-white rounded-full text-slate-400 hover:text-red-500 flex items-center justify-center transition-all shadow-sm"><i className="fas fa-times"></i></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
              {/* Office Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-purple-600 uppercase border-b border-slate-100 pb-2">بيانات المكتب</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500">اسم المكتب</label>
                        <input type="text" value={editingOffice.name ?? ''} onChange={e => setEditingOffice({...editingOffice, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-500" placeholder="اسم المكتب..." />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500">رقم الرخصة (اختياري)</label>
                        <input type="text" value={editingOffice.licenseNumber ?? ''} onChange={e => setEditingOffice({...editingOffice, licenseNumber: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-500" placeholder="12345..." />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-500">هاتف المكتب العام (اختياري)</label>
                        <input type="text" value={editingOffice.phone ?? ''} onChange={e => setEditingOffice({...editingOffice, phone: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-purple-500" placeholder="968..." />
                    </div>
                </div>
              </div>

              {/* Brokers Manager */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-purple-600 uppercase border-b border-slate-100 pb-2">إدارة المخلصين</h4>
                
                {/* Add Broker Input */}
                <div className="flex gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 items-end">
                    <div className="flex-1 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400">اسم المخلص</label>
                        <input type="text" value={newBrokerName} onChange={e => setNewBrokerName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-purple-500" placeholder="الاسم..." />
                    </div>
                    <div className="w-32 space-y-1">
                        <label className="text-[9px] font-bold text-slate-400">رقم الهاتف</label>
                        <input type="text" value={newBrokerPhone} onChange={e => setNewBrokerPhone(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-purple-500" placeholder="9xxxxxxx" />
                    </div>
                    <button onClick={handleAddBroker} className="bg-purple-600 text-white w-10 h-9 rounded-xl flex items-center justify-center hover:bg-purple-700 transition-all shadow-md"><i className="fas fa-plus"></i></button>
                </div>

                {/* Brokers List */}
                <div className="space-y-2">
                    {editingOffice.brokers?.map((broker, idx) => (
                        <div key={broker.id || idx} className="flex justify-between items-center bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3">
                                <span className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">{idx + 1}</span>
                                <div>
                                    <p className="text-xs font-bold text-slate-800">{broker.name}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">{broker.phone}</p>
                                </div>
                            </div>
                            <button onClick={() => handleRemoveBroker(broker.id)} className="text-red-400 hover:text-red-600 p-2"><i className="fas fa-trash-alt"></i></button>
                        </div>
                    ))}
                    {(!editingOffice.brokers || editingOffice.brokers.length === 0) && (
                        <p className="text-center text-xs text-slate-400 py-4 italic">لم يتم إضافة مخلصين بعد</p>
                    )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button onClick={handleCloseModal} className="px-6 py-3 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-200 transition-all">إلغاء</button>
                <button onClick={handleSaveOffice} className="bg-purple-600 text-white px-8 py-3 rounded-xl font-black text-xs shadow-lg hover:bg-purple-700 transition-all flex items-center gap-2">
                    <i className="fas fa-save"></i> حفظ البيانات
                </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClearanceManager;