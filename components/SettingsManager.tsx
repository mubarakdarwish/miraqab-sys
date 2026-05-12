
import React, { useState, useRef } from 'react';
import { SystemSettings, ConsignmentType, User, PesticideMapping, ENumber, EpidemicAlert, HSCode, InspectionChecklist, NewsTickerItem, UserRole, ImportantLink, SecurityLogEntry } from '../types';
import { CONSIGNMENT_LABELS, APP_PAGES } from '../constants';
import * as FB from '../firebaseService';
import UsefulTools from './UsefulTools';

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
    <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#007a3d]"></div>
    </label>
);

const NewsItemEditor: React.FC<{ 
  item: NewsTickerItem, 
  onUpdate: (updated: NewsTickerItem) => void, 
  onDelete: (id: string) => void 
}> = ({ item, onUpdate, onDelete }) => {
  const [text, setText] = React.useState(item.text || '');
  
  React.useEffect(() => {
    setText(item.text || '');
  }, [item.text]);

  const handleBlur = () => {
    if (text !== item.text) {
      onUpdate({ ...item, text });
    }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
      <div className="flex items-center gap-3">
        <select 
          value={item.type}
          onChange={(e) => onUpdate({ ...item, type: e.target.value as any })}
          className="bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
        >
          <option value="info">معلومة</option>
          <option value="warning">تنبيه</option>
          <option value="urgent">عاجل</option>
        </select>
        <div className="flex-1"></div>
        <Toggle 
          checked={item.isActive} 
          onChange={() => onUpdate({ ...item, isActive: !item.isActive })}
        />
        <button 
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-red-500 transition-all"
        >
          <i className="fas fa-trash-alt text-xs"></i>
        </button>
      </div>
      <div className="relative">
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none min-h-[60px]"
          placeholder="نص الخبر..."
        />
        {text !== item.text && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-[8px] font-black text-orange-500 animate-pulse">
            <i className="fas fa-sync-alt"></i>
            <span>بانتظار الحفظ (اضغط خارجاً)</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ImportantLinkEditor: React.FC<{ 
  item: ImportantLink, 
  onUpdate: (updated: ImportantLink) => void, 
  onDelete: (id: string) => void 
}> = ({ item, onUpdate, onDelete }) => {
  const [title, setTitle] = React.useState(item.title || '');
  const [url, setUrl] = React.useState(item.url || '');
  const [icon, setIcon] = React.useState(item.icon || '');
  const [description, setDescription] = React.useState(item.description || '');
  
  React.useEffect(() => {
    setTitle(item.title || '');
    setUrl(item.url || '');
    setIcon(item.icon || '');
    setDescription(item.description || '');
  }, [item]);

  const handleBlur = () => {
    if (title !== item.title || url !== item.url || icon !== item.icon || description !== item.description) {
      onUpdate({ ...item, title, url, icon, description });
    }
  };

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <input 
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            onBlur={handleBlur}
            placeholder="أيقونة (مثال: fas fa-link)"
            className="w-1/3 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-[10px] font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleBlur}
            placeholder="عنوان الرابط"
            className="flex-1 bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <button 
          onClick={() => onDelete(item.id)}
          className="text-slate-400 hover:text-red-500 transition-all"
        >
          <i className="fas fa-trash-alt text-xs"></i>
        </button>
      </div>
      <div className="space-y-2">
        <input 
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={handleBlur}
          placeholder="الرابط (URL)"
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none"
          dir="ltr"
        />
        <textarea 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleBlur}
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[40px]"
          placeholder="وصف قصير..."
        />
        {(title !== item.title || url !== item.url || icon !== item.icon || description !== item.description) && (
          <div className="flex items-center gap-1 text-[8px] font-black text-emerald-500 animate-pulse">
            <i className="fas fa-sync-alt"></i>
            <span>بانتظار الحفظ (اضغط خارجاً)</span>
          </div>
        )}
      </div>
    </div>
  );
};

interface SettingsManagerProps {
  inspectionTypes: string[];
  setInspectionTypes: React.Dispatch<React.SetStateAction<string[]>>;
  declarationTypes: string[];
  setDeclarationTypes: React.Dispatch<React.SetStateAction<string[]>>;
  undertakingTypes: string[];
  setUndertakingTypes: React.Dispatch<React.SetStateAction<string[]>>;
  containerTypes: string[];
  setContainerTypes: React.Dispatch<React.SetStateAction<string[]>>;
  transferDestinations: string[];
  setTransferDestinations: React.Dispatch<React.SetStateAction<string[]>>;
  intendedUses: string[];
  setIntendedUses: React.Dispatch<React.SetStateAction<string[]>>;
  labAnalysisTypes: Record<ConsignmentType, string[]>;
  setLabAnalysisTypes: React.Dispatch<React.SetStateAction<Record<ConsignmentType, string[]>>>;
  rejectionReasons: Record<ConsignmentType, string[]>;
  setRejectionReasons: React.Dispatch<React.SetStateAction<Record<ConsignmentType, string[]>>>;
  systemSettings?: SystemSettings;
  setSystemSettings?: React.Dispatch<React.SetStateAction<SystemSettings>>;
  onResetData?: () => void;
  currentUser?: User;
  pesticides?: PesticideMapping[];
  eNumbers?: ENumber[];
  setENumbers?: React.Dispatch<React.SetStateAction<ENumber[]>>;
  epidemicAlerts?: EpidemicAlert[];
  setEpidemicAlerts?: React.Dispatch<React.SetStateAction<EpidemicAlert[]>>;
  hsCodes?: HSCode[];
  setHSCodes?: React.Dispatch<React.SetStateAction<HSCode[]>>;
  checklists?: Record<string, InspectionChecklist>;
  setChecklists?: React.Dispatch<React.SetStateAction<Record<string, InspectionChecklist>>>;
}

const SETTINGS_TABS = [
  { id: 'GENERAL', label: 'الإعدادات العامة', icon: 'fa-cog', color: 'blue' },
  { id: 'LOOKUPS', label: 'إدارة القوائم', icon: 'fa-list-ul', color: 'indigo' },
  { id: 'INSPECTOR_TOOLS', label: 'أدوات المفتش', icon: 'fa-user-shield', color: 'red' },
  { id: 'SECURITY_ACCESS', label: 'الأمان والوصول', icon: 'fa-shield-alt', color: 'orange' },
  { id: 'OPTIMIZATION', label: 'تحسين الأداء', icon: 'fa-tachometer-alt', color: 'emerald' },
  { id: 'DEVELOPER', label: 'أدوات المطور', icon: 'fa-code', color: 'slate' },
  { id: 'PERMISSIONS', label: 'صلاحيات الأدوار', icon: 'fa-user-lock', color: 'purple' },
  { id: 'CMS', label: 'إدارة المحتوى', icon: 'fa-language', color: 'teal' },
  { id: 'DYNAMIC_RULES', label: 'محرك القواعد', icon: 'fa-bolt', color: 'orange' },
  { id: 'SESSION_CONTROL', label: 'إدارة الجلسات', icon: 'fa-users-cog', color: 'emerald' },
  { id: 'SYSTEM_HEALTH', label: 'صحة النظام', icon: 'fa-heartbeat', color: 'rose' },
  { id: 'CLOUD_COSTS', label: 'التكاليف السحابية', icon: 'fa-cloud', color: 'sky' },
  { id: 'USEFUL_TOOLS', label: 'أدوات مفيدة', icon: 'fa-tools', color: 'blue' },
  { id: 'BACKUP', label: 'النسخ الاحتياطي', icon: 'fa-database', color: 'slate' },
] as const;

type TabId = typeof SETTINGS_TABS[number]['id'];

const SettingsManager: React.FC<SettingsManagerProps> = ({
  inspectionTypes, setInspectionTypes,
  declarationTypes, setDeclarationTypes,
  undertakingTypes, setUndertakingTypes,
  containerTypes, setContainerTypes,
  transferDestinations, setTransferDestinations,
  labAnalysisTypes, setLabAnalysisTypes,
  rejectionReasons, setRejectionReasons,
  systemSettings, setSystemSettings,
  onResetData,
  currentUser,
  pesticides = [],
  eNumbers = [], setENumbers,
  epidemicAlerts = [], setEpidemicAlerts,
  hsCodes = [], setHSCodes,
  checklists = {}, setChecklists,
  intendedUses = [], setIntendedUses
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('GENERAL');
  const [inspectorToolTab, setInspectorToolTab] = useState<'ENUMBERS' | 'EPIDEMIC' | 'HSCODES' | 'CHECKLISTS'>('ENUMBERS');
  const [newItem, setNewItem] = useState<{ type: string, value: string, subValue?: string, extraValue?: string }>({ type: 'INSPECTION', value: '', subValue: '', extraValue: '' });
  const [labSector, setLabSector] = useState<ConsignmentType>(ConsignmentType.FOOD_SAFETY);
  const [rejectionSector, setRejectionSector] = useState<ConsignmentType>(ConsignmentType.FOOD_SAFETY);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSavingPest, setIsSavingPest] = useState(false);
  const [editingPestId, setEditingPestId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ type: string, value: string, originalValue: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Inspector Tools Form State
  const [newENumber, setNewENumber] = useState<ENumber>({ code: '', name: '', status: 'مسموح', type: '', note: '' });
  const [newEpidemicAlert, setNewEpidemicAlert] = useState<EpidemicAlert>({ country: '', disease: '', status: 'محظور كلياً', date: new Date().toISOString().split('T')[0], note: '' });
  const [newHSCode, setNewHSCode] = useState<HSCode>({ code: '', name: '', category: '' });
  const [newChecklist, setNewChecklist] = useState<{ id: string, title: string, newItem: string }>({ id: '', title: '', newItem: '' });
  const [selectedChecklistId, setSelectedChecklistId] = useState<string>('');

  // Dynamic Rules State
  const [rules, setRules] = useState<any[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [newRule, setNewRule] = useState({
    name: '',
    conditionField: 'shippingCountry',
    conditionOperator: 'equals',
    conditionValue: '',
    actionType: 'setRiskLevel',
    actionValue: 'HIGH'
  });

  // Auto-save CMS changes
  const [cmsSaveStatus, setCmsSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');
  const initialLabelsRef = useRef<string>(JSON.stringify(systemSettings?.customLabels || {}));
  
  React.useEffect(() => {
    if (activeTab !== 'CMS') return;
    
    const currentLabelsStr = JSON.stringify(systemSettings?.customLabels || {});
    if (currentLabelsStr === initialLabelsRef.current) return;
    
    const timer = setTimeout(async () => {
      if (systemSettings) {
        setCmsSaveStatus('SAVING');
        try {
          await FB.saveSettingsToDB(systemSettings);
          if (currentUser) {
            await FB.addSecurityLog({
              userId: currentUser.id,
              userName: currentUser.name,
              action: 'تحديث إعدادات المحتوى (CMS)',
              severity: 'LOW',
              details: 'تم تعديل المسميات والنصوص في واجهة النظام (حفظ تلقائي)'
            });
          }
          initialLabelsRef.current = currentLabelsStr;
          setCmsSaveStatus('SAVED');
          setTimeout(() => setCmsSaveStatus('IDLE'), 2000);
        } catch (e) {
          console.error("Auto-save failed", e);
          setCmsSaveStatus('IDLE');
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [JSON.stringify(systemSettings?.customLabels), activeTab]);

  // Auto-save Session Control changes
  const [sessionSaveStatus, setSessionSaveStatus] = useState<'IDLE' | 'SAVING' | 'SAVED'>('IDLE');
  const initialSessionSettingsRef = useRef<string>(JSON.stringify({
    maxConcurrentSessions: systemSettings?.maxConcurrentSessions,
    autoLockTimeout: systemSettings?.autoLockTimeout
  }));
  
  React.useEffect(() => {
    if (activeTab !== 'SESSION_CONTROL') return;
    
    const currentSessionSettingsStr = JSON.stringify({
      maxConcurrentSessions: systemSettings?.maxConcurrentSessions,
      autoLockTimeout: systemSettings?.autoLockTimeout
    });
    
    if (currentSessionSettingsStr === initialSessionSettingsRef.current) return;
    
    const timer = setTimeout(async () => {
      if (systemSettings) {
        setSessionSaveStatus('SAVING');
        try {
          await FB.saveSettingsToDB(systemSettings);
          if (currentUser) {
            await FB.addSecurityLog({
              userId: currentUser.id,
              userName: currentUser.name,
              action: 'تحديث إعدادات الجلسات',
              severity: 'HIGH',
              details: 'تم تعديل إعدادات الجلسات المتزامنة والقفل التلقائي (حفظ تلقائي)'
            });
          }
          initialSessionSettingsRef.current = currentSessionSettingsStr;
          setSessionSaveStatus('SAVED');
          setTimeout(() => setSessionSaveStatus('IDLE'), 2000);
        } catch (e) {
          console.error("Auto-save failed", e);
          setSessionSaveStatus('IDLE');
        }
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [systemSettings?.maxConcurrentSessions, systemSettings?.autoLockTimeout, activeTab]);

  const [newIp, setNewIp] = useState('');
  const [tempPermissions, setTempPermissions] = useState<Record<string, string[]>>({});
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [lookupSearch, setLookupSearch] = useState('');

  React.useEffect(() => {
    if (systemSettings?.rolePermissions) {
      setTempPermissions(systemSettings.rolePermissions);
    }
  }, [systemSettings?.rolePermissions]);

  const handleSavePermissions = async () => {
    if (!systemSettings || !setSystemSettings) return;
    setIsSavingPermissions(true);
    try {
      const updatedSettings = {
        ...systemSettings,
        rolePermissions: tempPermissions
      };
      setSystemSettings(updatedSettings);
      await FB.saveSettingsToDB(updatedSettings);
      alert("تم حفظ الصلاحيات بنجاح");
    } catch (e) {
      console.error(e);
      alert("حدث خطأ أثناء حفظ الصلاحيات");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const isReadOnly = currentUser?.role === 'VIEWER';
  const isAdmin = currentUser?.role === 'ADMIN';

  const saveLookups = async (key: string, data: any) => {
      try {
          await FB.saveLookupsToDB('lists', { [key]: data });
      } catch (e) {
          console.error("Failed to save lookups", e);
          alert("فشل حفظ التغييرات في قاعدة البيانات");
      }
  };

  const handleFullBackup = async () => {
      if (!isAdmin) return;
      setIsExporting(true);
      try {
          const fullData = await FB.exportFullSystemData();
          const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullData, null, 2));
          const downloadAnchorNode = document.createElement('a');
          downloadAnchorNode.setAttribute("href", dataStr);
          downloadAnchorNode.setAttribute("download", `MIRQAB_FULL_BACKUP_${new Date().toISOString().slice(0,10)}.json`);
          document.body.appendChild(downloadAnchorNode);
          downloadAnchorNode.click();
          downloadAnchorNode.remove();
          alert("تم استخراج نسخة احتياطية شاملة بنجاح.");
      } catch (e) {
          alert("فشل استخراج النسخة الاحتياطية.");
      } finally {
          setIsExporting(false);
      }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
          const content = event.target?.result as string;
          try {
              const backupData = JSON.parse(content);
              if (backupData && window.confirm("تحذير: سيتم دمج/تحديث البيانات الحالية بالبيانات الموجودة في الملف. هل أنت متأكد؟")) {
                  setIsImporting(true);
                  await FB.importFullSystemData(backupData);
                  alert("تم استعادة البيانات بنجاح. سيتم إعادة تحميل الصفحة لتطبيق التغييرات.");
                  window.location.reload();
              }
          } catch (error) {
              alert("فشل قراءة الملف. تأكد من أنه ملف JSON صالح من مِرقاب.");
          } finally {
              setIsImporting(false);
              if (fileInputRef.current) fileInputRef.current.value = '';
          }
      };
      reader.readAsText(file);
  };

  const handleAddENumber = async () => {
    if (!newENumber.code || !newENumber.name || !setENumbers) return;
    const updated = [...eNumbers, newENumber];
    setENumbers(updated);
    await saveLookups('eNumbers', updated);
    setNewENumber({ code: '', name: '', status: 'مسموح', type: '', note: '' });
  };

  const handleDeleteENumber = async (code: string) => {
    if (!setENumbers) return;
    const updated = eNumbers.filter(e => e.code !== code);
    setENumbers(updated);
    await saveLookups('eNumbers', updated);
  };

  const handleAddEpidemicAlert = async () => {
    if (!newEpidemicAlert.country || !newEpidemicAlert.disease || !setEpidemicAlerts) return;
    const updated = [...epidemicAlerts, newEpidemicAlert];
    setEpidemicAlerts(updated);
    await saveLookups('epidemicAlerts', updated);
    setNewEpidemicAlert({ country: '', disease: '', status: 'محظور كلياً', date: new Date().toISOString().split('T')[0], note: '' });
  };

  const handleDeleteEpidemicAlert = async (idx: number) => {
    if (!setEpidemicAlerts) return;
    const updated = epidemicAlerts.filter((_, i) => i !== idx);
    setEpidemicAlerts(updated);
    await saveLookups('epidemicAlerts', updated);
  };

  // Dynamic Rules Handlers
  React.useEffect(() => {
    const fetchRules = async () => {
      try {
        const snap = await FB.db.collection('dynamicRules').get();
        setRules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingRules(false);
      }
    };
    if (activeTab === 'DYNAMIC_RULES') {
      fetchRules();
    }
  }, [activeTab]);

  const handleAddRule = async () => {
    if (!newRule.name || !newRule.conditionValue) return;
    try {
      const docRef = await FB.db.collection('dynamicRules').add(newRule);
      setRules([...rules, { id: docRef.id, ...newRule }]);
      setNewRule({ ...newRule, name: '', conditionValue: '' });
      alert('تم إضافة القاعدة بنجاح');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الإضافة');
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;
    try {
      await FB.db.collection('dynamicRules').doc(id).delete();
      setRules(rules.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddHSCode = async () => {
    if (!newHSCode.code || !newHSCode.name || !setHSCodes) return;
    const updated = [...hsCodes, newHSCode];
    setHSCodes(updated);
    await saveLookups('hsCodes', updated);
    setNewHSCode({ code: '', name: '', category: '' });
  };

  const handleDeleteHSCode = async (code: string) => {
    if (!setHSCodes) return;
    const updated = hsCodes.filter(h => h.code !== code);
    setHSCodes(updated);
    await saveLookups('hsCodes', updated);
  };

  const handleAddChecklist = async () => {
    if (!newChecklist.id || !newChecklist.title || !setChecklists) return;
    const updated = { ...checklists, [newChecklist.id]: { id: newChecklist.id, title: newChecklist.title, items: [] } };
    setChecklists(updated);
    await saveLookups('checklists', updated);
    setNewChecklist({ id: '', title: '', newItem: '' });
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!setChecklists) return;
    const updated = { ...checklists };
    delete updated[id];
    setChecklists(updated);
    await saveLookups('checklists', updated);
    if (selectedChecklistId === id) setSelectedChecklistId('');
  };

  const handleAddChecklistItem = async () => {
    if (!selectedChecklistId || !newChecklist.newItem || !setChecklists) return;
    const list = checklists[selectedChecklistId];
    const updatedList = { ...list, items: [...list.items, newChecklist.newItem] };
    const updatedChecklists = { ...checklists, [selectedChecklistId]: updatedList };
    setChecklists(updatedChecklists);
    await saveLookups('checklists', updatedChecklists);
    setNewChecklist(prev => ({ ...prev, newItem: '' }));
  };

  const handleDeleteChecklistItem = async (listId: string, itemIdx: number) => {
    if (!setChecklists) return;
    const list = checklists[listId];
    const updatedList = { ...list, items: list.items.filter((_, i) => i !== itemIdx) };
    const updatedChecklists = { ...checklists, [listId]: updatedList };
    setChecklists(updatedChecklists);
    await saveLookups('checklists', updatedChecklists);
  };

  const handleAddItem = async (type: string) => {
    if (isReadOnly || !newItem.value.trim()) return;
    
    let updatedData = null;
    let dbKey = '';

    if (type === 'INSPECTION') {
        const newList = [...inspectionTypes, newItem.value];
        setInspectionTypes(newList);
        updatedData = newList;
        dbKey = 'inspectionTypes';
    }
    else if (type === 'DECLARATION') {
        const newList = [...declarationTypes, newItem.value];
        setDeclarationTypes(newList);
        updatedData = newList;
        dbKey = 'declarationTypes';
    }
    else if (type === 'UNDERTAKING') {
        const newList = [...undertakingTypes, newItem.value];
        setUndertakingTypes(newList);
        updatedData = newList;
        dbKey = 'undertakingTypes';
    }
    else if (type === 'CONTAINER') {
        const newList = [...containerTypes, newItem.value];
        setContainerTypes(newList);
        updatedData = newList;
        dbKey = 'containerTypes';
    }
    else if (type === 'TRANSFER') {
        const newList = [...transferDestinations, newItem.value];
        setTransferDestinations(newList);
        updatedData = newList;
        dbKey = 'transferDestinations';
    }
    else if (type === 'INTENDED_USE') {
        const newList = [...intendedUses, newItem.value];
        setIntendedUses(newList);
        updatedData = newList;
        dbKey = 'intendedUses';
    }
    else if (type === 'LAB') {
        const newList = [...(labAnalysisTypes[labSector] || []), newItem.value];
        const newRecord = { ...labAnalysisTypes, [labSector]: newList };
        setLabAnalysisTypes(newRecord);
        updatedData = newRecord;
        dbKey = 'labAnalysisTypes';
    }
    else if (type === 'REJECTION') {
        const newList = [...(rejectionReasons[rejectionSector] || []), newItem.value];
        const newRecord = { ...rejectionReasons, [rejectionSector]: newList };
        setRejectionReasons(newRecord);
        updatedData = newRecord;
        dbKey = 'rejectionReasons';
    }
    else if (type === 'PESTICIDE') {
        if (!newItem.subValue?.trim()) {
            alert("يرجى إدخال المادة الفعالة للمبيد");
            return;
        }
        setIsSavingPest(true);
        try {
            const activeIngredients = newItem.subValue.split(',').map(s => s.trim()).filter(s => s);
            
            if (editingPestId) {
                const pest: PesticideMapping = {
                    id: editingPestId,
                    name: newItem.value.trim(),
                    activeIngredients: activeIngredients,
                    pesticideType: newItem.extraValue?.trim()
                };
                await FB.addPesticideToDB(pest);
                setEditingPestId(null);
            } else {
                const pestId = Math.random().toString(36).substr(2, 9).toUpperCase();
                const pest: PesticideMapping = {
                    id: pestId,
                    name: newItem.value.trim(),
                    activeIngredients: activeIngredients,
                    pesticideType: newItem.extraValue?.trim()
                };
                await FB.addPesticideToDB(pest);
            }
            // The real-time subscription in App.tsx will update the list
        } catch (e) {
            alert("حدث خطأ أثناء حفظ بيانات المبيد");
        } finally {
            setIsSavingPest(false);
        }
    }
    
    if (updatedData && dbKey) {
        await saveLookups(dbKey, updatedData);
    }
    
    setNewItem({ type: type, value: '', subValue: '', extraValue: '' });
  };

  const handleEditPest = (pest: PesticideMapping) => {
      setEditingPestId(pest.id);
      setNewItem({
          type: 'PESTICIDE',
          value: pest.name,
          subValue: pest.activeIngredients?.join(', ') || pest.activeIngredient || '',
          extraValue: pest.pesticideType || ''
      });
  };

  const handleDeleteItem = async (type: string, value: string, id?: string) => {
    if (isReadOnly || !window.confirm(`حذف "${value}"؟`)) return;
    
    let updatedData = null;
    let dbKey = '';

    if (type === 'INSPECTION') {
        const newList = inspectionTypes.filter(i => i !== value);
        setInspectionTypes(newList);
        updatedData = newList;
        dbKey = 'inspectionTypes';
    }
    else if (type === 'DECLARATION') {
        const newList = declarationTypes.filter(i => i !== value);
        setDeclarationTypes(newList);
        updatedData = newList;
        dbKey = 'declarationTypes';
    }
    else if (type === 'UNDERTAKING') {
        const newList = undertakingTypes.filter(i => i !== value);
        setUndertakingTypes(newList);
        updatedData = newList;
        dbKey = 'undertakingTypes';
    }
    else if (type === 'CONTAINER') {
        const newList = containerTypes.filter(i => i !== value);
        setContainerTypes(newList);
        updatedData = newList;
        dbKey = 'containerTypes';
    }
    else if (type === 'TRANSFER') {
        const newList = transferDestinations.filter(i => i !== value);
        setTransferDestinations(newList);
        updatedData = newList;
        dbKey = 'transferDestinations';
    }
    else if (type === 'INTENDED_USE') {
        const newList = intendedUses.filter(i => i !== value);
        setIntendedUses(newList);
        updatedData = newList;
        dbKey = 'intendedUses';
    }
    else if (type === 'LAB') {
        const newList = (labAnalysisTypes[labSector] || []).filter(i => i !== value);
        const newRecord = { ...labAnalysisTypes, [labSector]: newList };
        setLabAnalysisTypes(newRecord);
        updatedData = newRecord;
        dbKey = 'labAnalysisTypes';
    }
    else if (type === 'REJECTION') {
        const newList = (rejectionReasons[rejectionSector] || []).filter(i => i !== value);
        const newRecord = { ...rejectionReasons, [rejectionSector]: newList };
        setRejectionReasons(newRecord);
        updatedData = newRecord;
        dbKey = 'rejectionReasons';
    }
    else if (type === 'PESTICIDE' && id) {
        try {
            await FB.deletePesticideFromDB(id);
        } catch (e) {
            alert("حدث خطأ أثناء حذف المبيد");
        }
    }

    if (updatedData && dbKey) {
        await saveLookups(dbKey, updatedData);
    }
  };

  const handleStartEdit = (type: string, value: string) => {
      setEditingItem({ type, value, originalValue: value });
  };

  const handleUpdateItem = async () => {
      if (!editingItem || !editingItem.value.trim()) return;
      const { type, value, originalValue } = editingItem;
      
      if (value === originalValue) {
          setEditingItem(null);
          return;
      }

      let updatedData = null;
      let dbKey = '';

      if (type === 'INSPECTION') {
          const newList = inspectionTypes.map(i => i === originalValue ? value : i);
          setInspectionTypes(newList);
          updatedData = newList;
          dbKey = 'inspectionTypes';
      }
      else if (type === 'DECLARATION') {
          const newList = declarationTypes.map(i => i === originalValue ? value : i);
          setDeclarationTypes(newList);
          updatedData = newList;
          dbKey = 'declarationTypes';
      }
      else if (type === 'UNDERTAKING') {
          const newList = undertakingTypes.map(i => i === originalValue ? value : i);
          setUndertakingTypes(newList);
          updatedData = newList;
          dbKey = 'undertakingTypes';
      }
      else if (type === 'CONTAINER') {
          const newList = containerTypes.map(i => i === originalValue ? value : i);
          setContainerTypes(newList);
          updatedData = newList;
          dbKey = 'containerTypes';
      }
      else if (type === 'TRANSFER') {
          const newList = transferDestinations.map(i => i === originalValue ? value : i);
          setTransferDestinations(newList);
          updatedData = newList;
          dbKey = 'transferDestinations';
      }
      else if (type === 'INTENDED_USE') {
          const newList = intendedUses.map(i => i === originalValue ? value : i);
          setIntendedUses(newList);
          updatedData = newList;
          dbKey = 'intendedUses';
      }
      else if (type === 'LAB') {
          const newList = (labAnalysisTypes[labSector] || []).map(i => i === originalValue ? value : i);
          const newRecord = { ...labAnalysisTypes, [labSector]: newList };
          setLabAnalysisTypes(newRecord);
          updatedData = newRecord;
          dbKey = 'labAnalysisTypes';
      }
      else if (type === 'REJECTION') {
          const newList = (rejectionReasons[rejectionSector] || []).map(i => i === originalValue ? value : i);
          const newRecord = { ...rejectionReasons, [rejectionSector]: newList };
          setRejectionReasons(newRecord);
          updatedData = newRecord;
          dbKey = 'rejectionReasons';
      }

      if (updatedData && dbKey) {
          await saveLookups(dbKey, updatedData);
      }
      setEditingItem(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-fade-in pb-10 min-h-[80vh]">
      {/* Sidebar Navigation */}
      <div className="lg:w-80 shrink-0">
        <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden sticky top-8">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
            <div className="flex items-center gap-4 mb-2 relative z-10">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                <i className="fas fa-sliders-h text-lg"></i>
              </div>
              <h3 className="font-black text-xl tracking-tight">إعدادات النظام</h3>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest relative z-10">System Configuration</p>
          </div>
          
          <nav className="p-4 space-y-1">
            {SETTINGS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  activeTab === tab.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'
                }`}>
                  <i className={`fas ${tab.icon} text-xs`}></i>
                </div>
                <span className="text-xs font-black">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="mr-auto w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                )}
              </button>
            ))}
          </nav>
          
          <div className="p-6 mt-4 border-t border-slate-50 bg-slate-50/50">
            <div className="flex items-center gap-3 text-slate-400">
              <i className="fas fa-info-circle text-xs"></i>
              <p className="text-[9px] font-bold leading-relaxed">
                تأكد من حفظ التغييرات في كل قسم قبل الانتقال لقسم آخر لضمان سلامة البيانات.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-8">
        {/* Header for Active Section (Mobile) */}
        <div className="lg:hidden bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <i className={`fas ${SETTINGS_TABS.find(t => t.id === activeTab)?.icon} text-sm`}></i>
            </div>
            <h3 className="font-black text-lg text-slate-800">{SETTINGS_TABS.find(t => t.id === activeTab)?.label}</h3>
          </div>
        </div>

      {activeTab === 'GENERAL' && (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <div>
            <h3 className="font-black text-xl text-slate-800">الإعدادات العامة</h3>
            <p className="text-xs text-slate-400 font-bold mt-1">إدارة التفضيلات الأساسية وتنبيهات النظام</p>
          </div>
          <button 
            onClick={async () => {
                if (systemSettings) {
                    try {
                        await FB.saveSettingsToDB(systemSettings);
                        alert("تم حفظ إعدادات النظام بنجاح");
                    } catch (e) {
                        alert("فشل حفظ الإعدادات");
                    }
                }
            }}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm shadow-lg hover:bg-black transition-all flex items-center gap-3 shrink-0"
          >
              <i className="fas fa-save"></i> حفظ جميع الإعدادات
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-red-100 transition-colors"></div>
            <div className="relative z-10">
              <h4 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
                  <i className="fas fa-shield-alt"></i>
                </div>
                المخاطر والتنبيهات
              </h4>
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">عتبة المخاطر (Risk Threshold)</label>
                    <span className="text-sm font-black text-red-600 bg-red-50 px-3 py-1 rounded-lg border border-red-100">{systemSettings?.riskThreshold}%</span>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={systemSettings?.riskThreshold} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, riskThreshold: parseInt(e.target.value)}))} 
                      className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer accent-red-600 z-10" 
                    />
                    <div className="absolute inset-y-0 right-0 bg-red-500 rounded-full transition-all duration-300" style={{ width: `${systemSettings?.riskThreshold}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-bold">يتم تنبيه المفتشين تلقائياً عند تجاوز الإرسالية لهذه النسبة.</p>
                </div>
                
                <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all group/toggle">
                  <div>
                    <span className="text-sm font-black text-slate-700 block">قفل تلقائي للإرساليات الخطرة</span>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">تجميد الإرسالية فوراً عند تجاوز العتبة.</p>
                  </div>
                  <Toggle checked={systemSettings?.autoLockHighRisk || false} onChange={() => setSystemSettings?.(p => ({...p, autoLockHighRisk: !p.autoLockHighRisk}))} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all group/toggle">
                    <div>
                      <span className="text-sm font-black text-slate-700 block">وضع الصيانة</span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">تقييد الوصول للنظام للصيانة.</p>
                    </div>
                    <Toggle checked={systemSettings?.maintenanceMode || false} onChange={() => setSystemSettings?.(p => ({...p, maintenanceMode: !p.maintenanceMode}))} />
                  </div>
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all group/toggle">
                    <div>
                      <span className="text-sm font-black text-slate-700 block">الوضع الليلي</span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">تحسين الرؤية في الإضاءة المنخفضة.</p>
                    </div>
                    <Toggle checked={systemSettings?.darkModeEnabled || false} onChange={() => setSystemSettings?.(p => ({...p, darkModeEnabled: !p.darkModeEnabled}))} />
                  </div>
                  
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:bg-white hover:shadow-md transition-all group/toggle">
                    <div>
                      <span className="text-sm font-black text-slate-700 block">التنبيهات الصوتية</span>
                      <p className="text-[10px] text-slate-400 font-bold mt-1">تشغيل نغمة عند وصول تنبيه أو خطأ.</p>
                    </div>
                    <Toggle checked={systemSettings?.enableSoundAlerts !== false} onChange={() => setSystemSettings?.(p => ({...p, enableSoundAlerts: p.enableSoundAlerts === false ? true : false}))} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-orange-100 transition-colors"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <h4 className="font-black text-lg text-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center">
                    <i className="fas fa-bullhorn"></i>
                  </div>
                  شريط الأخبار
                </h4>
                <Toggle checked={systemSettings?.newsTickerEnabled || false} onChange={() => setSystemSettings?.(p => ({...p, newsTickerEnabled: !p.newsTickerEnabled}))} />
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">عناصر الأخبار</label>
                    <button 
                      onClick={() => {
                        const newItem: NewsTickerItem = { id: Date.now().toString(), text: '', type: 'info', isActive: true };
                        setSystemSettings?.(p => ({...p, newsTickerItems: [...(p?.newsTickerItems || []), newItem]}))
                      }}
                      className="text-[10px] font-black bg-orange-500 text-white px-4 py-2 rounded-xl hover:bg-orange-600 transition-all flex items-center gap-2 shadow-sm"
                    >
                      <i className="fas fa-plus"></i> إضافة خبر
                    </button>
                  </div>
                  
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {(systemSettings?.newsTickerItems || []).map((item, idx) => (
                      <NewsItemEditor 
                        key={item.id}
                        item={item}
                        onUpdate={(updated) => {
                          const newItems = [...(systemSettings?.newsTickerItems || [])];
                          newItems[idx] = updated;
                          setSystemSettings?.(p => ({...p, newsTickerItems: newItems}));
                        }}
                        onDelete={(id) => {
                          const newItems = (systemSettings?.newsTickerItems || []).filter(i => i.id !== id);
                          setSystemSettings?.(p => ({...p, newsTickerItems: newItems}));
                        }}
                      />
                    ))}
                    {(systemSettings?.newsTickerItems || []).length === 0 && (
                      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                          <i className="fas fa-comment-slash text-xl"></i>
                        </div>
                        <p className="text-[10px] font-black text-slate-400">لا توجد أخبار مضافة حالياً</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-slate-50">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider">سرعة الحركة (ثواني)</label>
                    <span className="text-sm font-black text-orange-600 bg-orange-50 px-3 py-1 rounded-lg border border-orange-100">{systemSettings?.newsTickerSpeed || 30}s</span>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <input 
                      type="range" 
                      min="10" 
                      max="120" 
                      step="5"
                      value={systemSettings?.newsTickerSpeed || 30} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, newsTickerSpeed: parseInt(e.target.value)}))} 
                      className="absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer accent-orange-600 z-10" 
                    />
                    <div className="absolute inset-y-0 right-0 bg-orange-500 rounded-full transition-all duration-300" style={{ width: `${((systemSettings?.newsTickerSpeed || 30) - 10) / 110 * 100}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-emerald-100 transition-colors"></div>
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <h4 className="font-black text-lg text-slate-800 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                  <i className="fas fa-link"></i>
                </div>
                الروابط الهامة (الأدوات المفيدة)
              </h4>
              <button 
                onClick={() => {
                  const newLink: ImportantLink = { id: Date.now().toString(), title: '', url: '', icon: 'fas fa-link', description: '' };
                  setSystemSettings?.(p => ({...p, importantLinks: [...(p?.importantLinks || []), newLink]}))
                }}
                className="text-[10px] font-black bg-emerald-500 text-white px-4 py-2 rounded-xl hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-sm"
              >
                <i className="fas fa-plus"></i> إضافة رابط
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {(systemSettings?.importantLinks || []).map((link, idx) => (
                <ImportantLinkEditor 
                  key={link.id}
                  item={link}
                  onUpdate={(updated) => {
                    const newLinks = [...(systemSettings?.importantLinks || [])];
                    newLinks[idx] = updated;
                    setSystemSettings?.(p => ({...p, importantLinks: newLinks}));
                  }}
                  onDelete={(id) => {
                    const newLinks = (systemSettings?.importantLinks || []).filter(i => i.id !== id);
                    setSystemSettings?.(p => ({...p, importantLinks: newLinks}));
                  }}
                />
              ))}
              {(systemSettings?.importantLinks || []).length === 0 && (
                <div className="col-span-full text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                    <i className="fas fa-link-slash text-xl"></i>
                  </div>
                  <p className="text-[10px] font-black text-slate-400">لا توجد روابط مضافة حالياً</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-100 transition-colors"></div>
          <div className="relative z-10">
            <h4 className="font-black text-lg text-slate-800 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
                <i className="fas fa-database"></i>
              </div>
              سلامة البيانات والنسخ الاحتياطي
            </h4>
            <div className="space-y-6">
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="w-8 h-8 bg-white text-blue-500 rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <i className="fas fa-info-circle"></i>
                </div>
                <div>
                  <p className="text-xs text-blue-800 font-bold leading-relaxed">
                    يمكنك استخدام زر "استعادة" لإعادة البيانات من ملف JSON تم تصديره مسبقاً. سيقوم النظام بمطابقة المعرفات (IDs) وتحديث البيانات أو إضافتها.
                  </p>
                  <p className="text-[10px] text-blue-600 font-bold mt-2 italic">ملاحظة: الاستيراد قد يستغرق عدة دقائق في حال كانت قاعدة البيانات ضخمة.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setActiveTab('BACKUP')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group/btn">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover/btn:text-blue-500 transition-colors shadow-sm mb-3">
                    <i className="fas fa-download text-xl"></i>
                  </div>
                  <span className="text-xs font-black text-slate-700">تصدير البيانات</span>
                </button>
                <button onClick={() => setActiveTab('BACKUP')} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-md transition-all group/btn">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover/btn:text-emerald-500 transition-colors shadow-sm mb-3">
                    <i className="fas fa-upload text-xl"></i>
                  </div>
                  <span className="text-xs font-black text-slate-700">استيراد البيانات</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {activeTab === 'PERMISSIONS' && systemSettings && setSystemSettings && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                <i className="fas fa-user-lock text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">إدارة صلاحيات الأدوار الوظيفية</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">تحديد الصفحات المتاحة لكل دور وظيفي بشكل جماعي</p>
              </div>
              <div className="flex-1"></div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTempPermissions(systemSettings.rolePermissions || {})}
                  className="px-6 py-3 rounded-2xl bg-slate-100 text-slate-600 font-black text-xs hover:bg-slate-200 transition-all"
                >
                  إلغاء التعديلات
                </button>
                <button 
                  onClick={handleSavePermissions}
                  disabled={isSavingPermissions}
                  className="px-8 py-3 rounded-2xl bg-[#007a3d] text-white font-black text-xs shadow-lg shadow-green-900/20 hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingPermissions ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-save"></i>}
                  حفظ التغييرات
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {(['ADMIN', 'MANAGER', 'INSPECTOR', 'LAB_TECH', 'LAB_DELEGATE', 'LOGISTICS', 'VIEWER'] as UserRole[]).map(role => (
                <div key={role} className="border border-slate-100 rounded-[2rem] overflow-hidden bg-slate-50/30">
                  <div className="bg-white px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md ${
                        role === 'ADMIN' ? 'bg-slate-800' : 
                        role === 'MANAGER' ? 'bg-blue-600' : 
                        role === 'INSPECTOR' ? 'bg-orange-500' : 
                        role === 'LAB_TECH' ? 'bg-emerald-500' : 
                        role === 'LAB_DELEGATE' ? 'bg-blue-500' : 
                        role === 'LOGISTICS' ? 'bg-indigo-500' : 'bg-slate-400'
                      }`}>
                        <i className={`fas ${
                          role === 'ADMIN' ? 'fa-user-shield' : 
                          role === 'MANAGER' ? 'fa-briefcase' : 
                          role === 'INSPECTOR' ? 'fa-search-location' : 
                          role === 'LAB_TECH' ? 'fa-flask' : 
                          role === 'LAB_DELEGATE' ? 'fa-truck-loading' : 
                          role === 'LOGISTICS' ? 'fa-truck-loading' : 'fa-eye'
                        }`}></i>
                      </div>
                      <div>
                        <span className="font-black text-slate-800 block">
                          {role === 'ADMIN' ? 'مدير النظام' : 
                           role === 'MANAGER' ? 'مسؤول / مدير' : 
                           role === 'INSPECTOR' ? 'مفتش' : 
                           role === 'LAB_TECH' ? 'فني مختبر' : 
                           role === 'LAB_DELEGATE' ? 'مندوب مختبر' : 
                           role === 'LOGISTICS' ? 'موظف لوجستي' : 'مطلع / تقارير'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {role} ROLE
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                        {tempPermissions[role]?.length || 0} صفحة مصرحة
                      </div>
                      {role === 'ADMIN' && (
                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                          صلاحيات كاملة غير قابلة للتعديل
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {APP_PAGES.map(page => {
                        const isAllowed = tempPermissions[role]?.includes(page.path);
                        return (
                          <label 
                            key={page.path} 
                            className={`group flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${
                              isAllowed 
                                ? 'bg-white border-purple-200 text-purple-700 shadow-sm ring-1 ring-purple-100' 
                                : 'bg-white/50 border-slate-100 text-slate-400 hover:border-slate-200 hover:bg-white'
                            }`}
                          >
                            <div className="relative flex items-center">
                              <input 
                                type="checkbox" 
                                checked={isAllowed}
                                disabled={role === 'ADMIN'} 
                                onChange={() => {
                                  const currentPages = tempPermissions[role] || [];
                                  const newPages = isAllowed 
                                    ? currentPages.filter(p => p !== page.path)
                                    : [...currentPages, page.path];
                                  
                                  setTempPermissions(prev => ({
                                    ...prev,
                                    [role]: newPages
                                  }));
                                }}
                                className="w-5 h-5 rounded-lg border-slate-300 text-purple-600 focus:ring-purple-500 transition-all cursor-pointer disabled:opacity-50"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-black leading-tight">{page.label}</span>
                              <span className="text-[9px] font-bold opacity-50 group-hover:opacity-100 transition-all">{page.path}</span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'BACKUP' && currentUser?.role === 'ADMIN' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                <i className="fas fa-database text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">النسخ الاحتياطي واستعادة البيانات</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">إدارة أمن البيانات وتصدير/استيراد قواعد البيانات</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-blue-50/30 border border-blue-100 rounded-[2rem] p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mb-6">
                  <i className="fas fa-cloud-download-alt text-2xl"></i>
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-2">تصدير البيانات</h4>
                <p className="text-slate-500 text-xs font-bold mb-8 leading-relaxed">
                  قم بإنشاء نسخة احتياطية كاملة من قاعدة البيانات الحالية بصيغة JSON. يمكنك الاحتفاظ بهذا الملف لاستعادة البيانات في أي وقت.
                </p>
                <button 
                  onClick={handleFullBackup} 
                  disabled={isExporting} 
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isExporting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-file-export"></i>}
                  تصدير نسخة كاملة الآن
                </button>
              </div>

              <div className="bg-emerald-50/30 border border-emerald-100 rounded-[2rem] p-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm mb-6">
                  <i className="fas fa-cloud-upload-alt text-2xl"></i>
                </div>
                <h4 className="text-lg font-black text-slate-800 mb-2">استعادة البيانات</h4>
                <p className="text-slate-500 text-xs font-bold mb-8 leading-relaxed">
                  قم برفع ملف JSON تم تصديره مسبقاً لاستعادة البيانات. تنبيه: سيتم تحديث السجلات الموجودة أو إضافة سجلات جديدة.
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isImporting} 
                  className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isImporting ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-file-import"></i>}
                  رفع ملف الاستعادة
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileImport} />
              </div>
            </div>

            <div className="mt-12 pt-12 border-t border-slate-100">
              <h4 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
                <i className="fas fa-clock text-blue-500"></i>
                جدولة النسخ التلقائي
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">تكرار النسخ الاحتياطي</label>
                  <select 
                    value={systemSettings?.backupFrequency || 'DAILY'}
                    onChange={(e) => setSystemSettings?.(p => ({...p, backupFrequency: e.target.value as any}))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  >
                    <option value="HOURLY">كل ساعة</option>
                    <option value="DAILY">يومياً</option>
                    <option value="WEEKLY">أسبوعياً</option>
                    <option value="MONTHLY">شهرياً</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">فترة الاحتفاظ (يوم)</label>
                  <input 
                    type="number"
                    value={systemSettings?.retentionPeriod || 30}
                    onChange={(e) => setSystemSettings?.(p => ({...p, retentionPeriod: parseInt(e.target.value)}))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SECURITY_ACCESS' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                  <i className="fas fa-shield-alt text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">إعدادات الأمان وصلاحيات الوصول</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">التحكم في سياسات الأمان، الجلسات، وسجلات التدقيق</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Session Timeout */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-blue-500 shadow-sm">
                    <i className="fas fa-clock"></i>
                  </div>
                  <label className="text-sm font-black text-slate-800">مدة الجلسة (Session Timeout)</label>
                </div>
                <p className="text-[10px] font-bold text-slate-500 mb-4">تحديد الحد الأقصى لمدة جلسة المستخدم لتعزيز الأمان.</p>
                <select 
                  value={systemSettings?.sessionTimeout || 30}
                  onChange={(e) => setSystemSettings?.(p => ({...p, sessionTimeout: parseInt(e.target.value)}))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value={15}>15 دقيقة</option>
                  <option value={30}>30 دقيقة</option>
                  <option value={60}>ساعة واحدة</option>
                  <option value={240}>4 ساعات</option>
                </select>
              </div>

              {/* Password Complexity */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-500 shadow-sm">
                    <i className="fas fa-key"></i>
                  </div>
                  <label className="text-sm font-black text-slate-800">تعقيد كلمة المرور (Password Complexity)</label>
                </div>
                <p className="text-[10px] font-bold text-slate-500 mb-4">فرض متطلبات تعقيد منخفضة، متوسطة، أو عالية لكلمات المرور.</p>
                <select 
                  value={systemSettings?.passwordComplexity || 'MEDIUM'}
                  onChange={(e) => setSystemSettings?.(p => ({...p, passwordComplexity: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH'}))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="LOW">منخفض (أرقام وحروف فقط)</option>
                  <option value="MEDIUM">متوسط (أرقام، حروف، ورموز)</option>
                  <option value="HIGH">عالي (أرقام، حروف كبيرة/صغيرة، رموز، وطول 8+)</option>
                </select>
              </div>

              {/* Password Expiry */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-red-500 shadow-sm">
                    <i className="fas fa-calendar-times"></i>
                  </div>
                  <label className="text-sm font-black text-slate-800">صلاحية كلمة المرور (Password Expiry)</label>
                </div>
                <p className="text-[10px] font-bold text-slate-500 mb-4">تحديد عدد الأيام قبل إجبار المستخدم على تغيير كلمة المرور.</p>
                <select 
                  value={systemSettings?.passwordExpiryDays || 90}
                  onChange={(e) => setSystemSettings?.(p => ({...p, passwordExpiryDays: parseInt(e.target.value)}))}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value={30}>30 يوم (شهر)</option>
                  <option value={60}>60 يوم (شهرين)</option>
                  <option value={90}>90 يوم (3 أشهر)</option>
                  <option value={180}>180 يوم (6 أشهر)</option>
                  <option value={365}>365 يوم (سنة)</option>
                </select>
              </div>

              {/* Audit Logging Toggle */}
              <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100 md:col-span-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-orange-500 shadow-sm">
                      <i className="fas fa-clipboard-list"></i>
                    </div>
                    <div>
                      <label className="text-sm font-black text-slate-800">سجل التدقيق (Audit Logging)</label>
                      <p className="text-[10px] font-bold text-slate-500 mt-1">مفتاح رئيسي لتفعيل أو تعطيل تسجيل جميع إجراءات المستخدمين في النظام.</p>
                    </div>
                  </div>
                  <Toggle 
                    checked={systemSettings?.securityAuditEnabled || false} 
                    onChange={() => setSystemSettings?.(p => ({...p, securityAuditEnabled: !p.securityAuditEnabled}))} 
                  />
                </div>
              </div>
            </div>

            {systemSettings?.securityAuditEnabled && (
              <div className="mt-8 pt-8 border-t border-slate-100">
                <h4 className="text-lg font-black text-slate-800 mb-6">سجلات التدقيق الأخيرة</h4>
                <SecurityAuditLogs />
                
                <button 
                  onClick={async () => {
                    try {
                      const logs = await FB.getSecurityLogs(1000);
                      const csvContent = "data:text/csv;charset=utf-8," 
                        + "التاريخ,المستخدم,الإجراء,الخطورة,IP,التفاصيل\n"
                        + logs.map(l => `"${new Date(l.timestamp).toLocaleString('ar-OM')}","${l.userName}","${l.action}","${l.severity}","${l.ipAddress || ''}","${l.details || ''}"`).join("\n");
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement("a");
                      link.setAttribute("href", encodedUri);
                      link.setAttribute("download", `security_audit_${new Date().toISOString().split('T')[0]}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    } catch (e) {
                      console.error("Failed to export logs", e);
                      alert("فشل تصدير السجلات");
                    }
                  }}
                  className="w-full mt-6 py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-black hover:border-orange-300 hover:text-orange-500 transition-all"
                >
                  تصدير السجل الكامل (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'OPTIMIZATION' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                  <i className="fas fa-tachometer-alt text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">تحسين الأداء</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">إعدادات تسريع النظام وتقليل استهلاك الموارد</p>
                </div>
              </div>
              <button 
                onClick={async () => {
                  if (systemSettings) {
                      try {
                          await FB.saveSettingsToDB(systemSettings);
                          if (currentUser) {
                            await FB.addSecurityLog({
                              userId: currentUser.id,
                              userName: currentUser.name,
                              action: 'تحديث إعدادات الأداء',
                              severity: 'MEDIUM',
                              details: 'تم تعديل إعدادات تحسين الأداء ومراقبة النظام'
                            });
                          }
                          alert("تم حفظ إعدادات الأداء بنجاح");
                      } catch (e) {
                          alert("فشل حفظ الإعدادات");
                      }
                  }
                }}
                className="bg-emerald-600 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center gap-2"
              >
                <i className="fas fa-save"></i>
                حفظ الإعدادات
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">مراقبة الأداء الحية</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">تتبع زمن الاستجابة واستهلاك الذاكرة</p>
                  </div>
                  <Toggle 
                    checked={systemSettings?.performanceMonitoringEnabled || false} 
                    onChange={() => setSystemSettings?.(p => ({...p, performanceMonitoringEnabled: !p.performanceMonitoringEnabled}))} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">تحسين قاعدة البيانات</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">فهرسة تلقائية وتنظيف البيانات المؤقتة</p>
                  </div>
                  <Toggle 
                    checked={systemSettings?.databaseOptimizationEnabled || false} 
                    onChange={() => setSystemSettings?.(p => ({...p, databaseOptimizationEnabled: !p.databaseOptimizationEnabled}))} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-800">تسجيل طلبات API</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1">تتبع جميع الطلبات الصادرة والواردة</p>
                  </div>
                  <Toggle 
                    checked={systemSettings?.apiLoggingEnabled || false} 
                    onChange={() => setSystemSettings?.(p => ({...p, apiLoggingEnabled: !p.apiLoggingEnabled}))} 
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-900 rounded-[2rem] text-white space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <h4 className="text-sm font-black relative z-10">إحصائيات النظام الحالية</h4>
                <div className="space-y-4 relative z-10">
                  <ResponseTimeBar />
                  <StorageUsageBar />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">حمل المعالج</span>
                    <span className="text-xs font-black text-orange-400">18%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 w-[18%]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DEVELOPER' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                  <i className="fas fa-code text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800">أدوات المطور</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">خيارات متقدمة للتطوير والتحكم التقني</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3 bg-red-50 px-4 py-2 rounded-xl border border-red-100">
                  <span className="text-[10px] font-black text-red-600 uppercase">وضع المطور</span>
                  <Toggle 
                    checked={systemSettings?.developerMode || false} 
                    onChange={() => {
                      if (!systemSettings?.developerMode && !window.confirm('تحذير: تفعيل وضع المطور قد يعرض النظام لمخاطر أمنية إذا لم يتم استخدامه بحذر. هل تريد المتابعة؟')) return;
                      setSystemSettings?.(p => ({...p, developerMode: !p.developerMode}))
                    }} 
                  />
                </div>
                <button 
                  onClick={async () => {
                    if (systemSettings) {
                        try {
                            await FB.saveSettingsToDB(systemSettings);
                            if (currentUser) {
                              await FB.addSecurityLog({
                                userId: currentUser.id,
                                userName: currentUser.name,
                                action: 'تحديث إعدادات المطور',
                                severity: 'CRITICAL',
                                details: 'تم تعديل إعدادات المطور المتقدمة'
                              });
                            }
                            alert("تم حفظ إعدادات المطور بنجاح");
                        } catch (e) {
                            alert("فشل حفظ الإعدادات");
                        }
                    }
                  }}
                  className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black hover:bg-black transition-all shadow-lg flex items-center gap-2"
                >
                  <i className="fas fa-save"></i>
                  حفظ الإعدادات
                </button>
              </div>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">القائمة البيضاء للعناوين (IP Whitelist)</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newIp}
                      onChange={(e) => setNewIp(e.target.value)}
                      placeholder="0.0.0.0" 
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:ring-2 focus:ring-slate-500/20"
                    />
                    <button 
                      onClick={() => {
                        if (!newIp) return;
                        const currentList = systemSettings?.ipWhitelist || [];
                        if (currentList.includes(newIp)) return;
                        setSystemSettings?.(p => ({...p, ipWhitelist: [...currentList, newIp]}));
                        setNewIp('');
                      }}
                      className="bg-slate-900 text-white px-4 rounded-xl hover:bg-black transition-all"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(systemSettings?.ipWhitelist || []).map(ip => (
                      <span key={ip} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-[10px] font-black flex items-center gap-2">
                        {ip}
                        <i 
                          className="fas fa-times cursor-pointer hover:text-red-500"
                          onClick={() => {
                            setSystemSettings?.(p => ({
                              ...p, 
                              ipWhitelist: (p.ipWhitelist || []).filter(item => item !== ip)
                            }));
                          }}
                        ></i>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shrink-0 shadow-sm">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div>
                  <h5 className="text-xs font-black text-amber-800">تنبيه المطور</h5>
                  <p className="text-[10px] font-bold text-amber-600 mt-1 leading-relaxed">
                    استخدام أدوات المطور مخصص فقط للفريق التقني المصرح له. أي تغييرات غير مدروسة قد تؤدي لتوقف بعض خدمات النظام أو فقدان البيانات.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'INSPECTOR_TOOLS' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <i className="fas fa-tools text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">أدوات المفتشين</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">إدارة قواعد البيانات المساعدة للمفتشين في الميدان</p>
              </div>
            </div>

            <div className="flex gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-full mb-8 overflow-x-auto custom-scrollbar">
              <button 
                onClick={() => setInspectorToolTab('ENUMBERS')} 
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${inspectorToolTab === 'ENUMBERS' ? 'bg-white text-blue-600 shadow-sm border border-blue-100' : 'text-slate-500 hover:bg-white/50'}`}
              >
                <i className="fas fa-flask"></i>
                المضافات الغذائية
              </button>
              <button 
                onClick={() => setInspectorToolTab('EPIDEMIC')} 
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${inspectorToolTab === 'EPIDEMIC' ? 'bg-white text-red-600 shadow-sm border border-red-100' : 'text-slate-500 hover:bg-white/50'}`}
              >
                <i className="fas fa-biohazard"></i>
                الوضع الوبائي
              </button>
              <button 
                onClick={() => setInspectorToolTab('HSCODES')} 
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${inspectorToolTab === 'HSCODES' ? 'bg-white text-indigo-600 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-white/50'}`}
              >
                <i className="fas fa-barcode"></i>
                الرموز الجمركية
              </button>
              <button 
                onClick={() => setInspectorToolTab('CHECKLISTS')} 
                className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${inspectorToolTab === 'CHECKLISTS' ? 'bg-white text-emerald-600 shadow-sm border border-emerald-100' : 'text-slate-500 hover:bg-white/50'}`}
              >
                <i className="fas fa-clipboard-check"></i>
                قوائم التحقق
              </button>
            </div>

            {inspectorToolTab === 'ENUMBERS' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">الرمز (E-Number)</label>
                    <input type="text" placeholder="مثال: E100" value={newENumber.code} onChange={e => setNewENumber({...newENumber, code: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">اسم المادة</label>
                    <input type="text" placeholder="اسم المادة المضافة..." value={newENumber.name} onChange={e => setNewENumber({...newENumber, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">الحالة</label>
                    <select value={newENumber.status} onChange={e => setNewENumber({...newENumber, status: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400">
                      <option value="مسموح">مسموح</option>
                      <option value="ممنوع">ممنوع</option>
                      <option value="مشتبه به">مشتبه به</option>
                      <option value="مسموح بشروط">مسموح بشروط</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">النوع / الوظيفة</label>
                    <input type="text" placeholder="مثال: ملون، حافظ، محلي..." value={newENumber.type} onChange={e => setNewENumber({...newENumber, type: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-blue-400" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleAddENumber} className="w-full bg-blue-600 text-white h-[42px] rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-all font-black text-xs shadow-lg shadow-blue-600/20">
                      <i className="fas fa-plus"></i>
                      إضافة الرمز
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {eNumbers?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
                      <div className="flex gap-4 items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${
                          item.status === 'مسموح' ? 'bg-emerald-50 text-emerald-600' : 
                          item.status === 'ممنوع' ? 'bg-red-50 text-red-600' : 
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {item.code}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800">{item.name}</div>
                          <div className="text-[10px] font-bold text-slate-400">{item.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${
                          item.status === 'مسموح' ? 'bg-emerald-100 text-emerald-700' : 
                          item.status === 'ممنوع' ? 'bg-red-100 text-red-700' : 
                          'bg-amber-100 text-amber-700'
                        }`}>{item.status}</span>
                        <button onClick={() => handleDeleteENumber(item.code)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inspectorToolTab === 'EPIDEMIC' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">الدولة</label>
                    <input type="text" placeholder="اسم الدولة..." value={newEpidemicAlert.country} onChange={e => setNewEpidemicAlert({...newEpidemicAlert, country: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-red-400" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">المرض / الوباء</label>
                    <input type="text" placeholder="وصف الحالة الوبائية..." value={newEpidemicAlert.disease} onChange={e => setNewEpidemicAlert({...newEpidemicAlert, disease: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-red-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">الإجراء المتخذ</label>
                    <select value={newEpidemicAlert.status} onChange={e => setNewEpidemicAlert({...newEpidemicAlert, status: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-red-400">
                      <option value="محظور كلياً">محظور كلياً</option>
                      <option value="محظور جزئياً">محظور جزئياً</option>
                      <option value="مراقبة مشددة">مراقبة مشددة</option>
                    </select>
                  </div>
                  <div className="md:col-span-3 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">تاريخ التحديث</label>
                    <input type="date" value={newEpidemicAlert.date} onChange={e => setNewEpidemicAlert({...newEpidemicAlert, date: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-red-400" />
                  </div>
                  <div className="flex items-end">
                    <button onClick={handleAddEpidemicAlert} className="w-full bg-red-600 text-white h-[42px] rounded-xl flex items-center justify-center gap-2 hover:bg-red-700 transition-all font-black text-xs shadow-lg shadow-red-600/20">
                      <i className="fas fa-plus"></i>
                      إضافة تنبيه
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {epidemicAlerts?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 hover:border-red-200 hover:shadow-md transition-all group">
                      <div className="flex gap-6 items-center flex-1">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center text-xl">
                          <i className="fas fa-exclamation-triangle"></i>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 flex-1">
                          <div>
                            <div className="text-[10px] font-black text-slate-400 mb-1">الدولة</div>
                            <div className="text-sm font-black text-slate-800">{item.country}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-slate-400 mb-1">المرض</div>
                            <div className="text-sm font-bold text-red-600">{item.disease}</div>
                          </div>
                          <div>
                            <div className="text-[10px] font-black text-slate-400 mb-1">الحالة</div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full ${
                              item.status === 'محظور كلياً' ? 'bg-red-100 text-red-700' : 
                              item.status === 'محظور جزئياً' ? 'bg-orange-100 text-orange-700' : 
                              'bg-blue-100 text-blue-700'
                            }`}>{item.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-[10px] font-bold text-slate-400">{item.date}</div>
                        <button onClick={() => handleDeleteEpidemicAlert(idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inspectorToolTab === 'HSCODES' && (
              <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">الرمز الجمركي</label>
                    <input type="text" placeholder="مثال: 01012100" value={newHSCode.code} onChange={e => setNewHSCode({...newHSCode, code: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-400" />
                  </div>
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">اسم السلعة</label>
                    <input type="text" placeholder="وصف السلعة..." value={newHSCode.name} onChange={e => setNewHSCode({...newHSCode, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-400" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">التصنيف</label>
                    <input type="text" placeholder="مثال: حيوانات حية..." value={newHSCode.category} onChange={e => setNewHSCode({...newHSCode, category: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-400" />
                  </div>
                  <div className="md:col-span-3"></div>
                  <div className="flex items-end">
                    <button onClick={handleAddHSCode} className="w-full bg-indigo-600 text-white h-[42px] rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all font-black text-xs shadow-lg shadow-indigo-600/20">
                      <i className="fas fa-plus"></i>
                      إضافة الرمز
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {hsCodes?.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-md transition-all group">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-mono font-black text-xs">
                          {item.code}
                        </div>
                        <div>
                          <div className="text-xs font-black text-slate-800">{item.name}</div>
                          <div className="text-[10px] font-bold text-slate-400">{item.category}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteHSCode(item.code)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                        <i className="fas fa-trash-alt text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inspectorToolTab === 'CHECKLISTS' && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                  <div className="w-full md:w-1/3 border-l border-slate-100 bg-slate-50/50 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="font-black text-sm text-slate-800">قوائم التحقق</h4>
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full">{Object.keys(checklists || {}).length} قائمة</span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="space-y-2">
                        <input type="text" placeholder="معرف القائمة (ID)..." value={newChecklist.id} onChange={e => setNewChecklist({...newChecklist, id: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-emerald-400" />
                        <div className="flex gap-2">
                          <input type="text" placeholder="عنوان القائمة..." value={newChecklist.title} onChange={e => setNewChecklist({...newChecklist, title: e.target.value})} className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-emerald-400" />
                          <button onClick={handleAddChecklist} className="bg-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                            <i className="fas fa-plus text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 overflow-y-auto max-h-[400px] custom-scrollbar">
                      {Object.values(checklists || {}).map((list) => (
                        <div 
                          key={list.id} 
                          onClick={() => setSelectedChecklistId(list.id)} 
                          className={`group p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center ${selectedChecklistId === list.id ? 'bg-white border-emerald-200 shadow-md translate-x-1' : 'bg-white border-slate-100 hover:border-slate-200'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${selectedChecklistId === list.id ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                              <i className="fas fa-clipboard-list"></i>
                            </div>
                            <div>
                              <div className={`text-xs font-black ${selectedChecklistId === list.id ? 'text-emerald-700' : 'text-slate-700'}`}>{list.title}</div>
                              <div className="text-[9px] font-bold text-slate-400">{list.items.length} عنصر</div>
                            </div>
                          </div>
                          <button onClick={(e) => { e.stopPropagation(); handleDeleteChecklist(list.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                            <i className="fas fa-trash-alt text-xs"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 p-8 bg-white">
                    {selectedChecklistId ? (
                      <div className="animate-fade-in">
                        <div className="flex items-center justify-between mb-8">
                          <div>
                            <h4 className="text-lg font-black text-slate-800">{checklists[selectedChecklistId]?.title}</h4>
                            <p className="text-slate-400 text-[10px] font-bold mt-1">إضافة وتعديل عناصر قائمة التحقق</p>
                          </div>
                          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                            <i className="fas fa-edit"></i>
                          </div>
                        </div>

                        <div className="flex gap-3 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <input 
                            type="text" 
                            placeholder="أضف عنصراً جديداً للقائمة..." 
                            value={newChecklist.newItem} 
                            onChange={e => setNewChecklist({...newChecklist, newItem: e.target.value})} 
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-emerald-400" 
                          />
                          <button onClick={handleAddChecklistItem} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                            إضافة للعناصر
                          </button>
                        </div>

                        <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                          {checklists[selectedChecklistId]?.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-100 hover:bg-white hover:border-emerald-100 transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="w-6 h-6 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-[10px] font-black text-slate-400">
                                  {idx + 1}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{item}</span>
                              </div>
                              <button onClick={() => handleDeleteChecklistItem(selectedChecklistId, idx)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                <i className="fas fa-times-circle"></i>
                              </button>
                            </div>
                          ))}
                          {checklists[selectedChecklistId]?.items.length === 0 && (
                            <div className="text-center py-20 bg-slate-50/30 rounded-3xl border-2 border-dashed border-slate-100">
                              <div className="text-slate-300 text-3xl mb-4"><i className="fas fa-plus-circle"></i></div>
                              <p className="text-slate-400 text-xs font-bold">لا توجد عناصر في هذه القائمة حالياً</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 text-3xl mb-6">
                          <i className="fas fa-mouse-pointer"></i>
                        </div>
                        <h4 className="text-lg font-black text-slate-800 mb-2">اختر قائمة للبدء</h4>
                        <p className="text-slate-400 text-xs font-bold max-w-xs">قم باختيار قائمة من الجانب الأيمن لعرض وتعديل عناصرها أو قم بإنشاء قائمة جديدة.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'LOOKUPS' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                <i className="fas fa-list-ul text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">إدارة القوائم المرجعية</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">إدارة البيانات الأساسية المستخدمة في النماذج والتقارير</p>
              </div>
              <div className="flex-1"></div>
              <div className="relative w-64">
                <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input 
                  type="text" 
                  placeholder="بحث في القوائم..." 
                  value={lookupSearch}
                  onChange={(e) => setLookupSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <SettingsCard 
                  title="أنواع الفحص" 
                  icon="fa-search" 
                  color="amber" 
                  items={inspectionTypes.filter(i => i.toLowerCase().includes(lookupSearch.toLowerCase()))} 
                  onDelete={(v: string) => handleDeleteItem('INSPECTION', v)} 
                  onAdd={() => handleAddItem('INSPECTION')} 
                  inputValue={newItem.type === 'INSPECTION' ? newItem.value : ''} 
                  onInputChange={(v: string) => setNewItem({ ...newItem, type: 'INSPECTION', value: v })} 
                  isReadOnly={isReadOnly}
                  type="INSPECTION"
                  editingItem={editingItem}
                  onEditStart={handleStartEdit}
                  onEditChange={(val: string) => setEditingItem(prev => prev ? { ...prev, value: val } : null)}
                  onEditSave={handleUpdateItem}
                  onEditCancel={() => setEditingItem(null)}
              />
              <SettingsCard 
                  title="أنواع البيان" 
                  icon="fa-file-invoice" 
                  color="indigo" 
                  items={declarationTypes.filter(i => i.toLowerCase().includes(lookupSearch.toLowerCase()))} 
                  onDelete={(v: string) => handleDeleteItem('DECLARATION', v)} 
                  onAdd={() => handleAddItem('DECLARATION')} 
                  inputValue={newItem.type === 'DECLARATION' ? newItem.value : ''} 
                  onInputChange={(v: string) => setNewItem({ ...newItem, type: 'DECLARATION', value: v })} 
                  isReadOnly={isReadOnly}
                  type="DECLARATION"
                  editingItem={editingItem}
                  onEditStart={handleStartEdit}
                  onEditChange={(val: string) => setEditingItem(prev => prev ? { ...prev, value: val } : null)}
                  onEditSave={handleUpdateItem}
                  onEditCancel={() => setEditingItem(null)}
              />
              <SettingsCard 
                  title="جهات التحويل" 
                  icon="fa-exchange-alt" 
                  color="indigo" 
                  items={transferDestinations.filter(i => i.toLowerCase().includes(lookupSearch.toLowerCase()))} 
                  onDelete={(v: string) => handleDeleteItem('TRANSFER', v)} 
                  onAdd={() => handleAddItem('TRANSFER')} 
                  inputValue={newItem.type === 'TRANSFER' ? newItem.value : ''} 
                  onInputChange={(v: string) => setNewItem({ ...newItem, type: 'TRANSFER', value: v })} 
                  isReadOnly={isReadOnly}
                  type="TRANSFER"
                  editingItem={editingItem}
                  onEditStart={handleStartEdit}
                  onEditChange={(val: string) => setEditingItem(prev => prev ? { ...prev, value: val } : null)}
                  onEditSave={handleUpdateItem}
                  onEditCancel={() => setEditingItem(null)}
              />

              <SettingsCard 
                  title="غرض الاستخدام" 
                  icon="fa-bullseye" 
                  color="emerald" 
                  items={intendedUses.filter(i => i.toLowerCase().includes(lookupSearch.toLowerCase()))} 
                  onDelete={(v: string) => handleDeleteItem('INTENDED_USE', v)} 
                  onAdd={() => handleAddItem('INTENDED_USE')} 
                  inputValue={newItem.type === 'INTENDED_USE' ? newItem.value : ''} 
                  onInputChange={(v: string) => setNewItem({ ...newItem, type: 'INTENDED_USE', value: v })} 
                  isReadOnly={isReadOnly}
                  type="INTENDED_USE"
                  editingItem={editingItem}
                  onEditStart={handleStartEdit}
                  onEditChange={(val: string) => setEditingItem(prev => prev ? { ...prev, value: val } : null)}
                  onEditSave={handleUpdateItem}
                  onEditCancel={() => setEditingItem(null)}
              />
              
              <SettingsCard 
                  title="الفحص المخبري" 
                  icon="fa-flask" 
                  color="blue" 
                  items={(labAnalysisTypes[labSector] || []).filter(i => i.toLowerCase().includes(lookupSearch.toLowerCase()))} 
                  onDelete={(v: string) => handleDeleteItem('LAB', v)} 
                  onAdd={() => handleAddItem('LAB')} 
                  inputValue={newItem.type === 'LAB' ? newItem.value : ''} 
                  onInputChange={(v: string) => setNewItem({ ...newItem, type: 'LAB', value: v })} 
                  isSectorSpecific 
                  activeSector={labSector} 
                  onSectorChange={setLabSector} 
                  isReadOnly={isReadOnly}
                  type="LAB"
                  editingItem={editingItem}
                  onEditStart={handleStartEdit}
                  onEditChange={(val: string) => setEditingItem(prev => prev ? { ...prev, value: val } : null)}
                  onEditSave={handleUpdateItem}
                  onEditCancel={() => setEditingItem(null)}
              />
              
              <SettingsCard 
                  title="أسباب الرفض" 
                  icon="fa-ban" 
                  color="red" 
                  items={(rejectionReasons[rejectionSector] || []).filter(i => i.toLowerCase().includes(lookupSearch.toLowerCase()))} 
                  onDelete={(v: string) => handleDeleteItem('REJECTION', v)} 
                  onAdd={() => handleAddItem('REJECTION')} 
                  inputValue={newItem.type === 'REJECTION' ? newItem.value : ''} 
                  onInputChange={(v: string) => setNewItem({ ...newItem, type: 'REJECTION', value: v })} 
                  isSectorSpecific 
                  activeSector={rejectionSector} 
                  onSectorChange={setRejectionSector} 
                  isReadOnly={isReadOnly}
                  type="REJECTION"
                  editingItem={editingItem}
                  onEditStart={handleStartEdit}
                  onEditChange={(val: string) => setEditingItem(prev => prev ? { ...prev, value: val } : null)}
                  onEditSave={handleUpdateItem}
                  onEditCancel={() => setEditingItem(null)}
              />

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                <div className={`p-6 border-b border-slate-50 flex items-center gap-3 bg-emerald-50 text-emerald-600`}>
                  <i className={`fas fa-seedling text-xl`}></i>
                  <h4 className="font-black text-lg">إدارة المبيدات</h4>
                </div>
                <div className="p-6 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar space-y-2">
                  {pesticides.filter(p => p.name.toLowerCase().includes(lookupSearch.toLowerCase()) || p.activeIngredient?.toLowerCase().includes(lookupSearch.toLowerCase())).length > 0 ? 
                    pesticides.filter(p => p.name.toLowerCase().includes(lookupSearch.toLowerCase()) || p.activeIngredient?.toLowerCase().includes(lookupSearch.toLowerCase())).map((pest) => (
                    <div key={pest.id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 group">
                      <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-slate-800">{pest.name}</span>
                              {pest.pesticideType && <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 rounded font-bold">{pest.pesticideType}</span>}
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600">{pest.activeIngredients?.join(', ') || pest.activeIngredient || ''}</span>
                      </div>
                      <div className="flex gap-2">
                          {!isReadOnly && (
                              <button onClick={() => handleEditPest(pest)} className="text-slate-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-all">
                                  <i className="fas fa-edit text-xs"></i>
                              </button>
                          )}
                          {!isReadOnly && <button onClick={() => handleDeleteItem('PESTICIDE', pest.name, pest.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><i className="fas fa-trash-alt text-xs"></i></button>}
                      </div>
                    </div>
                  )) : (
                      <div className="text-center py-10 text-slate-300 italic text-xs">لا يوجد نتائج للبحث</div>
                  )}
                </div>
                {!isReadOnly && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-2">
                  <input 
                    type="text" 
                    value={newItem.type === 'PESTICIDE' ? newItem.value : ''} 
                    onChange={(e) => setNewItem({ ...newItem, type: 'PESTICIDE', value: e.target.value })} 
                    placeholder="الاسم التجاري للمبيد..." 
                    className="w-full rounded-xl px-4 py-3 text-xs font-bold outline-none border border-slate-200 focus:border-emerald-400" 
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={newItem.type === 'PESTICIDE' ? (newItem.subValue || '') : ''} 
                      onChange={(e) => setNewItem({ ...newItem, type: 'PESTICIDE', subValue: e.target.value })} 
                      placeholder="المادة الفعالة..." 
                      className="w-full rounded-xl px-4 py-3 text-xs font-bold outline-none border border-slate-200 focus:border-emerald-400" 
                    />
                    <input 
                      type="text" 
                      value={newItem.type === 'PESTICIDE' ? (newItem.extraValue || '') : ''} 
                      onChange={(e) => setNewItem({ ...newItem, type: 'PESTICIDE', extraValue: e.target.value })} 
                      placeholder="نوع المبيد (حشري/فطري...)" 
                      className="w-full rounded-xl px-4 py-3 text-xs font-bold outline-none border border-slate-200 focus:border-emerald-400" 
                    />
                  </div>
                  <div className="flex gap-2">
                      <button 
                      onClick={() => handleAddItem('PESTICIDE')} 
                      disabled={isSavingPest}
                      className={`flex-1 py-3 rounded-xl text-white ${editingPestId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-800 hover:bg-black'} transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
                      >
                      {isSavingPest ? <i className="fas fa-circle-notch fa-spin"></i> : <i className={editingPestId ? "fas fa-save" : "fas fa-plus"}></i>}
                      <span className="text-xs font-black">{editingPestId ? 'تحديث البيانات' : 'إضافة المبيد'}</span>
                      </button>
                      {editingPestId && (
                          <button 
                              onClick={() => { setEditingPestId(null); setNewItem({ type: 'PESTICIDE', value: '', subValue: '', extraValue: '' }); }}
                              className="px-4 py-3 rounded-xl bg-slate-200 text-slate-600 hover:bg-slate-300 transition-all text-xs font-black"
                          >
                              إلغاء
                          </button>
                      )}
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DYNAMIC_RULES' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                <i className="fas fa-bolt text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">محرك القواعد الذكي (Smart Engine)</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">أتمتة تصنيف المخاطر واتخاذ الإجراءات بناءً على معايير مخصصة</p>
              </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-orange-600 shadow-sm">
                  <i className="fas fa-plus"></i>
                </div>
                <h4 className="text-sm font-black text-slate-800">إضافة قاعدة أتمتة جديدة</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 mr-2">اسم القاعدة</label>
                  <input 
                    type="text" 
                    placeholder="مثال: حظر مؤقت للمستورد" 
                    value={newRule.name} 
                    onChange={e => setNewRule({...newRule, name: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-orange-400" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 mr-2">الحقل المستهدف</label>
                  <select 
                    value={newRule.conditionField} 
                    onChange={e => setNewRule({...newRule, conditionField: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-orange-400 appearance-none"
                  >
                    <option value="shippingCountry">بلد التصدير</option>
                    <option value="port">المنفذ</option>
                    <option value="importer">المستورد</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 mr-2">الشرط</label>
                  <select 
                    value={newRule.conditionOperator} 
                    onChange={e => setNewRule({...newRule, conditionOperator: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-orange-400 appearance-none"
                  >
                    <option value="equals">يساوي تماماً</option>
                    <option value="contains">يحتوي على</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 mr-2">القيمة المقارنة</label>
                  <input 
                    type="text" 
                    placeholder="مثال: الصين" 
                    value={newRule.conditionValue} 
                    onChange={e => setNewRule({...newRule, conditionValue: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-orange-400" 
                  />
                </div>

                <div className="space-y-1 lg:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 mr-2">الإجراء التلقائي</label>
                  <select 
                    value={newRule.actionValue} 
                    onChange={e => setNewRule({...newRule, actionValue: e.target.value})} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-orange-400 appearance-none"
                  >
                    <option value="HIGH">تعيين كـ: عالي الخطورة (تفتيش دقيق)</option>
                    <option value="MEDIUM">تعيين كـ: متوسط الخطورة (معاينة)</option>
                    <option value="REJECT">إجراء: رفض تلقائي (منع دخول)</option>
                  </select>
                </div>
              </div>
              
              <button 
                onClick={handleAddRule} 
                className="bg-orange-600 text-white px-10 py-3 rounded-2xl text-xs font-black hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20 flex items-center gap-2"
              >
                <i className="fas fa-plus-circle"></i>
                تفعيل القاعدة الجديدة
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2 px-4">
                <h5 className="text-xs font-black text-slate-400 uppercase tracking-widest">القواعد النشطة حالياً</h5>
                <span className="text-[10px] font-black text-slate-400">{rules.length} قاعدة</span>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {rules.map(rule => (
                  <div key={rule.id} className="group flex items-center justify-between bg-white border border-slate-100 p-6 rounded-[2rem] hover:border-orange-200 transition-all hover:shadow-md">
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                        rule.actionValue === 'REJECT' ? 'bg-red-50 text-red-600' :
                        rule.actionValue === 'HIGH' ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        <i className={`fas ${rule.actionValue === 'REJECT' ? 'fa-ban' : 'fa-bolt'}`}></i>
                      </div>
                      <div>
                        <div className="font-black text-slate-800 text-sm mb-1">{rule.name}</div>
                        <div className="text-[11px] text-slate-500 font-bold flex items-center gap-2">
                          إذا كان <span className="text-slate-800 underline decoration-orange-300 underline-offset-4">{rule.conditionField === 'shippingCountry' ? 'بلد التصدير' : rule.conditionField === 'port' ? 'المنفذ' : 'المستورد'}</span> 
                          {rule.conditionOperator === 'equals' ? 'يساوي' : 'يحتوي على'} 
                          <span className="text-orange-600 font-black">"{rule.conditionValue}"</span> 
                          <i className="fas fa-long-arrow-alt-left mx-1"></i>
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${
                            rule.actionValue === 'REJECT' ? 'bg-red-100 text-red-700' :
                            rule.actionValue === 'HIGH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {rule.actionValue === 'HIGH' ? 'عالي الخطورة' : rule.actionValue === 'MEDIUM' ? 'متوسط الخطورة' : 'رفض تلقائي'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteRule(rule.id)} 
                      className="text-slate-300 hover:text-red-600 bg-slate-50 hover:bg-red-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                ))}
                {rules.length === 0 && (
                  <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                      <i className="fas fa-bolt text-2xl"></i>
                    </div>
                    <p className="text-slate-400 text-xs font-bold italic">لا توجد قواعد أتمتة نشطة حالياً</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'SYSTEM_HEALTH' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                <i className="fas fa-heartbeat text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">صحة النظام ومراقبة الأداء</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">مراقبة حية لموارد النظام، زمن الاستجابة، وحالة الأمان</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-rose-200 transition-all">
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">المستخدمين النشطين</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-black text-slate-800"><ActiveUserCount /></div>
                  <div className="text-[10px] text-emerald-500 font-black flex items-center gap-1">
                    <i className="fas fa-circle text-[6px] animate-pulse"></i>
                    مباشر
                  </div>
                </div>
                <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 w-1/3"></div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-rose-200 transition-all">
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">معدل الأخطاء</div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-black text-emerald-600">0.02%</div>
                  <div className="text-[10px] text-slate-400 font-black">طبيعي</div>
                </div>
                <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[2%]"></div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-rose-200 transition-all">
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">استهلاك التخزين</div>
                <div className="flex items-baseline gap-2">
                  <StorageUsage />
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-rose-200 transition-all">
                <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-2">زمن الاستجابة</div>
                <div className="flex items-baseline gap-2">
                  <ResponseTime />
                </div>
                <div className="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-1/4"></div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 p-6 rounded-[2rem] flex items-start gap-6">
              <div className="w-14 h-14 bg-white text-red-600 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 border border-red-100">
                <i className="fas fa-shield-alt"></i>
              </div>
              <LatestSecurityAlert />
              <button 
                onClick={() => setActiveTab('SECURITY_ACCESS')}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
              >
                عرض السجلات
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CMS' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                <i className="fas fa-language text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">إدارة المحتوى والتوطين</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">تخصيص المسميات والنصوص في واجهة النظام (يتم الحفظ تلقائياً)</p>
              </div>
              <div className="flex-1"></div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                cmsSaveStatus === 'SAVING' ? 'bg-amber-50 text-amber-600' :
                cmsSaveStatus === 'SAVED' ? 'bg-emerald-50 text-emerald-600' :
                'bg-slate-50 text-slate-400'
              }`}>
                {cmsSaveStatus === 'SAVING' && <><i className="fas fa-circle-notch fa-spin"></i> جاري الحفظ...</>}
                {cmsSaveStatus === 'SAVED' && <><i className="fas fa-check-circle"></i> تم الحفظ وتحديث النظام</>}
                {cmsSaveStatus === 'IDLE' && <><i className="fas fa-cloud"></i> متزامن</>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-teal-600 shadow-sm">
                    <i className="fas fa-tag"></i>
                  </div>
                  <h4 className="text-sm font-black text-slate-800">تسميات النماذج والبيانات</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">تسمية "رقم البيان"</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.declarationNumber || 'البيان الجمركي'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), declarationNumber: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">تسمية "المخلص"</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.clearanceAgent || 'المندوب الجمركي'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), clearanceAgent: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">تسمية "المستورد"</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.importerLabel || 'الشركة المستوردة'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), importerLabel: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-teal-600 shadow-sm">
                    <i className="fas fa-comment-alt"></i>
                  </div>
                  <h4 className="text-sm font-black text-slate-800">رسائل النظام والتنبيهات</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">رسالة الترحيب في لوحة القيادة</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.welcomeMessage || 'مرحباً بك في نظام مرقاب الذكي'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), welcomeMessage: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">رسالة الخطأ الافتراضية</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.defaultError || 'عذراً، حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), defaultError: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">رسالة نجاح الحفظ</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.saveSuccess || 'تم حفظ البيانات بنجاح'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), saveSuccess: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-teal-600 shadow-sm">
                    <i className="fas fa-compass"></i>
                  </div>
                  <h4 className="text-sm font-black text-slate-800">تسميات القائمة الجانبية</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">لوحة القيادة</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.navDashboard || 'لوحة القيادة'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), navDashboard: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">الإرساليات</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.navConsignments || 'الإرساليات'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), navConsignments: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">المختبر</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.navLab || 'المختبر'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), navLab: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">التقارير</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.navReports || 'التقارير'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), navReports: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-teal-600 shadow-sm">
                    <i className="fas fa-layer-group"></i>
                  </div>
                  <h4 className="text-sm font-black text-slate-800">تسميات القطاعات</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">القطاع البيطري</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.sectorVeterinary || 'الحجر البيطري'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), sectorVeterinary: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">القطاع الزراعي</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.sectorAgricultural || 'الحجر الزراعي'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), sectorAgricultural: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">سلامة الغذاء</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.sectorFoodSafety || 'سلامة الغذاء'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), sectorFoodSafety: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-teal-600 shadow-sm">
                    <i className="fas fa-info-circle"></i>
                  </div>
                  <h4 className="text-sm font-black text-slate-800">حالات الإرسالية</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">قيد الانتظار</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.statusPending || 'قيد الانتظار'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), statusPending: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">مقبول</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.statusApproved || 'مقبول'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), statusApproved: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">مرفوض</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.statusRejected || 'مرفوض'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), statusRejected: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">قيد الفحص</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.statusInInspection || 'قيد الفحص'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), statusInInspection: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-teal-600 shadow-sm">
                    <i className="fas fa-lock"></i>
                  </div>
                  <h4 className="text-sm font-black text-slate-800">صفحة الدخول</h4>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">عنوان صفحة الدخول</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.loginTitle || 'تسجيل الدخول للنظام'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), loginTitle: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 mr-2">وصف صفحة الدخول</label>
                    <input 
                      type="text" 
                      value={systemSettings?.customLabels?.loginSubtitle || 'يرجى إدخال بيانات الاعتماد للوصول إلى لوحة التحكم'} 
                      onChange={(e) => setSystemSettings?.(p => ({...p, customLabels: {...(p?.customLabels || {}), loginSubtitle: e.target.value}}))}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold outline-none focus:border-teal-400" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CLOUD_COSTS' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600">
                <i className="fas fa-cloud text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">إدارة التكاليف السحابية والموارد</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">تحليل استهلاك الموارد وتكاليف الاستضافة والخدمات</p>
              </div>
            </div>
            <CloudCostsDashboard />
          </div>
        </div>
      )}

      {activeTab === 'SESSION_CONTROL' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <i className="fas fa-users-cog text-xl"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">إدارة الجلسات المتقدمة</h3>
                <p className="text-slate-400 text-xs font-bold mt-1">التحكم في جلسات المستخدمين النشطة وإعدادات الأمان (يتم الحفظ تلقائياً)</p>
              </div>
              <div className="flex-1"></div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                sessionSaveStatus === 'SAVING' ? 'bg-amber-50 text-amber-600' :
                sessionSaveStatus === 'SAVED' ? 'bg-emerald-50 text-emerald-600' :
                'bg-slate-50 text-slate-400'
              }`}>
                {sessionSaveStatus === 'SAVING' && <><i className="fas fa-circle-notch fa-spin"></i> جاري الحفظ...</>}
                {sessionSaveStatus === 'SAVED' && <><i className="fas fa-check-circle"></i> تم الحفظ وتحديث النظام</>}
                {sessionSaveStatus === 'IDLE' && <><i className="fas fa-cloud"></i> متزامن</>}
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <i className="fas fa-lock"></i>
                      </div>
                      <div>
                        <h5 className="font-black text-slate-800 text-sm">منع الجلسات المتزامنة</h5>
                        <p className="text-[10px] text-slate-500 mt-1 font-bold">يمنع المستخدم من تسجيل الدخول من جهازين مختلفين في نفس الوقت.</p>
                      </div>
                    </div>
                    <Toggle checked={systemSettings?.maxConcurrentSessions === 1} onChange={() => setSystemSettings?.(p => ({...p, maxConcurrentSessions: p.maxConcurrentSessions === 1 ? 0 : 1}))} />
                  </div>
                  
                  <div className="pt-6 border-t border-slate-200">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                        <i className="fas fa-clock"></i>
                      </div>
                      <div>
                        <h5 className="font-black text-slate-800 text-sm">القفل التلقائي الذكي</h5>
                        <p className="text-[10px] text-slate-500 mt-1 font-bold">قفل شاشة المستخدم تلقائياً إذا ابتعد عن الجهاز (بالدقائق).</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 bg-white p-6 rounded-2xl border border-slate-100">
                      <input 
                        type="range" 
                        min="5" 
                        max="60" 
                        step="5"
                        value={systemSettings?.autoLockTimeout || 15} 
                        onChange={(e) => setSystemSettings?.(p => ({...p, autoLockTimeout: parseInt(e.target.value)}))} 
                        className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500" 
                      />
                      <div className="flex flex-col items-center min-w-[80px]">
                        <span className="text-2xl font-black text-emerald-600">{systemSettings?.autoLockTimeout || 15}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase">دقيقة</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex items-start gap-4">
                  <div className="w-10 h-10 bg-white text-amber-600 rounded-xl flex items-center justify-center shrink-0 shadow-sm"><i className="fas fa-info-circle"></i></div>
                  <div>
                    <h5 className="font-black text-amber-800 text-xs">نصيحة أمنية</h5>
                    <p className="text-[10px] text-amber-700 mt-1 font-bold leading-relaxed">
                      تفعيل "منع الجلسات المتزامنة" يقلل من مخاطر مشاركة الحسابات بين الموظفين ويضمن دقة سجلات التتبع (Audit Logs).
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/20">
                <div className="flex items-center justify-between mb-8">
                  <h5 className="font-black text-white text-sm flex items-center gap-3">
                    <i className="fas fa-users text-emerald-400"></i>
                    الجلسات النشطة
                  </h5>
                  <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full border border-emerald-500/30">مباشر</span>
                </div>
                <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  <ActiveSessionsList />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'USEFUL_TOOLS' && (
        <div className="space-y-6 animate-fade-in">
          <UsefulTools currentUser={currentUser!} />
        </div>
      )}

      </div>
    </div>
  );
};

const ActiveSessionsList = () => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = FB.subscribeToActiveSessions((active) => {
      setSessions(active);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleTerminate = async (userId: string) => {
    if (window.confirm("هل أنت متأكد من إنهاء هذه الجلسة؟")) {
      await FB.terminateSession(userId);
      setSessions(sessions.filter(s => s.userId !== userId));
    }
  };

  if (loading) return <div className="text-center text-xs text-slate-400 py-4">جاري التحميل...</div>;
  if (sessions.length === 0) return <div className="text-center text-xs text-slate-400 py-4">لا توجد جلسات نشطة</div>;

  return (
    <>
      {sessions.map((session, idx) => {
        const timeAgo = Math.floor((Date.now() - new Date(session.lastActive).getTime()) / 60000);
        return (
          <div key={idx} className="flex items-center justify-between bg-slate-700/50 p-3 rounded-xl border border-slate-600">
            <div>
              <div className="text-xs font-bold text-white">{session.name} <span className="text-[9px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded ml-2">{session.role}</span></div>
              <div className="text-[10px] text-slate-400 mt-1">نشط منذ {timeAgo} دقيقة</div>
            </div>
            <button onClick={() => handleTerminate(session.userId)} className="text-red-400 hover:text-red-300 text-[10px] font-bold bg-red-400/10 px-3 py-1.5 rounded-lg transition-colors">إنهاء الجلسة</button>
          </div>
        );
      })}
    </>
  );
};

const ActiveUserCount = () => {
  const [count, setCount] = useState(0);
  React.useEffect(() => {
    const unsubscribe = FB.subscribeToActiveSessions((active) => {
      setCount(active.length);
    });
    return () => unsubscribe();
  }, []);
  return <>{count}</>;
};

const SecurityAuditLogs = () => {
  const [logs, setLogs] = useState<SecurityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = FB.subscribeToSecurityLogs(50, (data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="text-center py-10 text-slate-400 font-bold text-xs"><i className="fas fa-circle-notch fa-spin ml-2"></i> جاري تحميل السجلات...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        <i className="fas fa-shield-check text-3xl text-slate-300 mb-2"></i>
        <p className="text-slate-400 text-xs font-bold">لا توجد سجلات أمنية حالياً</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-orange-200 transition-all group">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            log.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
            log.severity === 'HIGH' ? 'bg-orange-100 text-orange-500' : 
            log.severity === 'MEDIUM' ? 'bg-yellow-50 text-yellow-600' : 'bg-blue-50 text-blue-500'
          }`}>
            <i className={`fas ${log.severity === 'CRITICAL' || log.severity === 'HIGH' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-black text-slate-800">{log.action}</span>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${
                log.severity === 'CRITICAL' ? 'bg-red-100 text-red-600' :
                log.severity === 'HIGH' ? 'bg-orange-100 text-orange-600' : 
                log.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-600'
              }`}>{log.severity}</span>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
              <span className="flex items-center gap-1"><i className="far fa-user"></i> {log.userName}</span>
              <span className="flex items-center gap-1"><i className="far fa-clock"></i> {new Date(log.timestamp).toLocaleString('ar-OM')}</span>
              <span className="flex items-center gap-1 font-mono"><i className="fas fa-network-wired"></i> {log.ipAddress || 'غير معروف'}</span>
            </div>
            {log.details && (
              <p className="text-[10px] text-slate-500 mt-1 font-bold">{log.details}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

const ResponseTimeBar = () => {
  const [ping, setPing] = useState(0);
  React.useEffect(() => {
    const measurePing = async () => {
      try {
        const start = performance.now();
        await FB.db.collection('settings').doc('general').get();
        const end = performance.now();
        setPing(Math.round(end - start));
      } catch (e) {
        console.error(e);
      }
    };
    measurePing();
    const interval = setInterval(measurePing, 10000);
    return () => clearInterval(interval);
  }, []);

  const percentage = Math.min((ping / 1000) * 100, 100);

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400">زمن الاستجابة (Avg)</span>
        <span className="text-xs font-black text-emerald-400">{ping}ms</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500" style={{ width: `${percentage}%` }}></div>
      </div>
    </>
  );
};

const StorageUsageBar = () => {
  const [percentage, setPercentage] = useState(0);
  React.useEffect(() => {
    const fetchStorage = async () => {
      try {
        const snap = await FB.db.collection('consignments').get();
        const count = snap.size;
        const estimatedGB = (count * 2.5) / 1024;
        const maxGB = 50;
        const perc = Math.min((estimatedGB / maxGB) * 100, 100);
        setPercentage(perc);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStorage();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-400">استهلاك التخزين</span>
        <span className="text-xs font-black text-blue-400">{percentage.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: `${percentage}%` }}></div>
      </div>
    </>
  );
};

const LatestSecurityAlert = () => {
  const [alert, setAlert] = useState<SecurityLogEntry | null>(null);
  
  React.useEffect(() => {
    const unsubscribe = FB.subscribeToSecurityLogs(10, (logs) => {
      const latestHighOrCritical = logs.find(l => l.severity === 'HIGH' || l.severity === 'CRITICAL');
      if (latestHighOrCritical) {
        setAlert(latestHighOrCritical);
      } else {
        setAlert(null);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!alert) {
    return (
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h5 className="font-black text-emerald-800 text-sm">حالة الأمان (SOC)</h5>
          <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.5 rounded-full">آمن</span>
        </div>
        <p className="text-xs text-emerald-600/80 font-bold leading-relaxed">
          لم يتم رصد أي أنشطة مشبوهة أو تنبيهات أمنية عالية الخطورة مؤخراً. النظام يعمل بشكل آمن.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-2">
        <h5 className="font-black text-red-800 text-sm">تنبيهات الأمان الذكية (SOC)</h5>
        <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full">
          {alert.severity === 'CRITICAL' ? 'حرج جداً' : 'عالي الخطورة'}
        </span>
      </div>
      <p className="text-xs text-red-600/80 font-bold leading-relaxed">
        {alert.action} بواسطة {alert.userName} ({alert.ipAddress || 'غير معروف'}) في {new Date(alert.timestamp).toLocaleString('ar-OM')}. {alert.details}
      </p>
    </div>
  );
};

const ResponseTime = () => {
  const [ping, setPing] = useState(0);
  React.useEffect(() => {
    const measurePing = async () => {
      try {
        const start = performance.now();
        await FB.db.collection('settings').doc('general').get();
        const end = performance.now();
        setPing(Math.round(end - start));
      } catch (e) {
        console.error(e);
      }
    };
    measurePing();
    const interval = setInterval(measurePing, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="text-3xl font-black text-blue-600">{ping}ms</div>
      <div className="text-[10px] text-emerald-500 font-black">{ping < 200 ? 'ممتاز' : ping < 500 ? 'جيد' : 'بطيء'}</div>
    </>
  );
};

const StorageUsage = () => {
  const [percentage, setPercentage] = useState(0);
  React.useEffect(() => {
    const fetchStorage = async () => {
      try {
        const snap = await FB.db.collection('consignments').get();
        const count = snap.size;
        const estimatedGB = (count * 2.5) / 1024;
        const maxGB = 50; // Assume 50GB quota
        const perc = Math.min((estimatedGB / maxGB) * 100, 100);
        setPercentage(perc);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStorage();
  }, []);

  return (
    <>
      <div className="text-3xl font-black text-amber-600">{percentage.toFixed(1)}%</div>
      <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden"><div className="bg-amber-500 h-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div></div>
    </>
  );
};

const CloudCostsDashboard = () => {
  const [stats, setStats] = useState({ totalConsignments: 0, ports: {} as Record<string, number> });
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const snap = await FB.db.collection('consignments').get();
        const consignments = snap.docs.map(d => d.data());
        
        const portCounts: Record<string, number> = {};
        consignments.forEach(c => {
          if (c.port) {
            portCounts[c.port] = (portCounts[c.port] || 0) + 1;
          }
        });

        setStats({
          totalConsignments: consignments.length,
          ports: portCounts
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-center py-8 text-slate-400 text-xs font-bold"><i className="fas fa-circle-notch fa-spin mr-2"></i> جاري حساب التكاليف...</div>;

  // Estimation logic (mock pricing)
  const estimatedStorageGB = (stats.totalConsignments * 2.5) / 1024; // Assume 2.5MB per consignment
  const storageCost = estimatedStorageGB * 0.026; // $0.026 per GB
  const dbCost = (stats.totalConsignments * 5) / 100000 * 0.18; // Reads/Writes estimation
  const totalCost = storageCost + dbCost + 15; // Base cost

  const maxPortCount = Math.max(...Object.values(stats.ports), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="text-slate-400 text-sm font-bold mb-2">التكلفة التقديرية لهذا الشهر (مبنية على الاستخدام الفعلي)</div>
          <div className="text-5xl font-black mb-6">${totalCost.toFixed(2)}</div>
          <div className="grid grid-cols-3 gap-4 border-t border-slate-700/50 pt-6">
            <div>
              <div className="text-slate-400 text-[10px] font-bold mb-1">قاعدة البيانات (Firestore)</div>
              <div className="text-lg font-bold">${dbCost.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] font-bold mb-1">التخزين ({estimatedStorageGB.toFixed(2)} GB)</div>
              <div className="text-lg font-bold">${storageCost.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px] font-bold mb-1">رسائل SMS (ثابت)</div>
              <div className="text-lg font-bold">$15.00</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center">
        <h5 className="font-bold text-slate-700 mb-4 text-center">استهلاك التخزين حسب المنفذ</h5>
        <div className="space-y-4 max-h-48 overflow-y-auto custom-scrollbar pr-2">
          {Object.entries(stats.ports).map(([port, count], idx) => {
            const percentage = (count / maxPortCount) * 100;
            const estimatedGB = ((count * 2.5) / 1024).toFixed(2);
            return (
              <div key={idx}>
                <div className="flex justify-between text-xs font-bold mb-1"><span className="text-slate-600">{port}</span><span className="text-slate-800">{estimatedGB} GB</span></div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full" style={{ width: `${percentage}%` }}></div></div>
              </div>
            );
          })}
          {Object.keys(stats.ports).length === 0 && <div className="text-center text-xs text-slate-400">لا توجد بيانات كافية</div>}
        </div>
      </div>
    </div>
  );
};

const SettingsCard = ({ title, icon, color, items, onDelete, onAdd, inputValue, onInputChange, isSectorSpecific, activeSector, onSectorChange, isReadOnly, type, editingItem, onEditStart, onEditChange, onEditSave, onEditCancel }: any) => {
  const colorClasses: any = { amber: 'bg-amber-50 text-amber-600', indigo: 'bg-indigo-50 text-indigo-600', green: 'bg-green-50 text-green-600', blue: 'bg-blue-50 text-blue-600', red: 'bg-red-50 text-red-600' };
  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
      <div className={`p-6 border-b border-slate-50 flex items-center gap-3 ${colorClasses[color]}`}><i className={`fas ${icon} text-xl`}></i><h4 className="font-black text-lg">{title}</h4></div>
      {isSectorSpecific && (
          <div className="px-4 pt-4 flex gap-2 overflow-x-auto custom-scrollbar">
              {Object.values(ConsignmentType).map(s => (
                  <button key={s} onClick={() => onSectorChange(s)} className={`text-[9px] font-black px-3 py-1.5 rounded-lg whitespace-nowrap border ${activeSector === s ? `bg-white border-slate-200 text-slate-800` : 'bg-transparent border-transparent text-slate-400'}`}>{CONSIGNMENT_LABELS[s]}</button>
              ))}
          </div>
      )}
      <div className="p-6 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar space-y-2">
        {items?.map((item: string, idx: number) => {
            const isEditing = editingItem?.type === type && editingItem?.originalValue === item;
            return (
              <div key={idx} className={`flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 group ${isEditing ? 'ring-2 ring-blue-100' : ''}`}>
                {isEditing ? (
                    <div className="flex items-center gap-2 w-full">
                        <input 
                            type="text" 
                            value={editingItem.value} 
                            onChange={(e) => onEditChange(e.target.value)}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold outline-none focus:border-blue-400"
                            autoFocus
                        />
                        <button onClick={onEditSave} className="text-blue-600 hover:bg-blue-50 p-1 rounded"><i className="fas fa-check"></i></button>
                        <button onClick={onEditCancel} className="text-red-500 hover:bg-red-50 p-1 rounded"><i className="fas fa-times"></i></button>
                    </div>
                ) : (
                    <>
                        <span className="text-sm font-bold text-slate-700">{item}</span>
                        {!isReadOnly && (
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => onEditStart(type, item)} className="text-slate-300 hover:text-blue-500"><i className="fas fa-edit text-xs"></i></button>
                                <button onClick={() => onDelete(item)} className="text-slate-300 hover:text-red-500"><i className="fas fa-trash-alt text-xs"></i></button>
                            </div>
                        )}
                    </>
                )}
              </div>
            );
        })}
      </div>
      {!isReadOnly && (
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <div className="flex gap-2">
          <input type="text" value={inputValue} onChange={(e) => onInputChange(e.target.value)} placeholder="إضافة..." className="w-full rounded-xl px-4 py-3 text-sm font-bold outline-none border border-slate-200" />
          <button onClick={onAdd} className={`w-12 rounded-xl text-white bg-slate-800`}><i className="fas fa-plus"></i></button>
        </div>
      </div>
      )}
    </div>
  );
};

export default SettingsManager;
