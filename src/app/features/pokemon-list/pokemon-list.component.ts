import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonCard } from '../../component/pokemon-card /pokemon-card.component';
import { PokemonErrorNotificationComponent } from "../../shared/pokemon-error-notification.component/pokemon-error-notification.component";

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, PokemonCard, PokemonErrorNotificationComponent],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.scss'],
})
export class PokemonListComponent {
 @Input() pokemons?: Pokemon[];
}
