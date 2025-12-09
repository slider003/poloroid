import { useState, useEffect, useCallback } from 'react';
import { get, set } from 'idb-keyval';

const STORAGE_KEY = 'polaroid_recent_photos';
const MAX_PHOTOS = 10;

export const useRecentPhotos = () => {
    const [photos, setPhotos] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load photos from indexedDB on mount
    useEffect(() => {
        const loadPhotos = async () => {
            try {
                const stored = await get(STORAGE_KEY);
                if (stored) {
                    setPhotos(stored);
                }
            } catch (e) {
                console.error("Failed to load recent photos:", e);
            } finally {
                setLoading(false);
            }
        };
        loadPhotos();
    }, []);

    // Save to indexedDB helper
    const saveToStorage = async (newPhotos) => {
        try {
            await set(STORAGE_KEY, newPhotos);
        } catch (e) {
            console.error("Failed to save recent photos:", e);
        }
    };

    const addPhoto = useCallback((photoData, customId = null) => {
        const id = customId || Date.now();
        setPhotos(prev => {
            // Check if we are updating an existing photo (deduplication by ID if provided in data, though currently just data string)
            // But wait, the App passes a data URL string. We wrap it in an object.
            // Strategies for "Update": Use a persistent ID for the current session photo.
            // For now, let's just accept the new photo.

            const newPhoto = {
                id: id,
                timestamp: new Date().toISOString(),
                ...photoData // Spread the properties (data, raw, caption, etc.)
            };

            const updated = [newPhoto, ...prev].slice(0, MAX_PHOTOS);
            saveToStorage(updated);
            return updated;
        });
        return id;
    }, []);

    const updatePhoto = useCallback((id, newData) => {
        setPhotos(prev => {
            const updated = prev.map(p => p.id === id ? { ...p, ...newData } : p);
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

    const clearPhotos = useCallback(async () => {
        setPhotos([]);
        await set(STORAGE_KEY, []);
    }, []);

    return { photos, addPhoto, updatePhoto, removePhoto, clearPhotos, loading };
};
