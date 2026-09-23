import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Shield, ShieldAlert, ArrowRight, CheckCircle2, AlertTriangle, FileText, Lock,
  ChevronDown, ChevronUp, Phone, ExternalLink, HelpCircle, User,
  Smartphone, CreditCard, Clock, Eye, AlertCircle, Menu, X,
  ShieldCheck, UploadCloud, Bell, Check, Sparkles, Send,
  Globe, Info, HeartHandshake, FileCheck, Layers, ArrowUpRight
} from 'lucide-react';

export const LandingPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleReportClick = () => {
    if (isAuthenticated) {
      if (role === 'user' || role === 'citizen' || role === 'admin') {
        navigate('/citizen?tab=report');
      } else {
        navigate('/lea');
      }
    } else {
      navigate('/login?mode=report');
    }
  };

  const handleTrackClick = () => {
    if (isAuthenticated) {
      if (role === 'user' || role === 'citizen' || role === 'admin') {
        navigate('/citizen?tab=complaints');
      } else {
        navigate('/lea');
      }
    } else {
      navigate('/login?mode=track');
    }
  };

  const handleDashboardClick = () => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'lea') navigate('/lea');
    else navigate('/citizen');
  };

  const faqItems = [
    {
      q: 'What is TrackTheCash?',
      a: 'TrackTheCash is a citizen-focused cybercrime support platform designed to make it easier for people to report cybercrime incidents, securely upload supporting evidence, and track the progress of their complaints.'
    },
    {
      q: 'How do I report cybercrime?',
      a: 'Click "Report Cybercrime" on the navigation bar or hero section. After logging in or creating your secure account, complete the guided incident reporting form by providing the date, type of offense, financial details (if any), and description.'
    },
    {
      q: 'Can I track my complaint?',
      a: 'Yes. Once your complaint is submitted, you can log in to your Citizen Dashboard at any time to view its current status, review timeline milestones, and see if any updates or actions are pending.'
    },
    {
      q: 'Can I upload evidence?',
      a: 'Yes. You can upload relevant screenshots, transaction receipts, bank statements, email headers, or chat logs both during initial complaint submission and afterwards via your complaint dossier.'
    },
    {
      q: 'Can I add information after submitting a complaint?',
      a: 'Yes. If you discover new transaction numbers, additional chat messages, or if an investigator requests clarification, you can provide supplemental details and messages directly in your complaint view.'
    },
    {
      q: 'What should I do if I experience financial fraud?',
      a: 'Act immediately! First, call the National Cybercrime Helpline at 1930 to request an immediate lien on fraudulent transactions. Next, contact your bank or UPI service provider to block affected cards and freeze accounts. Then preserve all transaction IDs, SMS, and receipts before reporting.'
    },
    {
      q: 'Can I report suspicious websites or phone numbers?',
      a: 'Yes. TrackTheCash provides a dedicated "Report Suspicious Activity" feature where citizens can submit suspicious URLs, phishing SMS messages, fake social profiles, or fraudulent caller IDs to alert the community.'
    },
    {
      q: 'How do I update my profile?',
      a: 'Log into your Citizen Dashboard and navigate to the Profile & Security section. There you can update your contact email, phone number, and address to ensure you receive timely notifications.'
    },
    {
      q: 'What information should I keep as evidence?',
      a: 'Always preserve: Exact date and time of the incident, UTR / Transaction Reference Numbers, bank account and UPI identifiers, SMS alerts, call logs, full screenshots of fake websites or chat conversations, and receipts.'
    },
    {
      q: 'How do I contact support?',
      a: 'You can access help guides and citizen FAQs within the platform. For immediate emergency cyber fraud assistance, please dial the official national helpline 1930 or visit cybercrime.gov.in.'
    }
  ];

  const cybercrimeTypes = [
    { name: 'Financial Fraud', desc: 'Unauthorized bank withdrawals, fraudulent transfers, and fake loan applications.', icon: CreditCard },
    { name: 'ATM / Card Fraud', desc: 'Card skimming, cloning, unauthorized POS transactions, or ATM withdrawal issues.', icon: Smartphone },
    { name: 'OTP Fraud', desc: 'Social engineering calls, fake KYC updates, or deceptive OTP requests.', icon: Lock },
    { name: 'UPI / Payment Fraud', desc: 'Deceptive QR codes, fraudulent payment request links, and cashback traps.', icon: Sparkles },
    { name: 'Investment Scams', desc: 'Fake trading apps, bogus cryptocurrency platforms, and Ponzi schemes.', icon: FileText },
    { name: 'Online Shopping Fraud', desc: 'Fake e-commerce websites, non-delivery of purchased goods, and counterfeit stores.', icon: Globe },
    { name: 'Phishing', desc: 'Fraudulent emails, fake bank login pages, and deceptive SMS links.', icon: AlertCircle },
    { name: 'Social Media Fraud', desc: 'Profile impersonation, account takeover, harassment, or sextortion attempts.', icon: HeartHandshake },
    { name: 'Account Hacking', desc: 'Unauthorized access to personal emails, messaging apps, or cloud storage.', icon: ShieldAlert },
    { name: 'Identity Theft', desc: 'Misuse of Aadhaar, PAN, or personal documents to obtain illegal services.', icon: User },
    { name: 'Other Cybercrime', desc: 'Any other form of online harassment, digital threat, or extortion.', icon: AlertTriangle }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#080d1a',
      color: '#f1f5f9',
      fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
      overflowX: 'hidden'
    }}>
      {/* 1. PUBLIC NAVIGATION BAR */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(8, 13, 26, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0.85rem 1.5rem',
        transition: 'all 0.2s ease'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Brand */}
          <a href="#" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
            color: '#ffffff'
          }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
            }}>
              <Shield size={22} color="#ffffff" />
            </div>
            <div>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                color: '#ffffff'
              }}>
                TRACK<span style={{ color: '#38bdf8' }}>THE</span>CASH
              </span>
              <span style={{
                display: 'block',
                fontSize: '0.62rem',
                color: '#94a3b8',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                fontWeight: 600
              }}>
                Citizen Cybercrime Support
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav style={{
            display: 'none',
            alignItems: 'center',
            gap: '1.5rem',
            margin: '0 1rem'
          }} className="desktop-nav">
            <a href="#about" style={navLinkStyle}>Home</a>
            <a href="#how-it-works" style={navLinkStyle}>How It Works</a>
            <button onClick={handleReportClick} style={{ ...navLinkStyle, background: 'none', border: 'none', cursor: 'pointer' }}>
              Report Cybercrime
            </button>
            <button onClick={handleTrackClick} style={{ ...navLinkStyle, background: 'none', border: 'none', cursor: 'pointer' }}>
              Track Complaint
            </button>
            <a href="#cyber-safety" style={navLinkStyle}>Cyber Safety</a>
            <a href="#faq" style={navLinkStyle}>Help</a>
          </nav>

          {/* Right Action CTAs */}
          <div style={{ display: 'none', alignItems: 'center', gap: '0.75rem' }} className="desktop-cta">
            {isAuthenticated ? (
              <>
                <button
                  onClick={handleDashboardClick}
                  style={{
                    backgroundColor: 'rgba(56, 189, 248, 0.12)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <User size={15} /> Dashboard ({user?.username || 'Account'})
                </button>
                <button
                  onClick={logout}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid rgba(255,255,255,0.1)',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#cbd5e1',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '6px'
                  }}
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    transition: 'all 0.2s'
                  }}
                >
                  Create Account
                </button>
                <button
                  onClick={handleReportClick}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: '0.55rem 1.15rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'transform 0.15s ease'
                  }}
                >
                  Report Cybercrime <ArrowRight size={15} />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            style={{
              display: 'flex',
              background: 'none',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '8px',
              padding: '0.45rem',
              color: '#ffffff',
              cursor: 'pointer'
            }}
            className="mobile-hamburger"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu Dropdown Drawer */}
        {mobileMenuOpen && (
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '1.25rem 0',
            marginTop: '0.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            maxWidth: '1200px',
            margin: '0.75rem auto 0'
          }}>
            <a href="#about" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>Home</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>How It Works</a>
            <button
              onClick={() => { setMobileMenuOpen(false); handleReportClick(); }}
              style={{ ...mobileNavLinkStyle, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              Report Cybercrime
            </button>
            <button
              onClick={() => { setMobileMenuOpen(false); handleTrackClick(); }}
              style={{ ...mobileNavLinkStyle, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              Track Complaint
            </button>
            <a href="#cyber-safety" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>Cyber Safety</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} style={mobileNavLinkStyle}>Help & FAQ</a>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleDashboardClick(); }}
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Open Dashboard
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); logout(); }}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.06)',
                      color: '#cbd5e1',
                      padding: '0.65rem',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      color: '#ffffff',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); navigate('/register'); }}
                    style={{
                      backgroundColor: 'rgba(37, 99, 235, 0.15)',
                      color: '#38bdf8',
                      padding: '0.7rem',
                      borderRadius: '8px',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Create Account
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); handleReportClick(); }}
                    style={{
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Report Cybercrime Now
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section style={{
        padding: '4rem 1.5rem 3.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '3rem',
        alignItems: 'center'
      }}>
        <div>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: 'rgba(37, 99, 235, 0.14)',
            border: '1px solid rgba(56, 189, 248, 0.28)',
            padding: '0.35rem 0.85rem',
            borderRadius: '999px',
            color: '#38bdf8',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            marginBottom: '1.25rem'
          }}>
            <ShieldCheck size={16} /> Simple. Secure. Citizen-focused.
          </div>

          <h1 style={{
            fontSize: 'clamp(2.2rem, 4vw, 3.4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            color: '#ffffff',
            margin: '0 0 1.25rem 0',
            letterSpacing: '-0.02em'
          }}>
            Your First Step Against <span style={{
              background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>Cybercrime</span>
          </h1>

          <p style={{
            fontSize: '1.1rem',
            color: '#94a3b8',
            lineHeight: 1.6,
            margin: '0 0 2rem 0',
            maxWidth: '560px'
          }}>
            Report cybercrime, keep track of your complaint, submit supporting evidence, and stay informed throughout the complaint process.
          </p>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '2rem'
          }}>
            <button
              onClick={handleReportClick}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '0.85rem 1.75rem',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.6rem',
                transition: 'all 0.2s ease'
              }}
            >
              Report Cybercrime <ArrowRight size={18} />
            </button>

            <button
              onClick={handleTrackClick}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.16)',
                color: '#f1f5f9',
                padding: '0.85rem 1.5rem',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease'
              }}
            >
              <Eye size={18} color="#38bdf8" /> Track My Complaint
            </button>
          </div>

          {/* Citizen Confidence Metrics */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>24/7 Digital</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Online Complaint Filing</div>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>Helpline 1930</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Emergency Cyber Helpline</div>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10b981' }}>Encrypted</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Protected Citizen Data</div>
            </div>
          </div>
        </div>

        {/* 3. HERO VISUAL: CITIZEN JOURNEY PROGRESSION */}
        <div style={{
          backgroundColor: '#0f172a',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            paddingBottom: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981'
              }} />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Citizen Support Journey
              </span>
            </div>
            <span style={{
              fontSize: '0.72rem',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              padding: '0.2rem 0.6rem',
              borderRadius: '6px',
              fontWeight: 600
            }}>
              Transparent Workflow
            </span>
          </div>

          {/* Visual Step Nodes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={journeyNodeStyle}>
              <div style={{ ...journeyIconBox, backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#38bdf8' }}>
                <User size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>1. Citizen Incident</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Experiencing financial fraud, phishing, or unauthorized digital activity.</div>
              </div>
              <CheckCircle2 size={16} color="#10b981" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', height: '14px' }}>
              <div style={{ width: '2px', backgroundColor: 'rgba(56, 189, 248, 0.3)' }} />
            </div>

            <div style={journeyNodeStyle}>
              <div style={{ ...journeyIconBox, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                <FileText size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>2. Secure Online Report</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Submit structured incident details and upload transaction evidence.</div>
              </div>
              <CheckCircle2 size={16} color="#10b981" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', height: '14px' }}>
              <div style={{ width: '2px', backgroundColor: 'rgba(56, 189, 248, 0.3)' }} />
            </div>

            <div style={journeyNodeStyle}>
              <div style={{ ...journeyIconBox, backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                <Layers size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>3. Registered Complaint</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Receive your official complaint tracking ID and digital acknowledgment.</div>
              </div>
              <CheckCircle2 size={16} color="#10b981" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', height: '14px' }}>
              <div style={{ width: '2px', backgroundColor: 'rgba(56, 189, 248, 0.3)' }} />
            </div>

            <div style={journeyNodeStyle}>
              <div style={{ ...journeyIconBox, backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                <Bell size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>4. Ongoing Updates</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Follow review milestones and respond if additional information is needed.</div>
              </div>
              <Clock size={16} color="#38bdf8" />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', height: '14px' }}>
              <div style={{ width: '2px', backgroundColor: 'rgba(56, 189, 248, 0.3)' }} />
            </div>

            <div style={journeyNodeStyle}>
              <div style={{ ...journeyIconBox, backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                <ShieldCheck size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>5. Complaint Resolution</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Receive final status notifications and advisory closing documentation.</div>
              </div>
              <Sparkles size={16} color="#38bdf8" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. EMERGENCY CYBER FRAUD NOTICE */}
      <section style={{
        padding: '0 1.5rem 3rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '14px',
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              backgroundColor: 'rgba(239, 68, 68, 0.18)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              flexShrink: 0
            }}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fca5a5', margin: 0 }}>
                Experienced Financial Cyber Fraud? Act quickly.
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', margin: '0.25rem 0 0' }}>
                If you have experienced financial cyber fraud, contact the appropriate official cybercrime reporting/helpline channels as soon as possible and preserve your transaction details and evidence.
              </p>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            padding: '1rem',
            borderRadius: '10px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.25)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Phone size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  Immediate Financial Fraud Helpline
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                  Dial 1930
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ExternalLink size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                  National Cybercrime Reporting Portal
                </div>
                <a
                  href="https://cybercrime.gov.in"
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '0.95rem', fontWeight: 700, color: '#38bdf8', textDecoration: 'none' }}
                >
                  cybercrime.gov.in
                </a>
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            paddingTop: '0.5rem'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              For immediate financial cyber-fraud assistance, use the appropriate official reporting channels. TrackTheCash prototype provides streamlined incident filing and dossier management.
            </span>
            <button
              onClick={handleReportClick}
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: '0.55rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              Report Incident Now <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 5. WHAT IS TRACKTHECASH? */}
      <section id="about" style={{
        padding: '4rem 1.5rem',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#38bdf8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              Citizen Cybercrime Support
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0 1rem' }}>
              What is TrackTheCash?
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6 }}>
              TrackTheCash is a citizen-focused cybercrime support platform designed to make it easier for people to report cybercrime, provide supporting information, and follow the progress of their complaints.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={pillarCardStyle}>
              <div style={{ ...pillarIconBox, backgroundColor: 'rgba(37, 99, 235, 0.15)', color: '#3b82f6' }}>
                <FileText size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>Report</h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Submit structured information about a cybercrime incident easily without confusing legal jargon.
              </p>
            </div>

            <div style={pillarCardStyle}>
              <div style={{ ...pillarIconBox, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                <Eye size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>Track</h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Follow the live status of your complaint with clear milestone tracking and milestone indicators.
              </p>
            </div>

            <div style={pillarCardStyle}>
              <div style={{ ...pillarIconBox, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                <UploadCloud size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>Support</h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Provide additional information or upload supplementary evidence whenever requested.
              </p>
            </div>

            <div style={pillarCardStyle}>
              <div style={{ ...pillarIconBox, backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                <Bell size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>Stay Informed</h3>
              <p style={{ fontSize: '0.9rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Receive updates and notifications about your complaint so you are never left guessing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. HOW TRACKTHECASH WORKS */}
      <section id="how-it-works" style={{ padding: '4.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Simple 5-Step Process
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0 1rem' }}>
            How TrackTheCash Works
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Managing a cybercrime complaint should not be complicated. Follow this straightforward path to lodge and monitor your case.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1.5rem',
          position: 'relative'
        }}>
          {/* Step 1 */}
          <div style={stepCardStyle}>
            <div style={stepNumberBadge}>01</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: '1rem 0 0.5rem' }}>
              Create Your Account
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Create a secure account to manage your cybercrime complaints and preserve access.
            </p>
          </div>

          {/* Step 2 */}
          <div style={stepCardStyle}>
            <div style={stepNumberBadge}>02</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: '1rem 0 0.5rem' }}>
              Report
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Provide details about the incident and submit the information securely.
            </p>
          </div>

          {/* Step 3 */}
          <div style={stepCardStyle}>
            <div style={stepNumberBadge}>03</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: '1rem 0 0.5rem' }}>
              Add Evidence
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Upload relevant documents, screenshots, transaction records, or other supporting evidence.
            </p>
          </div>

          {/* Step 4 */}
          <div style={stepCardStyle}>
            <div style={stepNumberBadge}>04</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: '1rem 0 0.5rem' }}>
              Stay Updated
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Track complaint status and respond if additional information is requested.
            </p>
          </div>

          {/* Step 5 */}
          <div style={stepCardStyle}>
            <div style={stepNumberBadge}>05</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', margin: '1rem 0 0.5rem' }}>
              Follow the Outcome
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Receive updates as your complaint moves through the available workflow.
            </p>
          </div>
        </div>

        {/* Step Flow Ribbon */}
        <div style={{
          marginTop: '2.5rem',
          backgroundColor: '#0c1322',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          color: '#cbd5e1',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <span>Create Account</span>
          <ArrowRight size={16} color="#38bdf8" />
          <span>Report</span>
          <ArrowRight size={16} color="#38bdf8" />
          <span>Submit Evidence</span>
          <ArrowRight size={16} color="#38bdf8" />
          <span>Track</span>
          <ArrowRight size={16} color="#38bdf8" />
          <span style={{ color: '#38bdf8' }}>Updates & Resolution</span>
        </div>
      </section>

      {/* 7. WHAT CAN CITIZENS DO? */}
      <section style={{
        padding: '4rem 1.5rem',
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#38bdf8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              Citizen Capabilities
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0 1rem' }}>
              Everything You Need to Manage Your Complaint
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6 }}>
              A full suite of digital tools designed to support you from the moment an incident occurs until it reaches resolution.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={featureCardStyle}>
              <div style={featureIconBox}><FileText size={22} color="#38bdf8" /></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
                Report Cybercrime
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Submit information about cybercrime incidents through a structured, easy-to-follow reporting process.
              </p>
            </div>

            <div style={featureCardStyle}>
              <div style={featureIconBox}><Eye size={22} color="#10b981" /></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
                Track Complaints
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Check the current status of complaints you have submitted and review investigation history.
              </p>
            </div>

            <div style={featureCardStyle}>
              <div style={featureIconBox}><UploadCloud size={22} color="#f59e0b" /></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
                Upload Evidence
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Securely provide supporting documents, screenshots, payment slips, and other relevant evidence.
              </p>
            </div>

            <div style={featureCardStyle}>
              <div style={featureIconBox}><Bell size={22} color="#c084fc" /></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
                Receive Notifications
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Stay informed when there are updates, status changes, or official messages regarding your complaint.
              </p>
            </div>

            <div style={featureCardStyle}>
              <div style={featureIconBox}><Send size={22} color="#38bdf8" /></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
                Provide Additional Information
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Respond promptly when additional information or clarification is requested by reviewers.
              </p>
            </div>

            <div style={featureCardStyle}>
              <div style={featureIconBox}><User size={22} color="#ec4899" /></div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
                Manage Your Profile
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                Keep your account, primary email, and contact phone number up to date for reliable verification.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TYPES OF CYBERCRIME */}
      <section style={{ padding: '4.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Incident Categories
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0 1rem' }}>
            Cybercrime You Can Report
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Understand the categories available on TrackTheCash. Categorizing your complaint accurately helps route it effectively.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1.25rem'
        }}>
          {cybercrimeTypes.map((crime, idx) => {
            const Icon = crime.icon;
            return (
              <div key={idx} style={{
                backgroundColor: '#0c1322',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.25rem',
                transition: 'border-color 0.2s ease, transform 0.2s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.65rem'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: '#38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Icon size={18} />
                  </div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0 }}>
                    {crime.name}
                  </h3>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  {crime.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#64748b'
        }}>
          * Categories are provided to help organize reporting. Processing steps and timelines may vary based on incident complexity.
        </div>
      </section>

      {/* 9. BEFORE YOU REPORT & EVIDENCE */}
      <section style={{
        padding: '4rem 1.5rem',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2.5rem' }}>
          {/* Before You Submit Checklist */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              padding: '0.3rem 0.75rem',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              marginBottom: '1rem'
            }}>
              <CheckCircle2 size={15} /> Preparation Checklist
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0 0 1rem' }}>
              Before You Submit a Complaint
            </h2>
            <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Having the right information ready helps ensure your complaint is logged accurately:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {[
                'Keep the incident date and exact time.',
                'Keep transaction IDs / UTR numbers where applicable.',
                'Keep screenshots and relevant messages/chats.',
                'Keep emails, URLs, or phone numbers related to the incident.',
                'Keep bank/payment information related to the transaction.',
                'Describe what happened clearly in chronological order.'
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    <Check size={13} />
                  </div>
                  <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>{item}</span>
                </div>
              ))}
            </div>

            {/* Critical Warning Box */}
            <div style={{
              marginTop: '2rem',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.85rem', color: '#fca5a5', lineHeight: 1.4 }}>
                <strong>Important Warning:</strong> Never share your OTP, PIN, CVV, password, or other authentication secrets with anyone. TrackTheCash will never request your banking passwords.
              </div>
            </div>
          </div>

          {/* Evidence Section */}
          <div style={{
            backgroundColor: '#0c1322',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                color: '#c084fc',
                padding: '0.3rem 0.75rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                marginBottom: '1rem'
              }}>
                <FileCheck size={15} /> Evidence Guidance
              </div>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', margin: '0 0 1rem' }}>
                Keep Your Evidence Safe
              </h2>
              <p style={{ fontSize: '0.95rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Relevant evidence can help explain what happened and substantiate your claim. Depending on your incident, this may include:
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                marginBottom: '1.5rem'
              }}>
                {[
                  '• Transaction records',
                  '• Screenshots',
                  '• Emails & headers',
                  '• Chat messages',
                  '• Website links / URLs',
                  '• Payment receipts',
                  '• Bank statements',
                  '• Other documents'
                ].map((ev, i) => (
                  <div key={i} style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 500 }}>
                    {ev}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <button
                onClick={() => setShowEvidenceModal(true)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.16)',
                  color: '#38bdf8',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  width: '100%',
                  justifyContent: 'center'
                }}
              >
                <Info size={16} /> Learn About Evidence
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 10. COMPLAINT TRACKING & LIFECYCLE */}
      <section style={{ padding: '4.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Status Transparency
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0 1rem' }}>
            Know What Happens Next
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6 }}>
            After submitting a complaint, you can use your account to view available status updates and respond when additional information is requested.
          </p>
        </div>

        {/* Visual Lifecycle Steps */}
        <div style={{
          backgroundColor: '#0c1322',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '2.5rem 1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={lifecycleStepStyle}>
              <div style={{ ...lifecycleCircle, backgroundColor: 'rgba(37, 99, 235, 0.2)', color: '#38bdf8' }}>
                <FileText size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: '0.75rem 0 0.25rem' }}>Submitted</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Incident logged with reference ID</p>
            </div>

            <div style={lifecycleStepStyle}>
              <div style={{ ...lifecycleCircle, backgroundColor: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                <CheckCircle2 size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: '0.75rem 0 0.25rem' }}>Received</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Verified by the intake queue</p>
            </div>

            <div style={lifecycleStepStyle}>
              <div style={{ ...lifecycleCircle, backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                <Eye size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: '0.75rem 0 0.25rem' }}>Under Review</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Information & evidence assessed</p>
            </div>

            <div style={lifecycleStepStyle}>
              <div style={{ ...lifecycleCircle, backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#c084fc' }}>
                <Layers size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: '0.75rem 0 0.25rem' }}>Investigation</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Inquiry and liaison underway</p>
            </div>

            <div style={lifecycleStepStyle}>
              <div style={{ ...lifecycleCircle, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981' }}>
                <ShieldCheck size={20} />
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: '0.75rem 0 0.25rem' }}>Resolved</h3>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>Action concluded & report closed</p>
            </div>
          </div>

          <div style={{
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: '#64748b'
          }}>
            * Available statuses and processing steps may vary depending on the complaint nature and jurisdiction.
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            onClick={handleTrackClick}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.85rem 2rem',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.6rem',
              boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)'
            }}
          >
            Track My Complaint <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* 12. CYBER SAFETY SECTION */}
      <section id="cyber-safety" style={{ padding: '4.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Public Awareness
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0 1rem' }}>
            Stay Safe Online
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6 }}>
            Practicing safe digital habits is your best defense against modern cyber fraud. Review these core principles.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={safetyCardStyle}>
            <div style={{ ...safetyIconBox, backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
              <Lock size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
              Protect Your OTP
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Never share OTPs with anyone. Bank representatives and service providers will never ask for your one-time passwords over the phone or message.
            </p>
          </div>

          <div style={safetyCardStyle}>
            <div style={{ ...safetyIconBox, backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
              <CreditCard size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
              Protect Your Banking Information
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Never share PINs, passwords, or card CVV information. Memorize your security codes and never save them in unencrypted text files or photos.
            </p>
          </div>

          <div style={safetyCardStyle}>
            <div style={{ ...safetyIconBox, backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
              <Sparkles size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
              Verify Before You Pay
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Check payment requests and recipient UPI IDs carefully. Remember that scanning a QR code is for sending money, never for receiving funds.
            </p>
          </div>

          <div style={safetyCardStyle}>
            <div style={{ ...safetyIconBox, backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
              <ExternalLink size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
              Be Careful With Links
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Avoid clicking suspicious links in SMS or messaging apps. Always verify official websites directly via browser bookmarks or legitimate search.
            </p>
          </div>

          <div style={safetyCardStyle}>
            <div style={{ ...safetyIconBox, backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
              <AlertTriangle size={22} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
              Be Careful With Investment Offers
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Be cautious of unrealistic high returns, unregistered crypto schemes, and unsolicited investment advice received on Telegram or WhatsApp.
            </p>
          </div>
        </div>
      </section>

      {/* 13. REPORT SUSPICIOUS ACTIVITY */}
      <section style={{
        padding: '4rem 1.5rem',
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          backgroundColor: '#0c1322',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '16px',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '1.25rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            color: '#38bdf8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldAlert size={28} />
          </div>

          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
            Something Looks Suspicious?
          </h2>

          <p style={{ fontSize: '1.05rem', color: '#94a3b8', maxWidth: '680px', lineHeight: 1.6, margin: 0 }}>
            If you come across a suspicious website, phone number, message, social media account, or other online identifier, you can use the available reporting feature to provide information.
          </p>

          <button
            onClick={() => {
              if (isAuthenticated) {
                navigate('/citizen?tab=intel');
              } else {
                navigate('/login?mode=intel');
              }
            }}
            style={{
              backgroundColor: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              padding: '0.8rem 1.75rem',
              borderRadius: '10px',
              fontSize: '0.95rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            Report Suspicious Activity <ArrowUpRight size={18} />
          </button>
        </div>
      </section>

      {/* 14. TRUST & PRIVACY */}
      <section style={{ padding: '4.5rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3rem' }}>
          <span style={{
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#38bdf8',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            Data Responsibility
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0 1rem' }}>
            Your Information Matters
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.6 }}>
            TrackTheCash is designed with access controls so that users can view and manage information associated with their own complaints.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            { title: 'Secure Account Access', desc: 'Protected by strong credential authentication and encrypted session management.', icon: Lock },
            { title: 'Controlled Complaint Access', desc: 'Each citizen only accesses and manages their own submitted complaint dossiers.', icon: Eye },
            { title: 'Protected Evidence', desc: 'Uploaded screenshots and documents are stored with strict file-type and integrity checks.', icon: ShieldCheck },
            { title: 'Authenticated Actions', desc: 'Every supplemental message or submission is authenticated against your citizen profile.', icon: User },
            { title: 'Privacy-Focused Design', desc: 'Engineered from the ground up to prevent unauthorized disclosure of citizen details.', icon: Shield }
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} style={{
                backgroundColor: '#0c1322',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem'
                }}>
                  <Icon size={20} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', margin: '0 0 0.5rem' }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 15. FAQ SECTION */}
      <section id="faq" style={{
        padding: '4.5rem 1.5rem',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#38bdf8',
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              Frequently Asked Questions
            </span>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', margin: '0.5rem 0 1rem' }}>
              Common Questions Answered
            </h2>
            <p style={{ fontSize: '1.05rem', color: '#94a3b8' }}>
              Find quick answers to common questions about reporting, tracking, and cyber safety.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {faqItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#0c1322',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={openFaq === idx}
                  style={{
                    width: '100%',
                    padding: '1.15rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '1rem',
                    fontWeight: 700,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <span>{item.q}</span>
                  {openFaq === idx ? <ChevronUp size={18} color="#38bdf8" /> : <ChevronDown size={18} color="#64748b" />}
                </button>
                {openFaq === idx && (
                  <div style={{
                    padding: '0 1.25rem 1.25rem',
                    fontSize: '0.92rem',
                    color: '#94a3b8',
                    lineHeight: 1.6,
                    borderTop: '1px solid rgba(255, 255, 255, 0.04)'
                  }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* 17. FOOTER */}
      <footer style={{
        backgroundColor: '#060a14',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '3.5rem 1.5rem 2rem',
        color: '#94a3b8'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Col 1: About */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.1rem',
              marginBottom: '1rem'
            }}>
              <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
            }}>
              <Shield size={22} color="#ffffff" />
            </div>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                letterSpacing: '0.02em',
                color: '#ffffff'
              }}>
                TRACK<span style={{ color: '#38bdf8' }}>THE</span>CASH
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#94a3b8', marginBottom: '1rem' }}>
              Citizen cybercrime support portal helping individuals report cyber incidents, maintain evidence, and track complaint statuses transparently.
            </p>
          </div>

          {/* Col 2: Citizen Services */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: '0 0 1rem' }}>
              Citizen Services
            </h4>
            <ul style={footerListStyle}>
              <li>
                <button onClick={handleReportClick} style={footerBtnLink}>Report Cybercrime</button>
              </li>
              <li>
                <button onClick={handleTrackClick} style={footerBtnLink}>Track Complaint</button>
              </li>
              <li>
                <a href="#cyber-safety" style={footerLink}>Cyber Safety Guidelines</a>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (isAuthenticated) navigate('/citizen?tab=intel');
                    else navigate('/login?mode=intel');
                  }}
                  style={footerBtnLink}
                >
                  Report Suspicious Activity
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', margin: '0 0 1rem' }}>
              Support & Information
            </h4>
            <ul style={footerListStyle}>
              <li><a href="#faq" style={footerLink}>Help Center & FAQ</a></li>
              <li><a href="#about" style={footerLink}>About Platform</a></li>
              <li><a href="#how-it-works" style={footerLink}>How It Works</a></li>
              <li><span style={{ fontSize: '0.85rem', color: '#64748b' }}>Privacy Principles</span></li>
            </ul>
          </div>

          {/* Col 4: Emergency Information */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fca5a5', margin: '0 0 1rem' }}>
              Emergency Information
            </h4>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: '#cbd5e1', marginBottom: '0.75rem' }}>
              For immediate financial fraud reporting & transaction freeze:
            </p>
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '0.75rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: 700 }}>NATIONAL CYBERCRIME HELPLINE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Dial 1930</div>
            </div>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                color: '#38bdf8',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              cybercrime.gov.in <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#64748b'
        }}>
          <div>
            © 2026 TrackTheCash Prototype. All rights reserved.
          </div>
          <div>
            Citizen-First Cybercrime Support & Reporting Workflow
          </div>
        </div>
      </footer>

      {/* LEARN ABOUT EVIDENCE MODAL */}
      {showEvidenceModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2000,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#0c1322',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '14px',
            maxWidth: '560px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileCheck size={22} color="#38bdf8" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                  Evidence Guide for Citizens
                </h3>
              </div>
              <button
                onClick={() => setShowEvidenceModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1rem' }}>
              Submitting clear evidence speeds up the verification process. Here is how to preserve digital artifacts safely:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.88rem', color: '#94a3b8' }}>
              <div><strong>1. Screenshots:</strong> Capture the entire screen showing date, time, URLs, phone numbers, and profile handles.</div>
              <div><strong>2. Transaction Reference (UTR):</strong> Ensure 12-digit UTR or transaction numbers are legible.</div>
              <div><strong>3. Bank Account Statements:</strong> Download PDF statements highlighting the disputed transaction lines.</div>
              <div><strong>4. Original Messages:</strong> Do not edit, crop, or doctor screenshots as authenticity is vital.</div>
              <div style={{ color: '#fca5a5' }}><strong>Never upload:</strong> Bank PINs, passwords, or full CVV codes.</div>
            </div>

            <button
              onClick={() => setShowEvidenceModal(false)}
              style={{
                width: '100%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Responsive Inline CSS for desktop / mobile nav toggles */}
      <style>{`
        @media (min-width: 860px) {
          .desktop-nav { display: flex !important; }
          .desktop-cta { display: flex !important; }
          .mobile-hamburger { display: none !important; }
        }
      `}</style>
    </div>
  );
};

const navLinkStyle = {
  color: '#cbd5e1',
  textDecoration: 'none',
  fontSize: '0.88rem',
  fontWeight: 600,
  transition: 'color 0.15s ease'
};

const mobileNavLinkStyle = {
  color: '#cbd5e1',
  textDecoration: 'none',
  fontSize: '1rem',
  fontWeight: 600,
  padding: '0.25rem 0'
};

const journeyNodeStyle = {
  backgroundColor: '#070c17',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '10px',
  padding: '0.85rem 1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.85rem'
};

const journeyIconBox = {
  width: '36px',
  height: '36px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
};

const pillarCardStyle = {
  backgroundColor: '#0c1322',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '14px',
  padding: '1.75rem',
  transition: 'transform 0.2s ease, border-color 0.2s ease'
};

const pillarIconBox = {
  width: '46px',
  height: '46px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1rem'
};

const stepCardStyle = {
  backgroundColor: '#0c1322',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '14px',
  padding: '1.75rem',
  position: 'relative'
};

const stepNumberBadge = {
  fontSize: '1.8rem',
  fontWeight: 800,
  color: 'rgba(56, 189, 248, 0.25)',
  fontFamily: 'monospace'
};

const featureCardStyle = {
  backgroundColor: '#0c1322',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '14px',
  padding: '1.75rem'
};

const featureIconBox = {
  width: '42px',
  height: '42px',
  borderRadius: '10px',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1rem'
};

const lifecycleStepStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center'
};

const lifecycleCircle = {
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '0.25rem'
};

const mockStatCard = {
  backgroundColor: '#070c17',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: '8px',
  padding: '0.85rem'
};

const safetyCardStyle = {
  backgroundColor: '#0c1322',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '14px',
  padding: '1.5rem'
};

const safetyIconBox = {
  width: '42px',
  height: '42px',
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '1rem'
};

const footerListStyle = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: '0.65rem'
};

const footerLink = {
  color: '#94a3b8',
  textDecoration: 'none',
  fontSize: '0.85rem',
  transition: 'color 0.15s ease'
};

const footerBtnLink = {
  background: 'none',
  border: 'none',
  padding: 0,
  color: '#94a3b8',
  fontSize: '0.85rem',
  cursor: 'pointer',
  textAlign: 'left'
};

export default LandingPage;
