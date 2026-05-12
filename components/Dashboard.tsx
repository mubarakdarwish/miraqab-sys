
import React, { useEffect, useState, useMemo } from 'react';
import { Consignment, ConsignmentType, User, WeeklySchedule, ShiftType, Port, SectorShiftConfig, ShiftConfig, Laboratory } from '../types';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, Legend, BarChart, Bar, ComposedChart, Line, RadialBarChart, RadialBar 
} from 'recharts';
import { getDashboardInsights } from '../geminiService';
import { CONSIGNMENT_LABELS } from '../constants';
import { exportConsignmentsToExcel } from '../excelService';
import { subscribeToShifts, addShiftNoteToDB, subscribeToSectorShiftConfig } from '../firebaseService';
import * as FB from '../firebaseService';
import { Link, useNavigate } from 'react-router-dom';
import LogisticsMap from './LogisticsMap';
import * as XLSX from 'xlsx';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, TrendingUp, AlertCircle, Users, Map as MapIcon, 
    Clock, FileText, Search, Plus, Settings, Download, RefreshCw,
    ChevronRight, ArrowUpRight, ArrowDownRight, Zap, BrainCircuit,
    FlaskConical, ClipboardCheck, Ban, History, MessageSquarePlus,
    ArrowDownCircle, ArrowUpCircle, Play
} from 'lucide-react';

interface DashboardProps {
    consignments: Consignment[];
    activeSector: ConsignmentType;
    onSectorChange?: (sector: ConsignmentType) => void;
    currentUser?: User;
    isSystemAdmin?: boolean;
    users?: User[];
    ports?: Port[]; // New Prop
    commodityGroups?: any[]; // New Prop
    laboratories?: Laboratory[];
    installPrompt?: any;
    onInstall?: () => void;
    onShowPresentation?: () => void;
}

// --- Helper Components ---
const GlassCard = ({ children, className = "", noPadding = false, layout = false, id }: any) => (
    <motion.div 
        id={id}
        layout={layout}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className={`bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden ${noPadding ? '' : 'p-8'} ${className}`}
    >
        {children}
    </motion.div>
);

