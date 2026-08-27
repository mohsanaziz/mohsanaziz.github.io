import type { LocaleCv } from './content.ts';
import { defineMessages } from './messages.ts';

// Arabic locale layer, complete like `fr.ts` and `en.ts`. The CV prose was translated from the English layer
// under an ISO 17100 workflow (translation, bilingual revision, recruiter review, proofreading); the notes
// live outside the repository. Terminology: Agile (Scrum) → “Agile/Scrum” because a parenthesis whose
// content and preceding word are both Latin is mirrored by the bidi algorithm without a `dir` island;
// Product Owner, Scrum Master and UX/UI stay in Latin script as recruiter search terms; the transliterated
// name overrides the invariant one, which stays visible beside it.
export const messages = defineMessages({
  notFound: {
    message: 'هذه الصفحة غير موجودة. اختر لغتك للعودة إلى الصفحة الرئيسية.',
  },
  navigation: {
    additionalInformation: 'معلومات إضافية',
  },
  languageSelector: {
    switchLanguage: 'تغيير اللغة',
  },
  labels: {
    contact: 'معلومات الاتصال',
    contract: 'العقد',
    period: 'الفترة',
    duration: 'المدة',
    missions: 'المشاريع',
    client: 'العميل',
    status: 'الحالة',
    employer: 'جهة العمل',
    version: 'الإصدار',
  },
  contract: {
    freelance: 'مستقل',
    permanent: 'عقد دائم',
  },
  missionStatus: {
    current: 'قيد التنفيذ',
    delivered: 'مُنجز',
  },
  dates: {
    present: 'حتى الآن',
  },
  counts: {
    employer: {
      zero: '{count} جهة عمل',
      one: '{count} جهة عمل',
      two: '{count} جهتا عمل',
      few: '{count} جهات عمل',
      many: '{count} جهة عمل',
      other: '{count} جهة عمل',
    },
    year: {
      zero: '{count} سنة',
      one: '{count} سنة',
      two: '{count} سنتان',
      few: '{count} سنوات',
      many: '{count} سنة',
      other: '{count} سنة',
    },
    month: {
      zero: '{count} شهر',
      one: '{count} شهر',
      two: '{count} شهران',
      few: '{count} أشهر',
      many: '{count} شهرًا',
      other: '{count} شهر',
    },
    mission: {
      zero: '{count} مشروع',
      one: '{count} مشروع',
      two: '{count} مشروعان',
      few: '{count} مشاريع',
      many: '{count} مشروعًا',
      other: '{count} مشروع',
    },
    version: {
      zero: '{count} إصدار',
      one: '{count} إصدار',
      two: '{count} إصداران',
      few: '{count} إصدارات',
      many: '{count} إصدارًا',
      other: '{count} إصدار',
    },
  },
  accessibility: {
    missionStack: 'حزمة تقنيات {mission}',
  },
  punctuation: {
    labelColon: ':',
  },
  print: {
    contactDetails: 'بيانات الاتصال',
    experienceAndClientProjects: 'الخبرة ومشاريع العملاء',
    client: 'العميل',
    environment: 'بيئة العمل',
    footer: 'تم الإنشاء من mohsanaziz.github.io · {version} — الصفحة',
  },
});

