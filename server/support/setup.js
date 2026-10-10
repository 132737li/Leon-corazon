// Environnement de test : modèles simulés en mémoire (aucune base MongoDB nécessaire)
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-test-secret-test-secret-1234';
process.env.BCRYPT_ROUNDS = '4';
process.env.CLIENT_ORIGINS = 'https://boutique.example';
process.env.CLIENT_URL = 'https://boutique.example/site';
process.env.ADMIN_USERNAME = 'patron';
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || '1000';
process.env.ADMIN_PASSWORD_HASH = require('bcryptjs').hashSync('MotDePasseAdmin-2026', 4);

const path = require('path');

let counter = 1;
const newId = () => (counter++).toString(16).padStart(24, '0');

function matches(doc, filter) {
  return Object.entries(filter).every(([key, cond]) => {
    if (cond && typeof cond === 'object' && '$gt' in cond) return doc[key] > cond.$gt;
    return String(doc[key]) === String(cond);
  });
}

function fakeModel({ unique = [], defaults = {} } = {}) {
  const store = [];

  class Doc {
    constructor(data) {
      Object.assign(this, defaults, data);
      this._id = newId();
      this.createdAt = new Date();
    }
    async save() {
      if (!store.includes(this)) store.push(this);
      return this;
    }
  }

  return {
    store,
    async create(data) {
      for (const key of unique) {
        if (store.some((d) => d[key] === data[key])) {
          const err = new Error('duplicate key');
          err.code = 11000;
          throw err;
        }
      }
      const doc = new Doc(data);
      store.push(doc);
      return doc;
    },
    findOne: async (filter) => store.find((d) => matches(d, filter)) || null,
    findById: async (id) => store.find((d) => String(d._id) === String(id)) || null,
    find(filter = {}) {
      const rows = store.filter((d) => matches(d, filter));
      const promise = Promise.resolve(rows);
      promise.sort = (spec) => {
        const [[key, dir]] = Object.entries(spec);
        return Promise.resolve([...rows].sort((a, b) => (dir < 0 ? b[key] - a[key] : a[key] - b[key])));
      };
      return promise;
    },
    async deleteOne(filter) {
      const i = store.findIndex((d) => matches(d, filter));
      if (i >= 0) store.splice(i, 1);
      return { deletedCount: i >= 0 ? 1 : 0 };
    },
  };
}

function stub(file, exports) {
  const resolved = require.resolve(path.join('..', 'src', file));
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
}

const User = fakeModel({ unique: ['email'], defaults: { name: '', phone: '', photo: '', resetTokenHash: '' } });
const Order = fakeModel({ unique: ['orderNumber'], defaults: { status: 'En attente', payment: '', transactionRef: '' } });
Order.STATUSES = ['En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];

const mails = [];
stub('models/User.js', User);
stub('models/Order.js', Order);
stub('utils/mailer.js', { sendMail: async (mail) => { mails.push(mail); } });

module.exports = { User, Order, mails };
