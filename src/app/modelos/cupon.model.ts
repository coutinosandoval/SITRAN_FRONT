export interface Talonario {
  id: number;
  fechaCompra?: string;
  idComprador: number;
  nombreComprador?: string;
  expendedor?: string;
  cantidadCupones: number;
  valorCupon: number;
  fechaEmision?: string;
  fechaVencimiento?: string;
  saldo: number;
  estado: number;
  estadoNombre?: string;
  observaciones?: string;
  idSedeTraslado?: number;
  nombreSedeTraslado?: string;
  fechaTraslado?: string;
  trasladadoPor?: string;
  cuponesRetornados?: number;
  fechaRetorno?: string;
  retornadoPor?: string;
  nombreExpendedor?: string;
  numeradoDel?: number;
  numeradoAl?: number;
}

export interface TalonarioRequest {
  fechaCompra?: string;
  idComprador: number;
  idExpendedor: number;
  cantidadCupones: number;
  valorCupon: number;
  fechaEmision?: string;
  fechaVencimiento?: string;
  observaciones?: string;
}

export interface TalonarioLista {
  talonarios: Talonario[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface TalonarioTrasladar {
  idSedeTraslado: number;
  fechaTraslado?: string;
  trasladadoPor?: string;
  retornadoPor?: string;
}

export interface TalonarioDevolver {
  cuponesRetornados: number;
  fechaRetorno?: string;
  retornadoPor?: string;
}

export interface Cupon {
  id: number;
  idTalonario: number;
  numeroCupon: number;
  fechaEmision?: string;
  fechaVencimiento?: string;
  valor: number;
  disponibilidad?: string;
  estado: number;
}

export interface CuponLista {
  cupones: Cupon[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface CuponAsignar {
  idTalonario: number;
  cantidad: number;
  idPiloto: number;
  idVehiculo: number;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface CuponDevolver {
  idsCupones: number[];
}

export interface SolicitudCupon {
  id: number;
  estado?: string;
  fechaSolicitud?: string;
  idUnidad?: number;
  nombreUnidad?: string;
  solicitante?: string;
  idVehiculo?: number;
  descripcionVehiculo?: string;
  idPiloto?: number;
  nombrePiloto?: string;
  kilometrajInicial?: number;
  destino?: string;
  idTalonario?: number;
  montoSolicitado?: number;
  nombreReceptor?: string;
  nombreEntregador?: string;
  justificacionRechazo?: string;
}

export interface SolicitudCuponRequest {
  idUnidad: number;
  solicitante?: string;
  idVehiculo: number;
  idPiloto: number;
  kilometrajInicial: number;
  destino?: string;
  montoSolicitado: number;
}

export interface SolicitudCuponLista {
  solicitudes: SolicitudCupon[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface AprobarSolicitud {
  idTalonario: number;
  nombreEntregador?: string;
  nombreReceptor?: string;
}

export interface RechazarSolicitud {
  justificacionRechazo?: string;
}

export interface BitacoraTalonario {
  id: number;
  idTalonario: number;
  tipoMovimiento?: string;
  fechaMovimiento?: string;
  nombreSedeOrigen?: string;
  nombreSedeDestino?: string;
  entregadoPor?: string;
  recibidoPor?: string;
  cuponesMovidos?: number;
  observaciones?: string;
  registradoPor?: string;
  fechaRegistro?: string;
}

export interface SolicitudTalonario {
  id: number;
  idSede: number;
  nombreSede?: string;
  cantidadCupones: number;
  valorCupon: number;
  motivo?: string;
  estado?: string;
  fechaSolicitud?: string;
  atendidoPor?: string;
  fechaAtencion?: string;
  idTalonario?: number;
  nombreEntregador?: string;
  nombreReceptor?: string;
  justificacionRechazo?: string;
  creadoPor?: string;
  cuponesDisponibles?: number;
}

export interface SolicitudTalonarioRequest {
  idSede: number;
  cantidadCupones: number;
  valorCupon: number;
  motivo?: string;
}

export interface SolicitudTalonarioLista {
  solicitudes: SolicitudTalonario[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface AprobarSolicitudTalonario {
  idTalonario: number;
  nombreEntregador?: string;
  nombreReceptor?: string;
}

export interface RechazarSolicitudTalonario {
  justificacionRechazo?: string;
}

// ─── DETALLE DE SOLICITUD TALONARIO ───

/** Detalle de talonarios asignados a una solicitud */
export interface SolicitudTalonarioDetalle {
  id: number;
  idSolicitud: number;
  idTalonario: number;
  nombreTalonario?: string;
  valorCupon: number;
  cuponesAsignados: number;
  cuponesDevueltos: number;
  fechaAsignacion?: string;
  fechaDevolucion?: string;
  estado?: string;
  cuponesEntregados?: number;
}

/** DTO para asignar cupones de un talonario a una solicitud */
export interface AsignarCuponesSolicitud {
  idTalonario: number;
  cupones: number;
  entregadoPor?: string;
  recibidoPor?: string;
}

/** DTO para devolver cupones a bodega */
export interface DevolverCuponesBodega {
  cupones: number;
}

/** Talonario disponible en bodega con su saldo */
export interface TalonarioBodegaDisponible {
  id: number;
  nombre: string;
  saldo: number;
}

// Agregar junto a los otros interfaces del modelo
export interface TalonarioAsignacionDTO {
  idTalonario: number;
  cantidad: number;
}

export interface AprobarSolicitudTalonarioRequest {
  talonarios: TalonarioAsignacionDTO[];
  nombreEntregador?: string;
  nombreReceptor?: string;
}
