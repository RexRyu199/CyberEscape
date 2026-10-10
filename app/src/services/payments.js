import { initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import { API_URL_OVERRIDE } from '../config';

const host = Constants.expoConfig?.hostUri?.split(':')[0];
const API_URL = API_URL_OVERRIDE || (host ? `http://${host}:3000` : 'http://localhost:3000');

export const PACKS = [
  { id: 'p200', name: 'Paquete Recluta', credits: 200, price: '$20 MXN', note: 'Para empezar' },
  { id: 'p500', name: 'Paquete Operativo', credits: 500, price: '$40 MXN', note: '25% más créditos por peso' },
];
export const CHAPTER2_PRICE = '$49 MXN';

async function api(path, options) {
  try {
    const res = await fetch(`${API_URL}${path}`, options);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error del servidor');
    return data;
  } catch (e) {
    if (e.message === 'Network request failed') {
      throw new Error('No se pudo conectar con el servidor de pagos. Revisa tu conexión e inténtalo de nuevo.');
    }
    throw e;
  }
}

export async function buyProduct(productId) {
  const { paymentIntentClientSecret, paymentIntentId } = await api('/create-payment-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId }),
  });

  const init = await initPaymentSheet({
    merchantDisplayName: 'CyberEscape',
    paymentIntentClientSecret,
    style: 'alwaysDark',
  });
  if (init.error) throw new Error(init.error.message);

  const result = await presentPaymentSheet();
  if (result.error) {
    if (result.error.code === 'Canceled') throw new Error('CANCELED');
    throw new Error(result.error.message);
  }

  const check = await api(`/verify/${paymentIntentId}`);
  if (!check.paid) throw new Error('El pago no fue confirmado');

  return { paymentIntentId, type: check.type, credits: check.credits, chapter: check.chapter, amount: check.amount };
}