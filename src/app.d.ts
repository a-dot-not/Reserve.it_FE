// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string;
        isAuthenticated: boolean;
        profilePictureUrl: string;
      } | null;
    }
    interface Platform {
      env: {
        COUNTER: DurableObjectNamespace;
      };
      context: {
        waitUntil(promise: Promise<any>): void;
      };
      caches: CacheStorage & { default: Cache };
    }
    //interface PageData {}
    //interface Platform {}
  }
}

export {};
