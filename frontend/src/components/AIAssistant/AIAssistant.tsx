import React, { useState, useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import Modal from '../Modal/Modal';
import dataService from '../../services/dataService';
import logger from '../../services/logger';
import { useCommunity } from '../../context';
import type { Community } from '../../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: {
    documents?: Array<{
      fileName: string;
      fileId: string;
      folderType: string;
      communityId: string | null;
    }>;
    databaseFunctions?: Array<{
      functionName: string;
      communityId: string | null;
    }>;
  };
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: {
      input: number;
      output: number;
      total: number;
    };
    iterations: number;
  };
  model?: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

const SESSION_STORAGE_KEY = 'ai_assistant_selected_community';

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const { selectedCommunity } = useCommunity();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | 'general'>('general');
  const [isLoadingCommunities, setIsLoadingCommunities] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load communities when modal opens
  useEffect(() => {
    if (isOpen && communities.length === 0) {
      const loadCommunities = async () => {
        setIsLoadingCommunities(true);
        try {
          const allCommunities = await dataService.getCommunities();
          setCommunities(allCommunities);
        } catch (error) {
          logger.error('Error loading communities for AI Assistant', 'AIAssistant', {}, error as Error);
        } finally {
          setIsLoadingCommunities(false);
        }
      };
      loadCommunities();
    }
  }, [isOpen, communities.length]);

  // Initialize selected community from session storage or context
  useEffect(() => {
    if (isOpen) {
      // Try to load from session storage first
      const savedCommunityId = sessionStorage.getItem(SESSION_STORAGE_KEY);
      
      if (savedCommunityId && savedCommunityId !== 'general') {
        // Verify the saved community still exists
        const communityExists = communities.some(c => c.id === savedCommunityId);
        if (communityExists) {
          setSelectedCommunityId(savedCommunityId);
          return;
        }
      }
      
      // Fall back to currently selected community from context
      if (selectedCommunity?.id) {
        setSelectedCommunityId(selectedCommunity.id);
        // Save to session storage
        sessionStorage.setItem(SESSION_STORAGE_KEY, selectedCommunity.id);
      } else {
        setSelectedCommunityId('general');
        sessionStorage.setItem(SESSION_STORAGE_KEY, 'general');
      }
    }
  }, [isOpen, selectedCommunity, communities]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      // Build conversation history (last 10 messages for context)
      const conversationHistory = messages
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Determine which community to use for the query
      // Priority: 1. Explicitly selected in dropdown, 2. Detection (if general query)
      const queryCommunityId = selectedCommunityId !== 'general' 
        ? selectedCommunityId 
        : undefined; // undefined = let backend detect or use general search

      // Call AI service with context for RAG
      // If community explicitly selected, use it (backend will prioritize this over detection)
      // If "General Query", let backend detect or search all
      const response = await dataService.chatWithAI(
        inputMessage.trim(), 
        conversationHistory,
        {
          communityId: queryCommunityId,
          useRAG: true // Enable RAG for document retrieval
        }
      );

      // Add AI response with sources and usage
      const aiMessage: Message = {
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        sources: response.sources,
        usage: response.usage,
        model: response.model
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      logger.error('Error sending message to AI', 'AIAssistant', { message: userMessage.content }, error as Error);
      setError('Failed to get response. Please try again.');
      
      // Remove the user message if it failed
      setMessages(prev => prev.filter(msg => msg !== userMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setMessages([]);
      setError(null);
      onClose();
    }
  };

  const handleCommunityChange = (communityId: string | 'general') => {
    setSelectedCommunityId(communityId);
    // Persist to session storage
    sessionStorage.setItem(SESSION_STORAGE_KEY, communityId);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Assistant" maxWidth="6xl">
      <div className="flex flex-col h-[900px]">
        {/* Community Selection Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-primary mb-2">
            Community:
          </label>
          <select
            value={selectedCommunityId}
            onChange={(e) => handleCommunityChange(e.target.value)}
            disabled={isLoadingCommunities || isLoading}
            className="w-full px-4 py-2 bg-surface border border-primary rounded-lg text-primary focus:outline-none focus:ring-2 focus:ring-royal-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="general">General Query</option>
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.propertyCode ? `${community.propertyCode} - ` : ''}{community.displayName || community.legalName}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-tertiary">
            Select a community for best results, or use "General Query" for questions about all communities.
          </p>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-secondary rounded-lg mb-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <p className="text-primary text-lg font-medium mb-2">Welcome to AI Assistant</p>
                <p className="text-secondary text-sm">
                  Ask me anything! I can help with questions about your data, documents, and more.
                </p>
                <div className="mt-4 text-left">
                  <p className="text-tertiary text-xs mb-2">Try asking:</p>
                  <ul className="text-tertiary text-xs space-y-1 list-disc list-inside">
                    <li>"What's the management fee for Comanche Condos?"</li>
                    <li>"Tell me about community fees"</li>
                    <li>"Help me understand invoices"</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-royal-600 text-white'
                        : 'bg-surface border border-primary text-primary'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="text-sm text-primary text-left">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed text-left">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc list-outside mb-2 space-y-1 text-left ml-6">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-outside mb-2 space-y-1 text-left ml-6">{children}</ol>,
                            li: ({ children }) => <li className="leading-relaxed text-left pl-2">{children}</li>,
                            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 text-primary text-left">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-base font-bold mb-2 text-primary text-left">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-sm font-bold mb-1 text-primary text-left">{children}</h3>,
                            code: ({ children }) => <code className="bg-surface-secondary px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>,
                            pre: ({ children }) => <pre className="bg-surface-secondary p-2 rounded text-xs overflow-x-auto mb-2 text-primary text-left">{children}</pre>,
                            blockquote: ({ children }) => <blockquote className="border-l-4 border-royal-600 pl-3 italic mb-2 text-secondary text-left">{children}</blockquote>,
                            hr: () => <hr className="my-3 border-primary" />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    
                    {/* Source References */}
                    {message.role === 'assistant' && message.sources && (
                      (message.sources.documents && message.sources.documents.length > 0) ||
                      (message.sources.databaseFunctions && message.sources.databaseFunctions.length > 0)
                    ) && (
                      <div className="mt-3 pt-3 border-t border-primary/30 text-left">
                        <p className="text-xs text-tertiary mb-1.5 font-medium text-left">Sources:</p>
                        <div className="space-y-1 text-left">
                          {message.sources.databaseFunctions && message.sources.databaseFunctions.length > 0 && (
                            <div className="text-xs text-secondary text-left">
                              <span className="text-tertiary">Database:</span>{' '}
                              {message.sources.databaseFunctions.map((func, idx) => {
                                const functionName = func.functionName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                return (
                                  <span key={idx}>
                                    {idx > 0 && ', '}
                                    {functionName}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {message.sources.documents && message.sources.documents.length > 0 && (
                            <div className="text-xs text-secondary text-left">
                              <span className="text-tertiary">Documents:</span>{' '}
                              {message.sources.documents.slice(0, 3).map((doc, idx) => (
                                <span key={idx}>
                                  {idx > 0 && ', '}
                                  {doc.fileName}
                                </span>
                              ))}
                              {message.sources.documents.length > 3 && (
                                <span className="text-tertiary"> +{message.sources.documents.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Usage Metrics */}
                    {message.usage && (
                      <div className="mt-2 pt-2 border-t border-primary/20 text-left">
                        <div className="text-xs text-tertiary space-y-1">
                          <div className="flex items-center justify-between">
                            <span>Tokens:</span>
                            <span className="text-secondary">
                              {message.usage.totalTokens.toLocaleString()} 
                              <span className="text-tertiary ml-1">
                                ({message.usage.inputTokens.toLocaleString()} in / {message.usage.outputTokens.toLocaleString()} out)
                              </span>
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Cost:</span>
                            <span className="text-secondary font-medium">
                              ${message.usage.cost.total.toFixed(4)}
                              <span className="text-tertiary ml-1 font-normal">
                                (${message.usage.cost.input.toFixed(4)} in / ${message.usage.cost.output.toFixed(4)} out)
                              </span>
                            </span>
                          </div>
                          {message.usage.iterations > 1 && (
                            <div className="flex items-center justify-between">
                              <span>Iterations:</span>
                              <span className="text-secondary">{message.usage.iterations}</span>
                            </div>
                          )}
                          {message.model && (
                            <div className="flex items-center justify-between">
                              <span>Model:</span>
                              <span className="text-secondary text-[10px]">{message.model}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-royal-200' : 'text-tertiary'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-surface border border-primary rounded-lg p-4 min-w-[120px]">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-royal-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-royal-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-royal-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      <span className="text-xs text-tertiary ml-2">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-600 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Input Area */}
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-surface border border-primary rounded-lg text-primary placeholder-tertiary focus:outline-none focus:ring-2 focus:ring-royal-600 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="px-4 py-2 bg-royal-600 hover:bg-royal-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
            Send
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AIAssistant;

