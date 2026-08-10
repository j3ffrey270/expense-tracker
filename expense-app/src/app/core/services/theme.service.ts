import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly DARK_MODE_KEY = 'dark_mode_enabled';
  private darkModeSubject = new BehaviorSubject<boolean>(false);
  public darkMode$: Observable<boolean> = this.darkModeSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.initTheme();
  }

  private async initTheme(): Promise<void> {
    const saved = await this.storageService.get<boolean>(this.DARK_MODE_KEY);
    let isDark = false;
    if (saved !== null && saved !== undefined) {
      isDark = saved;
    } else {
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    this.setDarkMode(isDark);
  }

  async toggleDarkMode(): Promise<boolean> {
    const newStatus = !this.darkModeSubject.value;
    await this.setDarkMode(newStatus);
    return newStatus;
  }

  async setDarkMode(isDark: boolean): Promise<void> {
    this.darkModeSubject.next(isDark);
    await this.storageService.set(this.DARK_MODE_KEY, isDark);
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.add('ion-palette-dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.remove('ion-palette-dark');
    }
  }

  isDarkMode(): boolean {
    return this.darkModeSubject.value;
  }
}
