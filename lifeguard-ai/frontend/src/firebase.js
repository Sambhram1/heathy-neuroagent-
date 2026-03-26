import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyDoosD8lbpoXDPHCzBB3kBeN4HmygrBCxU",
  authDomain: "lifeguard-ai-ac771.firebaseapp.com",
  projectId: "lifeguard-ai-ac771",
  storageBucket: "lifeguard-ai-ac771.firebasestorage.app",
  messagingSenderId: "1089372051247",
  appId: "1:1089372051247:web:230b7f72c4db2fd00633da",
  measurementId: "G-7KWWRY38Q2",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })
