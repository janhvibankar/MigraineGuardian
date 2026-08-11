/**
 * Formats a Date object or ISO string into a warm, readable date string.
 * Example: "Sunday, October 12"
 */
export function formatLongDate(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/**
 * Formats short time for check-ins.
 * Example: "8:30 AM"
 */
export function formatTime(date = new Date()) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Formats a number as a calm percentage.
 */
export function formatPercentage(val) {
  return `${Math.round(val)}%`;
}

/**
 * Returns dynamic greeting based on user's current local time:
 * Morning: 5:00 AM - 11:59 AM ("Good morning")
 * Afternoon: 12:00 PM - 4:59 PM ("Good afternoon")
 * Evening/Night: 5:00 PM - 4:59 AM ("Good evening")
 */
export function getTimeBasedGreeting(name) {
  const hour = new Date().getHours();
  let salutation = 'Good morning';

  if (hour >= 5 && hour < 12) {
    salutation = 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    salutation = 'Good afternoon';
  } else {
    salutation = 'Good evening';
  }

  return name ? `${salutation}, ${name}` : salutation;
}
