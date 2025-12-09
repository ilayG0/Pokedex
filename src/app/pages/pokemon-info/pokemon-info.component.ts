import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PokemonService } from '../../services/pokemon.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pokemon-info',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon-info.component.html',
})
export class PokemonInfoComponent {
  private route = inject(ActivatedRoute);
  private pokemonService = inject(PokemonService);

  pokemon: any = null;
  isLoading = true;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.pokemonService.getPokemon(id).subscribe(p => {
      this.pokemon = p;
      this.isLoading = false;
    });
  }
}
