import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pokemon-error-notification',
  imports: [CommonModule],
  templateUrl: './pokemon-error-notification.component.html',
  styleUrl: './pokemon-error-notification.component.scss',
})
export class PokemonErrorNotificationComponent {
  @Input() errorTitle?: string;
  @Input({ required: true }) errorMessage!: string;
  @Input() errorAction?: string;
}
