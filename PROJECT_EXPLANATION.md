# CampusConnect - University Event Management System

## 🎓 Project Overview
CampusConnect is a full-stack web application designed for university campuses to manage and display events. It allows administrators to create events and students to view them in an intuitive calendar interface.

## 🛠️ Technology Stack

### Frontend (React)
- **React 18** - Modern JavaScript library for building user interfaces
- **TypeScript** - Adds type safety to JavaScript
- **Material-UI (MUI)** - Component library for consistent, beautiful UI
- **React Router** - Handles navigation between different pages
- **Date-fns** - Library for date manipulation and formatting

### Backend (Firebase)
- **Firebase Authentication** - User login and role management
- **Firestore** - NoSQL database for storing event data
- **Firebase Hosting** - Web hosting service

### Development Tools
- **Create React App** - Project setup and build tool
- **ESLint** - Code quality checker
- **npm** - Package manager

## 🏗️ Application Architecture

### File Structure
```
src/
├── components/          # Reusable UI components
│   ├── Navbar.tsx      # Navigation bar with menu
│   ├── BackgroundGrid.tsx # Animated background
│   └── ProtectedRoute.tsx # Route protection for admins
├── contexts/           # React Context for state management
│   └── AuthContext.tsx # User authentication state
├── pages/             # Main application pages
│   ├── Calendar.tsx   # Main calendar and event management
│   ├── Home.tsx       # Landing page
│   ├── Auth.tsx       # Login/signup page
│   ├── RoomBooking.tsx # Room booking (hidden in current version)
│   └── StudySpots.tsx  # Study spots (hidden in current version)
├── utils/             # Utility functions and services
│   ├── firebaseConfig.ts    # Firebase configuration
│   ├── firebaseServices.ts  # Database operations
│   └── firebaseServices.ts  # Firebase initialization
├── data/              # Static data and type definitions
│   ├── types.ts       # TypeScript interfaces
│   └── sampleData.ts  # Sample data for development
└── styles/            # Styling
    └── theme.json     # Color scheme
```

## 🔗 Connectivity & Data Flow

### 1. User Authentication Flow
```
User Login → Firebase Auth → AuthContext → Protected Routes
```

### 2. Event Management Flow
```
Admin Creates Event → React Form → Firebase Services → Firestore Database
↓
Student Views → Calendar Component → Firebase Services → Display Events
```

### 3. Component Communication
```
App.tsx (Main Router)
├── AuthContext (Global State)
├── Navbar (Navigation)
├── Home (Landing Page)
└── Calendar (Main Feature)
    ├── Event List (Displays events)
    ├── Event Modal (Full details)
    └── Add Event Dialog (Admin only)
```

## ⚙️ How It Works

### Core Functionality

#### 1. **User Authentication**
- Students and admins can sign up/login
- Firebase Auth manages user sessions
- Role-based access (admin vs student)

#### 2. **Event Management (Admin Only)**
- Click on calendar dates to add events
- Fill form: title, type, description, classroom, registration link
- Data saved to Firestore with timestamps

#### 3. **Event Display (All Users)**
- Calendar view with event dots
- Filter by event type (academic, cultural, sports, other)
- Click events to see full details in modal
- Responsive design for mobile/desktop

#### 4. **Data Storage**
- All events stored in Firestore collection
- Real-time updates
- Automatic past event cleanup

### Key Code Components

#### Authentication (`AuthContext.tsx`)
```typescript
// Manages user login state across the app
const AuthContext = createContext<AuthContextType | undefined>(undefined);
```

#### Event Services (`firebaseServices.ts`)
```typescript
// CRUD operations for events
export const getEvents = async () => { /* Fetch from Firestore */ }
export const addEvent = async (eventData) => { /* Save to Firestore */ }
export const deleteEvent = async (eventId) => { /* Remove from Firestore */ }
```

#### Calendar Component (`Calendar.tsx`)
```typescript
// Main calendar logic
const Calendar = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Fetch events on component load
  useEffect(() => {
    const fetchEvents = async () => {
      const eventsData = await getEvents();
      setEvents(eventsData);
    };
    fetchEvents();
  }, []);
};
```

## 🔄 Data Flow Explanation

### 1. **Adding an Event**
```
Admin clicks date → Dialog opens → Form submission →
firebaseServices.addEvent() → Firestore save → UI updates
```

### 2. **Viewing Events**
```
Page loads → useEffect → firebaseServices.getEvents() →
Firestore query → Data display → Calendar rendering
```

### 3. **Authentication Check**
```
Route access → AuthContext check → Firebase Auth verify →
Allow/Deny access → Redirect if needed
```

## 🎯 Key Features Implemented

### ✅ Completed Features
- **User Authentication** with role management
- **Calendar Interface** with event visualization
- **Event CRUD Operations** (Create, Read, Delete)
- **Event Filtering** by type
- **Responsive Design** for all devices
- **Real-time Data** with Firestore
- **Modal Details View** for full event information
- **Admin Protection** for event management

### 🚧 Future Enhancements (Not Implemented)
- Room booking system
- Study spots management
- Image upload for events
- Push notifications
- Event registration system

## 📱 User Experience Flow

### For Students:
1. **Visit website** → See calendar overview
2. **Browse events** → Filter by type if needed
3. **Click event** → View full details in modal
4. **Register** → Click registration links

### For Admins:
1. **Login** → Access admin features
2. **Click calendar date** → Add new event
3. **Fill form** → Save event details
4. **Manage events** → Edit/delete as needed

## 🔒 Security & Best Practices

- **Role-based access control**
- **Input validation** on forms
- **Protected routes** for admin features
- **TypeScript** for type safety
- **ESLint** for code quality
- **Responsive design** principles

## 🚀 Deployment Ready

The application is production-ready with:
- **Firebase Hosting** configuration
- **Build optimization** via Create React App
- **Environment variables** for configuration
- **Error handling** throughout the app

---

**CampusConnect demonstrates modern full-stack development with React, TypeScript, and Firebase, providing a scalable solution for university event management.**