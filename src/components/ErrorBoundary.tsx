import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary Caught Exception]:", {
      error,
      errorMessage: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    (this as any).setState({ error, errorInfo });
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || "An unexpected application error occurred.";
      const errStack = this.state.error?.stack || this.state.errorInfo?.componentStack || "";

      return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans text-zinc-900 dark:text-zinc-100">
          <div className="max-w-lg w-full bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-700/80 flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-8 h-8 shrink-0" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
                Application Load Error
              </h1>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                The portal encountered a runtime error. Details are provided below for troubleshooting.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-left space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                Error Message
              </p>
              <p className="text-xs font-mono text-rose-900 dark:text-rose-200 break-words font-semibold">
                {errMsg}
              </p>
              {errStack && (
                <details className="mt-2 text-[11px] text-zinc-600 dark:text-zinc-400 font-mono">
                  <summary className="cursor-pointer font-bold hover:underline">View Technical Stack Trace</summary>
                  <pre className="mt-2 p-2 rounded-lg bg-zinc-900 text-zinc-200 text-[10px] overflow-x-auto whitespace-pre-wrap max-h-48 leading-relaxed">
                    {errStack}
                  </pre>
                </details>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 px-5 rounded-2xl bg-[#01411C] hover:bg-emerald-900 text-white font-bold text-xs shadow-lg flex items-center justify-center space-x-2 transition active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Loading Portal</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
