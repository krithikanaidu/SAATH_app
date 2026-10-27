/** Shared domain types for SAATH. */

export type CrowdLevel = 'low' | 'medium' | 'high'

export type Language = 'en' | 'hi' | 'mr'

export type TravelAs = 'woman' | 'senior' | 'differently-abled' | null

export interface Train {
  id: string
  departure: string
  arrival: string
  platform: string
  /** minutes from now, as shown in the design ("in 6 min") */
  inMinutes: number
  crowd: CrowdLevel
  line: string
  direction: string
  coaches: number
  type: 'slow' | 'fast'
}

export interface CompartmentCrowd {
  ladies: CrowdLevel
  general: CrowdLevel
  firstClass: CrowdLevel
}

export interface CrowdReport {
  compartment: 'ladies' | 'general' | 'first'
  level: CrowdLevel
  /** epoch ms */
  at: number
}

export interface BuddyGroup {
  id: string
  name: string
  from: string
  to: string
  window: string
  members: number
  line: string
  verifiedOrganiser: boolean
  joined: boolean
}

export interface GroupMember {
  id: string
  name: string
  initial: string
  role: 'Organiser' | 'Member' | 'You'
}

export interface ChatMessage {
  id: string
  author: string
  time: string
  body: string
}

export interface TrustedContact {
  id: string
  name: string
  relation: string
  phone: string
  /** masked display, e.g. "4621" */
  last4: string
}

export interface Trip {
  id: string
  when: string
  from: string
  to: string
  points: number
}

/** Persisted app state (localStorage-backed mock backend). */
export interface AppState {
  language: Language
  onboarded: boolean
  signedIn: boolean
  phone: string
  otpVerified: boolean
  locationAllowed: boolean
  largeText: boolean
  shareLocationOnSos: boolean
  usualLine: string
  fromStation: string
  toStation: string
  departureTime: string
  travelAs: TravelAs
  points: number
  joinedGroupIds: string[]
  /** groups the user created in-app (mock backend) */
  customGroups: BuddyGroup[]
  crowdReports: CrowdReport[]
  /** which departure the user picked on Smart Window */
  chosenDeparture: string
  slotBooked: boolean
  slotZone: 'A' | 'B' | 'C' | 'D'
}
