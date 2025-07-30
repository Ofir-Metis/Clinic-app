import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import '@testing-library/jest-dom';
import { theme } from '../theme';
import PageAppBar from './PageAppBar';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

const renderWithTheme = (direction: 'ltr' | 'rtl') =>
  render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <PageAppBar date={new Date('2023-11-05T00:00:00Z')} avatarUrls={['a.png']} />
      </ThemeProvider>
    </I18nextProvider>,
  );

describe('PageAppBar', () => {
  it('renders month and year title', () => {
    renderWithTheme('ltr');
    expect(screen.getByText(/November 2023/i)).toBeInTheDocument();
  });

  it('respects RTL direction', () => {
    const { container } = renderWithTheme('rtl');
    const toolbar = container.querySelector('.MuiToolbar-root');
    expect(toolbar).toHaveStyle('flex-direction: row-reverse');
  });
});
