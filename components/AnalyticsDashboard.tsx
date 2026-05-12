import React, { useState, useMemo } from 'react';
import { Consignment, ConsignmentType } from '../types';
import { exportConsignmentsToExcel } from '../excelService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, 
  ComposedChart, Scatter, ZAxis
} from 'recharts';
import { motion } from 'framer-motion';

interface AnalyticsDashboardProps {
  consignments: Consignment[];
  activeSector: ConsignmentType | 'ALL';
  commodityGroups?: any[];
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ consignments, activeSector, commodityGroups = [] }) => {
  const [filters, setFilters] = useState({
    risk: 'الكل',
    port: 'الكل',
    commodity: 'الكل',
    country: 'الكل',
    status: 'الكل',
    importer: 'الكل',
    logType: 'الكل',
    startDate: '',
    endDate: ''
  });

  React.useEffect(() => {
    if (activeSector === ConsignmentType.FOOD_SAFETY && filters.logType === 'صادر') {
      setFilters(prev => ({ ...prev, logType: 'الكل' }));
    }
  }, [activeSector, filters.logType]);

  const filteredConsignments = useMemo(() => 
    consignments.filter(c => {
      const matchesSector = activeSector === 'ALL' || c.type === activeSector;
      const matchesRisk = filters.risk === 'الكل' || c.riskAssessment === filters.risk;
      const matchesPort = filters.port === 'الكل' || c.port === filters.port;
      const matchesCommodity = filters.commodity === 'الكل' || (c.items && c.items.some(i => i.description === filters.commodity));
      const matchesCountry = filters.country === 'الكل' || c.shippingCountry === filters.country;
      const matchesStatus = filters.status === 'الكل' || c.status === filters.status;
      const matchesImporter = filters.importer === 'الكل' || c.importer === filters.importer;
      
      const isOutgoing = c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير';
      const matchesLogType = filters.logType === 'الكل' || 
                            (filters.logType === 'وارد' && !isOutgoing) || 
                            (filters.logType === 'صادر' && isOutgoing);

      const matchesStartDate = !filters.startDate || new Date(c.arrivalDate) >= new Date(filters.startDate);
      const matchesEndDate = !filters.endDate || new Date(c.arrivalDate) <= new Date(filters.endDate);
      return matchesSector && matchesRisk && matchesPort && matchesCommodity && matchesCountry && matchesStatus && matchesImporter && matchesLogType && matchesStartDate && matchesEndDate;
    }),
    [consignments, activeSector, filters]
  );

  const stats = useMemo(() => {
    const total = filteredConsignments.length;
    const incomingCount = filteredConsignments.filter(c => !(c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير')).length;
    const outgoingCount = filteredConsignments.filter(c => c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير').length;
    const approved = filteredConsignments.filter(c => c.status === 'Approved').length;
    const rejected = filteredConsignments.filter(c => c.status === 'Rejected').length;
    const pending = filteredConsignments.filter(c => c.status === 'Pending').length;
    
    const totalWeight = filteredConsignments.reduce((sum, c) => sum + (c.totalWeight || 0), 0);
    const totalFees = filteredConsignments.reduce((sum, c) => sum + (c.fees || 0), 0);
    
    const rejectionRate = total > 0 ? (rejected / total) * 100 : 0;
    
    const avgWeight = total > 0 ? totalWeight / total : 0;
    
    // Group by Country
    const countryDataMap: Record<string, number> = {};
    filteredConsignments.forEach(c => {
      const country = c.shippingCountry || 'غير معروف';
      countryDataMap[country] = (countryDataMap[country] || 0) + 1;
    });
    const countryData = Object.entries(countryDataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Group by Port
    const portDataMap: Record<string, number> = {};
    filteredConsignments.forEach(c => {
      portDataMap[c.port] = (portDataMap[c.port] || 0) + 1;
    });
    const portData = Object.entries(portDataMap)
      .map(([name, value]) => ({ name, value }));

    // Monthly Trend
    const monthlyTrendMap: Record<string, { total: number, rejected: number, incoming: number, outgoing: number }> = {};
    filteredConsignments.forEach(c => {
      const date = new Date(c.arrivalDate);
      const month = date.toLocaleString('ar-OM', { month: 'short' });
      if (!monthlyTrendMap[month]) monthlyTrendMap[month] = { total: 0, rejected: 0, incoming: 0, outgoing: 0 };
      monthlyTrendMap[month].total++;
      if (c.status === 'Rejected') monthlyTrendMap[month].rejected++;
      
      const isOutgoing = c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير';
      if (isOutgoing) monthlyTrendMap[month].outgoing++;
      else monthlyTrendMap[month].incoming++;
    });
    const monthlyTrend = Object.entries(monthlyTrendMap).map(([name, data]) => ({
      name,
      ...data
    }));

    // Risk Level Distribution
    const riskDataMap: Record<string, number> = {};
    filteredConsignments.forEach(c => {
      const risk = c.riskAssessment || 'غير محدد';
      riskDataMap[risk] = (riskDataMap[risk] || 0) + 1;
    });
    const riskData = Object.entries(riskDataMap).map(([name, value]) => ({ name, value }));

    // Top Commodities (Products)
    const commodityDataMap: Record<string, number> = {};
    filteredConsignments.forEach(c => {
      if (c.items && c.items.length > 0) {
        c.items.forEach(item => {
          const product = item.description || 'أخرى';
          commodityDataMap[product] = (commodityDataMap[product] || 0) + 1;
        });
      } else {
        commodityDataMap['أخرى'] = (commodityDataMap['أخرى'] || 0) + 1;
      }
    });
    const commodityData = Object.entries(commodityDataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Rejection Reasons
    const rejectionReasonsMap: Record<string, number> = {};
    filteredConsignments.filter(c => c.status === 'Rejected' && c.rejectionReason).forEach(c => {
      const reason = c.rejectionReason || 'أخرى';
      rejectionReasonsMap[reason] = (rejectionReasonsMap[reason] || 0) + 1;
    });
    const rejectionReasonsData = Object.entries(rejectionReasonsMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Inspection Results
    const inspectionResultMap: Record<string, number> = {};
    filteredConsignments.forEach(c => {
      const result = c.inspectionResult || 'غير محدد';
      inspectionResultMap[result] = (inspectionResultMap[result] || 0) + 1;
    });
    const inspectionResultData = Object.entries(inspectionResultMap).map(([name, value]) => ({ name, value }));

    // Top Importers
    const importerDataMap: Record<string, number> = {};
    filteredConsignments.forEach(c => {
      const importer = c.importer || 'غير معروف';
      importerDataMap[importer] = (importerDataMap[importer] || 0) + 1;
    });
    const importerData = Object.entries(importerDataMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Inspection Types
    const inspectionTypeMap: Record<string, number> = {};
    filteredConsignments.forEach(c => {
      const type = c.inspectionType || 'غير محدد';
      inspectionTypeMap[type] = (inspectionTypeMap[type] || 0) + 1;
    });
    const inspectionTypeData = Object.entries(inspectionTypeMap).map(([name, value]) => ({ name, value }));

    // Container Types
    const containerTypeMap: Record<string, number> = {};
    filteredConsignments.forEach(c => {
      const type = c.containerType || 'غير محدد';
      containerTypeMap[type] = (containerTypeMap[type] || 0) + 1;
    });
    const containerTypeData = Object.entries(containerTypeMap).map(([name, value]) => ({ name, value }));

    return { 
      total, approved, rejected, pending, rejectionRate, 
      incomingCount, outgoingCount,
      totalWeight, totalFees, avgWeight,
      countryData, portData, monthlyTrend,
      riskData, commodityData, rejectionReasonsData, inspectionResultData,
      importerData, inspectionTypeData, containerTypeData,
      logTypeData: [
        { name: 'وارد (Incoming)', value: incomingCount },
        { name: 'صادر (Outgoing)', value: outgoingCount }
      ].filter(d => d.value > 0)
    };
  }, [filteredConsignments]);

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

  const clearFilters = () => setFilters({ risk: 'الكل', port: 'الكل', commodity: 'الكل', country: 'الكل', status: 'الكل', importer: 'الكل', logType: 'الكل', startDate: '', endDate: '' });

  return (
    <div className="space-y-8 pb-12">
      {/* Header with Export */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-800 text-white rounded-[2rem] flex items-center justify-center text-2xl shadow-lg shadow-slate-200">
            <i className="fas fa-chart-pie"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800">تحليلات البيانات</h2>
            <p className="text-slate-400 text-xs font-bold mt-1">عرض إحصائيات القطاع: <span className="text-slate-600">{activeSector === 'ALL' ? 'الكل' : activeSector}</span></p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => exportConsignmentsToExcel(filteredConsignments, `تحليلات_الإرساليات_${activeSector}_${new Date().toISOString().split('T')[0]}`)}
            className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl font-black text-xs hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100 shadow-sm"
          >
            <i className="fas fa-file-excel"></i>
            تصدير البيانات المفلترة
          </button>
        </div>
      </div>

      {/* Log Type Toggle */}
      <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
          <button 
              onClick={() => setFilters(prev => ({ ...prev, logType: 'الكل' }))}
              className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${filters.logType === 'الكل' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
              الكل
          </button>
          <button 
              onClick={() => setFilters(prev => ({ ...prev, logType: 'وارد' }))}
              className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${filters.logType === 'وارد' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
          >
              <i className="fas fa-arrow-down"></i>
              الوارد (Incoming)
          </button>
          {activeSector !== ConsignmentType.FOOD_SAFETY && (
            <button 
                onClick={() => setFilters(prev => ({ ...prev, logType: 'صادر' }))}
                className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${filters.logType === 'صادر' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
            >
                <i className="fas fa-arrow-up"></i>
                الصادر (Outgoing)
            </button>
          )}
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-4 sticky top-4 z-30 backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                <i className="fas fa-filter text-xs"></i>
            </div>
            <span className="text-xs font-black text-slate-800 uppercase">لوحة التحكم التفاعلية:</span>
        </div>
        
        <div className="flex flex-wrap gap-3 flex-1">
            <select 
                value={filters.risk}
                onChange={e => setFilters(prev => ({ ...prev, risk: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
                <option value="الكل">كل مستويات الخطورة</option>
                {['منخفضة', 'متوسطة', 'عالية'].map(r => <option key={`risk-${r}`} value={r}>{r}</option>)}
            </select>

            <select 
                value={filters.port}
                onChange={e => setFilters(prev => ({ ...prev, port: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
                <option value="الكل">كل المنافذ</option>
                {Array.from(new Set(consignments.map(c => c.port))).map(p => <option key={`port-${p}`} value={p}>{p}</option>)}
            </select>

            <select 
                value={filters.commodity}
                onChange={e => setFilters(prev => ({ ...prev, commodity: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
                <option value="الكل">كل المنتجات</option>
                {Array.from(new Set(
                    consignments.filter(c => activeSector === 'ALL' || c.type === activeSector).flatMap(c => c.items?.map(i => i.description) || [])
                )).filter(Boolean).sort().map(c => <option key={`commodity-${c}`} value={c}>{c}</option>)}
            </select>

            <select 
                value={filters.country}
                onChange={e => setFilters(prev => ({ ...prev, country: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
                <option value="الكل">كل الدول</option>
                {Array.from(new Set(consignments.map(c => c.shippingCountry))).filter(Boolean).map(c => <option key={`country-${c}`} value={c}>{c}</option>)}
            </select>

            <select 
                value={filters.status}
                onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
                <option value="الكل">كل الحالات</option>
                <option value="Approved">مقبول</option>
                <option value="Rejected">مرفوض</option>
                <option value="Pending">قيد المراجعة</option>
            </select>

            <select 
                value={filters.importer}
                onChange={e => setFilters(prev => ({ ...prev, importer: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
                <option value="الكل">{filters.logType === 'صادر' ? 'كل المصدرين' : filters.logType === 'وارد' ? 'كل المستوردين' : 'كل الشركات'}</option>
                {Array.from(new Set(consignments.map(c => c.importer))).filter(Boolean).map(c => <option key={`importer-${c}`} value={c}>{c}</option>)}
            </select>

            <input
                type="date"
                value={filters.startDate}
                onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                title="من تاريخ"
            />
            <input
                type="date"
                value={filters.endDate}
                onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                title="إلى تاريخ"
            />
        </div>

        {(filters.risk !== 'الكل' || filters.port !== 'الكل' || filters.commodity !== 'الكل' || filters.country !== 'الكل' || filters.status !== 'الكل' || filters.importer !== 'الكل' || filters.startDate !== '' || filters.endDate !== '') && (
            <button 
                onClick={clearFilters}
                className="text-[10px] font-black text-red-500 hover:text-red-600 flex items-center gap-1 bg-red-50 px-3 py-2 rounded-xl transition-colors"
            >
                <i className="fas fa-times"></i>
                مسح الفلاتر
            </button>
        )}
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {[
          { 
            label: filters.logType === 'صادر' ? 'إجمالي الصادر' : filters.logType === 'وارد' ? 'إجمالي الوارد' : 'إجمالي الإرساليات', 
            value: stats.total, 
            icon: filters.logType === 'صادر' ? 'fa-arrow-up' : filters.logType === 'وارد' ? 'fa-arrow-down' : 'fa-box', 
            color: filters.logType === 'صادر' ? 'blue' : filters.logType === 'وارد' ? 'emerald' : 'slate' 
          },
          { label: 'إجمالي الوارد', value: stats.incomingCount, icon: 'fa-arrow-down', color: 'emerald' },
          { label: 'إجمالي الصادر', value: stats.outgoingCount, icon: 'fa-arrow-up', color: 'blue' },
          { label: 'نسبة الرفض', value: `${stats.rejectionRate.toFixed(1)}%`, icon: 'fa-times-circle', color: 'red' },
          { label: 'بانتظار الإجراء', value: stats.pending, icon: 'fa-clock', color: 'amber' },
          { label: 'تمت الموافقة', value: stats.approved, icon: 'fa-check-circle', color: 'emerald' },
          { label: 'الوزن الإجمالي', value: `${(stats.totalWeight / 1000).toFixed(1)}k`, icon: 'fa-weight-hanging', color: 'indigo', unit: 'طن' },
          { label: 'إجمالي الرسوم', value: stats.totalFees.toLocaleString(), icon: 'fa-money-bill-wave', color: 'emerald', unit: 'ر.ع' },
        ].map((item, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col gap-3 hover:shadow-md transition-all group"
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg bg-${item.color}-50 text-${item.color}-600 group-hover:scale-110 transition-transform`}>
              <i className={`fas ${item.icon}`}></i>
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <div className="flex items-baseline gap-1">
                <h3 className="text-xl font-black text-slate-800 tracking-tight">{item.value}</h3>
                {item.unit && <span className="text-[10px] font-bold text-slate-400">{item.unit}</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Monthly Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-chart-line text-blue-500"></i>
              تحليل المسار الزمني
            </h4>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full">آخر 6 أشهر</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyTrend}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={filters.logType === 'صادر' ? "#3b82f6" : "#10b981"} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={filters.logType === 'صادر' ? "#3b82f6" : "#10b981"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 900, color: '#1e293b' }}
                />
                {filters.logType === 'الكل' ? (
                  <>
                    <Area type="monotone" dataKey="incoming" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="transparent" name="الوارد (Incoming)" />
                    <Area type="monotone" dataKey="outgoing" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="transparent" name="الصادر (Outgoing)" />
                  </>
                ) : (
                  <Area type="monotone" dataKey="total" stroke={filters.logType === 'صادر' ? "#3b82f6" : "#10b981"} strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" name={filters.logType === 'صادر' ? "إجمالي الصادر" : "إجمالي الوارد"} />
                )}
                <Area type="monotone" dataKey="rejected" stroke="#ef4444" strokeWidth={3} fill="transparent" name="المرفوضة" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Country Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-globe-americas text-emerald-500"></i>
              {filters.logType === 'صادر' ? 'توزيع دول الوجهة' : filters.logType === 'وارد' ? 'توزيع دول المنشأ' : 'توزيع الدول'}
            </h4>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats.countryData} 
                layout="vertical" 
                margin={{ left: 20 }}
                onClick={(data) => data && data.activeLabel && setFilters(prev => ({ ...prev, country: String(data.activeLabel) }))}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }} width={80} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={20} name="عدد الإرساليات" className="cursor-pointer">
                  {stats.countryData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={filters.country === entry.name ? '#1e293b' : COLORS[index % COLORS.length]} 
                        fillOpacity={filters.country === 'الكل' || filters.country === entry.name ? 1 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Advanced Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Log Type Distribution */}
        {filters.logType === 'الكل' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
          >
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <i className="fas fa-exchange-alt text-indigo-500"></i>
                توزيع (وارد / صادر)
              </h4>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.logTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#3b82f6" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Risk Level Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm ${filters.logType !== 'الكل' ? 'lg:col-span-1' : ''}`}
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-shield-alt text-amber-500"></i>
              مستوى الخطورة
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Commodities */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-boxes text-indigo-500"></i>
              أبرز المنتجات
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats.commodityData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(data) => data && data.activeLabel && setFilters(prev => ({ ...prev, commodity: String(data.activeLabel) }))}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={30} name="تكرار المنتج" className="cursor-pointer">
                  {stats.commodityData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={filters.commodity === entry.name ? '#1e293b' : COLORS[(index + 2) % COLORS.length]} 
                        fillOpacity={filters.commodity === 'الكل' || filters.commodity === entry.name ? 1 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Rejection Reasons */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-ban text-red-500"></i>
              أسباب الرفض الشائعة
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.rejectionReasonsData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }} width={80} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={15} name="عدد الحالات">
                  {stats.rejectionReasonsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#ef4444" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Additional Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inspection Results */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-clipboard-check text-emerald-500"></i>
              نتائج الفحص
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.inspectionResultData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  dataKey="value"
                >
                  {stats.inspectionResultData.map((entry, index) => {
                    let color = COLORS[index % COLORS.length];
                    if (entry.name === 'مطابق') color = '#10b981';
                    if (entry.name === 'غير مطابق') color = '#ef4444';
                    if (entry.name === 'قيد الفحص') color = '#f59e0b';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Port Distribution */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-ship text-blue-500"></i>
              توزيع المنافذ
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats.portData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(data) => data && data.activeLabel && setFilters(prev => ({ ...prev, port: String(data.activeLabel) }))}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={30} name="عدد الإرساليات" className="cursor-pointer">
                  {stats.portData.map((entry, index) => (
                    <Cell 
                        key={`cell-${index}`} 
                        fill={filters.port === entry.name ? '#1e293b' : COLORS[index % COLORS.length]} 
                        fillOpacity={filters.port === 'الكل' || filters.port === entry.name ? 1 : 0.3}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top Importers */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-building text-indigo-500"></i>
              {filters.logType === 'صادر' ? 'أبرز المصدرين المحليين' : filters.logType === 'وارد' ? 'أبرز المستوردين المحليين' : 'أبرز الشركات المحلية'}
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.importerData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }} width={80} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={15} name="عدد الإرساليات">
                  {stats.importerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3b82f6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Third Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inspection Types */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-search text-purple-500"></i>
              أنواع التفتيش
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.inspectionTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.inspectionTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Container Types */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <i className="fas fa-truck-loading text-amber-500"></i>
              أنواع الحاويات
            </h4>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.containerTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  dataKey="value"
                >
                  {stats.containerTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 700 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
