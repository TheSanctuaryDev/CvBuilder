export type CountryCode = {
  code: string
  country: string
  flag: string
}

export const COUNTRY_CODES: CountryCode[] = [
  // Afrique de l'Ouest (priorité)
  { code: '+229', country: 'Bénin',          flag: '🇧🇯' },
  { code: '+226', country: 'Burkina Faso',   flag: '🇧🇫' },
  { code: '+225', country: "Côte d'Ivoire",  flag: '🇨🇮' },
  { code: '+233', country: 'Ghana',          flag: '🇬🇭' },
  { code: '+224', country: 'Guinée',         flag: '🇬🇳' },
  { code: '+223', country: 'Mali',           flag: '🇲🇱' },
  { code: '+222', country: 'Mauritanie',     flag: '🇲🇷' },
  { code: '+227', country: 'Niger',          flag: '🇳🇪' },
  { code: '+234', country: 'Nigeria',        flag: '🇳🇬' },
  { code: '+221', country: 'Sénégal',        flag: '🇸🇳' },
  { code: '+232', country: 'Sierra Leone',   flag: '🇸🇱' },
  { code: '+228', country: 'Togo',           flag: '🇹🇬' },
  // Afrique centrale
  { code: '+237', country: 'Cameroun',       flag: '🇨🇲' },
  { code: '+242', country: 'Congo',          flag: '🇨🇬' },
  { code: '+243', country: 'RD Congo',       flag: '🇨🇩' },
  { code: '+241', country: 'Gabon',          flag: '🇬🇦' },
  { code: '+236', country: 'Centrafrique',   flag: '🇨🇫' },
  // Afrique du Nord
  { code: '+213', country: 'Algérie',        flag: '🇩🇿' },
  { code: '+20',  country: 'Égypte',         flag: '🇪🇬' },
  { code: '+212', country: 'Maroc',          flag: '🇲🇦' },
  { code: '+216', country: 'Tunisie',        flag: '🇹🇳' },
  // Europe francophone
  { code: '+33',  country: 'France',         flag: '🇫🇷' },
  { code: '+32',  country: 'Belgique',       flag: '🇧🇪' },
  { code: '+41',  country: 'Suisse',         flag: '🇨🇭' },
  { code: '+352', country: 'Luxembourg',     flag: '🇱🇺' },
  // Europe
  { code: '+351', country: 'Portugal',       flag: '🇵🇹' },
  { code: '+34',  country: 'Espagne',        flag: '🇪🇸' },
  { code: '+39',  country: 'Italie',         flag: '🇮🇹' },
  { code: '+44',  country: 'Royaume-Uni',    flag: '🇬🇧' },
  { code: '+49',  country: 'Allemagne',      flag: '🇩🇪' },
  // Amériques
  { code: '+1',   country: 'USA / Canada',   flag: '🇺🇸' },
  { code: '+55',  country: 'Brésil',         flag: '🇧🇷' },
]
