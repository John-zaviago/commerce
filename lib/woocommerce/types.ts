// WooCommerce native types for direct usage

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
  productVariations?: WooCommerceVariation[]
}

export interface WooCommerceCategory {
  id: number
  name: string
  slug: string
  description: string
  parent: number
  count: number
  image?: {
    id: number
    src: string
    alt: string
  }
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
  discount_type: string
  description: string
  date_expires?: string
  usage_limit?: number
  usage_count: number
  individual_use: boolean
  product_ids: number[]
  excluded_product_ids: number[]
  usage_limit_per_user?: number
  limit_usage_to_x_items?: number
  free_shipping: boolean
  product_categories: number[]
  excluded_product_categories: number[]
  exclude_sale_items: boolean
  minimum_amount: string
  maximum_amount: string
  email_restrictions: string[]
  used_by: string[]
}

export interface WooCommerceUser {
  id: number
  date_created: string
  date_created_gmt: string
  date_modified: string
  date_modified_gmt: string
  email: string
  first_name: string
  last_name: string
  role: string
  username: string
  billing: {
    first_name: string
    last_name: string
    company: string
    address_1: string
    address_2: string
    city: string
    state: string
    postcode: string
    country: string
    email: string
    phone: string
  }
  shipping: {
    first_name: string
    last_name: string
    company: string
    address_1: string
    address_2: string
    city: string
    state: string
    postcode: string
    country: string
  }
  is_paying_customer: boolean
  avatar_url: string
  meta_data: Array<{
    id: number
    key: string
    value: string
  }>
}

export interface WooCommerceVariation {
  id: number
  date_created: string
  date_modified: string
  description: string
  permalink: string
  sku: string
  price: string
  regular_price: string
  sale_price: string
  date_on_sale_from?: string
  date_on_sale_to?: string
  on_sale: boolean
  status: string
  purchasable: boolean
  virtual: boolean
  downloadable: boolean
  downloads: any[]
  download_limit: number
  download_expiry: number
  tax_status: string
  tax_class: string
  manage_stock: boolean
  stock_quantity?: number
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
  image?: {
    id: number
    src: string
    alt: string
  }
  attributes: Array<{
    id: number
    name: string
    option: string
  }>
  menu_order: number
  meta_data: Array<{
    id: number
    key: string
    value: string
  }>
}

export interface WooCommerceShippingMethod {
  id: string
  title: string
  description: string
  enabled: boolean
  method_title: string
  method_description: string
  settings: Record<string, any>
}

export interface WooCommercePaymentMethod {
  id: string
  title: string
  description: string
  enabled: boolean
  method_title: string
  method_description: string
  settings: Record<string, any>
}
