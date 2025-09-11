import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
    selector: 'app-analog-clock',
    templateUrl: './analog-clock.component.html',
    styleUrl: './analog-clock.component.css',
    standalone: false
})
export class AnalogClockComponent implements OnInit, OnDestroy {

  public time: string = '';
  public time24: string = '';
  private timerId: any;

  constructor() { }

  ngOnInit() {
    // Inicializa el reloj
    this.updateTime();
    // Actualiza el reloj cada segundo
    this.timerId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  ngOnDestroy() {
    // Detener el intervalo cuando el componente se destruya
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  private updateTime() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    let period = 'AM';  // Inicializa como 'AM'

    this.time24 = `${this.formatTime(hours)}:${this.formatTime(minutes)}:${this.formatTime(seconds)}`;

    // Convierte las horas a formato de 12 horas
    if (hours >= 12) {
      hours = hours % 12;  // Convierte 24h a 12h
      period = 'PM';       // Si es tarde, es 'PM'
    }
    if (hours === 0) {
      hours = 12;          // La medianoche debe mostrarse como 12 (no 0)
    }

    // Formatea la hora en formato de 2 dígitos
    this.time = `${this.formatTime(hours)}:${this.formatTime(minutes)}:${this.formatTime(seconds)} ${period}`;
  }

  // Asegura que las horas, minutos y segundos tengan dos dígitos
  private formatTime(unit: number): string {
    return unit < 10 ? `0${unit}` : `${unit}`;
  }

  getHora(): string {
    return this.time24;
  }

}
