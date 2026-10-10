import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, createPlayerProfile } from './firebase';

// Cuenta nueva con correo
export async function registerWithEmail(codename, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await createPlayerProfile(cred.user.uid, codename);
  return cred.user;
}

// Volver a entrar a una cuenta existente
export async function loginWithEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

// Convierte al invitado actual en cuenta con correo, conservando todo su progreso
export async function linkAnonymousAccount(email, password) {
  const credential = EmailAuthProvider.credential(email, password);
  const result = await linkWithCredential(auth.currentUser, credential);
  return result.user;
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export function authErrorMessage(e) {
  switch (e?.code) {
    case 'auth/invalid-email':
      return 'El correo no es válido.';
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
      return 'Ese correo ya tiene una cuenta. Inicia sesión con él.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera unos minutos.';
    case 'auth/network-request-failed':
      return 'Sin conexión. Revisa tu internet.';
    case 'auth/operation-not-allowed':
      return 'El acceso con correo no está habilitado en Firebase.';
    default:
      return 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
}