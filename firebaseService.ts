
import { db, auth, firebaseConfig, messaging } from './firebaseConfig';
export { db };
import { 
  Consignment, 
  User, 
  Importer, 
  CommodityGroup, 
  SystemSettings, 
  SamplingPlan, 
  ShiftNote, 
  AppDocument, 
  CertificateTemplate, 
  WeeklySchedule, 
  PasswordResetRequest, 
  ChatMessage, 
  TypingStatus,
  ConsignmentType,
  Laboratory,
  ClearanceOffice,
  Port,
  PesticideMapping,
  SectorShiftConfig,
  ShiftConfig,
  SecurityLogEntry
} from './types';
import firebase from 'firebase/compat/app';

// --- Error Handling ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: (auth.currentUser as any)?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const DEFAULT_PASSWORD = "20262026";
const DOMAIN = "@mirqab-sys.om";

// --- Backup & Data Recovery ---
export const exportFullSystemData = async () => {
    const collections = [
        'consignments', 'importers', 'users', 'commodityGroups', 
        'samplingPlans', 'laboratories', 'clearanceOffices', 
        'ports', 'settings', 'lookups', 'documents', 'pesticides'
    ];
    
    const backup: any = {
        version: "3.1.0",
        exportDate: new Date().toISOString(),
        data: {}
    };

    for (const col of collections) {
        const snap = await db.collection(col).get();
        backup.data[col] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return backup;
};

/**
 * New: Import function to restore data from JSON
 */
export const importFullSystemData = async (backupJson: any) => {
    if (!backupJson.data || typeof backupJson.data !== 'object') {
        throw new Error("ملف النسخة الاحتياطية غير صالح.");
    }

    const collections = Object.keys(backupJson.data);
    const batchLimit = 500; // Firestore batch limit

    for (const colName of collections) {
        const docs = backupJson.data[colName];
        if (!Array.isArray(docs)) continue;

        // Process in chunks to avoid Firestore batch limits
        for (let i = 0; i < docs.length; i += batchLimit) {
            const chunk = docs.slice(i, i + batchLimit);
            const batch = db.batch();

            chunk.forEach((docData: any) => {
                const { id, ...data } = docData;
                const docRef = db.collection(colName).doc(id);
                batch.set(docRef, data, { merge: true });
            });

            await batch.commit();
        }
    }
};

const emailFromCivilId = (civilId: string) => `${civilId.trim()}${DOMAIN}`;

export const loginUser = (civilId: string, password: string) => {
  return auth.signInWithEmailAndPassword(emailFromCivilId(civilId), password);
};

export const logoutUser = () => auth.signOut();

export const observeAuth = (callback: (user: firebase.User | null) => void) => {
  return auth.onAuthStateChanged(callback);
};

export const getUserById = async (uid: string): Promise<User | null> => {
  const doc = await db.collection('users').doc(uid).get();
  if (doc.exists) {
    return { id: doc.id, ...doc.data() } as User;
  }
  return null;
};

// --- Session Management ---
export const updateSessionActivity = async (userId: string, role: string, name: string) => {
    const sessionRef = db.collection('sessions').doc(userId);
    await sessionRef.set({
        userId,
        name,
        role,
        lastActive: new Date().toISOString(),
        userAgent: navigator.userAgent
    }, { merge: true });
};

export const getActiveSessions = async () => {
    // Get sessions active in the last 5 minutes
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
    const snap = await db.collection('sessions').where('lastActive', '>=', fiveMinsAgo).get();
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToActiveSessions = (callback: (sessions: any[]) => void) => {
    const fiveMinsAgo = new Date(Date.now() - 5 * 60000).toISOString();
    return db.collection('sessions')
        .where('lastActive', '>=', fiveMinsAgo)
        .onSnapshot(snap => {
            const sessions = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(sessions);
        }, error => {
            console.error("Error subscribing to active sessions:", error);
        });
};

export const terminateSession = async (userId: string) => {
    await db.collection('sessions').doc(userId).delete();
};

export const checkSystemHasUsers = async (): Promise<boolean> => {
  const snapshot = await db.collection('users').limit(1).get();
  return !snapshot.empty;
};

export const registerSystemUser = async (userData: User, password?: string) => {
  const userPassword = password || DEFAULT_PASSWORD;
  const civilId = userData.civilId || '';
  const email = emailFromCivilId(civilId);

  // Check if user exists in Firestore first by civilId
  const existingUserSnap = await db.collection('users').where('civilId', '==', civilId).get();
  
  if (!existingUserSnap.empty) {
      // User exists, update data instead of creating new auth account
      const existingDoc = existingUserSnap.docs[0];
      const existingUid = existingDoc.id;
      const updatedData: Partial<User> = { 
          ...userData, 
          id: existingUid, 
          email: email,
          isActive: userData.isActive !== undefined ? userData.isActive : true,
          needsPasswordReset: userData.needsPasswordReset !== undefined ? userData.needsPasswordReset : true
      };
      if (password) {
          updatedData.currentPassword = password;
      }
      await db.collection('users').doc(existingUid).update(updatedData);
      return true; // Return true to indicate an update was performed
  }

  let newUid = "";

  if (auth.currentUser) {
      const secondaryApp = firebase.initializeApp(firebaseConfig, 'SecondaryApp');
      try {
          await secondaryApp.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
          const userCredential = await secondaryApp.auth().createUserWithEmailAndPassword(email, userPassword);
          if (userCredential.user) {
              newUid = userCredential.user.uid;
              await userCredential.user.updateProfile({ displayName: userData.name });
              await secondaryApp.auth().signOut();
          }
      } catch (error: any) {
          await secondaryApp.delete();
          if (error.code === 'auth/email-already-in-use') throw new Error("هذا الرقم المدني مسجل مسبقاً.");
          throw new Error(error.message);
      }
      await secondaryApp.delete();
  } else {
      const userCredential = await auth.createUserWithEmailAndPassword(email, userPassword);
      if (userCredential.user) {
          newUid = userCredential.user.uid;
          await userCredential.user.updateProfile({ displayName: userData.name });
      }
  }

  if (newUid) {
      const finalUserData: User = { 
          ...userData, 
          id: newUid, 
          isActive: userData.isActive !== undefined ? userData.isActive : true, 
          email: email,
          needsPasswordReset: userData.needsPasswordReset !== undefined ? userData.needsPasswordReset : true,
          currentPassword: userPassword
      };
      await db.collection('users').doc(newUid).set(finalUserData);
  }
  return false; // Return false to indicate a new user was created
};

export const updateUserPresence = (uid: string, isOnline: boolean) => {
  return db.collection('users').doc(uid).update({ isOnline, lastSeen: new Date().toISOString() });
};

export const updateUserProfile = async (uid: string, data: Partial<User>) => {
    await db.collection('users').doc(uid).update(data);
    if(auth.currentUser && auth.currentUser.uid === uid && data.name) {
        await auth.currentUser.updateProfile({ displayName: data.name });
    }
};

export const changeUserPassword = async (uid: string, newPass: string) => {
    if (auth.currentUser && auth.currentUser.uid === uid) {
        await auth.currentUser.updatePassword(newPass);
        await db.collection('users').doc(uid).update({ 
            needsPasswordReset: false,
            lastPasswordChange: new Date().toISOString(),
            currentPassword: newPass
        });
    }
};

export const changePasswordWithAuth = async (civilId: string, currentPass: string, newPass: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("لم يتم العثور على جلسة نشطة للمستخدم");
    const email = emailFromCivilId(civilId);
    const credential = firebase.auth.EmailAuthProvider.credential(email, currentPass);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPass);
    await db.collection('users').doc(user.uid).update({ 
        needsPasswordReset: false,
        lastPasswordChange: new Date().toISOString(),
        currentPassword: newPass
    });
};

export const requestNotificationPermission = async (uid: string) => {
    if (!messaging) return null;
    try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            const token = await messaging.getToken();
            if (token) {
                await db.collection('users').doc(uid).update({ fcmToken: token });
                return token;
            }
        }
    } catch (error) { console.error(error); }
    return null;
};

