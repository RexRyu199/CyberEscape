import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

export const FIRST_REWARD = 50;   // créditos la primera vez que completas una misión
export const REPLAY_REWARD = 10;  // créditos al repetirla

// Guarda el intento y da créditos. Si se resolvió con una carga de descifrado,
// no da créditos y no entra al ranking. Devuelve { reward, firstTime }.
export async function saveCompletion(uid, codename, missionId, timeSeconds, usedCharge = false) {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const already = (userSnap.data()?.progress?.completedMissions ?? []).includes(missionId);

  await addDoc(collection(db, 'users', uid, 'attempts'), {
    missionId,
    timeSeconds,
    usedCharge,
    completedAt: serverTimestamp(),
  });

  const reward = usedCharge ? 0 : already ? REPLAY_REWARD : FIRST_REWARD;
  const updates = { 'progress.completedMissions': arrayUnion(missionId) };
  if (reward > 0) updates.credits = increment(reward);
  await updateDoc(userRef, updates);

  if (!usedCharge) {
    const scoreRef = doc(db, 'leaderboard', missionId, 'scores', uid);
    const prev = await getDoc(scoreRef);
    if (!prev.exists() || timeSeconds < prev.data().timeSeconds) {
      await setDoc(scoreRef, { codename, timeSeconds });
    }
  }

  return { reward, firstTime: !already };
}

// Top 20 de una misión
export async function getLeaderboard(missionId) {
  const q = query(
    collection(db, 'leaderboard', missionId, 'scores'),
    orderBy('timeSeconds', 'asc'),
    limit(20)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
}