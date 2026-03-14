[chat-gpt-ext.webm](https://github.com/user-attachments/assets/1a07ae5a-5724-4a1b-8c29-64b46d483b3f)

# ChatGPT Prompt Indexer

A Chrome extension that injects a floating, draggable sidebar into ChatGPT. It auto-indexes all your prompts in a conversation and lets you click any one to instantly scroll back to it.

---

## Demo

> Open a long ChatGPT conversation, the sidebar appears automatically on the right side of the screen.

---

## Features

- Indexes every user prompt in the current conversation
- Click any prompt to smooth-scroll to it
- Search/filter prompts
- Draggable widget, reposition anywhere on screen
- Adapts to ChatGPT's theme

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/rushil-b-patel/chatgpt-index-ext

# 2. Enter the project folder
cd chatgpt-index-ext

# 3. Install dependencies
npm install

# 4. Build the extension
npm run build
```

- open `chrome://extensions/`
- enable **Developer Mode**
- click **Load Unpacked**
- select the `dist/` folder of this cloned repo.

---

## Project Structure

```
src/
  content/
    modules/
      Extractor.js     ← Scrapes user prompts from ChatGPT's DOM
      Observer.js      ← Watches DOM for changes
    views/
      App.jsx          ← Floating sidebar UI (React)
      App.css          ← Tailwind styles
    main.jsx           ← (Scripts start here) mounts React app, wires everything together
  popup/
    App.jsx            ← Toolbar popup UI (UI when you click on the extension icon)
    index.html
    main.jsx
manifest.config.js     ← Chrome extension manifest file (MV3)
vite.config.js         ← Build config
```

---

## Architecture Overview

The extension has two independent parts:

| Part | Location | Purpose |
|---|---|---|
| Content Script | `src/content/` | Injected into chatgpt.com. Scrapes DOM, runs observer, mounts UI. |
| Popup | `src/popup/` | Shown when you click the extension icon. Static info only. |

The content script is further split into three responsibilities:

```
main.jsx  ──────►  Extractor.js   (reads DOM → returns prompts array)
    │
    └───────────►  Observer.js    (watches DOM → triggers re-extraction)
    │
    └───────────►  App.jsx        (React UI → receives prompts via postMessage)
```

---

## How It Works: Full Flow

### Step 1: Chrome injects the content script

The manifest declares:

```js
content_scripts: [{
  js: ['src/content/main.jsx'],
  matches: ['https://chatgpt.com/*'],
}]
```

Whenever you open any page on `chatgpt.com`, Chrome automatically runs `main.jsx` inside that page's context.

---

### Step 2: React app is mounted into ChatGPT's DOM

`main.jsx` creates a new `<div>` and appends it to ChatGPT's `document.body`, then mounts the React app inside it:

```js
const container = document.createElement('div');
container.id = 'crxjs-app';
document.body.appendChild(container);
createRoot(container).render(<App />);
```

The floating sidebar now exists in the page but renders nothing until prompts are found.

---

### Step 3: Prompts are extracted from the DOM

`Extractor.js` queries ChatGPT's DOM for user messages using the attribute ChatGPT applies to every user turn:

```js
document.querySelectorAll('[data-message-author-role="user"]')
```

For each element found, it pulls the inner text from the `.whitespace-pre-wrap` child node (where the actual message text lives), trims it, and filters out blanks.

Result: a clean array like:
```js
["What is React?", "How does useState work?", "Explain useEffect"]
```

---

### Step 4: Prompts are sent to the React app via postMessage

`main.jsx` calls `updatePrompts()`, which runs the extractor and posts the result to the window:

```js
function updatePrompts() {
  const prompts = Extractor.extractPrompts();
  if (prompts.length > 0 || window.location.href.includes('chatgpt.com')) {
    window.postMessage({ type: 'PROMPT_INDEX_UPDATE', prompts }, '*');
  }
}
```

The React app listens for this message:

```js
window.addEventListener('message', (event) => {
  if (event.source !== window || event.data?.type !== 'PROMPT_INDEX_UPDATE') return;
  setPrompts(event.data.prompts || []);
});
```
---

### Step 5: DOM changes are watched via MutationObserver

`Observer.js` wraps the browser's native `MutationObserver`. It watches `document.body` for any DOM mutations (new nodes, text changes, subtree changes):

```js
this.observer.observe(document.body, {
  childList: true,
  subtree: true,
  characterData: true,
});
```

Every mutation triggers `updatePrompts()` — but with a **500ms debounce**. This is critical because ChatGPT streams responses token-by-token, causing dozens of DOM mutations per second. Without debouncing, `updatePrompts()` would fire hundreds of times unnecessarily.

---

### Step 6: SPA navigation is handled

ChatGPT is a Single Page App — switching conversations doesn't reload the page. The browser's History API is used to change the URL silently.

`main.jsx` listens for navigation events to re-index on conversation switch:

```js
window.addEventListener('popstate', () => setTimeout(updatePrompts, 500));
window.addEventListener('pushstate', () => setTimeout(updatePrompts, 500));
window.addEventListener('replacestate', () => setTimeout(updatePrompts, 500));
```

| Event | Fired by | When |
|---|---|---|
| `popstate` | Browser natively | Back / Forward button |
| `pushstate` | Must be dispatched manually | `history.pushState()` call |
| `replacestate` | Must be dispatched manually | `history.replaceState()` call |

The `setTimeout(..., 500)` gives ChatGPT 500ms to finish rendering the new conversation before scraping.

---

### Step 7: The UI renders the index

`App.jsx` renders the floating widget. Key behaviors:
