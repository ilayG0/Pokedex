
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokemonService, PokemonListResponse, NamedAPIResource } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon-list.html',
  styleUrls: ['./pokemon-list.scss'],
})
export class PokemonListComponent implements OnInit {
  // Properties used in the template
  pokemon: NamedAPIResource[] = [];
  isLoading = signal(false);

  currentPage = 1;
  readonly pageSize = 12;
  totalCount = 0;

  // Angular 18+ style DI
  private readonly pokemonService = inject(PokemonService);

  ngOnInit(): void {
    this.loadPage(1);
  }

  loadPage(page: number): void {
    this.isLoading.set(true);

    this.pokemonService.getPokemonList(page, this.pageSize).subscribe({
      next: (res: PokemonListResponse) => {
        this.pokemon = res.results;
        this.totalCount = res.count;
        this.currentPage = page;
        this.isLoading.set(false)
        console.log(this.pokemon)
      },
      error: () => {
        //this.isLoading = true;
      },
    });
  }

  nextPage(): void {
    const maxPage = Math.ceil(this.totalCount / this.pageSize);
    if (this.currentPage < maxPage) {
      this.loadPage(this.currentPage + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.loadPage(this.currentPage - 1);
    }
  }

  // Used in the template to build the sprite URL
  getIdFromUrl(url: string): number {
    return this.pokemonService.extractIdFromUrl(url);
  }
}