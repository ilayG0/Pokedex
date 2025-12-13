import { Component, Input, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { Pokemon } from '../../models/pokemon.model';
import { LoadingPokeBall } from '../../shared/loading-poke-ball/loading-poke-ball.component';
import { PokemonCard } from '../../component/pokemon-card /pokemon-card.component';

@Component({
  selector: 'app-pokemon-list',
  standalone: true,
  imports: [CommonModule, LoadingPokeBall, PokemonCard],
  templateUrl: './pokemon-list.component.html',
  styleUrls: ['./pokemon-list.component.scss'],
})
export class PokemonListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly destroy$ = new Subject<void>();

  readonly pageSize = 12;
  currentPage = signal(1);

  private _pokemons: Pokemon[] = [];

  @Input()
  set pokemons(value: Pokemon[]) {
    this._pokemons = value ?? [];

    // Keep current page from URL; only clamp if the list got smaller
    const clamped = this.clampPage(this.currentPage());
    if (clamped !== this.currentPage()) {
      this.currentPage.set(clamped);
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { page: clamped },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  get pokemons(): Pokemon[] {
    return this._pokemons;
  }

  ngOnInit(): void {
    // React to URL changes (Back/Forward + manual URL edits)
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((qp) => {
      const page = Number(qp['page']) || 1;
      this.currentPage.set(this.clampPage(page));

      // Ensure page exists in URL
      if (!('page' in qp)) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { page: 1 },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get displayedPokemons(): Pokemon[] {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this._pokemons.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this._pokemons.length / this.pageSize));
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages) {
      this.setPage(this.currentPage() + 1);
    }
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.setPage(this.currentPage() - 1);
    }
  }

  private setPage(page: number): void {
    const next = this.clampPage(page);
    if (next === this.currentPage()) return;

    this.currentPage.set(next);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: next },
      queryParamsHandling: 'merge',
      // replaceUrl: true, // optional: if you don't want browser history per page click
    });
  }

  private clampPage(page: number): number {
    if (!page || page < 1) return 1;
    return Math.min(page, this.totalPages);
  }
}
