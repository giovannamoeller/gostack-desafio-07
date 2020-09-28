import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const products = await AsyncStorage.getItem('goMarketPlace@products');
      if(products) {
        setProducts(JSON.parse(products));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.find(item => item.id === product.id);

      if (productExists) {
        setProducts(
          products.map(p =>
            p.id === product.id ? { ...product, quantity: p.quantity + 1 } : p,
          ),
        );
      } else {
        setProducts(prevProducts => [
          ...prevProducts,
          { ...product, quantity: 1 },
        ]);
      }
      await AsyncStorage.setItem('goMarketPlace@products', JSON.stringify(products));
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProducts = products.map(p => p.id === id ? { ...p, quantity: p.quantity + 1 }: p)
      setProducts(newProducts);
      await AsyncStorage.setItem('goMarketPlace@products', JSON.stringify(products));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const findProduct = products.find(p => p.id === id);
      if(!findProduct) {
        setProducts(products)
      } 
      else {
        if(findProduct.quantity <= 1) {
            const deletedProduct = products.filter(p => p.id !== id);
            setProducts(deletedProduct);
        } else {
          const newProducts = products.map(p => p.id === id ? {...p, quantity: p.quantity - 1 } : p)
          setProducts(newProducts);
        }
      }
      await AsyncStorage.setItem('goMarketPlace@products', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
