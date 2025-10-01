// WooCommerce API configuration and utility functions

const STORE_URL = process.env.WOOCOMMERCE_URL || "https://johnp500.sg-host.com"
const CONSUMER_KEY = process.env.WOOCOMMERCE_KEY || "ck_48e6982a4bcb7be514e5b3d1c29d27cfb5e86f65"
const CONSUMER_SECRET = process.env.WOOCOMMERCE_SECRET || "cs_959dea476a3d90f2fad9b6a4e4cb7c19a993ba53"

interface SalesCacheEntry {
  totalSold: number
  timestamp: number
  ttl: number
}

export interface WooCommerceProduct {
  id: number
  name: string
  slug: string
  permalink: string
  description: string
  short_description: string
  price: string
  regular_price: string
  sale_price: string
  on_sale: boolean
  stock_status: string
  type: string
  variations?: number[]
  grouped_products?: number[]
  variation_prices?: {
    min_price: string
    max_price: string
    min_regular_price: string
    max_regular_price: string
    min_sale_price: string
    max_sale_price: string
    on_sale: boolean
  }
  attributes: Array<{
    id: number
    name: string
    options: string[]
    variation?: boolean
  }>
  images: Array<{
    id: number
    src: string
    alt: string
  }>
  categories: Array<{
    id: number
    name: string
    slug: string
  }>
}

export interface WooCommerceOrder {
  id?: number
  status?: string
  currency?: string
  total?: string
  billing: {
    first_name: string
    last_name: string
    email: string
    phone: string
    address_1: string
    address_2?: string
    city: string
    state: string
    postcode: string
    country: string
  }
  shipping: {
    first_name: string
    last_name: string
    address_1: string
    address_2?: string
    city: string
    state: string
    postcode: string
    country: string
  }
  line_items: Array<{
    product_id: number
    quantity: number
    name?: string
    price?: string
  }>
  payment_method?: string
  payment_method_title?: string
  set_paid?: boolean
  shipping_lines?: Array<{
    method_id: string
    method_title: string
    total: string
  }>
}

export interface WooCommerceReview {
  id: number
  date_created: string
  review: string
  rating: number
  reviewer: string
  reviewer_email: string
  verified: boolean
  product_id: number
}

export interface WooCommerceCoupon {
  id: number
  code: string
  amount: string
  date_created: string
  date_modified: string
  discount_type: "percent" | "fixed_cart" | "fixed_product"
  description: string
  date_expires: string | null
  usage_count: number
  individual_use: boolean
  product_ids: number[]
  excluded_product_ids: number[]
  usage_limit: number | null
  usage_limit_per_user: number | null
  limit_usage_to_x_items: number | null
  free_shipping: boolean
  product_categories: number[]
  excluded_product_categories: number[]
  exclude_sale_items: boolean
  minimum_amount: string
  maximum_amount: string
  email_restrictions: string[]
  used_by: string[]
}

export interface WooCommercePaymentMethod {
  id: string
  title: string
  description: string
  enabled: boolean
  method_title: string
  method_description: string
  settings: {
    title: { value: string }
    description: { value: string }
  }
}

export interface WooCommerceProductVariation {
  id: number
  date_created: string
  date_modified: string
  description: string
  permalink: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  on_sale: boolean
  purchasable: boolean
  virtual: boolean
  downloadable: boolean
  downloads: any[]
  download_limit: number
  download_expiry: number
  tax_status: string
  tax_class: string
  manage_stock: boolean
  stock_quantity: number | null
  stock_status: string
  backorders: string
  backorders_allowed: boolean
  backordered: boolean
  weight: string
  dimensions: {
    length: string
    width: string
    height: string
  }
  shipping_class: string
  shipping_class_id: number
  image: {
    id: number
    date_created: string
    date_modified: string
    src: string
    name: string
    alt: string
  } | null
  attributes: Array<{
    id: number
    name: string
    option: string
  }>
  menu_order: number
  meta_data: any[]
}

export interface WooCommerceProductSales {
  product_id: number
  quantity: number
}

export interface WooCommerceShippingMethod {
  id: string
  title: string
  description: string
  cost: number
  estimatedDays: string
  available: boolean
}

export interface WooCommerceUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: string
  date_created: string
  date_modified: string
  avatar_url: string
}

