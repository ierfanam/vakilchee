import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface AppUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  isAnonymous?: boolean;
}

export interface UserMemoryProfile {
  uid: string;
  email?: string;
  displayName?: string;
  createdAt?: Timestamp | Date | any;
  lastActiveAt?: Timestamp | Date | any;
  permanentMemoryDossier: string;
  preferredTone?: 'legal_strict' | 'friendly' | 'formal_academic' | string;
}

export interface StoredMemoryFact {
  id: string;
  key: string;
  content: string;
  source: string;
  createdAt: any;
}

export interface StoredSessionItem {
  id: string;
  title: string;
  summary: string;
  createdAt: any;
  turnsCount: number;
}

export interface StoredDocItem {
  id?: string;
  title: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  fileDataUrl?: string;
  extractedText: string;
  analysis: string;
  source?: 'camera_scan' | 'local_upload' | string;
  previewUrl?: string;
  createdAt: any;
}

export interface JudicialFormData {
  id?: string;
  userId?: string;
  formType:
    | 'dadkhast'
    | 'shekayat'
    | 'ezharnameh'
    | 'layehe'
    | 'shora'
    | 'divan'
    | 'tamin'
    | 'nameh_edari'
    | 'darkhast_edari'
    | 'etelaieh_hoghooghi'
    | 'qarardad_solh';
  title: string;
  authorityName: string;
  claimant: {
    name?: string;
    fatherName?: string;
    nationalId?: string;
    job?: string;
    address?: string;
    phone?: string;
  };
  respondent: {
    name?: string;
    fatherName?: string;
    nationalId?: string;
    job?: string;
    address?: string;
    phone?: string;
  };
  attorney?: {
    name?: string;
    licenseNumber?: string;
  };
  subject: string;
  evidences: string[];
  legalBasis?: string;
  bodyText: string;
  trackingCode?: string;
  branchNumber?: string;
  filingDate?: string;
  createdAt?: any;
}

/* ================= Local Storage Fallback Store ================= */

function getLocalKey(prefix: string, userId: string): string {
  return `ai_lawyer_${prefix}_${userId}`;
}

export function getLocalDossierData(userId: string) {
  try {
    const profileJson = localStorage.getItem(getLocalKey('profile', userId));
    const memoriesJson = localStorage.getItem(getLocalKey('memories', userId));
    const sessionsJson = localStorage.getItem(getLocalKey('sessions', userId));
    const docsJson = localStorage.getItem(getLocalKey('docs', userId));
    const formsJson = localStorage.getItem(getLocalKey('forms', userId));

    const profile: UserMemoryProfile | null = profileJson ? JSON.parse(profileJson) : null;
    const memories: StoredMemoryFact[] = memoriesJson ? JSON.parse(memoriesJson) : [];
    const sessions: StoredSessionItem[] = sessionsJson ? JSON.parse(sessionsJson) : [];
    const docs: StoredDocItem[] = docsJson ? JSON.parse(docsJson) : [];
    const judicialForms: JudicialFormData[] = formsJson ? JSON.parse(formsJson) : [];

    return {
      displayName: profile?.displayName || '',
      permanentDossier: profile?.permanentMemoryDossier || '',
      preferredTone: profile?.preferredTone || 'legal_strict',
      memories,
      sessions,
      docs,
      judicialForms,
    };
  } catch (err) {
    console.warn('Error reading local dossier data:', err);
    return {
      displayName: '',
      permanentDossier: '',
      preferredTone: 'legal_strict',
      memories: [],
      sessions: [],
      docs: [],
      judicialForms: [],
    };
  }
}

