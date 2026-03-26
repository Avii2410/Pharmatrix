/**
 * Currency Utility for Pharmatrix
 * Localized for Indian Rupee (₹)
 */

/**
 * Formats a number into Indian Rupee (₹) currency format.
 * Examples: 12500 -> ₹12,500 | 450000 -> ₹4.5L
 * 
 * @param {number} value - The number to format
 * @param {object} options - Options for formatting
 * @param {boolean} options.short - Whether to use short format (K, L, Cr)
 * @param {number} options.decimals - Number of decimal places
 * @returns {string} - Formatted currency string
 */
export const formatCurrency = (value, { short = false, decimals = 1 } = {}) => {
  if (value === null || value === undefined || isNaN(value)) return '₹0';
  
  const num = Number(value);
  
  if (short) {
    if (num >= 10000000) { // Crores
      return `₹${(num / 10000000).toFixed(decimals)}Cr`;
    }
    if (num >= 100000) { // Lakhs
      return `₹${(num / 100000).toFixed(decimals)}L`;
    }
    if (num >= 1000) { // Thousands (K)
      return `₹${(num / 1000).toFixed(decimals)}k`;
    }
  }

  // standard locale formatting for India
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: decimals === 0 ? 0 : 2,
    minimumFractionDigits: 0
  }).format(num).replace('INR', '₹').trim();
};

export default formatCurrency;
