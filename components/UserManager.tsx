
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { User, UserRole, ConsignmentType, WeeklySchedule, ShiftType, PasswordResetRequest, Port, Laboratory, SectorShiftConfig, ShiftConfig, SystemSettings } from '../types';
import { CONSIGNMENT_LABELS, APP_PAGES } from '../constants';
import { saveShiftSchedule, subscribeToShifts, subscribeToPasswordRequests, adminResetPasswordToDefault, registerSystemUser, DEFAULT_PASSWORD, saveSectorShiftConfig, subscribeToSectorShiftConfig } from '../firebaseService';
import { exportToExcel, exportUsersToExcel } from '../excelService';
import PortManager from './PortManager';

interface UserManagerProps {
  users: User[];
  ports?: Port[]; 
  laboratories?: Laboratory[];
  onAdd: (user: User) => void;
  onUpdate: (user: User) => void;
  onDelete: (id: string) => void;
  currentUser: User;
  systemSettings: SystemSettings;
}

const UserManager: React.FC<UserManagerProps> = ({ users, ports = [], laboratories = [], onAdd, onUpdate, onDelete, currentUser, systemSettings }) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'PORTS'>('USERS');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
      const unsub = subscribeToPasswordRequests(setResetRequests);
      return () => unsub();
  }, []);
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [sectorFilter, setSectorFilter] = useState<ConsignmentType | 'ALL'>('ALL');
  const [portFilter, setPortFilter] = useState<string | 'ALL'>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  const [customPassword, setCustomPassword] = useState('');
  const [schedSector, setSchedSector] = useState<ConsignmentType>(ConsignmentType.FOOD_SAFETY);
  const [schedPort, setSchedPort] = useState<string>('');
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [shiftConfig, setShiftConfig] = useState<SectorShiftConfig | null>(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const defaultShifts: ShiftConfig[] = [
    { id: 'MORNING', name: 'الصباحية', startTime: '08:00', endTime: '16:00', color: 'amber', icon: 'fa-sun' },
    { id: 'EVENING', name: 'المسائية', startTime: '16:00', endTime: '00:00', color: 'indigo', icon: 'fa-moon' }
  ];

  const currentShifts = shiftConfig?.shifts || defaultShifts;

  useEffect(() => {
      if (ports.length > 0 && !schedPort) {
          setSchedPort(ports[0].id);
      }
  }, [ports]);

  useEffect(() => {
    if (showScheduler && schedPort) {
        const unsub = subscribeToShifts(schedSector, schedPort, (data) => {
            setSchedule(data || {});
        });
        const unsubConfig = subscribeToSectorShiftConfig(schedSector, schedPort, (data) => {
            setShiftConfig(data);
        });
        return () => {
            unsub();
            unsubConfig();
        };
    }
  }, [showScheduler, schedSector, schedPort]);

  const initialFormState: Partial<User> = {
    name: '', civilId: '', email: '', phone: '', role: 'INSPECTOR', jobTitle: '', 
    allowedSectors: [], assignedPorts: [], assignedLabId: '', allowedPages: ['/', '/portal'], 
    isActive: true, currentPassword: DEFAULT_PASSWORD 
  };

  const [formData, setFormData] = useState<Partial<User>>(initialFormState);

  // Sync allowed pages with role defaults when role changes
  useEffect(() => {
    if (!editingId && systemSettings?.rolePermissions?.[formData.role as UserRole]) {
        setFormData(prev => ({
            ...prev,
            allowedPages: systemSettings.rolePermissions![prev.role as UserRole] || []
        }));
    }
  }, [formData.role, systemSettings, editingId]);

  const processedUsers = useMemo(() => {
    return users
      .filter(u => u && u.id)
      .filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (u.civilId && u.civilId.includes(searchTerm));
        const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
        const matchesSector = sectorFilter === 'ALL' || u.allowedSectors?.includes(sectorFilter as ConsignmentType);
        const matchesPort = portFilter === 'ALL' || u.assignedPorts?.includes(portFilter);
        return matchesSearch && matchesRole && matchesSector && matchesPort;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }, [users, searchTerm, roleFilter, sectorFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && name === 'isActive') {
        setFormData(prev => ({ ...prev, isActive: (e.target as HTMLInputElement).checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePageToggle = (path: string) => {
      setFormData(prev => {
          const currentPages = prev.allowedPages || [];
          const newPages = currentPages.includes(path) 
            ? currentPages.filter(p => p !== path) 
            : [...currentPages, path];
          return { ...prev, allowedPages: newPages };
      });
  };

  const handleSectorToggle = (type: ConsignmentType) => {
      setFormData(prev => {
          const currentSectors = prev.allowedSectors || [];
          return currentSectors.includes(type) ? { ...prev, allowedSectors: currentSectors.filter(s => s !== type) } : { ...prev, allowedSectors: [...currentSectors, type] };
      });
  };

  const handlePortToggle = (portId: string) => {
      setFormData(prev => {
          const currentPorts = prev.assignedPorts || [];
          return currentPorts.includes(portId) ? { ...prev, assignedPorts: currentPorts.filter(p => p !== portId) } : { ...prev, assignedPorts: [...currentPorts, portId] };
      });
  };

  const handleBulkAction = async (action: 'ACTIVATE' | 'DEACTIVATE' | 'DELETE') => {
    if (selectedUserIds.length === 0) return;
    
    const confirmMsg = action === 'DELETE' 
        ? `هل أنت متأكد من حذف ${selectedUserIds.length} مستخدم؟` 
        : `هل أنت متأكد من ${action === 'ACTIVATE' ? 'تفعيل' : 'تعطيل'} ${selectedUserIds.length} مستخدم؟`;
        
    if (!window.confirm(confirmMsg)) return;
    
    try {
        for (const id of selectedUserIds) {
            if (action === 'DELETE') {
                await onDelete(id);
            } else {
                const user = users.find(u => u.id === id);
                if (user) {
                    await onUpdate({ ...user, isActive: action === 'ACTIVATE' });
                }
            }
        }
        alert("تم تنفيذ العملية بنجاح");
        setSelectedUserIds([]);
    } catch (error: any) {
        alert("خطأ أثناء تنفيذ العملية: " + error.message);
    }
  };

  const toggleUserSelection = (id: string) => {
    setSelectedUserIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === processedUsers.length && processedUsers.length > 0) {
        setSelectedUserIds([]);
    } else {
        setSelectedUserIds(processedUsers.map(u => u.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.jobTitle || !formData.civilId) return alert('البيانات الأساسية مطلوبة');
    
    // Admins and Lab Techs get all sectors and ports by default as per requirements
    const finalSectors = (formData.role === 'ADMIN' || formData.role === 'LAB_TECH' || formData.role === 'LAB_DELEGATE') ? Object.values(ConsignmentType) : formData.allowedSectors || [];
    const finalPages = formData.role === 'ADMIN' ? APP_PAGES.map(p => p.path) : formData.allowedPages || [];
    const finalPorts = (formData.role === 'ADMIN' || formData.role === 'LAB_TECH' || formData.role === 'LAB_DELEGATE') ? ports.map(p => p.id) : formData.assignedPorts || [];
    const finalLabId = (formData.role === 'LAB_TECH' || formData.role === 'LAB_DELEGATE') ? formData.assignedLabId : '';

    const userPayload: User = {
        ...formData as User,
        allowedSectors: finalSectors,
        allowedPages: finalPages,
        assignedPorts: finalPorts,
        assignedLabId: finalLabId,
        id: editingId || '', 
    };

    try {
        if (editingId) { await onUpdate(userPayload); alert("تم تحديث الصلاحيات بنجاح"); } 
        else { 
            const isUpdate = await registerSystemUser(userPayload, customPassword || undefined); 
            alert(isUpdate ? "تم تحديث بيانات الموظف المسجل مسبقاً" : "تم إنشاء الحساب بنجاح"); 
        }
        setFormData(initialFormState); setCustomPassword(''); setEditingId(null);
    } catch (error: any) { alert("خطأ: " + error.message); }
  };

  const handleEdit = (user: User) => { 
      setEditingId(user.id); 
      setFormData({ ...user }); 
      setCustomPassword(''); 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  const handleResetPassword = async (request: PasswordResetRequest) => {
      if (window.confirm(`تأكيد إعادة تعيين كلمة مرور ${request.userName}؟\n\nملاحظة: يجب عليك تغيير كلمة المرور يدوياً في لوحة تحكم Firebase إلى "${DEFAULT_PASSWORD}" ليتمكن المستخدم من الدخول.`)) {
          await adminResetPasswordToDefault(request.userId, request.id);
          alert(`تم تفعيل طلب تغيير كلمة المرور. يرجى التأكد من أن كلمة مرور المستخدم في النظام هي الآن: ${DEFAULT_PASSWORD}`);
      }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex p-1 bg-white border border-slate-200 rounded-2xl shadow-sm w-fit mx-auto">
          <button 
              onClick={() => setActiveTab('USERS')} 
              className={`px-8 py-3 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'USERS' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
              <i className="fas fa-users-cog"></i> إدارة المستخدمين
          </button>
          <button 
              onClick={() => setActiveTab('PORTS')} 
              className={`px-8 py-3 text-xs font-black rounded-xl transition-all flex items-center gap-2 ${activeTab === 'PORTS' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
          >
              <i className="fas fa-anchor"></i> إدارة المنافذ
          </button>
      </div>

      {activeTab === 'PORTS' ? (
          <PortManager ports={ports} currentUser={currentUser} users={users} />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          
          {/* Form Section */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden sticky top-8">
              <div className="bg-slate-900 p-6 text-white relative">
                 <h3 className="text-lg font-black flex items-center gap-3"><i className={`fas ${editingId ? 'fa-user-shield' : 'fa-user-plus'}`}></i> {editingId ? 'تعديل الصلاحيات' : 'موظف جديد'}</h3>
                 <p className="text-[10px] opacity-60 font-bold uppercase mt-1">تخصيص نطاق العمل والوصول</p>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-3">
                <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase">حالة الحساب</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                            type="checkbox" 
                            name="isActive"
                            className="sr-only peer" 
                            checked={formData.isActive}
                            onChange={handleInputChange}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                        <span className={`mr-3 text-xs font-bold ${formData.isActive ? 'text-green-600' : 'text-slate-500'}`}>
                            {formData.isActive ? 'نشط' : 'معطل'}
                        </span>
                    </label>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">المعلومات الشخصية</p>
                <Input label="الاسم الكامل" name="name" value={formData.name} onChange={handleInputChange} />
                <Input label="الرقم المدني" name="civilId" value={formData.civilId} onChange={handleInputChange} />
                <Input label="المسمى الوظيفي" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} />
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase mr-2">الدور الوظيفي</label>
                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold">
                        <option value="INSPECTOR">مفتش ميداني</option>
                        <option value="MANAGER">مسؤول / مدير</option>
                        <option value="LOGISTICS">موظف لوجستي</option>
                        <option value="LAB_TECH">فني مختبر</option>
                        <option value="LAB_DELEGATE">مندوب مختبر</option>
                        <option value="ADMIN">مدير نظام</option>
                        <option value="VIEWER">مطلع فقط</option>
                    </select>
                </div>

                {(formData.role === 'LAB_TECH' || formData.role === 'LAB_DELEGATE') && (
                    <div className="space-y-1 animate-fade-in">
                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">المختبر التابع له</label>
                        <select 
                            name="assignedLabId" 
                            value={formData.assignedLabId} 
                            onChange={handleInputChange} 
                            className="w-full bg-slate-50 border border-blue-200 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-blue-500/20"
                            required
                        >
                            <option value="">اختر المختبر...</option>
                            {laboratories.map(lab => (
                                <option key={lab.id} value={lab.id}>{lab.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {formData.role !== 'ADMIN' && (
                <>
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-2 flex items-center gap-2">
                            <i className="fas fa-lock"></i> صلاحيات الوصول للخدمات
                        </p>
                        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 p-4 rounded-xl text-xs font-bold flex items-start gap-3">
                            <i className="fas fa-info-circle mt-0.5"></i>
                            <p>يتم تحديد صلاحيات الوصول للخدمات والصفحات بشكل تلقائي بناءً على دور المستخدم، ويمكن تعديلها من إعدادات النظام.</p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">نطاق العمل (المنافذ والقطاعات)</p>
                        <div className="space-y-2">
                            <div className="grid grid-cols-1 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                                {ports.map(port => (
                                    <label key={port.id} className={`flex items-center p-2 rounded-lg border text-[10px] font-bold cursor-pointer ${formData.assignedPorts?.includes(port.id) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-100 bg-white'}`}>
                                        <input type="checkbox" checked={formData.assignedPorts?.includes(port.id)} onChange={() => handlePortToggle(port.id)} className="ml-2" />
                                        {port.name}
                                    </label>
                                ))}
                            </div>
                            <div className="flex flex-col gap-1 mt-2">
                                {(Object.values(ConsignmentType) as ConsignmentType[]).map(type => (
                                    <label key={type} className={`flex items-center p-2 rounded-lg border text-[10px] font-bold cursor-pointer ${formData.allowedSectors?.includes(type) ? 'border-[#c8102e] bg-red-50 text-red-800' : 'border-slate-100 bg-white'}`}>
                                        <input type="checkbox" checked={formData.allowedSectors?.includes(type)} onChange={() => handleSectorToggle(type)} className="ml-2" />
                                        {CONSIGNMENT_LABELS[type]}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            <button type="submit" className="w-full bg-[#c8102e] text-white font-black py-4 rounded-2xl shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                <i className="fas fa-save"></i>
                <span>{editingId ? 'تحديث الصلاحيات' : 'تفعيل الحساب'}</span>
            </button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setFormData(initialFormState); }} className="w-full text-slate-400 font-bold text-[10px]">إلغاء التعديل</button>}
          </form>
        </div>
      </div>

      {/* List Section */}
      <div className="xl:col-span-3 space-y-6">
        {/* Pending Reset Requests */}
        {resetRequests.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-[2rem] p-6 animate-pulse-subtle">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                            <i className="fas fa-key"></i>
                        </div>
                        <div>
                            <h4 className="font-black text-amber-900">طلبات إعادة تعيين كلمة المرور</h4>
                            <p className="text-[10px] text-amber-600 font-bold uppercase">يوجد {resetRequests.length} طلب معلق يحتاج للمراجعة</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resetRequests.map(req => (
                        <div key={req.id} className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between">
                            <div>
                                <p className="font-black text-slate-800 text-xs">{req.userName}</p>
                                <p className="text-[9px] text-slate-400 font-bold">الرقم المدني: {req.civilId}</p>
                                <p className="text-[9px] text-slate-400 font-bold">الهاتف: {req.phone}</p>
                            </div>
                            <button 
                                onClick={() => handleResetPassword(req)}
                                className="bg-amber-600 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-black transition-all"
                            >
                                إعادة تعيين
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h3 className="text-xl font-black text-slate-800">إدارة فريق العمل</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">تحديد الأدوار وصلاحيات الوصول للمنصة</p>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
                <button 
                    onClick={() => setShowScheduler(!showScheduler)}
                    className={`px-6 py-3 rounded-2xl font-black text-xs transition-all flex items-center gap-2 ${showScheduler ? 'bg-slate-800 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}
                >
                    <i className="fas fa-calendar-alt"></i>
                    {showScheduler ? 'إغلاق الجدول' : 'جدول المناوبات'}
                </button>
                <div className="relative flex-1 md:w-64">
                    <input type="text" placeholder="بحث باسم الموظف أو الرقم المدني..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold focus:border-[#c8102e]" />
                    <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-300"></i>
                </div>
            </div>
        </div>

        {/* Filters and Bulk Actions */}
        <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">تصفية حسب:</span>
                <select 
                    value={roleFilter} 
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                >
                    <option value="ALL">كافة الأدوار</option>
                    <option value="INSPECTOR">مفتش ميداني</option>
                    <option value="MANAGER">مسؤول / مدير</option>
                    <option value="ADMIN">مدير نظام</option>
                    <option value="LAB_TECH">فني مختبر</option>
                    <option value="LAB_DELEGATE">مندوب مختبر</option>
                    <option value="LOGISTICS">موظف لوجستي</option>
                </select>
                <select 
                    value={sectorFilter} 
                    onChange={(e) => setSectorFilter(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                >
                    <option value="ALL">كافة القطاعات</option>
                    {Object.values(ConsignmentType).map(type => (
                        <option key={type} value={type}>{CONSIGNMENT_LABELS[type]}</option>
                    ))}
                </select>
                <select 
                    value={portFilter} 
                    onChange={(e) => setPortFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold outline-none"
                >
                    <option value="ALL">كافة المنافذ</option>
                    {ports.map(port => (
                        <option key={port.id} value={port.id}>{port.name}</option>
                    ))}
                </select>
            </div>

            <div className="h-6 w-px bg-slate-100 mx-2 hidden md:block"></div>

            <button 
                onClick={async () => {
                    await exportUsersToExcel(processedUsers, 'دليل_المستخدمين');
                }}
                className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-2 border border-emerald-100"
            >
                <i className="fas fa-file-excel"></i>
                تصدير Excel
            </button>

            {selectedUserIds.length > 0 && (
                <div className="flex items-center gap-2 animate-fade-in">
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                        تم تحديد {selectedUserIds.length} مستخدم
                    </span>
                    <button onClick={() => handleBulkAction('ACTIVATE')} className="bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-green-600 hover:text-white transition-all">تفعيل</button>
                    <button onClick={() => handleBulkAction('DEACTIVATE')} className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-amber-600 hover:text-white transition-all">تعطيل</button>
                    <button onClick={() => handleBulkAction('DELETE')} className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] font-black hover:bg-red-600 hover:text-white transition-all">حذف</button>
                    <button onClick={() => setSelectedUserIds([])} className="text-slate-400 text-[10px] font-bold hover:text-slate-600">إلغاء</button>
                </div>
            )}
        </div>

        {showScheduler && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-slide-down">
                <div className="bg-slate-50 p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-700 shadow-sm">
                            <i className="fas fa-calendar-check text-lg"></i>
                        </div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-black text-slate-800">توزيع المناوبات الأسبوعية</h4>
                            <button 
                                onClick={() => setIsConfigModalOpen(true)}
                                className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-all"
                                title="إعدادات المناوبات"
                            >
                                <i className="fas fa-cog text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <select 
                            value={schedPort} 
                            onChange={(e) => setSchedPort(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500"
                        >
                            {ports.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <div className="flex bg-white p-1 rounded-xl border border-slate-200">
                            {Object.values(ConsignmentType).map(type => (
                                <button 
                                    key={type} 
                                    onClick={() => setSchedSector(type)}
                                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${schedSector === type ? 'bg-[#c8102e] text-white shadow' : 'text-slate-500'}`}
                                >
                                    {CONSIGNMENT_LABELS[type]}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="p-6 overflow-x-auto">
                    <div className="grid grid-cols-7 gap-4 min-w-[1000px]">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                            <div key={day} className="space-y-4">
                                <div className="text-center py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">
                                    {day === 'Sunday' ? 'الأحد' : day === 'Monday' ? 'الاثنين' : day === 'Tuesday' ? 'الثلاثاء' : day === 'Wednesday' ? 'الأربعاء' : day === 'Thursday' ? 'الخميس' : day === 'Friday' ? 'الجمعة' : 'السبت'}
                                </div>
                                
                                {currentShifts.map(shift => (
                                    <ShiftBox 
                                        key={shift.id}
                                        label={shift.name} 
                                        icon={shift.icon} 
                                        color={shift.color}
                                        users={users.filter(u => schedule[day]?.[shift.id]?.includes(u.id))}
                                        allUsers={users.filter(u => u.allowedSectors?.includes(schedSector) && u.assignedPorts?.includes(schedPort))}
                                        onAdd={(userId) => {
                                            const current = schedule[day]?.[shift.id] || [];
                                            if (!current.includes(userId)) {
                                                const newSched = { ...schedule, [day]: { ...schedule[day], [shift.id]: [...current, userId] } };
                                                saveShiftSchedule(schedSector, schedPort, newSched);
                                            }
                                        }}
                                        onRemove={(userId) => {
                                            const current = schedule[day]?.[shift.id] || [];
                                            const newSched = { ...schedule, [day]: { ...schedule[day], [shift.id]: current.filter(id => id !== userId) } };
                                            saveShiftSchedule(schedSector, schedPort, newSched);
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        <div className="space-y-8">
            {(['ADMIN', 'MANAGER', 'INSPECTOR', 'LAB_TECH', 'LAB_DELEGATE', 'LOGISTICS', 'VIEWER'] as UserRole[]).map(role => {
                const roleUsers = processedUsers.filter(u => u.role === role);
                if (roleUsers.length === 0) return null;
                
                const roleLabels: Record<string, string> = {
                    ADMIN: 'مدير نظام',
                    MANAGER: 'مسؤول / مدير',
                    INSPECTOR: 'مفتش ميداني',
                    LAB_TECH: 'فني مختبر',
                    LAB_DELEGATE: 'مندوب مختبر',
                    LOGISTICS: 'موظف لوجستي',
                    VIEWER: 'مطلع فقط'
                };
                
                const roleColors: Record<string, string> = {
                    ADMIN: 'bg-red-50 text-red-600 border-red-200',
                    MANAGER: 'bg-blue-50 text-blue-600 border-blue-200',
                    INSPECTOR: 'bg-orange-50 text-orange-600 border-orange-200',
                    LAB_TECH: 'bg-emerald-50 text-emerald-600 border-emerald-200',
                    LAB_DELEGATE: 'bg-indigo-50 text-indigo-600 border-indigo-200',
                    LOGISTICS: 'bg-purple-50 text-purple-600 border-purple-200',
                    VIEWER: 'bg-slate-50 text-slate-600 border-slate-200'
                };

                return (
                    <div key={role} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fade-in">
                        <div className={`p-5 border-b border-slate-100 flex items-center justify-between ${roleColors[role].split(' ')[0]}`}>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-xl text-xs font-black bg-white ${roleColors[role].split(' ')[1]}`}>
                                    {roleLabels[role]}
                                </span>
                                <span className="text-[10px] font-bold text-slate-500 uppercase">
                                    العدد: {roleUsers.length} مستخدم
                                </span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase">
                                    <tr>
                                        <th className="p-4 text-center w-10">
                                            <input 
                                                type="checkbox" 
                                                checked={roleUsers.every(u => selectedUserIds.includes(u.id))} 
                                                onChange={() => {
                                                    const allSelected = roleUsers.every(u => selectedUserIds.includes(u.id));
                                                    if (allSelected) {
                                                        setSelectedUserIds(prev => prev.filter(id => !roleUsers.find(ru => ru.id === id)));
                                                    } else {
                                                        setSelectedUserIds(prev => {
                                                            const newIds = [...prev];
                                                            roleUsers.forEach(ru => {
                                                                if (!newIds.includes(ru.id)) newIds.push(ru.id);
                                                            });
                                                            return newIds;
                                                        });
                                                    }
                                                }}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </th>
                                        <th className="p-4">الموظف</th>
                                        <th className="p-4">الرقم المدني</th>
                                        <th className="p-4 text-center">الحالة</th>
                                        <th className="p-4 text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {roleUsers.map((user, index) => (
                                        <motion.tr 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            key={user.id} 
                                            className="group hover:bg-slate-50/50 transition-colors"
                                        >
                                            <td className="p-4 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedUserIds.includes(user.id)} 
                                                    onChange={() => toggleUserSelection(user.id)}
                                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black shrink-0">
                                                        {user.avatar ? <img referrerPolicy="no-referrer" src={user.avatar} className="w-full h-full object-cover rounded-xl" /> : user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-800 text-sm whitespace-nowrap">{user.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold">{user.jobTitle}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-slate-500 font-bold whitespace-nowrap">
                                                {user.civilId}
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="flex items-center gap-1">
                                                        <div className={`w-2 h-2 rounded-full ${user.isOnline ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                        <span className={`text-[8px] font-black ${user.isActive ? 'text-green-600' : 'text-red-500'}`}>{user.isActive ? 'نشط' : 'معطل'}</span>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer" title={user.isActive ? "تعطيل الحساب" : "تنشيط الحساب"}>
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer" 
                                                            checked={user.isActive}
                                                            onChange={() => onUpdate({ ...user, isActive: !user.isActive })}
                                                        />
                                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                                                    </label>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            if(window.confirm(`هل أنت متأكد من إعادة تعيين كلمة مرور ${user.name}؟\n\nملاحظة: يجب عليك تغيير كلمة المرور يدوياً في لوحة تحكم Firebase إلى "${DEFAULT_PASSWORD}" ليتمكن المستخدم من الدخول.`)) {
                                                                adminResetPasswordToDefault(user.id);
                                                                alert(`تم تفعيل طلب تغيير كلمة المرور. يرجى التأكد من أن كلمة مرور المستخدم في النظام هي الآن: ${DEFAULT_PASSWORD}`);
                                                            }
                                                        }}
                                                        title="إعادة تعيين كلمة المرور"
                                                        className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
                                                    >
                                                        <i className="fas fa-key text-xs"></i>
                                                    </button>
                                                    <button onClick={() => handleEdit(user)} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all shadow-sm"><i className="fas fa-pen text-xs"></i></button>
                                                    <button onClick={() => { if(window.confirm('حذف الموظف؟')) onDelete(user.id); }} className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all shadow-sm"><i className="fas fa-trash-alt text-xs"></i></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  )}
  <ShiftConfigModal 
      isOpen={isConfigModalOpen}
      onClose={() => setIsConfigModalOpen(false)}
      sector={schedSector}
      portId={schedPort}
      config={shiftConfig}
      onSave={saveSectorShiftConfig}
  />
</div>
  );
};

const Input = ({ label, name, type = 'text', value, onChange }: any) => (
  <div className="space-y-1">
    <label className="text-[10px] font-black text-slate-500 uppercase mr-2">{label}</label>
    <input type={type} name={name} value={value ?? ''} onChange={onChange} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-[#c8102e] transition-all" />
  </div>
);

const ShiftConfigModal = ({ isOpen, onClose, sector, portId, config, onSave }: any) => {
    const [shifts, setShifts] = useState<ShiftConfig[]>(config?.shifts || [
        { id: 'MORNING', name: 'الصباحية', startTime: '08:00', endTime: '16:00', color: 'amber', icon: 'fa-sun' },
        { id: 'EVENING', name: 'المسائية', startTime: '16:00', endTime: '00:00', color: 'indigo', icon: 'fa-moon' }
    ]);

    useEffect(() => {
        if (config?.shifts) {
            setShifts(config.shifts);
        }
    }, [config]);

    const addShift = () => {
        const newId = `SHIFT_${Date.now()}`;
        setShifts([...shifts, { id: newId, name: 'مناوبة جديدة', startTime: '00:00', endTime: '00:00', color: 'slate', icon: 'fa-clock' }]);
    };

    const removeShift = (id: string) => {
        setShifts(shifts.filter(s => s.id !== id));
    };

    const updateShift = (id: string, updates: Partial<ShiftConfig>) => {
        setShifts(shifts.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const handleSave = () => {
        onSave({
            id: portId === 'ALL' ? sector : `${sector}_${portId}`,
            sector,
            portId,
            shifts
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl"
            >
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800">إعدادات المناوبات</h3>
                        <p className="text-xs text-slate-400 font-bold uppercase">تخصيص عدد وتوقيت المناوبات</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-600 transition-all flex items-center justify-center shadow-sm">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar space-y-6">
                    {shifts.map((shift, index) => (
                        <div key={shift.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-4 relative group">
                            <button 
                                onClick={() => removeShift(shift.id)}
                                className="absolute -top-2 -left-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                            >
                                <i className="fas fa-trash-alt text-xs"></i>
                            </button>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase mr-2">اسم المناوبة</label>
                                    <input 
                                        type="text" 
                                        value={shift.name} 
                                        onChange={(e) => updateShift(shift.id, { name: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">من</label>
                                        <input 
                                            type="time" 
                                            value={shift.startTime} 
                                            onChange={(e) => updateShift(shift.id, { startTime: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase mr-2">إلى</label>
                                        <input 
                                            type="time" 
                                            value={shift.endTime} 
                                            onChange={(e) => updateShift(shift.id, { endTime: e.target.value })}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase mr-2">اللون</label>
                                    <select 
                                        value={shift.color} 
                                        onChange={(e) => updateShift(shift.id, { color: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                    >
                                        <option value="amber">أصفر (صباحي)</option>
                                        <option value="indigo">أزرق (مسائي)</option>
                                        <option value="emerald">أخضر</option>
                                        <option value="rose">وردي</option>
                                        <option value="violet">بنفسجي</option>
                                        <option value="slate">رمادي</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase mr-2">الأيقونة</label>
                                    <select 
                                        value={shift.icon} 
                                        onChange={(e) => updateShift(shift.id, { icon: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:border-blue-500"
                                    >
                                        <option value="fa-sun">شمس</option>
                                        <option value="fa-moon">قمر</option>
                                        <option value="fa-clock">ساعة</option>
                                        <option value="fa-star">نجمة</option>
                                        <option value="fa-coffee">قهوة</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}

                    <button 
                        onClick={addShift}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-blue-500 hover:text-blue-500 transition-all font-black text-xs flex items-center justify-center gap-2"
                    >
                        <i className="fas fa-plus"></i>
                        إضافة مناوبة جديدة
                    </button>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-3">
                    <button 
                        onClick={handleSave}
                        className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-xs shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
                    >
                        حفظ الإعدادات
                    </button>
                    <button 
                        onClick={onClose}
                        className="flex-1 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-black text-xs hover:bg-slate-50 transition-all"
                    >
                        إلغاء
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const ShiftBox = ({ label, icon, color, users, allUsers, onAdd, onRemove }: any) => {
    const [showAdd, setShowAdd] = useState(false);
    
    const colorClasses: any = {
        amber: 'bg-amber-50/50 border-amber-100 text-amber-600',
        indigo: 'bg-indigo-50/50 border-indigo-100 text-indigo-600',
        emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-600',
        rose: 'bg-rose-50/50 border-rose-100 text-rose-600',
        violet: 'bg-violet-50/50 border-violet-100 text-violet-600',
        slate: 'bg-slate-50/50 border-slate-100 text-slate-600',
    };
    const currentClass = colorClasses[color] || colorClasses.slate;

    return (
        <div className={`p-3 rounded-2xl border ${currentClass.split(' ').slice(0, 2).join(' ')}`}>
            <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                    <i className={`fas ${icon} text-[10px] ${currentClass.split(' ')[2]}`}></i>
                    <span className="text-[10px] font-black text-slate-700">{label}</span>
                </div>
                <button 
                    onClick={() => setShowAdd(!showAdd)}
                    className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] transition-all ${showAdd ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-800'}`}
                >
                    <i className={`fas ${showAdd ? 'fa-times' : 'fa-plus'}`}></i>
                </button>
            </div>

            {showAdd && (
                <div className="mb-3 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-scale-in">
                    <div className="max-h-32 overflow-y-auto custom-scrollbar">
                        {allUsers.filter((u: any) => !users.find((su: any) => su.id === u.id)).map((u: any) => (
                            <button 
                                key={u.id} 
                                onClick={() => { onAdd(u.id); setShowAdd(false); }}
                                className="w-full text-right px-3 py-2 text-[10px] font-bold hover:bg-slate-50 border-b border-slate-50 last:border-0"
                            >
                                {u.name}
                            </button>
                        ))}
                        {allUsers.filter((u: any) => !users.find((su: any) => su.id === u.id)).length === 0 && (
                            <p className="p-3 text-[9px] text-slate-400 text-center italic">لا يوجد موظفين متاحين</p>
                        )}
                    </div>
                </div>
            )}

            <div className="space-y-1.5">
                {users.map((u: any) => (
                    <div key={u.id} className="bg-white px-2 py-1.5 rounded-lg border border-slate-100 flex justify-between items-center group shadow-sm">
                        <span className="text-[10px] font-bold text-slate-600 truncate">{u.name}</span>
                        <button onClick={() => onRemove(u.id)} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fas fa-times text-[8px]"></i>
                        </button>
                    </div>
                ))}
                {users.length === 0 && !showAdd && (
                    <p className="text-[9px] text-slate-300 text-center italic py-2">لم يتم التعيين</p>
                )}
            </div>
        </div>
    );
};

export default UserManager;
