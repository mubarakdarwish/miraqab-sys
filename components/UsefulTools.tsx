import React, { useState, useEffect, useMemo } from 'react';
import { ConsignmentType, User } from '../types';
import { CONSIGNMENT_LABELS } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  BookOpen, 
  ListCheck, 
  ArrowRight, 
  Scale, 
  Thermometer, 
  Search, 
  Info, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Check, 
  X,
  FileText,
  Zap,
  RefreshCw,
  Snowflake,
  Flame,
  Layers,
  ClipboardList,
  History,
  QrCode,
  Download,
  Type
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

interface UsefulToolsProps {
  currentUser: User;
}

interface TodoItem {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

const UsefulTools: React.FC<UsefulToolsProps> = ({ currentUser }) => {
  const [activeTool, setActiveTool] = useState<'CALCULATOR' | 'NOTEBOOK' | 'TASKS' | 'CONVERTER' | 'GUIDE' | 'QR_GENERATOR' | null>(null);

  // --- Calculator State ---
  const [calcMode, setCalcMode] = useState<ConsignmentType | 'SHARED'>(ConsignmentType.FOOD_SAFETY);
  const [isAgriOutgoing, setIsAgriOutgoing] = useState(false);
  const [weight, setWeight] = useState<number>(0);
  const [unitCount, setUnitCount] = useState<number>(1); 
  const [isExternalInspection, setIsExternalInspection] = useState<boolean>(false);
  const [vetCategory, setVetCategory] = useState<string>('MEAT_DAIRY'); 
  const [enableFood, setEnableFood] = useState(true);
  const [enableAgri, setEnableAgri] = useState(false);
  const [enableVet, setEnableVet] = useState(false);
  const [sharedFoodCerts, setSharedFoodCerts] = useState(1);
  const [sharedAgriWeight, setSharedAgriWeight] = useState(0);
  const [sharedVetCategory, setSharedVetCategory] = useState('MEAT_DAIRY');
  const [sharedVetWeight, setSharedVetWeight] = useState(0);
  const [sharedVetUnits, setSharedVetUnits] = useState(0);
  const [sharedExternal, setSharedExternal] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState<number>(0);

  // --- Notebook State ---
  const [pages, setPages] = useState<string[]>(() => {
    const saved = localStorage.getItem(`mirqab_user_note_${currentUser.id}`);
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed.length > 0 ? parsed : [''];
            return [saved];
        } catch (e) { return [saved]; }
    }
    return [''];
  });
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [noteSearchTerm, setNoteSearchTerm] = useState('');

  // --- Tasks State ---
  const [todos, setTodos] = useState<TodoItem[]>(() => {
      try {
          const saved = localStorage.getItem(`mirqab_user_todos_${currentUser.id}`);
          return saved ? JSON.parse(saved) : [];
      } catch { return []; }
  });
  const [taskInput, setTaskInput] = useState('');

  // --- Converter State ---
  const [convType, setConvType] = useState<'WEIGHT' | 'TEMP'>('WEIGHT');
  const [convInput, setConvInput] = useState<number>(0);
  const [convFrom, setConvFrom] = useState<string>('KG');
  const [convTo, setConvTo] = useState<string>('TON');

  // --- Guide State ---
  const [guideTab, setGuideTab] = useState<'E_NUMBERS' | 'STORAGE'>('E_NUMBERS');
  const [guideSearch, setGuideSearch] = useState('');

  // --- QR Generator State ---
  const [qrText, setQrText] = useState('https://mos.gov.om');
  const [qrFgColor, setQrFgColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#ffffff');
  const [qrSize, setQrSize] = useState(256);
  const [qrLevel, setQrLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrMargin, setQrMargin] = useState(true);

  // --- Data ---
  const eNumbers = [
    { code: 'E100', name: 'كركمين', type: 'ملون طبيعي', safety: 'آمن' },
    { code: 'E102', name: 'تارترازين', type: 'ملون اصطناعي', safety: 'قد يسبب حساسية' },
    { code: 'E200', name: 'حمض السوربيك', type: 'مادة حافظة', safety: 'آمن' },
    { code: 'E211', name: 'بنزوات الصوديوم', type: 'مادة حافظة', safety: 'آمن بحدود' },
    { code: 'E300', name: 'حمض الأسكوربيك (فيتامين ج)', type: 'مضاد أكسدة', safety: 'آمن جداً' },
    { code: 'E330', name: 'حمض الستريك', type: 'منظم حموضة', safety: 'آمن' },
    { code: 'E621', name: 'غلوتامات أحادية الصوديوم', type: 'معزز نكهة', safety: 'مثير للجدل' },
    { code: 'E951', name: 'أسبارتام', type: 'محلي اصطناعي', safety: 'مثير للجدل' },
  ];

  const storageTemps = [
    { item: 'اللحوم المجمدة', temp: '-18°C', humidity: '90-95%', period: '6-12 شهر' },
    { item: 'اللحوم المبردة', temp: '0°C إلى 4°C', humidity: '85-90%', period: '3-5 أيام' },
    { item: 'الأسماك الطازجة', temp: '0°C إلى 2°C', humidity: '95-100%', period: '1-2 يوم' },
    { item: 'الألبان والأجبان', temp: '2°C إلى 5°C', humidity: '80%', period: 'حسب النوع' },
    { item: 'الخضروات الورقية', temp: '0°C إلى 2°C', humidity: '95-100%', period: '1-2 أسبوع' },
    { item: 'الفواكه الحمضية', temp: '4°C إلى 7°C', humidity: '90%', period: '4-8 أسابيع' },
    { item: 'البيض', temp: '4°C إلى 7°C', humidity: '75%', period: '3-5 أسابيع' },
  ];

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem(`mirqab_user_todos_${currentUser.id}`, JSON.stringify(todos));
  }, [todos, currentUser.id]);

  useEffect(() => {
    setIsSaving(true);
    const timer = setTimeout(() => {
      localStorage.setItem(`mirqab_user_note_${currentUser.id}`, JSON.stringify(pages));
      setIsSaving(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [pages, currentUser.id]);

  // --- Fee Calculation Logic ---
  const calcFoodFee = (certs: number) => certs * 10;
  const calcAgriFee = (w: number, isOut: boolean = false) => {
    if (isOut) {
      return Math.min(Math.ceil(w / 1000) * 2, 200) + 1;
    }
    return Math.min(Math.ceil(w / 1000) * 1, 100);
  };
  const calcVetFee = (category: string, w: number, units: number) => {
      if (category === 'LIVE_ANIMALS') return 5 + (units * 0.5);
      if (category === 'MEAT_DAIRY') return Math.min(Math.ceil(w / 1000) * 5, 100);
      if (category === 'FISH') return Math.min(Math.ceil(w / 1000) * 5, 15);
      if (category === 'EGGS') return Math.min(units * 0.1, 40);
      if (['FODDER', 'WASTE'].includes(category)) return 30;
      return 0;
  };

  useEffect(() => {
    let total = 0;
    if (calcMode === 'SHARED') {
        if (enableFood) total += calcFoodFee(sharedFoodCerts);
        if (enableAgri) total += calcAgriFee(sharedAgriWeight, isAgriOutgoing);
        if (enableVet) total += calcVetFee(sharedVetCategory, sharedVetWeight, sharedVetUnits);
        if (sharedExternal) total += 50;
    } else {
        if (calcMode === ConsignmentType.FOOD_SAFETY) total = calcFoodFee(unitCount) + (isExternalInspection ? 50 : 0);
        else if (calcMode === ConsignmentType.AGRICULTURAL) total = calcAgriFee(weight, isAgriOutgoing);
        else if (calcMode === ConsignmentType.VETERINARY) total = calcVetFee(vetCategory, weight, unitCount);
    }
    setCalculatedFee(Math.round(total * 100) / 100);
  }, [calcMode, weight, unitCount, isExternalInspection, vetCategory, enableFood, enableAgri, enableVet, sharedFoodCerts, sharedAgriWeight, sharedVetCategory, sharedVetWeight, sharedVetUnits, sharedExternal, isAgriOutgoing]);

  // --- Converter Logic ---
  const convertedValue = useMemo(() => {
    if (convType === 'WEIGHT') {
      if (convFrom === 'KG' && convTo === 'TON') return convInput / 1000;
      if (convFrom === 'TON' && convTo === 'KG') return convInput * 1000;
      if (convFrom === 'KG' && convTo === 'LBS') return convInput * 2.20462;
      if (convFrom === 'LBS' && convTo === 'KG') return convInput / 2.20462;
    } else {
      if (convFrom === 'C' && convTo === 'F') return (convInput * 9/5) + 32;
      if (convFrom === 'F' && convTo === 'C') return (convInput - 32) * 5/9;
    }
    return convInput;
  }, [convType, convInput, convFrom, convTo]);

  // --- Handlers ---
  const handleAddTodo = (e: React.FormEvent) => {
      e.preventDefault();
      if (!taskInput.trim()) return;
      setTodos(prev => [{ id: Math.random().toString(36).substr(2, 9), text: taskInput.trim(), completed: false, createdAt: Date.now() }, ...prev]);
      setTaskInput('');
  };

  const filteredGuide = useMemo(() => {
    const term = guideSearch.toLowerCase();
    if (guideTab === 'E_NUMBERS') {
      return eNumbers.filter(e => e.code.toLowerCase().includes(term) || e.name.toLowerCase().includes(term));
    } else {
      return storageTemps.filter(s => s.item.toLowerCase().includes(term));
    }
  }, [guideTab, guideSearch]);

  return (
    <div className="space-y-8 animate-fade-in pb-20 font-sans">
      
      <AnimatePresence mode="wait">
        {!activeTool ? (
          <motion.div 
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <ToolCard 
              title="حاسبة الرسوم" 
              desc="تقدير تكاليف التفتيش والخدمات" 
              icon={<Calculator className="w-8 h-8" />} 
              color="bg-blue-500" 
              onClick={() => setActiveTool('CALCULATOR')} 
            />
            <ToolCard 
              title="المفكرة الذكية" 
              desc="ملاحظات متعددة الصفحات مع بحث" 
              icon={<BookOpen className="w-8 h-8" />} 
              color="bg-red-600" 
              onClick={() => setActiveTool('NOTEBOOK')} 
            />
            <ToolCard 
              title="قائمة المهام" 
              desc="تتبع إنجازاتك اليومية" 
              icon={<ListCheck className="w-8 h-8" />} 
              color="bg-purple-600" 
              onClick={() => setActiveTool('TASKS')} 
            />
            <ToolCard 
              title="محول الوحدات" 
              desc="الأوزان ودرجات الحرارة" 
              icon={<Scale className="w-8 h-8" />} 
              color="bg-emerald-600" 
              onClick={() => setActiveTool('CONVERTER')} 
            />
            <ToolCard 
              title="دليل المراجع" 
              desc="المضافات الغذائية ودرجات التخزين" 
              icon={<Info className="w-8 h-8" />} 
              color="bg-amber-500" 
              onClick={() => setActiveTool('GUIDE')} 
            />
            <ToolCard 
              title="مولد QR Code" 
              desc="إنشاء وتنزيل رموز الاستجابة السريعة" 
              icon={<QrCode className="w-8 h-8" />} 
              color="bg-indigo-600" 
              onClick={() => setActiveTool('QR_GENERATOR')} 
            />
          </motion.div>
        ) : (
          <motion.div 
            key="tool"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-4xl mx-auto"
          >
            <button 
              onClick={() => setActiveTool(null)}
              className="mb-6 flex items-center gap-2 text-slate-500 hover:text-slate-800 font-black text-sm transition-all bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100"
            >
              <ArrowRight size={18} /> العودة للأدوات
            </button>

            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden min-h-[600px] flex flex-col">
              
              {/* Tool Header */}
              <div className={`p-8 text-white relative overflow-hidden ${
                activeTool === 'CALCULATOR' ? 'bg-blue-600' :
                activeTool === 'NOTEBOOK' ? 'bg-red-700' :
                activeTool === 'TASKS' ? 'bg-purple-700' :
                activeTool === 'CONVERTER' ? 'bg-emerald-700' : 
                activeTool === 'QR_GENERATOR' ? 'bg-indigo-700' : 
                'bg-amber-600'
              }`}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                      {activeTool === 'CALCULATOR' && <Calculator size={28} />}
                      {activeTool === 'NOTEBOOK' && <BookOpen size={28} />}
                      {activeTool === 'TASKS' && <ListCheck size={28} />}
                      {activeTool === 'CONVERTER' && <Scale size={28} />}
                      {activeTool === 'GUIDE' && <Info size={28} />}
                      {activeTool === 'QR_GENERATOR' && <QrCode size={28} />}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">
                        {activeTool === 'CALCULATOR' ? 'حاسبة الرسوم' :
                         activeTool === 'NOTEBOOK' ? 'المفكرة الذكية' :
                         activeTool === 'TASKS' ? 'قائمة المهام' :
                         activeTool === 'CONVERTER' ? 'محول الوحدات' : 
                         activeTool === 'QR_GENERATOR' ? 'مولد QR Code' :
                         'دليل المراجع'}
                      </h3>
                      <p className="text-white/70 text-sm font-bold mt-1">
                        {activeTool === 'CALCULATOR' ? 'تقدير تكاليف التفتيش والخدمات' :
                         activeTool === 'NOTEBOOK' ? 'ملاحظاتك الشخصية محفوظة تلقائياً' :
                         activeTool === 'TASKS' ? 'نظم عملك اليومي بفعالية' :
                         activeTool === 'CONVERTER' ? 'تحويل سريع للأوزان والحرارة' : 
                         activeTool === 'QR_GENERATOR' ? 'إنشاء وتخصيص رموز الاستجابة السريعة' :
                         'معلومات سريعة للمفتش'}
                      </p>
                    </div>
                  </div>
                  {activeTool === 'NOTEBOOK' && isSaving && (
                    <div className="bg-white/20 px-4 py-2 rounded-full text-xs font-black flex items-center gap-2 animate-pulse">
                      <RefreshCw size={14} className="animate-spin" /> جاري الحفظ...
                    </div>
                  )}
                </div>
              </div>

              {/* Tool Content */}
              <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                
                {/* 1. Calculator */}
                {activeTool === 'CALCULATOR' && (
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[...Object.values(ConsignmentType), 'SHARED'].map(s => (
                        <button
                          key={s}
                          onClick={() => setCalcMode(s as any)}
                          className={`py-4 rounded-2xl text-xs font-black border-2 transition-all ${
                            calcMode === s 
                            ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                            : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {s === 'SHARED' ? 'مشتركة' : CONSIGNMENT_LABELS[s as string]}
                        </button>
                      ))}
                    </div>

                    <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6">
                      {calcMode === 'SHARED' ? (
                        <div className="space-y-4">
                          <SharedToggle label="سلامة الغذاء" enabled={enableFood} setEnabled={setEnableFood} color="blue" />
                          {enableFood && <InputField label="عدد الشهادات" value={sharedFoodCerts} onChange={setSharedFoodCerts} />}
                          
                          <SharedToggle label="القطاع الزراعي" enabled={enableAgri} setEnabled={setEnableAgri} color="emerald" />
                          {enableAgri && (
                            <div className="space-y-3 pl-4 border-r-2 border-emerald-200 mr-2">
                                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                                    <input type="checkbox" checked={isAgriOutgoing} onChange={e => setIsAgriOutgoing(e.target.checked)} className="w-4 h-4 accent-emerald-600" />
                                    <span className="text-xs font-black text-slate-700">معاملة صادر</span>
                                </label>
                                <InputField label="الوزن (كجم)" value={sharedAgriWeight} onChange={setSharedAgriWeight} />
                            </div>
                          )}
                          
                          <SharedToggle label="القطاع البيطري" enabled={enableVet} setEnabled={setEnableVet} color="amber" />
                          {enableVet && (
                            <div className="space-y-3 pl-4 border-r-2 border-amber-200 mr-2">
                              <select value={sharedVetCategory} onChange={e => setSharedVetCategory(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold">
                                <option value="MEAT_DAIRY">اللحوم والألبان</option>
                                <option value="FISH">الأسماك</option>
                                <option value="LIVE_ANIMALS">حيوانات حية</option>
                                <option value="EGGS">بيض مائدة</option>
                              </select>
                              <InputField label="الوزن/العدد" value={sharedVetWeight || sharedVetUnits} onChange={v => sharedVetCategory === 'LIVE_ANIMALS' || sharedVetCategory === 'EGGS' ? setSharedVetUnits(v) : setSharedVetWeight(v)} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {calcMode === ConsignmentType.VETERINARY && (
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">التصنيف البيطري</label>
                              <select value={vetCategory} onChange={(e) => setVetCategory(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-blue-500">
                                <option value="MEAT_DAIRY">اللحوم والألبان</option>
                                <option value="FISH">الأسماك</option>
                                <option value="EGGS">بيض المائدة</option>
                                <option value="FODDER">الأعلاف</option>
                                <option value="LIVE_ANIMALS">حيوانات حية</option>
                              </select>
                            </div>
                          )}
                          {calcMode === ConsignmentType.AGRICULTURAL && (
                            <label className="flex items-center gap-3 cursor-pointer p-5 bg-white rounded-2xl border-2 border-slate-100 shadow-sm transition-all hover:border-emerald-200">
                                <input type="checkbox" checked={isAgriOutgoing} onChange={e => setIsAgriOutgoing(e.target.checked)} className="w-6 h-6 accent-emerald-600 rounded-lg" />
                                <div>
                                    <p className="text-sm font-black text-slate-800">معاملة صادر (تصدير)</p>
                                    <p className="text-[10px] font-bold text-slate-400">2 ريال لكل طن + 1 ريال شهادة</p>
                                </div>
                            </label>
                          )}
                          <InputField 
                            label={calcMode === ConsignmentType.FOOD_SAFETY ? "عدد الشهادات" : "الوزن الإجمالي (كجم)"} 
                            value={calcMode === ConsignmentType.FOOD_SAFETY ? unitCount : weight} 
                            onChange={calcMode === ConsignmentType.FOOD_SAFETY ? setUnitCount : setWeight} 
                          />
                        </div>
                      )}
                    </div>

                    <div className="bg-blue-900 p-10 rounded-[3rem] text-center relative overflow-hidden">
                      <Zap className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5 -rotate-12" />
                      <p className="text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] mb-2">الرسوم التقديرية</p>
                      <div className="flex items-baseline justify-center gap-3">
                        <span className="text-6xl font-black text-white">{calculatedFee.toLocaleString()}</span>
                        <span className="text-xl font-black text-blue-400">ر.ع</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Notebook */}
                {activeTool === 'NOTEBOOK' && (
                  <div className="flex flex-col h-full space-y-6">
                    <div className="flex justify-between items-center bg-slate-50 p-4 rounded-[2rem] border border-slate-100">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setActivePageIndex(p => Math.max(0, p - 1))} disabled={activePageIndex === 0} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 disabled:opacity-30 transition-all"><ChevronRight size={20} /></button>
                        <div className="px-4 text-center">
                          <p className="text-xs font-black text-slate-800">صفحة {activePageIndex + 1}</p>
                          <p className="text-[10px] font-bold text-slate-400">من {pages.length}</p>
                        </div>
                        <button onClick={() => setActivePageIndex(p => Math.min(pages.length - 1, p + 1))} disabled={activePageIndex === pages.length - 1} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-600 disabled:opacity-30 transition-all"><ChevronLeft size={20} /></button>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setPages([...pages, '']); setActivePageIndex(pages.length); }} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-all"><Plus size={20} /></button>
                        <button onClick={() => { if(pages.length > 1 && window.confirm('حذف الصفحة؟')) { setPages(pages.filter((_, i) => i !== activePageIndex)); setActivePageIndex(0); } }} className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100 transition-all"><Trash2 size={20} /></button>
                      </div>
                    </div>

                    <div className="relative group flex-1">
                      <div className="absolute top-0 right-10 bottom-0 w-px bg-red-200/50 z-10"></div>
                      <textarea 
                        value={pages[activePageIndex]}
                        onChange={(e) => { const n = [...pages]; n[activePageIndex] = e.target.value; setPages(n); }}
                        placeholder="اكتب ملاحظاتك هنا..."
                        className="w-full h-[400px] bg-[#fffdf0] rounded-[2.5rem] border border-slate-100 p-10 pr-16 text-slate-800 font-bold leading-loose outline-none resize-none shadow-inner custom-scrollbar"
                        style={{ backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)', backgroundSize: '100% 2.5rem', backgroundPosition: '0 2rem' }}
                      />
                    </div>
                  </div>
                )}

                {/* 3. Tasks */}
                {activeTool === 'TASKS' && (
                  <div className="space-y-6">
                    <form onSubmit={handleAddTodo} className="relative">
                      <input 
                        type="text" 
                        value={taskInput}
                        onChange={(e) => setTaskInput(e.target.value)}
                        placeholder="ما هي المهمة التالية؟"
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-5 pr-14 pl-6 text-sm font-black outline-none focus:border-purple-500 transition-all"
                      />
                      <Plus className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400" />
                    </form>

                    <div className="space-y-3">
                      {todos.map(todo => (
                        <motion.div 
                          key={todo.id}
                          layout
                          className={`p-5 rounded-3xl border-2 flex items-center justify-between transition-all ${todo.completed ? 'bg-slate-50 border-slate-50' : 'bg-white border-slate-100 hover:border-purple-100 shadow-sm'}`}
                        >
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={() => setTodos(todos.map(t => t.id === todo.id ? { ...t, completed: !t.completed } : t))}
                              className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${todo.completed ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-200 text-transparent hover:border-purple-400'}`}
                            >
                              <Check size={18} />
                            </button>
                            <span className={`text-sm font-black ${todo.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{todo.text}</span>
                          </div>
                          <button onClick={() => setTodos(todos.filter(t => t.id !== todo.id))} className="text-slate-300 hover:text-red-500 transition-colors"><X size={20} /></button>
                        </motion.div>
                      ))}
                      {todos.length === 0 && (
                        <div className="py-20 text-center text-slate-300">
                          <ClipboardList size={64} className="mx-auto mb-4 opacity-20" />
                          <p className="font-black">لا توجد مهام حالياً</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Converter */}
                {activeTool === 'CONVERTER' && (
                  <div className="space-y-8">
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                      <button onClick={() => { setConvType('WEIGHT'); setConvFrom('KG'); setConvTo('TON'); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${convType === 'WEIGHT' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>الأوزان</button>
                      <button onClick={() => { setConvType('TEMP'); setConvFrom('C'); setConvTo('F'); }} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${convType === 'TEMP' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>درجات الحرارة</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">القيمة المدخلة</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={convInput}
                            onChange={(e) => setConvInput(Number(e.target.value))}
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 px-8 text-2xl font-black outline-none focus:border-emerald-500"
                          />
                          <select value={convFrom} onChange={e => setConvFrom(e.target.value)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black">
                            {convType === 'WEIGHT' ? (
                              <>
                                <option value="KG">كجم</option>
                                <option value="TON">طن</option>
                                <option value="LBS">رطل</option>
                              </>
                            ) : (
                              <>
                                <option value="C">مئوية °C</option>
                                <option value="F">فهرنهايت °F</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">النتيجة</label>
                        <div className="relative">
                          <div className="w-full bg-emerald-50 border-2 border-emerald-100 rounded-3xl py-6 px-8 text-2xl font-black text-emerald-900">
                            {convertedValue.toFixed(2)}
                          </div>
                          <select value={convTo} onChange={e => setConvTo(e.target.value)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white border border-emerald-200 rounded-xl px-3 py-2 text-xs font-black text-emerald-600">
                            {convType === 'WEIGHT' ? (
                              <>
                                <option value="TON">طن</option>
                                <option value="KG">كجم</option>
                                <option value="LBS">رطل</option>
                              </>
                            ) : (
                              <>
                                <option value="F">فهرنهايت °F</option>
                                <option value="C">مئوية °C</option>
                              </>
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Guide */}
                {activeTool === 'GUIDE' && (
                  <div className="space-y-6">
                    <div className="flex p-1 bg-slate-100 rounded-2xl">
                      <button onClick={() => setGuideTab('E_NUMBERS')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${guideTab === 'E_NUMBERS' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}>المضافات الغذائية (E)</button>
                      <button onClick={() => setGuideTab('STORAGE')} className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${guideTab === 'STORAGE' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500'}`}>درجات التخزين</button>
                    </div>

                    <div className="relative">
                      <input 
                        type="text" 
                        value={guideSearch}
                        onChange={(e) => setGuideSearch(e.target.value)}
                        placeholder="ابحث عن رمز أو منتج..."
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pr-12 pl-4 text-sm font-black outline-none focus:border-amber-500"
                      />
                      <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {filteredGuide.map((item, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex justify-between items-center group hover:border-amber-200 transition-all">
                          {guideTab === 'E_NUMBERS' ? (
                            <>
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-black text-xs">{(item as any).code}</div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-800">{(item as any).name}</h4>
                                  <p className="text-[10px] font-bold text-slate-400">{(item as any).type}</p>
                                </div>
                              </div>
                              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${(item as any).safety === 'آمن' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {(item as any).safety}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                                  <Snowflake size={24} />
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-800">{(item as any).item}</h4>
                                  <p className="text-[10px] font-bold text-slate-400">الرطوبة: {(item as any).humidity}</p>
                                </div>
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-black text-blue-600">{(item as any).temp}</p>
                                <p className="text-[9px] font-bold text-slate-400">المدة: {(item as any).period}</p>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. QR Generator */}
                {activeTool === 'QR_GENERATOR' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 flex items-center gap-2">
                            <Type size={14} /> النص أو الرابط (URL)
                          </label>
                          <textarea 
                            value={qrText}
                            onChange={(e) => setQrText(e.target.value)}
                            placeholder="أدخل النص أو الرابط هنا..."
                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-4 px-6 text-sm font-black outline-none focus:border-indigo-500 min-h-[120px] resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">لون المقدمة</label>
                             <input 
                               type="color" 
                               value={qrFgColor}
                               onChange={(e) => setQrFgColor(e.target.value)}
                               className="w-full h-12 bg-white border-2 border-slate-100 rounded-xl cursor-pointer p-1"
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">لون الخلفية</label>
                             <input 
                               type="color" 
                               value={qrBgColor}
                               onChange={(e) => setQrBgColor(e.target.value)}
                               className="w-full h-12 bg-white border-2 border-slate-100 rounded-xl cursor-pointer p-1"
                             />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">المستوى: {qrLevel}</label>
                            <select 
                              value={qrLevel}
                              onChange={(e) => setQrLevel(e.target.value as any)}
                              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-black outline-none focus:border-indigo-500"
                            >
                              <option value="L">L - منخفض</option>
                              <option value="M">M - متوسط</option>
                              <option value="Q">Q - مقبول</option>
                              <option value="H">H - عالٍ</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">هامش أبيض</label>
                            <button 
                              onClick={() => setQrMargin(!qrMargin)}
                              className={`w-full py-2 rounded-xl text-xs font-black border-2 transition-all ${qrMargin ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-100 text-slate-400'}`}
                            >
                              {qrMargin ? 'مفعل' : 'معطل'}
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الحجم: {qrSize}px</label>
                          <input 
                            type="range" 
                            min="128" 
                            max="1024" 
                            step="8"
                            value={qrSize}
                            onChange={(e) => setQrSize(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                        </div>

                        <button 
                          onClick={() => {
                            const canvas = document.getElementById('qr-canvas') as HTMLCanvasElement;
                            if (canvas) {
                              // Ensure background is solid for download
                              const outCanvas = document.createElement('canvas');
                              outCanvas.width = canvas.width;
                              outCanvas.height = canvas.height;
                              const ctx = outCanvas.getContext('2d');
                              if (ctx) {
                                ctx.fillStyle = qrBgColor;
                                ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
                                ctx.drawImage(canvas, 0, 0);
                                
                                const url = outCanvas.toDataURL('image/png');
                                const link = document.createElement('a');
                                link.download = `mirqab-qr-${Date.now()}.png`;
                                link.href = url;
                                link.click();
                              }
                            }
                          }}
                          className="w-full bg-indigo-600 text-white rounded-2xl py-4 font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg active:scale-95"
                        >
                          <Download size={18} /> تنزيل بصيغة PNG
                        </button>
                      </div>

                      <div className="flex flex-col items-center justify-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-8 min-h-[400px]">
                        <div className="bg-white p-6 rounded-3xl shadow-xl border border-slate-100 group transition-all hover:scale-105">
                          <QRCodeCanvas 
                            id="qr-canvas"
                            value={qrText} 
                            size={qrSize}
                            fgColor={qrFgColor}
                            bgColor={qrBgColor}
                            level={qrLevel}
                            includeMargin={qrMargin}
                            marginSize={4}
                          />
                        </div>
                        <p className="mt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">معاينة مباشرة</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ToolCard = ({ title, desc, icon, color, onClick }: any) => (
  <button 
    onClick={onClick}
    className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group text-right flex flex-col items-start gap-6"
  >
    <div className={`w-16 h-16 ${color} text-white rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div>
      <h3 className="text-xl font-black text-slate-800 mb-1">{title}</h3>
      <p className="text-xs font-bold text-slate-400 leading-relaxed">{desc}</p>
    </div>
    <div className="mt-auto w-full flex justify-end">
      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">
        <ChevronLeft size={20} />
      </div>
    </div>
  </button>
);

const InputField = ({ label, value, onChange }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">{label}</label>
    <input 
      type="number" 
      value={value || ''} 
      onChange={(e) => onChange(Number(e.target.value))} 
      placeholder="0" 
      className="w-full bg-white border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-black outline-none focus:border-blue-500 shadow-sm" 
    />
  </div>
);

const SharedToggle = ({ label, enabled, setEnabled, color }: any) => (
  <label className={`flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${enabled ? `bg-${color}-50 border-${color}-200` : 'bg-white border-slate-100 opacity-50'}`}>
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${enabled ? `bg-${color}-500` : 'bg-slate-300'}`}></div>
      <span className="text-sm font-black text-slate-800">{label}</span>
    </div>
    <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="hidden" />
    <div className={`w-12 h-6 rounded-full relative transition-all ${enabled ? `bg-${color}-500` : 'bg-slate-200'}`}>
      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${enabled ? 'left-1' : 'left-7'}`}></div>
    </div>
  </label>
);

export default UsefulTools;
