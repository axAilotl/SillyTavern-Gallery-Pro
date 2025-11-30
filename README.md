# SillyTavern Gallery Pro

An enhanced gallery component for SillyTavern with a modern lightbox interface, slideshow functionality, and filename display.

## Features

- **Large Modal View**: Full-screen lightbox with 95% viewport dimensions
- **Slideshow Navigation**: Navigate through images with arrow buttons, keyboard (←/→), or dot indicators
- **Filename Display**: Shows the full filename in the header (useful for future macro support)
- **Video Support**: Displays both images and videos
- **Keyboard Controls**: 
  - Arrow Left/Right: Navigate images
  - Escape: Close gallery
- **Delete Support**: Optional delete button when callback is provided
- **Responsive Design**: Works on desktop and mobile devices

## Installation

1. Clone or copy this extension to `/public/scripts/extensions/third-party/SillyTavern-Gallery-Pro/`
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. The extension will be automatically loaded by SillyTavern

## Usage

The extension exposes a global API `window.SillyTavernGalleryPro` that can be used by other extensions:

```javascript
// Open the gallery with items
window.SillyTavernGalleryPro.open(items, initialIndex, onDelete);

// Close the gallery
window.SillyTavernGalleryPro.close();

// Check if gallery is open
window.SillyTavernGalleryPro.isOpen();
```

### Parameters

- `items`: Array of objects with `src` property (e.g., `[{src: 'user/images/folder/image.jpg'}]`)
- `initialIndex`: Index of the item to show initially (default: 0)
- `onDelete`: Optional callback function that receives the URL when delete is clicked

### Example Integration

```javascript
// In your extension code
const items = [
    { src: 'user/images/char1/image1.jpg' },
    { src: 'user/images/char1/image2.jpg' },
    { src: 'user/images/char1/video1.mp4' },
];

// Open gallery at first image
window.SillyTavernGalleryPro.open(items, 0, async (url) => {
    // Handle delete
    await deleteImage(url);
    // Optionally refresh and reopen
});
```

## Building

```bash
npm install
npm run build
```

The built files will be in the `dist/` directory:
- `dist/index.js` - Main JavaScript bundle
- `dist/Gallery.css` - Extracted CSS styles

## Development

The source code is in the `src/` directory:
- `src/index.js` - Entry point
- `src/App.js` - Main app component that exposes the global API
- `src/Gallery.jsx` - Gallery lightbox component
- `src/Gallery.css` - Styles for the gallery

## Requirements

- SillyTavern
- React 18.2.0+
- Font Awesome icons (already included in SillyTavern)
