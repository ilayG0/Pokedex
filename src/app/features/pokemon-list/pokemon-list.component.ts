import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Pokemon } from '../../models/pokemon.model';
import { PokemonCard } from '../../component/pokemon-card/pokemon-card.component';
import { PokemonErrorNotificationComponent } from '../../shared/pokemon-error-notification.component/pokemon-error-notification.component';
import { PokemonService } from '../../services/pokemon.service';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, PokemonCard, PokemonErrorNotificationComponent],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.scss'],
})
export class PokemonListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  readonly pokemonService = inject(PokemonService);

  readonly pageSize = 12;
  currentPage = signal(1);

  private _pokemons: Pokemon[] = [];
  private requestedPage = 1;

  @Input()
  set pokemons(value: Pokemon[]) {
    this._pokemons = value ?? [];
  }

  get pokemons(): Pokemon[] {
    return this._pokemons;
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntil(this.destroy$)).subscribe((m) => {
      const urlPage = m.get('page');
      const page = urlPage ? Number(urlPage) : 1;
      const search = m.get('search') === 'true';

      this.requestedPage = Number.isFinite(page) ? Math.floor(page) : 1;
      this.currentPage.set(this.requestedPage);
    });
  }

  nextPage(): void {
    const next = this.currentPage() + 1;
    if (next <= 86) {
      this.navigateToPage(next, true);
    }
  }

  prevPage(): void {
    const prev = this.currentPage() - 1;
    if (prev >= 1) {
      this.navigateToPage(prev, true);
    }
  }

  private navigateToPage(page: number, replaceUrl: boolean): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
}
