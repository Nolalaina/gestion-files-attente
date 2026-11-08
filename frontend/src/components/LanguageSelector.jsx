import { useLanguage } from "../context/LanguageContext";

const LANGUAGES = [
  { code: "fr", label: "FR", title: "Français" },
  { code: "mg", label: "MG", title: "Malagasy" },
];

export default function LanguageSelector() {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className="lang-switch" role="group" aria-label="Langue">
      {LANGUAGES.map((item) => (
        <button
          key={item.code}
          type="button"
          className={`lang-btn ${language === item.code ? "active" : ""}`}
          onClick={() => changeLanguage(item.code)}
          aria-pressed={language === item.code}
          title={item.title}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
