// Cancellable promise

"use strict";

/**
 * Cancellable promise
 */
export class CancellablePromise<T> {
    private resolve: (t: T) => void;
    private reject: (e: Error) => void;
    private onCancelHandler: () => void;

    /**
     * True if cancelled
     */
    public cancelled: boolean;

    constructor(promise: Promise<T>) {
        this.cancelled = false;
        promise.then(this.onResolve.bind(this)).catch(this.onError.bind(this));
    }

    private onResolve(t: T) {
        if (this.cancelled) {
            return;
        }

        if (this.resolve) {
            this.resolve(t);
        }
    }

    private onError(e: Error) {
        if (this.cancelled) {
            return;
        }

        if (this.reject) {
            this.reject(e);
        }
    }

    /**
     * Cancels the promise
     */
    public cancel() {
        this.cancelled = true;
        if (this.onCancelHandler) {
            this.onCancelHandler();
        }
    }

    /**
     * Sets promise fullfil handler
     * @param onFullfil Handler
     * @returns This
     */
    public then(onFullfil: (t: T) => void): this {
        this.resolve = onFullfil;
        return this;
    }

    /**
     * Sets promise rejection handler
     * @param onReject Handler
     * @returns This 
     */
    public catch(onReject: (e: Error) => void): this {
        this.reject = onReject;
        return this;
    }

    /**
     * Sets promise cancel handler
     * @param onCancel Handler 
     * @returns This
     */
    public onCancel(onCancel: () => void): this {
        this.onCancelHandler = onCancel;
        return this;
    }
}