function saveLocalProfile(userId: string, profile: Partial<UserMemoryProfile>) {
  try {
    const key = getLocalKey('profile', userId);
    const existing = localStorage.getItem(key);
    const curr = existing ? JSON.parse(existing) : {};
    const updated = { ...curr, ...profile, uid: userId, lastActiveAt: new Date().toISOString() };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (e) {
    console.warn('Local storage write warning:', e);
  }
}

function getOrCreateLocalUid(): string {
  let uid = localStorage.getItem('ai_lawyer_local_uid');
  if (!uid) {
    uid = 'client_' + Math.random().toString(36).substring(2, 12);
    localStorage.setItem('ai_lawyer_local_uid', uid);
  }
  return uid;
}

/**
 * Initializes Authentication (anonymous by default with seamless local fallback)
 */
export async function initializeUserAuth(): Promise<AppUser> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        unsubscribe();
        try {
          await ensureUserProfile(user);
        } catch (e) {
          console.warn('Could not sync user profile to remote Firestore:', e);
        }
        resolve(user as AppUser);
      } else {
        try {
          const cred = await signInAnonymously(auth);
          unsubscribe();
          await ensureUserProfile(cred.user);
          resolve(cred.user as AppUser);
        } catch (err: any) {
          // If anonymous authentication is restricted on the Firebase console
          // (auth/admin-restricted-operation or auth/operation-not-allowed),
          // fallback to client-side persistent storage seamlessly!
          unsubscribe();
          const localUid = getOrCreateLocalUid();
          const localUser: AppUser = {
            uid: localUid,
            displayName: 'کاربر گرامی',
            isAnonymous: true,
            email: null,
          };
          saveLocalProfile(localUid, {
            displayName: localUser.displayName || '',
            permanentMemoryDossier: 'پرونده الکترونیک و پیشینه محرمانه آماده ثبت موضوعات است.',
          });
          resolve(localUser);
        }
      }
    });
  });
}

/**
 * Sign in with Google to sync memories across any browser/device
 */
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    if (result.user) {
      await ensureUserProfile(result.user);
      return result.user;
    }
    return null;
  } catch (err) {
    console.error('Google sign-in error:', err);
    throw err;
  }
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

/**
 * Ensures user profile and permanent memory dossier document exists in Firestore / LocalStorage
 */
export async function ensureUserProfile(user: FirebaseUser | AppUser): Promise<UserMemoryProfile> {
  // Always update local cache
  saveLocalProfile(user.uid, {
    email: user.email || '',
    displayName: user.displayName || 'کاربر گرامی',
  });

  if (!auth.currentUser) {
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'کاربر گرامی',
      permanentMemoryDossier: 'سوابق و پیشینه موضوعات فعال است.',
    };
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const data = snap.data() as UserMemoryProfile;
      await setDoc(
        userRef,
        {
          lastActiveAt: serverTimestamp(),
          email: user.email || data.email || '',
          displayName: user.displayName || data.displayName || 'کاربر گرامی',
        },
        { merge: true }
      );
      saveLocalProfile(user.uid, data);
      return { ...data, uid: user.uid };
    } else {
      const initialProfile: UserMemoryProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'کاربر گرامی',
        permanentMemoryDossier: 'سوابق اولیه آماده ثبت است.',
      };
      await setDoc(userRef, {
        ...initialProfile,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
      });
      saveLocalProfile(user.uid, initialProfile);
      return initialProfile;
    }
  } catch (err) {
    console.warn('Could not ensure remote user profile; using local storage:', err);
    return {
      uid: user.uid,
      email: user.email || '',
      displayName: user.displayName || 'کاربر گرامی',
      permanentMemoryDossier: 'سوابق و پیشینه موضوعات فعال است.',
    };
  }
}

/**
 * Retrieves the comprehensive permanent memory dossier & recent conversation context for the AI model
 */
