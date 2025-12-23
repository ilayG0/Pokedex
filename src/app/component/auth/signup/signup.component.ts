import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

type SignupForm = {
  email: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  private router = inject(Router);

  signupForm: FormGroup<SignupForm>;

  authService = inject(AuthService);

  showPassword = false;
  submitError: string | null = null;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.signupForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          // at least one letter and one digit
          Validators.pattern(
            /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/
          ),
        ],
      ],
    });
  }

  // Typed getters for template
  get email() {
    return this.signupForm.controls.email;
  }

  get username() {
    return this.signupForm.controls.username;
  }

  get password() {
    return this.signupForm.controls.password;
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;

    const payload = this.signupForm.getRawValue();
    console.log(payload);
    this.authService.signup(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        console.log('Signup success', res);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        this.submitError = 'Signup failed. Please try again.';
      },
    });
  }
}
