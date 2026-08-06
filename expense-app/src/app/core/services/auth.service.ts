import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { User, AuthResponse } from '../models/user.model';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USERS_KEY = 'registered_users';
  private readonly ACTIVE_USER_KEY = 'active_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private storageService: StorageService) {
    this.loadActiveUser();
  }

  private async loadActiveUser(): Promise<void> {
    const user = await this.storageService.get<User>(this.ACTIVE_USER_KEY);
    if (user) {
      this.currentUserSubject.next(user);
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const users = (await this.storageService.get<User[]>(this.USERS_KEY)) || [];
    const normalizedEmail = email.trim().toLowerCase();
    const matchedUser = users.find(
      (u) => u.email.toLowerCase() === normalizedEmail && u.password === password
    );

    if (!matchedUser) {
      return {
        success: false,
        message: 'Invalid email or password.'
      };
    }

    const { password: _, ...safeUser } = matchedUser;
    await this.storageService.set(this.ACTIVE_USER_KEY, safeUser);
    this.currentUserSubject.next(safeUser);

    return {
      success: true,
      message: 'Login successful.',
      user: safeUser
    };
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const users = (await this.storageService.get<User[]>(this.USERS_KEY)) || [];
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (existingUser) {
      return {
        success: false,
        message: 'An account with this email already exists.'
      };
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password: password,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    await this.storageService.set(this.USERS_KEY, users);

    const { password: _, ...safeUser } = newUser;
    await this.storageService.set(this.ACTIVE_USER_KEY, safeUser);
    this.currentUserSubject.next(safeUser);

    return {
      success: true,
      message: 'Account created successfully.',
      user: safeUser
    };
  }

  async logout(): Promise<void> {
    await this.storageService.remove(this.ACTIVE_USER_KEY);
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async isAuthenticated(): Promise<boolean> {
    const activeUser = await this.storageService.get<User>(this.ACTIVE_USER_KEY);
    return !!activeUser;
  }
}
