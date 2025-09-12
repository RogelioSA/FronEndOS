import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    standalone: false
})
export class LoginComponent implements OnInit{
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  mostrarRequerido: boolean = false;
  formSubmitted = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.setupLicenseObserver();
  }

  onLogin(): void {

    this.formSubmitted = true;

    if(this.username === '' || this.password === ''){
      this.mostrarRequerido = true;
      return;
    }

    this.authService.login(this.username, this.password).subscribe(
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

  setupLicenseObserver() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeName === 'DX-LICENSE') {
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