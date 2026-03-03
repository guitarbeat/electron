import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from '../common/icons';
import { spacing, typography, colors } from '../../design-system/tokens';
import { User } from '../../types';
import { MAX_MESSAGE_LENGTH, MAX_AUTHOR_LENGTH } from '../../config/security';

interface MessageInputProps {
  currentUser: User | null;
  isSubmitting: boolean;
  onSend: (author: string, content: string) => Promise<void>;
  onError: (error: string) => void;
}

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

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = contentTextareaRef.current;
    if (textarea) {
      requestAnimationFrame(() => {
        textarea.style.height = 'auto';
        const newHeight = Math.min(textarea.scrollHeight, 100);
        textarea.style.height = `${Math.max(newHeight, 36)}px`;
      });
    }
  }, [content]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Blur active element to dismiss iOS keyboard before validation
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }

    if (!content.trim()) {
      setSubmitError('Please enter a message');
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
        setContent('');

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
    // Allow submitting with Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      const { form } = e.currentTarget;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const showSendButton = content.trim().length > 0;

  return (
    <div
      style={{
        background: colors.surface,
        padding: `${spacing.sm} ${spacing.md}`,
        borderTop: `1px solid ${colors.accentMuted}`,
        paddingBottom: 'max(env(safe-area-inset-bottom), 12px)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        aria-label="Post a new message"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: spacing.xs,
        }}
      >
        {/* Author field - iOS style when no current user */}
        {!currentUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: spacing.xs,
              marginBottom: spacing.xs,
            }}
          >
            <label
              htmlFor="message-author"
              style={{
                fontSize: '13px',
                color: colors.textSecondary,
                whiteSpace: 'nowrap',
                fontWeight: 500,
                fontFamily: typography.fontFamily.body.join(', '),
              }}
            >
              From:
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
              placeholder="Your name"
              maxLength={MAX_AUTHOR_LENGTH}
              disabled={isSubmitting}
              aria-label="Your name"
              style={{
                flex: 1,
                padding: '8px 12px',
                backgroundColor: colors.surfaceElevated,
                border: `1px solid ${colors.borderInset}`,
                borderRadius: '18px',
                color: colors.textPrimary,
                fontSize: '15px',
                fontFamily: typography.fontFamily.body.join(', '),
                outline: 'none',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.secondary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.borderInset;
              }}
            />
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: spacing.sm,
            alignItems: 'flex-end',
          }}
        >
          {/* Camera button placeholder */}
          <button
            type="button"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: colors.textSecondary,
              flexShrink: 0,
            }}
            aria-label="Camera"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>

          {/* Text input */}
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
              placeholder="Write a message..."
              maxLength={MAX_MESSAGE_LENGTH}
              rows={1}
              disabled={isSubmitting}
              aria-label="Message content"
              aria-invalid={submitError ? 'true' : 'false'}
              style={{
                width: '100%',
                padding: '8px 40px 8px 16px',
                backgroundColor: colors.surfaceElevated,
                border: `1px solid ${colors.borderInset}`,
                borderRadius: '18px',
                color: colors.textPrimary,
                fontSize: '17px',
                fontFamily: typography.fontFamily.body.join(', '),
                lineHeight: 1.25,
                resize: 'none',
                minHeight: '36px',
                maxHeight: '100px',
                outline: 'none',
                transition: 'border-color 0.2s ease',
                overflow: 'hidden',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = colors.secondary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = colors.borderInset;
              }}
            />

            {/* Character count - subtle iOS style */}
            {content.length > MAX_MESSAGE_LENGTH * 0.8 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '12px',
                  fontSize: '11px',
                  color: content.length >= MAX_MESSAGE_LENGTH ? colors.error : colors.textSecondary,
                  fontFamily: typography.fontFamily.body.join(', '),
                  pointerEvents: 'none',
                }}
              >
                {MAX_MESSAGE_LENGTH - content.length}
              </div>
            )}
          </div>

          {/* Send button - iOS blue circle with arrow */}
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting || content.length > MAX_MESSAGE_LENGTH}
            aria-label="Send message"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: showSendButton ? colors.secondary : 'transparent',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor:
                content.trim() && content.length <= MAX_MESSAGE_LENGTH && !isSubmitting
                  ? 'pointer'
                  : 'default',
              transition: 'all 0.2s ease',
              flexShrink: 0,
              opacity: showSendButton ? 1 : 0.5,
              transform: showSendButton ? 'scale(1)' : 'scale(0.9)',
            }}
          >
            {isSubmitting ? (
              <Spinner style={{ width: '18px', height: '18px', color: '#fff' }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke={showSendButton ? '#000000' : colors.textSecondary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Error message - iOS style */}
        {submitError && (
          <div
            id="submit-error"
            style={{
              color: '#ff3b30',
              fontSize: '13px',
              padding: `${spacing.xs} ${spacing.sm}`,
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              borderRadius: '8px',
              fontFamily: typography.fontFamily.body.join(', '),
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
