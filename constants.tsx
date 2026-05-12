
import React, { ReactNode } from 'react';
import { ConsignmentType } from './types';

export const COLORS = {
  primary: '#0f172a',
  secondary: '#3b82f6',
  accent: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  background: '#f8fafc'
};

export const CONSIGNMENT_LABELS: Record<string, string> = {
  VETERINARY: 'بيطري',
  AGRICULTURAL: 'زراعي',
  FOOD_SAFETY: 'سلامة الغذاء'
};

export const SECTOR_CODES: Record<ConsignmentType, string> = {
  [ConsignmentType.VETERINARY]: 'VET',
  [ConsignmentType.AGRICULTURAL]: 'AGR',
  [ConsignmentType.FOOD_SAFETY]: 'FDS'
};

export const SECTOR_THEMES: Record<ConsignmentType, string> = {
  [ConsignmentType.VETERINARY]: 'from-amber-500 to-amber-700',
  [ConsignmentType.AGRICULTURAL]: 'from-emerald-500 to-emerald-700',
  [ConsignmentType.FOOD_SAFETY]: 'from-blue-500 to-indigo-700'
};

export const SECTOR_IMAGES: Record<ConsignmentType, string> = {
  [ConsignmentType.VETERINARY]: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=2070&auto=format&fit=crop',
  [ConsignmentType.AGRICULTURAL]: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=2070&auto=format&fit=crop',
  [ConsignmentType.FOOD_SAFETY]: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=2070&auto=format&fit=crop'
};

export const STEPS_LABELS: Record<string, string> = {
  ARRIVAL: 'الوصول',
  INSPECTION: 'الفحص الظاهري',
  DECISION: 'الإجراء',
  LAB_RESULT: 'النتيجة المختبرية',
  FINAL_STATUS: 'الحالة النهائية'
};

// --- Available System Pages for Permission Management ---
export const APP_CATEGORIES = [
    { id: 'DASHBOARD', label: 'لوحة التحكم', icon: 'fa-home' },
    { id: 'OPERATIONS', label: 'العمليات اليومية', icon: 'fa-tasks' },
    { id: 'TOOLS', label: 'أدوات ومساعدات', icon: 'fa-tools' },
    { id: 'DIRECTORIES', label: 'الأدلة والسجلات', icon: 'fa-address-book' },
    { id: 'REPORTS_ARCHIVES', label: 'التقارير والأرشيف', icon: 'fa-file-alt' },
    { id: 'SYSTEM', label: 'النظام والدعم', icon: 'fa-cogs' },
    { id: 'ADMIN', label: 'أدوات الإدارة والتحكم', icon: 'fa-user-shield' }
];

export const APP_PAGES = [
    { path: '/', label: 'لوحة التحكم', icon: 'fa-home', category: 'DASHBOARD' },
    { path: '/analytics', label: 'تحليلات متقدمة', icon: 'fa-chart-line', category: 'DASHBOARD' },
    { path: '/portal', label: 'سجل المعاملات اليومي', icon: 'fa-file-invoice', category: 'OPERATIONS' },
    { path: '/sampling', label: 'إدارة العينات', icon: 'fa-vial', category: 'OPERATIONS' },
    { path: '/delegate-portal', label: 'بوابة استلام العينات', icon: 'fa-truck-loading', category: 'OPERATIONS' },
    { path: '/logistics', label: 'الإرساليات المحولة', icon: 'fa-exchange-alt', category: 'OPERATIONS' },
    { path: '/undertakings', label: 'التعهدات القانونية', icon: 'fa-gavel', category: 'OPERATIONS' },
    { path: '/notes', label: 'سجل الملاحظات والمناوبات', icon: 'fa-clipboard-list', category: 'TOOLS' },
    { path: '/inspector-tools', label: 'أدوات المفتش', icon: 'fa-toolbox', category: 'TOOLS' },
    { path: '/tools', label: 'الأدوات المساعدة', icon: 'fa-tools', category: 'TOOLS' },
    { path: '/chat', label: 'محادثات الفريق', icon: 'fa-comments', category: 'TOOLS' },
    { path: '/importers', label: 'دليل الشركات المستوردة', icon: 'fa-building', category: 'DIRECTORIES' },
    { path: '/clearance', label: 'دليل مكاتب التخليص', icon: 'fa-address-book', category: 'DIRECTORIES' },
    { path: '/commodities', label: 'دليل المنتجات والمجموعات', icon: 'fa-boxes', category: 'DIRECTORIES' },
    { path: '/labs', label: 'دليل المختبرات', icon: 'fa-microscope', category: 'DIRECTORIES' },
    { path: '/reports', label: 'التقارير والإحصائيات', icon: 'fa-chart-bar', category: 'REPORTS_ARCHIVES' },
    { path: '/certificates', label: 'النماذج والشهادات', icon: 'fa-certificate', category: 'REPORTS_ARCHIVES' },
    { path: '/vault', label: 'الأرشيف الرقمي', icon: 'fa-folder-open', category: 'REPORTS_ARCHIVES' },
    { path: '/risks', label: 'ملف المخاطر والخطط', icon: 'fa-shield-virus', category: 'REPORTS_ARCHIVES' },
    { path: '/guide', label: 'دليل المستخدم', icon: 'fa-book-reader', category: 'SYSTEM' },
    { path: '/users', label: 'إدارة المستخدمين والمنافذ', icon: 'fa-users-cog', category: 'ADMIN' },
    { path: '/settings', label: 'إعدادات النظام', icon: 'fa-sliders-h', category: 'ADMIN' }
];

