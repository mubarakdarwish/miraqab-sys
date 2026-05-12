
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, LayoutDashboard, BrainCircuit, 
  ShieldCheck, FlaskConical, Calculator, Users, Cpu, 
  TrendingUp, Play, X, Zap, ArrowRight, ShieldAlert,
  Search, FileText, Plus, Download, Target, Grid, Network
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Logo from './Logo';

interface Slide {
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  preview?: React.ReactNode;
  features?: string[];
  points?: string[];
}

// --- Mock UI Previews for Slides ---

const IntroPreview = () => (
    <div className="w-full h-full bg-slate-800 flex items-center justify-center p-8 rounded-[1.5rem] relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#c8102e44_0%,_transparent_70%)]"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-red-600/20 via-transparent to-emerald-500/20"></div>
        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center"
            >
              <Logo size={120} variant="light" className="mb-4 drop-shadow-[0_0_40px_rgba(200,16,46,0.6)]" />
              <h2 className="text-white text-3xl font-black mt-2 tracking-tighter">مِرقاب</h2>
            </motion.div>
            
            <img referrerPolicy="no-referrer" 
                src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                alt="Ministry Logo" 
                className="h-20 object-contain brightness-0 invert drop-shadow-2xl opacity-80" 
            />

            <div className="space-y-4">
                <div className="px-8 py-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <p className="text-white text-[10px] font-black mb-1 opacity-40 uppercase tracking-[0.25em] relative z-10">Department of</p>
                    <p className="text-white text-xl font-black relative z-10 leading-tight">قسم الحجر وسلامة الغذاء</p>
                    <p className="text-red-500 text-lg font-black mt-1 relative z-10">بميناء صحار</p>
                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">Sohar Port Operational Hub</p>
                    </div>
                </div>
                <div className="h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent w-64 mx-auto opacity-30"></div>
                <p className="text-white/40 text-[9px] font-bold tracking-[0.3em] uppercase">Smart Border Intelligence Ecosystem</p>
            </div>
        </div>
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]"></div>
    </div>
);

const DashboardPreview = () => (
  <div className="w-full h-full bg-slate-50 p-6 flex flex-col gap-6 overflow-hidden rounded-[1.5rem]" dir="rtl">
    <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
            <Logo size={28} />
            <div className="h-5 w-32 bg-slate-200 rounded-full"></div>
        </div>
        <div className="flex gap-2">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-100 flex items-center justify-center text-red-600">
                <LayoutDashboard size={20} />
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-200"></div>
        </div>
    </div>
    
    <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 flex flex-col gap-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${i === 1 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {i === 1 ? <TrendingUp size={20} /> : <ShieldCheck size={20} />}
                </div>
                <div className="h-5 w-16 bg-slate-100 rounded"></div>
                <div className="h-4 w-10 bg-slate-50 rounded"></div>
            </div>
        ))}
    </div>

    <div className="flex-1 bg-white rounded-2xl border border-slate-100 p-6 shadow-xl shadow-slate-200/40 flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <div className="h-5 w-40 bg-slate-100 rounded-full"></div>
            <div className="h-6 w-20 bg-red-50 text-red-600 text-[10px] font-black rounded-full flex items-center justify-center">LIVE</div>
        </div>
        <div className="flex-1 flex items-end gap-3 px-2">
            {[40, 70, 45, 90, 65, 80, 50, 75, 30, 60].map((h, i) => (
                <div key={i} className="flex-1 bg-red-50 rounded-t-xl overflow-hidden">
                    <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="w-full bg-gradient-to-t from-red-600 to-red-500"
                    />
                </div>
            ))}
        </div>
    </div>
  </div>
);

const TransactionLogPreview = () => (
    <div className="w-full h-full bg-white p-6 flex flex-col gap-6 overflow-hidden rounded-[1.5rem]" dir="rtl">
      <div className="flex gap-3">
          <div className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-2xl px-4 flex items-center gap-3">
              <Search size={18} className="text-slate-400" />
              <div className="h-4 w-48 bg-slate-200 rounded-full"></div>
          </div>
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-red-200">
              <Plus size={24} />
          </div>
      </div>
      
      <div className="flex-1 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 p-4 border-b border-slate-200 grid grid-cols-4 gap-4">
              <div className="h-4 w-20 bg-slate-300 rounded"></div>
              <div className="h-4 w-32 bg-slate-300 rounded"></div>
              <div className="h-4 w-16 bg-slate-300 rounded"></div>
              <div className="h-4 w-24 bg-slate-300 rounded"></div>
          </div>
          <div className="divide-y divide-slate-100">
              {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="p-4 grid grid-cols-4 gap-4 items-center hover:bg-red-50/30 transition-colors">
                      <div className="h-6 w-16 bg-red-100/50 rounded-lg text-[10px] flex items-center justify-center font-black text-red-900 border border-red-200/50">MRQ-{1000 + i}</div>
                      <div className="h-4 w-40 bg-slate-100 rounded"></div>
                      <div className={`h-6 w-20 rounded-full flex items-center justify-center text-[10px] font-black ${i % 3 === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {i % 3 === 0 ? 'مكتمل' : 'تحت الفحص'}
                      </div>
                      <div className="h-4 w-12 bg-slate-50 rounded"></div>
                  </div>
              ))}
          </div>
      </div>
    </div>
);

const DataEntryPreview = () => (
    <div className="w-full h-full bg-slate-50 p-8 flex flex-col gap-8 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="flex justify-between items-center border-b border-slate-200 pb-6">
            <div className="flex items-center gap-4">
                <Logo size={40} />
                <div className="space-y-2">
                    <div className="h-5 w-32 bg-slate-800 rounded"></div>
                    <div className="h-3 w-48 bg-slate-300 rounded"></div>
                </div>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-slate-100"></div>
        </div>

        <div className="grid grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-3">
                    <div className="h-4 w-24 bg-slate-400 opacity-60 rounded"></div>
                    <div className={`h-12 bg-white border ${i === 1 ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'} rounded-2xl`}></div>
                </div>
            ))}
        </div>

        <div className="space-y-3 flex-1">
            <div className="h-4 w-24 bg-slate-400 opacity-60 rounded"></div>
            <div className="h-full max-h-32 bg-white border-2 border-slate-200 border-dashed rounded-3xl flex flex-col items-center justify-center gap-3 group hover:border-red-500 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shadow-inner">
                    <FileText size={24} />
                </div>
                <div className="h-3 w-40 bg-slate-100 rounded"></div>
            </div>
        </div>

        <div className="mt-auto flex gap-4">
             <div className="flex-1 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-200 text-white font-black">
                حفظ وإرسال المعاملة
             </div>
             <div className="w-32 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-slate-400">
                إلغاء
             </div>
        </div>
    </div>
);

const RiskProfilePreview = () => (
    <div className="w-full h-full bg-slate-900 p-8 flex flex-col gap-6 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="flex justify-between items-center">
            <div className="h-5 w-48 bg-white/20 rounded-full"></div>
            <div className="w-10 h-10 bg-red-500/20 text-red-500 rounded-xl flex items-center justify-center">
                <ShieldAlert size={24} />
            </div>
        </div>
        <div className="flex-1 flex items-center justify-center relative">
            <div className="w-48 h-48 rounded-full border-[10px] border-white/5 flex items-center justify-center">
                <div className="w-36 h-36 rounded-full border-[12px] border-red-600 flex flex-col items-center justify-center gap-2 shadow-[0_0_40px_rgba(200,16,46,0.3)]">
                    <span className="text-4xl font-black text-white">85%</span>
                    <span className="text-[10px] font-black text-red-400 tracking-widest">HIGH RISK</span>
                </div>
            </div>
            {/* HUD Elements */}
            <div className="absolute top-0 right-10 w-24 h-12 bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-2 overflow-hidden">
                <motion.div animate={{ width: ['20%', '90%', '20%'] }} transition={{ duration: 3, repeat: Infinity }} className="h-2 bg-red-500 rounded-full mb-2" />
                <div className="h-1 bg-white/20 rounded-full w-full" />
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            {[1, 2].map(i => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
                    <div className="w-3 h-3 rounded-full bg-red-600 animate-ping"></div>
                    <div className="h-3 w-24 bg-white/20 rounded"></div>
                </div>
            ))}
        </div>
    </div>
);

