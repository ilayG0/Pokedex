import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-arena-start-stage',
  standalone: true,
  templateUrl: './arena-start-stage.component.html',
  styleUrl: './arena-start-stage.component.scss',
})
export class ArenaStartStageComponent {
  @Output() start = new EventEmitter<void>();
  onStart(): void {
    this.start.emit();
  }
}