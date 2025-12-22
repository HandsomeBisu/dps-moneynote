import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged,
  User
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  addDoc,
  deleteDoc,
  updateDoc,
  doc, 
  onSnapshot, 
  query, 
  where,
  Timestamp,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { Transaction } from '../types';

// Using the configuration provided by the user
const firebaseConfig = {
  apiKey: "AIzaSyASrwA29PPIVJnRZc0A7ZVcnVyCzO21RdU",
  authDomain: "dps-moneynote.firebaseapp.com",
  projectId: "dps-moneynote",
  storageBucket: "dps-moneynote.firebasestorage.app",
  messagingSenderId: "513485536878",
  appId: "1:513485536878:web:5c19c46ec09b52fdf7707f",
  measurementId: "G-7S7QKP8DL9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);

const COLLECTION_NAME = 'transactions';

// --- Authentication Functions ---

export const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Logout failed", error);
  }
};

// --- Database Functions ---

export const addTransaction = async (
  userId: string,
  amount: number, 
  description: string, 
  type: 'income' | 'expense'
) => {
  try {
    if (!userId) throw new Error("User ID is required");
    
    await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      amount,
      description,
      type,
      date: serverTimestamp(),
      category: type === 'income' ? 'Salary' : 'General'
    });
  } catch (e) {
    console.error("Error adding document: ", e);
    throw e;
  }
};

export const updateTransaction = async (
  transactionId: string,
  data: { amount: number; description: string; type: 'income' | 'expense' }
) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, transactionId);
    await updateDoc(docRef, {
      amount: data.amount,
      description: data.description,
      type: data.type
      // Note: We typically don't update the 'date' unless requested, 
      // keeping the original transaction time.
    });
  } catch (e) {
    console.error("Error updating document: ", e);
    throw e;
  }
};

export const deleteTransaction = async (transactionId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, transactionId));
  } catch (e) {
    console.error("Error deleting document: ", e);
    throw e;
  }
};

export const subscribeTransactions = (userId: string, callback: (data: Transaction[]) => void) => {
  if (!userId) return () => {};

  // Query: Get documents where userId matches.
  // Note: We are NOT using orderBy in the query to avoid needing a composite index immediately.
  // We will sort client-side.
  const q = query(
    collection(db, COLLECTION_NAME), 
    where("userId", "==", userId)
  );
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const transactions: Transaction[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const date = data.date instanceof Timestamp ? data.date.toDate() : new Date();
      
      transactions.push({
        id: doc.id,
        userId: data.userId,
        amount: Number(data.amount),
        description: data.description || 'No description',
        type: data.type as 'income' | 'expense',
        date: date,
        category: data.category
      });
    });

    // Client-side sort: Descending by date
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    callback(transactions);
  }, (error) => {
    console.error("Firestore Error:", error);
  });

  return unsubscribe;
};