export const requestPasswordReset = async (civilId: string, phone: string) => {
    const snapshot = await db.collection('users').where('civilId', '==', civilId).get();
    if (snapshot.empty) throw new Error("المستخدم غير موجود");
    const user = snapshot.docs[0].data() as User;
    await db.collection('passwordResetRequests').add({ userId: user.id, civilId, phone, userName: user.name, timestamp: new Date().toISOString(), status: 'PENDING' });
};

export const subscribeToPasswordRequests = (callback: (reqs: PasswordResetRequest[]) => void) => {
    return db.collection('passwordResetRequests').where('status', '==', 'PENDING').onSnapshot(snap => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as PasswordResetRequest));
            callback(items);
        });
};

export const adminResetPasswordToDefault = async (userId: string, requestId?: string) => {
    await db.collection('users').doc(userId).update({ 
        needsPasswordReset: true,
        currentPassword: DEFAULT_PASSWORD
    });
    if (requestId) await db.collection('passwordResetRequests').doc(requestId).update({ status: 'COMPLETED' });
};

export const updateUserInDB = (user: User) => db.collection('users').doc(user.id).update(user);
export const deleteUserFromDB = (id: string) => db.collection('users').doc(id).delete();

export const verifyDbConnection = async () => {
    try {
        // Use get() to test connection as per instructions (getFromServer equivalent in compat)
        await db.collection('settings').doc('ping').get();
        return true;
    } catch (e) { 
        if (e instanceof Error && e.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration. The client is offline.");
        }
        return false; 
    }
};

