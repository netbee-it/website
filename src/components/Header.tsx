import { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';
import NetBeeLogo from './NetBeeLogo';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <header className={`header${scrolled ? ' scrolled' : ''}`}>
        <div className="container">
          <div className="header-inner">
            <a href="#" className="logo-link" onClick={closeMenu} aria-label="NetBee – Home">
              <NetBeeLogo height={52} variant="dark" />
            </a>

            <nav className="nav">
              <a href="#internet">Internet</a>
              <a href="#installazione">Installazione FWA</a>
              <a href="#servizi">Servizi</a>
              <a href="#contatti">Contatti</a>
            </nav>

            <div className="header-actions">
              <a href="tel:+390141174 5884" className="header-phone">
                <Phone size={15} />
                +39 0141 1745884
              </a>
              <a href="#contatti" className="btn btn-primary header-cta-desktop">
                Richiedi Info
              </a>
              <button
                className={`hamburger${menuOpen ? ' open' : ''}`}
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Menu"
              >
                <span />
                <span />
                <span />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <a href="#internet" onClick={closeMenu}>Internet</a>
        <a href="#installazione" onClick={closeMenu}>Installazione FWA</a>
        <a href="#servizi" onClick={closeMenu}>Servizi</a>
        <a href="#contatti" onClick={closeMenu}>Contatti</a>
        <a href="tel:+390141174 5884" className="mobile-menu-phone">
          <Phone size={16} />
          +39 0141 1745884
        </a>
      </div>
    </>
  );
}
