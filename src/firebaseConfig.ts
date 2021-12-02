// Initialize Firebase Admin
import { initializeApp,applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
initializeApp({
  credential: applicationDefault(),
});
const db = getFirestore();
const auth = getAuth();
const storage = getStorage();
db.settings({ timestampsInSnapshots: true, ignoreUndefinedProperties: true });
export { db, auth, storage};
