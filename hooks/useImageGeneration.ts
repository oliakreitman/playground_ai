import { useState, useCallback } from 'react';

export interface GeneratedImage {
  id: string;
  imageUrl: string;
  originalPrompt: string;
  revisedPrompt?: string;
  settings: {
    size: string;
    quality: string;
    style: string;
  };
  timestamp: string;
}

export interface ImageGenerationSettings {
  size: '1024x1024' | '1792x1024' | '1024x1792';
  quality: 'standard' | 'hd';
  style: 'vivid' | 'natural';
}

export const useImageGeneration = () => {
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (
    prompt: string, 
    settings: ImageGenerationSettings = {
      size: '1024x1024',
      quality: 'standard',
      style: 'vivid'
    }
  ) => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an image');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          ...settings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        imageUrl: data.imageUrl,
        originalPrompt: data.originalPrompt,
        revisedPrompt: data.revisedPrompt,
        settings: data.settings,
        timestamp: data.timestamp,
      };

      setCurrentImage(newImage);
      setGeneratedImages(prev => [newImage, ...prev]);

      // Save to localStorage for persistence
      try {
        const existingImages = JSON.parse(localStorage.getItem('generatedImages') || '[]');
        const updatedImages = [newImage, ...existingImages].slice(0, 20); // Keep last 20 images
        localStorage.setItem('generatedImages', JSON.stringify(updatedImages));
      } catch (err) {
        console.error('Error saving to localStorage:', err);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);
      console.error('Image generation error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadImageHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem('generatedImages');
      if (saved) {
        const images = JSON.parse(saved);
        setGeneratedImages(images);
        if (images.length > 0) {
          setCurrentImage(images[0]);
        }
      }
    } catch (err) {
      console.error('Error loading image history:', err);
    }
  }, []);

  const clearImageHistory = useCallback(() => {
    setGeneratedImages([]);
    setCurrentImage(null);
    localStorage.removeItem('generatedImages');
  }, []);

  const deleteImage = useCallback((imageId: string) => {
    setGeneratedImages(prev => {
      const filtered = prev.filter(img => img.id !== imageId);
      
      // Update localStorage
      try {
        localStorage.setItem('generatedImages', JSON.stringify(filtered));
      } catch (err) {
        console.error('Error updating localStorage:', err);
      }
      
      return filtered;
    });

    // If deleted image was current, set new current
    if (currentImage?.id === imageId) {
      setCurrentImage(prev => {
        const remaining = generatedImages.filter(img => img.id !== imageId);
        return remaining.length > 0 ? remaining[0] : null;
      });
    }
  }, [currentImage, generatedImages]);

  const downloadImage = useCallback(async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Create filename from prompt (sanitized)
      const sanitizedPrompt = prompt
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 50);
      
      link.download = `ai_generated_${sanitizedPrompt}_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading image:', err);
      throw new Error('Failed to download image');
    }
  }, []);

  const selectImage = useCallback((image: GeneratedImage) => {
    setCurrentImage(image);
  }, []);

  return {
    generatedImages,
    currentImage,
    loading,
    error,
    generateImage,
    loadImageHistory,
    clearImageHistory,
    deleteImage,
    downloadImage,
    selectImage,
  };
};