const LaboratoryPreview = () => (
    <div className="w-full h-full bg-white p-6 flex flex-col gap-6 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="h-10 w-full bg-emerald-600 rounded-xl flex items-center px-4 justify-between">
            <div className="h-3 w-32 bg-white/40 rounded"></div>
            <div className="h-3 w-16 bg-white/20 rounded"></div>
        </div>
        <div className="flex-1 border-2 border-slate-100 rounded-3xl p-8 flex flex-col gap-6 bg-slate-50/50">
            <div className="flex justify-center">
                <div className="w-24 h-24 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center text-emerald-600">
                    <FlaskConical size={48} />
                </div>
            </div>
            <div className="space-y-3 text-center">
                <div className="h-5 w-48 mx-auto bg-slate-800 rounded"></div>
                <div className="h-3 w-64 mx-auto bg-slate-300 rounded opacity-60"></div>
            </div>
            <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-200">
                <div className="flex flex-col gap-2">
                    <div className="h-3 w-20 bg-slate-300 rounded"></div>
                    <div className="h-5 w-16 bg-emerald-500 rounded-lg"></div>
                </div>
                <button className="h-12 px-6 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-200">
                    إصدار الشهادة
                </button>
            </div>
        </div>
    </div>
);

const SecurityPreview = () => (
    <div className="w-full h-full bg-slate-900 p-8 flex flex-col gap-6 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="flex justify-between items-center mb-2">
            <div className="h-5 w-48 bg-white/20 rounded-full"></div>
            <Users size={24} className="text-red-500" />
        </div>
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-600/20 flex items-center justify-center text-red-500">
                            <i className="fas fa-user"></i>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-32 bg-white/30 rounded"></div>
                            <div className="h-2 w-20 bg-white/10 rounded"></div>
                        </div>
                    </div>
                    <div className="h-8 w-20 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-[10px] font-black text-emerald-400">ACTIVE</div>
                </div>
            ))}
        </div>
        <div className="mt-auto grid grid-cols-2 gap-4">
            <div className="h-14 bg-red-600/20 border border-red-600/30 rounded-2xl flex items-center justify-center text-[11px] font-black text-red-400">ADMIN CONTROL</div>
            <div className="h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center text-[11px] font-black text-white/40">AUDIT LOGS</div>
        </div>
    </div>
);

const VisionPreview = () => (
    <div className="w-full h-full bg-slate-950 p-8 flex flex-col gap-6 overflow-hidden rounded-[1.5rem] relative" dir="rtl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#007a3d22_0%,_transparent_70%)]"></div>
        <div className="flex justify-between items-center relative z-10">
            <div className="h-5 w-48 bg-white/20 rounded-full"></div>
            <BrainCircuit className="text-emerald-500" size={32} />
        </div>
        <div className="flex-1 flex flex-col gap-4 relative z-10">
            <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl relative overflow-hidden group shadow-2xl">
                <div className="absolute inset-0 bg-emerald-500/5 opacity-40"></div>
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#007a3d_0%,_transparent_70%)]"
                ></motion.div>
                <div className="absolute top-1/2 left-1/3 w-3 h-3 bg-red-600 rounded-full shadow-[0_0_20px_rgba(200,16,46,0.8)] animate-pulse"></div>
                <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(0,122,61,0.8)] animate-pulse"></div>
                <div className="absolute bottom-1/3 right-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)] animate-pulse"></div>
            </div>
            <div className="h-20 bg-emerald-600 border border-emerald-500 shadow-2xl shadow-emerald-900/40 rounded-3xl flex items-center px-6 gap-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Cpu size={24} className="text-white animate-spin-slow" />
                </div>
                <div className="space-y-2 flex-1">
                    <div className="h-2 w-full bg-white/30 rounded-full"></div>
                    <div className="h-2 w-2/3 bg-white/10 rounded-full"></div>
                </div>
            </div>
        </div>
    </div>
);

const AnalyticsPreview = () => (
    <div className="w-full h-full bg-slate-900 p-6 flex flex-col gap-6 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                    <TrendingUp size={18} />
                </div>
                <div className="h-4 w-32 bg-white/20 rounded"></div>
            </div>
            <div className="h-6 w-24 bg-white/5 rounded-full border border-white/10"></div>
        </div>
        <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col gap-4">
                <div className="h-3 w-20 bg-white/20 rounded"></div>
                <div className="flex-1 flex items-center justify-center">
                    <div className="relative w-24 h-24">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                            <circle cx="18" cy="18" r="16" fill="none" stroke="#ffffff11" strokeWidth="4" />
                            <circle cx="18" cy="18" r="16" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="100" strokeDashoffset="30" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black">70%</div>
                    </div>
                </div>
            </div>
            <div className="bg-white/5 rounded-2xl border border-white/10 p-4 flex flex-col gap-4">
                <div className="h-3 w-20 bg-white/20 rounded"></div>
                <div className="flex-1 space-y-2">
                    {[80, 40, 60, 90].map((w, i) => (
                        <div key={i} className="h-2 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${w}%` }}></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <div className="h-20 bg-blue-600/10 border border-blue-500/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <BrainCircuit size={20} />
            </div>
            <div className="flex-1 space-y-2">
                <div className="h-2 w-full bg-white/20 rounded"></div>
                <div className="h-2 w-1/2 bg-white/10 rounded"></div>
            </div>
        </div>
    </div>
);

const SamplingPreview = () => (
    <div className="w-full h-full bg-white p-6 flex flex-col gap-6 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                    <FlaskConical size={20} />
                </div>
                <div className="h-4 w-40 bg-slate-800 rounded"></div>
            </div>
            <div className="h-8 w-24 bg-slate-100 rounded-lg"></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-12 h-20 bg-white rounded-lg border-2 border-slate-200 border-dashed flex flex-col items-center justify-end p-2">
                        <div className="w-full bg-blue-500/20 rounded-sm" style={{ height: `${20 * i}%` }}></div>
                    </div>
                    <div className="h-2 w-12 bg-slate-300 rounded"></div>
                </div>
            ))}
        </div>
        <div className="flex-1 bg-slate-900 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center text-white">
                <div className="h-3 w-32 bg-white/20 rounded"></div>
                <div className="h-3 w-16 bg-white/10 rounded"></div>
            </div>
            <div className="flex-1 relative flex items-center justify-center text-white/5">
                <Search size={64} />
                <div className="absolute inset-0 flex flex-col gap-2 p-2">
                    <div className="h-2 w-full bg-white/5 rounded"></div>
                    <div className="h-2 w-3/4 bg-white/5 rounded"></div>
                </div>
            </div>
        </div>
    </div>
);

const QRSummaryPreview = () => (
    <div className="w-full h-full bg-slate-100 p-8 flex flex-col items-center justify-center gap-8 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="text-center space-y-2">
            <div className="h-6 w-48 bg-slate-800 rounded-full mx-auto"></div>
            <div className="h-3 w-64 bg-slate-400 rounded-full mx-auto opacity-50"></div>
        </div>
        
        <div className="relative group">
            <motion.div 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-48 h-48 bg-white p-4 rounded-[2.5rem] shadow-2xl border-4 border-slate-900 flex items-center justify-center relative z-10"
            >
                <div className="grid grid-cols-4 gap-2 w-full h-full">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className={`rounded-sm ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-transparent'}`}></div>
                    ))}
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-10 h-10 bg-white p-1 rounded-lg">
                      <Logo size={32} />
                   </div>
                </div>
            </motion.div>
            <div className="absolute -inset-4 bg-red-600/10 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
        </div>

        <div className="w-full bg-white p-6 rounded-3xl border border-slate-200 shadow-lg space-y-4">
            <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/2 bg-slate-800 rounded"></div>
                    <div className="h-2 w-full bg-slate-200 rounded"></div>
                </div>
            </div>
            <div className="h-px bg-slate-100"></div>
            <div className="h-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center gap-2">
                <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
                <div className="h-2 w-32 bg-slate-300 rounded"></div>
            </div>
        </div>
    </div>
);

