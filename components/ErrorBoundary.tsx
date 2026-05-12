import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4" dir="rtl">
          <div className="max-w-md w-full bg-white rounded-[2rem] p-8 shadow-xl text-center border border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-red-500"></div>
            
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle size={40} />
            </div>
            
            <h1 className="text-xl font-black text-slate-800 mb-2">عذراً، حدث خطأ غير متوقع</h1>
            <p className="text-sm font-bold text-slate-500 mb-8 leading-relaxed">
              لقد واجهنا مشكلة فنية أثناء تحميل هذه الشاشة. يرجى إعادة المحاولة أو التحقق من اتصالك بالإنترنت.
            </p>

            {this.state.error && process.env.NODE_ENV !== 'production' && (
              <div className="text-left bg-slate-100 p-4 rounded-xl text-[10px] font-mono text-slate-700 overflow-x-auto mb-6 text-slate-800 selection:bg-red-200" dir="ltr">
                {this.state.error.message}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="bg-red-500 hover:bg-red-600 text-white w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-red-500/25"
            >
              <RefreshCw size={18} />
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
