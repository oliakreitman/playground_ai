'use client';

import { useUser } from '@clerk/nextjs';
import { DataManager } from '@/components/DataManager';
import { UserProfile } from '@/components/UserProfile';
import { YouTubeBrowser } from '@/components/YouTubeBrowser';
import { MotivationalQuotes, QuoteOfTheDay } from '@/components/MotivationalQuotes';
import { ImageGenerator } from '@/components/ImageGenerator';
import { PersonalAssistant } from '@/components/PersonalAssistant';
import { useState } from 'react';

type TabType = 'data' | 'videos' | 'quotes' | 'images' | 'assistant' | 'profile';

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [activeTab, setActiveTab] = useState<TabType>('data');
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to Personal Playground</h1>
          <p className="text-xl text-gray-600 mb-8">Your personal platform for data management and file storage</p>
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">🗃️ Data Management</h2>
              <p className="text-gray-600">Store and organize your personal notes, ideas, and structured data</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">📁 File Storage</h2>
              <p className="text-gray-600">Upload and manage your files with Google Cloud Storage</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-2xl font-semibold mb-4">👤 Profile Management</h2>
              <p className="text-gray-600">Customize your profile and manage your account settings</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'data' as TabType, label: '🗃️ Data Manager', description: 'Manage your personal data and notes' },
    { id: 'videos' as TabType, label: '🎥 Video Browser', description: 'Browse and watch YouTube videos' },
    { id: 'quotes' as TabType, label: '✨ Daily Inspiration', description: 'Get motivated with AI-generated quotes' },
    { id: 'images' as TabType, label: '🎨 AI Images', description: 'Generate stunning images with AI' },
    { id: 'assistant' as TabType, label: '🤖 Assistant', description: 'Chat with your personal AI assistant' },
    { id: 'profile' as TabType, label: '👤 Profile', description: 'Manage your profile settings' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome back, {user.firstName || user.username || 'User'}! 👋
          </h1>
          <p className="text-gray-600">Manage your personal playground</p>
          
          {/* Daily Quote Card */}
          <div className="mt-4">
            <QuoteOfTheDay />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {tabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-lg">
          {activeTab === 'data' && <DataManager />}
          {activeTab === 'videos' && <YouTubeBrowser />}
          {activeTab === 'quotes' && <MotivationalQuotes />}
          {activeTab === 'images' && <ImageGenerator />}
          {activeTab === 'assistant' && <PersonalAssistant />}
          {activeTab === 'profile' && <UserProfile />}
        </div>
      </div>
    </div>
  );
}