/**
 * يولد معرف فريد للإرسالية بالصيغة المطلوبة:
 * SOH + رمز القطاع + التاريخ (YYYYMMDD) + رقم متسلسل (0001)
 */
export const generateConsignmentId = (type: ConsignmentType, sequenceNumber: number): string => {
  const prefix = "SOH";
  const sectorCode = SECTOR_CODES[type] || "UNK";
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // YYYYMMDD
  const seqStr = String(sequenceNumber).padStart(4, '0');
  return `${prefix}${sectorCode}${dateStr}${seqStr}`;
};

export const COUNTRIES = [
  "سلطنة عمان", "الإمارات العربية المتحدة", "المملكة العربية السعودية", "الكويت", "قطر", "البحرين",
  "مصر", "الأردن", "العراق", "لبنان", "سوريا", "اليمن", "فلسطين", "السودان", "ليبيا", "المغرب", "تونس", "الجزائر",
  "الولايات المتحدة الأمريكية", "المملكة المتحدة", "الصين", "الهند", "اليابان", "كوريا الجنوبية", "ألمانيا", "فرنسا", "إيطاليا", "إسبانيا", "تركيا", "روسيا",
  "البرازيل", "الأرجنتين", "أستراليا", "نيوزيلندا", "كندا", "المكسيك", "جنوب أفريقيا", "إيران", "باكستان", "إندونيسيا", "ماليزيا", "تايلاند", "فيتنام",
  "سنغافورة", "الفلبين", "بنغلاديش", "سيريلانكا", "أوكرانيا", "بولندا", "هولندا", "بلجيكا", "سويسرا", "السويد", "النرويج", "الدنمارك", "فنلندا",
  "البرتغال", "اليونان", "النمسا", "أيرلندا", "التشيك", "المجر (هنغاريا)", "رومانيا", "بلغاريا", "صربيا", "كرواتيا", "البوسنة والهرسك",
  "كينيا", "إثيوبيا", "نيجيريا", "غانا", "تنزانيا", "أوغندا", "الصومال", "جيبوتي", "موريشيوس", "سيشل",
  "تشيلي", "كولومبيا", "بيرو", "فنزويلا", "الإكوادور", "أوروغواي", "باراغواي", "اسكتلندا",
  "أفغانستان", "ألبانيا", "أندورا", "أنغولا", "أنتيغوا وباربودا", "أرمينيا", "أذربيجان", "جزر البهاما", "بربادوس", "بيلاروسيا (روسيا البيضاء)", "بليز", "بنين",
  "بوتان", "بوليفيا", "بوتسوانا", "بروناي", "بوركينا فاسو", "بوروندي", "كمبوديا", "الكاميرون", "الرأس الأخضر", "جمهورية أفريقيا الوسطى",
  "تشاد", "جزر القمر", "الكونغو", "كوبا", "قبرص", "دومينيكا", "تيمور الشرقية", "السلفادور", "غينيا الاستوائية", "إريتريا",
  "إستونيا", "إسواتيني", "فيجي", "الغابون", "غامبيا", "جورجيا", "غرينادا", "غواتيمالا", "غينيا", "غينيا بيساو", "غيانا", "هايتي",
  "هندوراس", "أيسلندا", "جامايكا", "كازاخستان", "كيريباتي", "قرغيزستان", "لاوس", "لاتفيا", "ليسوتو", "ليبيريا", "ليختنشتاين",
  "ليتوانيا", "لوكمبورغ", "مدغشقر", "مالاوي", "جزر المالديف", "مالي", "مالطا", "جزر مارشال", "موريتانيا", "ميكرونيزيا", "مولدوفا",
  "موناكو", "منغوليا", "الجبل الأسود", "موزمبيق", "ميانمار", "ناميبيا", "ناورو", "نيبال", "نيكاراجوا", "النيجر", "كوريا الشمالية", "مقدونيا الشمالية",
  "بالاو", "بنما", "بابوا غينيا الجديدة", "رواندا", "سانت كيتس ونيفيس", "سانت لوسيا", "سانت فنسنت والغرينادين", "ساموا", "سان مارينو",
  "ساو تومي وبرينسيب", "السنغال", "سيراليون", "سلوفاكيا", "سلوفينيا", "جزر سليمان", "جنوب السودان", "سورينام", "طاجيكستان",
  "توغو", "تونغا", "ترينيداد وتوباغو", "تركمانستان", "توفالو", "أوزبكستان", "فانواتو", "جامبيا", "زيمبابوي"
].sort();