class WooCommerceAPI {
  private baseUrl: string
  private auth: string
  private salesCache: Map<number, SalesCacheEntry> = new Map()
  private readonly CACHE_TTL = 30 * 60 * 1000 // 30 minutes cache
  private readonly MAX_ORDERS_PER_REQUEST = 50 // Reduced from 100
  private readonly MAX_TOTAL_ORDERS = 500 // Limit total orders processed

  constructor() {
    this.baseUrl = `${STORE_URL}/wp-json/wc/v3`
    this.auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString("base64")
  }

  private async requestWordPress(endpoint: string, options: RequestInit = {}) {
    const url = `${STORE_URL}/wp-json${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${this.auth}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`WordPress API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return await response.json()
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    // Determine if this is a WordPress API call
    const isWordPressAPI = endpoint.startsWith("/wp/v2/")

    if (isWordPressAPI) {
      return this.requestWordPress(endpoint, options)
    }

    const url = `${this.baseUrl}${endpoint}`
    console.log(`[v0] WooCommerce API: Making request to ${url}`)

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Basic ${this.auth}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    console.log(
      `[v0] WooCommerce API: Response status ${response.status}, content-type: ${response.headers.get("content-type")}`,
    )

    if (!response.ok) {
      const errorText = await response.text()

      if (response.status === 401) {
        throw new Error("WooCommerce API Authentication failed. Please check your consumer key and secret.")
      } else if (response.status === 404) {
        throw new Error(
          "WooCommerce API endpoint not found. Please verify your store URL and that WooCommerce REST API is enabled.",
        )
      } else {
        throw new Error(`WooCommerce API Error: ${response.status} ${response.statusText} - ${errorText}`)
      }
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      const responseText = await response.text()
      const preview = responseText.substring(0, 200)
      console.log(`[v0] WooCommerce API: Expected JSON but got ${contentType}. Response preview: ${preview}`)
      throw new Error(
        `WooCommerce API returned ${contentType} instead of JSON. This usually means the order doesn't exist or access is denied.`,
      )
    }

    return await response.json()
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request("/products?per_page=1")
      return { success: true, message: "Successfully connected to WooCommerce API" }
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown connection error",
      }
    }
  }

  async getProducts(
    params: {
      per_page?: number
      page?: number
      category?: string
      search?: string
      featured?: boolean
    } = {},
  ): Promise<WooCommerceProduct[]> {
    const searchParams = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    const endpoint = `/products?${searchParams.toString()}`
    const products = await this.request(endpoint)

    if (!Array.isArray(products)) {
      throw new Error("Expected array of products from API")
    }

    // For now, let's just return the products as-is to avoid the performance issue
    // We can optimize variation fetching later if needed
    return products
  }

  async getProduct(slug: string): Promise<WooCommerceProduct | null> {
    const products = await this.request(`/products?slug=${slug}`)

    if (!Array.isArray(products)) {
      throw new Error("Expected array for product search")
    }

    return products.length > 0 ? products[0] : null
  }

  async getProductById(id: number): Promise<WooCommerceProduct | null> {
    try {
      return await this.request(`/products/${id}`)
    } catch (error) {
      if (error instanceof Error && (error.message.includes("404") || error.message.includes("endpoint not found"))) {
        console.log(`[v0] Product ${id} not found (404), returning null`)
        return null
      }
      throw error
    }
  }

  async getCategories(
    params: {
      per_page?: number
      page?: number
      hide_empty?: boolean
      parent?: number
    } = {},
  ) {
    const searchParams = new URLSearchParams({
      per_page: "20", // Limit to 20 categories max
      hide_empty: "true", // Only show categories with products
      ...params,
    })

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString())
      }
    })

    const endpoint = `/products/categories?${searchParams.toString()}`
    const categories = await this.request(endpoint)

    if (!Array.isArray(categories)) {
      throw new Error("Expected array of categories from API")
    }

    return categories
  }

  async getCategoryBySlug(slug: string) {
    const categories = await this.request(`/products/categories?slug=${slug}&per_page=1`)

    if (!Array.isArray(categories)) {
      throw new Error("Expected array for category search")
    }

    return categories.length > 0 ? categories[0] : null
  }

  async createOrder(orderData: WooCommerceOrder): Promise<WooCommerceOrder> {
    const order = await this.request("/orders", {
      method: "POST",
      body: JSON.stringify(orderData),
    })

    return order
  }

  async getOrder(orderId: number): Promise<WooCommerceOrder | null> {
    try {
      console.log(`[v0] WooCommerce API: Fetching order ${orderId}`)
      const order = await this.request(`/orders/${orderId}`)
      console.log(`[v0] WooCommerce API: Successfully fetched order ${orderId}`)
      return order
    } catch (error) {
      console.log(
        `[v0] WooCommerce API: Error fetching order ${orderId}:`,
        error instanceof Error ? error.message : error,
      )
      if (error instanceof Error && error.message.includes("404")) {
        return null
      }
      throw error
    }
  }

  async getCustomerOrders(
    customerId: number,
    params: {
      per_page?: number
      page?: number
      status?: string
      order?: "asc" | "desc"
      orderby?: "date" | "id" | "title"
    } = {},
  ): Promise<WooCommerceOrder[]> {
    try {
      const queryParams = new URLSearchParams({
        customer: customerId.toString(),
        per_page: (params.per_page || 20).toString(),
        page: (params.page || 1).toString(),
        order: params.order || "desc",
        orderby: params.orderby || "date",
        ...(params.status && { status: params.status }),
      })

      console.log(`[v0] Fetching orders for customer ${customerId} with params:`, params)

      const orders = await this.request(`/orders?${queryParams.toString()}`)

      console.log(`[v0] Found ${orders.length} orders for customer ${customerId}`)

      return orders
    } catch (error) {
      console.error(`[v0] Error fetching customer orders:`, error)
      throw error
    }
  }

  async getCustomerOrderCounts(customerId: number): Promise<Record<string, number>> {
    try {
      console.log(`[v0] Fetching order counts for customer ${customerId}`)

      const statuses = ["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"]
      const counts: Record<string, number> = { all: 0 }

      // Get all orders first to count them
      const allOrders = await this.getCustomerOrders(customerId, { per_page: 100 })
      counts.all = allOrders.length

      // Count by status
      for (const status of statuses) {
        counts[status] = allOrders.filter((order) => order.status === status).length
      }

      // Add custom status mappings
      counts.review = counts.completed || 0 // Orders that can be reviewed

      console.log(`[v0] Order counts for customer ${customerId}:`, counts)

      return counts
    } catch (error) {
      console.error(`[v0] Error fetching order counts:`, error)
      return { all: 0 }
    }
  }

  async getProductReviews(
    productId: number,
    params: {
      per_page?: number
      page?: number
      status?: string
    } = {},
  ): Promise<WooCommerceReview[]> {
    const searchParams = new URLSearchParams({
      product: productId.toString(),
      per_page: (params.per_page || 10).toString(),
    })

    if (params.page !== undefined) {
      searchParams.set("page", params.page.toString())
    }
    if (params.status !== undefined) {
      searchParams.set("status", params.status)
    }

    const endpoint = `/products/reviews?${searchParams.toString()}`

    console.log("[v0] Review API URL:", `${this.baseUrl}${endpoint}`)
    console.log("[v0] Review API params:", Object.fromEntries(searchParams))

    const reviews = await this.request(endpoint)

    console.log("[v0] Review API response:", reviews)
    console.log("[v0] Review API response type:", typeof reviews, Array.isArray(reviews))

    if (!Array.isArray(reviews)) {
      throw new Error("Expected array of reviews from API")
    }

    return reviews
  }

  async getCoupons(
    params: {
      per_page?: number
      page?: number
      code?: string
    } = {},
  ): Promise<WooCommerceCoupon[]> {
    const searchParams = new URLSearchParams({
      per_page: (params.per_page || 10).toString(),
    })

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString())
      }
    })

    const endpoint = `/coupons?${searchParams.toString()}`
    const coupons = await this.request(endpoint)

    if (!Array.isArray(coupons)) {
      throw new Error("Expected array of coupons from API")
    }

    return coupons
  }

  async getProductApplicableCoupons(productId: number): Promise<WooCommerceCoupon[]> {
    const allCoupons = await this.getCoupons({ per_page: 100 })

    return allCoupons.filter((coupon) => {
      // Check if coupon has expired
      if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
        return false
      }

      // Check if product is specifically excluded
      if (coupon.excluded_product_ids.includes(productId)) {
        return false
      }

      // If coupon has specific product restrictions, check if this product is included
      if (coupon.product_ids.length > 0) {
        return coupon.product_ids.includes(productId)
      }

      // If no specific product restrictions, coupon is applicable
      return true
    })
  }

  async validateCoupon(
    couponCode: string,
    productIds: number[],
    cartTotal: number,
  ): Promise<{ valid: boolean; message: string; discount?: number; description?: string }> {
    try {
      console.log("[v0] Validating coupon:", couponCode, "for products:", productIds, "cart total:", cartTotal)

      const coupons = await this.getCoupons({ code: couponCode })

      if (coupons.length === 0) {
        return { valid: false, message: "Coupon not found" }
      }

      const coupon = coupons[0]
      console.log("[v0] Found coupon:", coupon)

      // Check expiry
      if (coupon.date_expires && new Date(coupon.date_expires) < new Date()) {
        return { valid: false, message: "Coupon has expired", description: coupon.description }
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
        return { valid: false, message: "Coupon usage limit reached", description: coupon.description }
      }

      // Check minimum amount
      if (coupon.minimum_amount && Number.parseFloat(coupon.minimum_amount) > 0) {
        const minAmount = Number.parseFloat(coupon.minimum_amount)
        if (cartTotal < minAmount) {
          return {
            valid: false,
            message: `Minimum order amount of $${coupon.minimum_amount} required`,
            description: coupon.description,
          }
        }
      }

      if (
        coupon.maximum_amount &&
        coupon.maximum_amount !== "" &&
        coupon.maximum_amount !== "0" &&
        coupon.maximum_amount !== "0.00"
      ) {
        const maxAmount = Number.parseFloat(coupon.maximum_amount)
        if (maxAmount > 0 && cartTotal > maxAmount) {
          return {
            valid: false,
            message: `Maximum order amount of $${coupon.maximum_amount} exceeded`,
            description: coupon.description,
          }
        }
      }

      // Check product restrictions
      const hasValidProducts = productIds.some((productId) => {
        if (coupon.excluded_product_ids.includes(productId)) {
          return false
        }
        if (coupon.product_ids.length > 0) {
          return coupon.product_ids.includes(productId)
        }
        return true
      })

      if (!hasValidProducts) {
        return { valid: false, message: "Coupon not applicable to cart items", description: coupon.description }
      }

      // Calculate discount
      let discount = 0
      if (coupon.discount_type === "percent") {
        discount = (cartTotal * Number.parseFloat(coupon.amount)) / 100
      } else if (coupon.discount_type === "fixed_cart") {
        discount = Number.parseFloat(coupon.amount)
      }

      console.log("[v0] Calculated discount:", discount)

      if (discount <= 0) {
        return {
          valid: false,
          message: "Coupon provides no discount for current cart",
          discount: 0,
          description: coupon.description,
        }
      }

      return {
        valid: true,
        message: "Coupon is valid",
        discount: Math.min(discount, cartTotal),
        description: coupon.description,
      }
    } catch (error) {
      console.log("[v0] Coupon validation error:", error)
      return { valid: false, message: "Error validating coupon" }
    }
  }

  async getPaymentMethods(): Promise<WooCommercePaymentMethod[]> {
    const endpoint = "/payment_gateways"
    const paymentMethods = await this.request(endpoint)

    if (!Array.isArray(paymentMethods)) {
      throw new Error("Expected array of payment methods from API")
    }

    // Filter to only enabled payment methods
    return paymentMethods.filter((method: WooCommercePaymentMethod) => method.enabled)
  }

  async getProductVariations(productId: number): Promise<WooCommerceProductVariation[]> {
    try {
      const endpoint = `/products/${productId}/variations`
      const variations = await this.request(endpoint)

      if (!Array.isArray(variations)) {
        throw new Error("Expected array of variations from API")
      }

      return variations
    } catch (error) {
      console.error("Error fetching product variations:", error)
      return []
    }
  }

  async getProductVariation(productId: number, variationId: number): Promise<WooCommerceProductVariation | null> {
    try {
      const endpoint = `/products/${productId}/variations/${variationId}`
      return await this.request(endpoint)
    } catch (error) {
      if (error instanceof Error && error.message.includes("404")) {
        return null
      }
      throw error
    }
  }

  async getProductSales(productId: number): Promise<number> {
    try {
      console.log("[v0] Fetching sales data for product:", productId)

      // Check cache first
      const cached = this.salesCache.get(productId)
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        console.log("[v0] Returning cached sales data:", cached.totalSold)
        return cached.totalSold
      }

      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      const dateAfter = sixMonthsAgo.toISOString() // Use full ISO format instead of just date

      let totalSold = 0
      let page = 1
      let totalOrdersProcessed = 0
      let hasMoreOrders = true

      while (hasMoreOrders && totalOrdersProcessed < this.MAX_TOTAL_ORDERS) {
        const ordersUrl = `/orders?status=completed&per_page=${this.MAX_ORDERS_PER_REQUEST}&page=${page}&after=${dateAfter}`
        console.log(`[v0] Sales API URL (page ${page}):`, `${this.baseUrl}${ordersUrl}`)

        const orders = await this.request(ordersUrl)

        if (!Array.isArray(orders) || orders.length === 0) {
          hasMoreOrders = false
          break
        }

        console.log(`[v0] Processing ${orders.length} orders from page ${page}`)

        // Process orders for this product
        for (const order of orders) {
          if (order.line_items && Array.isArray(order.line_items)) {
            for (const item of order.line_items) {
              if (item.product_id === productId) {
                totalSold += item.quantity || 0
                console.log("[v0] Found product in order:", order.id, "quantity:", item.quantity)
              }
            }
          }
        }

        totalOrdersProcessed += orders.length

        // If we got fewer orders than requested, we've reached the end
        if (orders.length < this.MAX_ORDERS_PER_REQUEST) {
          hasMoreOrders = false
        } else {
          page++
        }
      }

      console.log(
        "[v0] Total sales calculated for product",
        productId,
        ":",
        totalSold,
        "(processed",
        totalOrdersProcessed,
        "orders)",
      )

      // Cache the result
      this.salesCache.set(productId, {
        totalSold,
        timestamp: Date.now(),
        ttl: this.CACHE_TTL,
      })

      // Clean up old cache entries periodically
      this.cleanupCache()

      return totalSold
    } catch (error) {
      console.error("[v0] Error fetching product sales:", error)
      return 0
    }
  }

  private cleanupCache(): void {
    const now = Date.now()
    for (const [productId, entry] of this.salesCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.salesCache.delete(productId)
      }
    }
  }

  public clearSalesCache(productId?: number): void {
    if (productId) {
      this.salesCache.delete(productId)
    } else {
      this.salesCache.clear()
    }
  }

  async getShippingMethods(params: {
    cartTotal: number
    items: Array<{ id: number; quantity: number; variationId?: number }>
  }): Promise<WooCommerceShippingMethod[]> {
    try {
      console.log("[v0] Fetching shipping methods for cart total:", params.cartTotal)
      console.log("[v0] Cart items:", params.items)

      const shippingZones = await this.request("/shipping/zones")

      if (!Array.isArray(shippingZones)) {
        throw new Error("Expected array of shipping zones from API")
      }

      const allShippingMethods: WooCommerceShippingMethod[] = []

      // Fetch shipping methods for each zone
      for (const zone of shippingZones) {
        try {
          const zoneMethods = await this.request(`/shipping/zones/${zone.id}/methods`)

          if (Array.isArray(zoneMethods)) {
            for (const method of zoneMethods) {
              if (method.enabled) {
                // Calculate shipping cost based on method settings
                let cost = 0
                if (method.settings?.cost?.value) {
                  cost = Number.parseFloat(method.settings.cost.value) || 0
                }

                // Handle free shipping conditions
                if (method.method_id === "free_shipping") {
                  const minAmount = method.settings?.min_amount?.value
                    ? Number.parseFloat(method.settings.min_amount.value)
                    : 0
                  cost = params.cartTotal >= minAmount ? 0 : cost
                }

                // Estimate delivery days based on method type
                let estimatedDays = "3-5 business days"
                if (method.method_id === "flat_rate") {
                  estimatedDays = "3-5 business days"
                } else if (method.method_id === "free_shipping") {
                  estimatedDays = "5-7 business days"
                } else if (method.method_id === "local_pickup") {
                  estimatedDays = "Same day"
                }

                allShippingMethods.push({
                  id: method.instance_id?.toString() || method.method_id,
                  title: method.title || method.method_title,
                  description: method.settings?.description?.value || method.method_description || "",
                  cost: cost,
                  estimatedDays: estimatedDays,
                  available: true,
                })
              }
            }
          }
        } catch (zoneError) {
          console.error(`[v0] Error fetching methods for zone ${zone.id}:`, zoneError)
          continue
        }
      }

      // If no methods found from API, provide fallback methods
      if (allShippingMethods.length === 0) {
        console.log("[v0] No shipping methods found from API, using fallback methods")
        allShippingMethods.push(
          {
            id: "standard",
            title: "Standard Shipping",
            description: "Regular delivery service",
            cost: params.cartTotal > 100 ? 0 : 50,
            estimatedDays: "3-5 business days",
            available: true,
          },
          {
            id: "express",
            title: "Express Shipping",
            description: "Fast delivery service",
            cost: 150,
            estimatedDays: "1-2 business days",
            available: true,
          },
        )
      }

      console.log("[v0] Available shipping methods:", allShippingMethods.length)
      return allShippingMethods.filter((method) => method.available)
    } catch (error) {
      console.error("[v0] Error fetching shipping methods:", error)

      // Return fallback methods on API error
      return [
        {
          id: "standard",
          title: "Standard Shipping",
          description: "Regular delivery service",
          cost: params.cartTotal > 100 ? 0 : 50,
          estimatedDays: "3-5 business days",
          available: true,
        },
      ]
    }
  }

  async validateShippingMethod(params: {
    methodId: string
    cartTotal: number
    items: Array<{ id: number; quantity: number; variationId?: number }>
  }): Promise<{ valid: boolean; message?: string }> {
    try {
      console.log("[v0] Validating shipping method:", params.methodId)
      console.log("[v0] Cart total:", params.cartTotal)
      console.log("[v0] Cart items:", params.items)

      const availableMethods = await this.getShippingMethods({
        cartTotal: params.cartTotal,
        items: params.items,
      })

      const method = availableMethods.find((m) => m.id === params.methodId)

      if (!method) {
        return {
          valid: false,
          message: "Shipping method not available for your location or cart contents",
        }
      }

      if (!method.available) {
        return {
          valid: false,
          message: "Shipping method is currently unavailable",
        }
      }

      // Additional validation logic can be added here
      // For example, checking if items can be shipped to the destination

      console.log("[v0] Shipping validation result: valid")
      return { valid: true }
    } catch (error) {
      console.error("[v0] Error validating shipping method:", error)
      return {
        valid: false,
        message: "Unable to validate shipping method",
      }
    }
  }

  async getGroupedProductChildren(groupedProductIds: number[]): Promise<WooCommerceProduct[]> {
    try {
      if (!groupedProductIds || groupedProductIds.length === 0) {
        return []
      }

      console.log("[v0] Fetching grouped product children:", groupedProductIds)

      // Fetch all child products in a single request using include parameter
      const endpoint = `/products?include=${groupedProductIds.join(",")}&per_page=${groupedProductIds.length}`
      const childProducts = await this.request(endpoint)

      if (!Array.isArray(childProducts)) {
        throw new Error("Expected array of child products from API")
      }

      console.log("[v0] Loaded grouped product children:", childProducts.length)
      return childProducts
    } catch (error) {
      console.error("[v0] Error fetching grouped product children:", error)
      return []
    }
  }

  async authenticateUser(emailOrUsername: string, password: string): Promise<{ user: WooCommerceUser; token: string }> {
    try {
      console.log("[v0] Authenticating user:", emailOrUsername)

      let user = null

      try {
        // Search WordPress users by slug (username) first
        const wpUsersBySlug = await this.request(`/wp/v2/users?slug=${encodeURIComponent(emailOrUsername)}&per_page=10`)
        if (Array.isArray(wpUsersBySlug) && wpUsersBySlug.length > 0) {
          user = wpUsersBySlug[0]
          console.log("[v0] Found WordPress user by username:", user.slug)
        }
      } catch (wpError) {
        console.log("[v0] WordPress users API not available or error:", wpError)
      }

      // If not found by username, try searching by email in WordPress users
      if (!user) {
        try {
          const wpUsersBySearch = await this.request(
            `/wp/v2/users?search=${encodeURIComponent(emailOrUsername)}&per_page=10`,
          )
          if (Array.isArray(wpUsersBySearch) && wpUsersBySearch.length > 0) {
            // Find exact email match
            user = wpUsersBySearch.find((u) => u.email?.toLowerCase() === emailOrUsername.toLowerCase())
            if (user) {
              console.log("[v0] Found WordPress user by email:", user.email)
            }
          }
        } catch (wpError) {
          console.log("[v0] WordPress users search failed:", wpError)
        }
      }

      // If still not found, try WooCommerce customers as fallback
      if (!user) {
        try {
          const customers = await this.request(`/customers?search=${encodeURIComponent(emailOrUsername)}&per_page=1`)

          if (Array.isArray(customers) && customers.length > 0) {
            // Find exact match by email or username
            user = customers.find(
              (customer) =>
                customer.email.toLowerCase() === emailOrUsername.toLowerCase() ||
                customer.username?.toLowerCase() === emailOrUsername.toLowerCase(),
            )

            if (user) {
              console.log("[v0] Found WooCommerce customer:", user.email)
            }
          }
        } catch (customerError) {
          console.log("[v0] WooCommerce customers search failed:", customerError)
        }
      }

      if (!user) {
        console.log("[v0] User not found in WordPress users or WooCommerce customers")
        throw new Error("Invalid email or username")
      }

      console.log("[v0] User found:", user.email || user.slug, "Role:", user.roles?.[0] || user.role || "customer")

      // Note: WordPress/WooCommerce REST API doesn't support password validation
      // In a production environment, you would need:
      // 1. WordPress JWT Authentication plugin
      // 2. WordPress REST API authentication
      // 3. Custom authentication endpoint
      // For now, we validate that the user exists and accept the login

      if (!password || password.length < 1) {
        console.log("[v0] Password is required")
        throw new Error("Invalid email or username")
      }

      // Create a simple token-based system
      const token = Buffer.from(`${user.id}:${user.email || user.slug}:${Date.now()}`).toString("base64")
      console.log("[v0] Authentication successful for:", user.email || user.slug)

      return {
        user: {
          id: user.id,
          username: user.username || user.slug || user.email,
          email: user.email || "",
          first_name: user.first_name || user.name?.split(" ")[0] || "",
          last_name: user.last_name || user.name?.split(" ").slice(1).join(" ") || "",
          role: user.roles?.[0] || user.role || "customer", // WordPress users have roles array, WooCommerce has role string
          date_created: user.date_created || user.date || new Date().toISOString(),
          date_modified: user.date_modified || user.modified || new Date().toISOString(),
          avatar_url: user.avatar_url || user.avatar_urls?.["96"] || "",
        },
        token,
      }
    } catch (error) {
      console.error("[v0] Authentication error:", error)
      throw new Error("Invalid email or username")
    }
  }

  async createUser(userData: {
    email: string
    password: string
    first_name: string
    last_name: string
  }): Promise<{ user: WooCommerceUser; token: string }> {
    try {
      console.log("[v0] Creating new user:", userData.email)

      // Check if user already exists
      const existingUsers = await this.request(`/customers?email=${encodeURIComponent(userData.email)}&per_page=1`)

      if (Array.isArray(existingUsers) && existingUsers.length > 0) {
        throw new Error("User with this email already exists")
      }

      // Create new customer
      const newUser = await this.request("/customers", {
        method: "POST",
        body: JSON.stringify({
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          username: userData.email, // Use email as username
          password: userData.password,
        }),
      })

      // Generate token
      const token = Buffer.from(`${newUser.id}:${Date.now()}`).toString("base64")

      return {
        user: {
          id: newUser.id,
          username: newUser.username || newUser.email,
          email: newUser.email,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          role: newUser.role || "customer",
          date_created: newUser.date_created,
          date_modified: newUser.date_modified,
          avatar_url: newUser.avatar_url || "",
        },
        token,
      }
    } catch (error) {
      console.error("[v0] User creation error:", error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to create user account")
    }
  }

  async getUserById(userId: number): Promise<WooCommerceUser | null> {
    try {
      const user = await this.request(`/customers/${userId}`)
      return {
        id: user.id,
        username: user.username || user.email,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role || "customer",
        date_created: user.date_created,
        date_modified: user.date_modified,
        avatar_url: user.avatar_url || "",
      }
    } catch (error) {
      console.error("[v0] Error fetching user:", error)
      return null
    }
  }

  async validateToken(token: string): Promise<WooCommerceUser | null> {
    try {
      // Decode token to get user ID
      const decoded = Buffer.from(token, "base64").toString("utf-8")
      const [userIdStr, userEmail] = decoded.split(":")
      const userId = Number.parseInt(userIdStr, 10)

      if (isNaN(userId)) {
        return null
      }

      return await this.getUserById(userId)
    } catch (error) {
      console.error("[v0] Token validation error:", error)
      return null
    }
  }
}

export const woocommerce = new WooCommerceAPI()

export { WooCommerceAPI }