export const getCollection = async (collectionName: string) => {
    try {
        const snap = await db.collection(collectionName).get();
        return snap.docs.map(doc => doc.data());
    } catch (error) {
        handleFirestoreError(error, OperationType.LIST, collectionName);
    }
};

export const getDoc = async (collectionName: string, docId: string) => {
    try {
        const doc = await db.collection(collectionName).doc(docId).get();
        return doc.exists ? doc.data() : null;
    } catch (error) {
        handleFirestoreError(error, OperationType.GET, `${collectionName}/${docId}`);
    }
};

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
    return db.collection(collectionName).onSnapshot(snap => { 
        callback(snap.docs.map(d => d.data())); 
    }, error => {
        handleFirestoreError(error, OperationType.LIST, collectionName);
    });
};

export const seedDatabase = async (consignments: Consignment[], users: User[], importers: Importer[], commodityGroups: CommodityGroup[], settings: SystemSettings) => {
    const check = await db.collection('settings').doc('general').get();
    if (check.exists) return;
    const batch = db.batch();
    batch.set(db.collection('settings').doc('general'), settings);
    await batch.commit();
};

export const addPortToDB = (p: Port) => db.collection('ports').doc(p.id).set(p);
export const updatePortInDB = (p: Port) => db.collection('ports').doc(p.id).update(p);
export const deletePortFromDB = (id: string) => db.collection('ports').doc(id).delete();
export const addConsignmentToDB = (c: Consignment) => db.collection('consignments').doc(c.id).set(c);
export const updateConsignmentInDB = (c: Consignment) => db.collection('consignments').doc(c.id).update(c);
export const deleteConsignmentFromDB = (id: string) => db.collection('consignments').doc(id).delete();
export const addImporterToDB = (i: Importer) => db.collection('importers').doc(i.id).set(i);
export const updateImporterInDB = (i: Importer) => db.collection('importers').doc(i.id).update(i);
export const deleteImporterFromDB = (id: string) => db.collection('importers').doc(id).delete();
export const addCommodityToDB = (g: CommodityGroup) => db.collection('commodityGroups').doc(g.id).set(g);
export const updateCommodityInDB = (g: CommodityGroup) => db.collection('commodityGroups').doc(g.id).update(g);
export const deleteCommodityFromDB = (id: string) => db.collection('commodityGroups').doc(id).delete();
export const addSamplingPlanToDB = (p: SamplingPlan) => db.collection('samplingPlans').doc(p.id).set(p);
export const updateSamplingPlanInDB = (p: SamplingPlan) => db.collection('samplingPlans').doc(p.id).update(p);
export const deleteSamplingPlanFromDB = (id: string) => db.collection('samplingPlans').doc(id).delete();
export const addLaboratoryToDB = (l: Laboratory) => db.collection('laboratories').doc(l.id).set(l);
export const updateLaboratoryInDB = (l: Laboratory) => db.collection('laboratories').doc(l.id).update(l);
export const deleteLaboratoryFromDB = (id: string) => db.collection('laboratories').doc(id).delete();
export const addPesticideToDB = (p: PesticideMapping) => db.collection('pesticides').doc(p.id).set(p);
export const deletePesticideFromDB = (id: string) => db.collection('pesticides').doc(id).delete();
export const addClearanceOfficeToDB = (o: ClearanceOffice) => db.collection('clearanceOffices').doc(o.id).set(o);
export const updateClearanceOfficeInDB = (o: ClearanceOffice) => db.collection('clearanceOffices').doc(o.id).update(o);
export const deleteClearanceOfficeFromDB = (id: string) => db.collection('clearanceOffices').doc(id).delete();
export const addDocumentToDB = (d: AppDocument) => db.collection('documents').doc(d.id).set(d);
export const deleteDocumentFromDB = (id: string) => db.collection('documents').doc(id).delete();
export const addShiftNoteToDB = (n: ShiftNote) => db.collection('shiftNotes').doc(n.id).set(n);
export const updateShiftNoteInDB = (n: ShiftNote) => db.collection('shiftNotes').doc(n.id).update(n);
export const deleteShiftNoteFromDB = (id: string) => db.collection('shiftNotes').doc(id).delete();
export const saveShiftSchedule = (sector: ConsignmentType, portId: string, schedule: WeeklySchedule) => {
    const docId = portId === 'ALL' ? sector : `${sector}_${portId}`;
    return db.collection('schedules').doc(docId).set(schedule);
};

