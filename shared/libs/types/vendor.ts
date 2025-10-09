/**
 * Vendor quote interfaces for normalized vendor integration
 */

/**
 * Normalized vendor quote interface
 * Provides a common structure for quotes from different vendors
 */
export interface VendorQuote {
  /** Unique identifier for this quote */
  quoteId: string;

  /** Vendor providing the quote (e.g., 'mouser', 'digikey') */
  vendor: string;

  /** Part number from the vendor */
  vendorPartNumber: string;

  /** Manufacturer part number */
  manufacturerPartNumber?: string;

  /** Manufacturer name */
  manufacturer?: string;

  /** Description of the part */
  description?: string;

  /** Unit price in USD */
  unitPrice: number;

  /** Minimum order quantity */
  minimumOrderQuantity: number;

  /** Available quantity in stock */
  availableQuantity: number;

  /** Lead time in days */
  leadTimeDays?: number;

  /** Currency code (default: USD) */
  currency: string;

  /** Last updated timestamp */
  lastUpdated: string;

  /** Additional vendor-specific data */
  vendorData?: Record<string, unknown>;
}