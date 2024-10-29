import axios from 'axios';
import { Establishment, Product } from '../types';

const API_BASE_URL = 'https://www.clicktodrink.es/api/v1';
const ESTABLISHMENT_ID = 'xxxx'; // Replace with your actual establishment ID

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const fetchEstablishment = async (): Promise<Establishment> => {
  const response = await apiClient.get(`/establishments/${ESTABLISHMENT_ID}`);
  return response.data;
};

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get(`/establishments/${ESTABLISHMENT_ID}/products`);
  return response.data;
};

export interface CreateOrderPayload {
  items: {
    productId: string;
    quantity: number;
    variants?: Record<string, string>;
  }[];
  zoneId: string;
}

export const createOrder = async (orderData: CreateOrderPayload) => {
  const response = await apiClient.post('/orders', orderData);
  return response.data;
};