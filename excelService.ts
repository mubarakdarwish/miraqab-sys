import * as XLSX from 'xlsx';
import { Consignment, ConsignmentType, ConsignmentItem, WorkflowStep, Importer, ConsignmentDirection, ClearanceOffice, CommodityGroup, Laboratory, User } from './types';
import { generateConsignmentId } from './constants';

export const parseConsignmentsFromExcel = async (
  file: File, 
  activeSector: ConsignmentType,
  currentUser: string
): Promise<Consignment[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        const importedConsignments: Consignment[] = rawData.map((row, index) => {
          const consignmentId = generateConsignmentId(activeSector, Math.floor(Date.now() % 10000) + index);
          const itemId = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

          const item: ConsignmentItem = {
            id: itemId,
            description: row['نوع المنتج'] || row['اسم المنتج'] || row['Product Name'] || 'منتج مستورد',
            commodityGroup: row['المجموعة السلعية'] || row['Commodity Group'] || '',
            brand: row['العلامة التجارية'] || '',
            origin: row['المنشأ'] || row['Origin'] || '',
            weight: Number(row['الوزن -كجم'] || row['الوزن'] || row['Weight'] || 0),
            packageCount: Number(row['الكمية'] || row['عدد الطرود'] || row['Quantity'] || 0),
            packagingUnit: row['الوحدة'] || 'كرتون',
            storageTemp: row['درجة حرارة حفظ المنتج'] || row['Product Temp'] || '',
            sampleCondition: row['حالة العينة'] || row['Sample Condition'] || '',
            batchNumber: '',
            productionDate: '',
            expiryDate: ''
          };

          const rawBayan = row['رقم البيان الجمركي (ثمانية أرقام)'] || row['رقم البيان'] || row['Bayan No'] || `TEMP-${Date.now()}-${Math.floor(Math.random()*1000)}`;
          const rawImporter = row['اسم المستورد'] || row['المستورد'] || 'غير محدد';

          const isOutgoing = (row['نوع البيان'] || 'استيراد') === 'تصدير' || (row['نوع البيان'] || 'استيراد') === 'إعادة تصدير';
          const consignment: Consignment = {
            id: consignmentId,
            type: activeSector,
            direction: isOutgoing ? ConsignmentDirection.OUTBOUND : ConsignmentDirection.INBOUND,
            bayanNumber: String(rawBayan),
            declarationType: row['نوع البيان'] || 'استيراد',
            importer: String(rawImporter),
            shippingCountry: row['المنشأ'] || '', 
            arrivalDate: row['التاريخ'] || row['تاريخ الوصول'] || new Date().toISOString().split('T')[0],
            port: 'ميناء صحار',
            items: [item],
            totalWeight: item.weight,
            totalPackageCount: item.packageCount,
            commodityGroup: item.commodityGroup || 'عام',
            containerCount: Number(row['عدد الحاويات في البيان'] || row['عدد الحاويات'] || 1),
            containerType: row['نوع الحاوية'] || 'General',
            containerTemp: row['درجة حرارة الحاوية'] || '',
            clearanceOffice: row['شركة التخليص'] || '',
            customsBroker: row['اسم المندوب'] || '',
            inspectionType: 'ظاهري', 
            currentStep: WorkflowStep.ARRIVAL,
            hasSample: false,
            samples: [], 
            labAnalysisType: [],
            inspectionResult: row['الإجراء المُتخذ'] || 'قيد الفحص',
            fees: Number(row['الرسوم'] || 0),
            inspectorName: row['اسم الموظف'] || currentUser,
            inspectionLocation: row['موقع المعاينة'] || '',
            inspectionNotes: row['ملاحظات المعاينة'] || '',
            technicalAction: row['الإجراء المُتخذ'] || '',
            rejectionReason: row['سبب الرفض / التحويل'] || '',
            correspondenceNumber: row['رقم قيد المراسلة'] || '',
            remarks: row['ملاحظات'] || '',
            feeRemarks: '',
            hasUndertaking: !!row['التعهد (إن وجد)'],
            isUndertakingMet: row['استيفاء التعهد'] === 'نعم' || false,
            undertakingCompletionDate: row['تاريخ انتهاء التعهد'] || '',
            riskScore: 0,
            riskAssessment: 'يتطلب التقييم',
            isLocked: false,
            status: 'Pending',
            createdAt: new Date().toISOString(),
            dataCompletionStatus: row['حالة اكتمال البيانات'] === 'مكتمل' ? 'Complete' : 'Incomplete',
            auditLog: [{
              timestamp: new Date().toISOString(),
              action: 'استيراد بيانات',
              user: currentUser,
              details: 'تم استيراد البيانات من ملف Excel خارجي'
            }]
          };

          return consignment;
        });

        resolve(importedConsignments);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const parseImportersFromExcel = async (file: File): Promise<Importer[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawData: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        const importedImporters: Importer[] = rawData.map((row) => {
          return {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: String(row['اسم الشركة'] || row['Company Name'] || ''),
            crNumber: String(row['رقم السجل التجاري'] || row['CR Number'] || ''),
            phone: String(row['رقم الهاتف'] || row['Phone'] || ''),
            email: String(row['البريد الإلكتروني'] || row['Email'] || ''),
            address: String(row['العنوان'] || row['Address'] || ''),
            defaultClearanceOffice: String(row['شركة التخليص'] || row['Clearance Company'] || ''),
            defaultBroker: String(row['المندوب'] || row['Broker'] || ''),
            isActive: true,
            rating: 100
          };
        }).filter(imp => imp.name && imp.crNumber);

        resolve(importedImporters);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

export const downloadTemplate = (sector: ConsignmentType) => {
  const headers = [
    'التاريخ',
    'اسم الموظف',
    'رقم البيان الجمركي (ثمانية أرقام)',
    'نوع البيان',
    'نوع الحاوية',
    'عدد الحاويات في البيان',
    'نوع المنتج',
    'الكمية',
    'الوزن -كجم',
    'المنشأ',
    'درجة حرارة حفظ المنتج',
    'حالة العينة',
    'درجة حرارة الحاوية',
    'شركة التخليص',
    'اسم المندوب',
    'الرسوم',
    'اسم المستورد',
    'الإجراء المُتخذ',
    'موقع المعاينة',
    'ملاحظات المعاينة',
    'التعهد (إن وجد)',
    'تاريخ انتهاء التعهد',
    'استيفاء التعهد',
    'سبب الرفض / التحويل',
    'رقم قيد المراسلة',
    'ملاحظات',
    'حالة اكتمال البيانات'
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Template");
  XLSX.writeFile(wb, `Mirqab_Import_Template_${sector}.xlsx`);
};

export const downloadImporterTemplate = () => {
  const headers = [
    'اسم الشركة',
    'رقم السجل التجاري',
    'رقم الهاتف',
    'البريد الإلكتروني',
    'العنوان',
    'شركة التخليص',
    'المندوب'
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Importers");
  XLSX.writeFile(wb, `Mirqab_Importers_Template.xlsx`);
};

export const getLogoBase64 = async (): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width || 364;
            canvas.height = img.height || 172;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            } else {
                resolve('');
            }
        };
        img.onerror = () => resolve('');
        img.src = 'https://www.mafwr.gov.om/images/tharawat_combine.a3b4ad46.svg';
    });
};

