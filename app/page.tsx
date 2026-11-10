import RegistrationForm from "./RegistrationForm";
import { registrationSummary } from "../lib/registration";

export const dynamic = "force-dynamic";

export default async function Home() {
  const summary = await registrationSummary();
  return (
    <>
      <header className="header">
        <a className="brand" href="#home" aria-label="Rundu Open home">
          <span className="brand-ball" aria-hidden="true">
            ◉
          </span>{" "}
          RUNDU<span className="brand-light">OPEN</span>
          <sup>2026</sup>
        </a>
        <nav aria-label="Main navigation">
          <a href="#tournament">Tournament</a>
          <a href="#schedule">Schedule</a>
          <a href="#contact">Contact</a>
        </nav>
        <a className="nav-cta" href="#register">
          Registration <span>↗</span>
        </a>
      </header>
      <main>
        <section id="home" className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot" /> RUNDU, NAMIBIA · 21 NOVEMBER 2026
            </p>
            <h1>
              Rundu Open<br />2026
            </h1>
            <p className="intro">
              Recreational tennis at Kavango River Lodge, Rundu.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#register">
                Registration details <span>↗</span>
              </a>
            </div>
            <p className="unofficial">Unofficial Tournament - Just for fun</p>
          </div>
          <div
            className="court-art"
            role="img"
            aria-label="Illustration of a green tennis court with a yellow tennis ball"
          >
            <div className="court">
              <div className="court-inner" />
              <div className="service-line" />
              <div className="net" />
              <div className="centre-line" />
            </div>
            <div className="tennis-ball" />
          </div>
        </section>
        <div className="quick-facts">
          <div>
            <span>WHEN</span>
            <strong>21 November 2026</strong>
            <small>Saturday only</small>
          </div>
          <div>
            <span>WHERE</span>
            <strong>Kavango River Lodge</strong>
            <small>Rundu, Namibia</small>
          </div>
          <div>
            <span>ENTRY</span>
            <strong>N$20 per participant</strong>
            <small>8 places · First come, first served</small>
          </div>
        </div>
        <section id="tournament" className="section tournament">
          <div>
            <h2>Tournament details</h2>
          </div>
          <div className="info-list">
            <article>
              <div>
                <h3>Entry</h3>
                <p>
                  Entry is N$20. A maximum of 8 participants will be accepted,
                  strictly first come, first served.
                </p>
              </div>
            </article>
            <article>
              <div>
                <h3>Availability</h3>
                <p>
                  The tournament takes place on Saturday, 21 November 2026.
                  Participants must be available on Saturday.
                </p>
              </div>
            </article>
            <article>
              <div>
                <h3>Registration deadline</h3>
                <p>
                  Registration closes Thursday night, 19 November 2026, at 24:00,
                  or earlier once all 8 places are filled.
                </p>
              </div>
            </article>
          </div>
        </section>
        <section id="register" className="registration section">
          <div className="register-copy">
            <h2>Registration</h2>
            <p>
              One open category for everyone, regardless of age or gender.
            </p>
            <p className="muted">
              Payment arrangements and match rules will be confirmed. For
              questions, <a href="#contact">get in touch with Elia ↗</a>.
            </p>
          </div>
          <RegistrationForm initialSummary={summary} />
        </section>
        <section id="schedule" className="section schedule">
          <div className="section-heading">
            <div>
              <h2>Schedule & results</h2>
            </div>
            <p>Saturday start time to be confirmed.</p>
          </div>
          <div className="timeline">
            <article>
              <span className="day">THU</span>
              <strong>
                19<span>NOV</span>
              </strong>
              <h3>Registration closes</h3>
              <p>24:00 Thursday night, or earlier if all 8 places are filled.</p>
            </article>
            <article>
              <span className="day">FRI</span>
              <strong>
                20<span>NOV</span>
              </strong>
              <h3>Schedule announced</h3>
              <p>The match schedule will be announced on Friday morning.</p>
            </article>
            <article>
              <span className="day">SAT</span>
              <strong>
                21<span>NOV</span>
              </strong>
              <h3>Tournament day</h3>
              <p>Tournament at Kavango River Lodge.</p>
            </article>
          </div>
          <div className="results-note">
            <p>
              Schedule and results will appear here when available.
            </p>
          </div>
        </section>
        <section id="contact" className="contact section">
          <div>
            <h2>Contact Elia</h2>
            <p>For tournament and registration questions.</p>
          </div>
          <div className="contact-methods">
            <a href="https://wa.me/41764801248" className="contact-link">
              <span>
                <small>WHATSAPP</small>
                <strong>0041 76 480 12 48</strong>
              </span>
              <span>Message Elia ↗</span>
            </a>
            <a href="tel:+264812752517" className="contact-link">
              <span>
                <small>CALLING</small>
                <strong>081 275 25 17</strong>
              </span>
              <span>Call Elia ↗</span>
            </a>
            <p>
              WhatsApp and calls use different numbers.
            </p>
          </div>
        </section>
      </main>
      <footer>
        <a className="brand" href="#home">
          RUNDU OPEN <sup>2026</sup>
        </a>
        <p>Unofficial Tournament - Just for fun</p>
        <span>Rundu, Namibia · runduopen.info</span>
      </footer>
    </>
  );
}
