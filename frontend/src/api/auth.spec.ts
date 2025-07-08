import axios from 'axios';
import { login } from './auth';
import { v4 as uuidv4 } from 'uuid';

jest.mock('axios');
jest.mock('uuid');

describe('login', () => {
  it('logs trace id and sends header', async () => {
    (uuidv4 as jest.Mock).mockReturnValue('trace-123');
    const postMock = jest.fn().mockResolvedValue({ data: { access_token: 't' } });
    (axios.create as jest.Mock).mockReturnValue({ post: postMock });
    const infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});

    const result = await login('e@example.com', 'pw');

    expect(postMock).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'e@example.com', password: 'pw' },
      { headers: { 'X-Trace-Id': 'trace-123' } },
    );
    expect(infoSpy).toHaveBeenCalledWith({
      traceId: 'trace-123',
      action: 'login',
      payload: { email: 'e@example.com', password: 'pw' },
    });
    expect(result).toEqual({ access_token: 't' });

    infoSpy.mockRestore();
  });
});

