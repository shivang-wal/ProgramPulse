import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

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

const Calendar = () => {
  const [events, setEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [date, setDate] = useState(new Date());

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
    setDate(newDate);
    setSelectedDate(newDate);
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
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Release Calendar</h1>
        <p className="page-subtitle">Track important dates and milestones</p>
      </div>

      <div className="calendar-container">
        <div className="calendar-header">
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#212529' }}>Calendar</h2>
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

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="border rounded-lg p-4"
            data-testid="calendar-component"
          />
        </div>

        <div className="events-list">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem', color: '#212529' }}>
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
                  onClick={() => handleDelete(event.id)}
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

export default Calendar;