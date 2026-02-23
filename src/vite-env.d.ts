/// <reference types="vite/client" />

interface Document {
  hasStorageAccess(): Promise<boolean>
  requestStorageAccess(): Promise<void>
  requestStorageAccessFor?(origin: string): Promise<void>
}
