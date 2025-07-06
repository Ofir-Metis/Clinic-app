import { createAppTheme } from './theme';

describe('createAppTheme', () => {
  it('defaults to ltr direction', () => {
    const theme = createAppTheme();
    expect(theme.direction).toBe('ltr');
  });

  it('uses provided direction', () => {
    const theme = createAppTheme('rtl');
    expect(theme.direction).toBe('rtl');
  });
});
