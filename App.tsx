
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { AlertCircle, AlertTriangle, Info, Newspaper, PauseCircle, X } from 'lucide-react';
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const LabDelegatePortal = React.lazy(() => import('./components/LabDelegatePortal'));
const AnalyticsDashboard = React.lazy(() => import('./components/AnalyticsDashboard'));
const ConsignmentPortal = React.lazy(() => import('./components/ConsignmentPortal').then(m => ({ default: m.ConsignmentPortal })));
const LogisticsPortal = React.lazy(() => import('./components/LogisticsPortal'));
const SamplingManager = React.lazy(() => import('./components/SamplingManager'));
const LaboratoryManager = React.lazy(() => import('./components/LaboratoryManager'));
const Undertakings = React.lazy(() => import('./components/Undertakings'));
const DocumentVault = React.lazy(() => import('./components/DocumentVault'));
const ImporterManager = React.lazy(() => import('./components/ImporterManager'));
const ClearanceManager = React.lazy(() => import('./components/ClearanceManager')); 
const CommodityManager = React.lazy(() => import('./components/CommodityManager'));
const UserManager = React.lazy(() => import('./components/UserManager'));
const PortManager = React.lazy(() => import('./components/PortManager')); 
const SettingsManager = React.lazy(() => import('./components/SettingsManager'));
const WelcomePage = React.lazy(() => import('./components/WelcomePage'));
const LoginPage = React.lazy(() => import('./components/LoginPage'));
const RiskProfileManager = React.lazy(() => import('./components/RiskProfileManager'));
const NotesManager = React.lazy(() => import('./components/NotesManager'));
const ReportsManager = React.lazy(() => import('./components/ReportsManager'));
const UserProfile = React.lazy(() => import('./components/UserProfile'));
const Certificates = React.lazy(() => import('./components/CertificateTemplates'));
const UserGuide = React.lazy(() => import('./components/UserGuide'));
const ChatSystem = React.lazy(() => import('./components/ChatSystem'));
const UsefulTools = React.lazy(() => import('./components/UsefulTools'));
const InspectorTools = React.lazy(() => import('./components/InspectorTools'));
const PublicSectorInfo = React.lazy(() => import('./components/PublicSectorInfo'));
const SectorSelectionPage = React.lazy(() => import('./components/SectorSelectionPage'));
const PresentationMode = React.lazy(() => import('./components/PresentationMode'));
import { Consignment, ConsignmentType, Importer, CommodityGroup, User, AppNotification, SystemSettings, NewsTickerItem, UserRole, PasswordResetRequest, Toast, AuthStep, SamplingPlan, ClearanceOffice, Port, PesticideMapping, ENumber, EpidemicAlert, HSCode, InspectionChecklist, Laboratory } from './types';
import { CONSIGNMENT_LABELS, APP_PAGES, APP_CATEGORIES } from './constants';
import * as FB from './firebaseService';
import { messaging } from './firebaseConfig';
import { onMessage } from 'firebase/messaging';
import useLocalStorage from './useLocalStorage';

import Logo from './components/Logo';
const SECTOR_THEMES: Record<ConsignmentType, string> = {
  [ConsignmentType.VETERINARY]: 'from-amber-500 to-amber-700',
  [ConsignmentType.AGRICULTURAL]: 'from-emerald-500 to-emerald-700',
  [ConsignmentType.FOOD_SAFETY]: 'from-blue-500 to-indigo-700'
};

const SplashScreen = () => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center font-tajawal overflow-hidden"
        >
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#c8102e 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 flex flex-col items-center"
            >
                <div className="flex flex-col items-center gap-8 mb-12">
                    <Logo size={140} className="mb-4 drop-shadow-2xl" />
                    <img referrerPolicy="no-referrer" 
                      src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                      alt="Ministry Logo" 
                      className="h-24 object-contain opacity-80" 
                    />
                    <div className="h-px w-32 bg-gradient-to-r from-transparent via-red-800 to-transparent"></div>
                    <h1 className="text-7xl font-black tracking-tighter text-slate-900 flex flex-col items-center gap-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-br from-red-600 to-red-900">مِرقاب</span>
                        <span className="text-xl font-bold text-slate-600">قسم الحجر وسلامة الغذاء</span>
                    </h1>
                    <motion.p 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="text-lg font-black text-red-700 mt-4"
                    >
                        أهلاً بكم في المنصة الذكية
                    </motion.p>
                </div>
                <div className="flex flex-col items-center gap-4">
                    <p className="text-slate-400 text-xs font-bold tracking-[0.3em] uppercase">نظام التسجيل والرقابة الذكي</p>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-bounce"></div>
                    </div>
                </div>
            </motion.div>
            <div className="absolute bottom-10 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">   الحجر وسلامة الغذاء | V 3.1.0</p>
            </div>
        </motion.div>
    );
};

const LoginSplashScreen = ({ user }: { user: User }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] bg-slate-900 flex flex-col items-center justify-center font-tajawal overflow-hidden text-white"
        >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/20 rounded-full blur-[120px] -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] -ml-16 -mb-16"></div>
            
            <div className="relative z-10 flex flex-col items-center text-center px-6">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="mb-8"
                >
                    <Logo size={120} variant="light" className="drop-shadow-2xl" />
                </motion.div>
                
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-4xl font-black mb-4 tracking-tight">مرحباً بك مجدداً</h2>
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-24 h-24 rounded-[2rem] border-4 border-white/20 shadow-2xl overflow-hidden bg-white/10 backdrop-blur-md">
                            {user.avatar ? (
                                <img referrerPolicy="no-referrer" src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl font-black text-white">
                                    {(user.name || 'U').split(' ').slice(0, 2).map(n => n[0]).join('')}
                                </div>
                            )}
                        </div>
                        <div>
                            <p className="text-2xl font-black text-emerald-400">{user.name}</p>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-80">{user.jobTitle || 'موظف النظام'}</p>
                        </div>
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 flex flex-col items-center gap-4"
                >
                    <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">جاري تهيئة بيئة العمل الذكية</p>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
                    </div>
                </motion.div>
            </div>
            
            <div className="absolute bottom-10 flex items-center gap-4 opacity-40">
                <img referrerPolicy="no-referrer" 
                  src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                  alt="Ministry Logo" 
                  className="h-10 object-contain brightness-0 invert" 
                />
                <div className="w-px h-6 bg-white/20"></div>
                <p className="text-[10px] font-black uppercase tracking-widest">MIRQAB SMART SYSTEM</p>
            </div>
        </motion.div>
    );
};

const SessionTracker = ({ user, systemSettings }: { user: User | null, systemSettings: SystemSettings | null }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;

        const updateSession = () => {
            FB.updateSessionActivity(user.id, user.role, user.name).catch(console.error);
        };

        // Update immediately and then every 1 minute for real-time presence
        updateSession();
        const intervalId = setInterval(updateSession, 60 * 1000);

        return () => clearInterval(intervalId);
    }, [user]);

    useEffect(() => {
        if (!user || !systemSettings?.autoLockTimeout) return;

        let autoLockTimeoutId: NodeJS.Timeout;
        let sessionTimeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            if (isLocked) return;
            clearTimeout(autoLockTimeoutId);
            clearTimeout(sessionTimeoutId);
            
            autoLockTimeoutId = setTimeout(() => {
                setIsLocked(true);
            }, systemSettings.autoLockTimeout! * 60 * 1000);

            if (systemSettings.sessionTimeout) {
                sessionTimeoutId = setTimeout(() => {
                    FB.logoutUser().then(() => {
                        window.location.reload();
                    });
                }, systemSettings.sessionTimeout * 60 * 1000);
            }
        };

        // Listen for activity
        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        window.addEventListener('click', resetTimer);
        window.addEventListener('scroll', resetTimer);

        resetTimer(); // Start initial timer

        return () => {
            clearTimeout(autoLockTimeoutId);
            clearTimeout(sessionTimeoutId);
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            window.removeEventListener('click', resetTimer);
            window.removeEventListener('scroll', resetTimer);
        };
    }, [user, systemSettings?.autoLockTimeout, systemSettings?.sessionTimeout, isLocked]);

    const handleUnlock = async () => {
        if (!user) return;
        try {
            // Re-authenticate to unlock
            await FB.loginUser(user.civilId, password);
            setIsLocked(false);
            setPassword('');
            setError('');
        } catch (e) {
            setError('كلمة المرور غير صحيحة');
        }
    };

    if (!isLocked || !user) return null;

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center font-tajawal text-white">
            <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 w-full max-w-md text-center">
                <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
                    <i className="fas fa-lock"></i>
                </div>
                <h2 className="text-2xl font-black mb-2">تم قفل الشاشة تلقائياً</h2>
                <p className="text-slate-400 text-sm mb-8">لحماية بياناتك، يرجى إدخال كلمة المرور للمتابعة</p>
                
                <div className="space-y-4 text-right">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">كلمة المرور</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-emerald-500 text-left"
                            dir="ltr"
                        />
                    </div>
                    {error && <p className="text-red-400 text-xs font-bold">{error}</p>}
                    <button 
                        onClick={handleUnlock}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition-colors"
                    >
                        إلغاء القفل
                    </button>
                    <button 
                        onClick={() => { setIsLocked(false); FB.logoutUser(); }}
                        className="w-full bg-transparent hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl transition-colors text-xs"
                    >
                        تسجيل الخروج
                    </button>
                </div>
            </div>
        </div>
    );
};

const IOSInstallModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-sm flex items-end md:items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-md p-8 rounded-[2.5rem] shadow-2xl relative animate-scale-in" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-6 left-6 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all">
                    <i className="fas fa-times"></i>
                </button>
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner border border-slate-200">
                        <i className="fab fa-apple text-slate-800"></i>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">تثبيت على الآيفون</h3>
                    <p className="text-sm font-bold text-slate-400 mt-2">اتبع الخطوات التالية لإضافة التطبيق للشاشة الرئيسية</p>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 text-xl shadow-sm border border-slate-100">
                            <i className="fas fa-share-square"></i>
                        </div>
                        <div className="text-right flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">الخطوة 1</p>
                            <p className="text-sm font-bold text-slate-700">اضغط على زر <span className="text-blue-600">المشاركة</span> في أسفل المتصفح</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-700 text-xl shadow-sm border border-slate-100">
                            <i className="fas fa-plus-square"></i>
                        </div>
                        <div className="text-right flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">الخطوة 2</p>
                            <p className="text-sm font-bold text-slate-700">اختر <span className="font-black">"إضافة إلى الصفحة الرئيسية"</span></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-700 text-sm font-black shadow-sm border border-slate-100">
                            Add
                        </div>
                        <div className="text-right flex-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">الخطوة 3</p>
                            <p className="text-sm font-bold text-slate-700">اضغط <span className="font-black">"إضافة"</span> في أعلى اليسار</p>
                        </div>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-bold">سيظهر التطبيق كأيقونة مستقلة على شاشتك الرئيسية</p>
                </div>
            </div>
        </div>
    );
};

const ConnectionStatus = ({ status, onRetry, mode = 'full' }: { status: 'CHECKING' | 'CONNECTED' | 'ERROR', onRetry: () => void, mode?: 'full' | 'inline' }) => {
    if (mode === 'inline') {
        if (status === 'CHECKING') {
            return (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-bold text-blue-700 tracking-wider hidden sm:inline">جاري الاتصال...</span>
                </div>
            );
        }
        if (status === 'ERROR') {
            return (
                <button onClick={onRetry} className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-100 hover:bg-red-100 transition-colors cursor-pointer group shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-125 transition-transform"></div>
                    <span className="text-[10px] font-bold text-red-700 tracking-wider hidden sm:inline">وضع غير متصل</span>
                    <i className="fas fa-sync-alt text-[10px] text-red-600 group-hover:rotate-180 transition-transform"></i>
                </button>
            );
        }
        return (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-700 tracking-wider hidden sm:inline">السحابة متصلة</span>
            </div>
        );
    }
    if (status === 'CHECKING') return <SplashScreen />;
    if (status === 'ERROR') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 font-tajawal p-6 text-center animate-fade-in">
                 <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-600 animate-pulse">
                    <i className="fas fa-wifi text-4xl"></i>
                 </div>
                 <h2 className="text-3xl font-black text-slate-800 mb-2">تعذر الاتصال بالنظام</h2>
                 <p className="text-slate-500 font-bold mb-8 max-w-md">لم نتمكن من الوصول إلى قاعدة البيانات السحابية. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.</p>
                 <button onClick={onRetry} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200 group">
                    <i className="fas fa-sync-alt mr-2 group-hover:rotate-180 transition-transform"></i> إعادة المحاولة
                 </button>
            </div>
        );
    }
    return null;
};

