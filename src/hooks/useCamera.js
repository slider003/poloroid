import { useState, useEffect, useRef, useCallback } from 'react';

export const useCamera = () => {
    const videoRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        const startCamera = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1280 } }, // Square-ish preference
                    audio: false,
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError(err);
            }
        };

        startCamera();

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
                setIsReady(true);
                videoRef.current.play();
            };
        }
    }, [stream]);

    const takePhoto = useCallback(() => {
        if (!videoRef.current || !isReady) return null;

        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        // Make it square
        const size = Math.min(video.videoWidth, video.videoHeight);
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext('2d');
        // Center crop
        const xOffset = (video.videoWidth - size) / 2;
        const yOffset = (video.videoHeight - size) / 2;

        ctx.drawImage(video, xOffset, yOffset, size, size, 0, 0, size, size);

        return canvas.toDataURL('image/jpeg', 0.9);
    }, [isReady]);

    return { videoRef, error, isReady, takePhoto };
};
