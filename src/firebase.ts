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
import { Asset, AdminUser, Bid, Brand, Category, Condition, RegisteredUser } from './types';
import { INITIAL_ASSETS, INITIAL_ADMINS } from './data/mockData';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize the standard client-side Firebase app
const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
} as any, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Collection names
const ASSETS_COLLECTION = 'assets';
const ADMINS_COLLECTION = 'admins';
const BRANDS_COLLECTION = 'brands';
const CATEGORIES_COLLECTION = 'categories';
const CONDITIONS_COLLECTION = 'conditions';

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
 * Recursively cleans data to remove properties with 'undefined' values before writing to Firestore.
 */
function sanitizeData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeData(item)) as unknown as T;
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeData(value);
      }
    }
    return cleaned as unknown as T;
  }

  return obj;
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

    const brandsSnapshot = await getDocs(collection(db, BRANDS_COLLECTION));
    if (brandsSnapshot.empty) {
      console.log('Seeding initial brands to Firestore...');
      const defaultBrands = ['Hino', 'Isuzu', 'Fuso', 'Scania', 'Toyota', 'Caterpillar', 'Komatsu', 'Lainnya'];
      for (const brandName of defaultBrands) {
        const brandId = brandName.toLowerCase();
        await setDoc(doc(db, BRANDS_COLLECTION, brandId), {
          id: brandId,
          name: brandName,
          createdAt: new Date().toISOString()
        });
      }
      console.log('Brands successfully seeded.');
    }

    const categoriesSnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
    if (categoriesSnapshot.empty) {
      console.log('Seeding initial categories to Firestore...');
      const defaultCategories = ['Wingbox', 'Box Truck', 'Dump Truck', 'Trailer Head', 'Pickup', 'Forklift', 'Container', 'Lainnya'];
      for (const catName of defaultCategories) {
        const catId = catName.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, CATEGORIES_COLLECTION, catId), {
          id: catId,
          name: catName,
          createdAt: new Date().toISOString()
        });
      }
      console.log('Categories successfully seeded.');
    }

    const conditionsSnapshot = await getDocs(collection(db, CONDITIONS_COLLECTION));
    if (conditionsSnapshot.empty) {
      console.log('Seeding initial conditions to Firestore...');
      const defaultConditions = ['Sangat Baik', 'Baik', 'Cukup', 'Butuh Perbaikan'];
      for (const condName of defaultConditions) {
        const condId = condName.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, CONDITIONS_COLLECTION, condId), {
          id: condId,
          name: condName,
          createdAt: new Date().toISOString()
        });
      }
      console.log('Conditions successfully seeded.');
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
    await setDoc(doc(db, ASSETS_COLLECTION, finalId), sanitizeData(assetWithId));
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
    await updateDoc(doc(db, ASSETS_COLLECTION, id), sanitizeData(updates));
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
    const scheduledBids = updatedBids.filter(b => b.scheduleSurveyDate && b.scheduleSurveyTime);
    const highestBid = scheduledBids.length > 0
      ? Math.max(...scheduledBids.map(b => b.price), currentAsset.startingPrice)
      : currentAsset.startingPrice;

    await updateDoc(assetRef, sanitizeData({
      bids: updatedBids,
      highestBid: highestBid
    }));
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
    await setDoc(doc(db, ADMINS_COLLECTION, admin.email), sanitizeData(admin));
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

/**
 * Fetch all brands from Firestore.
 */
export async function fetchBrands(): Promise<Brand[]> {
  try {
    const querySnapshot = await getDocs(collection(db, BRANDS_COLLECTION));
    const brands: Brand[] = [];
    querySnapshot.forEach((docSnap) => {
      brands.push(docSnap.data() as Brand);
    });
    return brands.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BRANDS_COLLECTION);
    return [];
  }
}

/**
 * Add a new brand to Firestore.
 */
