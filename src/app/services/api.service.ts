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

    sincronizarRolClaim(roleId: string, data: any[]): Observable<any> {
      return this.https.post(
        `${this.baseUrl}/security/RolClaim/${roleId}`,
        data,
        {
          headers: this.getHttpHeaders()
        }
      );
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

    asignarRolUsuario(roleName: string, data: string[]): Observable<any> {
      return this.https.post(
        `${this.baseUrl}/security/RolUsuario/${roleName}`,
        data,
        {
          headers: this.getHttpHeaders()
        }
      );
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

    updatePersonal(id: number, data: any): Observable<any> {
      return this.https.put(
        `${this.baseUrl}/general/Persona/${id}`,
        data,
        { headers: this.getHttpHeaders() }
      );
    }

    deletePersona(id: number): Observable<any> {
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

    crearPersonal(data: any): Observable<any> {
      return this.https.post(
        `${this.baseUrl}/rrhh/Personal`,
        data,
        { headers: this.getHttpHeaders() }
      );
    }

    // 🔹 Editar (actualizar) personal existente
    editarPersonal(id: number, data: any): Observable<any> {
      return this.https.put(
        `${this.baseUrl}/rrhh/Personal/${id}`,
        data,
        { headers: this.getHttpHeaders() }
      );
    }

    deletePersonal(id: number): Observable<any> {
      return this.https.delete(
        `${this.baseUrl}/rrhh/Personal/${id}`,
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

    createHorario(data: any): Observable<any> {
      return this.https.post(
        `${this.baseUrl}/rrhh/Horario`,
        data,
        { headers: this.getHttpHeaders() }
      );
    }

    updateHorario(id: number, data: any): Observable<any> {
      return this.https.put(
        `${this.baseUrl}/rrhh/Horario/${id}`,
        data,
        { headers: this.getHttpHeaders() }
      );
    }

    getRegistroAsistencia(fechaInicio: string, fechaFin: string): Observable<any> {
      return this.https.get(
        `${this.baseUrl}/rrhh/RegistroAsistencia/range_date`,
        {
          headers: this.getHttpHeaders(),
          params: { fechaInicio, fechaFin }
        }
      );
    }

    getRegistroAsistenciaPersonal(UsuarioId: string, fechaInicio: string, fechaFin: string): Observable<any> {
      return this.https.get(
        `${this.baseUrl}/rrhh/RegistroAsistenciaOrdenTrabajo/by_currentuser_and_range_date`,
        {
          headers: this.getHttpHeaders(),
          params: {
            UsuarioId,
            fechaInicio,
            fechaFin
          }
        }
      );
    }

    //menu

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

    getRolUsuarios(rolname: string ): Observable<any> {
         return this.https.get<any>(`${this.baseUrl}/security/Rol/${rolname}`, {
        headers: this.getHttpHeaders()
      });
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


    sincronizarHorario(id: number): Observable<any> {
      const headers = this.getHttpHeaders();
      return this.https.delete(`${this.baseUrl}/rrhh/Horario/${id}`, { headers });
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
        return this.https.get(`${this.baseUrl}/finanzas/Tercero`, {
          headers: this.getHttpHeaders()
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

    getActivoPorCodigo(id: number): Observable<any> {
      const url = `${this.baseUrl}/patrimonial/Activo/${id}`;
      const headers = this.getHeaders();

      return this.https.get<any>(url, { headers });
    }

    getActivo(): Observable<any> {
      return this.https.get(`${this.baseUrl}/patrimonial/Activo`, {
        headers: this.getHttpHeaders()
      });
    }

    updateActivo(id: number, body: any): Observable<any> {
      const url = `${this.baseUrl}/patrimonial/Activo/${id}`;
      const headers = this.getHeaders();

      return this.https.put<any>(url, body, { headers });
    }

    createActivo(body: any): Observable<any> {
      const url = `${this.baseUrl}/patrimonial/Activo`;
      const headers = this.getHeaders();

      return this.https.post<any>(url, body, { headers });
    }

    // En tu archivo api.service.ts, asegúrate de tener estos métodos:

  getUsuariosEmpresa(): Observable<any> {
    const url = `${this.baseUrl}/security/UsuarioEmpresa`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  getUsuarioEmpresaPorCodigo(id: number): Observable<any> {
    const url = `${this.baseUrl}/security/UsuarioEmpresa/${id}`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  createUsuarioEmpresa(body: any): Observable<any> {
    const url = `${this.baseUrl}/security/UsuarioEmpresa`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, body, { headers });
  }

  updateUsuarioEmpresa(id: number, body: any): Observable<any> {
    const url = `${this.baseUrl}/security/UsuarioEmpresa/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, body, { headers });
  }

  deleteUsuarioEmpresa(id: number): Observable<any> {
    const url = `${this.baseUrl}/security/UsuarioEmpresa/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  changeTenant(body: any): Observable<any> {
    const url = `${this.baseUrl}/security/Auth/changetenant`;
    const headers = this.getHeaders();

    return this.https.post<any>(url, body, { headers });
  }

  deleteActivo(id: number): Observable<any> {
    const url = `${this.baseUrl}/patrimonial/Activo/${id}`;
    const headers = this.getHeaders();

    return this.https.delete<any>(url, { headers });
  }

  //Ubicacion tecnica
  getUbicacionesTecnicasActivas(): Observable<any> {
    const url = `${this.baseUrl}/patrimonial/UbicacionTecnica/activas`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  registrarUbicacionTecnica(data: {
    empresaId: number;
    nombre: string;
    activo: boolean;
    terceroId: number;
    padreId: number;
  }): Observable<any> {
    const url = `${this.baseUrl}/patrimonial/UbicacionTecnica`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  getUbicacionTecnicaPorId(id: number): Observable<any> {
    const url = `${this.baseUrl}/patrimonial/UbicacionTecnica/${id}`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  actualizarUbicacionTecnica(
    id: number,
    data: {
      empresaId: number;
      nombre: string;
      activo: boolean;
      terceroId: number;
      padreId: number;
    }
  ): Observable<any> {
    const url = `${this.baseUrl}/patrimonial/UbicacionTecnica/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarUbicacionTecnica(id: number): Observable<any> {
    const url = `${this.baseUrl}/patrimonial/UbicacionTecnica/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //labor

  getLabores(): Observable<any> {
    const url = `${this.baseUrl}/mantto/Labor/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  registrarLabor(data: {
    nombre: string;
    nombreCorto: string;
    activo: boolean;
  }): Observable<any> {
    const url = `${this.baseUrl}/mantto/Labor`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  actualizarLabor(
    id: number,
    data: {
      nombre: string;
      nombreCorto: string;
      activo: boolean;
    }
  ): Observable<any> {
    const url = `${this.baseUrl}/mantto/Labor/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarLabor(id: number): Observable<any> {
    const url = `${this.baseUrl}/mantto/Labor/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //OrdenServicioTipo
  getOrdenesServicioTipo(): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenServicioTipo/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  registrarOrdenServicioTipo(data: {
    nombre: string;
    nombreCorto: string;
    estado: boolean;
  }): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenServicioTipo`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  actualizarOrdenServicioTipo(
    id: number,
    data: {
      nombre: string;
      nombreCorto: string;
      estado: boolean;
    }
  ): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenServicioTipo/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarOrdenServicioTipo(id: number): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenServicioTipo/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //cuentas contables

  getCuentasContablesActivas(): Observable<any> {
    const url = `${this.baseUrl}/contabilidad/CuentaContable/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  registrarCuentaContable(data: {
    empresaId: number;
    nombre: string;
    nombreCorto: string;
    activo: boolean;
    es: string;
    cuentaContableTipoId: number;
    nivel: number;
    padreId: number;
    permiteMovimiento: boolean;
  }): Observable<any> {
    const url = `${this.baseUrl}/contabilidad/CuentaContable`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  actualizarCuentaContable(
    id: number,
    data: {
      empresaId: number;
      nombre: string;
      nombreCorto: string;
      activo: boolean;
      es: string;
      cuentaContableTipoId: number;
      nivel: number;
      padreId: number;
      permiteMovimiento: boolean;
    }
  ): Observable<any> {
    const url = `${this.baseUrl}/contabilidad/CuentaContable/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarCuentaContable(id: number): Observable<any> {
    const url = `${this.baseUrl}/contabilidad/CuentaContable/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //cuenta contable tipo

  getCuentaContableTiposActivos(): Observable<any> {
    const url = `${this.baseUrl}/contabilidad/CuentaContableTipo/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  registrarCuentaContableTipo(data: {
    nombre: string;
    nombreCorto: string;
    activo: boolean;
  }): Observable<any> {
    const url = `${this.baseUrl}/contabilidad/CuentaContableTipo`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  actualizarCuentaContableTipo(
    id: number,
    data: {
      nombre: string;
      nombreCorto: string;
      activo: boolean;
    }
  ): Observable<any> {
    const url = `${this.baseUrl}/contabilidad/CuentaContableTipo/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarCuentaContableTipo(id: number): Observable<any> {
    const url = `${this.baseUrl}/contabilidad/CuentaContableTipo/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //terceros

  getTerceros(): Observable<any> {
    const url = `${this.baseUrl}/finanzas/Tercero`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  registrarTercero(data: {
    empresaId: number;
    // Remover 'id' de aquí si no es necesario al crear
    documentoIdentidadTipoFinancieroId: number;
    documentoIdentidadFinanciero: string;
    razonSocial: string;
    direccionFiscal: string;
    cuentaContablePorCobrarId: number;
    cuentaContablePorPagarId: number;
  }): Observable<any> {
    const url = `${this.baseUrl}/finanzas/Tercero`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  actualizarTercero(
    id: number,
    data: {
      empresaId: number;
      id: number;
      documentoIdentidadTipoFinancieroId: number;
      documentoIdentidadFinanciero: string;
      razonSocial: string;
      direccionFiscal: string;
      cuentaContablePorCobrarId: number;
      cuentaContablePorPagarId: number;
    }
  ): Observable<any> {
    const url = `${this.baseUrl}/finanzas/Tercero/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarTercero(id: number): Observable<any> {
    const url = `${this.baseUrl}/finanzas/Tercero/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //orden servicio

  getOrdenesServicioMantenimientoExterno(): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenServicio/MantenimientoExterno`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  registrarOrdenServicioMantenimientoExterno(data: {
    cabecera: {
      empresaId: number;
      ordenServicioTipoId: number;
      codigoOrdenInterna: string;
      codigoReferencial: string;
      descripcion: string;
      activo: boolean;
      fechaInicial: string;
      fechaFinal: string;
      fechaEntrega: string;
    };
    externo: {
      empresaId: number;
      clienteId: number;
      clienteSupervisorId: number;
      contratoCabeceraId: number;
      clientePlannerId: number;
      cotizacionId: number;
      actaConformidadId: number;
      monedaId: number;
      licitacionCodigo: string;
      cpi: string;
      fechaEntregaCorreo: string;
      fechaFianzaInicio: string;
      fechaFianzaFinal: string;
      montoBruto: number;
      montoNeto: number;
      montoFianza: number;
      reporteMedicion: string;
      reporteCalidad: string;
      fechaEntregaInforme: string;
      fechaRecepcionHES: string;
      numeroHES: number;
      mantenimientoTipoId: number;
      numeroFactura: string;
      valorFacturadoNeto: number;
      fechaFactura: string;
      fechaRecepcionFactura: string;
      fechaVencimientoFactura: string;
      fechaPagoFactura: string;
    };
  }): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenServicio/MantenimientoExterno`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  actualizarOrdenServicioMantenimientoExterno(
    id: number,
    data: {
      cabecera: {
        empresaId: number;
        ordenServicioTipoId: number;
        codigoOrdenInterna: string;
        codigoReferencial: string;
        descripcion: string;
        activo: boolean;
        fechaInicial: string;
        fechaFinal: string;
        fechaEntrega: string;
      };
      externo: {
        empresaId: number;
        clienteId: number;
        clienteSupervisorId: number;
        contratoCabeceraId: number;
        clientePlannerId: number;
        cotizacionId: number;
        actaConformidadId: number;
        monedaId: number;
        licitacionCodigo: string;
        cpi: string;
        fechaEntregaCorreo: string;
        fechaFianzaInicio: string;
        fechaFianzaFinal: string;
        montoBruto: number;
        montoNeto: number;
        montoFianza: number;
        reporteMedicion: string;
        reporteCalidad: string;
        fechaEntregaInforme: string;
        fechaRecepcionHES: string;
        numeroHES: number;
        mantenimientoTipoId: number;
        numeroFactura: string;
        valorFacturadoNeto: number;
        fechaFactura: string;
        fechaRecepcionFactura: string;
        fechaVencimientoFactura: string;
        fechaPagoFactura: string;
      };
    }
  ): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenServicio/MantenimientoExterno/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarOrdenServicioMantenimientoExterno(id: number): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenServicio/MantenimientoExterno/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  // grupo trabajo

  getGruposTrabajo(): Observable<any> {
    const url = `${this.baseUrl}/rrhh/GrupoTrabajo`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearGrupoTrabajo(data: {
    cabecera: {
      empresaId: number;
      nombre: string;
      nombreCorto: string;
      estado: boolean;
    };
    personas: {
      empresaId: number;
      id: number;
      personaId: number;
      esLider: boolean;
    }[];
  }): Observable<any> {
    const url = `${this.baseUrl}/rrhh/GrupoTrabajo`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  actualizarGrupoTrabajo(
    id: number,
    data: {
      cabecera: {
        empresaId: number;
        nombre: string;
        nombreCorto: string;
        estado: boolean;
      };
      personas: {
        empresaId: number;
        id: number;
        personaId: number;
        esLider: boolean;
      }[];
    }
  ): Observable<any> {
    const url = `${this.baseUrl}/rrhh/GrupoTrabajo/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarGrupoTrabajo(id: number): Observable<any> {
    const url = `${this.baseUrl}/rrhh/GrupoTrabajo/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //orden trabajo
  getOrdenesTrabajoMantenimientoExterno(): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenTrabajo/MantenimientoExterno`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearOrdenTrabajoMantenimientoExterno(data: {
    cabecera: {
      empresaId: number;
      ordenServicioCabeceraId: number;
      nombre: string;
      descripcion: string;
      fechaInicio: string;
      fechaCompromiso: string;
      fechaFin: string;
      grupoTrabajoId: number;
      ordenTrabajoCabeceraPadreId: number | null;
      estado: number;
    };
    detalles: {
      detalle: {
        id: number;
        empresaId: number;
        ubicacionTecnicaId: number;
        laborId: number;
        horasProyectadas: number;
        horasEjecutadas: number;
        descripcion: string;
        estado: number;
      };
      activo: {
        id: number;
        empresaId: number;
        activoId: number;
      };
    }[];
    personas: {
      id: number;
      empresaId: number;
      personaId: number;
      esLider: boolean;
    }[];
  }): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenTrabajo/MantenimientoExterno`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  actualizarOrdenTrabajoMantenimientoExterno(
    id: number,
    data: {
      cabecera: {
        empresaId: number;
        ordenServicioCabeceraId: number;
        nombre: string;
        descripcion: string;
        fechaInicio: string;
        fechaCompromiso: string;
        fechaFin: string;
        grupoTrabajoId: number;
        ordenTrabajoCabeceraPadreId: number | null;
        estado: number;
      };
      detalles: {
        detalle: {
          id: number;
          empresaId: number;
          ubicacionTecnicaId: number;
          laborId: number;
          horasProyectadas: number;
          horasEjecutadas: number;
          descripcion: string;
          estado: number;
        };
        activo: {
          id: number;
          empresaId: number;
          activoId: number;
        };
      }[];
      personas: {
        id: number;
        empresaId: number;
        personaId: number;
        esLider: boolean;
      }[];
    }
  ): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenTrabajo/MantenimientoExterno/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarOrdenTrabajoMantenimientoExterno(id: number): Observable<any> {
    const url = `${this.baseUrl}/mantto/OrdenTrabajo/MantenimientoExterno/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //modulo
  listarModulos(): Observable<any> {
    const url = `${this.baseUrl}/security/Modulo`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearModulo(data: any): Observable<any> {
    const url = `${this.baseUrl}/security/Modulo`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarModulo(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/security/Modulo/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarModulo(id: number): Observable<any> {
    const url = `${this.baseUrl}/security/Modulo/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //empresa
  listarEmpresasActivas(): Observable<any> {
    const url = `${this.baseUrl}/corporativo/Empresa/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearEmpresa(data: any): Observable<any> {
    const url = `${this.baseUrl}/corporativo/Empresa`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarEmpresa(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/corporativo/Empresa/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarEmpresa(id: number): Observable<any> {
    const url = `${this.baseUrl}/corporativo/Empresa/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //centro de costos
  listarCentrosDeCostosActivos(): Observable<any> {
    const url = `${this.baseUrl}/costos/CentroDeCostos/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearCentroDeCostos(data: any): Observable<any> {
    const url = `${this.baseUrl}/costos/CentroDeCostos`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarCentroDeCostos(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/costos/CentroDeCostos/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarCentroDeCostos(id: number): Observable<any> {
    const url = `${this.baseUrl}/costos/CentroDeCostos/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //cuenta corriente
  listarCuentasCorrientesActivas(): Observable<any> {
    const url = `${this.baseUrl}/finanzas/CuentaCorriente/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearCuentaCorriente(data: any): Observable<any> {
    const url = `${this.baseUrl}/finanzas/CuentaCorriente`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarCuentaCorriente(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/finanzas/CuentaCorriente/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarCuentaCorriente(id: number): Observable<any> {
    const url = `${this.baseUrl}/finanzas/CuentaCorriente/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //entidad financiera
  listarEntidadesFinancierasActivas(): Observable<any> {
    const url = `${this.baseUrl}/finanzas/EntidadFinanciera/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearEntidadFinanciera(data: any): Observable<any> {
    const url = `${this.baseUrl}/finanzas/EntidadFinanciera`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarEntidadFinanciera(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/finanzas/EntidadFinanciera/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarEntidadFinanciera(id: number): Observable<any> {
    const url = `${this.baseUrl}/finanzas/EntidadFinanciera/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //financiero

  //mantenimiento tipo
  listarMantenimientosActivos(): Observable<any> {
    const url = `${this.baseUrl}/mantto/MantenimientoTipo/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearMantenimientoTipo(data: any): Observable<any> {
    const url = `${this.baseUrl}/mantto/MantenimientoTipo`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarMantenimientoTipo(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/mantto/MantenimientoTipo/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarMantenimientoTipo(id: number): Observable<any> {
    const url = `${this.baseUrl}/mantto/MantenimientoTipo/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //almacen
  listarAlmacenesActivos(): Observable<any> {
    const url = `${this.baseUrl}/logistica/Almacen/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearAlmacen(data: {
    empresaId: number;
    nombre: string;
    nombreCorto: string;
    distritoId: number;
    direccion: string;
    latitud: number;
    longitud: number;
    activo: boolean;
  }): Observable<any> {
    const url = `${this.baseUrl}/logistica/Almacen`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarAlmacen(
    id: number,
    data: {
      empresaId: number;
      nombre: string;
      nombreCorto: string;
      distritoId: number;
      direccion: string;
      latitud: number;
      longitud: number;
      activo: boolean;
    }
  ): Observable<any> {
    const url = `${this.baseUrl}/logistica/Almacen/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarAlmacen(id: number): Observable<any> {
    const url = `${this.baseUrl}/logistica/Almacen/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //distrito
  getDistritos(): Observable<any> {
    return this.https.get(`${this.baseUrl}/general/Distrito`, {
      headers: this.getHttpHeaders()
    });
  }

  crearDistrito(distrito: { nombre: string; provinciaId: number }): Observable<any> {
    const url = `${this.baseUrl}/general/Distrito`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, distrito, { headers });
  }

  editarDistrito(id: number, distrito: { nombre: string; provinciaId: number }): Observable<any> {
    const url = `${this.baseUrl}/general/Distrito/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, distrito, { headers });
  }

  eliminarDistrito(id: number): Observable<any> {
    const url = `${this.baseUrl}/general/Distrito/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //provincia
  listarProvincias(): Observable<any> {
    const url = `${this.baseUrl}/general/Provincia`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearProvincia(payload: { nombre: string; departamentoId: number }): Observable<any> {
    const url = `${this.baseUrl}/general/Provincia`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, payload, { headers });
  }

  editarProvincia(id: number, payload: { nombre: string; departamentoId: number }): Observable<any> {
    const url = `${this.baseUrl}/general/Provincia/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, payload, { headers });
  }

  eliminarProvincia(id: number): Observable<any> {
    const url = `${this.baseUrl}/general/Provincia/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
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

  //pais
  listarPaises(): Observable<any> {
    const url = `${this.baseUrl}/general/Pais`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearPais(data: any): Observable<any> {
    const url = `${this.baseUrl}/general/Pais`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarPais(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/general/Pais/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarPais(id: number): Observable<any> {
    const url = `${this.baseUrl}/general/Pais/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //sexo
  getSexo(): Observable<any> {
    return this.https.get(`${this.baseUrl}/general/Sexo`, {
      headers: this.getHttpHeaders()
    });
  }

  crearSexo(data: any): Observable<any> {
    const url = `${this.baseUrl}/general/Sexo`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarSexo(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/general/Sexo/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarSexo(id: number): Observable<any> {
    const url = `${this.baseUrl}/general/Sexo/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //licenciaconducir
  getLicenciaConducir(): Observable<any> {
    return this.https.get(`${this.baseUrl}/general/LicenciaConducir`, {
      headers: this.getHttpHeaders()
    });
  }

  crearLicenciaConducir(data: any): Observable<any> {
    const url = `${this.baseUrl}/general/LicenciaConducir`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarLicenciaConducir(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/general/LicenciaConducir/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarLicenciaConducir(id: number): Observable<any> {
    const url = `${this.baseUrl}/general/LicenciaConducir/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //documento tipo
  getDocumentoTipo(): Observable<any> {
    return this.https.get(`${this.baseUrl}/general/DocumentoTipo`, {
      headers: this.getHttpHeaders()
    });
  }

  crearDocumentoTipo(data: any): Observable<any> {
    const url = `${this.baseUrl}/general/DocumentoTipo`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarDocumentoTipo(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/general/DocumentoTipo/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarDocumentoTipo(id: number): Observable<any> {
    const url = `${this.baseUrl}/general/DocumentoTipo/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //documento identidad tipo
  listarDocumentoIdentidadTipo(): Observable<any> {
    const url = `${this.baseUrl}/general/DocumentoIdentidadTipo`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearDocumentoIdentidadTipo(data: any): Observable<any> {
    const url = `${this.baseUrl}/general/DocumentoIdentidadTipo`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarDocumentoIdentidadTipo(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/general/DocumentoIdentidadTipo/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarDocumentoIdentidadTipo(id: number): Observable<any> {
    const url = `${this.baseUrl}/general/DocumentoIdentidadTipo/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //moneda
  listarMonedas(): Observable<any> {
    const url = `${this.baseUrl}/finanzas/Moneda`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearMoneda(data: any): Observable<any> {
    const url = `${this.baseUrl}/finanzas/Moneda`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarMoneda(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/finanzas/Moneda/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarMoneda(id: number): Observable<any> {
    const url = `${this.baseUrl}/finanzas/Moneda/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //PuntoFinanciero
  listarPuntosFinancierosActivos(): Observable<any> {
    const url = `${this.baseUrl}/finanzas/PuntoFinanciero/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearPuntoFinanciero(data: any): Observable<any> {
    const url = `${this.baseUrl}/finanzas/PuntoFinanciero`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarPuntoFinanciero(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/finanzas/PuntoFinanciero/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarPuntoFinanciero(id: number): Observable<any> {
    const url = `${this.baseUrl}/finanzas/PuntoFinanciero/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //origenfinanciero
  listarOrigenFinancieroActivos(): Observable<any> {
    const url = `${this.baseUrl}/finanzas/OrigenFinanciero/activos`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearOrigenFinanciero(data: any): Observable<any> {
    const url = `${this.baseUrl}/finanzas/OrigenFinanciero`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  editarOrigenFinanciero(id: number, data: any): Observable<any> {
    const url = `${this.baseUrl}/finanzas/OrigenFinanciero/${id}`;
    const headers = this.getHeaders();
    return this.https.put<any>(url, data, { headers });
  }

  eliminarOrigenFinanciero(id: number): Observable<any> {
    const url = `${this.baseUrl}/finanzas/OrigenFinanciero/${id}`;
    const headers = this.getHeaders();
    return this.https.delete<any>(url, { headers });
  }

  //financiero
  listarFinancieros(): Observable<any> {
    const url = `${this.baseUrl}/finanzas/Financiero`;
    const headers = this.getHeaders();
    return this.https.get<any>(url, { headers });
  }

  crearFinanciero(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.https.post(`${this.baseUrl}/finanzas/Financiero`, data, { headers });
  }

  agregarDetalleFinanciero(idCabecera: number, detalle: any): Observable<any> {
    const headers = this.getHeaders();
    return this.https.post(`${this.baseUrl}/finanzas/Financiero/detalle/${idCabecera}`, detalle, { headers });
  }

  //personal estado

  listarPersonalEstadoActivos(): Observable<any> {
    const headers = this.getHeaders();
    return this.https.get(`${this.baseUrl}/rrhh/PersonalEstado/activos`, { headers });
  }

  crearPersonalEstado(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.https.post(`${this.baseUrl}/rrhh/PersonalEstado`, data, { headers });
  }

  editarPersonalEstado(id: number, data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.https.put(`${this.baseUrl}/rrhh/PersonalEstado/${id}`, data, { headers });
  }

  eliminarPersonalEstado(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.https.delete(`${this.baseUrl}/rrhh/PersonalEstado/${id}`, { headers });
  }

  //formulario
  getMenus(): Observable<any> {
    return this.https.get(`${this.baseUrl}/security/Formulario`, {
      headers: this.getHttpHeaders()
    });
  }


  //formulariocurrect
  getMenusCurrent(): Observable<any> {
    return this.https.get(`${this.baseUrl}/security/Formulario/current_user`, {
      headers: this.getHttpHeaders()
    });
  }

  crearMenu(data: any): Observable<any> {
    return this.https.post(
      `${this.baseUrl}/security/Formulario`,
      {
        parentId: data.parentId,
        moduloId: data.moduloId,
        nombre: data.nombre,
        nombreCorto: data.nombreCorto,
        descripcion: data.descripcion,
        controlador: data.controlador,
        action: data.action,
        icono: data.icono,
        claimType: data.claimType,
        orden: data.orden,
        estado: data.estado
      },
      {
        headers: this.getHttpHeaders()
      }
    );
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

  obtenerFormulariosPorRol(roleId: string): Observable<any> {
    const headers = this.getHeaders();
    return this.https.get(`${this.baseUrl}/security/Formulario/rol/${roleId}`, { headers });
  }

  //estructura opganizacional tipo
  obtenerEstructurasOrganizacionalesActivas(): Observable<any> {
    const headers = this.getHeaders();
    return this.https.get(`${this.baseUrl}/corporativo/EstructuraOrganizacionalTipo/activos`, { headers });
  }

  crearEstructuraOrganizacionalTipo(data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.https.post(`${this.baseUrl}/corporativo/EstructuraOrganizacionalTipo`, data, { headers });
  }

  editarEstructuraOrganizacionalTipo(id: number, data: any): Observable<any> {
    const headers = this.getHeaders();
    return this.https.put(`${this.baseUrl}/corporativo/EstructuraOrganizacionalTipo/${id}`, data, { headers });
  }

  eliminarEstructuraOrganizacionalTipo(id: number): Observable<any> {
    const headers = this.getHeaders();
    return this.https.delete(`${this.baseUrl}/corporativo/EstructuraOrganizacionalTipo/${id}`, { headers });
  }

  //contrato personal
  listarContratoPersonal(): Observable<any> {
    const headers = this.getHeaders();
    return this.https.get(`${this.baseUrl}/legal/ContratoPersonal`, { headers });
  }


  //usuario
  listarUsuarios(): Observable<any> {
    const headers = this.getHeaders();
    return this.https.get(`${this.baseUrl}/security/Usuario`, { headers });
  }

  editarUsuario(id: string, data: any): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/security/Usuario/${id}`;
    return this.https.put<any>(url, data, { headers });
  }


  //usuarioempresa
  listarUsuarioEmpresaPorUsuario(usuarioId: number): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/security/UsuarioEmpresa/usuario/${usuarioId}`;
    return this.https.get<any>(url, { headers });
  }

  //orden servicio cabecera
  listarOrdenServicioCabecera(): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenServicioCabecera`;
    return this.https.get<any>(url, { headers });
  }

  crearOrdenServicioCabecera(data: any): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenServicioCabecera`;
    return this.https.post<any>(url, data, { headers });
  }

  editarOrdenServicioCabecera(id: number, data: any): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenServicioCabecera/${id}`;
    return this.https.put<any>(url, data, { headers });
  }

  eliminarOrdenServicioCabecera(id: number): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenServicioCabecera/${id}`;
    return this.https.delete<any>(url, { headers });
  }

  //ordentrabajo cabecera
  listarOrdenTrabajoCabecera(): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenTrabajoCabecera`;
    return this.https.get<any>(url, { headers });
  }
  listarOrdenTrabajoCabeceraSimplificado(): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenTrabajoCabecera/simplificado`;
    return this.https.get<any>(url, { headers });
  }
  crearOrdenTrabajoCabecera(data: any): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenTrabajoCabecera`;
    return this.https.post<any>(url, data, { headers });
  }

  editarOrdenTrabajoCabecera(id: number, data: any): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenTrabajoCabecera/${id}`;
    return this.https.put<any>(url, data, { headers });
  }

  eliminarOrdenTrabajoCabecera(id: number): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenTrabajoCabecera/${id}`;
    return this.https.delete<any>(url, { headers });
  }

  //ordentrabajo personal
  crearOrdenTrabajoPersonal(data: any): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenTrabajoPersonal`;
    return this.https.post<any>(url, data, { headers });
  }
  eliminarOrdenTrabajoPersonal(id: number): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/mantto/OrdenTrabajoPersonal/${id}`;
    return this.https.delete<any>(url, { headers });
  }

  //registroasistencia
  registrarAsistencia(body: any): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/rrhh/RegistroAsistenciaOrdenTrabajo/current_user`;
    return this.https.post<any>(url, body, { headers });
  }

  regularizarMarcacion(body: any): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/rrhh/RegistroAsistenciaOrdenTrabajo`;
    return this.https.post<any>(url, body, { headers });
  }

  //
  //subir foto

  subirAdjunto(modulo: number, archivo: File): Observable<any> {
    const url = `${this.baseUrl}/general/Adjunto/${modulo}`;

    const formData = new FormData();
    formData.append('Archivo', archivo);

    const token = this.getToken();
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.https.post<any>(url, formData, { headers });
  }


  crearPersonaAdjuntosUseCase(data: any): Observable<any> {
    const url = `${this.baseUrl}/general/PersonaAdjuntosUseCase`;
    const headers = this.getHeaders();
    return this.https.post<any>(url, data, { headers });
  }

  obtenerAdjuntoImagen(adjuntoId: number): Observable<any> {
    const headers = this.getHeaders();
    const url = `${this.baseUrl}/general/Adjunto/download/${adjuntoId}`;
    return this.https.get(url, { headers, responseType: 'text' as 'json' });
  }

  //registro asistencia
  getRegistroAsistenciaPolitica(): Observable<any> {
    const headers = this.getHeaders();
    return this.https.get(`${this.baseUrl}/rrhh/RegistroAsistenciaPolitica`, { headers });
  }

  //usuario
  crearUsuario(usuarioData: any): Observable<any> {
    return this.https.post(
      `${this.baseUrl}/security/Usuario`,
      usuarioData,
      { headers: this.getHttpHeaders() }
    );
  }

  listarUsuarioEmpresa(): Observable<any> {
    return this.https.get(
      `${this.baseUrl}/security/Usuario`,
      { headers: this.getHttpHeaders() }
    );
  }

  obtenerHorariosPorOrdenYRango(ordenTrabajoCabeceraId: number, inicio: string, fin: string): Observable<any> {
    const headers = this.getHttpHeaders();
    const params = {
      OrdenTrabajoCabeceraId: ordenTrabajoCabeceraId.toString(),
      Inicio: inicio,
      Fin: fin
    };

    return this.https.get(
      'https://7p4yx3l258.execute-api.us-east-1.amazonaws.com/mantto/OrdenTrabajoHorario/by_ot_and_date_range',
      { headers, params }
    );
  }

// Guardar horario individual (POST)
  guardarOrdenTrabajoHorario(payload: any): Observable<any> {
    const headers = this.getHttpHeaders();

    return this.https.post(
      'https://7p4yx3l258.execute-api.us-east-1.amazonaws.com/mantto/OrdenTrabajoHorario',
      payload,
      { headers }
    );
  }

  actualizarOrdenTrabajoHorario(id: number, payload: any): Observable<any> {
    const headers = this.getHttpHeaders();

    return this.https.put(
      `https://7p4yx3l258.execute-api.us-east-1.amazonaws.com/mantto/OrdenTrabajoHorario/${id}`,
      payload,
      { headers }
    );
  }
}
