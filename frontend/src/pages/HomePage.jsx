import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Camera,
  Check,
  CheckCircle2,
  MapPin,
  Send,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api as request } from '../services/api';

const reportTo = '/login?redirect=/dashboard';

export default function HomePage() {
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    resolutionRate: 0,
    averageResolutionDays: 0
  });

  useEffect(() => {
    request('/stats').then(setStats).catch(() => {});
  }, []);

  return (
    <>
      <Header />
      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} /> Your voice shapes your city</div>
            <h1>See a problem?<br /><em>Let's fix it.</em></h1>
            <p>Report civic issues in minutes, follow their progress, and help build a cleaner, safer neighbourhood for everyone.</p>
            <div className="hero-actions">
              <Link to={reportTo} className="primary"><Camera size={19} />Report an issue</Link>
              <a href="#how" className="secondary">See how it works <ArrowRight size={18} /></a>
            </div>
            <div className="trust"><ShieldCheck /><span><b>Live and accountable</b><br />Every number comes from the connected database</span></div>
          </div>
          <div className="hero-visual">
            <div className="sun" />
            <div className="city"><Building2 size={115} /><Building2 size={76} /><Building2 size={95} /></div>
            <div className="road"><span /><span /><span /></div>
            <div className="floating issue"><span><AlertCircle /></span><div><b>Report an issue</b><small>Send it to your civic team</small></div></div>
            <div className="floating solved"><span><Check /></span><div><b>Track resolution</b><small>See every status change</small></div></div>
          </div>
        </section>
        <section className="stats" id="impact">
          <div><strong>{stats.total.toLocaleString()}</strong><span>Issues reported</span></div>
          <div><strong>{stats.resolved.toLocaleString()}</strong><span>Issues resolved</span></div>
          <div><strong>{stats.resolutionRate}%</strong><span>Resolution rate</span></div>
          <div><strong>{stats.averageResolutionDays} days</strong><span>Avg. resolution time</span></div>
        </section>
        <section className="section" id="how">
          <div className="section-tag">Simple & transparent</div>
          <h2>From report to resolution</h2>
          <p className="lede">Three easy steps. Every submission becomes a real complaint record.</p>
          <div className="steps">
            {[
              [Camera, '01', 'Spot & report', 'Describe the problem and provide its exact location.'],
              [Send, '02', 'We record the issue', 'Your complaint receives a unique, trackable reference number.'],
              [CheckCircle2, '03', 'Track the progress', 'See status changes until the issue is resolved.']
            ].map(([Icon, n, title, text]) => (
              <article key={n}>
                <span className="step-icon"><Icon /></span>
                <i>{n}</i>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="feature-band" id="about">
          <div>
            <div className="section-tag light">About CivicFix</div>
            <h2>One transparent place for civic action</h2>
            <p>CivicFix connects residents and local teams with verifiable reports, clear ownership, and a complete resolution history.</p>
            <ul>
              <li><Check /> Location-aware reporting</li>
              <li><Check /> Accountable status updates</li>
              <li><Check /> Evidence from report to completion</li>
            </ul>
          </div>
          <div className="timeline-card">
            <small>FEATURES</small>
            <h3>Designed for public trust</h3>
            <p className="muted">Secure accounts, photo evidence, searchable records, notifications, analytics, and downloadable reports.</p>
          </div>
        </section>
        <section className="section testimonials">
          <div className="section-tag">Community voices</div>
          <h2>Built around the people who use the streets</h2>
          <div className="steps">
            <article><p>"Reporting a dangerous pothole took less than two minutes."</p><b>- Citizen reporter</b></article>
            <article><p>"The timeline makes every update visible and accountable."</p><b>- Ward coordinator</b></article>
            <article><p>"The dashboard helps our team focus on urgent work first."</p><b>- Civic administrator</b></article>
          </div>
        </section>
        <section className="cta" id="contact">
          <span><Send /></span>
          <div><h2>Need help with a report?</h2><p>Contact your local civic team at support@civicfix.example.</p></div>
          <a className="primary" href="mailto:support@civicfix.example">Contact us</a>
        </section>
        <section className="cta">
          <span><MapPin /></span>
          <div><h2>Your neighbourhood needs your eyes.</h2><p>Create an account and submit a verified report.</p></div>
          <Link to={reportTo} className="primary">Report an issue <ArrowRight size={18} /></Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
