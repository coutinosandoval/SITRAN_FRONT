export interface Comision {
  id:                    number;
  tipoComision?:         string;
  solicitante?:          string;
  idUnidad?:             number;
  nombreUnidad?:         string;
  departamentoSeccion?:  string;
  fechaSolicitud?:       string;
  fechaInicio?:          string;
  fechaFin?:             string;
  horaSalida?:           string;
  duracionAproximada?:   string;
  destino?:              string;
  motivo?:               string;
  observaciones?:        string;
  firmadoJefe:           number;
  firmadoFinanciero:     number;
  firmadoAdministrativo: number;
  idEstado?:             number;
  nombreEstado?:         string;
  autoridad1Nombre?:     string;
  autoridad1Cargo?:      string;
  autoridad2Nombre?:     string;
  autoridad2Cargo?:      string;
  autoridad3Nombre?:     string;
  autoridad3Cargo?:      string;
  justificacion?:        string;
  creadoPor?:            string;
  fechaCreacion?:        string;
}

export interface ComisionRequest {
  tipoComision?:        string;
  solicitante?:         string;
  idUnidad?:            number;
  departamentoSeccion?: string;
  fechaInicio?:         string;
  fechaFin?:            string;
  horaSalida?:          string;
  duracionAproximada?:  string;
  destino?:             string;
  motivo?:              string;
  observaciones?:       string;
  autoridad1Nombre?:    string;
  autoridad1Cargo?:     string;
  autoridad2Nombre?:    string;
  autoridad2Cargo?:     string;
  autoridad3Nombre?:    string;
  autoridad3Cargo?:     string;
  personas:             string[];
}

export interface ComisionActualizar {
  tipoComision?:        string;
  solicitante?:         string;
  idUnidad?:            number;
  departamentoSeccion?: string;
  fechaInicio?:         string;
  fechaFin?:            string;
  horaSalida?:          string;
  duracionAproximada?:  string;
  destino?:             string;
  motivo?:              string;
  observaciones?:       string;
}

export interface ComisionLista {
  comisiones:     Comision[];
  totalRegistros: number;
  paginaActual:   number;
  totalPaginas:   number;
}

export interface CambiarEstadoComision {
  idEstado:      number;
  justificacion?: string;
}

export interface ComisionPersona {
  id:            number;
  idComision:    number;
  nombrePersona?: string;
}

export interface AgregarPersona {
  nombrePersona?: string;
}

export interface HistorialComision {
  id:             number;
  idComision:     number;
  fechaRegistro?: string;
  detalle?:       string;
  usuario?:       string;
  accion?:        string;
  valorAnterior?: string;
  valorNuevo?:    string;
}

export interface EstadoComision {
  id:           number;
  nombre?:      string;
  descripcion?: string;
}

export interface EstadisticaComision {
  id:      number;
  nombre?: string;
  total:   number;
}

export interface ComisionDetalle {
  comision:  Comision;
  personas:  ComisionPersona[];
  historial: HistorialComision[];
}