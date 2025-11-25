/**
 * Builds a MongoDB query object from validated filter parameters
 *
 * @param {Object} filters - The validated query parameters from req.query
 * @returns {Object} MongoDB query object
 *
 * @example
 * const filters = { brand: 'Malabrigo', weight: 'Worsted', color: 'Blue' };
 * const query = buildQuery(filters);
 * // Returns: { brand: 'Malabrigo', weight: 'Worsted', color: 'Blue' }
 *
 * @example
 * const filters = { status: 'active', projectType: 'knitting' };
 * const query = buildQuery(filters);
 * // Returns: { status: 'active', projectType: 'knitting' }
 */
export function buildQuery(filters = {}) {
    const query = {};

    for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '') {
            query[key] = value;
        }
    }

    return query;
}
