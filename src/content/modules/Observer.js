export class Observer {
    constructor(callback, debounceTime = 500) {
        this.callback = callback;
        this.debounceTime = debounceTime;
        this.timeout = null;
        this.observer = new MutationObserver(this.handleMutation.bind(this));
    }

    handleMutation(mutations) {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        this.timeout = setTimeout(() => {
            this.callback();
        }, this.debounceTime);
    }

    start() {
        this.observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
        });
    }

    stop() {
        this.observer.disconnect();
        if (this.timeout) clearTimeout(this.timeout);
    }
}
