import { useState, useEffect } from 'react';

const questions = [
  {
    id: 'q1',
    type: 'multiple-choice',
    question: "What's your ideal Friday night?",
    options: [
      { text: 'Watching movies at home', char: 'Aaron' },
      { text: 'Going out to a party', char: 'Madeleine' },
      { text: 'Reading a book alone', char: 'Nosferatu' },
      { text: 'Hanging with close friends', char: 'Electra' },
    ],
  },
  {
    id: 'q2',
    type: 'multiple-choice',
    question: 'Pick your favorite color palette:',
    options: [
      { text: 'Warm and vibrant', char: 'Electra' },
      { text: 'Cool and calming', char: 'Aaron' },
      { text: 'Bold and dramatic', char: 'Madeleine' },
      { text: 'Dark and mysterious', char: 'Nosferatu' },
    ],
  },
  {
    id: 'q3',
    type: 'agree-disagree',
    question: 'I prefer spontaneity over planning.',
  },
  {
    id: 'q4',
    type: 'multiple-choice',
    question: 'How do you handle stress?',
    options: [
      { text: 'Talk it out with friends', char: 'Electra' },
      { text: 'Process it internally', char: 'Aaron' },
      { text: 'Distract myself with activities', char: 'Madeleine' },
      { text: 'Embrace the chaos', char: 'Nosferatu' },
    ],
  },
  {
    id: 'q5',
    type: 'multiple-choice',
    question: 'Choose your spirit animal:',
    options: [
      { text: '🦋 Butterfly', char: 'Electra' },
      { text: '🦉 Owl', char: 'Aaron' },
      { text: '🦁 Lion', char: 'Madeleine' },
      { text: '🦅 Raven', char: 'Nosferatu' },
    ],
  },
];

const results: Record<string, { title: string; desc: string; color: string; emoji: string }> = {
  Electra: {
    title: 'ELECTRA!!!',
    desc: "You're vibrant, social, and full of energy! You light up every room you enter! CONGRATULATIONS!!!",
    color: '#ff69b4',
    emoji: '💖',
  },
  Aaron: {
    title: 'AARON!!!',
    desc: "You're thoughtful, introspective, and value deep connections. You prefer quality over quantity! AMAZING!!!",
    color: '#00bfff',
    emoji: '🦉',
  },
  Madeleine: {
    title: 'MADELEINE!!!',
    desc: "You're bold, confident, and love to stand out. You're not afraid to take the spotlight! FANTASTIC!!!",
    color: '#ffd700',
    emoji: '👑',
  },
  Nosferatu: {
    title: 'NOSFERATU/SMEEMO!!!',
    desc: "You're mysterious, unique, and march to the beat of your own drum. You embrace the unconventional! INCREDIBLE!!!",
    color: '#9400d3',
    emoji: '🦇',
  },
};

const BLINK_COLORS = ['#ff0000', '#ff7700', '#ffff00', '#00ff00', '#0000ff', '#8b00ff'];

function BlinkText({ children, style = {} }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [colorIdx, setColorIdx] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setColorIdx(i => (i + 1) % BLINK_COLORS.length), 250);
    return () => clearInterval(id);
  }, []);
  return (
    <span style={{ color: BLINK_COLORS[colorIdx], fontWeight: 900, ...style }}>
      {children}
    </span>
  );
}

function MarqueeText({ text }: { text: string }) {
  return (
    <div style={{
      overflow: 'hidden',
      background: '#000080',
      color: '#ffff00',
      fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
      fontSize: '13px',
      fontWeight: 'bold',
      padding: '4px 0',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ display: 'inline-block', animation: 'marquee 12s linear infinite' }}>
        {text}&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;{text}&nbsp;&nbsp;&nbsp;★&nbsp;&nbsp;&nbsp;{text}
      </span>
    </div>
  );
}

function RainbowBorder({ children }: { children: React.ReactNode }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 150);
    return () => clearInterval(id);
  }, []);
  const offset = tick % BLINK_COLORS.length;
  const gradient = [...BLINK_COLORS.slice(offset), ...BLINK_COLORS.slice(0, offset)].join(', ');
  return (
    <div style={{
      padding: '4px',
      background: `linear-gradient(90deg, ${gradient})`,
      borderRadius: '4px',
    }}>
      {children}
    </div>
  );
}

