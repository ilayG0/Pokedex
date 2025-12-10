import { Component, EventEmitter, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PokemonService, SelectOption } from '../../services/pokemon.service';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
})
export class FilterPanelComponent implements OnInit {
  @Output() search = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  filterForm!: FormGroup;

  submitted = false;

  private readonly fb = inject(FormBuilder);
  private readonly pokemonService = inject(PokemonService);

  constructor() {}

  ngOnInit(): void {
    this.filterForm = this.fb.group({
      name: ['', [Validators.required]],
      height: [
        null,
        [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)],
      ],
      type: ['', [Validators.required]],
      group: ['', [Validators.required]],
    });

    // trigger initial load – will only actually call API once
    this.pokemonService.loadTypesAndGroups();
  }

  //  connect template directly to service signals
  get typeOptions(): SelectOption[] {
    return this.pokemonService.typeOptions();
  }

  get groupOptions(): SelectOption[] {
    return this.pokemonService.groupOptions();
  }

  get f() {
    return this.filterForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    console.log(this.filterForm.value);
    this.search.emit(this.filterForm.value);
    this.onCancel();
  }

  onCancel(): void {
    this.filterForm.reset({
      name: '',
      height: null,
      type: '',
      group: '',
    });
    this.submitted = false;
    this.cancel.emit();
  }
}
