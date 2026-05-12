import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Consignment,
  ConsignmentType,
  ConsignmentStatus,
  ConsignmentDirection,
  Sample,
  User,
  Port,
  Laboratory,
} from "../types";

const safeFormatDate = (
  dateStr: string | undefined | null,
  locale: string = "ar-OM",
) => {
  if (!dateStr) return "---";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || "---";
    return date.toLocaleDateString(locale);
  } catch (e) {
    return dateStr || "---";
  }
};

const safeFormatDateTime = (
  dateStr: string | undefined | null,
  locale: string = "ar-OM",
) => {
  if (!dateStr) return "---";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr || "---";
    return `${date.toLocaleDateString(locale)} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  } catch (e) {
    return dateStr || "---";
  }
};

const VET_SUMMARY_CATEGORIES = [
  {
    id: 1,
    title: "حيوانات حية",
    keywords: [
      "أبقار",
      "إبل",
      "ضأن",
      "ماعز",
      "خيول",
      "بوني",
      "زيبرا",
      "بقر",
      "غنم",
    ],
  },
  {
    id: 2,
    title: "حيوانات أليفة وبرية",
    keywords: [
      "كلاب",
      "قطط",
      "المها",
      "للاما",
      "قوارض",
      "برمائيات",
      "زواحف",
      "حيوانات برية",
      "رئيسيات",
      "سيرك",
    ],
  },
  {
    id: 3,
    title: "طيور وأسماك حية",
    keywords: [
      "كتاكيت",
      "دواجن",
      "نعام",
      "طيور زينة",
      "طاووس",
      "ببغاء",
      "بطريق",
      "طيور جارحة",
      "أسماك زينة",
      "أسماك تربية",
    ],
  },
  {
    id: 4,
    title: "لحوم خام ومنتجاتها",
    keywords: [
      "لحم بقري",
      "لحم أغنام",
      "لحم نعام",
      "لحم ابل",
      "لحم غزال",
      "لحوم دواجن",
      "لحم خنزير",
      "دهون حيوانية",
    ],
  },
  {
    id: 5,
    title: "أسماك خام ومنتجاتها",
    keywords: [
      "SALMON",
      "SEABASS",
      "OYSTER",
      "MUSSELS",
      "CRAB",
      "HALIBUT",
      "LOBSTER",
      "COD",
      "ANCHOVY",
      "SEAFOOD",
      "TROUT",
      "CATLA",
      "ROHU",
      "PANGAUS",
      "PEARLSPOT",
      "CLAM",
      "GROUPER",
      "KING FISH",
      "PARROT FISH",
      "POMFRET",
      "SOLE FISH",
      "GULFAM",
      "TILAPIA",
      "EMPEROR",
      "MULLET",
      "TURBOT",
      "CARP",
      "HERRING",
      "MAKEREL",
      "CATFISH",
      "SHRIMP",
      "CUTTLE",
      "DENNIS",
      "SEABREAM",
      "SARDINE",
      "TUNA",
      "OTHER SEA FISH",
      "OTHER RIVER FISH",
      "منتجات أسماك",
      "زيت السمك",
      "اسماك مجففة",
    ],
  },
  {
    id: 6,
    title: "منتجات حيوانية",
    keywords: ["حليب طازج", "زبد", "سمن", "دهن اللبن"],
  },
  { id: 7, title: "بيض", keywords: ["بيض طازج", "بيض للتفريخ"] },
  { id: 8, title: "منتجات البيض", keywords: ["بيض سائل", "منتجات البيض"] },
  {
    id: 9,
    title: "أعلاف ومخلفات حيوانية",
    keywords: [
      "علف حيواني",
      "علف دواجن",
      "علف سمك",
      "علف خيول",
      "غذاء قطط",
      "غذاء كلاب",
      "عظام",
      "قرون",
      "أمعاء مملحة",
    ],
  },
  { id: 10, title: "الجلود الحيوانية", keywords: ["جلود", "جلد سمك"] },
  {
    id: 11,
    title: "اللقاحات البيطرية",
    keywords: ["لقاحات بيطرية", "سائل منوي"],
  },
  {
    id: 12,
    title: "مستحضرات بيطرية وبيولوجية",
    keywords: [
      "أدوية بيطرية",
      "أوساط حيوية",
      "فيتامينات",
      "أملاح معدنية",
      "مطهرات بيطرية",
      "محلول محلي",
      "معدات بيطرية",
      "كواشف",
    ],
  },
];

const getVetCategory = (item: any) => {
  const desc = (item.description || "").toLowerCase();
  const group = (item.commodityGroup || "").toLowerCase();
  const vetCat = (item.vetCategory || "").toLowerCase();

  if (vetCat) {
    const found = VET_SUMMARY_CATEGORIES.find(
      (c) => c.title.toLowerCase() === vetCat,
    );
    if (found) return found.title;
  }

  for (const cat of VET_SUMMARY_CATEGORIES) {
    if (
      cat.keywords.some(
        (k) =>
          desc.includes(k.toLowerCase()) || group.includes(k.toLowerCase()),
      )
    ) {
      return cat.title;
    }
  }

  return "أخرى";
};

const isWeightGroup = (groupName: string) => {
  // بناءً على طلب المستخدم: الملخص الإحصائي للبيطري يعتمد على الوزن وليس العدد
  return true;
};
import { CONSIGNMENT_LABELS } from "../constants";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { getLogoBase64, getMirqabLogoBase64 } from "../excelService";
import html2pdf from 'html2pdf.js';

interface ReportsManagerProps {
  consignments: Consignment[];
  activeSector: ConsignmentType;
  currentUser: User;
  ports?: Port[];
  laboratories?: Laboratory[];
}

// Definition of all available columns for the report
const AVAILABLE_COLUMNS = [
  { key: "id", label: "المعرف (System ID)" },
  { key: "bayanNumber", label: "رقم البيان" },
  { key: "permitNumber", label: "رقم التصريح" },
  { key: "arrivalDate", label: "تاريخ الوصول" },
  { key: "importer", label: "المستورد" },
  { key: "exporter", label: "المصدر" },
  { key: "shippingCountry", label: "بلد الشحن" },
  { key: "origin", label: "بلد المنشأ" },
  { key: "port", label: "المنفذ" },
  { key: "originPort", label: "ميناء الشحن (Origin Port)" },
  { key: "itemDescription", label: "المنتج الرئيسي" },
  { key: "commodityGroup", label: "المجموعة السلعية" },
  { key: "producingCompany", label: "الشركة المنتجة" },
  { key: "storageTemp", label: "درجة حرارة الحفظ" },
  { key: "totalWeight", label: "الوزن الكلي" },
  { key: "weightKg", label: "الوزن (كجم)" },
  { key: "weightTon", label: "الوزن (طن)" },
  { key: "packageCount", label: "عدد الطرود" },
  { key: "containerCount", label: "عدد الحاويات" },
  { key: "containerNumber", label: "أرقام الحاويات" },
  { key: "inspectionType", label: "نوع الفحص" },
  { key: "inspectionResult", label: "نتيجة المعاينة" },
  { key: "labAnalysisType", label: "نوع الفحص المخبري" },
  { key: "labResult", label: "نتيجة الفحص المخبري" },
  { key: "status", label: "الحالة النهائية" },
  { key: "technicalAction", label: "الإجراء الفني" },
  { key: "rejectionReason", label: "سبب الرفض" },
  { key: "fees", label: "الرسوم" },
  { key: "inspectorName", label: "اسم المفتش" },
  { key: "inspectionLocation", label: "موقع المعاينة" },
  { key: "inspectionNotes", label: "ملاحظات المعاينة" },
  { key: "remarks", label: "ملاحظات" },
];

const AVAILABLE_LAB_COLUMNS = [
  { key: "sampleId", label: "رقم العينة" },
  { key: "bayanNumber", label: "رقم البيان" },
  { key: "permitNumber", label: "رقم التصريح" },
  { key: "importer", label: "المستورد" },
  { key: "product", label: "المنتج" },
  { key: "sampleDate", label: "تاريخ العينة" },
  { key: "labAnalysisType", label: "نوع الفحص" },
  { key: "labName", label: "المختبر" },
  { key: "labDelegate", label: "المندوب" },
  { key: "producingCompany", label: "الشركة المنتجة" },
  { key: "storageTemp", label: "درجة حرارة الحفظ" },
  { key: "sampleCondition", label: "حالة العينة" },
  { key: "sampleSeal", label: "رقم الختم" },
  { key: "result", label: "النتيجة" },
  { key: "notes", label: "ملاحظات / سبب الرفض" },
];

const ReportsManager: React.FC<ReportsManagerProps> = ({
  consignments,
  activeSector,
  currentUser,
  ports = [],
  laboratories = [],
}) => {
  const [selectedSector, setSelectedSector] = useState<ConsignmentType | "ALL">(
    "ALL",
  );
  const [selectedPort, setSelectedPort] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>(
    new Date().getFullYear() + "-01-01",
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [reportType, setReportType] = useState<
    | "SUMMARY"
    | "DETAILED"
    | "LAB"
    | "FINANCIAL"
    | "INSPECTOR"
    | "CUSTOM"
    | "LOGISTICS"
    | "COMPARISON"
    | "AUDIT"
  >("SUMMARY");

  // Comparison Report State
  const [compareStartDate, setCompareStartDate] = useState<string>(
    new Date().getFullYear() - 1 + "-01-01",
  );
  const [compareEndDate, setCompareEndDate] = useState<string>(
    new Date().getFullYear() - 1 + "-12-31",
  );

  // Audit Report State
  const [auditActionFilter, setAuditActionFilter] = useState<string>("ALL");
  const [auditStatusFilter, setAuditStatusFilter] = useState<string>("ALL");
  const [auditFieldFilter, setAuditFieldFilter] = useState<string>("ALL");
  const [auditValueFilter, setAuditValueFilter] = useState<string>("ALL");

  // Inspector Report State
  const [selectedInspector, setSelectedInspector] = useState<string>("ALL");
  const [inspectorReportStatus, setInspectorReportStatus] = useState<
    "ALL" | "COMPLETED" | "IN_PROGRESS"
  >("ALL");

  // Custom Report State
  const [customFilters, setCustomFilters] = useState({
    importer: "",
    product: "",
    origin: "",
    inspector: "",
    action: "",
  });

  // Logistics Report Advanced Filters
  const [logisticsFilters, setLogisticsFilters] = useState({
    transferTo: "ALL",
    status: "ALL",
    importer: "",
    bayanNumber: "",
  });

  // Commodity Group Filter State
  const [selectedCommodityGroups, setSelectedCommodityGroups] = useState<
    string[]
  >([]);

  // Lab Report State
  const [filterLab, setFilterLab] = useState<string>("ALL");
  const [filterTestType, setFilterTestType] = useState<string>("ALL");

  // Dynamic Columns State
  const [selectedColumnKeys, setSelectedColumnKeys] = useState<string[]>([
    "bayanNumber",
    "arrivalDate",
    "importer",
    "itemDescription",
    "commodityGroup",
    "origin",
    "totalWeight",
    "inspectionResult",
    "status",
    "fees",
  ]);
  const [selectedLabColumnKeys, setSelectedLabColumnKeys] = useState<string[]>([
    "sampleId",
    "bayanNumber",
    "importer",
    "product",
    "sampleDate",
    "labAnalysisType",
    "labName",
    "result",
    "notes",
  ]);
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [mirqabLogoBase64, setMirqabLogoBase64] = useState<string>("");

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getLogoBase64().then(setLogoBase64);
    getMirqabLogoBase64().then(setMirqabLogoBase64);
  }, []);

  const availableSectors = useMemo(() => {
    const sectors =
      currentUser.role === "ADMIN"
        ? Object.values(ConsignmentType)
        : currentUser.allowedSectors || [];
    return Array.from(new Set(sectors));
  }, [currentUser]);

  useEffect(() => {
    if (activeSector && availableSectors.includes(activeSector)) {
      setSelectedSector(activeSector);
    } else if (availableSectors.length > 0) {
      setSelectedSector(availableSectors[0]);
    }
  }, [activeSector, availableSectors]);

  const getConsignmentDirection = (c: Consignment) => {
    if (c.direction) return c.direction;
    if (c.declarationType === "تصدير" || c.declarationType === "إعادة تصدير")
      return ConsignmentDirection.OUTBOUND;
    return ConsignmentDirection.INBOUND;
  };

  const [bayanFilter, setBayanFilter] = useState<"ALL" | "UNIQUE" | "DUPLICATES">("ALL");

  const filteredData = useMemo(() => {
    let data = consignments
      .filter((c) => {
        if (selectedSector !== "ALL" && c.type !== selectedSector) return false;
        if (selectedPort !== "ALL" && c.port !== selectedPort) return false;
        const dateVal = String(c.arrivalDate || "");
        const date = dateVal.includes("T") ? dateVal.split("T")[0] : dateVal;
        return date >= startDate && date <= endDate;
      })
      .sort((a, b) => {
        const dateA = new Date(a.arrivalDate || 0).getTime();
        const dateB = new Date(b.arrivalDate || 0).getTime();
        return dateA - dateB;
      });

    if (bayanFilter === "UNIQUE") {
      const seen = new Set<string>();
      data = data.filter((c) => {
        if (!c.bayanNumber) return true;
        if (seen.has(c.bayanNumber)) return false;
        seen.add(c.bayanNumber);
        return true;
      });
    } else if (bayanFilter === "DUPLICATES") {
      const countMap = new Map<string, number>();
      data.forEach((c) => {
        if (c.bayanNumber) {
          countMap.set(c.bayanNumber, (countMap.get(c.bayanNumber) || 0) + 1);
        }
      });
      data = data.filter((c) => c.bayanNumber && countMap.get(c.bayanNumber)! > 1);
    }

    return data;
  }, [consignments, selectedSector, selectedPort, startDate, endDate, bayanFilter]);

  const comparisonFilteredData = useMemo(() => {
    if (reportType !== "COMPARISON") return [];
    return consignments.filter((c) => {
      if (selectedSector !== "ALL" && c.type !== selectedSector) return false;
      if (selectedPort !== "ALL" && c.port !== selectedPort) return false;
      const dateVal = String(c.arrivalDate || "");
      const date = dateVal.includes("T") ? dateVal.split("T")[0] : dateVal;
      return date >= compareStartDate && date <= compareEndDate;
    });
  }, [
    consignments,
    selectedSector,
    selectedPort,
    compareStartDate,
    compareEndDate,
    reportType,
  ]);

  const comparisonStats = useMemo(() => {
    if (reportType !== "COMPARISON") return null;
    const calcWeight = (data: Consignment[]) =>
      data.reduce((sum, c) => {
        const itemsSum =
          c.items?.reduce((acc, i) => acc + (Number(i.weight) || 0), 0) || 0;
        return sum + (itemsSum > 0 ? itemsSum : Number(c.totalWeight) || 0);
      }, 0);

    const current = {
      total: filteredData.length,
      approved: filteredData.filter((c) => c.status === "Approved").length,
      rejected: filteredData.filter((c) => c.status === "Rejected").length,
      fees: filteredData.reduce((sum, c) => sum + (Number(c.fees) || 0), 0),
      weight: calcWeight(filteredData),
    };
    const previous = {
      total: comparisonFilteredData.length,
      approved: comparisonFilteredData.filter((c) => c.status === "Approved")
        .length,
      rejected: comparisonFilteredData.filter((c) => c.status === "Rejected")
        .length,
      fees: comparisonFilteredData.reduce(
        (sum, c) => sum + (Number(c.fees) || 0),
        0,
      ),
      weight: calcWeight(comparisonFilteredData),
    };

    const metrics = [
      {
        label: "إجمالي الإرساليات",
        current: current.total,
        previous: previous.total,
        unit: "إرسالية",
      },
      {
        label: "الإرساليات المقبولة",
        current: current.approved,
        previous: previous.approved,
        unit: "إرسالية",
      },
      {
        label: "الإرساليات المرفوضة",
        current: current.rejected,
        previous: previous.rejected,
        unit: "إرسالية",
      },
      {
        label: "إجمالي الرسوم المحصلة",
        current: current.fees,
        previous: previous.fees,
        unit: "ر.ع",
      },
      {
        label: "إجمالي الأوزان",
        current: current.weight / 1000,
        previous: previous.weight / 1000,
        unit: "طن",
      },
    ];

    return metrics.map((m) => {
      const diff = m.current - m.previous;
      const percent =
        m.previous === 0
          ? m.current > 0
            ? 100
            : 0
          : (diff / m.previous) * 100;
      return { ...m, diff, percent };
    });
  }, [filteredData, comparisonFilteredData, reportType]);

  // منطق تقرير الإرساليات المحولة
  const logisticsReportList = useMemo(() => {
    if (reportType !== "LOGISTICS") return [];
    return filteredData.filter((c) => {
      const isLogistics =
        c.technicalAction === "تحويل" ||
        !!c.transferTo ||
        c.conditionalReleaseType === "تحويل للمدينة اللوجستية";

      if (!isLogistics) return false;

      // Apply new filters
      if (
        logisticsFilters.transferTo !== "ALL" &&
        c.transferTo !== logisticsFilters.transferTo
      )
        return false;
      if (
        logisticsFilters.status !== "ALL" &&
        c.status !== logisticsFilters.status
      )
        return false;
      if (
        logisticsFilters.importer &&
        !c.importer.includes(logisticsFilters.importer)
      )
        return false;
      if (
        logisticsFilters.bayanNumber &&
        !c.bayanNumber?.includes(logisticsFilters.bayanNumber)
      )
        return false;

      return true;
    });
  }, [filteredData, reportType, logisticsFilters]);

  const logisticsOptions = useMemo(() => {
    if (reportType !== "LOGISTICS") return { transferDestinations: [] };
    const dests = new Set<string>();
    filteredData.forEach((c) => {
      if (c.transferTo) dests.add(c.transferTo);
    });
    return {
      transferDestinations: Array.from(dests).sort(),
    };
  }, [filteredData, reportType]);

  const uniqueValues = useMemo(() => {
    if (reportType !== "CUSTOM")
      return {
        importers: [],
        products: [],
        origins: [],
        actions: [],
        inspectors: [],
      };
    return {
      importers: Array.from(
        new Set(filteredData.map((c) => c.importer).filter(Boolean)),
      ).sort(),
      products: Array.from(
        new Set(
          filteredData
            .flatMap((c) => c.items?.map((i) => i.description) || [])
            .filter(Boolean),
        ),
      ).sort(),
      origins: Array.from(
        new Set(filteredData.map((c) => c.shippingCountry).filter(Boolean)),
      ).sort(),
      actions: Array.from(
        new Set(filteredData.map((c) => c.technicalAction).filter(Boolean)),
      ).sort(),
      inspectors: Array.from(
        new Set(filteredData.map((c) => c.inspectorName).filter(Boolean)),
      ).sort(),
    };
  }, [filteredData, reportType]);

  const processedLabSamples = useMemo(() => {
    const allSamples = filteredData.flatMap((c) => {
      if (!c.samples || c.samples.length === 0) return [];
      return c.samples.map((s) => ({ ...s, parentConsignment: c }));
    });
    return allSamples.filter((s) => {
      const matchesLab = filterLab === "ALL" || s.labName === filterLab;
      const matchesTest =
        filterTestType === "ALL" ||
        (Array.isArray(s.labAnalysisType)
          ? s.labAnalysisType.includes(filterTestType)
          : s.labAnalysisType === filterTestType);
      return matchesLab && matchesTest;
    });
  }, [filteredData, filterLab, filterTestType]);

  const labFilterOptions = useMemo(() => {
    const labs = new Set<string>();
    const tests = new Set<string>();
    filteredData.forEach((c) => {
      c.samples?.forEach((s) => {
        if (s.labName) labs.add(s.labName);
        const types = Array.isArray(s.labAnalysisType)
          ? s.labAnalysisType
          : [s.labAnalysisType];
        types.forEach((t) => {
          if (t) tests.add(t);
        });
      });
    });
    return { labs: Array.from(labs).sort(), tests: Array.from(tests).sort() };
  }, [filteredData]);

  const customReportList = useMemo(() => {
    if (reportType !== "CUSTOM") return [];
    return filteredData.filter((c) => {
      let matches = true;
      if (customFilters.importer && c.importer !== customFilters.importer)
        matches = false;
      if (
        customFilters.inspector &&
        c.inspectorName !== customFilters.inspector
      )
        matches = false;
      if (customFilters.action && c.technicalAction !== customFilters.action)
        matches = false;
      if (customFilters.origin && c.shippingCountry !== customFilters.origin)
        matches = false;
      if (
        customFilters.product &&
        !c.items?.some((i) => i.description === customFilters.product)
      )
        matches = false;
      return matches;
    });
  }, [filteredData, reportType, customFilters]);

  const availableInspectors = useMemo(() => {
    const names = new Set(
      filteredData.map((c) => c.inspectorName).filter(Boolean),
    );
    return Array.from(names).sort();
  }, [filteredData]);

  const inspectorReportData = useMemo(() => {
    if (reportType !== "INSPECTOR") return null;

    let dataToProcess = filteredData;
    if (inspectorReportStatus === "COMPLETED") {
      dataToProcess = filteredData.filter((c) => {
        const isDone = c.status === "Approved" || c.status === "Rejected";
        const hasPendingSamples =
          c.hasSample && c.samples?.some((s) => s.result === "Pending");
        return isDone && !hasPendingSamples;
      });
    } else if (inspectorReportStatus === "IN_PROGRESS") {
      dataToProcess = filteredData.filter((c) => {
        const isPending = c.status === "Pending";
        const hasPendingSamples =
          c.hasSample && c.samples?.some((s) => s.result === "Pending");
        return isPending || hasPendingSamples;
      });
    }

    if (selectedInspector === "ALL") {
      const summary = availableInspectors
        .map((name) => {
          const works = dataToProcess.filter((c) => c.inspectorName === name);
          const approved = works.filter((c) => {
            const isApproved = c.status === "Approved";
            const hasPendingSamples =
              c.hasSample && c.samples?.some((s) => s.result === "Pending");
            return isApproved && !hasPendingSamples;
          }).length;
          const rejected = works.filter((c) => {
            const isRejected = c.status === "Rejected";
            const hasPendingSamples =
              c.hasSample && c.samples?.some((s) => s.result === "Pending");
            return isRejected && !hasPendingSamples;
          }).length;

          const total = works.length;
          const pendingLab = works.filter(
            (c) =>
              c.hasSample && c.samples?.some((s) => s.result === "Pending"),
          ).length;
          const pending = total - approved - rejected;

          return {
            name,
            total,
            approved,
            rejected,
            pending,
            pendingLab,
            feesCollected: works.reduce(
              (sum, c) => sum + (Number(c.fees) || 0),
              0,
            ),
          };
        })
        .sort((a, b) => b.total - a.total);
      return { type: "ALL", data: summary };
    } else {
      const works = dataToProcess.filter(
        (c) => c.inspectorName === selectedInspector,
      );
      return { type: "SINGLE", data: works, inspectorName: selectedInspector };
    }
  }, [
    filteredData,
    reportType,
    selectedInspector,
    availableInspectors,
    inspectorReportStatus,
  ]);

  const commodityReportData = useMemo(() => {
    if (reportType !== "SUMMARY") return null;
    if (
      selectedSector !== ConsignmentType.VETERINARY &&
      selectedSector !== ConsignmentType.AGRICULTURAL
    )
      return null;

    const getGroupedData = (data: Consignment[]) => {
      const allItems = data.flatMap((c) => {
        if (c.items && c.items.length > 0) {
          return c.items.map((item) => ({
            ...item,
            consignmentId: c.id,
            bayanNumber: c.bayanNumber,
            arrivalDate: c.arrivalDate,
            importer: c.importer,
            exporter: c.exporter,
            shippingCountry: c.shippingCountry || item.origin,
            commodityGroup:
              item.commodityGroup || c.commodityGroup || "غير محدد",
            direction: getConsignmentDirection(c),
            vetCategory: c.vetCategory || item.commodityGroup,
          }));
        } else if (Number(c.totalWeight) > 0) {
          return [
            {
              id: `legacy-${c.id}`,
              description: (c as any).itemDescription || "شحنة (بيانات قديمة)",
              commodityGroup: c.commodityGroup || "غير محدد",
              weight: Number(c.totalWeight),
              packagingUnit: "-",
              origin: c.shippingCountry || "-",
              shippingCountry: c.shippingCountry || "-",
              consignmentId: c.id,
              bayanNumber: c.bayanNumber,
              arrivalDate: c.arrivalDate,
              importer: c.importer,
              exporter: c.exporter,
              packageCount: Number(c.totalPackageCount) || 0,
              direction: getConsignmentDirection(c),
              vetCategory: c.vetCategory || c.commodityGroup,
            },
          ];
        }
        return [];
      });

      const groupedItems: Record<string, any[]> = {};
      const uniqueCommodityGroups = new Set<string>();

      // For Veterinary and Agricultural, we group by direction and specific categories
      const dirGroups: Record<string, Record<string, any[]>> = {
        [ConsignmentDirection.INBOUND]: {},
        [ConsignmentDirection.OUTBOUND]: {},
      };

      allItems.forEach((item) => {
        const group = item.commodityGroup;
        uniqueCommodityGroups.add(group);

        if (
          selectedCommodityGroups.length > 0 &&
          !selectedCommodityGroups.includes(group)
        ) {
          return;
        }

        if (
          selectedSector === ConsignmentType.VETERINARY ||
          selectedSector === ConsignmentType.AGRICULTURAL
        ) {
          const dir = item.direction || ConsignmentDirection.INBOUND;
          // Use commodityGroup as the primary classification
          const cat =
            selectedSector === ConsignmentType.VETERINARY
              ? item.commodityGroup || getVetCategory(item)
              : item.commodityGroup || "غير محدد";
          if (!dirGroups[dir][cat]) dirGroups[dir][cat] = [];

          const existing = dirGroups[dir][cat].find(
            (p) => p.description === item.description,
          );
          if (existing) {
            existing.weight =
              (Number(existing.weight) || 0) + (Number(item.weight) || 0);
            existing.packageCount =
              (Number(existing.packageCount) || 0) +
              (Number(item.packageCount) || 0);
            if (item.shippingCountry)
              existing.exportersSet.add(item.shippingCountry);
            if (item.origin) existing.originsSet.add(item.origin);
            if (item.importer) existing.importersSet.add(item.importer);
          } else {
            dirGroups[dir][cat].push({
              ...item,
              exportersSet: new Set(
                item.shippingCountry ? [item.shippingCountry] : [],
              ),
              originsSet: new Set(item.origin ? [item.origin] : []),
              importersSet: new Set(item.importer ? [item.importer] : []),
            });
          }
        }

        if (!groupedItems[group]) {
          groupedItems[group] = [];
        }
        const existingProduct = groupedItems[group].find(
          (p) => p.description === item.description,
        );
        const shippingCountryVal = item.shippingCountry
          ? item.shippingCountry.trim()
          : "";
        const originVal = item.origin ? item.origin.trim() : "";
        const importerVal = item.importer ? item.importer.trim() : "";

        if (existingProduct) {
          existingProduct.weight =
            (Number(existingProduct.weight) || 0) + (Number(item.weight) || 0);
          existingProduct.packageCount =
            (Number(existingProduct.packageCount) || 0) +
            (Number(item.packageCount) || 0);
          if (shippingCountryVal)
            existingProduct.exportersSet.add(shippingCountryVal);
          if (originVal) existingProduct.originsSet.add(originVal);
          if (importerVal) existingProduct.importersSet.add(importerVal);
        } else {
          groupedItems[group].push({
            ...item,
            weight: Number(item.weight) || 0,
            packageCount: Number(item.packageCount) || 0,
            exportersSet: new Set(
              shippingCountryVal ? [shippingCountryVal] : [],
            ),
            originsSet: new Set(originVal ? [originVal] : []),
            importersSet: new Set(importerVal ? [importerVal] : []),
          });
        }
      });

      Object.keys(groupedItems).forEach((group) => {
        groupedItems[group].sort((a, b) =>
          a.description.localeCompare(b.description, "ar"),
        );
      });

      if (
        selectedSector === ConsignmentType.VETERINARY ||
        selectedSector === ConsignmentType.AGRICULTURAL
      ) {
        [ConsignmentDirection.INBOUND, ConsignmentDirection.OUTBOUND].forEach(
          (dir) => {
            Object.keys(dirGroups[dir]).forEach((cat) => {
              dirGroups[dir][cat].sort((a, b) =>
                a.description.localeCompare(b.description, "ar"),
              );
            });
          },
        );
      }

      return {
        groupedItems,
        sortedGroups: Array.from(uniqueCommodityGroups).sort(),
        filteredGroups: Object.keys(groupedItems).sort(),
        allItems: allItems.filter(
          (item) =>
            selectedCommodityGroups.length === 0 ||
            selectedCommodityGroups.includes(item.commodityGroup),
        ),
        dirGroups,
      };
    };

    const annualData = getGroupedData(filteredData);

    const monthNames = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    const monthsInPeriod = Array.from(
      new Set(filteredData.map((c) => new Date(c.arrivalDate).getMonth())),
    ).sort((a, b) => a - b);

    const monthlyCommodityData: Record<string, any> = {};
    monthsInPeriod.forEach((mIdx) => {
      const mData = filteredData.filter(
        (c) => new Date(c.arrivalDate).getMonth() === mIdx,
      );
      monthlyCommodityData[monthNames[mIdx]] = getGroupedData(mData);
    });

    const totalWeight = annualData.allItems.reduce(
      (acc, i) => acc + (Number(i.weight) || 0),
      0,
    );

    const groupWeights = Object.keys(annualData.groupedItems).map((group) => {
      return {
        name: group,
        value: annualData.groupedItems[group].reduce(
          (acc, i) => acc + (Number(i.weight) || 0),
          0,
        ),
      };
    });
    groupWeights.sort((a, b) => b.value - a.value);
    const topGroups = groupWeights.slice(0, 5);
    if (groupWeights.length > 5) {
      const othersWeight = groupWeights
        .slice(5)
        .reduce((acc, g) => acc + g.value, 0);
      topGroups.push({ name: "أخرى", value: othersWeight });
    }

    return {
      ...annualData,
      monthlyCommodityData,
      months: monthsInPeriod.map((idx) => monthNames[idx]),
      totalWeight,
      topGroups,
    };
  }, [filteredData, selectedSector, reportType, selectedCommodityGroups]);

  const foodSafetyData = useMemo(() => {
    if (reportType !== "SUMMARY") return null;
    if (selectedSector !== ConsignmentType.FOOD_SAFETY) return null;
    const months = [
      "يناير",
      "فبراير",
      "مارس",
      "أبريل",
      "مايو",
      "يونيو",
      "يوليو",
      "أغسطس",
      "سبتمبر",
      "أكتوبر",
      "نوفمبر",
      "ديسمبر",
    ];
    const calcItemsWeight = (list: Consignment[]) =>
      list.reduce((total, c) => {
        let weight =
          c.items?.reduce(
            (iSum, item) => iSum + (Number(item.weight) || 0),
            0,
          ) || 0;
        if (weight === 0) weight = Number(c.totalWeight) || 0;
        return total + weight;
      }, 0);
    const monthlySummary = months.map((monthName, index) => {
      const monthData = filteredData.filter(
        (c) => new Date(c.arrivalDate).getMonth() === index,
      );
      const released = monthData.filter(
        (c) =>
          c.status === "Approved" ||
          c.technicalAction === "إفراج نهائي" ||
          c.technicalAction === "إفراج مؤقت (تعهد)",
      );
      const destruction = monthData.filter(
        (c) =>
          c.technicalAction === "إتلاف" ||
          (c.technicalAction === "رفض" && c.rejectionAction === "إتلاف"),
      );
      const reExport = monthData.filter(
        (c) =>
          c.technicalAction === "إعادة تصدير" ||
          (c.technicalAction === "رفض" && c.rejectionAction === "إعادة تصدير"),
      );
      return {
        name: monthName,
        releasedCount: released.length,
        releasedWeight: calcItemsWeight(released),
        destructionCount: destruction.length,
        destructionWeight: calcItemsWeight(destruction),
        reExportCount: reExport.length,
        reExportWeight: calcItemsWeight(reExport),
      };
    });
    const commodityMap: Record<string, number[]> = {};
    filteredData.forEach((c) => {
      const monthIdx = new Date(c.arrivalDate).getMonth();
      if (c.items && c.items.length > 0) {
        c.items.forEach((item) => {
          const group = item.commodityGroup || c.commodityGroup || "غير محدد";
          const weight = Number(item.weight) || 0;
          if (!commodityMap[group]) commodityMap[group] = new Array(12).fill(0);
          commodityMap[group][monthIdx] += weight;
        });
      } else {
        const group = c.commodityGroup || "غير محدد";
        const weight = Number(c.totalWeight) || 0;
        if (!commodityMap[group]) commodityMap[group] = new Array(12).fill(0);
        commodityMap[group][monthIdx] += weight;
      }
    });
    const samplesSummary = months.map((monthName, index) => {
      const monthData = filteredData.filter(
        (c) => new Date(c.arrivalDate).getMonth() === index,
      );
      const monthSamples = monthData.flatMap((c) => c.samples || []);
      const compliant = monthSamples.filter(
        (s) => s.result === "Compliant",
      ).length;
      const nonCompliant = monthSamples.filter(
        (s) => s.result === "NonCompliant",
      ).length;
      const pending = monthSamples.filter((s) => s.result === "Pending").length;
      return {
        name: monthName,
        total: monthSamples.length,
        compliant,
        nonCompliant,
        pending,
      };
    });
    const consignmentsWithSamples = filteredData.filter(
      (c) => c.samples && c.samples.length > 0,
    );
    const rejectedShipments = filteredData.filter(
      (c) => c.status === "Rejected" || c.technicalAction === "رفض",
    );
    return {
      monthlySummary,
      commodityMap,
      months,
      samplesSummary,
      consignmentsWithSamples,
      rejectedShipments,
    };
  }, [filteredData, selectedSector, reportType]);

  const stats = {
    total: filteredData.length,
    approved: filteredData.filter((c) => c.status === "Approved").length,
    rejected: filteredData.filter((c) => c.status === "Rejected").length,
    pending: filteredData.filter((c) => c.status === "Pending").length,
    fees: filteredData.reduce((sum, c) => sum + (Number(c.fees) || 0), 0),
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPdf = () => {
    if (!printRef.current || isExportingPdf) return;
    setIsExportingPdf(true);
    setTimeout(() => {
      const element = printRef.current;
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
        filename: `Report_${reportType}_${selectedSector}_${startDate}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: {
          scale: 3,
          useCORS: true,
          logging: false,
          letterRendering: false,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" as const },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      };
      html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          setIsExportingPdf(false);
        })
        .catch((err: any) => {
          console.error(err);
          setIsExportingPdf(false);
          alert("حدث خطأ أثناء تصدير PDF");
        });
    }, 500);
  };

  const getCellValue = (c: Consignment, key: string) => {
    const hasPendingSamples =
      c.hasSample && c.samples?.some((s) => s.result === "Pending");
    switch (key) {
      case "itemDescription":
        return (
          c.items?.[0]?.description ||
          (c as any).itemDescription ||
          (c.totalWeight ? "شحنة عامة" : "-")
        );
      case "origin":
        return c.items?.[0]?.origin || c.shippingCountry || "-";
      case "commodityGroup":
        return c.commodityGroup || c.items?.[0]?.commodityGroup || "-";
      case "producingCompany":
        return c.items?.[0]?.producingCompany || "-";
      case "storageTemp":
        return c.items?.[0]?.storageTemp || "-";
      case "status":
        if (c.status === "Approved") return "منجزة (مقبول)";
        if (c.status === "Rejected") return "منجزة (مرفوض)";
        if (hasPendingSamples) return "معاملة غير منجزة من المختبر";
        return "قيد الإجراء";
      case "inspectionLocation":
        return c.inspectionLocation || "-";
      case "inspectionNotes":
        return c.inspectionNotes || "-";
      case "labAnalysisType": {
        if (c.samples && c.samples.length > 0) {
          return c.samples
            .map((s) =>
              Array.isArray(s.labAnalysisType)
                ? s.labAnalysisType.join("، ")
                : s.labAnalysisType,
            )
            .join(" | ");
        }
        return Array.isArray(c.labAnalysisType)
          ? c.labAnalysisType.join("، ")
          : c.labAnalysisType || "-";
      }
      case "labResult": {
        if (c.samples && c.samples.length > 0) {
          return c.samples
            .map((s) =>
              s.result === "Compliant"
                ? "مطابق"
                : s.result === "NonCompliant"
                  ? "غير مطابق"
                  : "قيد الإجراء",
            )
            .join(" | ");
        }
        return "-";
      }
      case "totalWeight": {
        const itemsSum =
          c.items?.reduce((acc, i) => acc + (Number(i.weight) || 0), 0) || 0;
        const weight = itemsSum > 0 ? itemsSum : Number(c.totalWeight) || 0;
        return weight.toLocaleString();
      }
      case "weightKg": {
        const itemsSum =
          c.items?.reduce((acc, i) => acc + (Number(i.weight) || 0), 0) || 0;
        const weight = itemsSum > 0 ? itemsSum : Number(c.totalWeight) || 0;
        return weight.toLocaleString();
      }
      case "weightTon": {
        const itemsSum =
          c.items?.reduce((acc, i) => acc + (Number(i.weight) || 0), 0) || 0;
        const weight = itemsSum > 0 ? itemsSum : Number(c.totalWeight) || 0;
        return (weight / 1000).toFixed(3);
      }
      case "fees":
        return Number(c.fees || 0).toLocaleString();
      default:
        return (c as any)[key] || "-";
    }
  };

  const getLabCellValue = (s: any, key: string) => {
    switch (key) {
      case "sampleId":
        return s.sampleId;
      case "bayanNumber":
        return s.parentConsignment.bayanNumber;
      case "permitNumber":
        return s.parentConsignment.permitNumber || "-";
      case "importer":
        return s.parentConsignment.importer;
      case "product":
        if (s.itemIds && s.itemIds.length > 0) {
          const items = s.parentConsignment.items?.filter((i: any) =>
            s.itemIds.includes(i.id),
          );
          if (items && items.length > 0)
            return items.map((i: any) => i.description).join("، ");
        }
        return (
          s.parentConsignment.items
            ?.map((i: any) => i.description)
            .join("، ") || "غير محدد"
        );
      case "sampleDate":
        return s.date || s.parentConsignment.arrivalDate;
      case "labAnalysisType":
        return Array.isArray(s.labAnalysisType)
          ? s.labAnalysisType.join("، ")
          : s.labAnalysisType;
      case "labName":
        return s.labName;
      case "labDelegate":
        return s.labDelegate || "-";
      case "producingCompany":
        return (
          s.parentConsignment.items
            ?.map((i: any) => i.producingCompany)
            .filter(Boolean)
            .join("، ") || "-"
        );
      case "storageTemp":
        return (
          s.parentConsignment.items
            ?.map((i: any) => i.storageTemp)
            .filter(Boolean)
            .join("، ") || "-"
        );
      case "sampleCondition":
        return s.sampleCondition || "-";
      case "sampleSeal":
        return s.sampleSeal || "-";
      case "result":
        return s.result === "Compliant"
          ? "مطابق"
          : s.result === "NonCompliant"
            ? "غير مطابق"
            : "قيد الإجراء";
      case "notes":
        return [s.rejectionReason, s.notes].filter(Boolean).join(" - ") || "-";
      default:
        return "-";
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const logoBase64 = await getLogoBase64();

    const addStyledSheet = (
      name: string,
      data: any[],
      headers?: string[],
      isAOA: boolean = false,
    ) => {
      const worksheet = workbook.addWorksheet(name);
      worksheet.views = [{ rightToLeft: true }];

      // Add Logo
      if (logoBase64) {
        try {
          const imageId = workbook.addImage({
            base64: logoBase64,
            extension: "png",
          });
          worksheet.addImage(imageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 120, height: 50 },
          });
        } catch (e) {
          console.warn("Logo error", e);
        }
      }

      // Title
      worksheet.mergeCells("D2:I3");
      const titleCell = worksheet.getCell("D2");
      titleCell.value = `التقرير الرقابي والإحصائي للعمليات التشغيلية - نظام مرقاب`;
      titleCell.font = {
        name: "Arial",
        size: 20,
        bold: true,
        color: { argb: "FF1E293B" },
      };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };

      // Period, Sector, Port Info
      worksheet.mergeCells("D4:I5");
      const infoCell = worksheet.getCell("D4");
      const sectorLabel =
        selectedSector === "ALL"
          ? "جميع القطاعات"
          : CONSIGNMENT_LABELS[selectedSector as ConsignmentType];
      const portLabel = selectedPort === "ALL" ? "جميع المنافذ" : selectedPort;
      infoCell.value = `الفترة: من ${startDate} إلى ${endDate} | القطاع: ${sectorLabel} | المنفذ: ${portLabel}`;
      infoCell.font = {
        name: "Arial",
        size: 11,
        bold: true,
        color: { argb: "FF475569" },
      };
      infoCell.alignment = { vertical: "middle", horizontal: "center" };

      let startRow = 7;
      if (isAOA) {
        data.forEach((rowValues, index) => {
          const row = worksheet.addRow(rowValues);
          row.alignment = { vertical: "middle", horizontal: "center" };
          if (index === 0) {
            row.font = { bold: true, color: { argb: "FFFFFFFF" } };
            row.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FF007A3D" },
            };
          }
        });
      } else if (data.length > 0) {
        const keys = Object.keys(data[0]);
        const headerLabels = headers || keys;

        const headerRow = worksheet.getRow(startRow);
        headerRow.values = headerLabels;
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF007A3D" },
        };
        headerRow.alignment = { vertical: "middle", horizontal: "center" };
        headerRow.height = 25;

        data.forEach((item, index) => {
          const row = worksheet.addRow(Object.values(item));
          row.alignment = { vertical: "middle", horizontal: "center" };
          row.height = 20;

          // Alternating rows
          if (index % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF8FAFC" },
              };
            });
          }

          // Borders
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin", color: { argb: "FFCBD5E1" } },
              left: { style: "thin", color: { argb: "FFCBD5E1" } },
              bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
              right: { style: "thin", color: { argb: "FFCBD5E1" } },
            };
          });
        });
      }

      // Auto-size columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width =
          maxLength < 10 ? 12 : maxLength > 50 ? 50 : maxLength + 2;
      });
    };

    if (reportType === "LOGISTICS") {
      const data = logisticsReportList.map((c) => ({
        "رقم البيان": c.bayanNumber,
        "رقم التصريح": c.permitNumber || "-",
        "تاريخ التسجيل": c.arrivalDate,
        المستورد: c.importer,
        "المنفذ الأصلي": c.auditLog?.[0]?.details?.includes("إنشاء")
          ? c.port
          : "غير محدد",
        "جهة التحويل": c.transferTo || "-",
        "تاريخ وصول المحطة": safeFormatDate(c.logisticsArrivalDate, "ar-OM"),
        "الموظف المستلم": c.logisticsReceiverName || "-",
        "الحالة الحالية":
          c.status === "Approved"
            ? "منجزة (مقبول)"
            : c.status === "Rejected"
              ? "منجزة (مرفوض)"
              : "قيد الإجراء",
        المفتش: c.inspectorName,
      }));
      addStyledSheet("الإرساليات المحولة", data);
    } else if (reportType === "INSPECTOR") {
      if (inspectorReportData?.type === "ALL") {
        const data = (inspectorReportData.data as any[]).map((d) => ({
          المفتش: d.name,
          "إجمالي المعاملات": d.total,
          "منجزة (مقبول)": d.approved,
          "منجزة (مرفوض)": d.rejected,
          "قيد الإجراء": d.pending,
          "نسبة الإنجاز":
            d.total > 0
              ? Math.round(((d.approved + d.rejected) / d.total) * 100) + "%"
              : "0%",
          "الرسوم المحصلة": d.feesCollected,
        }));
        addStyledSheet("ملخص أداء المفتشين", data);
      } else if (inspectorReportData?.type === "SINGLE") {
        const data = (inspectorReportData.data as Consignment[]).map((c) => ({
          "رقم البيان": c.bayanNumber,
          "رقم التصريح": c.permitNumber || "-",
          التاريخ: c.arrivalDate,
          المستورد: c.importer,
          الحالة:
            c.status === "Approved"
              ? "منجزة (مقبول)"
              : c.status === "Rejected"
                ? "منجزة (مرفوض)"
                : "قيد الإجراء",
          "الإجراء الفني": c.technicalAction,
          الرسوم: c.fees,
          الملاحظات: c.remarks,
        }));
        addStyledSheet(`معاملات_${selectedInspector}`, data);
      }
    } else if (reportType === "CUSTOM") {
      const dataToExport = customReportList.map((c) => {
        const row: any = {};
        selectedColumnKeys.forEach((key) => {
          const colDef = AVAILABLE_COLUMNS.find((col) => col.key === key);
          if (colDef) {
            row[colDef.label] = getCellValue(c, key);
          }
        });
        return row;
      });
      addStyledSheet("تقرير مخصص", dataToExport);
    } else if (reportType === "COMPARISON" && comparisonStats) {
      const dataToExport = comparisonStats.map((s) => ({
        المؤشر: s.label,
        "الفترة الأساسية": `${s.current.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${s.unit}`,
        "فترة المقارنة": `${s.previous.toLocaleString(undefined, { maximumFractionDigits: 2 })} ${s.unit}`,
        الفرق:
          s.diff > 0
            ? `+${s.diff.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
            : s.diff.toLocaleString(undefined, { maximumFractionDigits: 2 }),
        "نسبة التغير": `${s.percent > 0 ? "+" : ""}${s.percent.toFixed(1)}%`,
      }));
      addStyledSheet("تقرير المقارنة", dataToExport);
    } else if (
      reportType === "SUMMARY" &&
      selectedSector === ConsignmentType.FOOD_SAFETY &&
      foodSafetyData
    ) {
      const rows = [
        ["البيان", ...foodSafetyData.months, "الإجمالي"],
        [
          "عدد المفرج عنه",
          ...foodSafetyData.monthlySummary.map((m) => m.releasedCount),
          foodSafetyData.monthlySummary.reduce(
            (a, b) => a + b.releasedCount,
            0,
          ),
        ],
        [
          "وزن المفرج عنه (طن)",
          ...foodSafetyData.monthlySummary.map((m) => m.releasedWeight / 1000),
          foodSafetyData.monthlySummary.reduce(
            (a, b) => a + b.releasedWeight,
            0,
          ) / 1000,
        ],
        [
          "عدد الإتلاف",
          ...foodSafetyData.monthlySummary.map((m) => m.destructionCount),
          foodSafetyData.monthlySummary.reduce(
            (a, b) => a + b.destructionCount,
            0,
          ),
        ],
        [
          "وزن الإتلاف (طن)",
          ...foodSafetyData.monthlySummary.map(
            (m) => m.destructionWeight / 1000,
          ),
          foodSafetyData.monthlySummary.reduce(
            (a, b) => a + b.destructionWeight,
            0,
          ) / 1000,
        ],
        [
          "عدد إعادة التصدير",
          ...foodSafetyData.monthlySummary.map((m) => m.reExportCount),
          foodSafetyData.monthlySummary.reduce(
            (a, b) => a + b.reExportCount,
            0,
          ),
        ],
        [
          "وزن إعادة التصدير (طن)",
          ...foodSafetyData.monthlySummary.map((m) => m.reExportWeight / 1000),
          foodSafetyData.monthlySummary.reduce(
            (a, b) => a + b.reExportWeight,
            0,
          ) / 1000,
        ],
      ];
      addStyledSheet("الملخص الشهري", rows, undefined, true);

      const commoditySheetData = Object.keys(foodSafetyData.commodityMap).map(
        (group) => {
          const row: any = { "المجموعة السلعية": group };
          foodSafetyData.months.forEach((m, idx) => {
            row[m] = (foodSafetyData.commodityMap[group][idx] || 0) / 1000;
          });
          row["الإجمالي (طن)"] =
            foodSafetyData.commodityMap[group].reduce((a, b) => a + b, 0) /
            1000;
          return row;
        },
      );
      addStyledSheet("أوزان المجموعات", commoditySheetData);

      const samplesRows = [
        ["البيان / الشهر", ...foodSafetyData.months, "الإجمالي"],
        [
          "إجمالي العينات",
          ...foodSafetyData.samplesSummary.map((s) => s.total),
          foodSafetyData.samplesSummary.reduce((a, b) => a + b.total, 0),
        ],
        [
          "عينات مطابقة",
          ...foodSafetyData.samplesSummary.map((s) => s.compliant),
          foodSafetyData.samplesSummary.reduce((a, b) => a + b.compliant, 0),
        ],
        [
          "عينات غير مطابقة",
          ...foodSafetyData.samplesSummary.map((s) => s.nonCompliant),
          foodSafetyData.samplesSummary.reduce((a, b) => a + b.nonCompliant, 0),
        ],
        [
          "عينات قيد الإجراء",
          ...foodSafetyData.samplesSummary.map((s) => s.pending),
          foodSafetyData.samplesSummary.reduce((a, b) => a + b.pending, 0),
        ],
      ];
      addStyledSheet("ملخص العينات", samplesRows, undefined, true);

      const samplesDetailedData =
        foodSafetyData.consignmentsWithSamples.flatMap((c) =>
          (c.samples || []).map((s) => ({
            "رقم البيان": c.bayanNumber,
            المستورد: c.importer,
            "تاريخ الوصول": c.arrivalDate,
            "نوع الفحص المخبري": s.labAnalysisType || "-",
            "نتيجة الفحص":
              s.result === "Compliant"
                ? "مطابق"
                : s.result === "NonCompliant"
                  ? "غير مطابق"
                  : "قيد الإجراء",
            المختبر: s.labName || "-",
          })),
        );
      addStyledSheet("تفاصيل العينات", samplesDetailedData);

      const rejectedShipmentsData = foodSafetyData.rejectedShipments.map(
        (c) => ({
          المنتج:
            c.items?.[0]?.description ||
            (c as any).itemDescription ||
            "شحنة عامة",
          "رقم البيان": c.bayanNumber,
          "الشركة المستوردة": c.importer,
          "الوزن (كجم)": c.totalWeight,
          "بلد المنشأ": c.items?.[0]?.origin || c.shippingCountry || "-",
          التاريخ: c.arrivalDate,
          "سبب الرفض": c.rejectionReason || "-",
        }),
      );
      addStyledSheet("الإرساليات المرفوضة", rejectedShipmentsData);
    } else if (reportType === "SUMMARY" && commodityReportData && selectedSector === ConsignmentType.VETERINARY) {
      const annualWs = workbook.addWorksheet("الملخص السنوي");
      annualWs.views = [{ rightToLeft: true }];

      // Add Logo to Annual Sheet
      if (logoBase64) {
        try {
          const imageId = workbook.addImage({
            base64: logoBase64,
            extension: "png",
          });
          annualWs.addImage(imageId, {
            tl: { col: 0, row: 0 },
            ext: { width: 120, height: 50 },
          });
        } catch (e) {
          console.warn("Logo error", e);
        }
      }

      annualWs.mergeCells("D2:I3");
      const aTitle = annualWs.getCell("D2");
      aTitle.value = `التقرير الرقابي والإحصائي للعمليات التشغيلية - الملخص السنوي`;
      aTitle.font = { name: "Arial", size: 18, bold: true };
      aTitle.alignment = { vertical: "middle", horizontal: "center" };

      if (
        selectedSector === ConsignmentType.VETERINARY ||
        selectedSector === ConsignmentType.AGRICULTURAL
      ) {
        let currentRow = 6;
        [ConsignmentDirection.INBOUND, ConsignmentDirection.OUTBOUND].forEach(
          (dir) => {
            const dirTitle =
              dir === ConsignmentDirection.INBOUND
                ? "أولاً: الواردات"
                : "ثانياً: الصادرات";
            annualWs.mergeCells(`A${currentRow}:I${currentRow}`);
            const dirCell = annualWs.getCell(`A${currentRow}`);
            dirCell.value = dirTitle;
            dirCell.font = {
              bold: true,
              size: 14,
              color: { argb: "FFFFFFFF" },
            };
            dirCell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: {
                argb:
                  dir === ConsignmentDirection.INBOUND
                    ? "FFDC2626"
                    : "FF059669",
              },
            };
            dirCell.alignment = { horizontal: "center", vertical: "middle" };
            currentRow += 2;

            const groups = Object.keys(commodityReportData.dirGroups[dir]).sort(
              (a, b) => {
                if (selectedSector === ConsignmentType.VETERINARY) {
                  const aIdx = VET_SUMMARY_CATEGORIES.findIndex(
                    (c) => c.title === a,
                  );
                  const bIdx = VET_SUMMARY_CATEGORIES.findIndex(
                    (c) => c.title === b,
                  );
                  if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                  if (aIdx !== -1) return -1;
                  if (bIdx !== -1) return 1;
                }
                return a.localeCompare(b, "ar");
              },
            );

            const summaryData: {
              group: string;
              totalWeight: number;
              totalCount: number;
              isWeight: boolean;
            }[] = [];

            groups.forEach((groupName) => {
              const items = commodityReportData.dirGroups[dir][groupName] || [];
              if (items.length === 0) return;

              annualWs.mergeCells(`A${currentRow}:I${currentRow}`);
              const catCell = annualWs.getCell(`A${currentRow}`);
              catCell.value = groupName;
              catCell.font = { bold: true };
              catCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF1F5F9" },
              };
              catCell.alignment = { horizontal: "right", vertical: "middle" };
              currentRow++;

              const isWeightTable =
                selectedSector === ConsignmentType.VETERINARY
                  ? isWeightGroup(groupName)
                  : true;
              const headers =
                selectedSector === ConsignmentType.VETERINARY
                  ? [
                      "م",
                      "نوع الحيوان / المنتج",
                      "الرمز المنسق",
                      "الوحدة",
                      isWeightTable ? "الوزن الصافي (كجم)" : "العدد",
                      isWeightTable ? "الوزن بالطن" : "",
                      "الدول",
                      "الشركات",
                      "ملاحظات",
                    ]
                  : [
                      "م",
                      "السلعة",
                      "المجموعة السلعية",
                      "المصدر",
                      "المنشأ",
                      "المستورد",
                      "الوحدة",
                      "الوزن (كجم)",
                      "الوزن (طن)",
                    ];

              const headerRow = annualWs.getRow(currentRow);
              headerRow.values = headers;
              headerRow.font = { bold: true };
              headerRow.eachCell((cell) => {
                cell.border = {
                  top: { style: "thin" },
                  left: { style: "thin" },
                  bottom: { style: "thin" },
                  right: { style: "thin" },
                };
                cell.alignment = { horizontal: "center", vertical: "middle" };
              });
              currentRow++;

              let groupWeight = 0;
              let groupCount = 0;

              items.forEach((item: any, iIdx: number) => {
                const w = isWeightTable ? Number(item.weight) || 0 : 0;
                const c = !isWeightTable
                  ? Number(item.packageCount || item.weight) || 0
                  : 0;
                groupWeight += w;
                groupCount += c;

                const dataRow = annualWs.getRow(currentRow++);
                if (selectedSector === ConsignmentType.VETERINARY) {
                  dataRow.values = [
                    iIdx + 1,
                    item.description,
                    item.hsCode || "-",
                    item.packagingUnit || (isWeightTable ? "كجم" : "رأس"),
                    isWeightTable
                      ? item.weight
                      : item.packageCount || item.weight,
                    isWeightTable ? (item.weight / 1000).toFixed(3) : "",
                    Array.from(item.originsSet || []).join(", "),
                    Array.from(item.importersSet || []).join(", "),
                    "",
                  ];
                } else {
                  dataRow.values = [
                    iIdx + 1,
                    item.description,
                    item.commodityGroup || "-",
                    Array.from(item.exportersSet || []).join(", "),
                    Array.from(item.originsSet || []).join(", "),
                    Array.from(item.importersSet || []).join(", "),
                    item.packagingUnit || "-",
                    w,
                    (w / 1000).toFixed(3),
                  ];
                }
                dataRow.eachCell((cell) => {
                  cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                  };
                  cell.alignment = { horizontal: "center", vertical: "middle" };
                });
              });

              // Total row for group
              const totalRow = annualWs.getRow(currentRow++);
              if (selectedSector === ConsignmentType.VETERINARY) {
                totalRow.values = [
                  "",
                  "إجمالي المجموعة",
                  "",
                  "",
                  isWeightTable ? groupWeight : groupCount,
                  isWeightTable ? (groupWeight / 1000).toFixed(3) : "",
                  "",
                  "",
                  "",
                ];
              } else {
                totalRow.values = [
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "إجمالي المجموعة",
                  groupWeight,
                  (groupWeight / 1000).toFixed(3),
                ];
              }
              totalRow.font = { bold: true };
              totalRow.eachCell((cell, colNumber) => {
                cell.border = {
                  top: { style: "thin" },
                  left: { style: "thin" },
                  bottom: { style: "thin" },
                  right: { style: "thin" },
                };
                cell.alignment = { horizontal: "center", vertical: "middle" };
                if (
                  colNumber === 2 &&
                  selectedSector === ConsignmentType.VETERINARY
                )
                  cell.fill = {
                    type: "pattern",
                    pattern: "solid",
                    fgColor: { argb: "FFE2E8F0" },
                  };
              });

              summaryData.push({
                group: groupName,
                totalWeight: groupWeight,
                totalCount: groupCount,
                isWeight: isWeightTable,
              });
              currentRow++;
            });

            // Summary Table for Direction
            annualWs.mergeCells(`A${currentRow}:E${currentRow}`);
            const summaryTitleCell = annualWs.getCell(`A${currentRow}`);
            summaryTitleCell.value = `ملخص ${dirTitle}`;
            summaryTitleCell.font = { bold: true, size: 12 };
            summaryTitleCell.alignment = {
              horizontal: "center",
              vertical: "middle",
            };
            currentRow++;

            const summaryHeaders = [
              "م",
              "المجموعة السلعية",
              "العدد",
              "الوزن (كجم)",
              "الوزن (طن)",
            ];
            const sHeaderRow = annualWs.getRow(currentRow++);
            sHeaderRow.values = summaryHeaders;
            sHeaderRow.font = { bold: true };
            sHeaderRow.eachCell((cell) => {
              cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
              };
              cell.alignment = { horizontal: "center", vertical: "middle" };
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFF1F5F9" },
              };
            });

            summaryData.forEach((s, idx) => {
              const sRow = annualWs.getRow(currentRow++);
              sRow.values = [
                idx + 1,
                s.group,
                s.isWeight ? "-" : s.totalCount,
                s.isWeight ? s.totalWeight : "-",
                s.isWeight ? (s.totalWeight / 1000).toFixed(3) : "-",
              ];
              sRow.eachCell((cell) => {
                cell.border = {
                  top: { style: "thin" },
                  left: { style: "thin" },
                  bottom: { style: "thin" },
                  right: { style: "thin" },
                };
                cell.alignment = { horizontal: "center", vertical: "middle" };
              });
            });
            currentRow += 2;
          },
        );
        if (selectedSector === ConsignmentType.VETERINARY) {
          annualWs.columns = [
            { width: 5 },
            { width: 30 },
            { width: 15 },
            { width: 10 },
            { width: 15 },
            { width: 15 },
            { width: 20 },
            { width: 20 },
            { width: 15 },
          ];
        } else {
          annualWs.columns = [
            { width: 5 },
            { width: 30 },
            { width: 15 },
            { width: 20 },
            { width: 20 },
            { width: 20 },
            { width: 10 },
            { width: 15 },
            { width: 15 },
          ];
        }
      }

      // 2. Monthly Sheets
      const monthNames = [
        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر",
      ];
      commodityReportData.months.forEach((monthName) => {
        const mData = commodityReportData.monthlyCommodityData[monthName];
        if (!mData) return;

        const monthWs = workbook.addWorksheet(monthName);
        monthWs.views = [{ rightToLeft: true }];

        monthWs.mergeCells("D2:I3");
        const mTitle = monthWs.getCell("D2");
        mTitle.value = `التقرير الرقابي والإحصائي للعمليات التشغيلية - ${monthName}`;
        mTitle.font = { name: "Arial", size: 18, bold: true };
        mTitle.alignment = { vertical: "middle", horizontal: "center" };

        if (
          selectedSector === ConsignmentType.VETERINARY ||
          selectedSector === ConsignmentType.AGRICULTURAL
        ) {
          let currentRow = 6;
          const monthIdx = monthNames.indexOf(monthName);
          const monthData = filteredData.filter(
            (c) => new Date(c.arrivalDate).getMonth() === monthIdx,
          );
          const grouped = commodityReportData.monthlyCommodityData[monthName];

          if (grouped && grouped.dirGroups) {
            [
              ConsignmentDirection.INBOUND,
              ConsignmentDirection.OUTBOUND,
            ].forEach((dir) => {
              const dirTitle =
                dir === ConsignmentDirection.INBOUND
                  ? "أولاً: الواردات"
                  : "ثانياً: الصادرات";
              monthWs.mergeCells(`A${currentRow}:I${currentRow}`);
              const dirCell = monthWs.getCell(`A${currentRow}`);
              dirCell.value = dirTitle;
              dirCell.font = {
                bold: true,
                size: 14,
                color: { argb: "FFFFFFFF" },
              };
              dirCell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: {
                  argb:
                    dir === ConsignmentDirection.INBOUND
                      ? "FFDC2626"
                      : "FF059669",
                },
              };
              dirCell.alignment = { horizontal: "center", vertical: "middle" };
              currentRow += 2;

              const groups = Object.keys(grouped.dirGroups[dir]).sort(
                (a, b) => {
                  if (selectedSector === ConsignmentType.VETERINARY) {
                    const aIdx = VET_SUMMARY_CATEGORIES.findIndex(
                      (c) => c.title === a,
                    );
                    const bIdx = VET_SUMMARY_CATEGORIES.findIndex(
                      (c) => c.title === b,
                    );
                    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                    if (aIdx !== -1) return -1;
                    if (bIdx !== -1) return 1;
                  }
                  return a.localeCompare(b, "ar");
                },
              );

              const summaryData: {
                group: string;
                totalWeight: number;
                totalCount: number;
                isWeight: boolean;
              }[] = [];

              groups.forEach((groupName) => {
                const items = grouped.dirGroups[dir][groupName] || [];
                if (items.length === 0) return;

                monthWs.mergeCells(`A${currentRow}:I${currentRow}`);
                const catCell = monthWs.getCell(`A${currentRow}`);
                catCell.value = groupName;
                catCell.font = { bold: true };
                catCell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFF1F5F9" },
                };
                catCell.alignment = { horizontal: "right", vertical: "middle" };
                currentRow++;

                const isWeightTable =
                  selectedSector === ConsignmentType.VETERINARY
                    ? isWeightGroup(groupName)
                    : true;
                const headers =
                  selectedSector === ConsignmentType.VETERINARY
                    ? [
                        "م",
                        "نوع الحيوان / المنتج",
                        "الرمز المنسق",
                        "الوحدة",
                        isWeightTable ? "الوزن الصافي (كجم)" : "العدد",
                        isWeightTable ? "الوزن بالطن" : "",
                        "الدول",
                        "الشركات",
                        "ملاحظات",
                      ]
                    : [
                        "م",
                        "السلعة",
                        "المجموعة السلعية",
                        "المصدر",
                        "المنشأ",
                        "المستورد",
                        "الوحدة",
                        "الوزن (كجم)",
                        "الوزن (طن)",
                      ];

                const headerRow = monthWs.getRow(currentRow);
                headerRow.values = headers;
                headerRow.font = { bold: true };
                headerRow.eachCell((cell) => {
                  cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                  };
                  cell.alignment = { horizontal: "center", vertical: "middle" };
                });
                currentRow++;

                let groupWeight = 0;
                let groupCount = 0;

                items.forEach((item: any, iIdx: number) => {
                  const w = isWeightTable ? Number(item.weight) || 0 : 0;
                  const c = !isWeightTable
                    ? Number(item.packageCount || item.weight) || 0
                    : 0;
                  groupWeight += w;
                  groupCount += c;

                  const dataRow = monthWs.getRow(currentRow++);
                  if (selectedSector === ConsignmentType.VETERINARY) {
                    dataRow.values = [
                      iIdx + 1,
                      item.description,
                      item.hsCode || "-",
                      item.packagingUnit || (isWeightTable ? "كجم" : "رأس"),
                      isWeightTable
                        ? item.weight
                        : item.packageCount || item.weight,
                      isWeightTable ? (item.weight / 1000).toFixed(3) : "",
                      Array.from(item.originsSet || []).join(", "),
                      Array.from(item.importersSet || []).join(", "),
                      "",
                    ];
                  } else {
                    dataRow.values = [
                      iIdx + 1,
                      item.description,
                      item.commodityGroup || "-",
                      Array.from(item.exportersSet || []).join(", "),
                      Array.from(item.originsSet || []).join(", "),
                      Array.from(item.importersSet || []).join(", "),
                      item.packagingUnit || "-",
                      w,
                      (w / 1000).toFixed(3),
                    ];
                  }
                  dataRow.eachCell((cell) => {
                    cell.border = {
                      top: { style: "thin" },
                      left: { style: "thin" },
                      bottom: { style: "thin" },
                      right: { style: "thin" },
                    };
                    cell.alignment = {
                      horizontal: "center",
                      vertical: "middle",
                    };
                  });
                });

                // Total row for group
                const totalRow = monthWs.getRow(currentRow++);
                if (selectedSector === ConsignmentType.VETERINARY) {
                  totalRow.values = [
                    "",
                    "إجمالي المجموعة",
                    "",
                    "",
                    isWeightTable ? groupWeight : groupCount,
                    isWeightTable ? (groupWeight / 1000).toFixed(3) : "",
                    "",
                    "",
                    "",
                  ];
                } else {
                  totalRow.values = [
                    "",
                    "",
                    "",
                    "",
                    "",
                    "",
                    "إجمالي المجموعة",
                    groupWeight,
                    (groupWeight / 1000).toFixed(3),
                  ];
                }
                totalRow.font = { bold: true };
                totalRow.eachCell((cell, colNumber) => {
                  cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                  };
                  cell.alignment = { horizontal: "center", vertical: "middle" };
                  if (
                    colNumber === 2 &&
                    selectedSector === ConsignmentType.VETERINARY
                  )
                    cell.fill = {
                      type: "pattern",
                      pattern: "solid",
                      fgColor: { argb: "FFE2E8F0" },
                    };
                });

                summaryData.push({
                  group: groupName,
                  totalWeight: groupWeight,
                  totalCount: groupCount,
                  isWeight: isWeightTable,
                });
                currentRow++;
              });

              // Summary Table for Direction
              monthWs.mergeCells(`A${currentRow}:E${currentRow}`);
              const summaryTitleCell = monthWs.getCell(`A${currentRow}`);
              summaryTitleCell.value = `ملخص ${dirTitle}`;
              summaryTitleCell.font = { bold: true, size: 12 };
              summaryTitleCell.alignment = {
                horizontal: "center",
                vertical: "middle",
              };
              currentRow++;

              const summaryHeaders = [
                "م",
                "المجموعة السلعية",
                "العدد",
                "الوزن (كجم)",
                "الوزن (طن)",
              ];
              const sHeaderRow = monthWs.getRow(currentRow++);
              sHeaderRow.values = summaryHeaders;
              sHeaderRow.font = { bold: true };
              sHeaderRow.eachCell((cell) => {
                cell.border = {
                  top: { style: "thin" },
                  left: { style: "thin" },
                  bottom: { style: "thin" },
                  right: { style: "thin" },
                };
                cell.alignment = { horizontal: "center", vertical: "middle" };
                cell.fill = {
                  type: "pattern",
                  pattern: "solid",
                  fgColor: { argb: "FFF1F5F9" },
                };
              });

              summaryData.forEach((s, idx) => {
                const sRow = monthWs.getRow(currentRow++);
                sRow.values = [
                  idx + 1,
                  s.group,
                  s.isWeight ? "-" : s.totalCount,
                  s.isWeight ? s.totalWeight : "-",
                  s.isWeight ? (s.totalWeight / 1000).toFixed(3) : "-",
                ];
                sRow.eachCell((cell) => {
                  cell.border = {
                    top: { style: "thin" },
                    left: { style: "thin" },
                    bottom: { style: "thin" },
                    right: { style: "thin" },
                  };
                  cell.alignment = { horizontal: "center", vertical: "middle" };
                });
              });
              currentRow += 2;
            });
          }
          if (selectedSector === ConsignmentType.VETERINARY) {
            monthWs.columns = [
              { width: 5 },
              { width: 30 },
              { width: 15 },
              { width: 10 },
              { width: 15 },
              { width: 15 },
              { width: 20 },
              { width: 20 },
              { width: 15 },
            ];
          } else {
            monthWs.columns = [
              { width: 5 },
              { width: 30 },
              { width: 15 },
              { width: 20 },
              { width: 20 },
              { width: 20 },
              { width: 10 },
              { width: 15 },
              { width: 15 },
            ];
          }
        }
      });
    } else if (reportType === "SUMMARY" && selectedSector === ConsignmentType.AGRICULTURAL) {
      [ConsignmentDirection.INBOUND, ConsignmentDirection.OUTBOUND].forEach((dir) => {
        const dirData = filteredData.filter((c) => getConsignmentDirection(c) === dir);
        if (dirData.length === 0) return;

        const dirTitleHeader = dir === ConsignmentDirection.INBOUND ? "الواردات" : "الصادرات";
        const sheetName = `الملخص الزراعي - ${dirTitleHeader}`;
        const ws = workbook.addWorksheet(sheetName);
        ws.views = [{ rightToLeft: true }];

        if (logoBase64) {
          try {
            const imageId = workbook.addImage({
              base64: logoBase64,
              extension: "png",
            });
            ws.addImage(imageId, {
              tl: { col: 0, row: 0 },
              ext: { width: 120, height: 50 },
            });
          } catch (e) {
            console.warn("Logo error", e);
          }
        }

        ws.mergeCells("D2:N3");
        const aTitle = ws.getCell("D2");
        aTitle.value = `الملخص الإحصائي لقطاع الحجر الزراعي - ${dirTitleHeader}`;
        aTitle.font = { name: "Arial", size: 18, bold: true };
        aTitle.alignment = { vertical: "middle", horizontal: "center" };

        ws.mergeCells("D4:N5");
        const infoCell = ws.getCell("D4");
        infoCell.value = `الفترة: من ${startDate} إلى ${endDate}`;
        infoCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FF475569" } };
        infoCell.alignment = { vertical: "middle", horizontal: "center" };

        let currentRow = 7;

        const headers = [
          "التاريخ",
          "رقم البيان",
          "المنفذ",
          "الشركة المستوردة",
          "المجموعة",
          "السلعة",
          "الوزن (كجم)",
          "الوزن (طن)",
          "بلد المنشأ",
          "نوع الفحص",
          "نوع التحليل المخبري",
          "نتيجة الفحص",
          "سبب عدم المطابقة",
          "تفاصيل عدم المطابقة",
          "الإجراء النهائي",
          "الرسوم (ر.ع)",
          "المفتش",
          "ملاحظات"
        ];

        const headerRow = ws.getRow(currentRow++);
        headerRow.values = headers;
        headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
        headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
        headerRow.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          cell.alignment = { horizontal: "center", vertical: "middle" };
        });

        dirData.flatMap((c) => {
          const items = c.items && c.items.length > 0 ? c.items : [{
            description: "شحنة عامة", weight: c.totalWeight, origin: c.shippingCountry, commodityGroup: c.commodityGroup
          }];
          return items.map((item) => {
            const labAnalysis = c.samples?.flatMap((s) => s.labAnalysisType || []).join(", ") || "-";
            const labResult = c.samples?.map((s) => s.result === "Compliant" ? "مطابق" : s.result === "NonCompliant" ? "غير مطابق" : "قيد الإجراء").join(" | ") || "-";

            const rowData = [
              c.arrivalDate,
              c.bayanNumber,
              c.port,
              c.importer,
              item.commodityGroup || "-",
              item.description,
              Number(item.weight || 0),
              (Number(item.weight || 0) / 1000).toFixed(3),
              item.origin || "-",
              c.inspectionType || "-",
              labAnalysis,
              labResult,
              c.rejectionReason || "-",
              c.rejectionDetails || "-",
              c.technicalAction || "-",
              Number(c.fees || 0),
              c.inspectorName || "-",
              c.remarks || "-"
            ];

            const dataRow = ws.getRow(currentRow++);
            dataRow.values = rowData;
            dataRow.eachCell((cell) => {
              cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
              };
              cell.alignment = { horizontal: "center", vertical: "middle" };
            });
          });
        });

        ws.columns = [
          { width: 12 }, { width: 15 }, { width: 15 }, { width: 25 },
          { width: 15 }, { width: 20 }, { width: 12 }, { width: 12 },
          { width: 12 }, { width: 15 }, { width: 20 }, { width: 15 },
          { width: 20 }, { width: 20 }, { width: 15 }, { width: 12 },
          { width: 15 }, { width: 20 }
        ];
      });
    } else if (reportType === "FINANCIAL") {
      const dataToExport = filteredData.map((c) => ({
        "الرقم المرجعي": c.id,
        البيان: c.bayanNumber,
        التاريخ: c.arrivalDate,
        المستورد: c.importer,
        "الرسوم (ر.ع)": c.fees,
        "حالة الدفع":
          c.fees > 0 ? (c.status === "Approved" ? "مدفوع" : "معلق") : "معفى",
      }));
      addStyledSheet("التقرير المالي", dataToExport);
    } else if (reportType === "AUDIT") {
      const dataToExport: any[] = [];
      filteredData.forEach((c) => {
        if (c.auditLog && c.auditLog.length > 0) {
          c.auditLog.forEach((log) => {
            dataToExport.push({
              "رقم الإرسالية": c.id,
              "رقم البيان": c.bayanNumber || "-",
              المستورد: c.importer,
              "الوقت والتاريخ": safeFormatDateTime(log.timestamp),
              المستخدم: log.user,
              الإجراء: log.action,
              التفاصيل: log.details || "-",
              "تغييرات الحقول": log.changes
                ? log.changes
                    .map(
                      (ch) =>
                        `${ch.label || ch.field}: ${typeof ch.oldValue === "object" ? JSON.stringify(ch.oldValue) : ch.oldValue} -> ${typeof ch.newValue === "object" ? JSON.stringify(ch.newValue) : ch.newValue}`,
                    )
                    .join(" | ")
                : "-",
            });
          });
        }
      });
      addStyledSheet("تقرير سجل التتبع", dataToExport);
    } else if (reportType === "LAB") {
      const dataToExport = processedLabSamples.map((s) => {
        const row: any = {};
        selectedLabColumnKeys.forEach((key) => {
          const colDef = AVAILABLE_LAB_COLUMNS.find((col) => col.key === key);
          if (colDef) {
            row[colDef.label] = getLabCellValue(s, key);
          }
        });
        return row;
      });
      addStyledSheet("تقرير العينات المفصل", dataToExport);
    } else {
      const dataToExport = filteredData.map((c) => {
        const row: any = {};
        selectedColumnKeys.forEach((key) => {
          const colDef = AVAILABLE_COLUMNS.find((col) => col.key === key);
          if (colDef) {
            row[colDef.label] = getCellValue(c, key);
          }
        });
        return row;
      });
      addStyledSheet("تقرير مفصل", dataToExport);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(
      blob,
      `تقرير_مرقاب_${reportType}_${new Date().toISOString().split("T")[0]}.xlsx`,
    );
  };

  const renderTransposedRow = (
    label: string,
    dataKey: keyof (typeof foodSafetyData)["monthlySummary"][0],
    isWeight: boolean,
    bgColor: string,
  ) => {
    if (!foodSafetyData) return null;
    const totalRaw = foodSafetyData.monthlySummary.reduce(
      (acc, curr) => acc + (Number(curr[dataKey]) || 0),
      0,
    );
    return (
      <tr className={`border border-black ${bgColor}`}>
        <td className="p-2 border border-black font-bold whitespace-nowrap text-right">
          {label}
        </td>
        {foodSafetyData.monthlySummary.map((m, i) => {
          const valRaw = Number(m[dataKey]) || 0;
          const displayVal = isWeight ? valRaw / 1000 : valRaw;
          return (
            <td key={i} className="p-2 border border-black font-mono">
              {" "}
              {valRaw > 0
                ? isWeight
                  ? displayVal.toLocaleString(undefined, {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    })
                  : displayVal.toLocaleString()
                : "-"}{" "}
            </td>
          );
        })}
        <td className="p-2 border border-black font-black bg-slate-200">
          {" "}
          {isWeight
            ? (totalRaw / 1000).toLocaleString(undefined, {
                minimumFractionDigits: 3,
                maximumFractionDigits: 3,
              })
            : totalRaw.toLocaleString()}{" "}
        </td>
      </tr>
    );
  };

  const toggleColumnKey = (key: string) => {
    if (reportType === "LAB") {
      setSelectedLabColumnKeys((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    } else {
      setSelectedColumnKeys((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    }
  };

  const moveColumn = (key: string, direction: "forward" | "backward") => {
    if (reportType === "LAB") {
      const index = selectedLabColumnKeys.indexOf(key);
      if (index === -1) return;
      const newKeys = [...selectedLabColumnKeys];
      if (direction === "backward" && index > 0) {
        [newKeys[index - 1], newKeys[index]] = [
          newKeys[index],
          newKeys[index - 1],
        ];
      } else if (direction === "forward" && index < newKeys.length - 1) {
        [newKeys[index + 1], newKeys[index]] = [
          newKeys[index],
          newKeys[index + 1],
        ];
      }
      setSelectedLabColumnKeys(newKeys);
    } else {
      const index = selectedColumnKeys.indexOf(key);
      if (index === -1) return;
      const newKeys = [...selectedColumnKeys];
      if (direction === "backward" && index > 0) {
        [newKeys[index - 1], newKeys[index]] = [
          newKeys[index],
          newKeys[index - 1],
        ];
      } else if (direction === "forward" && index < newKeys.length - 1) {
        [newKeys[index + 1], newKeys[index]] = [
          newKeys[index],
          newKeys[index + 1],
        ];
      }
      setSelectedColumnKeys(newKeys);
    }
  };

  const labStats = useMemo(() => {
    if (reportType !== "LAB") return null;
    const total = processedLabSamples.length;
    const compliant = processedLabSamples.filter(
      (s) => s.result === "Compliant",
    ).length;
    const nonCompliant = processedLabSamples.filter(
      (s) => s.result === "NonCompliant",
    ).length;
    const pending = processedLabSamples.filter(
      (s) => s.result === "Pending",
    ).length;
    return { total, compliant, nonCompliant, pending };
  }, [processedLabSamples, reportType]);

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-2xl shadow-sm">
              {" "}
              <i className="fas fa-chart-bar"></i>{" "}
            </div>
            <div>
              <h3 className="font-black text-xl text-slate-800">
                التقارير والإحصائيات
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                استخراج تقارير دورية ومخصصة
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {(reportType === "DETAILED" ||
              reportType === "CUSTOM" ||
              reportType === "LAB") && (
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className={`px-6 py-3 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-2 ${showColumnSelector ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {" "}
                <i className="fas fa-columns"></i> تخصيص الحقول{" "}
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
            >
              {" "}
              <i className="fas fa-file-excel"></i> تصدير Excel{" "}
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg hover:bg-red-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {" "}
              {isExportingPdf ? (
                <i className="fas fa-circle-notch fa-spin"></i>
              ) : (
                <i className="fas fa-file-pdf"></i>
              )}{" "}
              تصدير PDF{" "}
            </button>
            <button
              onClick={handlePrint}
              className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-lg hover:bg-slate-900 transition-all flex items-center gap-2"
            >
              {" "}
              <i className="fas fa-print"></i> طباعة{" "}
            </button>
          </div>
        </div>

        {showColumnSelector &&
          (reportType === "DETAILED" ||
            reportType === "CUSTOM" ||
            reportType === "LAB") && (
            <div className="mb-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-200 animate-fade-in space-y-6">
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase mb-3 flex items-center gap-2">
                  {" "}
                  <i className="fas fa-check-square"></i> تحديد الحقول{" "}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {(reportType === "LAB"
                    ? AVAILABLE_LAB_COLUMNS
                    : AVAILABLE_COLUMNS
                  ).map((col) => {
                    const isSelected =
                      reportType === "LAB"
                        ? selectedLabColumnKeys.includes(col.key)
                        : selectedColumnKeys.includes(col.key);
                    return (
                      <label
                        key={col.key}
                        className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer border transition-all ${isSelected ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm" : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"}`}
                      >
                        {" "}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleColumnKey(col.key)}
                          className="w-4 h-4 accent-indigo-600 rounded"
                        />{" "}
                        <span className="text-[10px] font-bold">
                          {col.label}
                        </span>{" "}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="pt-6 border-t border-slate-200">
                <h4 className="text-xs font-black text-slate-500 uppercase mb-3 flex items-center gap-2">
                  {" "}
                  <i className="fas fa-sort"></i> ترتيب العرض (من اليمين
                  لليسار){" "}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(reportType === "LAB"
                    ? selectedLabColumnKeys
                    : selectedColumnKeys
                  ).map((key, idx) => {
                    const colDef = (
                      reportType === "LAB"
                        ? AVAILABLE_LAB_COLUMNS
                        : AVAILABLE_COLUMNS
                    ).find((c) => c.key === key);
                    const keysLength =
                      reportType === "LAB"
                        ? selectedLabColumnKeys.length
                        : selectedColumnKeys.length;
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm animate-scale-in"
                      >
                        {" "}
                        <span className="text-[10px] font-bold text-slate-700">
                          {colDef?.label || key}
                        </span>{" "}
                        <div className="flex gap-1 border-r border-slate-100 pr-2 mr-1">
                          {" "}
                          <button
                            onClick={() => moveColumn(key, "backward")}
                            disabled={idx === 0}
                            className="w-5 h-5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-30 flex items-center justify-center"
                          >
                            <i className="fas fa-chevron-right text-[8px]"></i>
                          </button>{" "}
                          <button
                            onClick={() => moveColumn(key, "forward")}
                            disabled={idx === keysLength - 1}
                            className="w-5 h-5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-30 flex items-center justify-center"
                          >
                            <i className="fas fa-chevron-left text-[8px]"></i>
                          </button>{" "}
                        </div>{" "}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        <div
          className={`grid grid-cols-1 sm:grid-cols-2 ${currentUser.role === "ADMIN" ? "lg:grid-cols-6" : "lg:grid-cols-5"} gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200`}
        >
          {currentUser.role === "ADMIN" && (
            <div className="space-y-2">
              {" "}
              <label className="text-[10px] font-black text-slate-500 uppercase">
                المنفذ
              </label>{" "}
              <select
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
              >
                {" "}
                <option value="ALL">جميع المنافذ</option>{" "}
                {ports.map((p) => (
                  <option key={p.id} value={p.name}>
                    {p.name}
                  </option>
                ))}{" "}
              </select>{" "}
            </div>
          )}
          <div className="space-y-2">
            {" "}
            <label className="text-[10px] font-black text-slate-500 uppercase">
              القطاع
            </label>{" "}
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
            >
              {" "}
              {currentUser.role === "ADMIN" && (
                <option value="ALL">جميع القطاعات</option>
              )}{" "}
              {availableSectors.map((t) => (
                <option key={t} value={t}>
                  {CONSIGNMENT_LABELS[t]}
                </option>
              ))}{" "}
            </select>{" "}
          </div>
          <div className="space-y-2">
            {" "}
            <label className="text-[10px] font-black text-slate-500 uppercase">
              من تاريخ
            </label>{" "}
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
            />{" "}
          </div>
          <div className="space-y-2">
            {" "}
            <label className="text-[10px] font-black text-slate-500 uppercase">
              إلى تاريخ
            </label>{" "}
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
            />{" "}
          </div>
          <div className="space-y-2">
            {" "}
            <label className="text-[10px] font-black text-slate-500 uppercase">
              البيانات المتكررة
            </label>{" "}
            <select
              value={bayanFilter}
              onChange={(e) => setBayanFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
            >
              {" "}
              <option value="ALL">الكل</option>{" "}
              <option value="UNIQUE">بدون تكرار</option>{" "}
              <option value="DUPLICATES">المكررة فقط</option>{" "}
            </select>{" "}
          </div>
          <div className="space-y-2">
            {" "}
            <label className="text-[10px] font-black text-slate-500 uppercase">
              نوع التقرير
            </label>{" "}
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
            >
              {" "}
              <option value="SUMMARY">ملخص إحصائي</option>{" "}
              <option value="DETAILED">كشف تفصيلي (تخصيص الحقول)</option>{" "}
              <option value="CUSTOM">تقرير مخصص (فلترة متقدمة)</option>{" "}
              <option value="COMPARISON">تقرير مقارنة الفترات</option>{" "}
              <option value="LOGISTICS">تقرير الإرساليات المحولة</option>{" "}
              <option value="INSPECTOR">تقرير المفتشين</option>{" "}
              <option value="FINANCIAL">تقرير مالي</option>{" "}
              <option value="LAB">تقرير العينات والمختبر (تفصيلي)</option>{" "}
              <option value="AUDIT">
                تقرير سجل التتبع (التغييرات والإجراءات)
              </option>{" "}
            </select>{" "}
          </div>
          {reportType === "COMPARISON" && (
            <div
              className={`space-y-2 ${currentUser.role === "ADMIN" ? "md:col-span-5" : "md:col-span-4"} grid grid-cols-2 gap-4 animate-fade-in pt-2 border-t border-slate-200`}
            >
              {" "}
              <div className="space-y-2">
                {" "}
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  من تاريخ (فترة المقارنة)
                </label>{" "}
                <input
                  type="date"
                  value={compareStartDate}
                  onChange={(e) => setCompareStartDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                />{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  إلى تاريخ (فترة المقارنة)
                </label>{" "}
                <input
                  type="date"
                  value={compareEndDate}
                  onChange={(e) => setCompareEndDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                />{" "}
              </div>{" "}
            </div>
          )}
          {reportType === "SUMMARY" &&
            (selectedSector === ConsignmentType.VETERINARY ||
              selectedSector === ConsignmentType.AGRICULTURAL) &&
            commodityReportData && (
              <div
                className={`space-y-2 ${currentUser.role === "ADMIN" ? "md:col-span-5" : "md:col-span-4"} animate-fade-in pt-2 border-t border-slate-200`}
              >
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  تحديد المجموعات السلعية (اختياري)
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {commodityReportData.sortedGroups.map((group) => {
                    const isSelected = selectedCommodityGroups.includes(group);
                    return (
                      <button
                        key={group}
                        onClick={() => {
                          setSelectedCommodityGroups((prev) =>
                            isSelected
                              ? prev.filter((g) => g !== group)
                              : [...prev, group],
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50"
                        }`}
                      >
                        {group}
                      </button>
                    );
                  })}
                  {selectedCommodityGroups.length > 0 && (
                    <button
                      onClick={() => setSelectedCommodityGroups([])}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      إلغاء التحديد
                    </button>
                  )}
                </div>
              </div>
            )}
          {reportType === "INSPECTOR" && (
            <div
              className={`space-y-2 ${currentUser.role === "ADMIN" ? "md:col-span-5" : "md:col-span-4"} grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-2 border-t border-slate-200`}
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  تحديد المفتش
                </label>
                <select
                  value={selectedInspector}
                  onChange={(e) => setSelectedInspector(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                >
                  <option value="ALL">الكل (ملخص شامل)</option>
                  {availableInspectors.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  حالة المعاملات
                </label>
                <select
                  value={inspectorReportStatus}
                  onChange={(e) =>
                    setInspectorReportStatus(e.target.value as any)
                  }
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                >
                  <option value="ALL">جميع الحالات</option>
                  <option value="COMPLETED">منجزة (Approved/Rejected)</option>
                  <option value="IN_PROGRESS">قيد الإجراء (Pending)</option>
                </select>
              </div>
            </div>
          )}
          {reportType === "CUSTOM" && (
            <div
              className={`space-y-4 ${currentUser.role === "ADMIN" ? "md:col-span-5" : "md:col-span-4"} animate-fade-in pt-4 border-t border-slate-200`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                  {" "}
                  <i className="fas fa-filter"></i> فلاتر التقرير المخصص (يمكن
                  اختيار أكثر من فلتر){" "}
                </h4>
                <button
                  onClick={() =>
                    setCustomFilters({
                      importer: "",
                      product: "",
                      origin: "",
                      inspector: "",
                      action: "",
                    })
                  }
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  {" "}
                  مسح الفلاتر{" "}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">
                    الشركة المستوردة
                  </label>
                  <select
                    value={customFilters.importer}
                    onChange={(e) =>
                      setCustomFilters((prev) => ({
                        ...prev,
                        importer: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    {uniqueValues.importers.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">
                    المنتج
                  </label>
                  <select
                    value={customFilters.product}
                    onChange={(e) =>
                      setCustomFilters((prev) => ({
                        ...prev,
                        product: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    {uniqueValues.products.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">
                    بلد الشحن / المنشأ
                  </label>
                  <select
                    value={customFilters.origin}
                    onChange={(e) =>
                      setCustomFilters((prev) => ({
                        ...prev,
                        origin: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    {uniqueValues.origins.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">
                    المفتش
                  </label>
                  <select
                    value={customFilters.inspector}
                    onChange={(e) =>
                      setCustomFilters((prev) => ({
                        ...prev,
                        inspector: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    {uniqueValues.inspectors.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">
                    الإجراء الفني
                  </label>
                  <select
                    value={customFilters.action}
                    onChange={(e) =>
                      setCustomFilters((prev) => ({
                        ...prev,
                        action: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="">الكل</option>
                    {uniqueValues.actions.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
          {reportType === "LAB" && (
            <div
              className={`space-y-2 ${currentUser.role === "ADMIN" ? "md:col-span-5" : "md:col-span-4"} grid grid-cols-2 gap-4 animate-fade-in pt-2 border-t border-slate-200`}
            >
              {" "}
              <div className="space-y-2">
                {" "}
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  المختبر
                </label>{" "}
                <select
                  value={filterLab}
                  onChange={(e) => setFilterLab(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                >
                  {" "}
                  <option value="ALL">جميع المختبرات</option>{" "}
                  {labFilterOptions.labs.map((lab) => (
                    <option key={lab} value={lab}>
                      {lab}
                    </option>
                  ))}{" "}
                </select>{" "}
              </div>{" "}
              <div className="space-y-2">
                {" "}
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  نوع الفحص
                </label>{" "}
                <select
                  value={filterTestType}
                  onChange={(e) => setFilterTestType(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                >
                  {" "}
                  <option value="ALL">جميع الفحوصات</option>{" "}
                  {labFilterOptions.tests.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}{" "}
                </select>{" "}
              </div>{" "}
            </div>
          )}
          {reportType === "LOGISTICS" && (
            <div
              className={`space-y-4 ${currentUser.role === "ADMIN" ? "md:col-span-5" : "md:col-span-4"} animate-fade-in pt-4 border-t border-slate-200`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2">
                  {" "}
                  <i className="fas fa-filter"></i> فلاتر إضافية لتقرير
                  الإرساليات المحولة{" "}
                </h4>
                <button
                  onClick={() =>
                    setLogisticsFilters({
                      transferTo: "ALL",
                      status: "ALL",
                      importer: "",
                      bayanNumber: "",
                    })
                  }
                  className="text-[10px] font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-xl transition-colors"
                >
                  {" "}
                  مسح الفلاتر{" "}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">
                    جهة التحويل
                  </label>
                  <select
                    value={logisticsFilters.transferTo}
                    onChange={(e) =>
                      setLogisticsFilters((prev) => ({
                        ...prev,
                        transferTo: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">جميع الجهات</option>
                    {logisticsOptions.transferDestinations.map((dest) => (
                      <option key={dest} value={dest}>
                        {dest}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">
                    الحالة النهائية
                  </label>
                  <select
                    value={logisticsFilters.status}
                    onChange={(e) =>
                      setLogisticsFilters((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">جميع الحالات</option>
                    <option value="Approved">منجزة (مقبول)</option>
                    <option value="Rejected">منجزة (مرفوض)</option>
                    <option value="Pending">قيد الإجراء</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">
                    اسم المستورد
                  </label>
                  <input
                    type="text"
                    placeholder="بحث باسم المستورد..."
                    value={logisticsFilters.importer}
                    onChange={(e) =>
                      setLogisticsFilters((prev) => ({
                        ...prev,
                        importer: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase">
                    رقم البيان
                  </label>
                  <input
                    type="text"
                    placeholder="بحث برقم البيان..."
                    value={logisticsFilters.bayanNumber}
                    onChange={(e) =>
                      setLogisticsFilters((prev) => ({
                        ...prev,
                        bayanNumber: e.target.value,
                      }))
                    }
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        ref={printRef}
        dir="rtl"
        style={{ fontFamily: "'Tajawal', sans-serif" }}
        className={`bg-white p-8 rounded-[1rem] shadow-xl border border-slate-200 mx-auto print:shadow-none print:border-none print:w-full print:max-w-none print:m-0 ${isExportingPdf ? "w-[277mm] max-w-none min-h-0 pdf-export-mode" : "min-h-[210mm] max-w-[297mm] landscape:w-[297mm]"}`}
      >
        <div className="border-b-2 border-slate-800 pb-6 mb-8 flex justify-between items-end">
          <div className="text-right">
            <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">
              التقرير الرقابي والإحصائي للعمليات التشغيلية
            </h1>
            <p className="text-sm font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg inline-block">
              {reportType === "SUMMARY"
                ? "الملخص الإحصائي السنوي/الدوري"
                : reportType === "DETAILED"
                  ? "الكشف التفصيلي للعمليات"
                  : reportType === "CUSTOM"
                    ? `تقرير مخصص (${[customFilters.importer, customFilters.product, customFilters.origin, customFilters.inspector, customFilters.action].filter(Boolean).join(" | ") || "الكل"})`
                    : reportType === "COMPARISON"
                      ? "تقرير مقارنة مؤشرات الأداء"
                      : reportType === "LOGISTICS"
                        ? `تقرير رصد الإرساليات المحولة (${
                            [
                              logisticsFilters.transferTo !== "ALL"
                                ? `جهة التحويل: ${logisticsFilters.transferTo}`
                                : null,
                              logisticsFilters.status !== "ALL"
                                ? `الحالة: ${logisticsFilters.status === "Approved" ? "مقبول" : logisticsFilters.status === "Rejected" ? "مرفوض" : "قيد الإجراء"}`
                                : null,
                              logisticsFilters.importer
                                ? `المستورد: ${logisticsFilters.importer}`
                                : null,
                              logisticsFilters.bayanNumber
                                ? `البيان: ${logisticsFilters.bayanNumber}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" | ") || "الكل"
                          })`
                        : reportType === "INSPECTOR"
                          ? "تقرير تقييم أداء الكادر التفتيشي"
                          : reportType === "FINANCIAL"
                            ? "التقرير المالي والإيرادات"
                            : reportType === "AUDIT"
                              ? "تقرير سجل التتبع للإرساليات المحددة"
                              : "تقرير نتائج الفحوصات المخبرية"}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  القطاع:
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {(currentUser?.role === 'LAB_TECH' || currentUser?.role === 'LAB_DELEGATE') && currentUser?.assignedLabId ? (
                    laboratories.find(l => l.id === currentUser.assignedLabId)?.name || 'المختبر المعين'
                  ) : (
                    selectedSector === "ALL"
                      ? "جميع القطاعات"
                      : CONSIGNMENT_LABELS[selectedSector]
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  المنفذ:
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {selectedPort === "ALL" ? "جميع المنافذ" : selectedPort}
                </span>
              </div>
              <div className="flex items-center gap-2 border-r border-slate-200 pr-6">
                <span className="text-[10px] font-black text-slate-400 uppercase">
                  الفترة:
                </span>
                <span className="text-xs font-bold text-slate-700">
                  من {startDate} إلى {endDate}
                </span>
              </div>
            </div>
          </div>
          <div className="text-left flex items-center gap-4">
            <img
              referrerPolicy="no-referrer"
              src={
                logoBase64 ||
                "https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg"
              }
              alt="Logo"
              className={`object-contain ${isExportingPdf ? "h-10" : "h-16"} print:h-10`}
              crossOrigin="anonymous"
            />
            <div className="h-12 w-px bg-slate-200 mx-2 hidden md:block"></div>
            <div className="flex flex-col items-center">
              {mirqabLogoBase64 ? (
                <img
                  referrerPolicy="no-referrer"
                  src={mirqabLogoBase64}
                  alt="Mirqab Logo"
                  className={`object-contain ${isExportingPdf ? "h-10" : "h-14"} print:h-10`}
                />
              ) : (
                <div className="bg-red-600 text-white p-1 rounded font-black text-[8px]">
                  MIRQAB
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- REPORT CONTENT SWITCHER --- */}

        {/* 0. LOGISTICS REPORT (NEW) */}
        {reportType === "LOGISTICS" && (
          <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex justify-between items-center mb-4">
              <span className="text-sm font-black text-indigo-800">
                إجمالي الإرساليات المحولة للفترة
              </span>
              <span className="text-2xl font-black text-slate-800">
                {logisticsReportList.length} شحنة
              </span>
            </div>
            <div className={`${isExportingPdf ? "" : "overflow-x-auto"}`}>
              <table className="w-full text-right border border-black text-[9px]">
                <thead className="bg-slate-800 text-white font-black">
                  <tr>
                    <th className="p-2 border border-black">رقم البيان</th>
                    <th className="p-2 border border-black">رقم التصريح</th>
                    <th className="p-2 border border-black">المستورد</th>
                    <th className="p-2 border border-black">المسار اللوجستي</th>
                    <th className="p-2 border border-black">
                      تاريخ الوصول للمحطة
                    </th>
                    <th className="p-2 border border-black">الموظف المستلم</th>
                    <th className="p-2 border border-black">الحالة النهائية</th>
                    <th className="p-2 border border-black">المفتش</th>
                  </tr>
                </thead>
                <tbody>
                  {logisticsReportList.map((c, idx) => (
                    <tr
                      key={`${c.id}-${idx}`}
                      className="border border-black hover:bg-slate-50"
                    >
                      <td className="p-2 border border-black font-mono font-bold">
                        {c.bayanNumber}
                      </td>
                      <td className="p-2 border border-black font-mono font-bold text-emerald-600">
                        {c.permitNumber || "-"}
                      </td>
                      <td className="p-2 border border-black font-bold">
                        {c.importer}
                      </td>
                      <td className="p-2 border border-black">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-500">المنفذ</span>
                          <i className="fas fa-long-arrow-alt-left text-indigo-500"></i>
                          <span className="font-bold text-indigo-700">
                            {c.transferTo || "جهة غير محددة"}
                          </span>
                        </div>
                      </td>
                      <td className="p-2 border border-black font-mono">
                        {c.logisticsArrivalDate
                          ? new Date(c.logisticsArrivalDate).toLocaleDateString(
                              "ar-OM",
                            )
                          : "بانتظار الوصول"}
                      </td>
                      <td className="p-2 border border-black">
                        {c.logisticsReceiverName || "-"}
                      </td>
                      <td className="p-2 border border-black">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${c.status === "Approved" ? "text-green-700 bg-green-50" : c.status === "Rejected" ? "text-red-700 bg-red-50" : "text-amber-700 bg-amber-50"}`}
                        >
                          {c.status === "Approved"
                            ? "منجزة (مقبول)"
                            : c.status === "Rejected"
                              ? "منجزة (مرفوض)"
                              : "قيد الإجراء"}
                        </span>
                      </td>
                      <td className="p-2 border border-black">
                        {c.inspectorName}
                      </td>
                    </tr>
                  ))}
                  {logisticsReportList.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="p-6 text-center text-slate-400"
                      >
                        لا توجد إرساليات محولة في الفترة المحددة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 1. INSPECTOR REPORT */}
        {reportType === "INSPECTOR" && inspectorReportData && (
          <div className="space-y-8">
            {inspectorReportData.type === "ALL" ? (
              <>
                <h3 className="font-black text-lg text-slate-800 mb-4 border-r-4 border-slate-800 pr-3">
                  ملخص أداء المفتشين
                </h3>
                {!isExportingPdf &&
                  (inspectorReportData.data as any[]).length > 0 && (
                    <div className="bg-white p-6 rounded-xl border border-slate-200 mb-8 shadow-sm">
                      <h4 className="text-sm font-black text-slate-700 mb-6 text-center">
                        أداء المفتشين
                      </h4>
                      <div className="h-80 w-full" dir="ltr">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={inspectorReportData.data as any[]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              vertical={false}
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="name"
                              tick={{
                                fill: "#64748b",
                                fontSize: 12,
                                fontWeight: "bold",
                              }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <YAxis
                              tick={{ fill: "#64748b", fontSize: 12 }}
                              axisLine={false}
                              tickLine={false}
                            />
                            <Tooltip
                              cursor={{ fill: "#f8fafc" }}
                              contentStyle={{
                                borderRadius: "12px",
                                border: "none",
                                boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                              }}
                            />
                            <Legend
                              wrapperStyle={{
                                paddingTop: "20px",
                                fontSize: "12px",
                                fontWeight: "bold",
                              }}
                            />
                            <Bar
                              dataKey="approved"
                              name="منجزة (مقبول)"
                              fill="#16a34a"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="rejected"
                              name="منجزة (مرفوض)"
                              fill="#dc2626"
                              radius={[4, 4, 0, 0]}
                            />
                            <Bar
                              dataKey="pending"
                              name="قيد الإجراء"
                              fill="#d97706"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                <div className={isExportingPdf ? "" : "overflow-x-auto"}>
                  <table className="w-full text-center text-[10px] border border-black">
                    <thead className="bg-slate-800 text-white font-black">
                      <tr>
                        <th className="p-2 border border-black w-10">#</th>
                        <th className="p-2 border border-black text-right">
                          اسم المفتش
                        </th>
                        <th className="p-2 border border-black">
                          إجمالي المعاملات
                        </th>
                        <th className="p-2 border border-black bg-green-600">
                          منجزة (مقبول)
                        </th>
                        <th className="p-2 border border-black bg-red-600">
                          منجزة (مرفوض)
                        </th>
                        <th className="p-2 border border-black bg-orange-500">
                          بانتظار المختبر
                        </th>
                        <th className="p-2 border border-black bg-amber-600">
                          قيد الإجراء
                        </th>
                        <th className="p-2 border border-black">
                          نسبة الإنجاز
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(inspectorReportData.data as any[]).map((d, idx) => {
                        const completionRate =
                          d.total > 0
                            ? Math.round(
                                ((d.approved + d.rejected) / d.total) * 100,
                              )
                            : 0;
                        return (
                          <tr
                            key={idx}
                            className="border border-black hover:bg-slate-50"
                          >
                            <td className="p-2 border border-black">
                              {idx + 1}
                            </td>
                            <td className="p-2 border border-black text-right font-bold">
                              {d.name}
                            </td>
                            <td className="p-2 border border-black font-black text-sm">
                              {d.total}
                            </td>
                            <td className="p-2 border border-black text-green-700 font-bold">
                              {d.approved}
                            </td>
                            <td className="p-2 border border-black text-red-600 font-bold">
                              {d.rejected}
                            </td>
                            <td className="p-2 border border-black text-orange-600 font-bold">
                              {d.pendingLab}
                            </td>
                            <td className="p-2 border border-black text-amber-600 font-bold">
                              {d.pending - d.pendingLab}
                            </td>
                            <td className="p-2 border border-black font-bold">
                              {completionRate}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex justify-between items-center mb-6">
                  <div>
                    {" "}
                    <p className="text-xs font-black text-slate-400 uppercase">
                      تقرير فردي
                    </p>{" "}
                    <h3 className="text-xl font-black text-slate-800">
                      {inspectorReportData.inspectorName}
                    </h3>{" "}
                  </div>
                  <div className="text-center">
                    {" "}
                    <p className="text-xs font-black text-slate-400 uppercase">
                      المعاملات
                    </p>{" "}
                    <p className="text-2xl font-black text-slate-800">
                      {(inspectorReportData.data as any[]).length}
                    </p>{" "}
                  </div>
                </div>
                <table className="w-full text-right border border-slate-200 text-[10px]">
                  <thead className="bg-slate-100 text-slate-700 font-black">
                    <tr>
                      <th className="p-2 border border-slate-300">
                        رقم البيان
                      </th>
                      <th className="p-2 border border-slate-300">
                        رقم التصريح
                      </th>
                      <th className="p-2 border border-slate-300">التاريخ</th>
                      <th className="p-2 border border-slate-300">المستورد</th>
                      <th className="p-2 border border-slate-300">الحالة</th>
                      <th className="p-2 border border-slate-300">المختبر</th>
                      <th className="p-2 border border-slate-300">
                        الإجراء الفني
                      </th>
                      <th className="p-2 border border-slate-300">ملاحظات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(inspectorReportData.data as Consignment[]).map(
                      (c, idx) => {
                        const hasPendingSamples =
                          c.hasSample &&
                          c.samples?.some((s) => s.result === "Pending");
                        const statusText =
                          c.status === "Approved"
                            ? "منجزة (مقبول)"
                            : c.status === "Rejected"
                              ? "منجزة (مرفوض)"
                              : hasPendingSamples
                                ? "بانتظار المختبر"
                                : "قيد الإجراء";
                        const statusColor =
                          c.status === "Approved"
                            ? "text-green-600"
                            : c.status === "Rejected"
                              ? "text-red-600"
                              : hasPendingSamples
                                ? "text-orange-600"
                                : "text-amber-600";

                        const labStatus = !c.hasSample
                          ? "-"
                          : hasPendingSamples
                            ? "بانتظار النتيجة"
                            : "تم الفحص";
                        const labColor = hasPendingSamples
                          ? "text-orange-600"
                          : "text-blue-600";

                        return (
                          <tr
                            key={`${c.id}-${idx}`}
                            className="border-b border-slate-200 even:bg-slate-50"
                          >
                            <td className="p-2 border-r border-slate-200 font-mono font-bold">
                              {c.bayanNumber}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-mono font-bold text-emerald-600">
                              {c.permitNumber || "-"}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-mono">
                              {c.arrivalDate}
                            </td>
                            <td className="p-2 border-r border-slate-200 truncate max-w-[200px]">
                              {c.importer}
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <span className={`font-bold ${statusColor}`}>
                                {" "}
                                {statusText}{" "}
                              </span>
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              <span className={`font-bold ${labColor}`}>
                                {" "}
                                {labStatus}{" "}
                              </span>
                            </td>
                            <td className="p-2 border-r border-slate-200">
                              {c.technicalAction}
                            </td>
                            <td className="p-2 border-r border-slate-200 text-slate-500">
                              {c.remarks}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* 2. SUMMARY REPORT (Food Safety) */}
        {reportType === "SUMMARY" &&
          selectedSector === ConsignmentType.FOOD_SAFETY &&
          foodSafetyData && (
            <div className="space-y-12">
              <div>
                <h3 className="font-black text-lg text-slate-800 mb-4 border-r-4 border-blue-500 pr-3">
                  1. ملخص حركة الإرساليات (أعداد وأوزان)
                </h3>
                <div className={isExportingPdf ? "" : "overflow-x-auto"}>
                  <table className="w-full text-center text-[10px] border border-black">
                    <thead className="bg-slate-100 text-slate-800 font-black">
                      <tr>
                        <th className="p-2 border border-black min-w-[120px]">
                          البيان / الشهر
                        </th>
                        {foodSafetyData.months.map((m) => (
                          <th key={m} className="p-2 border border-black">
                            {m}
                          </th>
                        ))}
                        <th className="p-2 border border-black bg-slate-200">
                          الإجمالي
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderTransposedRow(
                        "عدد المفرج عنه",
                        "releasedCount",
                        false,
                        "bg-green-50 hover:bg-green-100",
                      )}
                      {renderTransposedRow(
                        "وزن المفرج عنه (كجم)",
                        "releasedWeight",
                        false,
                        "bg-green-50/50 hover:bg-green-100/50",
                      )}
                      {renderTransposedRow(
                        "وزن المفرج عنه (طن)",
                        "releasedWeight",
                        true,
                        "bg-green-50/50 hover:bg-green-100/50",
                      )}
                      {renderTransposedRow(
                        "عدد الإتلاف",
                        "destructionCount",
                        false,
                        "bg-red-50 hover:bg-red-100",
                      )}
                      {renderTransposedRow(
                        "وزن الإتلاف (كجم)",
                        "destructionWeight",
                        false,
                        "bg-red-50/50 hover:bg-red-100/50",
                      )}
                      {renderTransposedRow(
                        "وزن الإتلاف (طن)",
                        "destructionWeight",
                        true,
                        "bg-red-50/50 hover:bg-red-100/50",
                      )}
                      {renderTransposedRow(
                        "عدد إعادة التصدير",
                        "reExportCount",
                        false,
                        "bg-amber-50 hover:bg-amber-100",
                      )}
                      {renderTransposedRow(
                        "وزن إعادة التصدير (كجم)",
                        "reExportWeight",
                        false,
                        "bg-amber-50/50 hover:bg-amber-100/50",
                      )}
                      {renderTransposedRow(
                        "وزن إعادة التصدير (طن)",
                        "reExportWeight",
                        true,
                        "bg-amber-50/50 hover:bg-amber-100/50",
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {!isExportingPdf && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 mb-8 shadow-sm">
                  <h4 className="text-sm font-black text-slate-700 mb-6 text-center">
                    حركة الإرساليات (أعداد)
                  </h4>
                  <div className="h-80 w-full" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={foodSafetyData.monthlySummary}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#e2e8f0"
                        />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: "#64748b",
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "#f8fafc" }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: "none",
                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            paddingTop: "20px",
                            fontSize: "12px",
                            fontWeight: "bold",
                          }}
                        />
                        <Bar
                          dataKey="releasedCount"
                          name="مفرج عنه"
                          fill="#16a34a"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="destructionCount"
                          name="إتلاف"
                          fill="#dc2626"
                          radius={[4, 4, 0, 0]}
                        />
                        <Bar
                          dataKey="reExportCount"
                          name="إعادة تصدير"
                          fill="#d97706"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
              <div className="break-before-page pt-8">
                <h3 className="font-black text-lg text-slate-800 mb-4 border-r-4 border-blue-500 pr-3">
                  2. الأوزان الإجمالية للمجموعات السلعية (طن)
                </h3>
                <div className="overflow-x-auto mb-8">
                  <table className="w-full text-center text-[10px] border border-black">
                    <thead className="bg-slate-100 text-slate-800 font-black">
                      <tr>
                        <th className="p-2 border border-black min-w-[120px]">
                          المجموعة السلعية
                        </th>
                        {foodSafetyData.months.map((m) => (
                          <th key={m} className="p-1 border border-black">
                            {m}
                          </th>
                        ))}
                        <th className="p-2 border border-black bg-slate-200">
                          الإجمالي
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(foodSafetyData.commodityMap)
                        .sort()
                        .map((group, idx) => {
                          const weights = foodSafetyData.commodityMap[group];
                          const total = weights.reduce((a, b) => a + b, 0);
                          return (
                            <tr
                              key={idx}
                              className="border border-black hover:bg-slate-50"
                            >
                              <td className="p-2 border border-black font-bold text-right">
                                {group}
                              </td>
                              {weights.map((w, i) => (
                                <td
                                  key={i}
                                  className="p-1 border border-black font-mono"
                                >
                                  {w > 0 ? (w / 1000).toFixed(3) : "-"}
                                </td>
                              ))}
                              <td className="p-2 border border-black font-black bg-slate-100 font-mono">
                                {(total / 1000).toFixed(3)}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="break-before-page pt-8">
                <h3 className="font-black text-lg text-slate-800 mb-4 border-r-4 border-indigo-500 pr-3">
                  3. ملخص الفحوصات المخبرية (العينات)
                </h3>
                <div className="overflow-x-auto mb-8">
                  <table className="w-full text-center text-[10px] border border-black">
                    <thead className="bg-slate-100 text-slate-800 font-black">
                      <tr>
                        <th className="p-2 border border-black min-w-[120px]">
                          البيان / الشهر
                        </th>
                        {foodSafetyData.months.map((m) => (
                          <th key={m} className="p-2 border border-black">
                            {m}
                          </th>
                        ))}
                        <th className="p-2 border border-black bg-slate-200">
                          الإجمالي
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border border-black hover:bg-slate-50">
                        <td className="p-2 border border-black font-bold text-right">
                          إجمالي العينات
                        </td>
                        {foodSafetyData.samplesSummary.map((s, i) => (
                          <td
                            key={i}
                            className="p-2 border border-black font-mono"
                          >
                            {s.total || "-"}
                          </td>
                        ))}
                        <td className="p-2 border border-black font-black bg-slate-100 font-mono">
                          {foodSafetyData.samplesSummary.reduce(
                            (a, b) => a + b.total,
                            0,
                          )}
                        </td>
                      </tr>
                      <tr className="border border-black hover:bg-green-50">
                        <td className="p-2 border border-black font-bold text-right text-green-700">
                          عينات مطابقة
                        </td>
                        {foodSafetyData.samplesSummary.map((s, i) => (
                          <td
                            key={i}
                            className="p-2 border border-black font-mono text-green-600"
                          >
                            {s.compliant || "-"}
                          </td>
                        ))}
                        <td className="p-2 border border-black font-black bg-green-100 font-mono text-green-700">
                          {foodSafetyData.samplesSummary.reduce(
                            (a, b) => a + b.compliant,
                            0,
                          )}
                        </td>
                      </tr>
                      <tr className="border border-black hover:bg-red-50">
                        <td className="p-2 border border-black font-bold text-right text-red-700">
                          عينات غير مطابقة
                        </td>
                        {foodSafetyData.samplesSummary.map((s, i) => (
                          <td
                            key={i}
                            className="p-2 border border-black font-mono text-red-600"
                          >
                            {s.nonCompliant || "-"}
                          </td>
                        ))}
                        <td className="p-2 border border-black font-black bg-red-100 font-mono text-red-700">
                          {foodSafetyData.samplesSummary.reduce(
                            (a, b) => a + b.nonCompliant,
                            0,
                          )}
                        </td>
                      </tr>
                      <tr className="border border-black hover:bg-amber-50">
                        <td className="p-2 border border-black font-bold text-right text-amber-700">
                          عينات قيد الإجراء
                        </td>
                        {foodSafetyData.samplesSummary.map((s, i) => (
                          <td
                            key={i}
                            className="p-2 border border-black font-mono text-amber-600"
                          >
                            {s.pending || "-"}
                          </td>
                        ))}
                        <td className="p-2 border border-black font-black bg-amber-100 font-mono text-amber-700">
                          {foodSafetyData.samplesSummary.reduce(
                            (a, b) => a + b.pending,
                            0,
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="break-before-page pt-8">
                <h4 className="font-bold text-sm text-slate-800 mb-3 bg-slate-100 p-2 rounded-lg inline-block border border-slate-200">
                  تفاصيل العينات المسحوبة
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-[9px] border border-black">
                    <thead className="bg-slate-800 text-white font-black">
                      <tr>
                        <th className="p-2 border border-black">رقم البيان</th>
                        <th className="p-2 border border-black">المستورد</th>
                        <th className="p-2 border border-black">
                          تاريخ الوصول
                        </th>
                        <th className="p-2 border border-black">
                          نوع الفحص المخبري
                        </th>
                        <th className="p-2 border border-black">نتيجة الفحص</th>
                        <th className="p-2 border border-black">المختبر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foodSafetyData.consignmentsWithSamples.length > 0 ? (
                        foodSafetyData.consignmentsWithSamples.flatMap((c) =>
                          (c.samples || []).map((s, sIdx) => (
                            <tr
                              key={`${c.id}-${sIdx}`}
                              className="border border-black hover:bg-slate-50"
                            >
                              <td className="p-2 border border-black font-mono font-bold">
                                {c.bayanNumber}
                              </td>
                              <td className="p-2 border border-black text-right">
                                {c.importer}
                              </td>
                              <td className="p-2 border border-black font-mono">
                                {c.arrivalDate}
                              </td>
                              <td className="p-2 border border-black">
                                {s.labAnalysisType || "-"}
                              </td>
                              <td className="p-2 border border-black">
                                <span
                                  className={`font-bold ${s.result === "Compliant" ? "text-green-600" : s.result === "NonCompliant" ? "text-red-600" : "text-amber-600"}`}
                                >
                                  {s.result === "Compliant"
                                    ? "مطابق"
                                    : s.result === "NonCompliant"
                                      ? "غير مطابق"
                                      : "قيد الإجراء"}
                                </span>
                              </td>
                              <td className="p-2 border border-black">
                                {s.labName || "-"}
                              </td>
                            </tr>
                          )),
                        )
                      ) : (
                        <tr>
                          <td
                            colSpan={6}
                            className="p-4 border border-black text-slate-400 italic"
                          >
                            لا توجد عينات مسحوبة خلال هذه الفترة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="break-before-page pt-8">
                <h3 className="font-black text-lg text-slate-800 mb-4 border-r-4 border-red-500 pr-3">
                  4. الإرساليات المرفوضة
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-center text-[9px] border border-black">
                    <thead className="bg-red-800 text-white font-black">
                      <tr>
                        <th className="p-2 border border-black">المنتج</th>
                        <th className="p-2 border border-black">رقم البيان</th>
                        <th className="p-2 border border-black">
                          الشركة المستوردة
                        </th>
                        <th className="p-2 border border-black">الوزن (كجم)</th>
                        <th className="p-2 border border-black">بلد المنشأ</th>
                        <th className="p-2 border border-black">التاريخ</th>
                        <th className="p-2 border border-black">سبب الرفض</th>
                        <th className="p-2 border border-black">الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foodSafetyData.rejectedShipments.length > 0 ? (
                        foodSafetyData.rejectedShipments.map((c, idx) => (
                          <tr
                            key={`${c.id}-${idx}`}
                            className="border border-black hover:bg-red-50"
                          >
                            <td className="p-2 border border-black font-bold text-right">
                              {c.items?.[0]?.description ||
                                (c as any).itemDescription ||
                                "شحنة عامة"}
                            </td>
                            <td className="p-2 border border-black font-mono font-bold">
                              {c.bayanNumber}
                            </td>
                            <td className="p-2 border border-black text-right">
                              {c.importer}
                            </td>
                            <td className="p-2 border border-black font-mono">
                              {Number(c.totalWeight || 0).toLocaleString()}
                            </td>
                            <td className="p-2 border border-black">
                              {c.items?.[0]?.origin || c.shippingCountry || "-"}
                            </td>
                            <td className="p-2 border border-black font-mono">
                              {c.arrivalDate}
                            </td>
                            <td className="p-2 border border-black text-red-700 font-bold">
                              {c.rejectionReason || "-"}
                            </td>
                            <td className="p-2 border border-black font-bold">
                              {c.rejectionAction || c.technicalAction || "-"}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="p-4 border border-black text-slate-400 italic"
                          >
                            لا توجد إرساليات مرفوضة خلال هذه الفترة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        {/* 3. SUMMARY REPORT (Veterinary & Agricultural) */}
        {reportType === "SUMMARY" &&
          (selectedSector === ConsignmentType.VETERINARY ||
            selectedSector === ConsignmentType.AGRICULTURAL) &&
          commodityReportData && (
            <div className="space-y-8">
              {selectedSector === ConsignmentType.AGRICULTURAL ? (
                <div className="space-y-8">
                  <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
                    <h2 className="text-2xl font-black text-slate-900">
                      الملخص الإحصائي لقطاع الحجر الزراعي
                    </h2>
                    <p className="text-slate-500 font-bold">
                      الفترة من {startDate} إلى {endDate}
                    </p>
                  </div>

                  {[
                    ConsignmentDirection.INBOUND,
                    ConsignmentDirection.OUTBOUND,
                  ].map((dir) => {
                    const dirData = filteredData.filter(
                      (c) => getConsignmentDirection(c) === dir,
                    );
                    if (dirData.length === 0) return null;
                    const dirTitle =
                      dir === ConsignmentDirection.INBOUND
                        ? "أولاً: الواردات"
                        : "ثانياً: الصادرات";
                    const dirColor =
                      dir === ConsignmentDirection.INBOUND
                        ? "bg-red-600"
                        : "bg-emerald-600";

                    return (
                      <div key={dir} className="break-before-page">
                        <h3
                          className={`text-xl font-black text-white ${dirColor} px-6 py-2 rounded-lg inline-block mb-6 shadow-md`}
                        >
                          {dirTitle}
                        </h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-center text-[8px] border border-black">
                            <thead className="bg-slate-800 text-white font-black">
                              <tr>
                                <th className="p-1 border border-black">
                                  التاريخ
                                </th>
                                <th className="p-1 border border-black">
                                  رقم البيان
                                </th>
                                <th className="p-1 border border-black">
                                  المنفذ
                                </th>
                                <th className="p-1 border border-black">
                                  الشركة المستوردة
                                </th>
                                <th className="p-1 border border-black">
                                  المجموعة
                                </th>
                                <th className="p-1 border border-black">
                                  السلعة
                                </th>
                                <th className="p-1 border border-black">
                                  الوزن (كجم)
                                </th>
                                <th className="p-1 border border-black">
                                  الوزن (طن)
                                </th>
                                <th className="p-1 border border-black">
                                  بلد المنشأ
                                </th>
                                <th className="p-1 border border-black">
                                  نوع الفحص
                                </th>
                                <th className="p-1 border border-black">
                                  نوع التحليل المخبري
                                </th>
                                <th className="p-1 border border-black">
                                  نتيجة الفحص
                                </th>
                                <th className="p-1 border border-black">
                                  سبب عدم المطابقة
                                </th>
                                <th className="p-1 border border-black">
                                  تفاصيل عدم المطابقة
                                </th>
                                <th className="p-1 border border-black">
                                  الإجراء النهائي
                                </th>
                                <th className="p-1 border border-black">
                                  الرسوم (ر.ع)
                                </th>
                                <th className="p-1 border border-black">
                                  المفتش
                                </th>
                                <th className="p-1 border border-black">
                                  ملاحظات
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {dirData.flatMap((c) =>
                                (c.items && c.items.length > 0
                                  ? c.items
                                  : [
                                      {
                                        description: "شحنة عامة",
                                        weight: c.totalWeight,
                                        origin: c.shippingCountry,
                                        commodityGroup: c.commodityGroup,
                                      },
                                    ]
                                ).map((item, idx) => {
                                  const labAnalysis =
                                    c.samples
                                      ?.flatMap((s) => s.labAnalysisType || [])
                                      .join(", ") || "-";
                                  const labResult =
                                    c.samples
                                      ?.map((s) =>
                                        s.result === "Compliant"
                                          ? "مطابق"
                                          : s.result === "NonCompliant"
                                            ? "غير مطابق"
                                            : "قيد الإجراء",
                                      )
                                      .join(" | ") || "-";

                                  return (
                                    <tr
                                      key={`${c.id}-${idx}`}
                                      className="border border-black hover:bg-slate-50"
                                    >
                                      <td className="p-1 border border-black font-mono">
                                        {c.arrivalDate}
                                      </td>
                                      <td className="p-1 border border-black font-mono font-bold">
                                        {c.bayanNumber}
                                      </td>
                                      <td className="p-1 border border-black">
                                        {c.port}
                                      </td>
                                      <td className="p-1 border border-black text-right truncate max-w-[100px]">
                                        {c.importer}
                                      </td>
                                      <td className="p-1 border border-black">
                                        {item.commodityGroup || "-"}
                                      </td>
                                      <td className="p-1 border border-black text-right font-bold">
                                        {item.description}
                                      </td>
                                      <td className="p-1 border border-black font-mono">
                                        {Number(
                                          item.weight || 0,
                                        ).toLocaleString()}
                                      </td>
                                      <td className="p-1 border border-black font-mono">
                                        {(
                                          Number(item.weight || 0) / 1000
                                        ).toFixed(3)}
                                      </td>
                                      <td className="p-1 border border-black">
                                        {item.origin || "-"}
                                      </td>
                                      <td className="p-1 border border-black">
                                        {c.inspectionType || "-"}
                                      </td>
                                      <td className="p-1 border border-black">
                                        {labAnalysis}
                                      </td>
                                      <td className="p-1 border border-black">
                                        {labResult}
                                      </td>
                                      <td className="p-1 border border-black">
                                        {c.rejectionReason || "-"}
                                      </td>
                                      <td className="p-1 border border-black">
                                        {c.rejectionDetails || "-"}
                                      </td>
                                      <td className="p-1 border border-black font-bold">
                                        {c.technicalAction || "-"}
                                      </td>
                                      <td className="p-1 border border-black font-mono">
                                        {Number(c.fees || 0).toLocaleString()}
                                      </td>
                                      <td className="p-1 border border-black">
                                        {c.inspectorName || "-"}
                                      </td>
                                      <td className="p-1 border border-black text-right text-[7px]">
                                        {c.remarks || "-"}
                                      </td>
                                    </tr>
                                  );
                                }),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-12">
                  {/* Veterinary Summary Model rendering */}
                  <div className="text-center mb-8 border-b-2 border-slate-800 pb-4">
                    <h2 className="text-2xl font-black text-slate-900">
                      الملخص الإحصائي للقطاع البيطري
                    </h2>
                    <p className="text-slate-500 font-bold">
                      الفترة من {startDate} إلى {endDate}
                    </p>
                  </div>

                  {/* Section 1: Imports (أولاً: الواردات) */}
                  <div>
                    <h3 className="text-xl font-black text-white bg-red-600 px-6 py-2 rounded-lg inline-block mb-6 shadow-md">
                      أولاً: الواردات
                    </h3>
                    {Object.keys(
                      commodityReportData.dirGroups[
                        ConsignmentDirection.INBOUND
                      ],
                    )
                      .sort((a, b) => {
                        // Try to maintain order of VET_SUMMARY_CATEGORIES if they match
                        const aIdx = VET_SUMMARY_CATEGORIES.findIndex(
                          (c) => c.title === a,
                        );
                        const bIdx = VET_SUMMARY_CATEGORIES.findIndex(
                          (c) => c.title === b,
                        );
                        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                        if (aIdx !== -1) return -1;
                        if (bIdx !== -1) return 1;
                        return a.localeCompare(b, "ar");
                      })
                      .map((groupName, idx) => {
                        const items =
                          commodityReportData.dirGroups[
                            ConsignmentDirection.INBOUND
                          ][groupName] || [];
                        const isWeightTable = isWeightGroup(groupName);

                        return (
                          <div
                            key={`in-${groupName}`}
                            className="mb-10 break-inside-avoid"
                          >
                            <h4 className="font-black text-sm text-slate-800 mb-3 bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center gap-3">
                              <span className="w-8 h-8 bg-slate-800 text-white rounded-full flex items-center justify-center text-xs">
                                {idx + 1}
                              </span>
                              {groupName}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-center text-[9px] border border-black">
                                <thead className="bg-slate-50 text-slate-800 font-black">
                                  <tr>
                                    <th className="p-2 border border-black w-10">
                                      م
                                    </th>
                                    <th className="p-2 border border-black text-right">
                                      نوع الحيوان / المنتج
                                    </th>
                                    <th className="p-2 border border-black">
                                      الرمز المنسق
                                    </th>
                                    <th className="p-2 border border-black">
                                      الوحدة
                                    </th>
                                    {isWeightTable ? (
                                      <>
                                        <th className="p-2 border border-black">
                                          الوزن الصافي (كجم)
                                        </th>
                                        <th className="p-2 border border-black">
                                          الوزن بالطن
                                        </th>
                                      </>
                                    ) : (
                                      <th className="p-2 border border-black">
                                        العدد
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.length > 0 ? (
                                    items.map((item, iIdx) => (
                                      <tr
                                        key={iIdx}
                                        className="border border-black hover:bg-slate-50"
                                      >
                                        <td className="p-2 border border-black">
                                          {iIdx + 1}
                                        </td>
                                        <td className="p-2 border border-black text-right font-bold">
                                          {item.description}
                                        </td>
                                        <td className="p-2 border border-black font-mono">
                                          {item.hsCode || "-"}
                                        </td>
                                        <td className="p-2 border border-black">
                                          {item.packagingUnit ||
                                            (isWeightTable ? "كجم" : "رأس")}
                                        </td>
                                        {isWeightTable ? (
                                          <>
                                            <td className="p-2 border border-black font-mono">
                                              {Number(
                                                item.weight || 0,
                                              ).toLocaleString()}
                                            </td>
                                            <td className="p-2 border border-black font-mono">
                                              {(
                                                Number(item.weight || 0) / 1000
                                              ).toFixed(3)}
                                            </td>
                                          </>
                                        ) : (
                                          <td className="p-2 border border-black font-mono font-bold">
                                            {Number(
                                              item.packageCount ||
                                                item.weight ||
                                                0,
                                            ).toLocaleString()}
                                          </td>
                                        )}
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={isWeightTable ? 6 : 5}
                                        className="p-3 border border-black text-slate-400 italic"
                                      >
                                        لا توجد بيانات لهذه الفئة
                                      </td>
                                    </tr>
                                  )}
                                  {items.length > 0 && (
                                    <tr className="bg-slate-100 font-black">
                                      <td
                                        colSpan={isWeightTable ? 4 : 4}
                                        className="p-2 border border-black text-left"
                                      >
                                        الإجمالي
                                      </td>
                                      {isWeightTable ? (
                                        <>
                                          <td className="p-2 border border-black font-mono">
                                            {items
                                              .reduce(
                                                (a, b) =>
                                                  a + (Number(b.weight) || 0),
                                                0,
                                              )
                                              .toLocaleString()}
                                          </td>
                                          <td className="p-2 border border-black font-mono">
                                            {(
                                              items.reduce(
                                                (a, b) =>
                                                  a + (Number(b.weight) || 0),
                                                0,
                                              ) / 1000
                                            ).toFixed(3)}
                                          </td>
                                        </>
                                      ) : (
                                        <td className="p-2 border border-black font-mono">
                                          {items
                                            .reduce(
                                              (a, b) =>
                                                a +
                                                Number(
                                                  b.packageCount ||
                                                    b.weight ||
                                                    0,
                                                ),
                                              0,
                                            )
                                            .toLocaleString()}
                                        </td>
                                      )}
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            {items.length > 0 && (
                              <div className="mt-2 grid grid-cols-3 gap-4 text-[8px]">
                                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                                  <span className="font-black block mb-1">
                                    الدول المصدرة:
                                  </span>
                                  <span className="text-slate-600">
                                    {Array.from(
                                      new Set(
                                        items.flatMap((i) =>
                                          Array.from(i.exportersSet || []),
                                        ),
                                      ),
                                    ).join("، ") || "-"}
                                  </span>
                                </div>
                                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                                  <span className="font-black block mb-1">
                                    دول المنشأ:
                                  </span>
                                  <span className="text-slate-600">
                                    {Array.from(
                                      new Set(
                                        items.flatMap((i) =>
                                          Array.from(i.originsSet || []),
                                        ),
                                      ),
                                    ).join("، ") || "-"}
                                  </span>
                                </div>
                                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                                  <span className="font-black block mb-1">
                                    الشركات المستوردة:
                                  </span>
                                  <span className="text-slate-600">
                                    {Array.from(
                                      new Set(
                                        items.flatMap((i) =>
                                          Array.from(i.importersSet || []),
                                        ),
                                      ),
                                    ).join("، ") || "-"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Section 2: Exports (ثانياً: الصادرات) */}
                  <div className="break-before-page">
                    <h3 className="text-xl font-black text-white bg-emerald-600 px-6 py-2 rounded-lg inline-block mb-6 shadow-md">
                      ثانياً: الصادرات
                    </h3>
                    {Object.keys(
                      commodityReportData.dirGroups[
                        ConsignmentDirection.OUTBOUND
                      ],
                    )
                      .sort((a, b) => {
                        const aIdx = VET_SUMMARY_CATEGORIES.findIndex(
                          (c) => c.title === a,
                        );
                        const bIdx = VET_SUMMARY_CATEGORIES.findIndex(
                          (c) => c.title === b,
                        );
                        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                        if (aIdx !== -1) return -1;
                        if (bIdx !== -1) return 1;
                        return a.localeCompare(b, "ar");
                      })
                      .map((groupName, idx) => {
                        const items =
                          commodityReportData.dirGroups[
                            ConsignmentDirection.OUTBOUND
                          ][groupName] || [];
                        const isWeightTable = isWeightGroup(groupName);

                        return (
                          <div
                            key={`out-${groupName}`}
                            className="mb-10 break-inside-avoid"
                          >
                            <h4 className="font-black text-sm text-slate-800 mb-3 bg-slate-100 p-2 rounded-lg border border-slate-200 flex items-center gap-3">
                              <span className="w-8 h-8 bg-emerald-800 text-white rounded-full flex items-center justify-center text-xs">
                                {idx + 1}
                              </span>
                              {groupName}
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-center text-[9px] border border-black">
                                <thead className="bg-slate-50 text-slate-800 font-black">
                                  <tr>
                                    <th className="p-2 border border-black w-10">
                                      م
                                    </th>
                                    <th className="p-2 border border-black text-right">
                                      نوع الحيوان / المنتج
                                    </th>
                                    <th className="p-2 border border-black">
                                      الرمز المنسق
                                    </th>
                                    <th className="p-2 border border-black">
                                      الوحدة
                                    </th>
                                    {isWeightTable ? (
                                      <>
                                        <th className="p-2 border border-black">
                                          الوزن الصافي (كجم)
                                        </th>
                                        <th className="p-2 border border-black">
                                          الوزن بالطن
                                        </th>
                                      </>
                                    ) : (
                                      <th className="p-2 border border-black">
                                        العدد
                                      </th>
                                    )}
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.length > 0 ? (
                                    items.map((item, iIdx) => (
                                      <tr
                                        key={iIdx}
                                        className="border border-black hover:bg-slate-50"
                                      >
                                        <td className="p-2 border border-black">
                                          {iIdx + 1}
                                        </td>
                                        <td className="p-2 border border-black text-right font-bold">
                                          {item.description}
                                        </td>
                                        <td className="p-2 border border-black font-mono">
                                          {item.hsCode || "-"}
                                        </td>
                                        <td className="p-2 border border-black">
                                          {item.packagingUnit ||
                                            (isWeightTable ? "كجم" : "رأس")}
                                        </td>
                                        {isWeightTable ? (
                                          <>
                                            <td className="p-2 border border-black font-mono">
                                              {Number(
                                                item.weight || 0,
                                              ).toLocaleString()}
                                            </td>
                                            <td className="p-2 border border-black font-mono">
                                              {(
                                                Number(item.weight || 0) / 1000
                                              ).toFixed(3)}
                                            </td>
                                          </>
                                        ) : (
                                          <td className="p-2 border border-black font-mono font-bold">
                                            {Number(
                                              item.packageCount ||
                                                item.weight ||
                                                0,
                                            ).toLocaleString()}
                                          </td>
                                        )}
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={isWeightTable ? 6 : 5}
                                        className="p-3 border border-black text-slate-400 italic"
                                      >
                                        لا توجد بيانات لهذه الفئة
                                      </td>
                                    </tr>
                                  )}
                                  {items.length > 0 && (
                                    <tr className="bg-slate-100 font-black">
                                      <td
                                        colSpan={isWeightTable ? 4 : 4}
                                        className="p-2 border border-black text-left"
                                      >
                                        الإجمالي
                                      </td>
                                      {isWeightTable ? (
                                        <>
                                          <td className="p-2 border border-black font-mono">
                                            {items
                                              .reduce(
                                                (a, b) =>
                                                  a + (Number(b.weight) || 0),
                                                0,
                                              )
                                              .toLocaleString()}
                                          </td>
                                          <td className="p-2 border border-black font-mono">
                                            {(
                                              items.reduce(
                                                (a, b) =>
                                                  a + (Number(b.weight) || 0),
                                                0,
                                              ) / 1000
                                            ).toFixed(3)}
                                          </td>
                                        </>
                                      ) : (
                                        <td className="p-2 border border-black font-mono">
                                          {items
                                            .reduce(
                                              (a, b) =>
                                                a +
                                                Number(
                                                  b.packageCount ||
                                                    b.weight ||
                                                    0,
                                                ),
                                              0,
                                            )
                                            .toLocaleString()}
                                        </td>
                                      )}
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                            {items.length > 0 && (
                              <div className="mt-2 grid grid-cols-2 gap-4 text-[8px]">
                                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                                  <span className="font-black block mb-1">
                                    الدول المستوردة:
                                  </span>
                                  <span className="text-slate-600">
                                    {Array.from(
                                      new Set(
                                        items.flatMap((i) =>
                                          Array.from(i.exportersSet || []),
                                        ),
                                      ),
                                    ).join("، ") || "-"}
                                  </span>
                                </div>
                                <div className="p-2 border border-slate-200 rounded bg-slate-50">
                                  <span className="font-black block mb-1">
                                    الشركات المصدرة:
                                  </span>
                                  <span className="text-slate-600">
                                    {Array.from(
                                      new Set(
                                        items.flatMap((i) =>
                                          Array.from(i.importersSet || []),
                                        ),
                                      ),
                                    ).join("، ") || "-"}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>

                  {/* Section 3: Rejected Shipments (ثالثاً: الإرساليات المرفوضة) */}
                  <div className="break-before-page">
                    <h3 className="text-xl font-black text-white bg-red-800 px-6 py-2 rounded-lg inline-block mb-6 shadow-md">
                      ثالثاً: الإرساليات البيطرية المرفوضة
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-[9px] border border-black">
                        <thead className="bg-slate-800 text-white font-black">
                          <tr>
                            <th className="p-2 border border-black">
                              نوع الإرسالية
                            </th>
                            <th className="p-2 border border-black">
                              الرمز المنسق
                            </th>
                            <th className="p-2 border border-black">التاريخ</th>
                            <th className="p-2 border border-black">
                              الوزن الصافي (كجم)
                            </th>
                            <th className="p-2 border border-black">
                              الدولة المصدرة
                            </th>
                            <th className="p-2 border border-black">
                              سبب الرفض
                            </th>
                            <th className="p-2 border border-black">
                              الإجراء النهائي
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.filter(
                            (c) =>
                              getConsignmentDirection(c) ===
                                ConsignmentDirection.INBOUND &&
                              (c.technicalAction === "رفض" ||
                                c.status === "Rejected"),
                          ).length > 0 ? (
                            filteredData
                              .filter(
                                (c) =>
                                  getConsignmentDirection(c) ===
                                    ConsignmentDirection.INBOUND &&
                                  (c.technicalAction === "رفض" ||
                                    c.status === "Rejected"),
                              )
                              .map((c, idx) => (
                                <tr
                                  key={idx}
                                  className="border border-black hover:bg-red-50"
                                >
                                  <td className="p-2 border border-black font-bold">
                                    {c.items?.[0]?.description ||
                                      (c as any).itemDescription ||
                                      "شحنة عامة"}
                                  </td>
                                  <td className="p-2 border border-black font-mono">
                                    {c.items?.[0]?.hsCode || "-"}
                                  </td>
                                  <td className="p-2 border border-black font-mono">
                                    {c.arrivalDate}
                                  </td>
                                  <td className="p-2 border border-black font-mono">
                                    {Number(
                                      c.totalWeight || 0,
                                    ).toLocaleString()}
                                  </td>
                                  <td className="p-2 border border-black">
                                    {c.shippingCountry || "-"}
                                  </td>
                                  <td className="p-2 border border-black text-red-700 font-bold">
                                    {c.rejectionReason || "-"}
                                  </td>
                                  <td className="p-2 border border-black font-bold">
                                    {c.rejectionAction ||
                                      c.technicalAction ||
                                      "-"}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan={7}
                                className="p-4 border border-black text-slate-400 italic"
                              >
                                لا توجد إرساليات مرفوضة
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 4: Returned Shipments (رابعاً: الإرساليات المرتجعة) */}
                  <div className="break-before-page">
                    <h3 className="text-xl font-black text-white bg-amber-600 px-6 py-2 rounded-lg inline-block mb-6 shadow-md">
                      رابعاً: الإرساليات البيطرية المرتجعة
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-[9px] border border-black">
                        <thead className="bg-slate-800 text-white font-black">
                          <tr>
                            <th className="p-2 border border-black">
                              نوع الإرسالية
                            </th>
                            <th className="p-2 border border-black">
                              الرمز المنسق
                            </th>
                            <th className="p-2 border border-black">التاريخ</th>
                            <th className="p-2 border border-black">
                              الوزن الصافي (كجم)
                            </th>
                            <th className="p-2 border border-black">
                              الدولة المستوردة
                            </th>
                            <th className="p-2 border border-black">
                              سبب الرفض
                            </th>
                            <th className="p-2 border border-black">
                              الإجراء النهائي
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.filter(
                            (c) =>
                              getConsignmentDirection(c) ===
                                ConsignmentDirection.OUTBOUND &&
                              (c.technicalAction === "رفض" ||
                                c.status === "Rejected"),
                          ).length > 0 ? (
                            filteredData
                              .filter(
                                (c) =>
                                  getConsignmentDirection(c) ===
                                    ConsignmentDirection.OUTBOUND &&
                                  (c.technicalAction === "رفض" ||
                                    c.status === "Rejected"),
                              )
                              .map((c, idx) => (
                                <tr
                                  key={idx}
                                  className="border border-black hover:bg-amber-50"
                                >
                                  <td className="p-2 border border-black font-bold">
                                    {c.items?.[0]?.description ||
                                      (c as any).itemDescription ||
                                      "شحنة عامة"}
                                  </td>
                                  <td className="p-2 border border-black font-mono">
                                    {c.items?.[0]?.hsCode || "-"}
                                  </td>
                                  <td className="p-2 border border-black font-mono">
                                    {c.arrivalDate}
                                  </td>
                                  <td className="p-2 border border-black font-mono">
                                    {Number(
                                      c.totalWeight || 0,
                                    ).toLocaleString()}
                                  </td>
                                  <td className="p-2 border border-black">
                                    {c.shippingCountry || "-"}
                                  </td>
                                  <td className="p-2 border border-black text-red-700 font-bold">
                                    {c.rejectionReason || "-"}
                                  </td>
                                  <td className="p-2 border border-black font-bold">
                                    {c.rejectionAction ||
                                      c.technicalAction ||
                                      "-"}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan={7}
                                className="p-4 border border-black text-slate-400 italic"
                              >
                                لا توجد إرساليات مرتجعة
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Section 5: Lab Results (خامساً: نتائج عينات المختبر) */}
                  <div className="break-before-page">
                    <h3 className="text-xl font-black text-white bg-blue-800 px-6 py-2 rounded-lg inline-block mb-6 shadow-md">
                      خامساً: نتائج عينات المختبر
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-[8px] border border-black">
                        <thead className="bg-slate-800 text-white font-black">
                          <tr>
                            <th className="p-1 border border-black">
                              نوع الإرسالية
                            </th>
                            <th className="p-1 border border-black">
                              الشركة المصدرة
                            </th>
                            <th className="p-1 border border-black">
                              الرمز المنسق
                            </th>
                            <th className="p-1 border border-black">
                              تاريخ سحب العينة
                            </th>
                            <th className="p-1 border border-black">المنشأ</th>
                            <th className="p-1 border border-black">
                              نوع العينة
                            </th>
                            <th className="p-1 border border-black">
                              التحليل المطلوب
                            </th>
                            <th className="p-1 border border-black">
                              اسم المختبر
                            </th>
                            <th className="p-1 border border-black">النتيجة</th>
                            <th className="p-1 border border-black">
                              نوع الفحص
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredData.filter(
                            (c) => c.samples && c.samples.length > 0,
                          ).length > 0 ? (
                            filteredData
                              .filter((c) => c.samples && c.samples.length > 0)
                              .flatMap((c) =>
                                (c.samples || []).map((s, sIdx) => (
                                  <tr
                                    key={`${c.id}-${sIdx}`}
                                    className="border border-black hover:bg-blue-50"
                                  >
                                    <td className="p-1 border border-black font-bold">
                                      {c.items?.[0]?.description || "شحنة عامة"}
                                    </td>
                                    <td className="p-1 border border-black">
                                      {c.exporter || "-"}
                                    </td>
                                    <td className="p-1 border border-black font-mono">
                                      {c.items?.[0]?.hsCode || "-"}
                                    </td>
                                    <td className="p-1 border border-black font-mono">
                                      {s.date}
                                    </td>
                                    <td className="p-1 border border-black">
                                      {c.items?.[0]?.origin || "-"}
                                    </td>
                                    <td className="p-1 border border-black">
                                      {s.type || "-"}
                                    </td>
                                    <td className="p-1 border border-black">
                                      {s.labAnalysisType?.join("، ") || "-"}
                                    </td>
                                    <td className="p-1 border border-black">
                                      {s.labName || "-"}
                                    </td>
                                    <td className="p-1 border border-black font-bold">
                                      <span
                                        className={
                                          s.result === "Compliant"
                                            ? "text-green-600"
                                            : s.result === "NonCompliant"
                                              ? "text-red-600"
                                              : "text-amber-600"
                                        }
                                      >
                                        {s.result === "Compliant"
                                          ? "مطابق"
                                          : s.result === "NonCompliant"
                                            ? "غير مطابق"
                                            : "قيد الإجراء"}
                                      </span>
                                    </td>
                                    <td className="p-1 border border-black">
                                      {c.inspectionType || "-"}
                                    </td>
                                  </tr>
                                )),
                              )
                          ) : (
                            <tr>
                              <td
                                colSpan={10}
                                className="p-4 border border-black text-slate-400 italic"
                              >
                                لا توجد عينات مخبرية
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* 4. DETAILED REPORT (Dynamic Columns) */}
        {reportType === "DETAILED" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="p-4 border border-slate-200 rounded-xl bg-slate-50 text-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  إجمالي الإرساليات
                </p>
                <p className="text-2xl font-black text-slate-800">
                  {stats.total}
                </p>
              </div>
              <div className="p-4 border border-green-200 rounded-xl bg-green-50 text-center">
                <p className="text-[10px] font-bold text-green-600 uppercase">
                  المقبولة
                </p>
                <p className="text-2xl font-black text-green-800">
                  {stats.approved}
                </p>
              </div>
              <div className="p-4 border border-red-200 rounded-xl bg-red-50 text-center">
                <p className="text-[10px] font-bold text-red-600 uppercase">
                  المرفوضة
                </p>
                <p className="text-2xl font-black text-red-800">
                  {stats.rejected}
                </p>
              </div>
              <div className="p-4 border border-blue-200 rounded-xl bg-blue-50 text-center">
                <p className="text-[10px] font-bold text-blue-600 uppercase">
                  إجمالي الرسوم
                </p>
                <p className="text-xl font-black text-blue-800">
                  {stats.fees.toLocaleString()} ر.ع
                </p>
              </div>
            </div>
            {!isExportingPdf && stats.total > 0 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 mb-8 shadow-sm flex flex-col items-center">
                <h4 className="text-sm font-black text-slate-700 mb-4 text-center">
                  توزيع حالات الإرساليات
                </h4>
                <div className="h-64 w-full max-w-md" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "مقبولة",
                            value: stats.approved,
                            color: "#16a34a",
                          },
                          {
                            name: "مرفوضة",
                            value: stats.rejected,
                            color: "#dc2626",
                          },
                          {
                            name: "قيد الإجراء",
                            value: stats.pending,
                            color: "#d97706",
                          },
                        ].filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          {
                            name: "مقبولة",
                            value: stats.approved,
                            color: "#16a34a",
                          },
                          {
                            name: "مرفوضة",
                            value: stats.rejected,
                            color: "#dc2626",
                          },
                          {
                            name: "قيد الإجراء",
                            value: stats.pending,
                            color: "#d97706",
                          },
                        ]
                          .filter((d) => d.value > 0)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className={`${isExportingPdf ? "" : "overflow-x-auto"}`}>
              <table className="w-full text-right border border-slate-200">
                <thead className="bg-slate-100 text-slate-700 font-black">
                  <tr>
                    <th
                      className={`border border-slate-200 w-10 ${isExportingPdf ? "p-1 text-[7px]" : "p-3 text-xs"}`}
                    >
                      #
                    </th>
                    {selectedColumnKeys.map((key) => {
                      const colDef = AVAILABLE_COLUMNS.find(
                        (col) => col.key === key,
                      );
                      return (
                        <th
                          key={key}
                          className={`border border-slate-200 ${isExportingPdf ? "p-1 text-[7px]" : "p-3 text-xs"}`}
                        >
                          {colDef?.label || key}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row, idx) => (
                    <tr
                      key={`${row.id}-${idx}`}
                      className="border-b border-slate-200 even:bg-slate-50"
                    >
                      <td
                        className={`border-r border-slate-200 font-mono ${isExportingPdf ? "p-1 text-[7px]" : "p-3 text-xs"}`}
                      >
                        {idx + 1}
                      </td>
                      {selectedColumnKeys.map((key) => (
                        <td
                          key={key}
                          className={`border-r border-slate-200 ${isExportingPdf ? "p-1 text-[7px]" : "p-3 text-xs"}`}
                        >
                          <span
                            className={`font-bold ${row.status === "Approved" ? "text-green-600" : row.status === "Rejected" ? "text-red-600" : "text-amber-600"}`}
                          >
                            {" "}
                            {getCellValue(row, key)}{" "}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* 5. CUSTOM REPORT */}
        {reportType === "CUSTOM" && (
          <>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex justify-between items-center mb-6">
              <div>
                {" "}
                <p className="text-xs font-black text-slate-400 uppercase">
                  تقرير مخصص
                </p>{" "}
                <h3 className="text-xl font-black text-slate-800">
                  {[
                    customFilters.importer,
                    customFilters.product,
                    customFilters.origin,
                    customFilters.inspector,
                    customFilters.action,
                  ]
                    .filter(Boolean)
                    .join(" | ") || "الكل"}
                </h3>{" "}
              </div>
              <div className="text-center">
                {" "}
                <p className="text-xs font-black text-slate-400 uppercase">
                  المعاملات
                </p>{" "}
                <p className="text-2xl font-black text-slate-800">
                  {customReportList.length}
                </p>{" "}
              </div>
            </div>
            <div className={`${isExportingPdf ? "" : "overflow-x-auto"}`}>
              <table className="w-full text-right border border-slate-200 text-[10px]">
                <thead className="bg-slate-800 text-white font-black">
                  <tr>
                    <th
                      className={`border border-slate-600 w-10 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                    >
                      #
                    </th>
                    {selectedColumnKeys.map((key) => {
                      const colDef = AVAILABLE_COLUMNS.find(
                        (col) => col.key === key,
                      );
                      return (
                        <th
                          key={key}
                          className={`border border-slate-600 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                        >
                          {colDef?.label || key}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {customReportList.map((row, idx) => (
                    <tr
                      key={`${row.id}-${idx}`}
                      className="border-b border-slate-200 even:bg-slate-50"
                    >
                      <td
                        className={`border-r border-slate-200 font-mono ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                      >
                        {idx + 1}
                      </td>
                      {selectedColumnKeys.map((key) => (
                        <td
                          key={key}
                          className={`border-r border-slate-200 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                        >
                          <span
                            className={`font-bold ${row.status === "Approved" ? "text-green-600" : row.status === "Rejected" ? "text-red-600" : "text-amber-600"}`}
                          >
                            {" "}
                            {getCellValue(row, key)}{" "}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {customReportList.length === 0 && (
                    <tr>
                      <td
                        colSpan={selectedColumnKeys.length + 1}
                        className="p-6 text-center text-slate-400"
                      >
                        لا توجد بيانات مطابقة للفلتر المحدد
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* 6. FINANCIAL REPORT */}
        {reportType === "FINANCIAL" && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex justify-between items-center">
              {" "}
              <span className="text-sm font-black text-blue-800">
                إجمالي الرسوم المحصلة
              </span>{" "}
              <span className="text-2xl font-black text-slate-800">
                {stats.fees.toLocaleString()} ر.ع
              </span>{" "}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right border border-slate-200">
                <thead className="bg-slate-800 text-white font-black text-xs">
                  <tr>
                    <th className="p-3 border-l border-slate-700">
                      الرقم المرجعي
                    </th>
                    <th className="p-3 border-l border-slate-700">
                      رقم البيان
                    </th>
                    <th className="p-3 border-l border-slate-700">
                      رقم التصريح
                    </th>
                    <th className="p-3 border-l border-slate-700">المستورد</th>
                    <th className="p-3 border-l border-slate-700">
                      تاريخ المعاملة
                    </th>
                    <th className="p-3 border-l border-slate-700">
                      حالة الدفع
                    </th>
                    <th className="p-3">قيمة الرسوم</th>
                  </tr>
                </thead>
                <tbody className="text-xs font-medium">
                  {filteredData.map((c, i) => (
                    <tr
                      key={`${c.id}-${i}`}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="p-3 font-mono text-slate-500">{c.id}</td>
                      <td className="p-3 font-bold">{c.bayanNumber}</td>
                      <td className="p-3 font-mono font-bold text-emerald-600">
                        {c.permitNumber || "-"}
                      </td>
                      <td className="p-3">{c.importer}</td>
                      <td className="p-3 font-mono">{c.arrivalDate}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded ${c.fees > 0 ? (c.status === "Approved" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700") : "bg-slate-100 text-slate-500"}`}
                        >
                          {" "}
                          {c.fees > 0
                            ? c.status === "Approved"
                              ? "مدفوع"
                              : "معلق"
                            : "معفى"}{" "}
                        </span>
                      </td>
                      <td className="p-3 font-black text-left">
                        {Number(c.fees || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100 font-black text-sm">
                    <td colSpan={6} className="p-3 text-left">
                      المجموع الكلي
                    </td>
                    <td className="p-3 text-left">
                      {stats.fees.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. COMPARISON REPORT */}
        {reportType === "COMPARISON" && comparisonStats && (
          <div className="space-y-6">
            <h3 className="font-black text-lg text-slate-800 mb-4 border-r-4 border-indigo-500 pr-3">
              مقارنة الأداء بين فترتين
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-xs font-black text-blue-800 mb-1">
                  الفترة الأساسية (الحالية)
                </p>
                <p className="text-sm font-bold text-blue-600">
                  {startDate} إلى {endDate}
                </p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="text-xs font-black text-slate-600 mb-1">
                  فترة المقارنة (السابقة)
                </p>
                <p className="text-sm font-bold text-slate-500">
                  {compareStartDate} إلى {compareEndDate}
                </p>
              </div>
            </div>

            {!isExportingPdf && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 mb-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-700 mb-6 text-center">
                  الرسم البياني للمقارنة
                </h4>
                <div className="h-80 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={comparisonStats}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        dataKey="label"
                        tick={{
                          fill: "#64748b",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend
                        wrapperStyle={{
                          paddingTop: "20px",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      />
                      <Bar
                        dataKey="current"
                        name="الفترة الأساسية"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="previous"
                        name="فترة المقارنة"
                        fill="#94a3b8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-center border border-slate-200">
                <thead className="bg-slate-800 text-white font-black text-xs">
                  <tr>
                    <th className="p-3 border border-slate-700 text-right">
                      المؤشر
                    </th>
                    <th className="p-3 border border-slate-700">
                      الفترة الأساسية
                    </th>
                    <th className="p-3 border border-slate-700">
                      فترة المقارنة
                    </th>
                    <th className="p-3 border border-slate-700">الفرق</th>
                    <th className="p-3 border border-slate-700">نسبة التغير</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonStats.map((stat, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >
                      <td className="p-3 border-r border-slate-200 text-right font-bold">
                        {stat.label}
                      </td>
                      <td className="p-3 border-r border-slate-200 font-mono text-blue-700 font-bold">
                        {stat.current.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        {stat.unit}
                      </td>
                      <td className="p-3 border-r border-slate-200 font-mono text-slate-600">
                        {stat.previous.toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}{" "}
                        {stat.unit}
                      </td>
                      <td
                        className="p-3 border-r border-slate-200 font-mono font-bold"
                        dir="ltr"
                      >
                        <span
                          className={
                            stat.diff > 0
                              ? "text-green-600"
                              : stat.diff < 0
                                ? "text-red-600"
                                : "text-slate-400"
                          }
                        >
                          {stat.diff > 0 ? "+" : ""}
                          {stat.diff.toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </td>
                      <td
                        className="p-3 border-r border-slate-200 font-mono font-black"
                        dir="ltr"
                      >
                        <span
                          className={`px-2 py-1 rounded-lg ${stat.percent > 0 ? "bg-green-100 text-green-700" : stat.percent < 0 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {stat.percent > 0 ? "+" : ""}
                          {stat.percent.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 7. LAB REPORT */}
        {reportType === "LAB" && labStats && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex justify-between items-center mb-6">
              {" "}
              <div>
                {" "}
                <p className="text-xs font-black text-slate-400 uppercase">
                  فلترة العينات
                </p>{" "}
                <div className="flex gap-4 mt-1">
                  {" "}
                  <span className="text-sm font-bold text-slate-800">
                    المختبر: {filterLab === "ALL" ? "الكل" : filterLab}
                  </span>{" "}
                  <span className="text-sm font-bold text-slate-800">
                    نوع الفحص:{" "}
                    {filterTestType === "ALL" ? "الكل" : filterTestType}
                  </span>{" "}
                </div>{" "}
              </div>{" "}
            </div>
            <div className="grid grid-cols-4 gap-4 mb-4">
              {" "}
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
                {" "}
                <p className="text-[10px] font-bold text-purple-500 uppercase">
                  إجمالي العينات
                </p>{" "}
                <p className="text-xl font-black text-purple-700">
                  {labStats.total}
                </p>{" "}
              </div>{" "}
              <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                {" "}
                <p className="text-[10px] font-bold text-green-500 uppercase">
                  مطابقة
                </p>{" "}
                <p className="text-xl font-black text-green-700">
                  {labStats.compliant}
                </p>{" "}
              </div>{" "}
              <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-center">
                {" "}
                <p className="text-[10px] font-bold text-red-500 uppercase">
                  مرفوضة
                </p>{" "}
                <p className="text-xl font-black text-red-700">
                  {labStats.nonCompliant}
                </p>{" "}
              </div>{" "}
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-center">
                {" "}
                <p className="text-[10px] font-bold text-amber-500 uppercase">
                  قيد الإجراء
                </p>{" "}
                <p className="text-xl font-black text-amber-700">
                  {labStats.pending}
                </p>{" "}
              </div>{" "}
            </div>
            {!isExportingPdf && labStats.total > 0 && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 mb-8 shadow-sm flex flex-col items-center">
                <h4 className="text-sm font-black text-slate-700 mb-4 text-center">
                  نتائج فحص العينات
                </h4>
                <div className="h-64 w-full max-w-md" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "مطابقة",
                            value: labStats.compliant,
                            color: "#16a34a",
                          },
                          {
                            name: "مرفوضة",
                            value: labStats.nonCompliant,
                            color: "#dc2626",
                          },
                          {
                            name: "قيد الإجراء",
                            value: labStats.pending,
                            color: "#d97706",
                          },
                        ].filter((d) => d.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          {
                            name: "مطابقة",
                            value: labStats.compliant,
                            color: "#16a34a",
                          },
                          {
                            name: "مرفوضة",
                            value: labStats.nonCompliant,
                            color: "#dc2626",
                          },
                          {
                            name: "قيد الإجراء",
                            value: labStats.pending,
                            color: "#d97706",
                          },
                        ]
                          .filter((d) => d.value > 0)
                          .map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-right border border-slate-200">
                <thead className="bg-purple-900 text-white font-black text-[10px]">
                  <tr>
                    <th
                      className={`border-l border-purple-800 w-10 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                    >
                      #
                    </th>
                    {selectedLabColumnKeys.map((key) => {
                      const colDef = AVAILABLE_LAB_COLUMNS.find(
                        (col) => col.key === key,
                      );
                      return (
                        <th
                          key={key}
                          className={`border-l border-purple-800 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                        >
                          {colDef?.label || key}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="text-[10px] font-medium">
                  {processedLabSamples.map((s, idx) => (
                    <tr
                      key={`${s.sampleId}-${idx}`}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td
                        className={`border-l border-slate-100 font-mono ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                      >
                        {idx + 1}
                      </td>
                      {selectedLabColumnKeys.map((key) => (
                        <td
                          key={key}
                          className={`border-l border-slate-100 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                        >
                          {key === "result" ? (
                            <span
                              className={`px-2 py-0.5 rounded font-bold ${s.result === "Compliant" ? "text-green-700 bg-green-100" : s.result === "NonCompliant" ? "text-red-700 bg-red-100" : "text-amber-700 bg-amber-100"}`}
                            >
                              {getLabCellValue(s, key)}
                            </span>
                          ) : key === "sampleId" ||
                            key === "bayanNumber" ||
                            key === "sampleDate" ? (
                            <span className="font-mono font-bold text-slate-700">
                              {getLabCellValue(s, key)}
                            </span>
                          ) : (
                            getLabCellValue(s, key)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {processedLabSamples.length === 0 && (
                    <tr>
                      <td
                        colSpan={selectedLabColumnKeys.length + 1}
                        className="p-6 text-center text-slate-400"
                      >
                        لا توجد عينات مسجلة تطابق الفلاتر المحددة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. AUDIT REPORT */}
        {reportType === "AUDIT" && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  تقرير سجل التتبع للإرساليات المحددة
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1">
                  يحتوي على كافة التعديلات والإجراءات الفنية المسجلة بالنظام
                </p>
              </div>
                <div className="flex gap-4">
                  <select value={auditActionFilter} onChange={(e) => setAuditActionFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none">
                    <option value="ALL">نوع العملية</option>
                    <option value="إنشاء">إنشاء</option>
                    <option value="تحديث">تحديث</option>
                    <option value="حذف">حذف</option>
                  </select>
                  <select value={auditFieldFilter} onChange={(e) => {setAuditFieldFilter(e.target.value); setAuditValueFilter("ALL");}} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none">
                    <option value="ALL">الحقل المتغير</option>
                    <option value="status">الحالة النهائية</option>
                    <option value="inspectionResult">نتيجة المعاينة</option>
                    <option value="technicalAction">الإجراء الفني</option>
                  </select>
                  {auditFieldFilter !== "ALL" && (
                    <select value={auditValueFilter} onChange={(e) => setAuditValueFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none animate-in fade-in slide-in-from-right-2">
                       <option value="ALL">كل القفل</option>
                       {auditFieldFilter === "status" && (
                         <>
                           <option value="Pending">قيد الإجراء</option>
                           <option value="Approved">مقبول</option>
                           <option value="Rejected">مرفوض</option>
                         </>
                       )}
                       {auditFieldFilter === "inspectionResult" && (
                         <>
                           <option value="مطابق">مطابق</option>
                           <option value="غير مطابق">غير مطابق</option>
                           <option value="قيد الفحص">قيد الفحص</option>
                         </>
                       )}
                       {auditFieldFilter === "technicalAction" && (
                         <>
                           <option value="إفراج">إفراج</option>
                           <option value="رفض">رفض</option>
                           <option value="تحويل">تحويل</option>
                           <option value="سحب عينة">سحب عينة</option>
                         </>
                       )}
                    </select>
                  )}
                  <select value={auditStatusFilter} onChange={(e) => setAuditStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none">
                    <option value="ALL">فلترة الحالة (Status Change)</option>
                    <option value="Pending">قيد الإجراء</option>
                    <option value="Approved">مقبول</option>
                    <option value="Rejected">مرفوض</option>
                  </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right border border-slate-200">
                <thead className="bg-slate-800 text-white font-black text-[10px]">
                  <tr>
                    <th
                      className={`border-l border-slate-700 w-10 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                    >
                      #
                    </th>
                    <th
                      className={`border-l border-slate-700 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                    >
                      رقم الإرسالية
                    </th>
                    <th
                      className={`border-l border-slate-700 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                    >
                      الوقت والتاريخ
                    </th>
                    <th
                      className={`border-l border-slate-700 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                    >
                      المستخدم
                    </th>
                    <th
                      className={`border-l border-slate-700 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                    >
                      الإجراء
                    </th>
                    <th
                      className={`border-l border-slate-700 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                    >
                      التفاصيل
                    </th>
                    <th
                      className={`border-l border-slate-700 w-1/3 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                    >
                      تغييرات الحقول
                    </th>
                  </tr>
                </thead>
                <tbody className="text-[10px] font-medium">
                  {filteredData.flatMap((c) =>
                    (c.auditLog || []).map((log) => ({
                      ...log,
                      consignmentId: c.id,
                      bayan: c.bayanNumber,
                    })),
                  ).length > 0 ? (
                    filteredData
                      .flatMap((c) =>
                        (c.auditLog || [])
                          .filter((log) => {
                            const actionMatch = auditActionFilter === "ALL" || log.action === auditActionFilter;
                            const statusMatch = auditStatusFilter === "ALL" || log.statusChange === auditStatusFilter;
                            
                            // Field and Value specific filtering
                            let fieldMatch = true;
                            if (auditFieldFilter !== "ALL") {
                              const change = log.changes?.find(ch => ch.field === auditFieldFilter);
                              if (!change) {
                                fieldMatch = false;
                              } else if (auditValueFilter !== "ALL") {
                                fieldMatch = String(change.newValue).includes(auditValueFilter);
                              }
                            }
                            
                            return actionMatch && statusMatch && fieldMatch;
                          })
                          .map((log, lIdx) => ({
                            ...log,
                            consignmentId: c.id,
                            bayan: c.bayanNumber,
                            uid: `${c.id}-${lIdx}`,
                          })),
                      )
                      .map((log, idx) => (
                        <tr
                          key={log.uid}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td
                            className={`border-l border-slate-100 font-mono ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                          >
                            {idx + 1}
                          </td>
                          <td
                            className={`border-l border-slate-100 font-mono font-bold text-slate-700 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                          >
                            {log.consignmentId}{" "}
                            {log.bayan && (
                              <span className="text-slate-400 font-normal">
                                {" "}
                                /<br />
                                {log.bayan}
                              </span>
                            )}
                          </td>
                          <td
                            className={`border-l border-slate-100 font-mono text-slate-600 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                            dir="ltr"
                          >
                            {safeFormatDateTime(log.timestamp)}
                          </td>
                          <td
                            className={`border-l border-slate-100 font-bold text-slate-800 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                          >
                            {log.user}
                          </td>
                          <td
                            className={`border-l border-slate-100 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                          >
                            <span className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-black">
                              {log.action}
                            </span>
                          </td>
                          <td
                            className={`border-l border-slate-100 text-slate-600 leading-relaxed ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                          >
                            {log.details || "-"}
                          </td>
                          <td
                            className={`border-l border-slate-100 ${isExportingPdf ? "p-1 text-[7px]" : "p-2"}`}
                          >
                            {log.changes && log.changes.length > 0 ? (
                              <div className="space-y-2">
                                {log.changes.map((ch, i) => (
                                  <div
                                    key={i}
                                    className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-w-full"
                                  >
                                    <div className="font-black text-indigo-700 mb-1">
                                      {ch.label || ch.field}
                                    </div>
                                    <div
                                      className="flex flex-col gap-1 text-[9px] font-mono break-all"
                                      dir="ltr"
                                    >
                                      <div className="flex gap-2 items-center w-full">
                                        <span className="bg-red-50 text-red-700 px-1 rounded flex-1 line-through">
                                          {typeof ch.oldValue === "object"
                                            ? JSON.stringify(
                                                ch.oldValue,
                                              ).substring(0, 50) + "..."
                                            : String(ch.oldValue || "-")}
                                        </span>
                                      </div>
                                      <div className="flex justify-center">
                                        <i className="fas fa-arrow-down text-slate-300"></i>
                                      </div>
                                      <div className="flex gap-2 items-center w-full">
                                        <span className="bg-green-50 text-green-700 px-1 rounded flex-1 font-bold">
                                          {typeof ch.newValue === "object"
                                            ? JSON.stringify(
                                                ch.newValue,
                                              ).substring(0, 50) + "..."
                                            : String(ch.newValue || "-")}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-slate-500 font-bold border-l border-slate-100"
                      >
                        <i className="fas fa-info-circle text-2xl mb-2 text-slate-300 block"></i>
                        لا توجد تقارير تتبع لهذه الإرساليات في الفترة المحددة
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-end text-xs font-bold text-slate-500">
          <div>
            <p>تم استخراج التقرير بواسطة: النظام الآلي (MIRQAB)</p>
          </div>
          <div className="text-left">
            <p>اعتماد رئيس القسم:</p>
            <div className="h-12 w-32 border-b border-dashed border-slate-400 mt-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsManager;
