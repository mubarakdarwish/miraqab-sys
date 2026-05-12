
import React, { useState, useEffect } from 'react';
import { SamplingPlan, ConsignmentType, User, CommodityGroup } from '../types';
import { CONSIGNMENT_LABELS } from '../constants';
import SearchableSelect from './SearchableSelect';

interface RiskProfileManagerProps {
  currentUser: User;
  activeSector: ConsignmentType;
  labAnalysisTypes: string[];
  commodityGroups: CommodityGroup[];
  plans: SamplingPlan[];
  onAdd: (plan: SamplingPlan) => void;
  onUpdate: (plan: SamplingPlan) => void;
  onDelete: (id: string) => void;
}

const RiskProfileManager: React.FC<RiskProfileManagerProps> = ({ currentUser, activeSector, labAnalysisTypes, commodityGroups, plans, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Security Check: Ensure user has access to this sector
  const hasSectorAccess = currentUser.role === 'ADMIN' || currentUser.allowedSectors.includes(activeSector);

  // Calculate available products from the commodity groups for the active sector
  const availableProducts = [
    'الكل',
    ...commodityGroups
      .filter(g => g.sector === activeSector)
      .flatMap(g => g.products)
      .sort()
  ];

  // Check read-only status
  const isReadOnly = currentUser?.role === 'VIEWER';

  // Form State
  const initialForm: Partial<SamplingPlan> = {
    productName: '',
    targetImporters: [],
    targetExporters: [],
    targetOrigins: [],
    riskLevel: 'MEDIUM',
    requiredAnalysis: [],
    sampleCount: 1,
    unitsPerSample: 1,
    sampleWeight: '', // Default empty
    monthlyQuota: 10,
    active: true,
    sector: activeSector
  };
  const [formData, setFormData] = useState<Partial<SamplingPlan>>(initialForm);

  // Update default sector in form if prop changes
  useEffect(() => {
      if(!editingId) {
          setFormData(prev => ({ ...prev, sector: activeSector }));
      }
  }, [activeSector]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (isReadOnly) return;
    const { name, value, type } = e.target;
    if (type === 'number') {
        setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isReadOnly) return;
      const { name, value } = e.target;
      // Split by comma and trim whitespace
      const arr = value.split(',').map(s => s.trim()).filter(s => s !== '');
      setFormData(prev => ({ ...prev, [name]: arr }));
  };

  const toggleAnalysis = (analysis: string) => {
      if (isReadOnly) return;
      setFormData(prev => {
          const current = prev.requiredAnalysis || [];
          if (current.includes(analysis)) {
              return { ...prev, requiredAnalysis: current.filter(a => a !== analysis) };
          } else {
              return { ...prev, requiredAnalysis: [...current, analysis] };
          }
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (!formData.productName) return alert("اسم المنتج مطلوب");
    if (!formData.requiredAnalysis?.length) return alert("يجب اختيار فحص واحد على الأقل");

    const payload: SamplingPlan = {
        ...formData as SamplingPlan,
        id: editingId || Math.random().toString(36).substr(2, 9),
    };

    if (editingId) {
        onUpdate(payload);
        setEditingId(null);
    } else {
        onAdd(payload);
    }
    setFormData({ ...initialForm, sector: activeSector });
  };

  const handleEdit = (plan: SamplingPlan) => {
      if (isReadOnly) return;
      setEditingId(plan.id);
      setFormData(plan);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id: string) => {
      if (isReadOnly) return;
      if(window.confirm("هل أنت متأكد من حذف هذه الخطة؟")) {
          onDelete(id);
      }
  };

  const filteredPlans = plans.filter(p => 
      p.sector === activeSector && 
      p.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Access Denied View
  if (!hasSectorAccess) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in text-center p-8">
            <div className="w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center mb-6 border border-red-100 shadow-sm">
                <i className="fas fa-lock text-4xl text-red-500"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-800 mb-2">وصول غير مصرح</h2>
            <p className="text-slate-500 font-medium max-w-md">
                عذراً، ليس لديك الصلاحية لإدارة ملفات المخاطر الخاصة بقطاع <span className="text-slate-800 font-bold">{CONSIGNMENT_LABELS[activeSector]}</span>.
            </p>
            <p className="text-xs text-slate-400 mt-4 bg-slate-100 px-3 py-1 rounded-full">Error: SECTOR_PERM_DENIED</p>
        </div>
      );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-fade-in">
        {/* Form Section */}
        {!isReadOnly && (
        <div className="xl:col-span-1">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden sticky top-8">
                <div className="bg-slate-800 p-8 text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                    <h3 className="text-xl font-black relative z-10 flex items-center gap-3">
                        <i className={`fas ${editingId ? 'fa-edit' : 'fa-clipboard-list'} text-white`}></i>
                        {editingId ? 'تعديل خطة سحب' : 'إضافة خطة مخاطر جديدة'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 font-bold">تحديد معايير سحب العينات للمنتجات الخطرة</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <SearchableSelect
                            label="اسم المنتج المستهدف"
                            value={formData.productName || ''}
                            onChange={(val) => setFormData(prev => ({ ...prev, productName: val }))}
                            options={availableProducts}
                            placeholder="ابحث واختر المنتج من القائمة..."
                        />
                        {availableProducts.length === 0 && (
                            <p className="text-[10px] text-red-500 font-bold">يرجى إضافة منتجات في صفحة "المجموعات السلعية" أولاً</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase">الشركات المستوردة المستهدفة</label>
                            <input 
                                type="text" 
                                name="targetImporters" 
                                placeholder="مثال: شركة أ, شركة ب (افصل بفاصلة)"
                                value={formData.targetImporters?.join(', ') || ''} 
                                onChange={handleArrayInputChange} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase">الشركات المصدرة المستهدفة</label>
                            <input 
                                type="text" 
                                name="targetExporters" 
                                placeholder="مثال: مصنع س, مصنع ص (افصل بفاصلة)"
                                value={formData.targetExporters?.join(', ') || ''} 
                                onChange={handleArrayInputChange} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase">بلدان المنشأ المستهدفة</label>
                            <input 
                                type="text" 
                                name="targetOrigins" 
                                placeholder="مثال: الهند, الصين (افصل بفاصلة)"
                                value={formData.targetOrigins?.join(', ') || ''} 
                                onChange={handleArrayInputChange} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">مستوى الخطورة</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['LOW', 'MEDIUM', 'HIGH'].map(level => (
                                <button
                                    key={level}
                                    type="button"
                                    onClick={() => setFormData({...formData, riskLevel: level as any})}
                                    className={`py-3 rounded-xl text-[10px] font-black border transition-all ${
                                        formData.riskLevel === level 
                                        ? level === 'HIGH' ? 'bg-red-500 text-white border-red-500' : level === 'MEDIUM' ? 'bg-amber-500 text-white border-amber-500' : 'bg-green-500 text-white border-green-500'
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                >
                                    {level === 'HIGH' ? 'عالي' : level === 'MEDIUM' ? 'متوسط' : 'منخفض'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-600 uppercase tracking-widest">الفحوصات المطلوبة</label>
                        <div className="flex flex-wrap gap-2">
                            {labAnalysisTypes.map(analysis => (
                                <button
                                    key={analysis}
                                    type="button"
                                    onClick={() => toggleAnalysis(analysis)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                                        formData.requiredAnalysis?.includes(analysis)
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                                >
                                    {analysis}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase">عدد العينات</label>
                            <input 
                                type="number" 
                                name="sampleCount" 
                                min="1"
                                value={formData.sampleCount ?? 1} 
                                onChange={handleInputChange} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm font-bold text-center"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase">الوحدات</label>
                            <input 
                                type="number" 
                                name="unitsPerSample" 
                                min="1"
                                value={formData.unitsPerSample ?? 1} 
                                onChange={handleInputChange} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm font-bold text-center"
                            />
                        </div>
                        {/* New Sample Weight Field */}
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase">وزن العينة</label>
                            <input 
                                type="text" 
                                name="sampleWeight" 
                                placeholder="مثال: 250g"
                                value={formData.sampleWeight || ''} 
                                onChange={handleInputChange} 
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-sm font-bold text-center"
                            />
                        </div>
                    </div>

                    <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <label className="text-xs font-black text-slate-600 uppercase flex justify-between">
                            <span>الحصة الشهرية (Quota)</span>
                            <span className="text-slate-400">{formData.monthlyQuota} عينة/شهر</span>
                        </label>
                        <input 
                            type="range" 
                            name="monthlyQuota" 
                            min="1" max="100" 
                            value={formData.monthlyQuota ?? 10} 
                            onChange={handleInputChange} 
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-800"
                        />
                        <div className="flex justify-between items-center mt-2 border-t border-slate-200 pt-2">
                            <span className="text-[10px] font-bold text-slate-500">الإجمالي السنوي:</span>
                            <span className="text-sm font-black text-blue-600">{(formData.monthlyQuota || 0) * 12} عينة</span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button type="submit" className="w-full bg-slate-800 text-white font-black py-4 rounded-2xl shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                            <i className="fas fa-save"></i>
                            <span>{editingId ? 'حفظ التعديلات' : 'إضافة الخطة'}</span>
                        </button>
                        {editingId && (
                            <button type="button" onClick={() => { setEditingId(null); setFormData({...initialForm, sector: activeSector}); }} className="w-full mt-3 text-slate-400 font-bold text-xs hover:text-red-500">
                                إلغاء
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
        )}

        {/* List Section */}
        <div className={`${isReadOnly ? 'xl:col-span-3' : 'xl:col-span-2'} space-y-6`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h3 className="text-2xl font-black text-slate-800">سجل خطط سحب العينات</h3>
                    <p className="text-sm text-slate-400 font-bold mt-1">قطاع {CONSIGNMENT_LABELS[activeSector]}</p>
                </div>
                <div className="relative w-full md:w-64">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="بحث عن منتج..." 
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold outline-none focus:border-slate-800"
                    />
                    <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPlans.map(plan => {
                    // Logic to display correct monthly progress (reset locally if needed)
                    const currentMonthStr = new Date().toISOString().slice(0, 7);
                    const displayCount = (plan.lastResetMonth === currentMonthStr) ? (plan.currentMonthCount || 0) : 0;
                    const progress = Math.min(100, (displayCount / plan.monthlyQuota) * 100);

                    return (
                        <div key={plan.id} className="bg-white rounded-[2.5rem] border border-slate-100 p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group">
                            {/* Risk Indicator Strip */}
                            <div className={`absolute top-0 left-0 bottom-0 w-2 ${
                                plan.riskLevel === 'HIGH' ? 'bg-red-500' : plan.riskLevel === 'MEDIUM' ? 'bg-amber-500' : 'bg-green-500'
                            }`}></div>

                            <div className="flex justify-between items-start pl-4 mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-black text-lg text-slate-800">{plan.productName}</h4>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                            plan.riskLevel === 'HIGH' ? 'bg-red-100 text-red-600' : 
                                            plan.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                                        }`}>
                                            {plan.riskLevel} RISK
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {plan.requiredAnalysis.map((a, i) => (
                                            <span key={i} className="text-[9px] bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-500 font-bold">{a}</span>
                                        ))}
                                    </div>
                                </div>
                                {!isReadOnly && (
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(plan)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-all"><i className="fas fa-pen text-xs"></i></button>
                                    <button onClick={() => handleDelete(plan.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all"><i className="fas fa-trash text-xs"></i></button>
                                </div>
                                )}
                            </div>

                            {/* Target Entities Display */}
                            {(plan.targetImporters?.length || plan.targetExporters?.length || plan.targetOrigins?.length) ? (
                                <div className="mb-4 pl-4 space-y-2 border-t border-slate-50 pt-3">
                                    {plan.targetImporters && plan.targetImporters.length > 0 && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase w-16 shrink-0 pt-0.5">المستوردين:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {plan.targetImporters.map((imp, i) => <span key={i} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold">{imp}</span>)}
                                            </div>
                                        </div>
                                    )}
                                    {plan.targetExporters && plan.targetExporters.length > 0 && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase w-16 shrink-0 pt-0.5">المصدرين:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {plan.targetExporters.map((exp, i) => <span key={i} className="text-[9px] bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded font-bold">{exp}</span>)}
                                            </div>
                                        </div>
                                    )}
                                    {plan.targetOrigins && plan.targetOrigins.length > 0 && (
                                        <div className="flex items-start gap-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase w-16 shrink-0 pt-0.5">المنشأ:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {plan.targetOrigins.map((org, i) => <span key={i} className="text-[9px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-bold">{org}</span>)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* Monthly Quota Progress */}
                            <div className="mb-4 px-2">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                    <span>الحصة الشهرية ({displayCount}/{plan.monthlyQuota})</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-center border-t border-slate-50 pt-4">
                                <div className="bg-slate-50 rounded-xl p-2">
                                    <span className="block text-[9px] text-slate-400 font-bold mb-1">العينات/شحنة</span>
                                    <span className="block text-sm font-black text-slate-800">{plan.sampleCount}</span>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-2">
                                    <span className="block text-[9px] text-slate-400 font-bold mb-1">الوحدات</span>
                                    <span className="block text-sm font-black text-slate-800">{plan.unitsPerSample}</span>
                                </div>
                                {/* Display Sample Weight */}
                                <div className="bg-slate-50 rounded-xl p-2">
                                    <span className="block text-[9px] text-slate-400 font-bold mb-1">وزن العينة</span>
                                    <span className="block text-sm font-black text-slate-800">{plan.sampleWeight || '-'}</span>
                                </div>
                                {/* Display Annual Total */}
                                <div className="bg-blue-50 rounded-xl p-2 border border-blue-100">
                                    <span className="block text-[9px] text-blue-400 font-bold mb-1">الإجمالي السنوي</span>
                                    <span className="block text-sm font-black text-blue-700">{plan.monthlyQuota * 12}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredPlans.length === 0 && (
                    <div className="col-span-full py-16 text-center text-slate-300">
                        <i className="fas fa-file-contract text-4xl mb-3 opacity-30"></i>
                        <p className="text-xs font-bold">لا توجد خطط مسجلة لهذا القطاع</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default RiskProfileManager;
