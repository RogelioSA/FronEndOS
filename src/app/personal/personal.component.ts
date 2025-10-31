import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { firstValueFrom } from 'rxjs';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
 
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
}