/**
 * Contrato reducido devuelto por GET /rrhh/RegistroAsistencia/range_date.
 *
 * Mantener este modelo separado de los DTO de detalle evita que los reportes
 * asuman que el listado incluye relaciones completas (política, horario, etc.).
 */
export interface RegistroAsistenciaRangeDate {
  empresaId: number;
  id: number;
  personalId: number;
  fecha: string;
  fechaJornal: string;
  tipoEvento: number;
  esTardanza: boolean;
  diferenciaMinutos: number;
  latitud: number | null;
  longitud: number | null;
  adjuntoId: number | null;
  adjuntoUrl: string | null;
  minutosDescanso: number;
  minutosTraslado: number;
  personal: {
    horarioCabeceraId: number | null;
  } | null;
  persona: {
    nombreCompleto: string;
    documentoIdentidad: string;
  } | null;
  ordenTrabajo: {
    id: number;
    nombre: string;
    descripcion: string;
  } | null;
  ordenServicio: {
    id: number;
    codigoOrdenInterna: string;
    codigoReferencial: string;
    descripcion: string;
  } | null;
  personalCargoExterno: {
    id: number;
    empresaId: number;
    personalId: number;
    cargoId: number;
    costoHombre: number;
    personal: null;
    cargo: null;
  } | null;
}
