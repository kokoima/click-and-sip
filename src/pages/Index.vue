<template>
  <div class="min-h-screen pb-20">
    <Header v-if="establishment" :establishment="establishment" />
    
    <main class="container mx-auto px-4 mt-6">
      <div v-if="isLoading" class="text-center py-8">
        Loading...
      </div>
      
      <div v-else-if="error" class="text-center py-8 text-red-500">
        {{ error }}
      </div>
      
      <div v-else class="w-full">
        <nav class="flex space-x-2 overflow-x-auto">
          <button
            v-for="category in categories"
            :key="category"
            class="px-4 py-2 rounded-md"
            :class="{
              'bg-primary text-white': selectedCategory === category,
              'bg-muted': selectedCategory !== category
            }"
            @click="selectedCategory = category"
          >
            {{ category }}
          </button>
        </nav>

        <div class="product-grid mt-6">
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
            :quantity="getProductQuantity(product)"
            @quantity-change="handleQuantityChange"
          />
        </div>
      </div>
    </main>

    <Cart 
      :items="cartItems" 
      @checkout="handleCheckout" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useToast } from '../composables/useToast';
import Header from '../components/Header.vue';
import ProductCard from '../components/ProductCard.vue';
import Cart from '../components/Cart.vue';
import { fetchEstablishment, fetchProducts, createOrder } from '../lib/api-client';
import type { CartItem, Product, Establishment } from '../types';

const { toast } = useToast();

const establishment = ref<Establishment | null>(null);
const products = ref<Product[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);
const cartItems = ref<CartItem[]>([]);
const selectedCategory = ref('');

// Fetch initial data
onMounted(async () => {
  try {
    const [establishmentData, productsData] = await Promise.all([
      fetchEstablishment(),
      fetchProducts()
    ]);
    
    establishment.value = establishmentData;
    products.value = productsData;
    
    if (productsData.length > 0) {
      selectedCategory.value = productsData[0].category;
    }
  } catch (err) {
    error.value = 'Failed to load data. Please try again later.';
    console.error('Error loading data:', err);
  } finally {
    isLoading.value = false;
  }
});

const categories = computed(() => 
  Array.from(new Set(products.value.map(p => p.category)))
);

const filteredProducts = computed(() => 
  products.value.filter(p => p.category === selectedCategory.value)
);

const getProductQuantity = (product: Product) => {
  const item = cartItems.value.find(item => item.product.id === product.id);
  return item?.quantity || 0;
};

const handleQuantityChange = (
  product: Product,
  quantity: number,
  variants?: Record<string, string>
) => {
  const index = cartItems.value.findIndex(
    item => 
      item.product.id === product.id &&
      JSON.stringify(item.selectedVariants) === JSON.stringify(variants)
  );

  if (index >= 0) {
    if (quantity === 0) {
      cartItems.value.splice(index, 1);
    } else {
      cartItems.value[index].quantity = quantity;
    }
  } else if (quantity > 0) {
    cartItems.value.push({ product, quantity, selectedVariants: variants });
  }
};

const handleCheckout = async () => {
  try {
    const orderData = {
      items: cartItems.value.map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        variants: item.selectedVariants
      })),
      zoneId: 'pickup' // You might want to make this configurable
    };

    await createOrder(orderData);
    
    toast({
      title: "Order Placed!",
      description: "Your drinks will be ready soon.",
    });
    
    cartItems.value = [];
  } catch (err) {
    toast({
      title: "Error",
      description: "Failed to place order. Please try again.",
    });
    console.error('Error creating order:', err);
  }
};
</script>

<style scoped>
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}
</style>