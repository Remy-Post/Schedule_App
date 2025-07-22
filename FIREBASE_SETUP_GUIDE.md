# Firebase Setup Guide for Schedule App

## Prerequisites
- Google account (Gmail account)
- Your React Schedule App project ready

## Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter project name: `schedule-app` (or your preferred name)
4. Choose whether to enable Google Analytics (recommended for tracking)
5. Select your Google Analytics account or create a new one
6. Click "Create project"

## Step 2: Register Your Web App
1. In your Firebase project dashboard, click the web icon `</>`
2. Enter app nickname: `Schedule App Web`
3. Check "Also set up Firebase Hosting" if you want to deploy later
4. Click "Register app"

## Step 3: Get Firebase Configuration
1. Copy the Firebase configuration object that appears
2. It should look like this:
```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
  measurementId: "G-XXXXXXXXXX"
};
```

## Step 4: Enable Required Firebase Services
Go to your Firebase project and enable these services:

### Authentication (for user login/signup)
1. Go to Authentication > Sign-in method
2. Enable desired providers:
   - Email/Password
   - Google (recommended)
   - Facebook, Twitter, etc. (optional)

### Firestore Database (for storing schedules/todos)
1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location closest to your users

### Cloud Storage (optional - for file uploads)
1. Go to Storage
2. Click "Get started"
3. Choose security rules (start in test mode)

## Step 5: Install Firebase SDK
In your React app directory, run:
```bash
npm install firebase
```

## Step 6: Create Firebase Configuration File
Create `src/firebase/config.js`:
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  // Paste your config here
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

## Step 7: Set Up Environment Variables
1. Create `.env` file in your project root
2. Add your Firebase config as environment variables:
```env
REACT_APP_FIREBASE_API_KEY=your-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=your-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

3. Update your `src/firebase/config.js` to use environment variables:
```javascript
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};
```

4. Add `.env` to your `.gitignore` file

## Step 8: Configure Firestore Security Rules
In Firebase Console > Firestore > Rules, update rules for development:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow authenticated users to read/write schedules and todos
    match /schedules/{document=**} {
      allow read, write: if request.auth != null;
    }
    
    match /todos/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Next Steps After Setup
1. Test Firebase connection in your React app
2. Implement user authentication
3. Set up Firestore collections for schedules and todos
4. Deploy your app using Firebase Hosting (optional)

## Important Security Notes
- Never commit your `.env` file to version control
- In production, use more restrictive Firestore security rules
- Consider setting up Firebase App Check for additional security
- Regularly rotate your API keys if needed

## Estimated Time
- Firebase project setup: 10-15 minutes
- React integration: 20-30 minutes
- Testing basic functionality: 10-15 minutes

Total: ~45-60 minutes
