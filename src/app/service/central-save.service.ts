import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Components } from '../enum/components.enum';

/**
 * @description
 * Centralized service to manage save triggers for multiple components.
 * Allows components to register themselves for save operations and 
 * notifies them when a save is triggered.
 *
 * @example
 * // Inject the service in a component
 * constructor(private centralSaveService: CentralSaveService) {}
 *
 * // Register component for save notifications
 * this.centralSaveService.registerSave(Components.MyComponent);
 *
 * // Subscribe to save trigger
 * this.centralSaveService.saveTriggered$.subscribe(component => {
 *   if (component === Components.MyComponent) {
 *     this.saveData();
 *   }
 * });
 */
@Injectable({
  providedIn: 'root'
})
export class CentralSaveService {

  /**
   * List of registered components that require save operations.
   */
  private components: Components[] = [];

  /**
   * Subject used to notify registered components when a save operation is triggered.
   */
  private saveTrigger = new Subject<Components>();

  /**
   * Observable that emits when a save is triggered for a component.
   */
  saveTriggered$ = this.saveTrigger.asObservable();

  /**
   * Subject used to handle unsubscription logic.
   */
  unsubscribe$ = new Subject<void>();

  /**
   * Registers a component for save operations.
   * Ensures that the component is only added once.
   *
   * @param componentName - The component to register.
   */
  registerSave(componentName: Components) {
    if (!this.components.includes(componentName)) {
      this.components.push(componentName);
    }
  }

  /**
   * Triggers save for all registered components by emitting a save event.
   * Also resets the unsubscription subject.
   */
  triggerSave() {
    this.unsubscribe$ = new Subject<void>();
    this.components.forEach(component => this.saveTrigger.next(component));
    this.unsubscribe();
  }

  /**
   * Clears the registered components list and completes the unsubscription subject.
   */
  clear() {
    this.components = [];
    this.unsubscribe();
  }

  /**
   * Completes the `unsubscribe$` subject to prevent memory leaks.
   */
  private unsubscribe() {
    this.unsubscribe$.complete();
  }

}
