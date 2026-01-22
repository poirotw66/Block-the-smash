/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: '#000',
    overflow: 'hidden',
    fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  },
  header: {
    flexShrink: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    background: '#000',
    zIndex: 20,
    borderBottom: '1px solid #222',
  },
  gameWrapper: {
    flex: 1,
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    background: '#000',
    overflow: 'hidden',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    display: 'block',
    backgroundColor: '#000',
  },
  buttonGroup: {
    display: 'flex',
    gap: '8px',
  },
  button: (active: boolean) => ({
    background: active ? '#ffffff' : 'rgba(255, 255, 255, 0.05)',
    color: active ? '#000000' : '#ffffff',
    border: '1px solid ' + (active ? '#ffffff' : 'rgba(255, 255, 255, 0.1)'),
    padding: '6px 16px',
    borderRadius: '100px',
    fontSize: '13px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  }),
  title: {
    color: '#fff',
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '-0.5px',
    marginRight: '20px',
  },
  modalOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'auto' as const,
    zIndex: 50,
  },
  modal: {
    background: '#111',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '24px',
    padding: '32px',
    width: '480px',
    maxWidth: '90%',
    color: '#fff',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    animation: 'fadeIn 0.2s ease-out',
  },
  modalHeader: {
    fontSize: '24px',
    fontWeight: '700' as const,
    marginBottom: '8px',
    background: 'linear-gradient(to right, #fff, #aaa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 8px 0',
  },
  modalSub: {
    color: '#888',
    marginBottom: '24px',
    fontSize: '14px',
    lineHeight: '1.5',
    marginTop: 0,
  },
  modeBtn: {
    flex: 1,
    padding: '16px',
    background: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '700' as const,
    cursor: 'pointer',
    fontSize: '18px',
    fontFamily: 'monospace',
    transition: 'transform 0.1s',
  },
  remixItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '16px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'background 0.2s',
    border: '1px solid transparent',
  },
  remixIcon: {
    fontSize: '24px',
    background: 'rgba(255,255,255,0.1)',
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: '100%',
    padding: '14px',
    marginTop: '12px',
    background: 'rgba(255,255,255,0.1)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    fontSize: '15px',
  },
  promptBox: {
    background: '#000',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '16px',
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#fff',
    minHeight: '150px',
    maxHeight: '300px',
    overflow: 'auto',
    whiteSpace: 'pre-wrap' as const,
  },
  loadingContainer: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#000',
    zIndex: 5,
  },
  loadingText: {
    color: '#666',
    fontSize: '14px',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    animation: 'pulse 1.5s infinite',
  }
};

const BASE_PROMPT = `
Create a 3D web game "Badminton Defender".

### Visual & Camera Specs (Crucial)
*   **Stance**: Defensive Smash Receive.
*   **Camera Height**: ~1.4m (slightly lower than net top).
*   **Camera Angle**: 
    *   **Pitch**: Down approx 15 degrees.
    *   **Yaw**: Rotated approx 10 degrees (simulating body angle).
    *   **Visual Check**: The top edge of the net should be visible in the upper-middle of the screen.
*   **Environment**: Dark court, bright net tape.

### Gameplay
*   **Core Loop**: Drill Mode (10/25/50 balls).
*   **Ball Physics**: Smashes come from high up (Z-axis distance) downwards towards the player's waist/knees.
*   **Action**: Mouse moves racket hand. Click to swing (Wrist snap).
*   **Racket Details**: The racket head must have VISIBLE strings. Use a generated canvas texture to create a clear grid pattern on the string bed. The string bed should be oval-shaped to fit the frame.
*   **Hit Logic**: CONTINUOUS COLLISION. 
    *   **Active Hit**: If collision happens WHILE swinging -> Return ball fast (Score).
    *   **Passive Block**: If collision happens WITHOUT swinging -> Ball stops/drops dead (No Score).
*   **Hit**: Timing based. Hitting returns the ball. Missing counts as miss (no game over).
*   **Default**: Right Handed.

### Juice & Feedback (New)
*   **Audio**: Synthesized Web Audio API sound effects (No external assets). Needs: Swing Swoosh, Hit Thwack (High pitch), Block Thud (Low pitch).
*   **Screen Shake**: Camera should shake briefly on successful active hits.
*   **Impact**: Light flash on contact.
`;

