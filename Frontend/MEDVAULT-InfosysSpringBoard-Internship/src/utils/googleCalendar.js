const GOOGLE_CALENDAR_EVENT_URL = 'https://calendar.google.com/calendar/render?action=TEMPLATE';

const formatGoogleCalendarDate = (date) => {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
};

export const buildGoogleCalendarUrl = (appointment, options = {}) => {
  if (!appointment?.appointmentDate || !appointment?.appointmentTime) {
    return '';
  }

  const durationMinutes = Number(options.durationMinutes || 30);
  const start = new Date(`${appointment.appointmentDate}T${appointment.appointmentTime}`);
  if (Number.isNaN(start.getTime())) {
    return '';
  }

  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
  const title = options.title || `MedVault appointment with ${appointment.doctorName || 'your doctor'}`;
  const details = options.details || [
    appointment.reason ? `Reason: ${appointment.reason}` : 'Reason: Consultation',
    `Status: ${appointment.status || 'Scheduled'}`,
    'Created from MedVault'
  ].join('\n');
  const location = options.location || appointment.hospital || 'MedVault Care';

  const params = new URLSearchParams({
    text: title,
    dates: `${formatGoogleCalendarDate(start)}/${formatGoogleCalendarDate(end)}`,
    details,
    location
  });

  return `${GOOGLE_CALENDAR_EVENT_URL}&${params.toString()}`;
};

export const openGoogleCalendarEvent = (appointment, options) => {
  const url = buildGoogleCalendarUrl(appointment, options);
  if (!url) {
    return false;
  }

  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
};
