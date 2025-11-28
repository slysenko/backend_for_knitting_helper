/**
 * Reserved query parameters that should not be used in MongoDB filters
 * These are typically used for pagination, sorting, and other query modifiers
 */
const RESERVED_PARAMS = ['page', 'limit', 'sort', 'select', 'populate'];

/**
 * Builds a MongoDB query object from validated filter parameters
 * Automatically excludes pagination and other reserved parameters
 *
 * @param {Object} filters - The validated query parameters from req.query
 * @returns {Object} MongoDB query object
 *
 * @example
 * const filters = { brand: 'Malabrigo', yarnType: 'Worsted', color: 'Blue', page: 1, limit: 20 };
 * const query = buildQuery(filters);
 * // Returns: { brand: 'Malabrigo', yarnType: 'Worsted', color: 'Blue' }
 * // (page and limit are excluded)
 *
 * @example
 * const filters = { status: 'active', projectType: 'knitting' };
 * const query = buildQuery(filters);
 * // Returns: { status: 'active', projectType: 'knitting' }
 */
export function buildQuery(filters = {}) {
    const query = {};

    for (const [key, value] of Object.entries(filters)) {
        if (RESERVED_PARAMS.includes(key)) {
            continue;
        }

        if (value !== undefined && value !== null && value !== '') {
            query[key] = value;
        }
    }

    return query;
}
