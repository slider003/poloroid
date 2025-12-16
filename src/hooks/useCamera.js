import { useState, useEffect, useRef, useCallback } from 'react';

const CAMERA_PERMISSION_KEY = 'camera_permission_granted';
const CAMERA_FACING_MODE_KEY = 'camera_facing_mode';

// Utility function to check if camera permission was previously granted
export const wasCameraAccessGranted = () => {
    return localStorage.getItem(CAMERA_PERMISSION_KEY) === 'true';
};

export const useCamera = (shouldStart = true) => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [facingMode, setFacingMode] = useState(() => localStorage.getItem(CAMERA_FACING_MODE_KEY) || 'user');
    const [supportsFlash, setSupportsFlash] = useState(false);
    const [flashEnabled, setFlashEnabled] = useState(true); // User preference

    useEffect(() => {
        if (!shouldStart) return;

        let localStream = null;

        const startCamera = async () => {
            // Stream cleanup is handled by useEffect cleanup function now

            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
                    audio: false,
                });

                localStream = mediaStream;

                // Successfully got camera access - store in localStorage
                localStorage.setItem(CAMERA_PERMISSION_KEY, 'true');

                setStream(mediaStream);
                setError(null);

                // Check for flash/torch support
                const track = mediaStream.getVideoTracks()[0];
                if (track) {
                    const capabilities = track.getCapabilities();
                    if (capabilities.torch) {
                        setSupportsFlash(true);
                    } else {
                        setSupportsFlash(false);
                    }
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);

                // Store that permission was denied
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    localStorage.setItem(CAMERA_PERMISSION_KEY, 'false');
                }

                setError(err);
            }
        };

        startCamera();

        return () => {
            // Cleanup function only runs on unmount or dependency change
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode, shouldStart]); // Re-run when facingMode or shouldStart changes

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream; // Ensure srcObject is set
            videoRef.current.onloadedmetadata = () => {
                setIsReady(true);
                videoRef.current.play();
            };
        }
    }, [stream]);

    const switchCamera = useCallback(() => {
        setFacingMode(prev => {
            const newMode = prev === 'user' ? 'environment' : 'user';
            localStorage.setItem(CAMERA_FACING_MODE_KEY, newMode);
            return newMode;
        });
        // Keep flash enabled preference, but it won't trigger on front cam if not supported
    }, []);

    const toggleFlash = useCallback(() => {
        setFlashEnabled(prev => !prev);
    }, []);

    const takePhoto = useCallback(async () => {
        if (!videoRef.current || !isReady) return null;

        const video = videoRef.current;
        const track = stream ? stream.getVideoTracks()[0] : null;

        // 1. Handle Hardware Flash (Torch)
        let didTurnOnTorch = false;
        if (flashEnabled && supportsFlash && track) {
            try {
                await track.applyConstraints({ advanced: [{ torch: true }] });
                didTurnOnTorch = true;
                // Small delay to let camera adjust exposure to the new light
                await new Promise(r => setTimeout(r, 200));
            } catch (err) {
                console.warn("Could not activate torch for flash:", err);
            }
        }

        const canvas = document.createElement('canvas');
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        const xOffset = (video.videoWidth - size) / 2;
        const yOffset = (video.videoHeight - size) / 2;

        // Mirror if using front camera
        if (facingMode === 'user') {
            ctx.translate(size, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, xOffset, yOffset, size, size, 0, 0, size, size);

        // 2. Turn Off Hardware Flash
        if (didTurnOnTorch && track) {
            try {
                await track.applyConstraints({ advanced: [{ torch: false }] });
            } catch (err) {
                console.warn("Could not deactivate torch:", err);
            }
        }

        return canvas.toDataURL('image/jpeg', 0.9);
    }, [isReady, facingMode, flashEnabled, supportsFlash, stream]);

    return { videoRef, error, isReady, takePhoto, switchCamera, facingMode, supportsFlash, flashEnabled, toggleFlash };
};
