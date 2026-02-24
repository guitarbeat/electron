import React, { useMemo, useRef, useState } from 'react';
import { useUser } from '../../context/UserContext';
import { pollingManager } from '../../services/PollingManager';
import { getAgentCapabilities } from '../../services/agentContext';
import { runAgentToolCalls } from '../../services/agentTools';
import { isGeminiConfigured, runAgentTurn } from '../../services/geminiService';
import Button from '../ui/Button';
import Card from '../ui/Card';
import Textarea from '../ui/Textarea';
import { colors, radius, shadows, spacing, typography } from '../../design-system/tokens';

type AgentChatRole = 'user' | 'assistant' | 'tool';

interface AgentChatItem {
  id: string;
  role: AgentChatRole;
  content: string;
  createdAt: string;
}

const suggestedPrompts = [
  'Add “The Princess Bride” to our queue.',
  'What are 3 unwatched movies we should pick for tonight?',
  'Accept the most recent suggestion and add it to the watchlist.',
  'Post a sweet message to the board from me.',
  'Show our pinned memories and summarize the vibe.',
];

const AgentPanel: React.FC = () => {
  const { currentUser } = useUser();
  const [items, setItems] = useState<AgentChatItem[]>(() => {
    return [
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'Hi! I can help manage your watchlist, memories, suggestions, messages, and spin history. What do you want to do?',
        createdAt: new Date().toISOString(),
      },
    ];
  });
  const [draft, setDraft] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const capabilities = useMemo(() => getAgentCapabilities(), []);
  const canRun = isGeminiConfigured();

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    });
  };

  const appendItem = (role: AgentChatRole, content: string) => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role, content, createdAt: new Date().toISOString() },
    ]);
  };

  const refreshAppData = async () => {
    await Promise.allSettled([
      pollingManager.refresh('movies'),
      pollingManager.refresh('memories'),
      pollingManager.refresh('suggestions'),
      pollingManager.refresh('messages'),
    ]);
  };

  const handleSend = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || isRunning) return;

    setDraft('');
    setError(null);
    setIsRunning(true);
    appendItem('user', trimmed);
    scrollToBottom();

    try {
      const turn = await runAgentTurn({ currentUser, message: trimmed });
      appendItem('assistant', turn.assistantMessage);
      scrollToBottom();

      if (turn.toolCalls.length > 0) {
        appendItem('tool', `Running ${turn.toolCalls.length} action(s)…`);
        scrollToBottom();

        const results = await runAgentToolCalls(turn.toolCalls, currentUser);
        const summaryLines = results.map((r) => {
          if (r.ok) return `✓ ${r.name}`;
          return `✗ ${r.name}: ${r.error || 'Failed'}`;
        });
        appendItem('tool', summaryLines.join('\n'));
        scrollToBottom();

        await refreshAppData();
      }
    } catch (e) {
      const messageText = e instanceof Error ? e.message : String(e);
      setError(messageText);
      appendItem('assistant', `Something went wrong: ${messageText}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '980px', margin: '0 auto' }}>
      <Card
        variant="elevated"
        style={{
          padding: spacing.md,
          borderRadius: radius.lg,
          border: `1px solid ${colors.borderSecondary}35`,
          background:
            'radial-gradient(circle at 10% 0%, rgba(135, 206, 250, 0.12), rgba(135, 206, 250, 0)), linear-gradient(145deg, rgba(23, 33, 58, 0.76), rgba(14, 23, 43, 0.82))',
          boxShadow: '0 14px 28px rgba(0,0,0,0.3)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            marginBottom: spacing.md,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: typography.fontFamily.heading.join(', '),
                letterSpacing: typography.letterSpacing.wide,
                textTransform: 'uppercase',
                textShadow: shadows.textGlow,
                fontSize: typography.fontSize.lg,
                color: colors.textPrimary,
              }}
            >
              Agent
            </div>
            <div style={{ fontSize: typography.fontSize.sm, color: colors.textSecondary }}>
              {currentUser ? `Signed in as ${currentUser}` : 'Pick a profile to enable actions'}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <Button variant="ghost" size="sm" onClick={() => setShowHelp((v) => !v)}>
              {showHelp ? 'Hide help' : 'Help'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setItems([
                  {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content:
                      'Fresh start. Tell me what you want to do, and I’ll take the actions for you.',
                    createdAt: new Date().toISOString(),
                  },
                ]);
              }}
            >
              Reset chat
            </Button>
          </div>
        </div>

        {!canRun && (
          <Card
            variant="outlined"
            style={{
              padding: spacing.md,
              borderRadius: radius.md,
              border: `1px solid ${colors.warning}80`,
              backgroundColor: `${colors.warning}10`,
              marginBottom: spacing.md,
            }}
          >
            <div style={{ color: colors.warning, fontSize: typography.fontSize.sm }}>
              Agent is not configured. Add `VITE_GEMINI_API_KEY` to your `.env` and reload.
            </div>
          </Card>
        )}

        {showHelp && (
          <Card
            variant="outlined"
            style={{
              padding: spacing.md,
              borderRadius: radius.md,
              border: `1px solid ${colors.borderSecondary}35`,
              backgroundColor: `${colors.surface}80`,
              marginBottom: spacing.md,
              whiteSpace: 'pre-wrap',
            }}
          >
            <div
              style={{
                color: colors.textPrimary,
                fontFamily: typography.fontFamily.heading.join(', '),
                marginBottom: spacing.sm,
              }}
            >
              What I can do
            </div>
            <div
              style={{
                color: colors.textSecondary,
                fontSize: typography.fontSize.sm,
                lineHeight: 1.6,
              }}
            >
              {capabilities.map((cap) => `- ${cap.name}: ${cap.description}`).join('\n')}
            </div>
          </Card>
        )}

        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            flexWrap: 'wrap',
            marginBottom: spacing.md,
          }}
        >
          {suggestedPrompts.map((prompt) => (
            <Button
              key={prompt}
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(prompt);
              }}
            >
              {prompt}
            </Button>
          ))}
        </div>

        <div
          ref={listRef}
          style={{
            height: 'min(52vh, 520px)',
            overflowY: 'auto',
            padding: spacing.md,
            backgroundColor: 'rgba(10, 11, 14, 0.35)',
            borderRadius: radius.md,
            border: `1px solid ${colors.borderSecondary}25`,
            marginBottom: spacing.md,
            display: 'flex',
            flexDirection: 'column',
            gap: spacing.sm,
          }}
        >
          {items.map((item) => {
            const isUser = item.role === 'user';
            const isTool = item.role === 'tool';
            const bubbleBg = isTool
              ? `${colors.surface}A0`
              : isUser
                ? `${colors.secondary}20`
                : `${colors.accentMuted}`;
            const border = isTool
              ? `1px solid ${colors.borderSecondary}35`
              : isUser
                ? `1px solid ${colors.secondary}60`
                : `1px solid ${colors.accent}35`;
            return (
              <div
                key={item.id}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '92%',
                }}
              >
                <div
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    borderRadius: radius.md,
                    backgroundColor: bubbleBg,
                    border,
                    boxShadow: isUser ? 'none' : '0 6px 16px rgba(0,0,0,0.25)',
                    whiteSpace: 'pre-wrap',
                    color: colors.textPrimary,
                    fontSize: typography.fontSize.sm,
                    lineHeight: 1.55,
                  }}
                >
                  {item.content}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: spacing.sm }}>
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            label="Message"
            placeholder="Tell me what you want to do…"
            disabled={isRunning || !canRun}
            style={{ minHeight: '96px' }}
          />
          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            {error && (
              <div style={{ color: colors.error, fontSize: typography.fontSize.sm }}>{error}</div>
            )}
            <Button
              variant="primary"
              size="md"
              isLoading={isRunning}
              loadingText="Thinking…"
              disabled={!draft.trim() || isRunning || !canRun}
              onClick={() => handleSend(draft)}
            >
              Send
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AgentPanel;
