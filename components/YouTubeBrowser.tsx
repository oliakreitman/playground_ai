'use client';

import { useState, useEffect } from 'react';
import { useYouTube, YouTubeVideo } from '@/hooks/useYouTube';
import { 
  MagnifyingGlassIcon, 
  PlayIcon, 
  EyeIcon,
  HeartIcon,
  ClockIcon,
  FireIcon 
} from '@heroicons/react/24/outline';

export function YouTubeBrowser() {
  const { 
    videos, 
    loading, 
    error, 
    nextPageToken, 
    totalResults,
    searchVideos, 
    getPopularVideos,
    loadMoreVideos,
    clearVideos 
  } = useYouTube();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    // Load popular videos on component mount
    getPopularVideos();
  }, [getPopularVideos]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    await searchVideos(searchQuery.trim());
    
    // Add to search history
    setSearchHistory(prev => {
      const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 5);
      return updated;
    });
  };

  const handleVideoSelect = (video: YouTubeVideo) => {
    setSelectedVideo(video);
  };

  const handleLoadMore = () => {
    if (searchQuery) {
      loadMoreVideos(searchQuery);
    }
  };

  const formatViewCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return count;
  };

  const formatDuration = (publishedAt: string) => {
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🎥 YouTube Browser</h2>
        <p className="text-gray-600">Search and browse YouTube videos</p>
      </div>

      {/* Search Section */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search YouTube videos..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            type="button"
            onClick={() => {
              clearVideos();
              getPopularVideos();
              setSearchQuery('');
            }}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FireIcon className="h-5 w-5" />
          </button>
        </form>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-gray-500">Recent:</span>
            {searchHistory.map((query, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(query);
                  searchVideos(query);
                }}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">
            <h3 className="text-lg font-medium">Error</h3>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Results Info */}
      {totalResults > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {searchQuery ? `Found ${totalResults.toLocaleString()} results for "${searchQuery}"` : `Showing popular videos`}
        </div>
      )}

      {/* Loading State */}
      {loading && videos.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">Loading videos...</span>
        </div>
      )}

      {/* Video Grid */}
      {videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {videos.map((video, index) => (
            <div 
              key={`${video.id.videoId}-${index}`} 
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleVideoSelect(video)}
            >
              <div className="relative aspect-video">
                <img
                  src={video.snippet.thumbnails.medium.url}
                  alt={video.snippet.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                  <PlayIcon className="h-12 w-12 text-white opacity-0 hover:opacity-100 transition-opacity" />
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 line-clamp-2 mb-2">
                  {video.snippet.title}
                </h3>
                
                <p className="text-sm text-gray-600 mb-2">
                  {video.snippet.channelTitle}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    {video.statistics?.viewCount && (
                      <div className="flex items-center">
                        <EyeIcon className="h-3 w-3 mr-1" />
                        {formatViewCount(video.statistics.viewCount)} views
                      </div>
                    )}
                    <div className="flex items-center">
                      <ClockIcon className="h-3 w-3 mr-1" />
                      {formatDuration(video.snippet.publishedAt)}
                    </div>
                  </div>
                  {video.statistics?.likeCount && (
                    <div className="flex items-center">
                      <HeartIcon className="h-3 w-3 mr-1" />
                      {formatViewCount(video.statistics.likeCount)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load More Button */}
      {nextPageToken && !loading && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Load More Videos
          </button>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedVideo.snippet.title}
              </h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
                title={selectedVideo.snippet.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-800">
                  {selectedVideo.snippet.channelTitle}
                </h4>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  {selectedVideo.statistics?.viewCount && (
                    <div className="flex items-center">
                      <EyeIcon className="h-4 w-4 mr-1" />
                      {parseInt(selectedVideo.statistics.viewCount).toLocaleString()} views
                    </div>
                  )}
                  <div>{formatDuration(selectedVideo.snippet.publishedAt)}</div>
                </div>
              </div>
              
              <p className="text-gray-700 whitespace-pre-wrap">
                {selectedVideo.snippet.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && videos.length === 0 && !error && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <PlayIcon className="mx-auto h-12 w-12" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No videos found</h3>
          <p className="text-gray-500">Try searching for something else</p>
        </div>
      )}
    </div>
  );
}

