import { Component, ViewChild } from '@angular/core';
import { AnalogClockComponent } from '../analog-clock/analog-clock.component';
import { jwtDecode, JwtPayload } from 'jwt-decode';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-marcacion',
    templateUrl: './marcacion.component.html',
    styleUrl: './marcacion.component.css',
    standalone: false
})
export class MarcacionComponent {

  @ViewChild('reloj') relojComponent!: AnalogClockComponent;
  hoy: Date = new Date();
  fecha : any;

  claims: any;

  constructor(private authService: AuthService){
    
  }

  ngOnInit(){
    this.claims = this.authService.getClaims();
    this.fecha = this.hoy.toLocaleDateString('en-GB')
  }

  marcar(){
      console.log(this.claims);

  }

}