const RoleSelectionPage = ({ user, onSelect }: { user: User, onSelect: (role: UserRole) => void }) => {
    const roles: {id: UserRole, label: string, icon: string, desc: string, color: string, gradient: string, shadow: string}[] = [
        { id: 'ADMIN', label: 'مدير النظام', icon: 'fa-user-shield', desc: 'كامل الصلاحيات، إدارة المستخدمين، والإعدادات المتقدمة للنظام', color: 'text-slate-900', gradient: 'from-slate-800 to-slate-950', shadow: 'shadow-slate-200' },
        { id: 'MANAGER', label: 'مسؤول / مدير', icon: 'fa-briefcase', desc: 'الاطلاع على لوحات القيادة والتقارير الاستراتيجية والإحصائيات', color: 'text-blue-600', gradient: 'from-blue-500 to-blue-700', shadow: 'shadow-blue-100' },
        { id: 'INSPECTOR', label: 'مفتش ميداني', icon: 'fa-search-location', desc: 'إدارة الإرساليات، المعاينة الفنية، وسحب العينات المخبرية', color: 'text-emerald-600', gradient: 'from-emerald-500 to-emerald-700', shadow: 'shadow-emerald-100' },
        { id: 'LOGISTICS', label: 'موظف لوجستي', icon: 'fa-truck-loading', desc: 'متابعة الشحنات المحولة وتأكيد الاستلام والوصول للمنافذ', color: 'text-indigo-600', gradient: 'from-indigo-500 to-indigo-700', shadow: 'shadow-indigo-100' },
        { id: 'LAB_TECH', label: 'فني مختبر', icon: 'fa-flask', desc: 'إجراء الفحوصات وإدخال النتائج المخبرية النهائية للمختبر', color: 'text-amber-600', gradient: 'from-amber-500 to-amber-700', shadow: 'shadow-amber-100' },
        { id: 'LAB_DELEGATE', label: 'مندوب مختبر', icon: 'fa-truck-loading', desc: 'تأكيد استلام وفحص العينات المحالة وتوصيلها للمختبر', color: 'text-blue-500', gradient: 'from-blue-400 to-blue-600', shadow: 'shadow-blue-50' },
        { id: 'VIEWER', label: 'مطلع / تقارير', icon: 'fa-eye', desc: 'صلاحية الاطلاع والطباعة فقط دون إمكانية التعديل على البيانات', color: 'text-slate-500', gradient: 'from-slate-400 to-slate-600', shadow: 'shadow-slate-100' },
    ];

    return (
        <div className="min-h-screen bg-[#fcfcfc] flex flex-col items-center justify-center p-4 md:p-8 font-tajawal relative overflow-hidden" dir="rtl">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#c8102e 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-red-50 rounded-full blur-[120px] opacity-50 pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50 rounded-full blur-[120px] opacity-50 pointer-events-none"></div>

            <div className="w-full max-w-7xl z-10">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-16"
                >
                    <div className="inline-block relative mb-8">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[2.5rem] shadow-2xl border-4 border-white flex items-center justify-center relative z-10 overflow-hidden group"
                        >
                            {user.avatar ? (
                                <img referrerPolicy="no-referrer" src={user.avatar} alt={user.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                                    <span className="text-3xl md:text-4xl font-black text-slate-400">{(user.name || 'U').split(' ').slice(0, 2).map(n => n[0]).join('')}</span>
                                </div>
                            )}
                        </motion.div>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="absolute -bottom-2 -right-2 w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center z-20"
                        >
                            <i className="fas fa-check text-white text-xs md:text-sm"></i>
                        </motion.div>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight mb-4">
                        مرحباً بك، <span className="text-[#c8102e]">{user.name?.split(' ')[0] || 'المستخدم'}</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                        نظام مرقاب الذكي يتطلب تحديد الدور الوظيفي المناسب لبدء جلسة العمل الحالية
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {roles.map((role, index) => (
                        <motion.button
                            key={role.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + index * 0.05 }}
                            onClick={() => onSelect(role.id)}
                            className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-3 transition-all duration-500 flex flex-col items-center text-center overflow-hidden"
                        >
                            {/* Hover Background Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${role.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                            
                            <div className="relative z-10 flex flex-col items-center h-full">
                                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl ${role.shadow} group-hover:shadow-none bg-slate-50 group-hover:bg-white/20 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                                    <i className={`fas ${role.icon} text-3xl ${role.color} group-hover:text-white transition-colors duration-500`}></i>
                                </div>
                                
                                <h3 className="text-lg font-black mb-3 text-slate-800 group-hover:text-white transition-colors duration-500">
                                    {role.label}
                                </h3>
                                
                                <p className="text-xs font-bold text-slate-400 group-hover:text-white/80 leading-relaxed mb-8 transition-colors duration-500">
                                    {role.desc}
                                </p>

                                <div className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-white transition-colors duration-500">
                                    <span>دخول للنظام</span>
                                    <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                                </div>
                            </div>

                            {/* Decorative element */}
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
                        </motion.button>
                    ))}
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-20 flex flex-col items-center gap-6"
                >
                    <button 
                        onClick={() => FB.logoutUser()} 
                        className="group flex items-center gap-3 px-8 py-4 rounded-3xl bg-white border border-slate-100 text-slate-400 font-black text-sm shadow-sm hover:shadow-xl hover:text-red-600 hover:border-red-100 transition-all active:scale-95"
                    >
                        <div className="w-8 h-8 rounded-xl bg-slate-50 group-hover:bg-red-50 flex items-center justify-center transition-colors">
                            <i className="fas fa-sign-out-alt"></i>
                        </div>
                        تسجيل الخروج من الحساب
                    </button>
                    
                    <div className="flex items-center gap-4 text-slate-300">
                        <div className="h-px w-12 bg-slate-200"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Mirqab Smart System v3.1</span>
                        <div className="h-px w-12 bg-slate-200"></div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

const ChangePasswordPage = ({ currentUser, onSuccess, systemSettings }: { currentUser: User, onSuccess: () => void, systemSettings?: SystemSettings }) => {
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validatePassword = (password: string) => {
        const complexity = systemSettings?.passwordComplexity || 'MEDIUM';
        
        if (complexity === 'LOW') {
            if (password.length < 6) return "كلمة المرور يجب أن تكون 6 خانات على الأقل";
            if (!/^[a-zA-Z0-9]+$/.test(password)) return "كلمة المرور يجب أن تحتوي على حروف وأرقام فقط";
        } else if (complexity === 'MEDIUM') {
            if (password.length < 8) return "كلمة المرور يجب أن تكون 8 خانات على الأقل";
            if (!/(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)) return "كلمة المرور يجب أن تحتوي على حروف، أرقام، ورموز";
        } else if (complexity === 'HIGH') {
            if (password.length < 8) return "كلمة المرور يجب أن تكون 8 خانات على الأقل";
            if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)) return "كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة، أرقام، ورموز";
        }
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        const validationError = validatePassword(newPass);
        if (validationError) return setError(validationError);
        
        if(newPass !== confirmPass) return setError("كلمتا المرور غير متطابقتين");
        if(newPass === FB.DEFAULT_PASSWORD) return setError("لا يمكن استخدام كلمة المرور الافتراضية، يرجى اختيار كلمة مرور جديدة");
        
        setLoading(true);
        try {
            await FB.changeUserPassword(currentUser.id, newPass);
            onSuccess();
        } catch (e: any) {
            setError(e.message || "حدث خطأ أثناء التحديث");
        } finally {
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-tajawal" dir="rtl">
            <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 w-full max-w-lg border border-slate-100 relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 to-red-600"></div>
                <img referrerPolicy="no-referrer" src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" alt="Ministry Logo" className="h-20 mx-auto mb-8 object-contain" />
                <div className="mb-10">
                    <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-orange-500 animate-pulse"><i className="fas fa-key text-2xl"></i></div>
                    <h2 className="text-2xl font-black text-slate-800">تحديث كلمة المرور مطلوب</h2>
                    <p className="text-slate-400 text-sm font-bold mt-2">لأغراض أمنية، يجب تغيير كلمة المرور (الافتراضية أو المنتهية) قبل المتابعة</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 text-right">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">كلمة المرور الجديدة</label>
                        <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" required autoFocus />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">تأكيد كلمة المرور</label>
                        <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all" required />
                    </div>
                    {error && <div className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl text-center">{error}</div>}
                    <button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70">
                        {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <span>حفظ وتفعيل الحساب</span>}
                    </button>
                </form>
            </div>
        </div>
    );
};

const SetupAdminPage = ({ onComplete }: { onComplete: () => void }) => {
    const [name, setName] = useState('');
    const [civilId, setCivilId] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!name || !civilId || !password) return setError("جميع الحقول مطلوبة");
        if (password.length < 6) return setError("كلمة المرور يجب أن تكون 6 خانات على الأقل");
        setLoading(true);
        try {
            const newAdmin: User = { id: civilId, name, civilId, role: 'ADMIN', jobTitle: 'مدير النظام الرئيسي', allowedSectors: Object.values(ConsignmentType), allowedPages: APP_PAGES.map(p => p.path), isActive: true, needsPasswordReset: false };
            await FB.registerSystemUser(newAdmin, password);
            onComplete();
        } catch (e: any) {
            if (e.message.includes('auth/email-already-in-use')) setError("هذا المستخدم مسجل مسبقاً. حاول تسجيل الدخول.");
            else setError(e.message || "حدث خطأ أثناء إعداد الحساب.");
            setLoading(false);
        }
    };
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-tajawal" dir="rtl">
            <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 w-full max-w-lg border border-slate-100 relative overflow-hidden text-center">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
                <img referrerPolicy="no-referrer" src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" alt="Ministry Logo" className="h-20 mx-auto mb-8 object-contain" />
                <div className="mb-10">
                    <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600"><i className="fas fa-user-shield text-2xl"></i></div>
                    <h2 className="text-2xl font-black text-slate-800">إعداد النظام الرئيسي</h2>
                    <p className="text-slate-400 text-sm font-bold mt-2">تسجيل بيانات مدير النظام الأول لتفعيل المنصة</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6 text-right">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">الاسم الكامل</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" required placeholder="الاسم ثلاثي مع القبيلة" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">الرقم المدني (اسم المستخدم)</label>
                        <input type="text" value={civilId} onChange={(e) => setCivilId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" required placeholder="مثال: 12345678" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">كلمة مرور المدير</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all" required placeholder="يجب أن تكون قوية" />
                    </div>
                    {error && <div className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl text-center">{error}</div>}
                    <button type="submit" disabled={loading} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black py-5 rounded-[1.5rem] shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70">
                        {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <span>بدء تشغيل منظومة مرقاب</span>}
                    </button>
                </form>
            </div>
        </div>
    );
};

const Sidebar = ({ currentUser, onSwitchUser, onLogout, onSwitchSector, isSystemAdmin, isOpen, onClose, installPrompt, onInstall, isCollapsed, onToggleCollapse, hasPermission, systemSettings }: { currentUser: User, onSwitchUser: () => void, onLogout: () => void, onSwitchSector?: () => void, isSystemAdmin: boolean, isOpen: boolean, onClose: () => void, installPrompt: any, onInstall: () => void, isCollapsed: boolean, onToggleCollapse: () => void, hasPermission: (path: string) => boolean, systemSettings?: SystemSettings }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    APP_CATEGORIES.forEach(cat => {
      initial[cat.id] = true;
    });
    return initial;
  });
  
  useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth < 1024);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const toggleCategory = (categoryId: string) => {
      setExpandedCategories(prev => ({
          ...prev,
          [categoryId]: !prev[categoryId]
      }));
  };
  
  const effectiveIsCollapsed = isCollapsed && !isMobile;
  const isActive = (path: string) => location.pathname === path;
  const hasPageAccess = (path: string) => {
      return hasPermission(path);
  };

  const visiblePages = useMemo(() => {
    const allowed = APP_PAGES.filter(p => hasPageAccess(p.path));
    if (!currentUser?.sidebarPreferences || currentUser.sidebarPreferences.length === 0) return allowed;
    
    // Filter out pages that are no longer allowed but are in preferences
    const prefPaths = currentUser.sidebarPreferences;
    const ordered = prefPaths
        .map(path => allowed.find(p => p.path === path))
        .filter((p): p is typeof APP_PAGES[0] => !!p);
    
    // Add any new allowed pages that aren't in preferences yet
    const missing = allowed.filter(p => !prefPaths.includes(p.path));
    return [...ordered, ...missing];
  }, [currentUser?.sidebarPreferences, systemSettings?.rolePermissions]);

  return (
    <>
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[140] lg:hidden" 
                    onClick={onClose}
                ></motion.div>
            )}
        </AnimatePresence>

        <div 
            className={`h-screen bg-gradient-to-b from-[#c8102e] via-[#a60a22] to-[#8a0b1f] text-white flex flex-col fixed top-0 right-0 z-[150] shadow-2xl border-l border-white/10 font-tajawal transition-all duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'} ${effectiveIsCollapsed ? 'lg:w-20 w-72' : 'w-72'}`}
        >
        <div className="p-6 pb-6 shrink-0 z-10 bg-gradient-to-b from-[#c8102e] to-[#a60a22] shadow-lg border-b border-white/10 flex justify-between items-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className={`flex items-center space-x-reverse space-x-4 relative z-10 ${effectiveIsCollapsed ? 'justify-center w-full' : ''}`}>
                <div className="relative shrink-0">
                    <Logo size={effectiveIsCollapsed ? 40 : 48} variant="light" className="shadow-2xl transition-all" />
                    {!effectiveIsCollapsed && (
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#c8102e]"
                        ></motion.div>
                    )}
                </div>
                {!effectiveIsCollapsed && (
                    <>
                        <div className="w-px h-8 bg-white/20 mx-1"></div>
                        <img referrerPolicy="no-referrer" 
                            src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                            alt="Ministry Logo" 
                            className="h-8 object-contain opacity-90 brightness-0 invert" 
                        />
                        <div className="w-px h-8 bg-white/20 mx-1"></div>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                            <h1 className="text-xl font-black tracking-tight font-sans text-white mb-0.5 drop-shadow-md">مِرقاب</h1>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                <p className="text-[8px] text-red-100 font-bold leading-tight opacity-90 tracking-wide uppercase">نظام ذكي متصل</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </div>
            <button onClick={onClose} className="lg:hidden text-white/70 hover:text-white p-2 transition-colors absolute left-4"><i className="fas fa-times text-xl"></i></button>
        </div>
        
        <nav className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 scroll-fade-y">
            {!effectiveIsCollapsed && (
                <div className="flex items-center justify-between px-4 mb-3 mt-2">
                    <p className="text-[9px] font-black text-red-200 uppercase tracking-[0.2em] opacity-60">القائمة الرئيسية</p>
                    <Link to="/profile" onClick={onClose} className="text-[8px] font-black text-white/40 hover:text-white transition-colors flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                        <i className="fas fa-cog"></i> تخصيص
                    </Link>
                </div>
            )}
            
            {APP_CATEGORIES.map((category, index) => {
                const categoryPages = visiblePages.filter(p => p.category === category.id);
                if (categoryPages.length === 0) return null;
                const isExpanded = expandedCategories[category.id];

                return (
                    <div key={category.id} className={`${index > 0 ? 'pt-2 mt-2 border-t border-white/5' : ''} space-y-1 ${effectiveIsCollapsed ? 'px-0' : ''}`}>
                        {!effectiveIsCollapsed ? (
                            <button 
                                onClick={() => toggleCategory(category.id)}
                                className="w-full flex items-center justify-between px-4 py-2 mb-1 group cursor-pointer hover:bg-white/5 rounded-xl transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <i className={`fas ${category.icon} text-[10px] text-red-200 opacity-60 group-hover:opacity-100 transition-opacity`}></i>
                                    <p className="text-[10px] font-black text-red-200 uppercase tracking-[0.1em] opacity-60 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {category.label}
                                    </p>
                                </div>
                                <i className={`fas fa-chevron-down text-[10px] text-red-200 opacity-40 group-hover:opacity-100 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}></i>
                            </button>
                        ) : (
                            <div className="flex justify-center py-2 mb-1 border-b border-white/5 mx-2">
                                <i className={`fas ${category.icon} text-[12px] text-red-200 opacity-40`} title={category.label}></i>
                            </div>
                        )}
                        
                        <AnimatePresence initial={false}>
                            {(isExpanded || effectiveIsCollapsed) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden space-y-1"
                                >
                                    {categoryPages.map(page => (
                                        <NavItem key={page.path} to={page.path} icon={page.icon} label={page.label} active={isActive(page.path)} onClick={onClose} isCollapsed={effectiveIsCollapsed} customLabels={systemSettings?.customLabels} />
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                );
            })}
            
            <div className="h-8"></div>
        </nav>

        <div className="p-3 bg-black/20 shrink-0 border-t border-white/10 backdrop-blur-xl">
            <div className={`flex items-center space-x-reverse space-x-3 px-2 py-2 bg-white/5 rounded-2xl border border-white/10 shadow-inner mb-3 select-none group hover:bg-white/10 transition-all cursor-pointer ${effectiveIsCollapsed ? 'justify-center' : ''}`} onClick={() => { onClose(); window.location.hash = '/profile'; }}>
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-xl border-2 border-white/20 shadow-lg bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-white font-black text-sm select-none overflow-hidden group-hover:border-white/40 transition-all">
                        {currentUser?.avatar ? (
                            <img referrerPolicy="no-referrer" src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                            (currentUser?.name || 'User').split(' ').slice(0, 2).map(n => n[0]).join('')
                        )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-[#a60a22] rounded-full shadow-sm"></span>
                </div>
                {!effectiveIsCollapsed && (
                    <>
                        <div className="overflow-hidden flex-1 whitespace-nowrap">
                            <p className="text-sm font-black truncate text-white group-hover:text-emerald-300 transition-colors">{currentUser?.name || 'مستخدم'}</p>
                            <p className="text-[9px] text-red-200 font-bold uppercase tracking-tighter opacity-70">{currentUser?.jobTitle || 'بدون مسمى'}</p>
                        </div>
                        <i className="fas fa-chevron-left text-[10px] text-white/20 group-hover:text-white/60 transition-all"></i>
                    </>
                )}
            </div>

            <div className="space-y-2">
                {!effectiveIsCollapsed && installPrompt && (
                    <button onClick={onInstall} className="w-full bg-emerald-500 text-white py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 active:scale-95 whitespace-nowrap">
                        <i className="fas fa-download"></i> تثبيت التطبيق الذكي
                    </button>
                )}
                
                {!effectiveIsCollapsed && currentUser?.allowedSectors && currentUser.allowedSectors.length > 1 && (
                    <button onClick={() => { if(onSwitchSector) onSwitchSector(); onClose(); }} className="w-full bg-white/10 hover:bg-white/20 text-white py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 border border-white/10 active:scale-95 whitespace-nowrap">
                        <i className="fas fa-exchange-alt"></i> تبديل القطاع العملي
                    </button>
                )}

                <div className={`grid gap-2 ${effectiveIsCollapsed ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {isSystemAdmin && (
                        <button onClick={() => { onSwitchUser(); onClose(); }} className="bg-amber-500/20 hover:bg-amber-500 text-amber-100 hover:text-white py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 border border-amber-500/20 active:scale-95" title="تغيير الدور">
                            <i className="fas fa-user-shield"></i> {!effectiveIsCollapsed && <span>تبديل</span>}
                        </button>
                    )}
                    <button onClick={onLogout} className={`${isSystemAdmin && !effectiveIsCollapsed ? 'col-span-1' : 'col-span-2'} bg-red-600/20 hover:bg-red-600 text-white py-2.5 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 border border-white/5 active:scale-95`} title="خروج">
                        <i className="fas fa-power-off"></i> {!effectiveIsCollapsed && <span>خروج</span>}
                    </button>
                </div>
            </div>
            
            <button 
                onClick={onToggleCollapse}
                className="hidden lg:flex absolute top-1/2 -left-4 w-8 h-8 bg-white text-slate-800 rounded-full items-center justify-center shadow-lg border border-slate-200 hover:scale-110 hover:text-emerald-600 transition-all z-50"
            >
                <i className={`fas fa-chevron-${effectiveIsCollapsed ? 'left' : 'right'} text-xs`}></i>
            </button>
        </div>
        </div>
    </>
  );
};

const NavItem: React.FC<{ to: string, icon: string, label: string, active: boolean, onClick: () => void, isCollapsed?: boolean, customLabels?: Record<string, string> }> = ({ to, icon, label, active, onClick, isCollapsed, customLabels }) => {
  const getLabel = (path: string, defaultLabel: string) => {
    if (!customLabels) return defaultLabel;
    switch (path) {
      case '/': return customLabels.navDashboard || defaultLabel;
      case '/portal': return customLabels.navConsignments || defaultLabel;
      case '/labs': return customLabels.navLab || defaultLabel;
      case '/reports': return customLabels.navReports || defaultLabel;
      default: return defaultLabel;
    }
  };

  return (
    <Link to={to} onClick={onClick} className="relative block group" title={isCollapsed ? getLabel(to, label) : undefined}>
      <motion.div 
          whileHover={{ x: isCollapsed ? 0 : -4 }}
          whileTap={{ scale: 0.98 }}
          className={`flex items-center space-x-reverse space-x-4 px-3 py-3 rounded-2xl transition-all relative overflow-hidden ${active ? 'bg-white text-[#c8102e] shadow-2xl shadow-black/20' : 'text-red-100 hover:bg-white/10 hover:text-white'} ${isCollapsed ? 'justify-center' : ''}`}
      >
          {active && (
              <motion.div 
                  layoutId="activeNav"
                  className="absolute inset-0 bg-white"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
              />
          )}
          <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center transition-all relative z-10 ${active ? 'bg-red-50 text-[#c8102e] shadow-inner' : 'bg-black/20 group-hover:bg-black/40'}`}>
              <i className={`fas ${icon} text-sm`}></i>
          </div>
          
          {!isCollapsed && (
              <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="font-bold text-[13px] tracking-tight relative z-10 whitespace-nowrap"
              >
                  {getLabel(to, label)}
              </motion.span>
          )}
          
          {active && !isCollapsed && (
              <motion.div 
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute left-4 w-2 h-2 bg-emerald-600 rounded-full shadow-sm z-10"
              ></motion.div>
          )}
      </motion.div>
    </Link>
  );
};
const NewsTicker = ({ settings }: { settings: SystemSettings }) => {
    const [isVisible, setIsVisible] = useState(true);
    
    if (!settings.newsTickerEnabled || !isVisible) return null;
    
    const activeItems = (settings.newsTickerItems || []).filter(item => item.isActive && item.text.trim());
    if (activeItems.length === 0) return null;

    const renderItem = (item: NewsTickerItem, idx: number) => {
        const colors = {
            urgent: 'text-red-400 bg-red-400/10 border-red-400/20 shadow-[0_0_10px_rgba(248,113,113,0.2)]',
            warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20 shadow-[0_0_10px_rgba(251,191,36,0.2)]',
            info: 'text-blue-400 bg-blue-400/10 border-blue-400/20 shadow-[0_0_10px_rgba(96,165,250,0.2)]'
        };
        const icons = {
            urgent: <AlertCircle className={`w-3.5 h-3.5 ${item.type === 'urgent' ? 'animate-pulse' : ''}`} />,
            warning: <AlertTriangle className="w-3.5 h-3.5" />,
            info: <Info className="w-3.5 h-3.5" />
        };

        return (
            <span key={item.id || idx} className="inline-flex items-center gap-4 px-8 group/item">
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-black uppercase tracking-wider ${colors[item.type]}`}>
                    {icons[item.type]}
                    {item.type === 'urgent' ? 'عاجل' : item.type === 'warning' ? 'تنبيه' : 'إعلان'}
                </span>
                <span className="text-[14px] font-bold text-slate-100 group-hover/item:text-white transition-colors">
                    {item.text}
                </span>
                <span className="text-slate-700 font-light mx-4 opacity-50">|</span>
            </span>
        );
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-950/95 backdrop-blur-xl text-white overflow-hidden relative z-[60] border-b border-white/10 shadow-2xl group"
            >
                {/* Decorative Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-slate-900/50 to-blue-900/20 pointer-events-none opacity-60"></div>
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                
                <div className="flex items-center gap-0 relative z-10 h-12">
                    {/* Fixed Label with "Live" Indicator */}
                    <div className="bg-slate-900/90 backdrop-blur-md h-full px-6 border-l border-white/10 shadow-[20px_0_40px_rgba(0,0,0,0.5)] z-30 flex items-center gap-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live</span>
                        </div>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <div className="flex items-center gap-2 text-white">
                            <Newspaper className="w-4 h-4 text-red-500" />
                            <span className="text-[13px] font-black tracking-tight">آخر الأخبار</span>
                        </div>
                    </div>

                    {/* Scrolling Content */}
                    <div className="flex-1 overflow-hidden relative h-full flex items-center">
                        <div 
                            className="animate-marquee hover:[animation-play-state:paused] cursor-default"
                            style={{ animationDuration: `${settings.newsTickerSpeed || 30}s` }}
                        >
                            <div className="flex items-center shrink-0 px-4 min-w-full justify-around">
                                {activeItems.map((item, idx) => renderItem(item, idx))}
                                {activeItems.map((item, idx) => renderItem(item, idx + activeItems.length))}
                            </div>
                            <div className="flex items-center shrink-0 px-4 min-w-full justify-around">
                                {activeItems.map((item, idx) => renderItem(item, idx))}
                                {activeItems.map((item, idx) => renderItem(item, idx + activeItems.length))}
                            </div>
                        </div>
                    </div>

                    {/* Close Button */}
                    <div className="h-full bg-slate-900/90 backdrop-blur-md px-4 border-r border-white/10 z-30 flex items-center shrink-0">
                        <button 
                            onClick={() => setIsVisible(false)}
                            className="text-slate-400 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-colors"
                            title="إخفاء الشريط الإخباري"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Pause Indicator Overlay */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 text-[11px] font-bold text-slate-200 pointer-events-none z-40 shadow-xl">
                        <PauseCircle className="w-3.5 h-3.5 text-red-400" />
                        <span>توقف مؤقتاً للمعاينة</span>
                    </div>
                </div>

                {/* Edge Fades */}
                <div className="absolute inset-y-0 right-[180px] w-24 bg-gradient-to-r from-slate-950 to-transparent pointer-events-none z-20"></div>
                <div className="absolute inset-y-0 left-12 w-24 bg-gradient-to-l from-slate-950 to-transparent pointer-events-none z-20"></div>
            </motion.div>
        </AnimatePresence>
    );
};

const NotificationPanel = ({ notifications, onMarkAsRead, onMarkSingleAsRead, onClose }: { notifications: AppNotification[], onMarkAsRead: () => void, onMarkSingleAsRead: (id: string) => void, onClose: () => void }) => {
    const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD'>('ALL');
    const filteredNotifications = notifications
        .slice()
        .sort((a,b) => (a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1))
        .filter(n => activeTab === 'ALL' || !n.isRead);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-16 left-0 w-80 md:w-96 bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden z-[100] origin-top-left ring-4 ring-slate-100/50 flex flex-col"
        >
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <div>
                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-2"><i className="fas fa-bell text-[#c8102e]"></i>مركز التنبيهات</h4>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">لديك {notifications.filter(n => !n.isRead).length} إشعار غير مقروء</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onMarkAsRead} className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 transition-colors" title="تحديد الكل كمقروء"><i className="fas fa-check-double"></i></button>
                    <button onClick={onClose} className="text-[10px] bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-100 transition-colors"><i className="fas fa-times"></i></button>
                </div>
            </div>
            
            <div className="flex px-4 pt-2 gap-2 bg-white border-b border-slate-100">
                <button onClick={(e) => { e.stopPropagation(); setActiveTab('ALL'); }} className={`pb-2 px-4 text-xs font-bold border-b-2 transition-colors ${activeTab === 'ALL' ? 'border-[#c8102e] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>الكل</button>
                <button onClick={(e) => { e.stopPropagation(); setActiveTab('UNREAD'); }} className={`pb-2 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'UNREAD' ? 'border-[#c8102e] text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    غير مقروء
                    {notifications.filter(n => !n.isRead).length > 0 && (
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${activeTab === 'UNREAD' ? 'bg-[#c8102e] text-white' : 'bg-slate-100 text-slate-500'}`}>{notifications.filter(n => !n.isRead).length}</span>
                    )}
                </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto custom-scrollbar bg-slate-50/30">
                <AnimatePresence mode="popLayout">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notif, idx) => (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={`${notif.id}-${idx}`} 
                                onClick={() => { if(!notif.isRead) onMarkSingleAsRead(notif.id); }} 
                                className={`p-4 border-b border-slate-100/50 flex gap-4 transition-all group relative cursor-pointer ${!notif.isRead ? 'bg-white hover:bg-blue-50/30' : 'bg-slate-50/50 opacity-70 hover:opacity-100'}`}
                            >
                                {!notif.isRead && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500 shadow-sm animate-pulse"></div>}
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border transition-transform group-hover:scale-105 ${notif.type === 'error' ? 'bg-red-50 text-red-500 border-red-100' : notif.type === 'warning' ? 'bg-amber-50 text-amber-500 border-amber-100' : notif.type === 'success' ? 'bg-green-50 text-green-500 border-green-100' : 'bg-blue-50 text-blue-500 border-blue-100'}`}>
                                    <i className={`fas ${notif.type === 'error' ? 'fa-exclamation-circle' : notif.type === 'warning' ? 'fa-clock' : notif.type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} text-sm`}></i>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start mb-1 pr-2">
                                        <p className={`text-xs font-black ${!notif.isRead ? 'text-slate-800' : 'text-slate-600'}`}>{notif.title}</p>
                                        <span className="text-[9px] text-slate-400 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-100">{notif.timestamp}</span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-2">{notif.message}</p>
                                    {notif.link && (<Link to={notif.link} onClick={onClose} className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline mt-2 bg-blue-50/50 px-2 py-1 rounded-lg"><span>متابعة الإجراء</span><i className="fas fa-arrow-left text-[8px]"></i></Link>)}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="py-16 text-center flex flex-col items-center justify-center">
                            <div className="relative mb-6">
                                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-50"></div>
                                <img src="https://picsum.photos/seed/relaxing/200/200?blur=2" referrerPolicy="no-referrer" alt="Relaxing" className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-white relative z-10" />
                                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-2 shadow-lg z-20">
                                    <i className="fas fa-check-circle text-green-500 text-xl"></i>
                                </div>
                            </div>
                            <h5 className="text-sm font-black text-slate-700 mb-2">أنت على إطلاع دائم!</h5>
                            <p className="text-[11px] font-bold text-slate-400 max-w-[200px] leading-relaxed">ليس لديك أي إشعارات جديدة في الوقت الحالي، قائمة المهام فارغة.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
            <div className="p-3 border-t border-slate-50 bg-slate-50 text-center">
                <button onClick={onClose} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors w-full">إخفاء القائمة</button>
            </div>
        </motion.div>
    );
};

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[], removeToast: (id: string) => void }) => {
    return (
        <div className="fixed top-24 left-6 z-[200] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {toasts.map(toast => (
                    <motion.div 
                        key={toast.id} 
                        layout
                        initial={{ opacity: 0, x: -50, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, x: -20 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 300 }}
                        dragElastic={0.2}
                        onDragEnd={(_, info) => {
                            if (info.offset.x > 100 || info.offset.x < -100) removeToast(toast.id);
                        }}
                        className={`pointer-events-auto cursor-grab active:cursor-grabbing relative overflow-hidden min-w-[300px] max-w-sm p-4 rounded-2xl shadow-xl flex items-center gap-3 border transition-colors ${toast.type === 'success' ? 'bg-white border-green-100 text-green-700 shadow-green-500/10' : toast.type === 'error' ? 'bg-white border-red-100 text-red-700 shadow-red-500/10' : 'bg-white border-blue-100 text-blue-700 shadow-blue-500/10'}`}>
                        
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${toast.type === 'success' ? 'bg-green-50 text-green-600' : toast.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            <i className={`fas ${toast.type === 'success' ? 'fa-check' : toast.type === 'error' ? 'fa-ban' : 'fa-info'} text-sm`}></i>
                        </div>
                        <p className="text-xs font-bold flex-1 leading-snug">{toast.message}</p>
                        <button onClick={() => removeToast(toast.id)} className="text-slate-300 hover:text-slate-500 transition-colors p-1"><i className="fas fa-times"></i></button>
                        
                        <motion.div 
                            initial={{ width: '100%' }}
                            animate={{ width: '0%' }}
                            transition={{ duration: toast.duration ? toast.duration / 1000 : 4, ease: 'linear' }}
                            className={`absolute bottom-0 left-0 h-1 ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
                        />
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

const DEFAULT_USERS: User[] = [
    {
        id: '8802302',
        civilId: '8802302',
        name: 'المستخدم 8802302',
        role: 'ADMIN',
        jobTitle: 'مدير النظام',
        allowedSectors: Object.values(ConsignmentType),
        allowedPages: APP_PAGES.map(p => p.path),
        isActive: true,
        needsPasswordReset: false
    }
];
const DEFAULT_IMPORTERS: Importer[] = [];
const DEFAULT_COMMODITIES: CommodityGroup[] = [];
const DEFAULT_CONSIGNMENTS: Consignment[] = [];
const DEFAULT_SETTINGS: SystemSettings = { 
    riskThreshold: 60, 
    enableEmailAlerts: true, 
    enableSmsAlerts: false, 
    autoLockHighRisk: true, 
    maintenanceMode: false,
    newsTickerEnabled: true,
    newsTickerItems: [
        { id: '1', text: 'مرحباً بكم في نظام مرقاب الذكي - يرجى التأكد من استكمال كافة البيانات المطلوبة في المعاملات لضمان سرعة الإنجاز', type: 'info', isActive: true }
    ],
    newsTickerSpeed: 30,
    importantLinks: [
        { id: '1', title: 'نظام بيان الجمركي', url: 'https://bayan.customs.gov.om/', icon: 'fas fa-ship', description: 'بوابة التخليص الجمركي' },
        { id: '2', title: 'الدستور الغذائي (Codex)', url: 'https://www.fao.org/fao-who-codexalimentarius/en/', icon: 'fas fa-globe', description: 'المواصفات القياسية الدولية' },
        { id: '3', title: 'المنظمة العالمية للصحة الحيوانية', url: 'https://www.woah.org/en/home/', icon: 'fas fa-paw', description: 'WOAH / OIE' },
        { id: '4', title: 'الاتفاقية الدولية لوقاية النباتات', url: 'https://www.ippc.int/en/', icon: 'fas fa-leaf', description: 'IPPC' }
    ],
    rolePermissions: {
        'ADMIN': APP_PAGES.map(p => p.path),
        'MANAGER': ['/', '/analytics', '/portal', '/reports', '/importers', '/clearance', '/commodities', '/sampling', '/labs', '/delegate-portal', '/risks', '/undertakings', '/vault', '/guide'],
        'INSPECTOR': ['/', '/portal', '/inspector-tools', '/tools', '/logistics', '/sampling', '/undertakings', '/notes', '/vault', '/guide', '/chat'],
        'LAB_TECH': ['/', '/portal', '/sampling', '/labs', '/notes', '/guide', '/chat'],
        'LOGISTICS': ['/', '/portal', '/logistics', '/notes', '/guide', '/chat'],
        'VIEWER': ['/', '/analytics', '/portal', '/reports', '/importers', '/clearance', '/commodities', '/vault', '/guide'],
        'LAB_DELEGATE': ['/delegate-portal', '/chat', '/profile']
    },
    securityAuditEnabled: true,
    performanceMonitoringEnabled: true,
    developerMode: true,
    ipWhitelist: ['127.0.0.1'],
    sessionTimeout: 30,
    twoFactorAuthRequired: false,
    databaseOptimizationEnabled: true,
    apiLoggingEnabled: true,
    darkModeEnabled: false,
    backupFrequency: 'DAILY',
    retentionPeriod: 30
};

const AppContent: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<'CHECKING' | 'CONNECTED' | 'ERROR'>('CHECKING');
  const [splashFinished, setSplashFinished] = useState(false);
  const [showLoginSplash, setShowLoginSplash] = useState(false);
  const [authStep, setAuthStep] = useState<AuthStep>('WELCOME');
  const [activeSector, setActiveSector] = useState<ConsignmentType>(() => {
      const saved = localStorage.getItem('mirqab_active_sector');
      return (saved as ConsignmentType) || ConsignmentType.FOOD_SAFETY;
  });
  const [systemSettings, setSystemSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const settingsRef = useRef<SystemSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
      settingsRef.current = systemSettings;
  }, [systemSettings]);

  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [importers, setImporters] = useState<Importer[]>(DEFAULT_IMPORTERS);
  const [commodityGroups, setCommodityGroups] = useState<CommodityGroup[]>(DEFAULT_COMMODITIES);
  const [consignments, setConsignments] = useState<Consignment[]>(DEFAULT_CONSIGNMENTS);
  const [samplingPlans, setSamplingPlans] = useState<SamplingPlan[]>([]);
  const [pesticides, setPesticides] = useState<PesticideMapping[]>([]);
  const [pendingResetRequests, setPendingResetRequests] = useState<PasswordResetRequest[]>([]);
  const [inspectionTypes, setInspectionTypes] = useState<string[]>(['ظاهري', 'دقيق', 'فني', 'سحب عينة فقط']);
  const [declarationTypes, setDeclarationTypes] = useState<string[]>(['استيراد', 'تصدير', 'إعادة تصدير', 'عبور (ترانزيت)']);
  const [undertakingTypes, setUndertakingTypes] = useState<string[]>(['تعهد عدم التصرف', 'تعهد إعادة تصدير', 'تعهد استكمال نواقص']);
  const [containerTypes, setContainerTypes] = useState<string[]>(['General', 'Reefer', 'Open Top', 'Flat Rack', 'Tank', 'Bulk']);
  const [transferDestinations, setTransferDestinations] = useState<string[]>(['الحجر الزراعي', 'الحجر البيطري', 'سلامة الغذاء', 'الجمارك', 'جهات أخرى']); 
  const [labAnalysisTypes, setLabAnalysisTypes] = useState<Record<ConsignmentType, string[]>>({ [ConsignmentType.FOOD_SAFETY]: ['بكتيري', 'كيميائي', 'فيزيائي', 'سموم فطرية', 'إشعاعي', 'تقدير صلاحية'], [ConsignmentType.AGRICULTURAL]: ['متبقيات مبيدات', 'حشرات', 'فطريات', 'نيماتودا', 'بذور حشائش'], [ConsignmentType.VETERINARY]: ['فحص فيروسي', 'طفيليات دم', 'أمراض مشتركة', 'هرمونات', 'بقايا أدوية'] });
  const [rejectionReasons, setRejectionReasons] = useState<Record<ConsignmentType, string[]>>({ [ConsignmentType.FOOD_SAFETY]: ['تلوث بكتيري', 'انتهاء فترة الصلاحية', 'تغير في الخواص', 'تلف العبوات'], [ConsignmentType.AGRICULTURAL]: ['إصابة حشرية حية', 'وجود تربة', 'تجاوز متبقيات المبيدات', 'عفن وتلف'], [ConsignmentType.VETERINARY]: ['أعراض مرضية', 'عدم وجود شهادة', 'حيوانات نافقة', 'مخالفة قانون الحجر'] });
  const [intendedUses, setIntendedUses] = useState<string[]>(['استهلاك آدمي', 'تصنيع', 'إكثار', 'زراعة', 'تجارب علمية']);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  
  const [readNotifArray, setReadNotifArray] = useLocalStorage<string[]>('mirqab_read_notifs', []);
  const readNotificationIds = useMemo(() => new Set(readNotifArray), [readNotifArray]);
  
  const [notifTriggerIds, setNotifTriggerIds] = useLocalStorage<string[]>('mirqab_triggered_push', []);
  
  const setReadNotificationIds = (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      if (typeof updater === 'function') {
          setReadNotifArray(Array.from(updater(new Set(readNotifArray))));
      } else {
          setReadNotifArray(Array.from(updater));
      }
  };

  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showPresentation, setShowPresentation] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
      const saved = localStorage.getItem('mirqab_sidebar_collapsed');
      return saved === 'true';
  });
  const [darkMode, setDarkMode] = useState(() => {
      const saved = localStorage.getItem('mirqab_dark_mode');
      return saved === 'true';
  });

  useEffect(() => {
    if (systemSettings?.darkModeEnabled !== undefined && systemSettings.darkModeEnabled !== darkMode) {
      setDarkMode(systemSettings.darkModeEnabled);
    }
  }, [systemSettings?.darkModeEnabled]);

  // Hijack native window.alert to use the Toast system
  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
        addToast(message, 'info', 4000);
    };
    return () => {
        window.alert = originalAlert;
    };
  }, []);

  useEffect(() => {
      if (darkMode) {
          document.documentElement.classList.add('dark');
      } else {
          document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('mirqab_dark_mode', darkMode.toString());
  }, [darkMode]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [clearanceOffices, setClearanceOffices] = useState<ClearanceOffice[]>([]); 
  const [ports, setPorts] = useState<Port[]>([]); 
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  
  // Inspector Tools Data
  const [eNumbers, setENumbers] = useState<ENumber[]>([
    { code: 'E100', name: 'Curcumin (كركمين)', status: 'مسموح', type: 'ملون' },
    { code: 'E120', name: 'Carmine (كارمين)', status: 'مشتبه به / غير حلال غالباً', type: 'ملون', note: 'مستخرج من الحشرات' },
    { code: 'E171', name: 'Titanium Dioxide (ثاني أكسيد التيتانيوم)', status: 'ممنوع', type: 'ملون', note: 'ممنوع في بعض الدول للاشتباه بكونه مسرطن' },
    { code: 'E211', name: 'Sodium Benzoate (بنزوات الصوديوم)', status: 'مسموح بشروط', type: 'مادة حافظة', note: 'يجب ألا يتجاوز الحد المسموح' },
    { code: 'E300', name: 'Ascorbic Acid (فيتامين سي)', status: 'مسموح', type: 'مضاد أكسدة' },
    { code: 'E621', name: 'Monosodium Glutamate - MSG (أحادي جلوتامات الصوديوم)', status: 'مسموح بشروط', type: 'محسن نكهة', note: 'يجب ذكره بوضوح على الملصق' },
    { code: 'E904', name: 'Shellac (شيلاك)', status: 'مشتبه به', type: 'مادة تلميع', note: 'مستخرج من إفرازات حشرية' },
    { code: 'E441', name: 'Gelatin (جيلاتين)', status: 'مشتبه به / غير حلال', type: 'مادة هلامية', note: 'يجب التأكد من المصدر (بقري حلال أو نباتي)' }
  ]);
  const [epidemicAlerts, setEpidemicAlerts] = useState<EpidemicAlert[]>([
    { country: 'البرازيل', disease: 'إنفلونزا الطيور العالية الضراوة (HPAI)', status: 'محظور جزئياً', date: '2023-10-01', note: 'حظر على الدواجن الحية من ولايات محددة' },
    { country: 'جنوب أفريقيا', disease: 'حمى الوادي المتصدع (RVF)', status: 'محظور كلياً', date: '2024-01-15', note: 'حظر استيراد المواشي الحية' },
    { country: 'الهند', disease: 'فيروس نيباه', status: 'مراقبة مشددة', date: '2023-09-20', note: 'فحص إضافي للمنتجات الطازجة من ولاية كيرالا' },
    { country: 'فرنسا', disease: 'جنون البقر (BSE)', status: 'مسموح بشروط', date: '2022-05-10', note: 'يسمح باللحوم من مسالخ معتمدة فقط' }
  ]);
  const [hsCodes, setHSCodes] = useState<HSCode[]>([
    { code: '01012100', name: 'خيول حية - للتربية الأصيلة', category: 'حيوانات حية' },
    { code: '01022100', name: 'أبقار حية - للتربية الأصيلة', category: 'حيوانات حية' },
    { code: '02011000', name: 'لحوم فصيلة بقرية، طازجة أو مبردة - ذبائح كاملة أو أنصاف ذبائح', category: 'لحوم' },
    { code: '02071100', name: 'لحوم وأحشاء صالحة للأكل من الدواجن - غير مقطعة، طازجة أو مبردة', category: 'لحوم' },
    { code: '03021100', name: 'أسماك السلمون، طازجة أو مبردة', category: 'أسماك' },
    { code: '04011000', name: 'حليب وقشدة، غير مركزة ولا تحتوي على سكر مضاف - نسبة الدهون لا تتجاوز 1%', category: 'ألبان' },
    { code: '07020000', name: 'طماطم، طازجة أو مبردة', category: 'خضروات' },
    { code: '08041000', name: 'تمور، طازجة أو مجففة', category: 'فواكه' },
    { code: '10063000', name: 'أرز مضروب كلياً أو جزئياً', category: 'حبوب' },
    { code: '15091000', name: 'زيت زيتون بكر', category: 'زيوت' }
  ]);
  const [checklists, setChecklists] = useState<Record<string, InspectionChecklist>>({
    'reefer': {
        id: 'reefer',
        title: 'قائمة فحص حاوية مبردة (Reefer)',
        items: [
            'التحقق من رقم الحاوية ومطابقته للبيان الجمركي',
            'التحقق من سلامة القفل الملاحي (Seal)',
            'قراءة درجة الحرارة من الشاشة الخارجية ومطابقتها للمطلوب',
            'التأكد من عدم وجود تسريب سوائل أو روائح كريهة من الحاوية',
            'فحص جهاز التبريد والتأكد من عمله بكفاءة',
            'عند الفتح: التأكد من رص الكراتين بشكل يسمح بمرور الهواء',
            'أخذ قراءات حرارة عشوائية من داخل المنتجات (أمام، وسط، خلف)'
        ]
    },
    'live_animals': {
        id: 'live_animals',
        title: 'قائمة فحص شحنة حيوانات حية',
        items: [
            'التحقق من الشهادة الصحية البيطرية الأصلية',
            'التأكد من وجود شهادة المنشأ',
            'فحص الحالة الصحية العامة للقطيع (خمول، إفرازات، عرج)',
            'التأكد من مطابقة الأعداد والأنواع لما هو مذكور في البيان',
            'التحقق من وجود أرقام تعريفية (Ear tags) للحيوانات',
            'فحص وسيلة النقل والتأكد من توفر التهوية والمساحة الكافية',
            'التأكد من توفر الغذاء والماء أثناء الرحلة'
        ]
    },
    'food_general': {
        id: 'food_general',
        title: 'قائمة فحص مواد غذائية عامة',
        items: [
            'التحقق من وجود البطاقة الغذائية باللغة العربية',
            'التأكد من وضوح تواريخ الإنتاج والانتهاء',
            'التحقق من قائمة المكونات وعدم وجود مواد ممنوعة',
            'التأكد من سلامة العبوات (عدم وجود انتفاخ، صدأ، أو تسريب)',
            'مطابقة بلد المنشأ المكتوب على العبوة مع الشهادات',
            'التأكد من ظروف التخزين داخل وسيلة النقل'
        ]
    }
  }); 
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstruction, setShowIOSInstruction] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const location = useLocation();

  const handleSectorChange = (sector: ConsignmentType) => { setActiveSector(sector); localStorage.setItem('mirqab_active_sector', sector); };

  useEffect(() => {
      if (currentUser && connectionStatus === 'CONNECTED') { 
          FB.updateUserPresence(currentUser.id, true); 
          
          const setOffline = () => FB.updateUserPresence(currentUser.id!, false);
          const setOnline = () => FB.updateUserPresence(currentUser.id!, true);

          window.addEventListener('beforeunload', setOffline);
          
          return () => {
              setOffline();
              window.removeEventListener('beforeunload', setOffline);
          };
      }
  }, [currentUser, connectionStatus]);

  // Real-time check for account deactivation
  useEffect(() => {
      if (currentUser) {
          const updatedUser = users.find(u => u.id === currentUser.id);
          if (updatedUser && updatedUser.isActive === false) {
              FB.logoutUser().then(() => {
                  setCurrentUser(null);
                  setAuthStep('WELCOME');
                  addToast("تم تعطيل حسابك من قبل الإدارة. يرجى مراجعة رئيس قسم المنفذ أو مدير النظام.", "error", 30000);
              });
          }
      }
  }, [users, currentUser]);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone);
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua) || (window.navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIosDevice && !isStandalone);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      if (!window.matchMedia('(display-mode: standalone)').matches) {
          setDeferredPrompt(e);
      }
    };

    const handleAppInstalled = () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
        setIsIOS(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    const matchMediaWatcher = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
        setIsInstalled(e.matches);
        if (e.matches) {
            setDeferredPrompt(null);
            setIsIOS(false);
        }
    };
    matchMediaWatcher.addEventListener('change', handleMediaChange);

    return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        matchMediaWatcher.removeEventListener('change', handleMediaChange);
    };
  }, []);

  useEffect(() => {
    if (messaging) {
        onMessage(messaging, (payload) => {
            if (payload.notification) {
                addToast(payload.notification.title + ": " + payload.notification.body, 'info');
            }
        });
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
        setShowIOSInstruction(true);
    } else if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    }
  };

  const playSound = (type: 'success' | 'error' | 'info') => {
      try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioCtx.createOscillator();
          const gainNode = audioCtx.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioCtx.destination);
          
          if (type === 'success') {
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
              oscillator.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6
              gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
              gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
              gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
              oscillator.start(audioCtx.currentTime);
              oscillator.stop(audioCtx.currentTime + 0.2);
          } else if (type === 'error') {
              oscillator.type = 'sawtooth';
              oscillator.frequency.setValueAtTime(150, audioCtx.currentTime); 
              oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.2); 
              gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
              gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
              gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
              oscillator.start(audioCtx.currentTime);
              oscillator.stop(audioCtx.currentTime + 0.3);
          } else {
              oscillator.type = 'sine';
              oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
              gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
              gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.05);
              gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.15);
              oscillator.start(audioCtx.currentTime);
              oscillator.stop(audioCtx.currentTime + 0.15);
          }
      } catch (e) {
          console.error("Audio playback failed", e);
      }
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 4000) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, message, type, duration }]);
      
      // Play sound notification
      if (settingsRef.current?.enableSoundAlerts !== false) {
          playSound(type);
      }
      
      setTimeout(() => { setToasts(prev => prev.filter(t => t.id !== id)); }, duration);
  };
  const removeToast = (id: string) => { setToasts(prev => prev.filter(t => t.id !== id)); };
  
  const initializeSystem = async () => {
      setConnectionStatus('CHECKING');
      const isConnected = await FB.verifyDbConnection();
      if (isConnected) {
          setConnectionStatus('CONNECTED');
          if (authStep !== 'WELCOME') addToast("تم الاتصال بنجاح", "success");
      } else setConnectionStatus('ERROR');
  };
  
  useEffect(() => { const timer = setTimeout(() => { setSplashFinished(true); }, 4000); return () => clearTimeout(timer); }, []);
  useEffect(() => { initializeSystem(); }, []);

  const refreshAllData = async () => {
      try {
          // Only fetch data that isn't already being subscribed to in useEffect
          const lData = await FB.getDoc('lookups', 'lists');

          if (lData) {
              const lookups = lData as any;
              if(lookups.inspectionTypes) setInspectionTypes(lookups.inspectionTypes);
              if(lookups.declarationTypes) setDeclarationTypes(lookups.declarationTypes);
              if(lookups.containerTypes) setContainerTypes(lookups.containerTypes); 
              if(lookups.transferDestinations) setTransferDestinations(lookups.transferDestinations);
              if(lookups.labAnalysisTypes) setLabAnalysisTypes(lookups.labAnalysisTypes);
              if(lookups.rejectionReasons) setRejectionReasons(lookups.rejectionReasons);
              if(lookups.undertakingTypes) setUndertakingTypes(lookups.undertakingTypes);
              if(lookups.intendedUses) setIntendedUses(lookups.intendedUses);
          }
      } catch (e) {
          console.error("Failed to load data", e);
      }
  };

  useEffect(() => {
    refreshAllData();
    
    // Subscribe to system settings for real-time updates (News Ticker, etc.)
    const unsubscribeSettings = FB.db.collection('settings').doc('general').onSnapshot(doc => {
        if (doc.exists) {
            setSystemSettings(doc.data() as SystemSettings);
        }
    });

    const unsubscribeAuth = FB.observeAuth(async (firebaseUser) => {
        if (firebaseUser) {
            try {
                const [dbUser, settingsDoc] = await Promise.all([
                    FB.getUserById(firebaseUser.uid),
                    FB.db.collection('settings').doc('general').get()
                ]);
                
                if (dbUser) {
                    if (dbUser.isActive === false) {
                        await FB.logoutUser();
                        addToast("حسابك غير منشط، يرجى مراجعة رئيس قسم المنفذ أو مدير النظام", "error", 30000);
                        return;
                    }

                    const settings = settingsDoc.data() as SystemSettings;
                    const expiryDays = settings?.passwordExpiryDays || 90;
                    const lastChange = dbUser.lastPasswordChange;
                    const isExpired = !lastChange || (Date.now() - new Date(lastChange).getTime() > expiryDays * 24 * 60 * 60 * 1000);

                    const mergedUser = { ...firebaseUser, ...dbUser, id: firebaseUser.uid };
                    setCurrentUser(mergedUser);
                    setAuthStep(prev => {
                        if (prev === 'APP') return prev;
                        if (dbUser.role === 'ADMIN') {
                            const storedSector = localStorage.getItem('mirqab_active_sector');
                            return storedSector ? 'APP' : 'ROLE_SELECTION';
                        } else {
                            if (dbUser.allowedSectors && dbUser.allowedSectors.length > 0) {
                                const stored = localStorage.getItem('mirqab_active_sector') as ConsignmentType;
                                if (stored && dbUser.allowedSectors.includes(stored)) {
                                    setActiveSector(stored);
                                } else {
                                    handleSectorChange(dbUser.allowedSectors[0]);
                                }
                            }
                            return 'APP';
                        }
                    });
                } else {
                    if (await FB.checkSystemHasUsers()) {
                         await FB.logoutUser();
                         addToast("حساب غير مسجل في النظام. يرجى مراجعة الإدارة.", "error");
                    } else {
                        setCurrentUser(null);
                        setAuthStep('SETUP_ADMIN');
                    }
                }
            } catch (error) {
                console.error("Auth observation error:", error);
                addToast("حدث خطأ أثناء التحقق من الحساب", "error");
            }
        } else {
            setCurrentUser(null);
            const hasUsers = await FB.checkSystemHasUsers();
            setAuthStep(hasUsers ? 'WELCOME' : 'SETUP_ADMIN');
        }
    });

    const unsubResetRequests = FB.subscribeToPasswordRequests((data) => setPendingResetRequests(data));
    const unsubClearance = FB.subscribeToCollection('clearanceOffices', (data) => setClearanceOffices(data as ClearanceOffice[]));
    const unsubPorts = FB.subscribeToCollection('ports', (data) => setPorts(data as Port[]));
    const unsubPesticides = FB.subscribeToCollection('pesticides', (data) => setPesticides(data as PesticideMapping[]));
    const unsubLabs = FB.subscribeToCollection('laboratories', (data) => setLaboratories(data as Laboratory[]));
    const unsubUsers = FB.subscribeToCollection('users', (data) => setUsers(data as User[]));
    const unsubConsignments = FB.subscribeToCollection('consignments', (data) => setConsignments(data as Consignment[]));
    const unsubImporters = FB.subscribeToCollection('importers', (data) => setImporters(data as Importer[]));
    const unsubCommodities = FB.subscribeToCollection('commodityGroups', (data) => setCommodityGroups(data as CommodityGroup[]));
    const unsubSamplingPlans = FB.subscribeToCollection('samplingPlans', (data) => setSamplingPlans(data as SamplingPlan[]));
    
    FB.seedDatabase(DEFAULT_CONSIGNMENTS, DEFAULT_USERS, DEFAULT_IMPORTERS, DEFAULT_COMMODITIES, DEFAULT_SETTINGS);
    
    return () => { 
        unsubscribeAuth(); 
        unsubscribeSettings();
        unsubResetRequests(); 
        unsubClearance(); 
        unsubPorts(); 
        unsubPesticides();
        unsubLabs();
        unsubUsers();
        unsubConsignments();
        unsubImporters();
        unsubCommodities();
        unsubSamplingPlans();
    };
  }, []); 

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setShowLoginSplash(true);
    setTimeout(() => {
        setShowLoginSplash(false);
        if (user.role === 'ADMIN') {
            setAuthStep('ROLE_SELECTION');
        } else {
            if(user.allowedSectors && user.allowedSectors.length > 1) {
                setAuthStep('SECTOR_SELECTION');
            } else {
                if (user.allowedSectors && user.allowedSectors.length > 0) {
                     setActiveSector(user.allowedSectors[0]);
                }
                setAuthStep('APP');
            }
        }
    }, 3000);
  };

  const handleLogout = async () => { 
    if (currentUser) await FB.terminateSession(currentUser.id).catch(console.error);
    await FB.logoutUser(); 
    localStorage.removeItem('mirqab_active_sector'); 
    setAuthStep('WELCOME'); 
  };
  
  const handleSwitchUser = () => {
      const realRole = currentUser?.originalRole || currentUser?.role;
      if (realRole === 'ADMIN') { 
          if (currentUser) setCurrentUser({ ...currentUser, role: 'ADMIN' as UserRole }); 
          setAuthStep('ROLE_SELECTION'); 
      } else {
          handleLogout();
      }
  };

  const handleSwitchSector = () => {
      setAuthStep('SECTOR_SELECTION');
  };

  const handleResetData = async () => { if(window.confirm("تحذير: سيتم مسح البيانات الحالية. هل أنت متأكد؟")) { localStorage.clear(); await FB.seedDatabase(DEFAULT_CONSIGNMENTS, DEFAULT_USERS, DEFAULT_IMPORTERS, DEFAULT_COMMODITIES, DEFAULT_SETTINGS); addToast("تمت إعادة التعيين بنجاح", "success"); setTimeout(() => window.location.reload(), 1000); } }
  
  const handleRoleSelection = (selectedRole: UserRole) => { 
      if(currentUser) {
          const updatedUser = { ...currentUser, role: selectedRole, originalRole: currentUser.originalRole || currentUser.role };
          setCurrentUser(updatedUser);
          
          if (updatedUser.allowedSectors && updatedUser.allowedSectors.length > 1) {
              setAuthStep('SECTOR_SELECTION');
          } else {
              if (updatedUser.allowedSectors && updatedUser.allowedSectors.length > 0) {
                  setActiveSector(updatedUser.allowedSectors[0]);
              }
              setAuthStep('APP');
          }
      } 
  };

  const handleSectorSelection = (sector: ConsignmentType) => {
      setActiveSector(sector);
      localStorage.setItem('mirqab_active_sector', sector);
      setAuthStep('APP');
  };

  useEffect(() => {
      const newNotifs: AppNotification[] = [];
      const today = new Date();
      const highRisk = consignments.filter(c => c.riskScore >= systemSettings.riskThreshold && c.status === 'Pending');
      highRisk.forEach(c => { newNotifs.push({ id: `risk-${c.id}`, title: 'تنبيه مخاطر مرتفعة', message: `الإرسالية رقم ${c.bayanNumber} تجاوزت حد المخاطر المسموح (${c.riskScore}%)`, type: 'error', timestamp: new Date(c.createdAt).toLocaleTimeString('ar-OM', {hour: '2-digit', minute:'2-digit'}), isRead: false }); });
      if (currentUser?.role === 'ADMIN' && pendingResetRequests.length > 0) { newNotifs.push({ id: 'reset-requests', title: 'طلبات استعادة كلمة المرور معلقة', message: `يوجد ${pendingResetRequests.length} طلبات استعادة كلمة مرور معلقة.`, type: 'warning', timestamp: new Date().toLocaleTimeString('ar-OM', {hour: '2-digit', minute:'2-digit'}), isRead: false, link: '/users' }); }
      consignments.forEach(c => {
          if (c.hasUndertaking && !c.isUndertakingMet && c.undertakingCompletionDate) {
              const dueDate = new Date(c.undertakingCompletionDate);
              const diffTime = dueDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays < 0) newNotifs.push({ id: `overdue-${c.id}`, title: 'تعهد متأخر', message: `انتهت مهلة التعهد للإرسالية ${c.bayanNumber} منذ ${Math.abs(diffDays)} يوم.`, type: 'error', timestamp: 'الآن', isRead: false, link: '/undertakings' });
              else if (diffDays <= 2) newNotifs.push({ id: `due-soon-${c.id}`, title: 'استحقاق تعهد', message: `ينتهي تعهد الإرسالية ${c.bayanNumber} خلال ${diffDays} يوم.`, type: 'warning', timestamp: 'الآن', isRead: false, link: '/undertakings' });
          }
      });
      consignments.forEach(c => {
          if (c.hasSample && c.inspectionResult === 'قيد الفحص' && c.sampleDate) {
              const diffDays = Math.floor((today.getTime() - new Date(c.sampleDate).getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays >= 3 && (currentUser?.role === 'INSPECTOR' || currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER')) {
                  const sampleId = c.samples?.[0]?.sampleId || '';
                  newNotifs.push({ id: `lab-delay-${c.id}`, title: 'تأخر نتائج', message: `العينة ${sampleId} في المختبر منذ ${diffDays} يوم.`, type: 'info', timestamp: 'الآن', isRead: false, link: '/sampling' });
              }
          }
          if (c.samples) {
              c.samples.forEach(s => {
                  if (s.status === 'COMPLETED' && s.completedDate) {
                      const compDate = new Date(s.completedDate);
                      const diffDays = Math.floor((today.getTime() - compDate.getTime()) / (1000 * 60 * 60 * 24));
                      if (diffDays <= 7 && (currentUser?.role === 'INSPECTOR' || currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER')) {
                          newNotifs.push({ 
                              id: `lab-result-${s.sampleId}`, 
                              title: 'نتيجة تحليل مخبري جديدة', 
                              message: `تم إرفاق نتيجة التحليل للعينة ${s.sampleId} (${s.result === 'Compliant' ? 'مطابق' : 'غير مطابق'}) للإرسالية ${c.bayanNumber}`, 
                              type: s.result === 'Compliant' ? 'success' : 'error', 
                              timestamp: compDate.toLocaleTimeString('ar-OM', {hour: '2-digit', minute:'2-digit'}), 
                              isRead: false, 
                              link: `/portal?id=${c.id}` 
                          });
                      }
                  }
              });
          }
      });
      
      setNotifications(newNotifs.map(n => ({ ...n, isRead: readNotificationIds.has(n.id) })));

      // Trigger browser push notifications for newly appeared critical alerts
      if ("Notification" in window && Notification.permission === "granted" && settingsRef.current?.enableSoundAlerts !== false) {
          const newlyGenerated = newNotifs.filter(n => !notifTriggerIds.includes(n.id) && (n.type === 'error' || n.type === 'warning'));
          if (newlyGenerated.length > 0) {
              newlyGenerated.forEach(n => {
                  new Notification(n.title, { body: n.message, icon: '/favicon.ico' });
              });
              setNotifTriggerIds([...notifTriggerIds, ...newlyGenerated.map(n => n.id)]);
          }
      }
  }, [systemSettings.riskThreshold, consignments, currentUser, authStep, pendingResetRequests, readNotificationIds, notifTriggerIds]);

  const markAllRead = () => { const allIds = notifications.map(n => n.id); setReadNotificationIds(prev => { const next = new Set(prev); allIds.forEach(id => next.add(id)); return next; }); addToast("تم تحديث الحالة", "success"); };
  const markSingleAsRead = (id: string) => { setReadNotificationIds(prev => new Set(prev).add(id)); };
  
  const userAllowedPortNames = useMemo(() => {
      if (!currentUser || !ports.length) return [];
      if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') return ports.map(p => p.name);
      const assignedIds = currentUser.assignedPorts || [];
      const targetPorts = assignedIds.length > 0 
        ? ports.filter(p => p.isActive && assignedIds.includes(p.id))
        : ports.filter(p => p.isActive);
      return targetPorts.map(p => p.name);
  }, [currentUser, ports]);

  const userAllowedPorts = useMemo(() => {
      if (!currentUser || !ports.length) return [];
      if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') return ports.filter(p => p.isActive);
      const names = userAllowedPortNames;
      return ports.filter(p => p.isActive && names.includes(p.name));
  }, [currentUser, ports, userAllowedPortNames]);

  const activeSectorConsignments = useMemo(() => {
    if (!currentUser) return [];
    return consignments.filter(c => 
      c.type === activeSector && 
      (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || userAllowedPortNames.includes(c.port))
    );
  }, [consignments, activeSector, currentUser, userAllowedPortNames]);

  const userConsignments = useMemo(() => {
    if (!currentUser) return [];
    return consignments.filter(c => 
      currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' || 
      userAllowedPortNames.includes(c.port) ||
      (c.transferTo && userAllowedPortNames.includes(c.transferTo))
    );
  }, [consignments, currentUser, userAllowedPortNames]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const isSystemAdmin = currentUser?.role === 'ADMIN';

  const hasPermission = useCallback((path: string) => {
    if (!currentUser) return false;

    // Strict safeguard: only ADMIN can access /users and /settings always
    const strictlyAdminOnlyPaths = ['/users', '/settings'];
    if (strictlyAdminOnlyPaths.includes(path) && currentUser.role !== 'ADMIN') {
        return false;
    }

    if (currentUser.role === 'ADMIN') return true;
    
    // Use role-based permissions from systemSettings if available
    if (systemSettings?.rolePermissions && systemSettings.rolePermissions[currentUser.role]) {
        return systemSettings.rolePermissions[currentUser.role]?.includes(path) || false;
    }

    // Restricted paths for non-admins as a final safeguard
    const adminOnlyPaths = ['/users', '/settings', '/risks', '/labs'];
    if (adminOnlyPaths.includes(path)) return false;

    // Specific role restrictions
    const rolePermissions: Record<string, string[]> = {
        'INSPECTOR': ['/', '/portal', '/sampling', '/logistics', '/undertakings', '/notes', '/inspector-tools', '/chat', '/importers', '/commodities', '/guide', '/profile'],
        'MANAGER': ['/', '/analytics', '/portal', '/sampling', '/logistics', '/undertakings', '/notes', '/chat', '/importers', '/commodities', '/reports', '/certificates', '/vault', '/guide', '/profile'],
        'LAB_TECH': ['/', '/sampling', '/chat', '/guide', '/profile', '/labs'],
        'LAB_DELEGATE': ['/delegate-portal', '/chat', '/guide', '/profile'],
        'LOGISTICS': ['/', '/portal', '/logistics', '/chat', '/guide', '/profile'],
        'VIEWER': ['/', '/portal', '/reports', '/guide', '/profile']
    };

    if (rolePermissions[currentUser.role]?.includes(path)) return true;
    
    return false;
  }, [currentUser, isSystemAdmin, systemSettings?.rolePermissions]);

  const RequireAuth = ({ children, path }: { children: React.ReactNode, path: string }) => {
    if (!hasPermission(path)) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  const getHelpSection = (path: string) => {
    if (path === '/') return 'dashboard';
    if (path === '/portal') return 'portal';
    if (path === '/sampling') return 'sampling';
    return 'general';
  };

  const allTransferDestinations = useMemo(() => {
    return [...transferDestinations, ...ports.map(p => p.name)];
  }, [transferDestinations, ports]);

  // Handlers
  const handleAddConsignment = async (c: Consignment) => {
    try {
      await FB.addConsignmentToDB(c);
      addToast("تمت إضافة الإرسالية بنجاح", "success");
      refreshAllData();
    } catch (e) { addToast("فشل في إضافة الإرسالية", "error"); }
  };

  const handleUpdateConsignment = async (c: Consignment) => {
    try {
      await FB.updateConsignmentInDB(c);
      addToast("تم تحديث الإرسالية بنجاح", "success");
      refreshAllData();
    } catch (e) { addToast("فشل في تحديث الإرسالية", "error"); }
  };

  const handleDeleteConsignment = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الإرسالية؟")) {
      try {
        await FB.deleteConsignmentFromDB(id);
        addToast("تم حذف الإرسالية", "success");
        refreshAllData();
      } catch (e) { addToast("فشل في حذف الإرسالية", "error"); }
    }
  };

  const handleAddImporter = async (i: Importer) => {
    try {
      await FB.addImporterToDB(i);
      addToast("تمت إضافة المستورد بنجاح", "success");
      refreshAllData();
    } catch (e) { addToast("فشل في إضافة المستورد", "error"); }
  };

  const handleUpdateImporter = async (i: Importer) => {
    try {
      await FB.updateImporterInDB(i);
      addToast("تم تحديث بيانات المستورد", "success");
      refreshAllData();
    } catch (e) { addToast("فشل في تحديث بيانات المستورد", "error"); }
  };

  const handleDeleteImporter = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستورد؟")) {
      try {
        await FB.deleteImporterFromDB(id);
        addToast("تم حذف المستورد", "success");
        refreshAllData();
      } catch (e) { addToast("فشل في حذف المستورد", "error"); }
    }
  };

  const handleAddCommodityGroup = async (g: CommodityGroup) => {
    try {
      await FB.addCommodityToDB(g);
      addToast("تمت إضافة مجموعة السلع بنجاح", "success");
      refreshAllData();
    } catch (e) { addToast("فشل في إضافة مجموعة السلع", "error"); }
  };

  const handleUpdateCommodityGroup = async (g: CommodityGroup) => {
    try {
      await FB.updateCommodityInDB(g);
      addToast("تم تحديث مجموعة السلع", "success");
      refreshAllData();
    } catch (e) { addToast("فشل في تحديث مجموعة السلع", "error"); }
  };

  const handleDeleteCommodityGroup = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه المجموعة؟")) {
      try {
        await FB.deleteCommodityFromDB(id);
        addToast("تم حذف المجموعة", "success");
        refreshAllData();
      } catch (e) { addToast("فشل في حذف المجموعة", "error"); }
    }
  };

  const handleAddUser = async (u: User) => {
    try {
      await FB.registerSystemUser(u);
      addToast("تمت إضافة المستخدم بنجاح", "success");
      refreshAllData();
    } catch (e: any) { addToast(e.message || "فشل في إضافة المستخدم", "error"); }
  };

  const handleUpdateUser = async (u: User) => {
    try {
      await FB.updateUserInDB(u);
      addToast("تم تحديث بيانات المستخدم", "success");
      refreshAllData();
    } catch (e) { addToast("فشل في تحديث بيانات المستخدم", "error"); }
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      try {
        await FB.deleteUserFromDB(id);
        addToast("تم حذف المستخدم", "success");
        refreshAllData();
      } catch (e) { addToast("فشل في حذف المستخدم", "error"); }
    }
  };

  const handleAddSamplingPlan = async (p: SamplingPlan) => {
    try {
      await FB.addSamplingPlanToDB(p);
      addToast("تمت إضافة خطة السحب بنجاح", "success");
      refreshAllData();
    } catch (e) { addToast("فشل في إضافة خطة السحب", "error"); }
  };

  const handleUpdateSamplingPlan = async (p: SamplingPlan) => {
    try {
      await FB.updateSamplingPlanInDB(p);
      addToast("تم تحديث خطة السحب", "success");
      refreshAllData();
    } catch (e) { addToast("فشل في تحديث خطة السحب", "error"); }
  };

  const handleDeleteSamplingPlan = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الخطة؟")) {
      try {
        await FB.deleteSamplingPlanFromDB(id);
        addToast("تم حذف الخطة", "success");
        refreshAllData();
      } catch (e) { addToast("فشل في حذف الخطة", "error"); }
    }
  };

  useEffect(() => {
    if (connectionStatus === 'CONNECTED' && splashFinished) {
      const hasShownWelcome = sessionStorage.getItem('mirqab_welcome_shown');
      if (!hasShownWelcome) {
        addToast("مرحباً بكم في منصة مِرقاب الذكية - منفذ ميناء صحار", "info", 5000);
        sessionStorage.setItem('mirqab_welcome_shown', 'true');
      }
    }
  }, [connectionStatus, splashFinished]);

  const { scrollYProgress } = useScroll();
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    return scrollYProgress.on('change', (latest) => {
      setShowBackToTop(latest > 0.1);
    });
  }, [scrollYProgress]);

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <AnimatePresence mode="wait">
      {(connectionStatus === 'CHECKING' || !splashFinished) && (
        <SplashScreen key="initial-splash" />
      )}
      
      {showLoginSplash && currentUser && (
        <LoginSplashScreen key="login-splash" user={currentUser} />
      )}

      {showPresentation && currentUser?.civilId === '7734383' && (
        <PresentationMode key="presentation" onClose={() => setShowPresentation(false)} />
      )}

      {connectionStatus === 'ERROR' && (
        <ConnectionStatus key="error-status" status="ERROR" onRetry={initializeSystem} />
      )}

      {!showLoginSplash && connectionStatus === 'CONNECTED' && splashFinished && (
        <motion.div 
          key="main-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen"
        >
          {(() => {
            const isPublicInfoRoute = location.pathname.startsWith('/info/');
            if (isPublicInfoRoute) {
              return (
                <Routes>
                  <Route path="/info/:sector" element={<PublicSectorInfo />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              );
            }

            if (authStep === 'SETUP_ADMIN') return <SetupAdminPage onComplete={() => setAuthStep('LOGIN')} />;
            if (authStep === 'WELCOME') return <React.Suspense fallback={<SplashScreen />}><WelcomePage onStart={() => setAuthStep('LOGIN')} consignments={consignments} ports={ports.filter(p => p.isActive)} installPrompt={deferredPrompt || (isIOS ? true : null)} onInstall={handleInstallClick} importers={importers} /></React.Suspense>;
            if (authStep === 'LOGIN') return <React.Suspense fallback={<SplashScreen />}><LoginPage users={users} onLogin={handleLogin} systemSettings={systemSettings} onBack={() => setAuthStep('WELCOME')} /></React.Suspense>;
            if (authStep === 'CHANGE_PASSWORD') return <React.Suspense fallback={<SplashScreen />}><ChangePasswordPage currentUser={currentUser!} onSuccess={() => setAuthStep('APP')} systemSettings={systemSettings} /></React.Suspense>;
            if (authStep === 'ROLE_SELECTION') return <React.Suspense fallback={<SplashScreen />}><RoleSelectionPage user={currentUser!} onSelect={handleRoleSelection} /></React.Suspense>;
            if (authStep === 'SECTOR_SELECTION') return <React.Suspense fallback={<SplashScreen />}><SectorSelectionPage currentUser={currentUser!} onSelectSector={handleSectorSelection} onLogout={handleLogout} /></React.Suspense>;

            if (systemSettings?.maintenanceMode && currentUser?.role !== 'ADMIN') {
              return (
                <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center" dir="rtl">
                  <div className="max-w-md space-y-8 animate-fade-in">
                    <div className="w-24 h-24 bg-amber-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-amber-500 border border-amber-500/20 shadow-2xl shadow-amber-500/10">
                      <i className="fas fa-tools text-4xl animate-pulse"></i>
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-3xl font-black text-white tracking-tight">النظام في وضع الصيانة</h2>
                      <p className="text-slate-400 font-bold leading-relaxed">
                        نحن نقوم حالياً بإجراء بعض التحسينات لضمان أفضل تجربة عمل. سنعود للعمل قريباً جداً.
                      </p>
                    </div>
                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">شكراً لتفهمكم</p>
                      <div className="flex justify-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="text-amber-500 text-xs font-black hover:underline"
                    >
                      تحديث الصفحة
                    </button>
                  </div>
                </div>
              );
            }

            if (currentUser?.role === 'LAB_DELEGATE') {
              // Lab Delegates get a simplified portal experience
              // But we only show this portal view if they are not in chat or profile
              const isOnSpecialPage = location.pathname === '/chat' || location.pathname === '/profile' || location.pathname === '/guide';
              
              if (!isOnSpecialPage) {
                return (
                  <div key="lab-delegate-layout" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center relative p-4" dir="rtl">
                      <ToastContainer toasts={toasts} removeToast={removeToast} />
                      <button 
                          onClick={handleLogout}
                          className="absolute top-6 left-6 p-4 rounded-2xl bg-white text-red-500 font-black shadow-lg border border-red-100 hover:bg-red-50 transition-all flex items-center gap-2 z-50"
                      >
                          <i className="fas fa-sign-out-alt"></i> تسجيل الخروج
                      </button>
                      <div className="w-full relative z-10 flex-col flex items-center justify-center">
                          <React.Suspense fallback={<SplashScreen />}>
                            <LabDelegatePortal consignments={consignments} currentUser={currentUser} onUpdateConsignment={handleUpdateConsignment} laboratories={laboratories} ports={ports} />
                          </React.Suspense>
                      </div>
                  </div>
                );
              }
            }

            return (
              <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
                <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'lg:mr-20' : 'lg:mr-72'}`}>
                  <NewsTicker settings={systemSettings} />
                </div>
                <div className="flex-1 flex">
                  <ToastContainer toasts={toasts} removeToast={removeToast} />
                  {showIOSInstruction && <IOSInstallModal isOpen={showIOSInstruction} onClose={() => setShowIOSInstruction(false)} />}
                  <Sidebar 
                      currentUser={currentUser!} 
                      onSwitchUser={handleSwitchUser} 
                      onLogout={handleLogout} 
                      onSwitchSector={handleSwitchSector} 
                      isSystemAdmin={isSystemAdmin} 
                      isOpen={mobileMenuOpen} 
                      onClose={() => setMobileMenuOpen(false)} 
                      installPrompt={deferredPrompt || (isIOS ? true : null)} 
                      onInstall={handleInstallClick} 
                      isCollapsed={isSidebarCollapsed}
                      onToggleCollapse={() => {
                          const newState = !isSidebarCollapsed;
                          setIsSidebarCollapsed(newState);
                          localStorage.setItem('mirqab_sidebar_collapsed', String(newState));
                      }}
                      hasPermission={hasPermission}
                      systemSettings={systemSettings}
                  />
                  
                  {/* Contextual User Guide Modal */}
                  {isHelpOpen && (
                    <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-fade-in">
                      <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-[3rem] shadow-2xl relative flex flex-col overflow-hidden animate-scale-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                              <i className="fas fa-book-open"></i>
                            </div>
                            <div>
                              <h3 className="font-black text-slate-800">دليل المساعدة السياقي</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Contextual Help System</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => setIsHelpOpen(false)}
                            className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-slate-100"
                          >
                            <i className="fas fa-times text-xl"></i>
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                          <UserGuide targetSection={getHelpSection(location.pathname)} />
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
                          <button 
                            onClick={() => setIsHelpOpen(false)}
                            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                          >
                            فهمت، العودة للنظام
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <main className={`flex-1 ${isSidebarCollapsed ? 'lg:mr-20' : 'lg:mr-72'} p-4 md:p-10 transition-all duration-300 overflow-x-hidden relative`}>
                    <motion.div
                      className="fixed top-0 left-0 right-0 h-1 bg-red-600 origin-left z-[1000]"
                      style={{ scaleX }}
                    />
                    
                    {/* Floating Back to Top Button */}
                    <AnimatePresence>
                      {showBackToTop && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0, y: 20 }}
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="fixed bottom-8 left-8 w-14 h-14 bg-red-600 text-white rounded-2xl shadow-2xl z-[500] flex items-center justify-center hover:bg-red-700 transition-colors group border-4 border-white"
                        >
                          <i className="fas fa-arrow-up text-xl group-hover:-translate-y-1 transition-transform"></i>
                        </motion.button>
                      )}
                    </AnimatePresence>
                    <header className="sticky top-4 z-40 mb-8 md:mb-12 glass rounded-[2rem] p-4 md:p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 transition-all duration-300">
                    <div className="flex items-center gap-4 md:gap-6 w-full sm:w-auto">
                      <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-700 shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"><i className="fas fa-bars text-xl"></i></button>
                      <div className={`w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] md:rounded-[2rem] bg-gradient-to-br ${
                        (currentUser?.role === 'LAB_TECH') ? 'from-purple-500 to-indigo-700' : SECTOR_THEMES[activeSector]
                      } text-white shadow-lg shadow-black/5 flex items-center justify-center transform hover:rotate-6 transition-transform shrink-0 border-4 border-white/20`}><i className={`fas ${
                        (currentUser?.role === 'LAB_TECH') ? 'fa-flask' : (activeSector === ConsignmentType.VETERINARY ? 'fa-paw' : activeSector === ConsignmentType.AGRICULTURAL ? 'fa-seedling' : 'fa-utensils')
                      } text-xl md:text-2xl`}></i></div>
                      <div><div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3"><h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">{
                        (currentUser?.role === 'LAB_TECH') && currentUser?.assignedLabId ? (
                          laboratories.find(l => l.id === currentUser.assignedLabId)?.name || 'مختبر غير محدد'
                        ) : (
                          `قطاع ${
                            activeSector === ConsignmentType.VETERINARY ? (systemSettings?.customLabels?.sectorVeterinary || CONSIGNMENT_LABELS[activeSector]) :
                            activeSector === ConsignmentType.AGRICULTURAL ? (systemSettings?.customLabels?.sectorAgricultural || CONSIGNMENT_LABELS[activeSector]) :
                            (systemSettings?.customLabels?.sectorFoodSafety || CONSIGNMENT_LABELS[activeSector])
                          }`
                        )
                      }</h2><span className="w-fit px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] md:text-[10px] font-black uppercase tracking-tighter border border-slate-200">المنصة الموحدة للمنافذ</span></div><p className="text-slate-500 text-xs md:text-sm font-medium mt-1 italic">{systemSettings?.customLabels?.welcomeMessage?.replace('{name}', (currentUser?.name || 'مستخدم').split(' ')[0]) || `أهلاً بك ${(currentUser?.name || 'مستخدم').split(' ')[0]}`}</p></div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
                      <div className="hidden md:block"><ConnectionStatus status={connectionStatus} onRetry={initializeSystem} mode="inline" /></div>
                      <button 
                          onClick={() => setDarkMode(!darkMode)} 
                          className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:shadow-lg transition-all active:scale-95 hover:text-amber-500 group"
                          title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
                      >
                          <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'} transition-transform duration-500 group-hover:rotate-12`}></i>
                      </button>
                      <button onClick={refreshAllData} className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:shadow-lg transition-all active:scale-95 hover:text-blue-600 group" title="تحديث البيانات">
                          <i className="fas fa-sync-alt group-hover:rotate-180 transition-transform duration-500"></i>
                      </button>
                      <div className="w-px h-10 bg-slate-200 hidden md:block mx-2"></div>
                      <div className="flex gap-2 relative">
                         <button 
                           onClick={() => setIsHelpOpen(true)}
                           className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-indigo-500 flex items-center justify-center hover:shadow-lg transition-all active:scale-95 hover:bg-indigo-50 group"
                           title="دليل المساعدة السريع"
                         >
                           <i className="fas fa-question-circle text-lg group-hover:scale-110 transition-transform"></i>
                         </button>
                         <div className="relative">
                            <button onClick={() => setShowNotifications(!showNotifications)} className={`w-10 h-10 rounded-2xl border flex items-center justify-center transition-all active:scale-95 ${showNotifications ? 'bg-slate-800 text-white border-slate-800 shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:shadow-lg hover:text-slate-600'}`}><i className="fas fa-bell"></i></button>
                            {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full flex items-center justify-center text-[8px] font-bold text-white animate-pulse shadow-md">{unreadCount}</span>}
                            {showNotifications && <NotificationPanel notifications={notifications} onMarkAsRead={markAllRead} onMarkSingleAsRead={markSingleAsRead} onClose={() => setShowNotifications(false)} />}
                         </div>
                         <Link to="/profile"><button className="w-10 h-10 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:shadow-lg transition-all active:scale-95 overflow-hidden ring-2 ring-transparent hover:ring-slate-200">
                             {currentUser?.avatar ? (
                                 <img referrerPolicy="no-referrer" src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                             ) : (
                                 <i className="fas fa-user"></i>
                             )}
                         </button></Link>
                      </div>
                    </div>
                  </header>

                  <SessionTracker user={currentUser} systemSettings={systemSettings} />

                  <React.Suspense fallback={<SplashScreen />}>
                  <Routes>
                    <Route path="/" element={currentUser?.role === 'LAB_DELEGATE' ? <Navigate to="/delegate-portal" replace /> : <RequireAuth path="/"><Dashboard consignments={userConsignments} activeSector={activeSector} onSectorChange={handleSectorChange} currentUser={currentUser!} isSystemAdmin={isSystemAdmin} users={users} ports={userAllowedPorts} commodityGroups={commodityGroups} laboratories={laboratories} installPrompt={deferredPrompt || (isIOS ? true : null)} onInstall={handleInstallClick} onShowPresentation={() => setShowPresentation(true)} /></RequireAuth>} />
                    <Route path="/analytics" element={<RequireAuth path="/analytics"><AnalyticsDashboard consignments={userConsignments} activeSector={activeSector} commodityGroups={commodityGroups} /></RequireAuth>} />
                    <Route path="/portal" element={<RequireAuth path="/portal"><ConsignmentPortal activeSector={activeSector} consignments={activeSectorConsignments} onAdd={handleAddConsignment} onDelete={handleDeleteConsignment} onUpdate={handleUpdateConsignment} importers={importers} commodityGroups={commodityGroups} inspectionTypes={inspectionTypes} declarationTypes={declarationTypes} undertakingTypes={undertakingTypes} containerTypes={containerTypes} transferDestinations={allTransferDestinations} intendedUses={intendedUses} labAnalysisTypes={labAnalysisTypes[activeSector] || []} rejectionReasons={rejectionReasons[activeSector] || []} currentUser={currentUser!} users={users} samplingPlans={samplingPlans} ports={userAllowedPorts} clearanceOffices={clearanceOffices} pesticides={pesticides} systemSettings={systemSettings} /></RequireAuth>} />
                    <Route path="/logistics" element={<RequireAuth path="/logistics"><LogisticsPortal consignments={userConsignments} onUpdate={handleUpdateConsignment} currentUser={currentUser!} activeSector={activeSector} ports={ports} /></RequireAuth>} />
                    <Route path="/delegate-portal" element={<RequireAuth path="/delegate-portal"><LabDelegatePortal consignments={consignments} currentUser={currentUser!} onUpdateConsignment={handleUpdateConsignment} laboratories={laboratories} ports={ports} /></RequireAuth>} />
                    <Route path="/sampling" element={<RequireAuth path="/sampling"><SamplingManager consignments={activeSectorConsignments} onUpdateConsignment={handleUpdateConsignment} labAnalysisTypes={labAnalysisTypes} rejectionReasons={rejectionReasons} currentUser={currentUser!} laboratories={laboratories} clearanceOffices={clearanceOffices} /></RequireAuth>} />
                    <Route path="/labs" element={<RequireAuth path="/labs"><LaboratoryManager labAnalysisTypes={labAnalysisTypes} currentUser={currentUser!} /></RequireAuth>} />
                    <Route path="/undertakings" element={<RequireAuth path="/undertakings"><Undertakings consignments={userConsignments} onUpdateConsignment={handleUpdateConsignment} currentUser={currentUser!} /></RequireAuth>} />
                    <Route path="/vault" element={<RequireAuth path="/vault"><DocumentVault consignments={userConsignments} /></RequireAuth>} />
                    <Route path="/importers" element={<RequireAuth path="/importers"><ImporterManager importers={importers} consignments={userConsignments} onAdd={handleAddImporter} onUpdate={handleUpdateImporter} onDelete={handleDeleteImporter} currentUser={currentUser!} /></RequireAuth>} />
                    <Route path="/clearance" element={<RequireAuth path="/clearance"><ClearanceManager offices={clearanceOffices} currentUser={currentUser!} /></RequireAuth>} />
                    <Route path="/commodities" element={<RequireAuth path="/commodities"><CommodityManager groups={commodityGroups} onAdd={handleAddCommodityGroup} onUpdate={handleUpdateCommodityGroup} onDelete={handleDeleteCommodityGroup} activeSector={activeSector} currentUser={currentUser!} /></RequireAuth>} />
                    <Route path="/users" element={<RequireAuth path="/users"><UserManager users={users} ports={ports} laboratories={laboratories} onAdd={handleAddUser} onUpdate={handleUpdateUser} onDelete={handleDeleteUser} currentUser={currentUser!} systemSettings={systemSettings} /></RequireAuth>} />
                    <Route path="/settings" element={<RequireAuth path="/settings"><SettingsManager inspectionTypes={inspectionTypes} setInspectionTypes={setInspectionTypes} declarationTypes={declarationTypes} setDeclarationTypes={setDeclarationTypes} undertakingTypes={undertakingTypes} setUndertakingTypes={setUndertakingTypes} containerTypes={containerTypes} setContainerTypes={setContainerTypes} transferDestinations={transferDestinations} setTransferDestinations={setTransferDestinations} labAnalysisTypes={labAnalysisTypes} setLabAnalysisTypes={setLabAnalysisTypes} rejectionReasons={rejectionReasons} setRejectionReasons={setRejectionReasons} systemSettings={systemSettings} setSystemSettings={setSystemSettings} onResetData={handleResetData} currentUser={currentUser!} pesticides={pesticides} eNumbers={eNumbers} setENumbers={setENumbers} epidemicAlerts={epidemicAlerts} setEpidemicAlerts={setEpidemicAlerts} hsCodes={hsCodes} setHSCodes={setHSCodes} checklists={checklists} setChecklists={setChecklists} intendedUses={intendedUses} setIntendedUses={setIntendedUses} /></RequireAuth>} />
                    <Route path="/risks" element={<RequireAuth path="/risks"><RiskProfileManager currentUser={currentUser!} activeSector={activeSector} labAnalysisTypes={labAnalysisTypes[activeSector]} commodityGroups={commodityGroups} plans={samplingPlans} onAdd={handleAddSamplingPlan} onUpdate={handleUpdateSamplingPlan} onDelete={handleDeleteSamplingPlan} /></RequireAuth>} />
                    <Route path="/notes" element={<RequireAuth path="/notes"><NotesManager consignments={activeSectorConsignments} currentUser={currentUser!} activeSector={activeSector} users={users} ports={userAllowedPorts} /></RequireAuth>} />
                    <Route path="/reports" element={<RequireAuth path="/reports"><ReportsManager consignments={userConsignments} activeSector={activeSector} currentUser={currentUser!} ports={userAllowedPorts} laboratories={laboratories} /></RequireAuth>} />
                    <Route path="/profile" element={<RequireAuth path="/profile"><UserProfile currentUser={currentUser!} consignments={userConsignments} systemSettings={systemSettings} /></RequireAuth>} />
                    <Route path="/certificates" element={<RequireAuth path="/certificates"><Certificates currentUser={currentUser!} activeSector={activeSector} /></RequireAuth>} />
                    <Route path="/guide" element={<RequireAuth path="/guide"><UserGuide /></RequireAuth>} />
                    <Route path="/chat" element={<RequireAuth path="/chat"><ChatSystem currentUser={currentUser!} activeSector={activeSector} ports={userAllowedPorts} users={users} systemSettings={systemSettings} /></RequireAuth>} />
                    <Route path="/tools" element={<RequireAuth path="/tools"><UsefulTools currentUser={currentUser!} /></RequireAuth>} />
                    <Route path="/inspector-tools" element={<RequireAuth path="/inspector-tools"><InspectorTools eNumbers={eNumbers} epidemicAlerts={epidemicAlerts} hsCodes={hsCodes} checklists={checklists} /></RequireAuth>} />
                    <Route path="/info/:sector" element={<RequireAuth path="/info"><PublicSectorInfo /></RequireAuth>} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                  </React.Suspense>
                </main>
              </div>
            </div>
          );
        })()}
      </motion.div>
    )}
  </AnimatePresence>
);
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      let errorMessage = "حدث خطأ غير متوقع في التطبيق.";
      try {
        const parsedError = JSON.parse(this.state.error.message);
        if (parsedError.error && parsedError.error.includes('Quota exceeded')) {
          errorMessage = "تم تجاوز حصة الاستخدام المجانية لليوم. يرجى المحاولة غداً.";
        } else if (parsedError.error && parsedError.error.includes('offline')) {
          errorMessage = "يبدو أنك غير متصل بالإنترنت أو هناك مشكلة في الاتصال بقاعدة البيانات.";
        }
      } catch (e) {
        // Not a JSON error
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center font-tajawal">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6 text-3xl">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">عذراً، حدث خطأ ما</h2>
          <p className="text-slate-500 font-bold mb-8 max-w-md">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-slate-800 text-white px-8 py-3 rounded-xl font-black hover:bg-slate-900 transition-all"
          >
            إعادة تحميل التطبيق
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const App = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <AppContent />
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