const WidgetHeader = ({ title, icon: Icon, badge, color = "slate" }: any) => (
    <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
            {Icon && (
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm bg-${color}-50 text-${color}-600 border border-${color}-100`}>
                    <Icon size={20} />
                </div>
            )}
            <div>
                <h4 className="font-black text-slate-800 text-sm leading-none">{title}</h4>
                {badge && <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{badge}</p>}
            </div>
        </div>
        <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-100"></div>
        </div>
    </div>
);

// --- StatCard Component ---
const StatCard = ({ label, value, icon: Icon, color, unit, formatNumber, alert, trend }: any) => {
  const colorVariants: any = { 
      [ConsignmentType.VETERINARY]: 'from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-100', 
      [ConsignmentType.AGRICULTURAL]: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-100', 
      [ConsignmentType.FOOD_SAFETY]: 'from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-100', 
      emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-100', 
      rose: 'from-red-500/10 to-red-600/5 text-red-600 border-red-100',
      indigo: 'from-indigo-500/10 to-indigo-600/5 text-indigo-600 border-indigo-100',
      warning: 'from-orange-500/10 to-orange-600/5 text-orange-600 border-orange-100',
      blue: 'from-blue-500/10 to-blue-600/5 text-blue-600 border-blue-100'
  };

  const iconColors: any = {
      [ConsignmentType.VETERINARY]: 'bg-amber-500 text-white shadow-amber-200',
      [ConsignmentType.AGRICULTURAL]: 'bg-emerald-500 text-white shadow-emerald-200',
      [ConsignmentType.FOOD_SAFETY]: 'bg-blue-500 text-white shadow-blue-200',
      emerald: 'bg-emerald-500 text-white shadow-emerald-200',
      rose: 'bg-red-500 text-white shadow-red-200',
      indigo: 'bg-indigo-500 text-white shadow-indigo-200',
      warning: 'bg-orange-500 text-white shadow-orange-200',
      blue: 'bg-blue-500 text-white shadow-blue-200'
  };
  
  return (
    <motion.div 
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`relative bg-white/80 backdrop-blur-md rounded-[2rem] p-6 border border-white/50 shadow-lg shadow-slate-200/40 transition-all duration-300 overflow-hidden ${alert ? 'ring-2 ring-red-500/20 border-red-100' : ''}`}
    >
      {/* Background Glow */}
      <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-20 bg-gradient-to-br ${colorVariants[color] || colorVariants['rose']}`}></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:rotate-6 ${iconColors[color] || iconColors['rose']}`}>
              {Icon && <Icon size={24} />}
          </div>
          {trend !== undefined && (
              <div className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-full shadow-sm ${trend >= 0 ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  <span>{Math.abs(trend)}%</span>
              </div>
          )}
      </div>

      <div className="relative z-10">
          <div className="flex items-baseline gap-1 mb-1">
              <h4 className="text-3xl font-black text-slate-800 tracking-tight">
                  {formatNumber ? value.toLocaleString() : value}
              </h4>
              {unit && <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{unit}</span>}
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      </div>

      {alert && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-red-500">
              <div className="w-full h-full bg-red-400 animate-pulse"></div>
          </div>
      )}
    </motion.div>
  );
};

// --- ChartInsight Component ---
const ChartInsight = ({ text, color = "indigo" }: { text: string; color?: string }) => {
  const bgColors: any = {
    indigo: 'bg-indigo-50/50 border-indigo-100 text-indigo-900/80',
    emerald: 'bg-emerald-50/50 border-emerald-100 text-emerald-900/80',
    amber: 'bg-amber-50/50 border-amber-100 text-amber-900/80',
    rose: 'bg-red-50/50 border-red-100 text-red-900/80',
    blue: 'bg-blue-50/50 border-blue-100 text-blue-900/80'
  };

  const iconColors: any = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-red-500',
    blue: 'bg-blue-500'
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-4 p-3 rounded-2xl border flex items-start gap-2.5 animate-fade-in group hover:bg-opacity-80 transition-colors cursor-default ${bgColors[color] || bgColors.indigo}`}
    >
      <div className={`w-6 h-6 rounded-lg text-white flex items-center justify-center shrink-0 text-[10px] shadow-sm group-hover:scale-110 transition-transform ${iconColors[color] || iconColors.indigo}`}>
        <i className="fas fa-lightbulb"></i>
      </div>
      <p className="text-[11px] font-black leading-relaxed">{text}</p>
    </motion.div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ consignments: allConsignments, activeSector, onSectorChange, currentUser, isSystemAdmin, users = [], ports = [], commodityGroups = [], laboratories = [], installPrompt, onInstall, onShowPresentation }) => {
  const isManagerOrAdmin = isSystemAdmin || currentUser?.role === 'MANAGER';

  const consignments = useMemo(() => {
    if (isManagerOrAdmin) return allConsignments;
    return allConsignments.filter(c => c.inspectorName === currentUser?.name);
  }, [allConsignments, isManagerOrAdmin, currentUser]);

  const [viewSector, setViewSector] = useState<ConsignmentType | 'ALL'>(activeSector);
  const [viewLogType, setViewLogType] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');
  const [viewStatus, setViewStatus] = useState<'ALL' | 'Approved' | 'Rejected' | 'Pending'>('ALL');
  const [viewRisk, setViewRisk] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  const [viewSamples, setViewSamples] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  
  useEffect(() => {
    setViewSector(activeSector);
  }, [activeSector]);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryTerm, setQueryTerm] = useState('');
  const [queryDate, setQueryDate] = useState(''); 
  const [queryResults, setQueryResults] = useState<Consignment[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [activeShift, setActiveShift] = useState<{name: string, type: ShiftType, count: number}>({ name: 'صباحي', type: 'MORNING', count: 0 });
  const [sectorSchedule, setSectorSchedule] = useState<WeeklySchedule>({});
  const [shiftConfig, setShiftConfig] = useState<SectorShiftConfig | null>(null);

  const [timeRange, setTimeRange] = useState<'7DAYS' | '30DAYS' | 'MONTH' | 'ALL'>('ALL');
  const [chartFilter, setChartFilter] = useState<{ type: 'STATUS' | 'COMMODITY' | 'REJECTION', value: string } | null>(null);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  
  useEffect(() => {
    const unsub = FB.subscribeToActiveSessions((sessions) => {
      setActiveSessions(sessions);
    });
    return () => unsub();
  }, []);
  
  // Selected Port State
  const [selectedPortId, setSelectedPortId] = useState<string>('ALL');

  // New Features States
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [quickNote, setQuickNote] = useState('');

  // Default Dashboard Layout with spans
  const defaultLayout = [
      { id: 'quickActions', title: 'الإجراءات السريعة', visible: true, span: 'col-span-full' },
      { id: 'statsGrid', title: 'الإحصائيات العامة', visible: true, span: 'lg:col-span-3' },
      { id: 'aiInsights', title: 'رؤى مرقاب AI', visible: true, span: 'lg:col-span-1' },
      { id: 'pendingAlerts', title: 'المهام المعلقة والتنبيهات', visible: true, span: 'col-span-full' },
      { id: 'shiftInfo', title: 'الحالة التشغيلية للفريق', visible: true, span: 'lg:col-span-3' },
      { id: 'advancedPerformance', title: 'التحليلات المتقدمة للأداء', visible: true, span: 'lg:col-span-1' },
      { id: 'teamPresence', title: 'فريق العمل المتصل', visible: true, span: 'lg:col-span-1' },
      { id: 'logisticsMap', title: 'خريطة العمليات اللوجستية', visible: true, span: 'col-span-full' },
      { id: 'charts', title: 'الرسوم البيانية', visible: true, span: 'col-span-full' },
      { id: 'inspectorKPIs', title: 'مؤشرات أداء المفتشين', visible: true, span: 'lg:col-span-1' },
      { id: 'rejectionAnalysis', title: 'تحليل أسباب الرفض', visible: true, span: 'lg:col-span-1' },
      { id: 'recentActivity', title: 'آخر النشاطات', visible: true, span: 'lg:col-span-2' },
      { id: 'quickNote', title: 'ملاحظة سريعة للمناوبة', visible: true, span: 'lg:col-span-1' },
      { id: 'periodComparison', title: 'مقارنة الفترات', visible: true, span: 'col-span-full' },
  ];

  const [dashboardLayout, setDashboardLayout] = useState(() => {
      const saved = localStorage.getItem('dashboardLayout');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              // Merge with default layout to ensure new widgets are added and spans are updated
              const merged = defaultLayout.map(def => {
                  const found = parsed.find((p: any) => p.id === def.id);
                  return found ? { ...def, visible: found.visible } : def;
              });
              // Keep the order of the parsed layout for existing widgets
              const ordered = parsed.map((p: any) => merged.find(m => m.id === p.id)).filter(Boolean);
              const missing = merged.filter(m => !ordered.find(o => o.id === m.id));
              return [...ordered, ...missing];
          } catch (e) {
              return defaultLayout;
          }
      }
      return defaultLayout;
  });

  useEffect(() => {
      localStorage.setItem('dashboardLayout', JSON.stringify(dashboardLayout));
  }, [dashboardLayout]);

  // Auto Refresh Logic
  useEffect(() => {
      let interval: NodeJS.Timeout;
      if (autoRefresh) {
          interval = setInterval(() => {
              setLastUpdated(new Date());
              // In a real app, you would refetch data here
          }, 5 * 60 * 1000); // 5 minutes
      }
      return () => clearInterval(interval);
  }, [autoRefresh]);

  const navigate = useNavigate();

  // Set default port if ports change and current selection is invalid
  useEffect(() => {
      if (ports.length > 0 && selectedPortId === 'ALL' && !isManagerOrAdmin && currentUser?.role !== 'LAB_TECH') {
          setSelectedPortId(ports[0].id);
      }
  }, [ports, isManagerOrAdmin, currentUser]);

  const activePortName = useMemo(() => {
      if (selectedPortId === 'ALL') return null;
      return ports.find(p => p.id === selectedPortId)?.name;
  }, [selectedPortId, ports]);

  useEffect(() => {
      if (viewSector === 'ALL') {
          setSectorSchedule({});
          setShiftConfig(null);
          return;
      }
      const unsub = subscribeToShifts(viewSector as ConsignmentType, selectedPortId, (data) => {
          setSectorSchedule(data || {});
      });
      const unsubConfig = subscribeToSectorShiftConfig(viewSector as ConsignmentType, selectedPortId, (data) => {
          setShiftConfig(data);
      });
      return () => {
          unsub();
          unsubConfig();
      };
  }, [viewSector, selectedPortId]);

  useEffect(() => {
    const calculateShift = () => {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const currentTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[now.getDay()];

        const defaultShifts: ShiftConfig[] = [
            { id: 'MORNING', name: 'الوردية الصباحية', startTime: '07:00', endTime: '19:00', color: 'amber', icon: 'fa-sun' },
            { id: 'EVENING', name: 'الوردية المسائية', startTime: '19:00', endTime: '07:00', color: 'indigo', icon: 'fa-moon' }
        ];

        const currentShifts = shiftConfig?.shifts || defaultShifts;
        
        // Find active shift based on current time
        let active = currentShifts.find(s => {
            if (s.startTime < s.endTime) {
                return currentTime >= s.startTime && currentTime < s.endTime;
            } else {
                // Shift crosses midnight
                return currentTime >= s.startTime || currentTime < s.endTime;
            }
        });

        if (!active && currentShifts.length > 0) active = currentShifts[0];

        if (active) {
            const count = sectorSchedule[today]?.[active.id]?.length || 0;
            setActiveShift({ name: active.name, type: active.id, count });
        }
    };
    calculateShift();
  }, [sectorSchedule, shiftConfig]);

  const getSectorStats = (sector: ConsignmentType) => {
      const sectorConsignments = consignments.filter(c => c.type === sector && (selectedPortId === 'ALL' || c.port === activePortName));
      return {
          total: sectorConsignments.length,
          pending: sectorConsignments.filter(c => c.status === 'Pending').length
      };
  };

  // --- Date & Port Filtering Logic ---
  const { visibleConsignments, prevPeriodConsignments } = useMemo(() => {
      const filterByDateAndPort = (list: Consignment[], days: number | 'ALL', offsetDays: number = 0) => {
          const endDate = new Date();
          endDate.setDate(endDate.getDate() - offsetDays);
          const startDate = new Date(endDate);
          
          const isLogTypeMatch = (c: Consignment) => {
              const isOutgoing = c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير';
              if (viewLogType === 'INCOMING') return !isOutgoing;
              if (viewLogType === 'OUTGOING') return isOutgoing;
              return true;
          };

          const isStatusMatch = (c: Consignment) => {
              if (viewStatus === 'ALL') return true;
              return c.status === viewStatus;
          };

          const isRiskMatch = (c: Consignment) => {
              if (viewRisk === 'ALL') return true;
              if (viewRisk === 'HIGH') return (c.riskScore || 0) > 60;
              if (viewRisk === 'MEDIUM') return (c.riskScore || 0) > 30 && (c.riskScore || 0) <= 60;
              if (viewRisk === 'LOW') return (c.riskScore || 0) <= 30;
              return true;
          };

          const isSamplesMatch = (c: Consignment) => {
              if (viewSamples === 'ALL') return true;
              if (viewSamples === 'YES') return !!(c.samples && c.samples.length > 0) || c.hasSample;
              if (viewSamples === 'NO') return !(c.samples && c.samples.length > 0) && !c.hasSample;
              return true;
          };

          if (days === 'ALL') {
              // For ALL, we don't filter by date, just by other criteria
              return list.filter(c => {
                  const portMatch = selectedPortId === 'ALL' || c.port === activePortName;
                  return portMatch && isLogTypeMatch(c) && isStatusMatch(c) && isRiskMatch(c) && isSamplesMatch(c);
              });
          }
          
          if (timeRange === 'MONTH') {
              startDate.setDate(1); // Start of current month
          } else {
              startDate.setDate(endDate.getDate() - days);
          }
          
          return list.filter(c => {
              const d = new Date(c.arrivalDate);
              const dateMatch = d >= startDate && d <= endDate;
              const portMatch = selectedPortId === 'ALL' || c.port === activePortName;
              return dateMatch && portMatch && isLogTypeMatch(c) && isStatusMatch(c) && isRiskMatch(c) && isSamplesMatch(c);
          });
      };

      const daysMap = { '7DAYS': 7, '30DAYS': 30, 'MONTH': 30, 'ALL': 'ALL' as const };
      const days = daysMap[timeRange];
      
      const sectorConsignments = consignments.filter(c => viewSector === 'ALL' || c.type === viewSector);
      
      // Robust Sort: Newest First (Safe handling of undefined createdAt)
      const current = filterByDateAndPort(sectorConsignments, days, 0).sort((a, b) => {
          const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tB - tA;
      });
      const previous = filterByDateAndPort(sectorConsignments, days, days === 'ALL' ? 0 : days); // For trend calculation

      return { visibleConsignments: current, prevPeriodConsignments: previous };
  }, [consignments, viewSector, timeRange, selectedPortId, activePortName, viewLogType, viewStatus, viewRisk, viewSamples]);

  const [dashTableSearch, setDashTableSearch] = useState('');
  const [dashTableSort, setDashTableSort] = useState<{ key: keyof Consignment | 'bayanNumber'; direction: 'asc' | 'desc' }>({ key: 'createdAt', direction: 'desc' });

  const tableData = useMemo(() => {
      let data = visibleConsignments;
      
      // Apply Chart Filter
      if (chartFilter) {
        data = data.filter(c => {
          if (chartFilter.type === 'STATUS') {
              if (chartFilter.value === 'مطابق') return c.status === 'Approved' || c.inspectionResult === 'مطابق';
              if (chartFilter.value === 'غير مطابق') return c.status === 'Rejected' || c.inspectionResult === 'غير مطابق';
              if (chartFilter.value === 'قيد الفحص') return c.status === 'Pending' && (!c.inspectionResult || c.inspectionResult === 'قيد الفحص');
          }
          if (chartFilter.type === 'COMMODITY') {
              return (c.commodityGroup || 'غير محدد') === chartFilter.value || c.items?.some(i => (i.commodityGroup || 'غير محدد') === chartFilter.value);
          }
          return true;
        });
      }

      // Apply Search Filter for Dashboard Table
      if (dashTableSearch.trim()) {
        const term = dashTableSearch.toLowerCase();
        data = data.filter(c => 
          (c.bayanNumber || '').toLowerCase().includes(term) ||
          (c.importer || '').toLowerCase().includes(term) ||
          (c.exporter || '').toLowerCase().includes(term) ||
          (c.id || '').toLowerCase().includes(term) ||
          (c.permitNumber || '').toLowerCase().includes(term) ||
          c.items?.some(i => (i.description || '').toLowerCase().includes(term) || (i.hsCode || '').toLowerCase().includes(term))
        );
      }

      // Apply Sorting
      return [...data].sort((a, b) => {
        const valA = (a as any)[dashTableSort.key];
        const valB = (b as any)[dashTableSort.key];
        
        if (valA < valB) return dashTableSort.direction === 'asc' ? -1 : 1;
        if (valA > valB) return dashTableSort.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [visibleConsignments, chartFilter, dashTableSearch, dashTableSort]);

  const toggleSort = (key: keyof Consignment | 'bayanNumber') => {
    setDashTableSort(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const recentActivity = useMemo(() => {
      const allActivities = consignments.flatMap(c => 
          (c.auditLog || []).map(log => ({
              ...log,
              id: `${c.id}-${log.timestamp}-${Math.random().toString(36).substr(2, 9)}`,
              consignmentId: c.id,
              bayanNumber: c.bayanNumber,
              importer: c.importer,
              status: c.status
          }))
      );
      
      // If no audit logs exist, fallback to consignment creation
      if (allActivities.length === 0) {
          return [...consignments]
              .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
              .slice(0, 5)
              .map(c => ({
                  id: c.id,
                  consignmentId: c.id,
                  bayanNumber: c.bayanNumber,
                  importer: c.importer,
                  status: c.status,
                  action: 'تم تسجيل الإرسالية',
                  user: c.importer,
                  timestamp: c.createdAt || new Date().toISOString()
              }));
      }

      return allActivities
          .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
          .slice(0, 5);
  }, [consignments]);

  // --- Stats Calculation ---
  const stats = useMemo(() => {
      const calcStats = (list: Consignment[]) => ({
          total: list.length,
          totalIncoming: list.filter(c => !(c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير')).length,
          totalOutgoing: list.filter(c => c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير').length,
          totalWeightTons: list.reduce((acc, c) => acc + (Number(c.totalWeight) || 0), 0) / 1000,
          totalFees: list.reduce((acc, c) => acc + (Number(c.fees) || 0), 0),
          riskAlerts: list.filter(c => c.riskScore > 60).length,
          pending: list.filter(c => c.status === 'Pending').length,
          labSamples: list.reduce((acc, c) => acc + (c.samples ? c.samples.length : 0), 0)
      });

      const currentStats = calcStats(visibleConsignments);
      const prevStats = calcStats(prevPeriodConsignments);

      const calcTrend = (curr: number, prev: number) => {
          if (prev === 0) return curr > 0 ? 100 : 0;
          return Math.round(((curr - prev) / prev) * 100);
      };

      return {
          ...currentStats,
          trends: {
              incoming: calcTrend(currentStats.totalIncoming, prevStats.totalIncoming),
              outgoing: calcTrend(currentStats.totalOutgoing, prevStats.totalOutgoing),
              weight: calcTrend(currentStats.totalWeightTons, prevStats.totalWeightTons),
              fees: calcTrend(currentStats.totalFees, prevStats.totalFees),
              risk: calcTrend(currentStats.riskAlerts, prevStats.riskAlerts)
          }
      };
  }, [visibleConsignments, prevPeriodConsignments]);

  // Fetch AI Insights
  useEffect(() => {
      const fetchInsights = async () => {
          if (visibleConsignments.length > 0) {
              setIsAiLoading(true);
              const insights = await getDashboardInsights(stats, viewSector === 'ALL' ? 'جميع القطاعات' : CONSIGNMENT_LABELS[viewSector as ConsignmentType]);
              setAiInsights(insights);
              setIsAiLoading(false);
          }
      };
      fetchInsights();
  }, [viewSector, stats.totalIncoming]);

  const handleQuickNoteSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!quickNote.trim() || !currentUser) return;

      const newNote = {
          id: `note-${Date.now()}`,
          content: quickNote,
          user: currentUser.name,
          userId: currentUser.id,
          timestamp: new Date().toISOString(),
          category: 'GENERAL' as const,
          sector: viewSector,
          port: activePortName || 'غير محدد',
          shift: activeShift.type,
          isResolved: false
      };

      try {
          await addShiftNoteToDB(newNote);
          setQuickNote('');
      } catch (error) {
          console.error("Failed to add quick note:", error);
      }
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'quickActions':
        return (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {currentUser?.role === 'LAB_TECH' ? (
              <Link to="/sampling" className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all group shadow-lg shadow-slate-200/40">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center text-2xl transition-all duration-300 shadow-inner">
                  <FlaskConical size={28} />
                </div>
                <span className="text-xs font-black text-slate-700">إدارة العينات</span>
              </Link>
            ) : (
              <Link to="/portal" className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all group shadow-lg shadow-slate-200/40">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-[#c8102e] group-hover:text-white flex items-center justify-center text-2xl transition-all duration-300 shadow-inner">
                  <Plus size={28} />
                </div>
                <span className="text-xs font-black text-slate-700">تسجيل إرسالية</span>
              </Link>
            )}
            <button onClick={() => setShowQueryModal(true)} className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all group shadow-lg shadow-slate-200/40">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center text-2xl transition-all duration-300 shadow-inner">
                <Search size={28} />
              </div>
              <span className="text-xs font-black text-slate-700">استعلام سريع</span>
            </button>
            <Link to="/reports" className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all group shadow-lg shadow-slate-200/40">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center text-2xl transition-all duration-300 shadow-inner">
                <TrendingUp size={28} />
              </div>
              <span className="text-xs font-black text-slate-700">التقارير والإحصائيات</span>
            </Link>
            <Link to="/undertakings" className="bg-white/80 backdrop-blur-md border border-white/50 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all group shadow-lg shadow-slate-200/40">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center text-2xl transition-all duration-300 shadow-inner">
                <FileText size={28} />
              </div>
              <span className="text-xs font-black text-slate-700">التعهدات</span>
            </Link>
            {currentUser?.civilId === '7734383' && (
              <button 
                onClick={onShowPresentation} 
                className="bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:shadow-xl hover:-translate-y-1 transition-all group shadow-lg shadow-slate-900/40 md:col-span-1"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white flex items-center justify-center text-2xl transition-all duration-300 shadow-inner">
                  <Play size={28} />
                </div>
                <span className="text-xs font-black text-white">العرض التعريفي</span>
              </button>
            )}
          </div>
        );
      case 'statsGrid':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="إجمالي الوارد" 
              value={stats.totalIncoming} 
              icon={ArrowDownCircle} 
              color="emerald" 
              unit="إرسالية" 
              trend={stats.trends.incoming} 
            />
            {viewSector !== ConsignmentType.FOOD_SAFETY && (
              <StatCard 
                label="إجمالي الصادر" 
                value={stats.totalOutgoing} 
                icon={ArrowUpCircle} 
                color="blue" 
                unit="إرسالية" 
                trend={stats.trends.outgoing} 
              />
            )}
            <StatCard label="الوزن الكلي" value={Number(stats.totalWeightTons.toFixed(1))} icon={TrendingUp} color={viewSector === 'ALL' ? 'indigo' : viewSector as string} unit="طن" trend={stats.trends.weight} />
            <StatCard label="الرسوم المحصلة" value={stats.totalFees} icon={TrendingUp} color="emerald" unit="ر.ع" formatNumber trend={stats.trends.fees} />
          </div>
        );
      case 'aiInsights':
        return (
          <div className="card-base p-6 bg-gradient-to-br from-indigo-600 to-violet-700 text-white h-full relative overflow-hidden group rounded-[2.5rem]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-sm backdrop-blur-sm">
                  <BrainCircuit size={18} className="animate-pulse" />
                </div>
                <h4 className="font-black text-sm">رؤى مرقاب AI</h4>
              </div>
              
              {isAiLoading ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-white/20 rounded w-3/4"></div>
                  <div className="h-4 bg-white/20 rounded w-1/2"></div>
                </div>
              ) : aiInsights.length > 0 ? (
                <div className="space-y-4">
                  {aiInsights.map((insight, idx) => (
                    <div key={idx} className={`flex gap-3 items-start p-2 rounded-xl transition-all ${
                      insight.type === 'warning' ? 'bg-amber-500/20 border border-amber-500/30' : 
                      insight.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/30' : 
                      'bg-white/5'
                    }`}>
                      <div className={`mt-1 text-xs ${
                        insight.type === 'warning' ? 'text-amber-300' : 
                        insight.type === 'success' ? 'text-emerald-300' : 
                        'opacity-80'
                      }`}>
                        {/* Fallback for icons if not Lucide */}
                        <i className={`fas ${insight.icon}`}></i>
                      </div>
                      <div>
                        <p className="text-[11px] font-black leading-tight mb-0.5">{insight.title}</p>
                        <p className="text-[10px] opacity-80 leading-relaxed line-clamp-2">{insight.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] opacity-70">قم بتسجيل المزيد من البيانات للحصول على رؤى ذكية...</p>
              )}
            </div>
          </div>
        );
      case 'pendingAlerts':
        return (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <GlassCard className="border-r-4 border-r-amber-500 bg-gradient-to-l from-amber-50/50 to-white">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-amber-800 mb-1">بانتظار الفحص</h4>
                  <p className="text-3xl font-black text-slate-800">{stats.pending} <span className="text-sm text-slate-500 font-bold">إرسالية</span></p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl shadow-inner">
                  <ClipboardCheck size={24} />
                </div>
              </div>
            </GlassCard>
            <GlassCard className={`border-r-4 border-r-red-600 bg-gradient-to-l from-red-50/50 to-white relative overflow-hidden ${stats.riskAlerts > 0 ? 'ring-4 ring-red-500/10 shadow-2xl shadow-red-200' : ''}`}>
              {stats.riskAlerts > 0 && (
                <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse"></div>
              )}
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <h4 className={`font-black mb-1 ${stats.riskAlerts > 0 ? 'text-red-600 flex items-center gap-2' : 'text-red-800'}`}>
                    {stats.riskAlerts > 0 && <i className="fas fa-exclamation-triangle animate-bounce"></i>}
                    مخاطر عالية
                  </h4>
                  <p className={`text-3xl font-black ${stats.riskAlerts > 0 ? 'text-red-600' : 'text-slate-800'}`}>{stats.riskAlerts} <span className="text-sm text-slate-500 font-bold">إرسالية</span></p>
                </div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner transition-all transform ${stats.riskAlerts > 0 ? 'bg-red-600 text-white scale-110 rotate-12' : 'bg-red-100 text-red-600'}`}>
                  <AlertCircle size={24} />
                </div>
              </div>
              {stats.riskAlerts > 0 && (
                <p className="text-[10px] font-black text-red-700 mt-2 bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 inline-block animate-pulse">
                   يتطلب اتخاذ إجراء فني فوري
                </p>
              )}
            </GlassCard>
            <Link to="/sampling" className="group">
              <GlassCard className="border-r-4 border-r-blue-500 bg-gradient-to-l from-blue-50/50 to-white hover:shadow-xl transition-all cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-black text-blue-800 mb-1 group-hover:text-blue-600 transition-colors">عينات في المختبر</h4>
                    <p className="text-3xl font-black text-slate-800">{stats.labSamples} <span className="text-sm text-slate-500 font-bold">عينة</span></p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                    <FlaskConical size={24} />
                  </div>
                </div>
              </GlassCard>
            </Link>
          </div>
        );
      case 'advancedPerformance':
        return (
          <GlassCard className="h-full bg-gradient-to-br from-slate-50 to-white">
            <WidgetHeader title="تحليلات الأداء" icon={TrendingUp} badge="مؤشرات ذكية" color="indigo" />
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">متوسط وقت الفسح</p>
                  <p className="text-xl font-black text-indigo-600">{performanceStats.avgClearanceTime} <span className="text-[10px] text-slate-400 font-bold">ساعة</span></p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Clock size={20} />
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الامتثال لاتفاقية الخدمة</p>
                  <p className="text-xl font-black text-emerald-600">{performanceStats.slaCompliance}%</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <ClipboardCheck size={20} />
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الإنتاجية اليومية</p>
                  <p className="text-xl font-black text-blue-600">{performanceStats.throughput} <span className="text-[10px] text-slate-400 font-bold">إرسالية/يوم</span></p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Zap size={20} />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-2">
                      <span>كفاءة النظام</span>
                      <span>{performanceStats.slaCompliance}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${performanceStats.slaCompliance}%` }}
                        className="h-full bg-emerald-500"
                      />
                  </div>
              </div>
            </div>
          </GlassCard>
        );
      case 'shiftInfo':
        return (
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden h-full flex flex-col justify-center">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner text-purple-300 text-2xl">
                  <Zap size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white mb-1">الحالة التشغيلية للفريق</h3>
                  <p className="text-sm font-bold text-slate-300">الوردية الحالية: {activeShift.name}</p>
                  <div className="flex items-center gap-2 text-xs text-green-300 bg-green-500/10 px-3 py-1 rounded-lg mt-2 border border-green-500/20">
                    <Users size={14} />
                    <span>{activeShift.count > 0 ? `${activeShift.count} مفتشين في الخدمة حالياً` : 'لم يتم تسجيل طاقم للمناوبة'}</span>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 max-w-xs w-full">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">مؤشر الكثافة المتوقع</p>
                    <span className={`text-xs font-black ${peakStats.statusColor}`}>{peakStats.intensityIndex}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${peakStats.intensityIndex}%` }}
                        className={`h-full ${peakStats.intensityIndex > 70 ? 'bg-red-500' : peakStats.intensityIndex > 40 ? 'bg-amber-500' : 'bg-green-500'}`}
                    />
                </div>
                <p className={`text-sm font-bold leading-relaxed ${peakStats.statusColor}`}>{peakStats.recommendation}</p>
              </div>
            </div>
          </div>
        );
      case 'teamPresence':
        return (
          <GlassCard className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <WidgetHeader title="المتصلون الآن" icon={Users} color="green" badge="نشط" />
              {currentUser?.role === 'ADMIN' && onlineUsers.length > 0 && stats.pending > 0 && (
                <button 
                  onClick={async () => {
                    if(window.confirm('هل تريد توزيع المعاملات المعلقة تلقائياً على المفتشين المتاحين؟')) {
                      try {
                        const pendingDocs = await FB.db.collection('consignments').where('status', '==', 'PENDING').get();
                        if(pendingDocs.empty) return;
                        
                        const inspectors = onlineUsers.filter(u => u.role === 'INSPECTOR');
                        if(inspectors.length === 0) {
                          alert('لا يوجد مفتشين متصلين حالياً');
                          return;
                        }

                        const batch = FB.db.batch();
                        let inspectorIndex = 0;

                        pendingDocs.docs.forEach(doc => {
                          const inspector = inspectors[inspectorIndex];
                          batch.update(doc.ref, {
                            assignedTo: inspector.id,
                            assignedAt: new Date().toISOString()
                          });
                          inspectorIndex = (inspectorIndex + 1) % inspectors.length;
                        });

                        await batch.commit();
                        alert(`تم توزيع ${pendingDocs.size} معاملة على ${inspectors.length} مفتشين`);
                      } catch (e) {
                        console.error(e);
                        alert('حدث خطأ أثناء التوزيع');
                      }
                    }
                  }}
                  className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                >
                  <i className="fas fa-magic"></i> توزيع تلقائي
                </button>
              )}
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[150px] custom-scrollbar pr-2 scroll-fade-y">
              {onlineUsers.length > 0 ? onlineUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs border border-slate-200">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-slate-700">{u.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{u.role === 'ADMIN' ? 'مدير نظام' : 'مفتش'}</p>
                    </div>
                  </div>
                  {u.role === 'INSPECTOR' && (
                    <div className="text-[10px] bg-slate-50 border border-slate-100 px-2 py-1 rounded-md text-slate-500 font-bold">
                      متاح
                    </div>
                  )}
                </div>
              )) : (
                <p className="text-[10px] text-slate-400 text-center py-4 font-bold">لا يوجد مستخدمون متصلون</p>
              )}
            </div>
          </GlassCard>
        );
      case 'logisticsMap':
        return (
          <GlassCard noPadding className="relative overflow-hidden">
            <div className="p-8 pb-0 flex justify-between items-center relative z-10">
              <h3 className="font-black text-xl text-slate-800">خريطة العمليات اللوجستية</h3>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                تتبع حي
              </span>
            </div>
            <div className="p-8 pt-4">
              <LogisticsMap consignments={visibleConsignments} />
            </div>
          </GlassCard>
        );
      case 'charts':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <GlassCard className="lg:col-span-2 h-[450px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-xl text-slate-800">العوائد المالية وحركة العمل</h3>
                  <div className="flex gap-4 text-xs font-bold">
                    {viewLogType === 'ALL' ? (
                      <>
                        <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> الوارد</span>
                        <span className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> الصادر</span>
                      </>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-500"><span className="w-2 h-2 rounded-full bg-slate-800"></span> المعاملات</span>
                    )}
                    <span className="flex items-center gap-1 text-emerald-600"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> الرسوم (ر.ع)</span>
                  </div>
                </div>
                
                <ChartInsight text={chartInsightsData.financial} color="emerald" />

                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={financialData}>
                      <defs>
                        <linearGradient id="colorFees" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dy={10} />
                      <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#94a3b8'}} dx={-10} allowDecimals={false} />
                      <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#10b981'}} dx={10} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)', direction: 'rtl', padding: '12px'}} itemStyle={{fontFamily: 'Tajawal', fontWeight: 'bold'}} />
                      <Bar yAxisId="right" dataKey="fees" barSize={20} fill="url(#colorFees)" radius={[4, 4, 0, 0]} name="الرسوم" />
                      {viewLogType === 'ALL' ? (
                        <>
                          <Line yAxisId="left" type="monotone" dataKey="incoming" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} name="الوارد" />
                          <Line yAxisId="left" type="monotone" dataKey="outgoing" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} name="الصادر" />
                        </>
                      ) : (
                        <Line yAxisId="left" type="monotone" dataKey="count" stroke="#1e293b" strokeWidth={3} dot={{r: 4, strokeWidth: 2, fill: '#fff'}} name="العدد" />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
              <GlassCard className="h-[450px] flex flex-col relative group">
                <h3 className="font-black text-lg text-slate-800 mb-2">توزيع المخاطر</h3>
                <ChartInsight text={chartInsightsData.risk} color="rose" />
                <div className="flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" barSize={20} data={riskDistribution}>
                      <RadialBar
                        background
                        dataKey="count"
                        cornerRadius={10}
                        label={{ position: 'insideStart', fill: '#fff', fontSize: 10, fontWeight: 'bold' }}
                      />
                      <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold', right: 0}} />
                      <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <GlassCard className="lg:col-span-2 h-[400px] flex flex-col">
                <h3 className="font-black text-lg text-slate-800 mb-2">منحى زمن الفسح (Clearance Trend)</h3>
                <ChartInsight text="رصد استجابة النظام ومتوسط ساعات الانتظار" color="blue" />
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={financialData}>
                      <defs>
                        <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} dx={-10} unit="س" />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.1)'}} />
                      <Area type="monotone" dataKey="avgTime" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTime)" name="متوسط الساعات" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
              <GlassCard className="h-[400px] flex flex-col justify-center items-center relative">
                <h3 className="font-black text-lg text-slate-800 mb-2 absolute top-8">مؤشر الامتثال (SLA)</h3>
                <div className="w-full h-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'مطابق', value: performanceStats.slaCompliance, fill: '#10b981' },
                                    { name: 'متأخر', value: 100 - performanceStats.slaCompliance, fill: '#f1f5f9' }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                            >
                                <Cell key="cell-0" fill="#10b981" />
                                <Cell key="cell-1" fill="#f1f5f9" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-3xl font-black text-emerald-600">{performanceStats.slaCompliance}%</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Target: 24h</span>
                    </div>
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {viewLogType === 'ALL' && (
                <GlassCard className="h-[350px] flex flex-col">
                  <h3 className="font-black text-lg text-slate-800 mb-2">توزيع (وارد / صادر)</h3>
                  <div className="flex-1 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={logTypeDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" cornerRadius={6}>
                          {logTypeDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              )}
              <GlassCard className={`${viewLogType === 'ALL' ? 'lg:col-span-1' : 'lg:col-span-1'} h-[400px] flex flex-col`}>
                <h3 className="font-black text-lg text-slate-800 mb-2">أعلى المستوردين نشاطاً</h3>
                <ChartInsight text={chartInsightsData.importer} color="blue" />
                <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={importerData} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 9, fontWeight: 'bold', fill: '#64748b'}} interval={0} />
                      <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={15} background={{ fill: '#f1f5f9' }} name="عدد المعاملات">
                        {importerData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#1d4ed8' : '#60a5fa'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
              <GlassCard className="lg:col-span-2 h-[400px] flex flex-col relative">
                <h3 className="font-black text-lg text-slate-800 mb-2">نتائج الفحص والمعاينة</h3>
                <ChartInsight text={chartInsightsData.compliance} color="emerald" />
                <div className="flex-1 cursor-pointer">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={inspectionData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" cornerRadius={6} onClick={(data) => setChartFilter({ type: 'STATUS', value: data.name })}>
                        {inspectionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" className="hover:opacity-80" />)}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '10px', fontWeight: 'bold'}} />
                      <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {chartFilter?.type === 'STATUS' && <div className="absolute top-4 left-4 bg-slate-800 text-white text-[9px] px-2 py-1 rounded-lg flex items-center gap-1"><span>{chartFilter.value}</span><button onClick={() => setChartFilter(null)}><Plus size={10} className="rotate-45" /></button></div>}
              </GlassCard>
            </div>
          </div>
        );
      case 'inspectorKPIs':
        return (
          <GlassCard className="h-[400px] flex flex-col">
            <h3 className="font-black text-lg text-slate-800 mb-2">مؤشرات أداء المفتشين</h3>
            <ChartInsight text={chartInsightsData.kpi} color="indigo" />
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={inspectorKPIs} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} interval={0} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={15} background={{ fill: '#f1f5f9' }} name="المعاملات المنجزة">
                    {inspectorKPIs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#6d28d9' : '#a78bfa'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        );
      case 'rejectionAnalysis':
        return (
          <GlassCard className="h-[400px] flex flex-col">
            <h3 className="font-black text-lg text-slate-800 mb-2">تحليل أسباب الرفض</h3>
            <ChartInsight text={chartInsightsData.rejection} color="rose" />
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rejectionData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} dx={-10} allowDecimals={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} name="عدد الحالات">
                    {rejectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#b91c1c' : '#f87171'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        );
      case 'recentActivity':
        return (
          <GlassCard className="h-full">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-slate-800 text-sm">آخر النشاطات</h4>
              <Link to="/portal" className="text-[10px] font-black text-blue-600 hover:underline">عرض الكل</Link>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity, idx) => (
                <div key={activity.id} className="flex gap-4 relative">
                  {idx !== recentActivity.length - 1 && <div className="absolute top-8 bottom-0 right-4 w-0.5 bg-slate-100"></div>}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] z-10 shadow-sm ${activity.action.includes('رفض') ? 'bg-red-500' : activity.action.includes('موافق') || activity.action.includes('إفراج') ? 'bg-green-500' : 'bg-blue-500'}`}>
                    {activity.action.includes('رفض') ? <Ban size={14} /> : activity.action.includes('موافق') || activity.action.includes('إفراج') ? <ClipboardCheck size={14} /> : <History size={14} />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-black text-slate-800">{activity.user || activity.importer}</p>
                      <span className="text-[9px] text-slate-400 font-mono">{new Date(activity.timestamp || 0).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                      {activity.action} - بيان رقم <span className="text-slate-700 font-mono">{activity.bayanNumber}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        );
      case 'quickNote':
        return (
          <GlassCard className="bg-slate-50/50 border-dashed border-2 border-slate-200 h-full">
            <WidgetHeader title="ملاحظة سريعة للمناوبة" icon={MessageSquarePlus} color="slate" />
            <form onSubmit={handleQuickNoteSubmit} className="space-y-3">
              <textarea 
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                placeholder="اكتب ملاحظة مهمة للمناوبة القادمة..."
                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                rows={4}
              />
              <button 
                type="submit" 
                disabled={!quickNote.trim()}
                className="w-full bg-slate-800 text-white py-4 rounded-2xl text-xs font-black shadow-lg hover:bg-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              >
                حفظ الملاحظة
              </button>
            </form>
          </GlassCard>
        );
      case 'periodComparison':
        return (
          <GlassCard>
            <WidgetHeader title="مقارنة الفترات" icon={TrendingUp} badge="تحليل زمني" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">الفترة الحالية</p>
                <p className="text-2xl font-black text-slate-800">{stats.totalIncoming} إرسالية</p>
              </div>
              <div className="p-6 rounded-[2rem] bg-slate-50 border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">الفترة السابقة</p>
                <p className="text-2xl font-black text-slate-800">{prevPeriodConsignments.length} إرسالية</p>
              </div>
              <div className="md:col-span-2 flex items-center gap-6 p-6 rounded-[2rem] bg-indigo-50 border border-indigo-100">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${stats.trends.incoming >= 0 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
                  {stats.trends.incoming >= 0 ? <ArrowUpRight size={32} /> : <ArrowDownRight size={32} />}
                </div>
                <div>
                  <p className="text-xs font-black text-indigo-900 mb-1">معدل النمو الإجمالي</p>
                  <p className={`text-2xl font-black ${stats.trends.incoming >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.trends.incoming >= 0 ? '+' : ''}{stats.trends.incoming}% مقارنة بالفترة السابقة
                  </p>
                </div>
              </div>
            </div>
            {/* Integrated Insights Text Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">الرؤية المالية والامتثال</p>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{chartInsightsData.financial} {chartInsightsData.compliance}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase mb-2">تحليل المخاطر والموردين</p>
                    <p className="text-xs font-bold text-slate-700 leading-relaxed">{chartInsightsData.risk} {chartInsightsData.importer}</p>
                </div>
            </div>
          </GlassCard>
        );
      default:
        return null;
    }
  };

  const onlineUsers = useMemo(() => {
      // Prioritize real-time sessions data
      if (activeSessions.length > 0) {
          return activeSessions.map(session => {
              const userDetail = users.find(u => u.id === session.userId);
              return {
                  id: session.userId,
                  name: session.name,
                  role: session.role,
                  allowedSectors: userDetail?.allowedSectors || []
              };
          }).filter(u => (viewSector === 'ALL' || u.allowedSectors?.includes(viewSector as ConsignmentType)));
      }
      // Fallback to static users list if no sessions found (e.g. during initial load or if sessions collection is empty)
      return users.filter(u => u.isOnline && (viewSector === 'ALL' || u.allowedSectors?.includes(viewSector as ConsignmentType)));
  }, [users, viewSector, activeSessions]);

  // --- Performance Stats Calculation ---
  const performanceStats = useMemo(() => {
    const closedConsignments = visibleConsignments.filter(c => c.status === 'Approved' || c.status === 'Rejected');
    
    if (closedConsignments.length === 0) return { avgClearanceTime: 0, slaCompliance: 0, throughput: 0 };

    const totalClearanceTime = closedConsignments.reduce((acc, c) => {
      if (!c.updatedAt) return acc;
      const start = new Date(c.createdAt || 0).getTime();
      const end = new Date(c.updatedAt).getTime();
      const diff = end - start;
      return diff > 0 ? acc + diff : acc;
    }, 0);

    const closedWithTime = closedConsignments.filter(c => c.updatedAt).length || 1;
    const avgClearanceTime = (totalClearanceTime / closedWithTime) / (1000 * 60 * 60); // In hours
    
    // SLA compliance (e.g., target < 24 hours)
    const targetHours = 24;
    const compliantCount = closedConsignments.filter(c => {
      if (!c.updatedAt) return true; // Assume compliant if not yet processed or legacy
      const start = new Date(c.createdAt || 0).getTime();
      const end = new Date(c.updatedAt).getTime();
      return (end - start) / (1000 * 60 * 60) <= targetHours;
    }).length;
    
    const slaCompliance = Math.round((compliantCount / closedConsignments.length) * 100);
    
    // Daily throughput
    const distinctDays = new Set(visibleConsignments.map(c => c.arrivalDate)).size || 1;
    const throughput = Math.round(visibleConsignments.length / distinctDays);

    return { 
      avgClearanceTime: Number(avgClearanceTime.toFixed(1)), 
      slaCompliance, 
      throughput 
    };
  }, [visibleConsignments]);

  // Calculate Peak Predictions based on registered consignments
  const peakStats = useMemo(() => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // 1. Expected Tomorrow
      const tomorrowCount = consignments.filter(c => c.arrivalDate === tomorrowStr).length;

      // 2. Find Peak Day in next 7 days
      const upcomingCounts: Record<string, number> = {};
      for(let i=1; i<=7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          const dStr = d.toISOString().split('T')[0];
          upcomingCounts[dStr] = 0;
      }

      consignments.forEach(c => {
          if (upcomingCounts[c.arrivalDate] !== undefined) {
              upcomingCounts[c.arrivalDate]++;
          }
      });

      let peakDate = '';
      let peakCount = 0;
      Object.entries(upcomingCounts).forEach(([date, count]) => {
          if (count > peakCount) {
              peakCount = count;
              peakDate = date;
          }
      });

      const peakDayName = peakDate ? new Date(peakDate).toLocaleDateString('ar-OM', { weekday: 'long' }) : 'لا يوجد';

      // 3. Workload Intensity Map (current weight vs capacity)
      const avgWeight = stats.totalWeightTons / (stats.total || 1);
      const intensityIndex = Math.min(100, Math.round((tomorrowCount * (avgWeight > 20 ? 1.5 : 1) / 30) * 100));

      // Generate Recommendation based on Tomorrow's Count & Intensity
      let recommendation = '';
      let statusColor = '';
      
      if (intensityIndex > 70) {
          recommendation = `كثافة عمل عالية (${intensityIndex}%). يوصى بتوفير طاقم كامل وتفعيل بروتوكول الازدحام.`;
          statusColor = 'text-red-300';
      } else if (intensityIndex > 40) {
          recommendation = `نشاط متوسط (${intensityIndex}%). الطاقم الاعتيادي كافٍ مع مراقبة فترات الذروة.`;
          statusColor = 'text-amber-300';
      } else {
          recommendation = `حركة مستقرة (${intensityIndex}%). يمكن استغلال الوقت في المهام الإدارية.`;
          statusColor = 'text-green-300';
      }

      return {
          tomorrowCount,
          peakDay: peakDayName,
          peakCount,
          peakDate,
          recommendation,
          statusColor,
          intensityIndex
      };
  }, [consignments]);

  // --- Charts Data ---

  // 1. Flow & Financials (Merged)
  const financialData = useMemo(() => {
    const data = [];
    const today = new Date();
    const daysCount = timeRange === 'ALL' ? 30 : timeRange === '30DAYS' ? 15 : timeRange === 'MONTH' ? new Date().getDate() : 7;
    const interval = timeRange === 'ALL' ? 3 : timeRange === '30DAYS' ? 2 : 1;
    
    for (let i = daysCount - 1; i >= 0; i-=interval) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const displayLabel = d.toLocaleDateString('ar-OM', { weekday: 'short', day: 'numeric' });
        
        const dayItems = visibleConsignments.filter(c => (c.arrivalDate || '').startsWith(dateStr));
        const closedDayItems = dayItems.filter(c => (c.status === 'Approved' || c.status === 'Rejected') && c.updatedAt);
        
        const avgTime = closedDayItems.length > 0 
          ? (closedDayItems.reduce((acc, c) => {
              const start = new Date(c.createdAt || 0).getTime();
              const end = new Date(c.updatedAt!).getTime();
              return acc + (end - start);
            }, 0) / closedDayItems.length) / (1000 * 60 * 60)
          : 0;

        const incoming = dayItems.filter(c => !(c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير')).length;
        const outgoing = dayItems.filter(c => c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير').length;
        const fees = dayItems.reduce((acc, c) => acc + (Number(c.fees) || 0), 0);
        
        data.push({ 
          name: displayLabel, 
          date: dateStr, 
          count: dayItems.length, 
          incoming,
          outgoing,
          fees: fees,
          avgTime: Number(avgTime.toFixed(1))
        });
    }
    return data;
  }, [visibleConsignments, timeRange]);

  // 1.5. Log Type Distribution (Pie)
  const logTypeDistribution = useMemo(() => {
    const incoming = visibleConsignments.filter(c => !(c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير')).length;
    const outgoing = visibleConsignments.filter(c => c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير').length;
    return [
      { name: 'وارد', value: incoming, color: '#10b981' },
      { name: 'صادر', value: outgoing, color: '#3b82f6' }
    ].filter(d => d.value > 0);
  }, [visibleConsignments]);

  // 2. Inspection Results (Pie)
  const inspectionData = useMemo(() => {
      const compliant = visibleConsignments.filter(c => c.inspectionResult === 'مطابق' || c.status === 'Approved').length;
      const nonCompliant = visibleConsignments.filter(c => c.inspectionResult === 'غير مطابق' || c.status === 'Rejected').length;
      const pending = visibleConsignments.filter(c => c.inspectionResult === 'قيد الفحص' || (!c.inspectionResult && c.status === 'Pending')).length;
      return [{ name: 'مطابق', value: compliant, color: '#10b981' }, { name: 'غير مطابق', value: nonCompliant, color: '#ef4444' }, { name: 'قيد الفحص', value: pending, color: '#f59e0b' }].filter(d => d.value > 0);
  }, [visibleConsignments]);

  // 3. Top Importers (Bar)
  const importerData = useMemo(() => {
      const counts: Record<string, number> = {};
      visibleConsignments.forEach(c => {
          counts[c.importer] = (counts[c.importer] || 0) + 1;
      });
      return Object.entries(counts)
          .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 20) + '..' : name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // Top 5
  }, [visibleConsignments]);

  // 4. Risk Distribution (Radial)
  const riskDistribution = useMemo(() => {
      const high = visibleConsignments.filter(c => c.riskScore > 70).length;
      const medium = visibleConsignments.filter(c => c.riskScore > 30 && c.riskScore <= 70).length;
      const low = visibleConsignments.filter(c => c.riskScore <= 30).length;
      return [
          { name: 'منخفض', count: low, fill: '#10b981' },
          { name: 'متوسط', count: medium, fill: '#f59e0b' },
          { name: 'مرتفع', count: high, fill: '#ef4444' }
      ];
  }, [visibleConsignments]);

  // 5. Inspector KPIs
  const inspectorKPIs = useMemo(() => {
      const inspectorStats: Record<string, { count: number, totalTime: number }> = {};
      
      visibleConsignments.forEach(c => {
          if (c.inspectorName && (c.status === 'Approved' || c.status === 'Rejected')) {
              if (!inspectorStats[c.inspectorName]) {
                  inspectorStats[c.inspectorName] = { count: 0, totalTime: 0 };
              }
              inspectorStats[c.inspectorName].count++;
              // Simulate time taken (in minutes) based on risk score or random for demo
              const timeTaken = Math.max(15, Math.floor(c.riskScore / 2) + 10);
              inspectorStats[c.inspectorName].totalTime += timeTaken;
          }
      });

      return Object.entries(inspectorStats)
          .map(([name, stats]) => ({
              name: name.split(' ')[0], // First name only for brevity
              count: stats.count,
              avgTime: Math.round(stats.totalTime / stats.count)
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
  }, [visibleConsignments]);

  // 6. Rejection Analysis
  const rejectionData = useMemo(() => {
      const reasons: Record<string, number> = {};
      visibleConsignments.forEach(c => {
          if (c.status === 'Rejected' && c.rejectionReason) {
              reasons[c.rejectionReason] = (reasons[c.rejectionReason] || 0) + 1;
          }
      });
      return Object.entries(reasons)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
  }, [visibleConsignments]);

  const chartInsightsData = useMemo(() => {
    const totalFees = stats.totalFees;
    const avgFees = totalFees / (stats.total || 1);
    
    // Financial Insight
    let financial = `بلغ إجمالي العوائد ${totalFees.toLocaleString()} ر.ع، بمتوسط ${avgFees.toFixed(1)} ر.ع لكل معاملة.`;
    if (stats.trends.fees > 0) financial += ` هناك نمو بنسبة ${stats.trends.fees}% في العوائد المجمعة.`;
    
    // Risk Insight
    const highRiskCount = riskDistribution.find(d => d.name === 'مرتفع')?.count || 0;
    let risk = `تم رصد ${highRiskCount} إرسالية عالية المخاطر.`;
    if (highRiskCount > 5) risk += ` يتطلب هذا يقظة إضافية ومراجعة دقيقة لطلبات الفحص.`;
    else risk += ` مستوى المخاطر مستقر وضمن النطاق المعتاد.`;

    // Compliance Insight
    const compliant = inspectionData.find(d => d.name === 'مطابق')?.value || 0;
    const totalInspected = inspectionData.reduce((acc, d) => acc + d.value, 0);
    const complianceRate = Math.round((compliant / (totalInspected || 1)) * 100);
    let compliance = `معدل المطابقة الكلي يبلغ ${complianceRate}%.`;
    if (complianceRate < 80) compliance += ` يُلاحظ انخفاض في الامتثال، مما يستدعي مراجعة المعايير.`;

    // Importer Insight
    const topImporter = importerData[0];
    let importer = topImporter ? `شركة "${topImporter.name}" هي الأكثر نشاطاً حالياً بـ ${topImporter.count} معاملة.` : "لا تتوفر بيانات مستوردين نشطة حالياً.";

    // KPI Insight
    const topInspector = inspectorKPIs[0];
    let kpi = topInspector ? `المفتش "${topInspector.name}" هو الأكثر إنتاجية في هذه الفترة بـ ${topInspector.count} معاملة.` : "لا توجد بيانات إنتاجية للمفتشين.";

    // Rejection Insight
    const topReason = rejectionData[0];
    let rejection = topReason ? `أهم سبب للرفض هو "${topReason.name}" بنسبة ${Math.round((topReason.count / (stats.total || 1)) * 100)}% من الحالات.` : "لا تتوفر بيانات كافية لتحليل أسباب الرفض.";

    return { financial, risk, compliance, importer, kpi, rejection };
  }, [stats, riskDistribution, inspectionData, importerData, rejectionData, inspectorKPIs]);

  const SECTOR_COLORS: Record<string, string> = { [ConsignmentType.VETERINARY]: '#f59e0b', [ConsignmentType.AGRICULTURAL]: '#10b981', [ConsignmentType.FOOD_SAFETY]: '#3b82f6' };
  const SECTOR_ICONS: Record<string, string> = { [ConsignmentType.VETERINARY]: 'fa-paw', [ConsignmentType.AGRICULTURAL]: 'fa-seedling', [ConsignmentType.FOOD_SAFETY]: 'fa-utensils' };

  const handleRowClick = (consignmentId: string) => navigate('/portal', { state: { viewId: consignmentId } });

  const exportToExcel = async () => {
      await exportConsignmentsToExcel(visibleConsignments, `تقرير_الإرساليات_${viewSector === 'ALL' ? 'الكل' : CONSIGNMENT_LABELS[viewSector as ConsignmentType]}`);
  };

  const handleSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!queryTerm.trim() && !queryDate) return;
      
      const term = queryTerm.trim().toLowerCase();
      const results = consignments.filter(c => {
          const matchTerm = term === '' || 
              (c.bayanNumber || '').toLowerCase().includes(term) || 
              (c.permitNumber || '').toLowerCase().includes(term) || 
              (c.id || '').toLowerCase().includes(term) || 
              (c.importer || '').toLowerCase().includes(term) ||
              (c.exporter || '').toLowerCase().includes(term) ||
              c.items?.some(i => (i.description || '').toLowerCase().includes(term) || (i.hsCode || '').toLowerCase().includes(term));
          
          const matchDate = queryDate === '' || c.arrivalDate === queryDate;
          
          return matchTerm && matchDate;
      }).sort((a, b) => a.type === viewSector ? -1 : 1);

      setQueryResults(results);
      setHasSearched(true);
  };

  const resetQuery = () => {
      setQueryTerm('');
      setQueryDate('');
      setQueryResults([]);
      setHasSearched(false);
  };

  const isAnyFilterActive = useMemo(() => {
    return selectedPortId !== 'ALL' || viewSector !== activeSector || viewLogType !== 'ALL' || viewStatus !== 'ALL' || viewRisk !== 'ALL' || viewSamples !== 'ALL' || timeRange !== 'ALL' || dashTableSearch !== '';
  }, [selectedPortId, viewSector, activeSector, viewLogType, viewStatus, viewRisk, viewSamples, timeRange, dashTableSearch]);

  const resetAllFilters = () => {
    setSelectedPortId('ALL');
    setViewSector(activeSector);
    setViewLogType('ALL');
    setViewStatus('ALL');
    setViewRisk('ALL');
    setViewSamples('ALL');
    setTimeRange('ALL');
    setDashTableSearch('');
    setChartFilter(null);
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* PWA Install Banner */}
      {installPrompt && (
          <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 flex flex-col md:flex-row items-center justify-between gap-4 animate-scale-in">
              <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                      <i className="fas fa-mobile-alt"></i>
                  </div>
                  <div>
                      <h4 className="font-black text-lg">تثبيت نظام مرقاب على جهازك</h4>
                      <p className="text-xs text-indigo-100 font-bold">احصل على تجربة أسرع وسهولة في الوصول كبرنامج مستقل</p>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button onClick={onInstall} className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-black text-xs shadow-lg hover:bg-indigo-50 transition-all active:scale-95">تثبيت الآن</button>
                  <button onClick={() => {/* Hide logic */}} className="bg-indigo-500 text-white px-4 py-3 rounded-xl font-bold text-xs hover:bg-indigo-400 transition-all">لاحقاً</button>
              </div>
          </div>
      )}

      {/* Header & Advanced Filters */}
      <div className="flex flex-col gap-6">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-4">
                <h2 className="text-4xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                  <LayoutDashboard size={36} className="text-[#c8102e]" />
                  نظرة عامة
                </h2>
              </div>
              <p className="text-slate-400 text-sm font-bold mt-1">
                {(currentUser?.role === 'LAB_TECH' || currentUser?.role === 'LAB_DELEGATE') && currentUser?.assignedLabId ? (
                  <>ملخص <span className="text-slate-800">{laboratories.find(l => l.id === currentUser.assignedLabId)?.name || 'المختبر المعين'}</span></>
                ) : (
                  <>ملخص قطاع <span className="text-slate-800">{viewSector === 'ALL' ? 'جميع القطاعات' : CONSIGNMENT_LABELS[viewSector as ConsignmentType]}</span></>
                )}
                {activePortName && <span className="mr-1">| منفذ {activePortName}</span>}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
               <button onClick={exportToExcel} className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-5 py-3 rounded-[1.5rem] text-xs font-black shadow-sm hover:bg-emerald-100 transition-all flex items-center gap-2 group">
                   <i className="fas fa-file-excel group-hover:scale-110 transition-transform"></i> تصدير البيانات
               </button>
               <button onClick={() => setShowSettingsModal(true)} className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                   <Settings size={20} />
               </button>
            </div>
         </div>

         {/* Filtering System */}
         <div className="bg-white/50 backdrop-blur-md border border-slate-200 p-2 rounded-[2rem] shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
                {/* Sector Switcher */}
                {isSystemAdmin && (
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                      {[ 
                        { id: 'ALL', label: 'الكل', color: 'slate' },
                        { id: ConsignmentType.FOOD_SAFETY, label: 'الغذاء', color: 'blue' },
                        { id: ConsignmentType.AGRICULTURAL, label: 'الزراعي', color: 'emerald' },
                        { id: ConsignmentType.VETERINARY, label: 'الحيواني', color: 'amber' }
                      ].map(s => (
                        <button 
                          key={s.id} 
                          onClick={() => setViewSector(s.id as any)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${viewSector === s.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                )}

                <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden lg:block"></div>

                {/* Port Selection */}
                {ports.length > 0 && (
                  <div className="relative group">
                    <select 
                        value={selectedPortId} 
                        onChange={(e) => setSelectedPortId(e.target.value)}
                        className="appearance-none bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black rounded-2xl pr-10 pl-6 py-2.5 outline-none cursor-pointer hover:border-indigo-300 focus:border-indigo-400 transition-all shadow-inner"
                        disabled={ports.length === 1 && !isManagerOrAdmin}
                    >
                        {(isManagerOrAdmin || currentUser?.role === 'LAB_TECH') && <option value="ALL">جميع المنافذ</option>}
                        {ports.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <i className="fas fa-anchor absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors pointer-events-none"></i>
                  </div>
                )}

                {/* Direction Filter */}
                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  {[
                      { id: 'ALL', label: 'الكل', icon: 'fa-globe' },
                      { id: 'INCOMING', label: 'وارد', icon: 'fa-download' },
                      { id: 'OUTGOING', label: 'صادر', icon: 'fa-upload' }
                  ].map(type => (
                      <button 
                          key={type.id} 
                          onClick={() => setViewLogType(type.id as any)} 
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${viewLogType === type.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          <i className={`fas ${type.icon}`}></i>
                          {type.label}
                      </button>
                  ))}
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  {[
                      { id: 'ALL', label: 'كافة الحالات', icon: 'fa-layer-group' },
                      { id: 'Approved', label: 'مقبول', icon: 'fa-check-circle' },
                      { id: 'Rejected', label: 'مرفوض', icon: 'fa-times-circle' },
                      { id: 'Pending', label: 'قيد الإجراء', icon: 'fa-clock' }
                  ].map(status => (
                      <button 
                          key={status.id} 
                          onClick={() => setViewStatus(status.id as any)} 
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${viewStatus === status.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          <i className={`fas ${status.icon}`}></i>
                          {status.label}
                      </button>
                  ))}
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  {[
                      { id: 'ALL', label: 'كل المخاطر', icon: 'fa-shield-alt' },
                      { id: 'HIGH', label: 'مرتفع', icon: 'fa-exclamation-triangle' },
                      { id: 'MEDIUM', label: 'متوسط', icon: 'fa-exclamation-circle' },
                      { id: 'LOW', label: 'منخفض', icon: 'fa-check-shield' }
                  ].map(risk => (
                      <button 
                          key={risk.id} 
                          onClick={() => setViewRisk(risk.id as any)} 
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${viewRisk === risk.id ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          <i className={`fas ${risk.icon}`}></i>
                          {risk.label}
                      </button>
                  ))}
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  {[
                      { id: 'ALL', label: 'عينات', icon: 'fa-vials' },
                      { id: 'YES', label: 'بها عينات', icon: 'fa-vial-circle-check' },
                      { id: 'NO', label: 'بدون عينات', icon: 'fa-vial-virus' }
                  ].map(s => (
                      <button 
                          key={s.id} 
                          onClick={() => setViewSamples(s.id as any)} 
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-2 ${viewSamples === s.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                          <i className={`fas ${s.icon}`}></i>
                          {s.label}
                      </button>
                  ))}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* Time range */}
                <div className="flex bg-slate-800 p-1 rounded-2xl shadow-lg shadow-slate-200">
                    {[
                      { id: 'ALL', label: 'الأزل' },
                      { id: 'MONTH', label: 'الشهر' },
                      { id: '30DAYS', label: '30 يوم' },
                      { id: '7DAYS', label: '7 أيام' }
                    ].map(range => (
                        <button 
                          key={range.id} 
                          onClick={() => setTimeRange(range.id as any)} 
                          className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${timeRange === range.id ? 'bg-white text-slate-900 shadow-inner' : 'text-slate-400 hover:text-white'}`}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>

                {isAnyFilterActive && (
                  <button 
                    onClick={resetAllFilters}
                    className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 hover:bg-red-100 transition-all flex items-center justify-center shadow-sm group"
                    title="إعادة تعيين الفلاتر"
                  >
                    <i className="fas fa-undo-alt group-hover:rotate-180 transition-transform"></i>
                  </button>
                )}

                <div className="h-8 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <button 
                      onClick={() => setAutoRefresh(!autoRefresh)} 
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${autoRefresh ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}
                      title={autoRefresh ? 'إيقاف التحديث التلقائي' : 'تفعيل التحديث التلقائي'}
                  >
                      <RefreshCw size={16} className={autoRefresh ? 'animate-spin' : ''} />
                  </button>
                  <div className="hidden sm:block">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">آخر تحديث</p>
                    <span className="text-[10px] font-black text-slate-600 leading-none">{lastUpdated.toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <AnimatePresence mode="popLayout">
          {dashboardLayout
            .filter(widget => widget.visible)
            .filter(widget => isManagerOrAdmin || widget.id !== 'teamPresence')
            .map((widget, idx) => (
                <motion.div
                  key={`${widget.id}-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.4, ease: "circOut" }}
                  className={widget.span || 'col-span-1'}
                >
                  {renderWidget(widget.id)}
                </motion.div>
              ))}
          </AnimatePresence>
          <div className={`col-span-full card-base overflow-hidden flex flex-col ${chartFilter ? 'border-indigo-400 ring-4 ring-indigo-500/10' : ''} rounded-[2.5rem] bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl shadow-slate-200/50`}>
            <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-50/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                  <i className="fas fa-list-check text-xl"></i>
                </div>
                <div>
                  <h3 className="font-black text-xl text-slate-800">{chartFilter ? `نتائج التصفية: ${chartFilter.value}` : 'أحدث المعاملات المسجلة'}</h3>
                  <p className="text-xs text-slate-400 font-bold mt-1">سجل حي لآخر المعاملات | {tableData.length} معاملة</p>
                </div>
              </div>
              
              <div className="flex flex-1 max-w-md w-full gap-2">
                <div className="relative flex-1 group">
                   <input 
                    type="text" 
                    value={dashTableSearch} 
                    onChange={(e) => setDashTableSearch(e.target.value)} 
                    placeholder="بحث سريع في الجدول..." 
                    className="w-full bg-white border border-slate-200 rounded-2xl py-3 pr-10 pl-4 text-xs font-bold outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all"
                   />
                   <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-400 transition-colors"></i>
                   {dashTableSearch && (
                     <button onClick={() => setDashTableSearch('')} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500 transition-colors">
                       <i className="fas fa-times-circle"></i>
                     </button>
                   )}
                </div>
                <Link to="/portal" className="bg-white border border-slate-200 px-5 py-3 rounded-2xl text-xs font-black text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm whitespace-nowrap">
                  السجل الكامل <i className="fas fa-external-link-alt text-[10px]"></i>
                </Link>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
              <table className="w-full text-right border-collapse">
                <thead className="bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md border-b border-slate-100">
                  <tr>
                    <th className="py-5 pr-8 cursor-pointer hover:bg-slate-100/50 transition-colors group" onClick={() => toggleSort('bayanNumber')}>
                      <div className="flex items-center gap-2">
                        البيان الجمركي
                        <div className="flex flex-col text-[7px] leading-[4px] opacity-30 group-hover:opacity-100 transition-opacity">
                          <i className={`fas fa-caret-up ${dashTableSort.key === 'bayanNumber' && dashTableSort.direction === 'asc' ? 'text-indigo-600 opacity-100' : ''}`}></i>
                          <i className={`fas fa-caret-down ${dashTableSort.key === 'bayanNumber' && dashTableSort.direction === 'desc' ? 'text-indigo-600 opacity-100' : ''}`}></i>
                        </div>
                      </div>
                    </th>
                    <th className="py-5 cursor-pointer hover:bg-slate-100/50 transition-colors group" onClick={() => toggleSort('importer')}>
                      <div className="flex items-center gap-2">
                        المستورد
                        <div className="flex flex-col text-[7px] leading-[4px] opacity-30 group-hover:opacity-100 transition-opacity">
                          <i className={`fas fa-caret-up ${dashTableSort.key === 'importer' && dashTableSort.direction === 'asc' ? 'text-indigo-600 opacity-100' : ''}`}></i>
                          <i className={`fas fa-caret-down ${dashTableSort.key === 'importer' && dashTableSort.direction === 'desc' ? 'text-indigo-600 opacity-100' : ''}`}></i>
                        </div>
                      </div>
                    </th>
                    <th className="py-5 cursor-pointer hover:bg-slate-100/50 transition-colors group" onClick={() => toggleSort('totalWeight')}>
                      <div className="flex items-center gap-2">
                        الوزن (كجم)
                        <div className="flex flex-col text-[7px] leading-[4px] opacity-30 group-hover:opacity-100 transition-opacity">
                          <i className={`fas fa-caret-up ${dashTableSort.key === 'totalWeight' && dashTableSort.direction === 'asc' ? 'text-indigo-600 opacity-100' : ''}`}></i>
                          <i className={`fas fa-caret-down ${dashTableSort.key === 'totalWeight' && dashTableSort.direction === 'desc' ? 'text-indigo-600 opacity-100' : ''}`}></i>
                        </div>
                      </div>
                    </th>
                    <th className="py-5 text-center cursor-pointer hover:bg-slate-100/50 transition-colors group" onClick={() => toggleSort('riskScore')}>
                      <div className="flex items-center justify-center gap-2">
                        المخاطر
                        <div className="flex flex-col text-[7px] leading-[4px] opacity-30 group-hover:opacity-100 transition-opacity">
                          <i className={`fas fa-caret-up ${dashTableSort.key === 'riskScore' && dashTableSort.direction === 'asc' ? 'text-indigo-600 opacity-100' : ''}`}></i>
                          <i className={`fas fa-caret-down ${dashTableSort.key === 'riskScore' && dashTableSort.direction === 'desc' ? 'text-indigo-600 opacity-100' : ''}`}></i>
                        </div>
                      </div>
                    </th>
                    <th className="py-5 text-center cursor-pointer hover:bg-slate-100/50 transition-colors group" onClick={() => toggleSort('status')}>
                      <div className="flex items-center justify-center gap-2">
                        الحالة
                        <div className="flex flex-col text-[7px] leading-[4px] opacity-30 group-hover:opacity-100 transition-opacity">
                          <i className={`fas fa-caret-up ${dashTableSort.key === 'status' && dashTableSort.direction === 'asc' ? 'text-indigo-600 opacity-100' : ''}`}></i>
                          <i className={`fas fa-caret-down ${dashTableSort.key === 'status' && dashTableSort.direction === 'desc' ? 'text-indigo-600 opacity-100' : ''}`}></i>
                        </div>
                      </div>
                    </th>
                    <th className="py-5 pl-8 text-center bg-slate-50">عرض</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tableData.slice(0, 15).map(c => (
                    <tr key={c.id} onClick={() => handleRowClick(c.id)} className="group hover:bg-indigo-50/30 cursor-pointer transition-colors border-b border-slate-50 last:border-0 text-right">
                      <td className="py-5 pr-8">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs shadow-sm ${c.type === 'VETERINARY' ? 'bg-amber-500' : c.type === 'AGRICULTURAL' ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                            <i className={`fas ${SECTOR_ICONS[c.type as string]}`}></i>
                          </div>
                          <div>
                            <span className="font-black text-slate-800 text-sm block font-mono tracking-tight">{c.bayanNumber || '---'}</span>
                            <span className="text-[10px] text-slate-400 font-bold">{new Date(c.createdAt).toLocaleDateString('ar-OM')}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 text-xs font-bold text-slate-600 truncate max-w-[180px] pr-2">{c.importer}</td>
                      <td className="py-5 text-xs font-bold text-slate-700 font-mono pr-2">{Number(c.totalWeight).toLocaleString()}</td>
                      <td className="py-5 text-center">
                        <div className="flex flex-col items-center gap-1.5 px-4">
                          <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${c.riskScore}%` }}
                              className={`h-full ${c.riskScore > 60 ? 'bg-red-500' : 'bg-green-400'}`}
                            />
                          </div>
                          <span className="text-[9px] font-black text-slate-400">{c.riskScore}%</span>
                        </div>
                      </td>
                      <td className="py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black border inline-block min-w-[80px] ${c.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-100' : c.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                          {c.technicalAction || (c.status === 'Approved' ? 'مفرج عنه' : c.status === 'Rejected' ? 'مرفوض' : 'قيد الإجراء')}
                        </span>
                      </td>
                      <td className="py-5 pl-8 text-center">
                        <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 flex items-center justify-center transition-all shadow-sm group-hover:scale-110">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tableData.length === 0 && (
                <div className="py-20 text-center text-slate-400">
                  <i className="fas fa-search text-4xl mb-4 opacity-10"></i>
                  <p className="font-bold text-sm">لا توجد معاملات تطابق البحث</p>
                </div>
              )}
            </div>
          </div>
        </div>
      {showQueryModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-in">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h3 className="text-xl font-black text-slate-800">استعلام سريع</h3>
                          <p className="text-xs text-slate-500 font-bold">البحث في جميع القطاعات حسب البيانات أو التاريخ</p>
                      </div>
                      <button onClick={() => setShowQueryModal(false)} className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-red-500 flex items-center justify-center shadow-sm transition-all"><i className="fas fa-times"></i></button>
                  </div>
                  <div className="p-6">
                      <form onSubmit={handleSearch} className="space-y-4 mb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="relative">
                                  <input 
                                    type="text" 
                                    value={queryTerm} 
                                    onChange={(e) => setQueryTerm(e.target.value)} 
                                    placeholder="رقم البيان، التصريح، أو المستورد..." 
                                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 pr-12 text-sm font-bold focus:border-[#c8102e] outline-none transition-all" 
                                    autoFocus 
                                  />
                                  <i className="fas fa-search absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                              </div>
                              <div className="relative">
                                  <input 
                                    type="date" 
                                    value={queryDate} 
                                    onChange={(e) => setQueryDate(e.target.value)} 
                                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-4 pr-12 text-sm font-bold focus:border-[#c8102e] outline-none transition-all font-mono" 
                                  />
                                  <i className="fas fa-calendar absolute right-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button type="submit" className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black shadow-lg hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                                  <i className="fas fa-filter"></i> تطبيق البحث
                              </button>
                              <button type="button" onClick={resetQuery} className="bg-slate-100 text-slate-500 px-6 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all">
                                  مسح
                              </button>
                          </div>
                      </form>

                      <div className="max-h-[350px] overflow-y-auto custom-scrollbar space-y-3 scroll-fade-y">
                          {queryResults.map(res => (
                              <div key={res.id} onClick={() => handleRowClick(res.id)} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md cursor-pointer group transition-all">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${res.type === 'VETERINARY' ? 'bg-amber-500' : res.type === 'AGRICULTURAL' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                          <i className={`fas ${SECTOR_ICONS[res.type as string]}`}></i>
                                      </div>
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <h4 className="font-black text-slate-800 text-sm">{res.bayanNumber || res.id}</h4>
                                              {res.permitNumber && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">تصريح: {res.permitNumber}</span>}
                                          </div>
                                          <div className="flex items-center gap-2 mt-0.5">
                                              <p className="text-[10px] text-slate-500 font-bold">{res.importer}</p>
                                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                              <p className="text-[9px] text-slate-400 font-mono">{res.arrivalDate}</p>
                                          </div>
                                      </div>
                                  </div>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${res.status === 'Approved' ? 'bg-green-100 text-green-700' : res.status === 'Rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                      {res.status === 'Approved' ? 'مقبول' : res.status === 'Rejected' ? 'مرفوض' : 'قيد الإجراء'}
                                  </span>
                              </div>
                          ))}
                          {hasSearched && queryResults.length === 0 && (
                              <div className="py-12 text-center text-slate-400">
                                  <i className="fas fa-search-minus text-4xl mb-4 opacity-20"></i>
                                  <p className="text-sm font-bold">لا توجد إرساليات تطابق معايير البحث</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <div>
                          <h3 className="text-xl font-black text-slate-800">تخصيص لوحة التحكم</h3>
                          <p className="text-xs text-slate-500 font-bold">إظهار وإخفاء الأقسام حسب احتياجك</p>
                      </div>
                      <button onClick={() => setShowSettingsModal(false)} className="w-10 h-10 rounded-full bg-white text-slate-400 hover:text-red-500 flex items-center justify-center shadow-sm transition-all"><i className="fas fa-times"></i></button>
                  </div>
                  <div className="p-6">
                      <DragDropContext onDragEnd={(result) => {
                          if (!result.destination) return;
                          const editableLayout = dashboardLayout.filter(w => isManagerOrAdmin || w.id !== 'teamPresence');
                          const hiddenLayout = dashboardLayout.filter(w => !isManagerOrAdmin && w.id === 'teamPresence');
                          const items = Array.from(editableLayout);
                          const [reorderedItem] = items.splice(result.source.index, 1);
                          items.splice(result.destination.index, 0, reorderedItem);
                          setDashboardLayout([...items, ...hiddenLayout]);
                      }}>
                          <Droppable droppableId="dashboard-widgets">
                              {(provided) => (
                                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2 scroll-fade-y">
                                      {dashboardLayout.filter(w => isManagerOrAdmin || w.id !== 'teamPresence').map((widget, index) => (
                                          <Draggable key={widget.id} draggableId={widget.id} index={index}>
                                              {(provided) => (
                                                  <div
                                                      ref={provided.innerRef}
                                                      {...provided.draggableProps}
                                                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-300 transition-all group"
                                                  >
                                                      <div className="flex items-center gap-3">
                                                          <div {...provided.dragHandleProps} className="text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
                                                              <i className="fas fa-grip-vertical"></i>
                                                          </div>
                                                          <span className="font-bold text-sm text-slate-700">{widget.title}</span>
                                                      </div>
                                                      <label className="relative inline-flex items-center cursor-pointer">
                                                          <input 
                                                              type="checkbox" 
                                                              className="sr-only peer" 
                                                              checked={widget.visible}
                                                              onChange={() => {
                                                                  const newLayout = [...dashboardLayout];
                                                                  const targetIndex = newLayout.findIndex(w => w.id === widget.id);
                                                                  if (targetIndex !== -1) {
                                                                      newLayout[targetIndex].visible = !newLayout[targetIndex].visible;
                                                                      setDashboardLayout(newLayout);
                                                                  }
                                                              }}
                                                          />
                                                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                                      </label>
                                                  </div>
                                              )}
                                          </Draggable>
                                      ))}
                                      {provided.placeholder}
                                  </div>
                              )}
                          </Droppable>
                      </DragDropContext>
                      <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                          <button onClick={() => {
                              setDashboardLayout(defaultLayout);
                          }} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors">
                              إعادة ضبط الافتراضي
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
