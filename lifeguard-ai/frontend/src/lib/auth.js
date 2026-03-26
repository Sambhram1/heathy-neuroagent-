import { signInWithPopup } from "firebase/auth"
import { auth, provider } from "./firebase"

export async function signInWithGoogle() {
  return signInWithPopup(auth, provider)
}

export async function logOut() {
  return auth.signOut()
}
