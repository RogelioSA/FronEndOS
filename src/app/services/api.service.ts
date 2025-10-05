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
        return this.https.get(`${this.baseUrl}/security/Rol`, {
          headers: this.getHttpHeaders()
        });
    }

    sincronizarRol(data: any): Observable<any> {
      return this.https.post(`${this.baseUrl}/security/Rol`, data, {
        headers: this.getHttpHeaders()
      });
    }
    
    actualizarRol(roleId: number, data: any): Observable<any> {
      return this.https.put(`${this.baseUrl}/security/Rol/${roleId}`, data, {
        headers: this.getHttpHeaders()
      });
    }

    eliminarRol(roleId: number): Observable<any> {
      return this.https.delete(`${this.baseUrl}/security/Rol/${roleId}`, {
        headers: this.getHttpHeaders()
      });
    }
    
 
    //departamento
    getDepartamentos(): Observable<any> {
        return this.https.get(`${this.baseUrl}/general/Departamento`, {
          headers: this.getHttpHeaders()
        });
    }

    crearDepartamento(data: any): Observable<any> {
      return this.https.post(`${this.baseUrl}/general/Departamento`, data, {
        headers: this.getHttpHeaders()
      });
    }
    actualizarDepartamento(id: number, body: any): Observable<any> {
      return this.https.put(`${this.baseUrl}/general/Departamento/${id}`, body, {
        headers: this.getHttpHeaders()
      });
    }

    eliminarDepartamento(id: number): Observable<any> {
      return this.https.delete(`${this.baseUrl}/general/Departamento/${id}`, {
        headers: this.getHttpHeaders()
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
    //legal

    getContratoTipos(): Observable<any> {
        return this.https.get(`${this.baseUrl}/legal/ContratoTipo`, {
          headers: this.getHttpHeaders()
        });
    }

    crearContratoTipo(data: any): Observable<any> {
      return this.https.post(`${this.baseUrl}/legal/ContratoTipo`, {
          nombre: data.nombre,
          detalle: data.detalle
        }, {
          headers: this.getHttpHeaders()
        });
    }
    actualizarContratoTipo(id: number, data: any): Observable<any> {
      return this.https.put(`${this.baseUrl}/legal/ContratoTipo/${id}`, {
          nombre: data.nombre,
          detalle: data.detalle
        }, {
          headers: this.getHttpHeaders()
        });
    }
    eliminarContratoTipo(id: number): Observable<any> {
      return this.https.delete(`${this.baseUrl}/legal/ContratoTipo/${id}`, {
        headers: this.getHttpHeaders()
      });
    }

    sincronizarContratoTipo(contratoTipo: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Maestro/SincronizarContratoTipo`, {
          headers: this.getHeaders(),
          params: contratoTipo
        });
    }
    // cargos
    getCargos(): Observable<any> {
        return this.https.get(`${this.baseUrl}/rrhh/Cargo`, {
          headers: this.getHttpHeaders()
        });
    }

    crearCargo(cargo: any): Observable<any> {
      return this.https.post(`${this.baseUrl}/rrhh/Cargo`, cargo, {
        headers: this.getHttpHeaders()
      });
    }

    actualizarCargo(id: number, cargo: any): Observable<any> {
      return this.https.put(`${this.baseUrl}/rrhh/Cargo/${id}`, cargo, {
        headers: this.getHttpHeaders()
      });
    }

    eliminarCargo(id: number): Observable<any> {
      return this.https.delete(`${this.baseUrl}/rrhh/Cargo/${id}`, {
        headers: this.getHttpHeaders()
      });
    }

    //
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
        return this.https.get(`${this.baseUrl}/general/Persona`, {
          headers: this.getHttpHeaders()
        });
    }

    createPersonal(personal: any): Observable<any> {
      return this.https.post(`${this.baseUrl}/general/Persona`, personal, {
        headers: this.getHttpHeaders()
      });
    }

    sincronizarPersonal(personal: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Empleado/SincronizarEmpleado`, {
          headers: this.getHeaders(),
          params: personal
        });
    }

    getSexo(): Observable<any> {
      return this.https.get(`${this.baseUrl}/general/Sexo`, {
        headers: this.getHttpHeaders()
      });
    }
    getLicenciaConducir(): Observable<any> {
      return this.https.get(`${this.baseUrl}/general/LicenciaConducir`, {
        headers: this.getHttpHeaders()
      });
    }

    getDocumentoTipo(): Observable<any> {
      return this.https.get(`${this.baseUrl}/general/DocumentoTipo`, {
        headers: this.getHttpHeaders()
      });
    }

    getDistritos(): Observable<any> {
      return this.https.get(`${this.baseUrl}/general/Distrito`, {
        headers: this.getHttpHeaders()
      });
    }
    
    updatePersonal(id: number, data: any): Observable<any> {
      return this.https.put(
        `${this.baseUrl}/general/Persona/${id}`,
        data,
        { headers: this.getHttpHeaders() }
      );
    }

    deletePersonal(id: number): Observable<any> {
      return this.https.delete(
        `${this.baseUrl}/general/Persona/${id}`,
        { headers: this.getHttpHeaders() }
      );
    }

    getPersonalById(id: number): Observable<any> {
      return this.https.get(
        `${this.baseUrl}/rrhh/Personal/${id}`,
        { headers: this.getHttpHeaders() }
      );
    }

    asignarPersonal(data: any): Observable<any> {
      return this.https.post(
        `${this.baseUrl}/personal/asignar`,
        data,
        { headers: this.getHttpHeaders() }
      );
    }

    getPersonas(): Observable<any[]> {
      return this.https.get<any[]>(
        `${this.baseUrl}/general/Persona`,
        { headers: this.getHttpHeaders() }
      );
    }

    getHorarios(): Observable<any> {
      return this.https.get(
        `${this.baseUrl}/rrhh/Horario`,
        { headers: this.getHttpHeaders() }
      );
    }

    //menu
    getMenus(): Observable<any> {
      return this.https.get(`${this.baseUrl}/security/Formulario`, {
        headers: this.getHttpHeaders()
      });
    }

    crearMenu(data: any): Observable<any> {
      return this.https.post(`${this.baseUrl}/security/Formulario`, data, {
        headers: this.getHttpHeaders()
      });
    }
    
    actualizarMenu(id: number, data: any): Observable<any> {
      return this.https.put(`${this.baseUrl}/security/Formulario/${id}`, data, {
        headers: this.getHttpHeaders()
      });
    }
    
    eliminarMenu(id: number): Observable<any> {
      return this.https.delete(`${this.baseUrl}/security/Formulario/${id}`, {
        headers: this.getHttpHeaders()
      });
    }

    sincronizarMenu(menu: any ): Observable<any> {
        return this.https.get(`${this.baseUrl}/Seguridad/SincronizarMenu`, {
          headers: this.getHeaders(),
          params: menu
        });
    }

    getRolById(roleId: number): Observable<any> {
      return this.https.get<any>(`${this.baseUrl}/security/Rol/${roleId}`, {
        headers: this.getHttpHeaders()
      });
    }

    sincronizarRolMenu(rol: number, menus: any ): Observable<any> {
        const url = `${this.baseUrl}/security/SincronizarRolMenu`;
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

    // mantenimiento
    getTiposServicio(): Observable<any> {
        return this.https.get(`${this.baseUrl}/mantto/MantenimientoTipo`, {
          headers: this.getHttpHeaders()
        });
    }

    sincronizarTipoServicio(tipoServicio: any): Observable<any> {
      return this.https.post(`${this.baseUrl}/mantto/MantenimientoTipo`, tipoServicio, {
        headers: this.getHttpHeaders()
      });
    }

    sincronizarTipoServicioEditar(tipoServicio: any): Observable<any> {
      // Clonar el objeto sin 'id'
      const { id, ...body } = tipoServicio;
    
      return this.https.put(
        `${this.baseUrl}/mantto/MantenimientoTipo/${id}`, // ✅ id en la ruta
        body, // ✅ body sin el id
        {
          headers: this.getHttpHeaders()
        }
      );
    }

    eliminarTipoServicio(id: number): Observable<any> {
      return this.https.delete(
        `${this.baseUrl}/mantto/MantenimientoTipo/${id}`,
        { headers: this.getHttpHeaders() }
      );
    }


    //
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