const DocumentVaultPreview = () => (
    <div className="w-full h-full bg-slate-50 p-6 flex flex-col gap-6 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="flex gap-4 mb-2">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex-1 h-20 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-2">
                    <div className={`w-8 h-8 rounded-lg ${i === 1 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'} flex items-center justify-center`}>
                        <FileText size={16} />
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded"></div>
                </div>
            ))}
        </div>
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white">
                    <ShieldCheck size={24} />
                </div>
                <div className="flex-1">
                    <div className="h-4 w-48 bg-slate-800 rounded"></div>
                    <div className="h-2 w-32 bg-slate-400 mt-2 rounded"></div>
                </div>
            </div>
            <div className="flex-1 flex flex-col gap-3">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400">
                            <Plus size={16} />
                        </div>
                        <div className="h-3 w-40 bg-slate-300 rounded"></div>
                        <div className="ml-auto w-4 h-4 rounded-full border-2 border-red-500"></div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const LogisticsPreview = () => (
    <div className="w-full h-full bg-slate-900 p-6 flex flex-col gap-6 overflow-hidden rounded-[1.5rem] relative" dir="rtl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="flex justify-between items-center relative z-10">
            <div className="h-5 w-40 bg-white/20 rounded-full"></div>
            <div className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-lg text-[8px] font-black border border-amber-500/30">
                TRANSFERRED (محولة)
            </div>
        </div>
        <div className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-6 relative z-10 overflow-hidden flex flex-col gap-6">
            <div className="flex items-center justify-center gap-8 text-white/20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center bg-slate-800">
                        <i className="fas fa-anchor text-lg"></i>
                    </div>
                    <p className="text-[10px] font-bold text-white/40">منفذ الوصول</p>
                </div>
                <div className="flex-1 h-px bg-white/10 relative">
                    <motion.div 
                        animate={{ left: ['0%', '100%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center justify-center"
                    >
                        <i className="fas fa-truck text-[8px] text-black"></i>
                    </motion.div>
                </div>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-amber-500/50 text-amber-500 flex items-center justify-center bg-amber-500/5">
                        <i className="fas fa-warehouse text-lg"></i>
                    </div>
                    <p className="text-[10px] font-bold text-amber-500">المحطة المستلمة</p>
                </div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-white">
                        <i className="fas fa-barcode"></i>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-white">رقم الإرسالية: MRQ-8821</p>
                        <p className="text-[8px] text-slate-400">تحويل داخلي إلى صحار لوجستيك</p>
                    </div>
                </div>
                <div className="h-8 px-4 bg-emerald-600 text-white rounded-xl text-[9px] font-black flex items-center justify-center shadow-lg shadow-emerald-900/50">
                    تأكيد الاستلام
                </div>
            </div>
        </div>
    </div>
);

const DailyWorkflowPreview = () => (
    <div className="w-full h-full bg-slate-50 p-6 flex flex-col gap-4 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="h-10 w-full bg-slate-800 rounded-xl flex items-center px-4">
            <p className="text-[10px] font-black text-white/60 tracking-widest uppercase">Operational Stream: Daily Cycle</p>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-4">
            {[
                { title: "تسجيل المعاملة", icon: "fa-file-signature", color: "blue", desc: "استيراد البيانات من بيان" },
                { title: "تقييم المخاطر", icon: "fa-shield-halved", color: "red", desc: "تحليل تلقائي للمنشأ والصنف" },
                { title: "المعاينة الفنية", icon: "fa-magnifying-glass", color: "amber", desc: "تفتيش ميداني وتوثيق بالصور" },
                { title: "المختبر / الإفراج", icon: "fa-flask-vial", color: "emerald", desc: "سحب عينات أو إطلاق الشحنة" }
            ].map((step, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3 group hover:border-indigo-200 transition-all">
                    <div className={`w-10 h-10 rounded-xl bg-${step.color}-50 text-${step.color}-600 flex items-center justify-center text-lg`}>
                        <i className={`fas ${step.icon}`}></i>
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-800">{step.title}</p>
                        <p className="text-[9px] text-slate-400 font-bold leading-tight mt-1">{step.desc}</p>
                    </div>
                    <div className="mt-auto flex justify-end">
                        <div className="w-5 h-5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] font-black text-slate-300">0{i+1}</div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const EnterprisePreview = () => (
    <div className="w-full h-full bg-slate-50 p-6 flex flex-col gap-6 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center gap-2 shadow-sm">
                    <div className="w-4 h-4 rounded bg-slate-100"></div>
                    <div className="h-2 w-12 bg-slate-200"></div>
                </div>
            ))}
        </div>
        <div className="flex-1 flex gap-4">
            <div className="w-1/3 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-4">
                <div className="h-4 w-24 bg-slate-800 rounded"></div>
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-8 rounded-lg flex items-center px-4 ${i === 1 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
                            <div className="h-2 w-full bg-current opacity-20 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xl p-6 flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    <div className="h-5 w-40 bg-slate-800 rounded"></div>
                    <div className="flex gap-2">
                        <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
                            <Plus size={16} />
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                            <Search size={16} />
                        </div>
                    </div>
                </div>
                <div className="flex-1 space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white border border-slate-200"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-48 bg-slate-300 rounded"></div>
                                <div className="h-2 w-32 bg-slate-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

const DetailedRegistrationPreview = () => (
    <div className="w-full h-full bg-slate-50 p-6 flex flex-col gap-4 overflow-hidden rounded-[1.5rem]" dir="rtl">
        <div className="flex items-center justify-between mb-2">
            <div className="h-4 w-40 bg-slate-800 rounded"></div>
            <div className="flex gap-1">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className={`h-1.5 w-8 rounded-full ${i <= 2 ? 'bg-red-600' : 'bg-slate-200'}`}></div>
                ))}
            </div>
        </div>
        <div className="flex-1 space-y-4">
            {[
                { title: "الخطوة 1: استيراد بيانات بيان", desc: "سحب تلقائي لرقم البيان الجمركي والشحنات المرتبطة." },
                { title: "الخطوة 2: التصنيف الرقابي", desc: "تحديد ما إذا كانت الشحنة زراعية، حيوانية، أو غذائية." },
                { title: "الخطوة 3: التحقق من المستندات", desc: "تدقيق الشهادات الصحية وشهادات المنشأ بواسطة الذكاء الاصطناعي." },
                { title: "الخطوة 4: التوجيه الفني", desc: "تحديد المسار (معاينة فورية، مختبر، أو إفراج تلقائي)." }
            ].map((step, i) => (
                <div key={i} className="flex gap-4 items-start p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-black text-xs shrink-0">{i + 1}</div>
                    <div>
                        <p className="text-xs font-black text-slate-800">{step.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold leading-tight mt-1">{step.desc}</p>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const DailyLogPreview = () => (
    <div className="w-full h-full bg-slate-900 p-6 flex flex-col gap-4 rounded-[1.5rem] overflow-hidden" dir="rtl">
        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
            <div className="h-3 w-32 bg-white/40 rounded"></div>
            <div className="flex gap-2">
                <div className="h-6 w-6 rounded-full bg-emerald-500/20"></div>
                <div className="h-6 w-6 rounded-full bg-red-500/20"></div>
            </div>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto">
            {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex gap-3 items-center">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <FileText size={16} className="text-white/40" />
                        </div>
                        <div className="space-y-1">
                            <div className="h-2 w-20 bg-white/20 rounded"></div>
                            <div className="h-1.5 w-12 bg-white/10 rounded"></div>
                        </div>
                    </div>
                    <div className="h-2 w-16 bg-emerald-500/40 rounded-full"></div>
                </div>
            ))}
        </div>
    </div>
);

const TransferredShipmentsPreview = () => (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col gap-6 rounded-[1.5rem] relative overflow-hidden" dir="rtl">
        <div className="flex items-center gap-4 border-b border-white/10 pb-4">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-500">
                <Network size={24} />
            </div>
            <div className="space-y-1">
                <p className="text-white font-black text-sm">الإرساليات المحولة</p>
                <p className="text-white/40 text-[10px]">نظام التحويل بين المختبرات والمنافذ</p>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3">
                <div className="text-amber-500 text-2xl font-black">12</div>
                <p className="text-[10px] text-white/40 font-bold">قيد التحويل</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-3">
                <div className="text-emerald-500 text-2xl font-black">45</div>
                <p className="text-[10px] text-white/40 font-bold">تم استلامها</p>
            </div>
        </div>
        <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-3">
            <div className="flex justify-between items-center">
                <div className="h-2 w-24 bg-white/20 rounded"></div>
                <div className="h-2 w-8 bg-amber-500/40 rounded-full"></div>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-3/4"></div>
            </div>
        </div>
    </div>
);

const SamplingManagementPreview = () => (
    <div className="w-full h-full bg-slate-900 p-6 flex flex-col gap-6 rounded-[1.5rem] relative overflow-hidden" dir="rtl">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <FlaskConical size={24} className="text-white" />
            </div>
            <p className="text-white font-black text-lg">إدارة العينات</p>
        </div>
        <div className="flex-1 flex flex-col gap-3">
            {[
                { title: "سحب العينات", status: "مكتمل", color: "emerald" },
                { title: "تكويد QR", status: "نشط", color: "indigo" },
                { title: "إرسال للمختبر", status: "قيد التنفيذ", color: "amber" }
            ].map((item, i) => (
                <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between">
                    <span className="text-sm font-bold text-white">{item.title}</span>
                    <span className={`px-2 py-1 bg-${item.color}-500/20 text-${item.color}-400 text-[9px] font-black rounded-lg`}>{item.status}</span>
                </div>
            ))}
        </div>
    </div>
);

const VisionGoalsPreviewExtended = () => (
    <div className="w-full h-full bg-slate-900 p-8 flex flex-col gap-8 rounded-[1.5rem] relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 via-transparent to-emerald-500/10"></div>
        <div className="relative z-10 flex flex-col gap-8 h-full">
            <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-red-600 flex items-center justify-center shadow-2xl shadow-red-500/40">
                    <Target size={40} className="text-white" />
                </div>
                <div className="space-y-2">
                    <div className="h-6 w-48 bg-white rounded-full"></div>
                    <div className="h-4 w-64 bg-white/40 rounded-full"></div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 flex-1">
                {[
                    { label: "رؤية 2040", color: "emerald", progress: 85 },
                    { label: "أتمتة شاملة", color: "red", progress: 100 },
                    { label: "ذكاء رقابي", color: "amber", progress: 70 }
                ].map((item, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md">
                        <div className="flex justify-between items-center text-white">
                            <span className="text-sm font-black">{item.label}</span>
                            <span className="text-xs font-bold opacity-60 underline">{item.progress}%</span>
                        </div>
                        <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${item.progress}%` }}
                                transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                                className={`h-full bg-${item.color}-500 shadow-[0_0_15px_rgba(255,255,255,0.2)]`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const PlatformComponentsPreview = () => (
    <div className="w-full h-full bg-slate-950 p-6 flex flex-col gap-6 rounded-[1.5rem] relative overflow-hidden" dir="rtl">
        <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full">
            {[
                { title: "الذكاء الاصطناعي", icon: <BrainCircuit size={24} />, color: "teal" },
                { title: "إدارة المختبرات", icon: <FlaskConical size={24} />, color: "indigo" },
                { title: "المعاينة الميدانية", icon: <Search size={24} />, color: "emerald" },
                { title: "تقييم المخاطر", icon: <ShieldAlert size={24} />, color: "rose" },
                { title: "بوابة اللوجستيات", icon: <LayoutDashboard size={24} />, color: "amber" },
                { title: "التقارير الذكية", icon: <TrendingUp size={24} />, color: "blue" }
            ].map((comp, i) => (
                <div key={i} className={`bg-${comp.color}-500/10 border border-${comp.color}-500/20 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 group hover:bg-${comp.color}-500/20 transition-all`}>
                    <div className={`text-${comp.color}-400 group-hover:scale-110 transition-transform`}>
                        {comp.icon}
                    </div>
                    <div className="h-2 w-16 bg-white/20 rounded-full group-hover:bg-white/40"></div>
                </div>
            ))}
        </div>
    </div>
);

const IntegrationPlanPreview = () => (
    <div className="w-full h-full bg-slate-900 p-8 flex flex-col gap-8 rounded-[1.5rem] relative overflow-hidden" dir="rtl">
        <div className="flex justify-center items-center h-full relative">
            {/* Center Node */}
            <div className="relative z-10 w-32 h-32 rounded-full bg-red-600 flex items-center justify-center shadow-[0_0_50px_rgba(200,16,46,0.4)] border-4 border-white/20">
                <Logo size={64} variant="light" />
            </div>
            
            {/* Satellite Nodes */}
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <motion.div 
                    key={i}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    style={{ transform: `rotate(${angle}deg)` }}
                >
                    <div 
                        className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 shadow-xl backdrop-blur-md"
                        style={{ transform: `translate(140px) rotate(-${angle}deg)` }}
                    >
                        <Network size={24} className="opacity-40" />
                    </div>
                </motion.div>
            ))}
            
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
                <circle cx="50%" cy="50%" r="140" fill="none" stroke="white" strokeWidth="1" strokeDasharray="5 5" />
            </svg>
        </div>
    </div>
);

const InnovatorPreview = () => (
    <div className="w-full h-full bg-slate-900 p-8 flex flex-col gap-8 rounded-[1.5rem] relative overflow-hidden" dir="rtl">
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 via-transparent to-blue-500/10"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center gap-6">
            <div className="w-40 h-40 rounded-full border-4 border-red-600 p-1 bg-white/10 shadow-[0_0_50px_rgba(200,16,46,0.3)]">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    <Users size={80} className="text-white/20" />
                </div>
            </div>
            <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">مبارك بن درويش بن مبارك البدواوي</h3>
                <p className="text-red-500 font-bold">مطور ومبتكر منصة مرقاب</p>
                <div className="h-px w-24 bg-red-600/30 mx-auto"></div>
                <p className="text-white/60 text-sm max-w-xs mx-auto">مدخل بيانات حاسب آلي - قسم الحجر وسلامة الغذاء بميناء صحار</p>
            </div>
            <div className="flex gap-4">
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-widest">Innovation</div>
                <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/40 uppercase tracking-widest">Software Architecture</div>
            </div>
        </div>
    </div>
);

const TechnicalStackPreview = () => (
    <div className="w-full h-full bg-slate-950 p-8 flex flex-col gap-6 rounded-[1.5rem] relative overflow-hidden" dir="rtl">
        <div className="grid grid-cols-2 gap-4 h-full">
            {[
                { name: "React 18 & Vite", category: "Frontend", color: "blue" },
                { name: "Node.js & Express", category: "Backend", color: "emerald" },
                { name: "Firebase Cloud", category: "Database/Auth", color: "amber" },
                { name: "Tailwind CSS", category: "Styling", color: "sky" },
                { name: "Gemini AI SDK", category: "Intelligence", color: "purple" },
                { name: "Framer Motion", category: "Animations", color: "pink" }
            ].map((tech, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-center gap-2 group hover:bg-white/10 transition-all">
                    <p className={`text-${tech.color}-400 text-xs font-black uppercase tracking-tighter`}>{tech.category}</p>
                    <p className="text-white font-bold">{tech.name}</p>
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full bg-${tech.color}-500 w-full opacity-40`}></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const slides: Slide[] = [
  {
    title: "نظام مرقاب الذكي (MIRQAB)",
    subtitle: "مبادرة قسم الحجر وسلامة الغذاء بميناء صحار",
    description: "رؤية رقمية طموحة انطلقت من ميناء صحار لربط القطاعات الرقابية (الزراعي والحيواني، سلامة الغذاء) مع الإدارة اللوجستية والمالية في بوابة موحدة تضمن أمن الواردات وسرعة التخليص عبر أحدث تقنيات التحليل الرقمي للبيانات.",
    icon: <Zap size={48} className="text-amber-400" />,
    gradient: "from-red-600 via-red-900 to-slate-950",
    preview: <IntroPreview />,
    features: [
      "مبادرة رائدة لتطوير العمل الرقابي تتبناها إدارة قسم الحجر وسلامة الغذاء بصحار.",
      "تعزيز مكانة ميناء صحار كمركز لوجستي عالمي من الفئة الأولى بتميز رقابي.",
      "صفرية المعاملات الورقية (Paperless Action) بحلول نهاية عام 2026.",
      "رفع دقة التنبؤ بالأخطار الصحية والوبائية باستخدام تقنيات البيانات الضخمة.",
      "تطوير الكوادر الفنية وتمكينهم بأدوات ذكاء اصطناعي متقدمة عالمياً."
    ]
  },
  {
    title: "مبتكر ومطور المنصة",
    subtitle: "مبادرة وطنية من قلب الميدان في ميناء صحار",
    description: "تم تصميم وتطوير منصة 'مرقاب' كمبادرة تقنية من أحد كوادر الوزارة الميدانية، لضمان مواءمة الحلول الرقمية مع التحديات الواقعية التي يواجهها الموظفون يومياً.",
    icon: <Users size={48} className="text-red-500" />,
    gradient: "from-slate-800 via-slate-950 to-red-950",
    preview: <InnovatorPreview />,
    features: [
      "مبتكر المنصة: مبارك بن درويش بن مبارك البدواوي.",
      "خبرة ميدانية عميقة في إجراءات الحجر وسلامة الغذاء بميناء صحار.",
      "تطوير برمجي خاص يتناسب مع دورة العمل الفعلية في الوزارة.",
      "الاستباقية في تقديم الحلول الرقمية بدلاً من انتظار الحلول الخارجية.",
      "التطوير المستمر للنظام بناءً على ملاحظات الزملاء ومدراء المنافذ."
    ]
  },
  {
    title: "الأهداف والرؤية الاستراتيجية",
    subtitle: "نحو رقابة ذكية وموانئ آمنة ومستدامة",
    description: "تتمحور رؤية مرقاب حول خلق منظومة رقابية رقمية متكاملة تتوافق مع رؤية عمان 2040، وتسعى لتحويل ميناء صحار إلى بوابة عالمية فائقة الذكاء.",
    icon: <Target size={48} className="text-emerald-400" />,
    gradient: "from-emerald-600 via-emerald-900 to-slate-950",
    preview: <VisionGoalsPreviewExtended />,
    features: [
      "تحقيق أهداف رؤية عمان 2040 في التحول الرقمي الشامل.",
      "تسريع وتيرة التبادل التجاري عبر تقليل زمن الاستجابة الرقابية.",
      "ضمان أعلى معايير سلامة الأغذية والصحة العامة للمجتمع.",
      "توفير قاعدة بيانات استراتيجية لدعم اتخاذ القرار الوطني.",
      "الاستباقية في اكتشاف المخاطر العابرة للحدود بميناء صحار."
    ]
  },
  {
    title: "مكونات المنصة والوحدات الوظيفية",
    subtitle: "هندسة برمجية متكاملة تخدم جميع الأطراف المعنية",
    description: "تتكون منصة مرقاب من 12 وحدة وظيفية مترابطة بشكل وثيق، تغطي كافة الجوانب الفنية والمالية والإحصائية بمرونة تامة وقدرة عالية على التوسع.",
    icon: <Grid size={48} className="text-blue-400" />,
    gradient: "from-blue-600 via-indigo-950 to-slate-950",
    preview: <PlatformComponentsPreview />,
    features: [
      "محركات ذكاء اصطناعي للتحليل الفني واللغوي الفوري للشهادات الصحية.",
      "أنظمة إدارة المختبرات (LIMS) المتقدمة لتتبع العينات وضمان جودتها.",
      "أدوات تفتيش ميداني ذكية تدعم التوثيق الجغرافي والمصور اللحظي.",
      "بوابات مالية وإحصائية توفر تقارير ديناميكية لصناع القرار في الوزارة.",
      "قواعد بيانات ضخمة متكاملة للأصناف الغذائية والمخاطر العالمية."
    ]
  },
  {
    title: "البنية البرمجية والتقنيات المستخدمة",
    subtitle: "أحدث التقنيات العالمية في خدمة العمل الرقابي",
    description: "يعتمد نظام مرقاب على بنية برمجية حديثة تضمن السرعة الفائقة في معالجة البيانات، والأمان المطلق، والقدرة العالية على التوسع المستقبلي.",
    icon: <Cpu size={48} className="text-blue-400" />,
    gradient: "from-slate-900 via-blue-900 to-slate-950",
    preview: <TechnicalStackPreview />,
    features: [
      "تكنولوجيا React 18 لبناء واجهات تفاعلية سريعة وسلسة.",
      "Node.js & Express لبناء محرك خلفي قوي وموثوق.",
      "Firebase Cloud لإدارة قواعد البيانات والملفات والمصادقة الأمنية.",
      "Gemini AI SDK لدمج قدرات الذكاء الاصطناعي في تحليل المستندات.",
      "تصميم متجاوب بالكامل يدعم جميع الأجهزة (أجهزة لوحية، هاتف، حاسب)."
    ]
  },
  {
    title: "دورة العمل والعمليات اليومية",
    subtitle: "أتمتة كاملة لدورة حياة الإرسالية من الوصول إلى الإفراج",
    description: "يستبدل النظام الإجراءات الورقية بدورة عمل رقمية منسقة، حيث يتم رصد كل خطوة بجدول زمني دقيق، مما يضمن تدفق المعلومات بسلاسة بين الموظفين بين الموانئ والمختبرات.",
    icon: <Play size={48} className="text-indigo-400" />,
    gradient: "from-indigo-600 via-blue-900 to-slate-950",
    preview: <DailyWorkflowPreview />,
    features: [
        "رصد حي للمعاملات القادمة (Incoming) وتوزيع المهام آلياً على المفتشين.",
        "نظام التنبيهات اللحظية للإجراءات المتأخرة أو المعلقة لأسباب فنية.",
        "تحويل آلي للمعاملات من مرحلة التسجيل إلى مرحلة المعاينة الميدانية.",
        "سجل تاريخي كامل لكل إجراء تم اتخاذه على الإرسالية منذ دخولها النظام.",
        "واجهة موحدة تجمع بين المفتش الفني والمدّق والمدير في منصة واحدة."
    ]
  },
  {
    title: "خطوات تسجيل المعاملات بالتفصيل",
    subtitle: "رحلة البيانات من نظام بيان إلى منصة مرقاب",
    description: "تتميز عملية التسجيل بالبساطة والدقة، حيث يتم أتمتة معظم المراحل لتقليل الخطأ البشري وتسريع الإنجاز في الخطوط الأمامية للميناء.",
    icon: <Plus size={48} className="text-emerald-500" />,
    gradient: "from-emerald-600 via-emerald-800 to-slate-950",
    preview: <DetailedRegistrationPreview />,
    features: [
      "تكامل فني فوري مع أنظمة الجمارك (بيان) لجلب تفاصيل الإرسالية آلياً.",
      "إدخال البيانات الفنية (بلد المنشأ، الوزن، نوع الصنف) بدقة متناهية.",
      "رفع المستندات الصحية والشهادات الأصلية وتدقيقها رقمياً.",
      "التحقق من حالة المستورد وسجله الرقابي قبل اعتماد المعاملة.",
      "توجيه المعاملة آلياً للمفتش المختص في ميناء صحار بناءً على الاختصاص."
    ]
  },
  {
    title: "بوابة التسجيل وإدخال البيانات الذكي",
    subtitle: "الدقة التامة والسرعة الفائقة في معالجة المستندات",
    description: "بوابة متطورة للمخلصين وموظفي التسجيل تدعم استخراج البيانات الذكي وتقوم بحساب الرسوم آلياً بناءً على تصنيف البيانات وقوانين السلطنة، مع تكامل فني مع أنظمة الميناء.",
    icon: <FileText size={48} className="text-purple-400" />,
    gradient: "from-purple-600 via-violet-900 to-slate-950",
    preview: <DataEntryPreview />,
    features: [
      "احتساب تلقائي وفوري للرسوم والضمانات المالية المقررة وإصدار الفواتير الرسمية.",
      "الكشف التلقائي عن الإرساليات المكررة وشحنات التجزئة لمنع التحايل.",
      "التكامل العميق مع قواعد بيانات المستوردين للحفاظ على سجلات تاريخية دقيقية.",
      "دعم استخراج البيانات بالذكاء الاصطناعي (OCR) من الفواتير والشهادات المرفقة.",
      "تكامل فني مع نظام 'بيان' الجمركي في الميناء (محاكاة الربط المباشر)."
    ]
  },
  {
    title: "محرك تقييم المخاطر المتقدم (Risk Profiling)",
    subtitle: "الرقابة المبنية على التحليل العميق والبيانات الكبيرة",
    description: "خوارزميات ذكية تقوم بتسعير المخاطر لكل شحنة بناءً على المنشأ، سجل المستورد، نوع السلعة، والإنذارات الوبائية العالمية، مما يوجه المفتش نحو الحالات الأكثر حساسية.",
    icon: <ShieldAlert size={48} className="text-rose-400" />,
    gradient: "from-red-500 via-rose-900 to-slate-950",
    preview: <RiskProfilePreview />,
    features: [
      "توليد درجة خطورة رقمية (0-100%) لحظياً لكل بيان جمركي يدخل النظام.",
      "ربط مباشر مع الإنذارات الوبائية وتنبيه المفتش آلياً عند تطابق الحالة.",
      "تحدث تلقائي للملف التعريفي للمستوردين بناءً على الالتزام بالقوانين.",
      "توصيات ذكية لنوع الإجراء الرقابي (فحص مستندي، معاينة فعلية، سحب عينة).",
      "قاعدة بيانات عالمية للدول والمناطق الموبوءة متجددة لحظياً."
    ]
  },
  {
    title: "مساعد الذكاء الاصطناعي للمفتشين (MIRQAB AI)",
    subtitle: "خبير رقابي وعلمي متاح في كل وقت وفي كل جيب",
    description: "يوفر 'مرقاب' مساعداً ذكياً يعمل بالنماذج اللغوية المتقدمة لدعم المفتشين بالمعلومات الجمركية والعلمية والطبية بسرعة فائقة، ويساعد في تحليل الصور الميدانية.",
    icon: <BrainCircuit size={48} className="text-teal-400" />,
    gradient: "from-teal-600 via-emerald-900 to-slate-900",
    preview: <VisionPreview />,
    features: [
      "ميزة الدردشة الحية مع النظام باستخدام نماذج (Gemini 1.5) للإجابة على الأسئلة الفنية.",
      "تحليل الصور المستندية وصور المعاينة الميدانية لكشف التزييف في الشهادات.",
      "توليد ملخصات تنفيذية شاملة لتاريخ الشحنة والمستورد بأسلوب تقريري ذكي.",
      "تفسير القوانين والأنظمة المعقدة للمفتشين بتبسيط ذكي ومحدد.",
      "دعم متعدد اللغات لترجمة الشهادات الصحية والتحاليل الأجنبية فورياً."
    ]
  },
  {
    title: "المعاينة الميدانية الرقمية المتكاملة",
    subtitle: "تطبيق التفتيش الرقمي والتوثيق الميداني الشفاف",
    description: "تتحول إجراءات التفتيش إلى إجراءات رقمية بالكامل باستخدام القوائم المرجعية الذكية، مع إمكانية التوثيق الحي بالصور والارتباط المباشر بشاشات الإدارة.",
    icon: <Search size={48} className="text-emerald-400" />,
    gradient: "from-[#007a3d] via-emerald-900 to-slate-950",
    preview: <TransactionLogPreview />,
    features: [
      "قوائم فحص واستمارات معاينة تتغير آلياً وتفصيلياً حسب طبيعة السلعة.",
      "توثيق مصور (Live Images) وتثبيت المواقع الجغرافية (GPS) لعمليات التفتيش.",
      "سحب العينات وإصدار باركود خاص بها يربطها بالبيان والمختبر والمنتج.",
      "تسجيل الأحداث التفصيلية لضمان أعلى درجات الشفافية والعدالة في الإجراءات.",
      "إصدار إخطارات المخالفات والتحاريز الميدانية فورياً وطباعتها حرارياً."
    ]
  },
  {
    title: "إدارة العينات والترميز الرقمي (QR)",
    subtitle: "تتبع ذكي للعينات لضمان دقة النتائج وسرعة الإنجاز",
    description: "نظام متكامل لسحب وترميز العينات الكترونياً، يربط العينة المادية بالبيانات الرقمية لضمان عدم اختلاطها وسرعة تتبعها في المختبرات.",
    icon: <FlaskConical size={48} className="text-indigo-400" />,
    gradient: "from-indigo-600 via-slate-800 to-slate-950",
    preview: <SamplingManagementPreview />,
    features: [
      "توليد فوري لرموز QR لكل عينة مسحوبة لضمان دقة التتبع.",
      "توثيق الكتروني لمكان وزمان سحب العينة واسم المفتش القائم بالعمل.",
      "إدارة متكاملة لدفاتر العينات وتوزيعها على المختبرات المختلفة.",
      "نظام تنبيهات للنتائج المخبرية المتأخرة لتسريع عملية الإفراج.",
      "ربط العينة بالفيديو أو الصور الفوتوغرافية عند الحاجة للتوثيق الميداني."
    ]
  },
  {
    title: "إدارة المختبرات وإصدار الشهادات الرسمية",
    subtitle: "الدقة العلمية والاعتمادية الوثائقية والشهادات الصحية",
    description: "وحدة متكاملة تضمن تتبع النتائج المخبرية وتسجيلها. يتيح النظام إصدار شهادات الإفراج الموثقة والشهادات الصحية بمزايا أمان رقمية حديثة تمنع التلاعب.",
    icon: <FlaskConical size={48} className="text-indigo-400" />,
    gradient: "from-indigo-600 via-blue-900 to-slate-950",
    preview: <LaboratoryPreview />,
    features: [
      "تسجيل واعتماد نتائج تحاليل المختبرات بشكل حي ومباشر في السجل الرقمي.",
      "إصدار شهادات مطابقة بمزايا أمان متقدمة وموثقة بـ QR Code عالمي.",
      "إصدار الشهادات الصحية للحيوانات والنباتات والمنتجات الغذائية بمختلف أنواعها.",
      "أرشفة إلكترونية كاملة (Document Vault) لجميع الشهادات الصادرة للرجوع إليها.",
      "تكامل فني مع المختبرات المركزية لتلقي النتائج آلياً وتحديث الحالة."
    ]
  },
  {
    title: "تتبع المسار المخبري والفرز الذكي",
    subtitle: "نظام التتبع والفرز الذكي والرقابة على النتائج",
    description: "نسخة مطورة من نظام إدارة العينات تتيح للمفتشين وفنيي المختبرات تتبع العينات بدقة، مع ميزات فرز متقدمة لضمان أعلى مستويات التنظيم في ميناء صحار.",
    icon: <FlaskConical size={48} className="text-orange-400" />,
    gradient: "from-orange-600 via-red-900 to-slate-950",
    preview: <SamplingPreview />,
    features: [
      "فرز لحظي متقدم حسب التاريخ، المفتش، المختبر، أو نوع الصنف الغذائي والزراعي.",
      "نظام تتبع مباشر لحالة العينة (بانتظار السحب، قيد النقل، بانتظار الفحص).",
      "إدارة شاملة لمندوبي المختبرات وحالات الاستلام والتسليم الموثقة زمنياً.",
      "تنبيهات تلقائية في حال تأخر المختبر في إصدار النتيجة عن الزمن المحدد.",
      "سجل جغرافي لمكان تواجد العينات خلال سلسلة الشحن لضمان سلامتها."
    ]
  },
  {
    title: "الإرساليات المحولة وإدارة المسار",
    subtitle: "نظام تحويل ذكي بين المنافذ والمختبرات والمحاجر",
    description: "يتعامل النظام بكفاءة مع الإرساليات التي تتطلب إجراءات إضافية أو تحويل لمختبرات متخصصة، مع تتبع لحظي لمسار التحويل والاستلام.",
    icon: <Network size={48} className="text-amber-500" />,
    gradient: "from-amber-600 via-slate-800 to-slate-950",
    preview: <TransferredShipmentsPreview />,
    features: [
      "نظام إرسال واستلام إلكتروني يضمن عدم ضياع أي معاملة أثناء التحويل.",
      "تحديد تلقائي للمختبرات المعتمدة بناءً على نوع الصنف والفحص المطلوب.",
      "تنبيهات لحظية لجهة الاستلام بوجود إرسالية محولة قادمة.",
      "ربط نتائج الفحص المخبري مباشرة بالمعاملة الأصلية فور صدورها.",
      "إحصائيات دقيقة لعدد الشحنات المحولة وزمن الاستجابة لكل جهة."
    ]
  },
  {
    title: "إدارة الإرساليات المحولة (Logistics Portal)",
    subtitle: "تنسيق التحويلات الداخلية بين بوابات الميناء والمناطق اللوجستية",
    description: "يوفر النظام وحدة متخصصة لإدارة الإرساليات التي يتم تحويلها من ميناء صحار إلى منافذ أخرى أو إلى محطة خزائن اللوجستية، مع ضمان تتبع دقيق للمسؤوليات وكيفية التعامل معها.",
    icon: <LayoutDashboard size={48} className="text-amber-500" />,
    gradient: "from-amber-600 via-orange-950 to-slate-950",
    preview: <LogisticsPreview />,
    features: [
        "إدراج تلقائي لجميع الشحنات المحددة بـ 'تحويل داخلي' في بوابة اللوجستيات.",
        "تنسيق التحويل من منفذ الوصول إلى نقطة التفتيش النهائية أو المختبرات الخارجية.",
        "إمكانية الاستلام الدفعي (Batch Arrival) لمجموعة كبيرة من الحاويات بضغطة زر.",
        "تغيير آلي لمسؤوليات الشحنات وسجلات المعاينة لضمان عدم تداخل الصلاحيات.",
        "نظام تتبع الشحنات التي لم تصل لوجهتها في الوقت المقرر لها (Auto-Stalling)."
    ]
  },
  {
    title: "سجل المعاملات اليومي الرقمي",
    subtitle: "شفافية مطلقة وتتبع دقيق لكل حركة",
    description: "يوفر هذا السجل نظرة شاملة على جميع المعاملات التي تتم عبر المنصة، مما يضمن الشفافية الكاملة والقدرة على تتبع حالة أي إرسالية في أي وقت.",
    icon: <FileText size={48} className="text-blue-400" />,
    gradient: "from-slate-800 via-slate-900 to-blue-950",
    preview: <DailyLogPreview />,
    features: [
      "سجل تاريخي كامل (Audit Trail) لكل تعديل أو إجراء تم على المعاملة.",
      "محرك بحث متطور بالرقم الآلي، رقم البيان، أو اسم المستورد.",
      "فلترة ذكية حسب الحالة (قيد الانتظار، تحت المعاينة، مكتملة).",
      "عرض سريع لتفاصيل الإرسالية والمرفقات الفنية المرتبطة بها.",
      "إمكانية تصدير سجلات المعاملات اليومية لتقارير إحصائية دورية."
    ]
  },
  {
    title: "لوحة التحكم الحية الاستراتيجية",
    subtitle: "نافذة القيادة والسيطرة والتحكم الشاملة",
    description: "شاشات تفاعلية توفر لمتخذي القرار إحصاءات لحظية حول تدفق الشحنات، الإنتاجية للمنافذ، والتحذيرات الوبائية، ومؤشرات الأداء عبر جميع المنافذ بميناء صحار.",
    icon: <LayoutDashboard size={48} className="text-blue-400" />,
    gradient: "from-blue-600 via-indigo-900 to-slate-950",
    preview: <DashboardPreview />,
    features: [
      "مؤشرات أداء (KPIs) لحظية لقياس سرعة وإنجاز المعاملات وتحديد مواطن التأخير.",
      "رصد مستمر لمستوى المخاطر وتوزعها الجغرافي والقطاعي (نباتي، حيواني، غذاء).",
      "تنبيهات فورية للمشرفين في حال وجود تكدس بالمنافذ أو انحراف عن المعايير.",
      "نظام عرض مبسط ومخصص للقيادات مع إرسال تقارير يومية تلقائية للبريد.",
      "تتبع حي لمعدلات الإفراج والرفض اليومية بكل منفذ وبوابة لوجستية."
    ]
  },
  {
    title: "التقارير التحليلية والذكاء الاستراتيجي",
    subtitle: "تحويل البيانات المجردة إلى قوة قرار استراتيجي شامل",
    description: "يقدم 'مرقاب' باقة واسعة من التقارير الإحصائية والمالية والتشغيلية المتقدمة لجميع قطاعات العمل، مما يمكن صانعي السياسات من التخطيط المبني على الأدلة.",
    icon: <TrendingUp size={48} className="text-blue-400" />,
    gradient: "from-blue-600 via-indigo-900 to-slate-950",
    preview: <AnalyticsPreview />,
    features: [
      "تصدير تقارير تفصيلية شاملة للرسوم المالية والمخالفات المسجلة والإيرادات.",
      "إحصاءات شاملة لتتبع أداء المفتشين وقياس الإنتاجية الفردية الجماعية.",
      "تحليل مقارن زمني لرصد اتجاهات التجارة (نمو الأصناف، مواسم الاستيراد).",
      "بناء تقارير ديناميكية مخصصة بضغطة زر لتلبية متطلبات الجهات العليا.",
      "توزيع آلي للتقارير الدورية على البريد الإلكتروني للمسؤولين وصناع القرار."
    ]
  },
  {
    title: "التلخيص الرقمي السريع (QR Summary)",
    subtitle: "التواصل الذكي والشفاف للبيانات في الميدان اللوجستي",
    description: "ميزة مبتكرة تتيح توليد ملخص نصي شامل لكل معاملة مشفر داخل رمز QR للهواتف المحمولة للوصول السريع للبيانات في الميدان.",
    icon: <Plus size={48} className="text-slate-300" />,
    gradient: "from-slate-600 via-slate-800 to-slate-950",
    preview: <QRSummaryPreview />,
    features: [
      "توليد فوري لملخصات فنية شاملة تحتوي على تفاصيل المنتجات والقرارات النهائية.",
      "توفيرا وصول سريع للغاية للبيانات في المناطق ذات الاتصال الضعيف.",
      "تشفير ذكي للبيانات يضمن أن المعلومات لا تقرأ إلا من قبل المخولين.",
      "ملخص نصي مرتب يسهل القراءة على أي جهاز هاتفي محمول.",
      "إمكانية مشاركة الملخص للجهات الأمنية أو الجمركية بضغطة زر واحدة."
    ]
  },
  {
    title: "خطة التكامل الوطني والتبادل الرقمي",
    subtitle: "ربط تقني شامل مع الجهات ذات العلاقة (Inter-Agency Integration)",
    description: "يسعى 'مرقاب' ليكون القلب الرقمي النابض للمنافذ، حيث يتكامل مع أنظمة الجمارك، الموانئ، والمختبرات العالمية والوطنية لتبادل البيانات فوراً.",
    icon: <Network size={48} className="text-amber-500" />,
    gradient: "from-amber-600 via-orange-900 to-slate-950",
    preview: <IntegrationPlanPreview />,
    features: [
      "الربط المباشر مع نظام (بيان) التابع لجمارك عمان لتبادل بيانات الاستيراد.",
      "تكامل فني مع أنظمة المختبرات المركزية (CSL) في محافظة مسقط وصحار.",
      "ربط مع المنظمات العالمية (OIE, IPPC, WHO) لتلقي الإنذارات الوبائية.",
      "قنوات تبادل بيانات آمنة مع مشغلي المحطات اللوجستية في ميناء صحار.",
      "تطوير APIs مخصصة للقطاع الخاص (مكاتب التخليص، شركات الاستيراد)."
    ]
  },
  {
    title: "إدارة النظام والإعدادات السيادية",
    subtitle: "المركزيّة في التحكم والشمولية في التكامل الرقمي",
    description: "يمكّن النظام مدراء النظام من التحكم الكامل بجميع المدخلات المرجعية مثل (تصنيفات السلع، المفتشين، المنافذ) دون الحاجة للجوء للمبرمجين دائماً.",
    icon: <Cpu size={48} className="text-emerald-500" />,
    gradient: "from-emerald-500 via-teal-900 to-slate-950",
    preview: <EnterprisePreview />,
    features: [
      "إدارة المستخدمين والصلاحيات الدقيقة لكل موظف وتخصيص المنافذ والقطاعات.",
      "إدارة ديناميكية لقوائم السلع ورموز النظام المنسق (HS Codes) مع تحديثات لحظية.",
      "إعدادات أمان مشفرة وسجلات تدقيق (Audit Logs) لكل حركة يقوم بها المستخدم.",
      "إمكانية تخصيص المختبرات المعتمدة أنواع الفحوصات لكل صنف بدقة.",
      "أدوات ترحيل البيانات الضخمة وتصدير النسخ الاحتياطية دورياً وبشكل آمن."
    ]
  }
];


const PresentationMode: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const exportToPDF = async () => {
    if (!slideRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(slideRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`Mirqab-Presentation-Slide-${currentSlide + 1}.pdf`);
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950 text-white font-sans overflow-hidden flex flex-col" dir="rtl">
      
      {/* Background with motion */}
      <motion.div 
        key={currentSlide}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.35 }}
        transition={{ duration: 1 }}
        className={`absolute inset-0 bg-gradient-to-br ${slide.gradient} pointer-events-none`}
      />

      {/* Header */}
      <div className="relative z-10 p-8 flex justify-between items-center transition-all duration-500">
        <div className="flex items-center gap-6">
          <Logo size={56} variant="light" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
          <div className="h-10 w-px bg-white/20"></div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">مرقاب الذكي</h1>
            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mt-1">Strategic Showcase 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-8">
            <button 
                onClick={exportToPDF}
                disabled={isExporting}
                className="flex items-center gap-3 px-6 h-14 rounded-[1.25rem] bg-white/5 hover:bg-white/10 transition-all border border-white/10 group active:scale-95 disabled:opacity-50"
                title="تصدير الشريحة كـ PDF"
            >
                <Download size={20} className={isExporting ? 'animate-bounce' : ''} />
                <span className="text-sm font-black hidden md:inline">{isExporting ? 'جاري التصدير...' : 'تصدير PDF'}</span>
            </button>
            <div className="text-left" dir="ltr">
                <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Interactive Phase</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-black text-white">{currentSlide + 1 < 10 ? `0${currentSlide + 1}` : currentSlide + 1}</p>
                  <p className="text-lg font-bold text-white/20">/ {slides.length}</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="w-14 h-14 rounded-[1.25rem] bg-white/5 hover:bg-red-600/20 flex items-center justify-center transition-all border border-white/10 group active:scale-90"
            >
                <X size={28} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="flex-1 relative z-10 container mx-auto px-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentSlide}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-7xl flex flex-col items-center justify-center gap-10"
          >
            <div ref={slideRef} className="w-full flex flex-col items-center justify-center gap-10">
              <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Text Side */}
              <div className="space-y-8 text-right">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex p-5 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl"
                >
                  {slide.icon}
                </motion.div>
                
                <div className="space-y-4">
                  <motion.h2 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-4xl md:text-5xl lg:text-3xl font-black leading-tight text-white"
                  >
                    {slide.title}
                  </motion.h2>
                  <motion.h3 
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-xl lg:text-2xl font-black text-red-500"
                  >
                    {slide.subtitle}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-lg text-white/70 leading-relaxed max-w-xl"
                  >
                    {slide.description}
                  </motion.p>
                </div>

                {/* Features List */}
                <div className="grid grid-cols-1 gap-3">
                  {slide.features?.map((feature, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + (idx * 0.1) }}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-6 h-6 rounded-lg bg-red-600/20 text-red-500 flex items-center justify-center shrink-0 border border-red-500/20 group-hover:bg-red-600 group-hover:text-white transition-all">
                        <Zap size={12} />
                      </div>
                      <p className="font-bold text-sm text-white/80 group-hover:text-white transition-colors">{feature}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Preview Side */}
              <motion.div 
                initial={{ opacity: 0, x: -50, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="relative aspect-video lg:aspect-square w-full bg-black/40 rounded-[2.5rem] border border-white/10 p-1 shadow-2xl overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-red-600/10 via-transparent to-blue-600/10 pointer-events-none z-20"></div>
                {slide.preview}
              </motion.div>
            </div>
          </div>
        </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation */}
      <div className="relative z-10 p-10 flex items-center justify-between container mx-auto">
        <div className="flex gap-6">
          <button 
            disabled={currentSlide === slides.length - 1}
            onClick={nextSlide}
            className={`h-20 px-16 rounded-[2.25rem] font-black text-lg flex items-center gap-6 transition-all active:scale-95 shadow-2xl ${currentSlide === slides.length - 1 ? 'opacity-20 cursor-not-allowed bg-white/5' : 'bg-white text-slate-900 hover:-translate-y-1 shadow-white/5'}`}
          >
            <span>التالي</span>
            <ChevronLeft size={28} />
          </button>
          <button 
            disabled={currentSlide === 0}
            onClick={prevSlide}
            className={`h-20 w-20 rounded-[2.25rem] border-2 border-white/10 flex items-center justify-center transition-all active:scale-90 ${currentSlide === 0 ? 'opacity-20 cursor-not-allowed' : 'hover:bg-white/5 hover:border-white/30'}`}
          >
            <ChevronRight size={28} />
          </button>
        </div>

        <div className="flex gap-4">
          {slides.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-700 ${currentSlide === idx ? 'w-16 bg-red-600 shadow-[0_0_15px_rgba(200,16,46,0.5)]' : 'w-4 bg-white/10 hover:bg-white/20'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PresentationMode;
