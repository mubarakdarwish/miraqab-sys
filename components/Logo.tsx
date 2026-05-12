import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LogoProps {
  className?: string;
  size?: number;
  variant?: 'light' | 'dark' | 'color';
  onClick?: (e: React.MouseEvent) => void;
  interactive?: boolean;
}

const quotes = [
  "النجاح ليس النهاية، والفشل ليس قاتلاً: الشجاعة لمواصلة الطريق هي ما يهم.",
  "سلامة الغذاء مسؤوليتنا جميعاً. لنجعل من الجودة هدفاً لا نحيد عنه.",
  "العمل الجاد والمثابرة هما مفتاح كل إنجاز عظيم.",
  "كل تفصيلة صغيرة في عملك تصنع فرقاً كبيراً في حياة الآخرين.",
  "الجودة ليست عملاً نؤديه، بل هي عادة نعيشها.",
  "نحمي مجتمعنا من خلال التزامنا بأعلى معايير الرقابة والشفافية.",
  "الابتكار في العمل هو طريقنا نحو مستقبل أكثر أمناً وسلامة."
];

const Logo = React.forwardRef<HTMLDivElement, LogoProps>((props, ref) => {
  const { className = '', size = 48, variant = 'color', onClick, interactive = true } = props;
  const [showModal, setShowModal] = useState(false);
  const [quote, setQuote] = useState("");
  const primaryColor = variant === 'light' ? '#ffffff' : '#c8102e';
  const secondaryColor = variant === 'light' ? '#fecaca' : '#c8102e';
  const accentColor = variant === 'light' ? '#ffffff' : '#007a3d';

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) onClick(e);
    if (interactive) {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      setShowModal(true);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(false);
  };

  return (
    <>
      <div ref={ref} onClick={handleClick} className={`relative flex items-center justify-center ${interactive ? 'cursor-pointer hover:scale-105' : ''} transition-all duration-300 ${className}`} style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xl transform hover:scale-110 transition-transform duration-500"
        >
          {/* Outer Shield / Hexagon */}
          <path
            d="M50 5L90 25V75L50 95L10 75V25L50 5Z"
            fill="url(#logo-gradient)"
            stroke={variant === 'light' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}
            strokeWidth="2"
          />
          
          {/* Inner Watchtower / Stylized M */}
          <path
            d="M30 70V40L50 30L70 40V70M40 70V50H60V70"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-90"
          />

          {/* Monitoring Eye / Lens */}
          <circle cx="50" cy="42" r="6" fill="white" className="animate-pulse" />
          <circle cx="50" cy="42" r="10" stroke="white" strokeWidth="2" strokeDasharray="4 2" />

          {/* Bottom Accent (Omani Green) */}
          <path
            d="M30 80H70"
            stroke={variant === 'light' ? 'white' : '#007a3d'}
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.8"
          />

          <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
              <stop stopColor={primaryColor} />
              <stop offset="1" stopColor={secondaryColor} />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Decorative Glow */}
        <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full -z-10 animate-pulse pointer-events-none"></div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm cursor-pointer"
            />
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative z-10 flex flex-col items-center max-w-sm w-full bg-white p-8 rounded-[2rem] shadow-2xl"
            >
              <button 
                onClick={handleClose}
                className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-red-500 transition-colors"
                title="إغلاق"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              <div className="mb-6 relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 bg-red-500/20 blur-[40px] rounded-full animate-pulse"></div>
                  <Logo size={120} variant="color" interactive={false} className="relative z-10 drop-shadow-xl" />
              </div>
              
              <div className="text-center w-full">
                 <p className="text-xl font-black text-slate-800 leading-relaxed mb-6">
                   "{quote}"
                 </p>
                 <div className="pt-6 border-t border-slate-100 flex flex-col items-center justify-center gap-1.5 w-full">
                    <span className="text-slate-400 text-[11px] font-black uppercase tracking-widest text-center">
                      نظام مرقاب - MIRQAB
                    </span>
                    <span className="text-slate-300 text-[9px] font-bold uppercase tracking-widest text-center">
                     قسم الحجر وسلامة الغذاء 
                    </span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
});

export default Logo;
