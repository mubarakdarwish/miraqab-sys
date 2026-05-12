
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Consignment, ConsignmentType, AuditLogEntry, User, Port } from '../types';
import { CONSIGNMENT_LABELS } from '../constants';
import { DataTable } from './DataTable';
import { ColumnDef } from '@tanstack/react-table';

interface LogisticsPortalProps {
  consignments: Consignment[];
  onUpdate: (c: Consignment) => Promise<void>; 
  currentUser: User;
  activeSector: ConsignmentType;
  ports?: Port[]; 
}

const LogisticsPortal: React.FC<LogisticsPortalProps> = ({ consignments, onUpdate, currentUser, activeSector, ports = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterOriginPort, setFilterOriginPort] = useState('ALL');
  const [filterTargetPort, setFilterTargetPort] = useState('ALL');
  const [filterSector, setFilterSector] = useState('ALL');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const navigate = useNavigate();
  const userAssignedPortNames = useMemo(() => {
    if (!currentUser || !ports.length) return [];
    if (currentUser.role === 'ADMIN') return ports.map(p => p.name);
    const assignedIds = currentUser.assignedPorts || [];
    return ports.filter(p => assignedIds.includes(p.id)).map(p => p.name);
  }, [currentUser, ports]);

  const isLogisticsUser = useMemo(() => {
    if (currentUser.role === 'ADMIN' || currentUser.role === 'LOGISTICS') return true;
    const assignedIds = currentUser.assignedPorts || [];
    const assignedPorts = ports.filter(p => assignedIds.includes(p.id));
    return assignedPorts.some(p => p.type === 'LOGISTICS');
  }, [currentUser, ports]);

  // Statistics for Logistics Dashboard
  const stats = useMemo(() => {
    const pending = consignments.filter(c => {
        const isTransfer = c.technicalAction === 'تحويل' || (c.technicalAction === 'إفراج مشروط' && c.transferTo?.includes('اللوجستية'));
        return isTransfer && !c.logisticsArrivalDate && userAssignedPortNames.includes(c.transferTo || '');
    }).length;

    const arrivedToday = consignments.filter(c => {
        if (!c.logisticsArrivalDate) return false;
        const arrivalDate = new Date(c.logisticsArrivalDate).toDateString();
        const today = new Date().toDateString();
        return arrivalDate === today && userAssignedPortNames.includes(c.transferTo || '');
    }).length;

    const inTransit = consignments.filter(c => c.technicalAction === 'تحويل' && !c.logisticsArrivalDate).length;

    return { pending, arrivedToday, inTransit };
  }, [consignments, userAssignedPortNames]);

  const logisticsConsignments = useMemo(() => {
      let filtered = consignments.filter(c => {
          const isExplicitTransfer = c.technicalAction === 'تحويل';
          const isConditionalTransfer = c.technicalAction === 'إفراج مشروط' && 
                                      (c.transferTo?.includes('اللوجستية') || c.conditionalReleaseType === 'تحويل للمدينة اللوجستية');
          const isCompletedTransfer = c.transferTo && c.port === c.transferTo; 

          if (!(isExplicitTransfer || isConditionalTransfer || isCompletedTransfer)) return false;

          if (isLogisticsUser) {
              const matchesTarget = filterTargetPort === 'ALL' || c.transferTo === filterTargetPort;
              const isAssignedToThisTerminal = currentUser.role === 'ADMIN' || userAssignedPortNames.includes(c.transferTo || '');
              
              if (!isAssignedToThisTerminal) return false;
              if (!matchesTarget) return false;
              
              if (filterOriginPort !== 'ALL' && (c.originPort || c.port) !== filterOriginPort) return false;
              if (filterSector !== 'ALL' && c.type !== filterSector) return false;
          } else {
              const originatedFromMyPort = userAssignedPortNames.includes(c.originPort || c.port);
              if (!originatedFromMyPort) return false;
              if (c.type !== activeSector) return false;
          }

          const hasArrived = !!c.logisticsArrivalDate;
          if (activeTab === 'PENDING') {
              return !hasArrived || (hasArrived && c.port !== c.transferTo);
          } else {
              return hasArrived && (c.port === c.transferTo || c.status === 'Approved' || c.status === 'Rejected');
          }
      });

      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filtered = filtered.filter(c => 
              c.bayanNumber.toLowerCase().includes(term) ||
              c.importer.toLowerCase().includes(term)
          );
      }

      return filtered;
  }, [consignments, currentUser, activeTab, searchTerm, userAssignedPortNames, isLogisticsUser, filterOriginPort, filterTargetPort, filterSector, activeSector]);

  const handleConfirmArrival = async (c: Consignment) => {
      if (window.confirm(`تأكيد استلام الشحنة رقم ${c.bayanNumber} في ${c.transferTo}؟\n\nسيتم نقل المعاملة إلى السجل اليومي للمحطة لإجراء المعاينة والتخليص.`)) {
          setProcessingId(c.id);
          try {
              const logEntry: AuditLogEntry = {
                  timestamp: new Date().toISOString(),
                  action: 'تأكيد وصول (نقل ملكية)',
                  user: currentUser.name,
                  details: `تم استلام الإرسالية في ${c.transferTo} بواسطة ${currentUser.name}. انتقلت المسؤولية رسمياً من ${c.originPort || c.port}.`
              };

              const updated: Consignment = {
                  ...c,
                  logisticsArrivalDate: new Date().toISOString(),
                  originPort: c.originPort || c.port,
                  port: c.transferTo || c.port, 
                  inspectionLocation: c.transferTo || c.port, // تغيير موقع المعاينة
                  logisticsReceiverName: currentUser.name, // تعيين اسم الموظف اللوجستي
                  technicalAction: 'استلام في اللوجستية', 
                  status: 'Pending', 
                  inspectionResult: 'قيد الفحص', 
                  isLocked: false, 
                  items: c.items.map(item => ({ ...item, technicalAction: 'استلام في اللوجستية' })),
                  auditLog: [...(c.auditLog || []), logEntry]
              };
              await onUpdate(updated);
          } catch (error) {
              alert("حدث خطأ أثناء الاتصال بقاعدة البيانات");
          } finally {
              setProcessingId(null);
          }
      }
  };

  const handleFinalAction = async (c: Consignment, action: 'APPROVE' | 'REJECT') => {
      const note = window.prompt(action === 'APPROVE' ? 'ملاحظات الإفراج اللوجستي:' : 'سبب الرفض القطعي:');
      if (action === 'REJECT' && !note) return;

      setProcessingId(c.id);
      try {
          const logEntry: AuditLogEntry = {
              timestamp: new Date().toISOString(),
              action: action === 'APPROVE' ? 'إفراج نهائي (محطة لوجستية)' : 'رفض نهائي (محطة لوجستية)',
              user: currentUser.name,
              details: `إجراء نهائي من المحطة. ${note ? `ملاحظات: ${note}` : ''}`,
              statusChange: action === 'APPROVE' ? 'Approved' : 'Rejected'
          };

          const updated: Consignment = {
              ...c,
              status: action === 'APPROVE' ? 'Approved' : 'Rejected',
              technicalAction: action === 'APPROVE' ? 'إفراج نهائي' : 'رفض',
              inspectionResult: action === 'APPROVE' ? 'مطابق' : 'غير مطابق',
              remarks: (c.remarks || '') + (note ? `\n[إجراء لوجستي]: ${note}` : ''),
              isLocked: true, 
              items: c.items.map(item => ({ 
                  ...item, 
                  technicalAction: action === 'APPROVE' ? 'إفراج نهائي' : 'رفض',
                  rejectionReason: action === 'REJECT' ? note : undefined
              })),
              auditLog: [...(c.auditLog || []), logEntry]
          };
          await onUpdate(updated);
      } catch (error) {
          alert("فشل تحديث حالة الإرسالية");
      } finally {
          setProcessingId(null);
      }
  };

  const handleBatchConfirmArrival = async () => {
    const toConfirm = logisticsConsignments.filter(c => !c.logisticsArrivalDate);
    if (toConfirm.length === 0) return;
    
    if (window.confirm(`تأكيد استلام جميع الإرساليات القابلة للاستلام في القائمة الحالية؟ (عدد: ${toConfirm.length})`)) {
        setIsBatchProcessing(true);
        try {
            for (const c of toConfirm) {
                const logEntry: AuditLogEntry = {
                    timestamp: new Date().toISOString(),
                    action: 'تأكيد وصول (دفعي)',
                    user: currentUser.name,
                    details: `تم الاستلام الدفعي في ${c.transferTo} بواسطة ${currentUser.name}.`
                };
                const updated: Consignment = {
                    ...c,
                    logisticsArrivalDate: new Date().toISOString(),
                    originPort: c.originPort || c.port,
                    port: c.transferTo || c.port,
                    inspectionLocation: c.transferTo || c.port, // تغيير موقع المعاينة
                    logisticsReceiverName: currentUser.name, // تعيين اسم الموظف اللوجستي
                    technicalAction: 'استلام في اللوجستية',
                    status: 'Pending',
                    auditLog: [...(c.auditLog || []), logEntry]
                };
                await onUpdate(updated);
            }
        } catch (error) {
            alert("حدث خطأ أثناء المعالجة الدفعية");
        } finally {
            setIsBatchProcessing(false);
        }
    }
  };

  const columns = useMemo<ColumnDef<Consignment>[]>(() => [
    {
        id: 'statusIcon',
        header: '',
        cell: (info) => {
            const c = info.row.original;
            const hasArrived = !!c.logisticsArrivalDate;
            const isOwnershipTransferred = c.port === c.transferTo;
            return (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${isOwnershipTransferred ? 'bg-green-500' : hasArrived ? 'bg-blue-500' : 'bg-amber-500'} shadow-sm`}>
                    <i className={`fas ${isOwnershipTransferred ? 'fa-check-circle' : hasArrived ? 'fa-truck-loading' : 'fa-truck-moving'} text-[10px]`}></i>
                </div>
            );
        }
    },
    {
        id: 'journey',
        header: 'مسار التحويل',
        cell: (info) => {
            const c = info.row.original;
            const hasArrived = !!c.logisticsArrivalDate;
            const isFinished = c.status === 'Approved' || c.status === 'Rejected';
            
            return (
                <div className="flex items-center gap-1 w-32">
                    <div className="w-2 h-2 rounded-full bg-blue-500" title={c.originPort || c.port}></div>
                    <div className={`flex-1 h-0.5 ${hasArrived ? 'bg-blue-500' : 'bg-slate-200 dashed-border'}`}></div>
                    <div className={`w-3 h-3 rounded-full flex items-center justify-center ${hasArrived ? 'bg-blue-500' : 'bg-white border-2 border-slate-300'}`}>
                        {hasArrived && <i className="fas fa-check text-[6px] text-white"></i>}
                    </div>
                    <div className={`flex-1 h-0.5 ${isFinished ? 'bg-green-500' : 'bg-slate-200'}`}></div>
                    <div className={`w-2 h-2 rounded-full ${isFinished ? 'bg-green-500' : 'bg-slate-200'}`} title="نتيجة نهائية"></div>
                </div>
            );
        }
    },
    {
        accessorKey: 'bayanNumber',
        header: 'رقم البيان',
        cell: (info) => <span className="font-mono font-black text-slate-800">{info.getValue() as string}</span>
    },
    {
        accessorKey: 'importer',
        header: 'المستورد',
        cell: (info) => <span className="font-bold text-slate-700">{info.getValue() as string}</span>
    },
    {
        accessorKey: 'type',
        header: 'القطاع',
        cell: (info) => {
            const val = info.getValue() as string;
            const sectorColor = val === 'VETERINARY' ? 'amber' : val === 'AGRICULTURAL' ? 'emerald' : 'blue';
            return <span className={`bg-${sectorColor}-50 text-${sectorColor}-700 px-2 py-1 rounded text-[9px] font-black border border-${sectorColor}-100`}>{CONSIGNMENT_LABELS[val]}</span>;
        }
    },
    {
        accessorKey: 'port',
        header: 'الموقع الحالي',
        cell: (info) => {
            const val = info.getValue() as string;
            const c = info.row.original;
            return <span className={`text-[10px] font-bold ${val === c.transferTo ? 'text-green-600' : 'text-slate-500'}`}>{val}</span>;
        }
    },
    {
        id: 'transferParties',
        header: 'أطراف التحويل',
        cell: (info) => {
            const c = info.row.original;
            return (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5" title="محيل المعاملة">
                        <i className="fas fa-paper-plane text-[9px] text-indigo-400"></i>
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{c.inspectorName || 'غير محدد'}</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="مستلم المعاملة">
                        <i className="fas fa-inbox text-[9px] text-emerald-500"></i>
                        {c.logisticsReceiverName ? (
                            <span className="text-[10px] font-bold text-slate-700 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{c.logisticsReceiverName}</span>
                        ) : (
                            <span className="text-[9px] text-slate-400 italic">بانتظار الاستلام...</span>
                        )}
                    </div>
                </div>
            );
        }
    },
    {
        accessorKey: 'logisticsArrivalDate',
        header: 'تاريخ الوصول',
        cell: (info) => {
            const val = info.getValue() as string;
            return val ? <span className="text-[10px] font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{new Date(val).toLocaleDateString('ar-OM')}</span> : <span className="text-[10px] text-slate-300 italic">في الطريق</span>;
        }
    },
    {
        id: 'actions',
        header: 'الإجراءات',
        cell: (info) => {
            const c = info.row.original;
            const hasArrived = !!c.logisticsArrivalDate;
            const isOwnershipTransferred = c.port === c.transferTo;

            if (processingId === c.id) return <i className="fas fa-circle-notch fa-spin text-slate-300"></i>;

            return (
                <div className="flex gap-2 justify-center">
                    {!isOwnershipTransferred ? (
                        <button 
                            onClick={() => handleConfirmArrival(c)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-[10px] shadow-sm hover:bg-indigo-700 transition-all flex items-center gap-1.5"
                        >
                            <i className="fas fa-file-signature"></i> استلام ونقل تبعية
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-green-600 flex items-center gap-1 bg-green-50 px-3 py-1 rounded-lg border border-green-100">
                                <i className="fas fa-check"></i> تم الاستلام
                            </span>
                            <button 
                                onClick={() => navigate(`/portal?id=${c.id}`)}
                                className="bg-white border border-slate-200 text-slate-600 px-3 py-1 rounded-lg font-bold text-[10px] shadow-sm hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center gap-1"
                            >
                                <i className="fas fa-eye"></i> عرض وتعديل
                            </button>
                        </div>
                    )}
                </div>
            );
        }
    }
  ], [activeTab, processingId]);

  const isAnyFilterActive = useMemo(() => {
    return filterOriginPort !== 'ALL' || filterTargetPort !== 'ALL' || filterSector !== 'ALL' || searchTerm !== '';
  }, [filterOriginPort, filterTargetPort, filterSector, searchTerm]);

  const resetFilters = () => {
    setFilterOriginPort('ALL');
    setFilterTargetPort('ALL');
    setFilterSector('ALL');
    setSearchTerm('');
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
        {/* Analytics Top Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-[#c8102e]/30 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-[#c8102e] rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-clock"></i></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">بانتظار الوصول</p>
                        <p className="text-xl font-black text-slate-800">{stats.pending}</p>
                    </div>
                </div>
                <div className="text-xs font-bold text-[#c8102e] bg-red-50 px-2 py-1 rounded-lg">قيد التحويل</div>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-500/30 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-check-double"></i></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">تم استلامهم اليوم</p>
                        <p className="text-xl font-black text-slate-800">{stats.arrivedToday}</p>
                    </div>
                </div>
                <div className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">إنجاز</div>
            </div>
            <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl"><i className="fas fa-truck-moving"></i></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">إجمالي في الطريق</p>
                        <p className="text-xl font-black text-slate-800">{stats.inTransit}</p>
                    </div>
                </div>
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">في الحركة</div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#c8102e] text-white rounded-[2rem] flex items-center justify-center text-2xl shadow-lg shadow-red-100"><i className="fas fa-exchange-alt"></i></div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800">إدارة التحويلات اللوجستية</h2>
                    <p className="text-slate-400 text-xs font-bold mt-1">المحطة الحالية: <span className="text-[#c8102e] font-black">{userAssignedPortNames.length > 0 ? userAssignedPortNames.join(' ، ') : 'إشراف عام'}</span></p>
                </div>
            </div>
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200">
                <button onClick={() => setActiveTab('PENDING')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'PENDING' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>الوارد (قيد الاستلام)</button>
                <button onClick={() => setActiveTab('COMPLETED')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'COMPLETED' ? 'bg-green-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>تم الاستلام (الأرشيف)</button>
            </div>
            
            <div className="flex items-center gap-3">
                {isAnyFilterActive && (
                    <button 
                        onClick={resetFilters}
                        className="w-11 h-11 bg-red-50 text-red-500 rounded-2xl border border-red-100 flex items-center justify-center hover:bg-red-100 transition-all shadow-sm"
                        title="إعادة ضبط الفرز"
                    >
                        <i className="fas fa-undo-alt"></i>
                    </button>
                )}
                {(activeTab === 'PENDING' && stats.pending > 0) && (
                    <button 
                        onClick={handleBatchConfirmArrival}
                        disabled={isBatchProcessing}
                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                        {isBatchProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-double"></i>}
                        استلام دفعي (All)
                    </button>
                )}
            </div>
        </div>

        {/* Workflow Guide */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-6 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 space-y-2 max-w-xl">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <i className="fas fa-lightbulb text-yellow-300"></i>
                    دليل إدارة التحويلات اللوجستية
                </h3>
                <p className="text-sm text-indigo-50 font-medium leading-relaxed">
                    يمكنك استلام الشحنات فرادى للتأكد من كل بيان، أو استخدام "الاستلام الدفعي" لتسريع العملية إذا وصلت قافلة كاملة. بعد الاستلام، ستنتقل المعاملة لتبعية محطتك الحالية لتتمكن من إتمام المعاينة والتفتيش.
                </p>
            </div>
            <div className="flex gap-4 relative z-10 shrink-0">
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl flex flex-col items-center gap-1 w-24">
                    <i className="fas fa-truck-loading text-xl"></i>
                    <span className="text-[10px] font-bold">استلام</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl flex flex-col items-center gap-1 w-24">
                    <i className="fas fa-search text-xl"></i>
                    <span className="text-[10px] font-bold">معاينة</span>
                </div>
                <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl flex flex-col items-center gap-1 w-24">
                    <i className="fas fa-check-double text-xl"></i>
                    <span className="text-[10px] font-bold">إفراج</span>
                </div>
            </div>
        </div>

        {isLogisticsUser && (
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 custom-scrollbar w-full">
                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                        <span className="text-[10px] font-black text-slate-400 px-2 border-l border-slate-100 ml-2">المحطة الوجهة</span>
                        <select value={filterTargetPort} onChange={(e) => setFilterTargetPort(e.target.value)} className="bg-transparent outline-none text-xs font-black text-slate-700 px-2 cursor-pointer w-40">
                            <option value="ALL">كل الوجهات</option>
                            {ports.filter(p => p.type === 'LOGISTICS' && userAssignedPortNames.includes(p.name)).map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                        <span className="text-[10px] font-black text-slate-400 px-2 border-l border-slate-100 ml-2">المنفذ المحول منه</span>
                        <select value={filterOriginPort} onChange={(e) => setFilterOriginPort(e.target.value)} className="bg-transparent outline-none text-xs font-black text-slate-700 px-2 cursor-pointer w-40">
                            <option value="ALL">كل المنافذ</option>
                            {ports.filter(p => p.type !== 'LOGISTICS').map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center">
                        <span className="text-[10px] font-black text-slate-400 px-2 border-l border-slate-100 ml-2">القطاع</span>
                        <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)} className="bg-transparent outline-none text-xs font-black text-slate-700 px-2 cursor-pointer w-40">
                            <option value="ALL">كل القطاعات</option>
                            {Object.entries(CONSIGNMENT_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
        )}

        <DataTable 
            data={logisticsConsignments} 
            columns={columns} 
            searchPlaceholder="بحث برقم البيان أو المستورد..." 
            onSearchChange={(val) => setSearchTerm(val)}
        />

        {logisticsConsignments.length === 0 && (
            <div className="py-20 text-center text-slate-400 bg-white rounded-[2rem] border border-slate-100 border-dashed">
                <i className="fas fa-truck-loading text-5xl mb-4 opacity-20"></i>
                <p className="font-black text-lg">لا توجد إرساليات في هذه القائمة</p>
                <p className="text-xs mt-2 text-slate-400">تأكد من أنك في الوردية الصحيحة وأن المعاملات قد حُولت لهذه المحطة</p>
            </div>
        )}
    </div>
  );
};

export default LogisticsPortal;
