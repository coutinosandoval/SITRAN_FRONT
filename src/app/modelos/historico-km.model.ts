export interface HistoricoKilometraje {
  id:                  number;
  idVehiculo:          number;
  descripcionVehiculo?: string;
  fechaRegistro?:      string;
  kilometrajInicial:   number;
  kilometrajeFinal:    number;
  recorrido:           number;
  combustibleEstimado: number;
  observaciones?:      string;
  creadoPor?:          string;
  fechaCreacion?:      string;
}

export interface HistoricoKilometrajeRequest {
  idVehiculo:          number;
  kilometrajInicial:   number;
  kilometrajeFinal:    number;
  combustibleEstimado: number;
  observaciones?:      string;
}

export interface HistoricoKilometrajeLista {
  registros:      HistoricoKilometraje[];
  totalRegistros: number;
  paginaActual:   number;
  totalPaginas:   number;
}