export async function loadUserMemoryContext(userId: string): Promise<string> {
  const localData = getLocalDossierData(userId);
  let dossier = localData.permanentDossier;
  let memoriesList = localData.memories.map((m) => `• [${m.key || 'نکته'}]: ${m.content}`);
  let sessionsList = localData.sessions.map(
    (s) => `• جلسه: ${s.title || 'مشاوره'} | خلاصه: ${s.summary || 'ثبت شده'}`
  );
  let docsList = localData.docs.map(
    (d) => `• سند: ${d.title} | نکات کلیدی: ${d.analysis || d.extractedText}`
  );
  let userDisplayName = localData.displayName || '';

  // Try fetching fresh data from Firestore if user is authenticated
  if (auth.currentUser) {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const userData = snap.data() as UserMemoryProfile;
        if (userData.displayName) {
          userDisplayName = userData.displayName;
        }
        if (userData.permanentMemoryDossier) {
          dossier = userData.permanentMemoryDossier;
        }
      }

      const memoriesRef = collection(db, 'users', userId, 'memories');
      const qMemories = query(memoriesRef, orderBy('createdAt', 'desc'), limit(15));
      const memoriesSnap = await getDocs(qMemories);
      if (!memoriesSnap.empty) {
        memoriesList = [];
        memoriesSnap.forEach((d) => {
          const data = d.data();
          memoriesList.push(`• [${data.key || 'نکته'}]: ${data.content}`);
        });
      }

      const sessionsRef = collection(db, 'users', userId, 'sessions');
      const qSessions = query(sessionsRef, orderBy('createdAt', 'desc'), limit(5));
      const sessionsSnap = await getDocs(qSessions);
      if (!sessionsSnap.empty) {
        sessionsList = [];
        sessionsSnap.forEach((d) => {
          const data = d.data();
          sessionsList.push(
            `• جلسه: ${data.title || 'مشاوره'} | خلاصه: ${data.summary || 'ثبت شده'}`
          );
        });
      }

      const docsRef = collection(db, 'users', userId, 'documents');
      const qDocs = query(docsRef, orderBy('createdAt', 'desc'), limit(5));
      const docsSnap = await getDocs(qDocs);
      if (!docsSnap.empty) {
        docsList = [];
        docsSnap.forEach((d) => {
          const data = d.data();
          docsList.push(
            `• سند: ${data.title} | نکات کلیدی: ${data.analysis || data.extractedText}`
          );
        });
      }
    } catch {
      // Quietly continue with local data
    }
  }

  let context = `\n=== اطلاعات و پیشینه کاملاً محرمانه در حافظه پنهان (Confidential Background Memory) ===\n`;
  if (userDisplayName && userDisplayName !== 'کاربر گرامی') {
    context += `نام مخاطب محترم: ${userDisplayName}\n`;
    context += `دستور اختصاصی نام: در گفتگوها ایشان را با نهایت احترام با همین نام شریف (مانند: جناب آقای ${userDisplayName} یا سرکار خانم ${userDisplayName}) خطاب کنید، بدون آنکه ابداً اشاره کنید نام ایشان در حافظه یا سوابق ثبت بوده است.\n\n`;
  }
  context += `پیشینه موضوعات:\n${dossier || 'پیشینه فعال است.'}\n\n`;

  if (memoriesList.length > 0) {
    context += `نکات ثبت‌شده پیشین:\n${memoriesList.join('\n')}\n\n`;
  }

  if (sessionsList.length > 0) {
    context += `خلاصه تعاملات پیشین:\n${sessionsList.join('\n')}\n\n`;
  }

  if (docsList.length > 0) {
    context += `اسناد بررسی‌شده پیشین:\n${docsList.join('\n')}\n\n`;
  }

  context += `دستور اکید محرمانگی: این اطلاعات صرفاً در حافظه پنهان و پس‌زمینه ذهنی شماست. هرگز نباید به صورت کلامی مطرح یا بیان کنید که سوابق، پرونده‌ها یا گفتگوهای قبلی را به خاطر دارید، چرا که این ویژگی یک توانایی پنهان پس‌زمینه است و نباید به زبان آورده شود.\n=== پایان حافظه پنهان ===\n`;

  return context;
}

/**
 * Saves and updates the user's recognized name permanently
 */
export async function saveUserName(userId: string, name: string): Promise<void> {
  const cleanName = name.trim();
  if (!cleanName) return;

  saveLocalProfile(userId, { displayName: cleanName });
  saveUserMemoryFact(userId, 'نام مخاطب', cleanName, 'user_introduction');

  if (auth.currentUser) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(
        userRef,
        {
          displayName: cleanName,
          lastActiveAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Ignored
    }
  }
}

