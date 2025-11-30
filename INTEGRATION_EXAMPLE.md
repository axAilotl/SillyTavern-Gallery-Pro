# Integration Example with Gallery Extension

Here's how to integrate SillyTavern Gallery Pro with the existing gallery extension:

## Option 1: Replace the viewWithDragbox function

In `/public/scripts/extensions/gallery/index.js`, you can modify the `viewWithDragbox` function to use the new gallery:

```javascript
function viewWithDragbox(items) {
    if (items && items.length > 0) {
        const url = items[0].responsiveURL();
        
        if (deleteModeActive) {
            // Keep existing delete behavior
            Popup.show.confirm(t`Are you sure you want to delete this image?`, url)
                .then(async (confirmed) => {
                    if (!confirmed) return;
                    deleteGalleryItem(url).then(() => showCharGallery(deleteModeActive));
                });
        } else {
            // Use the new gallery pro if available
            if (window.SillyTavernGalleryPro) {
                // Get all items from the current gallery state
                const allItems = galleryNavigationState.items || [];
                
                // Find the index of the clicked item
                const index = allItems.findIndex(item => item.src === url);
                
                // Open with delete callback
                window.SillyTavernGalleryPro.open(
                    allItems,
                    index >= 0 ? index : 0,
                    async (deleteUrl) => {
                        await deleteGalleryItem(deleteUrl);
                        // Refresh gallery
                        const newItems = await getGalleryItems(url);
                        galleryNavigationState.items = newItems;
                        // Reopen gallery with updated items
                        const newIndex = newItems.findIndex(item => item.src === deleteUrl);
                        if (newIndex >= 0 && newItems.length > 0) {
                            window.SillyTavernGalleryPro.open(newItems, Math.min(newIndex, newItems.length - 1));
                        } else if (newItems.length > 0) {
                            window.SillyTavernGalleryPro.open(newItems, 0);
                        } else {
                            window.SillyTavernGalleryPro.close();
                        }
                    }
                );
            } else {
                // Fallback to old behavior
                const id = sanitizeHTMLId(url.substring(url.lastIndexOf('/') + 1, url.lastIndexOf('.')));
                makeDragImg(id, url, index);
            }
        }
    }
}
```

## Option 2: Add a new button/option

You could also add a button in the gallery controls to open the pro version:

```javascript
// In makeMovable function, add a button:
const openProButton = document.createElement('div');
openProButton.classList.add('menu_button', 'menu_button_icon', 'interactable');
openProButton.title = 'Open Gallery Pro';
openProButton.innerHTML = '<i class="fa-solid fa-expand fa-fw"></i><div>Gallery Pro</div>';
openProButton.addEventListener('click', async () => {
    const items = await getGalleryItems(url);
    if (window.SillyTavernGalleryPro && items.length > 0) {
        window.SillyTavernGalleryPro.open(items, 0, async (deleteUrl) => {
            await deleteGalleryItem(deleteUrl);
            // Refresh and reopen
            const newItems = await getGalleryItems(url);
            if (newItems.length > 0) {
                window.SillyTavernGalleryPro.open(newItems, 0);
            } else {
                window.SillyTavernGalleryPro.close();
            }
        });
    }
});
controlsContainer.appendChild(openProButton);
```

