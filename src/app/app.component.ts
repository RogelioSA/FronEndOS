import { Component } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { locale, loadMessages } from 'devextreme/localization';
import * as messages from 'devextreme/localization/messages/es.json';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'ProyectoLoJusto';
  showComponent: boolean = true;

  constructor(private router: Router){
    loadMessages(messages);
    locale('es');  // Establecer el idioma a español de devextreme

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      // Verifica si la ruta actual es 'login'
      this.showComponent = this.router.url !== '/login';
    });
  }

}
