import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private storageInstance: Storage | null = null;

  constructor(private storage: Storage) {
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    const storage = await this.storage.create();
    this.storageInstance = storage;
  }

  private async ensureInitialized(): Promise<Storage> {
    if (!this.storageInstance) {
      this.storageInstance = await this.storage.create();
    }
    return this.storageInstance;
  }

  async set(key: string, value: unknown): Promise<void> {
    const store = await this.ensureInitialized();
    await store.set(key, value);
  }

  async get<T>(key: string): Promise<T | null> {
    const store = await this.ensureInitialized();
    const data = await store.get(key);
    return (data as T) ?? null;
  }

  async remove(key: string): Promise<void> {
    const store = await this.ensureInitialized();
    await store.remove(key);
  }

  async clear(): Promise<void> {
    const store = await this.ensureInitialized();
    await store.clear();
  }
}
