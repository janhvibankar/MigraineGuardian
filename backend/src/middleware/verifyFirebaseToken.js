import { auth } from '../config/firebaseAdmin.js';

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Authorization header must be provided as "Bearer <Firebase_ID_Token>".',
        },
      });
    }

    const idToken = authHeader.split('Bearer ')[1]?.trim();

    if (!idToken) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Bearer token string is empty.',
        },
      });
    }

    if (!auth) {
      return res.status(500).json({
        error: {
          code: 'FIREBASE_NOT_CONFIGURED',
          message: 'Firebase Admin SDK is not properly configured on the server. Check server environment variables.',
        },
      });
    }

    // Verify token with Firebase Admin Auth
    const decodedToken = await auth.verifyIdToken(idToken);

    console.log('[Weather Debug] backend authenticated UID:', decodedToken.uid);

    // Attach decoded user info to express request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || null,
      picture: decodedToken.picture || null,
      ...decodedToken,
    };

    next();
  } catch (error) {
    console.error('[Auth Middleware] Firebase ID Token verification failed:', error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Firebase ID token has expired. Please refresh token on client.',
        },
      });
    }

    return res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or revoked Firebase ID token.',
        details: error.message,
      },
    });
  }
}
