
import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ConsignmentType, ClearanceOffice } from '../types';
import { getCollection } from '../firebaseService';
import { SECTOR_IMAGES } from '../constants';
import Logo from './Logo';

const SECTOR_DETAILS: Record<string, any> = {
    'general': {
        title: 'المركز الإعلامي',
        icon: 'fa-bullhorn',
        color: 'purple',
        description: 'بوابتك لمعرفة أحدث الرسوم، آليات العمل، الإجراءات الإدارية، ودليل المخلصين الجمركيين في ميناء صحار.',
        fees: [
            'رسوم الإرساليات الزراعية',
            'رسوم الإرساليات البيطرية',
            'قرار تحديد الرسوم 228/2024',
            'كشف مختصر لقائمة رسوم الخدمات في القسم'
        ],
        procedures: [
            {
                title: 'استلام المعاملة',
                desc: 'وصول رسالة نصية (SMS) للموظف برقم البيان الجمركي للمعاملة المتواجدة على منصة التفتيش.'
            },
            {
                title: 'المراجعة المستندية',
                desc: 'الدخول لنظام بيان لمراجعة المستندات والتأكد من صحتها ومعرفة تفاصيل المنتج (أرقام التشغيلات، التواريخ، العبوات).'
            },
            {
                title: 'الفحص والمعاينة',
                desc: 'الخروج لفحص المنتج وسحب العينات إن استدعى الأمر بناءً على: التعليمات الواردة، الفحص الدوري، أو مظاهر الاشتباه.'
            },
            {
                title: 'استكمال الإجراء',
                desc: 'الرجوع للنظام لاستكمال المعاملة (رفض، إفراج مشروط، أو إفراج نهائي مع سحب الرسوم).'
            }
        ],
        rejectedProcedures: {
            facilitation: {
                title: 'طلب تسهيل إنجاز معاملة (المعاملات المتوقفة)',
                steps: [
                    'تقديم رسالة في قسم خدمات المراجعين بمقر المديرية العامة للثروة الزراعية والسمكية وموارد المياه بمحافظة شمال الباطنة.',
                    'استلام رقم قيد المراسلة.',
                    'بالإمكان تقديم الرسالة يدوياً أو عبر البريد الإلكتروني: MAFSohar.Agri@mafwr.gov.com',
                    'التواصل مع قسم خدمات المراجعين (22353333) أو البريد والوثائق (22353012) لمتابعة المسار.',
                    'التواصل مع قسم الحجر وسلامة الغذاء لمعرفة الإجراء المتخذ.'
                ]
            },
            disposal: {
                title: 'إعادة التصدير أو الإتلاف',
                steps: [
                    'للإتلاف: موافاتنا برسالة رغبة بالإتلاف. يقوم المخلص بالتنسيق مع شركة "بيئة" والجمارك لتحديد الموعد.',
                    'لإعادة التصدير: موافاتنا برسالة رغبة بإعادة التصدير. يتم إنشاء بيان إعادة تصدير وربطه بالبيان الوارد.'
                ]
            }
        },
        clearanceInfo: {
            title: 'دليل مكاتب التخليص الجمركي',
            desc: 'قاعدة بيانات شاملة لأرقام هواتف المخلصين والمكاتب لتسهيل التواصل.',
            actions: [
                { label: 'عرض الدليل', link: '#' },
                { label: 'تسجيل بيانات مخلص جديد', link: '#' }
            ]
        },
        generalInfo: [
            { title: 'رسوم التفتيش الخارجي', content: 'في حالة تفتيش إرسالية تتبع سلامة وجودة الغذاء خارج المنطقة الجغرافية للميناء يتم تحصيل مبلغ وقدره 50 ريال عماني.' },
            { title: 'إرساليات المنطقة الحرة', content: 'لا يتم تقديم البيان الجمركي في حالة كانت الشحنة متواجدة في المنطقة الحرة أو المستودعات الجمركية إلا بعد تفتيش الموظف.' },
            { title: 'إرساليات LCL', content: 'هي ارساليات مجزئة لعدة مستوردين في حاوية واحدة. يتم فرزها والتحفظ عليها في المستودعات الجمركية خارج الميناء.' },
            { title: 'نظام بيان الجمركي', content: 'يجب على جميع المستوردين والمخلصين الجمركيين استخدام نظام بيان الجمركي التابع لشرطة عمان السلطانية لتقديم بيانات الاستيراد والتصدير.' },
            { title: 'الاعتماد المسبق', content: 'بعض المنتجات تتطلب الحصول على تصاريح استيراد مسبقة من الجهات المختصة قبل وصول الشحنة إلى الميناء لتجنب التأخير.' }
        ],
        faqs: [
            { q: 'ما هي أوقات العمل في المنفذ؟', a: 'العمل مستمر على مدار الساعة طوال أيام الأسبوع بنظام الورديات لتسهيل حركة التجارة.' },
            { q: 'كيف يمكنني التواصل مع الدعم الفني لنظام بيان؟', a: 'يمكن التواصل مع الدعم الفني لنظام بيان عبر الرقم المجاني لشرطة عمان السلطانية أو عبر البريد الإلكتروني المخصص في بوابة بيان.' },
            { q: 'هل يمكنني تخليص معاملتي بدون مخلص جمركي؟', a: 'يُنصح بشدة التعامل مع مكاتب التخليص الجمركي المعتمدة لتسهيل وتسريع الإجراءات وتجنب الأخطاء في المستندات التي قد تؤدي إلى تأخير الإفراج.' }
        ],
        image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=2070&auto=format&fit=crop'
    },
    [ConsignmentType.VETERINARY]: {
        title: 'قسم الحجر البيطري',
        icon: 'fa-paw',
        color: 'amber',
        image: SECTOR_IMAGES[ConsignmentType.VETERINARY],
        description: 'يعد الحجر البيطري خط الدفاع الأول لمنع دخول الأمراض الحيوانية والوبائية والعابرة للحدود إلى سلطنة عمان، مما يساهم في حماية الثروة الحيوانية والصحة العامة.',
        laws: [
            'قانون الحجر البيطري الصادر بالمرسوم السلطاني رقم 45/2004',
            'اللائحة التنفيذية لقانون الحجر البيطري',
            'قرار تعديل اللائحة التنفيذية (مدة التصريح)',
            'قانون المستحضرات البيطرية الصادر بالمرسوم السلطاني رقم 34/2014',
            'قرار تعديل اللائحة (شهادة المنشأ)',
            'قرار تعديل اللائحة (HACCP + ISO + Catch Certificate)',
            'قانون الرفق بالحيوان الصادر بالمرسوم السلطاني رقم 21/2017'
        ],
        forms: [
            'استمارة مختبر المتحدة',
            'نموذج تعهد عدم إخراج الشحنة من شركة الحاويات',
            'نموذج تعهد بالتوجه الى محطة صحار اللوجستية (بغضفان)',
            'نموذج تحمل التكاليف المترتبة على الفرز/تحليل العينات',
            'نموذج تعهد بتصديق الشهادة الصحية'
        ],
        undertakingsList: [
            {
                scenario: 'في حالة وجود منتج مرفوض (الفرز)',
                reqs: ['تعهد بالتوجه لمحطة صحار اللوجستية.', 'تعهد بإتلاف/إعادة تصدير المنتج المرفوض.']
            },
            {
                scenario: 'في حالة سحب عينة للتحليل المخبري',
                reqs: [
                    'تعهد بتحمل تكاليف التحليل.',
                    'تعهد بعدم التصرف بالبضاعة لحين ظهور النتائج.',
                    'إرفاق شهادة اعتماد مخزن (أو البدائل المعتمدة).'
                ]
            },
            {
                scenario: 'في حالة عدم تصديق الشهادة الصحية',
                reqs: [
                    'تعهد بتصديق الشهادة خلال 14 يوم.',
                    'تعهد بعدم التصرف بالبضاعة لحين ظهور النتائج.',
                    'إرفاق شهادة اعتماد مخزن.'
                ]
            }
        ],
        storageAlternatives: [
            'تعهد بالالتزام بعدم إخراج البضاعة من الميناء.',
            'تقديم طلب التحفظ على الشحنة في محطة صحار اللوجستية.',
            'تقديم عقد استئجار مخزن معتمد (مع السجل التجاري بنشاط تأجير مخازن).'
        ],
        samplingCases: [
            'منتج جديد لم يسبق دخوله (3 مرات متتالية).',
            'بلد تصدير جديد لم يسبق الاستيراد منه.',
            'اشتباه أثناء الفحص الظاهري أو ظروف طرأت على الرحلة.',
            'تغيير الحاوية في ميناء وسيط.',
            'إرسالية صادرة من السلطنة ورُفضت في الخارج.',
            'تعليمات خاصة (مثل: الأسماك من شرق آسيا، اللحوم من الهند).',
            'الفحص الدوري العشوائي (كل 3 أشهر).',
            'انقطاع الاستيراد لمدة سنة (سحب من 3 شحنات متتالية).',
            'جميع إرساليات البيض ومنتجاته من الهند.'
        ],
        samplingMechanism: [
            { type: 'إرساليات اللحوم والأسماك', details: 'يتم طلب جميع الحاويات، وسحب 5 عينات ممثلة من كل رقم تشغيلة.' },
            { type: 'إرساليات البيض ومنتجاته', details: 'يتم سحب 5 وحدات من كل رقم تشغيلة وحفظها في درجة حرارة مناسبة.' }
        ],
        prohibitions: {
            permanent: [
                'قائمة المستحضرات البيطرية المحظورة (القرار الوزاري 81/2020).'
            ],
            temporary: [
                { text: 'الطيور الحية ومنتجاتها من المجر، بوليفيا، ويلس لاند (النمسا)، سايكي (اليابان)، كودينغتون وأندرسون (أمريكا)، أفيون (تركيا).', ref: '23/2023' },
                { text: 'الدواجن ومشتقاتها من بعض المقاطعات في الهند.', ref: 'تعميم' },
                { text: 'اللحوم من منشآت/مسالخ غير معتمدة.', ref: 'إجراء عام' },
                { text: 'بعض أنواع الأسماك الحية من مقاطعة شيدا كارتلي (جورجيا).', ref: '212/2023' },
                { text: 'الطيور الحية ومنتجاتها من تركيا (باستثناء المعاملة حرارياً).', ref: '66/2023' },
                { text: 'الطيور الحية ومنتجاتها من محافظة تشيبا (اليابان).', ref: '103/2024' },
                { text: 'الأسماك الحية من منطقة ترينتو (إيطاليا).', ref: '35/2024' },
                { text: 'القشريات الحية من منطقة فينتو (إيطاليا).', ref: '260/2023' },
                { text: 'الطيور الحية من رومانيا، كوريا، تيرانا (ألبانيا)، هوكايدو (اليابان)، قونية (تركيا).', ref: '241/2024' },
                { text: 'القشريات الحية من الدول المصابة بمرض متلازمة البقع البيضاء (إلا مناطق خالية/منتجات محددة).', ref: '99/2023' },
                { text: 'الطيور الحية من نورماندي (فرنسا)، لشبونة (البرتغال)، بورتو ريكو.', ref: '53/2025' },
                { text: 'الطيور الحية من تيلانغانا، أندرا براديش، كارناتاكا، بيهار، هآرتس (الهند).', ref: '108/2025' },
                { text: 'الطيور الحية من فيكتوريا (أستراليا)، بونغ (ليبيريا)، قيصري (تركيا)، ومقاطعات محددة في تايوان وبولندا والبرازيل والفلبين وألبانيا.', ref: '144/2025' }
            ]
        },
        generalInfo: [
            { title: 'إرساليات LCL', content: 'يتم فرزها والتحفظ عليها في المستودعات الجمركية خارج الميناء.' },
            { title: 'الإعفاءات', content: 'لا رسوم على الجهات الحكومية، الأدوية واللقاحات البيطرية، وإرساليات التلقيح الاصطناعي.' },
            { title: 'شهادات الحلال', content: 'غير مطلوبة من الدول العربية المسلمة.' },
            { title: 'شهادات الإمارات', content: 'المعتمد هو الصادر من وزارة التغير المناخي والبيئة فقط (وليس البلدية).' },
            { title: 'المنتجات السمكية', content: 'يجب إرفاق شهادة مصيد طبيعي (Catch Certificate) من كل الدول (ماعدا الاتحاد الأوروبي واسكندنافيا).' },
            { title: 'الشهادات الصحية البيطرية', content: 'يجب أن تكون الشهادة الصحية البيطرية أصلية ومصدقة من الجهات المختصة في بلد المنشأ وسفارة سلطنة عمان (إن وجدت).' },
            { title: 'استيراد الحيوانات الحية', content: 'يخضع استيراد الحيوانات الحية لاشتراطات خاصة تشمل فترة حجر بيطري وفحوصات مخبرية للتأكد من خلوها من الأمراض الوبائية.' }
        ],
        faqs: [
            { q: 'هل يمكنني استيراد الحيوانات الحية من أي دولة؟', a: 'لا، يجب التأكد من قائمة الدول المسموح بالاستيراد منها وخلوها من الأمراض الوبائية حسب قرارات وزارة الثروة الزراعية والسمكية وموارد المياه.' },
            { q: 'ما هي مدة صلاحية تصريح الاستيراد البيطري؟', a: 'تكون مدة صلاحية تصريح الاستيراد البيطري (30) يوماً من تاريخ صدوره، ويجوز التمديد لفترة مماثلة.' },
            { q: 'هل شهادة الحلال مطلوبة لجميع المنتجات الحيوانية؟', a: 'شهادة الحلال مطلوبة للحوم ومنتجاتها من الدول غير الإسلامية، بينما تُعفى الدول العربية والإسلامية من هذا المتطلب.' }
        ],
        stats: {
            daily: '+150',
            staff: '12 طبيب وفني',
            labs: 'المختبر المركزي - مسقط'
        }
    },
    [ConsignmentType.AGRICULTURAL]: {
        title: 'قسم الحجر الزراعي',
        icon: 'fa-seedling',
        color: 'emerald',
        image: SECTOR_IMAGES[ConsignmentType.AGRICULTURAL],
        description: 'يعمل الحجر الزراعي على منع دخول الآفات النباتية والأمراض التي قد تهدد الغطاء النباتي والمحاصيل الزراعية في السلطنة، مع تسهيل حركة التجارة الآمنة.',
        laws: [
            'قانون الحجر الزراعي الصادر بالمرسوم السلطاني رقم 47/2004',
            'اللائحة التنفيذية لقانون الحجر الزراعي',
            'قانون المبيدات الصادر بالمرسوم السلطاني رقم 41/2012',
            'اللائحة التنفيذية لقانون المبيدات',
            'قانون الأسمدة ومحسنات التربة الزراعية الصادر بالمرسوم السلطاني رقم 63/2006',
            'اللائحة التنفيذية لقانون الأسمدة ومحسنات التربة الزراعية',
            'قانون البذور والتقاوي والشتلات الصادر بالمرسوم السلطاني رقم 42/2009'
        ],
        documentCategories: [
            {
                category: 'الخضروات والفواكه والحبوب والبقوليات',
                items: [
                    'شهادة تسجيل منتج نباتي (للمنتجات الواردة في الإعلان - تصدر من الوزارة)',
                    'شهادة صحة نباتية',
                    'تحليل متبقيات مبيدات',
                    'الفاتورة',
                    'شهادة المنشأ',
                    'مستندات الناقل البحري'
                ]
            },
            {
                category: 'الأخشاب',
                items: [
                    'شهادة صحة نباتية (ماعدا الأخشاب المصنعة)',
                    'شهادة تبخير للأخشاب التي تحتوي على لحاء (الخشب الطبيعي)',
                    'الفاتورة',
                    'شهادة المنشأ',
                    'مستندات الناقل البحري'
                ]
            },
            {
                category: 'المبيدات والأسمدة ومحسنات التربة',
                items: [
                    'تصريح استيراد يدوي من الوزارة',
                    'ملصق مصاحب للتصريح (مختوم)',
                    'الفاتورة',
                    'شهادة المنشأ',
                    'تحاليل'
                ]
            }
        ],
        certificateModels: {
            title: 'نماذج الشهادات',
            desc: 'يتم تجميع نماذج الشهادات من جميع الدول التي تم الاستيراد منها.',
            linkText: 'لمطابقة الشهادات المعتمدة من الدول المستورد منها مسبقاً ، اضغط هنا'
        },
        forms: [
            'استمارة مختبر المتحدة',
            'نموذج تعهد عدم إخراج الشحنة من شركة الحاويات',
            'نموذج تعهد بالتوجه الى محطة صحار اللوجستية (بغضفان)',
            'نموذج تحمل التكاليف المترتبة على الفرز/تحليل العينات',
            'نموذج إقرار وتعهد - البيانات الإيضاحية'
        ],
        undertakingsList: [
            {
                scenario: 'في حالة وجود منتج مرفوض من بين عدة منتجات سليمة، وكان الإجراء تحويل الشحنة لمحطة صحار اللوجستية للفرز واتلاف/ إعادة تصدير المنتج المرفوض',
                reqs: [
                    'تعهد بالتوجه لمحطة صحار اللوجستية',
                    'تعهد بإتلاف/إعادة تصدير المنتج المرفوض'
                ]
            },
            {
                scenario: 'في حالة سحب عينة للتحليل المخبري',
                reqs: [
                    'تعهد بتحمل تكاليف التحليل',
                    'تعهد بعدم التصرف بالبضاعة لحين ظهور نتائج التحليل والحصول على الإفراج النهائي',
                    'إرفاق شهادة اعتماد مخزن. (وفي حال عدم وجود مخزن معتمد يتم اللجوء البند رقم (4)'
                ]
            },
            {
                scenario: 'في حالة عدم تصديق الشهادة الصحية',
                reqs: [
                    'تعهد بتصديق الشهادة الصحية خلال 14 يوم من تاريخه',
                    'تعهد بعدم التصرف بالبضاعة لحين ظهور نتائج التحليل والحصول على الإفراج النهائي',
                    'إرفاق شهادة اعتماد مخزن. (وفي حال عدم وجود مخزن معتمد يتم اللجوء البند رقم (4)'
                ]
            }
        ],
        storageAlternatives: [
            'تعهد بالالتزام بعدم إخراج البضاعة من الميناء',
            'تقديم طلب التحفظ على الشحنة في محطة صحار اللوجستية',
            'تقديم عقد استئجار مخزن معتمد مصحوباً بإرفاق السجل التجاري للمؤجر شريطة أن يتواجد لديه نشاط تأجير مخازن'
        ],
        samplingCases: [
            'وجود اعراض /واشتباه في إصابة فطرية/حشرية/بكتيرية',
            'وجود تعليمات',
            'عينات دورية حسب ملف المخاطر'
        ],
        prohibitedItems: [
            'فسائل النخيل',
            'اشجار النخيل',
            'الشتلات اشباه النخيل',
            'القرارات والتعاميم والمراسلات الرسمية'
        ],
        seasonalRestrictions: 'الخيار ،ا الطماطم ، الفلفل الحلو ، البصل ، الفلفل الحار ، القرع ، الخس ، الباذنجان ، الكوسه ، الباميا ، الملفلوف ، الجزر ، البطيخ ، الشمندر ، الزهرة ، الشمام ، العسل والتمور',
        generalInfo: [
            { title: 'إرساليات LCL', content: 'هي ارساليات مجزئة لعدة مستوردين تأتي في حاوية واحدة فقط ، ويتم فرزها والتحفظ عليها في المستودعات الجمركية التي تتواجد خارج المنطقة الجغرافية للميناء' },
            { title: 'إرساليات الأخشاب (C. Steinweg)', content: 'تتواجد بعض ارساليات الأخشاب في شركة سي ستنويخ وليس في شركة الحاويات، وبسبب إجراءات السلامة المهنية في شركة سي ستنويخ والتي تعيق المخلص الجمركي والموظف في آداء مهامهم سيتم تحويل الشحنات الى محطة صحار اللوجستية بإفراج مشروط لإستكمال المعاملات' },
            { title: 'الإعفاءات الحكومية', content: 'لايتم أخذ رسوم على ارساليات الجهات الحكومية' },
            { title: 'إعفاءات المبيدات والأسمدة', content: 'لا يوجد رسوم على ارساليات المبيدات وإرساليات الأسمدة الكيماوية' },
            { title: 'تصنيف الأخشاب', content: 'بعض ارساليات الأخشاب لا تتطلب ارفاق شهادة صحة نباتية' },
            { title: 'شهادة الصحة النباتية', content: 'تعتبر شهادة الصحة النباتية (Phytosanitary Certificate) وثيقة إلزامية لمعظم الإرساليات الزراعية وتصدر من الجهة المختصة في بلد المنشأ.' },
            { title: 'مواد التعبئة والتغليف الخشبية', content: 'يجب أن تكون مواد التعبئة والتغليف الخشبية معالجة ومختومة بختم المعيار الدولي (ISPM 15) لمنع انتقال الآفات.' }
        ],
        faqs: [
            { q: 'هل جميع الأخشاب تتطلب شهادة صحة نباتية؟', a: 'الأخشاب المصنعة (مثل الخشب الرقائقي) معفاة، بينما الأخشاب الطبيعية تتطلب شهادة صحة نباتية ومعالجة حسب المعيار الدولي (ISPM 15).' },
            { q: 'ما هي شروط استيراد المبيدات والأسمدة؟', a: 'تتطلب الحصول على تصريح استيراد مسبق من الوزارة، ويجب أن تكون مسجلة ومعتمدة في سلطنة عمان.' },
            { q: 'كيف يمكنني الحصول على شهادة تسجيل منتج نباتي؟', a: 'يتم تقديم الطلب عبر البوابة الإلكترونية للوزارة مع إرفاق كافة المستندات الفنية المطلوبة للمنتج.' }
        ],
        stats: {
            daily: '+320',
            staff: '18 مهندس وفني',
            labs: 'مختبر وقاية النبات'
        }
    },
    [ConsignmentType.FOOD_SAFETY]: {
        title: 'قسم سلامة وجودة الغذاء',
        icon: 'fa-utensils',
        color: 'blue',
        image: SECTOR_IMAGES[ConsignmentType.FOOD_SAFETY],
        description: 'يهدف القسم لضمان سلامة وصلاحية الأغذية المستوردة للاستهلاك الآدمي ومطابقتها للمواصفات القياسية الخليجية والعمانية المعتمدة.',
        laws: [
            'قانون سلامة الغذاء الصادر بالمرسوم السلطاني رقم 84/2008',
            'اللائحة التنفيذية لقانون سلامة الغذاء الصادرة بالقرار الوزاري رقم 2/2010',
            'الدليل الخليجي للتفتيش والرقابة على الأغذية المستوردة',
            'المواصفة القياسية الخليجية (GSO 9) لبطاقات المواد الغذائية المعبأة',
            'المواصفة القياسية الخليجية (GSO 150-1) لفترات صلاحية المنتجات الغذائية',
            'قرار حظر الزيوت المهدرجة جزئياً',
            'قرار تدعيم الدقيق بالحديد والفيتامينات',
            'قرار حظر استخدام مادة ثاني أكسيد التيتانيوم (E171) في الغذاء',
            'قرار تنظيم تداول مياه الشرب المعبأة',
            'قرار حظر استخدام مادة برومات البوتاسيوم في المخابز'
        ],
        documents: [
            'أصل الشهادة الصحية (موثقة ) - وتُقبل شهادة الصلاحية من دول الخليج.',
            'الفواتير وقوائم التعبئة (صورة).',
            'تقارير الفحوصات المخبرية حسب الحالة.',
            'شهادة الحلال إذا كانت المنتجات الغذائية من دولة غير مسلمة، ويوجد شعار "حلال" على المنتج.'
        ],
        forms: [
            'استمارة مختبر المتحدة',
            'نموذج تعهد عدم إخراج الشحنة من شركة الحاويات',
            'نموذج تعهد بالتوجه الى محطة صحار اللوجستية (بغضفان)',
            'نموذج تحمل التكاليف المترتبة على الفرز/تحليل العينات',
            'نموذج تعهد بتصديق الشهادة الصحية'
        ],
        undertakingsList: [
            {
                scenario: 'في حالة وجود منتج مرفوض (الفرز)',
                reqs: ['تعهد بالتوجه لمحطة صحار اللوجستية.', 'تعهد بإتلاف/إعادة تصدير المنتج المرفوض.']
            },
            {
                scenario: 'في حالة سحب عينة للتحليل المخبري',
                reqs: [
                    'تعهد بتحمل تكاليف التحليل.',
                    'تعهد بعدم التصرف بالبضاعة لحين ظهور النتائج.',
                    'إرفاق شهادة اعتماد مخزن (أو البدائل المعتمدة).'
                ]
            }
        ],
        storageAlternatives: [
            'تعهد بالالتزام بعدم إخراج البضاعة من الميناء.',
            'تقديم طلب التحفظ على الشحنة في محطة صحار اللوجستية.',
            'تقديم عقد استئجار مخزن معتمد (مع السجل التجاري بنشاط تأجير مخازن).'
        ],
        samplingCases: [
            'درجة الخطورة الصحية (تحليل المخاطر).',
            'وجود إنذار عبر نظام الإنذار الخليجي السريع للغذاء.',
            'وجود اشتباه أو شك في الإرسالية.',
            'العينات الدورية حسب خطة السحب المعتمدة.'
        ],
        prohibitedItems: [
            'الأغذية المحظورة بقرارات وزارية',
            'الأغذية المرفوضة دولياً لأسباب تتعلق بالسلامة',
            'الأغذية المخالفة لأحكام الشريعة الإسلامية',
            'المنتجات الواردة في الإنذار الخليجي السريع'
        ],
        generalInfo: [
            { title: 'الدول المعفاة من التصديق', content: 'أمريكا، مالطا، الدول العربية، والدول المشتركة في اتفاقية لاهاي (Apostille).' },
            { title: 'رسوم التفتيش', content: '50 ريال عماني للشحنات التي تفتش خارج المنطقة الجغرافية للميناء. إعفاء الجهات الحكومية.' },
            { title: 'إرساليات LCL', content: 'يتم فرزها والتحفظ عليها في المستودعات الجمركية خارج الميناء، ولا يتم تقديم المعاملة إلا بعد الفحص الظاهري (التفتيش).' },
            { title: 'فترات الصلاحية', content: 'يجب الالتزام بفترات الصلاحية المحددة في المواصفة القياسية الخليجية (GSO 150-1) للمنتجات الغذائية المختلفة.' },
            { title: 'البطاقة الغذائية', content: 'يجب أن تكون بيانات البطاقة الغذائية باللغة العربية (أو العربية والإنجليزية) ومطابقة للمواصفة (GSO 9).' }
        ],
        faqs: [
            { q: 'هل تُقبل الشهادات الصحية الإلكترونية؟', a: 'نعم، تُقبل الشهادات الصحية الإلكترونية الصادرة من الجهات الرسمية في بلد المنشأ والتي يمكن التحقق منها عبر الروابط الرسمية.' },
            { q: 'ما هي إجراءات الإفراج عن الشحنات الغذائية؟', a: 'تشمل المراجعة المستندية، الفحص الظاهري، وسحب عينات للتحليل المخبري إذا لزم الأمر بناءً على درجة الخطورة.' },
            { q: 'ماذا أفعل إذا رُفضت شحنتي الغذائية؟', a: 'يمكنك تقديم طلب تظلم أو طلب إعادة تصدير أو إتلاف الشحنة بالتنسيق مع قسم سلامة وجودة الغذاء والجهات الجمركية.' }
        ],
        stats: {
            daily: '+540',
            staff: '25 مفتش وأخصائي',
            labs: 'مركز سلامة وجودة الغذاء'
        }
    }
};

