import { FirebaseProductRepository } from './firebase/FirebaseProductRepository';
import { FirebaseOrderRepository } from './firebase/FirebaseOrderRepository';
import { FirebaseCalculatorRepository } from './firebase/FirebaseCalculatorRepository';
import { FirebaseStorageService } from './firebase/FirebaseStorageService';
import { FirebaseAuthService } from './firebase/FirebaseAuthService';
import { FirebaseSettingsRepository } from './firebase/FirebaseSettingsRepository';

// Dependency Injection Hub
export const ProductRepository = new FirebaseProductRepository();
export const OrderRepository = new FirebaseOrderRepository();
export const CalculatorRepository = new FirebaseCalculatorRepository();
export const StorageService = new FirebaseStorageService();
export const AuthService = new FirebaseAuthService();
export const SettingsRepository = new FirebaseSettingsRepository();
