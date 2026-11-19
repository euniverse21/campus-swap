// Required tick box shown before publishing a listing or sending an offer.
// "required" makes the browser block the form until it is ticked.
export function GuidelinesConsent() {
  return (
    <label className="consent">
      <input type="checkbox" required />
      <span>
        I confirm this follows the{' '}
        <a href="/guidelines" target="_blank" rel="noopener noreferrer">
          community guidelines
        </a>{' '}
        (no food, alcohol, medication, money or assessed work).
      </span>
    </label>
  )
}
