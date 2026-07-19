import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Hero from './components/Hero';
import Plans from './components/Plans';
import Installation from './components/Installation';
import Services from './components/Services';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Copertura from './pages/Copertura';
import Login from './pages/Login';
import Admin from './pages/Admin';

function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Plans />
        <Installation />
        <Services />
        <Contact />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/copertura" element={<Copertura />} />
          <Route path="/login" element={<Login />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
