import { useTranslation } from 'react-i18next';
import Button from '@mui/material/Button';
import AIHelper from './AIHelper';

function App() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('welcome')}</h1>
      <Button variant="contained" color="primary">
        {t('clickMe')}
      </Button>
      <AIHelper />
    </div>
  );
}

export default App;
