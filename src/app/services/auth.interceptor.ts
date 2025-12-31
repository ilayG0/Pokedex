import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import {environment} from "../../environments/environment.dev";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getAccessToken();

  if (!token) {
    return next(req);
  }

  const isApiRequest =
    req.url.startsWith('/api/') ||
    req.url.startsWith(environment.SERVER_URL);

  if (!isApiRequest) {
    return next(req);
  }

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });

  return next(authReq);
};
