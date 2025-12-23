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

type LoginForm = {
  email: FormControl<string>;
  password: FormControl<string>;
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
    private router = inject(Router);

  loginForm: FormGroup<LoginForm>;

  authService = inject(AuthService);

  showPassword = false;
  submitError: string | null = null;
  isSubmitting = false;

  constructor(private fb: FormBuilder) {
    this.loginForm = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
  }

  get email() {
    return this.loginForm.controls.email;
  }

  get password() {
    return this.loginForm.controls.password;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;

    // getRawValue keeps the strong typing of LoginForm
    const payload = this.loginForm.getRawValue();

    this.authService.login(payload).subscribe({
      next: (res) => {
        this.isSubmitting = false;
        console.log('Login success', res);
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isSubmitting = false;
        console.error(err);
        this.submitError = 'Login failed. Please check your details.';
      },
    });
  }
}
