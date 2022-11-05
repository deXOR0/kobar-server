import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ProblemsGuard implements CanActivate {
    API_SECRET_KEY = process.env.API_SECRET_KEY;

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();

        return request.body.secretKey === this.API_SECRET_KEY;
    }
}
