import { HttpClient, HttpHeaders } from "@angular/common/http"; 
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';
import { jwtDecode, JwtPayload } from 'jwt-decode';

interface PayloadJwtPersonalizado extends JwtPayload {
  nCodigo: number;
  cUsuario: string;
  cApPater: string;
  cApMater: string;
  cNombres: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'https://7p4yx3l258.execute-api.us-east-1.amazonaws.com/security';
  private loginUrl = `${this.apiUrl}/Auth/login`;
  private loginDocumentoUrl = `${this.apiUrl}/Auth/login_document`; // 👈 Nuevo endpoint

  constructor(private http: HttpClient) {}

  // 🔹 Login tradicional (email y password)
  login(email: string, password: string): Observable<any> {
    const body = { email, password };

    return this.http.post<any>(this.loginUrl, body).pipe(
      tap(response => {
        if (response.accessToken) {
          localStorage.setItem('auth_token', response.accessToken);
        }
      })
    );
  }

  // 🔹 Nuevo login por documento
  loginDocumento(tipoDocumentoId: number, documentoIdentidad: string): Observable<any> {
    const body = {
      tipoDocumentoId,
      documentoIdentidad
    };

    return this.http.post<any>(this.loginDocumentoUrl, body).pipe(
      tap(response => {
        if (response.accessToken) {
          localStorage.setItem('auth_token', response.accessToken);
        }
      })
    );
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  // Obtener el token almacenado
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  // Cerrar sesión
  logout(): void {
    localStorage.removeItem('auth_token');
  }

  // Agregar token a los headers
  getHttpHeaders(): HttpHeaders {
    const token = this.getToken();
    return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
  }

  // Decodificar claims del token JWT
  getClaims(): PayloadJwtPersonalizado {
    const token = this.getToken();
    const decoded = jwtDecode<PayloadJwtPersonalizado>(token!);
    return decoded;
  }
}
