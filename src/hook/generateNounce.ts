import crypto from 'crypto'

export const generateServerNonce = () => {
    return crypto.randomBytes(16).toString('hex');
  };