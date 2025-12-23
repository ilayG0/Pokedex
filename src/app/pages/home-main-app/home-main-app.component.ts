import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from '../../component/header/header.component';

@Component({
  standalone: true,
  selector: 'app-home-main-app',
  imports: [CommonModule, RouterOutlet, RouterLink, Header],
  templateUrl: './home-main-app.component.html',
  styleUrls: ['./home-main-app.component.scss'],
})
export class PokedexShellComponent {}
