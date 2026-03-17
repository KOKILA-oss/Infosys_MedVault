import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './DoctorSchedule.css';

const DOCTOR_LEAVE_DATES_KEY = 'doctorLeaveDates';
const DOCTOR_SCHEDULE_CONFIG_KEY = 'doctorScheduleConfig';
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const createDefaultSlots = () => [
  { id: `slot-${Date.now()}-1`, start: '10:00', end: '12:00' },
  { id: `slot-${Date.now()}-2`, start: '13:00', end: '15:00' }
];

const createEmptySlot = () => ({
  id: `slot-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  start: '09:00',
  end: '10:00'
});

const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTimeLabel = (timeValue) => {
  if (!timeValue) return 'Time pending';
  const [hours = '0', minutes = '0'] = timeValue.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });
};

const getPatientName = (appointment) =>
  appointment?.patientName ||
  appointment?.patient?.name ||
  appointment?.patient?.fullName ||
  'Patient';

const parseStoredLeaveDates = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(DOCTOR_LEAVE_DATES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const sanitizeSlots = (slots) => {
  if (!Array.isArray(slots)) return [];
  return slots
    .map((slot, index) => ({
      id: slot?.id || `slot-${Date.now()}-${index}`,
      start: slot?.start || '',
      end: slot?.end || ''
    }))
    .filter((slot) => slot.start && slot.end && slot.start < slot.end);
};

const normalizeScheduleConfig = (rawConfig) => {
  const storedDays = Array.isArray(rawConfig?.defaultActiveDays)
    ? rawConfig.defaultActiveDays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : [1, 2, 3, 4, 5];

  const dayConfigs = Object.entries(rawConfig?.dayConfigs || {}).reduce((acc, [dateKey, config]) => {
    acc[dateKey] = {
      isOffDay: Boolean(config?.isOffDay ?? config?.offDay),
      offReason: config?.offReason || '',
      slots: sanitizeSlots(config?.slots)
    };
    return acc;
  }, {});

  return {
    defaultSlots: sanitizeSlots(rawConfig?.defaultSlots).length
      ? sanitizeSlots(rawConfig.defaultSlots)
      : createDefaultSlots(),
    defaultActiveDays: storedDays.length ? storedDays : [1, 2, 3, 4, 5],
    dayConfigs
  };
};

const parseStoredScheduleConfig = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(DOCTOR_SCHEDULE_CONFIG_KEY) || '{}');
    return normalizeScheduleConfig(parsed);
  } catch {
    return {
      defaultSlots: createDefaultSlots(),
      defaultActiveDays: [1, 2, 3, 4, 5],
      dayConfigs: {}
    };
  }
};

const DoctorSchedule = () => {
  const navigate = useNavigate();
  const [approvedAppointmentsByDate, setApprovedAppointmentsByDate] = useState({});
  const [defaultSlots, setDefaultSlots] = useState(() => createDefaultSlots());
  const [defaultActiveDays, setDefaultActiveDays] = useState([1, 2, 3, 4, 5]);
  const [dayConfigs, setDayConfigs] = useState({});
  const [selectedDateKey, setSelectedDateKey] = useState(() => formatDateKey(new Date()));
  const [scheduleMonth, setScheduleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [scheduleLoaded, setScheduleLoaded] = useState(false);

  useEffect(() => {
    const loadSchedule = async () => {
      const fallbackConfig = parseStoredScheduleConfig();
      const token = localStorage.getItem('token');

      try {
        if (!token) {
          setDefaultSlots(fallbackConfig.defaultSlots);
          setDefaultActiveDays(fallbackConfig.defaultActiveDays);
          setDayConfigs(fallbackConfig.dayConfigs);
          return;
        }

        const response = await axios.get('/api/doctor/schedule', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const config = normalizeScheduleConfig(response.data || {});
        setDefaultSlots(config.defaultSlots);
        setDefaultActiveDays(config.defaultActiveDays);
        setDayConfigs(config.dayConfigs);
        localStorage.setItem(DOCTOR_SCHEDULE_CONFIG_KEY, JSON.stringify(config));
      } catch (error) {
        console.error('Failed to load doctor schedule, using local fallback', error);
        setDefaultSlots(fallbackConfig.defaultSlots);
        setDefaultActiveDays(fallbackConfig.defaultActiveDays);
        setDayConfigs(fallbackConfig.dayConfigs);
      } finally {
        setScheduleLoaded(true);
      }
    };

    loadSchedule();
  }, []);

  useEffect(() => {
    if (!scheduleLoaded) return;

    const sanitizedConfig = {
      defaultSlots: sanitizeSlots(defaultSlots),
      defaultActiveDays,
      dayConfigs
    };

    localStorage.setItem(
      DOCTOR_SCHEDULE_CONFIG_KEY,
      JSON.stringify(sanitizedConfig)
    );

    const token = localStorage.getItem('token');
    if (!token) return;

    axios.put('/api/doctor/schedule', sanitizedConfig, {
      headers: { Authorization: `Bearer ${token}` }
    }).catch((error) => {
      console.error('Failed to save doctor schedule', error);
    });
  }, [defaultSlots, defaultActiveDays, dayConfigs, scheduleLoaded]);

  useEffect(() => {
    if (!scheduleLoaded) return;

    const legacyLeaveDates = parseStoredLeaveDates();
    if (!legacyLeaveDates.length) return;

    setDayConfigs((prev) => {
      const next = { ...prev };
      legacyLeaveDates.forEach((dateKey) => {
        if (!next[dateKey]) {
          next[dateKey] = {
            isOffDay: true,
            offReason: 'Marked as off day',
            slots: []
          };
        }
      });
      return next;
    });
    localStorage.removeItem(DOCTOR_LEAVE_DATES_KEY);
  }, [scheduleLoaded]);

  useEffect(() => {
    const loadAppointmentCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const resp = await axios.get('/api/doctor/appointments', {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = Array.isArray(resp.data) ? resp.data : [];
        const approvedAppointments = data.reduce((acc, item) => {
          if ((item?.status || '').toUpperCase() !== 'APPROVED' || !item?.appointmentDate) return acc;

          const dateKey = item.appointmentDate;
          if (!acc[dateKey]) {
            acc[dateKey] = [];
          }

          acc[dateKey].push({
            id: item.id,
            patientName: getPatientName(item),
            time: item.appointmentTime || item.time || ''
          });
          return acc;
        }, {});

        Object.values(approvedAppointments).forEach((appointments) => {
          appointments.sort((first, second) => (first.time || '').localeCompare(second.time || ''));
        });

        setApprovedAppointmentsByDate(approvedAppointments);
      } catch (error) {
        console.error('Failed to load schedule appointment counts', error);
        setApprovedAppointmentsByDate({});
      }
    };

    loadAppointmentCounts();
  }, []);

  const updateDefaultSlot = (slotId, field, value) => {
    setDefaultSlots((prev) => prev.map((slot) => (slot.id === slotId ? { ...slot, [field]: value } : slot)));
  };

  const addDefaultSlot = () => {
    setDefaultSlots((prev) => [...prev, createEmptySlot()]);
  };

  const removeDefaultSlot = (slotId) => {
    setDefaultSlots((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((slot) => slot.id !== slotId);
    });
  };

  const toggleDefaultActiveDay = (weekday) => {
    setDefaultActiveDays((prev) => {
      if (prev.includes(weekday)) return prev.filter((day) => day !== weekday);
      return [...prev, weekday].sort((first, second) => first - second);
    });
  };

  const getDateObject = (dateKey) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const selectedDateObject = useMemo(() => getDateObject(selectedDateKey), [selectedDateKey]);
  const selectedDateConfig = dayConfigs[selectedDateKey] || { isOffDay: false, offReason: '', slots: [] };
  const selectedWeekday = selectedDateObject.getDay();
  const selectedUsesDefault = !dayConfigs[selectedDateKey];
  const selectedEffectiveSlots = selectedDateConfig.slots.length
    ? selectedDateConfig.slots
    : defaultSlots;
  const selectedHasDefault = defaultActiveDays.includes(selectedWeekday);

  const updateDayConfig = (dateKey, updater) => {
    setDayConfigs((prev) => {
      const current = prev[dateKey] || { isOffDay: false, offReason: '', slots: [] };
      const nextConfig = updater(current);

      const shouldDelete =
        !nextConfig.isOffDay &&
        !nextConfig.offReason.trim() &&
        sanitizeSlots(nextConfig.slots).length === 0;

      if (shouldDelete) {
        const next = { ...prev };
        delete next[dateKey];
        return next;
      }

      return {
        ...prev,
        [dateKey]: {
          isOffDay: Boolean(nextConfig.isOffDay),
          offReason: nextConfig.offReason || '',
          slots: nextConfig.slots
        }
      };
    });
  };

  const toggleSelectedOffDay = () => {
    updateDayConfig(selectedDateKey, (current) => ({
      ...current,
      isOffDay: !current.isOffDay,
      slots: current.isOffDay ? current.slots : []
    }));
  };

  const setSelectedOffReason = (value) => {
    updateDayConfig(selectedDateKey, (current) => ({ ...current, offReason: value }));
  };

  const setUseDefaultForSelectedDate = () => {
    setDayConfigs((prev) => {
      const next = { ...prev };
      delete next[selectedDateKey];
      return next;
    });
  };

  const addSelectedSlot = () => {
    updateDayConfig(selectedDateKey, (current) => ({
      ...current,
      isOffDay: false,
      slots: [
        ...((current.slots || []).length
          ? current.slots
          : defaultSlots.map((slot) => ({ ...slot, id: createEmptySlot().id }))),
        createEmptySlot()
      ]
    }));
  };

  const updateSelectedSlot = (slotId, field, value) => {
    updateDayConfig(selectedDateKey, (current) => ({
      ...current,
      slots: (current.slots || []).map((slot) => (slot.id === slotId ? { ...slot, [field]: value } : slot))
    }));
  };

  const removeSelectedSlot = (slotId) => {
    updateDayConfig(selectedDateKey, (current) => ({
      ...current,
      slots: (current.slots || []).filter((slot) => slot.id !== slotId)
    }));
  };

  const calendarModel = useMemo(() => {
    const year = scheduleMonth.getFullYear();
    const month = scheduleMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i += 1) {
      cells.push({ type: 'blank', key: `blank-${i}` });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);
      const weekday = date.getDay();
      const dateConfig = dayConfigs[dateKey] || { isOffDay: false, slots: [] };
      const customSlotCount = sanitizeSlots(dateConfig.slots).length;
      const defaultSlotCount = defaultActiveDays.includes(weekday) ? sanitizeSlots(defaultSlots).length : 0;
      const slotCount = dateConfig.isOffDay ? 0 : customSlotCount || defaultSlotCount;

      cells.push({
        type: 'day',
        key: dateKey,
        day,
        dateKey,
        isOffDay: Boolean(dateConfig.isOffDay),
        slotCount,
        approvedAppointments: approvedAppointmentsByDate[dateKey] || [],
        isToday: dateKey === formatDateKey(new Date())
      });
    }

    return {
      monthLabel: scheduleMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      cells
    };
  }, [scheduleMonth, dayConfigs, approvedAppointmentsByDate, defaultSlots, defaultActiveDays]);

  return (
    <div className="doctor-schedule-page">
      <header className="doctor-schedule-header">
        <div>
          <h1>Schedule</h1>
          <p>Mark leave/busy days and view approved appointments count.</p>
        </div>
        <div className="doctor-schedule-actions">
          <button
            className="ghost-btn"
            onClick={() =>
              setScheduleMonth((current) =>
                new Date(current.getFullYear(), current.getMonth() - 1, 1)
              )
            }
          >
            Previous
          </button>
          <button
            className="ghost-btn"
            onClick={() =>
              setScheduleMonth((current) =>
                new Date(current.getFullYear(), current.getMonth() + 1, 1)
              )
            }
          >
            Next
          </button>
          <button className="primary-btn" onClick={() => navigate('/doctor-dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="doctor-schedule-layout">
        <aside className="schedule-sidebar">
          <div className="default-schedule-card">
            <div className="schedule-card-head">
              <h4>Default Schedule Slots</h4>
              <p>Applied automatically to selected weekdays.</p>
            </div>

            <div className="slot-list">
              {defaultSlots.map((slot) => (
                <div className="slot-row" key={slot.id}>
                  <input
                    type="time"
                    value={slot.start}
                    onChange={(event) => updateDefaultSlot(slot.id, 'start', event.target.value)}
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={slot.end}
                    onChange={(event) => updateDefaultSlot(slot.id, 'end', event.target.value)}
                  />
                  <button type="button" className="slot-remove" onClick={() => removeDefaultSlot(slot.id)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="schedule-actions-row">
              <button type="button" className="ghost-btn" onClick={addDefaultSlot}>
                Add Slot
              </button>
            </div>

            <div className="weekday-toggle-grid">
              {DAY_LABELS.map((day, index) => (
                <label key={day}>
                  <input
                    type="checkbox"
                    checked={defaultActiveDays.includes(index)}
                    onChange={() => toggleDefaultActiveDay(index)}
                  />
                  {day}
                </label>
              ))}
            </div>
          </div>

          <div className="selected-day-card">
            <div className="schedule-card-head">
              <h4>Customize {selectedDateObject.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
              <p>{selectedUsesDefault ? 'Using default schedule' : 'Custom schedule override applied'}</p>
            </div>

            <div className="schedule-actions-row">
              <button type="button" className="ghost-btn" onClick={setUseDefaultForSelectedDate}>
                Use Default
              </button>
              <button type="button" className="ghost-btn" onClick={toggleSelectedOffDay}>
                {selectedDateConfig.isOffDay ? 'Mark as Working Day' : 'Mark as Off Day'}
              </button>
            </div>

            {selectedDateConfig.isOffDay ? (
              <label className="offday-reason-field">
                Off-day reason
                <input
                  type="text"
                  placeholder="Ex: Personal leave"
                  value={selectedDateConfig.offReason}
                  onChange={(event) => setSelectedOffReason(event.target.value)}
                />
              </label>
            ) : (
              <>
                {!selectedHasDefault && selectedUsesDefault ? (
                  <p className="schedule-muted">No default slots set for {DAY_LABELS[selectedWeekday]}. Add custom slots below.</p>
                ) : null}
                <div className="slot-list">
                  {selectedEffectiveSlots.map((slot) => (
                    <div className="slot-row" key={slot.id}>
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(event) => updateSelectedSlot(slot.id, 'start', event.target.value)}
                        disabled={selectedUsesDefault}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(event) => updateSelectedSlot(slot.id, 'end', event.target.value)}
                        disabled={selectedUsesDefault}
                      />
                      {selectedUsesDefault ? null : (
                        <button type="button" className="slot-remove" onClick={() => removeSelectedSlot(slot.id)}>
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="schedule-actions-row">
                  <button type="button" className="ghost-btn" onClick={addSelectedSlot}>
                    Add Custom Slot
                  </button>
                </div>
              </>
            )}
          </div>
        </aside>

        <section className="calendar-card">
          <div className="calendar-head">
            <h3>{calendarModel.monthLabel}</h3>
            <p>Select a date to customize slots or mark as off day</p>
          </div>

          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <span key={day}>{day}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {calendarModel.cells.map((cell) =>
              cell.type === 'blank' ? (
                <div key={cell.key} className="calendar-cell blank" />
              ) : (
                <button
                  key={cell.key}
                  type="button"
                  className={`calendar-cell day ${cell.isOffDay ? 'busy' : ''} ${cell.isToday ? 'today' : ''} ${selectedDateKey === cell.dateKey ? 'selected' : ''}`}
                  onClick={() => setSelectedDateKey(cell.dateKey)}
                  title={
                    cell.approvedAppointments.length
                      ? cell.approvedAppointments
                          .map((appointment) => `${formatTimeLabel(appointment.time)} - ${appointment.patientName}`)
                          .join('\n')
                      : (cell.isOffDay ? 'Marked as Off Day' : 'No approved appointments')
                  }
                >
                  <span className="day-number">{cell.day}</span>
                  <span className="slot-count-label">{cell.slotCount} {cell.slotCount === 1 ? 'slot' : 'slots'}</span>
                  <span className="appointments-count-label">{cell.approvedAppointments.length} {cell.approvedAppointments.length === 1 ? 'approved appointment' : 'approved appointments'}</span>
                  {cell.approvedAppointments.length ? (
                    <span className="calendar-hover-card" aria-hidden="true">
                      <strong>Approved bookings</strong>
                      {cell.approvedAppointments.map((appointment) => (
                        <span key={appointment.id || `${appointment.patientName}-${appointment.time}`}>
                          {formatTimeLabel(appointment.time)} - {appointment.patientName}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </button>
              )
            )}
          </div>

        </section>
      </div>
    </div>
  );
};

export default DoctorSchedule;
