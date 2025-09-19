import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Error is already captured in state, no need to log here
  }

  handleTryAgain = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface theme-transition p-6">
          <div className="max-w-md w-full text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-primary mb-2">
                Something went wrong
              </h1>
              <p className="text-secondary mb-4">
                An unexpected error occurred while rendering this page.
              </p>
              {this.state.error && (
                <details className="text-left mb-4">
                  <summary className="cursor-pointer text-sm text-tertiary hover:text-secondary">
                    Error Details
                  </summary>
                  <div className="mt-2 p-3 bg-surface-secondary rounded border-l-4 border-red-500">
                    <code className="text-xs text-primary break-all">
                      {this.state.error.message}
                    </code>
                  </div>
                </details>
              )}
            </div>
            <button
              onClick={this.handleTryAgain}
              className="px-6 py-3 bg-royal-600 hover:bg-royal-700 text-white rounded-lg font-medium transition-colors theme-transition"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
