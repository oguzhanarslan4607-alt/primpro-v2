import type { SavedCalculation } from "../types";
import type { FirebaseApp } from "firebase/app";
import type { Auth, User } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean);
export const firebaseProjectId = firebaseConfig.projectId || "";

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let firebaseLoader: Promise<{
  auth: typeof import("firebase/auth");
  firestore: typeof import("firebase/firestore");
}> | null = null;

async function loadFirebase() {
  if (!firebaseConfigured) throw new Error("Firebase yapılandırılmadı.");

  firebaseLoader ??= Promise.all([import("firebase/app"), import("firebase/auth"), import("firebase/firestore")]).then(
    ([appModule, authModule, firestoreModule]) => {
      app ??= appModule.initializeApp(firebaseConfig);
      auth ??= authModule.getAuth(app);
      db ??= firestoreModule.getFirestore(app);

      return {
        auth: authModule,
        firestore: firestoreModule,
      };
    },
  );

  const modules = await firebaseLoader;

  if (!auth || !db) throw new Error("Firebase başlatılamadı.");

  return {
    auth,
    db,
    modules,
  };
}

export function watchFirebaseUser(callback: (user: User | null) => void) {
  if (!firebaseConfigured) return () => undefined;

  let active = true;
  let unsubscribe: () => void = () => undefined;

  loadFirebase()
    .then(({ auth: firebaseAuth, modules }) => {
      if (!active) return;
      unsubscribe = modules.auth.onAuthStateChanged(firebaseAuth, callback);
    })
    .catch(() => callback(null));

  return () => {
    active = false;
    unsubscribe();
  };
}

export async function loginWithFirebase(email: string, password: string) {
  const { auth: firebaseAuth, modules } = await loadFirebase();
  return modules.auth.signInWithEmailAndPassword(firebaseAuth, email, password);
}

export async function logoutFirebase() {
  if (!firebaseConfigured) return;

  const { auth: firebaseAuth, modules } = await loadFirebase();
  await modules.auth.signOut(firebaseAuth);
}

export async function loadRemoteHistory(userId: string) {
  if (!firebaseConfigured) return [];

  const { db: firestoreDb, modules } = await loadFirebase();
  const snapshot = await modules.firestore.getDocs(
    modules.firestore.query(
      modules.firestore.collection(firestoreDb, "calculations"),
      modules.firestore.where("userId", "==", userId),
    ),
  );
  return snapshot.docs
    .map((item) => item.data().calculation as SavedCalculation)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function saveRemoteCalculation(userId: string, calculation: SavedCalculation) {
  if (!firebaseConfigured) return;

  const { db: firestoreDb, modules } = await loadFirebase();
  await modules.firestore.setDoc(modules.firestore.doc(firestoreDb, "calculations", calculation.id), {
    userId,
    calculation,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteRemoteCalculation(id: string) {
  if (!firebaseConfigured) return;

  const { db: firestoreDb, modules } = await loadFirebase();
  await modules.firestore.deleteDoc(modules.firestore.doc(firestoreDb, "calculations", id));
}

export async function clearRemoteHistory(userId: string) {
  if (!firebaseConfigured) return;

  const { db: firestoreDb, modules } = await loadFirebase();
  const snapshot = await modules.firestore.getDocs(
    modules.firestore.query(
      modules.firestore.collection(firestoreDb, "calculations"),
      modules.firestore.where("userId", "==", userId),
    ),
  );
  await Promise.all(snapshot.docs.map((item) => modules.firestore.deleteDoc(item.ref)));
}
