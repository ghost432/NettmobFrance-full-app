import React, { useState } from 'react';
import './revolut-section.css';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const RevolutPartnerSection = ({ dismissible, variant }) => {
    const location = useLocation();
    const isDashboardByUrl = location.pathname.includes('dashboard') ||
                           location.pathname.includes('/client/') ||
                           location.pathname.includes('/automob/');
    
    const isDashboard = variant === 'dashboard' || isDashboardByUrl;
    const isSectionDismissible = dismissible !== undefined ? dismissible : isDashboard;

    const [isDismissed, setIsDismissed] = useState(() => {
        return localStorage.getItem('revolut-banner-dismissed') === 'true';
    });

    if (isDismissed && isSectionDismissible) return null;

    const handleDismiss = () => {
        setIsDismissed(true);
        localStorage.setItem('revolut-banner-dismissed', 'true');
    };

    const nettmobLogo = '/revolut/nettmob-logo.png';
    const revolutLogo = '/revolut/revolut-logo.png';
    const revolutCard = '/revolut/revolut-card-mockup.png';

    return (
        <section className={`revolut-partnership ${isDashboard ? 'dashboard-variant' : ''}`}>
            <div className="bg-glow"></div>
            {isSectionDismissible && (
                <button 
                    onClick={handleDismiss}
                    className="rev-close-btn"
                    aria-label="Fermer"
                >
                    <X size={20} />
                </button>
            )}

            <div className="partnership-container">
                <div className="partnership-content">
                    <div className="partner-tag">Partenaire</div>
                    <div className="logos-header">
                        <img src={nettmobLogo} alt="NettmobFrance Logo" className="nettmob-logo-rev" />
                        <div className="logo-divider"></div>
                        <img src={revolutLogo} alt="Revolut Business Logo" className="revolut-logo-rev" />
                    </div>

                    <h1 className="partnership-title">
                        Accélérez votre <br /><span>Business</span> avec Revolut Business
                    </h1>

                    <p className="partnership-description">
                        Rejoignez les milliers d'entreprises qui gèrent leurs finances avec Revolut Business. Une solution bancaire tout-en-un simple d'utilisation.
                    </p>

                    <div className="benefits-section">
                        <div className="benefits-list">
                            <div className="benefit-card">
                                <div className="benefit-text">
                                    <strong>Ouvrez votre compte pro rapidement et sans paperasse</strong>
                                </div>
                            </div>
                            <div className="benefit-card">
                                <div className="benefit-text">
                                    <strong>Faites des économies massives à l'international</strong>
                                </div>
                            </div>
                            <div className="benefit-card">
                                <div className="benefit-text">
                                    <strong>Déléguez les dépenses sans jamais perdre le contrôle</strong>
                                </div>
                            </div>
                            <div className="benefit-card">
                                <div className="benefit-text">
                                    <strong>Faites fructifier votre trésorerie</strong>
                                </div>
                            </div>
                            <div className="benefit-card">
                                <div className="benefit-text">
                                    <strong>Automatisez votre comptabilité</strong>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cta-container">
                        <a
                            href="https://revolutbusiness.ngih.net/c/7076720/3791796/9943"
                            className="cta-button-rev"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Ouvrir mon compte Revolut Business
                        </a>
                    </div>
                </div>

                <div className="partnership-visual">
                    <img src={revolutCard} alt="Revolut Business Card" className="card-mockup" />
                </div>
            </div>
        </section>
    );
};

export default RevolutPartnerSection;
