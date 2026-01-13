import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Fade,
  Chip,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  Edit as EditIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { styled } from '@mui/material/styles';
import BackgroundGridComponent from '../components/BackgroundGrid';
import { getEvents, addEvent, deleteEvent, updateEvent, cleanupPastEvents } from '../utils/firebaseServices';
import { Event } from '../data/types';

// Styled components
const StyledPaper = styled(Paper)(({ theme }) => ({
  background: 'rgba(10, 25, 41, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(33, 150, 243, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
    '&::before': {
      opacity: 1,
    },
  },
}));

const CalendarHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(3),
  padding: theme.spacing(2),
  background: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'column',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  }
}));

const CalendarGrid = styled(Box)(({ theme }) => ({
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  background: 'rgba(255, 255, 255, 0.02)',
  borderRadius: '12px',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5),
  }
}));

const CalendarDay = styled(Box)<{ isCurrentMonth?: boolean; isToday?: boolean }>(
  ({ theme, isCurrentMonth, isToday }) => ({
    aspectRatio: '1',
    padding: theme.spacing(1.5),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    background: isToday ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
    borderRadius: '12px',
    border: isToday ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
    cursor: 'pointer',
    transition: 'all 0.3s ease-in-out',
    position: 'relative',
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0.5),
      '& > *': {
        fontSize: '0.8rem',
      }
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(45deg, rgba(33, 150, 243, 0.1) 0%, rgba(255, 152, 0, 0.1) 100%)',
      opacity: 0,
      transition: 'opacity 0.3s ease-in-out',
      borderRadius: '12px',
    },
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.05)',
      transform: 'translateY(-2px)',
      '&::before': {
        opacity: 1,
      },
    },
  })
);

const DayNumber = styled(Typography)<{ isCurrentMonth?: boolean }>(
  ({ theme, isCurrentMonth }) => ({
    color: isCurrentMonth ? '#fff' : 'rgba(255, 255, 255, 0.5)',
    fontWeight: 500,
    fontSize: '1rem',
    marginBottom: theme.spacing(0.5),
    [theme.breakpoints.down('sm')]: {
      fontSize: '0.875rem',
      marginBottom: theme.spacing(0.25),
    }
  })
);

const EventDot = styled(Box)(({ theme }) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#2196f3',
  marginTop: '2px',
  boxShadow: '0 0 8px rgba(33, 150, 243, 0.5)',
}));

const EventText = styled(Typography)(({ theme }) => ({
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '0.75rem',
  textAlign: 'center',
  marginTop: '4px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.65rem',
    marginTop: '2px',
    maxWidth: '100%',
    display: '-webkit-box',
    '-webkit-line-clamp': '1',
    '-webkit-box-orient': 'vertical',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #2196f3 30%, #1976d2 90%)',
  borderRadius: '8px',
  border: 'none',
  color: 'white',
  height: 40,
  padding: '0 20px',
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease-in-out',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 5px 15px rgba(33, 203, 243, .4)',
    '&::before': {
      opacity: 1,
    },
  },
}));

type EventFormState = {
  title: string;
  type: 'academic' | 'cultural' | 'sports' | 'other';
  description: string;
  classroom: string;
  registrationLink: string;
  date: string;
};

const createEmptyEventForm = (date?: Date): EventFormState => ({
  title: '',
  type: 'academic',
  description: '',
  classroom: '',
  registrationLink: '',
  date: format(date ?? new Date(), 'yyyy-MM-dd'),
});

const EVENT_TYPES: EventFormState['type'][] = ['academic', 'cultural', 'sports', 'other'];