function App() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showRemix, setShowRemix] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [handedness, setHandedness] = useState<'left' | 'right'>('right');
  const [muted, setMuted] = useState(false);
  
  const [gameHtml, setGameHtml] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Initializing System...');
  
  const htmlCache = useRef<{ [key: string]: string }>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleHandedness = () => {
    setHandedness(prev => prev === 'left' ? 'right' : 'left');
  };

  const toggleMute = () => {
    setMuted(prev => !prev);
  };

  const startMatch = (count: number) => {
    setShowDisclaimer(false);
    if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'START_MATCH', payload: count }, '*');
    }
  };

  useEffect(() => {
    // Send state commands to iframe
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'PAUSE_GAME', payload: showDisclaimer }, '*');
      iframe.contentWindow.postMessage({ type: 'SET_HANDEDNESS', payload: handedness }, '*');
      iframe.contentWindow.postMessage({ type: 'SET_MUTE', payload: muted }, '*');
    }
  }, [showDisclaimer, handedness, muted, gameHtml]); 

  useEffect(() => {
    let isMounted = true;
    const url = './init/gemini3.html';

    const loadGame = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to load game');
        let html = await response.text();
        
        const baseTag = '<base href="./init/">';
        if (html.includes('<head')) {
            html = html.replace(/<head[^>]*>/i, `$&${baseTag}`);
        } else {
            html = `${baseTag}${html}`;
        }
        
        htmlCache.current[url] = html;
        
        if (isMounted) {
          setGameHtml(html);
          setIsLoading(false);
        }
      } catch (e) {
        console.error(e);
        if (isMounted) {
          setGameHtml('<div style="color:white;display:flex;height:100%;justify-content:center;align-items:center;font-family:sans-serif;">Failed to load game engine.</div>');
          setIsLoading(false);
        }
      }
    };
    
    loadGame();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemixAction = async (modification: string) => {
    if (!gameHtml) return;
    
    setIsLoading(true);
    setLoadingText('REMIXING CODEBASE...');
    setShowRemix(false); 

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const modelId = 'gemini-3-pro-preview';
        
        const systemInstruction = `
You are an expert Creative Technologist and 3D Web Game Developer.
Your task is to modify the provided web game code based on the user's remix request.
Output ONLY the raw HTML code. Do not include markdown formatting.
Also do not remove and add any other feature other than the remixing capability.
IMPORTANT: Preserve the following script snippet exactly as it is in the output to ensure the game can be paused and configured by the parent window:
<script>
window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'PAUSE_GAME') {
    if (typeof state !== 'undefined' && state.hasOwnProperty('isPaused')) {
       state.isPaused = e.data.payload;
       if(!state.isPaused && typeof clock !== 'undefined') clock.getDelta();
    } else if (typeof isPaused !== 'undefined') {
       isPaused = e.data.payload;
       if(!isPaused && typeof clock !== 'undefined') clock.getDelta();
    }
  }
  if (e.data && e.data.type === 'SET_HANDEDNESS') {
     // Handedness logic handler if present
     if (typeof setHandedness === 'function') setHandedness(e.data.payload);
     else if (typeof state !== 'undefined') state.handedness = e.data.payload;
  }
  if (e.data && e.data.type === 'SET_MUTE') {
     if (typeof setMute === 'function') setMute(e.data.payload);
     else if (typeof state !== 'undefined') state.muted = e.data.payload;
  }
  if (e.data && e.data.type === 'START_MATCH') {
     // Start Match handler
     if (typeof startMatch === 'function') startMatch(e.data.payload);
  }
});
</script>
`;

        const response = await ai.models.generateContent({
            model: modelId,
            config: {
                systemInstruction: systemInstruction
            },
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: `ORIGINAL PROMPT CONTEXT:\n${BASE_PROMPT}` },
                        { text: `CURRENT SOURCE CODE:\n${gameHtml}` },
                        { text: `REMIX INSTRUCTION: Apply this modification to the game: "${modification}". Ensure the code remains a single HTML file.` }
                    ]
                }
            ]
        });

        let text = response.text;
        text = text.replace(/^```html\s*/, '').replace(/^```\s*/, '').replace(/```$/, '');
        
        const baseTag = '<base href="./init/">';
        if (!text.includes('<base') && !text.includes('init/')) {
             if (text.includes('<head')) {
                text = text.replace(/<head[^>]*>/i, `$&${baseTag}`);
            }
        }
        
        setGameHtml(text);

    } catch (error) {
        console.error("Remix failed", error);
        alert("Remix failed. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleIFrameLoad = () => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
        // Init state
        iframe.contentWindow.postMessage({ type: 'PAUSE_GAME', payload: showDisclaimer }, '*');
        iframe.contentWindow.postMessage({ type: 'SET_HANDEDNESS', payload: handedness }, '*');
        iframe.contentWindow.postMessage({ type: 'SET_MUTE', payload: muted }, '*');
    }
  };

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; }
      `}</style>

      {/* Header Control Bar */}
      <div style={styles.header}>
        <div style={{display: 'flex', alignItems: 'center'}}>
            <div style={styles.title}>BADMINTON DEFENDER</div>
            <div style={{color: '#666', fontSize: '12px', background: '#222', padding: '4px 8px', borderRadius: '4px'}}>GEMINI 3 PRO</div>
        </div>

        <div style={styles.buttonGroup}>
          <button 
             style={styles.button(false)}
             onClick={toggleMute}
          >
            {muted ? 'SOUND OFF' : 'SOUND ON'}
          </button>
          <div style={{width: 1, height: 20, background: '#333', margin: '0 8px'}}></div>
          <button 
             style={styles.button(false)}
             onClick={toggleHandedness}
          >
            {handedness === 'left' ? 'LEFT HAND' : 'RIGHT HAND'}
          </button>
          <div style={{width: 1, height: 20, background: '#333', margin: '0 8px'}}></div>
          <button 
            style={styles.button(showPrompt)}
            onClick={() => setShowPrompt(true)}
          >
            Prompt
          </button>
          <button 
            style={styles.button(showRemix)}
            onClick={() => setShowRemix(true)}
          >
            Remix
          </button>
        </div>
      </div>

      {/* Main Game Area */}
      <div style={styles.gameWrapper}>
        {/* Loading Screen */}
        {(isLoading || !gameHtml) && (
          <div style={styles.loadingContainer}>
            <div style={styles.loadingText}>{loadingText}</div>
          </div>
        )}

        {/* Game Frame */}
        {!isLoading && gameHtml && (
          <iframe 
            ref={iframeRef}
            srcDoc={gameHtml}
            style={styles.iframe} 
            title="Game Canvas"
            sandbox="allow-scripts allow-pointer-lock allow-same-origin allow-forms"
            onLoad={handleIFrameLoad}
          />
        )}
      </div>

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h2 style={styles.modalHeader}>DEFENSE DRILL</h2>
            <div style={{...styles.modalSub, fontSize: '15px', color: '#ccc'}}>
              <p style={{marginBottom: '12px'}}>
                <strong>Objective:</strong> Return the shuttlecocks! Don't let them pass.
              </p>

              <p style={{marginBottom: '24px'}}>
                <strong>Select Drill Duration:</strong>
              </p>
              
              <div style={{display: 'flex', gap: '12px', marginBottom: '16px'}}>
                  <button style={styles.modeBtn} onClick={() => startMatch(10)}>10 BALLS</button>
                  <button style={styles.modeBtn} onClick={() => startMatch(25)}>25 BALLS</button>
                  <button style={styles.modeBtn} onClick={() => startMatch(50)}>50 BALLS</button>
              </div>

              <p style={{margin: 0, fontSize: '13px', lineHeight: '1.5', color: '#666', textAlign: 'center' as const}}>
                   This game was generated by Google's Gemini 3 Pro.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Prompt Modal */}
      {showPrompt && (
        <div style={styles.modalOverlay} onClick={() => setShowPrompt(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalHeader}>Underlying Prompt</h2>
            <p style={styles.modalSub}>The instructions used to one-shot generate this game.</p>
            <div style={styles.promptBox}>
              {BASE_PROMPT}
            </div>
            <button style={styles.closeBtn} onClick={() => setShowPrompt(false)}>Close</button>
          </div>
        </div>
      )}

      {/* Remix Modal */}
      {showRemix && (
        <div style={styles.modalOverlay} onClick={() => setShowRemix(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 style={styles.modalHeader}>Remix Station</h2>
            <p style={styles.modalSub}>Apply runtime modifications to the game engine.</p>
            
            {['Hyper Speed', 'Fiery Court', 'Giant Racket'].map((item, i) => (
               <div 
                key={item}
                style={styles.remixItem} 
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'}
                onClick={() => handleRemixAction(item)}
              >
                <div style={styles.remixIcon}>{['⚡', '🔥', '🏸'][i]}</div>
                <div>
                  <div style={{fontWeight: 600}}>{item}</div>
                  <div style={{fontSize: '13px', color: '#888'}}>
                    {['Run logic at 200% speed', 'Switch to red/orange palette', 'Double the racket size'][i]}
                  </div>
                </div>
              </div>
            ))}

            <button style={styles.closeBtn} onClick={() => setShowRemix(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById('root') || document.body);
root.render(<App />);