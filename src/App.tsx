import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Tours from './components/Tours';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';

function App() {
  console.log('App component rendering...'); // Debug log
  
  return (
    <Router>
      <div className="App bg-black min-h-screen">
        <Header />
        <Hero />
        
        {/* Add back more components */}
        <Tours />
        <About />
        <Contact />
        <Footer />
      </div>
    </Router>
  );
}

export default App;