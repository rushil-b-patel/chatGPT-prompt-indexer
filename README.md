[chat-gpt-ext.webm](https://github.com/user-attachments/assets/1a07ae5a-5724-4a1b-8c29-64b46d483b3f)


## Quick Start

1. Clone the repository:

```bash
git clone https://github.com/rushil-b-patel/chatgpt-index-ext
```
2. Get into the Project folder:

```bash
cd chatgpt-index-ext
```

3. Install dependencies:

```bash
npm install
```

4. Install & initialize tailwindcss:
```bash
npm install tailwindcss @tailwindcss/vite
```

5. Build the extension for production:

```bash
npm run build
```

6. Open Chrome and navigate to `chrome://extensions/`, enable "Developer mode", and load the unpacked extension from the `dist` directory.

## Project Structure

- `src/popup/` - Extension popup UI
- `src/content/` - Content scripts
- `manifest.config.js` - Chrome extension manifest configuration

## Chrome Extension Development Notes

- Use `manifest.config.js` to configure your extension
- Content scripts should be placed in `src/content/`
- Popup UI should be placed in `src/popup/`
