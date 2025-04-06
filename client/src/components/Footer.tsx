import React from 'react';
import {
  Box, Container, Stack, SimpleGrid, Text, Link, useColorModeValue, Heading
} from '@chakra-ui/react';
import { FaTwitter, FaYoutube, FaInstagram, FaDiscord } from 'react-icons/fa';
import NextLink from 'next/link';

const Footer = () => {
  return (
    <Box as="footer" bg="gray.50" color="gray.700" py={10} mt={10}>
      <Container maxW="container.xl">
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
          <Box>
            <Heading size="md" mb={4}>Discord Shop</Heading>
            <Text fontSize="sm">
              Discord上でデジタルコンテンツを販売・購入できる簡単でシンプルなマーケットプレイス
            </Text>
          </Box>
          
          <Box>
            <Heading size="md" mb={4}>サービス</Heading>
            <Stack spacing={2}>
              <Link as={NextLink} href="/products">商品一覧</Link>
              <Link as={NextLink} href="/categories">カテゴリー</Link>
              <Link as={NextLink} href="/about">サービス概要</Link>
              <Link as={NextLink} href="/faq">よくある質問</Link>
            </Stack>
          </Box>
          
          <Box>
            <Heading size="md" mb={4}>サポート</Heading>
            <Stack spacing={2}>
              <Link as={NextLink} href="/contact">お問い合わせ</Link>
              <Link as={NextLink} href="/returns">返品・交換</Link>
              <Link as={NextLink} href="/discord">Discordサーバー</Link>
              <Link as={NextLink} href="/discount">割引情報</Link>
            </Stack>
          </Box>
          
          <Box>
            <Heading size="md" mb={4}>法的情報</Heading>
            <Stack spacing={2}>
              <Link as={NextLink} href="/terms">利用規約</Link>
              <Link as={NextLink} href="/privacy">プライバシーポリシー</Link>
              <Link as={NextLink} href="/disclaimer">法的免責事項</Link>
              <Link as={NextLink} href="/sitemap">サイトマップ</Link>
            </Stack>
          </Box>
        </SimpleGrid>
        
        <Box borderTopWidth={1} borderStyle="solid" borderColor="gray.200" pt={8} mt={8} textAlign="center">
          <Text fontSize="sm">&copy; {new Date().getFullYear()} Discord Shop. All rights reserved.</Text>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 