/**
 * Predefined campus venues for the create-flare flow.
 *
 * The redesign drops the map UI and free-text venue entry in favour of picking
 * from a known list — it's faster on mobile and keeps venue names consistent
 * across flares so they're actually searchable.
 *
 * These still write into the existing `location: { name, lat, lng }` shape, so
 * no schema change is involved. lat/lng are null because nothing renders a map
 * any more; the field is kept so previously-created flares stay readable and a
 * real map can be reintroduced later without a migration.
 */
export const CAMPUS_LOCATIONS = [
  { id: 'gym', name: 'Campus Gym', emoji: '🏋️', group: 'Sports' },
  { id: 'sports-ground', name: 'Sports Ground', emoji: '⚽', group: 'Sports' },
  { id: 'tennis-court', name: 'Tennis Courts', emoji: '🎾', group: 'Sports' },
  { id: 'swimming-pool', name: 'Swimming Pool', emoji: '🏊', group: 'Sports' },

  { id: 'central-library', name: 'Central Library', emoji: '📚', group: 'Study' },
  { id: 'reading-room', name: 'Reading Room', emoji: '📖', group: 'Study' },
  { id: 'computer-lab', name: 'Computer Lab', emoji: '💻', group: 'Study' },
  { id: 'lecture-hall', name: 'Lecture Hall Complex', emoji: '🏛️', group: 'Study' },

  { id: 'main-canteen', name: 'Main Canteen', emoji: '🍽️', group: 'Food' },
  { id: 'campus-cafe', name: 'Campus Cafe', emoji: '☕', group: 'Food' },
  { id: 'night-canteen', name: 'Night Canteen', emoji: '🌙', group: 'Food' },
  { id: 'food-court', name: 'Food Court', emoji: '🍔', group: 'Food' },

  { id: 'main-gate', name: 'Main Gate', emoji: '🚪', group: 'Around campus' },
  { id: 'hostel-common', name: 'Hostel Common Room', emoji: '🛋️', group: 'Around campus' },
  { id: 'amphitheatre', name: 'Open Air Theatre', emoji: '🎭', group: 'Around campus' },
  { id: 'campus-park', name: 'Campus Park', emoji: '🌳', group: 'Around campus' },
  { id: 'student-centre', name: 'Student Activity Centre', emoji: '🎪', group: 'Around campus' },
]

export const LOCATION_GROUPS = [...new Set(CAMPUS_LOCATIONS.map((l) => l.group))]

/** Builds the persisted location object from a picked venue or a typed name. */
export function toLocationValue(nameOrVenue) {
  const name =
    typeof nameOrVenue === 'string' ? nameOrVenue.trim() : nameOrVenue?.name?.trim()
  return { name: name || '', lat: null, lng: null }
}

export function searchLocations(query) {
  const q = query.trim().toLowerCase()
  if (!q) return CAMPUS_LOCATIONS
  return CAMPUS_LOCATIONS.filter(
    (l) => l.name.toLowerCase().includes(q) || l.group.toLowerCase().includes(q)
  )
}
