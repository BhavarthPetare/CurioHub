// mongoose.isValidObjectId accepts any 12-char string, so check the hex form.
export const isObjectId = (value) => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

export const normalizeEmail = (value) =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
