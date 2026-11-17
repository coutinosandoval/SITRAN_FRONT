import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Sede {
  id: number;
  nombre: string;
}

@Injectable({
  providedIn: 'root',
})
export class SedeService {
  private apiUrl = `${environment.apiUrl}/api/catalogo`;

  constructor(private http: HttpClient) {}

  // Obtiene el catálogo completo de sedes
  obtenerSedes(): Observable<Sede[]> {
    return this.http.get<Sede[]>(`${this.apiUrl}/sedes`);
  }
}
