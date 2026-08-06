import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

export interface CurrencyRatesResponse {
  base: string;
  date: string;
  rates: { [key: string]: number };
}

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private readonly API_URL = 'https://open.er-api.com/v6/latest/USD';

  constructor(private http: HttpClient) {}

  getExchangeRates(): Observable<CurrencyRatesResponse> {
    return this.http.get<CurrencyRatesResponse>(this.API_URL).pipe(
      catchError(() => {
        return of({
          base: 'USD',
          date: new Date().toISOString().split('T')[0],
          rates: {
            USD: 1.0,
            EUR: 0.92,
            GBP: 0.78,
            INR: 83.5,
            CAD: 1.36
          }
        });
      })
    );
  }
}
