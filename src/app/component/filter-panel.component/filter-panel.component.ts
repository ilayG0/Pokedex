import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PokemonService, SelectOption } from '../../services/pokemon.service';
import { NgStyle } from '@angular/common';

interface Option {
  name: string;
  value: string;
}

interface PokemonColorOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [ReactiveFormsModule, NgStyle],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
})
export class FilterPanelComponent implements OnInit {
  @Output() readonly search = new EventEmitter<any>();
  @Output() readonly cancel = new EventEmitter<void>();

  filterForm!: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly pokemonService = inject(PokemonService);

  pokemonColors: PokemonColorOption[] = [
    { label: 'שחור', value: 'black' },
    { label: 'כחול', value: 'blue' },
    { label: 'חום', value: 'brown' },
    { label: 'אפור', value: 'gray' },
    { label: 'ירוק', value: 'green' },
    { label: 'ורוד', value: 'pink' },
    { label: 'סגול', value: 'purple' },
    { label: 'אדום', value: 'red' },
    { label: 'לבן', value: 'white' },
    { label: 'צהוב', value: 'yellow' },
  ];

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      height: [null],
      type: [''],
      group: [''],
      color: [null],
    });

    this.pokemonService.loadTypesAndGroups();
  }

  getColorHex(color: string): string {
    const map: Record<string, string> = {
      black: '#111827',
      blue: '#3B82F6',
      brown: '#8B5A2B',
      gray: '#6B7280',
      green: '#22C55E',
      pink: '#EC4899',
      purple: '#8B5CF6',
      red: '#EF4444',
      white: '#E5E7EB',
      yellow: '#FACC15',
    };

    return map[color] ?? '#000000';
  }

  onColorSelect(color: string): void {
    const current = this.filterForm.get('color')?.value;

    if (current === color) {
      this.filterForm.get('color')?.setValue(null);
    } else {
      this.filterForm.get('color')?.setValue(color);
    }
  }

  get typeOptions(): SelectOption[] {
    return this.pokemonService.typeOptions();
  }

  get groupOptions(): SelectOption[] {
    return this.pokemonService.groupOptions();
  }

  get f() {
    return this.filterForm.controls;
  }

  onSubmit(): void {
    console.log('filetr ;', this.filterForm.value);
    this.search.emit(this.filterForm.value);
  }

  onCancel(): void {
    this.filterForm.reset({
      height: null,
      type: '',
      group: '',
      color: null,
    });
    this.cancel.emit();
  }
}