/**
 * Saves a new memory fact into Firestore and LocalStorage
 */
export async function saveUserMemoryFact(
  userId: string,
  key: string,
  content: string,
  source = 'conversation'
): Promise<void> {
  // 1. Update LocalStorage
  try {
    const lKey = getLocalKey('memories', userId);
    const existing = localStorage.getItem(lKey);
    const list: StoredMemoryFact[] = existing ? JSON.parse(existing) : [];
    list.unshift({
      id: 'mem_' + Date.now(),
      key,
      content,
      source,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(lKey, JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.warn(e);
  }

  // 2. Sync to Firestore if authenticated
  if (auth.currentUser) {
    try {
      const memoriesRef = collection(db, 'users', userId, 'memories');
      await addDoc(memoriesRef, {
        userId,
        key,
        content,
        source,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      // Ignored
    }
  }
}

/**
 * Saves or updates a session log in Firestore and LocalStorage
 */
export async function saveSessionLog(
  userId: string,
  sessionId: string,
  title: string,
  summary: string,
  turnsCount: number
): Promise<void> {
  // 1. Update LocalStorage
  try {
    const lKey = getLocalKey('sessions', userId);
    const existing = localStorage.getItem(lKey);
    const list: StoredSessionItem[] = existing ? JSON.parse(existing) : [];
    const index = list.findIndex((s) => s.id === sessionId);
    const item: StoredSessionItem = {
      id: sessionId,
      title,
      summary,
      turnsCount,
      createdAt: new Date().toISOString(),
    };
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    localStorage.setItem(lKey, JSON.stringify(list.slice(0, 30)));
  } catch (e) {
    console.warn(e);
  }

  // 2. Sync to Firestore if authenticated
  if (auth.currentUser) {
    try {
      const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);
      await setDoc(
        sessionRef,
        {
          userId,
          sessionId,
          title,
          summary,
          turnsCount,
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Ignored
    }
  }
}

/**
 * Records a scanned document analysis into permanent storage
 */
export async function saveDocumentRecord(
  userId: string,
  title: string,
  extractedText: string,
  analysis: string
): Promise<void> {
  // 1. Update LocalStorage
  try {
    const lKey = getLocalKey('docs', userId);
    const existing = localStorage.getItem(lKey);
    const list: StoredDocItem[] = existing ? JSON.parse(existing) : [];
    list.unshift({
      id: 'doc_' + Date.now(),
      title,
      extractedText,
      analysis,
      source: 'camera_scan',
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(lKey, JSON.stringify(list.slice(0, 30)));
  } catch (e) {
    console.warn(e);
  }

  // 2. Sync to Firestore if authenticated
  if (auth.currentUser) {
    try {
      const docsRef = collection(db, 'users', userId, 'documents');
      await addDoc(docsRef, {
        userId,
        title,
        extractedText,
        analysis,
        source: 'camera_scan',
        createdAt: serverTimestamp(),
      });
    } catch {
      // Ignored
    }
  }
}

/**
 * Updates the user's permanent dossier summary
 */
export async function updatePermanentDossier(
  userId: string,
  newDossierSummary: string
): Promise<void> {
  saveLocalProfile(userId, { permanentMemoryDossier: newDossierSummary });

  if (auth.currentUser) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(
        userRef,
        {
          permanentMemoryDossier: newDossierSummary,
          lastActiveAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Ignored
    }
  }
}

/**
 * Saves a generated official Judicial Form into Firestore and LocalStorage
 */
export async function saveJudicialFormRecord(
  userId: string,
  formData: JudicialFormData
): Promise<string> {
  const formId =
    formData.id || 'form_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const updatedForm = { ...formData, id: formId, userId, createdAt: new Date().toISOString() };

  // 1. Update LocalStorage
  try {
    const lKey = getLocalKey('forms', userId);
    const existing = localStorage.getItem(lKey);
    const list: JudicialFormData[] = existing ? JSON.parse(existing) : [];
    const index = list.findIndex((f) => f.id === formId);
    if (index >= 0) {
      list[index] = updatedForm;
    } else {
      list.unshift(updatedForm);
    }
    localStorage.setItem(lKey, JSON.stringify(list.slice(0, 40)));
  } catch (e) {
    console.warn(e);
  }

  // 2. Sync to Firestore if authenticated
  if (auth.currentUser) {
    try {
      const formsRef = collection(db, 'users', userId, 'judicial_forms');
      const docRef = await addDoc(formsRef, {
        ...formData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch {
      // Ignored
    }
  }

  return formId;
}

/**
 * Saves the user's preferred tone and speaking accent
 */
export async function saveTonePreference(userId: string, tone: string): Promise<void> {
  saveLocalProfile(userId, { preferredTone: tone });

  if (auth.currentUser) {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(
        userRef,
        {
          preferredTone: tone,
          lastActiveAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Ignored
    }
  }
}

/**
 * Saves a local uploaded document into permanent storage
 */
export async function saveUploadedDocument(
  userId: string,
  docData: {
    title: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    fileDataUrl?: string;
    extractedText: string;
    analysis: string;
    source?: string;
  }
): Promise<string> {
  const docId = 'doc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const newDocItem: StoredDocItem = {
    id: docId,
    title: docData.title,
    fileName: docData.fileName,
    fileType: docData.fileType,
    fileSize: docData.fileSize,
    fileDataUrl: docData.fileDataUrl || '',
    extractedText: docData.extractedText,
    analysis: docData.analysis,
    source: docData.source || 'local_upload',
    createdAt: new Date().toISOString(),
  };

  // 1. Update LocalStorage
  try {
    const lKey = getLocalKey('docs', userId);
    const existing = localStorage.getItem(lKey);
    const list: StoredDocItem[] = existing ? JSON.parse(existing) : [];
    list.unshift(newDocItem);
    localStorage.setItem(lKey, JSON.stringify(list.slice(0, 30)));
  } catch (e) {
    console.warn(e);
  }

  // 2. Sync to Firestore if authenticated
  if (auth.currentUser) {
    try {
      const docsRef = collection(db, 'users', userId, 'documents');
      const docRef = await addDoc(docsRef, {
        userId,
        title: docData.title,
        fileName: docData.fileName,
        fileType: docData.fileType,
        fileSize: docData.fileSize,
        fileDataUrl: docData.fileDataUrl || '',
        extractedText: docData.extractedText,
        analysis: docData.analysis,
        source: docData.source || 'local_upload',
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch {
      // Ignored
    }
  }

  return docId;
}

/**
 * Deletes a document from user's permanent dossier
 */
export async function deleteDocumentRecord(userId: string, docId: string): Promise<void> {
  // 1. Update LocalStorage
  try {
    const lKey = getLocalKey('docs', userId);
    const existing = localStorage.getItem(lKey);
    if (existing) {
      const list: StoredDocItem[] = JSON.parse(existing);
      const filtered = list.filter((d) => d.id !== docId);
      localStorage.setItem(lKey, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn(e);
  }

  // 2. Sync to Firestore if authenticated
  if (auth.currentUser) {
    try {
      const docRef = doc(db, 'users', userId, 'documents', docId);
      await deleteDoc(docRef);
    } catch {
      // Ignored
    }
  }
}

/**
 * Deletes a judicial form from user's permanent dossier
 */
export async function deleteJudicialFormRecord(userId: string, formId: string): Promise<void> {
  // 1. Update LocalStorage
  try {
    const lKey = getLocalKey('forms', userId);
    const existing = localStorage.getItem(lKey);
    if (existing) {
      const list: JudicialFormData[] = JSON.parse(existing);
      const filtered = list.filter((f) => f.id !== formId);
      localStorage.setItem(lKey, JSON.stringify(filtered));
    }
  } catch (e) {
    console.warn(e);
  }

  // 2. Sync to Firestore if authenticated
  if (auth.currentUser) {
    try {
      const formRef = doc(db, 'users', userId, 'judicial_forms', formId);
      await deleteDoc(formRef);
    } catch {
      // Ignored
    }
  }
}
