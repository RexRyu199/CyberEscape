import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export const CHARGE_PRICE = 50;  // precio de una carga de descifrado

async function readUser(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return { ref, data: snap.data() ?? {} };
}

export async function recordPurchase(uid, paymentIntentId, product) {
  const purchaseRef = doc(db, 'users', uid, 'purchases', paymentIntentId);
  if ((await getDoc(purchaseRef)).exists()) return;

  await setDoc(purchaseRef, {
    type: product.type,
    credits: product.credits ?? 0,
    chapter: product.chapter ?? null,
    amount: product.amount,
    currency: 'mxn',
    createdAt: serverTimestamp(),
  });

  const updates = {};
  if (product.type === 'credits') updates.credits = increment(product.credits);
  if (product.type === 'chapter') updates.unlockedChapters = arrayUnion(product.chapter);
  await updateDoc(doc(db, 'users', uid), updates);
}

export async function buyCharge(uid) {
  const { ref, data } = await readUser(uid);
  if ((data.credits ?? 0) < CHARGE_PRICE) throw new Error('NO_CREDITS');
  await updateDoc(ref, { credits: increment(-CHARGE_PRICE), decryptCharges: increment(1) });
}

export async function buyTheme(uid, themeId, price) {
  const { ref, data } = await readUser(uid);
  if ((data.credits ?? 0) < price) throw new Error('NO_CREDITS');
  await updateDoc(ref, { credits: increment(-price), unlockedThemes: arrayUnion(themeId) });
}

export async function selectTheme(uid, themeId) {
  await updateDoc(doc(db, 'users', uid), { selectedTheme: themeId });
}

export async function consumeCharge(uid) {
  const { ref, data } = await readUser(uid);
  if ((data.decryptCharges ?? 0) < 1) throw new Error('NO_CHARGES');
  await updateDoc(ref, { decryptCharges: increment(-1) });
}