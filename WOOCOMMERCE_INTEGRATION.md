# WooCommerce Integration

This project has been integrated with WooCommerce to fetch and display products from your WooCommerce store.

## Configuration

The WooCommerce integration uses the following environment variables:

```env
WOOCOMMERCE_URL=https://johnp500.sg-host.com
WOOCOMMERCE_KEY=ck_48e6982a4bcb7be514e5b3d1c29d27cfb5e86f65
WOOCOMMERCE_SECRET=cs_959dea476a3d90f2fad9b6a4e4cb7c19a993ba53
```

## Files Added/Modified

### New Files:
- `lib/woocommerce.ts` - Main WooCommerce API client
- `lib/woocommerce/adapter.ts` - Converts WooCommerce products to Shopify-compatible format
- `lib/woocommerce/index.ts` - WooCommerce API functions similar to Shopify functions
- `app/api/test-woocommerce/route.ts` - API endpoint to test WooCommerce connection
- `app/api/woocommerce-products/route.ts` - API endpoint to fetch WooCommerce products

### Modified Files:
- `lib/constants.ts` - Added WooCommerce configuration constants
- `components/grid/three-items.tsx` - Updated to use WooCommerce products
- `components/carousel.tsx` - Updated to use WooCommerce products
- `app/search/page.tsx` - Updated to use WooCommerce search
- `app/search/[collection]/page.tsx` - Updated to use WooCommerce categories
- `app/product/[handle]/page.tsx` - Updated to use WooCommerce products
- `components/layout/search/collections.tsx` - Updated to use WooCommerce categories

## API Endpoints

### Test Connection
```
GET /api/test-woocommerce
```
Tests the WooCommerce API connection and returns success/failure status.

### Get Products
```
GET /api/woocommerce-products?per_page=10&page=1&category=electronics&search=laptop&featured=true
```
Fetches products from WooCommerce with optional filtering parameters.

## Features

- **Product Display**: Homepage shows featured products from WooCommerce
- **Product Search**: Search functionality works with WooCommerce products
- **Category Browsing**: Browse products by WooCommerce categories
- **Product Details**: Individual product pages display WooCommerce product information
- **Image Handling**: Product images are properly displayed from WooCommerce
- **Price Display**: Product prices are shown in the correct format
- **Stock Status**: Product availability is indicated based on WooCommerce stock status

## Data Mapping

The adapter converts WooCommerce product data to match the existing Shopify product structure:

- WooCommerce `name` → Shopify `title`
- WooCommerce `slug` → Shopify `handle`
- WooCommerce `price` → Shopify `priceRange`
- WooCommerce `images` → Shopify `images` array
- WooCommerce `categories` → Shopify `tags`
- WooCommerce `stock_status` → Shopify `availableForSale`

## Caching

The integration includes caching for better performance:
- Products are cached for 30 minutes
- Collections are cached for 30 minutes
- Search results are cached for 15 minutes

## Error Handling

The integration includes comprehensive error handling:
- Connection failures are gracefully handled
- Missing products return appropriate 404 responses
- API errors are logged and displayed to users
- Fallback data is provided when possible

## Testing

To test the integration:

1. Start the development server: `npm run dev`
2. Visit `/api/test-woocommerce` to test the connection
3. Visit `/api/woocommerce-products` to see sample products
4. Browse the homepage to see WooCommerce products displayed
5. Use the search functionality to find products
6. Click on products to view individual product pages

## Notes

- The integration maintains compatibility with the existing Shopify-based UI components
- All existing styling and layout remain unchanged
- The product data structure is adapted to work with existing components
- Caching is implemented to ensure good performance
- Error handling ensures the site remains functional even if WooCommerce is unavailable
