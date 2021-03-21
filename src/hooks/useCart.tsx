import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const findProduct = cart.find(
        (cartProduct) => productId === cartProduct.id
      );

      if (findProduct) {
        await updateProductAmount({
          productId,
          amount: findProduct.amount + 1,
        });
        return;
      }

      const stockResponse = await api.get<Stock>(`/stock/${productId}`);
      const stock = stockResponse.data;

      if (stock.amount >= 1) {
        const productResponse = await api.get<Product>(
          `/products/${productId}`
        );
        const product = productResponse.data;
        product.amount = 1;

        const updatedCart = [...cart, product];
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        toast.error("Quantidade solicitada fora de estoque");
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const findProductIndex = cart.findIndex(
        (cartProduct) => productId === cartProduct.id
      );

      if (findProductIndex >= 0) {
        const updatedCart = [...cart];
        updatedCart.splice(findProductIndex, 1);
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        toast.error("Erro na remoção do produto");
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount < 1) {
        return;
      }

      const findProductIndex = cart.findIndex(
        (cartProduct) => productId === cartProduct.id
      );

      const stockResponse = await api.get<Stock>(`/stock/${productId}`);
      const stock = stockResponse.data;

      if (stock.amount >= amount) {
        const updatedCart = [...cart];
        updatedCart[findProductIndex].amount = amount;
        setCart(updatedCart);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
      } else {
        toast.error("Quantidade solicitada fora de estoque");
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
