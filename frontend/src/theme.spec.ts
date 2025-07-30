import { theme } from './theme';

describe('theme', () => {
  it('returns a theme object', () => {
    expect(theme).toHaveProperty('palette');
    expect(theme).toHaveProperty('typography');
  });
});
