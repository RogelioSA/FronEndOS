import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { locale, loadMessages } from 'devextreme/localization';
import * as messages from 'devextreme/localization/messages/es.json';
import { filter } from 'rxjs';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
    standalone: false
})
export class AppComponent implements OnInit{
  title = 'ProyectoLoJusto';
  showComponent: boolean = true;

  ngOnInit(): void {
    this.setupLicenseObserver();
  }

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

  setupLicenseObserver() {
    // Solución inmediata al cargar el componente
    setTimeout(() => {
        const licenseElements = document.querySelectorAll('dx-license, dx-license-trigger, .dx-watermark');
        licenseElements.forEach(element => {
            (element as HTMLElement).style.display = 'none';
            (element as HTMLElement).remove();
        });
    }, 100);
    
    // Observador para elementos que puedan aparecer después
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeName === 'DX-LICENSE' || 
                    node.nodeName === 'DX-LICENSE-TRIGGER' ||
                    (node.nodeType === 1 && (node as HTMLElement).classList.contains('dx-watermark'))) {
                    (node as HTMLElement).remove();
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
  }

}
