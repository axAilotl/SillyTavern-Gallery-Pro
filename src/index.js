import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './integration';

// Create a root container for the gallery modal (mounts to body)
const rootElement = document.createElement('div');
rootElement.id = 'sillytavern-gallery-pro-root';
document.body.appendChild(rootElement);

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
