import type {
  BuddyGroup,
  ChatMessage,
  GroupMember,
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

export const BUDDY_GROUPS: BuddyGroup[] = [
  {
    id: 'western-morning-buddies',
    name: 'Western morning buddies',
    from: 'Borivali',
    to: 'Churchgate',
    window: '08:15–08:45',
    members: 8,
    line: 'Western',
    verifiedOrganiser: true,
    joined: true,
  },
  {
    id: 'andheri-travel-circle',
    name: 'Andheri travel circle',
    from: 'Andheri',
    to: 'Churchgate',
    window: '08:30–09:00',
    members: 6,
    line: 'Western',
    verifiedOrganiser: true,
    joined: false,
  },
  {
    id: 'central-senior-companions',
    name: 'Central senior companions',
    from: 'Thane',
    to: 'CSMT',
    window: '10:00–10:30',
    members: 5,
    line: 'Central',
    verifiedOrganiser: true,
    joined: false,
  },
]

export const GROUP_MEMBERS: GroupMember[] = [
  { id: 'm1', name: 'Priya', initial: 'P', role: 'Organiser' },
  { id: 'm2', name: 'Neha', initial: 'N', role: 'Member' },
  { id: 'm3', name: 'Asha', initial: 'A', role: 'You' },
  { id: 'm4', name: 'Others', initial: '+5', role: 'Member' },
]

export const GROUP_CHAT: ChatMessage[] = [
  {
    id: 'c1',
    author: 'Priya',
    time: '08:19',
    body: 'I’m near the stairs. See you at 08:22.',
  },
  {
    id: 'c2',
    author: 'Neha',
    time: '08:20',
    body: '— On my way.',
  },
]

export const TRUSTED_CONTACTS: TrustedContact[] = [
  { id: 'tc1', name: 'Meera', relation: 'Sister', phone: '+91 98765 46210', last4: '4621' },
  { id: 'tc2', name: 'Ravi', relation: 'Neighbour', phone: '+91 99876 80320', last4: '8032' },
  { id: 'tc3', name: 'Priya', relation: 'Friend', phone: '+91 97765 32100', last4: '2100' },
]

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

export const STATIONS: Record<string, string[]> = {
  'Western line': ['Borivali', 'Andheri', 'Dadar', 'Bandra', 'Churchgate'],
  'Central line': ['Thane', 'Kurla', 'Dadar', 'CSMT'],
  'Harbour line': ['Andheri', 'Wadala', 'CSMT'],
}

export const DEPARTURE_TIMES = [
  '08:30 AM · Weekdays',
  '08:00 AM · Weekdays',
  '09:00 AM · Weekdays',
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
