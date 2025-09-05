'use client';

import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { QuoteOfTheDay } from '@/components/MotivationalQuotes';

export default function Home() {
  const { isSignedIn, user, isLoaded } = useUser();

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Welcome to <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Personal Playground
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Your personal platform for data management, file storage, and digital organization. 
            Powered by modern authentication and cloud storage.
          </p>
          
          {isSignedIn ? (
            <div className="space-y-6">
              <p className="text-lg text-gray-700">
                Welcome back, <span className="font-semibold text-blue-600">{user.firstName || 'User'}</span>! 👋
              </p>
              
              {/* Daily Quote */}
              <div className="max-w-lg mx-auto">
                <QuoteOfTheDay />
              </div>
              
              <Link
                href="/dashboard"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Go to Dashboard →
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-lg text-gray-700">
                Sign in to access your personal dashboard and start organizing your digital life.
              </p>
              
              {/* Sample Quote for Non-Signed Users */}
              <div className="max-w-lg mx-auto">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg shadow-lg">
                  <div className="text-center">
                    <div className="text-2xl mb-2">✨</div>
                    <p className="text-sm font-medium leading-relaxed">
                      &ldquo;Every great journey begins with a single step forward.&rdquo;
                    </p>
                    <p className="text-xs opacity-75 mt-2">- Personal Playground</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-16">
          <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🗃️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Management</h3>
            <p className="text-gray-600">
              Store and organize your personal notes, ideas, and structured data with powerful tagging and search capabilities.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎥</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Video Browser</h3>
            <p className="text-gray-600">
              Browse, search, and watch YouTube videos with an integrated video player and search functionality.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">AI Inspiration</h3>
            <p className="text-gray-600">
              Get personalized motivational quotes powered by OpenAI to keep you inspired and focused.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">AI Image Generator</h3>
            <p className="text-gray-600">
              Create stunning, unique images from text descriptions using DALL-E 3 AI technology.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Assistant</h3>
            <p className="text-gray-600">
              Chat with your AI assistant for help, advice, and productivity tips powered by OpenAI.
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Secure Authentication</h3>
            <p className="text-gray-600">
              Your data is protected with Clerk&rsquo;s enterprise-grade authentication and security features.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Built with Modern Technology</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <div className="text-2xl mb-2">⚛️</div>
              <h4 className="font-semibold text-gray-800 text-sm">Next.js 14</h4>
              <p className="text-xs text-gray-600">Framework</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔑</div>
              <h4 className="font-semibold text-gray-800 text-sm">Clerk</h4>
              <p className="text-xs text-gray-600">Authentication</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🔥</div>
              <h4 className="font-semibold text-gray-800 text-sm">Firebase</h4>
              <p className="text-xs text-gray-600">Database</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">📺</div>
              <h4 className="font-semibold text-gray-800 text-sm">YouTube API</h4>
              <p className="text-xs text-gray-600">Video Browse</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <h4 className="font-semibold text-gray-800 text-sm">GPT-4o mini</h4>
              <p className="text-xs text-gray-600">AI Chat</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">✨</div>
              <h4 className="font-semibold text-gray-800 text-sm">AI Quotes</h4>
              <p className="text-xs text-gray-600">Inspiration</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🎨</div>
              <h4 className="font-semibold text-gray-800 text-sm">DALL-E 3</h4>
              <p className="text-xs text-gray-600">AI Images</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        {!isSignedIn && (
          <div className="text-center mt-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to get started?</h2>
            <p className="text-lg text-gray-600 mb-8">
              Create your account and start organizing your digital life today.
            </p>
            <div className="space-x-4">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Get Started
              </button>
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors text-lg font-semibold">
                Learn More
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}