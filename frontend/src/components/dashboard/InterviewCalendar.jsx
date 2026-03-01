import { useMemo, useState } from "react";

function startOfMonthUTC(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0));
}

function addMonthsUTC(date, delta) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + delta, 1, 0, 0, 0));
}

function ymdLocal(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayYmd() {
  return ymdLocal(new Date());
}

export default function InterviewCalendar({
  events,
  selectedYmd,
  onSelectedYmdChange,
  monthAnchorUtc,
  onMonthChange,
  disablePastDays = false,
}) {
  const [hoverYmd, setHoverYmd] = useState("");

  const monthStart = useMemo(() => startOfMonthUTC(monthAnchorUtc), [monthAnchorUtc]);
  const monthLabel = useMemo(() => {
    const local = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), 1));
    return local.toLocaleString(undefined, { month: "long", year: "numeric" });
  }, [monthStart]);

  const days = useMemo(() => {
    // Render month in local time for user friendliness.
    const firstLocal = new Date(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), 1);
    const firstWeekday = firstLocal.getDay(); // 0 Sun
    const cursor = new Date(firstLocal);
    cursor.setDate(cursor.getDate() - firstWeekday);

    const result = [];
    for (let i = 0; i < 42; i += 1) {
      const dayYmd = ymdLocal(cursor);
      const isInMonth = cursor.getMonth() === firstLocal.getMonth();
      result.push({ ymd: dayYmd, date: new Date(cursor), isInMonth });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [monthStart]);

  const eventsByYmd = useMemo(() => {
    const map = {};
    for (const ev of events || []) {
      const key = ymdLocal(ev.startsAt);
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
    }
    return map;
  }, [events]);

  const activeYmd = selectedYmd || hoverYmd;
  const activeEvents = eventsByYmd[activeYmd] || [];
  const minimumYmd = todayYmd();

  return (
    <div className="interview-cal">
      <div className="interview-cal-head">
        <div>
          <div className="interview-cal-title">{monthLabel}</div>
          <div className="dash-muted">Click a day to see interviews</div>
        </div>
        <div className="row" style={{ gap: 8, marginTop: 0 }}>
          <button className="btn secondary-btn small-btn" type="button" onClick={() => onMonthChange(startOfMonthUTC(new Date()))}>
            Today
          </button>
          <button className="btn secondary-btn small-btn" type="button" onClick={() => onMonthChange(addMonthsUTC(monthStart, -1))}>
            Prev
          </button>
          <button className="btn secondary-btn small-btn" type="button" onClick={() => onMonthChange(addMonthsUTC(monthStart, 1))}>
            Next
          </button>
        </div>
      </div>

      <div className="interview-cal-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="interview-cal-dow">
            {d}
          </div>
        ))}

        {days.map((d) => {
          const count = (eventsByYmd[d.ymd] || []).length;
          const isSelected = selectedYmd === d.ymd;
          const isPast = disablePastDays && d.ymd < minimumYmd;
          return (
            <button
              key={d.ymd}
              type="button"
              className={[
                "interview-cal-day",
                d.isInMonth ? "" : "dim",
                isSelected ? "selected" : "",
                count ? "has-events" : "",
                isPast ? "disabled-day" : "",
              ].join(" ")}
              onClick={() => {
                if (isPast) return;
                onSelectedYmdChange(d.ymd);
              }}
              onMouseEnter={() => setHoverYmd(d.ymd)}
              onMouseLeave={() => setHoverYmd("")}
              title={isPast ? "Past dates cannot be scheduled" : count ? `${count} interview(s)` : "No interviews"}
              disabled={isPast}
            >
              <span className="num">{d.date.getDate()}</span>
              {count ? <span className="badge">{count}</span> : null}
            </button>
          );
        })}
      </div>

      <div className="interview-cal-list">
        <div className="interview-cal-list-head">
          <div className="interview-cal-list-title">{activeYmd || "Select a day"}</div>
          <div className="dash-muted">{activeEvents.length ? `${activeEvents.length} interview(s)` : "No interviews"}</div>
        </div>

        {activeEvents.length ? (
          <div className="dash-list">
            {activeEvents.map((ev) => (
              <div key={ev._id} className="dash-list-item" style={{ gridTemplateColumns: "1fr auto" }}>
                <div>
                  <div className="dash-list-title">{ev.title || "Interview"}</div>
                  <div className="dash-muted">
                    {new Date(ev.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(ev.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div className="dash-tag warning">{ev.status || "scheduled"}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="dash-muted" style={{ marginTop: 10 }}>
            No interviews on this day.
          </p>
        )}
      </div>
    </div>
  );
}

