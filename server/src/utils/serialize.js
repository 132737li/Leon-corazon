// Ce qui sort de l'API : jamais de hash de mot de passe, jamais d'_id Mongo brut.
// Les noms de champs (id, date, cart...) sont ceux que ton site utilise déjà.

function serializeUser(u) {
  return {
    id: String(u._id),
    username: u.username || '',
    name: u.name || '',
    email: u.email,
    phone: u.phone || '',
    photo: u.photo || '',
    createdAt: u.createdAt,
  };
}

function serializeOrder(o) {
  return {
    id: o.orderNumber,
    userId: o.user ? String(o.user) : null,
    email: o.email,
    name: o.name,
    phone: o.phone,
    address: o.address,
    cart: (o.cart || []).map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, image: i.image || '' })),
    total: o.total,
    payment: o.payment || '',
    transactionRef: o.transactionRef || '',
    status: o.status,
    date: o.createdAt,
  };
}

module.exports = { serializeUser, serializeOrder };