export const subscribeToShifts = (sector: ConsignmentType, portId: string, callback: (s: WeeklySchedule) => void) => {
    const docId = portId === 'ALL' ? sector : `${sector}_${portId}`;
    return db.collection('schedules').doc(docId).onSnapshot(doc => { 
        callback(doc.exists ? doc.data() as WeeklySchedule : {}); 
    }, error => {
        handleFirestoreError(error, OperationType.GET, `schedules/${docId}`);
    });
};

export const saveSectorShiftConfig = (config: SectorShiftConfig) => {
    return db.collection('shiftConfigs').doc(config.id).set(config);
};

export const subscribeToSectorShiftConfig = (sector: ConsignmentType, portId: string, callback: (data: SectorShiftConfig | null) => void) => {
    const id = portId === 'ALL' ? sector : `${sector}_${portId}`;
    return db.collection('shiftConfigs').doc(id).onSnapshot(doc => {
        if (doc.exists) callback(doc.data() as SectorShiftConfig);
        else callback(null);
    }, error => {
        handleFirestoreError(error, OperationType.GET, `shiftConfigs/${id}`);
    });
};
export const saveSettingsToDB = (s: SystemSettings) => db.collection('settings').doc('general').set(s);
export const saveLookupsToDB = (docName: string, data: any) => db.collection('lookups').doc(docName).set(data, { merge: true });
export const subscribeToCertificateTemplates = (sector: ConsignmentType, callback: (data: CertificateTemplate[]) => void) => {
    return db.collection('certificateTemplates').where('sector', '==', sector).onSnapshot(snap => {
        callback(snap.docs.map(d => d.data() as CertificateTemplate));
    }, error => {
        handleFirestoreError(error, OperationType.LIST, 'certificateTemplates');
    });
};
export const addCertificateTemplate = (t: CertificateTemplate) => db.collection('certificateTemplates').doc(t.id).set(t);
export const deleteCertificateTemplate = (id: string) => db.collection('certificateTemplates').doc(id).delete();
export const sendChatMessage = async (msg: ChatMessage) => { await db.collection('chatMessages').doc(msg.id).set(msg); };

