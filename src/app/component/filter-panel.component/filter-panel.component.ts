import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PokemonService, SelectOption } from '../../services/pokemon.service';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
})
export class FilterPanelComponent implements OnInit {
  @Output() readonly search = new EventEmitter<any>();
  @Output() readonly cancel = new EventEmitter<void>();

  filterForm!: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly pokemonService = inject(PokemonService);

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      height: [null], 
      type: [''],    
      group: [''],    
    });

    // Load options (service internally caches, so one-time call)
    this.pokemonService.loadTypesAndGroups();
  }

  // Service-driven dropdowns
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
    console.log("filetr ;" ,this.filterForm.value)
    this.search.emit(this.filterForm.value);
  }

  onCancel(): void {
    this.filterForm.reset({
      height: null,
      type: '',
      group: '',
    });
    this.cancel.emit();
  }
}
