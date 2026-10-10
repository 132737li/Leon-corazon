const nodemailer = require('nodemailer');
const config = require('../config');

async function sendMail({ to, subject, text }) {
  if (!config.smtp.host) {
    // Pas de SMTP configuré (développement) : on affiche le message dans la console du serveur
    console.log(`\n[MAIL non envoyé - SMTP absent]\nÀ : ${to}\nObjet : ${subject}\n${text}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });

  await transporter.sendMail({ from: config.smtp.from, to, subject, text });
}

module.exports = { sendMail };
