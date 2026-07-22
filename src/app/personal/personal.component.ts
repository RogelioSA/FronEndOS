import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { catchError, forkJoin, firstValueFrom, of } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-personal',
    templateUrl: './personal.component.html',
    styleUrl: './personal.component.css',
    standalone: false
})
export class PersonalComponent {
  existeAsignacion: boolean = false;
  personal: any[] = [];
  cargos : any[] = [];
  areas : [] = [];
  contratoTipos : [] = [];
  situaciones : [] = [];
  condiciones : [] = [];
  categorias : [] = [];
  sexo : any[] = [];
  licencias : any[] = [];
  documentoTipos : any[] = [];
  distritos : any[] = [];

  contratos: any[] = [];
  horarios: any[] = [];
  selectedHorarioId: number | null = null;
  superiores: any[] = [];
  estados: any[] = [];
  politicasRegistro: any[] = [];
  usuarios: any[] = [];

  // Propiedades para subida masiva
  popupSubidaMasivaVisible = false;
  archivoSeleccionado: File | null = null;
  procesandoArchivo = false;
  registrosProcesados: any[] = [];
  registrosExitosos = 0;
  registrosFallidos = 0;
  erroresProcesamiento: string[] = [];

  @BlockUI() blockUI!: NgBlockUI;

  constructor(private apiService: ApiService,){}

  async ngOnInit():Promise<void> {

    this.blockUI.start('Cargando...'); // Start blocking

    try {
      await this.cargarDatosIniciales();
    } finally {
      this.blockUI.stop();
    }

    this.estados = [
      { id: 1, nombre: "ACTIVO" },
      { id: 2, nombre: "INACTIVO" }
    ];
  }

