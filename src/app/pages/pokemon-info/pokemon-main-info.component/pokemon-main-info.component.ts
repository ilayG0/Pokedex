import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../../models/pokemon.model';
import { CapitalizeFirstLetterPipe } from "../../../pipes/capitalize-first-letter.pipe"; // adjust path

@Component({
  selector: 'app-pokemon-main-info',
  standalone: true,
  imports: [CommonModule, CapitalizeFirstLetterPipe],
  templateUrl: './pokemon-main-info.component.html',
  styleUrls: ['./pokemon-main-info.component.scss'],
})
export class PokemonMainInfoComponent {
  @Input({required: true}) pokemon!: Pokemon;
}
