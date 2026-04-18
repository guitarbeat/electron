import React, { useState } from 'react';
import './FishTank.css';

const FishTank: React.FC = () => {
  const [isOn, setIsOn] = useState(true);

  const handlePowerClick = () => {
    setIsOn((prev) => !prev);
  };

  return (
    <div className="fish-tank-wrapper">
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
          onClick={handlePowerClick}
          aria-label={isOn ? 'Turn off fish tank' : 'Turn on fish tank'}
        />
      </div>
    </div>
  );
};

export default FishTank;
