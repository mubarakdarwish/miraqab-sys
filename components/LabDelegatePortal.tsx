import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Consignment, User, Sample, AuditLogEntry, Laboratory, Port, ConsignmentType } from '../types';
import { MapPin, Truck, CheckSquare, Search, Box, FlaskConical, Hash, CheckCircle, Clock, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const SECTOR_LABELS: Record<string, string> = {
    [ConsignmentType.AGRICULTURAL]: 'زراعي',
    [ConsignmentType.VETERINARY]: 'حيواني',
    [ConsignmentType.FOOD_SAFETY]: 'سلامة أغذية',
    'ALL': 'جميع القطاعات'
};

interface LabDelegatePortalProps {
    consignments: Consignment[];
    currentUser: User;
    onUpdateConsignment: (updatedConsignment: Consignment) => void;
    laboratories: Laboratory[];
    ports: Port[];
}

export const LabDelegatePortal: React.FC<LabDelegatePortalProps> = ({ consignments, currentUser, onUpdateConsignment, laboratories, ports }) => {
    const [activeTab, setActiveTab] = useState<'PENDING' | 'COMPLETED'>('PENDING');
    const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSector, setFilterSector] = useState<string>('ALL');
    const [filterPort, setFilterPort] = useState<string>('ALL');
    const [isProcessing, setIsProcessing] = useState(false);
    const [adminSelectedLabId, setAdminSelectedLabId] = useState<string>('');
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const isSuperUser = ['ADMIN', 'MANAGER'].includes(currentUser.role) || ['ADMIN', 'MANAGER'].includes(currentUser.originalRole || '');
    const effectiveLabId = isSuperUser ? adminSelectedLabId : currentUser.assignedLabId;

    const targetLabName = useMemo(() => {
        return laboratories.find(l => l.id === effectiveLabId)?.name || '';
    }, [laboratories, effectiveLabId]);

    const allAssignedSamples = useMemo(() => {
        if (!effectiveLabId && !isSuperUser) return [];
        
        return consignments.flatMap(c => {
            if (!c.samples) return [];
            return c.samples
                .filter(s => targetLabName ? s.labName === targetLabName : true)
                .map(s => ({
                    sample: s,
                    consignment: c,
                    productName: c.items.length > 0 ? c.items[0].description : 'منتج غير محدد'
                }));
        });
    }, [consignments, effectiveLabId, targetLabName, isSuperUser]);

    const pendingSamples = useMemo(() => {
        return allAssignedSamples.filter(s => {
            const isCompleted = s.sample.result && s.sample.result !== 'Pending';
            // Anything drawn and not yet completed or picked up goes to pending
            return (!s.sample.status || s.sample.status === 'DRAWN') && !isCompleted;
        });
    }, [allAssignedSamples]);

    const completedSamples = useMemo(() => {
        return allAssignedSamples.filter(s => {
            const isCompleted = s.sample.result && s.sample.result !== 'Pending';
            return isCompleted || s.sample.status === 'PICKED_UP' || s.sample.status === 'AT_LAB' || s.sample.status === 'UNDER_ANALYSIS' || s.sample.status === 'COMPLETED';
        }).sort((a, b) => new Date(b.sample.date).getTime() - new Date(a.sample.date).getTime());
    }, [allAssignedSamples]);

    const displayedSamples = useMemo(() => {
        let res = activeTab === 'PENDING' ? pendingSamples : completedSamples;
        
        if (filterSector !== 'ALL') {
            res = res.filter(s => s.consignment.type === filterSector);
        }

        if (filterPort !== 'ALL') {
            res = res.filter(s => s.consignment.port === filterPort);
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            res = res.filter(s => 
                s.sample.sampleId.toLowerCase().includes(term) || 
                s.productName.toLowerCase().includes(term) ||
                (s.sample.sampleSeal && s.sample.sampleSeal.toLowerCase().includes(term))
            );
        }
        return res;
    }, [activeTab, pendingSamples, completedSamples, searchTerm, filterSector, filterPort]);

    const handleConfirmReceipt = async () => {
        if (selectedSampleIds.length === 0) return;
        setIsProcessing(true);

        try {
            // Group selected samples by consignment to update them efficiently
            const consignmentsToUpdate = new Map<string, { consignment: Consignment, samplesToUpdate: string[] }>();
            
            selectedSampleIds.forEach(sampleId => {
                const sData = pendingSamples.find(s => s.sample.sampleId === sampleId);
                if (sData) {
                    if (!consignmentsToUpdate.has(sData.consignment.id)) {
                        consignmentsToUpdate.set(sData.consignment.id, { consignment: sData.consignment, samplesToUpdate: [] });
                    }
                    consignmentsToUpdate.get(sData.consignment.id)!.samplesToUpdate.push(sampleId);
                }
            });

            for (const [id, data] of Array.from(consignmentsToUpdate.entries())) {
                const { consignment, samplesToUpdate } = data;
                
                const updatedSamples = consignment.samples.map(s => {
                    if (samplesToUpdate.includes(s.sampleId)) {
                        return { 
                            ...s, 
                            status: 'PICKED_UP' as const,
                            pickupDate: new Date().toISOString(),
                            pickupBy: currentUser.name
                        };
                    }
                    return s;
                });

                const audit: AuditLogEntry = {
                    timestamp: new Date().toISOString(),
                    action: 'تأكيد استلام عينات للنقل',
                    user: currentUser.name,
                    details: `تم الاستلام للنقل: ${samplesToUpdate.join(', ')}`
                };

                await onUpdateConsignment({
                    ...consignment,
                    samples: updatedSamples,
                    auditLog: [...(consignment.auditLog || []), audit]
                });
            }

            // Clear selection
            setSelectedSampleIds([]);
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء تحديث حالة العينات.');
        } finally {
            setIsProcessing(false);
        }
    };

    const toggleSelection = (sampleId: string) => {
        setSelectedSampleIds(prev => 
            prev.includes(sampleId) ? prev.filter(id => id !== sampleId) : [...prev, sampleId]
        );
    };

    const toggleSelectAll = () => {
        if (selectedSampleIds.length === displayedSamples.length) {
            setSelectedSampleIds([]);
        } else {
            setSelectedSampleIds(displayedSamples.map(s => s.sample.sampleId));
        }
    };

    const startScanner = () => {
        setIsScannerOpen(true);
        setTimeout(async () => {
            try {
                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length > 0) {
                    if (!scannerRef.current) {
                        scannerRef.current = new Html5Qrcode("reader");
                    }
                    
                    try {
                        await scannerRef.current.start(
                            { facingMode: "environment" },
                            { fps: 10, qrbox: { width: 250, height: 250 } },
                            (decodedText) => {
                                const found = pendingSamples.find(s => s.sample.sampleId === decodedText);
                                if (found) {
                                    alert(`تم التقاط العينة بنجاح: ${decodedText}`);
                                    setSelectedSampleIds(prev => prev.includes(decodedText) ? prev : [...prev, decodedText]);
                                    stopScanner();
                                } else {
                                    alert(`العينة ${decodedText} غير موجودة في القائمة الحالية المخصصة لك.`);
                                    stopScanner();
                                }
                            },
                            (errorMessage) => {
                                // Ignore scan errors
                            }
                        );
                    } catch (envError) {
                        // Fallback to first camera if environment camera fails
                        await scannerRef.current.start(
                            cameras[0].id,
                            { fps: 10, qrbox: { width: 250, height: 250 } },
                            (decodedText) => {
                                const found = pendingSamples.find(s => s.sample.sampleId === decodedText);
                                if (found) {
                                    alert(`تم التقاط العينة بنجاح: ${decodedText}`);
                                    setSelectedSampleIds(prev => prev.includes(decodedText) ? prev : [...prev, decodedText]);
                                    stopScanner();
                                } else {
                                    alert(`العينة ${decodedText} غير موجودة في القائمة الحالية المخصصة لك.`);
                                    stopScanner();
                                }
                            },
                            (errorMessage) => {
                                // Ignore scan errors
                            }
                        );
                    }
                } else {
                    alert("لم يتم العثور على أي كاميرا في هذا الجهاز.");
                    setIsScannerOpen(false);
                }
            } catch (err) {
                console.error("Failed to start scanner:", err);
                alert("تعذر الوصول إلى الكاميرا. يرجى التأكد من السماح بالصلاحيات.");
                setIsScannerOpen(false);
            }
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
                scannerRef.current?.clear();
                setIsScannerOpen(false);
            }).catch(e => console.error("Failed to stop scanner", e));
        } else {
            setIsScannerOpen(false);
        }
    };

    useEffect(() => {
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => scannerRef.current?.clear()).catch(console.error);
            }
        };
    }, []);

    return (
        <div className="w-full mx-auto relative">
            {isScannerOpen && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-sm flex flex-col shadow-2xl relative overflow-hidden">
                        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
                            <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><i className="fas fa-camera"></i> مسح رمز العينة</h3>
                            <button onClick={stopScanner} className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="flex-1 bg-black flex items-center justify-center relative min-h-[300px]">
                            <div id="reader" className="w-full"></div>
                        </div>
                        <div className="p-4 bg-white text-center">
                            <p className="text-xs font-bold text-slate-500 leading-relaxed">وجه كاميرا الهاتف نحو رمز الاستجابة السريعة (QR Code)<br/>الخاص بالعينة ليتم تحديده تلقائياً.</p>
                        </div>
                    </div>
                </div>
            )}
        <div className="w-full max-w-4xl mx-auto p-2 sm:py-8">
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-4 sm:p-8 bg-indigo-600 text-white flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col gap-2 text-center md:text-right w-full md:w-auto">
                        <div className="flex items-center justify-center md:justify-start gap-3">
                            <Truck className="w-6 h-6 sm:w-8 sm:h-8" />
                            <h2 className="text-2xl sm:text-3xl font-black">بوابة استلام العينات</h2>
                        </div>
                        <p className="text-indigo-200 font-bold text-sm sm:text-base">بإمكانك استلام العينات الموجهة لمختبرك لغرض النقل</p>
                        
                        {isSuperUser && (
                            <div className="mt-4 flex flex-col md:flex-row items-center justify-center md:justify-start gap-2 bg-white/10 p-3 rounded-xl w-full md:w-auto">
                                <span className="text-xs font-bold text-indigo-100">عرض مختبر معين:</span>
                                <select 
                                    value={adminSelectedLabId}
                                    onChange={(e) => setAdminSelectedLabId(e.target.value)}
                                    className="bg-white text-slate-800 border border-slate-200 rounded-lg text-sm font-bold py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-auto min-w-[200px]"
                                >
                                    <option value="">جميع المختبرات (عرض الكل)</option>
                                    {laboratories.map(lab => (
                                        <option key={lab.id} value={lab.id}>{lab.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-2 text-[10px] sm:text-[11px] font-black uppercase text-indigo-100">
                            {targetLabName && <span className="bg-white/10 px-2 sm:px-3 py-1 rounded-full"><i className="fas fa-building ml-1"></i> المختبر المعين: {targetLabName}</span>}
                            <span className="bg-white/10 px-2 sm:px-3 py-1 rounded-full"><i className="fas fa-vial ml-1"></i> بانتظار الاستلام: {pendingSamples.length}</span>
                            <span className="bg-white/10 px-2 sm:px-3 py-1 rounded-full"><i className="fas fa-check-circle ml-1"></i> العينات المستلمة: {completedSamples.length}</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl mb-6">
                        <button
                            onClick={() => { setActiveTab('PENDING'); setSelectedSampleIds([]); }}
                            className={`flex-1 py-3 text-center rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                                activeTab === 'PENDING' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                        >
                            <Clock className="w-4 h-4" /> بانتظار الاستلام للنقل
                            {pendingSamples.length > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{pendingSamples.length}</span>}
                        </button>
                        <button
                            onClick={() => { setActiveTab('COMPLETED'); setSelectedSampleIds([]); }}
                            className={`flex-1 py-3 text-center rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                                activeTab === 'COMPLETED' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/50' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }`}
                        >
                            <CheckCircle className="w-4 h-4" /> العينات المستلمة / النتائج
                            {completedSamples.length > 0 && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{completedSamples.length}</span>}
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 mb-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="relative w-full sm:w-1/2 flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="بحث برقم العينة..."
                                        className="w-full pr-11 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all font-bold text-sm"
                                    />
                                </div>
                                <button onClick={startScanner} className="w-12 h-12 shrink-0 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-2xl flex items-center justify-center transition-all border border-blue-100 shadow-sm" title="مسح رمز الاستجابة السريعة">
                                    <i className="fas fa-qrcode text-xl"></i>
                                </button>
                            </div>
                            <div className="flex gap-4 w-full sm:w-auto">
                                {activeTab === 'PENDING' && (
                                    <button
                                        onClick={handleConfirmReceipt}
                                        disabled={selectedSampleIds.length === 0 || isProcessing}
                                        className={`flex-1 sm:flex-none px-6 py-3 rounded-2xl font-black flex items-center justify-center gap-2 transition-all ${
                                            selectedSampleIds.length > 0 
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-600/20' 
                                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <CheckSquare className="w-5 h-5" />
                                        {isProcessing ? 'جاري التأكيد...' : `تأكيد استلام (${selectedSampleIds.length})`}
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-black text-slate-500 shrink-0">القطاع:</span>
                                <select 
                                    value={filterSector}
                                    onChange={(e) => setFilterSector(e.target.value)}
                                    className="w-full bg-transparent outline-none text-xs font-bold text-slate-700"
                                >
                                    <option value="ALL">الكل</option>
                                    {Object.values(ConsignmentType).map(type => (
                                        <option key={type} value={type}>{SECTOR_LABELS[type]}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex-1 flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <span className="text-xs font-black text-slate-500 shrink-0">المنفذ:</span>
                                <select 
                                    value={filterPort}
                                    onChange={(e) => setFilterPort(e.target.value)}
                                    className="w-full bg-transparent outline-none text-xs font-bold text-slate-700"
                                >
                                    <option value="ALL">الكل</option>
                                    {ports.map(port => (
                                        <option key={port.id} value={port.name}>{port.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                        {displayedSamples.length === 0 ? (
                            <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-slate-500">لا توجد عينات لعرضها</h3>
                                <p className="text-xs font-bold text-slate-400 mt-2">جرب تغيير خيارات التصفية أو البحث</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {displayedSamples.map(({ sample, consignment, productName }, idx) => (
                                    <motion.div 
                                        key={`${consignment.id}-${sample.sampleId}`}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => activeTab === 'PENDING' && toggleSelection(sample.sampleId)}
                                        className={`p-5 rounded-3xl border-2 transition-all ${activeTab === 'PENDING' ? 'cursor-pointer hover:border-slate-300' : 'cursor-default'} flex gap-4 items-start ${
                                            selectedSampleIds.includes(sample.sampleId) 
                                                ? 'bg-indigo-50 border-indigo-500 shadow-sm' 
                                                : 'bg-white border-slate-100 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                            selectedSampleIds.includes(sample.sampleId)
                                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                                : 'bg-white border-slate-300'
                                        }`}>
                                            {selectedSampleIds.includes(sample.sampleId) && <CheckSquare className="w-3.5 h-3.5" />}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-black text-slate-800">{sample.sampleId}</h4>
                                                    <div className="flex gap-1">
                                                        <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-lg text-slate-500 font-black">
                                                            {SECTOR_LABELS[consignment.type]}
                                                        </span>
                                                        <span className="text-[10px] bg-indigo-50 px-2 py-1 rounded-lg text-indigo-600 font-bold uppercase">
                                                            {sample.labAnalysisType.join(' + ')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                                                    <Box className="w-3.5 h-3.5 text-slate-400" />
                                                    {productName}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {consignment.port}
                                                </p>
                                            </div>
                                            
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-white p-2 rounded-xl text-center border border-slate-100">
                                                    <span className="block text-[9px] font-black text-slate-400 mb-0.5">حجم العينة</span>
                                                    <span className="text-xs font-black text-slate-700">{sample.sampleSize || '-'}</span>
                                                </div>
                                                <div className="bg-white p-2 rounded-xl text-center border border-slate-100">
                                                    <span className="block text-[9px] font-black text-slate-400 mb-0.5">رقم الختم</span>
                                                    <span className="text-xs font-black text-slate-700">{sample.sampleSeal || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
};

export default LabDelegatePortal;
