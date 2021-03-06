import { ComponentFactoryResolver, ComponentRef, Injectable, ViewContainerRef } from '@angular/core';

import { OverlayHostService } from '../overlay-host/overlay-host.service';

import { NotificationComponent } from '../../components/notification/notification.component';
import { I18nService } from '../i18n/i18n.service';

export type NotificationType = 'info' | 'success' | 'error' | 'warning';
export interface ToastConfig {
    message: string;
    translationVars?: { [key: string]: string | number };
    type?: NotificationType;
    duration?: number;
}

// How many ms before the toast is dismissed.
const TOAST_DURATION = 3000;

/**
 * Provides toast notification functionality.
 */
@Injectable()
export class NotificationService {
    private hostView: ViewContainerRef;
    private openToastRefs: Array<{ ref: ComponentRef<NotificationComponent>; timerId: any }> = [];

    constructor(
        private i18nService: I18nService,
        private resolver: ComponentFactoryResolver,
        overlayHostService: OverlayHostService,
    ) {
        overlayHostService.getHostView().then(view => {
            this.hostView = view;
        });
    }

    /**
     * Display a success toast notification
     */
    success(message: string, translationVars?: { [key: string]: string | number }): void {
        this.notify({
            message,
            translationVars,
            type: 'success',
        });
    }

    /**
     * Display an info toast notification
     */
    info(message: string, translationVars?: { [key: string]: string | number }): void {
        this.notify({
            message,
            translationVars,
            type: 'info',
        });
    }

    /**
     * Display a warning toast notification
     */
    warning(message: string, translationVars?: { [key: string]: string | number }): void {
        this.notify({
            message,
            translationVars,
            type: 'warning',
        });
    }

    /**
     * Display an error toast notification
     */
    error(message: string, translationVars?: { [key: string]: string | number }): void {
        this.notify({
            message,
            translationVars,
            type: 'error',
            duration: 20000,
        });
    }

    /**
     * Display a toast notification.
     */
    notify(config: ToastConfig): void {
        this.createToast(config);
    }

    /**
     * Load a ToastComponent into the DOM host location.
     */
    private createToast(config: ToastConfig): void {
        const toastFactory = this.resolver.resolveComponentFactory(NotificationComponent);
        const ref = this.hostView.createComponent<NotificationComponent>(toastFactory);
        const toast: NotificationComponent = ref.instance;
        const dismissFn = this.createDismissFunction(ref);
        toast.type = config.type || 'info';
        toast.message = config.message;
        toast.translationVars = this.translateTranslationVars(config.translationVars || {});
        toast.registerOnClickFn(dismissFn);

        let timerId;
        if (!config.duration || 0 < config.duration) {
            timerId = setTimeout(dismissFn, config.duration || TOAST_DURATION);
        }

        this.openToastRefs.unshift({ ref, timerId });
        setTimeout(() => this.calculatePositions());
    }

    /**
     * Returns a function which will destroy the toast component and
     * remove it from the openToastRefs array.
     */
    private createDismissFunction(ref: ComponentRef<NotificationComponent>): () => void {
        return () => {
            const toast: NotificationComponent = ref.instance;
            const index = this.openToastRefs.map(o => o.ref).indexOf(ref);

            if (this.openToastRefs[index]) {
                clearTimeout(this.openToastRefs[index].timerId);
            }

            toast.fadeOut().then(() => {
                ref.destroy();
                this.openToastRefs.splice(index, 1);
                this.calculatePositions();
            });
        };
    }

    /**
     * Calculate and set the top offsets for each of the open toasts.
     */
    private calculatePositions(): void {
        let cumulativeHeight = 10;

        this.openToastRefs.forEach(obj => {
            const toast: NotificationComponent = obj.ref.instance;
            toast.offsetTop = cumulativeHeight;
            cumulativeHeight += toast.getHeight() + 6;
        });
    }

    private translateTranslationVars(translationVars: {
        [key: string]: string | number;
    }): { [key: string]: string | number } {
        for (const [key, val] of Object.entries(translationVars)) {
            if (typeof val === 'string') {
                translationVars[key] = this.i18nService.translate(val);
            }
        }
        return translationVars;
    }
}
