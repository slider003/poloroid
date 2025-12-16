import { useState, useEffect } from 'react';

const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);
    const [os, setOs] = useState('');
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        // 1. Check if already standalone (installed)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone ||
            document.referrer.includes('android-app://');

        if (isStandalone) {
            setShowPrompt(false);
            return;
        }

        // 2. Identify OS
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setOs('ios');
        } else if (/android/.test(userAgent)) {
            setOs('android');
        } else {
            setOs('desktop');
        }

        // Show prompt if not standalone
        setShowPrompt(true);
    }, []);

    const handlePromptClick = () => {
        setShowToast(true);
    };

    const handleDismissToast = () => {
        setShowToast(false);
    };

    if (!showPrompt) return null;

    return (
        <>
            {/* Subtle Bottom Button */}
            <div style={{
                position: 'fixed',
                bottom: '30px',
                left: '50%',
                transform: `translateX(-50%) translateY(${showToast ? '100px' : '0'})`, // Slide down/away when toast is active? Or keep it? keeping it is fine.
                zIndex: 1000,
                backgroundColor: 'rgba(20, 20, 20, 0.9)',
                backdropFilter: 'blur(10px)',
                color: '#fff',
                padding: '12px 24px',
                borderRadius: '50px',
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                border: '1px solid rgba(255,255,255,0.1)',
                opacity: showToast ? 0 : 1, // Fade out when toast appears
                pointerEvents: showToast ? 'none' : 'auto',
            }}
                onClick={handlePromptClick}
            >
                {/* Simple Plus Icon */}
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                <span style={{ fontWeight: 500 }}>Add to Home Screen</span>
            </div>

            {/* Top Toast Notification */}
            <div style={{
                position: 'fixed',
                top: '20px',
                left: '50%',
                transform: `translateX(-50%) translateY(${showToast ? '0' : '-150%'})`,
                width: '90%',
                maxWidth: '400px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: '#111',
                padding: '16px 20px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                zIndex: 2000,
                transition: 'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backdropFilter: 'blur(10px)'
            }}>
                {/* Close Button */}
                <button
                    onClick={handleDismissToast}
                    style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: 'transparent',
                        border: 'none',
                        color: '#555',
                        fontSize: '1.2rem',
                        padding: '5px',
                        cursor: 'pointer'
                    }}
                >
                    &times;
                </button>

                <div style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                    {os === 'ios' ? (
                        <>
                            Tap the <strong>Share</strong> icon <ShareIcon /> in the toolbar...
                        </>
                    ) : (
                        <>
                            Tap the <strong>Menu</strong> icon <MenuIcon /> ...
                        </>
                    )}
                </div>
                <div style={{ fontSize: '0.9rem', color: '#555' }}>
                    then scroll down & tap <strong>"Add to Home Screen"</strong>
                </div>

                {/* Close Button implementation not strictly needed if it auto-dismisses, 
                    but nice to have for UX */}
            </div>
        </>
    );
};

// Simple inline SVGs for cleaner look
const ShareIcon = () => (
    <svg style={{ verticalAlign: 'middle', display: 'inline-block', margin: '0 4px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
        <polyline points="16 6 12 2 8 6"></polyline>
        <line x1="12" y1="2" x2="12" y2="15"></line>
    </svg>
);

const MenuIcon = () => (
    <svg style={{ verticalAlign: 'middle', display: 'inline-block', margin: '0 4px' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"></circle>
        <circle cx="12" cy="5" r="1"></circle>
        <circle cx="12" cy="19" r="1"></circle>
    </svg>
);

export default InstallPrompt;
