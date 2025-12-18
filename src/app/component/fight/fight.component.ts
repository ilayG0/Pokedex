import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BattleService } from '../../services/battle.service';

@Component({
  selector: 'app-arena-fight',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div style="max-width:900px;margin:0 auto;padding:18px">
      <a routerLink="/arena">← Back</a>
      <h2>Fight (next step)</h2>
      <p *ngIf="!battle.isReady()">Not ready. Go back and pick a Pokémon + 2 attacks.</p>

      <div *ngIf="battle.isReady()">
        <div><b>Your Pokémon:</b> {{ battle.myPokemon()?.name }}</div>
        <div><b>Your attacks:</b> {{ battle.myAttacks()[0]?.name }}, {{ battle.myAttacks()[1]?.name }}</div>
      </div>
    </div>
  `,
})
export class ArenaFightComponent {
  battle = inject(BattleService);
}