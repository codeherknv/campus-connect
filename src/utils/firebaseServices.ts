import { 
  collection, 
  addDoc, 
  getDocs, 
  query,
  where,
  updateDoc,
  doc,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Event, Room, StudySpot, Booking } from '../data/types';
import { sampleRooms, sampleBookings, sampleStudySpots } from '../data/sampleData';

// Rooms
export const getRooms = async (): Promise<Room[]> => {
  try {
    const roomsSnapshot = await getDocs(collection(db, 'rooms'));
    const rooms = roomsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Room[];
    
    return rooms.length > 0 ? rooms : sampleRooms;
  } catch (error) {
    console.error('Error getting rooms:', error);
    return sampleRooms;
  }
};

export const addRoom = async (room: Room) => {
  return await addDoc(collection(db, 'rooms'), room);
};

export const updateRoom = async (roomId: string, data: Partial<Room>) => {
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, data);
};

// Events
export const getEvents = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'events'));
    const events = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        date: data.date ? (data.date as Timestamp).toDate() : new Date(),
      };
    });
    console.log('Fetched events:', events); // Debug log
    return events as Event[];
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

export const addEvent = async (eventData: Omit<Event, 'id'>) => {
  try {
    // Convert JavaScript Date to Firestore Timestamp
    const eventWithTimestamp = {
      ...eventData,
      date: Timestamp.fromDate(eventData.date)
    };
    
    const docRef = await addDoc(collection(db, 'events'), eventWithTimestamp);
    return docRef;
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
};

export const updateEvent = async (eventId: string, data: Partial<Event>) => {
  const eventRef = doc(db, 'events', eventId);
  await updateDoc(eventRef, data);
};

export const deleteEvent = async (eventId: string) => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Study Spots
export const getStudySpots = async (): Promise<StudySpot[]> => {
  try {
    const spotsSnapshot = await getDocs(collection(db, 'studySpots'));
    const spots = spotsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      isAvailable: true,
      isOccupied: false,
      currentOccupancy: 0
    })) as StudySpot[];
    
    return spots.length > 0 ? spots : sampleStudySpots;
  } catch (error) {
    console.error('Error getting study spots:', error);
    return sampleStudySpots;
  }
};

export const updateStudySpot = async (spotId: string, data: Partial<StudySpot>) => {
  const spotRef = doc(db, 'studySpots', spotId);
  await updateDoc(spotRef, data);
};

// Room booking functions
export const getBookings = async (): Promise<Booking[]> => {
  try {
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    const bookings = bookingsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime.toDate(),
      endTime: doc.data().endTime.toDate(),
      status: doc.data().status as Booking['status']
    })) as Booking[];
    
    return bookings.length > 0 ? bookings : sampleBookings;
  } catch (error) {
    console.error('Error getting bookings:', error);
    return sampleBookings;
  }
};

export const addBooking = async (bookingData: Omit<Booking, 'id'>) => {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      startTime: new Date(bookingData.startTime),
      endTime: new Date(bookingData.endTime)
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding booking:', error);
    throw error;
  }
};

export const updateBookingStatus = async (bookingId: string, status: 'approved' | 'rejected') => {
  const bookingRef = doc(db, 'bookings', bookingId);
  await updateDoc(bookingRef, { status });
};

export const cleanupPastEvents = async (): Promise<number> => {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Set to start of today

    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('date', '<', Timestamp.fromDate(now)));
    const querySnapshot = await getDocs(q);

    let deletedCount = 0;
    const deletePromises: Promise<void>[] = [];

    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
      deletedCount++;
    });

    await Promise.all(deletePromises);
    console.log(`Cleaned up ${deletedCount} past events`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up past events:', error);
    throw error;
  }
}; 