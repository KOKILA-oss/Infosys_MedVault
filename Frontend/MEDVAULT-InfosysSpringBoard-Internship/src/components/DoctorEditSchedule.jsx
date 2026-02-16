import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './DoctorEditSchedule.css';

const SCHEDULE_KEY = 'doctorSchedule';
const APPOINTMENTS_KEY = 'patientAppointments';
const DATE_SPECIFIC_KEY = 'doctorDateSpecificSchedule';

const DoctorEditSchedule = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [pendingDate, setPendingDate] = useState(null);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateSpecificSchedule, setDateSpecificSchedule] = useState(() => {
    const saved = localStorage.getItem(DATE_SPECIFIC_KEY);
    return saved ? JSON.parse(saved) : {};
  });

  const [schedule, setSchedule] = useState(() => {
    const saved = localStorage.getItem(SCHEDULE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          monday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          tuesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          wednesday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          thursday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          friday: { startTime: '09:00', endTime: '17:00', isWorking: true },
          saturday: { startTime: '10:00', endTime: '14:00', isWorking: false },
          sunday: { startTime: '00:00', endTime: '00:00', isWorking: false }
        };
  });

  const [consultationTime, setConsultationTime] = useState(() => {
    const saved = localStorage.getItem('doctorConsultationTime');
    return saved ? JSON.parse(saved) : { duration: 30, breakTime: 15 };
  });

  const [holidays, setHolidays] = useState(() => {
    const saved = localStorage.getItem('doctorHolidays');
    return saved ? JSON.parse(saved) : [];
  });

  const [newHoliday, setNewHoliday] = useState('');
  const [dateStartTime, setDateStartTime] = useState('09:00');
  const [dateEndTime, setDateEndTime] = useState('17:00');
  const [dateIsWorking, setDateIsWorking] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      if (dateSpecificSchedule[dateStr]) {
        const saved = dateSpecificSchedule[dateStr];
        setDateStartTime(saved.startTime);
        setDateEndTime(saved.endTime);
        setDateIsWorking(saved.isWorking);
      } else {
        const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][
          selectedDate.getDay()
        ];
        const daySchedule = schedule[dayName];
        setDateStartTime(daySchedule.startTime);
        setDateEndTime(daySchedule.endTime);
        setDateIsWorking(daySchedule.isWorking);
      }
    }
  }, [selectedDate, dateSpecificSchedule, schedule]);

  const handleScheduleChange = (day, field, value) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        [field]: value
      }
    });
  };

  const handleToggleWorkDay = (day) => {
    setSchedule({
      ...schedule,
      [day]: {
        ...schedule[day],
        isWorking: !schedule[day].isWorking
      }
    });
  };

  const handleSaveDateSchedule = () => {
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];
    const updated = {
      ...dateSpecificSchedule,
      [dateStr]: {
        startTime: dateStartTime,
        endTime: dateEndTime,
        isWorking: dateIsWorking
      }
    };
    setDateSpecificSchedule(updated);
    localStorage.setItem(DATE_SPECIFIC_KEY, JSON.stringify(updated));
    setSuccessMessage('Date schedule updated!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleRemoveDateSchedule = () => {
    if (!selectedDate) return;
    const dateStr = selectedDate.toISOString().split('T')[0];
    const updated = { ...dateSpecificSchedule };
    delete updated[dateStr];
    setDateSpecificSchedule(updated);
    localStorage.setItem(DATE_SPECIFIC_KEY, JSON.stringify(updated));
    setSuccessMessage('Date schedule removed!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleAddHoliday = () => {
    if (newHoliday && !holidays.includes(newHoliday)) {
      const updated = [...holidays, newHoliday].sort();
      setHolidays(updated);
      setNewHoliday('');
    }
  };

  const handleRemoveHoliday = (holiday) => {
    setHolidays(holidays.filter((h) => h !== holiday));
  };

  const handleDateClick = (date) => {
    setPendingDate(date);
    setShowDateModal(true);
  };

  const handleMarkFullDayOff = () => {
    try {
      if (!pendingDate) return;
      
      // Save the full day off schedule
      const dateStr = pendingDate.toISOString().split('T')[0];
      const updated = {
        ...dateSpecificSchedule,
        [dateStr]: {
          startTime: '00:00',
          endTime: '00:00',
          isWorking: false
        }
      };
      
      setDateSpecificSchedule(updated);
      localStorage.setItem(DATE_SPECIFIC_KEY, JSON.stringify(updated));
      
      // Close modal first
      setShowDateModal(false);
      setPendingDate(null);
      
      // Show success message
      setSuccessMessage('Day marked as off!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (error) {
      console.error('Error marking day off:', error);
      setShowDateModal(false);
    }
  };

  const handleSetCustomTimeSlots = () => {
    try {
      if (!pendingDate) return;
      
      // Set the selected date and close modal
      setSelectedDate(pendingDate);
      setShowDateModal(false);
      setPendingDate(null);
    } catch (error) {
      console.error('Error setting custom time slots:', error);
      setShowDateModal(false);
    }
  };

  const handleSaveSchedule = () => {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule));
    localStorage.setItem('doctorConsultationTime', JSON.stringify(consultationTime));
    localStorage.setItem('doctorHolidays', JSON.stringify(holidays));

    setSuccessMessage('Schedule saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateInFuture = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  };

  const isDateHoliday = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return holidays.includes(dateStr);
  };

  const isDateCustomScheduled = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return !!dateSpecificSchedule[dateStr];
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }

    return days;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="edit-schedule-page">
      <header className="schedule-header">
        <div>
          <h1>Edit Schedule</h1>
          <p>Manage your working hours and availability</p>
        </div>
        <button className="ghost-btn" onClick={() => navigate('/doctor-today-schedule')}>
          Back to Today's Schedule
        </button>
      </header>

      {successMessage && <div className="success-message">{successMessage}</div>}

      {showDateModal && pendingDate && (
        <div className="modal-overlay">
          <div className="modal-content date-mode-modal">
            <h2>Select Schedule Type</h2>
            <p>What would you like to do for {pendingDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}?</p>
            
            <div className="modal-options">
              <button 
                type="button"
                className="modal-option full-day-off"
                onClick={handleMarkFullDayOff}
              >
                <span className="option-icon">🚫</span>
                <span className="option-title">Full Day Off</span>
                <span className="option-desc">Mark as unavailable</span>
              </button>
              
              <button 
                type="button"
                className="modal-option custom-slots"
                onClick={handleSetCustomTimeSlots}
              >
                <span className="option-icon">⏰</span>
                <span className="option-title">Custom Time Slots</span>
                <span className="option-desc">Set specific hours</span>
              </button>
            </div>

            <button 
              type="button"
              className="modal-close-btn"
              onClick={() => setShowDateModal(false)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="schedule-sections">
        <section className="calendar-section">
          <h2>Upcoming Days Availability</h2>
          <div className="calendar-wrapper">
            <div className="calendar">
              <div className="calendar-header">
                <button onClick={handlePrevMonth} className="nav-btn">←</button>
                <h3>{monthName}</h3>
                <button onClick={handleNextMonth} className="nav-btn">→</button>
              </div>

              <div className="weekdays">
                {weekDays.map((day) => (
                  <div key={day} className="weekday">{day}</div>
                ))}
              </div>

              <div className="calendar-grid">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="calendar-day empty"></div>;
                  }

                  const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
                  const isFuture = isDateInFuture(day);
                  const isHoliday = isDateHoliday(day);
                  const isCustom = isDateCustomScheduled(day);

                  return (
                    <button
                      key={day.toISOString()}
                      className={`calendar-day ${isSelected ? 'selected' : ''} ${!isFuture ? 'past' : ''} ${
                        isHoliday ? 'holiday' : ''
                      } ${isCustom ? 'custom' : ''}`}
                      onClick={() => isFuture && handleDateClick(day)}
                      disabled={!isFuture}
                    >
                      <span className="day-number">{day.getDate()}</span>
                      {isHoliday && <span className="day-badge holiday-badge">Holiday</span>}
                      {isCustom && <span className="day-badge custom-badge">Custom</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="date-schedule">
                <h3>{selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
                
                <div className="date-controls">
                  <label>
                    <input
                      type="checkbox"
                      checked={dateIsWorking}
                      onChange={() => setDateIsWorking(!dateIsWorking)}
                    />
                    <span>Working</span>
                  </label>
                </div>

                {dateIsWorking && (
                  <div className="date-times">
                    <div className="time-input-group">
                      <label>Start Time</label>
                      <input
                        type="time"
                        value={dateStartTime}
                        onChange={(e) => setDateStartTime(e.target.value)}
                      />
                    </div>
                    <div className="time-input-group">
                      <label>End Time</label>
                      <input
                        type="time"
                        value={dateEndTime}
                        onChange={(e) => setDateEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="date-actions">
                  <button className="primary-btn" onClick={handleSaveDateSchedule}>
                    Save Schedule
                  </button>
                  {isCustom && (
                    <button className="danger-btn" onClick={handleRemoveDateSchedule}>
                      Remove Custom Schedule
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="weekly-schedule">
          <h2>Weekly Schedule</h2>
          <div className="days-grid">
            {days.map((day, index) => (
              <div key={day} className="day-card">
                <div className="day-header">
                  <h3>{dayLabels[index]}</h3>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={schedule[day].isWorking}
                      onChange={() => handleToggleWorkDay(day)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {schedule[day].isWorking ? (
                  <div className="time-inputs">
                    <div className="input-group">
                      <label>Start Time</label>
                      <input
                        type="time"
                        value={schedule[day].startTime}
                        onChange={(e) => handleScheduleChange(day, 'startTime', e.target.value)}
                      />
                    </div>
                    <div className="input-group">
                      <label>End Time</label>
                      <input
                        type="time"
                        value={schedule[day].endTime}
                        onChange={(e) => handleScheduleChange(day, 'endTime', e.target.value)}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="off-day">Not Working</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="consultation-settings">
          <h2>Consultation Settings</h2>
          <div className="settings-grid">
            <div className="setting-item">
              <label>Consultation Duration (minutes)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={consultationTime.duration}
                  onChange={(e) =>
                    setConsultationTime({
                      ...consultationTime,
                      duration: parseInt(e.target.value)
                    })
                  }
                />
                <span>min</span>
              </div>
            </div>

            <div className="setting-item">
              <label>Break Between Consultations (minutes)</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="5"
                  value={consultationTime.breakTime}
                  onChange={(e) =>
                    setConsultationTime({
                      ...consultationTime,
                      breakTime: parseInt(e.target.value)
                    })
                  }
                />
                <span>min</span>
              </div>
            </div>
          </div>
        </section>

        <section className="holidays-section">
          <h2>Holidays & Days Off</h2>
          <div className="holiday-input-group">
            <input
              type="date"
              value={newHoliday}
              onChange={(e) => setNewHoliday(e.target.value)}
              placeholder="Select date"
            />
            <button className="primary-btn" onClick={handleAddHoliday}>
              Add Holiday
            </button>
          </div>

          {holidays.length > 0 && (
            <div className="holidays-list">
              {holidays.map((holiday) => (
                <div key={holiday} className="holiday-item">
                  <span>{new Date(holiday).toLocaleDateString()}</span>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveHoliday(holiday)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
          {holidays.length === 0 && (
            <p className="empty-message">No holidays added yet</p>
          )}
        </section>
      </div>

      <div className="action-buttons">
        <button className="primary-btn save-btn" onClick={handleSaveSchedule}>
          Save All Changes
        </button>
        <button className="ghost-btn" onClick={() => navigate('/doctor-today-schedule')}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DoctorEditSchedule;
