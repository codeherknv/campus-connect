import { auth, db } from './firebaseConfig';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

// Initial admin users to be created in Firebase
const INITIAL_ADMINS = [
  {
    email: 'admin@bmsce.ac.in',
    password: 'Admin@123',
    name: 'System Administrator',
    role: 'admin'
  },
  {
    email: 'hod@bmsce.ac.in',
    password: 'Hod@123',
    name: 'Head of Department',
    role: 'admin'
  },
  {
    email: 'principal@bmsce.ac.in',
    password: 'Principal@123',
    name: 'Principal',
    role: 'admin'
  }
];

// Function to create initial admin users
export const createInitialAdminUsers = async () => {
  try {
    console.log('Creating initial admin users...');
    
    for (const admin of INITIAL_ADMINS) {
      try {
        // Check if user already exists
        const userDoc = await getDoc(doc(db, 'users', admin.email));
        
        if (!userDoc.exists()) {
          // Create Firebase Auth user
          const userCredential = await createUserWithEmailAndPassword(
            auth, 
            admin.email, 
            admin.password
          );
          
          // Update display name
          await updateProfile(userCredential.user, { 
            displayName: admin.name 
          });
          
          // Save user role to Firestore
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            role: admin.role,
            email: admin.email,
            name: admin.name,
            createdAt: new Date().toISOString()
          });
          
          console.log(`Created admin user: ${admin.email}`);
        } else {
          console.log(`Admin user already exists: ${admin.email}`);
        }
      } catch (error: any) {
        if (error.code === 'auth/email-already-in-use') {
          console.log(`Admin email already exists in Auth: ${admin.email}`);
          // Just create/update the Firestore document
          const userDoc = await getDoc(doc(db, 'users', admin.email));
          if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', admin.email), {
              role: admin.role,
              email: admin.email,
              name: admin.name,
              createdAt: new Date().toISOString()
            });
            console.log(`Created Firestore document for existing admin: ${admin.email}`);
          }
        } else {
          console.error(`Error creating admin ${admin.email}:`, error);
        }
      }
    }
    
    console.log('Initial admin users creation completed');
  } catch (error) {
    console.error('Error in createInitialAdminUsers:', error);
    throw error;
  }
};

// Function to check if admin users exist
export const checkAdminUsersExist = async () => {
  try {
    const existingAdmins = [];
    
    for (const admin of INITIAL_ADMINS) {
      const userDoc = await getDoc(doc(db, 'users', admin.email));
      if (userDoc.exists()) {
        existingAdmins.push(admin.email);
      }
    }
    
    return existingAdmins;
  } catch (error) {
    console.error('Error checking admin users:', error);
    return [];
  }
};