const MANAGEMENT_CONTACTS = [
    { title: "رئيس القسم", name: "ماجد بن علي الشامسي", phones: ["92285605", "26945935"] },
    { title: "المشرف الإداري", name: "يوسف بن راشد المعمري", phones: ["92904063", "26945936"] }
];

const INSPECTION_OFFICES = [
    { name: 'المكتب الزراعي', phone: '26865600', type: 'AGRICULTURAL' },
    { name: 'المكتب البيطري', phone: '26945970', type: 'VETERINARY' },
    { name: 'مكتب سلامة الغذاء', phone: '26945971', type: 'FOOD_SAFETY' }
];

interface ContactCardProps {
    title: string;
    name: string;
    phones: string[];
}

const ContactCard: React.FC<ContactCardProps> = ({ title, name, phones }) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
        <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                <i className="fas fa-user-tie"></i>
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                <h4 className="text-lg font-black text-slate-800">{name}</h4>
            </div>
        </div>
        <div className="space-y-2">
            {phones.map((phone, idx) => (
                <a 
                    key={idx} 
                    href={`tel:${phone}`} 
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 hover:border-slate-200 transition-all group/phone"
                >
                    <span className="text-xs font-black text-slate-500 group-hover/phone:text-slate-900">اتصال مباشر</span>
                    <span className="font-mono text-sm font-black text-slate-700" dir="ltr">{phone}</span>
                </a>
            ))}
        </div>
    </div>
);

