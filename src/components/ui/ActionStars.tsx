/** Decorative geometry shared by primary links and buttons. */
export default function ActionStars() {
  return <span aria-hidden="true" className="portfolio-action-stars">{Array.from({ length: 6 }, (_, index) => <svg key={index} viewBox="0 0 24 24"><path d="M12 0 15 9 24 12 15 15 12 24 9 15 0 12 9 9Z" /></svg>)}</span>;
}
