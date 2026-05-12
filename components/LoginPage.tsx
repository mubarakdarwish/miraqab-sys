
import React, { useState } from 'react';
import { User, SystemSettings } from '../types';
import { loginUser, requestPasswordReset, getUserById, logoutUser } from '../firebaseService';
import Logo from './Logo';

interface LoginPageProps {
  users: User[]; // Kept for interface compatibility but not used for auth list
  onLogin: (user: User) => void;
  onBack?: () => void;
  systemSettings?: SystemSettings;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack, systemSettings }) => {
  const [civilId, setCivilId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset Password States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetCivilId, setResetCivilId] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // We pass the Civil ID directly. 
    // The firebaseService will handle the domain appending (@mirqab-sys.om).
    try {
        const userCredential = await loginUser(civilId, password);
        const firebaseUser = userCredential.user;
        
        if (firebaseUser) {
            // Fetch the full user profile from Firestore to get 'allowedSectors'
            const fullProfile = await getUserById(firebaseUser.uid);

            if (fullProfile) {
                if (fullProfile.isActive === false) {
                    await logoutUser();
                    setError('حسابك غير منشط، يرجى مراجعة رئيس قسم المنفذ أو مدير النظام');
                    setLoading(false);
                    return;
                }
                onLogin(fullProfile);
            } else {
                // Fallback (Should rarely happen if users are synced)
                const basicUser: User = {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || `User ${civilId}`,
                    civilId: civilId,
                    role: 'INSPECTOR', 
                    jobTitle: 'MIRQAB User',
                    allowedSectors: [], // Caution: Empty sectors here
                    isActive: true,
                    avatar: firebaseUser.photoURL || ''
                };
                onLogin(basicUser);
            }
        }

    } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
             setError("بيانات الدخول غير صحيحة. يرجى التحقق من الرقم المدني وكلمة المرور.");
        } else if (err.code === 'auth/too-many-requests') {
             setError("تم تعطيل الحساب مؤقتاً بسبب تكرار محاولات الدخول الفاشلة. يرجى المحاولة لاحقاً.");
        } else {
             setError("حدث خطأ أثناء الاتصال. يرجى المحاولة مرة أخرى. (" + err.code + ")");
        }
    } finally {
        setLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setResetLoading(true);
      setResetMessage(null);

      try {
          await requestPasswordReset(resetCivilId, resetPhone);
          setResetMessage({ type: 'success', text: 'تم إرسال طلب إعادة تعيين كلمة المرور إلى مدير النظام بنجاح. سيتم التواصل معك قريباً.' });
          setTimeout(() => {
              setShowResetModal(false);
              setResetMessage(null);
              setResetCivilId('');
              setResetPhone('');
          }, 3000);
      } catch (err: any) {
          setResetMessage({ type: 'error', text: err.message || 'حدث خطأ. يرجى التأكد من البيانات المدخلة.' });
      } finally {
          setResetLoading(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-tajawal" dir="rtl">
       <div className="bg-white rounded-[3rem] shadow-2xl p-10 md:p-14 w-full max-w-lg border border-slate-100 relative overflow-hidden">
          
          {onBack && (
            <button 
              onClick={onBack}
              className="absolute top-8 right-8 w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-[#c8102e] hover:bg-red-50 transition-all z-20 group"
              title="العودة للرئيسية"
            >
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </button>
          )}

          {/* Top Decoration */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#c8102e] via-red-500 to-[#007a3d]"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-50 rounded-full blur-3xl opacity-50"></div>
          
          <div className="text-center mb-10 relative z-10">
             <div className="flex flex-col items-center gap-6 mb-8">
                <Logo size={80} variant="color" className="drop-shadow-xl" />
                <img referrerPolicy="no-referrer" 
                  src="https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg" 
                  alt="Ministry Logo" 
                  className="h-16 object-contain opacity-80" 
                />
             </div>
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">{systemSettings?.customLabels?.loginTitle || 'تسجيل الدخول'}</h2>
             <p className="text-slate-400 text-sm font-bold mt-2">{systemSettings?.customLabels?.loginSubtitle || 'نظام مِرقاب الذكي'}</p>
             <p className="text-xs text-blue-500 font-bold mt-2 bg-blue-50 py-1 px-3 rounded-full inline-block">بوابة الموظفين الرسمية</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
             
             {/* Civil ID Input */}
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">الرقم المدني</label>
                <div className="relative">
                   <input 
                      type="text" 
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={civilId}
                      onChange={(e) => setCivilId(e.target.value.trim())}
                      placeholder="مثال: 12345678"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all placeholder:text-slate-300 ltr:text-left font-mono tracking-widest pl-10"
                      required
                   />
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300">
                      <i className="fas fa-id-card text-xs"></i>
                   </div>
                </div>
             </div>

             {/* Password Input */}
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">كلمة المرور</label>
                </div>
                <div className="relative">
                   <input 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-red-500/10 focus:border-[#c8102e] transition-all placeholder:text-slate-300 pl-10"
                      required
                   />
                   <button 
                     type="button"
                     onClick={() => setShowPassword(!showPassword)}
                     className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                   >
                      <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
                   </button>
                </div>
                <div className="text-left pl-1">
                    <button 
                        type="button" 
                        onClick={() => setShowResetModal(true)}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                    >
                        نسيت كلمة المرور؟
                    </button>
                </div>
             </div>

             {error && (
                 <div className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-xl text-center flex items-center justify-center gap-2">
                     <i className="fas fa-exclamation-circle"></i> {error}
                 </div>
             )}

             <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-[#c8102e] hover:bg-[#a60a22] text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-red-100 transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                   {loading ? (
                      <i className="fas fa-circle-notch fa-spin"></i>
                   ) : (
                      <>
                        <span>دخول آمن</span>
                        <i className="fas fa-arrow-left"></i>
                      </>
                   )}
                </button>
             </div>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
             <img referrerPolicy="no-referrer" 
               src="https://www.kindpng.com/picc/m/594-5945904_oman-vision-2040-hd-png-download.png" 
               alt="Oman 2040" 
               className="h-12 mx-auto mb-4 opacity-80 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" 
             />
             <p className="text-[10px] text-slate-400 font-bold">
                محمي بتقنيات التشفير القياسية (Firebase Auth). <br/>
                جميع الحقوق محفوظة لقسم الحجر وسلامة الغذاء بميناء صحار &copy; {new Date().getFullYear()}
             </p>
          </div>
       </div>

       {/* Password Reset Modal */}
       {showResetModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
               <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative">
                   <button 
                     onClick={() => setShowResetModal(false)}
                     className="absolute top-6 left-6 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all"
                   >
                       <i className="fas fa-times"></i>
                   </button>

                   <div className="text-center mb-6">
                       <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                           <i className="fas fa-key"></i>
                       </div>
                       <h3 className="text-xl font-black text-slate-800">استعادة كلمة المرور</h3>
                       <p className="text-xs text-slate-400 font-bold mt-1">سيتم إرسال طلب إعادة التعيين لمدير النظام</p>
                   </div>

                   <form onSubmit={handleResetSubmit} className="space-y-4">
                       <div className="space-y-2">
                           <label className="text-xs font-black text-slate-600 uppercase">الرقم المدني</label>
                           <input 
                              type="text" 
                              value={resetCivilId}
                              onChange={(e) => setResetCivilId(e.target.value.trim())}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#c8102e]"
                              required
                           />
                       </div>
                       <div className="space-y-2">
                           <label className="text-xs font-black text-slate-600 uppercase">رقم الهاتف المسجل</label>
                           <input 
                              type="tel" 
                              value={resetPhone}
                              onChange={(e) => setResetPhone(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-[#c8102e]"
                              required
                           />
                       </div>

                       {resetMessage && (
                           <div className={`p-3 rounded-xl text-xs font-bold text-center ${resetMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                               {resetMessage.text}
                           </div>
                       )}

                       <button 
                         type="submit" 
                         disabled={resetLoading}
                         className="w-full bg-[#c8102e] text-white py-3 rounded-xl font-black shadow-lg hover:bg-[#a60a22] transition-all flex items-center justify-center gap-2"
                       >
                           {resetLoading ? <i className="fas fa-circle-notch fa-spin"></i> : <span>إرسال الطلب</span>}
                       </button>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};

export default LoginPage;
