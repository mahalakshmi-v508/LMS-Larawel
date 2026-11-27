import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  CheckCircle2,
  GraduationCap,
  Headphones,
  Laptop2,
  Mail,
  MapPin,
  Menu,
  Phone,
  Play,
  Search,
  Sparkles,
  Star,
  Trophy,
  Clock3,
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
          <button onClick={() => { navigate('enquiry'); setMenuOpen(false); }}>Courses⌄</button>
          <button className={page === 'about' ? 'active' : ''} onClick={() => { navigate('about'); setMenuOpen(false); }}>About Us</button>
          <button onClick={() => { document.querySelector('.public-courses-section')?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); }}>Features⌄</button>
          <button className={page === 'enquiry' ? 'active' : ''} onClick={() => { navigate('enquiry'); setMenuOpen(false); }}>Contact</button>
          <div className="public-search"><Search size={15}/><span>Search courses...</span></div>
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
              <span className="public-eyebrow"><GraduationCap size={15} /> Learn · Practice · Grow</span>
              <h1>Your Learning<br />Journey <em>Starts Here!</em></h1>
              <p>Access high-quality courses, learn at your own pace and build a better future with SkillForge LMS.</p>
              <div className="public-hero-actions">
                <button className="public-primary-button" onClick={() => navigate('enquiry')}>Explore Courses <ArrowRight size={18} /></button>
                <button className="public-secondary-button"><Play size={15} fill="currentColor" /> Watch Demo</button>
              </div>
              <div className="public-trust">
                <span><strong>10K+</strong> Active Learners</span>
                <span><strong>500+</strong> Courses</span>
                <span><strong>95%</strong> Satisfaction Rate</span>
              </div>
            </div>
            <div className="public-hero-visual" aria-label="Student learning online">
              <div className="hero-blob"/>
              <div className="hero-spark spark-one">✦</div>
              <div className="hero-spark spark-two">✦</div>
              <div className="student-illustration">
                <div className="student-hair"/>
                <div className="student-head"><span className="student-eye left"/><span className="student-eye right"/><span className="student-smile"/></div>
                <div className="student-body"/>
                <div className="student-arm left"/>
                <div className="student-arm right"/>
                <div className="student-laptop"><span>&lt;/&gt;</span></div>
                <div className="student-book"/>
              </div>
              <div className="floating-icon floating-video"><Play size={22} fill="currentColor"/></div>
              <div className="floating-icon floating-book"><BookOpenCheck size={25}/></div>
              <div className="floating-icon floating-award"><Award size={25}/></div>
              <div className="floating-cap"><span/></div>
            </div>
          </section>

          <section className="public-feature-section">
            <div className="public-section-heading">
              <span>WHY CHOOSE US</span>
              <h2>Learn Smarter, Achieve Bigger</h2>
            </div>
            <div className="public-feature-grid">
              {[
                [Play, 'Interactive Courses', 'Engage with video lessons, quizzes and projects.'],
                [Laptop2, 'Flexible Learning', 'Study anytime, anywhere on any device.'],
                [Award, 'Expert Instructors', 'Learn from industry experts and professionals.'],
                [Headphones, 'Dedicated Support', 'Get help whenever you need it.'],
              ].map(([Icon, title, text]) => (
                <article className="public-feature-card" key={String(title)}>
                  <span className="public-feature-icon">{React.createElement(Icon as React.ElementType, { size: 24 })}</span>
                  <h3>{String(title)}</h3>
                  <p>{String(text)}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="public-courses-section">
            <div className="public-courses-copy">
              <span>POPULAR COURSES</span>
              <h2>Explore Our<br/>Top Courses</h2>
              <p>Discover a wide range of courses from beginner to advanced level.</p>
              <button className="public-primary-button" onClick={() => navigate('enquiry')}>Browse All Courses</button>
            </div>
            <div className="public-course-grid">
              {[
                ['Web Development', 'Basics', '4.8', '8h 30m', '24 lessons', 'code'],
                ['Data Science', 'Intermediate', '4.7', '10h 20m', '30 lessons', 'python'],
                ['UI/UX Design', 'Beginner', '4.8', '7h 15m', '20 lessons', 'design'],
              ].map(([title, level, rating, duration, lessons, kind]) => (
                <article className="public-top-course-card" key={title}>
                  <div className={`course-cover cover-${kind}`}>
                    <span className="course-level">{level}</span>
                    {kind === 'code' ? <><b>&lt;/&gt;</b><Laptop2 size={54}/></> : kind === 'python' ? <><b>Py</b><Laptop2 size={54}/></> : <><b>UI</b><Laptop2 size={54}/></>}
                  </div>
                  <div className="public-course-card-body">
                    <h3>{title}</h3>
                    <div className="course-meta"><Star size={15} fill="#f4aa2b" color="#f4aa2b"/><strong>{rating}</strong><small>(Reviews)</small></div>
                    <div className="course-bottom"><span><Clock3 size={14}/>{duration}</span><span><BookOpenCheck size={14}/>{lessons}</span></div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="public-success-section">
            <div className="success-illustration">
              <div className="success-plant left"/>
              <div className="success-book"/>
              <div className="success-cap"><span/></div>
              <div className="success-bulb"><Sparkles size={32}/></div>
            </div>
            <div className="success-copy">
              <span>ABOUT EDULEARN</span>
              <h2>A Platform Built for<br/>Your Success</h2>
              <p>EduLearn is more than just a learning platform. It is a community of learners, creators and dreamers. Join us and unlock your potential with the best learning resources.</p>
              <button className="public-primary-button" onClick={() => navigate('about')}>Know More <ArrowRight size={16}/></button>
            </div>
            <div className="success-stats">
              <div><Users size={23}/><strong>50K+</strong><small>Students</small></div>
              <div><Laptop2 size={23}/><strong>1K+</strong><small>Courses</small></div>
              <div><Trophy size={23}/><strong>98%</strong><small>Success Rate</small></div>
              <div><Star size={23}/><strong>4.9/5</strong><small>User Rating</small></div>
            </div>
          </section>

          <section className="public-testimonials">
            <span>TESTIMONIALS</span>
            <h2>What Our Learners Say</h2>
            <div className="testimonial-grid">
              {[
                ['Priya S.', 'Software Engineer', 'EduLearn helped me upgrade my skills and get a better job!'],
                ['Arun K.', 'Data Scientist', 'Amazing platform with easy learning and great support.'],
                ['Sneha M.', 'Web Developer', 'The best LMS I have ever used. Highly recommended!'],
              ].map(([name, role, quote]) => (
                <article key={name}>
                  <div className="testimonial-avatar">{name[0]}</div>
                  <div><p>“{quote}”</p><strong>{name}</strong><small>{role}</small></div>
                  <div className="testimonial-stars">★★★★★</div>
                </article>
              ))}
            </div>
          </section>

          <section className="public-cta">
            <div className="cta-trophy"><Trophy size={30}/></div>
            <div><h2>Ready to start learning?</h2><p>Join thousands of learners and take the next step in your career.</p></div>
            <button className="public-primary-button" onClick={() => navigate('enquiry')}>Get Started Free <ArrowRight size={17}/></button>
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
                  <label>Email Address<input className="form-input" name="email" type="email" placeholder="you@example.com" required /></label>
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
        <div className="footer-grid">
          <div className="footer-brand-block">
            <button className="public-brand footer-brand" type="button" onClick={() => navigate('home')}>
              <span className="public-brand-mark"><GraduationCap size={24} /></span>
              <span><strong>EduLearn</strong><small>LMS Platform</small></span>
            </button>
          </div>
          <div><h3>Quick Links</h3><button onClick={() => navigate('home')}>Home</button><button onClick={() => navigate('enquiry')}>Courses</button><button onClick={() => navigate('about')}>About</button></div>
          <div><h3>Support</h3><button>FAQs</button><button>Help Center</button><button>Terms of Service</button></div>
          <div><h3>Contact Us</h3><button><Mail size={12}/> support@edulearn.com</button><button><Phone size={12}/> +91 98765 43210</button></div>
          <div className="footer-social"><h3>Follow Us</h3><span>f</span><span>▶</span><span>in</span><span>◆</span></div>
        </div>
        <div className="footer-bottom"><span>© 2026 EduLearn. All rights reserved.</span><span>Learn Today · Lead Tomorrow</span></div>
      </footer>
    </div>
  );
};
