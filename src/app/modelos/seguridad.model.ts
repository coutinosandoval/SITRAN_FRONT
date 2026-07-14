// ─── USUARIO ───
export interface Usuario {
  id: number;
  nombre?: string;
  nombreUsuario?: string;
  correo?: string;
  estado?: string;
  idUnidad?: number;
  nombreUnidad?: string;
  idSede?: number;
  nombreSede?: string;
  fechaCreacion?: string;
  creadoPor?: string;
  intentosFallidos?: number;
  bloqueado?: string;
  tipoLugar?: string;
}

export interface UsuarioLista {
  usuarios: Usuario[];
  totalRegistros: number;
  paginaActual: number;
  totalPaginas: number;
}

export interface UsuarioCrear {
  nombre?: string;
  usuario?: string;
  correo?: string;
  clave?: string;
  estado?: string;
  idUnidad?: number;
  idSede?: number;
  tipoLugar?: string;
}

export interface UsuarioActualizar {
  correo?: string;
  estado?: string;
  idUnidad?: number;
  idSede?: number;
  tipoLugar?: string;
}

// ─── ROL ───
export interface Rol {
  id: number;
  nombre?: string;
  descripcion?: string;
  estado?: string;
  fechaCreacion?: string;
  creadoPor?: string;
}

export interface RolCrear {
  nombre?: string;
  descripcion?: string;
}

// ─── PERMISO ───
export interface Permiso {
  id: number;
  nombre?: string;
  descripcion?: string;
  estado?: string;
}
