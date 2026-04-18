import React, { useState, useCallback, useRef, useEffect } from 'react';
import './FishTank.css';

const FishTank: React.FC = () => {
  const [isOn, setIsOn] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const dragStartTimeRef = useRef(0);
  const initialElementPosRef = useRef({ x: 0, y: 0 });
  
  const dragThreshold = 8; // pixels to consider drag
  const clickTimeThreshold = 300; // ms max for click

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Save initial data
    dragStartPosRef.current = { x: e.pageX, y: e.pageY };
    dragStartTimeRef.current = Date.now();
    isDraggingRef.current = false;
    
    // Save current element position
    initialElementPosRef.current = { ...position };
  }, [position]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragStartTimeRef.current > 0) {
        const deltaX = e.pageX - dragStartPosRef.current.x;
        const deltaY = e.pageY - dragStartPosRef.current.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Detect if this is a drag
        if (distance > dragThreshold && !isDraggingRef.current) {
          isDraggingRef.current = true;
        }
        
        if (isDraggingRef.current && containerRef.current) {
          setPosition({
            x: initialElementPosRef.current.x + deltaX,
            y: initialElementPosRef.current.y + deltaY,
          });
        }
      }
    };

    const handleMouseUp = () => {
      if (dragStartTimeRef.current > 0) {
        const clickDuration = Date.now() - dragStartTimeRef.current;
        
        if (!isDraggingRef.current && clickDuration < clickTimeThreshold) {
          // CLICK - toggle power
          setIsOn((prev) => !prev);
        }
        // If dragging, position is already updated via mousemove
        
        // Reset variables
        isDraggingRef.current = false;
        dragStartTimeRef.current = 0;
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div 
      className="fish-tank-wrapper"
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="container">
        <div className={`tank${!isOn ? ' tank-off' : ''}`}>
          <div
            className="bg far ani"
            style={{ animationPlayState: isOn ? 'running' : 'paused' }}
          />
          <div
            className="bg bgfish ani"
            style={{ animationPlayState: isOn ? 'running' : 'paused' }}
          />
          <div className="fish">
            <div
              className="zebra ani"
              style={{ animationPlayState: isOn ? 'running' : 'paused' }}
            />
            <div
              className="clown1 ani"
              style={{ animationPlayState: isOn ? 'running' : 'paused' }}
            />
            <div
              className="butter ani"
              style={{ animationPlayState: isOn ? 'running' : 'paused' }}
            />
          </div>
          <div
            className="bg near ani"
            style={{ animationPlayState: isOn ? 'running' : 'paused' }}
          />
          <div className={`overlay${!isOn ? ' overlay-off' : ''}`} />
        </div>
        <button
          id="pwrbtn"
          data-on={isOn ? 'true' : 'false'}
          onMouseDown={handleMouseDown}
          aria-label={isOn ? 'Turn off fish tank' : 'Turn on fish tank'}
        />
      </div>
    </div>
  );
};

export default FishTank;
