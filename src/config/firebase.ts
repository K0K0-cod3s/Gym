import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCjtUN3BvFoLryvO8Lj5lQlYP2kTqKdySU",
  authDomain: "my-fitness-tracker-a8760.firebaseapp.com",
  projectId: "my-fitness-tracker-a8760",
  storageBucket: "my-fitness-tracker-a8760.firebasestorage.app",
  messagingSenderId: "585707730478",
  appId: "1:585707730478:web:e15e6743760be2a3d891bf",
  measurementId: "G-F1BKLF7MMP"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Export the app ID for use in Firestore paths
export const appId = firebaseConfig.appId;

// Enable offline persistence for better data caching
const enablePersistence = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('✅ Firebase offline persistence enabled');
  } catch (err: any) {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ The current browser does not support all of the features required to enable persistence');
    } else {
      console.error('❌ Failed to enable persistence:', err);
    }
  }
};

// Enable persistence
enablePersistence();

// Test Firestore connection
const testFirestoreConnection = async () => {
  try {
    console.log('🔥 Testing Firestore connection...');
    const testDoc = doc(db, 'test', 'connection');
    await setDoc(testDoc, { timestamp: new Date(), test: true });
    console.log('✅ Firestore connection successful!');
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    console.error('💡 Make sure Firestore Database is enabled in Firebase Console');
  }
};

// Test connection on load
testFirestoreConnection();

// Log Firebase connection status
console.log('🔥 Firebase initialized with project:', firebaseConfig.projectId);
console.log('📱 App ID:', appId);
console.log('🔐 Auth domain:', firebaseConfig.authDomain);