import JsonValidator from '@/components/tools/JsonValidator';
import { cn } from "@/lib/utils";
import { text } from "@/lib/design-tokens";

export default function JsonValidatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 light:from-neutral-50 light:via-purple-100/40 light:to-neutral-50 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8">
          <h1 className={cn("text-4xl font-bold", text.primary, "mb-4")}>
            JSON Parameter Validator
          </h1>
          <p className="text-gray-300 light:text-neutral-600 text-lg">
            Validate whether tb_def_parameter__id exists in the parameter definitions list
          </p>
        </div>
        <JsonValidator />
      </div>
    </div>
  );
}
