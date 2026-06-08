import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import * as XLSX from 'xlsx';

interface Mensaje {
  tipo: 'usuario' | 'sistema';
  texto: string;
  datos?: any[];
  columnas?: string[];
  cargando?: boolean;
}

@Component({
  selector: 'app-reporte-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-ia.html',
})
export class ReporteIAComponent {
  pregunta: string = '';
  mensajes: Mensaje[] = [];
  cargando: boolean = false;

  private apiUrl = `${environment.apiUrl}/api/reporte-ia`;

  constructor(private http: HttpClient) {
    // Mensaje de bienvenida
    this.mensajes.push({
      tipo: 'sistema',
      texto:
        '¡Hola! Soy tu asistente de reportes. Puedes preguntarme cosas como:\n• ¿Cuántos cupones se han dado a la delegación Jalapa?\n• ¿Cuáles comisiones están en curso?\n• ¿Cuántos talonarios tiene cada sede?',
    });
  }

  enviar(): void {
    if (!this.pregunta.trim() || this.cargando) return;

    const preguntaTexto = this.pregunta.trim();
    this.pregunta = '';

    // Agregar mensaje del usuario
    this.mensajes.push({ tipo: 'usuario', texto: preguntaTexto });

    // Agregar mensaje de carga
    const msgCarga: Mensaje = { tipo: 'sistema', texto: 'Consultando...', cargando: true };
    this.mensajes.push(msgCarga);
    this.cargando = true;

    this.http.post<any>(`${this.apiUrl}/consultar`, { pregunta: preguntaTexto }).subscribe({
      next: (res) => {
        // Remover mensaje de carga
        this.mensajes = this.mensajes.filter((m) => !m.cargando);
        this.cargando = false;

        const columnas = res.datos?.length > 0 ? Object.keys(res.datos[0]) : [];
        this.mensajes.push({
          tipo: 'sistema',
          texto: res.respuesta || `Se encontraron ${res.datos?.length || 0} registros.`,
          datos: res.datos || [],
          columnas: columnas,
        });

        // Scroll al final
        setTimeout(() => {
          const chat = document.getElementById('chat-container');
          if (chat) chat.scrollTop = chat.scrollHeight;
        }, 100);
      },
      error: () => {
        this.mensajes = this.mensajes.filter((m) => !m.cargando);
        this.cargando = false;
        this.mensajes.push({
          tipo: 'sistema',
          texto: 'Ocurrió un error al procesar tu consulta. Intenta de nuevo.',
        });
      },
    });
  }

  descargarExcel(mensaje: Mensaje): void {
    if (!mensaje.datos || mensaje.datos.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(mensaje.datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte_${new Date().getTime()}.xlsx`);
  }

  teclaEnter(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.enviar();
    }
  }
}
