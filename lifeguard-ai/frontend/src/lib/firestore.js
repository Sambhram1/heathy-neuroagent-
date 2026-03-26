import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "./firebase"

// Save a single chat message
export async function saveMessage(userId, message) {
  const ref = collection(db, "users", userId, "messages")
  await addDoc(ref, {
    role: message.role,
    content: message.content,
    timestamp: serverTimestamp(),
  })
}

// Get all chat messages ordered by timestamp
export async function getMessages(userId) {
  const ref = collection(db, "users", userId, "messages")
  const q = query(ref, orderBy("timestamp", "asc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Save risk scores to a "latest" document
export async function saveRiskScores(userId, scores) {
  const ref = doc(db, "users", userId, "riskScores", "latest")
  await setDoc(ref, { scores, updatedAt: serverTimestamp() })
}

// Get latest risk scores, or null
export async function getRiskScores(userId) {
  const ref = doc(db, "users", userId, "riskScores", "latest")
  const snap = await getDoc(ref)
  if (snap.exists()) return snap.data().scores
  return null
}

// Clear all messages for the user
export async function clearSession(userId) {
  const ref = collection(db, "users", userId, "messages")
  const snapshot = await getDocs(ref)
  const deletions = snapshot.docs.map((d) => deleteDoc(d.ref))
  await Promise.all(deletions)
}
