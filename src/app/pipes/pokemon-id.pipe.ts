import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pokemonId',
  standalone: true,
})
export class PokemonIdPipe implements PipeTransform {
  transform(id: number): string {
    if (id == null) return '';
    return `#${id.toString().padStart(3, '0')}`;
  }
}
