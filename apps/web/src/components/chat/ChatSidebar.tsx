import { useState, useRef, useEffect } from 'react';
import { X, Send, MessageCircle, Bot, User } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { useDashboardStore } from '../../store/dashboardStore';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatSidebarProps {
  onClose: () => void;
}



export function ChatSidebar({ onClose }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'bot',
      content: 'Hi, I can help you through stroke imaging, treatment decisions, and expected outcomes. What would you like to review?',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { patientData, activeScenario, currentOutcomes } = useDashboardStore();

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const history = messages.map(m => ({
        role: m.type === 'user' ? 'user' : 'model',
        content: m.content
      }));

      const context = {
        patient: {
          age: patientData.age,
          sex: patientData.sex,
          nihss: patientData.nihss,
          occlusion: patientData.occlusionLocation,
          collaterals: patientData.collateralScore,
          onsetTime: patientData.onsetTime,
        },
        scenario: activeScenario,
        outcomes: {
          coreVolume: currentOutcomes.finalCoreVolume,
          penumbraSalvaged: currentOutcomes.penumbraSalvaged,
          reperfusionChance: currentOutcomes.reperfusionProbability
        }
      };

      const result = await api.chat({
        history,
        message: userMessage.content,
        context
      });

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result.response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm having trouble connecting to my brain right now. Please try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-neuro-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neuro-border-subtle bg-neuro-bg-tertiary/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neuro-salvaged/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-neuro-salvaged" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-neuro-text-primary">NeuroSim Assistant</h3>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-neuro-text-tertiary hover:text-neuro-text-primary hover:bg-neuro-bg-tertiary rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}
          >
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                message.type === 'user' ? 'bg-neuro-bg-tertiary' : 'bg-neuro-salvaged/20'
              )}
            >
              {message.type === 'user' ? (
                <User className="w-4 h-4 text-neuro-text-secondary" />
              ) : (
                <Bot className="w-4 h-4 text-neuro-salvaged" />
              )}
            </div>
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                message.type === 'user'
                  ? 'bg-cyan-700 text-white rounded-br-md'
                  : 'bg-neuro-bg-tertiary text-neuro-text-primary rounded-bl-md border border-neuro-border-subtle'
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-neuro-salvaged/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-neuro-salvaged" />
            </div>
            <div className="bg-neuro-bg-tertiary rounded-2xl rounded-bl-md border border-neuro-border-subtle px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 bg-neuro-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-neuro-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-neuro-text-tertiary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-neuro-border-subtle bg-neuro-bg-tertiary/50">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="flex-1 px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4 py-2.5 bg-neuro-salvaged text-white rounded-xl hover:bg-neuro-salvaged/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}

export function ChatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 text-neuro-text-secondary hover:text-neuro-text-primary hover:bg-neuro-bg-tertiary rounded-lg transition-colors"
      aria-label="Open chat"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-medium">Chat</span>
    </button>
  );
}
