'use client';

import { useState } from 'react';
import { useMotivationalQuotes } from '@/hooks/useMotivationalQuotes';
import { 
  SparklesIcon, 
  ArrowPathIcon, 
  SunIcon, 
  TrophyIcon,
  HeartIcon,
  BoltIcon 
} from '@heroicons/react/24/outline';

interface QuoteCardProps {
  compact?: boolean;
  showControls?: boolean;
  className?: string;
}

export function MotivationalQuotes({ compact = false, showControls = true, className = '' }: QuoteCardProps) {
  const { 
    currentQuote, 
    loading, 
    error,
    getMorningQuote,
    getAchievementQuote,
    getQuoteByCategory,
    refreshQuote 
  } = useMotivationalQuotes();

  const [selectedCategory, setSelectedCategory] = useState('daily');

  const quoteCategories = [
    { id: 'daily', label: 'Daily', icon: SparklesIcon, action: () => getQuoteByCategory('general') },
    { id: 'morning', label: 'Morning', icon: SunIcon, action: getMorningQuote },
    { id: 'achievement', label: 'Success', icon: TrophyIcon, action: getAchievementQuote },
    { id: 'wellness', label: 'Wellness', icon: HeartIcon, action: () => getQuoteByCategory('wellness') },
    { id: 'productivity', label: 'Focus', icon: BoltIcon, action: () => getQuoteByCategory('productivity') },
  ];

  const handleCategoryChange = (category: typeof quoteCategories[0]) => {
    setSelectedCategory(category.id);
    category.action();
  };

  if (compact) {
    return (
      <div className={`bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg ${className}`}>
        {loading ? (
          <div className="flex items-center justify-center">
            <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
            <span>Loading inspiration...</span>
          </div>
        ) : error ? (
          <div className="text-center">
            <p className="text-sm opacity-90">Stay positive and keep going! 💪</p>
          </div>
        ) : currentQuote ? (
          <div className="text-center">
            <SparklesIcon className="h-6 w-6 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-medium leading-relaxed">
              &ldquo;{currentQuote.quote}&rdquo;
            </p>
            <p className="text-xs opacity-75 mt-2">- {currentQuote.attribution}</p>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm">Your daily inspiration is loading...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">✨ Daily Inspiration</h2>
        <p className="text-gray-600">Start your day with a positive mindset</p>
      </div>

      {/* Quote Categories */}
      {showControls && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {quoteCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category)}
                  disabled={loading}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {category.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quote Display */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 border border-blue-100">
        {loading ? (
          <div className="text-center">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Generating your personalized inspiration...</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <SparklesIcon className="h-8 w-8 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Stay Inspired!</h3>
            <p className="text-gray-600 mb-4">
              Even when technology stumbles, your potential remains limitless.
            </p>
            <button
              onClick={() => refreshQuote('daily', 'general')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : currentQuote ? (
          <div className="text-center">
            <div className="mb-6">
              <SparklesIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <blockquote className="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed mb-4">
                &ldquo;{currentQuote.quote}&rdquo;
              </blockquote>
              <p className="text-gray-600 font-medium">
                — {currentQuote.attribution}
              </p>
            </div>
            
            {/* Quote Metadata */}
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center">
                <SparklesIcon className="h-4 w-4 mr-1" />
                {currentQuote.type.charAt(0).toUpperCase() + currentQuote.type.slice(1)} Quote
              </span>
              {currentQuote.fallback && (
                <span className="text-yellow-600">
                  ⚡ Backup Quote
                </span>
              )}
            </div>

            {/* Action Buttons */}
            {showControls && (
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => refreshQuote(currentQuote?.type || 'daily', currentQuote?.category || 'general')}
                  disabled={loading}
                  className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  New Quote
                </button>
                
                <button
                  onClick={() => {
                    if (currentQuote) {
                      navigator.clipboard.writeText(`"${currentQuote.quote}" - ${currentQuote.attribution}`);
                      // You could add a toast notification here
                    }
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <HeartIcon className="h-4 w-4 mr-2" />
                  Copy Quote
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center">
            <SparklesIcon className="h-8 w-8 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Your daily inspiration is loading...</p>
          </div>
        )}
      </div>

      {/* Quote of the Day Info */}
      {currentQuote && currentQuote.type === 'daily' && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            💫 This is your quote for today • New quote available tomorrow
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for homepage/header
export function QuoteOfTheDay() {
  return (
    <MotivationalQuotes 
      compact={true} 
      showControls={false}
      className="shadow-lg hover:shadow-xl transition-shadow"
    />
  );
}