  private async cargarDatosIniciales(): Promise<void> {
    try {
      const [
        personal,
        contratos,
        licencias,
        documentoTipos,
        sexo,
        cargos,
        horarios,
        politicasRegistro,
        usuarios,
        superiores
      ] = await firstValueFrom(forkJoin([
        this.apiService.getPersonal().pipe(catchError((error: any) => this.manejarErrorCargaInicial('personal', error))),
        this.apiService.getContratoTipos().pipe(catchError((error: any) => this.manejarErrorCargaInicial('tipos de contrato', error))),
        this.apiService.getLicenciaConducir().pipe(catchError((error: any) => this.manejarErrorCargaInicial('licencias', error))),
        this.apiService.getDocumentoTipo().pipe(catchError((error: any) => this.manejarErrorCargaInicial('tipos de documento', error))),
        this.apiService.getSexo().pipe(catchError((error: any) => this.manejarErrorCargaInicial('sexo', error))),
        this.apiService.getCargos().pipe(catchError((error: any) => this.manejarErrorCargaInicial('cargos', error))),
        this.apiService.getHorarios().pipe(catchError((error: any) => this.manejarErrorCargaInicial('horarios', error))),
        this.apiService.getRegistroAsistenciaPolitica().pipe(catchError((error: any) => this.manejarErrorCargaInicial('políticas de registro', error))),
        this.apiService.listarUsuarios().pipe(catchError((error: any) => this.manejarErrorCargaInicial('usuarios', error))),
        this.apiService.getPersonas().pipe(catchError((error: any) => this.manejarErrorCargaInicial('superiores', error)))
      ]));

      this.personal = this.mapearPersonal(personal);
      this.contratos = contratos.map((t: any) => ({ id: t.id, nombre: t.nombre }));
      this.licencias = licencias.map((l: any) => ({ nCodigo: l.id, cNombre: l.nombre }));
      this.documentoTipos = documentoTipos.map((d: any) => ({ nCodigo: d.id, cNombre: d.nombre }));
      this.sexo = sexo.map((s: any) => ({ nCodigo: s.id, cNombre: s.nombre }));
      this.cargos = cargos.map((c: any) => ({ nCodigo: c.id, cNombre: c.nombre }));
      this.horarios = horarios.map((h: any) => ({ id: h.id, nombre: h.nombre }));
      this.politicasRegistro = politicasRegistro.map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        nombreCorto: p.nombreCorto,
        descripcion: p.descripcion
      }));
      this.usuarios = usuarios.map((u: any) => ({
        id: u.id,
        userName: u.userName,
        email: u.email,
        displayName: u.userName
      }));
      this.superiores = superiores.map((p: any) => ({
        id: Number(p.id),
        nombreCompleto: p.nombreCompleto
      }));
    } catch (error) {
      console.error('❌ Error cargando datos iniciales de personal:', error);
    }
  }

  private manejarErrorCargaInicial(catalogo: string, error: any) {
    console.error(`❌ Error cargando ${catalogo}:`, error);
    return of([]);
  }

  private mapearPersonal(personal: any[]): any[] {
    return personal
      .map((p: any) => ({
        nCodigo: p.id,
        cNombres: p.nombres,
        cApPater: p.apellidoPaterno,
        cApMater: p.apellidoMaterno,
        dFechaNacimiento: p.fechaNacimiento,
        cDNI: p.documentoIdentidad,
        cCorreo: p.correo,
        cCelular: p.celular,
        lEstado: p.estado,
        cSexo: p.sexo?.id,
        nLicenciaCategoria: p.licenciaConducir?.id,
        nDocumentoIdentidadTipo: p.documentoIdentidadTipo?.id,
        nCargoId: p.cargo?.id ?? p.cargoId
      }))
      .sort((a: any, b: any) =>
        String(a.cApPater || '').localeCompare(String(b.cApPater || ''), 'es', { sensitivity: 'base' })
      );
  }


  async traerPersonal() {
    console.log("traer personal");

    try {
      const obser = this.apiService.getPersonal();
      const result = await firstValueFrom(obser);

      // 🔹 Mapear los campos de la API a los que usa el grid
      this.personal = this.mapearPersonal(result);

      console.log("Personal cargado:", this.personal);

    } catch (error) {
      console.log("Error trayendo el personal.", error);
    }
  }

  async traerContratoTipos() {
    console.log("traer tipos");
    try {
      const obser = this.apiService.getContratoTipos();
      const result = await firstValueFrom(obser);

      // Mapeo API → formato que usabas antes
      this.contratos = result.map((t: any) => ({
        id: t.id,
        nombre: t.nombre
      }));

      console.log("✅ Contratos cargados:", this.contratos);
    } catch (error) {
      console.log('❌ Error trayendo los tipos.', error);
    }
  }

  async traerHorarios() {
    console.log("traer horarios");

    try {
      const obser = this.apiService.getHorarios();
      const result = await firstValueFrom(obser);

      // Mapeo API → formato simple
      this.horarios = result.map((h: any) => ({
        id: h.id,
        nombre: h.nombre
      }));

      console.log("✅ Horarios cargados:", this.horarios);

    } catch (error) {
      console.error("❌ Error trayendo horarios", error);
    }
  }

  async traerPoliticasRegistro() {
    console.log("traer políticas de registro");
    try {
      const obser = this.apiService.getRegistroAsistenciaPolitica();
      const result = await firstValueFrom(obser);

      // Mapeo usando el campo 'nombre' y 'nombreCorto' del API
      this.politicasRegistro = result.map((p: any) => ({
        id: p.id,
        nombre: p.nombre,
        nombreCorto: p.nombreCorto,
        descripcion: p.descripcion
      }));

      console.log("✅ Políticas de registro cargadas:", this.politicasRegistro);
    } catch (error) {
      console.error("❌ Error trayendo políticas de registro:", error);
    }
  }

  async traerSuperiores() {
    try {
      const resp: any[] = await firstValueFrom(this.apiService.getPersonas());
      this.superiores = resp.map((p: any) => ({
        id: Number(p.id),
        nombreCompleto: p.nombreCompleto
      }));
      console.log("✅ Superiores cargados:", this.superiores);
    } catch (err) {
      console.error("❌ Error al traer personas", err);
    }
  }

  async traerUsuarios() {
    console.log("traer usuarios");
    try {
      const obser = this.apiService.listarUsuarios();
      const result = await firstValueFrom(obser);

      // Mapeo usando userName del API (que es el email)
      this.usuarios = result.map((u: any) => ({
        id: u.id,
        userName: u.userName,
        email: u.email,
        displayName: u.userName // Usamos userName como nombre para mostrar
      }));

      console.log("✅ Usuarios cargados:", this.usuarios);
    } catch (error) {
      console.error("❌ Error trayendo usuarios:", error);
    }
  }

  async traerSexo() {
    try {
      const result = await firstValueFrom(this.apiService.getSexo());

      // 🔹 Mapeamos al formato que tu grid espera para el lookup
      this.sexo = result.map((s: any) => ({
        nCodigo: s.id,
        cNombre: s.nombre
      }));

      console.log("Catálogo de sexo:", this.sexo);
    } catch (error) {
      console.error("Error trayendo sexo:", error);
    }
  }

  async traerLicencias() {
    try {
      const result = await firstValueFrom(this.apiService.getLicenciaConducir());

      // 🔹 Mapeamos al formato que tu grid espera
      this.licencias = result.map((l: any) => ({
        nCodigo: l.id,
        cNombre: l.nombre
      }));

      console.log("Catálogo de licencias:", this.licencias);
    } catch (error) {
      console.error("Error trayendo licencias:", error);
    }
  }

  async traerDocumentoTipos() {
    try {
      const result = await firstValueFrom(this.apiService.getDocumentoTipo());

      // 🔹 Mapeamos al formato que entiende el grid
      this.documentoTipos = result.map((d: any) => ({
        nCodigo: d.id,
        cNombre: d.nombre
      }));

      console.log("Catálogo de tipos documento:", this.documentoTipos);
    } catch (error) {
      console.error("Error trayendo tipos documento:", error);
    }
  }

  async traerDistritos() {
    try {
      const result = await firstValueFrom(this.apiService.getDistritos());

      // 🔹 Mapeamos al formato que usa el grid
      this.distritos = result.map((d: any) => ({
        nCodigo: d.id,
        cNombre: d.nombre
      }));

      console.log("Catálogo de distritos:", this.distritos);
    } catch (error) {
      console.error("Error trayendo distritos:", error);
    }
  }

  guardar(event : any){
    console.log(event);
  }

  actualizar(event: any) {
    console.log('onRowUpdating event completo:', event);

    const oldData = event.oldData || {};
    const newData = event.newData || {};

    // el id lo tomamos de la fila (usa el keyExpr de tu grid)
    const id = oldData.id || oldData.nCodigo;
    if (!id) {
      console.error("❌ No se encontró el ID para actualizar.");
      return;
    }

    // helper para combinar datos nuevos con viejos
    const getVal = (field: string, fallback: any = null) =>
      newData[field] !== undefined ? newData[field] : oldData[field] ?? fallback;

    const registro = {
      empresaId: 1,
      nombres: getVal('cNombres'),
      apellidoPaterno: getVal('cApPater'),
      apellidoMaterno: getVal('cApMater'),
      fechaNacimiento: getVal('dFechaNacimiento'),
      documentoIdentidad: getVal('cDNI'),
      correo: getVal('cCorreo'),
      celular: getVal('cCelular'),
      estado: getVal('lEstado'),
      sexoId: getVal('cSexo'),
      licenciaConducirId: getVal('nLicenciaCategoria'),
      documentoIdentidadTipoId: getVal('nDocumentoIdentidadTipo'),
      cargoId: getVal('nCargoId')
    };

    console.log("Registro para actualizar:", registro);

    this.apiService.updatePersonal(id, registro).subscribe({
      next: (response) => {
        console.log("✅ Personal actualizado:", response);
        this.traerPersonal();
      },
      error: (err) => {
        console.error("❌ Error al actualizar:", err);
      }
    });
  }


  insertar(event: any) {
    console.log('onRowInserted event completo:', event);
    const data = event?.data ?? (event?.changes && event.changes[0]?.data) ?? {};

    // helper para buscar valor en varias posibles propiedades
    const getVal = (keys: string[], fallback: any = null) => {
      for (const k of keys) {
        if (data[k] !== undefined && data[k] !== null) return data[k];
      }
      return fallback;
    };

    // Extraer campos (probamos varias claves por si hay inconsistencia en nombres)
    const nombres = getVal(['cNombres', 'nombres', 'nombre', 'firstName'], '');
    const apellidoPaterno = getVal(['cApPater', 'apellidoPaterno', 'apellido_paterno'], '');
    const apellidoMaterno = getVal(['cApMater', 'apellidoMaterno', 'apellido_materno'], '');
    const dni = getVal(['cDNI', 'documentoIdentidad', 'dni', 'documento_identidad'], '');
    const correo = getVal(['cCorreo', 'correo', 'email'], '');
    const celular = getVal(['cCelular', 'celular', 'telefono'], '');
    const estado = getVal(['lEstado', 'estado'], true);

    // fecha -> ISO (maneja Date u string)
    const rawFecha = getVal(['dFechaNacimiento', 'fechaNacimiento', 'fecha_nacimiento'], null);
    let fechaISO = null;
    if (rawFecha) {
      const d = (rawFecha instanceof Date) ? rawFecha : new Date(rawFecha);
      if (!isNaN(d.getTime())) fechaISO = d.toISOString();
    }

    // Función para normalizar ids que pueden venir como objeto, string o number
    const normalizeId = (val: any) => {
      if (val === null || val === undefined || val === '') return null;
      if (typeof val === 'object') {
        return val.id ?? val.nCodigo ?? val.value ?? val['valueExpr'] ?? null;
      }
      // si viene "1" o 1 convierte a número
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    const sexoId = normalizeId(getVal(['cSexo', 'sexoId', 'sexo'], null));
    const licenciaConducirId = normalizeId(getVal(['nLicenciaCategoria', 'licenciaConducirId', 'licencia'], null));
    const documentoIdentidadTipoId = normalizeId(getVal(['nDocumentoIdentidadTipo', 'documentoIdentidadTipoId', 'tipoDocumento'], null));
    const cargoId = normalizeId(getVal(['nCargoId', 'cargoId', 'cargo'], null));

    const registro: any = {
      empresaId: 1,
      nombres,
      apellidoPaterno,
      apellidoMaterno,
      fechaNacimiento: fechaISO,
      documentoIdentidad: dni,
      correo,
      celular,
      estado,
      sexoId,
      licenciaConducirId,
      documentoIdentidadTipoId,
      cargoId
    };

    console.log('Registro construido para enviar:', registro);

    // Validación mínima antes de enviar
    const faltantes = [];
    if (!registro.nombres) faltantes.push('nombres');
    if (!registro.apellidoPaterno) faltantes.push('apellidoPaterno');
    if (!registro.documentoIdentidad) faltantes.push('documentoIdentidad');
    if (registro.sexoId == null) faltantes.push('sexoId');
    if (registro.licenciaConducirId == null) faltantes.push('licenciaConducirId');

    if (faltantes.length) {
      console.warn('Faltan campos obligatorios (no se enviará):', faltantes);
      // Si prefieres intentar igual, comenta el return y dejará que lo intente
      return;
    }

    // Llamada al API
    this.apiService.createPersonal(registro).subscribe(
      (response: any) => {
        console.log('✅ Personal creado:', response);
        this.traerPersonal(); // refrescar tabla
      },
      (error: any) => {
        console.error('❌ Error al crear personal:', error);
      }
    );
  }

  eliminar(e: any) {
    console.log("Evento row removing:", e);

    const id = e.data?.nCodigo || e.key; // depende de cómo mapeaste tu grid
    if (!id) {
      console.error("No se encontró ID en la fila eliminada");
      return;
    }

    this.apiService.deletePersonal(id).subscribe({
      next: () => {
        console.log("✅ Personal eliminado con ID:", id);
        this.traerPersonal();
      },
      error: (err) => {
        console.error("❌ Error al eliminar:", err);
      }
    });
  }

  popupVisible = false;
  selectedPersonal: any = {};

  asignarPersonal(e: any) {
    const fila = e.row?.data;
    const id = fila?.nCodigo;

    if (!id) {
      console.error("❌ No se encontró ID de personal");
      return;
    }

    this.popupVisible = true;

    this.selectedPersonal = {
      empresaId: fila?.empresaId ?? 1,
      id: id,
      marcaAsistencia: true,
      contratoCabeceraId: null,
      horarioCabeceraId: null,
      superiorId: null,
      personalEstadoId: 1,
      registroAsistenciaPoliticaId: null,
      usuarioId: null
    };

    this.selectedHorarioId = null;

    if (!this.horarios?.length) this.traerHorarios();
    if (!this.superiores?.length) this.traerSuperiores();
    if (!this.politicasRegistro?.length) this.traerPoliticasRegistro();
    if (!this.usuarios?.length) this.traerUsuarios();

    this.apiService.getPersonalById(id).subscribe({
      next: (resp) => {
        if (!resp) {
          // ✅ No hay asignación previa → modo creación
          this.existeAsignacion = false;
          console.log("🆕 No existe asignación previa, modo creación");
          return;
        }

        // ✅ Ya existe asignación → modo edición
        this.existeAsignacion = true;
        console.log("✏️ Editando asignación existente:", resp);

        this.selectedPersonal = {
          empresaId: resp.empresaId ?? fila?.empresaId ?? 1,
          id: resp.id,
          marcaAsistencia: resp.marcaAsistencia ?? true,
          contratoCabeceraId: resp.contratoCabeceraId ?? null,
          horarioCabeceraId: resp.horarioCabecera?.id ?? null,
          superiorId: resp.persona?.id ?? null,
          personalEstadoId: resp.personalEstadoId ?? 1,
          registroAsistenciaPoliticaId: resp.registroAsistenciaPolitica?.id ?? null,
          usuarioId: resp.usuario?.id ?? null
        };

        if (resp.horarioCabecera?.id) {
          const horarioSeleccionado = this.horarios.find(
            (h: any) => h.id === resp.horarioCabecera.id
          );
          if (horarioSeleccionado) this.selectedHorarioId = horarioSeleccionado.id;
        }
      },
      error: (err) => {
        this.existeAsignacion = false;
        console.warn("⚠️ No tiene asignación previa o error:", err);
      }
    });
  }

  guardarAsignacion() {
    if (!this.selectedPersonal) {
      console.error("❌ No hay datos seleccionados para guardar.");
      return;
    }

    // Construimos el payload con todos los campos
    const payload = {
      empresaId: this.selectedPersonal.empresaId,
      id: this.selectedPersonal.id,
      marcaAsistencia: this.selectedPersonal.marcaAsistencia,
      contratoCabeceraId: this.selectedPersonal.contratoCabeceraId || 0,
      horarioCabeceraId: this.selectedHorarioId || 0,
      superiorId: this.selectedPersonal.superiorId || 0,
      personalEstadoId: this.selectedPersonal.personalEstadoId || 0,
      registroAsistenciaPoliticaId: this.selectedPersonal.registroAsistenciaPoliticaId || 0,
      usuarioId: this.selectedPersonal.usuarioId || 0
    };

    console.log("📤 Datos a enviar:", payload);

    // 🔹 Si el registro ya tiene un ID en backend → editar
    if (this.selectedPersonal.id && this.existeAsignacion) {
      this.apiService.editarPersonal(this.selectedPersonal.id, payload).subscribe({
        next: (resp) => {
          console.log("✅ Personal actualizado correctamente:", resp);
          this.popupVisible = false;
          this.traerPersonal();
        },
        error: (err) => console.error("❌ Error al actualizar personal:", err)
      });
    }
    // 🔹 Si no tiene asignación previa → crear
    else {
      this.apiService.crearPersonal(payload).subscribe({
        next: (resp) => {
          console.log("✅ Personal creado correctamente:", resp);
          this.popupVisible = false;
          this.traerPersonal();
        },
        error: (err) => console.error("❌ Error al crear personal:", err)
      });
    }
  }

  // ==========================================
  // MÉTODOS PARA SUBIDA MASIVA
  // ==========================================

  abrirSubidaMasiva() {
    this.popupSubidaMasivaVisible = true;
    this.archivoSeleccionado = null;
    this.registrosProcesados = [];
    this.registrosExitosos = 0;
    this.registrosFallidos = 0;
    this.erroresProcesamiento = [];
  }

  cerrarSubidaMasiva() {
    this.popupSubidaMasivaVisible = false;
    this.archivoSeleccionado = null;
    this.traerPersonal(); // Refrescar la tabla
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
      console.log('📁 Archivo seleccionado:', file.name);
    }
  }


  descargarFormatoMasivo() {
    const encabezados = [
      'CODIGO',
      'APELLIDO/NOMBRES',
      'NRO DOCUMENTO',
      'SEXO',
      'EMAIL',
      'TELEFONO',
      'FEC.NACIMIENTO'
    ];

    const primerRegistro = this.personal?.[0];
    const filaEjemplo = primerRegistro
      ? {
          CODIGO: primerRegistro.nCodigo ?? '',
          'APELLIDO/NOMBRES': this.construirApellidoNombres(primerRegistro),
          'NRO DOCUMENTO': primerRegistro.cDNI ?? '',
          SEXO: this.obtenerTextoSexo(primerRegistro.cSexo),
          EMAIL: primerRegistro.cCorreo ?? '',
          TELEFONO: primerRegistro.cCelular ?? '',
          'FEC.NACIMIENTO': this.formatearFechaExcel(primerRegistro.dFechaNacimiento)
        }
      : {
          CODIGO: '001',
          'APELLIDO/NOMBRES': 'APELLIDO PATERNO APELLIDO MATERNO, NOMBRES',
          'NRO DOCUMENTO': '12345678',
          SEXO: 'M',
          EMAIL: 'nombre.apellido@empresa.com',
          TELEFONO: '999999999',
          'FEC.NACIMIENTO': '01/01/1990'
        };

    const worksheet = XLSX.utils.json_to_sheet([filaEjemplo], { header: encabezados });
    worksheet['!cols'] = [
      { wch: 12 },
      { wch: 35 },
      { wch: 16 },
      { wch: 10 },
      { wch: 30 },
      { wch: 14 },
      { wch: 18 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Personal');
    XLSX.writeFile(workbook, 'formato_subida_masiva_personal.xlsx');
  }

  private construirApellidoNombres(persona: any): string {
    const apellidos = [persona.cApPater, persona.cApMater]
      .filter(Boolean)
      .join(' ')
      .trim();
    const nombres = String(persona.cNombres || '').trim();

    return apellidos && nombres ? `${apellidos}, ${nombres}` : `${apellidos}${nombres}`;
  }

  private obtenerTextoSexo(sexoId: any): string {
    const sexo = this.sexo.find((s: any) => s.nCodigo === sexoId);
    const nombreSexo = String(sexo?.cNombre || '').toUpperCase();

    if (nombreSexo.startsWith('F')) return 'F';
    if (nombreSexo.startsWith('M')) return 'M';

    return sexoId === 2 ? 'F' : 'M';
  }

  private formatearFechaExcel(fecha: any): string {
    if (!fecha) return '';

    const date = fecha instanceof Date ? fecha : new Date(fecha);
    if (isNaN(date.getTime())) return '';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  async procesarArchivoExcel() {
    if (!this.archivoSeleccionado) {
      console.error('❌ No hay archivo seleccionado');
      return;
    }

    this.procesandoArchivo = true;
    this.registrosProcesados = [];
    this.registrosExitosos = 0;
    this.registrosFallidos = 0;
    this.erroresProcesamiento = [];

    try {
      console.log('📖 Leyendo archivo Excel...');

      const data = await this.leerArchivoExcel(this.archivoSeleccionado);
      console.log('✅ Datos leídos del Excel:', data.length, 'registros');

      if (data.length === 0) {
        this.erroresProcesamiento.push('El archivo Excel no contiene datos válidos');
        this.procesandoArchivo = false;
        return;
      }

      console.log('🔍 Columnas detectadas:', Object.keys(data[0]));
      console.log('🔍 Primer registro:', data[0]);

      // 🔹 FILTRAR por DNI válido
      const dataFiltrada = data.filter((fila: any) => {
        const dni = String(
          fila['NRO DOCUMENTO'] ||
          fila['NRO.DOCUMENTO'] ||
          fila['DOCUMENTO'] ||
          fila['DNI'] ||
          ''
        ).trim();
        return dni && dni.length === 8;
      });

      console.log(`📊 Registros válidos: ${dataFiltrada.length} de ${data.length}`);

      if (dataFiltrada.length === 0) {
        this.erroresProcesamiento.push('No se encontraron registros con DNI válido de 8 dígitos');
        this.procesandoArchivo = false;
        return;
      }

      this.blockUI.start('Procesando registros...');

      // 🔹 PASO 1: Crear mapa de DNIs del Excel
      const dnisEnExcel = new Map<string, any>();
      dataFiltrada.forEach((fila: any) => {
        const dni = String(
          fila['NRO DOCUMENTO'] ||
          fila['NRO.DOCUMENTO'] ||
          fila['DOCUMENTO'] ||
          fila['DNI'] ||
          ''
        ).trim();
        if (dni && dni.length === 8) {
          dnisEnExcel.set(dni, fila);
        }
      });

      console.log(`📋 DNIs en Excel (${dnisEnExcel.size}):`, Array.from(dnisEnExcel.keys()).slice(0, 10), '...');
      console.log(`📋 Total en tabla actual: ${this.personal.length}`);

      // 🔹 PASO 2: Identificar registros a INACTIVAR
      const registrosAInactivar = this.personal.filter((p: any) => {
        const dniTabla = String(p.cDNI || '').trim();
        return dniTabla && !dnisEnExcel.has(dniTabla);
      });

      console.log(`\n🔒 Registros a INACTIVAR: ${registrosAInactivar.length}`);

      // 🔹 PASO 3: INACTIVAR los que NO están en el Excel
      let inactivados = 0;
      for (const persona of registrosAInactivar) {
        try {
          console.log(`🔒 Inactivando DNI ${persona.cDNI} (ID: ${persona.nCodigo})`);

          const datosInactivar = {
            ...persona,
            bEstado: false
          };

          await firstValueFrom(this.apiService.updatePersonal(persona.nCodigo, datosInactivar));
          console.log(`  ✅ Inactivado`);
          inactivados++;

        } catch (error: any) {
          console.error(`  ❌ Error al inactivar DNI ${persona.cDNI}:`, error);
        }
      }

      // 🔹 PASO 4: Procesar registros del Excel
      let actualizados = 0;
      let creados = 0;

      for (let i = 0; i < dataFiltrada.length; i++) {
        const fila = dataFiltrada[i];
        const dni = String(
          fila['NRO DOCUMENTO'] ||
          fila['NRO.DOCUMENTO'] ||
          fila['DOCUMENTO'] ||
          fila['DNI'] ||
          ''
        ).trim();

        try {
          // Buscar si ya existe
          const registroExistente = this.personal.find((p: any) =>
            String(p.cDNI || '').trim() === dni
          );

          if (registroExistente) {
            // ✏️ ACTUALIZAR si estado es false
            if (registroExistente.bEstado === false) {
              console.log(`✏️ Actualizando DNI ${dni} - Cambiando estado a true`);

              // Crear objeto con todos los datos del registro existente + estado true
              const datosActualizados = {
                ...registroExistente,
                bEstado: true
              };

              // Usar tu API de edición existente
              await firstValueFrom(
                this.apiService.updatePersonal(registroExistente.nCodigo, datosActualizados)
              );

              actualizados++;
              this.registrosExitosos++;
            } else {
              console.log(`ℹ️ DNI ${dni} ya activo - Sin cambios`);
              this.registrosExitosos++;
            }
          } else {
            // ➕ CREAR nuevo
            console.log(`➕ Creando DNI ${dni}`);
            await this.procesarRegistroPersonal(fila, i + 1);
            creados++;
            this.registrosExitosos++;
          }

        } catch (error: any) {
          this.registrosFallidos++;
          this.erroresProcesamiento.push(`Fila ${i + 2}: ${error.message || error}`);
        }
      }

      console.log('\n📊 Resumen final:');
      console.log(`   ➕ Creados: ${creados}`);
      console.log(`   ✏️ Actualizados (estado): ${actualizados}`);
      console.log(`   🔒 Inactivados: ${inactivados}`);
      console.log(`   ❌ Fallidos: ${this.registrosFallidos}`);

      await this.traerPersonal();
      this.blockUI.stop();

      if (this.registrosFallidos === 0) {
        setTimeout(() => {
          this.popupSubidaMasivaVisible = false;
        }, 2000);
      }

    } catch (error) {
      console.error('❌ Error general:', error);
      this.erroresProcesamiento.push('Error al leer el archivo Excel');
      this.blockUI.stop();
    } finally {
      this.procesandoArchivo = false;
    }
  }

  leerArchivoExcel(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: any) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

          // 🔹 Leer TODO como JSON sin encabezados
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

          console.log('📄 Primeras 5 filas del Excel:', jsonData.slice(0, 5));

          // 🔹 Buscar la fila de encabezados (la que tiene "CODIGO", "APELLIDO", etc.)
          let headerRowIndex = -1;
          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row: any = jsonData[i];
            if (Array.isArray(row)) {
              const rowText = row.join('|').toUpperCase();
              if (rowText.includes('CODIGO') && rowText.includes('APELLIDO')) {
                headerRowIndex = i;
                console.log(`✅ Encabezados encontrados en fila ${i}:`, row);
                break;
              }
            }
          }

          if (headerRowIndex === -1) {
            reject(new Error('No se encontraron los encabezados (CODIGO, APELLIDO/NOMBRES) en las primeras 10 filas'));
            return;
          }

          // 🔹 Extraer encabezados
          const headers: any[] = jsonData[headerRowIndex] as any[];
          console.log('📋 Encabezados:', headers);

          // 🔹 Convertir filas de datos usando los encabezados
          const dataRows = jsonData.slice(headerRowIndex + 1);
          const result = dataRows
            .filter((row: any) => Array.isArray(row) && row.some(cell => cell != null && cell !== ''))
            .map((row: any) => {
              const obj: any = {};
              headers.forEach((header, index) => {
                if (header) {
                  obj[header] = row[index];
                }
              });
              return obj;
            });

          console.log('✅ Datos procesados:', result.length, 'registros');
          console.log('🔍 Primer registro:', result[0]);

          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    });
  }

  async procesarRegistroPersonal(fila: any, numeroFila: number): Promise<void> {
    console.log(`\n📝 Paso 0 - Parseando datos de la fila ${numeroFila}`);

    // Parsear nombre completo
    const nombreCompleto = fila['APELLIDO/NOMBRES'] || '';
    const partesNombre = this.parsearNombreCompleto(nombreCompleto);

    // Parsear fecha de nacimiento
    const fechaNacimiento = this.parsearFecha(fila['FEC.NACIMIENTO']);

    // Obtener DNI
    const dni = String(fila['NRO DOCUMENTO'] || '').trim();

    if (!dni || dni.length !== 8) {
      throw new Error(`DNI inválido: "${dni}". Debe tener 8 dígitos.`);
    }

    // 🔍 VERIFICAR SI EL DNI YA EXISTE EN LA TABLA
    const personaExistente = this.personal.find((p: any) => p.cDNI === dni);

    // Generar email si no existe
    let email = (fila['EMAIL'] || '').trim();
    if (!email) {
      email = this.generarEmail(partesNombre.nombres, partesNombre.apellidoPaterno);
      console.log(`⚠️ Email generado automáticamente: ${email}`);
    }

    const telefono = String(fila['TELEFONO'] || '').trim();
    const codigo = String(fila['CODIGO'] || '').trim();

    // Determinar sexo
    const sexoTexto = String(fila['SEXO'] || '').toUpperCase().trim();
    let sexoId = this.determinarSexoId(sexoTexto);

    console.log('📋 Datos parseados:', {
      nombres: partesNombre.nombres,
      apellidoPaterno: partesNombre.apellidoPaterno,
      apellidoMaterno: partesNombre.apellidoMaterno,
      dni,
      email,
      telefono,
      fechaNacimiento,
      sexoId,
      codigo
    });

    const personaPayload = {
      empresaId: 1,
      nombres: partesNombre.nombres,
      apellidoPaterno: partesNombre.apellidoPaterno,
      apellidoMaterno: partesNombre.apellidoMaterno,
      fechaNacimiento: fechaNacimiento,
      documentoIdentidad: dni,
      correo: email,
      celular: telefono,
      estado: true,
      sexoId: sexoId,
      distritoId: 1,
      licenciaConducirId: 1,
      documentoIdentidadTipoId: 1
    };

    let personaId: number;

    // 🔄 SI EL DNI YA EXISTE: SOLO ACTUALIZAR Y TERMINAR
    if (personaExistente) {
      console.log('\n🔄 DNI encontrado, actualizando Persona existente...');
      console.log('📋 Datos actuales:', personaExistente);

      personaId = personaExistente.nCodigo;

      console.log('📤 Enviando payload de actualización:', personaPayload);

      try {
        await firstValueFrom(this.apiService.updatePersonal(personaId, personaPayload));
        console.log('✅ Persona actualizada correctamente');
        console.log(`\n✅✅✅ REGISTRO ACTUALIZADO - Fila ${numeroFila} procesada exitosamente\n`);
        return; // ✅ TERMINAR AQUÍ
      } catch (error: any) {
        console.error('❌ Error al actualizar Persona:', error);
        throw new Error(`Error al actualizar Persona: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
      }
    }

    // 🆕 SI EL DNI NO EXISTE: CREAR TODO DESDE CERO
    console.log('\n🆕 DNI no existe, creando Persona nueva...');
    console.log('📤 Enviando payload de Persona:', personaPayload);

    let personaCreada: any;
    try {
      personaCreada = await firstValueFrom(this.apiService.createPersonal(personaPayload));
      console.log('✅ Persona creada:', personaCreada);
      personaId = personaCreada.id;
    } catch (error: any) {
      console.error('❌ Error al crear Persona:', error);
      throw new Error(`Error al crear Persona: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }

    // PASO 2: Crear Usuario
    console.log('\n🔵 Paso 2 - Creando Usuario...');
    const password = this.generarPassword(codigo, partesNombre.apellidoPaterno, partesNombre.nombres);
    console.log('🔐 Password generado:', password);

    const usuarioPayload = {
      email: email,
      password: password,
      phoneNumber: telefono || '000000000'
    };

    console.log('📤 Enviando payload de Usuario:', usuarioPayload);

    let usuarioCreado: any;
    try {
      usuarioCreado = await firstValueFrom(this.apiService.crearUsuario(usuarioPayload));
      console.log('✅ Usuario creado:', usuarioCreado);
    } catch (error: any) {
      console.error('❌ Error al crear Usuario:', error);
      throw new Error(`Error al crear Usuario: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }

    const usuarioId = Number(usuarioCreado.id);

    // PASO 3: Dar acceso a empresa
    console.log('\n🔵 Paso 3 - Asignando acceso a empresa...');
    const usuarioEmpresaPayload = {
      usuarioId: usuarioId,
      empresaId: 1,
      actual: true
    };

    console.log('📤 Enviando payload de UsuarioEmpresa:', usuarioEmpresaPayload);

    try {
      await firstValueFrom(this.apiService.createUsuarioEmpresa(usuarioEmpresaPayload));
      console.log('✅ Acceso a empresa asignado');
    } catch (error: any) {
      console.error('❌ Error al asignar acceso a empresa:', error);
      throw new Error(`Error al asignar acceso a empresa: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }

    // PASO 4: Asignar rol al usuario
    console.log('\n🔵 Paso 4 - Asignando rol al usuario...');
    const roleName = 'MARCACION';
    const usuariosIds = [String(usuarioId)];

    console.log('📤 Asignando rol:', { roleName, usuariosIds });

    try {
      await firstValueFrom(this.apiService.asignarRolUsuario(roleName, usuariosIds));
      console.log('✅ Rol asignado al usuario');
    } catch (error: any) {
      console.error('❌ Error al asignar rol:', error);
      throw new Error(`Error al asignar rol: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }

    // PASO 5: Crear Personal (asignación)
    console.log('\n🔵 Paso 5 - Creando registro de Personal...');
    const personalPayload = {
      empresaId: 1,
      id: personaId,
      marcaAsistencia: true,
      contratoCabeceraId: 1,
      horarioCabeceraId: 1,
      superiorId: 1,
      personalEstadoId: 1,
      registroAsistenciaPoliticaId: 1,
      usuarioId: usuarioId
    };

    console.log('📤 Enviando payload de Personal:', personalPayload);

    try {
      await firstValueFrom(this.apiService.crearPersonal(personalPayload));
      console.log('✅ Registro de Personal creado exitosamente');
    } catch (error: any) {
      console.error('❌ Error al crear Personal:', error);
      throw new Error(`Error al crear Personal: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }

    console.log(`\n✅✅✅ REGISTRO COMPLETO - Fila ${numeroFila} procesada exitosamente\n`);
  }

  // 🆕 Método auxiliar para crear usuario completo con asignaciones
  private async crearUsuarioCompleto(
    email: string,
    telefono: string,
    codigo: string,
    partesNombre: any
  ): Promise<number> { // ✅ Retorna number
    console.log('\n🔵 Creando Usuario...');
    const password = this.generarPassword(codigo, partesNombre.apellidoPaterno, partesNombre.nombres);
    console.log('🔐 Password generado:', password);

    const usuarioPayload = {
      email: email,
      password: password,
      phoneNumber: telefono || '000000000'
    };

    console.log('📤 Enviando payload de Usuario:', usuarioPayload);

    let usuarioCreado: any;
    try {
      usuarioCreado = await firstValueFrom(this.apiService.crearUsuario(usuarioPayload));
      console.log('✅ Usuario creado:', usuarioCreado);
    } catch (error: any) {
      console.error('❌ Error al crear Usuario:', error);
      throw new Error(`Error al crear Usuario: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }

    const usuarioId = Number(usuarioCreado.id); // ✅ Siempre como number

    // Asignar acceso a empresa
    console.log('\n🔵 Asignando acceso a empresa...');
    const usuarioEmpresaPayload = {
      usuarioId: usuarioId,
      empresaId: 1,
      actual: true
    };

    console.log('📤 Enviando payload de UsuarioEmpresa:', usuarioEmpresaPayload);

    try {
      await firstValueFrom(this.apiService.createUsuarioEmpresa(usuarioEmpresaPayload));
      console.log('✅ Acceso a empresa asignado');
    } catch (error: any) {
      console.error('❌ Error al asignar acceso a empresa:', error);
      throw new Error(`Error al asignar acceso a empresa: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }

    // Asignar rol
    console.log('\n🔵 Asignando rol al usuario...');
    try {
      await firstValueFrom(this.apiService.asignarRolUsuario('MARCACION', [String(usuarioId)]));

      console.log('✅ Rol asignado al usuario');
    } catch (error: any) {
      console.error('❌ Error al asignar rol:', error);
      throw new Error(`Error al asignar rol: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }

    return usuarioId; // ✅ Retorna number
  }

  // 🆕 Método auxiliar para crear asignación de personal
  private async crearAsignacionPersonal(personaId: number, usuarioId: number): Promise<void> {
    console.log('\n🔵 Creando registro de Personal...');
    const personalPayload = {
      empresaId: 1,
      id: personaId,
      marcaAsistencia: true,
      contratoCabeceraId: 1,
      horarioCabeceraId: 1,
      superiorId: 1,
      personalEstadoId: 1,
      registroAsistenciaPoliticaId: 1,
      usuarioId: usuarioId
    };

    console.log('📤 Enviando payload de Personal:', personalPayload);

    try {
      await firstValueFrom(this.apiService.crearPersonal(personalPayload));
      console.log('✅ Registro de Personal creado exitosamente');
    } catch (error: any) {
      console.error('❌ Error al crear Personal:', error);
      throw new Error(`Error al crear Personal: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }
  }
  parsearNombreCompleto(nombreCompleto: string): any {
    // Ejemplo: "AQUIMA TAIPE ALEX ROMERO"
    const partes = nombreCompleto.trim().split(/\s+/);

    if (partes.length < 3) {
      throw new Error(`Formato de nombre inválido: "${nombreCompleto}". Se esperan al menos 3 palabras.`);
    }

    return {
      apellidoPaterno: partes[0],
      apellidoMaterno: partes[1],
      nombres: partes.slice(2).join(' ')
    };
  }

  parsearFecha(fecha: any): string {
    if (!fecha) {
      console.log('⚠️ Fecha vacía, usando fecha por defecto');
      return new Date('2000-01-01').toISOString();
    }

    try {
      // Si es un número (formato Excel serial date)
      if (typeof fecha === 'number') {
        const date = XLSX.SSF.parse_date_code(fecha);
        return new Date(date.y, date.m - 1, date.d).toISOString();
      }

      // Si es string, intentar parsear
      const d = new Date(fecha);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    } catch (error) {
      console.warn('⚠️ Error al parsear fecha, usando fecha por defecto:', error);
    }

    return new Date('2000-01-01').toISOString();
  }

  determinarSexoId(sexoTexto: string): number {
    // Normalizar texto
    const texto = sexoTexto.toUpperCase().trim();

    // Mapeo común
    if (texto === 'M' || texto === 'MASCULINO' || texto === 'HOMBRE' || texto === 'VARÓN' || texto === 'MASC') {
      return 1; // Asumiendo que 1 es masculino
    }
    if (texto === 'F' || texto === 'FEMENINO' || texto === 'MUJER' || texto === 'FEM') {
      return 2; // Asumiendo que 2 es femenino
    }

    // Por defecto
    return 1;
  }

  generarEmail(nombres: string, apellido: string): string {
    const nombreLimpio = nombres.toLowerCase().trim().split(' ')[0];
    const apellidoLimpio = apellido.toLowerCase().trim();
    return `${nombreLimpio}.${apellidoLimpio}@empresa.com`;
  }

  generarPassword(codigo: string, apellido: string, nombres: string): string {
    // Formato: CODIGO + APELLIDO + NOMBRE + .
    const codigoLimpio = codigo || '000';
    const apellidoLimpio = apellido.replace(/\s+/g, '');
    const nombreLimpio = nombres.split(' ')[0]; // Solo primer nombre

    return 'Converyour2026#';
  }
}
