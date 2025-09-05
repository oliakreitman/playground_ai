'use client';

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { Note } from '@/hooks/useFirebase';
import { 
  PlusIcon, 
  MicrophoneIcon, 
  StopIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  SpeakerWaveIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function NotesSection() {
  const { user } = useUser();
  const { 
    isRecording, 
    isTranscribing, 
    error: voiceError, 
    startRecording, 
    stopRecording,
    recordings,
    isSupported: voiceSupported 
  } = useVoiceRecording();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
  });
  const processedRecordings = useRef<Set<string>>(new Set());

  // Load notes from Firebase
  useEffect(() => {
    if (!user?.id) {
      setNotes([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notes'),
      where('userId', '==', user.id)
      // orderBy('createdAt', 'desc') // Temporarily disabled until index is created
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const notesData: Note[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        })) as Note[];
        
        // Client-side sorting since orderBy is temporarily disabled
        notesData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        
        setNotes(notesData);
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

  // Handle voice recordings - automatically create notes from transcriptions
  useEffect(() => {
    if (!user?.id || recordings.length === 0) return;

    const latestRecording = recordings[0];
    
    // Check if this recording has already been processed
    if (processedRecordings.current.has(latestRecording.id)) return;

    if (latestRecording.transcript && 
        latestRecording.transcript !== 'Transcription failed' && 
        latestRecording.transcript !== 'Could not transcribe audio' &&
        latestRecording.transcript.trim().length > 0) {
      
      // Create a note from the voice recording
      const createVoiceNote = async () => {
        try {
          await addDoc(collection(db, 'notes'), {
            userId: user.id,
            title: `Voice Note - ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
            content: latestRecording.transcript,
            tags: ['voice-note'],
            isVoiceNote: true,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          });
          
          // Mark this recording as processed
          processedRecordings.current.add(latestRecording.id);
        } catch (err) {
          setError(`Failed to save voice note: ${err}`);
        }
      };

      createVoiceNote();
    }
  }, [recordings, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    try {
      const tags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      
      if (editingNote) {
        await updateDoc(doc(db, 'notes', editingNote.id!), {
          title: formData.title,
          content: formData.content,
          tags,
          updatedAt: Timestamp.now(),
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          userId: user.id,
          title: formData.title,
          content: formData.content,
          tags,
          isVoiceNote: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      }
      
      resetForm();
    } catch (err) {
      setError(`Failed to save note: ${err}`);
    }
  };

  const handleVoiceRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      try {
        await startRecording();
        // The recording will be processed in the hook
      } catch {
        setError('Failed to start recording');
      }
    }
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      tags: note.tags?.join(', ') || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      try {
        await deleteDoc(doc(db, 'notes', noteId));
      } catch (err) {
        setError(`Failed to delete note: ${err}`);
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', content: '', tags: '' });
    setEditingNote(null);
    setShowForm(false);
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
            <DocumentTextIcon className="h-7 w-7 mr-2 text-blue-600" />
            My Notes
          </h3>
          <p className="text-gray-600">Write notes or record voice memos</p>
        </div>
        
        <div className="flex space-x-3">
          {voiceSupported && (
            <button
              onClick={handleVoiceRecording}
              disabled={isTranscribing}
              className={`flex items-center px-4 py-2 rounded-lg transition-all ${
                isRecording 
                  ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } disabled:opacity-50`}
            >
              {isRecording ? (
                <>
                  <StopIcon className="h-5 w-5 mr-2" />
                  Stop Recording
                </>
              ) : isTranscribing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Transcribing...
                </>
              ) : (
                <>
                  <MicrophoneIcon className="h-5 w-5 mr-2" />
                  Voice Note
                </>
              )}
            </button>
          )}
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Note
          </button>
        </div>
      </div>

      {/* Error Display */}
      {(error || voiceError) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <h4 className="font-medium">Error</h4>
            <p className="mt-1">{error || voiceError}</p>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h4 className="text-xl font-bold mb-4">
              {editingNote ? 'Edit Note' : 'New Note'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="personal, work, ideas"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingNote ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">No notes yet</h4>
          <p className="text-gray-500">Create your first note or record a voice memo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div key={note.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-gray-800 line-clamp-1 flex items-center">
                  {note.isVoiceNote && <SpeakerWaveIcon className="h-4 w-4 mr-1 text-blue-600" />}
                  {note.title}
                </h4>
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(note)}
                    className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(note.id!)}
                    className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-700 text-sm mb-3 line-clamp-4">
                {note.content}
              </p>
              
              {note.tags && note.tags.length > 0 && (
                <div className="flex items-center flex-wrap gap-1 mb-3">
                  <TagIcon className="h-3 w-3 text-gray-400" />
                  {note.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="text-xs text-gray-500">
                {note.createdAt.toLocaleDateString()} • {note.createdAt.toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
