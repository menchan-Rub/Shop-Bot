import { useState, useEffect } from 'react';
import {
  Box, Container, Heading, Text, Button, VStack,
  HStack, Image, NumberInput, NumberInputField,
  NumberInputStepper, NumberIncrementStepper,
  NumberDecrementStepper, Divider, useToast,
  Spinner, Flex, Badge
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import { FaTrash } from 'react-icons/fa';

type CartItem = {
  _id: string;
  product: {
    _id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
    status: 'available' | 'out_of_stock' | 'hidden';
  };
  quantity: number;
};

const CartPage = () => {
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (session) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cart');
      setCartItems(response.data);
    } catch (error) {
      console.error('カート取得エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'カートの取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (itemId: string, value: string) => {
    const quantity = parseInt(value);
    if (quantity < 1) return;

    try {
      await axios.put(`/api/cart/${itemId}`, { quantity });
      fetchCart();
      toast({
        title: '数量を更新しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('数量更新エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '数量の更新に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      await axios.delete(`/api/cart/${itemId}`);
      fetchCart();
      toast({
        title: '商品を削除しました',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('商品削除エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '商品の削除に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="60vh">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Flex>
    );
  }

  if (!session) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Heading>ログインが必要です</Heading>
          <Text>カートを利用するにはログインしてください</Text>
          <Link href="/api/auth/signin" passHref>
            <Button as="a" colorScheme="blue">
              ログインする
            </Button>
          </Link>
        </VStack>
      </Container>
    );
  }

  if (cartItems.length === 0) {
    return (
      <Container maxW="container.md" py={8}>
        <VStack spacing={6} align="center">
          <Heading>カートは空です</Heading>
          <Text>商品を追加してからお買い物を続けてください</Text>
          <Link href="/products" passHref>
            <Button as="a" colorScheme="blue">
              商品一覧へ
            </Button>
          </Link>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="2xl" mb={4}>
            買い物かご
          </Heading>
          <Text color="gray.500">
            {cartItems.length}個の商品がカートに入っています
          </Text>
        </Box>

        <VStack spacing={4} align="stretch">
          {cartItems.map((item) => (
            <Box
              key={item._id}
              p={4}
              borderWidth="1px"
              borderRadius="lg"
              bg="white"
            >
              <HStack spacing={4} align="start">
                <Image
                  src={item.product.images[0] || '/placeholder-image.jpg'}
                  alt={item.product.name}
                  w="100px"
                  h="100px"
                  objectFit="cover"
                  borderRadius="md"
                />
                <Box flex="1">
                  <HStack justify="space-between" mb={2}>
                    <Text fontWeight="bold" fontSize="lg">
                      {item.product.name}
                    </Text>
                    <Button
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handleRemoveItem(item._id)}
                    >
                      <FaTrash />
                    </Button>
                  </HStack>
                  <Text color="blue.500" fontSize="lg" mb={2}>
                    {item.product.price.toLocaleString()}ポイント
                  </Text>
                  <HStack spacing={4}>
                    <NumberInput
                      value={item.quantity}
                      min={1}
                      max={item.product.stock}
                      onChange={(value) => handleQuantityChange(item._id, value)}
                      w="120px"
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <Text color="gray.500">
                      小計: {(item.product.price * item.quantity).toLocaleString()}ポイント
                    </Text>
                  </HStack>
                  {item.product.status === 'out_of_stock' && (
                    <Badge colorScheme="red" mt={2}>
                      在庫切れ
                    </Badge>
                  )}
                </Box>
              </HStack>
            </Box>
          ))}
        </VStack>

        <Divider />

        <Box>
          <HStack justify="space-between" mb={4}>
            <Text fontSize="xl" fontWeight="bold">
              合計
            </Text>
            <Text fontSize="xl" fontWeight="bold" color="blue.500">
              {calculateTotal().toLocaleString()}ポイント
            </Text>
          </HStack>
          <Link href="/checkout" passHref>
            <Button as="a" colorScheme="blue" size="lg" w="100%">
              購入手続きへ
            </Button>
          </Link>
        </Box>
      </VStack>
    </Container>
  );
};

export default CartPage; 