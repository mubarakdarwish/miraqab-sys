import React, { useRef, useState } from 'react';
import { 
  FileText, 
  Download, 
  Layout, 
  Cpu, 
  Users, 
  StickyNote, 
  Settings, 
  FlaskConical, 
  Truck, 
  BarChart3, 
  MessageSquare, 
  ShieldCheck,
  ChevronRight,
  Info,
  Monitor,
  Smartphone,
  MousePointer2,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Newspaper,
  Lock,
  Search,
  Filter,
  Eye,
  Shield,
  Wrench,
  BookOpen,
  Scale,
  Archive,
  FileSignature,
  Zap,
  Globe,
  Database,
  ArrowRight,
  Layers,
  Activity,
  Trophy,
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import pptxgen from 'pptxgenjs';
import Logo from './Logo';

interface UserGuideProps {
  targetSection?: string;
}

const UserGuide: React.FC<UserGuideProps> = ({ targetSection }) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  React.useEffect(() => {
    if (targetSection) {
      const element = document.getElementById(targetSection);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [targetSection]);

  const handleExportPdf = async () => {
      if (!printRef.current || isExporting) return;
      setIsExporting(true); 

      const element = printRef.current;
      
      // Inject temporary styles to fix html2canvas Arabic rendering bugs
      // and hide heavy CSS effects that cause missing components
      const style = document.createElement('style');
      style.id = 'pdf-export-fixes';
      style.innerHTML = `
          .pdf-export-mode {
              width: 1024px !important;
              max-width: 1024px !important;
              padding: 0 !important;
              margin: 0 auto !important;
              border: none !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              overflow: visible !important;
              background-color: #ffffff !important;
          }
          .pdf-export-mode .pdf-export-section {
              background-color: #ffffff !important;
              box-sizing: border-box !important;
              position: relative !important;
              overflow: visible !important;
          }
          .pdf-export-mode .blur-\\[120px\\],
          .pdf-export-mode .blur-\\[150px\\],
          .pdf-export-mode .blur-3xl,
          .pdf-export-mode .blur-2xl {
              display: none !important;
          }
          .pdf-export-mode .text-justify {
              text-align: right !important;
          }
          .pdf-export-mode .tracking-tight,
          .pdf-export-mode .tracking-tighter {
              letter-spacing: normal !important;
          }
          /* Force grids to desktop mode during export for A4 fit */
          .pdf-export-mode .md\\:grid-cols-2, .pdf-export-mode .lg\\:grid-cols-2 {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .pdf-export-mode .md\\:grid-cols-3, .pdf-export-mode .lg\\:grid-cols-3 {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          .pdf-export-mode .md\\:grid-cols-4 {
              grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .pdf-export-mode .md\\:flex-row {
              flex-direction: row !important;
          }
      `;
      document.head.appendChild(style);

      // Temporarily modify classes for perfect PDF rendering
      element.classList.add('pdf-export-mode');

      try {
          // Allow a brief moment for styles to apply before capturing
          await new Promise(resolve => setTimeout(resolve, 800));

          const opt = {
              margin:       [15, 15, 15, 15] as [number, number, number, number],
              filename:     'MIRQAB_User_Manual_v4.0_Elite.pdf',
              image:        { type: 'jpeg' as const, quality: 1.0 },
              html2canvas:  { 
                  scale: 3, 
                  useCORS: true, 
                  logging: false,
                  width: 1024,
                  windowWidth: 1024,
                  allowTaint: true,
                  backgroundColor: '#ffffff',
                  letterRendering: false
              },
              jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
              pagebreak:    { mode: ['css', 'legacy'], avoid: ['.break-inside-avoid'], after: ['.break-after-page'] }
          };

          await html2pdf().set(opt).from(element).save();

      } catch (error) {
          console.error("PDF Export Error:", error);
          alert("حدث خطأ أثناء تصدير الدليل");
      } finally {
          element.classList.remove('pdf-export-mode');
          const injectedStyle = document.getElementById('pdf-export-fixes');
          if (injectedStyle) injectedStyle.remove();
          setIsExporting(false);
      }
  };

  const handleExportPptx = async () => {
      if (isExporting) return;
      setIsExporting(true);
      try {
          const pptx = new pptxgen();
          pptx.layout = 'LAYOUT_16x9';
          pptx.author = 'Ministry of Agriculture, Fisheries and Water Resources';
          pptx.company = 'MIRQAB SMART SYSTEM';
          pptx.title = 'MIRQAB User Guide';

          // Cover Slide
          const coverSlide = pptx.addSlide();
          coverSlide.background = { color: 'F8F9FB' };
          coverSlide.addText('مرقاب', { x: 1, y: 2, w: '80%', h: 1.5, fontSize: 64, bold: true, color: '0F172A', align: 'center', rtlMode: true });
          coverSlide.addText('MIRQAB SMART SYSTEM', { x: 1, y: 3.5, w: '80%', h: 0.5, fontSize: 18, color: '64748B', align: 'center' });
          coverSlide.addText('دليل التشغيل والاستخدام المتكامل', { x: 1, y: 4.5, w: '80%', h: 1, fontSize: 32, bold: true, color: '0F172A', align: 'center', rtlMode: true });
          coverSlide.addText('VERSION 4.0.0 ELITE EDITION', { x: 1, y: 5.5, w: '80%', h: 0.5, fontSize: 12, color: '6366F1', align: 'center' });

          const sections = [
              { title: "مقدمة وفلسفة النظام", content: "نظام مرقاب هو منصة رقمية متكاملة مصممة لإحداث ثورة في إدارة عمليات الحجر الزراعي والبيطري وسلامة الغذاء. يهدف النظام إلى تسريع الإجراءات، تقليل التدخل البشري، ورفع مستوى الدقة والشفافية." },
              { title: "دليل البدء السريع", content: "1. تسجيل الدخول باستخدام بيانات الاعتماد الخاصة بك.\n2. اختيار القطاع (زراعي، بيطري، سلامة الغذاء).\n3. الوصول إلى لوحة القيادة للبدء في إدارة الإرساليات." },
              { title: "لوحة القيادة الذكية", content: "توفر لوحة القيادة نظرة شاملة على جميع الأنشطة، الإرساليات المعلقة، الإحصائيات اليومية، والتنبيهات الهامة. تم تصميمها لتوفير المعلومات الحيوية بلمحة بصر." },
              { title: "بوابة المعاملات (السجل)", content: "القلب النابض للنظام. هنا يتم تسجيل، تتبع، وإدارة جميع الإرساليات الواردة والصادرة. يمكنك البحث، التصفية، وعرض تفاصيل كل إرسالية." },
              { title: "إدارة العينات والمختبر", content: "تتبع العينات المسحوبة من الإرساليات، إرسالها للمختبرات، واستلام النتائج آلياً. يضمن هذا النظام عدم ضياع أي عينة وتسريع عملية الإفراج." },
              { title: "البوابة اللوجستية", content: "إدارة حركة الشاحنات، الحاويات، وتصاريح الدخول والخروج. يربط النظام بين المفتشين، التخليص الجمركي، والجهات الأمنية في الميناء." },
              { title: "التحليلات والذكاء الاصطناعي", content: "استخدام خوارزميات متقدمة لتحليل البيانات التاريخية، التنبؤ بالمخاطر، وتقديم توصيات ذكية للمفتشين لدعم اتخاذ القرار." },
              { title: "التقارير والإحصائيات", content: "توليد تقارير شاملة ومخصصة بنقرة زر. تصدير البيانات إلى Excel أو PDF، وعرض رسوم بيانية تفاعلية للأداء." },
              { title: "الإدارة والتحكم المتقدم", content: "أدوات خاصة بمديري النظام لإدارة المستخدمين، الصلاحيات، الإعدادات العامة، ومراقبة سجلات النظام (Audit Logs)." }
          ];

          sections.forEach(sec => {
              const slide = pptx.addSlide();
              slide.background = { color: 'FFFFFF' };
              slide.addText(sec.title, { x: 0.5, y: 0.5, w: '90%', h: 1, fontSize: 32, bold: true, color: '4F46E5', align: 'right', rtlMode: true });
              slide.addText(sec.content, { x: 0.5, y: 2, w: '90%', h: 4, fontSize: 20, color: '334155', align: 'right', rtlMode: true, valign: 'top' });
          });

          await pptx.writeFile({ fileName: 'MIRQAB_User_Manual_v4.0_Elite.pptx' });
      } catch (error) {
          console.error("PPTX Export Error:", error);
          alert("حدث خطأ أثناء تصدير العرض التقديمي");
      } finally {
          setIsExporting(false);
      }
  };

  const ScreenshotPlaceholder = ({ label, icon: Icon, imageUrl }: { label: string, icon?: any, imageUrl?: string }) => (
      <div className="my-12 border border-slate-200 rounded-[2.5rem] bg-slate-50/50 p-4 flex flex-col items-center justify-center text-slate-400 group hover:border-indigo-200 hover:bg-indigo-50/30 transition-all break-inside-avoid overflow-hidden shadow-sm relative">
          <div className="absolute top-4 left-4 flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
              <div className="w-2 h-2 rounded-full bg-slate-200"></div>
          </div>
          {imageUrl ? (
              <div className="w-full pt-6">
                  <img referrerPolicy="no-referrer" src={imageUrl} alt={label} className="w-full h-auto rounded-2xl object-cover border border-slate-200 shadow-sm" crossOrigin="anonymous" />
                  <div className="flex items-center justify-center gap-3 mt-6 mb-2">
                      <div className="h-px w-12 bg-slate-200"></div>
                      <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">{label}</p>
                      <div className="h-px w-12 bg-slate-200"></div>
                  </div>
              </div>
          ) : (
              <div className="py-20 flex flex-col items-center">
                  <div className="w-24 h-24 bg-white rounded-[2rem] shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform border border-slate-100">
                      {Icon ? <Icon className="w-10 h-10 text-slate-300 group-hover:text-indigo-500" /> : <FileText className="w-10 h-10 text-slate-300" />}
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
                  <p className="text-[10px] mt-3 opacity-60 font-bold uppercase tracking-widest">System Interface Visualization Area</p>
              </div>
          )}
      </div>
  );

  const GuideSection = ({ title, icon: Icon, children, id, badge, color = "indigo" }: any) => (
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        id={id} 
        className="mb-24 scroll-mt-32 relative pdf-export-section"
      >
          {/* Section Background Decoration */}
          <div className={`absolute -top-10 -right-10 w-64 h-64 bg-${color}-50/50 rounded-full blur-3xl -z-10 pointer-events-none opacity-50`}></div>
          
          <div className="flex items-end justify-between mb-10 border-b-2 border-slate-100 pb-6">
              <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-${color}-200 relative overflow-hidden group`}>
                      <div className={`absolute inset-0 bg-gradient-to-br from-${color}-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                      <Icon className="w-8 h-8 relative z-10" />
                  </div>
                  <div>
                      <h3 className="font-black text-4xl text-slate-900 tracking-tighter leading-none mb-2">{title}</h3>
                      <div className="flex items-center gap-2">
                          <div className={`h-1 w-12 bg-${color}-500 rounded-full`}></div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Module Documentation</p>
                      </div>
                  </div>
              </div>
              {badge && (
                  <span className={`bg-${color}-50 text-${color}-600 text-[11px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-${color}-100 shadow-sm`}>
                      {badge}
                  </span>
              )}
          </div>
          <div className="text-[16px] text-slate-600 leading-[1.9] space-y-8 text-justify px-4 font-medium">
              {children}
          </div>
      </motion.div>
  );

  const ProTip = ({ children }: { children: React.ReactNode }) => (
      <div className="bg-indigo-50/50 border-r-4 border-indigo-500 p-6 rounded-2xl my-8 flex gap-4 items-start break-inside-avoid">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
              <Zap className="w-5 h-5" />
          </div>
          <div>
              <h5 className="font-black text-indigo-900 text-xs uppercase tracking-widest mb-1">نصيحة احترافية (Pro Tip)</h5>
              <div className="text-sm text-indigo-800 leading-relaxed font-bold">{children}</div>
          </div>
      </div>
  );

  const WarningBox = ({ children }: { children: React.ReactNode }) => (
      <div className="bg-rose-50/50 border-r-4 border-rose-500 p-6 rounded-2xl my-8 flex gap-4 items-start break-inside-avoid">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
              <AlertCircle className="w-5 h-5" />
          </div>
          <div>
              <h5 className="font-black text-rose-900 text-xs uppercase tracking-widest mb-1">تنبيه هام (Warning)</h5>
              <div className="text-sm text-rose-800 leading-relaxed font-bold">{children}</div>
          </div>
      </div>
  );

  const StepList = ({ steps }: { steps: { title: string, desc: string }[] }) => (
      <div className="space-y-6 my-10">
          {steps.map((step, idx) => (
              <div key={idx} className="flex gap-6 items-start group break-inside-avoid">
                  <div className="flex flex-col items-center shrink-0">
                      <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-lg group-hover:scale-110 transition-transform">
                          {idx + 1}
                      </div>
                      {idx !== steps.length - 1 && <div className="w-0.5 h-12 bg-slate-100 mt-2"></div>}
                  </div>
                  <div className="pt-1">
                      <h5 className="font-black text-slate-900 text-lg mb-1 tracking-tight">{step.title}</h5>
                      <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                  </div>
              </div>
          ))}
      </div>
  );

  return (
    <div className="space-y-12 animate-fade-in pb-32 font-tajawal bg-[#F8F9FB] min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
        {/* Header Actions - Floating Glassmorphism */}
        <div className="max-w-7xl mx-auto px-6 pt-10">
            <div className="bg-white/70 backdrop-blur-2xl p-5 md:p-7 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-white/50 flex flex-col md:flex-row justify-between items-center gap-6 print:hidden sticky top-6 z-50">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-slate-900 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <FileText className="w-8 h-8 relative z-10" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-0.5">
                            <h3 className="font-black text-2xl text-slate-900 tracking-tighter">دليل المستخدم النخبة</h3>
                            <span className="bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">v4.0 ELITE</span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.4em]">MIRQAB SMART DOCUMENTATION ENGINE</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <button 
                        onClick={handleExportPptx}
                        disabled={isExporting}
                        className="bg-orange-600 text-white px-8 py-4 rounded-[1.8rem] font-black text-xs shadow-2xl hover:bg-orange-700 transition-all flex items-center gap-3 disabled:opacity-50 w-full md:w-auto justify-center group active:scale-95"
                    >
                        {isExporting ? <Clock className="w-5 h-5 animate-spin" /> : <Monitor className="w-5 h-5 group-hover:translate-y-1 transition-transform" />}
                        <span className="uppercase tracking-widest">تصدير كعرض تقديمي (PPTX)</span>
                    </button>
                    <button 
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="bg-slate-900 text-white px-8 py-4 rounded-[1.8rem] font-black text-xs shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3 disabled:opacity-50 w-full md:w-auto justify-center group active:scale-95"
                    >
                        {isExporting ? <Clock className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" />}
                        <span className="uppercase tracking-widest">تصدير النسخة الفاخرة (PDF)</span>
                    </button>
                </div>
            </div>
        </div>

        {/* Guide Content - Immersive Layout */}
        <div ref={printRef} dir="rtl" className="bg-white p-8 md:p-16 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.08)] border border-slate-100 max-w-5xl mx-auto min-h-[297mm] relative overflow-hidden">
            
            {/* Immersive Background Elements */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-50/40 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-50 rounded-full translate-y-1/2 -translate-x-1/2 blur-[150px] pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.02] pointer-events-none">
                <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
            </div>

            {/* Cover Page - Radical Redesign */}
            <div className="pdf-export-section min-h-[260mm] flex flex-col justify-between py-16 relative z-10 break-after-page">
                <div className="text-center">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-16"
                    >
                        <img referrerPolicy="no-referrer" 
                            src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                            alt="Ministry Logo" 
                            className="h-32 mx-auto object-contain drop-shadow-sm" 
                            crossOrigin="anonymous" 
                        />
                    </motion.div>
                    
                    <div className="space-y-8 mb-20">
                        <div className="inline-flex items-center gap-4 bg-slate-900 text-white px-6 py-2 rounded-full mb-4">
                            <Zap className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em]">The Future of Border Control</span>
                        </div>
                        <h1 className="text-[6rem] md:text-[8rem] font-black text-slate-900 tracking-tighter leading-[0.8] mb-4">مرقاب</h1>
                        <div className="flex items-center justify-center gap-4">
                            <div className="h-px w-12 bg-slate-200"></div>
                            <h2 className="text-2xl md:text-3xl text-slate-400 font-light tracking-[0.3em] uppercase">MIRQAB SMART SYSTEM</h2>
                            <div className="h-px w-12 bg-slate-200"></div>
                        </div>
                    </div>

                    <div className="relative inline-block group">
                        <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative bg-slate-900 text-white px-16 py-10 rounded-[3rem] shadow-2xl border border-white/10">
                            <p className="text-3xl font-black mb-3 tracking-tight">دليل التشغيل والاستخدام المتكامل</p>
                            <div className="flex items-center justify-center gap-4">
                                <span className="text-xs text-indigo-300 font-black uppercase tracking-[0.3em]">VERSION 4.0.0 ELITE EDITION</span>
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                <span className="text-xs text-slate-400 font-black uppercase tracking-[0.3em]">2026 RELEASE</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-100 pt-16">
                    <div className="text-right border-r-4 border-slate-900 pr-10">
                        <p className="text-slate-900 font-black text-xl md:text-2xl mb-3">وزارة الثروة الزراعية والسمكية وموارد المياه</p>
                        <p className="text-slate-500 text-sm md:text-base font-bold leading-relaxed max-w-md">
                            المديرية العامة للثروة الزراعية والسمكية وموارد المياه بمحافظة شمال الباطنة<br/>
                            قسم الحجر وسلامة الغذاء - ميناء صحار
                        </p>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-4">
                        <div className="flex items-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                            <span>CONFIDENTIAL</span>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                            <span>OFFICIAL USE</span>
                        </div>
                        <div className="w-32 h-1 bg-gradient-to-r from-transparent to-slate-900 rounded-full"></div>
                    </div>
                </div>
            </div>

            {/* Table of Contents - Radical Grid */}
            <div className="pdf-export-section mb-32 bg-slate-50/50 p-16 rounded-[4rem] border border-slate-100 break-after-page relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                    <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)', backgroundSize: '60px 60px', backgroundPosition: '0 0, 30px 30px' }}></div>
                </div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-6 mb-16">
                        <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                            <Layers className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="font-black text-4xl text-slate-900 tracking-tighter">خارطة الطريق المعرفية</h3>
                            <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em] mt-1">Comprehensive System Navigation Index</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { id: "intro", title: "مقدمة وفلسفة النظام", page: "01", icon: Info },
                            { id: "quickstart", title: "دليل البدء السريع", page: "03", icon: Zap },
                            { id: "dashboard", title: "لوحة القيادة الذكية", page: "05", icon: Layout },
                            { id: "portal", title: "بوابة المعاملات (السجل)", page: "08", icon: FileText },
                            { id: "sampling", title: "إدارة العينات والمختبر", page: "12", icon: FlaskConical },
                            { id: "logistics", title: "البوابة اللوجستية", page: "15", icon: Truck },
                            { id: "analytics", title: "التحليلات والذكاء الاصطناعي", page: "18", icon: Cpu },
                            { id: "reports", title: "التقارير والإحصائيات", page: "22", icon: FileSpreadsheet },
                            { id: "admin", title: "الإدارة والتحكم المتقدم", page: "26", icon: Settings },
                            { id: "protips", title: "نصائح احترافية لكل دور", page: "30", icon: Sparkles },
                        ].map((item, idx) => (
                            <a key={idx} href={`#${item.id}`} className="group bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors flex items-center justify-center">
                                        <item.icon className="w-4 h-4" />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-300 group-hover:text-indigo-300 transition-colors uppercase tracking-widest">PAGE {item.page}</span>
                                </div>
                                <h4 className="font-black text-slate-800 text-base tracking-tight group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                                <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">انتقل للقسم</span>
                                    <ArrowRight className="w-2.5 h-2.5 text-indigo-500" />
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section 1: Introduction */}
            <GuideSection id="intro" title="1. فلسفة ورؤية مرقاب" icon={Globe} badge="الرؤية الاستراتيجية">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <p className="text-xl font-bold text-slate-800 leading-relaxed">
                            نظام مرقاب ليس مجرد أداة لإدخال البيانات، بل هو "العقل الرقمي" الذي يدير أمن المنافذ الحدودية.
                        </p>
                        <p>
                            تم بناء النظام على ركائز ثلاث: <strong>الشفافية المطلقة</strong>، <strong>السرعة الفائقة</strong>، و<strong>الأمان الحيوي</strong>. يهدف مرقاب إلى أتمتة كافة العمليات الرقابية، مما يضمن دقة اتخاذ القرار وتقليل التدخل البشري في العمليات الروتينية، مع توفير أدوات تحليلية متقدمة للمسؤولين.
                        </p>
                        <div className="flex gap-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-1">
                                <Activity className="w-6 h-6 text-indigo-600 mb-2" />
                                <h5 className="font-black text-slate-900 text-sm mb-1">كفاءة تشغيلية</h5>
                                <p className="text-[11px] text-slate-500">تقليل زمن المعالجة بنسبة 45% من خلال الأتمتة الذكية.</p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-1">
                                <ShieldCheck className="w-6 h-6 text-emerald-600 mb-2" />
                                <h5 className="font-black text-slate-900 text-sm mb-1">أمن حيوي</h5>
                                <p className="text-[11px] text-slate-500">تتبع دقيق بنسبة 100% لكافة الإرساليات عالية المخاطر.</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10 text-center">
                                <Logo size={120} variant="light" className="mx-auto mb-8 drop-shadow-2xl" />
                                <h4 className="text-2xl font-black mb-4 tracking-tight">الهوية البصرية والمفهوم</h4>
                                <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                    اسم "مرقاب" يرمز للعين الساهرة التي لا تنام. الشعار يدمج بين درع الحماية وعدسة المراقبة، ليعكس التوازن بين التسهيلات التجارية والرقابة الصارمة.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </GuideSection>

            {/* Section 2: Quick Start */}
            <GuideSection id="quickstart" title="2. دليل البدء السريع" icon={Zap} badge="للمستخدمين الجدد" color="amber">
                <p>للبدء في استخدام النظام بفعالية، اتبع هذه الخطوات الأساسية للوصول والإعداد الأولي:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-10">
                    <div className="space-y-8">
                        <StepList steps={[
                            { title: "الوصول للنظام", desc: "افتح المتصفح وأدخل الرابط الرسمي. نوصي باستخدام Google Chrome للحصول على أفضل أداء." },
                            { title: "تسجيل الدخول", desc: "أدخل اسم المستخدم وكلمة المرور الخاصة بك. سيتم توجيهك تلقائياً للوحة القيادة." },
                            { title: "تثبيت التطبيق (PWA)", desc: "من شريط العنوان، اختر 'تثبيت' لتحويل النظام لتطبيق سطح مكتب سريع الوصول." },
                            { title: "تخصيص الواجهة", desc: "قم بترتيب الودجات في لوحة القيادة حسب أولويات عملك اليومي." }
                        ]} />
                    </div>
                    <div className="bg-slate-50 rounded-[3rem] p-10 border border-slate-100">
                        <h4 className="font-black text-slate-900 text-xl mb-6 flex items-center gap-3">
                            <Monitor className="w-6 h-6 text-amber-600" />
                            متطلبات التشغيل المثالية
                        </h4>
                        <div className="space-y-4">
                            {[
                                { label: "المتصفح", value: "Chrome v90+ / Edge v90+" },
                                { label: "الشاشة", value: "1920x1080 (موصى به)" },
                                { label: "الإنترنت", value: "اتصال مستقر (5Mbps+)" },
                                { label: "الأمان", value: "تفعيل ملفات تعريف الارتباط" }
                            ].map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b border-slate-200 pb-3">
                                    <span className="text-sm font-bold text-slate-500">{item.label}</span>
                                    <span className="text-sm font-black text-slate-800">{item.value}</span>
                                </div>
                            ))}
                        </div>
                        <ProTip>
                            يمكنك استخدام النظام عبر الجهاز اللوحي (Tablet) أثناء التفتيش الميداني في الساحة لتوثيق النتائج لحظياً.
                        </ProTip>
                    </div>
                </div>
            </GuideSection>

            {/* Section 3: Dashboard */}
            <GuideSection id="dashboard" title="3. لوحة القيادة الذكية (Bento)" icon={Layout} badge="تحديث v4.0">
                <p>لوحة القيادة هي مركز العمليات، حيث توفر رؤية 360 درجة لكافة أنشطة المنفذ من خلال نظام الودجات المرن.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-12">
                    <div className="lg:col-span-2">
                        <ScreenshotPlaceholder label="واجهة لوحة القيادة بنظام Bento Grid" icon={Layout} />
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                            <h5 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-indigo-600" />
                                الودجات الرئيسية
                            </h5>
                            <ul className="space-y-4">
                                <li className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-black text-xs">01</div>
                                    <p className="text-xs text-slate-600"><strong>إحصائيات اليوم:</strong> ملخص الأرقام الحية للمعاملات والمنجز.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-black text-xs">02</div>
                                    <p className="text-xs text-slate-600"><strong>حالة الفريق:</strong> قائمة المفتشين المتواجدين وحالة نشاطهم.</p>
                                </li>
                                <li className="flex gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 font-black text-xs">03</div>
                                    <p className="text-xs text-slate-600"><strong>تنبيهات المختبر:</strong> متابعة العينات المتأخرة أو الجاهزة.</p>
                                </li>
                            </ul>
                        </div>
                        <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl">
                            <h5 className="font-black text-indigo-400 text-xs uppercase tracking-widest mb-3">ميزة التخصيص</h5>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                اضغط مطولاً على أي ودجت واسحبها لتغيير مكانها. يمكنك أيضاً تغيير حجم الودجت من الزاوية السفلية لتناسب احتياجات العرض الخاصة بك.
                            </p>
                        </div>
                    </div>
                </div>
            </GuideSection>

            {/* Section 4: Consignment Portal */}
            <GuideSection id="portal" title="4. بوابة المعاملات (السجل اليومي)" icon={FileText} badge="المحرك الرئيسي">
                <p>هذا القسم هو قلب النظام، حيث يتم تسجيل ومتابعة كافة الإرساليات. تم تصميم الواجهة لتكون سريعة، دقيقة، وقابلة للبحث الشامل.</p>
                
                <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm my-10">
                    <div className="bg-slate-900 p-8 text-white">
                        <h4 className="text-2xl font-black tracking-tight mb-2">دورة حياة المعاملة</h4>
                        <p className="text-xs text-slate-400 uppercase tracking-widest">Transaction Lifecycle Management</p>
                    </div>
                    <div className="p-10 grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line */}
                        <div className="hidden md:block absolute top-1/2 left-10 right-10 h-0.5 bg-slate-100 -translate-y-1/2 -z-10"></div>
                        
                        {[
                            { title: "التسجيل", icon: FileSignature, desc: "إدخال رقم البيان والبيانات الأساسية" },
                            { title: "التفتيش", icon: Search, desc: "المعاينة الظاهرية وسحب العينات" },
                            { title: "المختبر", icon: FlaskConical, desc: "انتظار النتائج والتحقق الفني" },
                            { title: "الإفراج", icon: ShieldCheck, desc: "صدور القرار النهائي والطباعة" }
                        ].map((step, idx) => (
                            <div key={idx} className="text-center group">
                                <div className="w-16 h-16 bg-white border-2 border-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:border-indigo-500 group-hover:scale-110 transition-all shadow-sm">
                                    <step.icon className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                </div>
                                <h5 className="font-black text-slate-900 text-sm mb-1">{step.title}</h5>
                                <p className="text-[10px] text-slate-500 leading-tight">{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-10">
                    <div>
                        <h4 className="font-black text-slate-900 text-xl mb-6 flex items-center gap-3">
                            <History className="w-6 h-6 text-indigo-600" />
                            سجل التدقيق (Audit Log) - التفاصيل الدقيقة
                        </h4>
                        <p className="mb-6">
                            كل معاملة تمتلك "صندوقاً أسود" يسجل كل تعديل. هذا السجل لا يمكن حذفه أو التلاعب به، وهو المرجع الأول في حال وجود استفسارات حول قرار فني معين.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                                <h5 className="font-bold text-slate-800 text-sm mb-3">ماذا يتم تسجيله؟</h5>
                                <ul className="text-xs text-slate-600 space-y-2">
                                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500"></div> اسم المستخدم القائم بالإجراء</li>
                                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500"></div> الوقت والتاريخ بالثانية</li>
                                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500"></div> القيمة السابقة والقيمة الجديدة</li>
                                    <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-indigo-500"></div> نوع الجهاز المستخدم في الإجراء</li>
                                </ul>
                            </div>
                            <div className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl">
                                <h5 className="font-bold text-indigo-300 text-sm mb-3">أهمية السجل الرقابي</h5>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    يساعد السجل في تحليل الأداء، تحديد المسؤوليات، وضمان الشفافية المطلقة أمام الجهات الرقابية. كما يسهل عملية "التسليم والاستلام" بين الورديات من خلال مراجعة آخر الإجراءات.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <WarningBox>
                    تأكد دائماً من إدخال رقم البيان الجمركي بشكل صحيح، حيث يعتمد النظام عليه كمعرف وحيد لربط كافة المستندات والنتائج المخبرية.
                </WarningBox>
            </GuideSection>

            {/* Section 5: Lab Management */}
            <GuideSection id="sampling" title="5. إدارة العينات والمختبر" icon={FlaskConical} badge="الأمن الغذائي" color="emerald">
                <p>نظام إدارة العينات يربط الميدان بالمختبر بشكل رقمي كامل، مما يقلل من احتمالية الخطأ البشري ويسرع من تدفق المعلومات.</p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 my-10">
                    <div>
                        <h4 className="font-black text-slate-900 text-lg mb-6">إجراءات سحب العينات</h4>
                        <div className="space-y-4">
                            {[
                                { title: "توليد رقم العينة", desc: "يقوم النظام بتوليد باركود فريد لكل عينة لضمان التتبع." },
                                { title: "تحديد نوع الفحص", desc: "اختيار الفحوصات المطلوبة (ميكروبيولوجي، كيميائي، بقايا مبيدات)." },
                                { title: "إرسال الإشعار", desc: "يصل إشعار فوري للمختبر بوجود عينة قادمة مع كافة تفاصيلها." },
                                { title: "توثيق النتائج", desc: "يقوم فني المختبر بإدخال النتيجة مباشرة وإرفاق شهادة التحليل." }
                            ].map((item, idx) => (
                                <div key={idx} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-emerald-200 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-black">{idx + 1}</div>
                                    <div>
                                        <h6 className="font-bold text-slate-800 text-sm">{item.title}</h6>
                                        <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-emerald-950 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
                        <Trophy className="w-12 h-12 text-emerald-400 mb-6" />
                        <h4 className="text-2xl font-black mb-4">نظام مراقبة الأداء (SLA)</h4>
                        <p className="text-sm text-emerald-200/70 leading-relaxed mb-8">
                            يراقب النظام الوقت المستغرق في المختبر لكل نوع من أنواع الفحوصات. إذا تجاوزت العينة الوقت المسموح به، يتم تصعيدها تلقائياً في لوحة القيادة لضمان عدم تأخر الإفراج عن الشحنات.
                        </p>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                                <span>فحص ظاهري</span>
                                <span className="font-black text-emerald-400">فوري</span>
                            </div>
                            <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                                <span>فحص ميكروبيولوجي</span>
                                <span className="font-black text-emerald-400">48 - 72 ساعة</span>
                            </div>
                            <div className="flex justify-between text-xs border-b border-white/10 pb-2">
                                <span>بقايا مبيدات</span>
                                <span className="font-black text-emerald-400">24 ساعة</span>
                            </div>
                        </div>
                    </div>
                </div>
            </GuideSection>

            {/* Section 6: Analytics & AI */}
            <GuideSection id="analytics" title="6. التحليلات والذكاء الاصطناعي" icon={Cpu} badge="مدعوم بـ Gemini 3" color="indigo">
                <p>نظام مرقاب v4.0 يدمج محرك الذكاء الاصطناعي Gemini 3 Flash لتقديم رؤى استباقية وتحليلات عميقة للبيانات.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-10">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col justify-between group hover:bg-indigo-950 transition-colors shadow-xl">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                            <Activity className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h5 className="font-black text-xl mb-2">تحليل الأنماط</h5>
                            <p className="text-xs text-slate-400 leading-relaxed">اكتشاف الأنماط المتكررة في رفض الشحنات حسب المنشأ أو المستورد وتقديم توصيات رقابية.</p>
                        </div>
                    </div>
                    <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex flex-col justify-between shadow-xl">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                            <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h5 className="font-black text-xl mb-2">التنبؤ بالضغط</h5>
                            <p className="text-xs text-indigo-100 leading-relaxed">توقع فترات الذروة في المنفذ بناءً على البيانات التاريخية وجدولة المفتشين بشكل استباقي.</p>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-indigo-200 transition-colors">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-indigo-50 transition-colors">
                            <MessageSquare className="w-6 h-6 text-slate-400 group-hover:text-indigo-600" />
                        </div>
                        <div>
                            <h5 className="font-black text-slate-900 text-xl mb-2">المساعد الصوتي</h5>
                            <p className="text-xs text-slate-500 leading-relaxed">إمكانية طرح أسئلة صوتية أو نصية باللغة الطبيعية والحصول على إحصائيات فورية دون الحاجة للبحث اليدوي.</p>
                        </div>
                    </div>
                </div>
                
                <ScreenshotPlaceholder label="واجهة التحليلات الذكية والتقارير الرسومية" icon={BarChart3} />
            </GuideSection>

            {/* Section 7: Reports */}
            <GuideSection id="reports" title="7. التقارير والإحصائيات" icon={FileSpreadsheet} badge="محرك التقارير v2.0">
                <p>استخراج البيانات هو أحد أهم وظائف النظام. يوفر مرقاب محرك تقارير مرن يتيح لك بناء تقريرك الخاص وتصديره بضغطة زر.</p>
                
                <div className="bg-slate-50 rounded-[3rem] p-12 border border-slate-100 my-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div>
                            <h4 className="font-black text-slate-900 text-xl mb-6">خطوات إنشاء تقرير مخصص</h4>
                            <StepList steps={[
                                { title: "اختيار نوع التقرير", desc: "اختر بين ملخص إحصائي، كشف تفصيلي، أو تقرير أداء المفتشين." },
                                { title: "تحديد الفلاتر", desc: "حدد النطاق الزمني، القطاع، المنفذ، أو حتى مستورد معين." },
                                { title: "تخصيص الأعمدة", desc: "اختر فقط البيانات التي تهمك في التقرير لتقليل الضوضاء." },
                                { title: "التصدير والطباعة", desc: "اختر صيغة التصدير (Excel أو PDF) أو قم بالطباعة المباشرة." }
                            ]} />
                        </div>
                        <div className="space-y-6">
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                                <h5 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-indigo-600" />
                                    الفلاتر المتقدمة
                                </h5>
                                <p className="text-sm text-slate-500 leading-relaxed mb-6">
                                    يمكنك الآن الفلترة حسب "المجموعة السلعية" (مثل: الخضروات، اللحوم، المبيدات) للحصول على إحصائيات دقيقة جداً لكل صنف.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {["التاريخ", "القطاع", "المنفذ", "المستورد", "الحالة", "المفتش"].map((tag, i) => (
                                        <span key={i} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100">
                                <h5 className="font-black text-indigo-900 text-lg mb-4 flex items-center gap-2">
                                    <Download className="w-5 h-5 text-indigo-600" />
                                    التصدير الفاخر
                                </h5>
                                <p className="text-sm text-indigo-800 leading-relaxed">
                                    تقارير PDF المصدرة من النظام مصممة لتكون رسمية وجاهزة للتقديم للإدارة العليا، مع شعار الوزارة وتنسيق احترافي يتضمن الجداول والرسوم البيانية.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </GuideSection>

            {/* Section 8: Admin & Security */}
            <GuideSection id="admin" title="8. الإدارة والتحكم المتقدم" icon={Settings} badge="صلاحيات المشرفين" color="slate">
                <p>لوحة تحكم المشرفين تتيح إدارة المستخدمين، الصلاحيات، والإعدادات العامة للنظام لضمان استمرارية العمل وأمان البيانات.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-10">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-indigo-300 transition-colors">
                        <Users className="w-10 h-10 text-indigo-600 mb-6" />
                        <h5 className="font-black text-slate-900 text-xl mb-3">إدارة الأدوار (RBAC)</h5>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            توزيع الصلاحيات بناءً على الدور الوظيفي. لا يمكن للمفتش الوصول لإعدادات النظام، ولا يمكن لموظف المختبر تعديل بيانات المعاملة الأساسية. هذا يضمن "مبدأ الأقل صلاحية" (Least Privilege).
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-emerald-300 transition-colors">
                        <Lock className="w-10 h-10 text-emerald-600 mb-6" />
                        <h5 className="font-black text-slate-900 text-xl mb-3">أمن البيانات والتشفير</h5>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            كافة البيانات والاتصالات مشفرة بالكامل. يتم إجراء نسخ احتياطي دوري للبيانات لضمان عدم فقدانها في أي ظرف طارئ، مع سجل دخول يراقب كافة محاولات الوصول للنظام.
                        </p>
                    </div>
                </div>
                
                <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-full opacity-10 pointer-events-none">
                         <div className="w-full h-full" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-2xl font-black mb-6 flex items-center gap-4">
                            <ShieldCheck className="w-8 h-8 text-indigo-400" />
                            ميثاق الاستخدام الآمن
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400 leading-relaxed">1. لا تشارك كلمة المرور الخاصة بك مع أي شخص تحت أي ظرف.</p>
                                <p className="text-sm text-slate-400 leading-relaxed">2. تأكد من تسجيل الخروج عند الانتهاء من العمل على جهاز مشترك.</p>
                                <p className="text-sm text-slate-400 leading-relaxed">3. أبلغ عن أي نشاط مريب تلاحظه في حسابك فوراً.</p>
                            </div>
                            <div className="space-y-4">
                                <p className="text-sm text-slate-400 leading-relaxed">4. استخدم كلمات مرور قوية تحتوي على رموز وأرقام.</p>
                                <p className="text-sm text-slate-400 leading-relaxed">5. تجنب فتح النظام من شبكات واي فاي عامة غير آمنة.</p>
                                <p className="text-sm text-slate-400 leading-relaxed">6. التزم بالسرية التامة لبيانات المستوردين والشحنات.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </GuideSection>

            {/* Section 9: Pro Tips */}
            <GuideSection id="protips" title="9. نصائح احترافية لكل دور وظيفي" icon={Sparkles} badge="أفضل الممارسات" color="amber">
                <p>لضمان تحقيق أقصى استفادة من نظام مرقاب الذكي، قمنا بتجميع أهم النصائح وأفضل الممارسات المخصصة لكل دور وظيفي في المنفذ.</p>
                
                <div className="space-y-8 my-10">
                    {/* Admins */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-100 transition-colors"></div>
                        <div className="relative z-10">
                            <h4 className="font-black text-slate-900 text-xl mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                    <Settings className="w-5 h-5" />
                                </div>
                                للمدراء ومسؤولي النظام (Admins)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> محرك القواعد الديناميكي</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">لا تعتمدوا على التقييم اليدوي للمخاطر فقط. قوموا ببرمجة النظام ليتخذ قرارات تلقائية (مثل: إذا كان بلد التصدير "س" والمنتج "ص" ← تعيين كعالي الخطورة). هذا يقلل من الأخطاء البشرية ويسرع العمل.</p>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> التوزيع التلقائي للمهام</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">في أوقات الذروة، بدلاً من ترك الشحنات تتكدس، استخدموا زر التوزيع التلقائي في لوحة التحكم لتوزيع المعاملات المعلقة بالتساوي على المفتشين المتواجدين بضغطة زر.</p>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> المراقبة الاستباقية للتكاليف</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">راقبوا تبويب "التكاليف السحابية" بانتظام لمعرفة المنافذ الأكثر استهلاكاً للمساحة التخزينية، وتوجيه المفتشين بضغط الصور أو إرفاق المستندات الضرورية فقط.</p>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> تحديث الوضع الوبائي</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">استخدموا "أدوات المفتش" لتحديث قائمة الدول المحظورة وبائياً أولاً بأول، لينعكس ذلك فوراً على شاشات جميع المفتشين في كافة المنافذ.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Inspectors */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-100 transition-colors"></div>
                        <div className="relative z-10">
                            <h4 className="font-black text-slate-900 text-xl mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                    <Search className="w-5 h-5" />
                                </div>
                                للمفتشين الميدانيين (Inspectors)
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> استغلال المساعد الذكي (OCR)</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">بدلاً من إضاعة الوقت في كتابة بيانات البيان الجمركي يدوياً، استخدموا ميزة "قراءة مستند" لرفع صورة البيان، وسيقوم الذكاء الاصطناعي بتعبئة الاستمارة في ثوانٍ.</p>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> تثبيت النظام كتطبيق (PWA)</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">النظام مصمم ليعمل كتطبيق هاتف. قوموا بتثبيته على هواتفكم لتسهيل استخدامه أثناء التواجد في ساحات التفتيش الميدانية بعيداً عن المكاتب.</p>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> أدوات الفحص المدمجة</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">قبل اتخاذ قرار الإفراج، استخدموا أدوات المفتش للبحث السريع عن "المضافات الغذائية (E-Numbers)" أو "الرموز الجمركية (HS Codes)" للتأكد من مطابقتها للمواصفات.</p>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> تخصيص لوحة التحكم</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">يمكنكم سحب وإفلات (Drag & Drop) أقسام لوحة التحكم لترتيبها حسب ما يهمكم (مثلاً: وضع قسم "بانتظار الفحص" في الأعلى).</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lab & Logistics */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-amber-100 transition-colors"></div>
                        <div className="relative z-10">
                            <h4 className="font-black text-slate-900 text-xl mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                    <FlaskConical className="w-5 h-5" />
                                </div>
                                لفنيي المختبر والموظفين اللوجستيين
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> التحديث اللحظي للنتائج</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">بمجرد ظهور نتيجة الفحص المخبري، قوموا بإدخالها فوراً في النظام. النظام يعمل بالوقت الفعلي، وتأخير إدخال النتيجة يعني تأخير الإفراج وتكدس الميناء.</p>
                                </div>
                                <div className="space-y-2">
                                    <h5 className="font-bold text-slate-800 text-sm flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> متابعة الخريطة اللوجستية</h5>
                                    <p className="text-xs text-slate-500 leading-relaxed">للموظفين اللوجستيين، استخدموا "خريطة العمليات اللوجستية" لتتبع الشحنات المحولة بين المنافذ والمحطات اللوجستية لمعرفة مواعيد وصولها المتوقعة.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* General Tips */}
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <h4 className="font-black text-white text-xl mb-6 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center">
                                    <Zap className="w-5 h-5" />
                                </div>
                                نصائح عامة لجميع المستخدمين
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                    <h5 className="font-bold text-indigo-300 text-sm mb-2 flex items-center gap-2"><Lock className="w-4 h-4" /> الأمان أولاً (قفل الجلسة)</h5>
                                    <p className="text-xs text-slate-400 leading-relaxed">النظام مزود بخاصية تتبع الجلسات. إذا ابتعدت عن جهازك، سيتم قفل الشاشة تلقائياً. لا تشارك كلمة المرور الخاصة بك، فكل إجراء مسجل باسمك.</p>
                                </div>
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                    <h5 className="font-bold text-indigo-300 text-sm mb-2 flex items-center gap-2"><Eye className="w-4 h-4" /> الوضع الليلي (Dark Mode)</h5>
                                    <p className="text-xs text-slate-400 leading-relaxed">لموظفي الورديات المسائية، استخدموا "الوضع الليلي" (أيقونة القمر في الأعلى) لتقليل إجهاد العين أثناء العمل في الإضاءة المنخفضة.</p>
                                </div>
                                <div className="bg-white/5 p-5 rounded-2xl border border-white/10">
                                    <h5 className="font-bold text-indigo-300 text-sm mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> التواصل عبر النظام</h5>
                                    <p className="text-xs text-slate-400 leading-relaxed">استخدموا نظام المحادثة المدمج (Chat) للتواصل السريع مع زملائكم بدلاً من استخدام تطبيقات خارجية غير آمنة.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </GuideSection>

            {/* Final Footer - Formal & Detailed */}
            <div className="pdf-export-section mt-32 pt-20 border-t-2 border-slate-100 text-center relative">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-10">
                    <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl">
                        <Logo size={40} variant="light" />
                    </div>
                </div>
                
                <div className="max-w-2xl mx-auto mb-16">
                    <h4 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">نظام مرقاب: التميز في الرقابة الذكية</h4>
                    <p className="text-sm text-slate-400 font-bold leading-relaxed">
                        تم إعداد هذا الدليل ليكون المرجع الشامل لمستخدمي نظام مرقاب. نحن ملتزمون بالتطوير المستمر لتقديم أفضل تجربة مستخدم وأعلى مستويات الأمان.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 text-right">
                    <div className="p-6 bg-slate-50 rounded-3xl">
                        <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-3">الدعم الفني</h5>
                        <p className="text-xs text-slate-500 font-bold">Mubarak1Darwish@gmail.com</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">78752264</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl">
                        <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-3">إصدار المستند</h5>
                        <p className="text-xs text-slate-500 font-bold">v4.0.0-Elite (March 2026)</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">تاريخ المراجعة: 30 مارس 2026</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl">
                        <h5 className="font-black text-slate-900 text-xs uppercase tracking-widest mb-3">الجهة المالكة</h5>
                        <p className="text-xs text-slate-500 font-bold">وزارة الثروة الزراعية والسمكية وموارد المياه</p>
                        <p className="text-xs text-slate-500 font-bold mt-1">سلطنة عمان</p>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.5em] bg-slate-900 text-white/50 p-10 rounded-[3rem] shadow-2xl">
                    <p>© {new Date().getFullYear()} MIRQAB SMART SYSTEM. ALL RIGHTS RESERVED.</p>
                    <div className="flex items-center gap-4">
                        <Shield className="w-4 h-4" />
                        <span>CONFIDENTIAL DOCUMENT - DO NOT DISTRIBUTE</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default UserGuide;