export const getMirqabLogoBase64 = async (): Promise<string> => {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            resolve('');
            return;
        }

        // Draw Shield
        ctx.beginPath();
        ctx.moveTo(100, 10);
        ctx.lineTo(180, 50);
        ctx.lineTo(180, 150);
        ctx.lineTo(100, 190);
        ctx.lineTo(20, 150);
        ctx.lineTo(20, 50);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, 0, 200, 200);
        gradient.addColorStop(0, '#c8102e');
        gradient.addColorStop(1, '#c8102e');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw M / Watchtower
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        ctx.moveTo(60, 140);
        ctx.lineTo(60, 80);
        ctx.lineTo(100, 60);
        ctx.lineTo(140, 80);
        ctx.lineTo(140, 140);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(80, 140);
        ctx.lineTo(80, 100);
        ctx.lineTo(120, 100);
        ctx.lineTo(120, 140);
        ctx.stroke();

        // Draw Eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(100, 84, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        ctx.beginPath();
        ctx.arc(100, 84, 20, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Green Accent
        ctx.strokeStyle = '#007a3d';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(60, 160);
        ctx.lineTo(140, 160);
        ctx.stroke();

        resolve(canvas.toDataURL('image/png'));
    });
};

export const exportToExcel = async (data: any[], fileName: string, sheetName: string = "Data") => {
  const ExcelJS = await import('exceljs');
  const { saveAs } = await import('file-saver');

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  const logoBase64 = await getLogoBase64();
  const mirqabLogoBase64 = await getMirqabLogoBase64();
  
  try {
      if (logoBase64) {
          const imageId = workbook.addImage({
              base64: logoBase64,
              extension: 'png',
          });
          
          worksheet.addImage(imageId, {
              tl: { col: 0, row: 0 },
              ext: { width: 120, height: 60 }
          });
      }

      if (mirqabLogoBase64) {
          const mirqabImageId = workbook.addImage({
              base64: mirqabLogoBase64,
              extension: 'png',
          });
          
          worksheet.addImage(mirqabImageId, {
              tl: { col: 8, row: 0 },
              ext: { width: 60, height: 60 }
          });
      }
  } catch (e) {
      console.warn("Could not add logos to excel", e);
  }

  // Add Title
  worksheet.mergeCells('C2:H3');
  const titleCell = worksheet.getCell('C2');
  titleCell.value = fileName.replace(/_/g, ' ');
  titleCell.font = { name: 'Arial', size: 18, bold: true, color: { argb: 'FFC8102E' } }; // Omani Red
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

  // Add Date
  worksheet.mergeCells('C4:H4');
  const dateCell = worksheet.getCell('C4');
  dateCell.value = `تاريخ التقرير: ${new Date().toLocaleDateString('ar-OM')}`;
  dateCell.font = { name: 'Arial', size: 12, italic: true };
  dateCell.alignment = { vertical: 'middle', horizontal: 'center' };

  if (data && data.length > 0) {
      const keys = Object.keys(data[0]);
      
      worksheet.columns = keys.map(key => ({
          key: key,
          width: Math.max(15, key.length * 2)
      }));

      worksheet.getRow(7).values = keys;

      const headerRow = worksheet.getRow(7);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF007A3D' } // Omani Green
      };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.height = 25;

      data.forEach((item, index) => {
          const row = worksheet.addRow(item);
          row.alignment = { vertical: 'middle', horizontal: 'center' };
          row.height = 20;
          
          // Alternating row colors
          if (index % 2 === 0) {
              row.fill = {
                  type: 'pattern',
                  pattern: 'solid',
                  fgColor: { argb: 'FFF1F5F9' }
              };
          }

          // Add borders to all cells in the row
          row.eachCell((cell) => {
              cell.border = {
                  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                  right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
              };
          });
      });

      // Auto-size columns based on content
      worksheet.columns.forEach((column, i) => {
          let maxLength = 0;
          column.eachCell!({ includeEmpty: true }, (cell) => {
              const columnLength = cell.value ? cell.value.toString().length : 10;
              if (columnLength > maxLength) {
                  maxLength = columnLength;
              }
          });
          column.width = maxLength < 12 ? 12 : maxLength + 2;
      });
  }

  worksheet.views = [
      { rightToLeft: true }
  ];

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};

