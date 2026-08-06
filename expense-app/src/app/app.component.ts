import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { CustomToastComponent } from './components/custom-toast/custom-toast.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  standalone: true,
  imports: [IonApp, IonRouterOutlet, CustomToastComponent],
})
export class AppComponent {
  constructor() {}
}
