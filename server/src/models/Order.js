const mongoose = require('mongoose');

const STATUSES = ['En attente', 'Confirmée', 'Expédiée', 'Livrée', 'Annulée'];

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1, max: 99 },
    image: { type: String, default: '', maxlength: 300 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    email: { type: String, required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 30 },
    address: { type: String, required: true, trim: true, maxlength: 300 },
    cart: { type: [itemSchema], validate: (v) => v.length > 0 },
    total: { type: Number, required: true, min: 0 },
    payment: { type: String, default: '', maxlength: 80 },
    transactionRef: { type: String, default: '', maxlength: 80 },
    status: { type: String, enum: STATUSES, default: 'En attente' },
  },
  { timestamps: true }
);

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
Order.STATUSES = STATUSES;

module.exports = Order;
