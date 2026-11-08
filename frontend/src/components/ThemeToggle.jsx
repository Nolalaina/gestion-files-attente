import useTheme from "../hooks/useTheme";
import Icon from "./Icon";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      className="btn btn-secondary btn-icon"
      onClick={toggleTheme}
      title={`Passer en mode ${theme === "light" ? "sombre" : "clair"}`}
      aria-label={`Passer en mode ${theme === "light" ? "sombre" : "clair"}`}
    >
      <Icon name={theme === "light" ? "moon" : "sun"} size={18} />
    </button>
  );
}
