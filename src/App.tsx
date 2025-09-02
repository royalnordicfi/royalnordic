import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Tours from './components/Tours';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import NorthernLightsTour from './components/NorthernLightsTour';
import SnowshoeRental from './components/SnowshoeRental';
import CustomizedTour from './components/CustomizedTour';
import PaymentSuccess from './components/PaymentSuccess';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsConditions from './components/TermsConditions';
import ScrollToTop from './components/ScrollToTop';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{backgroundColor: 'black', minHeight: '100vh', color: 'white', padding: '20px', textAlign: 'center'}}>
          <h1>🚨 Something went wrong</h1>
          <p>Error: {this.state.error?.message}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{padding: '10px 20px', backgroundColor: 'white', color: 'black', border: 'none', borderRadius: '5px'}}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  console.log('App component rendering...'); // Debug log
  
  return (
    <ErrorBoundary>
      <Router>
        <ScrollToTop />
        <div className="App bg-black min-h-screen">
          {/* Debug element */}
          <div style={{color: 'white', padding: '20px', textAlign: 'center', backgroundColor: 'red'}}>
            🚀 APP IS LOADING - If you see this, React is working!
          </div>
          
          <ErrorBoundary>
            <Header />
          </ErrorBoundary>
          
          <Routes>
            <Route path="/" element={
              <>
                <ErrorBoundary><Hero /></ErrorBoundary>
                <ErrorBoundary><Tours /></ErrorBoundary>
                <ErrorBoundary><About /></ErrorBoundary>
                <ErrorBoundary><Contact /></ErrorBoundary>
              </>
            } />
            <Route path="/northern-lights-tour" element={<ErrorBoundary><NorthernLightsTour /></ErrorBoundary>} />
            <Route path="/snowshoe-rental" element={<ErrorBoundary><SnowshoeRental /></ErrorBoundary>} />
            <Route path="/customized-tour" element={<ErrorBoundary><CustomizedTour /></ErrorBoundary>} />
            <Route path="/payment-success" element={<ErrorBoundary><PaymentSuccess /></ErrorBoundary>} />
            <Route path="/privacy-policy" element={<ErrorBoundary><PrivacyPolicy /></ErrorBoundary>} />
            <Route path="/terms-conditions" element={<ErrorBoundary><TermsConditions /></ErrorBoundary>} />
          </Routes>
          
          <ErrorBoundary>
            <Footer />
          </ErrorBoundary>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;