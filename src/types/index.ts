// User Types
export interface User {
  id: string
  username: string
  email?: string
  role: 'admin' | 'teacher' | 'user'
  name?: string
  phone?: string
}

// Student Types
export interface Student {
  id: number
  name: string
  age: number
  phone: string
  class: string
  status: 'active' | 'inactive'
  joinDate: string
  parentName?: string
  parentPhone?: string
  address?: string
  notes?: string
}

// Prayer Types
export interface PrayerTime {
  name: string
  time: string
  icon: string
}

export interface PrayerAttendance {
  id: number
  date: string
  prayer: string
  attendees: number
  notes?: string
}

// Activity Types
export interface Activity {
  id: number
  text: string
  time: string
  type: 'student' | 'prayer' | 'event' | 'alert'
}

// Event Types
export interface Event {
  id: number
  title: string
  date: string
  time: string
  description?: string
  location?: string
}

// Statistic Types
export interface Statistic {
  title: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  color: string
  change?: string
}

