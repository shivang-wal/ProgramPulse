import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EventDialog = ({ selectedDate, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    title: '',
    description: '',
  });

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
        <DialogTitle>Add Event</DialogTitle>
        <DialogDescription>
          Create a new calendar event for release planning and milestone tracking
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

const DayView = ({ date, events, onDelete }) => {
  const dayEvents = events.filter(event => isSameDay(parseISO(event.date), date));
  
  return (
    <div className="day-view">
      <div className="day-view-header">
        <div className="day-view-date" data-testid="day-view-date">{format(date, 'MMMM dd, yyyy')}</div>
        <div className="day-view-weekday">{format(date, 'EEEE')}</div>
      </div>
      
      <div className="day-view-events">
        {dayEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6B5B95' }}>
            No events scheduled for this day
          </div>
        ) : (
          dayEvents.map((event) => (
            <div key={event.id} className="event-card" data-testid={`event-card-${event.id}`}>
              <div className="event-info">
                <div className="event-title" data-testid="event-title">{event.title}</div>
                {event.description && (
                  <div className="event-description" data-testid="event-description">{event.description}</div>
                )}
              </div>
              <button
                className="icon-button"
                onClick={() => onDelete(event.id)}
                data-testid="delete-event-button"
              >
                🗑️
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const WeekView = ({ date, events, onDelete }) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  const days = [];
  
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  
  return (
    <div className="week-view">
      <div className="week-view-header">
        <div className="week-view-range" data-testid="week-view-range">
          {format(weekStart, 'MMM dd')} - {format(weekEnd, 'MMM dd, yyyy')}
        </div>
      </div>
      
      <div className="week-grid">
        {days.map((day) => {
          const dayEvents = events.filter(event => isSameDay(parseISO(event.date), day));
          
          return (
            <div key={day.toString()} className="week-day-card" data-testid={`week-day-${format(day, 'yyyy-MM-dd')}`}>
              <div className="week-day-header">
                <div className="week-day-name">{format(day, 'EEE')}</div>
                <div className="week-day-number">{format(day, 'd')}</div>
              </div>
              <div className="week-day-events">
                {dayEvents.map((event) => (
                  <div 
                    key={event.id} 
                    className="week-event-item" 
                    data-testid={`week-event-${event.id}`}
                    title={event.description}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const MonthView = ({ date, events, onDateSelect, onDelete }) => {
  const eventDates = events.map(event => event.date);

  const modifiers = {
    hasEvent: (date) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      return eventDates.includes(dateStr);
    },
  };

  const modifiersStyles = {
    hasEvent: {
      backgroundColor: '#667eea',
      color: 'white',
      borderRadius: '50%',
      fontWeight: 'bold',
    },
  };

  const sortedEvents = [...events].sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="calendar-main">
      <div className="calendar-section">
        <div className="calendar-wrapper">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={onDateSelect}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="border rounded-lg p-4"
            data-testid="calendar-component"
          />
        </div>
      </div>
      
      <div className="events-section">
        <div className="events-list">
          <h3 className="events-list-header">
            Upcoming Events ({events.length})
          </h3>
          {sortedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6c757d' }}>
              No events scheduled. Click on a date to add one.
            </div>
          ) : (
            sortedEvents.map((event) => (
              <div key={event.id} className="event-card" data-testid={`event-card-${event.id}`}>
                <div className="event-info">
                  <div className="event-date" data-testid="event-date">
                    {format(new Date(event.date), 'MMMM dd, yyyy')}
                  </div>
                  <div className="event-title" data-testid="event-title">{event.title}</div>
                  {event.description && (
                    <div className="event-description" data-testid="event-description">{event.description}</div>
                  )}
                </div>
                <button
                  className="icon-button"
                  onClick={() => onDelete(event.id)}
                  data-testid="delete-event-button"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // day, week, month

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

  const handleDateSelect = (newDate) => {
    if (newDate) {
      setDate(newDate);
      if (viewMode === 'month') {
        setSelectedDate(newDate);
        setDialogOpen(true);
      }
    }
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
        <h1 className="page-title">Release Calendar</h1>
        <p className="page-subtitle">Track important dates and milestones</p>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          <div className="calendar-view-filters">
            <button 
              className={`view-filter-btn ${viewMode === 'day' ? 'active' : ''}`}
              onClick={() => setViewMode('day')}
              data-testid="view-day-button"
            >
              Day
            </button>
            <button 
              className={`view-filter-btn ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
              data-testid="view-week-button"
            >
              Week
            </button>
            <button 
              className={`view-filter-btn ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
              data-testid="view-month-button"
            >
              Month
            </button>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setSelectedDate(new Date()); setDialogOpen(true); }} data-testid="add-event-button">
                + Add Event
              </Button>
            </DialogTrigger>
            {dialogOpen && (
              <EventDialog
                selectedDate={selectedDate}
                onClose={() => setDialogOpen(false)}
                onSave={fetchEvents}
              />
            )}
          </Dialog>
        </div>

        {viewMode === 'day' && <DayView date={date} events={events} onDelete={handleDelete} />}
        {viewMode === 'week' && <WeekView date={date} events={events} onDelete={handleDelete} />}
        {viewMode === 'month' && <MonthView date={date} events={events} onDateSelect={handleDateSelect} onDelete={handleDelete} />}
      </div>
    </div>
  );
};

export default Calendar;