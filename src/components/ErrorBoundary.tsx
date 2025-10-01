import React, { ErrorInfo, ReactNode } from 'react';
import { Result, Button } from 'antd';
import { FrownOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', errorInfo.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          height: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '20px'
        }}>
          <Result
            status="500"
            icon={<FrownOutlined style={{ color: '#ff4d4f' }} />}
            title="Something went wrong"
            subTitle={
              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <p>
                  We encountered an unexpected error. This could be due to a temporary issue 
                  with the application.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div style={{ 
                    textAlign: 'left', 
                    marginTop: 16,
                    padding: 12,
                    background: '#f5f5f5',
                    borderRadius: 4,
                    fontSize: 12,
                    fontFamily: 'monospace'
                  }}>
                    <strong>Error:</strong> {this.state.error.message}<br/>
                    <strong>Stack:</strong> {this.state.error.stack}
                  </div>
                )}
              </div>
            }
            extra={[
              <Button key="retry" type="primary" onClick={this.handleReset}>
                Try Again
              </Button>,
              <Button key="reload" onClick={this.handleReload}>
                Reload Page
              </Button>
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;