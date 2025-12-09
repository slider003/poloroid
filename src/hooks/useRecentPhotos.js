import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'polaroid_recent_photos';
const MAX_PHOTOS = 10;

export const useRecentPhotos = () => {
    const [photos, setPhotos] = useState([]);

    // Load photos from local storage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setPhotos(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load recent photos:", e);
        }
    }, []);

    // Save to local storage whenever photos change
    const saveToStorage = (newPhotos) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newPhotos));
        } catch (e) {
            console.error("Failed to save recent photos:", e);
            // If quota exceeded, we might want to alert or silently fail.
            // For now, silent fail is safer for UX than crashing.
        }
    };

    const addPhoto = useCallback((photoData) => {
        setPhotos(prev => {
            const newPhoto = {
                id: Date.now(),
                data: photoData,
                timestamp: new Date().toISOString()
            };
            const updated = [newPhoto, ...prev].slice(0, MAX_PHOTOS);
            saveToStorage(updated);
            return updated;
        });
    }, []);

    const removePhoto = useCallback((id) => {
        setPhotos(prev => {
            const updated = prev.filter(p => p.id !== id);
            saveToStorage(updated);
            return updated;
        });
    }, []);

    const clearPhotos = useCallback(() => {
        setPhotos([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return { photos, addPhoto, removePhoto, clearPhotos };
};
