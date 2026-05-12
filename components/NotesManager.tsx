
import React, { useState, useEffect, useMemo } from 'react';
import { Consignment, ConsignmentType, User, ShiftNote, ShiftType, Port, SectorShiftConfig, ShiftConfig } from '../types';
import { CONSIGNMENT_LABELS } from '../constants';
import * as FB from '../firebaseService';
import { motion } from 'framer-motion';

interface NotesManagerProps {
  consignments: Consignment[];
  currentUser: User;
  activeSector: ConsignmentType;
  users: User[];
  ports: Port[];
}

const NotesManager: React.FC<NotesManagerProps> = ({ consignments, currentUser, activeSector, users, ports }) => {
  const [activeTab, setActiveTab] = useState<'SHIFT_NOTES' | 'CONSIGNMENT_REMARKS'>('SHIFT_NOTES');
  const [shiftNotes, setShiftNotes] = useState<ShiftNote[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Unified Sector Filter State - Defaults to the app's active sector
  const [selectedSector, setSelectedSector] = useState<ConsignmentType>(activeSector);
  const [selectedPort, setSelectedPort] = useState<string | undefined>(() => {
      if (currentUser.role === 'ADMIN') return undefined;
      return currentUser.assignedPorts?.[0];
  });

  // Shift Note Input State
  const [noteContent, setNoteContent] = useState('');
  const [noteCategory, setNoteCategory] = useState<'GENERAL' | 'URGENT' | 'HANDOVER' | 'PREVIEW'>('GENERAL');
  const [selectedShift, setSelectedShift] = useState<ShiftType>('MORNING');
  const [consignmentSearchTerm, setConsignmentSearchTerm] = useState('');
  const [shiftNoteSearchTerm, setShiftNoteSearchTerm] = useState('');
  const [shiftConfig, setShiftConfig] = useState<SectorShiftConfig | null>(null);

  const defaultShifts: ShiftConfig[] = [
      { id: 'MORNING', name: 'الصباحية', startTime: '07:00', endTime: '19:00', color: 'amber', icon: 'fa-sun' },
      { id: 'EVENING', name: 'المسائية', startTime: '19:00', endTime: '07:00', color: 'indigo', icon: 'fa-moon' }
  ];

  const currentShifts = shiftConfig?.shifts || defaultShifts;
  
  // Added editing state to fix missing identifier errors
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Sync selected sector with active sector when prop changes (initial load)
  useEffect(() => {
      setSelectedSector(activeSector);
  }, [activeSector]);

  // Load Shift Notes
  useEffect(() => {
      const unsub = FB.subscribeToCollection('shiftNotes', (data) => {
          // Sort by timestamp desc
          const sorted = (data as ShiftNote[]).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setShiftNotes(sorted);
      });
      
      return () => unsub();
  }, []);

  useEffect(() => {
      if (!selectedPort) return;
      const unsub = FB.subscribeToSectorShiftConfig(selectedSector, selectedPort, (data) => {
          setShiftConfig(data);
      });
      return () => unsub();
  }, [selectedSector, selectedPort]);

  useEffect(() => {
      const calculateShift = () => {
          const now = new Date();
          const hour = now.getHours();
          const minute = now.getMinutes();
          const currentTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

          const active = currentShifts.find(s => {
              if (s.startTime < s.endTime) {
                  return currentTime >= s.startTime && currentTime < s.endTime;
              } else {
                  return currentTime >= s.startTime || currentTime < s.endTime;
              }
          });

          if (active) setSelectedShift(active.id);
          else if (currentShifts.length > 0) setSelectedShift(currentShifts[0].id);
      };
      calculateShift();
  }, [shiftConfig]);

  const handleAddOrUpdateNote = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!noteContent.trim()) return;

      if (editingNoteId) {
          // Update existing note
          const existingNote = shiftNotes.find(n => n.id === editingNoteId);
          if (existingNote) {
              const updatedNote: ShiftNote = {
                  ...existingNote,
                  content: noteContent,
                  category: noteCategory,
              };
              await FB.updateShiftNoteInDB(updatedNote);
              setEditingNoteId(null);
          }
      } else {
          // Create new note
          const newNote: ShiftNote = {
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date().toISOString(),
              user: currentUser.name,
              userId: currentUser.id,
              shift: selectedShift,
              sector: selectedSector, // Save note for the selected sector
              port: selectedPort, // Save note for the selected port
              content: noteContent,
              category: noteCategory,
              isResolved: false
          };
          await FB.addShiftNoteToDB(newNote);
      }
      
      setNoteContent('');
      setNoteCategory('GENERAL');
  };

  const handleStartEdit = (note: ShiftNote) => {
      setEditingNoteId(note.id);
      setNoteContent(note.content);
      setNoteCategory(note.category);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
      setEditingNoteId(null);
      setNoteContent('');
      setNoteCategory('GENERAL');
  };

  const handleDeleteNote = async (id: string) => {
      if(window.confirm('هل أنت متأكد من حذف الملاحظة؟')) {
          await FB.deleteShiftNoteFromDB(id);
          if (editingNoteId === id) cancelEdit();
      }
  };

  const handleResolveNote = async (note: ShiftNote) => {
      await FB.updateShiftNoteInDB({...note, isResolved: !note.isResolved});
  };

  const canEditOrDelete = (note: ShiftNote) => {
      return currentUser.role === 'ADMIN' || currentUser.id === note.userId;
  };

  // Filter shift notes by selected sector and port
  const filteredShiftNotes = useMemo(() => {
      return shiftNotes.filter(n => {
          // For old notes without sector/port, determine from user if possible
          let noteSector = n.sector;
          let notePort = n.port;
          
          if (!noteSector || !notePort) {
             const noteUser = users.find(u => u.name === n.user || u.id === n.userId);
             if (noteUser) {
                 if (!noteSector && noteUser.allowedSectors && noteUser.allowedSectors.length > 0) {
                     noteSector = noteUser.allowedSectors[0];
                 }
                 if (!notePort && noteUser.assignedPorts && noteUser.assignedPorts.length > 0) {
                     notePort = noteUser.assignedPorts[0];
                 }
             }
          }

          const sectorMatch = noteSector === selectedSector || !noteSector;
          const portMatch = !selectedPort || notePort === selectedPort;
          const searchMatch = !shiftNoteSearchTerm || 
              n.content.toLowerCase().includes(shiftNoteSearchTerm.toLowerCase()) ||
              n.user.toLowerCase().includes(shiftNoteSearchTerm.toLowerCase());
              
          return sectorMatch && portMatch && searchMatch;
      });
  }, [shiftNotes, selectedSector, selectedPort, users, shiftNoteSearchTerm]);

  // Filter consignments that have remarks and match the selected sector and port
  const consignmentsWithRemarks = useMemo(() => {
      return consignments.filter(c => {
          // Logic to determine sector and port for old records or missing data
          let itemSector = c.type;
          let itemPort = c.port;

          if (!itemSector || !itemPort) {
              const inspector = users.find(u => u.name === c.inspectorName);
              if (inspector) {
                  if (!itemSector && inspector.allowedSectors && inspector.allowedSectors.length > 0) {
                      itemSector = inspector.allowedSectors[0];
                  }
                  if (!itemPort && inspector.assignedPorts && inspector.assignedPorts.length > 0) {
                      itemPort = inspector.assignedPorts[0]; // Map ID to name if needed, but usually port is stored as name or ID. Assuming consistency.
                      // Note: In Consignment, port is string (name). In User, assignedPorts is string[] (ids or names?).
                      // Looking at UserManager, assignedPorts stores IDs. Consignment.port stores Name usually.
                      // We might need to map ID to Name if User stores IDs.
                      // Let's check how ports are handled. 
                      // In NotesManager props: ports: Port[].
                      const portObj = ports.find(p => p.id === inspector.assignedPorts?.[0]);
                      if (portObj) itemPort = portObj.name;
                  }
              }
          }

          // Fallback if still missing and we have a selected port (for port) - actually we shouldn't force it.
          
          const sectorMatch = itemSector === selectedSector;
          const portMatch = !selectedPort || itemPort === selectedPort;
          const hasRemarks = (c.remarks && c.remarks.trim().length > 0) || (c.inspectionNotes && c.inspectionNotes.trim().length > 0);
          
          const searchMatch = !consignmentSearchTerm || 
              c.bayanNumber.includes(consignmentSearchTerm) ||
              c.importer.toLowerCase().includes(consignmentSearchTerm.toLowerCase()) ||
              (c.remarks && c.remarks.toLowerCase().includes(consignmentSearchTerm.toLowerCase())) ||
              (c.inspectionNotes && c.inspectionNotes.toLowerCase().includes(consignmentSearchTerm.toLowerCase())) ||
              (c.inspectorName && c.inspectorName.toLowerCase().includes(consignmentSearchTerm.toLowerCase()));

          return sectorMatch && portMatch && hasRemarks && searchMatch;
      });
  }, [consignments, selectedSector, selectedPort, consignmentSearchTerm, users, ports]);

  return (
    <div className="grid grid-cols-1 gap-8 animate-fade-in pb-10">
        
        {/* Header & Tabs */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-2xl shadow-sm">
                    <i className="fas fa-clipboard-list"></i>
                </div>
                <div>
                    <h3 className="font-black text-xl text-slate-800">سجل الملاحظات والمناوبات</h3>
                    <p className="text-xs text-slate-400 font-bold mt-1">إدارة تسليم المناوبات ومتابعة ملاحظات الإرساليات</p>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <div className="flex p-1 bg-slate-50 border border-slate-200 rounded-2xl">
                    <button 
                        onClick={() => setActiveTab('SHIFT_NOTES')}
                        className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'SHIFT_NOTES' 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <i className="fas fa-bullhorn"></i> ملاحظات المناوبة
                    </button>
                    <button 
                        onClick={() => setActiveTab('CONSIGNMENT_REMARKS')}
                        className={`px-6 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
                            activeTab === 'CONSIGNMENT_REMARKS' 
                            ? 'bg-[#c8102e] text-white shadow-lg' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                    >
                        <i className="fas fa-boxes"></i> ملاحظات الإرساليات
                    </button>
                </div>

                {/* View Mode Toggle */}
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0 h-full">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`w-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
                            title="عرض بطاقات"
                        >
                            <i className="fas fa-th-large"></i>
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`w-10 rounded-lg flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:bg-slate-50'}`}
                            title="عرض جدول"
                        >
                            <i className="fas fa-list"></i>
                        </button>
                </div>
            </div>
        </div>

        {/* Unified Sector & Port Selector for both tabs */}
        <div className="flex flex-col items-center gap-4 -mb-4">
            <div className="inline-flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm gap-1">
                {Object.values(ConsignmentType).filter(sector => currentUser.role === 'ADMIN' || currentUser.allowedSectors?.includes(sector)).map(sector => (
                    <button
                        key={sector}
                        onClick={() => setSelectedSector(sector)}
                        className={`px-8 py-2.5 rounded-xl text-xs font-black transition-all ${
                            selectedSector === sector 
                            ? 'bg-slate-800 text-white shadow-md' 
                            : 'text-slate-400 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                    >
                        {CONSIGNMENT_LABELS[sector]}
                    </button>
                ))}
            </div>

            {(currentUser.role === 'ADMIN' || (currentUser.assignedPorts && currentUser.assignedPorts.length > 1)) && (
                <div className="inline-flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm gap-1 overflow-x-auto max-w-full">
                    {currentUser.role === 'ADMIN' && (
                        <button
                            onClick={() => setSelectedPort(undefined)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
                                selectedPort === undefined 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}
                        >
                            جميع المنافذ
                        </button>
                    )}
                    {ports.filter(port => currentUser.role === 'ADMIN' || currentUser.assignedPorts?.includes(port.name)).map(port => (
                        <button
                            key={port.id}
                            onClick={() => setSelectedPort(port.name)}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
                                selectedPort === port.name 
                                ? 'bg-indigo-600 text-white shadow-md' 
                                : 'text-slate-400 hover:bg-slate-50'
                            }`}
                        >
                            {port.name}
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* --- Tab 1: Shift Notes --- */}
        {activeTab === 'SHIFT_NOTES' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-24">
                        <h4 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-2">
                            <i className={`fas ${editingNoteId ? 'fa-edit text-amber-500' : 'fa-pen-fancy text-indigo-500'}`}></i>
                            {editingNoteId ? 'تعديل الملاحظة' : 'إضافة ملاحظة فنية'}
                        </h4>
                        <form onSubmit={handleAddOrUpdateNote} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">الوردية</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {currentShifts.map(s => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => setSelectedShift(s.id)}
                                            className={`py-3 rounded-xl text-[10px] font-black border transition-all flex items-center justify-center gap-2 ${selectedShift === s.id ? 'bg-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            <i className={`fas ${s.icon}`}></i>
                                            {s.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase">التصنيف</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['GENERAL', 'URGENT', 'HANDOVER', 'PREVIEW'].map(cat => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setNoteCategory(cat as any)}
                                            className={`py-3 rounded-xl text-[10px] font-black border transition-all ${noteCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500'}`}
                                        >
                                            {cat === 'GENERAL' ? 'عامة' : cat === 'URGENT' ? 'عاجلة' : cat === 'HANDOVER' ? 'تسليم' : 'معاينة'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <textarea 
                                value={noteContent} 
                                onChange={(e) => setNoteContent(e.target.value)} 
                                rows={5} 
                                placeholder="اكتب ملاحظات تسليم المناوبة أو أحداث اليوم..." 
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 resize-none" 
                            />
                            <div className="flex flex-col gap-2">
                                <button type="submit" disabled={!noteContent.trim()} className={`w-full py-4 rounded-xl font-black text-xs transition-all shadow-lg ${editingNoteId ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}>
                                    {editingNoteId ? 'حفظ التعديلات' : 'نشر الملاحظة'}
                                </button>
                                {editingNoteId && (
                                    <button type="button" onClick={cancelEdit} className="w-full py-3 rounded-xl font-bold text-xs text-slate-500 bg-slate-100 hover:bg-slate-200">إلغاء التعديل</button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    {/* Search Input for Shift Notes */}
                    <div className="relative mb-4">
                        <input
                            type="text"
                            placeholder="بحث في ملاحظات المناوبة..."
                            value={shiftNoteSearchTerm}
                            onChange={(e) => setShiftNoteSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-12 py-4 text-sm font-bold shadow-sm outline-none focus:border-indigo-500 transition-all"
                        />
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                            <i className="fas fa-search"></i>
                        </div>
                    </div>

                    {filteredShiftNotes.length === 0 ? (
                        <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center">
                            <p className="text-slate-400 font-bold">لا توجد ملاحظات مسجلة لقطاع {CONSIGNMENT_LABELS[selectedSector]}</p>
                        </div>
                    ) : (
                        viewMode === 'grid' ? (
                            filteredShiftNotes.map(note => (
                                <div key={note.id} className={`p-6 rounded-[2rem] border transition-all relative overflow-hidden group ${note.category === 'URGENT' ? 'bg-red-50 border-red-100' : note.category === 'PREVIEW' ? 'bg-emerald-50 border-emerald-100' : editingNoteId === note.id ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-500/10' : 'bg-white border-slate-100 shadow-sm'}`}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${note.category === 'URGENT' ? 'bg-red-500' : note.category === 'PREVIEW' ? 'bg-emerald-500' : 'bg-blue-500'}`}><i className="fas fa-comment-alt"></i></div>
                                            <div>
                                                <h5 className="font-black text-slate-800 text-sm">{note.user}</h5>
                                                <p className="text-[10px] text-slate-500 font-mono">{new Date(note.timestamp).toLocaleString('ar-OM')} | {currentShifts.find(s => s.id === note.shift)?.name || note.shift}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleResolveNote(note)}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                                    note.isResolved ? 'bg-green-500 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:bg-green-50 hover:text-green-600'
                                                }`}
                                                title={note.isResolved ? 'تمت المعالجة' : 'تحديد كمكتمل'}
                                            >
                                                <i className="fas fa-check text-xs"></i>
                                            </button>
                                            {canEditOrDelete(note) && (
                                                <>
                                                    <button onClick={() => handleStartEdit(note)} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-amber-500 flex items-center justify-center transition-all shadow-sm" title="تعديل الملاحظة">
                                                        <i className="fas fa-pen text-[10px]"></i>
                                                    </button>
                                                    <button onClick={() => handleDeleteNote(note.id)} className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 flex items-center justify-center transition-all shadow-sm" title="حذف الملاحظة">
                                                        <i className="fas fa-trash-alt text-[10px]"></i>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <p className={`text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap ${note.isResolved ? 'line-through opacity-50' : ''}`}>{note.content}</p>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-right">
                                        <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-500">
                                            <tr>
                                                <th className="p-4">التاريخ والوقت</th>
                                                <th className="p-4">النوع</th>
                                                <th className="p-4">الوردية</th>
                                                <th className="p-4">الموظف</th>
                                                <th className="p-4 w-1/3">الملاحظة</th>
                                                <th className="p-4 text-center">الحالة</th>
                                                <th className="p-4 text-center">إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredShiftNotes.map(note => (
                                                <tr key={note.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="p-4 font-mono text-slate-600 text-[10px]">
                                                        {new Date(note.timestamp).toLocaleDateString('ar-OM')} <br/>
                                                        {new Date(note.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`text-[9px] font-black px-2 py-1 rounded ${
                                                            note.category === 'URGENT' ? 'bg-red-100 text-red-600' :
                                                            note.category === 'HANDOVER' ? 'bg-amber-100 text-amber-600' : 
                                                            note.category === 'PREVIEW' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                                                        }`}>
                                                            {note.category === 'URGENT' ? 'عاجلة' : note.category === 'HANDOVER' ? 'تسليم' : note.category === 'PREVIEW' ? 'معاينة' : 'عامة'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-xs font-bold text-slate-600">{currentShifts.find(s => s.id === note.shift)?.name || note.shift}</td>
                                                    <td className="p-4 text-xs font-bold text-slate-700">{note.user}</td>
                                                    <td className={`p-4 text-xs font-bold leading-snug ${note.isResolved ? 'line-through text-slate-400' : 'text-slate-700'}`}>{note.content}</td>
                                                    <td className="p-4 text-center">
                                                        <span className={`text-[9px] font-bold px-2 py-1 rounded ${note.isResolved ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                                            {note.isResolved ? 'مكتمل' : 'نشط'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button 
                                                                onClick={() => handleResolveNote(note)}
                                                                className="w-8 h-8 rounded-lg bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center"
                                                                title="تحديد كمكتمل"
                                                            >
                                                                <i className="fas fa-check text-xs"></i>
                                                            </button>
                                                            {canEditOrDelete(note) && (
                                                                <>
                                                                    <button 
                                                                        onClick={() => handleStartEdit(note)} 
                                                                        className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center"
                                                                        title="تعديل"
                                                                    >
                                                                        <i className="fas fa-pen text-xs"></i>
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => handleDeleteNote(note.id)} 
                                                                        className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                                                        title="حذف"
                                                                    >
                                                                        <i className="fas fa-trash-alt text-xs"></i>
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        )}
        
        {/* --- Tab 2: Consignment Remarks --- */}
        {activeTab === 'CONSIGNMENT_REMARKS' && (
            <div className="space-y-6">
                {/* Search Input */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="بحث في ملاحظات الإرساليات (رقم البيان، المستورد، الملاحظة...)"
                        value={consignmentSearchTerm}
                        onChange={(e) => setConsignmentSearchTerm(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-12 py-4 text-sm font-bold shadow-sm outline-none focus:border-indigo-500 transition-all"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400">
                        <i className="fas fa-search"></i>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {consignmentsWithRemarks.length > 0 ? (
                            consignmentsWithRemarks.map(c => (
                                <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{c.bayanNumber}</span>
                                            <h4 className="font-bold text-slate-800 text-sm mt-1">{c.importer}</h4>
                                        </div>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                            c.status === 'Approved' ? 'bg-green-100 text-green-600' : 
                                            c.status === 'Rejected' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                                        }`}>
                                            {c.status === 'Approved' ? 'م' : c.status === 'Rejected' ? 'ر' : 'ع'}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 relative space-y-3">
                                        <div className="flex items-center gap-2 mb-2 border-b border-slate-200 pb-2">
                                            <i className="fas fa-user-shield text-slate-400 text-xs"></i>
                                            <span className="text-[10px] font-bold text-slate-500">المفتش: {c.inspectorName}</span>
                                        </div>
                                        
                                        {c.inspectionNotes && (
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">ملاحظات المعاينة:</span>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed relative z-10 whitespace-pre-wrap bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                                                    {c.inspectionNotes}
                                                </p>
                                            </div>
                                        )}

                                        {c.remarks && (
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">الملاحظات العامة:</span>
                                                <p className="text-xs font-bold text-slate-600 leading-relaxed relative z-10 whitespace-pre-wrap bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/50">
                                                    {c.remarks}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                        <span className="text-[10px] font-mono text-slate-400">{new Date(c.createdAt).toLocaleDateString('ar-OM')}</span>
                                        <span className="text-[10px] font-bold text-slate-300">ID: {c.id}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full py-20 text-center text-slate-300">
                                <i className="fas fa-comment-slash text-5xl mb-4 opacity-50"></i>
                                <p className="font-black text-slate-500">لا توجد ملاحظات مسجلة على إرساليات قطاع {CONSIGNMENT_LABELS[selectedSector]}</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Table View for Consignment Remarks */
                    <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-black text-slate-500">
                                    <tr>
                                        <th className="p-4">رقم البيان</th>
                                        <th className="p-4">المستورد</th>
                                        <th className="p-4 w-1/3">نص الملاحظة</th>
                                        <th className="p-4">اسم المفتش</th>
                                        <th className="p-4">التاريخ</th>
                                        <th className="p-4 text-center">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {consignmentsWithRemarks.map((c, index) => (
                                        <motion.tr 
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.2, delay: index * 0.05 }}
                                            key={c.id} 
                                            className="hover:bg-slate-50/80 transition-colors"
                                        >
                                            <td className="p-4 font-mono font-bold text-slate-800 text-xs">{c.bayanNumber}</td>
                                            <td className="p-4 text-xs font-bold text-slate-600 truncate max-w-[150px]">{c.importer}</td>
                                            <td className="p-4 text-xs font-medium text-slate-700 leading-snug">
                                                <div className="space-y-2">
                                                    {c.inspectionNotes && (
                                                        <div>
                                                            <span className="text-[9px] font-black text-emerald-600 block mb-0.5">المعاينة:</span>
                                                            <p className="text-[11px]">{c.inspectionNotes}</p>
                                                        </div>
                                                    )}
                                                    {c.remarks && (
                                                        <div>
                                                            <span className="text-[9px] font-black text-indigo-600 block mb-0.5">عامة:</span>
                                                            <p className="text-[11px]">{c.remarks}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-xs font-bold text-slate-500">{c.inspectorName}</td>
                                            <td className="p-4 font-mono text-slate-400 text-[10px]">{new Date(c.createdAt).toLocaleDateString('ar-OM')}</td>
                                            <td className="p-4 text-center">
                                                <span className={`text-[9px] font-black px-2 py-1 rounded ${
                                                    c.status === 'Approved' ? 'bg-green-50 text-green-700' : 
                                                    c.status === 'Rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                                                }`}>
                                                    {c.status === 'Approved' ? 'مقبول' : c.status === 'Rejected' ? 'مرفوض' : 'قيد الإجراء'}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {consignmentsWithRemarks.length === 0 && (
                            <p className="text-center text-xs text-slate-400 py-8 font-bold">لا توجد ملاحظات</p>
                        )}
                    </div>
                )}
            </div>
        )}
    </div>
  );
};

export default NotesManager;
