export default function Home() {
  return (
    <div className="min-h-screen bg-[#050608] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#c83d36] mb-4">DEVIL</h1>
        <p className="text-xl text-[#858a96]">Autonomous AI Agent Platform</p>
        <div className="mt-8">
          <a 
            href="/dashboard" 
            className="inline-block bg-[#c83d36] px-6 py-3 rounded font-semibold hover:bg-[#df4a41] transition-colors"
          >
            Open Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
