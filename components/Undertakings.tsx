import React, { useState, useMemo, useEffect } from 'react';
import { Consignment, AuditLogEntry, User } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Building2, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronDown, 
  Fingerprint, 
  Stamp, 
  X,
  ArrowUpRight,
  History,
  ShieldCheck,
  Calendar,
  AlertCircle,
  FileSignature,
  Archive,
  MoreVertical,
  LayoutGrid,
  List,
  ShieldAlert,
  Gavel,
  FileCheck,
  Timer,
  Beaker
} from 'lucide-react';

interface UndertakingsProps {
    consignments: Consignment[];
    onUpdateConsignment: (consignment: Consignment) => void;
    currentUser?: User;
}

const Undertakings: React.FC<UndertakingsProps> = ({ consignments, onUpdateConsignment, currentUser }) => {
  const [selectedConsignment, setSelectedConsignment] = useState<Consignment | null>(null);
  const [activeTab, setActiveTab] = useState<'NEW' | 'ACTIVE' | 'COMPANIES'>('ACTIVE');
  const [template, setTemplate] = useState('UN-1');
  const [signed, setSigned] = useState(false);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'NEWEST' | 'OLDEST' | 'EXPIRY'>('NEWEST');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const isReadOnly = currentUser?.role === 'VIEWER';

  // --- Filter consignments by allowed sectors ---
  const userConsignments = useMemo(() => {
    if (!currentUser || currentUser.role === 'ADMIN') return consignments;
    const allowed = currentUser.allowedSectors || [];
    if (allowed.length === 0) return consignments;
    return consignments.filter(c => allowed.includes(c.type));
  }, [consignments, currentUser]);

  const templates = [
    { id: 'UN-1', name: 'تعهد بعدم التصرف', content: 'أتعهد أنا الموقع أدناه بعدم التصرف في الإرسالية الموضحة أعلاه إلا بعد الحصول على الموافقة النهائية من السلطة المختصة بميناء صحار، وأتحمل كامل المسؤولية القانونية في حال مخالفة ذلك.' },
    { id: 'UN-2', name: 'تعهد بإعادة التصدير', content: 'أقر أنا المستلم بضرورة إعادة تصدير البضاعة في حال عدم مطابقة النتائج للمواصفات القياسية المعتمدة خلال فترة لا تتجاوز ٣٠ يوماً من تاريخ استلام الإشعار، مع تحمل كافة التكاليف المترتبة.' },
    { id: 'UN-3', name: 'تعهد استكمال نواقص', content: 'نلتزم باستكمال النواقص المستندية (شهادة صحية / فاتورة / قائمة تعبئة) خلال ٧٢ ساعة من تاريخ هذا التعهد مع الإقرار بتحمل كافة التبعات القانونية في حال التأخير.' },
    { id: 'UN-4', name: 'تعهد سحب عينة', content: 'نقر باستلام عينة من الإرسالية لغرض الفحص المخبري ونلتزم بعدم التصرف في باقي الشحنة حتى ظهور النتائج النهائية.' }
  ];

  // --- Statistics ---
  const stats = useMemo(() => {
      const active = userConsignments.filter(c => c.hasUndertaking && !c.isUndertakingMet);
      const overdue = active.filter(c => {
          if(!c.undertakingCompletionDate) return false;
          return new Date(c.undertakingCompletionDate) < new Date();
      });
      const completed = userConsignments.filter(c => c.hasUndertaking && c.isUndertakingMet);
      const dueSoon = active.filter(c => {
          if(!c.undertakingCompletionDate) return false;
          const due = new Date(c.undertakingCompletionDate).getTime();
          const diff = (due - new Date().getTime()) / (1000 * 60 * 60 * 24);
          return diff >= 0 && diff <= 3;
      });
      
      return {
          activeCount: active.length,
          overdueCount: overdue.length,
          completedCount: completed.length,
          dueSoonCount: dueSoon.length
      };
  }, [userConsignments]);

  // --- Filtering & Sorting ---
  const processedList = useMemo(() => {
      let list: Consignment[] = [];

      if (activeTab === 'NEW') {
          list = userConsignments.filter(c => !c.hasUndertaking && c.status !== 'Approved');
      } else if (activeTab === 'ACTIVE') {
          list = userConsignments.filter(c => c.hasUndertaking && !c.isUndertakingMet);
      } else {
          return []; 
      }

      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          list = list.filter(c => 
              c.bayanNumber.toLowerCase().includes(term) ||
              c.importer.toLowerCase().includes(term) ||
              c.undertakingType?.toLowerCase().includes(term)
          );
      }

      if (activeTab === 'ACTIVE' && filterStatus !== 'ALL') {
          const today = new Date().getTime();
          list = list.filter(c => {
              if (!c.undertakingCompletionDate) return false;
              const due = new Date(c.undertakingCompletionDate).getTime();
              if (filterStatus === 'OVERDUE') return due < today;
              if (filterStatus === 'DUE_SOON') {
                  const diffDays = (due - today) / (1000 * 60 * 60 * 24);
                  return diffDays >= 0 && diffDays <= 3;
              }
              return true;
          });
      }

      list.sort((a, b) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          const expiryA = a.undertakingCompletionDate ? new Date(a.undertakingCompletionDate).getTime() : 0;
          const expiryB = b.undertakingCompletionDate ? new Date(b.undertakingCompletionDate).getTime() : 0;

          if (sortOrder === 'NEWEST') return dateB - dateA;
          if (sortOrder === 'OLDEST') return dateA - dateB;
          if (sortOrder === 'EXPIRY') {
              if (!expiryA) return 1;
              if (!expiryB) return -1;
              return expiryA - expiryB;
          }
          return 0;
      });

      return list;
  }, [userConsignments, activeTab, searchTerm, sortOrder, filterStatus]);

  // --- Company Registry Logic ---
  const undertakingsByImporter = useMemo(() => {
      return userConsignments
        .filter(c => c.hasUndertaking)
        .reduce((acc, curr) => {
            if (!acc[curr.importer]) {
                acc[curr.importer] = { active: [], completed: [], riskScore: 0 };
            }
            if (searchTerm && !curr.importer.toLowerCase().includes(searchTerm.toLowerCase()) && !curr.bayanNumber.includes(searchTerm)) {
                return acc;
            }

            if (curr.isUndertakingMet) {
                acc[curr.importer].completed.push(curr);
            } else {
                acc[curr.importer].active.push(curr);
            }
            
            const overdueCount = acc[curr.importer].active.filter(c => c.undertakingCompletionDate && new Date(c.undertakingCompletionDate) < new Date()).length;
            acc[curr.importer].riskScore = (overdueCount * 20) + (acc[curr.importer].active.length * 5);
            
            return acc;
        }, {} as Record<string, { active: Consignment[], completed: Consignment[], riskScore: number }>);
  }, [userConsignments, searchTerm]);

  const importersWithUndertakings = Object.keys(undertakingsByImporter).sort();

  const handleSign = () => {
    if (isReadOnly) return;
    setSigned(true);
  };

  const handleSubmitUndertaking = () => {
      if (isReadOnly || !selectedConsignment || !signed) return;

      const logEntry: AuditLogEntry = {
          timestamp: new Date().toISOString(),
          action: 'إصدار تعهد',
          user: currentUser?.name || 'System',
          details: `تم توقيع تعهد رقم ${template}: ${templates.find(t => t.id === template)?.name}`,
          statusChange: 'Pending'
      };

      const defaultExpiry = new Date();
      defaultExpiry.setDate(defaultExpiry.getDate() + 30);

      const updated: Consignment = {
          ...selectedConsignment,
          hasUndertaking: true,
          undertakingType: templates.find(t => t.id === template)?.name,
          undertakingCompletionDate: selectedConsignment.undertakingCompletionDate || defaultExpiry.toISOString().split('T')[0],
          isLocked: true,
          isUndertakingMet: false,
          auditLog: [...(selectedConsignment.auditLog || []), logEntry]
      };

      onUpdateConsignment(updated);
      setSelectedConsignment(null);
      setSigned(false);
      setActiveTab('ACTIVE'); 
  };

  const handleCloseUndertaking = () => {
      if (isReadOnly || !selectedConsignment) return;

      const closureRef = window.prompt("تأكيد إغلاق التعهد:\nالرجاء إدخال رقم الإيصال المالي أو ملاحظة الاستيفاء:", "");
      if (closureRef === null) return;

      const logEntry: AuditLogEntry = {
          timestamp: new Date().toISOString(),
          action: 'إغلاق تعهد (استيفاء)',
          user: currentUser?.name || 'System', 
          details: `تم استيفاء الشروط وفك القفل. المرجع: ${closureRef || 'بدون ملاحظات'}`,
          statusChange: 'Approved'
      };

      const updated: Consignment = {
          ...selectedConsignment,
          isUndertakingMet: true,
          isLocked: false,
          status: 'Approved',
          technicalAction: 'إفراج نهائي',
          remarks: selectedConsignment.remarks ? `${selectedConsignment.remarks}\n[تعهد مستوفى: ${closureRef}]` : `[تعهد مستوفى: ${closureRef}]`,
          auditLog: [...(selectedConsignment.auditLog || []), logEntry]
      };

      onUpdateConsignment(updated);
      setSelectedConsignment(null);
      setExpandedCompany(updated.importer);
      setActiveTab('COMPANIES');
  };

  const getProgress = (startDate: string, endDate: string) => {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      const now = new Date().getTime();
      const total = end - start;
      const elapsed = now - start;
      const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));
      const isOverdue = now > end;
      const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      return { pct, isOverdue, daysLeft };
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans">
        
        {/* --- Modern Stats Dashboard --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard label="التعهدات النشطة" value={stats.activeCount} icon={<FileSignature className="w-5 h-5" />} color="bg-slate-100 text-slate-600" />
            <StatCard label="متجاوزة للمدة" value={stats.overdueCount} icon={<ShieldAlert className="w-5 h-5" />} color="bg-red-100 text-red-600" pulse={stats.overdueCount > 0} />
            <StatCard label="تنتهي قريباً" value={stats.dueSoonCount} icon={<Timer className="w-5 h-5" />} color="bg-amber-100 text-amber-600" />
            <StatCard label="تم استيفاؤها" value={stats.completedCount} icon={<FileCheck className="w-5 h-5" />} color="bg-green-100 text-green-600" />
        </div>

        {/* --- Main Content Layout --- */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Left Column: List & Filters */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Modern Toolbar */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                          <Gavel className="w-6 h-6 text-[#c8102e]" />
                          إدارة التعهدات
                        </h3>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 shrink-0">
                            <button onClick={() => setViewMode('grid')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}><LayoutGrid className="w-4 h-4" /></button>
                            <button onClick={() => setViewMode('table')} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}><List className="w-4 h-4" /></button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative group">
                            <input 
                              type="text" 
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              placeholder="بحث برقم البيان أو اسم الشركة..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pr-12 pl-4 text-sm font-bold text-slate-700 outline-none focus:ring-4 focus:ring-red-500/5 focus:border-[#c8102e] transition-all"
                            />
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        </div>

                        <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-2xl">
                            {['ACTIVE', 'NEW', 'COMPANIES'].map(tab => (
                                <button 
                                  key={tab} 
                                  onClick={() => { setActiveTab(tab as any); setSelectedConsignment(null); }} 
                                  className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${activeTab === tab ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-500 hover:bg-white/50'}`}
                                >
                                    {tab === 'ACTIVE' ? 'سارية' : tab === 'NEW' ? 'إصدار' : 'الشركات'}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'ACTIVE' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="relative">
                                <select 
                                  value={filterStatus}
                                  onChange={(e) => setFilterStatus(e.target.value as any)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none cursor-pointer"
                                >
                                  <option value="ALL">جميع الحالات</option>
                                  <option value="OVERDUE">متأخرة</option>
                                  <option value="DUE_SOON">تنتهي قريباً</option>
                                </select>
                                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                            </div>
                            <div className="relative">
                                <select 
                                  value={sortOrder}
                                  onChange={(e) => setSortOrder(e.target.value as any)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 appearance-none cursor-pointer"
                                >
                                  <option value="NEWEST">الأحدث</option>
                                  <option value="EXPIRY">تاريخ الانتهاء</option>
                                </select>
                                <History className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5 pointer-events-none" />
                            </div>
                          </div>
                        )}
                    </div>
                </div>

                {/* List View Scroll Area */}
                <div className="max-h-[700px] overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  <AnimatePresence mode="popLayout">
                    {activeTab !== 'COMPANIES' ? (
                      processedList.map((c, idx) => {
                        const { pct, isOverdue, daysLeft } = c.undertakingCompletionDate ? getProgress(c.createdAt, c.undertakingCompletionDate) : { pct: 0, isOverdue: false, daysLeft: 0 };
                        const isSelected = selectedConsignment?.id === c.id;

                        return (
                          <motion.div
                            key={`${c.id}-${idx}`}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.03 }}
                            onClick={() => { setSelectedConsignment(c); setSigned(false); }}
                            className={`p-5 rounded-[2.5rem] border-2 transition-all cursor-pointer group relative overflow-hidden ${
                              isSelected 
                                ? 'border-slate-800 bg-slate-50 ring-4 ring-slate-100' 
                                : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-lg'
                            }`}
                          >
                            <div className={`absolute top-0 right-0 w-1.5 h-full ${isOverdue ? 'bg-red-500' : activeTab === 'NEW' ? 'bg-blue-500' : 'bg-emerald-500'}`}></div>
                            
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOverdue ? 'bg-red-50 text-red-600' : activeTab === 'NEW' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                  {isOverdue ? <ShieldAlert className="w-5 h-5" /> : activeTab === 'NEW' ? <FileSignature className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{c.bayanNumber}</span>
                                    {isOverdue && activeTab === 'ACTIVE' && (
                                      <span className="text-[8px] font-black bg-red-50 text-red-600 px-1.5 py-0.5 rounded uppercase">Overdue</span>
                                    )}
                                  </div>
                                  <h4 className="font-black text-slate-800 text-sm truncate max-w-[180px]">{c.importer}</h4>
                                </div>
                              </div>
                              <div className={`p-2 rounded-xl transition-colors ${isSelected ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-400 group-hover:bg-slate-100'}`}>
                                <ChevronLeft size={16} />
                              </div>
                            </div>

                            {activeTab === 'ACTIVE' && c.undertakingCompletionDate && (
                              <div className="mt-4 space-y-2">
                                <div className="flex justify-between items-center text-[10px] font-black">
                                  <span className="text-slate-500">
                                    {isOverdue ? `متأخر منذ ${Math.abs(daysLeft)} يوم` : `متبقي ${daysLeft} يوم`}
                                  </span>
                                  <span className="text-slate-900">{Math.round(pct)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${pct}%` }}
                                    className={`h-full rounded-full ${isOverdue ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  />
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="grid grid-cols-1 gap-4">
                        {importersWithUndertakings.map((importer, idx) => {
                          const data = undertakingsByImporter[importer];
                          const isExpanded = expandedCompany === importer;
                          const riskColor = data.riskScore > 30 ? 'text-red-600 bg-red-50 border-red-100' : data.riskScore > 10 ? 'text-amber-600 bg-amber-50 border-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100';

                          return (
                            <motion.div
                              key={`${importer}-${idx}`}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all ${isExpanded ? 'ring-4 ring-slate-100' : 'hover:shadow-md'}`}
                            >
                              <div 
                                className="p-6 flex justify-between items-center cursor-pointer"
                                onClick={() => setExpandedCompany(isExpanded ? null : importer)}
                              >
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-100">
                                    <Building2 size={24} />
                                  </div>
                                  <div>
                                    <h4 className="font-black text-lg text-slate-800">{importer}</h4>
                                    <div className="flex gap-2 mt-1">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compliance Score:</span>
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${riskColor}`}>
                                        {100 - data.riskScore}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-left">
                                    <p className="text-xs font-black text-slate-800">{data.active.length} نشط</p>
                                    <p className="text-[10px] font-bold text-slate-400">{data.completed.length} مكتمل</p>
                                  </div>
                                  <ChevronDown size={18} className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </div>
                              </div>

                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div 
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="bg-slate-50 border-t border-slate-100 p-6 space-y-6"
                                  >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                      <div className="space-y-3">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                          <Clock size={12} /> التعهدات النشطة
                                        </h5>
                                        {data.active.map(c => (
                                          <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
                                            <div>
                                              <p className="text-xs font-black text-slate-800">{c.undertakingType}</p>
                                              <p className="text-[10px] text-slate-400 font-mono font-bold">{c.bayanNumber}</p>
                                            </div>
                                            <button 
                                              onClick={() => { setSelectedConsignment(c); setActiveTab('ACTIVE'); }}
                                              className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-black transition-all shadow-lg shadow-slate-200"
                                            >
                                              <ArrowUpRight size={16} />
                                            </button>
                                          </div>
                                        ))}
                                        {data.active.length === 0 && <p className="text-[10px] text-slate-300 italic px-2">لا توجد تعهدات نشطة</p>}
                                      </div>
                                      <div className="space-y-3">
                                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                          <Archive size={12} /> السجل المؤرشف
                                        </h5>
                                        {data.completed.slice(0, 3).map(c => (
                                          <div key={c.id} className="bg-white/50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                                            <div>
                                              <p className="text-xs font-bold text-slate-500">{c.undertakingType}</p>
                                              <p className="text-[10px] text-slate-400 font-mono">{c.bayanNumber}</p>
                                            </div>
                                            <CheckCircle2 size={16} className="text-emerald-500" />
                                          </div>
                                        ))}
                                        {data.completed.length > 3 && (
                                          <button className="w-full text-center text-[10px] font-black text-slate-400 hover:text-slate-600 py-2">عرض الكل ({data.completed.length})</button>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </AnimatePresence>

                  {processedList.length === 0 && activeTab !== 'COMPANIES' && (
                    <div className="py-20 text-center bg-white rounded-[3rem] border border-slate-100">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-slate-400 font-black text-sm">لا توجد نتائج تطابق البحث</p>
                    </div>
                  )}
                </div>
            </div>

            {/* Right Column: Action Center (Glassmorphism inspired) */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {!selectedConsignment ? (
                  <motion.div 
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-slate-300 bg-white rounded-[3rem] border border-slate-100 border-dashed p-12 text-center"
                  >
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                      <FileSignature className="w-12 h-12 opacity-20" />
                    </div>
                    <h4 className="text-xl font-black text-slate-800 mb-2">مركز الإجراءات القانونية</h4>
                    <p className="text-sm max-w-xs leading-relaxed">اختر إرسالية من القائمة للبدء في إصدار تعهد جديد أو إدارة التعهدات القائمة وفك القيود.</p>
                  </motion.div>
                ) : (
                  <motion.div 
                    key={selectedConsignment.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col sticky top-8"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-widest">
                                {activeTab === 'NEW' ? 'إصدار جديد' : 'قيد نشط'}
                              </span>
                              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded uppercase tracking-widest">بيان: {selectedConsignment.bayanNumber}</span>
                            </div>
                            <h3 className="text-2xl font-black text-slate-900">{selectedConsignment.importer}</h3>
                        </div>
                        <button 
                          onClick={() => setSelectedConsignment(null)}
                          className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all"
                        >
                          <X size={20} />
                        </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 space-y-8">
                      {activeTab === 'NEW' ? (
                        <div className="space-y-8 animate-fade-in">
                          <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                              <FileText size={12} /> اختر نوع التعهد المطلوب
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                              {templates.map(t => (
                                <button
                                  key={t.id}
                                  onClick={() => setTemplate(t.id)}
                                  className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col gap-1 ${
                                    template === t.id 
                                      ? 'border-slate-800 bg-slate-50 shadow-lg shadow-slate-200' 
                                      : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                  }`}
                                >
                                  <p className="text-xs font-black">{t.name}</p>
                                  <p className="text-[9px] font-bold opacity-50 uppercase">{t.id}</p>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Document Preview (Innovative Look) */}
                          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 relative overflow-hidden shadow-inner">
                            <Stamp size={120} className="absolute -top-6 -left-6 text-slate-200/40 rotate-12 pointer-events-none" />
                            <div className="relative z-10 space-y-6">
                              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                <h4 className="font-black text-slate-900 text-sm">مستند تعهد قانوني رسمي</h4>
                                <span className="text-[10px] font-mono font-bold text-slate-400">REF: {selectedConsignment.bayanNumber}</span>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed text-justify font-serif italic">
                                "{templates.find(t => t.id === template)?.content}"
                              </p>
                              <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">توقيع المصادقة</p>
                                  <div className="w-32 h-10 border-b-2 border-dashed border-slate-300"></div>
                                </div>
                                <div className="text-left space-y-1">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">تاريخ الإصدار</p>
                                  <p className="text-xs font-mono font-black text-slate-900">{new Date().toLocaleDateString('ar-OM')}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Digital Sign Action */}
                          <button 
                            onClick={handleSign}
                            disabled={signed || isReadOnly}
                            className={`w-full p-6 rounded-[2rem] border-2 border-dashed transition-all flex flex-col items-center gap-3 ${
                              signed 
                                ? 'bg-green-50 border-green-200 text-green-600' 
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400 hover:bg-slate-50'
                            }`}
                          >
                            {signed ? (
                              <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center gap-2">
                                <ShieldCheck size={32} />
                                <span className="text-xs font-black">تمت المصادقة الرقمية بنجاح</span>
                              </motion.div>
                            ) : (
                              <>
                                <Fingerprint size={32} />
                                <span className="text-xs font-black">انقر هنا لإتمام التوقيع الرقمي والمصادقة</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-8 animate-fade-in">
                          <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100 text-center space-y-4 shadow-sm">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-500/10">
                              <ShieldAlert size={32} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-lg font-black text-red-900">المعاملة مقيدة قانونياً</h4>
                              <p className="text-xs text-red-600 font-bold">يمنع الإفراج النهائي عن الإرسالية حتى استيفاء كافة شروط التعهد</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <DetailItem label="نوع التعهد" value={selectedConsignment.undertakingType} icon={<FileText className="w-4 h-4" />} />
                            <DetailItem label="تاريخ الاستحقاق" value={selectedConsignment.undertakingCompletionDate} icon={<Calendar className="w-4 h-4" />} />
                          </div>

                          <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">المتطلبات المعلقة</label>
                            <div className="flex flex-wrap gap-2">
                              <span className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-700 shadow-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> الأصل المستندي
                              </span>
                              <span className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-700 shadow-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> تقرير المختبر النهائي
                              </span>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                              <History size={14} /> سجل العمليات الأخير
                            </h5>
                            <div className="space-y-3">
                              {selectedConsignment.auditLog?.slice(-3).map((log, i) => (
                                <div key={i} className="text-xs p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                  <div className="flex justify-between text-[10px] font-black text-slate-400 mb-2 uppercase tracking-tighter">
                                    <span>بواسطة: {log.user}</span>
                                    <span>{new Date(log.timestamp).toLocaleString('ar-OM')}</span>
                                  </div>
                                  <p className="text-slate-800 font-bold leading-relaxed">{log.details}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-10 pt-8 border-t border-slate-50">
                      {!isReadOnly && (
                        activeTab === 'NEW' ? (
                          <button 
                            onClick={handleSubmitUndertaking}
                            disabled={!signed}
                            className="w-full bg-slate-900 text-white font-black py-5 rounded-[2rem] text-lg shadow-xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                            <FileSignature size={24} />
                            إصدار التعهد وقفل المعاملة
                          </button>
                        ) : (
                          <button 
                            onClick={handleCloseUndertaking}
                            className="w-full bg-green-600 text-white font-black py-5 rounded-[2rem] text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3 shadow-green-500/20"
                          >
                            <CheckCircle2 size={24} />
                            تأكيد الاستيفاء وفك القيد القانوني
                          </button>
                        )
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
        </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color, pulse }: any) => (
  <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md group">
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center relative ${color}`}>
      {icon}
      {pulse && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
    </div>
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-800">{value}</p>
    </div>
  </div>
);

const DetailItem = ({ label, value, icon, status }: any) => (
    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-white text-slate-400 border border-slate-100 shadow-sm`}>
          {icon}
        </div>
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
          <p className="text-xs font-black text-slate-800">{value}</p>
        </div>
    </div>
);

export default Undertakings;
