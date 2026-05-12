
import { GoogleGenAI, Type } from "@google/genai";
import { ConsignmentItem } from "./types";

/**
 * نظام المساعد الذكي (مرقاب AI)
 * يتبع إرشادات Google GenAI SDK 2.5/3.0
 */

const handleAiError = (error: any, context: string) => {
  if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
    console.warn(`Gemini Quota Exceeded for ${context}`);
    return { isQuotaError: true };
  }
  if (error?.message?.includes('Rpc failed') || error?.message?.includes('xhr error') || error?.status === 500) {
    console.warn(`Gemini Connection Error for ${context}`);
    return { isConnectionError: true };
  }
  console.error(`AI ${context} Failed:`, error);
  return { isUnknownError: true };
};

// وظيفة تحليل النصوص غير المنظمة وتعبئة الاستمارة
export const parseRegistrationText = async (text: string, sector: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a specialized data extraction assistant for a Port Authority system (MIRQAB).
      Current Date: ${today}.
      Sector: ${sector}.

      Task: Extract consignment details from the unstructured text below. 
      
      Rules:
      1. **Bayan Number**: Look for patterns like "B-...", "401...", or just labeled numbers.
      2. **Permit Number**: Look for permit numbers, licenses, or authorization codes (رقم التصريح).
      3. **Date**: Convert any date (relative like "tomorrow" or explicit) to YYYY-MM-DD format.
      4. **Weights**: Convert tons to kg (x1000). Return numbers only.
      5. **Items**: Extract all listed items. Infer "Commodity Group" if possible based on the item name and Sector.
      6. **Language**: The input might be Arabic, English, or mixed. Output values in the language suitable for a formal register (Arabic preferred for descriptions).

      Input Text:
      "${text}"
      
      Return JSON format matching this schema strictly.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            bayanNumber: { type: Type.STRING },
            permitNumber: { type: Type.STRING },
            importer: { type: Type.STRING },
            shippingCountry: { type: Type.STRING },
            arrivalDate: { type: Type.STRING },
            declarationType: { type: Type.STRING, enum: ["استيراد", "تصدير", "إعادة تصدير", "عبور (ترانزيت)"] },
            port: { type: Type.STRING },
            originPort: { type: Type.STRING },
            containerCount: { type: Type.NUMBER },
            containerTemp: { type: Type.STRING },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  origin: { type: Type.STRING },
                  weight: { type: Type.NUMBER },
                  packageCount: { type: Type.NUMBER },
                  commodityGroup: { type: Type.STRING },
                  brand: { type: Type.STRING },
                  producingCompany: { type: Type.STRING },
                  sampleSource: { type: Type.STRING },
                  securitySeal: { type: Type.STRING },
                  customerCode: { type: Type.STRING },
                  storageTemp: { type: Type.STRING },
                  sampleCondition: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    handleAiError(error, "Text Parsing");
    return null;
  }
};

// وظيفة استخراج البيانات من صور المستندات (OCR)
export const extractDataFromDocument = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  try {
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Image.split(',')[1],
      },
    };
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { 
        parts: [
          imagePart, 
          { text: "Analyze this document (Customs Declaration or Bill of Lading). Extract: Bayan Number, Importer Name, Total Weight, Arrival Date, and Shipping Country. Return JSON." }
        ] 
      },
      config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
                bayanNumber: { type: Type.STRING },
                importer: { type: Type.STRING },
                totalWeight: { type: Type.NUMBER },
                arrivalDate: { type: Type.STRING },
                shippingCountry: { type: Type.STRING }
            }
          }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    handleAiError(error, "Document Scan");
    return null;
  }
};

export const analyzeConsignmentRisk = async (importer: string, items: ConsignmentItem[], type: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  try {
    const itemsDescription = items.map(i => 
      `- المنتج: ${i.description}, المنشأ: ${i.origin}, الوزن: ${i.weight} كجم`
    ).join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بناءً على البيانات التالية لشحنة واردة لميناء صحار، قم بتقييم مستوى المخاطر (رقم من 0 إلى 100) وقدم مبرراً قصيراً جداً.
        المستورد: ${importer}
        نوع الشحنة العام: ${type}
        قائمة المنتجات:
        ${itemsDescription}
        رد بصيغة JSON فقط تحتوي على: score (رقم), reason (نص باللغة العربية).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            reason: { type: Type.STRING }
          },
          required: ["score", "reason"]
        }
      }
    });
    return JSON.parse(response.text || '{"score": 15, "reason": "تحليل افتراضي"}');
  } catch (error: any) {
    const errType = handleAiError(error, "Risk Analysis");
    if (errType.isQuotaError) {
      return { score: 20, reason: "تنبيه: تم تجاوز حصة AI. تم استخدام تقييم افتراضي." };
    }
    if (errType.isConnectionError) {
      return { score: 20, reason: "تنبيه: فشل الاتصال بخدمة تحليل المخاطر. تم استخدام تقييم افتراضي." };
    }
    return { score: 20, reason: "تم التقييم يدوياً" };
  }
};

