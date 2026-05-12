
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { User, Consignment, SystemSettings } from '../types';
import { updateUserProfile, changePasswordWithAuth, requestNotificationPermission } from '../firebaseService';
import { APP_PAGES, APP_CATEGORIES } from '../constants';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Pencil, 
  Bell, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User as UserIcon, 
  Save, 
  Lock, 
  Key, 
  Layout, 
  RotateCcw, 
  GripVertical,
  Shield,
  Mail,
  Phone,
  IdCard
} from 'lucide-react';

interface UserProfileProps {
  currentUser: User;
  consignments: Consignment[];
  systemSettings?: SystemSettings;
}

const UserProfile: React.FC<UserProfileProps> = ({ currentUser, consignments = [], systemSettings }) => {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: ''
  });
  const [passData, setPassData] = useState({
    current: '',
    newPass: '',
    confirmPass: ''
  });
  const [sidebarPrefs, setSidebarPrefs] = useState<string[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [message, setMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser) {
        setProfileData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            avatar: currentUser.avatar || ''
        });
        setSidebarPrefs(currentUser.sidebarPreferences || []);
    }
  }, [currentUser]);

  // Calculate User Stats
  const userStats = useMemo(() => {
      // Filter consignments assigned to this user (Inspector Name matches)
      const myConsignments = consignments.filter(c => c.inspectorName === currentUser.name);
      
      const total = myConsignments.length;
      const completed = myConsignments.filter(c => c.status === 'Approved' || c.status === 'Rejected').length;
      const pendingList = myConsignments.filter(c => c.status === 'Pending').sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return {
          total,
          completed,
          pendingCount: pendingList.length,
          pendingList
      };
  }, [consignments, currentUser.name]);

  // Helper: Compress Image for Avatar
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const maxWidth = 300; // Small size for avatars
        const maxHeight = 300;
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                let width = img.width;
                let height = img.height;

                // Maintain aspect ratio
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                
                // Compress to JPEG with 0.7 quality
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.size > 5 * 1024 * 1024) {
              setMessage({ type: 'error', text: 'حجم الصورة كبير جداً. الحد الأقصى 5 ميجابايت' });
              return;
          }
          
          try {
              const compressedBase64 = await compressImage(file);
              setProfileData(prev => ({ ...prev, avatar: compressedBase64 }));
          } catch (err) {
              console.error(err);
              setMessage({ type: 'error', text: 'حدث خطأ أثناء معالجة الصورة' });
          }
      }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoadingProfile(true);
      setMessage(null);
      try {
          await updateUserProfile(currentUser.id, { ...profileData, sidebarPreferences: sidebarPrefs });
          setMessage({ type: 'success', text: 'تم تحديث البيانات الشخصية وتفضيلات الشريط الجانبي بنجاح' });
      } catch (err: any) {
          setMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء التحديث' });
      } finally {
          setLoadingProfile(false);
      }
  };

  const handleSaveSidebar = async () => {
      setLoadingProfile(true);
      setMessage(null);
      try {
          await updateUserProfile(currentUser.id, { sidebarPreferences: sidebarPrefs });
          setMessage({ type: 'success', text: 'تم حفظ ترتيب الشريط الجانبي بنجاح' });
      } catch (err: any) {
          setMessage({ type: 'error', text: err.message || 'حدث خطأ أثناء حفظ الترتيب' });
      } finally {
          setLoadingProfile(false);
      }
  };

  const hasPageAccess = (path: string) => {
      if (!currentUser) return false;
      // Strict safeguard: only ADMIN can access /users and /settings always
      const strictlyAdminOnlyPaths = ['/users', '/settings'];
      if (strictlyAdminOnlyPaths.includes(path) && currentUser.role !== 'ADMIN') {
          return false;
      }
      if (currentUser.role === 'ADMIN') return true;
      if (systemSettings?.rolePermissions && systemSettings.rolePermissions[currentUser.role]) {
          return systemSettings.rolePermissions[currentUser.role]?.includes(path) || false;
      }
      if (currentUser.role === 'LAB_TECH' && path === '/portal') return false;
      
      const adminOnlyPaths = ['/users', '/settings', '/risks', '/labs'];
      if (adminOnlyPaths.includes(path)) return false;

      const rolePermissions: Record<string, string[]> = {
          'INSPECTOR': ['/', '/portal', '/sampling', '/logistics', '/undertakings', '/notes', '/inspector-tools', '/chat', '/importers', '/commodities', '/guide', '/profile'],
          'MANAGER': ['/', '/analytics', '/portal', '/sampling', '/logistics', '/undertakings', '/notes', '/chat', '/importers', '/commodities', '/reports', '/certificates', '/vault', '/guide', '/profile'],
          'LAB_TECH': ['/', '/sampling', '/chat', '/guide', '/profile', '/labs'],
          'LAB_DELEGATE': ['/delegate-portal', '/chat', '/profile'],
          'LOGISTICS': ['/', '/portal', '/logistics', '/notes', '/guide', '/chat', '/profile'],
          'VIEWER': ['/', '/analytics', '/portal', '/reports', '/importers', '/clearance', '/commodities', '/vault', '/guide', '/profile']
      };
      return rolePermissions[currentUser?.role || '']?.includes(path) || false;
  };

  const allowedPages = useMemo(() => APP_PAGES.filter(p => hasPageAccess(p.path)), [currentUser, systemSettings?.rolePermissions]);

  const orderedPages = useMemo(() => {
      const prefs = sidebarPrefs.length > 0 ? sidebarPrefs : allowedPages.map(p => p.path);
      const ordered = prefs
          .map(path => allowedPages.find(p => p.path === path))
          .filter((p): p is typeof APP_PAGES[0] => !!p);
      
      const missing = allowedPages.filter(p => !prefs.includes(p.path));
      return [...ordered, ...missing];
  }, [sidebarPrefs, allowedPages]);

  const onDragEnd = (result: DropResult) => {
      if (!result.destination) return;
      
      const items = Array.from(orderedPages);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
      
      setSidebarPrefs(items.map(p => p.path));
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      if (passData.newPass.length < 6) return setMessage({ type: 'error', text: 'كلمة المرور يجب أن تكون 6 خانات على الأقل' });
      if (passData.newPass !== passData.confirmPass) return setMessage({ type: 'error', text: 'كلمتا المرور غير متطابقتين' });

      setLoadingPass(true);
      try {
          await changePasswordWithAuth(currentUser.civilId || currentUser.id, passData.current, passData.newPass);
          setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
          setPassData({ current: '', newPass: '', confirmPass: '' });
      } catch (err: any) {
          console.error("Password change error:", err);
          if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
              setMessage({ type: 'error', text: 'كلمة المرور الحالية غير صحيحة.' });
          } else if (err.code === 'auth/too-many-requests') {
              setMessage({ type: 'error', text: 'تم تجاوز عدد المحاولات المسموح بها. يرجى الانتظار قليلاً.' });
          } else {
              setMessage({ type: 'error', text: 'فشل تغيير كلمة المرور. يرجى المحاولة مرة أخرى.' });
          }
      } finally {
          setLoadingPass(false);
      }
  };

  const handleEnableNotifications = async () => {
      const token = await requestNotificationPermission(currentUser.id);
      if (token) {
          setMessage({ type: 'success', text: 'تم تفعيل الإشعارات بنجاح' });
      } else {
          setMessage({ type: 'error', text: 'فشل تفعيل الإشعارات. يرجى التأكد من إعدادات المتصفح.' });
      }
  };

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto space-y-8 pb-12"
    >
        {/* Header Section */}
        <div className="relative bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            {/* Background Banner */}
            <div className="h-32 md:h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
            </div>

            <div className="px-8 pb-8">
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16 md:-mt-20 relative z-10">
                    {/* Avatar */}
                    <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white flex items-center justify-center bg-slate-800 text-white text-4xl md:text-5xl font-black relative bg-gradient-to-br from-slate-700 to-slate-900">
                            {profileData.avatar ? (
                                <img referrerPolicy="no-referrer" src={profileData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                (profileData.name || currentUser.name || 'U').charAt(0)
                            )}
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg transform translate-x-2 translate-y-2 group-hover:scale-110 transition-transform">
                            <Pencil className="w-4 h-4" />
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleAvatarChange}
                        />
                    </div>
                    
                    {/* User Info */}
                    <div className="text-center md:text-right flex-1 pt-4 md:pt-0">
                        <h2 className="text-3xl font-black text-slate-800">{currentUser.name}</h2>
                        <p className="text-slate-500 font-bold mt-1 flex items-center justify-center md:justify-start gap-2">
                            <Shield className="w-4 h-4" /> {currentUser.jobTitle}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                            <span className="flex items-center gap-1.5 text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-mono border border-slate-200 shadow-sm">
                                <IdCard className="w-3.5 h-3.5" /> ID: {currentUser.civilId}
                            </span>
                            <span className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm border ${
                                currentUser.role === 'ADMIN' 
                                    ? 'bg-red-50 text-red-600 border-red-100' 
                                    : 'bg-blue-50 text-blue-600 border-blue-100'
                            }`}>
                                <Shield className="w-3.5 h-3.5" /> {currentUser.role}
                            </span>
                        </div>
                    </div>

                    {/* Notification Button */}
                    <div className="mt-4 md:mt-0">
                        <button 
                            onClick={handleEnableNotifications} 
                            className="bg-white border border-indigo-100 text-indigo-600 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-50 transition-all flex items-center gap-2 shadow-sm hover:shadow"
                        >
                            <Bell className="w-4 h-4" /> تفعيل الإشعارات
                        </button>
                    </div>
                </div>
            </div>
        </div>

        {message && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 rounded-2xl font-bold text-center text-sm flex items-center justify-center gap-2 shadow-sm ${
                    message.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}
            >
                {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {message.text}
            </motion.div>
        )}

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner border border-blue-100/50">
                    <FileText className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">إجمالي المعاملات</p>
                    <h3 className="text-3xl font-black text-slate-800">{userStats.total}</h3>
                </div>
            </motion.div>
            
            <motion.div whileHover={{ y: -4 }} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-100/50">
                    <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">المعاملات المنجزة</p>
                    <h3 className="text-3xl font-black text-slate-800">{userStats.completed}</h3>
                </div>
            </motion.div>
            
            <motion.div whileHover={{ y: -4 }} className={`bg-white p-6 rounded-[2rem] border flex items-center gap-5 transition-all hover:shadow-md ${userStats.pendingCount > 0 ? 'border-amber-200 bg-amber-50/30' : 'border-slate-100 shadow-sm'}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border ${userStats.pendingCount > 0 ? 'bg-amber-100 text-amber-600 border-amber-200/50' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                    <Clock className="w-8 h-8" />
                </div>
                <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${userStats.pendingCount > 0 ? 'text-amber-600' : 'text-slate-400'}`}>قيد الإجراء</p>
                    <h3 className={`text-3xl font-black ${userStats.pendingCount > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{userStats.pendingCount}</h3>
                </div>
            </motion.div>
        </div>

        {/* Pending Tasks List */}
        {userStats.pendingCount > 0 && (
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] border border-amber-200 shadow-sm overflow-hidden"
            >
                <div className="p-6 border-b border-amber-100 bg-gradient-to-l from-amber-50 to-white flex justify-between items-center">
                    <h3 className="font-black text-lg text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-500" /> معاملات تتطلب استكمال الإجراء
                    </h3>
                    <span className="text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 shadow-sm">
                        {userStats.pendingCount} معاملة
                    </span>
                </div>
                <div className="overflow-x-auto p-2">
                    <table className="w-full text-right">
                        <thead className="text-[11px] font-black text-slate-500 uppercase bg-slate-50/80">
                            <tr>
                                <th className="p-4 rounded-r-2xl">رقم البيان</th>
                                <th className="p-4">المستورد</th>
                                <th className="p-4">تاريخ الوصول</th>
                                <th className="p-4">الحالة الحالية</th>
                                <th className="p-4 rounded-l-2xl">الإجراء المطلوب</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm font-medium">
                            {userStats.pendingList.map(c => (
                                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                                    <td className="p-4 font-mono font-bold text-slate-800">{c.bayanNumber}</td>
                                    <td className="p-4 text-slate-600">{c.importer}</td>
                                    <td className="p-4 font-mono text-slate-500 text-xs">{c.arrivalDate}</td>
                                    <td className="p-4">
                                        <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-200/50 shadow-sm">
                                            {c.inspectionResult === 'قيد الفحص' ? 'بانتظار النتيجة' : c.technicalAction || 'تحت المعاينة'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 text-xs font-bold">
                                        {c.inspectionResult === 'قيد الفحص' ? 'متابعة المختبر' : 'اتخاذ القرار النهائي'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Form */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="mb-8">
                    <h3 className="font-black text-xl text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <UserIcon className="w-5 h-5" />
                        </div>
                        البيانات الأساسية
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 font-medium">قم بتحديث معلوماتك الشخصية وطرق التواصل.</p>
                </div>
                
                <form onSubmit={handleProfileUpdate} className="space-y-5 flex-1 flex flex-col">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">الاسم الكامل / اسم العرض</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                <UserIcon className="w-4 h-4" />
                            </div>
                            <input 
                                type="text" 
                                value={profileData.name} 
                                onChange={e => setProfileData({...profileData, name: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-11 pl-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">سيظهر هذا الاسم في المحادثات والتقارير.</p>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">البريد الإلكتروني (اختياري)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                <Mail className="w-4 h-4" />
                            </div>
                            <input 
                                type="email" 
                                value={profileData.email} 
                                onChange={e => setProfileData({...profileData, email: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-11 pl-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">رقم الهاتف (اختياري)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                <Phone className="w-4 h-4" />
                            </div>
                            <input 
                                type="tel" 
                                value={profileData.phone} 
                                onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-11 pl-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="pt-6 mt-auto">
                        <button 
                            type="submit" 
                            disabled={loadingProfile}
                            className="bg-blue-600 text-white w-full py-4 rounded-2xl font-black text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loadingProfile ? <i className="fas fa-circle-notch fa-spin"></i> : <Save className="w-5 h-5" />}
                            <span>حفظ التعديلات</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Form */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col">
                <div className="mb-8">
                    <h3 className="font-black text-xl text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                            <Lock className="w-5 h-5" />
                        </div>
                        الأمان وكلمة المرور
                    </h3>
                    <p className="text-sm text-slate-500 mt-2 font-medium">تأكد من استخدام كلمة مرور قوية لحماية حسابك.</p>
                </div>
                
                <form onSubmit={handlePasswordChange} className="space-y-5 flex-1 flex flex-col">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">كلمة المرور الحالية</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                <Key className="w-4 h-4" />
                            </div>
                            <input 
                                type="password" 
                                value={passData.current} 
                                onChange={e => setPassData({...passData, current: e.target.value})}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-11 pl-4 py-3.5 text-sm font-bold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">كلمة المرور الجديدة</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input 
                                type="password" 
                                value={passData.newPass} 
                                onChange={e => setPassData({...passData, newPass: e.target.value})}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-11 pl-4 py-3.5 text-sm font-bold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-wider">تأكيد كلمة المرور</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                <Lock className="w-4 h-4" />
                            </div>
                            <input 
                                type="password" 
                                value={passData.confirmPass} 
                                onChange={e => setPassData({...passData, confirmPass: e.target.value})}
                                required
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-11 pl-4 py-3.5 text-sm font-bold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all"
                            />
                        </div>
                    </div>
                    
                    <div className="pt-6 mt-auto">
                        <button 
                            type="submit" 
                            disabled={loadingPass}
                            className="bg-slate-800 text-white w-full py-4 rounded-2xl font-black text-sm shadow-lg shadow-slate-800/20 hover:bg-slate-900 hover:shadow-slate-800/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loadingPass ? <i className="fas fa-circle-notch fa-spin"></i> : <Key className="w-5 h-5" />}
                            <span>تغيير كلمة المرور</span>
                        </button>
                    </div>
                </form>
            </div>

            {/* Sidebar Customization */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h3 className="font-black text-xl text-slate-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Layout className="w-5 h-5" />
                            </div>
                            تخصيص الشريط الجانبي
                        </h3>
                        <p className="text-sm text-slate-500 mt-2 font-medium">قم بإعادة ترتيب عناصر القائمة الجانبية بالسحب والإفلات لتناسب احتياجاتك.</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setSidebarPrefs([])}
                            className="text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-red-100"
                        >
                            <RotateCcw className="w-4 h-4" /> إعادة الضبط
                        </button>
                        <button 
                            onClick={handleSaveSidebar}
                            disabled={loadingProfile}
                            className="text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/30 px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                        >
                            {loadingProfile ? <i className="fas fa-circle-notch fa-spin"></i> : <Save className="w-4 h-4" />}
                            <span>حفظ الترتيب</span>
                        </button>
                    </div>
                </div>
                
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="sidebar-pages">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {orderedPages.map((page, idx) => (
                                    <Draggable key={page.path} draggableId={page.path} index={idx}>
                                        {(provided, snapshot) => (
                                            <div 
                                                ref={provided.innerRef} 
                                                {...provided.draggableProps} 
                                                {...provided.dragHandleProps}
                                                className={`flex items-center justify-between p-4 bg-white rounded-2xl border transition-all cursor-grab active:cursor-grabbing ${
                                                    snapshot.isDragging 
                                                        ? 'border-emerald-400 shadow-xl shadow-emerald-500/10 scale-105 z-50' 
                                                        : 'border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-inner ${
                                                        snapshot.isDragging ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                                                    }`}>
                                                        <i className={`fas ${page.icon}`}></i>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{page.label}</p>
                                                        <p className="text-[10px] font-bold text-slate-400">{APP_CATEGORIES.find(c => c.id === page.category)?.label || 'لوحة التحكم'}</p>
                                                    </div>
                                                </div>
                                                <GripVertical className={`w-5 h-5 ${snapshot.isDragging ? 'text-emerald-500' : 'text-slate-300'}`} />
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </div>
    </motion.div>
  );
};

export default UserProfile;
