import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../../i18n/config';

interface LanguageSwitcherProps {
  size?: 'small' | 'medium';
  variant?: 'standard' | 'outlined' | 'filled';
}

export default function LanguageSwitcher({ size = 'small', variant = 'outlined' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
  };

  return (
    <FormControl size={size} variant={variant} sx={{ minWidth: 140 }}>
      <InputLabel id="language-select-label">{t('menu.language')}</InputLabel>
      <Select
        labelId="language-select-label"
        label={t('menu.language')}
        value={i18n.language}
        onChange={(e) => handleLanguageChange(e.target.value as string)}
      >
        {LANGUAGES.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            {lang.nativeName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
