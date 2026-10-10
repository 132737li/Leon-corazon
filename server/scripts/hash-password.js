// Usage : npm run hash-password -- "MonMotDePasse"
const bcrypt = require('bcryptjs');

const password = process.argv[2];
if (!password || password.length < 8) {
  console.error('Donne un mot de passe de 8 caractères minimum :  npm run hash-password -- "MonMotDePasse"');
  process.exit(1);
}
console.log('\nColle cette ligne dans ton .env (ou dans les variables Render) :\n');
console.log('ADMIN_PASSWORD_HASH=' + bcrypt.hashSync(password, 12));
console.log();
