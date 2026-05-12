
import React, { useState } from 'react';
import { Port, User, ConsignmentType } from '../types';
import { APP_PAGES, CONSIGNMENT_LABELS } from '../constants';
import * as FB from '../firebaseService';

interface PortManagerProps {
  ports: Port[];
  currentUser: User;
  users: User[];
}

const PortManager: React.FC<PortManagerProps> = ({ ports, currentUser, users }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'SEA' | 'AIR' | 'LAND' | 'LOGISTICS'>('SEA');
  const [location, setLocation] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  // New Config State
  const [allowedSectors, setAllowedSectors] = useState<ConsignmentType[]>([]);
  const [allowedPages, setAllowedPages] = useState<string[]>([]);
  const [managingStaffPort, setManagingStaffPort] = useState<Port | null>(null);

  // Permission Check
  if (currentUser.role !== 'ADMIN') {
      return (
          <div className="flex items-center justify-center h-64 text-slate-400">
              <p>عذراً، هذا القسم مخصص لمديري النظام فقط.</p>
          </div>
      );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert('اسم المنفذ مطلوب');

    const portData: Port = {
        id: editingId || Math.random().toString(36).substr(2, 9),
        name,
        type,
        location,
        code,
        isActive,
        allowedSectors,
        allowedPages
    };

    try {
        if (editingId) {
            await FB.updatePortInDB(portData);
            setEditingId(null);
        } else {
            await FB.addPortToDB(portData);
        }
        resetForm();
    } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء حفظ المنفذ');
    }
  };

  const handleEdit = (port: Port) => {
    setEditingId(port.id);
    setName(port.name);
    setType(port.type);
    setLocation(port.location);
    setCode(port.code || '');
    setIsActive(port.isActive);
    setAllowedSectors(port.allowedSectors || []);
    setAllowedPages(port.allowedPages || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('هل أنت متأكد من حذف هذا المنفذ؟')) {
      try {
        await FB.deletePortFromDB(id);
      } catch (err) {
        console.error(err);
        alert('حدث خطأ أثناء حذف المنفذ');
      }
    }
  };

  const resetForm = () => {
    setName('');
    setType('SEA');
    setLocation('');
    setCode('');
    setIsActive(true);
    setAllowedSectors([]);
    setAllowedPages([]);
    setEditingId(null);
  };

  const handleSectorToggle = (s: ConsignmentType) => {
      setAllowedSectors(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
  };

  const handlePageToggle = (p: string) => {
      setAllowedPages(prev => prev.includes(p) ? prev.filter(i => i !== p) : [...prev, p]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in pb-20">
      
      {/* Form Section */}
      <div className="xl:col-span-1">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden sticky top-8">
          <div className="bg-[#c8102e] p-8 text-white relative">
             <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
             <h3 className="text-xl font-black relative z-10 flex items-center gap-3">
               <i className={`fas ${editingId ? 'fa-edit' : 'fa-anchor'} text-white`}></i>
               {editingId ? 'تعديل بيانات منفذ' : 'إضافة منفذ جديد'}
             </h3>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">اسم المنفذ</label>
                <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="مثال: ميناء صحار" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-[#c8102e]"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">نوع المنفذ</label>
                    <select 
                        value={type} 
                        onChange={(e) => setType(e.target.value as any)} 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-[#c8102e]"
                    >
                        <option value="SEA">بحري</option>
                        <option value="AIR">جوي</option>
                        <option value="LAND">بري</option>
                        <option value="LOGISTICS">لوجستي</option>
                    </select>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">رمز المنفذ</label>
                    <input 
                        type="text" 
                        value={code} 
                        onChange={(e) => setCode(e.target.value)} 
                        placeholder="SOH" 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-[#c8102e]"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">الموقع / الولاية</label>
                <input 
                    type="text" 
                    value={location} 
                    onChange={(e) => setLocation(e.target.value)} 
                    placeholder="صحار" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-[#c8102e]"
                />
            </div>

            {/* Config: Sectors */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">القطاعات المتاحة</label>
                <div className="flex flex-wrap gap-2">
                    {Object.values(ConsignmentType).map(s => (
                        <button 
                            key={s} 
                            type="button" 
                            onClick={() => handleSectorToggle(s)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                allowedSectors.includes(s) 
                                ? 'bg-slate-800 text-white border-slate-800' 
                                : 'bg-white text-slate-500 border-slate-200'
                            }`}
                        >
                            {CONSIGNMENT_LABELS[s]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Config: Pages */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="text-xs font-black text-slate-600 uppercase tracking-widest">الخدمات المتاحة</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1">
                    {APP_PAGES.filter(p => p.category !== 'ADMIN').map(page => (
                        <button 
                            key={page.path} 
                            type="button" 
                            onClick={() => handlePageToggle(page.path)}
                            className={`px-2 py-1.5 rounded-lg text-[9px] font-bold border text-right transition-all truncate ${
                                allowedPages.includes(page.path) 
                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                : 'bg-white text-slate-500 border-slate-200'
                            }`}
                        >
                            {page.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                <span className="text-xs font-bold text-slate-600">الحالة التشغيلية</span>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    <span className="mr-2 text-[10px] font-bold text-slate-500">{isActive ? 'نشط' : 'مغلق'}</span>
                </label>
            </div>

            <div className="pt-2">
              <button type="submit" className="w-full bg-[#c8102e] text-white font-black py-4 rounded-2xl shadow-lg hover:bg-[#c8102e] transition-all active:scale-95 flex items-center justify-center gap-2">
                <i className={`fas ${editingId ? 'fa-save' : 'fa-plus-circle'}`}></i>
                <span>{editingId ? 'حفظ التغييرات' : 'إضافة المنفذ'}</span>
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="w-full mt-3 text-slate-400 font-bold text-sm hover:text-red-500 transition-colors">
                  إلغاء التعديل
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* List Section */}
      <div className="xl:col-span-2 space-y-6">
        <div className="flex items-center gap-4 px-2">
            <h3 className="text-2xl font-black text-slate-800">إدارة المنافذ الحدودية</h3>
            <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-black">{ports.length}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ports.map(port => {
                // Find users assigned to this port
                const portUsers = users.filter(u => u.assignedPorts?.includes(port.id));
                
                return (
                <div key={port.id} className={`bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-lg transition-all relative overflow-hidden group flex flex-col justify-between ${port.isActive ? 'border-slate-100' : 'border-slate-200 opacity-75'}`}>
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${
                                    port.type === 'SEA' ? 'bg-blue-50 text-blue-600' : 
                                    port.type === 'AIR' ? 'bg-sky-50 text-sky-600' : 
                                    port.type === 'LAND' ? 'bg-amber-50 text-amber-600' :
                                    'bg-purple-50 text-purple-600'
                                }`}>
                                    <i className={`fas ${
                                        port.type === 'SEA' ? 'fa-ship' : 
                                        port.type === 'AIR' ? 'fa-plane' : 
                                        port.type === 'LAND' ? 'fa-truck' :
                                        'fa-warehouse'
                                    }`}></i>
                                </div>
                                <div>
                                    <h4 className="font-black text-lg text-slate-800">{port.name}</h4>
                                    <div className="flex gap-2 text-[10px] font-bold text-slate-400 mt-1">
                                        <span className="uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{port.code || 'N/A'}</span>
                                        <span><i className="fas fa-map-marker-alt"></i> {port.location}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(port)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-[#c8102e] hover:text-white transition-all flex items-center justify-center"><i className="fas fa-pen text-xs"></i></button>
                                <button onClick={() => handleDelete(port.id)} className="w-8 h-8 rounded-full bg-slate-50 text-slate-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><i className="fas fa-trash-alt text-xs"></i></button>
                            </div>
                        </div>
                        
                        {/* Capabilities Chips */}
                        <div className="flex flex-wrap gap-1 mb-4">
                            {port.allowedSectors?.map(s => (
                                <span key={s} className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">{CONSIGNMENT_LABELS[s]}</span>
                            ))}
                            {!port.allowedSectors?.length && <span className="text-[9px] text-slate-300 italic">لم يتم تحديد قطاعات</span>}
                        </div>

                        {/* Staff Section */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex-1 flex flex-col min-h-0">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase">الطاقم المعين ({portUsers.length})</p>
                                <button onClick={() => setManagingStaffPort(port)} className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors">
                                    إدارة الطاقم
                                </button>
                            </div>
                            <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1 max-h-32 pr-1">
                                {portUsers.map(u => {
                                    const roleLabels: Record<string, string> = {
                                        ADMIN: 'مدير نظام',
                                        MANAGER: 'مسؤول / مدير',
                                        INSPECTOR: 'مفتش ميداني',
                                        LAB_TECH: 'فني مختبر',
                                        LAB_DELEGATE: 'مندوب مختبر',
                                        LOGISTICS: 'موظف لوجستي',
                                        VIEWER: 'مطلع فقط'
                                    };
                                    return (
                                    <div key={u.id} className="flex flex-col bg-white border border-slate-100 rounded-lg p-2 shadow-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[8px] font-black shrink-0">
                                                {(u.name || 'U').charAt(0)}
                                            </div>
                                            <p className="text-xs font-black text-slate-700 truncate">{u.name}</p>
                                        </div>
                                        <p className="text-[9px] font-bold text-slate-400 mt-1 mr-7">{u.jobTitle || roleLabels[u.role] || u.role}</p>
                                    </div>
                                )})}
                                {portUsers.length === 0 && <span className="text-[10px] text-slate-300 italic px-2 py-3 text-center bg-white rounded-lg border border-slate-100">لا يوجد موظفين معينين</span>}
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t border-slate-50 pt-3 mt-3 flex justify-between items-center">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-lg ${port.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {port.isActive ? 'مفتوح / نشط' : 'مغلق مؤقتاً'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">{port.allowedPages?.length || 0} خدمات مفعلة</span>
                    </div>
                </div>
            )})}
            
            {ports.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-300">
                    <i className="fas fa-map-marked-alt text-5xl mb-4 opacity-30"></i>
                    <p className="font-bold text-sm">لم يتم تعريف أي منافذ بعد</p>
                </div>
            )}
        </div>
      </div>

      {managingStaffPort && (
        <PortStaffModal 
            port={managingStaffPort} 
            users={users} 
            onClose={() => setManagingStaffPort(null)} 
        />
      )}
    </div>
  );
};

const PortStaffModal = ({ port, users, onClose }: { port: Port, users: User[], onClose: () => void }) => {
    const portUsers = users.filter(u => u.assignedPorts?.includes(port.id));
    const otherUsers = users.filter(u => !u.assignedPorts?.includes(port.id));

    const handleAddUser = async (user: User) => {
        const updatedUser = { ...user, assignedPorts: [...(user.assignedPorts || []), port.id] };
        await FB.updateUserInDB(updatedUser);
    };

    const handleRemoveUser = async (user: User) => {
        const updatedUser = { ...user, assignedPorts: (user.assignedPorts || []).filter(id => id !== port.id) };
        await FB.updateUserInDB(updatedUser);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-black">إدارة طاقم المنفذ</h3>
                        <p className="text-xs opacity-70 mt-1">{port.name}</p>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                    {/* Current Staff */}
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">الطاقم الحالي ({portUsers.length})</h4>
                        <div className="space-y-2">
                            {portUsers.length === 0 && <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-50 rounded-xl">لا يوجد موظفين معينين في هذا المنفذ</p>}
                            {portUsers.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                                            {(u.name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{u.name}</p>
                                            <p className="text-[10px] text-slate-500">{u.jobTitle || u.role}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleRemoveUser(u)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="إزالة من المنفذ">
                                        <i className="fas fa-user-minus text-xs"></i>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Add Staff */}
                    <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">إضافة موظفين ({otherUsers.length})</h4>
                        <div className="space-y-2">
                            {otherUsers.length === 0 && <p className="text-xs text-slate-500 italic text-center py-4 bg-slate-50 rounded-xl">جميع الموظفين معينين في هذا المنفذ</p>}
                            {otherUsers.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-black text-xs">
                                            {(u.name || 'U').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-800">{u.name}</p>
                                            <p className="text-[10px] text-slate-500">{u.jobTitle || u.role}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleAddUser(u)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors border border-indigo-100" title="إضافة للمنفذ">
                                        <i className="fas fa-user-plus text-xs"></i> إضافة
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PortManager;
