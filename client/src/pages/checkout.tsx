import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Container, Heading, Text, Button, VStack,
  HStack, Image, Divider, useToast, Spinner, Flex,
  Badge, FormControl, FormLabel, Input, Textarea,
  Checkbox, Alert, AlertIcon, AlertTitle, AlertDescription
} from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Link from 'next/link';
import { FaShoppingCart } from 'react-icons/fa';

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

type OrderForm = {
  discordId: string;
  note: string;
  agreeToTerms: boolean;
};

const CheckoutPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<OrderForm>({
    discordId: '',
    note: '',
    agreeToTerms: false
  });
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

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.agreeToTerms) {
      toast({
        title: '利用規約に同意してください',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);
      await axios.post('/api/orders', {
        items: cartItems.map(item => ({
          productId: item.product._id,
          quantity: item.quantity
        })),
        ...formData
      });

      toast({
        title: '注文が完了しました',
        description: 'ご注文ありがとうございます',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      router.push('/orders');
    } catch (error) {
      console.error('注文エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: '注文の処理に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
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
          <Text>購入手続きを続けるにはログインしてください</Text>
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
          <Text>商品を追加してから購入手続きを続けてください</Text>
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
            購入手続き
          </Heading>
          <Text color="gray.500">
            注文内容を確認し、必要事項を入力してください
          </Text>
        </Box>

        <Box as="form" onSubmit={handleSubmit}>
          <VStack spacing={8} align="stretch">
            {/* 注文内容 */}
            <Box>
              <Heading as="h2" size="md" mb={4}>
                注文内容
              </Heading>
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
                        w="80px"
                        h="80px"
                        objectFit="cover"
                        borderRadius="md"
                      />
                      <Box flex="1">
                        <Text fontWeight="bold" fontSize="lg">
                          {item.product.name}
                        </Text>
                        <Text color="gray.500">
                          数量: {item.quantity}個
                        </Text>
                        <Text color="blue.500">
                          {item.product.price.toLocaleString()}ポイント
                        </Text>
                      </Box>
                    </HStack>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Divider />

            {/* 注文情報 */}
            <Box>
              <Heading as="h2" size="md" mb={4}>
                注文情報
              </Heading>
              <VStack spacing={4} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Discord ID</FormLabel>
                  <Input
                    name="discordId"
                    value={formData.discordId}
                    onChange={handleInputChange}
                    placeholder="Discord IDを入力してください"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>備考</FormLabel>
                  <Textarea
                    name="note"
                    value={formData.note}
                    onChange={handleInputChange}
                    placeholder="備考があれば入力してください"
                    rows={4}
                  />
                </FormControl>

                <Checkbox
                  name="agreeToTerms"
                  isChecked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  colorScheme="blue"
                >
                  利用規約に同意する
                </Checkbox>
              </VStack>
            </Box>

            <Divider />

            {/* 合計金額 */}
            <Box>
              <HStack justify="space-between" mb={4}>
                <Text fontSize="xl" fontWeight="bold">
                  合計金額
                </Text>
                <Text fontSize="xl" fontWeight="bold" color="blue.500">
                  {calculateTotal().toLocaleString()}ポイント
                </Text>
              </HStack>

              <Alert status="info" mb={4}>
                <AlertIcon />
                <Box>
                  <AlertTitle>支払い方法について</AlertTitle>
                  <AlertDescription>
                    購入後、指定されたDiscord ID宛に支払い方法のご案内をお送りします。
                    支払いが完了次第、商品のダウンロード情報をお知らせいたします。
                  </AlertDescription>
                </Box>
              </Alert>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                w="100%"
                isLoading={submitting}
                leftIcon={<FaShoppingCart />}
              >
                注文を確定する
              </Button>
            </Box>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
};

export default CheckoutPage; 