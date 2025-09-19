import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { tap } from 'rxjs/operators';
import { jwtDecode, JwtPayload } from 'jwt-decode';

interface PayloadJwtPersonalizado extends JwtPayload {
    nCodigo: number;  // Define que el token contiene un claim "user"
    cUsuario: string;
    cApPater: string;
    cApMater: string;
    cNombres: string;
}

@Injectable({providedIn: 'root'})
export class AuthService{

    private apiUrl = 'https://7p4yx3l258.execute-api.us-east-1.amazonaws.com/security'; // Cambia por tu URL del servidor
    private loginUrl = `${this.apiUrl}/Auth/login`;

    constructor(private http: HttpClient) {}

    // Función para hacer login y obtener el token
    login(email: string, password: string): Observable<any> {
        const body = { email, password };
        
        return this.http.post<any>(this.loginUrl, body).pipe(
        tap(response => {
            if (response.accessToken) {
            // Almacenar el token en localStorage o sessionStorage
            localStorage.setItem('auth_token', response.accessToken);
            }
        })
        );

        // const params = new HttpParams()
        //     .append('username',username)
        //     .append('password',password)

        // return this.http.post(`${this.apiUrl}/Auth/login`, null, {
        //     headers: headers,
        //     params: params
        //   });
    }

    // Verificar si el usuario está autenticado
    isAuthenticated(): boolean {
        return !!localStorage.getItem('auth_token');
    }

    // Obtener el token almacenado
    getToken(): string | null {
        return localStorage.getItem('auth_token');
    }

    // Log out
    logout(): void {
        localStorage.removeItem('auth_token');
    }

    // Método para agregar el token a las solicitudes HTTP
    getHttpHeaders(): HttpHeaders {
        const token = this.getToken();
        return token ? new HttpHeaders().set('Authorization', `Bearer ${token}`) : new HttpHeaders();
    }
    
    getClaims() : PayloadJwtPersonalizado{
        let token = this.getToken();
        var decoded = jwtDecode<PayloadJwtPersonalizado>(token!);

        return decoded;
    }
}