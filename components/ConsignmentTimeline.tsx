import React from 'react';
import { Consignment, AuditLogEntry } from '../types';
import { motion } from 'framer-motion';

interface ConsignmentTimelineProps {
  consignment: Consignment;
}

const safeFormatDateTime = (dateStr: string | undefined | null) => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || '---';
    return date.toLocaleString('ar-OM');
  } catch (e) {
    return dateStr || '---';
  }
};

const ConsignmentTimeline: React.FC<ConsignmentTimelineProps> = ({ consignment }) => {
  const auditLog = [...(consignment.auditLog || [])].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const getActionIcon = (action: string) => {
    if (action.includes('إنشاء') || action.includes('Created')) return 'fa-plus-circle text-blue-500';
    if (action.includes('تحديث') || action.includes('Updated')) return 'fa-edit text-amber-500';
    if (action.includes('عينة') || action.includes('Sample')) return 'fa-flask text-purple-500';
    if (action.includes('موافقة') || action.includes('Approved') || action.includes('إفراج')) return 'fa-check-circle text-green-500';
    if (action.includes('رفض') || action.includes('Rejected')) return 'fa-times-circle text-red-500';
    if (action.includes('تحويل') || action.includes('Transfer')) return 'fa-exchange-alt text-indigo-500';
    if (action.includes('وصول') || action.includes('استلام')) return 'fa-truck-loading text-emerald-600';
    if (action.includes('شرط') || action.includes('تعهد')) return 'fa-file-signature text-orange-500';
    return 'fa-history text-slate-400';
  };

  const getStatusColor = (entry: AuditLogEntry) => {
    if (entry.statusChange === 'Approved' || entry.action.includes('وصول') || entry.action.includes('إفراج')) return 'bg-green-500';
    if (entry.statusChange === 'Rejected' || entry.action.includes('رفض')) return 'bg-red-500';
    if (entry.action.includes('تحويل')) return 'bg-indigo-500';
    if (entry.action.includes('عينة')) return 'bg-purple-500';
    return 'bg-blue-500';
  };

  return (
    <div className="space-y-8 relative before:absolute before:inset-0 before:right-5 before:w-0.5 before:bg-slate-200 before:h-full">
      {auditLog.length > 0 ? (
        auditLog.map((entry, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="relative pr-12"
          >
            {/* Dot */}
            <div className={`absolute right-3 top-2 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 ${getStatusColor(entry)}`}></div>

            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className={`absolute right-0 top-0 bottom-0 w-1 ${getStatusColor(entry)} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
              
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full ${getStatusColor(entry).replace('bg-', 'bg-').replace('500', '100')} flex items-center justify-center`}>
                    <i className={`fas ${getActionIcon(entry.action)} text-lg`}></i>
                  </div>
                  <span className="text-sm font-black text-slate-800">{entry.action}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg flex items-center gap-1 border border-slate-200">
                  <i className="far fa-clock"></i>
                  {safeFormatDateTime(entry.timestamp)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 mb-3 bg-slate-50 rounded-xl p-2 border border-slate-100 inline-flex">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-700 shadow-sm border border-slate-200">
                  {entry.user.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-[11px] font-bold text-slate-700">{entry.user}</span>
              </div>

              {entry.details && (
                <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 border-r-2 border-slate-300 p-3 rounded-l-xl">
                  {entry.details.split('\n').map((line, lIdx) => (
                    <p key={lIdx} className={lIdx > 0 ? "mt-1" : ""}>{line}</p>
                  ))}
                </div>
              )}

              {entry.changes && entry.changes.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-2">
                  <div className="text-[10px] font-black text-slate-500 mb-1 flex items-center gap-1.5"><i className="fas fa-list-ul"></i>التغييرات التي طرأت:</div>
                  {entry.changes.map((change, cIdx) => (
                    <div key={cIdx} className="bg-slate-50/50 rounded-lg p-2.5 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 w-full sm:w-1/3">
                        <div className="w-5 h-5 rounded-md bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400">
                          <i className="fas fa-tag text-[9px]"></i>
                        </div>
                        <span className="font-extrabold text-slate-700 text-xs truncate" title={change.label || change.field}>{change.label || change.field}</span>
                      </div>
                      <div className="flex items-center gap-3 w-full sm:w-2/3 bg-white p-1.5 rounded-md border border-slate-100 shadow-sm overflow-hidden">
                        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">القيمة السابقة</span>
                          <span className="text-red-500 text-[10px] font-medium line-through truncate" title={String(change.oldValue || 'فارغ')}>{String(change.oldValue || 'فارغ')}</span>
                        </div>
                        <div className="w-6 shrink-0 flex items-center justify-center">
                          <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center"><i className="fas fa-arrow-left text-[8px] text-slate-400"></i></div>
                        </div>
                        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">القيمة الحالية</span>
                          <span className="text-emerald-600 text-[10px] font-bold truncate" title={String(change.newValue || 'فارغ')}>{String(change.newValue || 'فارغ')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ))
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
            <i className="fas fa-history text-2xl"></i>
          </div>
          <p className="text-sm font-bold text-slate-400">لا يوجد سجل نشاط متاح</p>
        </div>
      )}
    </div>
  );
};

export default ConsignmentTimeline;
