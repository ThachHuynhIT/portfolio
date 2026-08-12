import JsonValidator from '@/components/tools/JsonValidator';

export default function JsonValidatorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            JSON Parameter Validator
          </h1>
          <p className="text-gray-300 text-lg">
            Kiểm tra các tb_def_parameter__id có tồn tại trong danh sách parameters hay không
          </p>
        </div>
        <JsonValidator />
      </div>
    </div>
  );
}
