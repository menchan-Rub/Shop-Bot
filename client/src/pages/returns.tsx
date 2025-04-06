import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  UnorderedList,
  ListItem,
  Alert,
  AlertIcon,
  OrderedList,
  Divider,
  Button,
  Flex,
} from '@chakra-ui/react';
import Link from 'next/link';
import Layout from '@/components/Layout';

const ReturnsPage = () => {
  return (
    <Layout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={6}>
            <Heading as="h1" size="xl" mb={4}>返品・交換について</Heading>
            <Text fontSize="lg" color="gray.500">
              デジタルコンテンツの返品・交換に関するポリシー
            </Text>
          </Box>

          <Alert status="info" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">デジタルコンテンツの特性について</Text>
              <Text>
                当ショップで販売している商品はデジタルコンテンツであり、データの性質上、基本的に返品・返金はお受けしておりません。
                商品購入前に商品詳細ページの説明をよくお読みいただき、ご不明点はお問い合わせください。
              </Text>
            </Box>
          </Alert>

          <Box>
            <Heading as="h2" size="lg" mb={4}>返金ポリシー</Heading>
            <Text mb={4}>
              以下の場合に限り、返金対応が可能です。返金をご希望の場合は、お問い合わせフォームより詳細な状況をお知らせください。
            </Text>
            <OrderedList spacing={3} pl={6}>
              <ListItem>
                <Text fontWeight="bold">商品の不具合</Text>
                <Text>
                  商品に重大な不具合があり、本来の機能が使用できない場合。不具合の詳細と、可能であればスクリーンショットなどの証拠をご提供ください。
                </Text>
              </ListItem>
              <ListItem>
                <Text fontWeight="bold">誤った商品の提供</Text>
                <Text>
                  注文と異なる商品が提供された場合。具体的にどの商品を注文し、どの商品が提供されたかを明記してください。
                </Text>
              </ListItem>
              <ListItem>
                <Text fontWeight="bold">重複購入</Text>
                <Text>
                  同一アカウントで同じ商品を誤って重複購入された場合（購入から7日以内に申請が必要です）。
                </Text>
              </ListItem>
              <ListItem>
                <Text fontWeight="bold">商品説明との著しい相違</Text>
                <Text>
                  商品の説明と実際の内容に著しい相違がある場合。具体的にどのような相違があるかを明記してください。
                </Text>
              </ListItem>
            </OrderedList>
          </Box>

          <Divider />

          <Box>
            <Heading as="h2" size="lg" mb={4}>返金対象外となる場合</Heading>
            <Text mb={4}>
              以下の場合は原則として返金対応はいたしかねます。
            </Text>
            <UnorderedList spacing={3} pl={6}>
              <ListItem>購入後の気持ちの変化や単なる購入の後悔</ListItem>
              <ListItem>商品の使用方法がわからない、または使い方が難しいと感じた場合（サポートをご利用ください）</ListItem>
              <ListItem>購入前に明示されていた動作環境や必要条件を満たしていない場合</ListItem>
              <ListItem>購入から30日以上経過した商品</ListItem>
              <ListItem>すでに商品を使用・ダウンロードした場合（不具合などの正当な理由がある場合を除く）</ListItem>
              <ListItem>商品説明に記載されている内容と実際の商品に大きな違いがない場合</ListItem>
            </UnorderedList>
          </Box>

          <Divider />

          <Box>
            <Heading as="h2" size="lg" mb={4}>返金手続きの流れ</Heading>
            <OrderedList spacing={3} pl={6}>
              <ListItem>
                <Text>
                  お問い合わせフォームから返金申請を行ってください。その際、注文番号、購入日、返金を希望する理由を明記してください。
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  当社スタッフが申請内容を確認し、必要に応じて追加情報をお願いする場合があります。
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  審査の結果、返金が認められた場合は、原則として購入時と同じ決済方法で返金いたします。
                </Text>
              </ListItem>
              <ListItem>
                <Text>
                  返金処理には、申請承認後5〜10営業日程度かかる場合があります。
                </Text>
              </ListItem>
            </OrderedList>
          </Box>

          <Divider />

          <Box>
            <Heading as="h2" size="lg" mb={4}>アップデートと修正</Heading>
            <Text mb={4}>
              当社では、販売後の商品についても継続的な品質向上に努めています。不具合が発見された場合は修正アップデートを提供し、商品の質の維持・向上に取り組んでいます。
              商品に関する問題やご提案は、まずはお問い合わせフォームからご連絡ください。すぐに返金を求める前に、問題解決の可能性をご確認いただければ幸いです。
            </Text>
          </Box>

          <Divider />

          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">ご注意</Text>
              <Text>
                返金ポリシーは予告なく変更される場合があります。返金申請時点での最新のポリシーが適用されます。
              </Text>
            </Box>
          </Alert>

          <Flex justifyContent="center" mt={6}>
            <Link href="/contact" passHref>
              <Button colorScheme="blue" size="lg">
                お問い合わせ
              </Button>
            </Link>
          </Flex>
        </VStack>
      </Container>
    </Layout>
  );
};

export default ReturnsPage; 