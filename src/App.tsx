import Header from './components/Header';
import Hero from './components/Hero';
import Plans from './components/Plans';
import Installation from './components/Installation';
import Services from './components/Services';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
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
