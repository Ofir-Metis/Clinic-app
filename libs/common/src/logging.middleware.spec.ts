import { LoggingMiddleware } from './logging.middleware';
import { EventEmitter } from 'events';

describe('LoggingMiddleware', () => {
  it('logs on finish event', () => {
    const middleware = new LoggingMiddleware();
    const req = { method: 'GET', originalUrl: '/t' } as any;
    const res = new EventEmitter() as any;
    res.statusCode = 200;
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const next = jest.fn();
    middleware.use(req, res, next);
    res.emit('finish');
    expect(next).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalled();
    (console.log as jest.Mock).mockRestore();
  });
});
