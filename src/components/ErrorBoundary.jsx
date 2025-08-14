import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // eslint-disable-next-line no-console
    console.error('Runtime error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || String(this.state.error);
      const stack = this.state.error?.stack || '';
      const componentStack = this.state.errorInfo?.componentStack || '';
      return (
        <div className="fixed inset-0 bg-black text-white flex items-center justify-center p-6">
          <div className="max-w-3xl w-full">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-sm text-gray-300 mb-4">An unexpected error occurred. Try reloading the page. If this persists, please share the console error with us.</p>
            <div className="space-y-3 text-xs">
              <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                <div className="font-bold mb-1">Error</div>
                <pre className="whitespace-pre-wrap break-words">{message}</pre>
              </div>
              {stack && (
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <div className="font-bold mb-1">Stack</div>
                  <pre className="overflow-auto max-h-40 whitespace-pre-wrap break-words">{stack}</pre>
                </div>
              )}
              {componentStack && (
                <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                  <div className="font-bold mb-1">Component stack</div>
                  <pre className="overflow-auto max-h-40 whitespace-pre-wrap break-words">{componentStack}</pre>
                </div>
              )}
            </div>
            <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[#80142C] hover:bg-[#4a0c1a] rounded-lg">Reload</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
