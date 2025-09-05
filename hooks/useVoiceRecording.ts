import { useState, useRef, useCallback } from 'react';

export interface VoiceRecording {
  id: string;
  audioBlob: Blob;
  transcript: string;
  duration: number;
  timestamp: string;
}

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordings, setRecordings] = useState<VoiceRecording[]>([]);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const duration = (Date.now() - startTimeRef.current) / 1000;
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Transcribe audio
        await transcribeAudio(audioBlob, duration);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const transcribeAudio = async (audioBlob: Blob, duration: number) => {
    setIsTranscribing(true);
    
    try {
      // Convert audio blob to base64 for API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const { transcript } = await response.json();

      const recording: VoiceRecording = {
        id: Date.now().toString(),
        audioBlob,
        transcript: transcript || 'Could not transcribe audio',
        duration,
        timestamp: new Date().toISOString(),
      };

      setRecordings(prev => [recording, ...prev]);
      return recording;

    } catch (err) {
      console.error('Transcription error:', err);
      setError('Failed to transcribe audio. The recording was saved without transcription.');
      
      // Save recording without transcription
      const recording: VoiceRecording = {
        id: Date.now().toString(),
        audioBlob,
        transcript: 'Transcription failed',
        duration,
        timestamp: new Date().toISOString(),
      };

      setRecordings(prev => [recording, ...prev]);
      return recording;
    } finally {
      setIsTranscribing(false);
    }
  };

  const deleteRecording = useCallback((id: string) => {
    setRecordings(prev => prev.filter(recording => recording.id !== id));
  }, []);

  const clearAllRecordings = useCallback(() => {
    setRecordings([]);
  }, []);

  // Check if browser supports audio recording
  const isSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  return {
    isRecording,
    isTranscribing,
    error,
    recordings,
    startRecording,
    stopRecording,
    deleteRecording,
    clearAllRecordings,
    isSupported,
  };
};
