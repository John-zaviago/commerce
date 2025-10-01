import { Suspense } from 'react';

async function VariationsTest() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/test-variations`);
    const data = await response.json();
    
    if (!data.success) {
      return (
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Variations Test - Error</h1>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error: {data.error}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">WooCommerce Variations Test</h1>
        
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-6">
          <p><strong>Total Products:</strong> {data.totalProducts}</p>
          <p><strong>Variable Products:</strong> {data.variableProducts}</p>
        </div>
        
        <div className="space-y-6">
          {data.testResults.map((result: any, index: number) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">{result.productName}</h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p><strong>Product ID:</strong> {result.productId}</p>
                  <p><strong>Type:</strong> {result.productType}</p>
                  <p><strong>Has Variations:</strong> {result.hasVariations ? 'Yes' : 'No'}</p>
                  <p><strong>Variation IDs:</strong> {result.variationIds.length}</p>
                </div>
                <div>
                  <p><strong>Has Product Variations:</strong> {result.hasProductVariations ? 'Yes' : 'No'}</p>
                  <p><strong>Variations Count:</strong> {result.productVariationsCount}</p>
                </div>
              </div>
              
              {result.attributes.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Attributes:</h3>
                  <ul className="list-disc list-inside">
                    {result.attributes.map((attr: any, attrIndex: number) => (
                      <li key={attrIndex}>
                        {attr.name} (variation: {attr.variation ? 'Yes' : 'No'}) - Options: {attr.options.join(', ')}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {result.firstVariation && (
                <div>
                  <h3 className="font-semibold mb-2">First Variation:</h3>
                  <div className="bg-gray-50 p-4 rounded">
                    <p><strong>ID:</strong> {result.firstVariation.id}</p>
                    <p><strong>Price:</strong> ${result.firstVariation.price}</p>
                    <p><strong>Stock Status:</strong> {result.firstVariation.stockStatus}</p>
                    <p><strong>Attributes:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      {result.firstVariation.attributes.map((attr: any, attrIndex: number) => (
                        <li key={attrIndex}>{attr.name}: {attr.option}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Variations Test - Error</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
}

export default function TestVariationsPage() {
  return (
    <div>
      <Suspense fallback={
        <div className="p-8">
          <h1 className="text-2xl font-bold mb-4">Loading variations test...</h1>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      }>
        <VariationsTest />
      </Suspense>
    </div>
  );
}
