import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-inicio',
    templateUrl: './inicio.component.html',
    styleUrl: './inicio.component.css',
    standalone: false
})
export class InicioComponent {

  constructor(private authService: AuthService){

  }

  buscar(){
    this.authService.logout();
    window.location.reload();
  }

}
