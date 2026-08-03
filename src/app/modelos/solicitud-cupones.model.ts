// ============================================================
// solicitud-cupones.model.ts
// ============================================================

export interface SolicitudCupones {
  id?: number;
  idSede: number;
  sedeNombre?: string;
  montoSolicitado: number;
  montoAprobado?: number;
  estado?: string;
  fechaSolicitud?: string;
  solicitadoPor?: string;
  motivo?: string;
  autorizadoPor?: string;
  fechaAutorizacion?: string;
  observacionAutorizacion?: string;
  justificacionRechazo?: string;
  atendidoPor?: string;
  fechaAtencion?: string;
  nombreEntregador?: string;
  nombreReceptor?: string;
  urlPdf?: string;
  cantidadOriginal?: number;
  entregados?: number;
  disponibles?: number;
}

export interface SolicitudCuponesDetalle {
  id?: number;
  idSolicitud?: number;
  idCompraDetalle: number;
  denominacion: number;
  cantidadAsignada: number;
  numeroDel: number;
  numeroAl: number;
  fechaAsignacion?: string;
  asignadoPor?: string;
  cantidadOriginal?: number;
  entregados?: number;
  disponibles?: number;
}

export interface SolicitudCuponesPaginada {
  total: number;
  pagina: number;
  porPagina: number;
  datos: SolicitudCupones[];
}
