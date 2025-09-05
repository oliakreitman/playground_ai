'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { FileItem } from '@/hooks/useFirebase';
import { 
  ArrowUpTrayIcon,
  DocumentIcon,
  PhotoIcon,
  VideoCameraIcon,
  MusicalNoteIcon,
  ArchiveBoxIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  FolderIcon
} from '@heroicons/react/24/outline';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  doc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export function FilesSection() {
  const { user } = useUser();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Load files from Firebase
  useEffect(() => {
    if (!user?.id) {
      setFiles([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'files'),
      where('userId', '==', user.id)
      // orderBy('uploadedAt', 'desc') // Temporarily disabled until index is created
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const filesData: FileItem[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate() || new Date(),
        })) as FileItem[];
        
        // Client-side sorting since orderBy is temporarily disabled
        filesData.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
        
        setFiles(filesData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.id]);

  const handleFileUpload = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || !user?.id) return;
    
    setUploading(true);
    setError(null);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Check file size (max 100MB)
        if (file.size > 100 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large. Maximum size is 100MB.`);
        }

        // Create unique filename
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`;
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, `files/${user.id}/${uniqueFileName}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(uploadResult.ref);

        // Save file metadata to Firestore
        await addDoc(collection(db, 'files'), {
          userId: user.id,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type || 'application/octet-stream',
          fileUrl: downloadURL,
          uploadedAt: Timestamp.now(),
        });
      }
    } catch (err) {
      setError(`Upload failed: ${err}`);
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileItem: FileItem) => {
    if (!confirm(`Are you sure you want to delete ${fileItem.fileName}?`)) return;

    try {
      // Delete from Storage
      const storageRef = ref(storage, fileItem.fileUrl);
      await deleteObject(storageRef);
      
      // Delete from Firestore
      await deleteDoc(doc(db, 'files', fileItem.id!));
    } catch (err) {
      setError(`Failed to delete file: ${err}`);
    }
  };

  const downloadFile = (fileItem: FileItem) => {
    const link = document.createElement('a');
    link.href = fileItem.fileUrl;
    link.download = fileItem.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    if (fileType.startsWith('video/')) return <VideoCameraIcon className="h-8 w-8 text-purple-500" />;
    if (fileType.startsWith('audio/')) return <MusicalNoteIcon className="h-8 w-8 text-green-500" />;
    if (fileType.includes('pdf')) return <DocumentIcon className="h-8 w-8 text-red-500" />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <ArchiveBoxIcon className="h-8 w-8 text-orange-500" />;
    return <DocumentIcon className="h-8 w-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTotalStorage = () => {
    return files.reduce((total, file) => total + file.fileSize, 0);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <FolderIcon className="h-7 w-7 mr-2 text-purple-600" />
            My Files
          </h3>
          <p className="text-gray-600">Upload and manage your documents</p>
        </div>
        
        <label className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer">
          <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
          {uploading ? 'Uploading...' : 'Upload Files'}
          <input
            type="file"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">{files.length}</div>
          <div className="text-sm text-purple-800">Total Files</div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{formatFileSize(getTotalStorage())}</div>
          <div className="text-sm text-blue-800">Storage Used</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {formatFileSize(1024 * 1024 * 1024 - getTotalStorage())}
          </div>
          <div className="text-sm text-green-800">Available (1GB limit)</div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <h4 className="font-medium">Error</h4>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-600 mb-2">
          {dragActive ? 'Drop files here' : 'Drag and drop files here'}
        </p>
        <p className="text-sm text-gray-500">
          or click &ldquo;Upload Files&rdquo; button above • Max 100MB per file
        </p>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="text-center py-12">
          <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No files uploaded</h4>
          <p className="text-gray-500">Upload your first file to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <div key={file.id} className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                {getFileIcon(file.fileType)}
                <div className="flex space-x-1">
                  <button
                    onClick={() => downloadFile(file)}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Download"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => window.open(file.fileUrl, '_blank')}
                    className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                    title="Preview"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteFile(file)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h4 className="font-medium text-gray-800 mb-1 truncate" title={file.fileName}>
                {file.fileName}
              </h4>
              
              <div className="text-sm text-gray-600 mb-2">
                {formatFileSize(file.fileSize)}
              </div>
              
              <div className="text-xs text-gray-500">
                {file.uploadedAt.toLocaleDateString()} • {file.uploadedAt.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Progress */}
      {uploading && (
        <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
            <div>
              <div className="font-medium text-gray-800">Uploading files...</div>
              <div className="text-sm text-gray-600">Please wait</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
