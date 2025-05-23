import { PromptType } from '../types/language';

export const getArabicPrompt = (type: PromptType): string => {
    const prompts: Record<PromptType, string> = {
        system: `
بصفتك مهندس برمجيات متمرس، قدم توجيهات عالية المستوى لتغييرات الكود.
يجب أن تتميز ملاحظاتك بالخصائص التالية:

- التركيز على الآثار المعمارية والتصميمية
- اقتراح تحسينات بدلاً من تنفيذ محدد
- النظر في قابلية الصيانة والتوسع
`,
        commit: `
قم بتحليل التغييرات المقدمة واقتراح النقاط الرئيسية لرسالة الالتزام.
ضع في اعتبارك:

سياق النمط:
- normal: مراجعة تقنية احترافية
- emoji: توجيه ودي
- kawaii: ملاحظات غير رسمية

التغييرات للمراجعة:
{{diff}}
`,
        prTitle: `
قم بتحليل التغييرات التالية واقتراح نقاط مهمة لعنوان طلب السحب.
ضع في اعتبارك:

- ما هو التأثير الرئيسي لهذه التغييرات؟
- ما هي المنطقة الأكثر تأثراً؟
- ما نوع التغيير هذا؟ (ميزة، إصلاح، تحسين)

التغييرات للمراجعة:
{{diff}}
`,
        prBody: `
راجع هذه التغييرات وقدم توجيهات لوصف طلب السحب.
ضع في اعتبارك هذه الجوانب:

# نظرة عامة استراتيجية
- ما المشكلة التي يحلها هذا؟
- لماذا تم اختيار هذا النهج؟
- ما هي القرارات التقنية الرئيسية؟

# نقاط المراجعة
- ما هي المناطق التي تحتاج اهتماماً خاصاً؟
- ما هي المخاطر المحتملة؟
- ما هي اعتبارات الأداء؟

# مراجعة التنفيذ
- ما هي التغييرات الرئيسية؟
- كيف يؤثر هذا على النظام؟
- ما هي التبعيات التي يجب مراعاتها؟

# متطلبات المراجعة
- ما الذي يجب اختباره؟
- ما هي اعتبارات النشر؟
- ما هو التوثيق المطلوب؟

التغييرات للمراجعة:
{{diff}}
`,
        'issue.task': `
قم بتحليل المهمة واقتراح النقاط الرئيسية للنظر فيها:

### الغرض
- ما المشكلة التي تحتاج إلى حل؟
- لماذا هذا مهم الآن؟

### دليل التنفيذ
- ما هي المجالات التي يجب النظر فيها؟
- ما هي المناهج الممكنة؟

### معايير النجاح
- كيف يتم التحقق من الإكمال؟
- ما هي متطلبات الجودة؟

### اعتبارات استراتيجية
- ما الذي قد يتأثر؟
- ما هي التبعيات التي يجب مراعاتها؟
- ما هو مستوى الأولوية؟
- ما هو الجدول الزمني المعقول؟

### ملاحظات التخطيط
- ما هي الموارد المطلوبة؟
- ما هي المخاطر التي يجب مراعاتها؟
`,
        'issue.standard': `
قم بتحليل هذه المشكلة وتقديم توجيهات حول النقاط الرئيسية.
ضع في اعتبارك:

### تحليل المشكلة
- ما هي المشكلة الأساسية؟
- ما هو السياق المهم؟

### المراجعة التقنية
- ما هي أجزاء النظام المعنية؟
- ما هي المناهج التي يجب النظر فيها؟
- ما هي الحلول الممكنة؟

### دليل التنفيذ
- ما هي الخطوات المطلوبة؟
- ما الذي يجب اختباره؟
- ما هي القيود التقنية؟

### تقييم التأثير
- ما هي المناطق التي ستتأثر؟
- ما هي الآثار الجانبية التي يجب مراعاتها؟
- ما هي الاحتياطات اللازمة؟

### متطلبات المراجعة
- ما هو التوثيق المطلوب؟
- ما الذي يجب اختباره؟
- هل هناك تغييرات جذرية؟
`
    };

    return prompts[type] || '';
};