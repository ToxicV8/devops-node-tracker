/**
 * Helper functions for safe date formatting
 */

/**
 * Safely formats a date with fallback for invalid values
 */
export const formatDate = (date: string | Date | number | null | undefined, locale: string = 'de-DE'): string => {
  if (!date) return '-'
  
  try {
    let dateObj: Date
    
    // Handle different input formats
    if (typeof date === 'number') {
      // Unix timestamp in milliseconds
      dateObj = new Date(date)
    } else if (typeof date === 'string') {
      // Check if it's a numeric string (timestamp)
      if (/^\d+$/.test(date)) {
        dateObj = new Date(parseInt(date))
      } else if (date.includes('T')) {
        // ISO String Format: "2024-01-15T10:30:00.000Z"
        dateObj = new Date(date)
      } else if (date.includes('-')) {
        // Date-only Format: "2024-01-15"
        dateObj = new Date(date + 'T00:00:00')
      } else {
        // Other string formats
        dateObj = new Date(date)
      }
    } else if (date instanceof Date) {
      dateObj = date
    } else {
      return '-'
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '-'
    }
    
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch (error) {
    console.warn('formatDate error:', error, 'for input:', date)
    return '-'
  }
}

/**
 * Safely formats a date with time
 */
export const formatDateTime = (date: string | Date | number | null | undefined, locale: string = 'de-DE'): string => {
  if (!date) return '-'
  
  try {
    let dateObj: Date
    
    // Handle different input formats
    if (typeof date === 'number') {
      // Unix timestamp in milliseconds
      dateObj = new Date(date)
    } else if (typeof date === 'string') {
      // Check if it's a numeric string (timestamp)
      if (/^\d+$/.test(date)) {
        dateObj = new Date(parseInt(date))
      } else if (date.includes('T')) {
        // ISO String Format: "2024-01-15T10:30:00.000Z"
        dateObj = new Date(date)
      } else if (date.includes('-')) {
        // Date-only Format: "2024-01-15"
        dateObj = new Date(date + 'T00:00:00')
      } else {
        // Other string formats
        dateObj = new Date(date)
      }
    } else if (date instanceof Date) {
      dateObj = date
    } else {
      return '-'
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '-'
    }
    
    return dateObj.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    console.warn('formatDateTime error:', error, 'for input:', date)
    return '-'
  }
}

/**
 * Formats a date relatively (e.g. "2 days ago")
 */
export const formatRelativeDate = (date: string | Date | number | null | undefined): string => {
  if (!date) return '-'
  
  try {
    let dateObj: Date
    
    if (typeof date === 'number') {
      dateObj = new Date(date)
    } else if (typeof date === 'string' && /^\d+$/.test(date)) {
      dateObj = new Date(parseInt(date))
    } else {
      dateObj = new Date(date)
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '-'
    }
    
    const now = new Date()
    const diffInMs = now.getTime() - dateObj.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
    
    if (diffInDays === 0) {
      return 'Heute'
    } else if (diffInDays === 1) {
      return 'Gestern'
    } else if (diffInDays > 1 && diffInDays < 7) {
      return `vor ${diffInDays} Tagen`
    } else {
      return formatDate(date)
    }
  } catch (error) {
    console.warn('Error formatting relative date:', date, error)
    return '-'
  }
}

/**
 * Checks if a date is valid
 */
export const isValidDate = (date: string | Date | number | null | undefined): boolean => {
  if (!date) return false
  
  try {
    let dateObj: Date
    
    if (typeof date === 'number') {
      dateObj = new Date(date)
    } else if (typeof date === 'string' && /^\d+$/.test(date)) {
      dateObj = new Date(parseInt(date))
    } else {
      dateObj = new Date(date)
    }
    
    return !isNaN(dateObj.getTime())
  } catch (error) {
    return false
  }
} 