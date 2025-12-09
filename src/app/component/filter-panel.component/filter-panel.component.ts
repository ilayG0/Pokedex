import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

interface Option {
  name: string;
  value: string;
}

@Component({
  selector: 'app-filter-panel',
  imports: [ReactiveFormsModule, HttpClientModule],
  templateUrl: './filter-panel.component.html',
  styleUrls: ['./filter-panel.component.scss'],
})
export class FilterPanelComponent implements OnInit {
  @Output() search = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  filterForm!: FormGroup;

  typeOptions: Option[] = [];
  groupOptions: Option[] = [];

  submitted = false;

  constructor(private fb: FormBuilder, private http: HttpClient) {}

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

    this.loadTypes();
    this.loadGroups();
  }

  // ---- PokéAPI calls ----
  private loadTypes(): void {
    this.http.get<any>('https://pokeapi.co/api/v2/type').subscribe((res) => {
      this.typeOptions = (res.results || [])
        .filter((t: any) => !['shadow', 'unknown'].includes(t.name))
        .map((t: any) => ({
          name: t.name,
          value: t.name,
        }));
    });
  }

  private loadGroups(): void {
    this.http.get<any>('https://pokeapi.co/api/v2/egg-group').subscribe((res) => {
      this.groupOptions = (res.results || []).map((g: any) => ({
        name: g.name,
        value: g.name,
      }));
    });
  }

  // ---- Helpers ----
  get f() {
    return this.filterForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }
    console.log(this.filterForm.value);
    this.search.emit(this.filterForm.value);
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
