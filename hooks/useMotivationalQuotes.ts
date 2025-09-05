import { useState, useEffect, useCallback } from 'react';

export interface MotivationalQuote {
  quote: string;
  attribution: string;
  type: string;
  category: string;
  timestamp: string;
  fallback?: boolean;
}

export const useMotivationalQuotes = () => {
  const [currentQuote, setCurrentQuote] = useState<MotivationalQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuote = useCallback(async (type: string = 'daily', category: string = 'general') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/quotes?type=${type}&category=${category}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quote: ${response.status}`);
      }

      const quoteData: MotivationalQuote = await response.json();
      setCurrentQuote(quoteData);
    } catch (err) {
      setError(`Failed to load motivational quote: ${err}`);
      console.error('Quote fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDailyQuote = useCallback(() => {
    const today = new Date().toDateString();
    const cachedQuote = localStorage.getItem('dailyQuote');
    const cachedDate = localStorage.getItem('dailyQuoteDate');

    // Check if we have a cached quote for today
    if (cachedQuote && cachedDate === today) {
      try {
        const quote = JSON.parse(cachedQuote);
        setCurrentQuote(quote);
        return;
      } catch (err) {
        // If parsing fails, fetch a new quote
        console.error('Error parsing cached quote:', err);
      }
    }

    // Fetch new quote - don't depend on currentQuote state
    fetchQuote('daily', 'general');
  }, [fetchQuote]);

  const getQuoteByCategory = useCallback((category: string) => {
    return fetchQuote('daily', category);
  }, [fetchQuote]);

  const getMorningQuote = useCallback(() => {
    return fetchQuote('morning', 'general');
  }, [fetchQuote]);

  const getAchievementQuote = useCallback(() => {
    return fetchQuote('achievement', 'general');
  }, [fetchQuote]);

  const refreshQuote = useCallback((type: string = 'daily', category: string = 'general') => {
    fetchQuote(type, category);
  }, [fetchQuote]);

  // Auto-fetch daily quote on component mount (only once)
  useEffect(() => {
    const today = new Date().toDateString();
    const cachedQuote = localStorage.getItem('dailyQuote');
    const cachedDate = localStorage.getItem('dailyQuoteDate');

    // Check if we have a cached quote for today
    if (cachedQuote && cachedDate === today) {
      try {
        const quote = JSON.parse(cachedQuote);
        setCurrentQuote(quote);
        return;
      } catch (err) {
        console.error('Error parsing cached quote:', err);
      }
    }

    // Fetch new quote only if no cached quote for today
    fetchQuote('daily', 'general');
  }, []); // Empty dependency array - only run once on mount

  // Save quote to cache when it changes (but avoid infinite loops)
  useEffect(() => {
    if (currentQuote && currentQuote.type === 'daily') {
      const today = new Date().toDateString();
      // Only save to cache, don't trigger re-fetch
      try {
        localStorage.setItem('dailyQuote', JSON.stringify(currentQuote));
        localStorage.setItem('dailyQuoteDate', today);
      } catch (err) {
        console.error('Error saving quote to cache:', err);
      }
    }
  }, [currentQuote]);

  return {
    currentQuote,
    loading,
    error,
    fetchQuote,
    getDailyQuote,
    getQuoteByCategory,
    getMorningQuote,
    getAchievementQuote,
    refreshQuote,
  };
};
