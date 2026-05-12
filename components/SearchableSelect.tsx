import React, { useState, useRef, useEffect } from 'react';

export interface SearchableOption {
    label: string;
    value: string;
    subLabel?: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | SearchableOption)[];
  placeholder?: string;
  className?: string;
  // Added required prop to fix type mismatch error and provide visual validation indicator
  required?: boolean;
  disabled?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "ابحث واختر...", 
  className = "",
  // Destructure required prop
  required,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearching] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Normalize options to object format and filter out invalid ones
  const normalizedOptions: SearchableOption[] = (options || [])
    .filter(opt => opt !== null && opt !== undefined)
    .map(opt => {
      if (typeof opt === 'string') return { label: opt, value: opt };
      // Handle cases where opt might not be an object (e.g. number/boolean) or is null/undefined despite filter
      if (typeof opt !== 'object') return { label: String(opt), value: String(opt) };
      
      return {
          label: opt.label || '',
          value: opt.value || '',
          subLabel: opt.subLabel
      } as SearchableOption;
    })
    // Filter out options with empty values to be safe
    .filter(opt => opt.value !== ''); 

  // Filter options based on search term (label or subLabel)
  const filteredOptions = normalizedOptions.filter(option => {
    if (!option) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      String(option.label || '').toLowerCase().includes(searchLower) ||
      (option.subLabel && String(option.subLabel).toLowerCase().includes(searchLower))
    );
  });

  const selectedOption = normalizedOptions.find(o => o.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearching('');
  };

  return (
    <div className={`space-y-2 relative ${className}`} ref={wrapperRef}>
      {/* Show required asterisk to match standard system inputs */}
      <label className="text-xs font-black text-slate-600 mr-2 uppercase tracking-widest">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <div 
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full bg-slate-50 border ${isOpen ? 'border-blue-500 ring-4 ring-blue-500/10' : 'border-slate-200'} rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none transition-all flex justify-between items-center shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-slate-300'}`}
        >
          <span className={`flex-1 truncate ${value ? "text-slate-800" : "text-slate-300"}`}>
            {selectedOption ? selectedOption.label : (value || placeholder)}
          </span>
          <div className="flex items-center gap-2">
            {value && !disabled && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="w-5 h-5 rounded-full bg-slate-100 hover:bg-red-100 text-slate-400 hover:text-red-500 flex items-center justify-center transition-colors"
                title="مسح الاختيار"
              >
                <i className="fas fa-times text-[10px]"></i>
              </button>
            )}
            <i className={`fas fa-chevron-down text-xs text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
          </div>
        </div>

        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in origin-top">
            <div className="p-3 border-b border-slate-50 bg-slate-50/50">
              <div className="relative">
                 <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                 <input 
                    type="text" 
                    autoFocus
                    placeholder="بحث..." 
                    className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-xs font-bold focus:outline-none focus:border-blue-500 text-slate-800"
                    value={searchTerm}
                    onChange={(e) => setSearching(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            if (filteredOptions.length > 0) {
                                handleSelect(filteredOptions[0].value);
                            }
                        }
                    }}
                 />
              </div>
            </div>
            <ul className="max-h-60 overflow-y-auto custom-scrollbar p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option, idx) => (
                  <li 
                    key={idx} 
                    onClick={() => handleSelect(option.value)}
                    className={`px-4 py-3 text-sm font-medium cursor-pointer rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors mb-1 ${value === option.value ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600'}`}
                  >
                    <div className="flex justify-between items-center gap-2">
                        <span className="truncate">{option.label}</span>
                        {option.subLabel && <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">{option.subLabel}</span>}
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-6 py-4 text-xs text-slate-400 text-center font-bold">لا توجد نتائج مطابقة</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchableSelect;