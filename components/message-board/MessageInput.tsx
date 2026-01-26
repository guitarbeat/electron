import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from '../icons';
import { colors, spacing, typography, borders, radius } from '../../design-system/tokens';
import { User } from '../../types';

interface MessageInputProps {
  currentUser: User | null;
  isSubmitting: boolean;
  onSend: (author: string, content: string) => Promise<void>;
  onError: (error: string) => void;
}

const MAX_MESSAGE_LENGTH = 500;
const MAX_AUTHOR_LENGTH = 50;

const MessageInput: React.FC<MessageInputProps> = ({
  currentUser,
  isSubmitting,
  onSend,
  onError,
}) => {
  const [author, setAuthor] = useState(currentUser || '');
  const [content, setContent] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // * Auto-resize textarea based on content
  useEffect(() => {
    const textarea = contentTextareaRef.current;
    if (textarea) {
      requestAnimationFrame(() => {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 120); // * Max 120px (matches maxHeight)
        textarea.style.height = `${Math.max(newHeight, 44)}px`; // * Min 44px
      });
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // * Blur active element to dismiss iOS keyboard before validation
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }

    if (!content.trim()) {
      setSubmitError('Please enter a message');
      // * Delay focus to allow keyboard to dismiss on iOS
      setTimeout(() => {
        contentTextareaRef.current?.focus();
      }, 100);
      return;
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      setSubmitError(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`);
      return;
    }

    if (author.length > MAX_AUTHOR_LENGTH) {
      setSubmitError(`Name is too long (max ${MAX_AUTHOR_LENGTH} characters)`);
      return;
    }

    if (!isSubmitting) {
      try {
        await onSend(author, content);
        setContent(''); // Clear content on success

        // * Delay focus to allow keyboard to dismiss on iOS after submission
        setTimeout(() => {
          contentTextareaRef.current?.focus();
        }, 300);
      } catch (err: any) {
        setSubmitError(err.message || 'Failed to post message');
        onError(err.message || 'Failed to post message');
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // * Allow submitting with Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <div
      style={{
        background: colors.surface,
        padding: spacing.sm,
        borderTop: `1px solid ${colors.borderInset}`,
      }}
    >
      <form
        onSubmit={handleSubmit}
        aria-label="Post a new message"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.sm,
        }}
      >
        {/* Author field - compact inline */}
        {!currentUser && (
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <label
              htmlFor="message-author"
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.textTertiary,
                whiteSpace: 'nowrap',
                fontWeight: typography.fontWeight.bold,
              }}
            >
              FROM:
            </label>
            <input
              id="message-author"
              type="text"
              value={author}
              onChange={(e) => {
                const value = e.target.value.slice(0, MAX_AUTHOR_LENGTH);
                setAuthor(value);
                setSubmitError(null);
              }}
              placeholder="YOUR NAME"
              maxLength={MAX_AUTHOR_LENGTH}
              disabled={isSubmitting}
              aria-label="Your name"
              style={{
                flex: 1,
                padding: `${spacing.xs} ${spacing.sm}`,
                backgroundColor: '#000',
                border: borders.inputInset,
                borderRadius: 0, // Retro sharp corners
                color: colors.secondary,
                fontSize: typography.fontSize.sm,
                fontFamily: typography.fontFamily.mono.join(', '),
                outline: 'none',
                transition: 'all 0.2s ease',
                letterSpacing: '0.05em',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.secondary;
                e.currentTarget.style.boxShadow = `0 0 8px ${colors.secondary}40`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.borderInset;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
        )}

        {/* Message input and send button - chat bar style */}
        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <label htmlFor="message-content" className="sr-only">
              Message content
            </label>
            <textarea
              id="message-content"
              ref={contentTextareaRef}
              value={content}
              onChange={(e) => {
                const value = e.target.value.slice(0, MAX_MESSAGE_LENGTH);
                setContent(value);
                setSubmitError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              maxLength={MAX_MESSAGE_LENGTH}
              rows={1}
              disabled={isSubmitting}
              aria-label="Message content"
              aria-invalid={submitError ? 'true' : 'false'}
              style={{
                width: '100%',
                padding: `${spacing.sm} ${spacing.md}`,
                backgroundColor: '#fff', // White background for classic chat feel
                border: borders.inputInset,
                borderRadius: 0, // Sharp corners
                color: '#000', // Black text
                fontSize: typography.fontSize.base,
                fontFamily: 'Arial, sans-serif', // Classic chat font
                lineHeight: typography.lineHeight.normal,
                resize: 'none',
                minHeight: '44px',
                maxHeight: '120px',
                outline: 'none',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.accent;
                e.currentTarget.style.boxShadow = `inset 0 0 4px rgba(0,0,0,0.2)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.borderInset;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />

            {/* Character count - subtle */}
            {content.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: spacing.xs,
                  right: spacing.sm,
                  fontSize: typography.fontSize.xs,
                  color:
                    content.length > MAX_MESSAGE_LENGTH * 0.9
                      ? content.length >= MAX_MESSAGE_LENGTH
                        ? colors.error
                        : colors.warning
                      : '#666',
                  pointerEvents: 'none',
                  opacity: 0.6,
                  fontFamily: typography.fontFamily.mono.join(', '),
                }}
              >
                {content.length}/{MAX_MESSAGE_LENGTH}
              </div>
            )}
          </div>

          {/* Send button - Retro Windows Button */}
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting || content.length > MAX_MESSAGE_LENGTH}
            aria-label="Send message"
            style={{
              width: '60px',
              height: '44px',
              borderRadius: 0, // Sharp corners
              backgroundColor: '#c0c0c0',
              border: '2px outset #fff',
              borderRightColor: '#404040',
              borderBottomColor: '#404040',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor:
                content.trim() && content.length <= MAX_MESSAGE_LENGTH && !isSubmitting
                  ? 'pointer'
                  : 'not-allowed',
              boxShadow: '1px 1px 0px #000',
              transition: 'all 0.1s ease',
              fontWeight: 'bold',
              fontSize: '14px',
            }}
            onMouseDown={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.border = '2px inset #fff';
                e.currentTarget.style.borderRightColor = '#dfdfdf';
                e.currentTarget.style.borderBottomColor = '#dfdfdf';
                e.currentTarget.style.transform = 'translate(1px, 1px)';
              }
            }}
            onMouseUp={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.border = '2px outset #fff';
                e.currentTarget.style.borderRightColor = '#404040';
                e.currentTarget.style.borderBottomColor = '#404040';
                e.currentTarget.style.transform = 'translate(0, 0)';
              }
            }}
          >
            {isSubmitting ? (
              <Spinner style={{ width: '16px', height: '16px', color: '#000' }} />
            ) : (
              'Send'
            )}
          </button>
        </div>

        {/* Error message */}
        {submitError && (
          <div
            id="submit-error"
            style={{
              color: colors.error,
              fontSize: typography.fontSize.xs,
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: colors.error + '20',
              borderRadius: radius.sm,
              border: `1px solid ${colors.error}40`,
            }}
            role="alert"
            aria-live="polite"
          >
            {submitError}
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
