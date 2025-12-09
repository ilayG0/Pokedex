import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon } from '../../../models/pokemon.model'; // adjust path

@Component({
  selector: 'app-pokemon-stats-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pokemon-stats-details.component.html',
  styleUrls: ['./pokemon-stats-details.component.scss'],
})
export class PokemonStatsDetailsComponent {
  @Input() pokemon!: Pokemon | null;
  @Input() description = '';

  // Get single stat by name
  getStat(statName: string): number | string {
    if (!this.pokemon?.stats) return '-';
    const stat = this.pokemon.stats.find((s: any) => s.stat.name === statName);
    return stat?.base_stat ?? '-';
  }

  // Total stats
  get totalStats(): number | string {
    if (!this.pokemon?.stats) return '-';
    return this.pokemon.stats.reduce(
      (sum: number, s: any) => sum + (s.base_stat ?? 0),
      0
    );
  }
}