export const exportConsignmentsToExcel = async (consignments: Consignment[], fileName: string) => {
    const ExcelJS = await import('exceljs');
    const { saveAs } = await import('file-saver');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تقرير الإرساليات');

    const logoBase64 = await getLogoBase64();
    const mirqabLogoBase64 = await getMirqabLogoBase64();
    
    try {
        if (logoBase64) {
            const imageId = workbook.addImage({
                base64: logoBase64,
                extension: 'png',
            });
            worksheet.addImage(imageId, {
                tl: { col: 0, row: 0 },
                ext: { width: 120, height: 60 }
            });
        }

        if (mirqabLogoBase64) {
            const mirqabImageId = workbook.addImage({
                base64: mirqabLogoBase64,
                extension: 'png',
            });
            worksheet.addImage(mirqabImageId, {
                tl: { col: 9, row: 0 },
                ext: { width: 60, height: 60 }
            });
        }
    } catch (e) {
        console.warn("Could not add logos to excel", e);
    }

    // Title & Metadata
    worksheet.mergeCells('D2:I3');
    const titleCell = worksheet.getCell('D2');
    titleCell.value = 'التقرير التفصيلي للإرساليات - نظام مرقاب';
    titleCell.font = { name: 'Arial', size: 20, bold: true, color: { argb: 'FFC8102E' } };
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('D4:I4');
    const dateCell = worksheet.getCell('D4');
    dateCell.value = `تاريخ الاستخراج: ${new Date().toLocaleString('ar-OM')}`;
    dateCell.font = { name: 'Arial', size: 11, italic: true };
    dateCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Summary Section
    const totalWeight = consignments.reduce((acc, c) => acc + (Number(c.totalWeight) || 0), 0);
    const totalFees = consignments.reduce((acc, c) => acc + (Number(c.fees) || 0), 0);
    const approvedCount = consignments.filter(c => c.status === 'Approved').length;
    const rejectedCount = consignments.filter(c => c.status === 'Rejected').length;

    const summaryStartRow = 6;
    worksheet.getCell(`B${summaryStartRow}`).value = 'ملخص التقرير:';
    worksheet.getCell(`B${summaryStartRow}`).font = { bold: true, size: 12 };

    const summaryData = [
        ['إجمالي الإرساليات', consignments.length, 'إرسالية'],
        ['إجمالي الوزن', (totalWeight / 1000).toFixed(2), 'طن'],
        ['إجمالي الرسوم', totalFees.toFixed(3), 'ر.ع'],
        ['مفرج عنها', approvedCount, 'إرسالية'],
        ['مرفوضة', rejectedCount, 'إرسالية']
    ];

    summaryData.forEach((row, i) => {
        const r = worksheet.getRow(summaryStartRow + 1 + i);
        r.values = ['', row[0], row[1], row[2]];
        r.getCell(2).font = { bold: true };
        r.getCell(3).alignment = { horizontal: 'center' };
        r.getCell(3).font = { color: { argb: i === 3 ? 'FF007A3D' : i === 4 ? 'FFC8102E' : 'FF000000' } };
    });

    // Table Headers
    const headers = [
        'رقم البيان', 'المنفذ', 'المستورد', 'نوع البيان', 'المنتجات', 'الوزن (كجم)', 'الرسوم', 'الحالة', 'المفتش', 'التاريخ'
    ];
    const tableHeaderRow = 13;
    const headerRow = worksheet.getRow(tableHeaderRow);
    headerRow.values = headers;
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF007A3D' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 30;

    // Data Mapping
    consignments.forEach((c, index) => {
        const row = worksheet.addRow([
            c.bayanNumber,
            c.port,
            c.importer,
            c.declarationType,
            c.items.map(i => i.description).join('، '),
            c.totalWeight,
            c.fees,
            c.status === 'Approved' ? 'مفرج عنه' : c.status === 'Rejected' ? 'مرفوض' : 'قيد الإجراء',
            c.inspectorName,
            new Date(c.arrivalDate).toLocaleDateString('ar-OM')
        ]);

        row.alignment = { vertical: 'middle', horizontal: 'center' };
        row.height = 25;

        // Status Coloring
        const statusCell = row.getCell(8);
        if (c.status === 'Approved') {
            statusCell.font = { color: { argb: 'FF007A3D' }, bold: true };
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4EA' } };
        } else if (c.status === 'Rejected') {
            statusCell.font = { color: { argb: 'FFC8102E' }, bold: true };
            statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE8E6' } };
        }

        // Alternating rows
        if (index % 2 === 0) {
            row.eachCell((cell, colNumber) => {
                if (colNumber !== 8) { // Don't override status cell fill
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                }
            });
        }

        // Borders
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            };
        });
    });

    // Auto-size columns
    worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell!({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) maxLength = columnLength;
        });
        column.width = Math.min(30, Math.max(12, maxLength + 2));
    });

    worksheet.views = [{ rightToLeft: true }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);
};

