import { useState, useCallback, useRef, useEffect } from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ConversationSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export const usePersonalAssistant = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load conversations from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('assistantConversations');
      if (saved) {
        const savedConversations = JSON.parse(saved);
        setConversations(savedConversations);
        
        // Load the most recent conversation
        if (savedConversations.length > 0) {
          const recent = savedConversations[0];
          setCurrentConversationId(recent.id);
          setMessages(recent.messages);
        }
      }
    } catch (err) {
      console.error('Error loading conversations:', err);
    }
  }, []);

  // Save conversations to localStorage
  const saveConversations = useCallback((updatedConversations: ConversationSession[]) => {
    try {
      localStorage.setItem('assistantConversations', JSON.stringify(updatedConversations));
    } catch (err) {
      console.error('Error saving conversations:', err);
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    setTyping(true);
    setError(null);

    try {
      // Prepare messages for API (exclude message IDs and timestamps)
      const apiMessages = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: 'gpt-4o-mini',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: data.message.content,
        timestamp: data.timestamp,
      };

      setMessages(prev => {
        const updatedMessages = [...prev, assistantMessage];
        
        // Update or create conversation
        const conversationTitle = content.length > 50 
          ? content.substring(0, 50) + '...' 
          : content;

        setConversations(prevConversations => {
          let updatedConversations;
          
          if (currentConversationId) {
            // Update existing conversation
            updatedConversations = prevConversations.map(conv =>
              conv.id === currentConversationId
                ? {
                    ...conv,
                    messages: updatedMessages,
                    updatedAt: new Date().toISOString(),
                  }
                : conv
            );
          } else {
            // Create new conversation
            const newConversation: ConversationSession = {
              id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: conversationTitle,
              messages: updatedMessages,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            setCurrentConversationId(newConversation.id);
            updatedConversations = [newConversation, ...prevConversations].slice(0, 20); // Keep last 20 conversations
          }
          
          saveConversations(updatedConversations);
          return updatedConversations;
        });
        
        return updatedMessages;
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Assistant error:', err);
    } finally {
      setLoading(false);
      setTyping(false);
    }
  }, [messages, currentConversationId, loading, saveConversations]);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setCurrentConversationId(null);
    setError(null);
  }, []);

  const loadConversation = useCallback((conversationId: string) => {
    const conversation = conversations.find(conv => conv.id === conversationId);
    if (conversation) {
      setMessages(conversation.messages);
      setCurrentConversationId(conversationId);
      setError(null);
    }
  }, [conversations]);

  const deleteConversation = useCallback((conversationId: string) => {
    setConversations(prev => {
      const updated = prev.filter(conv => conv.id !== conversationId);
      saveConversations(updated);
      
      // If we're deleting the current conversation, start a new one
      if (conversationId === currentConversationId) {
        setMessages([]);
        setCurrentConversationId(null);
      }
      
      return updated;
    });
  }, [currentConversationId, saveConversations]);

  const clearAllConversations = useCallback(() => {
    setConversations([]);
    setMessages([]);
    setCurrentConversationId(null);
    localStorage.removeItem('assistantConversations');
  }, []);

  const getCurrentConversation = useCallback(() => {
    if (!currentConversationId) return null;
    return conversations.find(conv => conv.id === currentConversationId) || null;
  }, [currentConversationId, conversations]);

  return {
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
  };
};
