// Modelo que define los datos que se envían al API para iniciar sesión
export interface LoginRequest {
  usuario: string;
  clave: string;
}

// Modelo que define los datos que devuelve el API después de un login exitoso
export interface LoginResponse {
  token: string;
  nombre: string;
  usuarioSistema: string;
  roles: string[];
  expiracion: string;
}

// Modelo que define la respuesta cuando ocurre un error
export interface ErrorResponse {
  mensaje: string;
}
