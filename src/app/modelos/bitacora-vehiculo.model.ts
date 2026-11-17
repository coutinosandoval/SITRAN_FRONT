// Modelo para el reporte de bitácora de traslados de vehículos
export interface BitacoraVehiculo {
  id: number;
  idVehiculo: number;
  descripcionVehiculo?: string;
  tipoMovimiento?: string;
  fechaMovimiento: string;
  idSedeOrigen?: number;
  nombreSedeOrigen?: string;
  idSedeDestino?: number;
  nombreSedeDestino?: string;
  observaciones?: string;
  registradoPor?: string;
  fechaRegistro: string;
}

// Filtros para el reporte de bitácora de vehículos
export interface FiltroBitacoraVehiculos {
  idVehiculo?: number;
  idSede?: number;
  fechaInicio?: string;
  fechaFin?: string;
}
