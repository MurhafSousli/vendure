import { ComponentFactoryResolver, Injectable, ViewContainerRef } from '@angular/core';
import { Type } from '@angular/core/src/type';
import { Observable, of } from 'rxjs';

import { OverlayHostService } from '../../../core/providers/overlay-host/overlay-host.service';
import { ModalDialogComponent } from '../../components/modal-dialog/modal-dialog.component';

/**
 * Any component intended to be used with the ModalService.fromComponent() method must implement
 * this interface.
 */
export interface Dialog<R = any> {
    /**
     * Function to be invoked in order to close the dialog when the action is complete.
     * The Observable returned from the .fromComponent() method will emit the value passed
     * to this method and then complete.
     */
    resolveWith: (result?: R) => void;
}

/**
 * Options to configure the behaviour of the modal.
 */
export interface ModalOptions<T> {
    /** Sets the width of the dialog */
    size?: 'sm' | 'md' | 'lg' | 'xl';
    /**
     * When true, the "x" icon is shown
     * and clicking it or the mask will close the dialog
     */
    closable?: boolean;
    /**
     * Values to be passed directly to the component.
     */
    locals?: Partial<T>;
}

/**
 * This service is responsible for instantiating a ModalDialog component and
 * embedding the specified component within.
 */
@Injectable()
export class ModalService {
    hostView: ViewContainerRef;

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver,
        overlayHostService: OverlayHostService,
    ) {
        overlayHostService.getHostView().then(view => {
            this.hostView = view;
        });
    }

    /**
     * Create a modal from a component. The component must implement the {@link Dialog} interface.
     * Additionally, the component should include templates for the title and the buttons to be
     * displayed in the modal dialog. See example:
     *
     * @example
     * ```
     * class MyDialog implements Dialog {
     *  resolveWith: (result?: any) => void;
     *
     *  okay() {
     *    doSomeWork().subscribe(result => {
     *      this.resolveWith(result);
     *    })
     *  }
     *
     *  cancel() {
     *    this.resolveWith(false);
     *  }
     * }
     * ```
     *
     * ```
     * <ng-template vdrDialogTitle>Title of the modal</ng-template>
     *
     * <p>
     *     My Content
     * </p>
     *
     * <ng-template vdrDialogButtons>
     *     <button type="button"
     *             class="btn"
     *             (click)="cancel()">Cancel</button>
     *     <button type="button"
     *             class="btn btn-primary"
     *             (click)="okay()">Okay</button>
     * </ng-template>
     * ```
     */
    fromComponent<T extends Dialog<any>, R>(
        component: Type<T> & Type<Dialog<R>>,
        options?: ModalOptions<T>,
    ): Observable<R | undefined> {
        const modalFactory = this.componentFactoryResolver.resolveComponentFactory(ModalDialogComponent);
        const modalComponentRef = this.hostView.createComponent(modalFactory);
        const modalInstance: ModalDialogComponent<any> = modalComponentRef.instance;
        modalInstance.childComponentType = component;
        modalInstance.options = options;

        return new Observable(subscriber => {
            modalInstance.closeModal = (result: any) => {
                modalComponentRef.destroy();
                subscriber.next(result);
                subscriber.complete();
            };
        });
    }
}
