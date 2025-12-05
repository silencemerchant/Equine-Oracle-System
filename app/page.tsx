export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <h1 className="text-6xl font-bold text-yellow-400">Oracle Engine</h1>
      <p className="mt-6 text-2xl">Horse Race Prediction Platform</p>
      <a href="/predict" className="mt-12 rounded bg-blue-600 px-8 py-4 text-xl font-bold hover:bg-blue-500">
        Get Prediction
      </a>
    </main>
  )
}
