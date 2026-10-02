const PROPIEDADES_LISTA = ['data', 'items', 'result', 'value', '$values'] as const;

export function seleccionarUltimosHorariosAsignados(horarios: any[]): any[] {
  const ultimosPorAsignacion = new Map<string, any>();

  for (const horario of horarios) {
    const fecha = String(horario?.fecha ?? '').slice(0, 10);
    const key = `${horario?.ordenTrabajoCabeceraId}_${horario?.personalId}_${fecha}`;
    const horarioActual = ultimosPorAsignacion.get(key);

    if (!horarioActual || Number(horario.id) > Number(horarioActual.id)) {
      ultimosPorAsignacion.set(key, horario);
    }
  }

  return Array.from(ultimosPorAsignacion.values());
}

export function consolidarRespuestaHorariosAsignados(response: any): any {
  if (Array.isArray(response)) {
    return seleccionarUltimosHorariosAsignados(response);
  }

  if (response == null || typeof response !== 'object') {
    return response;
  }

  const propiedadLista = PROPIEDADES_LISTA.find(propiedad => Array.isArray(response[propiedad]));
  if (!propiedadLista) {
    return response;
  }

  return {
    ...response,
    [propiedadLista]: seleccionarUltimosHorariosAsignados(response[propiedadLista])
  };
}
