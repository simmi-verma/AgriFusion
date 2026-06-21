/**
 * Checks if the user is the owner of the resource or an admin.
 * @param {ObjectId|string} resourceOwnerId The ID of the user who owns/created the resource
 * @param {object} user The currently logged-in user object from verifyToken middleware
 * @returns {boolean} True if the user is authorized, false otherwise
 */
function isOwnerOrAdmin(resourceOwnerId, user) {
  if (!resourceOwnerId || !user) return false;
  return resourceOwnerId.toString() === user.id || user.role === 'admin';
}

module.exports = {
  isOwnerOrAdmin
};
