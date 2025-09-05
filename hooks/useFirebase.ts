import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useUserSync } from './useUserSync';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  getMetadata 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export interface UserData {
  id?: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

export interface Note {
  id?: string;
  userId: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  isVoiceNote?: boolean;
  audioUrl?: string;
}

export interface TodoItem {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface FileItem {
  id?: string;
  userId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedAt: Date;
}

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
  userId: string;
}

export const useFirebaseData = () => {
  const { user } = useUser();
  const { updateUserStats } = useUserSync();
  const [data, setData] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setData([]);
      setLoading(false);
      return;
    }

    // Temporary fix: Remove orderBy to avoid index requirement
    const q = query(
      collection(db, 'userData'),
      where('userId', '==', user.id)
      // orderBy('createdAt', 'desc') // Will be re-enabled after index is created
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const userData: UserData[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as UserData[];
        
        // Sort on client side since we removed orderBy
        userData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setData(userData);
        setLoading(false);
        setError(null);
        
        // Update user stats
        updateUserStats({ totalDataItems: userData.length });
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const addData = async (title: string, content: string, tags: string[] = []) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const docRef = await addDoc(collection(db, 'userData'), {
        userId: user.id,
        title,
        content,
        tags,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (err) {
      throw new Error(`Failed to add data: ${err}`);
    }
  };

  const updateData = async (id: string, updates: Partial<UserData>) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const docRef = doc(db, 'userData', id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (err) {
      throw new Error(`Failed to update data: ${err}`);
    }
  };

  const deleteData = async (id: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      await deleteDoc(doc(db, 'userData', id));
    } catch (err) {
      throw new Error(`Failed to delete data: ${err}`);
    }
  };

  return {
    data,
    loading,
    error,
    addData,
    updateData,
    deleteData,
  };
};

export const useFirebaseStorage = () => {
  const { user } = useUser();
  const { updateUserStats } = useUserSync();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async () => {
    if (!user?.id) return;

    try {
      const userFolderRef = ref(storage, `users/${user.id}/`);
      const result = await listAll(userFolderRef);
      
      const filePromises = result.items.map(async (itemRef) => {
        const url = await getDownloadURL(itemRef);
        const metadata = await getMetadata(itemRef);
        
        return {
          id: itemRef.name,
          name: itemRef.name,
          url,
          size: metadata.size || 0,
          type: metadata.contentType || 'unknown',
          uploadedAt: new Date(metadata.timeCreated || Date.now()),
          userId: user.id,
        };
      });

      const fileList = await Promise.all(filePromises);
      setFiles(fileList);
      
      // Update user stats
      const totalSize = fileList.reduce((sum, file) => sum + file.size, 0);
      updateUserStats({ 
        totalFilesUploaded: fileList.length,
        storageUsed: totalSize
      });
    } catch (err) {
      setError(`Failed to fetch files: ${err}`);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchFiles();
    }
  }, [user?.id]);

  const uploadFile = async (file: File) => {
    if (!user?.id) throw new Error('User not authenticated');

    setUploading(true);
    setError(null);

    try {
      const fileRef = ref(storage, `users/${user.id}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const url = await getDownloadURL(snapshot.ref);
      
      await fetchFiles(); // Refresh file list
      
      return {
        name: file.name,
        url,
        size: file.size,
        type: file.type,
      };
    } catch (err) {
      setError(`Failed to upload file: ${err}`);
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const fileRef = ref(storage, `users/${user.id}/${fileName}`);
      await deleteObject(fileRef);
      await fetchFiles(); // Refresh file list
    } catch (err) {
      setError(`Failed to delete file: ${err}`);
      throw err;
    }
  };

  return {
    files,
    uploading,
    error,
    uploadFile,
    deleteFile,
    refreshFiles: fetchFiles,
  };
};
