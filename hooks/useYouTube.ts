import { useState, useCallback } from 'react';

const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width: number; height: number };
      medium: { url: string; width: number; height: number };
      high: { url: string; width: number; height: number };
    };
    channelTitle: string;
    publishedAt: string;
    channelId: string;
  };
  statistics?: {
    viewCount: string;
    likeCount: string;
    dislikeCount: string;
    commentCount: string;
  };
}

export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  prevPageToken?: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
}

export const useYouTube = () => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);

  const searchVideos = useCallback(async (
    query: string, 
    maxResults: number = 12,
    pageToken?: string
  ) => {
    if (!YOUTUBE_API_KEY) {
      setError('YouTube API key not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults.toString(),
        key: YOUTUBE_API_KEY,
        order: 'relevance',
        safeSearch: 'moderate',
        videoEmbeddable: 'true',
      });

      if (pageToken) {
        params.append('pageToken', pageToken);
      }

      const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data: YouTubeSearchResponse = await response.json();
      
      if (pageToken) {
        // Append to existing videos for pagination
        setVideos(prev => [...prev, ...data.items]);
      } else {
        // Replace videos for new search
        setVideos(data.items);
      }
      
      setNextPageToken(data.nextPageToken || null);
      setTotalResults(data.pageInfo.totalResults);
    } catch (err) {
      setError(`Failed to search videos: ${err}`);
      console.error('YouTube search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getPopularVideos = useCallback(async (
    maxResults: number = 12,
    regionCode: string = 'US'
  ) => {
    if (!YOUTUBE_API_KEY) {
      setError('YouTube API key not configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        part: 'snippet,statistics',
        chart: 'mostPopular',
        maxResults: maxResults.toString(),
        regionCode,
        key: YOUTUBE_API_KEY,
        videoCategoryId: '0', // All categories
      });

      const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Transform the response to match our interface
      const transformedVideos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: { videoId: item.id },
        snippet: item.snippet,
        statistics: item.statistics,
      }));
      
      setVideos(transformedVideos);
      setNextPageToken(null);
      setTotalResults(data.pageInfo?.totalResults || 0);
    } catch (err) {
      setError(`Failed to get popular videos: ${err}`);
      console.error('YouTube popular videos error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getVideoDetails = useCallback(async (videoId: string) => {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YouTube API key not configured');
    }

    try {
      const params = new URLSearchParams({
        part: 'snippet,statistics,contentDetails',
        id: videoId,
        key: YOUTUBE_API_KEY,
      });

      const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      return data.items[0];
    } catch (err) {
      console.error('YouTube video details error:', err);
      throw err;
    }
  }, []);

  const loadMoreVideos = useCallback((query: string) => {
    if (nextPageToken && !loading) {
      searchVideos(query, 12, nextPageToken);
    }
  }, [nextPageToken, loading, searchVideos]);

  const clearVideos = useCallback(() => {
    setVideos([]);
    setNextPageToken(null);
    setTotalResults(0);
    setError(null);
  }, []);

  return {
    videos,
    loading,
    error,
    nextPageToken,
    totalResults,
    searchVideos,
    getPopularVideos,
    getVideoDetails,
    loadMoreVideos,
    clearVideos,
  };
};