export function InternetAdQuiz() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [agreeVal, setAgreeVal] = useState(50);
  const [done, setDone] = useState(false);
  const [winnerChar, setWinnerChar] = useState('Electra');

  const q = questions[step];
  const total = questions.length;
  const progress = Math.round(((step) / total) * 100);

  const handleSelect = (char: string) => {
    setAnswers(prev => ({ ...prev, [q.id]: char }));
  };

  const handleNext = () => {
    if (q.type === 'agree-disagree') {
      const charMap: Record<string, string> = {
        '0': 'Aaron',
        '1': 'Aaron',
        '2': 'Madeleine',
        '3': 'Electra',
        '4': 'Nosferatu',
      };
      const bucket = Math.min(4, Math.floor(agreeVal / 20)).toString();
      setAnswers(prev => ({ ...prev, [q.id]: charMap[bucket] || 'Electra' }));
    }
    if (step < total - 1) {
      setStep(s => s + 1);
    } else {
      const counts: Record<string, number> = { Electra: 0, Aaron: 0, Madeleine: 0, Nosferatu: 0 };
      const all = { ...answers };
      if (q.type === 'agree-disagree') {
        const bucket = Math.min(4, Math.floor(agreeVal / 20));
        const charMap: Record<number, string> = { 0: 'Aaron', 1: 'Aaron', 2: 'Madeleine', 3: 'Electra', 4: 'Nosferatu' };
        all[q.id] = charMap[bucket] || 'Electra';
      }
      Object.values(all).forEach(c => {
        if (c in counts) counts[c as string]++;
      });
      const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      setWinnerChar(winner);
      setDone(true);
    }
  };

  const canProceed = q.type === 'agree-disagree' ? true : answers[q.id] !== undefined;

  const resultData = results[winnerChar] || results['Electra'];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23ffff00\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23ffff00\'/%3E%3Crect x=\'10\' y=\'0\' width=\'10\' height=\'10\' fill=\'%23ff8c00\'/%3E%3Crect x=\'0\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23ff8c00\'/%3E%3C/svg%3E")',
      fontFamily: '"Comic Sans MS", "Comic Sans", cursive',
      padding: '12px',
      boxSizing: 'border-box',
    }}>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(100vw); } 100% { transform: translateX(-200%); } }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes flashbg { 0%, 100% { background-color: #ff0000; } 33% { background-color: #ffff00; } 66% { background-color: #00ff00; } }
        @keyframes pulse-border { 0%, 100% { box-shadow: 0 0 0 3px #ff0000, 0 0 0 6px #ffff00; } 50% { box-shadow: 0 0 0 3px #00ff00, 0 0 0 6px #ff0000; } }
        .star-spin { animation: spin 2s linear infinite; display: inline-block; }
        .btn-bounce:hover { animation: bounce 0.4s ease infinite; }
        .btn-ad {
          background: linear-gradient(180deg, #fffb00 0%, #ff8800 50%, #fffb00 100%);
          border: 3px outset #888;
          color: #000080;
          font-family: "Comic Sans MS", "Comic Sans", cursive;
          font-weight: 900;
          font-size: 15px;
          padding: 8px 18px;
          cursor: pointer;
          text-shadow: 1px 1px 0 #fff;
          letter-spacing: 1px;
        }
        .btn-ad:hover { background: linear-gradient(180deg, #ff8800 0%, #fffb00 50%, #ff8800 100%); border-style: inset; }
        .btn-ad:disabled { opacity: 0.5; cursor: not-allowed; }
        .option-btn {
          display: block;
          width: 100%;
          text-align: left;
          margin-bottom: 6px;
          background: linear-gradient(180deg, #ffffff 0%, #c8c8ff 100%);
          border: 3px outset #888;
          font-family: "Comic Sans MS", "Comic Sans", cursive;
          font-size: 14px;
          font-weight: bold;
          color: #000080;
          padding: 8px 12px;
          cursor: pointer;
        }
        .option-btn.selected {
          background: linear-gradient(180deg, #00cc00 0%, #006600 100%);
          color: #ffffff;
          border-style: inset;
          text-shadow: 1px 1px 2px #000;
        }
        .option-btn:hover:not(.selected) { background: linear-gradient(180deg, #ffff88 0%, #ffcc00 100%); }
        .win-flash { animation: flashbg 0.5s ease infinite; }
        .progress-cell { 
          width: 18px; height: 18px; display: inline-block; margin: 1px;
          border: 2px inset #888;
        }
      `}</style>

      <MarqueeText text="★★★ CLICK HERE TO DISCOVER YOUR TRUE PERSONALITY!!! ★★★ LIMITED TIME OFFER!!! ★★★ 100% FREE!!! ★★★" />

      <RainbowBorder>
        <div style={{ background: '#000080', padding: '2px 8px', textAlign: 'center' }}>
          <span style={{ color: '#ffffff', fontSize: '11px', fontWeight: 'bold', letterSpacing: '2px' }}>
            ★ PERSONALITY QUIZ - FIND OUT WHO YOU REALLY ARE!!! ★
          </span>
        </div>
      </RainbowBorder>

      <div style={{
        background: 'linear-gradient(180deg, #c8c8ff 0%, #9898ff 100%)',
        border: '4px inset #888',
        marginTop: '6px',
        padding: '10px',
      }}>
        {/* Header banner */}
        <div style={{
          background: 'linear-gradient(135deg, #ff0000, #ff7700, #ffff00, #00ff00, #0000ff, #8b00ff)',
          padding: '8px',
          textAlign: 'center',
          marginBottom: '10px',
          border: '3px outset #fff',
        }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', textShadow: '2px 2px 4px #000, -1px -1px 0 #000', lineHeight: 1.1 }}>
            🌟 WHICH CHARACTER ARE YOU?! 🌟
          </div>
          <div style={{ fontSize: '11px', color: '#ffff00', fontWeight: 'bold', textShadow: '1px 1px 0 #000' }}>
            *** TAKE THE OFFICIAL QUIZ NOW - IT'S TOTALLY FREE!!! ***
          </div>
        </div>

        {!done ? (
          <>
            {/* Progress section */}
            <div style={{
              background: '#000',
              border: '3px inset #888',
              padding: '6px',
              marginBottom: '8px',
              textAlign: 'center',
            }}>
              <div style={{ color: '#00ff00', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                LOADING YOUR DESTINY... QUESTION {step + 1} OF {total}!!!
              </div>
              <div style={{ background: '#001100', border: '2px inset #444', height: '22px', position: 'relative', overflow: 'hidden' }}>
                <div style={{
                  width: `${progress}%`,
                  height: '100%',
                  background: 'repeating-linear-gradient(90deg, #00cc00 0px, #00cc00 16px, #008800 16px, #008800 20px)',
                  transition: 'width 0.4s steps(5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                </div>
                <div style={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#ffffff', fontSize: '11px', fontWeight: 'bold', textShadow: '1px 1px 0 #000',
                }}>
                  {progress}% COMPLETE
                </div>
              </div>
              <div style={{ color: '#ffff00', fontSize: '10px', marginTop: '3px' }}>
                ⚡ ONLY {total - step} QUESTIONS REMAINING!!! ACT NOW!!! ⚡
              </div>
            </div>

            {/* Question card */}
            <div style={{
              background: '#ffffff',
              border: '4px outset #888',
              padding: '10px',
              marginBottom: '8px',
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #000080, #4040cc, #000080)',
                color: '#ffff00',
                padding: '6px 10px',
                marginBottom: '10px',
                fontSize: '12px',
                fontWeight: 'bold',
                textAlign: 'center',
                letterSpacing: '1px',
              }}>
                ▶ QUESTION {step + 1}: <BlinkText>ANSWER CAREFULLY!!!</BlinkText>
              </div>

              <div style={{
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#000080',
                textAlign: 'center',
                marginBottom: '12px',
                textShadow: '1px 1px 0 #ccc',
              }}>
                {q.question}
              </div>

              {q.type === 'multiple-choice' && q.options && (
                <div>
                  {q.options.map((opt, i) => (
                    <button
                      key={i}
                      className={`option-btn${answers[q.id] === opt.char ? ' selected' : ''}`}
                      onClick={() => handleSelect(opt.char, i)}
                    >
                      {answers[q.id] === opt.char ? '✅ ' : '◻ '} {opt.text}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'agree-disagree' && (
                <div style={{ padding: '0 8px' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: '#000080',
                    marginBottom: '6px',
                  }}>
                    <span>😤 STRONGLY DISAGREE</span>
                    <span>🤩 STRONGLY AGREE</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={agreeVal}
                    onChange={e => setAgreeVal(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#000080', cursor: 'pointer' }}
                  />
                  <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '14px', fontWeight: 'bold', color: '#cc0000' }}>
                    {agreeVal <= 20 && '😤 STRONGLY DISAGREE!!!'}
                    {agreeVal > 20 && agreeVal <= 40 && '🙁 DISAGREE!'}
                    {agreeVal > 40 && agreeVal <= 60 && '😐 NEUTRAL...'}
                    {agreeVal > 60 && agreeVal <= 80 && '😊 AGREE!'}
                    {agreeVal > 80 && '🤩 STRONGLY AGREE!!!'}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '10px', color: '#888', marginTop: '2px' }}>
                    DRAG THE SLIDER TO ANSWER!!!
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div style={{ textAlign: 'center', marginBottom: '8px' }}>
              <button
                className="btn-ad btn-bounce"
                onClick={handleNext}
                disabled={!canProceed}
              >
                {step < total - 1 ? '>>> NEXT QUESTION >>>' : '🌟 SEE MY RESULTS!!! 🌟'}
              </button>
            </div>

            {/* Ad sidebar elements */}
            <div style={{
              background: 'linear-gradient(180deg, #ffff00, #ff8800)',
              border: '3px outset #888',
              padding: '6px',
              textAlign: 'center',
              animation: 'pulse-border 1s ease infinite',
            }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000080' }}>
                ⭐ YOU COULD BE A WINNER!!! ⭐
              </div>
              <div style={{ fontSize: '10px', color: '#cc0000' }}>
                Complete the quiz to discover your TRUE personality type!!!
              </div>
              <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
                * Results are 100% scientific and totally official *
              </div>
            </div>
          </>
        ) : (
          /* Results screen */
          <div>
            <div style={{
              textAlign: 'center',
              background: '#000',
              border: '4px outset #fff',
              padding: '8px',
              marginBottom: '10px',
              animation: 'pulse-border 0.8s ease infinite',
            }}>
              <div className="star-spin" style={{ fontSize: '36px' }}>⭐</div>
              <BlinkText style={{ fontSize: '18px', display: 'block' }}>
                CONGRATULATIONS!!!
              </BlinkText>
              <div style={{ color: '#ffff00', fontSize: '12px', fontWeight: 'bold' }}>
                YOUR RESULTS ARE IN!!!
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(180deg, #ffffff, #f0f0ff)',
              border: '4px outset #888',
              padding: '12px',
              textAlign: 'center',
              marginBottom: '8px',
            }}>
              <div style={{ fontSize: '12px', color: '#000080', fontWeight: 'bold', marginBottom: '4px' }}>
                🔬 SCIENTIFIC ANALYSIS COMPLETE!!! 🔬
              </div>
              <div style={{ fontSize: '16px', color: '#000080', marginBottom: '6px' }}>
                YOU ARE...
              </div>
              <div style={{
                fontSize: '28px',
                fontWeight: 900,
                color: resultData.color,
                textShadow: `3px 3px 0 #000, -1px -1px 0 #000`,
                marginBottom: '6px',
                lineHeight: 1.1,
              }}>
                {resultData.emoji} {resultData.title}
              </div>
              <div style={{
                background: resultData.color + '22',
                border: `3px solid ${resultData.color}`,
                padding: '8px',
                marginBottom: '10px',
                fontSize: '13px',
                color: '#000',
                fontWeight: 'bold',
                lineHeight: 1.4,
              }}>
                {resultData.desc}
              </div>

              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#000080', marginBottom: '4px' }}>
                  📊 MATCH BREAKDOWN (100% ACCURATE!!!):
                </div>
                {['Electra', 'Aaron', 'Madeleine', 'Nosferatu'].map((char) => {
                  const charResults = results[char];
                  const isWinner = char === winnerChar;
                  const pct = isWinner ? 47 : [32, 15, 6][['Electra', 'Aaron', 'Madeleine', 'Nosferatu'].filter(c => c !== winnerChar).indexOf(char)] ?? 10;
                  return (
                    <div key={char} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <div style={{ width: '80px', fontSize: '10px', fontWeight: isWinner ? 'bold' : 'normal', color: isWinner ? charResults.color : '#444', textAlign: 'right' }}>
                        {charResults.emoji} {char}
                      </div>
                      <div style={{ flex: 1, height: '14px', background: '#ddd', border: '2px inset #888', overflow: 'hidden' }}>
                        <div style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: charResults.color,
                          transition: 'width 1s ease-out',
                        }} />
                      </div>
                      <div style={{ width: '36px', fontSize: '10px', fontWeight: isWinner ? 'bold' : 'normal', color: isWinner ? charResults.color : '#444' }}>
                        {pct}%
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                className="btn-ad btn-bounce"
                onClick={() => { setStep(0); setAnswers({}); setAgreeVal(50); setDone(false); }}
              >
                🔄 RETAKE QUIZ - GET NEW RESULTS!!!
              </button>
            </div>

            <div style={{
              background: '#ff0000',
              border: '4px outset #fff',
              padding: '6px',
              textAlign: 'center',
            }}>
              <BlinkText style={{ fontSize: '13px' }}>
                *** SHARE YOUR RESULTS WITH FRIENDS!!! ***
              </BlinkText>
              <div style={{ fontSize: '10px', color: '#ffff00', fontWeight: 'bold', marginTop: '2px' }}>
                THEY NEED TO KNOW YOUR TRUE PERSONALITY!!!
              </div>
            </div>
          </div>
        )}
      </div>

      <MarqueeText text="🌟 AMAZING!!! INCREDIBLE!!! UNBELIEVABLE QUIZ RESULTS AWAIT YOU!!! 🌟 TAKE THE QUIZ NOW FOR FREE!!! 🌟" />
    </div>
  );
}
