export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-6xl font-bold mb-8 text-yellow-400">Oracle Engine - Horse Race Prediction Platform</h1>
      <p className="text-2xl mb-8">Predict Winners with Machine Learning</p>
      <div className="text-center mb-8 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl">
        <h2 className="text-3xl font-bold text-black mb-2">85.8% Trifecta Accuracy</h2>
        <p className="text-xl text-black">NDCG@3 on 78K+ Races</p>
      </div>
      <a href="/predict" className="bg-blue-600 text-white font-bold py-4 px-8 rounded-xl">Get Prediction</a>
    </div>
  );
}