const PublicSectorInfo: React.FC = () => {
    const { sector } = useParams<{ sector: string }>();
    const sectorKey = sector ? (Object.keys(SECTOR_DETAILS).find(k => k.toLowerCase() === sector.toLowerCase()) || sector) : null;
    const info = sectorKey ? SECTOR_DETAILS[sectorKey] : null;

    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [contactViewMode, setContactViewMode] = useState<'GRID' | 'TABLE'>('GRID');

    const [isClearanceModalOpen, setIsClearanceModalOpen] = useState(false);
    const [clearanceSearchTerm, setClearanceSearchTerm] = useState('');
    const [clearanceOffices, setClearanceOffices] = useState<ClearanceOffice[]>([]);
    const [isLoadingOffices, setIsLoadingOffices] = useState(false);

    useEffect(() => {
        if (isClearanceModalOpen) {
            const fetchOffices = async () => {
                setIsLoadingOffices(true);
                try {
                    const data = await getCollection('clearanceOffices');
                    setClearanceOffices(data as ClearanceOffice[]);
                } catch (error) {
                    console.error("Error fetching clearance offices:", error);
                } finally {
                    setIsLoadingOffices(false);
                }
            };
            fetchOffices();
        }
    }, [isClearanceModalOpen]);

    // Calculator State
    const [calcWeight, setCalcWeight] = useState<number>(0);
    const [calcUnitCount, setCalcUnitCount] = useState<number>(1);
    const [isExternalInspection, setIsExternalInspection] = useState<boolean>(false);
    const [calcVetCategory, setCalcVetCategory] = useState<string>('MEAT_DAIRY');
    const [calculatedFee, setCalculatedFee] = useState<number>(0);

    // Calculate Fees effect
    useEffect(() => {
        let fee = 0;
        const weightInTons = calcWeight / 1000;

        if (sectorKey === ConsignmentType.FOOD_SAFETY) {
            // Fixed rate: 10 OMR per certificate (even if shared)
            fee = (calcUnitCount * 10) + (isExternalInspection ? 50 : 0);
        } else if (sectorKey === ConsignmentType.AGRICULTURAL) {
            const roundedTons = Math.ceil(weightInTons);
            let agriFee = roundedTons * 1;
            fee = Math.min(agriFee, 100);
        } else if (sectorKey === ConsignmentType.VETERINARY) {
            if (calcVetCategory === 'LIVE_ANIMALS') {
                fee = 5 + (calcUnitCount * 0.5);
            } else if (calcVetCategory === 'MEAT_DAIRY') {
                const roundedTons = Math.ceil(weightInTons);
                fee = Math.min(roundedTons * 5, 100);
            } else if (calcVetCategory === 'FISH') {
                const roundedTons = Math.ceil(weightInTons);
                fee = Math.min(roundedTons * 5, 15);
            } else if (calcVetCategory === 'EGGS') {
                fee = Math.min(calcUnitCount * 0.1, 40);
            } else if (calcVetCategory === 'FODDER' || calcVetCategory === 'WASTE') {
                fee = 30;
            }
        }
        setCalculatedFee(Math.round(fee * 100) / 100);
    }, [calcWeight, calcUnitCount, calcVetCategory, isExternalInspection, sectorKey]);

    const getFeeDescription = () => {
        if (sectorKey === ConsignmentType.AGRICULTURAL) return '1 ر.ع/طن (الحد الأقصى 100 ر.ع)';
        if (sectorKey === ConsignmentType.FOOD_SAFETY) {
            return `10 ر.ع لكل شهادة ${isExternalInspection ? '+ 50 ر.ع فحص خارجي' : ''}`;
        }
        if (sectorKey === ConsignmentType.VETERINARY) {
            switch (calcVetCategory) {
                case 'MEAT_DAIRY': return '5 ر.ع/طن (بحد أقصى 100 ر.ع)';
                case 'FISH': return '5 ر.ع/طن (بحد أقصى 15 ر.ع)';
                case 'EGGS': return '100 بيسة/صندوق (بحد أقصى 40 ر.ع)';
                case 'FODDER': return '30 ر.ع ثابت للإرسالية';
                case 'WASTE': return '30 ر.ع ثابت للإرسالية';
                case 'LIVE_ANIMALS': return '5 ر.ع + 0.5 لكل رأس';
                default: return 'حسب اللوائح';
            }
        }
        return '';
    };

    if (!info) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col gap-4">
                <i className="fas fa-exclamation-triangle text-4xl text-amber-500"></i>
                <h2 className="text-xl font-bold text-slate-800">عذراً، الصفحة غير موجودة</h2>
                <p className="text-slate-500">لم يتم العثور على معلومات للقسم المطلوب: {sector}</p>
                <Link to="/" className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-700 transition-colors">
                    العودة للوحة التحكم
                </Link>
            </div>
        );
    }

    const bgColors: any = {
        amber: 'bg-amber-50 text-amber-900 border-amber-200',
        emerald: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        green: 'bg-emerald-50 text-emerald-900 border-emerald-200',
        blue: 'bg-blue-50 text-blue-900 border-blue-200',
        purple: 'bg-purple-50 text-purple-900 border-purple-200'
    };

    const iconColors: any = {
        amber: 'bg-amber-500',
        emerald: 'bg-emerald-500',
        green: 'bg-emerald-500',
        blue: 'bg-blue-500',
        purple: 'bg-purple-500'
    };

    const textColors: any = {
        amber: 'text-amber-600',
        emerald: 'text-emerald-600',
        green: 'text-emerald-600',
        blue: 'text-blue-600',
        purple: 'text-purple-600'
    };

    const borderColors: any = {
        amber: 'border-amber-500',
        emerald: 'border-emerald-500',
        green: 'border-emerald-500',
        blue: 'border-blue-500',
        purple: 'border-purple-500'
    };

    const lightBgColors: any = {
        amber: 'bg-amber-50',
        emerald: 'bg-emerald-50',
        green: 'bg-emerald-50',
        blue: 'bg-blue-50',
        purple: 'bg-purple-50'
    };

    return (
        <div className="min-h-screen bg-white font-cairo text-right print:bg-white" dir="rtl">
            <nav className="px-8 py-5 border-b border-white/20 flex justify-between items-center fixed top-0 w-full bg-slate-900/60 backdrop-blur-2xl z-[60] transition-all duration-300 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="p-1.5 bg-white/10 rounded-xl hover:bg-white/20 transition-colors cursor-pointer">
                        <Logo size={36} variant="light" />
                    </div>
                    <div className="w-px h-6 bg-white/20"></div>
                    <div className="flex flex-col">
                        <span className="font-black text-white text-sm leading-tight tracking-tight">مِرقاب</span>
                        <span className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em]">بوابة الزوار</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link to="/" className="px-5 py-2.5 rounded-xl text-xs font-black text-white hover:bg-white/10 flex items-center gap-2 transition-all border border-transparent hover:border-white/20">
                        <i className="fas fa-home"></i> لوحة التحكم
                    </Link>
                    <div className="w-px h-6 bg-white/20 mx-2"></div>
                    <button onClick={() => window.print()} className="w-10 h-10 rounded-xl flex items-center justify-center text-white/70 hover:bg-white/10 hover:text-white transition-all">
                        <i className="fas fa-print"></i>
                    </button>
                </div>
            </nav>

            <header className="relative py-48 px-6 overflow-hidden min-h-[600px] flex items-center justify-center">
                {/* Immersive Background */}
                <div className="absolute inset-0 z-0">
                    <img 
                        src={info.image} 
                        alt={info.title} 
                        className="w-full h-full object-cover scale-105 animate-pulse-slow"
                        referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-white"></div>
                    <div className={`absolute inset-0 bg-gradient-to-br from-${info.color}-900/80 to-slate-900/80 mix-blend-overlay opacity-80`}></div>
                    <div className={`absolute inset-0 bg-gradient-to-tr from-${info.color}-500/30 to-transparent mix-blend-color-dodge`}></div>
                </div>
                
                <div className="container mx-auto max-w-5xl relative z-10 text-center">
                    <nav className="flex items-center justify-center gap-2 mb-12 text-white/80 text-xs font-bold">
                        <Link to="/" className="hover:text-white transition-colors">لوحة التحكم</Link>
                        <i className="fas fa-chevron-left text-[8px]"></i>
                        <span className="text-white">معلومات القطاعات</span>
                        <i className="fas fa-chevron-left text-[8px]"></i>
                        <span className="text-white font-black">{info.title}</span>
                    </nav>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className={`w-32 h-32 mx-auto rounded-[3rem] flex items-center justify-center text-6xl text-white shadow-2xl mb-8 backdrop-blur-xl bg-white/20 border border-white/30 relative group`}
                    >
                        <div className={`absolute inset-0 rounded-[3rem] ${iconColors[info.color]} opacity-40 blur-2xl group-hover:opacity-60 transition-opacity`}></div>
                        <i className={`fas ${info.icon} relative z-10 drop-shadow-lg`}></i>
                    </motion.div>

                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter drop-shadow-2xl"
                    >
                        {info.title}
                    </motion.h1>
                    
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed max-w-3xl mx-auto drop-shadow-xl"
                    >
                        {info.description}
                    </motion.p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-white via-white/80 to-transparent"></div>
            </header>

            <main className="container mx-auto max-w-5xl px-6 pb-20 relative z-20 -mt-10">
                
                {/* Quick Navigation */}
                <div className="flex flex-wrap items-center justify-center gap-3 mb-12 -mt-8 relative z-20 print:hidden">
                    {info.fees && (
                        <a href="#fees" className="px-5 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-xs font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2">
                            <i className="fas fa-money-bill-wave text-amber-500"></i> الرسوم
                        </a>
                    )}
                    {info.procedures && (
                        <a href="#procedures" className="px-5 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-xs font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2">
                            <i className="fas fa-project-diagram text-blue-500"></i> الإجراءات
                        </a>
                    )}
                    {info.laws && (
                        <a href="#laws" className="px-5 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-xs font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2">
                            <i className="fas fa-gavel text-slate-700"></i> القوانين
                        </a>
                    )}
                    {info.generalInfo && (
                        <a href="#general-info" className="px-5 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-xs font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2">
                            <i className="fas fa-info-circle text-purple-500"></i> معلومات عامة
                        </a>
                    )}
                    {info.rejectedProcedures && (
                        <a href="#rejected" className="px-5 py-2.5 bg-white rounded-xl border border-slate-100 shadow-sm text-xs font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2">
                            <i className="fas fa-exclamation-circle text-red-500"></i> المرفوضة
                        </a>
                    )}
                </div>
                
                {sectorKey !== 'general' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="mb-20 -mt-16 bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-white/5"
                    >
                        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-600/10 rounded-full blur-[80px] -ml-16 -mb-16"></div>
                        
                        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                            <div className="lg:col-span-7">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 text-2xl border border-amber-500/30">
                                        <i className="fas fa-calculator"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white">حاسبة الرسوم التقديرية</h3>
                                        <p className="text-slate-400 text-sm font-bold mt-1">احسب تكلفة رسوم التفتيش والخدمات المتوقعة لإرساليتك</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {sectorKey === ConsignmentType.VETERINARY && (
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">نوع الإرسالية</label>
                                            <select 
                                                value={calcVetCategory}
                                                onChange={(e) => setCalcVetCategory(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-amber-500 text-white transition-all hover:bg-white/10"
                                            >
                                                <option value="MEAT_DAIRY">اللحوم والألبان ومشتقاتها</option>
                                                <option value="FISH">الأسماك المبردة والمجمدة</option>
                                                <option value="EGGS">بيض المائدة</option>
                                                <option value="FODDER">الأعلاف الحيوانية</option>
                                                <option value="WASTE">المخلفات الحيوانية</option>
                                                <option value="LIVE_ANIMALS">حيوانات حية</option>
                                                <option value="MEDICINES">أدوية ومستحضرات بيطرية</option>
                                            </select>
                                        </div>
                                    )}

                                    {!(sectorKey === ConsignmentType.VETERINARY && (calcVetCategory === 'LIVE_ANIMALS' || calcVetCategory === 'EGGS' || calcVetCategory === 'FODDER' || calcVetCategory === 'WASTE' || calcVetCategory === 'MEDICINES')) && sectorKey !== ConsignmentType.FOOD_SAFETY && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">الوزن الإجمالي (كجم)</label>
                                            <div className="relative">
                                                <input 
                                                    type="number" 
                                                    value={calcWeight || ''}
                                                    onChange={(e) => setCalcWeight(Number(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-amber-500 text-white placeholder:text-slate-600 transition-all hover:bg-white/10"
                                                />
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 uppercase">KG</span>
                                            </div>
                                        </div>
                                    )}

                                    {((sectorKey === ConsignmentType.VETERINARY && (calcVetCategory === 'LIVE_ANIMALS' || calcVetCategory === 'EGGS')) || sectorKey === ConsignmentType.FOOD_SAFETY) && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                {sectorKey === ConsignmentType.FOOD_SAFETY 
                                                    ? 'عدد الشهادات الصحية' 
                                                    : calcVetCategory === 'EGGS' ? 'عدد الصناديق' : 'عدد الرؤوس'}
                                            </label>
                                            <input 
                                                type="number" 
                                                value={calcUnitCount || ''}
                                                onChange={(e) => setCalcUnitCount(Number(e.target.value))}
                                                placeholder="0"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-amber-500 text-white placeholder:text-slate-600 transition-all hover:bg-white/10"
                                            />
                                        </div>
                                    )}

                                    {sectorKey === ConsignmentType.FOOD_SAFETY && (
                                        <div className="md:col-span-2">
                                            <label className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 cursor-pointer hover:bg-white/10 transition-all group">
                                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isExternalInspection ? 'bg-amber-500 border-amber-500' : 'border-white/20'}`}>
                                                    {isExternalInspection && <i className="fas fa-check text-[10px] text-white"></i>}
                                                </div>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isExternalInspection}
                                                    onChange={(e) => setIsExternalInspection(e.target.checked)}
                                                    className="hidden"
                                                />
                                                <div className="flex-1">
                                                    <span className="text-sm font-black text-white block">طلب فحص خارجي (50 ر.ع)</span>
                                                    <span className="text-[10px] text-slate-500 font-bold">للمعاينات خارج النطاق الجغرافي للميناء</span>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="lg:col-span-5">
                                <div className="bg-white/5 rounded-[2.5rem] p-10 border border-white/10 text-center flex flex-col justify-center h-full relative group hover:bg-white/10 transition-all">
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-4">إجمالي الرسوم المستحقة</p>
                                    <div className="flex items-baseline justify-center gap-3 mb-6">
                                        <span className="text-7xl font-black text-white tracking-tighter">{calculatedFee.toLocaleString()}</span>
                                        <span className="text-xl font-bold text-slate-500">ر.ع</span>
                                    </div>
                                    <div className="inline-flex items-center justify-center gap-2 text-xs font-black text-slate-400 bg-black/40 py-3 px-6 rounded-2xl border border-white/5">
                                        <i className="fas fa-info-circle text-amber-500"></i>
                                        {getFeeDescription()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 gap-16">
                    {info.fees && (
                        <motion.section 
                            id="fees"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200 relative overflow-hidden group"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
                            <div className="flex items-center gap-5 mb-10">
                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-xl ${iconColors[info.color]}`}>
                                    <i className="fas fa-money-bill-wave"></i>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-800">قائمة الرسوم</h3>
                                    <p className="text-slate-500 text-sm font-bold mt-1">تفاصيل التكاليف والرسوم الإدارية المعتمدة</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {info.fees.map((fee: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-default group/item">
                                        <div className={`w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover/item:text-${info.color}-600 transition-colors`}>
                                            <i className="fas fa-file-invoice-dollar"></i>
                                        </div>
                                        <span className="text-sm font-black text-slate-700">{fee}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {info.procedures && (
                        <motion.section 
                            id="procedures"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-xl relative overflow-hidden"
                        >
                            <div className="flex items-center gap-5 mb-12">
                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-xl ${iconColors[info.color]}`}>
                                    <i className="fas fa-project-diagram"></i>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-800">آلية إنجاز المعاملات</h3>
                                    <p className="text-slate-500 text-sm font-bold mt-1">خطوات العمل من الاستلام وحتى الإفراج النهائي</p>
                                </div>
                            </div>
                            
                            <div className="relative">
                                <div className="absolute top-0 bottom-0 right-7 w-1 bg-slate-100 rounded-full hidden md:block"></div>
                                
                                <div className="space-y-12">
                                    {info.procedures.map((step: any, idx: number) => (
                                        <div key={idx} className="flex gap-10 relative group">
                                            <div className="hidden md:flex w-14 h-14 bg-white border-4 border-slate-50 text-slate-800 rounded-2xl items-center justify-center font-black text-lg shrink-0 z-10 shadow-lg group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                                {String(idx + 1).padStart(2, '0')}
                                            </div>
                                            <div className="flex-1 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 group-hover:bg-white group-hover:shadow-xl group-hover:border-slate-200 transition-all duration-500">
                                                <h4 className="text-xl font-black text-slate-800 mb-3 flex items-center gap-3">
                                                    <span className="md:hidden bg-slate-900 text-white w-8 h-8 rounded-lg flex items-center justify-center text-xs">{idx + 1}</span>
                                                    {step.title}
                                                </h4>
                                                <p className="text-sm font-medium text-slate-500 leading-relaxed">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {info.laws && (
                        <motion.section 
                            id="laws"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                            
                            <div className="relative z-10">
                                <div className="flex items-center gap-6 mb-12">
                                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white text-3xl border border-white/20 shadow-2xl">
                                        <i className="fas fa-gavel"></i>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-white">القوانين واللوائح الفنية</h3>
                                        <p className="text-slate-400 text-sm font-bold mt-1">المرجعيات القانونية والتشريعية المنظمة للعمل</p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {info.laws.map((law: string, idx: number) => (
                                        <div key={idx} className="flex items-center gap-5 bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all cursor-default group/law">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover/law:text-white transition-colors">
                                                <i className="fas fa-book-open"></i>
                                            </div>
                                            <span className="text-sm font-bold text-slate-200 leading-relaxed">{law}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {info.documentCategories && (
                        <div className={`${lightBgColors[info.color]} rounded-[2.5rem] p-8 border ${borderColors[info.color]} print:bg-white print:border-black`}>
                            <div className="flex items-center gap-4 mb-6">
                                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl ${iconColors[info.color]} print:text-black print:bg-transparent print:border print:border-black`}><i className="fas fa-folder-open"></i></span>
                                <h3 className="text-2xl font-black text-slate-800">المستندات المطلوبة حسب الصنف</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {info.documentCategories.map((cat: any, idx: number) => (
                                    <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm print:border-slate-300 print:shadow-none break-inside-avoid">
                                        <h4 className={`font-black ${textColors[info.color]} mb-3 text-sm flex items-center gap-2`}>
                                            <span className={`w-6 h-6 rounded-full ${lightBgColors[info.color]} flex items-center justify-center text-xs`}>{idx + 1}</span>
                                            {cat.category}
                                        </h4>
                                        <ul className="space-y-2">
                                            {cat.items.map((doc: string, dIdx: number) => (
                                                <li key={dIdx} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                                                    <i className={`fas fa-check-circle mt-0.5 ${textColors[info.color]} print:text-black`}></i>
                                                    <span>{doc}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {info.undertakingsList && (
                        <div className="space-y-6 break-inside-avoid">
                            <h3 className={`text-2xl font-black text-slate-800 px-4 border-r-4 ${borderColors[info.color]} print:border-black`}>التعهدات والإجراءات الإدارية</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {info.undertakingsList.map((item: any, idx: number) => (
                                    <div key={idx} className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-shadow print:shadow-none print:border-black">
                                        <div className={`w-10 h-10 ${lightBgColors[info.color]} ${textColors[info.color]} rounded-full flex items-center justify-center mb-4 text-lg font-black print:bg-gray-200 print:text-black`}>{idx+1}</div>
                                        <h4 className="font-bold text-slate-800 mb-4 h-12 leading-tight">{item.scenario}</h4>
                                        <ul className="space-y-2">
                                            {item.reqs.map((req: string, rIdx: number) => (
                                                <li key={rIdx} className="text-xs text-slate-500 font-medium flex items-start gap-1.5">
                                                    <i className={`fas fa-check text-[10px] mt-1 ${textColors[info.color]} print:text-black`}></i> {req}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {info.prohibitedItems && (
                        <motion.section 
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            className="bg-red-50 rounded-[3rem] p-12 border-2 border-red-100 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-red-500/5 rounded-full blur-3xl"></div>
                            
                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center text-white text-3xl shadow-xl shadow-red-200">
                                    <i className="fas fa-shield-alt"></i>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-red-900">المواد المحظورة والمقيدة</h3>
                                    <p className="text-red-700/60 text-sm font-bold mt-1">قائمة المواد التي يمنع دخولها أو تتطلب تصاريح خاصة</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {info.prohibitedItems.map((item: string, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 bg-white p-5 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-all group">
                                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                                            <i className="fas fa-times text-xs"></i>
                                        </div>
                                        <span className="text-sm font-black text-slate-800">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {info.generalInfo && (
                        <motion.section 
                            id="general-info"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-10"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-xl ${iconColors[info.color]}`}>
                                    <i className="fas fa-info-circle"></i>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-800">معلومات هامة</h3>
                                    <p className="text-slate-500 text-sm font-bold mt-1">تنبيهات وإرشادات عامة للمستوردين والمخلصين</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {info.generalInfo.map((infoItem: any, idx: number) => (
                                    <div 
                                        key={idx} 
                                        className={`p-8 rounded-[2.5rem] border transition-all hover:shadow-xl hover:-translate-y-1 duration-500 ${
                                            idx === 0 ? 'md:col-span-2 bg-white border-slate-200' : 'bg-slate-50 border-slate-100'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                                            idx === 0 ? `${lightBgColors[info.color]} ${textColors[info.color]}` : 'bg-white text-slate-400'
                                        }`}>
                                            <i className={`fas ${idx === 0 ? 'fa-star' : 'fa-lightbulb'}`}></i>
                                        </div>
                                        <h4 className={`font-black text-xl mb-4 ${idx === 0 ? 'text-slate-900' : 'text-slate-700'}`}>{infoItem.title}</h4>
                                        <p className="text-sm font-medium text-slate-500 leading-relaxed">{infoItem.content}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {info.rejectedProcedures && (
                        <motion.section 
                            id="rejected"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-10"
                        >
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 rounded-[1.5rem] flex items-center justify-center bg-purple-600 text-white text-2xl shadow-xl">
                                    <i className="fas fa-exclamation-circle"></i>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-800">المعاملات المرفوضة</h3>
                                    <p className="text-slate-500 text-sm font-bold mt-1">دليل الإجراءات المتبعة في حالة رفض الإرسالية</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl"></div>
                                    <h4 className="text-2xl font-black text-purple-900 mb-8 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
                                            <i className="fas fa-hand-holding-heart"></i>
                                        </div>
                                        {info.rejectedProcedures.facilitation.title}
                                    </h4>
                                    <div className="space-y-6 relative pr-10 border-r-2 border-purple-100">
                                        {info.rejectedProcedures.facilitation.steps.map((step: string, idx: number) => (
                                            <div key={idx} className="relative">
                                                <span className="absolute -right-[51px] top-0 w-8 h-8 bg-purple-600 text-white rounded-xl flex items-center justify-center text-xs font-black border-4 border-white shadow-md">{idx + 1}</span>
                                                <p className="text-sm font-bold text-slate-600 leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-red-50 p-10 rounded-[3rem] border border-red-100 relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl"></div>
                                    <h4 className="text-2xl font-black text-red-900 mb-8 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
                                            <i className="fas fa-trash-alt"></i>
                                        </div>
                                        {info.rejectedProcedures.disposal.title}
                                    </h4>
                                    <div className="grid grid-cols-1 gap-4">
                                        {info.rejectedProcedures.disposal.steps.map((step: string, idx: number) => (
                                            <div key={idx} className="bg-white p-6 rounded-2xl border border-red-100 flex items-start gap-4 group/step">
                                                <div className="w-6 h-6 rounded-full bg-red-50 flex items-center justify-center text-red-500 shrink-0 group-hover/step:bg-red-500 group-hover/step:text-white transition-all">
                                                    <i className="fas fa-arrow-left text-[10px]"></i>
                                                </div>
                                                <p className="text-sm font-bold text-slate-700 leading-relaxed">{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {info.faqs && (
                        <motion.section 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white text-2xl shadow-xl ${iconColors[info.color]}`}>
                                    <i className="fas fa-question-circle"></i>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-800">الأسئلة الشائعة</h3>
                                    <p className="text-slate-500 text-sm font-bold mt-1">إجابات سريعة على التساؤلات الأكثر تكراراً</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {info.faqs.map((faq: any, idx: number) => (
                                    <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 group">
                                        <div className="flex items-start gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${lightBgColors[info.color]} ${textColors[info.color]} font-black text-lg`}>
                                                س
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-black text-slate-800 mb-4 leading-tight">{faq.q}</h4>
                                                <div className="flex items-start gap-4 pt-4 border-t border-slate-50">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-slate-50 text-slate-400 font-black text-lg">
                                                        ج
                                                    </div>
                                                    <p className="text-sm font-medium text-slate-500 leading-relaxed">{faq.a}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.section>
                    )}

                    {info.clearanceInfo && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden print:hidden shadow-2xl"
                        >
                            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -mr-32 -mt-32"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -ml-16 -mb-16"></div>
                            
                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                <div className="text-center lg:text-right">
                                    <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 rounded-full border border-white/10 mb-6">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">قاعدة بيانات المخلصين</span>
                                    </div>
                                    <h3 className="text-4xl font-black mb-4 flex items-center justify-center lg:justify-start gap-4">
                                        <i className="fas fa-address-book text-purple-400"></i> {info.clearanceInfo.title}
                                    </h3>
                                    <p className="text-slate-400 font-medium max-w-xl text-lg leading-relaxed">{info.clearanceInfo.desc}</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                                    {info.clearanceInfo.actions.map((action: any, idx: number) => (
                                        <button 
                                            key={idx} 
                                            onClick={(e) => {
                                                if (action.label === 'عرض الدليل') {
                                                    e.preventDefault();
                                                    setIsClearanceModalOpen(true);
                                                }
                                            }}
                                            className={`px-10 py-5 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-3 ${
                                                idx === 0 
                                                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-2xl shadow-purple-900/50 hover:-translate-y-1' 
                                                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20'
                                            }`}
                                        >
                                            {idx === 0 && <i className="fas fa-search"></i>}
                                            {action.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                </div>

                <div className={`mt-16 p-8 rounded-[2.5rem] text-center border-2 border-dashed ${bgColors[info.color]} print:hidden`}>
                    <h4 className="text-lg font-black mb-2">هل لديك استفسار يخص {info.title}؟</h4>
                    <p className="text-sm font-medium opacity-80 mb-6">فريقنا جاهز للرد على استفسارات المستوردين وشركات التخليص على مدار الساعة.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setIsContactModalOpen(true)} className="bg-white text-slate-800 px-6 py-3 rounded-xl font-black text-xs shadow-md hover:shadow-lg transition-all">
                            دليل التواصل
                        </button>
                        <button onClick={() => window.print()} className={`text-white px-6 py-3 rounded-xl font-black text-xs shadow-md hover:opacity-90 transition-all ${iconColors[info.color]}`}>
                            طباعة المعلومات
                        </button>
                    </div>
                </div>

                {/* Floating Navigation */}
                <div className="fixed bottom-8 left-8 z-50 flex flex-col gap-4 print:hidden">
                    <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center justify-center text-xl"
                    >
                        <i className="fas fa-arrow-up"></i>
                    </motion.button>
                </div>

                {isContactModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex gap-4 items-center">
                                <h3 className="text-2xl font-black text-slate-800">دليل التواصل</h3>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button 
                                        onClick={() => setContactViewMode('GRID')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${contactViewMode === 'GRID' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                                    >
                                        <i className="fas fa-th-large"></i> بطاقات
                                    </button>
                                    <button 
                                        onClick={() => setContactViewMode('TABLE')}
                                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${contactViewMode === 'TABLE' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}
                                    >
                                        <i className="fas fa-table"></i> جدول
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => setIsContactModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            {contactViewMode === 'GRID' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">الإدارة (ميناء صحار)</h4>
                                        {MANAGEMENT_CONTACTS.map((c, idx) => (
                                            <ContactCard key={idx} {...c} />
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">مكاتب التفتيش</h4>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                            {INSPECTION_OFFICES.map((office, idx) => (
                                                <div key={idx} className="flex justify-between text-sm">
                                                    <span className={`font-bold ${office.type === 'AGRICULTURAL' ? 'text-green-700' : office.type === 'VETERINARY' ? 'text-amber-700' : 'text-blue-700'}`}>{office.name}</span>
                                                    <span className="font-mono text-slate-600">{office.phone}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    <div>
                                        <h4 className="font-black text-slate-800 mb-3 flex items-center gap-2">
                                            <i className="fas fa-user-tie text-slate-400"></i> الإدارة والإشراف
                                        </h4>
                                        <div className="overflow-hidden border border-slate-200 rounded-2xl">
                                            <table className="w-full text-right text-sm">
                                                <thead className="bg-slate-50 text-slate-600 font-bold">
                                                    <tr>
                                                        <th className="p-4 border-b border-slate-200">المسمى الوظيفي</th>
                                                        <th className="p-4 border-b border-slate-200">الاسم</th>
                                                        <th className="p-4 border-b border-slate-200">أرقام التواصل</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {MANAGEMENT_CONTACTS.map((contact, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-4 font-bold text-slate-500">{contact.title}</td>
                                                            <td className="p-4 font-black text-slate-800">{contact.name}</td>
                                                            <td className="p-4 font-mono text-slate-600">{contact.phones.join(' / ')}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

                {isClearanceModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in print:hidden">
                        <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex gap-4 items-center">
                                    <h3 className="text-2xl font-black text-slate-800">دليل مكاتب التخليص الجمركي</h3>
                                </div>
                                <button onClick={() => setIsClearanceModalOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>
                            
                            <div className="p-6 bg-slate-50 border-b border-slate-100">
                                <div className="relative">
                                    <i className="fas fa-search absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                    <input 
                                        type="text" 
                                        placeholder="ابحث عن اسم مكتب التخليص..." 
                                        value={clearanceSearchTerm}
                                        onChange={(e) => setClearanceSearchTerm(e.target.value)}
                                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pr-12 pl-4 text-sm font-bold outline-none focus:border-purple-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                {isLoadingOffices ? (
                                    <div className="flex justify-center items-center h-40">
                                        <i className="fas fa-spinner fa-spin text-3xl text-purple-500"></i>
                                    </div>
                                ) : (
                                    <div className="overflow-hidden border border-slate-200 rounded-2xl">
                                        <table className="w-full text-right text-sm">
                                            <thead className="bg-slate-50 text-slate-600 font-bold">
                                                <tr>
                                                    <th className="p-4 border-b border-slate-200">اسم المكتب</th>
                                                    <th className="p-4 border-b border-slate-200">رقم الهاتف</th>
                                                    <th className="p-4 border-b border-slate-200">رقم الترخيص</th>
                                                    <th className="p-4 border-b border-slate-200">المخلصين</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {clearanceOffices.filter(office => office.name.includes(clearanceSearchTerm)).length > 0 ? (
                                                    clearanceOffices.filter(office => office.name.includes(clearanceSearchTerm)).map((office) => (
                                                        <tr key={office.id} className="hover:bg-slate-50 transition-colors">
                                                            <td className="p-4 font-black text-slate-800">{office.name}</td>
                                                            <td className="p-4 font-mono text-slate-600" dir="ltr">{office.phone || '-'}</td>
                                                            <td className="p-4 font-mono text-slate-600">{office.licenseNumber || '-'}</td>
                                                            <td className="p-4 font-medium text-slate-500">
                                                                {office.brokers && office.brokers.length > 0 ? (
                                                                    <div className="flex flex-col gap-2 max-w-[300px]">
                                                                        {office.brokers.map(b => (
                                                                            <div key={b.id} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                                                                <span className="text-xs font-bold text-slate-700">{b.name}</span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <a href={`tel:${b.phone}`} className="text-sm font-mono font-black text-blue-600 hover:underline flex items-center gap-1 select-all" dir="ltr">
                                                                                        <i className="fas fa-phone text-xs"></i> {b.phone}
                                                                                    </a>
                                                                                    <button onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(b.phone); alert('تم نسخ الرقم'); }} className="text-slate-400 hover:text-blue-500 transition-colors p-1" title="نسخ الرقم">
                                                                                        <i className="far fa-copy text-sm"></i>
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 text-xs italic">لا يوجد مخلصين</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">
                                                            لا توجد نتائج مطابقة للبحث
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    );
};

export default PublicSectorInfo;
