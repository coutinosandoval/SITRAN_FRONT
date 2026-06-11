export interface Mantenimiento {
  id:                  number;
  idVehiculo:          number;
  descripcionVehiculo?: string;
  tipoMantenimiento?:  string;
  fechaProgramada?:    string;
  fechaRealizado?:     string;
  descripcion?:        string;
  observaciones?:      string;
  fuente?:             string;
  costoReal:           number;
  estado?:             string;
}

export interface MantenimientoRequest {
  idVehiculo:          number;
  tipoMantenimiento?:  string;
  fechaProgramada?:    string;
  descripcion?:        string;
  observaciones?:      string;
  fuente?:             string;
  costoReal:           number;
}

export interface MantenimientoActualizar {
  tipoMantenimiento?:  string;
  fechaProgramada?:    string;
  fechaRealizado?:     string;
  descripcion?:        string;
  observaciones?:      string;
  costoReal:           number;
  estado?:             string;
}

export interface MantenimientoLista {
  mantenimientos: Mantenimiento[];
  totalRegistros: number;
  paginaActual:   number;
  totalPaginas:   number;
}

export interface CambiarEstadoMantenimiento {
  estado:          string;
  fechaRealizado?: string;
  costoReal?:      number;
}