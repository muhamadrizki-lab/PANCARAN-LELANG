import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  initializeFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { Asset, AdminUser, Bid } from './types';
import { INITIAL_ASSETS, INITIAL_ADMINS } from './data/mockData';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the standard client-side Firebase app
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Collection names
const ASSETS_COLLECTION = 'assets';
const ADMINS_COLLECTION = 'admins';

// Operation types for standard error handling matching the Firebase skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

/**
 * Handles errors and formats them into standard FirestoreErrorInfo JSON string.
 */
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Triggers the Google Apps Script Web App sync in the background.
 * Uses mode: 'no-cors' to bypass GAS Web App redirect CORS restrictions
 * while ensuring the script successfully runs on the server side.
 */
export async function triggerAppsScriptSync() {
  const appsScriptUrl = (import.meta as any).env.VITE_APPS_SCRIPT_URL;
  if (!appsScriptUrl) {
    console.log('VITE_APPS_SCRIPT_URL is not set. Real-time Google Spreadsheet sync will not be called.');
    return;
  }

  try {
    console.log('Triggering instant Google Spreadsheet sync...');
    await fetch(appsScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action: 'sync' }),
    });
    console.log('Google Spreadsheet sync triggered successfully.');
  } catch (error) {
    console.warn('Failed to trigger Google Spreadsheet sync:', error);
  }
}

/**
 * Seeds initial data into Firestore if collections are empty.
 */
export async function seedDatabaseIfEmpty() {
  try {
    // Delete any existing default template assets (PL-2026-001 to PL-2026-004)
    // so that the website only shows custom uploaded/created ones.
    const defaultTemplateIds = ['PL-2026-001', 'PL-2026-002', 'PL-2026-003', 'PL-2026-004'];
    for (const templateId of defaultTemplateIds) {
      try {
        const docRef = doc(db, ASSETS_COLLECTION, templateId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          console.log(`Deleting default template asset ${templateId}...`);
          await deleteDoc(docRef);
          console.log(`${templateId} deleted successfully.`);
        }
      } catch (err) {
        console.warn(`Failed to check/delete template asset ${templateId}:`, err);
      }
    }

    const adminsSnapshot = await getDocs(collection(db, ADMINS_COLLECTION));
    if (adminsSnapshot.empty) {
      console.log('Seeding initial admins to Firestore...');
      for (const adminUser of INITIAL_ADMINS) {
        await setDoc(doc(db, ADMINS_COLLECTION, adminUser.email), adminUser);
      }
      console.log('Admins successfully seeded.');
    }
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}

/**
 * Fetch all assets from Firestore.
 */
export async function fetchAssets(): Promise<Asset[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ASSETS_COLLECTION));
    const assets: Asset[] = [];
    querySnapshot.forEach((docSnap) => {
      assets.push({ id: docSnap.id, ...docSnap.data() } as Asset);
    });
    return assets;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ASSETS_COLLECTION);
    return [];
  }
}

/**
 * Fetch all admin users from Firestore.
 */
export async function fetchAdmins(): Promise<AdminUser[]> {
  try {
    const querySnapshot = await getDocs(collection(db, ADMINS_COLLECTION));
    const admins: AdminUser[] = [];
    querySnapshot.forEach((docSnap) => {
      admins.push(docSnap.data() as AdminUser);
    });
    return admins;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, ADMINS_COLLECTION);
    return [];
  }
}

/**
 * Add a new asset to Firestore.
 */
export async function addAssetToDb(asset: Omit<Asset, 'id'> & { id?: string }): Promise<string> {
  const finalId = asset.id || `PL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const path = `${ASSETS_COLLECTION}/${finalId}`;
  try {
    const assetWithId = {
      ...asset,
      id: finalId,
      bids: asset.bids || []
    };
    await setDoc(doc(db, ASSETS_COLLECTION, finalId), assetWithId);
    triggerAppsScriptSync(); // Trigger background spreadsheet sync
    return finalId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return '';
  }
}

/**
 * Update an existing asset in Firestore.
 */
export async function updateAssetInDb(id: string, updates: Partial<Asset>): Promise<void> {
  const path = `${ASSETS_COLLECTION}/${id}`;
  try {
    await updateDoc(doc(db, ASSETS_COLLECTION, id), updates);
    triggerAppsScriptSync(); // Trigger background spreadsheet sync
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete an asset from Firestore.
 */
export async function deleteAssetFromDb(id: string): Promise<void> {
  const path = `${ASSETS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, ASSETS_COLLECTION, id));
    triggerAppsScriptSync(); // Trigger background spreadsheet sync
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Add a bid to an asset in Firestore.
 */
export async function addBidToAsset(assetId: string, bid: Bid): Promise<void> {
  const path = `${ASSETS_COLLECTION}/${assetId}`;
  try {
    const assetRef = doc(db, ASSETS_COLLECTION, assetId);
    const assetSnap = await getDoc(assetRef);
    if (!assetSnap.exists()) {
      throw new Error(`Asset with ID ${assetId} does not exist`);
    }
    const currentAsset = assetSnap.data() as Asset;
    const updatedBids = [...(currentAsset.bids || []), bid];
    const highestBid = Math.max(...updatedBids.map(b => b.price), currentAsset.startingPrice);

    await updateDoc(assetRef, {
      bids: updatedBids,
      highestBid: highestBid
    });
    triggerAppsScriptSync(); // Trigger background spreadsheet sync
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Add a new admin user to Firestore.
 */
export async function addAdminToDb(admin: AdminUser): Promise<void> {
  const path = `${ADMINS_COLLECTION}/${admin.email}`;
  try {
    await setDoc(doc(db, ADMINS_COLLECTION, admin.email), admin);
    triggerAppsScriptSync(); // Trigger background spreadsheet sync
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Delete an admin user from Firestore.
 */
export async function deleteAdminFromDb(email: string): Promise<void> {
  const path = `${ADMINS_COLLECTION}/${email}`;
  try {
    await deleteDoc(doc(db, ADMINS_COLLECTION, email));
    triggerAppsScriptSync(); // Trigger background spreadsheet sync
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to realtime updates for assets.
 */
export function subscribeToAssets(callback: (assets: Asset[]) => void) {
  return onSnapshot(
    collection(db, ASSETS_COLLECTION),
    (snapshot) => {
      const assets: Asset[] = [];
      snapshot.forEach((docSnap) => {
        assets.push({ id: docSnap.id, ...docSnap.data() } as Asset);
      });
      callback(assets);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, ASSETS_COLLECTION);
    }
  );
}

/**
 * Subscribe to realtime updates for admins.
 */
export function subscribeToAdmins(callback: (admins: AdminUser[]) => void) {
  return onSnapshot(
    collection(db, ADMINS_COLLECTION),
    (snapshot) => {
      const admins: AdminUser[] = [];
      snapshot.forEach((docSnap) => {
        admins.push(docSnap.data() as AdminUser);
      });
      callback(admins);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, ADMINS_COLLECTION);
    }
  );
}