export const updateMessageReactions = async (messageId: string, reactions: Record<string, string[]>) => {
    await db.collection('chatMessages').doc(messageId).update({ reactions });
};

export const markMessagesAsRead = async (messageIds: string[], userId: string) => {
    const batch = db.batch();
    messageIds.forEach(id => {
        const ref = db.collection('chatMessages').doc(id);
        batch.update(ref, {
            readBy: firebase.firestore.FieldValue.arrayUnion(userId)
        });
    });
    await batch.commit();
};

export const deleteChatMessage = async (messageId: string) => {
    await db.collection('chatMessages').doc(messageId).delete();
};

export const pinChatMessage = async (messageId: string, isPinned: boolean) => {
    await db.collection('chatMessages').doc(messageId).update({ isPinned });
};

export const updateTypingStatus = async (status: TypingStatus) => {
    await db.collection('typingStatus').doc(status.userId).set(status);
};

export const subscribeToTypingStatus = (sector: ConsignmentType, port: string | undefined, callback: (statuses: TypingStatus[]) => void) => {
    let query = db.collection('typingStatus').where('sector', '==', sector).where('isTyping', '==', true);
    if (port) {
        query = query.where('port', '==', port);
    }
    return query.onSnapshot((snapshot) => {
        const statuses = snapshot.docs.map(doc => doc.data() as TypingStatus);
        callback(statuses);
    }, error => {
        handleFirestoreError(error, OperationType.LIST, 'typingStatus');
    });
};

export const subscribeToSectorChat = (sector: ConsignmentType, port: string | undefined, callback: (msgs: ChatMessage[]) => void) => {
    let query = db.collection('chatMessages').where('sector', '==', sector);
    if (port) {
        query = query.where('port', '==', port);
    }
    return query.onSnapshot((snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
            msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            callback(msgs);
        }, error => {
            handleFirestoreError(error, OperationType.LIST, 'chatMessages');
        });
};
export const subscribeToAllRecentChats = (callback: (msgs: ChatMessage[]) => void) => {
    return db.collection('chatMessages').orderBy('timestamp', 'desc').limit(500).onSnapshot((snapshot) => {
            callback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage)));
        }, error => {
            handleFirestoreError(error, OperationType.LIST, 'chatMessages');
        });
};

// Mock upload function for now as storage is not fully configured
export const uploadFile = async (file: File, path: string): Promise<string> => {
    console.log(`Uploading ${file.name} to ${path}...`);
    // In a real app, this would use firebase.storage()
    // For now, we'll return a data URL if the file is small, or a placeholder
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
    });
};

export const addSecurityLog = async (log: Omit<SecurityLogEntry, 'id' | 'timestamp'>) => {
    try {
        const settingsDoc = await db.collection('system').doc('settings').get();
        const settings = settingsDoc.data();
        if (settings && settings.securityAuditEnabled === false) {
            return null; // Audit logging is disabled
        }

        const docRef = db.collection('securityLogs').doc();
        const newLog: SecurityLogEntry = {
            ...log,
            id: docRef.id,
            timestamp: new Date().toISOString(),
        };
        await docRef.set(newLog);
        return newLog;
    } catch (error) {
        console.error("Error adding security log:", error);
        throw error;
    }
};

export const getSecurityLogs = async (limitCount: number = 50): Promise<SecurityLogEntry[]> => {
    try {
        const snapshot = await db.collection('securityLogs').orderBy('timestamp', 'desc').limit(limitCount).get();
        return snapshot.docs.map(doc => doc.data() as SecurityLogEntry);
    } catch (error) {
        console.error("Error fetching security logs:", error);
        return [];
    }
};

export const subscribeToSecurityLogs = (limitCount: number = 50, callback: (logs: SecurityLogEntry[]) => void) => {
    return db.collection('securityLogs')
        .orderBy('timestamp', 'desc')
        .limit(limitCount)
        .onSnapshot((snapshot) => {
            const logs = snapshot.docs.map(doc => doc.data() as SecurityLogEntry);
            callback(logs);
        }, (error) => {
            handleFirestoreError(error, OperationType.LIST, 'securityLogs');
        });
};
