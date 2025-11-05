import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
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
  personal : [] = [];
  cargos : [] = [];
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

    await this.traerPersonal();
    await this.traerContratoTipos();
    await this.traerLicencias();
    await this.traerDocumentoTipos();
    await this.traerSexo();
    await this.traerDistritos();
    await this.traerHorarios();
    await this.traerPoliticasRegistro();
    await this.traerUsuarios();

    try {
      const resp: any[] = await firstValueFrom(this.apiService.getPersonas());
      this.superiores = resp.map(p => ({
        id: Number(p.id),
        nombreCompleto: p.nombreCompleto
      }));
      console.log("✅ Superiores cargados:", this.superiores);
    } catch (err) {
      console.error("❌ Error al traer personas", err);
    }
  
    this.blockUI.stop();
  
    this.estados = [
      { id: 1, nombre: "ACTIVO" },
      { id: 2, nombre: "INACTIVO" }
    ];
  }

  async traerPersonal() {
    console.log("traer personal");
  
    try {
      const obser = this.apiService.getPersonal();
      const result = await firstValueFrom(obser);
  
      // 🔹 Mapear los campos de la API a los que usa el grid
      this.personal = result.map((p: any) => ({
        nCodigo: p.id,
        cNombres: p.nombres,
        cApPater: p.apellidoPaterno,
        cApMater: p.apellidoMaterno,
        dFechaNacimiento: p.fechaNacimiento,
        cDNI: p.documentoIdentidad,
        cCorreo: p.correo,
        cCelular: p.celular,
        lEstado: p.estado,
        cSexo: p.sexo?.id,  // el backend manda objeto { id, nombre }
        nLicenciaCategoria: p.licenciaConducir?.id,
        nDocumentoIdentidadTipo: p.documentoIdentidadTipo?.id,
        nDistritoId: p.distrito?.id
      }));
  
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
      distritoId: getVal('nDistritoId')
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
    const distritoId = normalizeId(getVal(['nDistritoId', 'cDistritoId', 'distritoId', 'distrito'], null));
  
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
      distritoId
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
    if (!this.superiores?.length) this.traerPersonal();
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
      console.log('✅ Datos leídos del Excel:', data);

      // 🔹 FILTRAR FILAS VACÍAS
      const dataFiltrada = data.filter((fila: any) => {
        // Verificar que tenga al menos APELLIDO/NOMBRES
        return fila['APELLIDO/NOMBRES'] && String(fila['APELLIDO/NOMBRES']).trim() !== '';
      });

      console.log(`📊 Registros válidos: ${dataFiltrada.length} de ${data.length}`);

      if (dataFiltrada.length === 0) {
        this.erroresProcesamiento.push('No se encontraron registros válidos en el archivo Excel');
        this.procesandoArchivo = false;
        return;
      }

      this.blockUI.start('Procesando registros...');

      // Procesar cada fila del Excel
      for (let i = 0; i < dataFiltrada.length; i++) {
        const fila = dataFiltrada[i];
        console.log(`\n🔄 Procesando registro ${i + 1}/${dataFiltrada.length}:`, fila);

        try {
          await this.procesarRegistroPersonal(fila, i + 1);
          this.registrosExitosos++;
          console.log(`✅ Registro ${i + 1} procesado exitosamente`);
        } catch (error: any) {
          this.registrosFallidos++;
          const mensajeError = `Fila ${i + 2}: ${error.message || error}`;
          this.erroresProcesamiento.push(mensajeError);
          console.error(`❌ Error en registro ${i + 1}:`, error);
        }
      }

      console.log('\n📊 Resumen final:');
      console.log(`   ✅ Exitosos: ${this.registrosExitosos}`);
      console.log(`   ❌ Fallidos: ${this.registrosFallidos}`);
      
      this.blockUI.stop();

    } catch (error) {
      console.error('❌ Error general al procesar archivo:', error);
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
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);
          resolve(jsonData);
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
    
    // Parsear nombre completo (APELLIDO/NOMBRES)
    const nombreCompleto = fila['APELLIDO/NOMBRES'] || '';
    const partesNombre = this.parsearNombreCompleto(nombreCompleto);
    
    // Parsear fecha de nacimiento
    const fechaNacimiento = this.parsearFecha(fila['FEC.NACIMIENTO']);
    
    // Obtener DNI
    const dni = String(fila['NRO DOCUMENTO'] || '').trim();
    
    if (!dni || dni.length !== 8) {
      throw new Error(`DNI inválido: "${dni}". Debe tener 8 dígitos.`);
    }
    
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
    if (sexoId === 1 && !['M', 'MASCULINO', 'HOMBRE', 'VARÓN', 'MASC'].includes(sexoTexto)) {
      console.log(`⚠️ SexoId = 1 (por defecto) para valor: "${sexoTexto}"`);
    }

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

    // PASO 1: Crear Persona
    console.log('\n🔵 Paso 1 - Creando Persona...');
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
      distritoId: 1, // Por defecto
      licenciaConducirId: 1, // Por defecto
      documentoIdentidadTipoId: 1 // Por defecto
    };
    
    console.log('📤 Enviando payload de Persona:', personaPayload);
    if (personaPayload.distritoId === 1) console.log('⚠️ distritoId = 1 (por defecto)');
    if (personaPayload.licenciaConducirId === 1) console.log('⚠️ licenciaConducirId = 1 (por defecto)');
    if (personaPayload.documentoIdentidadTipoId === 1) console.log('⚠️ documentoIdentidadTipoId = 1 (por defecto)');

    // 🔹 USAR createPersonal que hace POST a /general/Persona
    let personaCreada: any;
    try {
      personaCreada = await firstValueFrom(this.apiService.createPersonal(personaPayload));
      console.log('✅ Persona creada:', personaCreada);
    } catch (error: any) {
      console.error('❌ Error al crear Persona:', error);
      throw new Error(`Error al crear Persona: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }
    
    const personaId = personaCreada.id;

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
    
    const usuarioId = usuarioCreado.id;

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

    // PASO 4: Crear Personal (asignación)
    console.log('\n🔵 Paso 4 - Creando registro de Personal...');
    const personalPayload = {
      empresaId: 1,
      id: personaId,
      marcaAsistencia: true,
      contratoCabeceraId: 1, // Por defecto
      horarioCabeceraId: 1, // Por defecto
      superiorId: 1, // Por defecto
      personalEstadoId: 1, // Por defecto (ACTIVO)
      registroAsistenciaPoliticaId: 1, // Por defecto
      usuarioId: usuarioId
    };
    
    console.log('📤 Enviando payload de Personal:', personalPayload);
    console.log('⚠️ contratoCabeceraId = 1 (por defecto)');
    console.log('⚠️ horarioCabeceraId = 1 (por defecto)');
    console.log('⚠️ superiorId = 1 (por defecto)');
    console.log('⚠️ personalEstadoId = 1 (por defecto - ACTIVO)');
    console.log('⚠️ registroAsistenciaPoliticaId = 1 (por defecto)');

    try {
      await firstValueFrom(this.apiService.crearPersonal(personalPayload));
      console.log('✅ Registro de Personal creado exitosamente');
    } catch (error: any) {
      console.error('❌ Error al crear Personal:', error);
      throw new Error(`Error al crear Personal: ${error?.error?.detail || error?.message || 'Error desconocido'}`);
    }
    
    console.log(`\n✅✅✅ REGISTRO COMPLETO - Fila ${numeroFila} procesada exitosamente\n`);
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
    
    return `${codigoLimpio}${apellidoLimpio}${nombreLimpio}.`;
  }
}