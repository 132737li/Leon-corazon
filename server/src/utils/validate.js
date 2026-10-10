// Validation stricte : on n'accepte que des chaînes (empêche les injections NoSQL du type {"$ne": ""})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+()\-.\s]{5,30}$/;
const PHOTO_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/;
const IMAGE_PATH_RE = /^images\/[A-Za-z0-9_\-./ %]{1,250}$/;
const USERNAME_RE = /^[a-z0-9][a-z0-9._-]{2,29}$/;
const RESERVED_USERNAMES = ['admin', 'administrateur', 'administrator', 'root', 'support', 'berlly', 'boutique'];
const ORDER_ID_RE = /^CMD-[A-Za-z0-9-]{3,40}$/;

const isString = (v) => typeof v === 'string';

function clean(value, max) {
  if (!isString(value)) return '';
  return value.trim().slice(0, max);
}

function validEmail(value) {
  return isString(value) && value.length <= 254 && EMAIL_RE.test(value.trim());
}

function validUsername(value) {
  return isString(value) && USERNAME_RE.test(value.trim().toLowerCase());
}

function normalizeUsername(value) {
  return isString(value) ? value.trim().toLowerCase() : '';
}

function validPassword(value) {
  // bcrypt ignore tout ce qui dépasse 72 octets : on refuse plutôt que de tronquer en silence
  return isString(value) && value.length >= 8 && Buffer.byteLength(value, 'utf8') <= 72;
}

function validPhoto(value) {
  return isString(value) && value.length <= 300000 && PHOTO_RE.test(value);
}

module.exports = { USERNAME_RE, RESERVED_USERNAMES, validUsername, normalizeUsername, EMAIL_RE, PHONE_RE, PHOTO_RE, IMAGE_PATH_RE, ORDER_ID_RE, isString, clean, validEmail, validPassword, validPhoto };
