'use client';

import { useState, useEffect } from 'react';
import { useImageGeneration, ImageGenerationSettings } from '@/hooks/useImageGeneration';
import { 
  SparklesIcon, 
  PhotoIcon, 
  ArrowDownTrayIcon,
  TrashIcon,
  Cog6ToothIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export function ImageGenerator() {
  const {
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
  } = useImageGeneration();

  const [prompt, setPrompt] = useState('');
  const [settings, setSettings] = useState<ImageGenerationSettings>({
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  useEffect(() => {
    loadImageHistory();
  }, [loadImageHistory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    
    await generateImage(prompt, settings);
  };

  const handleDownload = async (imageUrl: string, imagePrompt: string) => {
    try {
      await downloadImage(imageUrl, imagePrompt);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const promptSuggestions = [
    "A futuristic city with flying cars at sunset",
    "A magical forest with glowing mushrooms and fairy lights",
    "A cute robot reading a book in a cozy library",
    "A majestic dragon flying over snow-capped mountains",
    "A serene lake with a small cabin and northern lights",
    "A steampunk airship floating above clouds",
    "A cyberpunk street scene with neon lights and rain",
    "A peaceful garden with cherry blossoms and a traditional bridge"
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎨 AI Image Generator</h2>
        <p className="text-gray-600">Create stunning images from your imagination using AI</p>
      </div>

      {/* Generation Form */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 mb-6 border border-purple-100">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Describe what you want to create
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A beautiful landscape with mountains and a lake, digital art style..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows={3}
              maxLength={4000}
              disabled={loading}
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                {prompt.length}/4000 characters
              </span>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center text-sm text-purple-600 hover:text-purple-700"
              >
                <Cog6ToothIcon className="h-4 w-4 mr-1" />
                Settings
              </button>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="bg-white rounded-lg p-4 border border-gray-200 space-y-4">
              <h3 className="font-medium text-gray-800">Generation Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={settings.size}
                    onChange={(e) => setSettings(prev => ({ ...prev, size: e.target.value as "1024x1024" | "1792x1024" | "1024x1792" }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="1024x1024">Square (1024×1024)</option>
                    <option value="1792x1024">Landscape (1792×1024)</option>
                    <option value="1024x1792">Portrait (1024×1792)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
                  <select
                    value={settings.quality}
                    onChange={(e) => setSettings(prev => ({ ...prev, quality: e.target.value as "standard" | "hd" }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="hd">HD (Higher Cost)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                  <select
                    value={settings.style}
                    onChange={(e) => setSettings(prev => ({ ...prev, style: e.target.value as "vivid" | "natural" }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="vivid">Vivid (More Artistic)</option>
                    <option value="natural">Natural (More Realistic)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Generate Image
                </>
              )}
            </button>
            
            {generatedImages.length > 0 && (
              <button
                type="button"
                onClick={clearImageHistory}
                className="flex items-center px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Clear All
              </button>
            )}
          </div>
        </form>

        {/* Prompt Suggestions */}
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Try these prompts:</p>
          <div className="flex flex-wrap gap-2">
            {promptSuggestions.slice(0, 4).map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setPrompt(suggestion)}
                disabled={loading}
                className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                {suggestion.length > 40 ? suggestion.substring(0, 40) + '...' : suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            <h3 className="text-lg font-medium">Generation Failed</h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Current Generated Image */}
      {currentImage && (
        <div className="mb-6 bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Latest Generation</h3>
            <p className="text-sm text-gray-600 mt-1">&ldquo;{currentImage.originalPrompt}&rdquo;</p>
            {currentImage.revisedPrompt && currentImage.revisedPrompt !== currentImage.originalPrompt && (
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium">AI Revised:</span> &ldquo;{currentImage.revisedPrompt}&rdquo;
              </p>
            )}
          </div>
          
          <div className="relative">
            <img
              src={currentImage.imageUrl}
              alt={currentImage.originalPrompt}
              className="w-full max-h-96 object-contain bg-gray-50"
            />
            
            {/* Image Overlay Actions */}
            <div className="absolute top-4 right-4 flex space-x-2">
              <button
                onClick={() => setSelectedImageModal(currentImage.imageUrl)}
                className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-opacity"
                title="View Full Size"
              >
                <EyeIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDownload(currentImage.imageUrl, currentImage.originalPrompt)}
                className="p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70 transition-opacity"
                title="Download"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 flex justify-between items-center text-sm text-gray-600">
            <span>Size: {currentImage.settings.size} • Quality: {currentImage.settings.quality} • Style: {currentImage.settings.style}</span>
            <span>{new Date(currentImage.timestamp).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {generatedImages.length > 1 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Generations ({generatedImages.length})</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {generatedImages.slice(1).map((image) => (
              <div key={image.id} className="bg-white rounded-lg shadow-md overflow-hidden group">
                <div className="relative aspect-square">
                  <img
                    src={image.imageUrl}
                    alt={image.originalPrompt}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => selectImage(image)}
                  />
                  
                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImageModal(image.imageUrl);
                        }}
                        className="p-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                        title="View"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(image.imageUrl, image.originalPrompt);
                        }}
                        className="p-2 bg-white text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Download"
                      >
                        <ArrowDownTrayIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(image.id);
                        }}
                        className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {image.originalPrompt}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(image.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && generatedImages.length === 0 && !error && (
        <div className="text-center py-12">
          <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">No images generated yet</h3>
          <p className="text-gray-500">Enter a prompt above to create your first AI-generated image</p>
        </div>
      )}

      {/* Full Size Image Modal */}
      {selectedImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-full max-h-full">
            <img
              src={selectedImageModal}
              alt="Full size view"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-lg hover:bg-opacity-70"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
