import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { LANGUAGES } from '../../../i18n/config';

interface LanguageSwitcherProps {
  size?: 'small' | 'medium';
  variant?: 'standard' | 'outlined' | 'filled';
}

export default function LanguageSwitcher({ size = 'small', variant = 'outlined' }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

  // Update currentLanguage when i18n language changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng);
    };

    // Set initial language
    setCurrentLanguage(i18n.language || i18n.resolvedLanguage || 'en');

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChanged);

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  const handleLanguageChange = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage);
  };

  // Ensure the current language exists in LANGUAGES array
  const validLanguage = LANGUAGES.find(lang => lang.code === currentLanguage)
    ? currentLanguage
    : 'en';

  return (
    <FormControl size={size} variant={variant} sx={{ width: '100%' }}>
      <InputLabel id="language-select-label">{t('menu.language')}</InputLabel>
      <Select
        labelId="language-select-label"
        label={t('menu.language')}
        value={validLanguage}
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
