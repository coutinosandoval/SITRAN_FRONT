export interface DashboardResumen {
  totalVehiculos: number;
  totalPilotos: number;
  totalCupones: number;
  totalMantenimientos: number;
}

export interface PrecioCombustible {
  producto: string;
  precioAnterior: string;
  precioActual: string;
  diferencia: string;
  tipoServicio: string;
}
