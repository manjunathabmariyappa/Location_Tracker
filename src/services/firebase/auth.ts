import { createUserWithEmailAndPassword, signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './client';
export const signInAdmin = (email: string, password: string) => signInWithEmailAndPassword(auth, email.trim(), password);
export const createAdmin = (email: string, password: string) => createUserWithEmailAndPassword(auth, email.trim(), password);
export const continueAsMember = () => signInAnonymously(auth);
