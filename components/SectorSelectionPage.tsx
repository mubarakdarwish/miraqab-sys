import React, { useState } from 'react';
import { User, ConsignmentType } from '../types';
import { CONSIGNMENT_LABELS, SECTOR_THEMES, SECTOR_IMAGES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from './Logo';

interface SectorSelectionPageProps {
  currentUser: User;
  onSelectSector: (sector: ConsignmentType) => void;
  onLogout: () => void;
}

const SectorSelectionPage: React.FC<SectorSelectionPageProps> = ({ currentUser, onSelectSector, onLogout }) => {
  const [hoveredSector, setHoveredSector] = useState<ConsignmentType | null>(null);
  const allowedSectors = currentUser.allowedSectors || [];

  const icons: Record<ConsignmentType, string> = {
    [ConsignmentType.VETERINARY]: 'fa-paw',
    [ConsignmentType.AGRICULTURAL]: 'fa-seedling',
    [ConsignmentType.FOOD_SAFETY]: 'fa-utensils'
  };

  const descriptions: Record<ConsignmentType, string> = {
    [ConsignmentType.VETERINARY]: 'نظام الرقابة الصحية على الحيوانات الحية والمنتجات الحيوانية الصادرة والواردة.',
    [ConsignmentType.AGRICULTURAL]: 'إجراءات الحجر الزراعي لضمان سلامة المحاصيل والمدخلات الزراعية من الآفات.',
    [ConsignmentType.FOOD_SAFETY]: 'الرقابة الفنية على جودة وسلامة المنتجات الغذائية المستوردة والمصدرة.',
  };

  const sectorNumbers: Record<ConsignmentType, string> = {
    [ConsignmentType.VETERINARY]: '01',
    [ConsignmentType.AGRICULTURAL]: '02',
    [ConsignmentType.FOOD_SAFETY]: '03'
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden font-tajawal text-right selection:bg-red-500/30" dir="rtl">
       
       {/* Dynamic Immersive Background */}
       <AnimatePresence mode="wait">
         <motion.div 
            key={hoveredSector || 'default'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-0 pointer-events-none"
         >
            {hoveredSector ? (
              <div className="absolute inset-0">
                <img referrerPolicy="no-referrer" 
                  src={SECTOR_IMAGES[hoveredSector]} 
                  className="w-full h-full object-cover blur-[80px] scale-110 opacity-60" 
                  alt=""
                />
                <div className={`absolute inset-0 bg-gradient-to-br ${SECTOR_THEMES[hoveredSector]} mix-blend-overlay opacity-40`}></div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-black to-slate-900">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40"></div>
         </motion.div>
       </AnimatePresence>

       {/* Floating Particles/Glow */}
       <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-1/4 -right-20 w-96 h-96 bg-red-600/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]"></div>
       </div>
       
       <div className="relative z-10 w-full max-w-7xl">
          <header className="flex flex-col md:flex-row items-center justify-between mb-20 gap-8">
             <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-6"
             >
                <div className="flex items-center gap-5 bg-white/90 backdrop-blur-2xl p-4 rounded-[2rem] border border-white/20 shadow-2xl">
                    <Logo size={56} variant="color" className="drop-shadow-xl" />
                    <div className="w-px h-10 bg-slate-200"></div>
                    <img referrerPolicy="no-referrer" 
                      src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                      alt="Ministry Logo" 
                      className="h-12 object-contain opacity-90" 
                    />
                    <div className="w-px h-10 bg-slate-200"></div>
                    <div className="text-right">
                        <h1 className="text-2xl font-black text-slate-800 leading-tight tracking-tight">مِرقاب</h1>
                        <p className="text-red-700 text-[9px] font-black uppercase tracking-[0.2em]">نظام الرقابة الذكي</p>
                    </div>
                </div>
             </motion.div>

             <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-center md:text-left"
             >
                <div className="inline-flex flex-col items-center md:items-end">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-2">جلسة عمل نشطة</span>
                    <h2 className="text-4xl font-black text-white mb-1">مرحباً، {currentUser.name.split(' ')[0]}</h2>
                    <p className="text-slate-400 font-bold text-sm">حدد نطاق العمل للمتابعة</p>
                </div>
             </motion.div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
             {allowedSectors.map((sector, idx) => (
                <motion.button 
                  key={sector} 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15, duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
                  onMouseEnter={() => setHoveredSector(sector)}
                  onMouseLeave={() => setHoveredSector(null)}
                  onClick={() => onSelectSector(sector)}
                  className="group relative h-[600px] rounded-[3.5rem] transition-all duration-700 overflow-hidden text-right flex flex-col border border-white/5 bg-white/5 backdrop-blur-sm hover:border-white/20 hover:shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                >
                   {/* Background Image with Parallax-like effect */}
                   <div className="absolute inset-0 z-0">
                      <img 
                        src={SECTOR_IMAGES[sector]} 
                        alt={CONSIGNMENT_LABELS[sector]} 
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                        referrerPolicy="no-referrer"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 transition-all duration-700`}></div>
                      <div className={`absolute inset-0 bg-gradient-to-br ${SECTOR_THEMES[sector]} mix-blend-multiply opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                   </div>

                   {/* Oversized Number Background */}
                   <div className="absolute top-10 left-10 z-0 pointer-events-none">
                      <span className="text-[180px] font-black text-white/5 leading-none select-none transition-all duration-700 group-hover:text-white/10 group-hover:-translate-y-4 inline-block">
                        {sectorNumbers[sector]}
                      </span>
                   </div>

                   {/* Content */}
                   <div className="relative z-10 p-12 mt-auto w-full flex flex-col h-full">
                      <div className="flex justify-between items-start mb-auto">
                         <div className={`w-20 h-20 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white text-4xl group-hover:bg-white group-hover:text-black transition-all duration-500 shadow-2xl`}>
                            <i className={`fas ${icons[sector]}`}></i>
                         </div>
                         <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-4 group-hover:translate-x-0">
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest bg-white/10 px-4 py-2 rounded-full border border-white/10">جاهز للعمل</span>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-5xl font-black text-white tracking-tighter group-hover:text-red-400 transition-colors duration-500">{CONSIGNMENT_LABELS[sector]}</h3>
                         <p className="text-slate-400 font-medium text-lg leading-relaxed max-w-[90%] group-hover:text-white transition-colors duration-500">
                            {descriptions[sector]}
                         </p>
                      </div>

                      <div className="mt-12 flex items-center gap-6">
                         <div className="flex-1 h-px bg-white/10 group-hover:bg-white/30 transition-colors"></div>
                         <div className="flex items-center gap-4">
                            <span className="text-xs font-black text-white uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                                دخول المنصة
                            </span>
                            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all duration-500 group-hover:rotate-[-45deg]">
                               <i className="fas fa-arrow-left text-xl"></i>
                            </div>
                         </div>
                      </div>
                   </div>
                </motion.button>
             ))}
          </div>

          <motion.footer 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-24 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-10 gap-8"
          >
             <div className="flex items-center gap-8">
                <div className="text-right">
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">حالة النظام</p>
                   <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                      <span className="text-xs font-bold text-emerald-500/80">متصل بالخادم الرئيسي</span>
                   </div>
                </div>
                <div className="w-px h-8 bg-white/10"></div>
                <div className="text-right">
                   <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">آخر تحديث</p>
                   <p className="text-xs font-bold text-white/60">اليوم، 09:42 ص</p>
                </div>
             </div>

             <button 
                onClick={onLogout} 
                className="group px-8 py-4 bg-white/5 hover:bg-red-500/10 border border-white/10 rounded-2xl text-slate-400 hover:text-red-500 font-black text-xs transition-all flex items-center gap-3 hover:border-red-500/30"
             >
                <i className="fas fa-power-off group-hover:rotate-90 transition-transform duration-500"></i>
                <span>إنهاء الجلسة والخروج الآمن</span>
             </button>
          </motion.footer>
       </div>
    </div>
  );
};

export default SectorSelectionPage;
