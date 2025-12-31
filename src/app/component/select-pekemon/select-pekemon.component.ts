/* import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BattleService } from '../../services/battle.service';
import { BattleMoveDetails } from '../../models/battle.models';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-arena-select',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./select-pekemon.component.html",
  styleUrl: "./select-pekemon.component.scss",
})
export class ArenaSelectComponent {
  battle = inject(BattleService);
  private router = inject(Router);

  query = signal('5');
  preview = signal<BattleMoveDetails | null>(null);
  previewUrl = signal<string | null>(null);

  selectedMoveUrlSet = computed(() => {
    const set = new Set<string>();
    const p = this.battle.myPokemon();
    if (!p) return set;

    const selectedIds = new Set(this.battle.myAttacks().map((a) => a.id));
    for (const mv of p.allMoves) {
      const maybeSelected = this.battle.myAttacks().find((a) => a.name === mv.name);
      if (maybeSelected && selectedIds.has(maybeSelected.id)) set.add(mv.url);
    }
    return set;
  });

  statKeys = computed(() => {
    const p = this.battle.myPokemon();
    if (!p) return [];
    const order = ['hp','attack','defense','special-attack','special-defense','speed'];
    return order.filter((k) => p.stats[k] != null);
  });

  previewEffectText = computed(() => {
    const mv = this.preview();
    if (!mv) return '';
    const en = (mv.effect_entries ?? []).find((e) => e.language?.name === 'en');
    return en?.short_effect || en?.effect || '';
  });

  loadPokemon(): void {
    const q = this.query();
    if (!q) return;

    const idOrName = /^\d+$/.test(q) ? Number(q) : q.toLowerCase();

    this.battle.getPokemonByIdOrName(idOrName).subscribe({
      next: (p) => {
        this.battle.selectMyPokemon(p);
        this.preview.set(null);
        this.previewUrl.set(null);
      },
    });
  }

  previewOrToggle(moveUrl: string): void {
    this.previewUrl.set(moveUrl);
    this.preview.set(null);

    this.battle.getMoveDetails(moveUrl).pipe(
      finalize(() => {})
    ).subscribe({
      next: (mv) => this.preview.set(mv),
    });
  }

  toggleFromPreview(): void {
    const mv = this.preview();
    if (!mv) return;
    this.battle.toggleAttack(mv);
  }

  lockIn(): void {
    this.battle.lockInIfReady();
    this.router.navigateByUrl('/areana');
  }
} */