import React, { useState, useEffect } from 'react';
import { Laboratory, LabDelegate, ConsignmentType, User } from '../types';
import * as FB from '../firebaseService';
import { exportLaboratoriesToExcel } from '../excelService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FlaskConical, 
  MapPin, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  FileSpreadsheet, 
  LayoutGrid, 
  List,
  Check,
  X,
  Phone,
  Microscope,
  Building2
} from 'lucide-react';

interface LaboratoryManagerProps {
  labAnalysisTypes: Record<ConsignmentType, string[]>;
  currentUser?: User;
}

const LaboratoryManager: React.FC<LaboratoryManagerProps> = ({ labAnalysisTypes, currentUser }) => {
  const [labs, setLabs] = useState<Laboratory[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Local state for the form
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [selectedTestTypes, setSelectedTestTypes] = useState<string[]>([]);
  const [delegates, setDelegates] = useState<LabDelegate[]>([]);
  
  // Delegate input state
  const [delegateName, setDelegateName] = useState('');
  const [delegatePhone, setDelegatePhone] = useState('');

  const [searchTerm, setSearchTerm] = useState('');

  const [selectedLab, setSelectedLab] = useState<Laboratory | null>(null);

  // Check read-only status
  const isReadOnly = currentUser?.role === 'VIEWER';

  // Combine all analysis types into a unique list for selection
  const allAnalysisTypes = Array.from(new Set(
      Object.values(labAnalysisTypes).flat()
  )) as string[];

  useEffect(() => {
    const unsub = FB.subscribeToCollection('laboratories', (data) => {
        setLabs(data as Laboratory[]);
    });
    return () => unsub();
  }, []);

  const filteredLabs = labs.filter(lab => 
    lab.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lab.location || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lab.testTypes || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    total: labs.length,
    activeTests: new Set(labs.flatMap(l => l.testTypes || [])).size,
    totalDelegates: labs.reduce((acc, l) => acc + (l.delegates?.length || 0), 0)
  };

  const handleAddDelegate = () => {
      if (!delegateName || !delegatePhone) return;
      setDelegates(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          name: delegateName,
          phone: delegatePhone
      }]);
      setDelegateName('');
      setDelegatePhone('');
  };

  const removeDelegate = (id: string) => {
      setDelegates(prev => prev.filter(d => d.id !== id));
  };

  const toggleTestType = (type: string) => {
      setSelectedTestTypes(prev => {
          if (prev.includes(type)) return prev.filter(t => t !== type);
          return [...prev, type];
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (isReadOnly) return;
      if (!name) return alert('اسم المختبر مطلوب');

      const labData: Laboratory = {
          id: editingId || Math.random().toString(36).substr(2, 9),
          name,
          location,
          testTypes: selectedTestTypes,
          delegates: delegates,
          isActive: true
      };

      if (editingId) {
          FB.updateLaboratoryInDB(labData);
          setEditingId(null);
      } else {
          FB.addLaboratoryToDB(labData);
      }
      resetForm();
  };

  const handleEdit = (lab: Laboratory) => {
      if (isReadOnly) return;
      setEditingId(lab.id);
      setName(lab.name);
      setLocation(lab.location || '');
      setSelectedTestTypes(lab.testTypes || []);
      setDelegates(lab.delegates || []);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
      if (isReadOnly) return;
      if(window.confirm("هل أنت متأكد من حذف هذا المختبر؟")) {
          FB.deleteLaboratoryFromDB(id);
      }
  };

  const resetForm = () => {
      setName('');
      setLocation('');
      setSelectedTestTypes([]);
      setDelegates([]);
      setDelegateName('');
      setDelegatePhone('');
      setEditingId(null);
  };

  return (
    <>
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
        {/* Form Section */}
        {!isReadOnly && (
        <div className="xl:col-span-1">
            <motion.div 
              layout
              className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden sticky top-8"
            >
                <div className="bg-[#c8102e] p-10 text-white relative overflow-hidden">
                    <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-10%] left-[-5%] w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
                    <h3 className="text-2xl font-black relative z-10 flex items-center gap-3">
                        {editingId ? <Edit3 className="w-6 h-6" /> : <FlaskConical className="w-6 h-6" />}
                        {editingId ? 'تعديل بيانات مختبر' : 'إضافة مختبر جديد'}
                    </h3>
                    <p className="text-white/70 text-xs font-bold mt-2 relative z-10">قم بتعبئة البيانات لاعتماد المختبر في النظام</p>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <Input label="اسم المختبر" value={name} onChange={(e: any) => setName(e.target.value)} placeholder="مثال: المختبر المركزي" icon={<Building2 className="w-4 h-4" />} />
                    <Input label="الموقع / العنوان" value={location} onChange={(e: any) => setLocation(e.target.value)} placeholder="ولاية صحار - المنطقة الصناعية" icon={<MapPin className="w-4 h-4" />} />

                    {/* Test Types Selection */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">أنواع الفحوصات المعتمدة</label>
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-3 border border-slate-100 rounded-2xl bg-slate-50/50">
                            {allAnalysisTypes.map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => toggleTestType(type)}
                                    className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${
                                        selectedTestTypes.includes(type)
                                        ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Delegates Management */}
                    <div className="space-y-4 pt-6 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">المندوبين (استلام العينات)</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={delegateName} 
                                onChange={(e) => setDelegateName(e.target.value)} 
                                placeholder="اسم المندوب" 
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-[#c8102e] transition-all"
                            />
                            <input 
                                type="text" 
                                value={delegatePhone} 
                                onChange={(e) => setDelegatePhone(e.target.value)} 
                                placeholder="رقم الهاتف" 
                                className="w-32 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-[#c8102e] transition-all"
                            />
                            <button 
                                type="button" 
                                onClick={handleAddDelegate}
                                className="bg-slate-800 text-white w-12 rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-lg"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <AnimatePresence>
                          {delegates.length > 0 && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100"
                              >
                                  {delegates.map((d, idx) => (
                                      <motion.div 
                                        key={`${d.id}-${idx}`} 
                                        layout
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100 shadow-sm"
                                      >
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                                                <Users className="w-4 h-4" />
                                              </div>
                                              <div>
                                                  <p className="text-xs font-black text-slate-700">{d.name}</p>
                                                  <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                                    <Phone className="w-2.5 h-2.5" /> {d.phone}
                                                  </p>
                                              </div>
                                          </div>
                                          <button type="button" onClick={() => removeDelegate(d.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <X className="w-4 h-4" />
                                          </button>
                                      </motion.div>
                                  ))}
                              </motion.div>
                          )}
                        </AnimatePresence>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                        <button type="submit" className="flex-1 bg-[#c8102e] text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-red-500/20 transition-all flex items-center justify-center gap-2">
                            {editingId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                            <span>{editingId ? 'حفظ التعديلات' : 'إضافة المختبر'}</span>
                        </button>
                        {editingId && (
                            <button type="button" onClick={resetForm} className="bg-slate-100 text-slate-500 font-bold px-6 rounded-2xl hover:bg-slate-200 transition-all">
                                إلغاء
                            </button>
                        )}
                    </div>
                </form>
            </motion.div>
        </div>
        )}

        {/* List Section */}
        <div className={`${isReadOnly ? 'xl:col-span-3' : 'xl:col-span-2'} space-y-8`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between px-4 gap-6">
               <div>
                   <h3 className="text-3xl font-black text-slate-800">دليل المختبرات المعتمدة</h3>
                   <p className="text-sm text-slate-400 font-bold mt-1">إدارة جهات الفحص واستلام العينات الرسمية</p>
               </div>
               
               <div className="flex flex-wrap items-center gap-4">
                   <div className="relative w-full md:w-64">
                       <input 
                           type="text" 
                           placeholder="بحث عن مختبر، موقع، أو فحص..." 
                           value={searchTerm}
                           onChange={(e) => setSearchTerm(e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-12 pl-4 text-xs font-bold focus:outline-none focus:border-[#c8102e] shadow-sm transition-all"
                       />
                       <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                   </div>

                   <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm shrink-0">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                   </div>
                   
                   <button 
                     onClick={() => exportLaboratoriesToExcel(labs, 'دليل_المختبرات')} 
                     className="bg-white border border-slate-200 text-slate-600 w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm hover:bg-slate-50 transition-all shrink-0"
                   >
                     <FileSpreadsheet className="w-6 h-6" />
                   </button>
               </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-3 gap-4 px-4">
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">إجمالي المختبرات</p>
                        <p className="text-lg font-black text-slate-800">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                        <Microscope className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">أنواع الفحوصات</p>
                        <p className="text-lg font-black text-slate-800">{stats.activeTests}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase">إجمالي المندوبين</p>
                        <p className="text-lg font-black text-slate-800">{stats.totalDelegates}</p>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="popLayout">
              {viewMode === 'grid' ? (
                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                  {filteredLabs.map((lab, idx) => (
                      <motion.div 
                        key={`${lab.id}-${idx}`} 
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden"
                      >
                          <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-800"></div>
                          
                          <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center gap-5">
                                  <div className="w-14 h-14 bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-slate-400 group-hover:text-[#c8102e] group-hover:bg-red-50 transition-all border border-slate-200">
                                      <Microscope className="w-7 h-7" />
                                  </div>
                                  <div>
                                      <h4 className="font-black text-xl text-slate-800">{lab.name}</h4>
                                      <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                                          <MapPin className="w-3.5 h-3.5" /> {lab.location || 'غير محدد'}
                                      </p>
                                  </div>
                              </div>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                  <button onClick={() => setSelectedLab(lab)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="عرض التفاصيل"><Users className="w-4 h-4" /></button>
                                  {!isReadOnly && (
                                  <>
                                      <button onClick={() => handleEdit(lab)} className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-[#c8102e] hover:text-white transition-all flex items-center justify-center shadow-sm"><Edit3 className="w-4 h-4" /></button>
                                      <button onClick={() => handleDelete(lab.id)} className="w-9 h-9 rounded-xl bg-slate-100 text-slate-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                  </>
                                  )}
                              </div>
                          </div>

                          <div className="space-y-6">
                              {/* Test Types Tags */}
                              <div className="flex flex-wrap gap-2">
                                  {lab.testTypes && lab.testTypes.length > 0 ? lab.testTypes.slice(0, 4).map((t, i) => (
                                      <span key={i} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-xl text-[10px] font-black border border-blue-100">
                                          {t}
                                      </span>
                                  )) : (
                                      <span className="text-[10px] text-slate-300 italic">لا توجد فحوصات محددة</span>
                                  )}
                                  {lab.testTypes && lab.testTypes.length > 4 && (
                                      <span className="text-[10px] text-slate-400 bg-slate-50 px-3 py-1 rounded-xl font-black">+{lab.testTypes.length - 4}</span>
                                  )}
                              </div>

                              {/* Delegates List (Preview) */}
                              <div className="border-t border-slate-50 pt-5">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">المندوبين المعتمدين</p>
                                  {lab.delegates && lab.delegates.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-3">
                                          {lab.delegates.map((d, i) => (
                                              <div key={i} className="flex items-center gap-3 text-[10px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                                  <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-sm">
                                                      <Users className="w-3.5 h-3.5 text-slate-400" />
                                                  </div>
                                                  <div className="overflow-hidden">
                                                      <span className="block font-black truncate">{d.name}</span>
                                                      <span className="block text-[9px] font-mono opacity-70">{d.phone}</span>
                                                  </div>
                                              </div>
                                          ))}
                                      </div>
                                  ) : (
                                      <p className="text-[11px] text-slate-300 font-bold">لا يوجد مندوبين مسجلين</p>
                                  )}
                              </div>
                          </div>
                      </motion.div>
                  ))}
                  </motion.div>
              ) : (
                  /* Table View */
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm"
                  >
                      <div className="overflow-x-auto">
                          <table className="w-full text-right">
                              <thead className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                  <tr>
                                      <th className="p-6">اسم المختبر</th>
                                      <th className="p-6">الموقع</th>
                                      <th className="p-6">أنواع الفحص</th>
                                      <th className="p-6">المندوبين</th>
                                      {!isReadOnly && <th className="p-6 text-center">إجراءات</th>}
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {filteredLabs.map(lab => (
                                      <tr key={lab.id} className="hover:bg-slate-50/80 transition-colors">
                                          <td className="p-6">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                                <Microscope className="w-4 h-4" />
                                              </div>
                                              <span className="font-black text-slate-800 text-sm">{lab.name}</span>
                                            </div>
                                          </td>
                                          <td className="p-6 text-xs font-bold text-slate-600">{lab.location || '-'}</td>
                                          <td className="p-6">
                                              <div className="flex flex-wrap gap-1.5 max-w-xs">
                                                  {lab.testTypes?.slice(0, 3).map((t, i) => (
                                                      <span key={i} className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100 font-black">{t}</span>
                                                  ))}
                                                  {lab.testTypes && lab.testTypes.length > 3 && (
                                                      <span className="text-[9px] text-slate-400 font-black">+{lab.testTypes.length - 3}</span>
                                                  )}
                                              </div>
                                          </td>
                                          <td className="p-6">
                                            <div className="flex items-center gap-2">
                                              <Users className="w-3.5 h-3.5 text-slate-300" />
                                              <span className="text-xs font-black text-slate-600">{lab.delegates?.length || 0}</span>
                                            </div>
                                          </td>
                                          <td className="p-6 text-center">
                                              <div className="flex items-center justify-center gap-2">
                                                  <button onClick={() => setSelectedLab(lab)} className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center shadow-sm" title="عرض التفاصيل">
                                                      <Users className="w-4 h-4" />
                                                  </button>
                                                  {!isReadOnly && (
                                                      <>
                                                          <button onClick={() => handleEdit(lab)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                                              <Edit3 className="w-4 h-4" />
                                                          </button>
                                                          <button onClick={() => handleDelete(lab.id)} className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-sm">
                                                              <Trash2 className="w-4 h-4" />
                                                          </button>
                                                      </>
                                                  )}
                                              </div>
                                          </td>
                                      </tr>
                                  ))}
                              </tbody>
                          </table>
                      </div>
                  </motion.div>
              )}
            </AnimatePresence>
                
            {labs.length === 0 && (
                <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-slate-100 border-dashed">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <FlaskConical className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 font-black text-lg">لا توجد مختبرات مسجلة حالياً</p>
                    <p className="text-slate-300 text-sm mt-2">ابدأ بإضافة مختبر جديد من القائمة الجانبية</p>
                </div>
            )}
        </div>
    </div>

    {/* Lab Details Modal */}
    <AnimatePresence>
      {selectedLab && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[3rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="bg-slate-800 p-8 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                  <Microscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black">{selectedLab.name}</h3>
                  <p className="text-xs text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                    <MapPin className="w-3 h-3" /> {selectedLab.location || 'غير محدد'}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedLab(null)} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-50/50">
              {/* Test Types Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" /> أنواع الفحوصات المعتمدة
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedLab.testTypes?.map((t, i) => (
                    <span key={i} className="bg-white text-slate-700 px-4 py-2 rounded-xl text-xs font-black border border-slate-100 shadow-sm">
                      {t}
                    </span>
                  ))}
                  {(!selectedLab.testTypes || selectedLab.testTypes.length === 0) && (
                    <p className="text-sm text-slate-400 italic">لا توجد فحوصات محددة</p>
                  )}
                </div>
              </div>

              {/* Delegates Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4" /> المندوبين المعتمدين
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLab.delegates?.map((d, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                          <Users className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{d.name}</p>
                          <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
                            <Phone className="w-3 h-3" /> {d.phone}
                          </p>
                        </div>
                      </div>
                      <a href={`tel:${d.phone}`} className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-600 hover:text-white transition-all">
                        <Phone className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                  {(!selectedLab.delegates || selectedLab.delegates.length === 0) && (
                    <p className="text-sm text-slate-400 italic col-span-full">لا يوجد مندوبين مسجلين</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
              <button onClick={() => setSelectedLab(null)} className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-black hover:bg-black transition-all">
                إغلاق
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
};

const Input = ({ label, value, onChange, placeholder, type = 'text', icon }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{label}</label>
    <div className="relative">
      <input
        type={type}
        value={value ?? ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-12 py-4 text-sm focus:ring-4 focus:ring-red-500/5 focus:border-[#c8102e] outline-none transition-all text-slate-800 font-bold placeholder:text-slate-300"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </div>
    </div>
  </div>
);

export default LaboratoryManager;
