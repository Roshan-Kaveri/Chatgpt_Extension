import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';



import 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';

// Prism theme
import 'prismjs/themes/prism-tomorrow.css';


const root = createRoot(document.getElementById('root'));
root.render(<App />);

