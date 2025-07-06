import { LoggingInterceptor } from './logging.interceptor';
import { ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';

describe('LoggingInterceptor', () => {
  it('logs and passes through', (done) => {
    const interceptor = new LoggingInterceptor();
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ method: 'GET', url: '/test' }) }),
    } as unknown as ExecutionContext;
    const handle = { handle: () => of('ok') };
    jest.spyOn(console, 'log').mockImplementation(() => {});
    interceptor.intercept(ctx, handle).subscribe((res) => {
      expect(res).toBe('ok');
      expect(console.log).toHaveBeenCalled();
      (console.log as jest.Mock).mockRestore();
      done();
    });
  });
});
