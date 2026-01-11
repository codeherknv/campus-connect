import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import {
  Add as AddIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
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

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: 'academic',
    description: '',
    classroom: '',
    registrationLink: '',
  });
  const { isAdmin, isAuthenticated } = useAuth();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  useEffect(() => {
    const fetchEvents = async () => {
      const eventsData = await getEvents();
      setEvents(eventsData);
    };
    fetchEvents();
  }, []);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleDateClick = (date: Date) => {
    if (isAdmin) {
      setSelectedDate(date);
      setOpenDialog(true);
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
        // Refresh events
        const updatedEvents = await getEvents();
        setEvents(updatedEvents);
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
        // Refresh events
        const updatedEvents = await getEvents();
        setEvents(updatedEvents);
      } catch (error) {
        console.error('Error cleaning up past events:', error);
        alert('Error cleaning up past events: ' + (error as Error).message);
      }
    }
  };

  const handleAddEvent = async () => {
    if (selectedDate && newEvent.title) {
      if (!isAuthenticated) {
        alert('You must be logged in to add events.');
        return;
      }

      if (!isAdmin) {
        alert('You must be an admin to add events.');
        return;
      }

      try {
        const eventData = {
          title: newEvent.title,
          date: selectedDate,
          type: newEvent.type as 'academic' | 'cultural' | 'sports' | 'other',
          description: newEvent.description,
          classroom: newEvent.classroom || '',
          backgroundColor: getEventColor(newEvent.type),
          registrationLink: newEvent.registrationLink || ''
        };

        console.log('Adding event:', eventData);
        await addEvent(eventData);

        // Refresh events
        const updatedEvents = await getEvents();
        setEvents(updatedEvents);
        console.log('Events refreshed, total events:', updatedEvents.length);

        // Reset form
        setOpenDialog(false);
        setNewEvent({
          title: '',
          type: 'academic',
          description: '',
          classroom: '',
          registrationLink: '',
        });
        setSelectedDate(null);
        console.log('Form reset complete');
      } catch (error) {
        console.error('Error adding event:', error);
        alert('Error adding event: ' + (error as Error).message);
      }
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
      default:
        return '#1976d2';
    }
  };

  const getEventsForDay = (date: Date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of today

    return events.filter(event =>
      isSameDay(new Date(event.date), date) && new Date(event.date) >= now
    );
  };

  const getFilteredEvents = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of today

    let filtered = events.filter(event => new Date(event.date) >= now);

    if (eventFilter !== 'all') {
      filtered = filtered.filter(event => event.type === eventFilter);
    }

    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

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
                {isAdmin && (
                  <StyledButton
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedDate(new Date());
                      setOpenDialog(true);
                    }}
                  >
                    Add Event
                  </StyledButton>
                )}
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
                {[...Array(monthStart.getDay())].map((_, index) => (
                  <CalendarDay key={`empty-${index}`} />
                ))}

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
        onClose={() => setOpenDialog(false)}
        PaperProps={{
          sx: {
            background: 'rgba(10, 25, 41, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
          }
        }}
      >
        <DialogTitle sx={{ color: '#fff' }}>Add New Event</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Event Title"
              fullWidth
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
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
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
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
              value={newEvent.registrationLink}
              onChange={(e) => setNewEvent({ ...newEvent, registrationLink: e.target.value })}
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
              value={newEvent.type}
              onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
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
              <MenuItem value="academic">Academic</MenuItem>
              <MenuItem value="cultural">Cultural</MenuItem>
              <MenuItem value="sports">Sports</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
            <TextField
              label="Classroom (Optional)"
              fullWidth
              value={newEvent.classroom}
              onChange={(e) => setNewEvent({ ...newEvent, classroom: e.target.value })}
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
            onClick={() => setOpenDialog(false)}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': { color: '#fff' }
            }}
          >
            Cancel
          </Button>
          <StyledButton onClick={handleAddEvent} disabled={!newEvent.title}>
            Add Event
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
              {getFilteredEvents().length === 0 ? (
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
                  {getFilteredEvents().map((event) => (
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
                        <Box sx={{ flex: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              color: '#fff',
                              fontWeight: 600,
                              mb: 1
                            }}
                          >
                            {event.title}
                          </Typography>
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
                        {isAdmin && (
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id!);
                            }}
                            sx={{
                              color: 'rgba(255, 255, 255, 0.5)',
                              '&:hover': {
                                color: '#f44336',
                                background: 'rgba(244, 67, 54, 0.1)'
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
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