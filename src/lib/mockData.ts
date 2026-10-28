import type {
  Train,
  TrustedContact,
  Trip,
  CompartmentCrowd,
} from './types'

/**
 * Mock data standing in for a real backend.
 * Every value mirrors the copy shown in the Figma prototype.
 * Replace this module with API calls when a backend exists.
 */

export const TRAINS: Train[] = [
  {
    id: 't-0830',
    departure: '08:30',
    arrival: '09:38',
    platform: 'Platform 3',
    inMinutes: 6,
    crowd: 'high',
    line: 'Western',
    direction: 'Southbound',
    coaches: 12,
    type: 'slow',
  },
  {
    id: 't-0842',
    departure: '08:42',
    arrival: '09:50',
    platform: 'Platform 3',
    inMinutes: 18,
    crowd: 'low',
    line: 'Western',
    direction: 'Southbound',
    coaches: 12,
    type: 'slow',
  },
  {
    id: 't-0854',
    departure: '08:54',
    arrival: '10:02',
    platform: 'Platform 3',
    inMinutes: 30,
    crowd: 'medium',
    line: 'Western',
    direction: 'Southbound',
    coaches: 12,
    type: 'slow',
  },
  {
    id: 't-0818',
    departure: '08:18',
    arrival: '09:26',
    platform: 'Platform 2',
    inMinutes: -6,
    crowd: 'medium',
    line: 'Western',
    direction: 'Southbound',
    coaches: 12,
    type: 'slow',
  },
]

/** Crowd shown per compartment on the train-detail screen (S06). */
export const COMPARTMENT_CROWD: CompartmentCrowd = {
  ladies: 'medium',
  general: 'high',
  firstClass: 'low',
}

export const COMPARTMENT_META = {
  reportedAt: '5 min ago',
  reporters: 18,
}

/**
 * Buddy groups, members and chat are no longer hardcoded — they come from
 * Supabase (or the local store when the backend is unreachable).
 * See `src/lib/db.ts`, `src/lib/hooks.ts` and screens S09/S10.
 * Seed groups in the database, or create them in-app with the "+".
 */

export const TRUSTED_CONTACTS: TrustedContact[] = [
  { id: 'tc1', name: 'Meera', relation: 'Sister', phone: '+91 98765 46210', last4: '4621' },
  { id: 'tc2', name: 'Ravi', relation: 'Neighbour', phone: '+91 99876 80320', last4: '8032' },
  { id: 'tc3', name: 'Priya', relation: 'Friend', phone: '+91 97765 32100', last4: '2100' },
]

/** Fallback trip history shown when the backend has no trips yet. */
export const RECENT_TRIPS: Trip[] = [
  { id: 'tr1', when: 'Today · 08:42', from: 'Borivali', to: 'Churchgate', points: 20 },
  { id: 'tr2', when: 'Yesterday · 08:18', from: 'Borivali', to: 'Churchgate', points: 10 },
  { id: 'tr3', when: '12 Oct · 17:42', from: 'Churchgate', to: 'Borivali', points: 20 },
]

/** Smart Window (S07) departure comparison. */
export const SMART_WINDOW = {
  usual: { time: '08:30', arrival: '09:38', crowd: 'high' as const, note: 'Usual' },
  earlier: { time: '08:18', arrival: '09:26', crowd: 'medium' as const, note: '12 min earlier' },
  suggested: { time: '08:42', arrival: '09:50', crowd: 'low' as const, note: 'Lower crowd' },
  /** minutes between the usual departure and the earlier alternative */
  earlierGap: 12,
  /** minutes between the usual departure and the lower-crowd suggestion */
  laterGap: 12,
}

/** Boarding slots offered on the Virtual Queue screen (S08a). */
export const BOARDING_SLOTS = [
  { id: 's1', label: '08:28–08:30 · 4 people ahead', ahead: 4 },
  { id: 's2', label: '08:30–08:32 · 7 people ahead', ahead: 7 },
  { id: 's3', label: '08:32–08:34 · 2 people ahead', ahead: 2 },
]

export const ZONES = ['A', 'B', 'C', 'D'] as const

export const LINES = ['Western line', 'Central line', 'Harbour line']

/**
 * Station lists per line, ordered south → north (the direction most commuters
 * travel into the city). Sourced from the Mumbai suburban network; the app
 * treats them as illustrative and never claims live railway data.
 */
export const STATIONS: Record<string, string[]> = {
  'Western line': [
    'Churchgate',
    'Marine Lines',
    'Charni Road',
    'Grant Road',
    'Mumbai Central',
    'Dadar',
    'Bandra',
    'Khar Road',
    'Santacruz',
    'Vile Parle',
    'Andheri',
    'Jogeshwari',
    'Goregaon',
    'Malad',
    'Kandivali',
    'Borivali',
    'Dahisar',
    'Manda Road',
    'Vasai Road',
    'Nalasopara',
    'Virar',
    'Vangaon',
    'Dahanu Road',
  ],
  'Central line': [
    'CSMT',
    'Byculla',
    'Dadar',
    'Kurla',
    'Ghatkopar',
    'Vikhroli',
    'Bhandup',
    'Nahur',
    'Mulund',
    'Thane',
    'Kalva',
    'Mumbra',
    'Diva',
    'Kopar',
    'Dombivli',
    'Thakurli',
    'Kalyan',
    'Titwala',
    'Khadavli',
    'Vasind',
    'Asangaon',
    'Atgaon',
    'Khardi',
    'Kasara',
  ],
  'Harbour line': [
    'CSMT',
    'Dock Yard Road',
    'Chinchpokli',
    'Currey Road',
    'Parel',
    'Sewri',
    'Wadala Road',
    'Kings Circle',
    'Mahim Junction',
    'Bandra',
    'Khar Road',
    'Santacruz',
    'Vile Parle',
    'Andheri',
    'Jogeshwari',
    'Goregaon',
    'Chembur',
    'Govandi',
    'Mankhurd',
    'Tilak Nagar',
    'Kurla',
    'Sion',
    'Vashi',
    'Sanpada',
    'Juinagar',
    'Nerul',
    'Seawoods–Darave',
    'CBD Belapur',
    'Kharghar',
    'Mansarovar',
    'Khandeshwar',
    'Panvel',
  ],
}

/** Short display name — keeps the Harbour line's "Junction"/"Road" suffixes tidy. */
export function shortStation(name: string): string {
  return name
    .replace(' Junction', '')
    .replace(' Road', '')
    .replace('–Darave', '')
}

/**
 * Fallback departure presets shown on the setup step. The user can pick any
 * time via the time input, so this is a convenience list, not a constraint.
 */
export const DEPARTURE_TIMES = [
  '06:30 AM · Weekdays',
  '07:00 AM · Weekdays',
  '07:30 AM · Weekdays',
  '08:00 AM · Weekdays',
  '08:30 AM · Weekdays',
  '09:00 AM · Weekdays',
  '09:30 AM · Weekdays',
  '18:30 PM · Weekdays',
]

/** Queue confirmation (S08b). */
export const SLOT_CONFIRMATION = {
  window: '08:38 TO 08:42',
  platform: 'PLATFORM 2',
  coach: 'COACH 4 ZONE',
  queuePosition: 'QUEUE POSITION 12',
  countdown: '06:12',
}
