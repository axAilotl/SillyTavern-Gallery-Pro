/* global SillyTavern */
import React, { useState, useEffect, useCallback } from 'react';
import './Gallery.css';

function Gallery({ items = [], initialIndex = 0, onClose, onDelete, onRefresh, galleryFolder = null }) {
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'lightbox'
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [isLoading, setIsLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [sortOrder, setSortOrder] = useState('dateAsc');
    const [galleryItems, setGalleryItems] = useState(items);

    const currentItem = galleryItems[currentIndex] || null;
    const isVideo = currentItem?.src && /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(currentItem.src);

    // Get filename from URL
    const getFilename = (url) => {
        if (!url) return '';
        const parts = url.split('/');
        return parts[parts.length - 1] || url;
    };

    // Get filename without extension
    const getFilenameNoExt = (url) => {
        const filename = getFilename(url);
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(0, lastDot) : filename;
    };

    // Update items when prop changes
    useEffect(() => {
        setGalleryItems(items);
    }, [items]);

    // Get sort order from settings
    useEffect(() => {
        const context = SillyTavern?.getContext();
        if (context?.extensionSettings?.gallery?.sort) {
            setSortOrder(context.extensionSettings.gallery.sort);
        }
    }, []);

    const goToPrevious = useCallback(() => {
        if (galleryItems.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
        setImageError(false);
    }, [galleryItems.length]);

    const goToNext = useCallback(() => {
        if (galleryItems.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % galleryItems.length);
        setImageError(false);
    }, [galleryItems.length]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') {
                goToPrevious();
            } else if (e.key === 'ArrowRight') {
                goToNext();
            } else if (e.key === 'Escape') {
                if (viewMode === 'lightbox') {
                    setViewMode('grid');
                } else {
                    onClose?.();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToPrevious, goToNext, onClose, viewMode]);

    // Handle image load
    const handleImageLoad = () => {
        setIsLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
    };

    // Reset loading state when index changes
    useEffect(() => {
        setIsLoading(true);
        setImageError(false);
    }, [currentIndex]);

    // Sort options
    const SORT_OPTIONS = [
        { value: 'nameAsc', label: 'Name (A-Z)' },
        { value: 'nameDesc', label: 'Name (Z-A)' },
        { value: 'dateDesc', label: 'Newest' },
        { value: 'dateAsc', label: 'Oldest' },
    ];

    // Handle sort change
    const handleSortChange = async (newSort) => {
        setSortOrder(newSort);
        const context = SillyTavern?.getContext();
        if (context?.extensionSettings?.gallery) {
            context.extensionSettings.gallery.sort = newSort;
            context.saveSettingsDebounced();
        }
        if (onRefresh) {
            await onRefresh(newSort);
        }
    };

    // Handle file upload
    const handleUpload = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        if (!galleryFolder) {
            if (window.toastr) {
                window.toastr.error('Gallery folder not specified');
            }
            return;
        }

        try {
            const context = SillyTavern?.getContext();
            const getRequestHeaders = context?.getRequestHeaders || (() => ({}));
            
            for (const file of Array.from(files)) {
                const fileBase64 = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                
                const base64Data = fileBase64.split(',')[1];
                const extension = file.name.split('.').pop();
                const fileName = file.name.replace(/\./g, '_').replace(/\.[^.]+$/, '');
                
                const response = await fetch('/api/images/upload', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getRequestHeaders(),
                    },
                    body: JSON.stringify({
                        image: base64Data,
                        format: extension,
                        ch_name: galleryFolder,
                        filename: fileName,
                    }),
                });

                if (response.ok) {
                    const result = await response.json();
                    if (window.toastr) {
                        window.toastr.success(`File uploaded successfully. Saved at: ${result.path}`);
                    }
                } else {
                    throw new Error('Upload failed');
                }
            }
            
            if (onRefresh) {
                await onRefresh(sortOrder);
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (window.toastr) {
                window.toastr.error('Failed to upload file(s)');
            }
        }
        
        // Reset file input
        event.target.value = '';
    };

    // Handle delete from grid
    const handleDeleteItem = async (url, event) => {
        event.stopPropagation();
        const context = SillyTavern?.getContext();
        const Popup = context?.Popup || window.SillyTavern?.Popup;
        
        if (!Popup) {
            if (!confirm('Are you sure you want to delete this image?')) return;
        } else {
            const confirmed = await Popup.show.confirm(
                'Are you sure you want to delete this image?',
                url
            );
            if (!confirmed) return;
        }

        if (onDelete) {
            await onDelete(url);
            if (onRefresh) {
                await onRefresh(sortOrder);
            }
        }
    };

    // Open lightbox when clicking a thumbnail
    const openLightbox = (index) => {
        setCurrentIndex(index);
        setViewMode('lightbox');
    };

    if (galleryItems.length === 0) {
        return null;
    }

    // Grid/Mosaic view
    if (viewMode === 'grid') {
        return (
            <div className="gallery-lightbox-overlay" onClick={onClose}>
                <div className="gallery-grid-container" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="gallery-lightbox-header">
                        <div className="gallery-lightbox-filename">
                            {galleryItems.length} {galleryItems.length === 1 ? 'Image' : 'Images'}
                        </div>
                        <div className="gallery-grid-controls">
                            <select
                                className="gallery-sort-select"
                                value={sortOrder}
                                onChange={(e) => handleSortChange(e.target.value)}
                            >
                                {SORT_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            {galleryFolder && (
                                <>
                                    <label className="gallery-upload-button">
                                        <i className="fa-solid fa-plus"></i>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            multiple
                                            style={{ display: 'none' }}
                                            onChange={handleUpload}
                                        />
                                    </label>
                                </>
                            )}
                        </div>
                        <button className="gallery-lightbox-close" onClick={onClose} aria-label="Close">
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="gallery-grid">
                        {galleryItems.map((item, index) => {
                            const filename = getFilename(item.src);
                            const filenameNoExt = getFilenameNoExt(item.src);
                            const itemIsVideo = /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(item.src);
                            return (
                                <div
                                    key={index}
                                    className="gallery-grid-item"
                                >
                                    <div className="gallery-grid-item-content" onClick={() => openLightbox(index)}>
                                        {itemIsVideo ? (
                                            <video
                                                src={item.src}
                                                className="gallery-grid-thumbnail"
                                                preload="metadata"
                                            />
                                        ) : (
                                            <img
                                                src={item.src}
                                                alt={filename}
                                                className="gallery-grid-thumbnail"
                                                loading="lazy"
                                            />
                                        )}
                                        {itemIsVideo && (
                                            <div className="gallery-grid-video-icon">
                                                <i className="fa-solid fa-play"></i>
                                            </div>
                                        )}
                                    </div>
                                    <div className="gallery-grid-filename-label">{filenameNoExt}</div>
                                    {onDelete && (
                                        <button
                                            className="gallery-grid-delete"
                                            onClick={(e) => handleDeleteItem(item.src, e)}
                                            aria-label="Delete"
                                            title="Delete"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    // Lightbox view
    const filename = getFilename(currentItem?.src);

    return (
        <div className="gallery-lightbox-overlay" onClick={() => setViewMode('grid')}>
            <div className="gallery-lightbox-container" onClick={(e) => e.stopPropagation()}>
                {/* Header with filename and close button */}
                <div className="gallery-lightbox-header">
                    <div className="gallery-lightbox-filename-center" title={filename}>
                        {getFilenameNoExt(currentItem?.src)}
                    </div>
                    <div className="gallery-lightbox-counter">
                        {currentIndex + 1} / {galleryItems.length}
                    </div>
                    <div className="gallery-lightbox-header-buttons">
                        <button 
                            className="gallery-lightbox-close" 
                            onClick={() => setViewMode('grid')} 
                            aria-label="Back to grid"
                            title="Back to grid"
                        >
                            <i className="fa-solid fa-grid-2"></i>
                        </button>
                        <button className="gallery-lightbox-close" onClick={() => setViewMode('grid')} aria-label="Close">
                            <i className="fa-solid fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Main content area */}
                <div className="gallery-lightbox-content">
                    {/* Previous button */}
                    {galleryItems.length > 1 && (
                        <button
                            className="gallery-lightbox-nav gallery-lightbox-prev"
                            onClick={goToPrevious}
                            aria-label="Previous"
                        >
                            <i className="fa-solid fa-chevron-left"></i>
                        </button>
                    )}

                    {/* Media container */}
                    <div className="gallery-lightbox-media">
                        {isLoading && (
                            <div className="gallery-lightbox-loading">
                                <i className="fa-solid fa-spinner fa-spin"></i>
                            </div>
                        )}
                        {imageError ? (
                            <div className="gallery-lightbox-error">
                                <i className="fa-solid fa-exclamation-triangle"></i>
                                <p>Failed to load media</p>
                            </div>
                        ) : isVideo ? (
                            <video
                                src={currentItem.src}
                                controls
                                autoPlay
                                onLoadStart={() => setIsLoading(true)}
                                onLoadedData={handleImageLoad}
                                onError={handleImageError}
                                className="gallery-lightbox-video"
                            />
                        ) : (
                            <img
                                src={currentItem.src}
                                alt={filename}
                                onLoad={handleImageLoad}
                                onError={handleImageError}
                                className="gallery-lightbox-image"
                            />
                        )}
                    </div>

                    {/* Next button */}
                    {galleryItems.length > 1 && (
                        <button
                            className="gallery-lightbox-nav gallery-lightbox-next"
                            onClick={goToNext}
                            aria-label="Next"
                        >
                            <i className="fa-solid fa-chevron-right"></i>
                        </button>
                    )}
                </div>

                    {/* Footer with navigation dots and delete button */}
                    <div className="gallery-lightbox-footer">
                        {galleryItems.length > 1 && (
                            <div className="gallery-lightbox-dots">
                                {galleryItems.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`gallery-lightbox-dot ${index === currentIndex ? 'active' : ''}`}
                                        onClick={() => {
                                            setCurrentIndex(index);
                                            setImageError(false);
                                        }}
                                        aria-label={`Go to image ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}
                        {onDelete && (
                            <button
                                className="gallery-lightbox-delete"
                                onClick={async () => {
                                    await onDelete(currentItem.src);
                                    if (onRefresh) {
                                        await onRefresh(sortOrder);
                                    }
                                }}
                                aria-label="Delete"
                            >
                                <i className="fa-solid fa-trash"></i>
                            </button>
                        )}
                    </div>
            </div>
        </div>
    );
}

export default Gallery;