export const exportImportersToExcel = async (importers: Importer[], fileName: string) => {
    const data = importers.map(i => ({
        'اسم الشركة': i.name,
        'رقم السجل التجاري': i.crNumber || '-',
        'رقم التواصل': i.contact || i.phone || '-',
        'البريد الإلكتروني': i.email || '-',
        'العنوان': i.address || '-',
        'التقييم': `${i.rating || 100}%`,
        'الحالة': i.isActive === false ? 'موقوف' : 'نشط',
        'ملاحظات': i.notes || '-'
    }));
    await exportToExcel(data, fileName, 'الشركات المستوردة');
};

export const exportClearanceOfficesToExcel = async (offices: ClearanceOffice[], fileName: string) => {
    const data = offices.map(o => ({
        'اسم المكتب': o.name,
        'رقم السجل التجاري': o.crNumber || '-',
        'رقم التواصل': o.contact || '-',
        'البريد الإلكتروني': o.email || '-',
        'المخلصين المعتمدين': o.brokers?.join('، ') || '-',
        'التقييم': `${o.rating || 100}%`,
        'الحالة': o.isActive === false ? 'موقوف' : 'نشط'
    }));
    await exportToExcel(data, fileName, 'مكاتب التخليص');
};

export const exportCommodityGroupsToExcel = async (groups: CommodityGroup[], fileName: string) => {
    const data = groups.map(g => ({
        'القطاع': g.sector,
        'اسم المجموعة': g.name,
        'المنتجات المندرجة': g.products?.join('، ') || '-'
    }));
    await exportToExcel(data, fileName, 'المجموعات السلعية');
};

