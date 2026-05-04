import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Piloto, PilotoLista, PilotoRequest, PilotoCatalogos, Telefono, TelefonoRequest } from '../modelos/piloto.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PilotoService {

  private apiUrl = `${environment.apiUrl}/api/piloto`;

  constructor(private http: HttpClient) {}

  // Obtiene lista paginada de pilotos
  obtener(pagina: number = 1, tamanioPagina: number = 10, busqueda?: string): Observable<PilotoLista> {
    let params = new HttpParams()
      .set('pagina', pagina.toString())
      .set('tamanioPagina', tamanioPagina.toString());

    if (busqueda)
      params = params.set('busqueda', busqueda);

    return this.http.get<PilotoLista>(this.apiUrl, { params });
  }

  // Obtiene un piloto por su ID
  obtenerPorId(id: number): Observable<Piloto> {
    return this.http.get<Piloto>(`${this.apiUrl}/${id}`);
  }

  // Obtiene catálogos para el formulario
  obtenerCatalogos(): Observable<PilotoCatalogos> {
    return this.http.get<PilotoCatalogos>(`${this.apiUrl}/catalogos`);
  }

  // Obtiene teléfonos de un piloto
  obtenerTelefonos(id: number): Observable<Telefono[]> {
    return this.http.get<Telefono[]>(`${this.apiUrl}/${id}/telefonos`);
  }

  // Crea un nuevo piloto
  agregar(piloto: PilotoRequest): Observable<any> {
    return this.http.post(this.apiUrl, piloto);
  }

  // Actualiza un piloto existente
  actualizar(id: number, piloto: PilotoRequest): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, piloto);
  }

  // Elimina lógicamente un piloto
  borrar(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // Agrega un teléfono al piloto
  agregarTelefono(idPiloto: number, telefono: TelefonoRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/${idPiloto}/telefonos`, telefono);
  }

  // Elimina un teléfono del piloto
  eliminarTelefono(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/telefonos/${id}`);
  }
}