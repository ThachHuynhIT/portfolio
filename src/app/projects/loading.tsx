export default function ProjectsLoading() {
  return (
    <div className="portfolio-page" role="status" aria-label="Loading">
      <section className="portfolio-section">
        <div className="portfolio-column">
          <div aria-hidden="true" className="portfolio-page-header space-y-4">
            <div className="h-12 w-full max-w-sm bg-portfolio-hull border border-portfolio-hairline rounded-lg" />
            <div className="h-5 w-full max-w-lg bg-portfolio-hull border border-portfolio-hairline rounded-lg" />
          </div>
          <div aria-hidden="true" className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-80 w-full min-w-0 bg-portfolio-hull border border-portfolio-hairline rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
