/* global SillyTavern */
import React, { useState, useEffect } from 'react';
import Gallery from './Gallery';

// Global API for opening the gallery from other extensions
let galleryOpenCallback = null;
let galleryCloseCallback = null;

function App() {
    const [galleryState, setGalleryState] = useState({
        isOpen: false,
        items: [],
        initialIndex: 0,
        onDelete: null,
        onRefresh: null,
        galleryFolder: null,
    });

    // Expose global API
    useEffect(() => {
        window.SillyTavernGalleryPro = {
            open: (items, initialIndex = 0, onDelete = null, onRefresh = null, galleryFolder = null) => {
                setGalleryState({
                    isOpen: true,
                    items: Array.isArray(items) ? items : [],
                    initialIndex: Math.max(0, Math.min(initialIndex, items.length - 1)),
                    onDelete: typeof onDelete === 'function' ? onDelete : null,
                    onRefresh: typeof onRefresh === 'function' ? onRefresh : null,
                    galleryFolder: galleryFolder || null,
                });
            },
            close: () => {
                setGalleryState((prev) => ({ ...prev, isOpen: false }));
            },
            isOpen: () => galleryState.isOpen,
        };
    }, [galleryState.isOpen]);

    const handleClose = () => {
        setGalleryState((prev) => ({ ...prev, isOpen: false }));
    };

    const handleDelete = async (url) => {
        if (galleryState.onDelete) {
            await galleryState.onDelete(url);
            // Refresh gallery items after delete
            const context = SillyTavern?.getContext();
            if (context && typeof context.getGalleryItems === 'function') {
                // If the callback provides a way to refresh, use it
                // Otherwise, just close the gallery
                handleClose();
            }
        }
    };

    if (!galleryState.isOpen) {
        return null;
    }

    return (
        <Gallery
            items={galleryState.items}
            initialIndex={galleryState.initialIndex}
            onClose={handleClose}
            onDelete={galleryState.onDelete ? handleDelete : null}
            onRefresh={galleryState.onRefresh}
            galleryFolder={galleryState.galleryFolder}
        />
    );
}

export default App;
