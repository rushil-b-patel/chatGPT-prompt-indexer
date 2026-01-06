export class Extractor {
    static getSelectors() {
        return [
            '[data-message-author-role="user"]',
            '.group\\/conversation-turn:has(.whitespace-pre-wrap)',
        ];
    }

    static extractPrompts() {
        const rawMessages = document.querySelectorAll('[data-message-author-role="user"]');
        return Array.from(rawMessages).map((msg) => {
            const textNode = msg.querySelector('.whitespace-pre-wrap') || msg;
            return textNode.textContent.trim();
        }).filter(text => text.length > 0);
    }
}
