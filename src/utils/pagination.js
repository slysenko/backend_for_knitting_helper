/**
 * Pagination utility for MongoDB queries
 * Provides consistent pagination across all services
 */

/**
 * Extract and validate pagination parameters from query string
 *
 * @param {Object} query - The query object (typically req.query)
 * @returns {Object} Pagination parameters { page, limit, skip }
 *
 * @example
 * const params = extractPaginationParams({ page: '2', limit: '10' });
 * // Returns: { page: 2, limit: 10, skip: 10 }
 */
export function extractPaginationParams(query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20)); // max 100, default 20
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

/**
 * Remove pagination parameters from query object
 * This prevents pagination params from being used in MongoDB filters
 *
 * @param {Object} query - The query object
 * @returns {Object} Query object without pagination params
 *
 * @example
 * const filters = removePaginationParams({ page: 1, limit: 20, status: 'active' });
 * // Returns: { status: 'active' }
 */
export function removePaginationParams(query = {}) {
    const { page, limit, ...rest } = query;
    return rest;
}

/**
 * Build pagination metadata for API responses
 *
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @returns {Object} Pagination metadata
 *
 * @example
 * const meta = buildPaginationMeta(2, 20, 95);
 * // Returns: { page: 2, limit: 20, total: 95, totalPages: 5, hasNext: true, hasPrev: true }
 */
export function buildPaginationMeta(page, limit, total) {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
    };
}

/**
 * Apply pagination to a Mongoose query and get results with metadata
 * This is the main function to use in services
 *
 * @param {Object} model - Mongoose model
 * @param {Object} query - MongoDB query object (without pagination params)
 * @param {Object} options - Pagination and query options
 * @param {number} options.page - Page number
 * @param {number} options.limit - Items per page
 * @param {number} options.skip - Items to skip
 * @param {Object|string} [options.sort] - Sort options (default: { updatedAt: -1 })
 * @param {string|Object} [options.populate] - Populate options
 * @param {string} [options.select] - Field selection
 * @returns {Promise<Object>} { data, pagination }
 *
 * @example
 * // In a service:
 * const result = await applyPagination(Project, query, {
 *   page: 1,
 *   limit: 20,
 *   skip: 0,
 *   populate: 'yarnsUsed.yarn',
 *   sort: { updatedAt: -1 }
 * });
 * // Returns: { data: [...], pagination: { page: 1, limit: 20, total: 95, ... } }
 */
export async function applyPagination(model, query, options = {}) {
    const {
        page,
        limit,
        skip,
        sort = { updatedAt: -1 },
        populate,
        select,
    } = options;

    const [data, total] = await Promise.all([
        model
            .find(query)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .populate(populate || '')
            .select(select || ''),
        model.countDocuments(query),
    ]);

    return {
        data,
        pagination: buildPaginationMeta(page, limit, total),
    };
}
