export default function Predict() {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-8">Quick Prediction</h1>
      <select className="bg-gray-800 text-white p-2 rounded mb-4">
        <option>Traced from Birth to Adoption Sprint PBD</option>
      </select>
      <select className="bg-gray-800 text-white p-2 rounded mb-4">
        <option>Au Fait</option>
      </select>
      <button className="bg-blue-600 text-white font-bold py-2 px-6 rounded">Get Prediction</button>
      <div className="mt-8">
        <h2 className="text-2xl mb-4">Win Probability: 91.6%</h2>
        <p>Model Confidence: 92%</p>
      </div>
    </div>
  );
}