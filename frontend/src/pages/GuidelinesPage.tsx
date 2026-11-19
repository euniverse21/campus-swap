import './GuidelinesPage.css'

// Things that can never be swapped on Campus Swap
const PROHIBITED_EXCHANGES = [
  'Food and beverages, including homemade meals',
  'Alcohol, tobacco, vaping products and illegal drugs',
  'Weapons and dangerous items',
  'Prescription medication',
  'Sexual services or intimate exchanges',
  'Money, cash payments or additional payments',
  'Completing assignments or exams for other students',
  'Illegal activities or stolen goods',
  'Medical, legal or financial services requiring professional qualifications',
  'Activities involving harassment, coercion or exploitation',
]

// Extra rules for each kind of exchange
const SAFETY_RULES = [
  { exchange: 'Physical items', rule: 'Items must be legally owned and safe to use.' },
  { exchange: 'Skills', rule: 'Clearly state skill level and expected duration.' },
  { exchange: 'Services', rule: 'Define the task and limit excessive workloads.' },
  { exchange: 'Companionship', rule: 'Voluntary participation; no obligation for physical contact.' },
  { exchange: 'Physical activities', rule: 'Appropriate safety precautions and consent.' },
  { exchange: 'Photography', rule: 'Obtain permission before taking or publishing photos.' },
  { exchange: 'Academic support', rule: 'Tutoring is allowed; completing assessed work is prohibited.' },
]

export function GuidelinesPage() {
  return (
    <main className="page guidelines">
      <header>
        <h1>Community guidelines</h1>
        <p className="guidelines__lead">
          Campus Swap is a student-to-student exchange platform for the Flinders University community.
          Students can exchange physical items, skills, services and experiences without using money.
        </p>
        <p>
          Beyond traditional second-hand trading, users can post what they have to offer or what they
          wish to receive, whether it&apos;s a textbook, photography lessons, help with moving, or simply
          someone to accompany them to a lecture. The platform aims to encourage resource sharing, skill
          exchange and meaningful social connections within the university community.
        </p>
        <p className="guidelines__note">
          Right now you can swap physical items. Posting skills, services and experiences is coming soon.
        </p>
      </header>

      <section className="guidelines__section" aria-labelledby="prohibited-heading">
        <h2 id="prohibited-heading">Prohibited exchanges</h2>
        <p>Listings, offers and chats must never include:</p>
        <ul className="guidelines__prohibited">
          {PROHIBITED_EXCHANGES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="guidelines__section" aria-labelledby="safety-heading">
        <h2 id="safety-heading">Staying safe</h2>
        <p>Each kind of exchange comes with its own rules.</p>
        <dl className="guidelines__rules">
          {SAFETY_RULES.map(({ exchange, rule }) => (
            <div key={exchange} className="guidelines__rule">
              <dt>{exchange}</dt>
              <dd>{rule}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="guidelines__section" aria-labelledby="wrong-heading">
        <h2 id="wrong-heading">If something feels wrong</h2>
        <p>
          You can stop at any time. Cancel the swap from <strong>My listings</strong> or{' '}
          <strong>My offers</strong>, meet in a public place on campus, and don&apos;t go ahead with
          anything that makes you feel unsafe.
        </p>
      </section>
    </main>
  )
}
