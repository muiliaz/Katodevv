import { createContext, useContext, useState } from "react";
import { en } from "./lang/en";
import { ru } from "./lang/ru";

// The language switch, and nothing else.
//
// The dictionaries used to live in this file, which made it 586 lines of copy
// wrapped around nine lines of React (tech-health TH-004). They are now one
// file per language under lang/, and T is assembled here so every existing
// `import { T } from "../shared/LangContext"` keeps working.
//
// A missing key is a runtime error, not a build error — lang.test.js compares
// the two trees key path by key path, because nothing else would notice.
export { TEAM } from "./lang/team";

export const LangContext = createContext();

export function useLang() {
  return useContext(LangContext);
}

export const T = { en, ru };

export function LangProvider({ children }) {
  const [lang, setLang] = useState("en");
  const t = T[lang];
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}
