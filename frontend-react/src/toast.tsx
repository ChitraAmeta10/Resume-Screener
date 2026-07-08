import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface ToastState {
  msg: string;
  err: boolean;
  show: boolean;
}

const ToastCtx = createContext<(msg: string, err?: boolean) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ToastState>({ msg: "", err: false, show: false });
  const timer = useRef<number | undefined>(undefined);

  const toast = useCallback((msg: string, err = false) => {
    setState({ msg, err, show: true });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState((s) => ({ ...s, show: false })), 2600);
  }, []);

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <div className={"toast" + (state.show ? " show" : "") + (state.err ? " err" : "")}>
        {state.msg}
      </div>
    </ToastCtx.Provider>
  );
}
