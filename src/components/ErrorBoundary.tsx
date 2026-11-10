import React, { Component, ErrorInfo, ReactNode } from 'react';
import Card from './Card';
import Button from './Button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error inside React Tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100vw',
          padding: '2rem',
          background: 'var(--bg-color)'
        }}>
          <Card style={{ maxWidth: '480px', textAlign: 'center', padding: '2.5rem' }}>
            <div style={{ display: 'inline-flex', padding: '1rem', borderRadius: '50%', background: 'var(--danger-bg)', color: 'var(--danger)', marginBottom: '1.5rem' }}>
              <AlertCircle size={36} />
            </div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Algo salió mal</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Ocurrió un error inesperado al renderizar esta pantalla. Por favor, intenta recargar la aplicación.
            </p>
            {this.state.error && (
              <pre style={{
                textAlign: 'left',
                background: 'rgba(0,0,0,0.3)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--danger)',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                maxHeight: '150px'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <Button onClick={this.handleReload} style={{ width: '100%' }}>
              Recargar Aplicación
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
