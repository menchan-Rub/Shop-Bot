import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  VStack,
  HStack,
  Image as ChakraImage,
  useColorModeValue,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { FaDiscord, FaShoppingCart, FaShieldAlt, FaServer } from 'react-icons/fa';
import Link from 'next/link';
import Image from 'next/image';
import Layout from '@/components/Layout';

export default function HomePage() {
  const bgGradient = useColorModeValue(
    'linear(to-r, blue.50, purple.50)',
    'linear(to-r, blue.900, purple.900)'
  );

  return (
    <Layout>
      <Box>
        {/* ヒーローセクション */}
        <Box 
          bg={bgGradient} 
          pt={20} 
          pb={20}
        >
          <Container maxW="container.xl">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10} alignItems="center">
              <VStack spacing={6} align="flex-start">
                <Heading 
                  as="h1" 
                  size="2xl" 
                  fontWeight="bold"
                  lineHeight="shorter"
                >
                  Discord上で簡単に<br />
                  デジタル商品を販売
                </Heading>
                <Text fontSize="xl">
                  Discord Shopは、サーバー管理者がロールや特典を簡単に販売できるプラットフォームです。
                  シンプルな設定で、すぐに販売を開始できます。
                </Text>
                <HStack spacing={4} pt={4}>
                  <Link href="/auth/signin" passHref>
                    <Button 
                      size="lg" 
                      colorScheme="blue" 
                      leftIcon={<FaDiscord />}
                    >
                      Discordで始める
                    </Button>
                  </Link>
                  <Link href="/products" passHref>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      colorScheme="blue"
                    >
                      商品を見る
                    </Button>
                  </Link>
                </HStack>
              </VStack>
              <Box position="relative" width="100%" height="400px">
                <ChakraImage 
                  src="/images/placeholder-discord-shop.svg" 
                  alt="Discord Shopのイラスト"
                  fallbackSrc="/images/placeholder-discord-shop.svg"
                  objectFit="contain"
                />
              </Box>
            </SimpleGrid>
          </Container>
        </Box>

        {/* 特徴セクション */}
        <Container maxW="container.xl" py={20}>
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading as="h2" size="xl">サービスの特徴</Heading>
              <Text fontSize="lg" maxW="container.md">
                Discord Shopはサーバー管理者とメンバーの両方にメリットをもたらします。
                簡単な設定で収益化を始めましょう！
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={10}>
              <FeatureCard 
                icon={FaShoppingCart} 
                title="簡単な設定" 
                description="専門知識は不要。直感的なインターフェースで、数分で販売を開始できます。"
              />
              <FeatureCard 
                icon={FaShieldAlt} 
                title="安全な決済" 
                description="セキュアな決済処理。購入者と販売者の両方を保護します。"
              />
              <FeatureCard 
                icon={FaServer} 
                title="自動配送" 
                description="商品購入後、自動的にDiscordロールや特典が付与されます。"
              />
            </SimpleGrid>
          </VStack>
        </Container>

        {/* CTAセクション */}
        <Box bg={bgGradient} py={16}>
          <Container maxW="container.xl">
            <VStack spacing={8} textAlign="center">
              <Heading as="h2" size="xl">今すぐDiscord Shopを始めよう</Heading>
              <Text fontSize="lg" maxW="container.md">
                サーバーを収益化し、メンバーに特別な体験を提供しましょう。
                Discordアカウントでログインするだけで始められます。
              </Text>
              <Link href="/auth/signin" passHref>
                <Button 
                  size="lg" 
                  colorScheme="blue" 
                  leftIcon={<FaDiscord />}
                >
                  無料で始める
                </Button>
              </Link>
            </VStack>
          </Container>
        </Box>
      </Box>
    </Layout>
  );
}

// 特徴カードコンポーネント
interface FeatureCardProps {
  icon: React.ElementType;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.100', 'gray.700');

  return (
    <Box 
      p={8} 
      bg={bgColor} 
      borderRadius="lg" 
      borderWidth="1px" 
      borderColor={borderColor}
      boxShadow="md"
      transition="transform 0.3s"
      _hover={{ transform: 'translateY(-5px)' }}
    >
      <Flex direction="column" align="center" textAlign="center">
        <Icon as={icon} w={10} h={10} color="blue.500" mb={4} />
        <Heading as="h3" size="md" mb={4}>{title}</Heading>
        <Text>{description}</Text>
      </Flex>
    </Box>
  );
} 