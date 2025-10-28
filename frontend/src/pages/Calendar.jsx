import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventDialog = ({ selectedDate, selectedTime, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    startTime: selectedTime || '09:00',
    endTime: selectedTime ? 
      `${(parseInt(selectedTime.split(':')[0]) + 1).toString().padStart(2, '0')}:${selectedTime.split(':')[1]}` 
      : '10:00',
    title: '',
    description: '',
    category: 'General',
    color: '#667eea',
  });

  const eventCategories = [
    { name: 'General', value: 'General', color: '#667eea' },
    { name: 'Sprint Planning', value: 'Sprint Planning', color: '#3b82f6' },
    { name: 'Reviews & Demos', value: 'Reviews & Demos', color: '#10b981' },
    { name: 'Team Meetings', value: 'Team Meetings', color: '#ef4444' },
    { name: 'Client Calls', value: 'Client Calls', color: '#f59e0b' },
    { name: 'Development', value: 'Development', color: '#8b5cf6' },
    { name: 'Testing', value: 'Testing', color: '#06b6d4' },
    { name: 'Releases', value: 'Releases', color: '#84cc16' },
  ];

  const timeSlots = [];
  for (let hour = 7; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
    timeSlots.push(`${hour.toString().padStart(2, '0')}:30`);
  }

  const handleCategoryChange = (category) => {
    const categoryData = eventCategories.find(c => c.value === category);
    setFormData({
      ...formData,
      category,
      color: categoryData?.color || '#667eea'
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/events`, formData);
      toast.success('Event created successfully');
      onSave();
      onClose();
    } catch (error) {
      toast.error('Failed to create event');
      console.error(error);
    }
  };

  return (
    <DialogContent data-testid="event-dialog">
      <DialogHeader>
        <DialogTitle>Add Scheduled Event</DialogTitle>
        <DialogDescription>
          Schedule a new event with specific time slots for project management
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="form-group">
          <label className="form-label">Date</label>
          <input
            type="date"
            className="form-input"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            required
            data-testid="event-date-input"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Start Time</label>
            <select
              className="form-select"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              data-testid="event-start-time"
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">End Time</label>
            <select
              className="form-select"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              data-testid="event-end-time"
            >
              {timeSlots.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-input"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            data-testid="event-title-input"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={formData.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            data-testid="event-category-select"
          >
            {eventCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            data-testid="event-description-input"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose} data-testid="cancel-event-button">
            Cancel
          </Button>
          <Button type="submit" data-testid="save-event-button">
            Create Event
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

const ScheduleCalendar = ({ events, onEventCreate, onEventDelete }) => {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedCategories, setSelectedCategories] = useState(new Set());

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekDays = [];
  
  for (let i = 0; i < 7; i++) {
    weekDays.push(addDays(weekStart, i));
  }

  const timeSlots = [];
  for (let hour = 7; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }

  const categories = [
    { name: 'General', color: '#667eea' },
    { name: 'Sprint Planning', color: '#3b82f6' },
    { name: 'Reviews & Demos', color: '#10b981' },
    { name: 'Team Meetings', color: '#ef4444' },
    { name: 'Client Calls', color: '#f59e0b' },
    { name: 'Development', color: '#8b5cf6' },
    { name: 'Testing', color: '#06b6d4' },
    { name: 'Releases', color: '#84cc16' },
  ];

  const filteredEvents = events.filter(event => {
    if (selectedCategories.size === 0) return true;
    return selectedCategories.has(event.category);
  });

  const getEventsForDateAndTime = (date, timeSlot) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return filteredEvents.filter(event => {
      if (event.date !== dateStr) return false;
      const eventStart = event.startTime || '09:00';
      const eventEnd = event.endTime || '10:00';
      return eventStart <= timeSlot && eventEnd > timeSlot;
    });
  };

  const toggleCategory = (categoryName) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(categoryName)) {
      newSelected.delete(categoryName);
    } else {
      newSelected.add(categoryName);
    }
    setSelectedCategories(newSelected);
  };

  const handleTimeSlotClick = (date, timeSlot) => {
    onEventCreate(date, timeSlot);
  };

  const previousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const nextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  return (
    <div className="schedule-calendar">
      {/* Category Sidebar */}
      <div className="schedule-sidebar">
        <h3 className="sidebar-title">Event Categories</h3>
        <div className="category-filters">
          {categories.map(category => (
            <div 
              key={category.name}
              className={`category-item ${selectedCategories.has(category.name) ? 'active' : ''}`}
              onClick={() => toggleCategory(category.name)}
              style={{ '--category-color': category.color }}
            >
              <div className="category-dot" style={{ backgroundColor: category.color }}></div>
              <span className="category-name">{category.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Calendar */}
      <div className="schedule-main">
        {/* Week Navigation */}
        <div className="week-nav">
          <button className="nav-btn" onClick={previousWeek} data-testid="prev-week">
            ← Previous
          </button>
          <h2 className="week-title">
            {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
          </h2>
          <button className="nav-btn" onClick={nextWeek} data-testid="next-week">
            Next →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="schedule-grid">
          {/* Header with days */}
          <div className="grid-header">
            <div className="time-header">Time</div>
            {weekDays.map(day => (
              <div key={day.toISOString()} className="day-header">
                <div className="day-name">{format(day, 'EEE')}</div>
                <div className="day-number">{format(day, 'd')}</div>
              </div>
            ))}
          </div>

          {/* Time slots grid */}
          <div className="grid-body">
            {timeSlots.map(timeSlot => (
              <div key={timeSlot} className="time-row">
                <div className="time-label">{timeSlot}</div>
                {weekDays.map(day => {
                  const dayEvents = getEventsForDateAndTime(day, timeSlot);
                  return (
                    <div 
                      key={`${day.toISOString()}-${timeSlot}`}
                      className="time-slot"
                      onClick={() => handleTimeSlotClick(day, timeSlot)}
                      data-testid={`slot-${format(day, 'yyyy-MM-dd')}-${timeSlot}`}
                    >
                      {dayEvents.map(event => (
                        <div
                          key={event.id}
                          className="event-block"
                          style={{ backgroundColor: event.color }}
                          title={`${event.title} (${event.startTime}-${event.endTime})`}
                        >
                          <div className="event-title">{event.title}</div>
                          <div className="event-time">{event.startTime}-{event.endTime}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`${API}/events`);
      setEvents(response.data);
    } catch (error) {
      toast.error('Failed to load events');
      console.error(error);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleEventCreate = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(`${API}/events/${id}`);
        toast.success('Event deleted successfully');
        fetchEvents();
      } catch (error) {
        toast.error('Failed to delete event');
        console.error(error);
      }
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">Release Calendar</h1>
            <p className="page-subtitle">Schedule events and milestones with time slots</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleEventCreate(new Date(), '09:00')} data-testid="add-event-button">
                + Add Event
              </Button>
            </DialogTrigger>
            {dialogOpen && (
              <EventDialog
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                onClose={() => setDialogOpen(false)}
                onSave={fetchEvents}
              />
            )}
          </Dialog>
        </div>
      </div>

      <ScheduleCalendar
        events={events}
        onEventCreate={handleEventCreate}
        onEventDelete={handleDelete}
      />
    </div>
  );
};

export default Calendar;