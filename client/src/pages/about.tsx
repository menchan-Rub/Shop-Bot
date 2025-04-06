import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Image,
  Divider,
  List,
  ListItem,
  ListIcon,
} from '@chakra-ui/react';
import { FaCheckCircle } from 'react-icons/fa';
import Layout from '@/components/Layout';

const AboutPage = () => {
  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={10}>
            <Heading as="h1" size="2xl" mb={4}>会社概要</Heading>
            <Text fontSize="xl" color="gray.500">
              Discord Shopは高品質なデジタルコンテンツを提供する企業です
            </Text>
          </Box>

          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={10}>
            <Box>
              <Heading as="h2" size="lg" mb={4}>私たちのミッション</Heading>
              <Text fontSize="md" lineHeight="tall">
                Discord Shopは、クリエイターとユーザーを結ぶプラットフォームとして2023年に設立されました。
                私たちは、高品質なデジタルコンテンツを手頃な価格で提供することで、
                クリエイターの才能を広め、ユーザーの創造性を高めることを目指しています。
              </Text>
              <Divider my={6} />
              <Heading as="h3" size="md" mb={4}>企業理念</Heading>
              <List spacing={3}>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  クリエイターの権利を尊重し、適正な報酬を提供する
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  ユーザーにとって使いやすく、安全なプラットフォームを維持する
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  常に革新的なサービスの開発に取り組む
                </ListItem>
                <ListItem>
                  <ListIcon as={FaCheckCircle} color="green.500" />
                  コミュニティを大切にし、ユーザーの声に耳を傾ける
                </ListItem>
              </List>
            </Box>
            <Box>
              <Heading as="h2" size="lg" mb={4}>会社情報</Heading>
              <VStack align="start" spacing={4}>
                <Box>
                  <Text fontWeight="bold">会社名</Text>
                  <Text>Discord Shop株式会社</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">設立</Text>
                  <Text>2023年4月1日</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">代表取締役</Text>
                  <Text>山田 太郎</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">資本金</Text>
                  <Text>1,000万円</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">所在地</Text>
                  <Text>〒107-0062 東京都港区南青山1-2-3 ディスコードビル5F</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold">事業内容</Text>
                  <Text>・デジタルコンテンツの販売</Text>
                  <Text>・オンラインマーケットプレイスの運営</Text>
                  <Text>・ウェブサービス開発</Text>
                </Box>
              </VStack>
            </Box>
          </SimpleGrid>

          <Box mt={12}>
            <Heading as="h2" size="lg" mb={6} textAlign="center">沿革</Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                <Heading as="h3" size="md" mb={2}>創業期</Heading>
                <Text>2023年4月の創業から、少人数のチームでサービス開発をスタート。Discord Bot を活用した独自のプラットフォームを構築。</Text>
              </Box>
              <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                <Heading as="h3" size="md" mb={2}>成長期</Heading>
                <Text>2023年7月にベータ版をリリース。最初の1000ユーザーを獲得し、クリエイターコミュニティの形成に成功。</Text>
              </Box>
              <Box p={5} shadow="md" borderWidth="1px" borderRadius="md">
                <Heading as="h3" size="md" mb={2}>現在</Heading>
                <Text>2024年、月間アクティブユーザー10,000人を突破。多様なデジタルコンテンツを取り扱い、成長を続けています。</Text>
              </Box>
            </SimpleGrid>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
};

export default AboutPage; 