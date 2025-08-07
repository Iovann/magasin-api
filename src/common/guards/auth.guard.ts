import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean {
    const request = context.switchToHttp().getRequest();
    // For now, we'll just attach a mock user to the request
    // In a real app, you'd validate a JWT and get the user from it
    request.user = {
      id: 'mock-user-id',
      roles: ['super-admin'] // or 'magasinier', 'vendeur' to test different roles
    };
    return true;
  }
}
