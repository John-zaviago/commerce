import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import ProductRecommendations from 'components/enhanced/product-recommendations';
import Footer from 'components/layout/footer';
import { EnhancedGallery } from 'components/product/enhanced-gallery';
import { ProductProvider } from 'components/product/product-context';
import { ProductDescription } from 'components/product/product-description';
import { ProductLoadingWrapper } from 'components/product/product-loading-wrapper';
import { optimizedGraphQLClient } from 'lib/graphql/optimized-client';
import { Suspense } from 'react';

export async function generateMetadata(props: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  
  const graphqlResult = await optimizedGraphQLClient.getProductBySlug(params.handle);
  const product = graphqlResult.product;

  if (!product) return notFound();

  const featuredImage = product.image;
  const url = featuredImage?.sourceUrl;
  const altText = featuredImage?.altText;
  const indexable = true;

  return {
    title: product.name,
    description: product.shortDescription || product.description,
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable
      }
    },
    openGraph: url
      ? {
          images: [
            {
              url,
              alt: altText
            }
          ]
        }
      : null
  };
}

export default async function ProductPage(props: { params: Promise<{ handle: string }> }) {
  const params = await props.params;
  
  const graphqlResult = await optimizedGraphQLClient.getProductBySlug(params.handle);
  const product = graphqlResult.product;

  if (!product) return notFound();

    const productJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.shortDescription || product.description,
      image: product.image?.sourceUrl,
      offers: {
        '@type': 'Offer',
        availability: product.stockStatus === 'IN_STOCK'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        priceCurrency: 'USD',
        price: product.price || product.regularPrice
      }
    };

  return (
    <ProductProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(productJsonLd)
          }}
        />
        <ProductLoadingWrapper>
        <div className="mx-auto max-w-(--breakpoint-2xl) px-4 animate-in fade-in duration-500 ease-out">
          <div className="flex flex-col rounded-lg border border-neutral-200 bg-white p-8 md:p-12 lg:flex-row lg:gap-8 dark:border-neutral-800 dark:bg-black">
            <div className="h-full w-full basis-full lg:basis-4/6">
              <Suspense
                fallback={
                  <div className="relative aspect-square h-full max-h-[550px] w-full overflow-hidden">
                    <div className="h-full w-full bg-gray-200 animate-pulse rounded-md transition-opacity duration-300"></div>
                  </div>
                }
              >
                <div className="animate-in fade-in duration-500 ease-out">
                  <EnhancedGallery
                    images={[
                      // Main image first
                      ...(product.image ? [{
                        src: product.image.sourceUrl,
                        altText: product.image.altText
                      }] : []),
                      // Then gallery images
                      ...(product.galleryImages?.nodes?.map(galleryImage => ({
                        src: galleryImage.sourceUrl,
                        altText: galleryImage.altText
                      })) || [])
                    ]}
                  />
                </div>
              </Suspense>
            </div>

            <div className="basis-full lg:basis-2/6">
              <Suspense fallback={
                <div className="space-y-4">
                  <div className="h-12 bg-gray-200 rounded animate-pulse transition-opacity duration-300"></div>
                  <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse transition-opacity duration-300"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded animate-pulse transition-opacity duration-300"></div>
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6 transition-opacity duration-300"></div>
                  </div>
                  <div className="h-12 bg-gray-200 rounded-full animate-pulse transition-opacity duration-300"></div>
                </div>
              }>
                <div className="animate-in fade-in duration-500 ease-out delay-100">
                  <ProductDescription product={product} />
                </div>
              </Suspense>
            </div>
          </div>
          <Suspense fallback={
            <div className="py-8">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4 transition-opacity duration-300"></div>
              <div className="flex gap-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="aspect-square w-full flex-none min-[475px]:w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5">
                    <div className="aspect-square bg-gray-200 rounded-md animate-pulse transition-opacity duration-300"></div>
                    <div className="mt-2 space-y-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse transition-opacity duration-300"></div>
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3 transition-opacity duration-300"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          }>
            <div className="animate-in fade-in duration-500 ease-out delay-200">
              <RelatedProducts currentProduct={product} />
            </div>
          </Suspense>
        </div>
        
        {/* Product Recommendations */}
        <div className="bg-gray-50 py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <ProductRecommendations
              currentProduct={product}
              category={product.categories?.[0]?.name}
              limit={6}
              enablePrefetching={true}
              enableLazyLoading={true}
              showPrefetchIndicator={true}
              title="You might also like"
            />
          </div>
        </div>
        </ProductLoadingWrapper>
        <Footer />
    </ProductProvider>
  );
}

async function RelatedProducts({ currentProduct }: { currentProduct: any }) {
  // Get related products using GraphQL
  const relatedProducts = await optimizedGraphQLClient.getProducts({ first: 4 });
  
  // Filter out the current product
  const filteredRelatedProducts = relatedProducts.products.filter((p: any) => p.id !== currentProduct.id);

  if (!filteredRelatedProducts.length) return null;

  return (
    <ProductRecommendations
      currentProduct={currentProduct}
      category={currentProduct.productCategories?.nodes?.[0]?.name}
      limit={6}
      enablePrefetching={true}
      enableLazyLoading={true}
      showPrefetchIndicator={true}
      title="You might also like"
    />
  );
}
