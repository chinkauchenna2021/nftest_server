// Authentication
// POST /api/auth/signup - Email/password signup

// POST /api/auth/login - Email/password login

// POST /api/auth/wallet - Wallet login/signup

// GET /api/auth/me - Get current user

// Users
// GET /api/users/:id - Get user profile

// PUT /api/users/:id - Update user profile

// GET /api/users/:id/nfts - Get user's NFTs

// GET /api/users/:id/purchases - Get user's purchased NFTs

// NFTs
// GET /api/nfts - Get all NFTs

// GET /api/nfts/:id - Get single NFT

// POST /api/nfts - Create NFT

// PUT /api/nfts/:id - Update NFT

// DELETE /api/nfts/:id - Delete NFT

// POST /api/nfts/:id/collections - Add collection to NFT

// POST /api/nfts/:id/sales - Record NFT sale

// GET /api/nfts/:id/sales/stats - Get NFT sales stats

// Admin
// GET /api/admin/users - Get all users (admin only)

// PUT /api/admin/users/:id/role - Update user role (admin only)

// DELETE /api/admin/users/:id - Delete user (admin only)

// GET /api/admin/nfts - Get all NFTs (admin only)

// DELETE /api/admin/nfts/:id - Delete NFT (admin override)

// GET /api/admin/stats - Get platform statistics (admin only)

// Notifications
// GET /api/notifications - Get user's notifications

// POST /api/notifications - Create notification

// PATCH /api/notifications/:id/read - Mark notification as read

// DELETE /api/notifications/:id - Delete notification

// Messages
// GET /api/messages - Get user's messages

// POST /api/messages - Create message to admin

// PATCH /api/messages/:id/read - Mark message as read (admin only)

// GET /api/messages/all - Get all messages (admin only)

// Yield
// GET /api/yield - Get all yield options

// POST /api/yield - Create yield option (admin only)

// PUT /api/yield/:id - Update yield option (admin only)

// DELETE /api/yield/:id - Delete yield option (admin only)