export const exportLaboratoriesToExcel = async (labs: Laboratory[], fileName: string) => {
    const data = labs.map(l => ({
        'اسم المختبر': l.name,
        'النوع': l.type === 'GOVERNMENT' ? 'حكومي' : 'خاص',
        'الاعتمادات': l.accreditations?.join('، ') || '-',
        'رقم التواصل': l.contact || '-',
        'البريد الإلكتروني': l.email || '-',
        'الحالة': l.isActive === false ? 'موقوف' : 'نشط'
    }));
    await exportToExcel(data, fileName, 'المختبرات');
};

export const exportUsersToExcel = async (users: User[], fileName: string) => {
    const data = users.map(u => ({
        'اسم المستخدم': u.name,
        'البريد الإلكتروني': u.email,
        'الدور': u.role === 'ADMIN' ? 'مدير نظام' : u.role === 'INSPECTOR' ? 'مفتش' : u.role === 'LAB_TECH' ? 'فني مختبر' : u.role === 'LOGISTICS' ? 'موظف لوجستي' : 'مراقب',
        'القطاعات المصرحة': u.allowedSectors?.join('، ') || 'الكل',
        'المنافذ المصرحة': u.assignedPorts?.join('، ') || 'الكل',
        'الحالة': u.isActive === false ? 'موقوف' : 'نشط'
    }));
    await exportToExcel(data, fileName, 'المستخدمين');
};