const normalizeEventType = (type: string): EventFormState['type'] =>
  (EVENT_TYPES.includes(type as EventFormState['type']) ? type : 'academic') as EventFormState['type'];

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const upcomingSectionRef = useRef<HTMLDivElement | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [eventForm, setEventForm] = useState<EventFormState>(createEmptyEventForm());
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { isAdmin, isAuthenticated } = useAuth();
  const isStudentView = !isAdmin;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const refreshEvents = useCallback(async () => {
    const eventsData = await getEvents();
    setEvents(eventsData);
  }, []);

  useEffect(() => {
    refreshEvents();
  }, [refreshEvents]);

  const openCreateDialog = (date?: Date) => {
    setDialogMode('create');
    setSelectedEvent(null);
    setEventForm(createEmptyEventForm(date));
    setOpenDialog(true);
  };

  const openEditDialog = (event: Event) => {
    setDialogMode('edit');
    setSelectedEvent(event);
    setEventForm({
      title: event.title,
      type: normalizeEventType(event.type),
      description: event.description,
      classroom: event.classroom || '',
      registrationLink: event.registrationLink || '',
      date: format(new Date(event.date), 'yyyy-MM-dd'),
    });
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    setOpenDialog(false);
    setDialogMode('create');
    setEventForm(createEmptyEventForm());
    setSelectedEvent(null);
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleDateClick = (date: Date) => {
    if (isAdmin) {
      openCreateDialog(date);
      return;
    }

    const dayEvents = getEventsForDay(date);
    if (dayEvents.length > 0) {
      handleEventClick(dayEvents[0]);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setEventDetailsOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        if (selectedEvent?.id === eventId) {
          setEventDetailsOpen(false);
          setSelectedEvent(null);
        }
        await refreshEvents();
      } catch (error) {
        console.error('Error deleting event:', error);
        // Add error handling UI here
      }
    }
  };

  const handleCleanupPastEvents = async () => {
    if (window.confirm('Are you sure you want to permanently delete all past events? This action cannot be undone.')) {
      try {
        const deletedCount = await cleanupPastEvents();
        alert(`Successfully deleted ${deletedCount} past events.`);
        await refreshEvents();
      } catch (error) {
        console.error('Error cleaning up past events:', error);
        alert('Error cleaning up past events: ' + (error as Error).message);
      }
    }
  };

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim()) {
      alert('Event title is required.');
      return;
    }

    if (!eventForm.date) {
      alert('Please select a date for the event.');
      return;
    }

    if (!isAuthenticated) {
      alert('You must be logged in to manage events.');
      return;
    }

    if (!isAdmin) {
      alert('Only admins can manage events.');
      return;
    }

    const eventDate = new Date(eventForm.date);
    if (Number.isNaN(eventDate.getTime())) {
      alert('Please provide a valid date.');
      return;
    }

    const eventData: Omit<Event, 'id'> = {
      title: eventForm.title.trim(),
      date: eventDate,
      type: eventForm.type,
      description: eventForm.description,
      classroom: eventForm.classroom || '',
      backgroundColor: getEventColor(eventForm.type),
      registrationLink: eventForm.registrationLink || ''
    };

    try {
      if (dialogMode === 'edit' && selectedEvent?.id) {
        await updateEvent(selectedEvent.id, eventData);
      } else {
        await addEvent(eventData);
      }

      await refreshEvents();

      setOpenDialog(false);
      setSelectedEvent(null);
      setEventForm(createEmptyEventForm());
      setDialogMode('create');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event: ' + (error as Error).message);
    }
  };

  // Add this helper function to determine event color based on type
  const getEventColor = (type: string): string => {
    switch (type) {
      case 'academic':
        return '#1976d2';
      case 'lab':
        return '#2e7d32';
      case 'seminar':
        return '#ed6c02';
      case 'cultural':
        return '#ab47bc';
      case 'sports':
        return '#ef5350';
      case 'other':
        return '#00897b';
      default:
        return '#1976d2';
    }
  };

  const getEventChipStyles = (type: string) => {
    const color = getEventColor(type);
    return {
      backgroundColor: `${color}33`,
      borderColor: `${color}66`,
      color: '#fff',
    };
  };

  const getEventsForDay = (date: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of today

    return events.filter(event =>
      isSameDay(new Date(event.date), date) && new Date(event.date) >= now
    );
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let filtered = events.filter(event => new Date(event.date) >= now);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.type.toLowerCase().includes(query) ||
        (event.classroom && event.classroom.toLowerCase().includes(query))
      );
    }
    
    // Apply event type filter
    if (eventFilter !== 'all') {
      filtered = filtered.filter(event => event.type === eventFilter);
    }

    return filtered.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [events, eventFilter, searchQuery]);

  const upcomingCount = filteredEvents.length;
  const nextEvent = filteredEvents[0];
  const studentHighlightChips = ['Hackathons', 'Workshops', 'Sports Fests', 'Seminars'];

  return (
    <>
      <BackgroundGridComponent />
      <Container
        maxWidth="lg"
        sx={{
          mt: { xs: 2, sm: 4 },
          mb: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        <Fade in timeout={800}>
          <Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#fff',
                mb: 3,
              }}
            >
              Event Calendar
            </Typography>

            {isAdmin ? (
              <StyledPaper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#fff', fontWeight: 600 }}>
                  Admin Control Center
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: 'rgba(255, 255, 255, 0.7)', mt: 1 }}
                >
                  Create, edit, or purge events directly from here. Click any calendar day to schedule something new.
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 2 }}>
                  <StyledButton
                    startIcon={<AddIcon />}
                    onClick={() => openCreateDialog()}
                  >
                    Add Event
                  </StyledButton>
                  <Tooltip title="Remove every past event in a single action">
                    <Button
                      variant="outlined"
                      startIcon={<DeleteSweepIcon />}
                      onClick={handleCleanupPastEvents}
                      sx={{
                        color: '#f44336',
                        borderColor: 'rgba(244, 67, 54, 0.7)',
                        '&:hover': {
                          borderColor: '#f44336',
                          background: 'rgba(244, 67, 54, 0.1)',
                        },
                      }}
                    >
                      Clean Past Events
                    </Button>
                  </Tooltip>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 2,
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  Tip: Select any date tile to prefill the scheduler or hit “Add Event” for manual entry.
                </Typography>
              </StyledPaper>
            ) : (
              <StyledPaper
                sx={{
                  p: 3,
                  mb: 3,
                  background:
                    'linear-gradient(135deg, rgba(33,150,243,0.25), rgba(156,39,176,0.2))',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                  Hey BMSCE!
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}
                >
                  {upcomingCount > 0
                    ? `There ${upcomingCount === 1 ? 'is' : 'are'} ${upcomingCount} exciting event${upcomingCount === 1 ? '' : 's'} coming up soon.`
                    : 'No events on the radar yet. Check back for fresh announcements!'}
                </Typography>
                {nextEvent && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: '12px',
                      background: 'rgba(10, 25, 41, 0.65)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      mb: 2,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ color: '#64b5f6', mb: 0.5 }}>
                      Next highlight
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {nextEvent.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      {format(new Date(nextEvent.date), 'PPP')} • {nextEvent.type}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {studentHighlightChips.map((chip) => (
                    <Chip
                      key={chip}
                      label={chip}
                      sx={{
                        color: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        backgroundColor: 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                      }}
                      variant="outlined"
                    />
                  ))}
                </Box>
                <Button
                  variant="contained"
                  sx={{ mt: 2, textTransform: 'none' }}
                  onClick={() =>
                    upcomingSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  Browse upcoming events
                </Button>
              </StyledPaper>
            )}

            <StyledPaper sx={{ p: 3 }}>
              <CalendarHeader>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      color: '#fff',
                      fontWeight: 600,
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}
                  >
                    {format(currentDate, 'MMMM yyyy')}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={handlePrevMonth}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { color: '#fff' }
                      }}
                    >
                      <ChevronLeftIcon />
                    </IconButton>
                    <IconButton
                      onClick={handleNextMonth}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { color: '#fff' }
                      }}
                    >
                      <ChevronRightIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <TextField
                    placeholder="Search events..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                        </InputAdornment>
                      ),
                      endAdornment: searchQuery && (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            onClick={() => setSearchQuery('')}
                            sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                          >
                            <ClearIcon />
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{
                      minWidth: 250,
                      '& .MuiOutlinedInput-root': {
                        color: '#fff',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '8px',
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#2196f3',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                        '&.Mui-focused': {
                          color: '#2196f3',
                        },
                      },
                    }}
                  />
                  {isAdmin ? (
                    <StyledButton
                      startIcon={<AddIcon />}
                      onClick={() => openCreateDialog(new Date())}
                    >
                      Add Event
                    </StyledButton>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'right' }}
                    >
                      Tap a date tile to peek into day.
                    </Typography>
                  )}
                </Box>
              </CalendarHeader>

              <Box sx={{ mb: 2 }}>
                <Grid container spacing={1}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Grid item xs key={day}>
                      <Typography
                        align="center"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', sm: '0.9rem' },
                          padding: { xs: '4px 0', sm: '8px 0' },
                          background: 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        {day.slice(0, 1)}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <CalendarGrid>
                {days.map((day: Date, index: number) => {
                  const dayEvents = getEventsForDay(day);
                  return (
                    <CalendarDay
                      key={day.toString()}
                      isCurrentMonth={isSameMonth(day, currentDate)}
                      isToday={isSameDay(day, new Date())}
                      onClick={() => handleDateClick(day)}
                    >
                      <DayNumber isCurrentMonth={isSameMonth(day, currentDate)}>
                        {format(day, 'd')}
                      </DayNumber>
                      {dayEvents.length > 0 && <EventDot />}
                      {dayEvents.map(event => (
                        <EventText 
                          key={event.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { 
                              color: '#fff',
                              textDecoration: 'underline'
                            }
                          }}
                        >
                          {event.title}
                        </EventText>
                      ))}
                    </CalendarDay>
                  );
                })}
              </CalendarGrid>
            </StyledPaper>
          </Box>
        </Fade>
      </Container>

      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        PaperProps={{
          sx: {
            background: 'rgba(10, 25, 41, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          {dialogMode === 'edit' ? 'Update Event' : 'Add New Event'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Event Title"
              fullWidth
              value={eventForm.title}
              onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196f3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#2196f3',
                  },
                },
              }}
            />
            <TextField
              label="Event Date"
              type="date"
              fullWidth
              value={eventForm.date}
              onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196f3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#2196f3',
                  },
                },
              }}
            />
            <TextField
              label="Event Description"
              multiline
              rows={3}
              fullWidth
              value={eventForm.description}
              onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196f3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#2196f3',
                  },
                },
              }}
            />
            <TextField
              label="Registration Link (Optional)"
              placeholder="https://example.com/registration-form"
              fullWidth
              value={eventForm.registrationLink}
              onChange={(e) => setEventForm({ ...eventForm, registrationLink: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196f3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#2196f3',
                  },
                },
              }}
            />
            <TextField
              select
              label="Event Type"
              fullWidth
              value={eventForm.type}
              onChange={(e) =>
                setEventForm({
                  ...eventForm,
                  type: normalizeEventType(e.target.value),
                })
              }
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196f3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#2196f3',
                  },
                },
              }}
            >
              {EVENT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Classroom (Optional)"
              fullWidth
              value={eventForm.classroom}
              onChange={(e) => setEventForm({ ...eventForm, classroom: e.target.value })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#2196f3',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-focused': {
                    color: '#2196f3',
                  },
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleDialogClose}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#fff' }
            }}
          >
            Cancel
          </Button>
          <StyledButton onClick={handleSaveEvent} disabled={!eventForm.title}>
            {dialogMode === 'edit' ? 'Save Changes' : 'Add Event'}
          </StyledButton>
        </DialogActions>
      </Dialog>

      <Dialog
        open={eventDetailsOpen}
        onClose={() => setEventDetailsOpen(false)}
        PaperProps={{
          sx: {
            background: 'rgba(10, 25, 41, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>
          {selectedEvent?.title}
        </DialogTitle>
        <DialogContent
          sx={{
            maxHeight: '60vh',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '4px',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.5)',
              },
            },
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>Date:</strong> {selectedEvent ? format(new Date(selectedEvent.date), 'PPP') : ''}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>Type:</strong> {selectedEvent?.type}
            </Typography>
            {selectedEvent?.classroom && (
              <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                <strong>Classroom:</strong> {selectedEvent.classroom}
              </Typography>
            )}
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <strong>Description:</strong>
            </Typography>
            <Typography variant="body2" sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              lineHeight: 1.6,
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minHeight: '60px',
              maxHeight: '200px',
              overflow: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '3px',
                '&:hover': {
                  background: 'rgba(255, 255, 255, 0.4)',
                },
              },
            }}>
              {selectedEvent?.description || 'No description available.'}
            </Typography>
            {selectedEvent?.registrationLink && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.9)', mb: 1 }}>
                  <strong>Registration:</strong>
                </Typography>
                <Button
                  variant="contained"
                  href={selectedEvent.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    backgroundColor: '#2196f3',
                    '&:hover': {
                      backgroundColor: '#1976d2',
                    },
                    textTransform: 'none',
                  }}
                >
                  Register for Event
                </Button>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          {isAdmin && selectedEvent?.id && (
            <>
              <Button
                onClick={() => {
                  setEventDetailsOpen(false);
                  openEditDialog(selectedEvent);
                }}
                sx={{
                  color: '#4caf50',
                  textTransform: 'none',
                  '&:hover': { color: '#81c784' },
                }}
              >
                Edit
              </Button>
              <Button
                onClick={() => {
                  setEventDetailsOpen(false);
                  handleDeleteEvent(selectedEvent.id!);
                }}
                sx={{
                  color: '#f44336',
                  textTransform: 'none',
                  '&:hover': { color: '#ff7961' },
                }}
              >
                Delete
              </Button>
            </>
          )}
          <Button
            onClick={() => setEventDetailsOpen(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#fff' }
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Events List Section */}
      <Container
        maxWidth="lg"
        sx={{
          mt: 4,
          mb: { xs: 2, sm: 4 },
          px: { xs: 1, sm: 2, md: 3 }
        }}
      >
        <Fade in timeout={1000}>
          <Box ref={upcomingSectionRef}>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 600,
                color: '#fff',
                mb: 3,
              }}
            >
              Upcoming Events
            </Typography>

            {/* Filter Buttons */}
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Button
                variant={eventFilter === 'all' ? 'contained' : 'outlined'}
                onClick={() => setEventFilter('all')}
                sx={{
                  color: eventFilter === 'all' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: eventFilter === 'all' ? 'rgba(33, 150, 243, 0.8)' : 'transparent',
                  '&:hover': {
                    backgroundColor: eventFilter === 'all' ? 'rgba(33, 150, 243, 0.9)' : 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  textTransform: 'none',
                  fontSize: '0.875rem',
                }}
              >
                All Events
              </Button>
              <Button
                variant={eventFilter === 'academic' ? 'contained' : 'outlined'}
                onClick={() => setEventFilter('academic')}
                sx={{
                  color: eventFilter === 'academic' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: eventFilter === 'academic' ? 'rgba(33, 150, 243, 0.8)' : 'transparent',
                  '&:hover': {
                    backgroundColor: eventFilter === 'academic' ? 'rgba(33, 150, 243, 0.9)' : 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  textTransform: 'none',
                  fontSize: '0.875rem',
                }}
              >
                Academic
              </Button>
              <Button
                variant={eventFilter === 'cultural' ? 'contained' : 'outlined'}
                onClick={() => setEventFilter('cultural')}
                sx={{
                  color: eventFilter === 'cultural' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: eventFilter === 'cultural' ? 'rgba(33, 150, 243, 0.8)' : 'transparent',
                  '&:hover': {
                    backgroundColor: eventFilter === 'cultural' ? 'rgba(33, 150, 243, 0.9)' : 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  textTransform: 'none',
                  fontSize: '0.875rem',
                }}
              >
                Cultural
              </Button>
              <Button
                variant={eventFilter === 'sports' ? 'contained' : 'outlined'}
                onClick={() => setEventFilter('sports')}
                sx={{
                  color: eventFilter === 'sports' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: eventFilter === 'sports' ? 'rgba(33, 150, 243, 0.8)' : 'transparent',
                  '&:hover': {
                    backgroundColor: eventFilter === 'sports' ? 'rgba(33, 150, 243, 0.9)' : 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  textTransform: 'none',
                  fontSize: '0.875rem',
                }}
              >
                Sports
              </Button>
              <Button
                variant={eventFilter === 'other' ? 'contained' : 'outlined'}
                onClick={() => setEventFilter('other')}
                sx={{
                  color: eventFilter === 'other' ? '#fff' : 'rgba(255, 255, 255, 0.7)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: eventFilter === 'other' ? 'rgba(33, 150, 243, 0.8)' : 'transparent',
                  '&:hover': {
                    backgroundColor: eventFilter === 'other' ? 'rgba(33, 150, 243, 0.9)' : 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                  },
                  textTransform: 'none',
                  fontSize: '0.875rem',
                }}
              >
                Other
              </Button>
            </Box>

            <StyledPaper sx={{ p: 3 }}>
              {filteredEvents.length === 0 ? (
                <Typography
                  variant="body1"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    textAlign: 'center',
                    py: 4
                  }}
                >
                  {eventFilter === 'all' ? 'No upcoming events scheduled.' : `No upcoming ${eventFilter} events.`}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredEvents.map((event) => (
                      <Box
                        key={event.id}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          p: 2,
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          transition: 'all 0.3s ease-in-out',
                          cursor: 'pointer',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.1)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                          }
                        }}
                        onClick={() => handleEventClick(event)}
                      >
                        <Box sx={{ flex: 1, pr: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 1,
                              mb: 1,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                color: '#fff',
                                fontWeight: 600,
                              }}
                            >
                              {event.title}
                            </Typography>
                            {isAdmin ? (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Edit event">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditDialog(event);
                                    }}
                                    sx={{
                                      color: 'rgba(255, 255, 255, 0.7)',
                                      '&:hover': { color: '#4caf50' },
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete event">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteEvent(event.id!);
                                    }}
                                    sx={{
                                      color: 'rgba(255, 255, 255, 0.5)',
                                      '&:hover': {
                                        color: '#f44336',
                                        background: 'rgba(244, 67, 54, 0.1)',
                                      },
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            ) : (
                              <Chip
                                label={event.type}
                                size="small"
                                variant="outlined"
                                sx={{
                                  ...getEventChipStyles(event.type),
                                  textTransform: 'capitalize',
                                }}
                              />
                            )}
                          </Box>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'rgba(255, 255, 255, 0.7)',
                              mb: 1
                            }}
                          >
                            {format(new Date(event.date), 'PPP')} • {event.type}
                            {event.classroom && ` • ${event.classroom}`}
                          </Typography>
                          <Box sx={{ position: 'relative' }}>
                            <Typography
                              variant="body2"
                              sx={{
                                color: 'rgba(255, 255, 255, 0.6)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  color: 'rgba(255, 255, 255, 0.8)',
                                }
                              }}
                              onClick={() => handleEventClick(event)}
                              title="Click to view full description"
                            >
                              {event.description}
                            </Typography>
                            {event.description && event.description.length > 100 && (
                              <Typography
                                variant="caption"
                                sx={{
                                  position: 'absolute',
                                  bottom: 0,
                                  right: 0,
                                  color: '#2196f3',
                                  fontSize: '0.7rem',
                                  background: 'rgba(10, 25, 41, 0.9)',
                                  padding: '0 4px',
                                  borderRadius: '2px',
                                  opacity: 0.8,
                                }}
                              >
                                more...
                              </Typography>
                            )}
                          </Box>
                          {event.registrationLink && (
                            <Box sx={{ mt: 1 }}>
                              <Button
                                variant="outlined"
                                size="small"
                                href={event.registrationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  color: '#2196f3',
                                  borderColor: '#2196f3',
                                  '&:hover': {
                                    backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                    borderColor: '#2196f3',
                                  },
                                  textTransform: 'none',
                                  fontSize: '0.75rem',
                                }}
                              >
                                Register for Event
                              </Button>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    ))}
                </Box>
              )}
            </StyledPaper>
          </Box>
        </Fade>
      </Container>
    </>
  );
};

export default Calendar; 