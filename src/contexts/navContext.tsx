import { createContext, useContext, useRef, useState } from "react";

interface NavCtx {
  navVisible: boolean;
  setNavVisible: (v: boolean) => void;
  lastScrollYRef: React.MutableRefObject<number>;
}

const NavContext = createContext<NavCtx>({
  navVisible: true,
  setNavVisible: () => {},
  lastScrollYRef: { current: 0 },
});

export const NavProvider = ({ children }: { children: React.ReactNode }) => {
  const [navVisible, setNavVisible] = useState(true);
  const lastScrollYRef = useRef(0);
  return (
    <NavContext.Provider value={{ navVisible, setNavVisible, lastScrollYRef }}>
      {children}
    </NavContext.Provider>
  );
};

export const useNav = () => useContext(NavContext);
