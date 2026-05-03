import { useLanguage } from '../context/LanguageContext';

export default function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="language-selector" style={{ position: 'fixed', top: '15px', right: '20px', zIndex: 1000, display: 'flex', gap: '8px' }}>
      <button 
        onClick={() => changeLanguage('fr')} 
        style={{ 
          background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', 
          opacity: language === 'fr' ? 1 : 0.4, transition: '0.2s', filter: language === 'fr' ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' : 'none'
        }}
        title="Français"
      >
        🇫🇷
      </button>
      <button 
        onClick={() => changeLanguage('mg')} 
        style={{ 
          background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.5rem', 
          opacity: language === 'mg' ? 1 : 0.4, transition: '0.2s', filter: language === 'mg' ? 'drop-shadow(0px 2px 4px rgba(0,0,0,0.3))' : 'none'
        }}
        title="Malagasy"
      >
        🇲🇬
      </button>
    </div>
  );
}
