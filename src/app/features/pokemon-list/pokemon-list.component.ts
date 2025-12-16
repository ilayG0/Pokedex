import { CommonModule } from '@angular/common';
<<<<<<< HEAD
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
=======
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
>>>>>>> 32dfd5ab10431e0fc12564017973f9084d421567

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
<<<<<<< HEAD
export class PokemonListComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();

  @Input({required: true}) displayLoadPokemonsBtn!: Boolean;
  @Output() loadNextPage = new EventEmitter();


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
    
      this.requestedPage = Number.isFinite(page) ? Math.floor(page) : 1;
      this.currentPage.set(this.requestedPage);
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

  onLoadMorePokemons(){
    this.loadNextPage.emit();
  }

  nextPage(): void {
    const next = this.currentPage() + 1;
    if (next <= this.totalPages) {
      this.setPage(next);
    }
  }

  prevPage(): void {
    const prev = this.currentPage() - 1;
    if (prev >= 1) {
      this.setPage(prev);
    }
  }

  private setPage(page: number): void {
    const next = this.clampPage(page);
    if (next === this.currentPage()) return;

    this.currentPage.set(next);
    this.requestedPage = next;
    this.navigateToPage(next, false);
  }

  private clampPage(page: number): number {
    if (!Number.isFinite(page) || page < 1) return 1;
    return Math.min(page, this.totalPages);
  }

  private navigateToPage(page: number, replaceUrl: boolean): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
      replaceUrl,
    });
  }
=======
export class PokemonListComponent {
 @Input() pokemons?: Pokemon[];
>>>>>>> 32dfd5ab10431e0fc12564017973f9084d421567
}
