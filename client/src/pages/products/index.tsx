import { useState, useEffect } from 'react';
import {
  Box, Container, SimpleGrid, Heading, Text, Badge,
  Flex, Image, Button, useColorModeValue, Spinner,
  Select, Input, HStack, VStack, useToast
} from '@chakra-ui/react';
import axios from 'axios';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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

const ProductsPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'name'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { data: session } = useSession();
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get('/api/products'),
          axios.get('/api/categories')
        ]);
        
        setProducts(productsRes.data.products);
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('データ取得エラー:', error);
        toast({
          title: 'エラーが発生しました',
          description: '商品データの取得に失敗しました',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const filteredProducts = products
    .filter(product => {
      const matchesCategory = !selectedCategory || 
        (typeof product.category === 'string' ? product.category === selectedCategory : product.category._id === selectedCategory);
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'createdAt':
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="2xl" mb={4}>
            商品一覧
          </Heading>
          <Text color="gray.500">
            高品質なデジタルコンテンツをお届けします
          </Text>
        </Box>

        <HStack spacing={4} wrap="wrap">
          <Select
            placeholder="カテゴリーで絞り込み"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            maxW="200px"
          >
            {categories.map((category) => (
              <option key={category._id} value={category._id}>
                {category.emoji} {category.name}
              </option>
            ))}
          </Select>

          <Input
            placeholder="商品を検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            maxW="300px"
          />

          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'price' | 'name')}
            maxW="150px"
          >
            <option value="createdAt">新着順</option>
            <option value="price">価格順</option>
            <option value="name">名前順</option>
          </Select>

          <Button
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
            size="sm"
          >
            {sortOrder === 'asc' ? '昇順' : '降順'}
          </Button>

          {session?.user?.isAdmin && (
            <Link href="/admin/products/new" passHref>
              <Button as="a" colorScheme="blue">
                新規商品追加
              </Button>
            </Link>
          )}
        </HStack>

        {loading ? (
          <Flex justify="center" align="center" minH="300px">
            <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
          </Flex>
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
            {filteredProducts.map((product) => (
              <Link href={`/products/${product._id}`} key={product._id} passHref>
                <Box
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  bg={cardBg}
                  borderColor={borderColor}
                  transition="transform 0.2s"
                  _hover={{ transform: 'translateY(-5px)' }}
                  cursor="pointer"
                >
                  <Box position="relative" h="200px">
                    <Image
                      src={product.images?.[0] || '/placeholder-image.jpg'}
                      alt={product.name}
                      w="100%"
                      h="100%"
                      objectFit="cover"
                    />
                    {product.status === 'out_of_stock' && (
                      <Badge
                        position="absolute"
                        top={2}
                        right={2}
                        colorScheme="red"
                      >
                        在庫切れ
                      </Badge>
                    )}
                  </Box>
                  <Box p={4}>
                    <Heading as="h3" size="md" mb={2} noOfLines={1}>
                      {product.name}
                    </Heading>
                    <Text color="gray.600" noOfLines={2} mb={2}>
                      {product.description}
                    </Text>
                    <Flex justify="space-between" align="center">
                      <Text fontWeight="bold" fontSize="lg">
                        {product.price.toLocaleString()}ポイント
                      </Text>
                      <Button size="sm" colorScheme="blue">
                        詳細を見る
                      </Button>
                    </Flex>
                  </Box>
                </Box>
              </Link>
            ))}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  );
};

export default ProductsPage; 