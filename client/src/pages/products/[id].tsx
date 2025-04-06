import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Container, Heading, Text, Image, Button,
  SimpleGrid, Badge, Flex, VStack, HStack,
  useColorModeValue, Spinner, useToast, NumberInput,
  NumberInputField, NumberInputStepper, NumberIncrementStepper,
  NumberDecrementStepper, Divider
} from '@chakra-ui/react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { FaShoppingCart, FaHeart } from 'react-icons/fa';
import Link from 'next/link';

type Category = {
  _id: string;
  name: string;
  emoji: string;
  description?: string;
};

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  stock: number;
  status: 'available' | 'out_of_stock' | 'hidden';
  category: Category | string;
  createdAt: string;
};

const ProductDetail = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const { data: session } = useSession();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      try {
        setLoading(true);
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data);
      } catch (error) {
        console.error('商品データ取得エラー:', error);
        toast({
          title: 'エラーが発生しました',
          description: '商品データの取得に失敗しました',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        router.push('/products');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, router, toast]);

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value);
    if (product && numValue > 0 && numValue <= product.stock) {
      setQuantity(numValue);
    }
  };

  const handleAddToCart = async () => {
    if (!session) {
      toast({
        title: 'ログインが必要です',
        description: '商品をカートに追加するにはログインしてください',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      await axios.post('/api/cart', {
        productId: product?._id,
        quantity
      });

      toast({
        title: 'カートに追加しました',
        description: `${product?.name}を${quantity}個カートに追加しました`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('カート追加エラー:', error);
      toast({
        title: 'エラーが発生しました',
        description: 'カートへの追加に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" minH="60vh">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Flex>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <Container maxW="container.xl" py={8}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        {/* 商品画像 */}
        <Box>
          <Box position="relative" h="400px" mb={4}>
            <Image
              src={product.images[selectedImage] || '/placeholder-image.jpg'}
              alt={product.name}
              w="100%"
              h="100%"
              objectFit="cover"
              borderRadius="lg"
            />
            {product.status === 'out_of_stock' && (
              <Badge
                position="absolute"
                top={4}
                right={4}
                colorScheme="red"
                fontSize="lg"
                p={2}
              >
                在庫切れ
              </Badge>
            )}
          </Box>
          {product.images.length > 1 && (
            <SimpleGrid columns={4} spacing={2}>
              {product.images.map((image, index) => (
                <Box
                  key={index}
                  cursor="pointer"
                  borderWidth={2}
                  borderColor={selectedImage === index ? 'blue.500' : 'transparent'}
                  borderRadius="md"
                  overflow="hidden"
                  onClick={() => setSelectedImage(index)}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - 画像${index + 1}`}
                    w="100%"
                    h="80px"
                    objectFit="cover"
                  />
                </Box>
              ))}
            </SimpleGrid>
          )}
        </Box>

        {/* 商品情報 */}
        <VStack align="stretch" spacing={6}>
          <Box>
            <Heading as="h1" size="2xl" mb={2}>
              {product.name}
            </Heading>
            <Text color="gray.500" fontSize="lg">
              {typeof product.category === 'string' ? '未分類' : `${product.category.emoji} ${product.category.name}`}
            </Text>
          </Box>

          <Text fontSize="xl" fontWeight="bold" color="blue.500">
            {product.price.toLocaleString()}ポイント
          </Text>

          <Divider />

          <Text whiteSpace="pre-wrap">{product.description}</Text>

          <Box>
            <Text fontWeight="bold" mb={2}>在庫状況</Text>
            <Text color={product.stock > 0 ? 'green.500' : 'red.500'}>
              {product.stock > 0 ? `在庫あり (${product.stock}個)` : '在庫切れ'}
            </Text>
          </Box>

          {product.status === 'available' && (
            <Box>
              <Text fontWeight="bold" mb={2}>数量</Text>
              <NumberInput
                value={quantity}
                min={1}
                max={product.stock}
                onChange={handleQuantityChange}
                w="200px"
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </Box>
          )}

          <HStack spacing={4}>
            <Button
              leftIcon={<FaShoppingCart />}
              colorScheme="blue"
              size="lg"
              isDisabled={product.status !== 'available'}
              onClick={handleAddToCart}
            >
              カートに追加
            </Button>
            <Button
              leftIcon={<FaHeart />}
              variant="outline"
              size="lg"
            >
              お気に入り
            </Button>
          </HStack>

          {session?.user?.isAdmin && (
            <Box mt={4}>
              <Link href={`/admin/products/${product._id}/edit`} passHref>
                <Button as="a" colorScheme="yellow" variant="outline">
                  商品を編集
                </Button>
              </Link>
            </Box>
          )}
        </VStack>
      </SimpleGrid>
    </Container>
  );
};

export default ProductDetail; 