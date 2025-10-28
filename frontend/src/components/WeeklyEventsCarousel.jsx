import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { format, startOfWeek, endOfWeek, parseISO, isWithinInterval } from 'date-fns';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WeeklyEventsCarousel = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true,
      align: 'start',
      slidesToScroll: 1,
      containScroll: 'trimSnaps'
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    const fetchWeeklyEvents = async () => {
      try {
        const response = await axios.get(`${API}/events`);
        const allEvents = response.data;
        
        // Filter events for current week
        const now = new Date();
        const weekStart = startOfWeek(now, { weekStartsOn: 0 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
        
        const weeklyEvents = allEvents.filter(event => {
          try {
            const eventDate = parseISO(event.date);
            return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
          } catch {
            return false;
          }
        });
        
        // Sort by date and time
        weeklyEvents.sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.startTime.localeCompare(b.startTime);
        });
        
        setEvents(weeklyEvents);
      } catch (error) {
        console.error('Failed to load events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyEvents();
  }, []);

  if (loading) {
    return (
      <div className="weekly-events-carousel">
        <div className="carousel-header">
          <div className="carousel-title">
            <Calendar size={24} />
            <h2>This Week's Events</h2>
          </div>
        </div>
        <div className="carousel-loading">Loading events...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="weekly-events-carousel">
        <div className="carousel-header">
          <div className="carousel-title">
            <Calendar size={24} />
            <h2>This Week's Events</h2>
          </div>
        </div>
        <div className="carousel-empty">
          <Calendar size={48} />
          <p>No events scheduled for this week</p>
        </div>
      </div>
    );
  }

  return (
    <div className="weekly-events-carousel">
      <div className="carousel-header">
        <div className="carousel-title">
          <Calendar size={24} />
          <h2>This Week's Events</h2>
          <span className="event-count">{events.length} event{events.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="carousel-controls">
          <button onClick={scrollPrev} className="carousel-btn" aria-label="Previous">
            <ChevronLeft size={20} />
          </button>
          <button onClick={scrollNext} className="carousel-btn" aria-label="Next">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="carousel-viewport" ref={emblaRef}>
        <div className="carousel-container">
          {events.map((event) => (
            <div key={event.id} className="carousel-slide">
              <div className="event-card" style={{ borderLeftColor: event.color }}>
                <div className="event-card-header">
                  <div 
                    className="event-category-badge" 
                    style={{ backgroundColor: event.color }}
                  >
                    {event.category}
                  </div>
                  <div className="event-date">
                    {format(parseISO(event.date), 'EEE, MMM dd')}
                  </div>
                </div>
                
                <h3 className="event-card-title">{event.title}</h3>
                
                <div className="event-card-time">
                  <Clock size={16} />
                  <span>{event.startTime} - {event.endTime}</span>
                </div>
                
                {event.description && (
                  <p className="event-card-description">{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklyEventsCarousel;
