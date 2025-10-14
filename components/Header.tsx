import React from 'react';
import { Icons } from './Icons';
import { useLocalization } from '../contexts/LocalizationContext';

const Header: React.FC = () => {
  const { language, setLanguage, t } = useLocalization();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  return (
    <header className="bg-sky-700 text-white shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <Icons.activity className="h-8 w-8 text-sky-300" />
                <span className="font-bold text-xl">{t('appTitle')}</span>
            </div>
          </div>
          <button 
            onClick={toggleLanguage} 
            className="text-sm font-medium px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 transition-colors"
            aria-label={`Switch to ${language === 'en' ? 'Arabic' : 'English'}`}
          >
            {language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
