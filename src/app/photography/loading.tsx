export default function PhotographyLoading() {
  return (
    <div className="portfolio-page" role="status" aria-label="Loading">
      <section className="portfolio-section">
        <div className="portfolio-column">
          <div aria-hidden="true" className="portfolio-page-header space-y-4">
            <div className="h-12 w-full max-w-sm bg-portfolio-hull border border-portfolio-hairline rounded-lg" />
            <div className="h-5 w-full max-w-lg bg-portfolio-hull border border-portfolio-hairline rounded-lg" />
          </div>
          <div aria-hidden="true" className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className="aspect-square w-full min-w-0 bg-portfolio-hull border border-portfolio-hairline rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
