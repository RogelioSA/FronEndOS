import { HttpClient, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable({providedIn: 'root'})
export class ApiService{

    private baseUrl = 'https://7p4yx3l258.execute-api.us-east-1.amazonaws.com';

    constructor(private https: HttpClient){}

    // Función para obtener el token desde las cookies
    private getToken(): string | null {
      return localStorage.getItem('auth_token'); // ya lo guardas así en login()
    }
    
    getHttpHeaders(): HttpHeaders {
      const token = localStorage.getItem('auth_token');
      return token 
        ? new HttpHeaders().set('Authorization', `Bearer ${token}`) 
        : new HttpHeaders();
    }

    // Función para obtener los encabezados con el token
    private getHeaders(): HttpHeaders {
        const token = this.getToken();
        let headers = new HttpHeaders();
        if (token) {
        headers = headers.set('Authorization', `Bearer ${token}`);
        }
        return headers;
    }

    getRoles(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Seguridad/GetRol`, {
        });
    }

    sincronizarRol(rol: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Seguridad/SincronizarRol`, {
          headers: this.getHeaders(),
          params: rol
        });
    }

    getDepartamentos(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/GetDepartamento`, {
        });
    }

    sincronizarDepartamento(departamento: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/SincronizarDepartamento`, {
          headers: this.getHeaders(),
          params: departamento
        });
    }

    getAreas(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/GetArea`, {
        });
    }

    sincronizarArea(area: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/SincronizarArea`, {
          headers: this.getHeaders(),
          params: area
        });
    }

    getCondicionesContract(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/GetCondicionContractual`, {
        });
    }

    sincronizarCondicionesContract(condicionContract: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/SincronizarCondicionContractual`, {
          headers: this.getHeaders(),
          params: condicionContract
        });
    }

    getContratoTipos(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/GetContratoTipo`, {
        });
    }

    sincronizarContratoTipo(contratoTipo: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/SincronizarContratoTipo`, {
          headers: this.getHeaders(),
          params: contratoTipo
        });
    }

    getCargos(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/GetCargo`, {
        });
    }

    sincronizarCargo(cargo: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/SincronizarCargo`, {
          headers: this.getHeaders(),
          params: cargo
        });
    }

    getPersonalSituaciones(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/GetPersonalSituacion`, {
        });
    }

    sincronizarPersonalSituacion(personalSituacion: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/SincronizarPersonalSituacion`, {
          headers: this.getHeaders(),
          params: personalSituacion
        });
    }

    getLicenciaCategorias(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/GetLicenciaCategoria`, {
        });
    }

    getPersonal(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Empleado/GetEmpleado`, {
        });
    }

    sincronizarPersonal(personal: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Empleado/SincronizarEmpleado`, {
          headers: this.getHeaders(),
          params: personal
        });
    }

    getMenus(): Observable<any> {
      return this.https.get(`${this.baseUrl}/security/Formulario`, {
        headers: this.getHttpHeaders()
      });
    }

    sincronizarMenu(menu: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Seguridad/SincronizarMenu`, {
          headers: this.getHeaders(),
          params: menu
        });
    }

    getRolMenus(rol: number ): Observable<any> {
        const url = `${this.baseUrl}/Seguridad/GetRolMenu`;
        const params = {
            nRol: rol
          };
        const headers = this.getHeaders();
        
        return this.https.get<any>(url, { headers: headers, params: params });
    }

    sincronizarRolMenu(rol: number, menus: any ): Observable<any> {
        const url = `${this.baseUrl}/Seguridad/SincronizarRolMenu`;
        const params = {
            nRol: rol,
            menus: menus
          };
        const headers = this.getHeaders();
        
        return this.https.get<any>(url, { headers: headers, params: params });
    }

    getRolUsuarios(rol: number ): Observable<any> {
        const url = `${this.baseUrl}/Seguridad/GetRolUsuario`;
        const params = {
            nRol: rol
          };
        const headers = this.getHeaders();
        
        return this.https.get<any>(url, { headers: headers, params: params });
    }

    sincronizarRolUsuario(rol: number, usuarios: any ): Observable<any> {
        const url = `${this.baseUrl}/Seguridad/SincronizarRolUsuario`;
        const params = {
            nRol: rol,
            usuarios: usuarios
          };
        const headers = this.getHeaders();
        
        return this.https.get<any>(url, { headers: headers, params: params });
    }

    getTiposServicio(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/GetTipoServicio`, {
        });
    }

    sincronizarTipoServicio(tipoServicio: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/SincronizarTipoServicio`, {
          headers: this.getHeaders(),
          params: tipoServicio
        });
    }

    getDescansos(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Horario/GetDescanso`, {
        });
    }

    sincronizarDescanso(descanso: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Horario/SincronizarDescanso`, {
          headers: this.getHeaders(),
          params: descanso
        });
    }

    getHorarios(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Horario/GetHorario`, {
        });
    }

    sincronizarHorario(horario: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Horario/SincronizarHorario`, {
          headers: this.getHeaders(),
          params: horario
        });
    }

    getHorarioDescansos(horario: number ): Observable<any> {
        const url = `${this.baseUrl}/Horario/GetHorarioDescanso`;
        const params = {
            nHorario: horario
          };
        const headers = this.getHeaders();
        
        return this.https.get<any>(url, { headers: headers, params: params });
    }

    getOrdenesCombo(): Observable<any> {
        return this.https.get(`${this.baseUrl}/OrdenServicio/GetOrdenServicioCorto`, {
        });
    }

    getAsignacionPersonalHorario(ordenServicio: number, anio: number, semana: number): Observable<any> {

        const url = `${this.baseUrl}/OrdenServicio/GetAsignacionPersonalHorario`;
        const params = {
            nOrdenServicio: ordenServicio,
            nAnio: anio,
            nSemana: semana
          };
        const headers = this.getHeaders();
        
        return this.https.get<any>(url, { headers: headers, params: params });
    }

    sincronizarAsignacionPersonalHorario(ordenServicio: number, anio: number, semana: number, personalHorarios: any ): Observable<any> {
        const url = `${this.baseUrl}/OrdenServicio/SincronizarAsignacionPersonalHorario`;

        const params = {
            nOrdenServicio: ordenServicio,
            nAnio: anio,
            nSemana: semana
          };
        const headers = this.getHeaders();
        
        return this.https.post<any>(url, personalHorarios, { headers: headers, params: params });
    }

    getMarcaciones(fechaInicial: string, fechaFinal: string): Observable<any> {
        const url = `${this.baseUrl}/Empleado/GetMarcacion`;
        const params = {
            dFechaInicial: fechaInicial,
            dFechaFinal: fechaFinal
          };
        const headers = this.getHeaders();
        
        return this.https.get<any>(url, { headers: headers, params: params });
    }

    getClientes(): Observable<any> {
        return this.https.get(`${this.baseUrl}/Cliente/GetCliente`, {
        });
    }

    sincronizarCliente(cliente: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Cliente/SincronizarCliente`, {
          headers: this.getHeaders(),
          params: cliente
        });
    }

    getTiposActivo(): Observable<any> {
        return this.https.get(`${this.baseUrl}/OrdenServicio/GetTipoActivo`, {
        });
    }

    sincronizarTipoActivo(tipoActivo: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/OrdenServicio/SincronizarTipoActivo`, {
          headers: this.getHeaders(),
          params: tipoActivo
        });
    }

    getParametrosActivo(tipoActivo: any): Observable<any> {
        const url = `${this.baseUrl}/OrdenServicio/GetParametroActivo`;
        const params = {
            nTipoActivo: tipoActivo
          };
        const headers = this.getHeaders();
        
        return this.https.get<any>(url, { headers: headers, params: params });
    }

    sincronizarParametroActivo(parametroActivo: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/OrdenServicio/SincronizarParametroActivo`, {
          headers: this.getHeaders(),
          params: parametroActivo
        });
    }

    getMarcasActivo(): Observable<any> {
        return this.https.get(`${this.baseUrl}/OrdenServicio/GetMarcaActivo`, {
        });
    }

    sincronizarMarcaActivo(marcaActivo: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/OrdenServicio/SincronizarMarcaActivo`, {
          headers: this.getHeaders(),
          params: marcaActivo
        });
    }

    getModelosActivo(marcaActivo: any): Observable<any> {
        const url = `${this.baseUrl}/OrdenServicio/GetModeloActivo`;
        const params = {
            nMarcaActivo: marcaActivo
          };
        const headers = this.getHeaders();
        
        return this.https.get<any>(url, { headers: headers, params: params });
    }

    sincronizarModeloActivo(modeloActivo: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/OrdenServicio/SincronizarModeloActivo`, {
          headers: this.getHeaders(),
          params: modeloActivo
        });
    }

    getActivos(): Observable<any> {
      return this.https.get(`${this.baseUrl}/OrdenServicio/GetActivo`, {
      });
    }

    sincronizarActivo(activo: any ): Observable<any> {

      const url = `${this.baseUrl}/OrdenServicio/SincronizarActivo`;
      let parametros = activo.parametros;

      console.log(activo, 'servicio')

      const params: any = {};
      if (activo.nCodigo !== undefined) params.nCodigo = activo.nCodigo;
      if (activo.cNombre !== undefined) params.cNombre = activo.cNombre;
      if (activo.cDetalle !== undefined) params.cDetalle = activo.cDetalle;
      if (activo.cNumeroSerie !== undefined) params.cNumeroSerie = activo.cNumeroSerie;
      if (activo.cColor !== undefined) params.cColor = activo.cColor;
      if (activo.nAnioFabricacion !== undefined) params.nAnioFabricacion = activo.nAnioFabricacion;
      if (activo.nTipoActivoServicio !== undefined) params.nTipoActivoServicio = activo.nTipoActivoServicio;
      if (activo.nMarca !== undefined) params.nMarca = activo.nMarca;
      if (activo.nModelo !== undefined) params.nModelo = activo.nModelo;
      if (activo.nClientePropietario !== undefined) params.nClientePropietario = activo.nClientePropietario;
      if (activo.cTipo !== undefined) params.cTipo = activo.cTipo;
      
      const headers = this.getHeaders();
      
      return this.https.post<any>(url, parametros, { headers: headers, params: params });
    }

    getActivoPorCodigo(codigo: number): Observable<any> {
      const url = `${this.baseUrl}/OrdenServicio/GetActivoPorCodigo`;
      const params = {
          nCodigo: codigo
        };
      const headers = this.getHeaders();
      
      return this.https.get<any>(url, { headers: headers, params: params });
    }

}