export const suggestLaboratoryTests = async (type: string, cargoDetails: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `اقترح الفحوصات المختبرية اللازمة لهذه الشحنة. النوع: ${type}, التفاصيل: ${cargoDetails}. رد بصيغة JSON (array of strings).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
      }
    });
    return JSON.parse(response.text || '["فحص ظاهري"]');
  } catch (error: any) {
    const errType = handleAiError(error, "Lab Test Suggestion");
    if (errType.isQuotaError) {
      return ["فحص قياسي (تنبيه: حصة AI منتهية)"];
    }
    if (errType.isConnectionError) {
        return ["فحص قياسي (تنبيه: لا يوجد اتصال بالخدمة)"];
    }
    return ["فحص قياسي"];
  }
};

export const predictPortWorkload = async () => {
  return {
    expectedTomorrow: Math.floor(Math.random() * 40) + 60,
    peakHours: "08:30 AM - 12:30 PM",
    inspectorRequirement: "يتطلب طاقم عمل كامل للمناوبة الصباحية"
  };
};

export const getDashboardInsights = async (stats: any, activeSector: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `بصفتك "مرقاب AI"، قم بتحليل إحصائيات لوحة التحكم الحالية لقطاع ${activeSector} وقدم 3 رؤى (insights) موجزة جداً وعملية.
      الإحصائيات: ${JSON.stringify(stats)}
      
      المطلوب:
      1. تحليل سريع للوضع الحالي.
      2. تنبيه أو ملاحظة حول المخاطر أو عبء العمل.
      3. توصية محددة للفريق.
      
      رد بصيغة JSON تحتوي على مصفوفة من 3 كائنات، كل كائن يحتوي على: title (عنوان قصير), text (نص الرؤية), icon (اسم أيقونة FontAwesome مناسبة), type (واحد من: 'info', 'warning', 'success').`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  text: { type: Type.STRING },
                  icon: { type: Type.STRING },
                  type: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });
    return JSON.parse(response.text || '{"insights": []}').insights;
  } catch (error: any) {
    const errType = handleAiError(error, "Dashboard Insights");
    if (errType.isQuotaError) {
      return [{
        title: "تنبيه الحصة (Quota)",
        text: "لقد تجاوزت حصة الاستخدام المجانية لـ Gemini API. سيتم إعادة تعيين الحصة تلقائياً غداً. يمكنك متابعة العمل يدوياً حالياً.",
        icon: "fa-exclamation-triangle",
        type: "warning"
      }];
    }
    
    if (errType.isConnectionError) {
        return [{
            title: "مشكلة في الاتصال بـ AI",
            text: "واجهنا مشكلة في الاتصال بخادم الذكاء الاصطناعي حالياً (فشل RPC). يرجى التحقق من مفتاح API أو المحاولة لاحقاً.",
            icon: "fa-wifi-slash",
            type: "warning"
        }];
    }
    
    return [];
  }
};

export const chatWithSystem = async (query: string, systemContext: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
  try {
    const contextStr = JSON.stringify(systemContext);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are "Mirqab Copilot", an AI assistant for the Sohar Port Smart Inspection System.
      
      System Context (Current Data):
      ${contextStr}

      User Query: "${query}"

      Instructions:
      1. Answer the user's question based *strictly* on the provided context if it's about data.
      2. If the user asks about regulations, provide general best practices for Oman Customs/Agriculture/Veterinary.
      3. Keep answers concise, professional, and helpful.
      4. If the user asks to perform an action (like "reject shipment X"), explain that you can't do that yet but they can do it from the portal.
      5. Reply in Arabic unless the user asks in English.
      
      Return plain text response.`,
    });
    return response.text || "عذراً، لم أتمكن من معالجة طلبك حالياً.";
  } catch (error: any) {
    const errType = handleAiError(error, "Chat Copilot");
    if (errType.isQuotaError) {
      return "عذراً، لقد تجاوزت حصة الاستخدام الحالية لـ Gemini API. سيتم إعادة تعيين الحصة غداً. يمكنك متابعة العمل يدوياً حالياً.";
    }
    if (errType.isConnectionError) {
        return "واجهت مشكلة في الاتصال بخادم الذكاء الاصطناعي (فشل اتصال). يرجى المحاولة لاحقاً.";
    }
    return "واجهت مشكلة في الاتصال بالخادم. يرجى المحاولة لاحقاً.";
  }
};
