import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught component error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-canvas p-6 text-brand-dark">
          <div className="max-w-md w-full p-8 bg-white border-2 border-brand-sage/60 rounded-[24px] shadow-soft text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-alert-muted/15 border border-alert-muted/30 flex items-center justify-center mx-auto text-[#8F443B]">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-section-lg font-extrabold text-brand-dark">
                Something went wrong
              </h2>
              <p className="text-meta-md text-[#555B55]">
                {this.state.error?.message || 'An unexpected rendering error occurred.'}
              </p>
            </div>

            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-brand-dark text-white font-bold text-body-md hover:bg-[#1C2822] transition-all cursor-pointer shadow-soft w-full"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
