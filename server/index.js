require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
app.use(cors());
app.use(express.json());

const PRODUCTS = {
  p200: { type: 'credits', credits: 200, amount: 2000 }, // $20.00 MXN
  p500: { type: 'credits', credits: 500, amount: 4000 }, // $40.00 MXN
  ch2: { type: 'chapter', chapter: 'ch2', amount: 4900 }, // $49.00 MXN
};

app.post('/create-payment-sheet', async (req, res) => {
  try {
    const product = PRODUCTS[req.body.productId];
    if (!product) return res.status(400).json({ error: 'Producto inválido' });

    const intent = await stripe.paymentIntents.create({
      amount: product.amount,
      currency: 'mxn',
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: {
        productId: req.body.productId,
        type: product.type,
        credits: String(product.credits ?? 0),
        chapter: product.chapter ?? '',
      },
    });

    res.json({ paymentIntentClientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// Confirma con Stripe que el pago de verdad se completó
app.get('/verify/:id', async (req, res) => {
  try {
    const intent = await stripe.paymentIntents.retrieve(req.params.id);
    if (intent.status !== 'succeeded') return res.json({ paid: false });
    const m = intent.metadata;
    res.json({
      paid: true,
      type: m.type,
      credits: Number(m.credits),
      chapter: m.chapter || null,
      amount: intent.amount,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3000, '0.0.0.0', () => console.log('Servidor de pagos en http://localhost:3000'));