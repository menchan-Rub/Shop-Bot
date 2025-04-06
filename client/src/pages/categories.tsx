import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  HStack,
  Tag,
  Image,
  LinkBox,
  LinkOverlay,
  Skeleton,
  Alert,
  AlertIcon,
  Flex,
  useColorModeValue,
} from '@chakra-ui/react';
import { FaTag } from 'react-icons/fa';
import axios from 'axios';
import Link from 'next/link';
import Layout from '@/components/Layout';

type Category = {
  _id: string;
  name: string;
  description: string;
  imageUrl: string;
  productCount: number;
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const cardBgColor = useColorModeValue('white', 'gray.700');
  const cardBorderColor = useColorModeValue('gray.200', 'gray.600');
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
        setCategories(response.data);
        setError(null);
      } catch (err) {
        console.error('カテゴリー取得エラー:', err);
        setError('カテゴリーの読み込み中にエラーが発生しました。再度お試しください。');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, i) => (
      <Box 
        key={i} 
        borderWidth="1px" 
        borderRadius="lg" 
        overflow="hidden" 
        bg={cardBgColor}
        borderColor={cardBorderColor}
        boxShadow="md"
        p={4}
      >
        <Skeleton height="150px" mb={4} />
        <Skeleton height="24px" width="70%" mb={2} />
        <Skeleton height="16px" mb={4} />
        <Skeleton height="20px" width="40%" />
      </Box>
    ));
  };

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={6}>
            <Heading as="h1" size="2xl" mb={4}>カテゴリー</Heading>
            <Text fontSize="xl" color="gray.500">
              ご希望のカテゴリーからお探しください
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {/* デモ用にデータが空の場合はダミーデータを表示 */}
          {!loading && categories.length === 0 && !error && (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={8}>
              {[
                { _id: '1', name: 'デザインテンプレート', description: 'ウェブサイト、SNS、印刷物など様々な用途に使えるデザインテンプレート', imageUrl: '/images/categories/design.jpg', productCount: 24 },
                { _id: '2', name: 'Discord Bot', description: 'サーバー管理、ゲーム、ユーティリティなど様々な機能を持つDiscord Bot', imageUrl: '/images/categories/bots.jpg', productCount: 18 },
                { _id: '3', name: 'イラスト素材', description: 'アバター、背景、絵文字などのデジタルイラスト素材', imageUrl: '/images/categories/illustrations.jpg', productCount: 32 },
                { _id: '4', name: '音楽・効果音', description: '創作活動やコンテンツ制作に使える音楽や効果音', imageUrl: '/images/categories/audio.jpg', productCount: 15 },
                { _id: '5', name: 'プログラミングツール', description: 'ウェブアプリ、ゲーム開発、自動化スクリプトなどのツール', imageUrl: '/images/categories/programming.jpg', productCount: 10 },
                { _id: '6', name: 'ゲーム素材', description: 'ゲーム開発に使えるキャラクター、背景、UI素材などのアセット', imageUrl: '/images/categories/game-assets.jpg', productCount: 28 },
              ].map((category) => (
                <LinkBox 
                  key={category._id} 
                  as="article" 
                  borderWidth="1px" 
                  borderRadius="lg" 
                  overflow="hidden"
                  transition="all 0.3s"
                  bg={cardBgColor}
                  borderColor={cardBorderColor}
                  boxShadow="md"
                  _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
                >
                  <Box position="relative" height="200px" overflow="hidden">
                    <Image 
                      src={category.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'} 
                      alt={category.name}
                      fallbackSrc="https://via.placeholder.com/400x200?text=No+Image"
                      objectFit="cover"
                      width="100%"
                      height="100%"
                    />
                  </Box>
                  <Box p={5}>
                    <Heading size="md" mb={2}>
                      <Link href={`/products?category=${category._id}`} passHref>
                        <LinkOverlay>{category.name}</LinkOverlay>
                      </Link>
                    </Heading>
                    <Text mb={4} noOfLines={2}>{category.description}</Text>
                    <Flex justify="space-between" align="center">
                      <HStack>
                        <FaTag />
                        <Text fontWeight="semibold">{category.productCount}件の商品</Text>
                      </HStack>
                      <Tag size="md" colorScheme="blue" borderRadius="full">
                        詳細を見る
                      </Tag>
                    </Flex>
                  </Box>
                </LinkBox>
              ))}
            </SimpleGrid>
          )}

          {loading ? (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={8}>
              {renderSkeletons()}
            </SimpleGrid>
          ) : (
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={8}>
              {categories.map((category) => (
                <LinkBox 
                  key={category._id} 
                  as="article" 
                  borderWidth="1px" 
                  borderRadius="lg" 
                  overflow="hidden"
                  transition="all 0.3s"
                  bg={cardBgColor}
                  borderColor={cardBorderColor}
                  boxShadow="md"
                  _hover={{ transform: 'translateY(-5px)', boxShadow: 'lg' }}
                >
                  <Box position="relative" height="200px" overflow="hidden">
                    <Image 
                      src={category.imageUrl || 'https://via.placeholder.com/400x200?text=No+Image'} 
                      alt={category.name}
                      fallbackSrc="https://via.placeholder.com/400x200?text=No+Image"
                      objectFit="cover"
                      width="100%"
                      height="100%"
                    />
                  </Box>
                  <Box p={5}>
                    <Heading size="md" mb={2}>
                      <Link href={`/products?category=${category._id}`} passHref>
                        <LinkOverlay>{category.name}</LinkOverlay>
                      </Link>
                    </Heading>
                    <Text mb={4} noOfLines={2}>{category.description}</Text>
                    <Flex justify="space-between" align="center">
                      <HStack>
                        <FaTag />
                        <Text fontWeight="semibold">{category.productCount}件の商品</Text>
                      </HStack>
                      <Tag size="md" colorScheme="blue" borderRadius="full">
                        詳細を見る
                      </Tag>
                    </Flex>
                  </Box>
                </LinkBox>
              ))}
            </SimpleGrid>
          )}
        </VStack>
      </Container>
    </Layout>
  );
};

export default CategoriesPage; 