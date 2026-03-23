import React, { useEffect, useRef, useState } from 'react';

interface LoadingSequenceProps {
  onReveal?: () => void;
  onComplete?: () => void;
}

const LoadingSequence: React.FC<LoadingSequenceProps> = ({ onReveal, onComplete }) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const onRevealRef = useRef(onReveal);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onRevealRef.current = onReveal;
    onCompleteRef.current = onComplete;
  }, [onComplete, onReveal]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const revealTimer = window.setTimeout(() => {
      setIsRevealed(true);
    }, 500);

    const moireTimer = window.setTimeout(() => {
      onRevealRef.current?.();
    }, 700);

    const completeTimer = window.setTimeout(() => {
      document.body.style.overflow = previousOverflow;
      onCompleteRef.current?.();
    }, 2000);

    return () => {
      window.clearTimeout(revealTimer);
      window.clearTimeout(moireTimer);
      window.clearTimeout(completeTimer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="loading-sequence" aria-hidden="true">
      <div
        id="MaskTop"
        className={`loading-sequence__mask loading-sequence__mask--top${
          isRevealed ? ' loading-sequence__mask--revealed' : ''
        }`}
      />
      <div
        id="MaskBottom"
        className={`loading-sequence__mask loading-sequence__mask--bottom${
          isRevealed ? ' loading-sequence__mask--revealed' : ''
        }`}
      />
    </div>
  );
};

export default LoadingSequence;
