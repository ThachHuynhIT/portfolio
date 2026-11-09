import JsonValidator from "@/components/tools/JsonValidator";
import PageHeader from "@/components/ui/PageHeader";

export default function JsonValidatorPage() {
  return <div className="portfolio-page"><section className="portfolio-section"><div className="portfolio-column">
    <PageHeader title="JSON Parameter Validator" intro="Validate whether tb_def_parameter__id exists in the parameter definitions list" />
    <JsonValidator />
  </div></section></div>;
}