export async function addBrandToDb(brand: Brand): Promise<void> {
  const path = `${BRANDS_COLLECTION}/${brand.id}`;
  try {
    await setDoc(doc(db, BRANDS_COLLECTION, brand.id), sanitizeData(brand));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Delete a brand from Firestore.
 */
export async function deleteBrandFromDb(id: string): Promise<void> {
  const path = `${BRANDS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, BRANDS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to realtime updates for brands.
 */
export function subscribeToBrands(callback: (brands: Brand[]) => void) {
  return onSnapshot(
    collection(db, BRANDS_COLLECTION),
    (snapshot) => {
      const brands: Brand[] = [];
      snapshot.forEach((docSnap) => {
        brands.push(docSnap.data() as Brand);
      });
      callback(brands.sort((a, b) => a.name.localeCompare(b.name)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, BRANDS_COLLECTION);
    }
  );
}

/**
 * Add a new category to Firestore.
 */
export async function addCategoryToDb(category: Category): Promise<void> {
  const path = `${CATEGORIES_COLLECTION}/${category.id}`;
  try {
    await setDoc(doc(db, CATEGORIES_COLLECTION, category.id), sanitizeData(category));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Delete a category from Firestore.
 */
export async function deleteCategoryFromDb(id: string): Promise<void> {
  const path = `${CATEGORIES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to realtime updates for categories.
 */
export function subscribeToCategories(callback: (categories: Category[]) => void) {
  return onSnapshot(
    collection(db, CATEGORIES_COLLECTION),
    (snapshot) => {
      const categories: Category[] = [];
      snapshot.forEach((docSnap) => {
        categories.push(docSnap.data() as Category);
      });
      callback(categories.sort((a, b) => a.name.localeCompare(b.name)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, CATEGORIES_COLLECTION);
    }
  );
}

/**
 * Add a new physical condition to Firestore.
 */
export async function addConditionToDb(condition: Condition): Promise<void> {
  const path = `${CONDITIONS_COLLECTION}/${condition.id}`;
  try {
    await setDoc(doc(db, CONDITIONS_COLLECTION, condition.id), sanitizeData(condition));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Delete a physical condition from Firestore.
 */
export async function deleteConditionFromDb(id: string): Promise<void> {
  const path = `${CONDITIONS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, CONDITIONS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to realtime updates for physical conditions.
 */
export function subscribeToConditions(callback: (conditions: Condition[]) => void) {
  return onSnapshot(
    collection(db, CONDITIONS_COLLECTION),
    (snapshot) => {
      const conditions: Condition[] = [];
      snapshot.forEach((docSnap) => {
        conditions.push(docSnap.data() as Condition);
      });
      callback(conditions.sort((a, b) => a.name.localeCompare(b.name)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, CONDITIONS_COLLECTION);
    }
  );
}

const REGISTERED_USERS_COLLECTION = 'registered_users';

/**
 * Add a new registered external user to Firestore.
 */
export async function addRegisteredUser(user: RegisteredUser): Promise<void> {
  const path = `${REGISTERED_USERS_COLLECTION}/${user.email.toLowerCase()}`;
  try {
    await setDoc(doc(db, REGISTERED_USERS_COLLECTION, user.email.toLowerCase()), sanitizeData(user));
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update a registered user's status or details.
 */
export async function updateRegisteredUser(email: string, updates: Partial<RegisteredUser>): Promise<void> {
  const path = `${REGISTERED_USERS_COLLECTION}/${email.toLowerCase()}`;
  try {
    await updateDoc(doc(db, REGISTERED_USERS_COLLECTION, email.toLowerCase()), sanitizeData(updates));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a registered user.
 */
export async function deleteRegisteredUser(email: string): Promise<void> {
  const path = `${REGISTERED_USERS_COLLECTION}/${email.toLowerCase()}`;
  try {
    await deleteDoc(doc(db, REGISTERED_USERS_COLLECTION, email.toLowerCase()));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Subscribe to realtime updates for registered users.
 */
export function subscribeToRegisteredUsers(callback: (users: RegisteredUser[]) => void) {
  return onSnapshot(
    collection(db, REGISTERED_USERS_COLLECTION),
    (snapshot) => {
      const users: RegisteredUser[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as RegisteredUser);
      });
      callback(users.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, REGISTERED_USERS_COLLECTION);
    }
  );
}

const CONFIG_COLLECTION = 'config';
const SYSTEM_SETTINGS_DOC = 'settings';

export interface SystemSettings {
  appsScriptUrl?: string;
}

/**
 * Fetch system settings from Firestore.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const docSnap = await getDoc(doc(db, CONFIG_COLLECTION, SYSTEM_SETTINGS_DOC));
    if (docSnap.exists()) {
      return docSnap.data() as SystemSettings;
    }
  } catch (error) {
    console.warn('Failed to fetch system settings from Firestore:', error);
  }
  return {};
}

/**
 * Save system settings to Firestore.
 */
export async function saveSystemSettings(settings: SystemSettings): Promise<void> {
  const path = `${CONFIG_COLLECTION}/${SYSTEM_SETTINGS_DOC}`;
  try {
    await setDoc(doc(db, CONFIG_COLLECTION, SYSTEM_SETTINGS_DOC), sanitizeData(settings));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Sends a real OTP verification email via Google Apps Script Web App.
 */
export async function sendOtpEmailViaAppsScript(
  email: string,
  code: string,
  name: string,
  customAppsScriptUrl?: string
): Promise<boolean> {
  const appsScriptUrl = customAppsScriptUrl || (import.meta as any).env.VITE_APPS_SCRIPT_URL;
  if (!appsScriptUrl) {
    console.log('No Apps Script Web App URL available. Skipping real email delivery.');
    return false;
  }

  try {
    console.log(`Sending OTP email via Apps Script for ${email}...`);
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'send_otp',
        email,
        code,
        name,
      }),
    });
    console.log('OTP email trigger fetch complete.');
    return true;
  } catch (error) {
    console.warn('Failed to send OTP email via Apps Script:', error);
    return false;
  }
}
