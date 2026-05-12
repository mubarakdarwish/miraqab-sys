
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Consignment, WeeklySchedule, ShiftType, ConsignmentType, Port, SectorShiftConfig, ShiftConfig, Importer } from '../types';
import { CONSIGNMENT_LABELS, SECTOR_IMAGES } from '../constants';
import { subscribeToShifts, subscribeToSectorShiftConfig } from '../firebaseService';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import PhytosanitaryCertificate from './PhytosanitaryCertificate';
import VeterinaryCertificate from './VeterinaryCertificate';

interface WelcomePageProps {
  onStart: () => void;
  consignments: Consignment[];
  ports?: Port[];
  installPrompt?: any;
  onInstall?: () => void;
  importers?: Importer[];
}

const safeFormatDate = (dateStr: string | undefined | null, locale: string = 'ar-OM') => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || '---';
    return date.toLocaleDateString(locale);
  } catch (e) {
    return dateStr || '---';
  }
};

const safeFormatDateTime = (dateStr: string | undefined | null, locale: string = 'ar-OM') => {
  if (!dateStr) return '---';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || '---';
    return `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } catch (e) {
    return dateStr || '---';
  }
};

const WelcomePage: React.FC<WelcomePageProps> = ({ onStart, consignments, ports = [], installPrompt, onInstall, importers = [] }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showTracker, setShowTracker] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [trackInput, setTrackInput] = useState('');
  const [verifyInput, setVerifyInput] = useState('');
  const [trackResult, setTrackResult] = useState<Consignment | null | 'NOT_FOUND'>(null);
  const [verifyResult, setVerifyResult] = useState<Consignment | null | 'NOT_FOUND'>(null);
  const [showFullCert, setShowFullCert] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Shift State
  const [activeShift, setActiveShift] = useState<{name: string, type: string, icon: string}>({ name: 'الوردية الصباحية', type: 'MORNING', icon: 'fa-sun' });
  const [allSchedules, setAllSchedules] = useState<Record<string, Record<string, WeeklySchedule>>>({}); // portId -> sector -> schedule
  const [shiftConfigs, setShiftConfigs] = useState<Record<string, Record<string, SectorShiftConfig>>>({}); // portId -> sector -> config

  const defaultShifts: ShiftConfig[] = [
    { id: 'MORNING', name: 'الوردية الصباحية', startTime: '07:00', endTime: '19:00', color: 'amber', icon: 'fa-sun' },
    { id: 'EVENING', name: 'الوردية المسائية', startTime: '19:00', endTime: '07:00', color: 'indigo', icon: 'fa-moon' }
  ];

  const calculateActiveShift = (shifts: ShiftConfig[], now: Date) => {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    for (const shift of shifts) {
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);
        
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        
        if (startTotal < endTotal) {
            if (currentTime >= startTotal && currentTime < endTotal) return shift;
        } else {
            if (currentTime >= startTotal || currentTime < endTotal) return shift;
        }
    }
    return shifts[0];
  };

  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    const unsubs: (() => void)[] = [];
    
    if (ports.length > 0) {
        const sectors = Object.values(ConsignmentType);
        
        ports.forEach(port => {
            sectors.forEach(sector => {
                // Subscribe to schedules
                const unsubSchedules = subscribeToShifts(sector, port.id, (data) => {
                    setAllSchedules(prev => ({ 
                        ...prev, 
                        [port.id]: {
                            ...(prev[port.id] || {}),
                            [sector]: data || {}
                        }
                    }));
                });
                unsubs.push(unsubSchedules);

                // Subscribe to shift configs
                const unsubConfigs = subscribeToSectorShiftConfig(sector, port.id, (config) => {
                    setShiftConfigs(prev => ({
                        ...prev,
                        [port.id]: {
                            ...(prev[port.id] || {}),
                            [sector]: (config || { shifts: defaultShifts }) as SectorShiftConfig
                        }
                    }));
                });
                unsubs.push(unsubConfigs);
            });
        });
    }

    return () => unsubs.forEach(u => u());
  }, [ports]);

  // Calculate current shift for the summary (using first port/sector as representative or default)
  useEffect(() => {
      const updateActiveShift = () => {
          const now = new Date();
          // For the main display, we'll use a default or the first available config
          const firstPort = ports[0];
          const firstSector = ConsignmentType.FOOD_SAFETY;
          const config = (firstPort && shiftConfigs[firstPort.id]?.[firstSector]) || { shifts: defaultShifts };
          
          const active = calculateActiveShift(config.shifts, now);
          setActiveShift({ name: active.name, type: active.id, icon: active.icon });
      };

      updateActiveShift();
      const interval = setInterval(updateActiveShift, 60000); 
      return () => clearInterval(interval);
  }, [ports, shiftConfigs]);

  const getStaffCountForPort = (portId: string) => {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const today = days[now.getDay()];
      
      const uniqueStaff = new Set<string>();
      const portSchedules = allSchedules[portId] || {};
      const portConfigs = shiftConfigs[portId] || {};
      
      Object.entries(portSchedules).forEach(([sector, schedule]) => {
          const config = portConfigs[sector] || { shifts: defaultShifts };
          const active = calculateActiveShift(config.shifts, now);
          const shiftUsers = schedule[today]?.[active.id] || [];
          shiftUsers.forEach(u => uniqueStaff.add(u));
      });
      
      return uniqueStaff.size;
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackInput.trim()) return;

    setIsSearching(true);
    setTrackResult(null);

    setTimeout(() => {
        const found = consignments.find(c => 
            c.id.toLowerCase() === trackInput.trim().toLowerCase() || 
            c.bayanNumber.toLowerCase() === trackInput.trim().toLowerCase()
        );
        setTrackResult(found || 'NOT_FOUND');
        setIsSearching(false);
    }, 1200);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInput.trim()) return;

    setIsVerifying(true);
    setVerifyResult(null);

    setTimeout(() => {
        const found = consignments.find(c => 
            c.id.toLowerCase() === verifyInput.trim().toLowerCase() && 
            (c.declarationType === 'تصدير' || c.declarationType === 'إعادة تصدير') && 
            (c.type === ConsignmentType.AGRICULTURAL || c.type === ConsignmentType.VETERINARY)
        );
        setVerifyResult(found || 'NOT_FOUND');
        setIsVerifying(false);
    }, 1500);
  };

  const closeTracker = () => {
      setShowTracker(false);
      setTrackInput('');
      setTrackResult(null);
  };

  const closeVerify = () => {
      setShowVerify(false);
      setShowFullCert(false);
      setVerifyInput('');
      setVerifyResult(null);
  };

  // Helper for Stepper Logic - LINKED TO TECHNICAL ACTION
  const getStepStatus = (stepIndex: number, c: Consignment) => {
      // Steps: 0: Registration, 1: Inspection, 2: Lab/Sampling, 3: Final Decision
      
      // Step 0: Always Done if found
      if (stepIndex === 0) return 'DONE';

      // Step 1: Inspection
      if (stepIndex === 1) {
          if (c.inspectionResult && c.inspectionResult !== 'قيد الفحص') return 'DONE';
          return 'ACTIVE'; 
      }

      // Step 2: Lab
      if (stepIndex === 2) {
          if (!c.hasSample) return 'SKIPPED';
          // If a final decision is made, Lab is considered done or skipped
          if (c.technicalAction && c.technicalAction !== 'تحويل' && c.technicalAction !== 'إستفسار') return 'DONE';
          if (c.inspectionResult === 'قيد الفحص') return 'WAITING'; 
          return 'ACTIVE';
      }

      // Step 3: Final Decision - Linked to Technical Action
      if (stepIndex === 3) {
          if (!c.technicalAction) return 'WAITING';

          switch (c.technicalAction) {
              case 'إفراج نهائي':
                  return 'DONE'; // Green
              case 'رفض':
              case 'إتلاف':
              case 'إعادة تصدير':
                  return 'REJECTED'; // Red
              case 'إفراج مشروط':
                  return 'WARNING'; // Amber (Undertaking)
              case 'إستفسار':
              case 'تحويل':
                  return 'INFO'; // Blue (Action required/Pending info)
              default:
                  return 'WAITING';
          }
      }
      return 'WAITING';
  };

  // Helper to get status label color and icon
  const getStatusDetails = (c: Consignment) => {
      const action = c.technicalAction || 'قيد الإجراء';
      
      if (action === 'إفراج نهائي') return { color: 'bg-green-100 text-green-700 border-green-200', icon: 'fa-check-circle', label: 'إفراج نهائي' };
      if (action === 'إفراج مشروط') return { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: 'fa-file-signature', label: 'إفراج مشروط (تعهد)' };
      if (action === 'رفض') return { color: 'bg-red-100 text-red-700 border-red-200', icon: 'fa-ban', label: 'رفض نهائي' };
      if (action === 'إتلاف') return { color: 'bg-red-100 text-red-700 border-red-200', icon: 'fa-trash-alt', label: 'قرار بالإتلاف' };
      if (action === 'إعادة تصدير') return { color: 'bg-red-100 text-red-700 border-red-200', icon: 'fa-shipping-fast', label: 'إعادة تصدير' };
      if (action === 'إستفسار') return { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: 'fa-question-circle', label: 'مطلوب توضيح / إستفسار' };
      if (action === 'تحويل') return { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: 'fa-exchange-alt', label: `محول إلى ${c.transferTo || 'جهة أخرى'}` };
      if (action === 'إجراءات متعددة') return { color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: 'fa-layer-group', label: 'إجراءات متعددة' };
      
      return { color: 'bg-slate-100 text-slate-600 border-slate-200', icon: 'fa-clock', label: 'قيد المعالجة' };
  };

  // Calculate Daily Stats
  const dailyStats = React.useMemo(() => {
      const today = new Date().toISOString().slice(0, 10);
      return {
          incoming: consignments.filter(c => (c.createdAt && c.createdAt.startsWith(today)) || c.arrivalDate === today).length,
          released: consignments.filter(c => c.status === 'Approved' && c.auditLog?.some(l => l.timestamp && l.timestamp.startsWith(today) && ((l.action && l.action.includes('إفراج')) || l.statusChange === 'Approved'))).length,
          samples: consignments.filter(c => c.hasSample && c.sampleDate === today).length
      };
  }, [consignments]);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-x-hidden font-tajawal text-right selection:bg-[#c8102e] selection:text-white" dir="rtl">
      
      {/* --- Dynamic Background --- */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.05]"></div>
        <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-gradient-to-br from-red-300/30 via-orange-200/20 to-transparent rounded-full blur-[120px] animate-pulse-slow"></div>
        <div className="absolute top-1/2 -left-40 w-[600px] h-[600px] bg-gradient-to-tr from-blue-300/30 via-emerald-200/20 to-transparent rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-t from-purple-300/20 to-transparent rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '4s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 flex flex-col min-h-screen"
      >
        
        {/* --- Navbar --- */}
        <nav className="w-full px-6 py-5 flex justify-between items-center bg-white/70 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40">
            <div className="flex items-center gap-4">
                <Logo size={48} variant="color" />
                <div className="hidden md:block w-px h-8 bg-slate-300 mx-2"></div>
                <img referrerPolicy="no-referrer" 
                    src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                    alt="Ministry Logo" 
                    className="h-10 object-contain opacity-80" 
                />
                <div className="hidden md:block w-px h-8 bg-slate-300 mx-2"></div>
                <div className="hidden md:block">
                    <h1 className="text-lg font-black text-slate-800 leading-tight">مِرقاب</h1>
                    <div className="flex items-center gap-2">
                        <p className="text-slate-500 text-[10px] font-bold">
                            نظام الرقابة الذكي
                        </p>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
                {installPrompt && (
                    <button 
                        onClick={onInstall}
                        className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 md:px-4 py-2 rounded-xl font-bold text-[10px] md:text-xs hover:bg-blue-100 transition-all border border-blue-100"
                    >
                        <i className="fas fa-download"></i> <span className="hidden sm:inline">تثبيت التطبيق</span><span className="sm:hidden">تثبيت</span>
                    </button>
                )}
                <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] font-bold text-slate-600">النظام متصل</span>
                </div>
                <button 
                    onClick={onStart}
                    className="bg-[#c8102e] text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-red-900/10 hover:bg-[#a60a22] transition-all active:scale-95"
                >
                    دخول الموظفين
                </button>
            </div>
        </nav>

        {/* --- Hero Section --- */}
        <main className="flex-1 container mx-auto px-6 py-12 lg:py-20 max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
                
                {/* Text & CTA */}
                <motion.div 
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="flex-1 text-center lg:text-right space-y-8"
                >
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-slate-200/50 px-4 py-1.5 rounded-full shadow-sm"
                    >
                        <span className="text-[10px] font-black text-[#c8102e] uppercase tracking-wider">الإصدار 3.1.0</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                        <span className="text-[10px] font-bold text-slate-500">البوابة الموحدة للمعلومات والإجراءات</span>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 }}
                        className="flex items-center justify-center lg:justify-start gap-2"
                    >
                        <span className="text-sm font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-100">مرحباً بكم في مِرقاب</span>
                    </motion.div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
                            <Logo size={80} variant="color" className="drop-shadow-2xl" />
                            <div className="h-12 w-px bg-slate-200 hidden lg:block"></div>
                            <div className="text-right hidden lg:block">
                                <h1 className="text-2xl font-black text-slate-900 tracking-tight">مِرقاب</h1>
                                <p className="text-[10px] text-red-700 font-bold tracking-widest uppercase opacity-60">Smart Monitoring System</p>
                            </div>
                        </div>
                        <motion.h1 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight"
                        >
                            المنصة الذكية <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c8102e] to-red-600">للحجر وسلامة الغذاء</span>
                        </motion.h1>
                        <motion.p 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0"
                        >
                            بوابة إلكترونية شاملة توفر للمستوردين والجمهور كافة المعلومات حول القوانين، الإجراءات، والنماذج، بالإضافة لخدمات تتبع الإرساليات.
                        </motion.p>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4"
                    >
                        <button 
                            onClick={() => setShowTracker(true)}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-l from-white to-slate-50 border border-slate-100 hover:border-[#c8102e] rounded-2xl text-slate-800 font-black text-sm shadow-md hover:shadow-xl hover:shadow-red-500/20 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 via-red-500/5 to-red-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <span className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-[#c8102e] group-hover:bg-[#c8102e] group-hover:text-white transition-colors relative z-10">
                                <i className="fas fa-search text-lg"></i>
                            </span>
                            <div className="text-right relative z-10">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">خدمات المستوردين</span>
                                <span className="block">تتبع حالة إرسالية</span>
                            </div>
                        </button>

                        <button 
                            onClick={() => setShowVerify(true)}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-l from-white to-slate-50 border border-slate-100 hover:border-emerald-500 rounded-2xl text-slate-800 font-black text-sm shadow-md hover:shadow-xl hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-emerald-500/5 to-emerald-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <span className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors relative z-10">
                                <i className="fas fa-certificate text-lg"></i>
                            </span>
                            <div className="text-right relative z-10">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">التحقق الرقمي</span>
                                <span className="block">صحة الشهادات</span>
                            </div>
                        </button>

                        <button 
                            onClick={() => setShowContact(true)}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-l from-white to-slate-50 border border-slate-100 hover:border-blue-500 rounded-2xl text-slate-800 font-black text-sm shadow-md hover:shadow-xl hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-3 group relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                            <span className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors relative z-10">
                                <i className="fas fa-headset text-lg"></i>
                            </span>
                            <div className="text-right relative z-10">
                                <span className="block text-[10px] text-slate-400 font-bold uppercase">الدعم والمساعدة</span>
                                <span className="block">دليل التواصل</span>
                            </div>
                        </button>
                    </motion.div>

                    {/* Live Stats Ticker (Real Data) */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="pt-8 border-t border-slate-200/60 mt-8"
                    >
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500 mb-3">
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            حالة العمليات اليومية ({new Date().toLocaleDateString('ar-OM')})
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <StatItem label="إرساليات واردة" value={dailyStats.incoming} />
                            <StatItem label="تم الإفراج" value={dailyStats.released} />
                            <StatItem label="عينات مختبر" value={dailyStats.samples} />
                        </div>
                    </motion.div>
                </motion.div>

                {/* Visual / Graphic Side */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, x: -50 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    className="flex-1 relative hidden lg:block"
                >
                    {/* Beautiful Image Background */}
                    <div className="absolute inset-0 rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-300/50 transform rotate-2 hover:rotate-0 transition-transform duration-700">
                        <img 
                            src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=2070&auto=format&fit=crop" 
                            alt="Modern Port" 
                            className="w-full h-full object-cover opacity-90"
                            referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#c8102e]/40 to-transparent mix-blend-multiply"></div>
                    </div>

                    {/* Main Shift Card - Glassmorphism */}
                    <motion.div 
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, type: "spring", stiffness: 100 }}
                        className="relative z-10 bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-900/10 max-w-md mx-auto transform -translate-x-8 translate-y-8"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">الوضع التشغيلي</p>
                                <h3 className="text-2xl font-black text-slate-800">{activeShift.name}</h3>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg ${
                                activeShift.type === 'MORNING' ? 'bg-amber-500' : 
                                activeShift.type === 'EVENING' ? 'bg-indigo-600' : 'bg-slate-600'
                            }`}>
                                <i className={`fas ${activeShift.icon}`}></i>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {ports.map(port => {
                                const staffCount = getStaffCountForPort(port.id);
                                return (
                                    <div key={port.id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white/50 shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
                                                <i className="fas fa-map-marker-alt"></i>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-500 uppercase">{port.name}</p>
                                                <p className="text-sm font-black text-slate-800">{staffCount > 0 ? `${staffCount} مفتشين` : 'تحديث الجدول...'}</p>
                                            </div>
                                        </div>
                                        {staffCount > 0 && <span className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>}
                                    </div>
                                );
                            })}

                            <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white/50 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 shadow-sm">
                                        <i className="fas fa-network-wired"></i>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase">حالة النظام</p>
                                        <p className="text-sm font-black text-slate-800">مستقرة (99.9%)</p>
                                    </div>
                                </div>
                                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Floating Badge */}
                    <motion.div 
                        animate={{ y: [0, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="absolute -bottom-4 -right-4 bg-white/90 backdrop-blur-md border border-white text-slate-800 p-6 rounded-[2rem] shadow-xl"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl">
                                <i className="fas fa-shield-check"></i>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">مستوى الأمان</p>
                                <p className="text-xl font-black text-slate-800">100%</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>

            {/* --- Public Info Cards (Updated Section) --- */}
            <div className="mt-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-black text-slate-800 mb-2">دليل الخدمات والمعلومات</h2>
                    <p className="text-slate-500 font-medium">المرجع الرسمي للقوانين، النماذج، وإجراءات الاستيراد في ميناء صحار</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <SectorCard 
                        title="الحجر البيطري" 
                        icon="fa-paw" 
                        desc="القوانين، نماذج التعهدات، قوائم الحظر، وآلية سحب العينات."
                        color="amber"
                        stats="القوانين والإجراءات"
                        image={SECTOR_IMAGES[ConsignmentType.VETERINARY]}
                        onClick={() => navigate(`/info/${ConsignmentType.VETERINARY}`)}
                    />
                    <SectorCard 
                        title="الحجر الزراعي" 
                        icon="fa-seedling" 
                        desc="لوائح المبيدات والأسمدة، شروط الاستيراد، والمستندات المطلوبة."
                        color="green"
                        stats="القوانين والإجراءات"
                        image={SECTOR_IMAGES[ConsignmentType.AGRICULTURAL]}
                        onClick={() => navigate(`/info/${ConsignmentType.AGRICULTURAL}`)}
                    />
                    <SectorCard 
                        title="سلامة الغذاء" 
                        icon="fa-utensils" 
                        desc="دليل فحص الأغذية، المواصفات القياسية، وإجراءات الإفراج الغذائي."
                        color="blue"
                        stats="القوانين والإجراءات"
                        image={SECTOR_IMAGES[ConsignmentType.FOOD_SAFETY]}
                        onClick={() => navigate(`/info/${ConsignmentType.FOOD_SAFETY}`)}
                    />
                    <SectorCard 
                        title="المركز الإعلامي" 
                        icon="fa-bullhorn" 
                        desc="أحدث التعاميم الوزارية، أخبار المنفذ، وأدلة الاستخدام العامة."
                        color="purple"
                        stats="أخبار وتحديثات"
                        image="https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop"
                        onClick={() => navigate('/info/general')}
                    />
                </div>
            </div>

            {/* --- About Platform Section --- */}
            <div className="mt-24 mb-20 relative">
                <div className="absolute inset-0 -z-10 bg-slate-100/50 rounded-[3rem] overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.05]"></div>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-white via-transparent to-white"></div>
                </div>

                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 px-6"
                >
                    <h2 className="text-3xl font-black text-slate-800 mb-4">منظومة رقمية متكاملة</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed text-base font-medium">
                        نظام مرقاب هو الحل الذكي لإدارة الرقابة الحدودية، حيث يجمع بين دقة التفتيش، سرعة الإجراءات، وتقنيات الذكاء الاصطناعي لضمان سلامة الواردات وكفاءة العمليات في ميناء صحار.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-6 mb-16">
                    <FeatureCard
                        title="أتمتة الإجراءات"
                        desc="تحويل العمليات الورقية إلى مسارات عمل رقمية ذكية تقلل من وقت الانتظار والأخطاء البشرية."
                        icon="fa-cogs"
                        color="blue"
                    />
                    <FeatureCard
                        title="الذكاء الاصطناعي"
                        desc="تحليل المخاطر وقراءة المستندات تلقائياً باستخدام نماذج Gemini المتطورة لسرعة اتخاذ القرار."
                        icon="fa-brain"
                        color="purple"
                    />
                    <FeatureCard
                        title="إدارة العينات"
                        desc="نظام تتبع دقيق للعينات المخبرية من لحظة السحب وحتى صدور النتائج النهائية."
                        icon="fa-vial"
                        color="amber"
                    />
                    <FeatureCard
                        title="قاعدة بيانات مركزية"
                        desc="سجل موحد للمستوردين، المنتجات، والمخالفات السابقة يسهل الرجوع إليه في أي وقت."
                        icon="fa-database"
                        color="emerald"
                    />
                </div>

                {/* Vibrant Image Gallery */}
                <div className="px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[400px]">
                        <div className="md:col-span-2 relative rounded-[2rem] overflow-hidden group shadow-lg">
                            <img src="https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?q=80&w=2070&auto=format&fit=crop" alt="Port Operations" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-6 right-6 left-6">
                                <h3 className="text-white text-xl font-black mb-1">عمليات تفتيش متطورة</h3>
                                <p className="text-slate-200 text-sm font-medium">نستخدم أحدث التقنيات لضمان دقة وسرعة التفتيش الجمركي.</p>
                            </div>
                        </div>
                        <div className="grid grid-rows-2 gap-4">
                            <div className="relative rounded-[2rem] overflow-hidden group shadow-lg">
                                <img src="https://images.unsplash.com/photo-1532601224476-15c79f2f7a51?q=80&w=2070&auto=format&fit=crop" alt="Laboratory" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 right-4 left-4">
                                    <h3 className="text-white text-sm font-black">مختبرات حديثة</h3>
                                </div>
                            </div>
                            <div className="relative rounded-[2rem] overflow-hidden group shadow-lg">
                                <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1974&auto=format&fit=crop" alt="Fresh Produce" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 right-4 left-4">
                                    <h3 className="text-white text-sm font-black">سلامة الغذاء</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        {/* --- Footer --- */}
        <footer className="bg-white border-t border-slate-200 mt-20 py-12">
            <div className="container mx-auto px-6 text-center">
                <img referrerPolicy="no-referrer" src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" alt="Logo" className="h-16 mx-auto mb-6 opacity-50 grayscale hover:grayscale-0 transition-all" />
                <p className="text-slate-500 text-sm font-bold">&copy; {new Date().getFullYear()} وزارة الثروة الزراعية والسمكية وموارد المياه - قسم الحجر وسلامة الغذاء بميناء صحار</p>
                <div className="flex justify-center gap-4 mt-4 text-slate-400 text-xs font-mono">
                    <span>Privacy Policy</span>
                    <span>•</span>
                    <span>Terms of Service</span>
                    <span>•</span>
                    <span>Support</span>
                </div>
            </div>
        </footer>
      </motion.div>

      {/* --- Modals --- */}
      
      {/* Tracker Modal */}
      {showTracker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="bg-slate-50 p-8 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-700 shadow-sm border border-slate-200">
                            <i className="fas fa-search-location text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">تتبع الإرسالية</h3>
                            <p className="text-sm text-slate-500 font-bold mt-1">Consignment Tracking</p>
                        </div>
                    </div>
                    <button onClick={closeTracker} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-all">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleTrack} className="relative mb-10">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={trackInput}
                                onChange={(e) => setTrackInput(e.target.value)}
                                placeholder="أدخل رقم البيان (B-XXXX) أو الرقم المرجعي..."
                                className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl py-5 pr-14 pl-32 text-lg font-bold text-slate-800 focus:border-[#c8102e] focus:bg-white outline-none transition-all placeholder:text-slate-300 font-mono shadow-inner"
                                autoFocus
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                                <i className="fas fa-barcode text-xl"></i>
                            </div>
                            <button 
                                type="submit" 
                                disabled={!trackInput.trim() || isSearching}
                                className="absolute left-2 top-2 bottom-2 bg-slate-800 text-white px-8 rounded-xl font-bold hover:bg-slate-900 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
                            >
                                {isSearching ? <i className="fas fa-circle-notch fa-spin"></i> : 'بحث'}
                            </button>
                        </div>
                    </form>

                    <div className="min-h-[250px]">
                        {trackResult === 'NOT_FOUND' && (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50/50 rounded-[2rem] border border-red-100 border-dashed">
                                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-400">
                                    <i className="fas fa-search-minus text-3xl"></i>
                                </div>
                                <h4 className="text-xl font-black text-slate-800">لم يتم العثور على الإرسالية</h4>
                                <p className="text-slate-500 font-medium mt-2 max-w-xs">يرجى التحقق من الرقم المدخل والمحاولة مرة أخرى. تأكد من كتابة الأحرف والرموز بشكل صحيح.</p>
                            </div>
                        )}

                        {trackResult && typeof trackResult !== 'string' && (
                            <div className="animate-fade-in space-y-8">
                                {/* Header Card */}
                                <div className="bg-gradient-to-r from-slate-50 to-white p-6 rounded-[2rem] border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-slate-800"></div>
                                    <div className="flex items-center gap-4 z-10">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-slate-100 bg-white`}>
                                            <i className={`fas ${
                                                trackResult.type === 'VETERINARY' ? 'fa-paw text-amber-500' :
                                                trackResult.type === 'AGRICULTURAL' ? 'fa-seedling text-emerald-500' : 'fa-utensils text-blue-500'
                                            }`}></i>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{CONSIGNMENT_LABELS[trackResult.type]}</p>
                                            <h4 className="text-2xl font-black text-slate-800 font-mono tracking-tight">{trackResult.bayanNumber}</h4>
                                            <p className="text-xs font-bold text-slate-500 mt-1">{trackResult.importer} • {trackResult.id}</p>
                                        </div>
                                    </div>
                                    <div className="z-10 text-left">
                                        {(() => {
                                            const status = getStatusDetails(trackResult);
                                            return (
                                                <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black border ${status.color}`}>
                                                    <i className={`fas ${status.icon}`}></i>
                                                    {status.label}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>

                                {/* Progress Stepper */}
                                <div className="px-2">
                                    <div className="relative flex justify-between items-center mb-8">
                                        {/* Connecting Line */}
                                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-10 -translate-y-1/2 rounded-full"></div>
                                        
                                        {/* Steps */}
                                        {['تسجيل البيان', 'المعاينة الظاهرية', 'سحب العينات', 'القرار النهائي'].map((label, idx) => {
                                            const status = getStepStatus(idx, trackResult);
                                            const icons = ['fa-file-alt', 'fa-search', 'fa-vial', 'fa-gavel'];
                                            
                                            let circleClass = 'bg-slate-100 text-slate-400 border-slate-200';
                                            let icon = icons[idx];
                                            
                                            if (status === 'DONE') {
                                                circleClass = 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-200';
                                                icon = 'fa-check';
                                            } else if (status === 'ACTIVE') {
                                                circleClass = 'bg-slate-800 text-white border-slate-800 shadow-lg ring-4 ring-slate-200';
                                                icon = 'fa-spinner fa-spin';
                                            } else if (status === 'REJECTED') {
                                                circleClass = 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200';
                                                icon = 'fa-times';
                                            } else if (status === 'WARNING') {
                                                circleClass = 'bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200';
                                                icon = 'fa-exclamation';
                                            } else if (status === 'INFO') {
                                                circleClass = 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200';
                                                icon = 'fa-info';
                                            } else if (status === 'SKIPPED') {
                                                circleClass = 'bg-slate-200 text-slate-400 border-slate-300';
                                                icon = 'fa-minus';
                                            }

                                            return (
                                                <div key={idx} className="flex flex-col items-center gap-3">
                                                    <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${circleClass}`}>
                                                        <i className={`fas ${icon} text-sm`}></i>
                                                    </div>
                                                    <span className={`text-[10px] font-bold ${status === 'WAITING' ? 'text-slate-400' : 'text-slate-800'}`}>
                                                        {label}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Decision Details (Dynamic) */}
                                {trackResult.technicalAction === 'إستفسار' && trackResult.inquiryType && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-6">
                                        <h5 className="font-black text-blue-800 flex items-center gap-2 mb-2">
                                            <i className="fas fa-question-circle"></i> تفاصيل الاستفسار
                                        </h5>
                                        <p className="text-sm font-bold text-blue-900">{trackResult.inquiryType}</p>
                                        <p className="text-xs text-blue-700 mt-2">يرجى مراجعة القسم المختص للرد على الاستفسار أعلاه لاستكمال الإجراءات.</p>
                                    </div>
                                )}

                                {(trackResult.technicalAction === 'رفض' || trackResult.technicalAction === 'إتلاف' || trackResult.technicalAction === 'إعادة تصدير') && trackResult.rejectionReason && (
                                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
                                        <h5 className="font-black text-red-800 flex items-center gap-2 mb-2">
                                            <i className="fas fa-exclamation-triangle"></i> أسباب الرفض
                                        </h5>
                                        <p className="text-sm font-bold text-red-900">{trackResult.rejectionReason}</p>
                                        <p className="text-xs text-red-700 mt-2">يرجى مراجعة القسم المختص لاستلام إشعار الرفض واتخاذ الإجراءات اللازمة.</p>
                                    </div>
                                )}

                                {/* Details Grid & Timeline */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="md:col-span-1 space-y-4">
                                        <h5 className="font-black text-slate-800 text-sm border-b border-slate-100 pb-2">تفاصيل الشحنة</h5>
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">تاريخ الوصول</p>
                                                <p className="text-sm font-black text-slate-700">{trackResult.arrivalDate}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">بلد الشحن</p>
                                                <p className="text-sm font-black text-slate-700">{trackResult.shippingCountry || '-'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">عدد الأصناف</p>
                                                <p className="text-sm font-black text-slate-700">{trackResult.items?.length || 0} صنف</p>
                                            </div>
                                            {trackResult.inspectionResult && (
                                                <div className="pt-2 border-t border-slate-200">
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase">نتيجة المعاينة</p>
                                                    <p className={`text-sm font-black ${trackResult.inspectionResult === 'مطابق' ? 'text-green-600' : trackResult.inspectionResult === 'غير مطابق' ? 'text-red-600' : 'text-amber-600'}`}>
                                                        {trackResult.inspectionResult}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <h5 className="font-black text-slate-800 text-sm border-b border-slate-100 pb-2 mb-4">سجل الإجراءات (Timeline)</h5>
                                        <div className="relative pl-4 border-r-2 border-slate-100 space-y-6 mr-2">
                                            {trackResult.auditLog?.slice().reverse().map((log, idx) => (
                                                <div key={idx} className="relative pr-6">
                                                    <div className="absolute -right-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-slate-300"></div>
                                                    <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className="text-xs font-black text-slate-800">{log.action}</p>
                                                            <span className="text-[9px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded">{safeFormatDateTime(log.timestamp, 'en-GB')}</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed">{log.details}</p>
                                                        <p className="text-[9px] text-slate-300 font-bold mt-2 flex items-center gap-1">
                                                            <i className="fas fa-user-circle"></i> {log.user}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                            {(!trackResult.auditLog || trackResult.auditLog.length === 0) && (
                                                <p className="text-xs text-slate-400 font-bold pr-6">بانتظار الإجراء الأول...</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Products List */}
                                {trackResult.items && trackResult.items.length > 0 && (
                                    <div className="mt-8 pt-8 border-t border-slate-100">
                                        <h5 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                                            <i className="fas fa-box-open text-slate-400"></i>
                                            المنتجات (Products)
                                        </h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {trackResult.items.map((item, idx) => (
                                                <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                                                    <div className="flex justify-between items-start gap-2">
                                                        <h6 className="font-bold text-slate-800 text-sm leading-snug">{item.description}</h6>
                                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap">
                                                            {item.commodityGroup || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3 mt-1 pt-3 border-t border-slate-50">
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">الوزن</p>
                                                            <p className="text-xs font-black text-slate-700">{item.weight} كجم</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">الكمية</p>
                                                            <p className="text-xs font-black text-slate-700">{item.packageCount} {item.packagingUnit}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">بلد المنشأ</p>
                                                            <p className="text-xs font-black text-slate-700">{item.origin}</p>
                                                        </div>
                                                        {item.brand && (
                                                            <div>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">العلامة التجارية</p>
                                                                <p className="text-xs font-black text-slate-700">{item.brand}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
      )}

      {/* Contact Modal */}
      {showContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-2xl font-black text-slate-800">دليل التواصل</h3>
                 <button onClick={() => setShowContact(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                    <i className="fas fa-times"></i>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">الإدارة (ميناء صحار)</h4>
                        <ContactCard title="رئيس القسم" name="ماجد بن علي الشامسي" phones={["92285605", "26945935"]} />
                        <ContactCard title="المشرف الإداري" name="يوسف بن راشد المعمري" phones={["92904063", "26945936"]} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">مكاتب التفتيش</h4>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-green-700">الزراعي</span>
                                <span className="font-mono text-slate-600">26865600</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-amber-700">البيطري</span>
                                <span className="font-mono text-slate-600">26945970</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="font-bold text-blue-700">الغذاء</span>
                                <span className="font-mono text-slate-600">26945971</span>
                            </div>
                        </div>
                    </div>
                 </div>
                 <div className="mt-8 p-4 bg-blue-50 text-blue-800 rounded-2xl text-sm font-medium text-center">
                    يرجى مراعاة أوقات العمل الرسمي عند الاتصال بالأرقام الشخصية. للأمور الطارئة يرجى التواصل مع مكتب الإشراف.
                 </div>
              </div>
           </motion.div>
        </div>
      )}

      {/* Verification Modal */}
      {showVerify && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="bg-emerald-50 p-8 border-b border-emerald-100 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                            <i className="fas fa-shield-check text-2xl"></i>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800">التحقق من الشهادة</h3>
                            <p className="text-sm text-emerald-600 font-bold mt-1">Certificate Verification</p>
                        </div>
                    </div>
                    <button onClick={closeVerify} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-all">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleVerify} className="relative mb-10">
                        <div className="relative">
                            <input 
                                type="text" 
                                value={verifyInput}
                                onChange={(e) => setVerifyInput(e.target.value)}
                                placeholder="أدخل الرقم التسلسلي للشهادة..."
                                className="w-full bg-slate-50 border-2 border-emerald-100 rounded-2xl py-5 pr-14 pl-32 text-lg font-bold text-slate-800 focus:border-emerald-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 font-mono shadow-inner"
                                autoFocus
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-400">
                                <i className="fas fa-fingerprint text-xl"></i>
                            </div>
                            <button 
                                type="submit" 
                                disabled={!verifyInput.trim() || isVerifying}
                                className="absolute left-2 top-2 bottom-2 bg-emerald-600 text-white px-8 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50 shadow-md"
                            >
                                {isVerifying ? <i className="fas fa-circle-notch fa-spin"></i> : 'تحقق'}
                            </button>
                        </div>
                    </form>

                    <div className="min-h-[200px]">
                        {verifyResult === 'NOT_FOUND' && (
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-red-50/50 rounded-[2rem] border border-red-100 border-dashed">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 text-red-500">
                                    <i className="fas fa-times-circle text-2xl"></i>
                                </div>
                                <h4 className="text-xl font-black text-slate-800">شهادة غير صحيحة</h4>
                                <p className="text-slate-500 font-medium mt-2 max-w-xs">الرقم المدخل لا يتطابق مع أي شهادة صادرة من النظام. يرجى التأكد من الرقم.</p>
                            </div>
                        )}

                        {verifyResult && typeof verifyResult !== 'string' && (
                            <div className="animate-fade-in bg-emerald-50 rounded-[2rem] border border-emerald-200 p-8 text-center">
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-xl shadow-emerald-200/50 border-4 border-emerald-100">
                                    <i className="fas fa-check-double text-3xl"></i>
                                </div>
                                <h4 className="text-2xl font-black text-emerald-900 mb-2">شهادة معتمدة وصحيحة</h4>
                                <p className="text-emerald-700 font-bold mb-8">
                                    {verifyResult.type === ConsignmentType.AGRICULTURAL ? 'تم التحقق من صحة البيانات في سجلات الحجر الزراعي' : 'تم التحقق من صحة البيانات في سجلات الحجر البيطري'}
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4 text-right">
                                    <div className="bg-white/60 p-4 rounded-2xl border border-white">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">رقم الشهادة</p>
                                        <p className="text-sm font-black text-slate-800 font-mono">{verifyResult.id}</p>
                                    </div>
                                    <div className="bg-white/60 p-4 rounded-2xl border border-white">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">تاريخ الإصدار</p>
                                        <p className="text-sm font-black text-slate-800">{safeFormatDate(verifyResult.createdAt || '', 'ar-OM')}</p>
                                    </div>
                                    <div className="bg-white/60 p-4 rounded-2xl border border-white">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">المصدر</p>
                                        <p className="text-sm font-black text-slate-800">
                                            {(verifyResult.declarationType === 'تصدير' || verifyResult.declarationType === 'إعادة تصدير') ? verifyResult.importer : verifyResult.exporter}
                                        </p>
                                    </div>
                                    <div className="bg-white/60 p-4 rounded-2xl border border-white">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">المستورد</p>
                                        <p className="text-sm font-black text-slate-800">
                                            {(verifyResult.declarationType === 'تصدير' || verifyResult.declarationType === 'إعادة تصدير') ? verifyResult.exporter : verifyResult.importer}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-emerald-100 flex flex-col items-center gap-4">
                                    <button 
                                        onClick={() => setShowFullCert(true)}
                                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                                    >
                                        <i className="fas fa-file-certificate text-lg"></i>
                                        عرض الشهادة الكاملة
                                    </button>
                                    <div className="flex items-center justify-center gap-3">
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs font-black text-emerald-800 uppercase tracking-widest">Digital Signature Verified</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
      )}

      {/* Full Certificate Modal */}
      {showFullCert && verifyResult && typeof verifyResult !== 'string' && (
        verifyResult.type === ConsignmentType.AGRICULTURAL ? (
            <PhytosanitaryCertificate 
                consignment={verifyResult} 
                exporterAddress={importers.find(i => i.name === (verifyResult as Consignment).importer)?.address}
                onClose={() => setShowFullCert(false)} 
            />
        ) : verifyResult.type === ConsignmentType.VETERINARY ? (
            <VeterinaryCertificate 
                consignment={verifyResult} 
                exporterAddress={importers.find(i => i.name === (verifyResult as Consignment).importer)?.address}
                onClose={() => setShowFullCert(false)} 
            />
        ) : (
            /* Default or Food Safety if applicable - using Phyto as fallback or adding specialized if needed */
            <PhytosanitaryCertificate 
                consignment={verifyResult} 
                exporterAddress={importers.find(i => i.name === (verifyResult as Consignment).importer)?.address}
                onClose={() => setShowFullCert(false)} 
            />
        )
      )}

    </div>
  );
};

// --- Helper Components ---

const StatItem = ({ label, value }: { label: string, value: number }) => (
    <motion.div 
        whileHover={{ y: -5, backgroundColor: '#fff' }}
        className="bg-slate-50/50 backdrop-blur-sm p-3 rounded-2xl border border-slate-200/50 text-center transition-colors"
    >
        <motion.span 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="block text-2xl font-black text-slate-800"
        >
            {value}
        </motion.span>
        <span className="text-[10px] text-slate-500 font-bold">{label}</span>
    </motion.div>
);

const SectorCard = ({ title, icon, desc, color, stats, onClick, image }: any) => {
    const colors: any = {
        amber: 'bg-amber-500 text-white',
        green: 'bg-emerald-500 text-white',
        blue: 'bg-blue-500 text-white',
        purple: 'bg-purple-500 text-white'
    };

    const badgeColor: any = {
        amber: 'bg-amber-500/20 text-amber-100',
        green: 'bg-emerald-500/20 text-emerald-100',
        blue: 'bg-blue-500/20 text-blue-100',
        purple: 'bg-purple-500/20 text-purple-100'
    };

    return (
        <motion.button 
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick} 
            className="group relative h-80 rounded-[2.5rem] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 text-right w-full flex flex-col justify-end"
        >
            {/* Background Image */}
            <div className="absolute inset-0">
                <img 
                    src={image} 
                    alt={title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
            </div>

            <div className="relative z-10 p-8 flex flex-col h-full justify-between">
                <div className="flex justify-between items-start">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg backdrop-blur-md bg-white/20 text-white border border-white/30 group-hover:bg-white group-hover:text-slate-900 transition-colors duration-300`}>
                        <i className={`fas ${icon}`}></i>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-2xl font-black text-white mb-2 group-hover:translate-x-1 transition-transform">{title}</h3>
                    <p className="text-sm text-slate-300 font-medium leading-relaxed mb-4 line-clamp-2">{desc}</p>
                    
                    <div className="flex items-center gap-2 pt-4 border-t border-white/10">
                        <span className={`text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 backdrop-blur-md border border-white/10 ${badgeColor[color]}`}>
                            <i className="fas fa-book-open"></i> {stats}
                        </span>
                    </div>
                </div>
            </div>
        </motion.button>
    );
};

const ContactCard = ({ title, name, phones }: any) => (
    <motion.div 
        whileHover={{ x: -5 }}
        className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all"
    >
        <p className="text-[10px] text-[#c8102e] font-black uppercase tracking-wider mb-1">{title}</p>
        <p className="font-black text-slate-800 text-base mb-3">{name}</p>
        <div className="flex flex-wrap gap-2">
            {phones.map((p: string) => (
                <a 
                    href={`tel:${p}`}
                    key={p} 
                    className="bg-slate-50 hover:bg-red-50 hover:text-[#c8102e] px-3 py-1.5 rounded-lg text-xs font-mono text-slate-600 border border-slate-100 flex items-center gap-2 transition-colors"
                >
                    <i className="fas fa-phone-alt text-[10px] opacity-70"></i> {p}
                </a>
            ))}
        </div>
    </motion.div>
);

const FeatureCard = ({ title, desc, icon, color }: any) => {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600 group-hover:bg-blue-500 group-hover:text-white',
        purple: 'bg-purple-50 text-purple-600 group-hover:bg-purple-500 group-hover:text-white',
        amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-500 group-hover:text-white',
        emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white'
    };

    return (
        <motion.div 
            whileHover={{ y: -10 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-center group"
        >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6 transition-all duration-300 ${colors[color]}`}>
                <i className={`fas ${icon}`}></i>
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-3">{title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">{desc}</p>
        </motion.div>
    );
};

export default WelcomePage;
