const $ = window.jQuery;

const getContext = () => window.SillyTavern?.getContext() ?? {};

const getGalleryFolder = (char) => {
    // Try to get folder from default gallery settings if available, otherwise char name
    const settings = getContext().extensionSettings?.gallery;
    return settings?.folders?.[char?.avatar] ?? char?.name;
};

const getGalleryItems = async (folder) => {
    try {
        const response = await fetch('/api/images/list', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                folder: folder,
                sortField: 'date',
                sortOrder: 'desc',
                type: 3, // IMAGE | VIDEO
            }),
        });
        
        if (!response.ok) return [];

        const data = await response.json();
        
        return data.map(file => ({
            src: `user/images/${folder}/${file}`,
            title: file
        }));
    } catch (e) {
        console.error('Failed to load gallery items', e);
        return [];
    }
};

// Function to open the gallery and handle its callbacks
const openGalleryAndHandleCallbacks = async (items, initialIndex, folder) => {
    if (window.SillyTavernGalleryPro) {
        window.SillyTavernGalleryPro.open(items, initialIndex, async (url) => {
            // Delete callback
            await fetch('/api/images/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: url }),
            });
        }, async (sort) => {
            // Refresh callback: Re-fetch and re-open the gallery
            const newItems = await getGalleryItems(folder);
            await openGalleryAndHandleCallbacks(newItems, 0, folder);
        }, folder);
    } else {
        // If SillyTavernGalleryPro is not yet available, retry after a short delay
        console.warn('SillyTavernGalleryPro not available yet. Retrying to open gallery...');
        setTimeout(() => openGalleryAndHandleCallbacks(items, initialIndex, folder), 100);
    }
};

// Function to attach the gallery button to the UI
const attachGalleryButton = () => {
    const buttonHtml = `
        <div id="gallery-pro-button" class="menu_button fa-solid fa-images" title="Gallery Pro" data-i18n="[title]Gallery Pro"></div>
    `;
    
    const container = $('#rm_buttons_container');
    if (container.length) {
        // Prevent adding duplicate buttons
        if ($('#gallery-pro-button').length === 0) {
                // Try to insert after the chat lorebook button for better placement
                const lorebookButton = $('.chat_lorebook_button');
                if (lorebookButton.length) {
                    lorebookButton.after(buttonHtml);
                } else {
                    // Fallback to appending to container if lorebook button not found
                    container.append(buttonHtml);
                }
                $('#gallery-pro-button').on('click', async () => {
                    const context = getContext();
                    const charId = context.characterId;
                    
                    if (charId === undefined || charId === null) {
                        if (window.toastr) window.toastr.info('Please select a character first');
                        return;
                    }
                    
                    const char = context.characters[charId];
                    if (!char) {
                        if (window.toastr) window.toastr.error('Character data not found.');
                        return;
                    }

                    const folder = getGalleryFolder(char);
                    const items = await getGalleryItems(folder);
                    
                    await openGalleryAndHandleCallbacks(items, 0, folder);
                });

        }
    } else {
        console.warn('Gallery Pro: #rm_buttons_container not found. Button not attached.');
    }
};

// Execute when the DOM is ready
$(document).ready(() => {
    // Poll for window.SillyTavernGalleryPro to become available
    const checkInterval = setInterval(() => {
        if (window.SillyTavernGalleryPro) {
            clearInterval(checkInterval); // Stop polling once available
            attachGalleryButton(); // Attach the button
        }
    }, 100); // Check every 100ms
});