import { useState, useRef, useEffect } from 'react';
import type { ChatMessage, TripPlanResponse } from '../types';
import { modifyTrip } from '../api';

interface TripCopilotProps {
  plan: TripPlanResponse;
  onPlanUpdate: (updated: TripPlanResponse) => void;
  onOpenApiKeyModal: () => void;
}

export default function TripCopilot({ plan, onPlanUpdate, onOpenApiKeyModal }: TripCopilotProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `👋 Hi! I'm your **Tripwise Copilot**. I can tailor your ${plan.trip.destination} itinerary in real time.\n\nTry asking me to:\n- 💰 **"Cut down the budget by 5000"**\n- 🏛 **"Visit ${plan.attractions[0]?.name || 'the main attraction'} first"**\n- 🚆 **"Switch transport to Train"**\n- ⚡ **"Make pace more relaxed"**`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recentChanges, setRecentChanges] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setRecentChanges([]);

    try {
      const response = await modifyTrip({
        currentPlan: plan,
        message: text,
        conversationHistory: [...messages, userMsg],
      });

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: response.replyMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.changesMade && response.changesMade.length > 0) {
        setRecentChanges(response.changesMade);
      }
      onPlanUpdate(response.updatedPlan);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Could not modify plan';
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `⚠️ Sorry, I encountered an issue updating the trip: ${errMsg}. Please try again.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const firstAttraction = plan.attractions[0]?.name || 'attraction';

  const quickPrompts = [
    { label: '💰 Cut budget by ₹5,000', text: 'cut down the budget by 5000' },
    { label: `🏛 Visit ${firstAttraction} first`, text: `i want to visit ${firstAttraction} first` },
    { label: '🚆 Switch to Train', text: 'switch transport to train' },
    { label: '⚡ Relaxed pace', text: 'make the schedule more relaxed' },
    { label: '🍽 Add food stops', text: 'add authentic local food and cafe stops' },
  ];

  return (
    <div className={`trip-copilot-container ${isOpen ? 'open' : 'minimized'}`}>
      {/* Header */}
      <div className="copilot-header" onClick={() => setIsOpen(!isOpen)}>
        <div className="copilot-header-title">
          <div className="copilot-avatar">✨</div>
          <div>
            <div className="copilot-title-text">
              Tripwise Copilot
              <span className="copilot-status-dot" title="Ready to modify plan" />
            </div>
            <div className="copilot-subtitle">Live AI Itinerary Assistant</div>
          </div>
        </div>

        <div className="copilot-header-actions" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="copilot-settings-btn"
            title="AI Model & API Key Settings"
            onClick={onOpenApiKeyModal}
          >
            ⚙️ Key
          </button>
          <button
            type="button"
            className="copilot-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Minimize Copilot' : 'Expand Copilot'}
          >
            {isOpen ? '—' : '💬'}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="copilot-body">
          {/* Quick chips */}
          <div className="copilot-quick-chips">
            {quickPrompts.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                className="copilot-chip"
                onClick={() => handleSend(chip.text)}
                disabled={loading}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Messages list */}
          <div className="copilot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`copilot-msg-row ${msg.role}`}>
                <div className={`copilot-bubble ${msg.role}`}>
                  <div className="copilot-msg-text">
                    {msg.content.split('\n').map((line, lIdx) => (
                      <p key={lIdx} style={{ margin: line ? '0 0 6px 0' : '0 0 2px 0' }}>
                        {line.startsWith('- ') ? (
                          <span>&bull; {line.slice(2)}</span>
                        ) : (
                          line
                        )}
                      </p>
                    ))}
                  </div>
                  {msg.timestamp && <span className="copilot-msg-time">{msg.timestamp}</span>}
                </div>
              </div>
            ))}

            {loading && (
              <div className="copilot-msg-row assistant">
                <div className="copilot-bubble assistant loading">
                  <div className="copilot-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="typing-text">Updating your trip plan...</span>
                </div>
              </div>
            )}

            {recentChanges.length > 0 && (
              <div className="copilot-changes-badge">
                <div className="changes-title">✓ Plan Updated:</div>
                <ul>
                  {recentChanges.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input box */}
          <form
            className="copilot-input-bar"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <input
              type="text"
              className="copilot-input"
              placeholder="e.g. cut budget by 5000, visit Mehtab Bagh first..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="copilot-send-btn"
              disabled={!input.trim() || loading}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
