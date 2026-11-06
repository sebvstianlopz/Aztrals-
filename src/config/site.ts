// Everything about the business that is not a pair of sunglasses lives here.
// SAMPLE: replace the WhatsApp number and add the Instagram profile before launch.

export type Lang = 'es' | 'en';

export const site = {
  name: 'Aztrals',
  // WhatsApp number in international format, digits only (1 + area code + number).
  // 787-555-0100 is a reserved fictional number: orders go nowhere until you change it.
  whatsapp: '17875550100',
  phoneDisplay: '+1 (787) 555-0100',
  currency: 'USD',
  city: 'San Juan',
  country: 'Puerto Rico',
  hours: {
    es: 'Lunes a sábado, de 10:00 a. m. a 7:00 p. m.',
    en: 'Monday to Saturday, 10:00 am to 7:00 pm',
  },
  social: {
    // Full profile URL, e.g. https://www.instagram.com/aztrals/. Empty hides the links.
    instagram: '' as string,
  },
} as const;
