import React from 'react';
import { MEMORY_MENTION_REGEX } from './memoryUtils';

interface MemoryNoteTextProps {
  text: string;
}

const mentionStyle: React.CSSProperties = {
  fontWeight: 700,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
};

const MemoryNoteText: React.FC<MemoryNoteTextProps> = ({ text }) => {
  const parts = text.split(MEMORY_MENTION_REGEX);

  return (
    <>
      {parts.map((part, index) => {
        const normalized = part.toLowerCase();
        if (normalized !== '@aaron' && normalized !== '@electra') {
          return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
        }

        const color = normalized === '@aaron' ? '#376dff' : '#e45858';
        return (
          <span
            key={`${part}-${index}`}
            style={{
              ...mentionStyle,
              color,
            }}
          >
            {part}
          </span>
        );
      })}
    </>
  );
};

export default MemoryNoteText;
