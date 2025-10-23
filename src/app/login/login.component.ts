import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css'],
    standalone: false
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  mostrarRequerido: boolean = false;
  formSubmitted = false;
  isLoading: boolean = false;

  constructor(
    private authService: AuthService, 
    private apiService: ApiService,
    private router: Router
  ) {}

  async onLogin(): Promise<void> {
    this.formSubmitted = true;
    this.errorMessage = '';

    // Validación de campos vacíos
    if (this.email === '' || this.password === '') {
      this.mostrarRequerido = true;
      return;
    }

    this.isLoading = true;

    try {
      // Paso 1: Realizar el login
      const loginResponse = await firstValueFrom(
        this.authService.login(this.email, this.password)
      );

      console.log('Login exitoso:', loginResponse);

      // Paso 2: Obtener la lista de usuarios
      const usuarios = await firstValueFrom(
        this.apiService.listarUsuarios()
      );

      console.log('Usuarios obtenidos:', usuarios);

      // Paso 3: Buscar el usuario por email (normalizado para comparación)
      const emailNormalizado = this.email.toLowerCase().trim();
      const usuarioEncontrado = usuarios.find((usuario: any) => 
        usuario.email?.toLowerCase().trim() === emailNormalizado ||
        usuario.normalizedEmail?.toLowerCase().trim() === emailNormalizado
      );

      if (usuarioEncontrado) {
        // Paso 4: Guardar el ID del usuario en localStorage
        localStorage.setItem('user_id', usuarioEncontrado.id);
        localStorage.setItem('user_email', usuarioEncontrado.email);
        localStorage.setItem('user_name', usuarioEncontrado.userName);
        
        console.log('Usuario ID guardado en localStorage:', usuarioEncontrado.id);
        console.log('Datos del usuario guardados correctamente');

        // Paso 5: Redirigir a la página de inicio
        this.router.navigate(['/inicio']);
      } else {
        console.error('No se encontró el usuario en la lista');
        this.errorMessage = 'Error al obtener información del usuario';
        this.isLoading = false;
      }

    } catch (error: any) {
      console.error('Error en el proceso de login:', error);
      
      // Manejo de errores específico
      if (error.status === 401) {
        this.errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      } else if (error.status === 0) {
        this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else {
        this.errorMessage = 'Login fallido. Verifica tus credenciales.';
      }
      
      this.isLoading = false;
    }
  }
}