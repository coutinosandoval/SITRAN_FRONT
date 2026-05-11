export interface Talonario {
  id:                 number;
  fechaCompra?:       string;
  idComprador:        number;
  nombreComprador?:   string;
  expendedor?:        string;
  cantidadCupones:    number;
  valorCupon:         number;
  fechaEmision?:      string;
  fechaVencimiento?:  string;
  saldo:              number;
  estado:             number;
  estadoNombre?:      string;
  observaciones?:     string;
  numeradoDel?:       number;
  numeradoAl?:        number;
  idSedeTraslado?:    number;
  nombreSedeTraslado?: string;
  fechaTraslado?:     string;
  trasladadoPor?:     string;
  cuponesRetornados?: number;
  fechaRetorno?:      string;
  retornadoPor?:      string;
  nombreExpendedor?: string;
}

export interface TalonarioRequest {
  fechaCompra?:       string;
  idComprador:        number;
  idExpendedor:       number;  // cambió de expendedor: string a idExpendedor: number
  cantidadCupones:    number;
  valorCupon:         number;
  fechaEmision?:      string;
  fechaVencimiento?:  string;
  numeradoDel:        number;
  numeradoAl:         number;
  observaciones?:     string;
}

export interface TalonarioLista {
  talonarios:     Talonario[];
  totalRegistros: number;
  paginaActual:   number;
  totalPaginas:   number;
}

export interface TalonarioTrasladar {
  idSedeTraslado: number;
  fechaTraslado?: string;
  trasladadoPor?: string;
  retornadoPor?:  string;
}

export interface TalonarioDevolver {
  cuponesRetornados: number;
  fechaRetorno?:     string;
  retornadoPor?:     string;
}

export interface Cupon {
  id:               number;
  idTalonario:      number;
  numeroCupon:      number;
  fechaEmision?:    string;
  fechaVencimiento?: string;
  valor:            number;
  disponibilidad?:  string;
  estado:           number;
}

export interface CuponLista {
  cupones:        Cupon[];
  totalRegistros: number;
  paginaActual:   number;
  totalPaginas:   number;
}

export interface CuponAsignar {
  idTalonario: number;
  cantidad:    number;
  idPiloto:    number;
  idVehiculo:  number;
  fechaInicio?: string;
  fechaFin?:    string;
}

export interface CuponDevolver {
  idsCupones: number[];
}

export interface SolicitudCupon {
  id:                   number;
  estado?:              string;
  fechaSolicitud?:      string;
  idUnidad?:            number;
  nombreUnidad?:        string;
  solicitante?:         string;
  idVehiculo?:          number;
  descripcionVehiculo?: string;
  idPiloto?:            number;
  nombrePiloto?:        string;
  kilometrajInicial?:   number;
  destino?:             string;
  idTalonario?:         number;
  montoSolicitado?:     number;
  nombreReceptor?:      string;
  nombreEntregador?:    string;
  justificacionRechazo?: string;
}

export interface SolicitudCuponRequest {
  idUnidad:           number;
  solicitante?:       string;
  idVehiculo:         number;
  idPiloto:           number;
  kilometrajInicial:  number;
  destino?:           string;
  montoSolicitado:    number;
}

export interface SolicitudCuponLista {
  solicitudes:    SolicitudCupon[];
  totalRegistros: number;
  paginaActual:   number;
  totalPaginas:   number;
}

export interface AprobarSolicitud {
  idTalonario:      number;
  nombreEntregador?: string;
  nombreReceptor?:   string;
}

export interface RechazarSolicitud {
  justificacionRechazo?: string;
}

export interface BitacoraTalonario {
  id:                number;
  idTalonario:       number;
  tipoMovimiento?:   string;
  fechaMovimiento?:  string;
  nombreSedeOrigen?:  string;
  nombreSedeDestino?: string;
  entregadoPor?:     string;
  recibidoPor?:      string;
  cuponesMovidos?:   number;
  observaciones?:    string;
  registradoPor?:    string;
  fechaRegistro?:    string;
}

export interface SolicitudTalonario {
  id:                    number;
  idSede:                number;
  nombreSede?:           string;
  cantidadCupones:       number;
  valorCupon:            number;
  motivo?:               string;
  estado?:               string;
  fechaSolicitud?:       string;
  atendidoPor?:          string;
  fechaAtencion?:        string;
  idTalonario?:          number;
  nombreEntregador?:     string;
  nombreReceptor?:       string;
  justificacionRechazo?: string;
  creadoPor?:            string;
}

export interface SolicitudTalonarioRequest {
  idSede:          number;
  cantidadCupones: number;
  valorCupon:      number;
  motivo?:         string;
}

export interface SolicitudTalonarioLista {
  solicitudes:    SolicitudTalonario[];
  totalRegistros: number;
  paginaActual:   number;
  totalPaginas:   number;
}

export interface AprobarSolicitudTalonario {
  idTalonario:       number;
  nombreEntregador?: string;
  nombreReceptor?:   string;
}

export interface RechazarSolicitudTalonario {
  justificacionRechazo?: string;
}