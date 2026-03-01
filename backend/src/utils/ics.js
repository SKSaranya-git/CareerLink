function formatUtcIcsDate(date) {
  const d = new Date(date);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

function escapeIcsText(text) {
  return String(text || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function buildInterviewIcs({
  uid,
  method,
  startsAt,
  endsAt,
  summary,
  description,
  location,
  organizerEmail,
  organizerName,
  attendeeEmail,
  attendeeName,
}) {
  const dtStamp = formatUtcIcsDate(new Date());
  const dtStart = formatUtcIcsDate(startsAt);
  const dtEnd = formatUtcIcsDate(endsAt);

  const lines = [
    "BEGIN:VCALENDAR",
    "PRODID:-//JobBoard//Interview Scheduler//EN",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `METHOD:${method || "REQUEST"}`,
    "BEGIN:VEVENT",
    `UID:${escapeIcsText(uid)}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    description ? `DESCRIPTION:${escapeIcsText(description)}` : null,
    location ? `LOCATION:${escapeIcsText(location)}` : null,
    organizerEmail
      ? `ORGANIZER;CN=${escapeIcsText(organizerName || organizerEmail)}:MAILTO:${escapeIcsText(organizerEmail)}`
      : null,
    attendeeEmail
      ? `ATTENDEE;CN=${escapeIcsText(attendeeName || attendeeEmail)};ROLE=REQ-PARTICIPANT:MAILTO:${escapeIcsText(attendeeEmail)}`
      : null,
    method === "CANCEL" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  // RFC5545 uses CRLF line endings.
  return `${lines.join("\r\n")}\r\n`;
}

module.exports = { buildInterviewIcs };

