import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <main className="max-w-4xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Vid2Blog
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Transform YouTube videos into well-structured blog articles with AI-powered transcription and content analysis.
        </p>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Project Setup Complete ✅
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">✅ Next.js with TypeScript</h3>
              <p className="text-gray-600 text-sm">Modern React framework with full TypeScript support</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">✅ Tailwind CSS</h3>
              <p className="text-gray-600 text-sm">Utility-first CSS framework for rapid UI development</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">✅ Project Structure</h3>
              <p className="text-gray-600 text-sm">Organized directories for components, API routes, and utilities</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">✅ TypeScript Interfaces</h3>
              <p className="text-gray-600 text-sm">Complete type definitions for all data models</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Ready for Next Task
          </Button>
          <p className="text-sm text-gray-500">
            Task 1 completed successfully. Ready to implement YouTube URL validation and metadata extraction.
          </p>
        </div>
      </main>
    </div>
  );
}
