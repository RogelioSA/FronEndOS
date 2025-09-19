import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    standalone: false
})
export class LoginComponent{
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  mostrarRequerido: boolean = false;
  formSubmitted = false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin(): void {

    this.formSubmitted = true;

    if(this.email === '' || this.password === ''){
      this.mostrarRequerido = true;
      return;
    }

    this.authService.login(this.email, this.password).subscribe(
      (response) => {
        // Si el login es exitoso, redirige a la página de inicio
        this.router.navigate(['/inicio']);
      },
      (error) => {
        // Manejo de errores
        //console.log(error);
        this.errorMessage = 'Login fallido. Verifica tus credenciales.';
      }
    );
  }
}