import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

const container = document.getElementById('root');
const root = createRoot(container);

// PUBLIC_INTERFACE
function bootstrap() {
  /** Mounts the React application. */
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

bootstrap();
