import type { PartialLocaleCv } from './content.ts';
import { defineMessages } from './messages.ts';

// Arabic translates the short interface layer only. CV prose deliberately stays absent here and falls
// back to French in `localeLayer`, until Arabic content is written and reviewed separately.
export const messages = defineMessages({
  navigation: {
    additionalInformation: 'معلومات إضافية',
  },
  languageSelector: {
    switchLanguage: 'تغيير اللغة',
    interfaceOnly: 'الواجهة فقط',
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
  },
});

export const cv = {
  metadata: {
    pageTitle: 'السيرة الذاتية — محسن عزيز — Mohsan AZIZ',
    pageDescription: 'محسن عزيز — مطوّر Angular/Java مستقل',
    printablePageTitle: 'محسن عزيز — نسخة قابلة للطباعة من السيرة الذاتية',
  },
  profile: {
    name: 'محسن عزيز',
    imageAlt: 'صورة محسن عزيز',
    contactDetails: {
      phone: {
        title: 'الهاتف',
      },
      email: {
        title: 'البريد الإلكتروني',
      },
      location: {
        title: 'الموقع',
      },
      birthdate: {
        title: 'تاريخ الميلاد',
      },
    },
    resume: {
      text: 'نسخة PDF',
    },
  },
  about: {
    title: 'نبذة',
  },
  professionalExperience: {
    title: 'الخبرة المهنية',
  },
  clientProjects: {
    title: 'مشاريع العملاء',
  },
} as const satisfies PartialLocaleCv;