export const cv = {
  metadata: {
    pageTitle: 'السيرة الذاتية — محسن عزيز — Mohsan AZIZ',
    pageDescription: 'محسن عزيز — مطوّر Angular/Java مستقل',
    printablePageTitle: 'محسن عزيز — نسخة قابلة للطباعة من السيرة الذاتية',
    openGraphImageAlt: 'بطاقة مشاركة لمحسن عزيز — مطوّر Angular/Java مستقل',
    openGraphLocation: 'باريس، فرنسا',
  },
  profile: {
    name: 'محسن عزيز',
    imageAlt: 'صورة محسن عزيز',
    jobTitle: 'مطوّر Angular/Java مستقل',
    contactDetails: {
      phone: {
        title: 'الهاتف',
      },
      email: {
        title: 'البريد الإلكتروني',
      },
      location: {
        title: 'الموقع',
        info: 'باريس، فرنسا',
      },
      birthdate: {
        title: 'تاريخ الميلاد',
        info: '19 أكتوبر 1989',
      },
    },
    resume: {
      text: 'نسخة PDF',
    },
  },
  institutions: {
    frenchMinistryOfJustice: 'وزارة العدل الفرنسية',
  },
  about: {
    title: 'نبذة',
    paragraphs: [
      'مطوّر Angular/Java مستقل متخصص في Angular، ذو خبرة في إعادة تصميم أنظمة معلومات معقدة وتطويرها في قطاعات العدالة والإدارة العامة وتجارة التجزئة.',
      'من أحدث المشاريع إعادة تصميم التطبيق المستخدم في متاجر Point P، وهو تطبيق يدير الطلبات وعروض الأسعار ويتكامل مع أنظمة خارجية، من بينها SAP ERP، عبر واجهات API. ويجمع بين خدمات مصغّرة بلغة Java في الواجهة الخلفية وواجهة أمامية أحادية البنية بإطار Angular، مع استخدام Bootstrap وNgRx لإدارة الحالة.',
      'كما سلّمتُ أنظمة كبرى للعدالة الجنائية وإدارة القضايا باستخدام Java وإطار Spring Boot إلى جانب Angular، بواجهات خلفية قائمة على الخدمات المصغّرة وواجهات أمامية أحادية البنية. وأعمل بأريحية في بيئات تعتمد منهجية Agile/Scrum ضمن فرق متعددة التخصصات، بالتعاون مع Product Owners ومديري المشاريع والخبراء في مجال الأعمال.',
      'أحرص على جودة الكود وعلى ممارسات التطوير الفعّالة. وأبحث عن تحديات جديدة أوظّف فيها خبرتي التقنية، ولا سيما في Angular.',
    ],
  },
  professionalExperience: {
    title: 'الخبرة المهنية',
    entries: {
      azmopak: {
        jobTitle: 'مطوّر Angular/Java مستقل',
      },
      sopraSteria: {
        jobTitle: 'مطوّر Angular/Java',
      },
    },
  },
  clientProjects: {
    title: 'مشاريع العملاء',
    entries: {
      atlasIhm: {
        description: [
          'إعادة تصميم التطبيق المستخدم في متاجر Point P لإنشاء عروض الأسعار والطلبات وإدارة الطلبات متعددة المورّدين.',
          'تتكامل الخدمات المصغّرة للواجهة الخلفية بلغة Java مع أنظمة خارجية، من بينها SAP ERP، عبر واجهات API. أما واجهة Angular الأمامية فأحادية البنية، وتستخدم Bootstrap وNgRx لإدارة الحالة.',
          'يتمحور فريق المشروع حول قائدين تقنيين يشرف كل منهما على سبعة مطوّرين، ويتولى مدير مشروع تنسيق الفريق بأكمله. ويسير المشروع وفق نموذج تسليم Agile هجين.',
        ],
      },
      sps: {
        description: [
          'إعادة تصميم نظام إدارة القضايا الجنائية المستخدم لتخزين مستندات القضايا قيد التحقيق.',
          'يجمع الحل بين واجهة ويب أمامية بإطار Angular وواجهة خلفية بلغة Java وإطار Spring Boot. وجرى ترحيل البيانات باستخدام Spring Batch لنقل السجلات من النظام القديم.',
          'تم التسليم وفق منهجية Agile/Scrum على يد فريق من نحو عشرة مطوّرين وخبير في مجال الأعمال وProduct Owner ومدير مشروع.',
        ],
      },
      siaj: {
        description: [
          'إعادة تصميم نظام معلومات المساعدة القضائية لتبسيط تقديم طلبات الحصول عليها عبر الإنترنت.',
          'يتألف الحل من بوابة موجهة للجمهور وتطبيق للمكتب الخلفي (back office) على الشبكة الداخلية. يعتمد تطبيق المكتب الخلفي، المطوَّر بلغة Java، على بنية خدمات مصغّرة، في حين أن بوابة Angular أحادية البنية؛ ويتبادل المكوّنان البيانات عبر وسيط الرسائل ActiveMQ.',
          'تم التسليم وفق منهجية Agile/Scrum على يد فريق من نحو اثني عشر مطوّرًا وثلاثة خبراء في مجال الأعمال وخمسة Product Owners ومدير مشروع.',
        ],
      },
      parcours: {
        description: [
          'إعادة تصميم برنامج لمتابعة القاصرين منذ دخولهم منظومة العدالة وحتى خروجهم منها أو بلوغهم سن الرشد.',
          'تولى تسليم المشروع ثلاثة فرق تعمل بمنهجية Agile/Scrum: فريقا ميزات (feature team) وفريق لترحيل البيانات. وضم كل فريق ميزات مطوّرًا أول واحدًا وثلاثة مطوّرين مبتدئين؛ وتولى قائد مشروع وScrum Master تنسيق الفرق، بدعم من خمسة Product Owners ومدير مشروع.',
          'ضمت الواجهة الخلفية بلغة Java أربع خدمات مصغّرة، من بينها بوابة API؛ أما واجهة Angular الأمامية فكانت أحادية البنية.',
        ],
      },
      ims: {
        description: [
          'تطوير تطبيق لإدارة ألعاب بطاقات الخدش.',
          'تم التسليم على يد فريق يعمل بمنهجية Agile/Scrum يضم Product Owner وثلاثة مطوّرين، من بينهم قائد تقني، بتنسيق من قائد مشروع.',
          'كان التطبيق أحادي البنية، بواجهة خلفية بلغة Java وواجهة أمامية بإطار Angular.',
        ],
      },
      portalisV3: {
        description: [
          'إعادة تصميم برنامج إدارة القضايا لمحاكم العمل الفرنسية.',
          'شارك في المشروع ستة فرق تعمل بمنهجية Agile/Scrum: ثلاثة فرق ميزات؛ وفريق متعدد التخصصات للتكامل وUX/UI؛ وفريق لمعمارية البرمجيات والقيادة التقنية؛ وفريق من Product Owners. وضم كل فريق ميزات مطوّرًا أول أو مطوّرًا رئيسيًا، وخمسة مطوّرين، وخبيرًا في مجال الأعمال، وProduct Owner مخصصًا له. وتولى قائد مشروع تنسيق جميع الفرق، مع Scrum Master لكل فريق ميزات.',
          'ضمت الواجهة الخلفية بلغة Java نحو خمس عشرة خدمة مصغّرة، من بينها بوابة API؛ أما واجهة Angular الأمامية فكانت أحادية البنية.',
        ],
      },
    },
  },
} as const satisfies LocaleCv;
