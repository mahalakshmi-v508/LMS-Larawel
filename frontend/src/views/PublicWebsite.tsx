import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Laptop2,
  Mail,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { api } from '../services/api';

export type PublicPage = 'home' | 'about' | 'enquiry';

interface PublicWebsiteProps {
  page: PublicPage;
}

const navigate = (page: PublicPage) => {
  window.location.assign(page === 'home' ? '/' : `/${page}`);
};

export const PublicWebsite: React.FC<PublicWebsiteProps> = ({ page }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submitEnquiry = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    const result = await api.submitEnquiry({
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      mobile_number: String(form.get('mobile_number') || ''),
      course_interest: String(form.get('course_interest') || ''),
      message: String(form.get('message') || ''),
    });
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      event.currentTarget.reset();
    } else {
      setError(result.message || result.error || 'Unable to submit your enquiry. Please try again.');
    }
  };

  return (
    <div className="public-site">
      <header className="public-header">
        <button className="public-brand" type="button" onClick={() => navigate('home')} aria-label="Go to home">
          <span className="public-brand-mark"><GraduationCap size={24} /></span>
          <span><strong>SkillForge</strong><small>LMS Academy</small></span>
        </button>

        <nav className={`public-nav ${menuOpen ? 'public-nav-open' : ''}`} aria-label="Main navigation">
          <button className={page === 'home' ? 'active' : ''} onClick={() => { navigate('home'); setMenuOpen(false); }}>Home</button>
          <button className={page === 'about' ? 'active' : ''} onClick={() => { navigate('about'); setMenuOpen(false); }}>About Us</button>
          <button className={page === 'enquiry' ? 'active' : ''} onClick={() => { navigate('enquiry'); setMenuOpen(false); }}>Enquiry</button>
          <button className="public-login" onClick={() => { window.open('/login', '_blank', 'noopener,noreferrer'); setMenuOpen(false); }}>Login</button>
        </nav>

        <button className="public-menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {page === 'home' && (
        <main>
          <section className="public-hero">
            <div className="public-hero-copy">
              <span className="public-eyebrow"><Sparkles size={15} /> Learn. Practice. Advance.</span>
              <h1>Build skills that open <em>real opportunities.</em></h1>
              <p>Industry-focused learning, expert mentors and practical projects—all in one powerful LMS experience.</p>
              <div className="public-hero-actions">
                <button className="public-primary-button" onClick={() => navigate('enquiry')}>Explore Courses <ArrowRight size={18} /></button>
                <button className="public-secondary-button" onClick={() => navigate('about')}>About SkillForge</button>
              </div>
              <div className="public-trust">
                <span><strong>30+</strong> Learning modules</span>
                <span><strong>Live</strong> Expert sessions</span>
                <span><strong>100%</strong> Practical training</span>
              </div>
            </div>
            <div className="public-hero-visual" aria-label="Learning dashboard preview">
              <div className="public-orbit orbit-one" />
              <div className="public-orbit orbit-two" />
              <div className="public-dashboard">
                <div className="public-dashboard-top"><span /><span /><span /></div>
                <div className="public-dashboard-body">
                  <div className="public-dashboard-sidebar">
                    {[1, 2, 3, 4].map((item) => <span key={item} />)}
                  </div>
                  <div className="public-dashboard-content">
                    <div className="public-course-card">
                      <div className="public-course-icon"><Laptop2 size={28} /></div>
                      <div><small>Current course</small><strong>Full Stack Development</strong></div>
                    </div>
                    <div className="public-progress"><span><b>Course progress</b><b>68%</b></span><div><i /></div></div>
                    <div className="public-mini-cards">
                      <span><BookOpenCheck size={18} /><strong>12</strong><small>Lessons</small></span>
                      <span><Award size={18} /><strong>8</strong><small>Completed</small></span>
                      <span><Users size={18} /><strong>24</strong><small>Students</small></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="public-feature-section">
            <div className="public-section-heading">
              <span>WHY CHOOSE US</span>
              <h2>Learning designed around your growth</h2>
            </div>
            <div className="public-feature-grid">
              {[
                [BookOpenCheck, 'Structured Courses', 'Follow clear, step-by-step learning paths built for career-ready skills.'],
                [Laptop2, 'Live Learning', 'Join expert-led classes, complete projects and learn at your pace.'],
                [Award, 'Career Focused', 'Build a strong portfolio and earn certificates for your achievements.'],
              ].map(([Icon, title, text]) => (
                <article className="public-feature-card" key={String(title)}>
                  <span className="public-feature-icon">{React.createElement(Icon as React.ElementType, { size: 24 })}</span>
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="public-cta">
            <div><span>START YOUR JOURNEY</span><h2>Ready to upgrade your skills?</h2></div>
            <button className="public-primary-button" onClick={() => navigate('enquiry')}>Send an Enquiry <ArrowRight size={18} /></button>
          </section>
        </main>
      )}

      {page === 'about' && (
        <main className="public-inner">
          <section className="public-page-hero">
            <span>ABOUT SKILLFORGE</span>
            <h1>Where ambition meets <em>practical learning.</em></h1>
            <p>We help learners build confidence through structured courses, mentor guidance and hands-on experience.</p>
          </section>
          <section className="public-about-grid">
            <div className="public-about-panel">
              <span className="public-about-kicker">OUR PURPOSE</span>
              <h2>Make quality education clear, useful and accessible.</h2>
              <p>SkillForge LMS combines live classes, course content, assignments, tests and progress tracking in one simple learning environment.</p>
              <ul>
                <li><CheckCircle2 size={19} /> Expert-led curriculum</li>
                <li><CheckCircle2 size={19} /> Practical assignments</li>
                <li><CheckCircle2 size={19} /> Personal progress tracking</li>
                <li><CheckCircle2 size={19} /> Recognised certification</li>
              </ul>
            </div>
            <div className="public-values">
              {[['01', 'Learn with clarity', 'Every course follows a clear day-wise learning path.'], ['02', 'Grow through practice', 'Build the confidence that comes from doing real work.'], ['03', 'Move forward', 'Track progress and celebrate every achievement.']].map(([number, title, text]) => (
                <article key={number}><b>{number}</b><div><h3>{title}</h3><p>{text}</p></div></article>
              ))}
            </div>
          </section>
        </main>
      )}

      {page === 'enquiry' && (
        <main className="public-inner">
          <section className="public-enquiry-layout">
            <div className="public-enquiry-copy">
              <span>COURSE ENQUIRY</span>
              <h1>Let’s find the right course for <em>you.</em></h1>
              <p>Tell us what you want to learn. Our team will share course details and help you take the next step.</p>
              <div className="public-contact-list">
                <a href="tel:+919090909090"><Phone size={20} /><div><small>Call us</small><strong>+91 90909 09090</strong></div></a>
                <a href="mailto:hello@skillforge.com"><Mail size={20} /><div><small>Email us</small><strong>hello@skillforge.com</strong></div></a>
                <div><MapPin size={20} /><div><small>Visit us</small><strong>SkillForge Learning Centre</strong></div></div>
              </div>
            </div>

            <div className="public-enquiry-card">
              {submitted ? (
                <div className="public-success">
                  <span><CheckCircle2 size={34} /></span>
                  <h2>Enquiry submitted!</h2>
                  <p>Thank you. Our course counsellor will contact you soon.</p>
                  <button className="public-primary-button" type="button" onClick={() => setSubmitted(false)}>Submit Another Enquiry</button>
                </div>
              ) : (
                <form onSubmit={submitEnquiry}>
                  <h2>Send us your details</h2>
                  <p>We usually respond within one working day.</p>
                  {error && <div className="public-form-error">{error}</div>}
                  <div className="public-form-row">
                    <label>Full Name<input className="form-input" name="name" placeholder="Enter your name" required /></label>
                    <label>Mobile Number<input className="form-input" name="mobile_number" type="tel" placeholder="10-digit mobile number" required /></label>
                  </div>
                  <label>Email Address<input className="form-input" name="email" type="email" placeholder="you@example.com" /></label>
                  <label>Course Interest
                    <select className="form-select" name="course_interest" required defaultValue="">
                      <option value="" disabled>Select a course</option>
                      <option>Full Stack Development</option>
                      <option>Data Analytics</option>
                      <option>Digital Marketing</option>
                      <option>UI / UX Design</option>
                      <option>Other / Not Sure</option>
                    </select>
                  </label>
                  <label>Message<textarea className="form-textarea" name="message" placeholder="Tell us about your learning goals" /></label>
                  <button className="public-primary-button public-submit" type="submit" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Enquiry'} <ArrowRight size={18} />
                  </button>
                </form>
              )}
            </div>
          </section>
        </main>
      )}

      <footer className="public-footer">
        <button className="public-brand footer-brand" type="button" onClick={() => navigate('home')}>
          <span className="public-brand-mark"><GraduationCap size={24} /></span>
          <span><strong>SkillForge</strong><small>LMS Academy</small></span>
        </button>
        <p>Practical learning for a confident future.</p>
        <div><button onClick={() => navigate('home')}>Home</button><button onClick={() => navigate('about')}>About</button><button onClick={() => navigate('enquiry')}>Enquiry</button></div>
      </footer>
    </div>
  );
};
