'use client';

import { useState, useRef } from 'react';
import { usePersonalAssistant } from '@/hooks/usePersonalAssistant';
import { useUser } from '@clerk/nextjs';
import {
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  TrashIcon,
  ClockIcon,
  UserCircleIcon,
  ComputerDesktopIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export function PersonalAssistant() {
  const { user } = useUser();
  const {
    messages,
    conversations,
    currentConversationId,
    loading,
    typing,
    error,
    conversationRef,
    sendMessage,
    startNewConversation,
    loadConversation,
    deleteConversation,
    clearAllConversations,
    getCurrentConversation,
  } = usePersonalAssistant();

  const [input, setInput] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
    
    // Focus back on input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const quickPrompts = [
    "Help me organize my daily tasks",
    "Give me productivity tips for working from home",
    "How can I better manage my digital files?",
    "Suggest some creative project ideas",
    "Help me create a morning routine",
    "What are some effective goal-setting strategies?"
  ];

  const currentConversation = getCurrentConversation();

  return (
    <div className="flex h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed lg:relative lg:translate-x-0 w-80 h-full bg-gray-50 border-r border-gray-200 transition-transform duration-300 ease-in-out z-40`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">🤖 Personal Assistant</h3>
            <button
              onClick={() => setShowSidebar(false)}
              className="lg:hidden p-1 text-gray-500 hover:text-gray-700"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
          
          <button
            onClick={startNewConversation}
            className="w-full flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            New Conversation
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto p-4">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <ChatBubbleLeftRightIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start chatting to see your history</p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conversation, index) => (
                <div
                  key={`conversation_${conversation.id}_${index}`}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    currentConversationId === conversation.id
                      ? 'bg-blue-100 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => loadConversation(conversation.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-800 truncate">
                        {conversation.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {conversation.messages.length} messages
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatTimestamp(conversation.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {conversations.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={clearAllConversations}
                className="w-full text-sm text-red-600 hover:text-red-700 transition-colors"
              >
                Clear All Conversations
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setShowSidebar(true)}
                className="lg:hidden p-2 text-gray-500 hover:text-gray-700 mr-2"
              >
                <ChatBubbleLeftRightIcon className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-800">Personal Assistant</h2>
                <p className="text-sm text-gray-600">
                  {currentConversation 
                    ? `Conversation: ${currentConversation.title}`
                    : `Hi ${user?.firstName || 'there'}! How can I help you today?`
                  }
                </p>
              </div>
            </div>
            {typing && (
              <div className="flex items-center text-blue-600">
                <div className="animate-pulse flex space-x-1 mr-2">
                  <div className="w-1 h-1 bg-blue-600 rounded-full"></div>
                  <div className="w-1 h-1 bg-blue-600 rounded-full animation-delay-200"></div>
                  <div className="w-1 h-1 bg-blue-600 rounded-full animation-delay-400"></div>
                </div>
                <span className="text-sm">Assistant is typing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div 
          ref={conversationRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
        >
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <ComputerDesktopIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Welcome to your Personal Assistant!</h3>
              <p className="text-gray-500 mb-6">I&rsquo;m here to help you with productivity, organization, and any questions you might have.</p>
              
              {/* Quick Prompts */}
              <div className="max-w-2xl mx-auto">
                <p className="text-sm font-medium text-gray-700 mb-3">Try asking me about:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <button
                      key={`quickprompt_${index}_${prompt.slice(0, 10)}`}
                      onClick={() => setInput(prompt)}
                      className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-sm"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={`message_${message.id}_${index}`}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 ${message.role === 'user' ? 'ml-2' : 'mr-2'}`}>
                      {message.role === 'user' ? (
                        <UserCircleIcon className="h-8 w-8 text-blue-600" />
                      ) : (
                        <div className="h-8 w-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">AI</span>
                        </div>
                      )}
                    </div>

                    {/* Message */}
                    <div
                      className={`px-4 py-2 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div className={`text-xs mt-1 ${
                        message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTimestamp(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border-t border-red-200">
            <div className="text-red-800 text-sm">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={1}
                disabled={loading}
                style={{ minHeight: '42px', maxHeight: '120px' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <PaperAirplaneIcon className="h-5 w-5" />
              )}
            </button>
          </form>
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>Powered by OpenAI GPT-4o mini</span>
            <span>{input.length}/2000 characters</span>
          </div>
        </div>
      </div>
    </div>
  );
}
