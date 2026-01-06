import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './views/App';
import './views/App.css';
import { Extractor } from './modules/Extractor';
import { Observer } from './modules/Observer';

const container = document.createElement('div');
container.id = 'crxjs-app';
document.body.appendChild(container);

const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

function updatePrompts() {
  const prompts = Extractor.extractPrompts();
  if (prompts.length > 0 || window.location.href.includes('chatgpt.com')) {
    window.postMessage({ type: 'PROMPT_INDEX_UPDATE', prompts }, '*');
  }
}

const observer = new Observer(updatePrompts);
observer.start();

updatePrompts();

window.addEventListener('popstate', () => setTimeout(updatePrompts, 500));
window.addEventListener('pushstate', () => setTimeout(updatePrompts, 500));
window.addEventListener('replacestate', () => setTimeout(updatePrompts, 500));

