import React, { useState } from 'react';
import { ENumber, EpidemicAlert, HSCode, InspectionChecklist } from '../types';

interface InspectorToolsProps {
    eNumbers: ENumber[];
    epidemicAlerts: EpidemicAlert[];
    hsCodes: HSCode[];
    checklists: Record<string, InspectionChecklist>;
}

const InspectorTools: React.FC<InspectorToolsProps> = ({ eNumbers, epidemicAlerts, hsCodes, checklists }) => {
    const [activeTab, setActiveTab] = useState<'enumbers' | 'hscodes' | 'epidemic' | 'checklist' | 'converter' | 'sampling' | 'shelflife'>('enumbers');
    
    // E-Numbers State
    const [eSearch, setESearch] = useState('');

    // HS Codes State
    const [hsSearch, setHsSearch] = useState('');
    
    // Converter State
    const [convValue, setConvValue] = useState<number | ''>('');
    const [convFrom, setConvFrom] = useState('kg');
    const [convTo, setConvTo] = useState('lb');
    
    // Temp Converter State
    const [tempValue, setTempValue] = useState<number | ''>('');
    const [tempFrom, setTempFrom] = useState('C');
    const [tempTo, setTempTo] = useState('F');
    
    // CBM State
    const [cbmLength, setCbmLength] = useState<number | ''>('');
    const [cbmWidth, setCbmWidth] = useState<number | ''>('');
    const [cbmHeight, setCbmHeight] = useState<number | ''>('');
    const [cbmQty, setCbmQty] = useState<number | ''>(1);

    // Sampling State
    const [lotSize, setLotSize] = useState<number | ''>('');
    const [samplingStandard, setSamplingStandard] = useState<'sqrt' | 'iso2859'>('sqrt');
    const [randomSamples, setRandomSamples] = useState<number[]>([]);
    const [randomStart, setRandomStart] = useState<number | ''>(1);
    const [randomEnd, setRandomEnd] = useState<number | ''>('');
    const [randomCount, setRandomCount] = useState<number | ''>('');
    const [randomError, setRandomError] = useState('');

    // Shelf Life State
    const [prodDate, setProdDate] = useState('');
    const [expDate, setExpDate] = useState('');
    const [minRemaining, setMinRemaining] = useState<number>(50);

    // Checklist State
    const [selectedChecklist, setSelectedChecklist] = useState<string>(Object.keys(checklists)[0] || '');
    const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

    // Filter E-Numbers
    const filteredENumbers = eNumbers.filter(e => 
        e.code.toLowerCase().includes(eSearch.toLowerCase()) || 
        e.name.toLowerCase().includes(eSearch.toLowerCase())
    );

    // Filter HS Codes
    const filteredHSCodes = hsCodes.filter(hs => 
        hs.code.includes(hsSearch) || 
        hs.name.toLowerCase().includes(hsSearch.toLowerCase()) ||
        hs.category.toLowerCase().includes(hsSearch.toLowerCase())
    );

    // Converter Logic
    const convertWeight = () => {
        if (convValue === '') return 0;
        const val = Number(convValue);
        if (convFrom === convTo) return val;
        
        // Convert to KG first
        let inKg = val;
        if (convFrom === 'ton') inKg = val * 1000;
        if (convFrom === 'lb') inKg = val * 0.453592;
        if (convFrom === 'g') inKg = val / 1000;

        // Convert from KG to target
        if (convTo === 'ton') return inKg / 1000;
        if (convTo === 'lb') return inKg * 2.20462;
        if (convTo === 'g') return inKg * 1000;
        
        return inKg; // target is kg
    };

    const calculateCBM = () => {
        if (cbmLength === '' || cbmWidth === '' || cbmHeight === '' || cbmQty === '') return 0;
        // Assuming inputs are in cm
        const cbmPerCarton = (Number(cbmLength) * Number(cbmWidth) * Number(cbmHeight)) / 1000000;
        return cbmPerCarton * Number(cbmQty);
    };

    const convertTemp = () => {
        if (tempValue === '') return 0;
        const val = Number(tempValue);
        if (tempFrom === tempTo) return val;
        if (tempFrom === 'C' && tempTo === 'F') return (val * 9/5) + 32;
        if (tempFrom === 'F' && tempTo === 'C') return (val - 32) * 5/9;
        return val;
    };

    const calculateSampling = () => {
        if (lotSize === '' || lotSize <= 0) return 0;
        const size = Number(lotSize);
        if (samplingStandard === 'sqrt') {
            return Math.ceil(Math.sqrt(size) + 1);
        } else {
            // ISO 2859-1 General Inspection Level II (Simplified)
            if (size <= 8) return 2;
            if (size <= 15) return 3;
            if (size <= 25) return 5;
            if (size <= 50) return 8;
            if (size <= 90) return 13;
            if (size <= 150) return 20;
            if (size <= 280) return 32;
            if (size <= 500) return 50;
            if (size <= 1200) return 80;
            if (size <= 3200) return 125;
            if (size <= 10000) return 200;
            if (size <= 35000) return 315;
            if (size <= 150000) return 500;
            if (size <= 500000) return 800;
            return 1250;
        }
    };

    const generateRandomSamples = () => {
        setRandomError('');
        if (randomStart === '' || randomEnd === '' || randomCount === '') {
            setRandomError('يرجى تعبئة جميع الحقول');
            return;
        }
        const start = Number(randomStart);
        const end = Number(randomEnd);
        const count = Number(randomCount);
        
        if (start >= end) {
            setRandomError('النهاية يجب أن تكون أكبر من البداية');
            return;
        }
        if (count <= 0) {
            setRandomError('العدد يجب أن يكون أكبر من صفر');
            return;
        }
        if (count > (end - start + 1)) {
            setRandomError('العدد المطلوب أكبر من النطاق المتاح');
            return;
        }

        const samples = new Set<number>();
        while(samples.size < count) {
            const randomNum = Math.floor(Math.random() * (end - start + 1)) + start;
            samples.add(randomNum);
        }
        setRandomSamples(Array.from(samples).sort((a, b) => a - b));
    };

    const calculateShelfLife = () => {
        if (!prodDate || !expDate) return null;
        const prod = new Date(prodDate).getTime();
        const exp = new Date(expDate).getTime();
        const now = new Date().getTime();

        if (exp <= prod) return { error: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ الإنتاج' };

        const totalLife = exp - prod;
        const passedLife = now - prod;
        const remainingLife = exp - now;

        const remainingPercent = (remainingLife / totalLife) * 100;
        const passedPercent = (passedLife / totalLife) * 100;

        const isAcceptable = remainingPercent >= minRemaining;

        return {
            totalDays: Math.floor(totalLife / (1000 * 60 * 60 * 24)),
            remainingDays: Math.floor(remainingLife / (1000 * 60 * 60 * 24)),
            remainingPercent: remainingPercent.toFixed(1),
            passedPercent: passedPercent.toFixed(1),
            isAcceptable,
            isExpired: remainingLife <= 0
        };
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 font-cairo animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl shadow-inner">
                    <i className="fas fa-toolbox"></i>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">أدوات المفتش</h1>
                    <p className="text-sm font-bold text-slate-500 mt-1">أدلة مرجعية سريعة وأدوات مساعدة للفحص والتفتيش</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <button onClick={() => setActiveTab('enumbers')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'enumbers' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <i className="fas fa-flask"></i> المضافات (E-Numbers)
                </button>
                <button onClick={() => setActiveTab('epidemic')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'epidemic' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <i className="fas fa-virus"></i> الوضع الوبائي
                </button>
                <button onClick={() => setActiveTab('checklist')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'checklist' ? 'bg-emerald-50 text-emerald-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <i className="fas fa-tasks"></i> قوائم التحقق
                </button>
                <button onClick={() => setActiveTab('converter')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'converter' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <i className="fas fa-calculator"></i> محول الوحدات
                </button>
                <button onClick={() => setActiveTab('sampling')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'sampling' ? 'bg-purple-50 text-purple-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <i className="fas fa-vial"></i> حاسبة العينات
                </button>
                <button onClick={() => setActiveTab('shelflife')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'shelflife' ? 'bg-pink-50 text-pink-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <i className="fas fa-calendar-alt"></i> فترة الصلاحية
                </button>
                <button onClick={() => setActiveTab('hscodes')} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'hscodes' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
                    <i className="fas fa-barcode"></i> الرموز الجمركية
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6 min-h-[500px]">
                
                {/* E-Numbers Checker */}
                {activeTab === 'enumbers' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">دليل المضافات الغذائية</h2>
                                <p className="text-xs font-bold text-slate-500 mt-1">ابحث برقم المادة (مثل E120) أو اسمها</p>
                            </div>
                            <div className="relative w-full md:w-96">
                                <input 
                                    type="text" 
                                    value={eSearch}
                                    onChange={(e) => setESearch(e.target.value)}
                                    placeholder="بحث (E100, Carmine...)" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-10 pl-4 text-sm font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all"
                                />
                                <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredENumbers.map((item, idx) => (
                                <div key={idx} className="border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all bg-slate-50/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-lg font-black text-slate-800 font-mono">{item.code}</span>
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${
                                            item.status.includes('مسموح') && !item.status.includes('بشروط') ? 'bg-green-100 text-green-700' :
                                            item.status.includes('ممنوع') ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                        }`}>
                                            {item.status}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-slate-700 text-sm mb-1">{item.name}</h3>
                                    <p className="text-xs text-slate-500 font-bold mb-3">{item.type}</p>
                                    {item.note && (
                                        <div className="bg-white border border-slate-200 rounded-xl p-2 text-[10px] font-bold text-slate-600 flex gap-2 items-start">
                                            <i className="fas fa-info-circle text-indigo-400 mt-0.5"></i>
                                            <p>{item.note}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {filteredENumbers.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-400">
                                    <i className="fas fa-search text-4xl mb-3 opacity-50"></i>
                                    <p className="font-bold">لم يتم العثور على نتائج مطابقة</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Epidemic Status */}
                {activeTab === 'epidemic' && (
                    <div className="space-y-6 animate-fade-in">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">قائمة الوضع الوبائي</h2>
                            <p className="text-xs font-bold text-slate-500 mt-1">الدول المحظور الاستيراد منها مؤقتاً بسبب الأوبئة</p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                                        <th className="p-4 font-black rounded-r-2xl">الدولة</th>
                                        <th className="p-4 font-black">المرض / الوباء</th>
                                        <th className="p-4 font-black">الحالة</th>
                                        <th className="p-4 font-black">تاريخ التعميم</th>
                                        <th className="p-4 font-black rounded-l-2xl">ملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-50">
                                    {epidemicAlerts.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 flex items-center gap-2">
                                                <i className="fas fa-globe-americas text-slate-300"></i>
                                                {item.country}
                                            </td>
                                            <td className="p-4 text-red-600">{item.disease}</td>
                                            <td className="p-4">
                                                <span className={`text-[10px] px-2 py-1 rounded-lg ${
                                                    item.status === 'محظور كلياً' ? 'bg-red-100 text-red-700' :
                                                    item.status === 'محظور جزئياً' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-slate-500">{item.date}</td>
                                            <td className="p-4 text-xs text-slate-500">{item.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Smart Checklists */}
                {activeTab === 'checklist' && (
                    <div className="space-y-6 animate-fade-in flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-1/3 space-y-2">
                            <h2 className="text-lg font-black text-slate-800 mb-4">اختر القائمة</h2>
                            {Object.entries(checklists).map(([key, list]) => (
                                <button 
                                    key={key}
                                    onClick={() => { setSelectedChecklist(key); setCheckedItems({}); }}
                                    className={`w-full text-right p-4 rounded-2xl border transition-all font-bold text-sm flex items-center justify-between ${
                                        selectedChecklist === key 
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm' 
                                        : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{list.title}</span>
                                    <i className={`fas fa-chevron-left text-xs ${selectedChecklist === key ? 'text-emerald-500' : 'text-slate-300'}`}></i>
                                </button>
                            ))}
                        </div>
                        
                        <div className="w-full md:w-2/3 bg-slate-50 rounded-3xl p-6 border border-slate-100">
                            {selectedChecklist && checklists[selectedChecklist] ? (
                                <>
                                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
                                        <h3 className="text-xl font-black text-slate-800">{checklists[selectedChecklist].title}</h3>
                                        <span className="text-xs font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500 shadow-sm">
                                            {Object.values(checkedItems).filter(Boolean).length} / {checklists[selectedChecklist].items.length} منجز
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {checklists[selectedChecklist].items.map((item, idx) => (
                                            <label key={idx} className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all border ${
                                                checkedItems[idx] ? 'bg-white border-emerald-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300'
                                            }`}>
                                                <div className="pt-0.5">
                                                    <input 
                                                        type="checkbox" 
                                                        className="w-5 h-5 accent-emerald-600 rounded"
                                                        checked={checkedItems[idx] || false}
                                                        onChange={(e) => setCheckedItems(prev => ({...prev, [idx]: e.target.checked}))}
                                                    />
                                                </div>
                                                <span className={`font-bold text-sm transition-all ${checkedItems[idx] ? 'text-emerald-800 line-through opacity-70' : 'text-slate-700'}`}>
                                                    {item}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-slate-200 flex justify-end">
                                        <button 
                                            onClick={() => setCheckedItems({})}
                                            className="text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors"
                                        >
                                            <i className="fas fa-undo ml-1"></i> إعادة تعيين القائمة
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-12 text-slate-400">
                                    <i className="fas fa-tasks text-4xl mb-3 opacity-50"></i>
                                    <p className="font-bold">اختر قائمة للبدء</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Units Converter */}
                {activeTab === 'converter' && (
                    <div className="space-y-8 animate-fade-in max-w-4xl">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">محول الأوزان والأحجام</h2>
                            <p className="text-xs font-bold text-slate-500 mt-1">أدوات حسابية سريعة للمفتشين</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Weight Converter */}
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                                    <i className="fas fa-balance-scale text-amber-500"></i> تحويل الأوزان
                                </h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">القيمة</label>
                                        <input 
                                            type="number" 
                                            value={convValue} 
                                            onChange={(e) => setConvValue(e.target.value ? Number(e.target.value) : '')}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-black outline-none focus:border-amber-500"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">من</label>
                                            <select 
                                                value={convFrom} 
                                                onChange={(e) => setConvFrom(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500"
                                            >
                                                <option value="kg">كيلوجرام (KG)</option>
                                                <option value="ton">طن متري (Ton)</option>
                                                <option value="lb">رطل (Lbs)</option>
                                                <option value="g">جرام (g)</option>
                                            </select>
                                        </div>
                                        <div className="pt-5 text-slate-300"><i className="fas fa-exchange-alt"></i></div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">إلى</label>
                                            <select 
                                                value={convTo} 
                                                onChange={(e) => setConvTo(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-amber-500"
                                            >
                                                <option value="kg">كيلوجرام (KG)</option>
                                                <option value="ton">طن متري (Ton)</option>
                                                <option value="lb">رطل (Lbs)</option>
                                                <option value="g">جرام (g)</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 p-4 bg-amber-100/50 rounded-2xl border border-amber-200 text-center">
                                        <p className="text-[10px] font-bold text-amber-700 uppercase mb-1">النتيجة</p>
                                        <p className="text-3xl font-black text-amber-900 font-mono">
                                            {convertWeight().toLocaleString(undefined, {maximumFractionDigits: 4})}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CBM Calculator */}
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                                    <i className="fas fa-box-open text-blue-500"></i> حساب الحجم المكعب (CBM)
                                </h3>
                                
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">الطول (سم)</label>
                                            <input type="number" value={cbmLength} onChange={(e) => setCbmLength(e.target.value ? Number(e.target.value) : '')} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" placeholder="L" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">العرض (سم)</label>
                                            <input type="number" value={cbmWidth} onChange={(e) => setCbmWidth(e.target.value ? Number(e.target.value) : '')} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" placeholder="W" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">الارتفاع (سم)</label>
                                            <input type="number" value={cbmHeight} onChange={(e) => setCbmHeight(e.target.value ? Number(e.target.value) : '')} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-blue-500" placeholder="H" />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">عدد الكراتين / العبوات</label>
                                        <input type="number" value={cbmQty} onChange={(e) => setCbmQty(e.target.value ? Number(e.target.value) : '')} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-black outline-none focus:border-blue-500" placeholder="الكمية" />
                                    </div>
                                    
                                    <div className="mt-6 p-4 bg-blue-100/50 rounded-2xl border border-blue-200 text-center">
                                        <p className="text-[10px] font-bold text-blue-700 uppercase mb-1">إجمالي الحجم (CBM)</p>
                                        <p className="text-3xl font-black text-blue-900 font-mono">
                                            {calculateCBM().toLocaleString(undefined, {maximumFractionDigits: 4})} <span className="text-sm">m³</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Temperature Converter */}
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 md:col-span-2">
                                <h3 className="text-sm font-black text-slate-700 mb-4 flex items-center gap-2">
                                    <i className="fas fa-temperature-high text-red-500"></i> تحويل درجات الحرارة
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">درجة الحرارة</label>
                                        <input 
                                            type="number" 
                                            value={tempValue} 
                                            onChange={(e) => setTempValue(e.target.value ? Number(e.target.value) : '')}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-lg font-black outline-none focus:border-red-500"
                                            placeholder="0.0"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">من</label>
                                            <select 
                                                value={tempFrom} 
                                                onChange={(e) => setTempFrom(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-red-500"
                                            >
                                                <option value="C">مئوي (Celsius)</option>
                                                <option value="F">فهرنهايت (Fahrenheit)</option>
                                            </select>
                                        </div>
                                        <div className="pt-5 text-slate-300"><i className="fas fa-exchange-alt"></i></div>
                                        <div className="flex-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">إلى</label>
                                            <select 
                                                value={tempTo} 
                                                onChange={(e) => setTempTo(e.target.value)}
                                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-red-500"
                                            >
                                                <option value="C">مئوي (Celsius)</option>
                                                <option value="F">فهرنهايت (Fahrenheit)</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 bg-red-100/50 rounded-xl border border-red-200 text-center">
                                        <p className="text-[10px] font-bold text-red-700 uppercase mb-1">النتيجة</p>
                                        <p className="text-2xl font-black text-red-900 font-mono">
                                            {convertTemp().toLocaleString(undefined, {maximumFractionDigits: 2})} °{tempTo}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sampling Calculator */}
                {activeTab === 'sampling' && (
                    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                <i className="fas fa-vial"></i>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">حاسبة سحب العينات</h2>
                            <p className="text-sm font-bold text-slate-500 mt-2">تحديد حجم العينة المطلوبة للفحص بناءً على حجم الإرسالية</p>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-2 block">حجم الإرسالية (العدد الإجمالي)</label>
                                <input 
                                    type="number" 
                                    value={lotSize} 
                                    onChange={(e) => setLotSize(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-xl font-black outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all text-center"
                                    placeholder="أدخل العدد الإجمالي للعبوات/الكراتين"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-2 block">معيار السحب</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button 
                                        onClick={() => setSamplingStandard('sqrt')}
                                        className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${samplingStandard === 'sqrt' ? 'border-purple-500 bg-purple-50 text-purple-800' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                    >
                                        الجذر التربيعي + 1
                                        <span className="block text-[10px] font-normal mt-1 opacity-70">للفحص العام السريع</span>
                                    </button>
                                    <button 
                                        onClick={() => setSamplingStandard('iso2859')}
                                        className={`p-4 rounded-2xl border-2 transition-all font-bold text-sm ${samplingStandard === 'iso2859' ? 'border-purple-500 bg-purple-50 text-purple-800' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}
                                    >
                                        ISO 2859-1
                                        <span className="block text-[10px] font-normal mt-1 opacity-70">المستوى الثاني (II)</span>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-8 p-6 bg-purple-600 rounded-2xl text-white text-center shadow-lg shadow-purple-200">
                                <p className="text-sm font-bold text-purple-200 uppercase mb-2">حجم العينة المطلوب سحبها</p>
                                <div className="flex items-center justify-center gap-3">
                                    <span className="text-6xl font-black">{calculateSampling()}</span>
                                    <span className="text-xl font-bold text-purple-200">وحدة</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6 mt-6">
                            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-4">
                                <i className="fas fa-dice text-purple-500"></i>
                                مولد العينات العشوائية
                            </h3>
                            <p className="text-xs font-bold text-slate-500 mb-4">تحديد أرقام عشوائية لسحب العينات من الإرسالية لضمان العشوائية والشفافية.</p>
                            
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">من (رقم البداية)</label>
                                    <input 
                                        type="number" 
                                        value={randomStart} 
                                        onChange={(e) => setRandomStart(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-purple-500 text-center"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">إلى (رقم النهاية)</label>
                                    <input 
                                        type="number" 
                                        value={randomEnd} 
                                        onChange={(e) => setRandomEnd(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-purple-500 text-center"
                                        placeholder={lotSize ? String(lotSize) : ''}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-600 mb-1 block">العدد المطلوب</label>
                                    <input 
                                        type="number" 
                                        value={randomCount} 
                                        onChange={(e) => setRandomCount(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-purple-500 text-center"
                                        placeholder={calculateSampling() ? String(calculateSampling()) : ''}
                                    />
                                </div>
                            </div>

                            {randomError && (
                                <p className="text-xs font-bold text-red-500 mt-2"><i className="fas fa-exclamation-circle mr-1"></i> {randomError}</p>
                            )}

                            <button 
                                onClick={generateRandomSamples}
                                className="w-full bg-purple-100 text-purple-700 hover:bg-purple-200 py-3 rounded-xl font-black text-sm transition-colors flex justify-center items-center gap-2 mt-4"
                            >
                                <i className="fas fa-bolt"></i>
                                توليد الأرقام العشوائية
                            </button>

                            {randomSamples.length > 0 && (
                                <div className="mt-6">
                                    <label className="text-xs font-bold text-slate-600 mb-3 block">الأرقام العشوائية المولدة:</label>
                                    <div className="flex flex-wrap gap-2">
                                        {randomSamples.map((num, idx) => (
                                            <span key={idx} className="bg-white border border-purple-200 text-purple-700 font-mono font-black px-3 py-1.5 rounded-lg shadow-sm text-sm">
                                                {num}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Shelf Life Calculator */}
                {activeTab === 'shelflife' && (
                    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
                                <i className="fas fa-calendar-check"></i>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800">حاسبة فترة الصلاحية</h2>
                            <p className="text-sm font-bold text-slate-500 mt-2">التحقق من استيفاء المنتجات لاشتراطات فترة الصلاحية المتبقية للاستيراد</p>
                        </div>

                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-2 block">تاريخ الإنتاج</label>
                                    <input 
                                        type="date" 
                                        value={prodDate} 
                                        onChange={(e) => setProdDate(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-600 mb-2 block">تاريخ الانتهاء</label>
                                    <input 
                                        type="date" 
                                        value={expDate} 
                                        onChange={(e) => setExpDate(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-200 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-600 mb-2 block flex justify-between">
                                    <span>الحد الأدنى المطلوب للصلاحية المتبقية</span>
                                    <span className="text-pink-600">{minRemaining}%</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="10" 
                                    max="90" 
                                    step="5"
                                    value={minRemaining} 
                                    onChange={(e) => setMinRemaining(Number(e.target.value))}
                                    className="w-full accent-pink-600"
                                />
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                                    <span>10%</span>
                                    <span>50% (نصف المدة)</span>
                                    <span>66% (ثلثي المدة)</span>
                                    <span>90%</span>
                                </div>
                            </div>

                            {(() => {
                                const result = calculateShelfLife();
                                if (!result) return null;
                                if ('error' in result) return (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm font-bold text-center">
                                        <i className="fas fa-exclamation-triangle ml-2"></i> {result.error}
                                    </div>
                                );

                                return (
                                    <div className="mt-8 pt-6 border-t border-slate-200">
                                        {result.isExpired ? (
                                            <div className="p-6 bg-red-100 text-red-800 rounded-2xl border border-red-200 text-center shadow-sm">
                                                <i className="fas fa-times-circle text-4xl mb-3"></i>
                                                <h3 className="text-xl font-black mb-1">المنتج منتهي الصلاحية!</h3>
                                                <p className="text-sm font-bold opacity-80">لا يمكن فسح المنتج لانتهاء فترة صلاحيته.</p>
                                            </div>
                                        ) : (
                                            <div className={`p-6 rounded-2xl border text-center shadow-sm ${result.isAcceptable ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                                                <i className={`fas ${result.isAcceptable ? 'fa-check-circle' : 'fa-exclamation-circle'} text-4xl mb-3`}></i>
                                                <h3 className="text-xl font-black mb-1">
                                                    {result.isAcceptable ? 'المنتج مستوفٍ لاشتراطات الصلاحية' : 'المنتج غير مستوفٍ لاشتراطات الصلاحية'}
                                                </h3>
                                                <p className="text-sm font-bold opacity-80 mb-6">
                                                    الصلاحية المتبقية ({result.remainingPercent}%) {result.isAcceptable ? 'أكبر من أو تساوي' : 'أقل من'} الحد المطلوب ({minRemaining}%)
                                                </p>
                                                
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div className="bg-white/60 p-3 rounded-xl">
                                                        <p className="text-[10px] uppercase font-bold opacity-70 mb-1">إجمالي الصلاحية</p>
                                                        <p className="text-lg font-black font-mono">{result.totalDays} <span className="text-xs">يوم</span></p>
                                                    </div>
                                                    <div className="bg-white/60 p-3 rounded-xl">
                                                        <p className="text-[10px] uppercase font-bold opacity-70 mb-1">ما مضى منها</p>
                                                        <p className="text-lg font-black font-mono">{result.passedPercent}%</p>
                                                    </div>
                                                    <div className="bg-white/60 p-3 rounded-xl">
                                                        <p className="text-[10px] uppercase font-bold opacity-70 mb-1">المتبقي منها</p>
                                                        <p className="text-lg font-black font-mono">{result.remainingDays} <span className="text-xs">يوم</span></p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}

                {/* HS Codes Lookup */}
                {activeTab === 'hscodes' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">دليل الرموز الجمركية (HS Codes)</h2>
                                <p className="text-xs font-bold text-slate-500 mt-1">ابحث برقم الرمز أو اسم السلعة</p>
                            </div>
                            <div className="relative w-full md:w-96">
                                <input 
                                    type="text" 
                                    value={hsSearch}
                                    onChange={(e) => setHsSearch(e.target.value)}
                                    placeholder="بحث (01012100, خيول...)" 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pr-10 pl-4 text-sm font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                                />
                                <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-wider">
                                        <th className="p-4 font-black rounded-r-2xl">الرمز الجمركي</th>
                                        <th className="p-4 font-black">الوصف</th>
                                        <th className="p-4 font-black rounded-l-2xl">التصنيف</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-bold text-slate-700 divide-y divide-slate-50">
                                    {filteredHSCodes.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-mono text-blue-600 font-black tracking-widest">{item.code}</td>
                                            <td className="p-4">{item.name}</td>
                                            <td className="p-4">
                                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-lg">
                                                    {item.category}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredHSCodes.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-12 text-center text-slate-400">
                                                <i className="fas fa-search text-4xl mb-3 opacity-50"></i>
                                                <p className="font-bold">لم يتم العثور على نتائج مطابقة</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default InspectorTools;
