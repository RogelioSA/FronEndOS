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
  esLoginConDocumento: boolean = false;
  mostrarPassword = false;
  isLoading = false;

  constructor(
    private authService: AuthService, 
    private apiService: ApiService,
    private router: Router
  ) {}

  // Método para detectar si es un documento (dos primeros caracteres son números)
  verificarTipoUsuario(): void {
    const usuario = this.email.trim();
    this.esLoginConDocumento = /^\d{2}/.test(usuario);
  }

  // Método para limpiar completamente localStorage, sessionStorage y cookies
  limpiarSesionCompleta(): void {
    console.log('Limpiando sesión anterior...');
    
    // Limpiar localStorage
    localStorage.clear();
    
    // Limpiar sessionStorage
    sessionStorage.clear();
    
    // Limpiar todas las cookies
    this.eliminarTodasLasCookies();
    
    console.log('Sesión limpiada completamente');
  }

  // Método para eliminar todas las cookies
  eliminarTodasLasCookies(): void {
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      // Eliminar la cookie en diferentes paths y dominios
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.' + window.location.hostname;
    }
  }

  async onLogin(): Promise<void> {
    this.formSubmitted = true;
    this.errorMessage = '';
    this.verificarTipoUsuario();

    // Validación de campos vacíos según el tipo de login
    if (this.email === '') {
      this.mostrarRequerido = true;
      return;
    }

    if (!this.esLoginConDocumento && this.password === '') {
      this.mostrarRequerido = true;
      return;
    }

    this.isLoading = true;

    // PRIMERO: Limpiar toda la sesión anterior
    this.limpiarSesionCompleta();

    try {
      if (this.esLoginConDocumento) {
        // Login con documento de identidad
        await this.loginConDocumento();
      } else {
        // Login tradicional con email y contraseña
        await this.loginTradicional();
      }
    } catch (error: any) {
      console.error('Error en el proceso de login:', error);
      
      // Manejo de errores específico
      if (error.status === 401) {
        this.errorMessage = 'Credenciales incorrectas. Verifica tus datos.';
      } else if (error.status === 0) {
        this.errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión.';
      } else {
        this.errorMessage = 'Login fallido. Verifica tus credenciales.';
      }
      
      this.isLoading = false;
    }
  }

  async loginConDocumento(): Promise<void> {
    // Login con documento (tipoDocumentoId = 1 por defecto) - Solo guardar token
    const loginResponse = await firstValueFrom(
      this.authService.loginDocumento(1, this.email.trim())
    );

    console.log('Login con documento exitoso:', loginResponse);

    // Guardar tipo como 'U' por defecto
    localStorage.setItem('tipo', 'U');
    
    // Redirigir a la página de inicio
    this.router.navigate(['/inicio']);
  }

  async loginTradicional(): Promise<void> {
    // Paso 1: Realizar el login tradicional
    const loginResponse = await firstValueFrom(
      this.authService.login(this.email, this.password)
    );

    console.log('Login exitoso:', loginResponse);

    // Paso 2: Obtener la lista de usuarios
    const usuarios = await firstValueFrom(
      this.apiService.listarUsuarios()
    );

    console.log('Usuarios obtenidos:', usuarios);

    // Paso 3: Buscar el usuario por email
    const emailNormalizado = this.email.toLowerCase().trim();
    const usuarioEncontrado = usuarios.find((usuario: any) => 
      usuario.email?.toLowerCase().trim() === emailNormalizado ||
      usuario.normalizedEmail?.toLowerCase().trim() === emailNormalizado
    );

    if (usuarioEncontrado) {
      // Paso 4: Guardar datos del usuario en localStorage
      this.guardarDatosUsuario(usuarioEncontrado);
      
      // Paso 5: Seleccionar automáticamente la primera empresa
      await this.seleccionarPrimeraEmpresa(usuarioEncontrado.id);
      
      // Paso 6: Redirigir a la página de inicio
      this.router.navigate(['/inicio']);
    } else {
      console.error('No se encontró el usuario en la lista');
      this.errorMessage = 'Error al obtener información del usuario';
      this.isLoading = false;
    }
  }

  async seleccionarPrimeraEmpresa(userId: number): Promise<void> {
    try {
      console.log('Obteniendo empresas del usuario:', userId);
      
      // Obtener las empresas del usuario
      const usuariosEmpresas = await firstValueFrom(
        this.apiService.listarUsuarioEmpresaPorUsuario(userId)
      );

      console.log('Empresas obtenidas:', usuariosEmpresas);

      if (usuariosEmpresas && usuariosEmpresas.length > 0) {
        const primeraEmpresa = usuariosEmpresas[0];
        const empresaId = primeraEmpresa.empresaId;

        console.log('Seleccionando primera empresa:', primeraEmpresa.empresa?.nombre, 'ID:', empresaId);

        // Guardar empresa ID en localStorage
        localStorage.setItem('empresa_id', empresaId.toString());

        // Realizar el cambio de tenant
        const body = {
          email: this.email,
          empresaId: empresaId
        };

        console.log('Cambiando tenant con body:', body);

        const result = await firstValueFrom(
          this.apiService.changeTenant(body)
        );

        console.log('Resultado del cambio de tenant:', result);

        if (result && result.accessToken) {
          // Actualizar el token con el de la empresa seleccionada
          localStorage.setItem('auth_token', result.accessToken);
          console.log('Token actualizado correctamente con empresa:', primeraEmpresa.empresa?.nombre);
        } else {
          console.warn('No se recibió token en el cambio de tenant');
        }
      } else {
        console.log('No hay empresas asociadas al usuario');
      }
    } catch (error) {
      console.error('Error al seleccionar la primera empresa:', error);
      // No lanzamos el error para que el login continúe
    }
  }

  guardarDatosUsuario(usuario: any): void {
    localStorage.setItem('user_id', usuario.id);
    localStorage.setItem('user_email', usuario.email);
    localStorage.setItem('user_name', usuario.userName);
    
    console.log('Usuario ID guardado en localStorage:', usuario.id);
    console.log('Datos del usuario guardados correctamente');
  }

}