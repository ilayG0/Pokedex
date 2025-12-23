// services/auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  map,
  tap,
  of,
  catchError,
  firstValueFrom,
} from 'rxjs';
import { environment } from '../../environments/environment.dev';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  email: string;
  username: string;
  password: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}

interface AuthResponse {
  token: string;
}

interface MeResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly baseUrl = environment.SERVER_URL+ '/auth';
  private readonly TOKEN_KEY = 'access_token';

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // לא עושים פה HTTP – רק נשתמש ב-initAuth למטה
  }

  /** נקרא פעם אחת בהעלאת האפליקציה */
  async initAuth(): Promise<void> {
    const token = this.getAccessToken();
    if (!token) return;

    const payload = this.decodeToken(token);
    if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
      this.logout();
      return;
    }

    // יש טוקן שנראה תקין → נוודא אותו מול השרת ונביא את המשתמש
    await firstValueFrom(
      this.http.get<MeResponse>(`${this.baseUrl}/me`).pipe(
        tap((res) => {
          const user: AuthUser = {
            id: res.user.id,
            email: res.user.email,
            username: res.user.name,
          };
          this.currentUserSubject.next(user);
        }),
        catchError((err) => {
          // אם הטוקן כבר לא תקף / 401 – מנקים
          console.error('initAuth /me error', err);
          this.logout();
          return of(null);
        })
      )
    );
  }

  // ---------- PUBLIC API ----------

  login(data: LoginPayload): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, data).pipe(
      tap((res) => this.handleAuthSuccess(res.token)),
      // אחרי login אפשר לקרוא /me אם אתה רוצה, אבל כרגע אנחנו מסתמכים על ה-JWT
      map(() => this.currentUserSubject.value as AuthUser)
    );
  }

  signup(data: SignupPayload): Observable<AuthUser> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/signup`, data).pipe(
      tap((res) => this.handleAuthSuccess(res.token)),
      map(() => this.currentUserSubject.value as AuthUser)
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    const payload = this.decodeToken(token);
    if (!payload?.exp) return true;

    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowSeconds;
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  // ---------- INTERNAL ----------

  private handleAuthSuccess(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);

    const payload = this.decodeToken(token);
    if (payload) {
      const user: AuthUser = {
        id: payload.sub,
        email: payload.email,
        username: payload.name,
      };
      this.currentUserSubject.next(user);
    } else {
      this.currentUserSubject.next(null);
    }
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      const [, payloadBase64] = token.split('.');
      if (!payloadBase64) return null;

      const payloadJson = atob(
        payloadBase64.replace(/-/g, '+').replace(/_/g, '/')
      );
      return JSON.parse(payloadJson);
    } catch {
      return null;
    }
  }
}
