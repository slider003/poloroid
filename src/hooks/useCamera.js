import { useState, useEffect, useRef, useCallback } from 'react';

const CAMERA_PERMISSION_KEY = 'camera_permission_granted';

// Utility function to check if camera permission was previously granted
export const wasCameraAccessGranted = () => {
    return localStorage.getItem(CAMERA_PERMISSION_KEY) === 'true';
};

export const useCamera = () => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [facingMode, setFacingMode] = useState('user');

    useEffect(() => {
        const startCamera = async () => {
            // Stop existing stream tracks
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            try {
                // Check if we can use the Permissions API to check camera permission
                if (navigator.permissions && navigator.permissions.query) {
                    try {
                        const permissionStatus = await navigator.permissions.query({ name: 'camera' });

                        // Store permission status in localStorage
                        if (permissionStatus.state === 'granted') {
                            localStorage.setItem(CAMERA_PERMISSION_KEY, 'true');
                        } else if (permissionStatus.state === 'denied') {
                            localStorage.setItem(CAMERA_PERMISSION_KEY, 'false');
                        }

                        // Listen for permission changes
                        permissionStatus.onchange = () => {
                            if (permissionStatus.state === 'granted') {
                                localStorage.setItem(CAMERA_PERMISSION_KEY, 'true');
                            } else if (permissionStatus.state === 'denied') {
                                localStorage.setItem(CAMERA_PERMISSION_KEY, 'false');
                            }
                        };
                    } catch (permErr) {
                        // Permissions API might not support 'camera' query on all browsers
                        console.log("Permissions API not fully supported:", permErr);
                    }
                }

                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 1280 } },
                    audio: false,
                });

                // Successfully got camera access - store in localStorage
                localStorage.setItem(CAMERA_PERMISSION_KEY, 'true');

                setStream(mediaStream);
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
            // We handle stream cleanup manually inside startCamera to avoid race conditions
        };
    }, [facingMode]); // Re-run when facingMode changes

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
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    }, []);

    const takePhoto = useCallback(() => {
        if (!videoRef.current || !isReady) return null;

        const video = videoRef.current;
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

        return canvas.toDataURL('image/jpeg', 0.9);
    }, [isReady, facingMode]);

    return { videoRef, error, isReady, takePhoto, switchCamera, facingMode };
};
