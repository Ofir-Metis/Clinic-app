import { AllExceptionsFilter } from './http-exception.filter';
import { HttpException, ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  it('formats response', () => {
    const filter = new AllExceptionsFilter();
    const status = jest.fn().mockReturnThis();
    const json = jest.fn();
    const host = {
      switchToHttp: () => ({
        getResponse: () => ({ status, json }),
        getRequest: () => ({ url: '/path' }),
      }),
    } as unknown as ArgumentsHost;

    filter.catch(new HttpException('error', 400), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({ statusCode: 400, path: '/path', message: 'error' });
  });
});
