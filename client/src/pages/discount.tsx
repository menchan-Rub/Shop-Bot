import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Badge,
  Button,
  Divider,
  useClipboard,
  Flex,
  useToast,
  Alert,
  AlertIcon,
  HStack,
  Tooltip,
  Icon,
} from '@chakra-ui/react';
import { FaClipboard, FaClipboardCheck, FaCalendar, FaPercent, FaInfoCircle } from 'react-icons/fa';
import Layout from '@/components/Layout';
import Link from 'next/link';

// ダミーデータとして割引クーポンを定義
const coupons = [
  {
    id: 'WELCOME10',
    code: 'WELCOME10',
    discount: '10%',
    description: '初回購入の方限定の10%オフクーポン',
    expiry: '2023年12月31日',
    terms: '初回購入者のみ有効。他の割引との併用不可。',
    isLimited: false,
  },
  {
    id: 'SUMMER2023',
    code: 'SUMMER2023',
    discount: '15%',
    description: '夏季限定割引クーポン',
    expiry: '2023年8月31日',
    terms: '5,000円以上のご購入で有効。セール商品を除く。',
    isLimited: true,
  },
  {
    id: 'BUNDLE25',
    code: 'BUNDLE25',
    discount: '25%',
    description: '3点以上購入で使える特別割引',
    expiry: '2023年10月15日',
    terms: '3点以上のツールを同時購入する場合に適用。',
    isLimited: false,
  },
  {
    id: 'LOYAL2023',
    code: 'LOYAL2023',
    discount: '20%',
    description: 'リピーターの方限定特別割引',
    expiry: '2023年12月31日',
    terms: '過去に2回以上の購入履歴がある方のみ有効。',
    isLimited: true,
  },
];

// 季節限定割引情報
const seasonalDiscounts = [
  {
    title: 'ウィンターセール',
    period: '2023年12月1日〜2023年12月25日',
    description: '冬季限定で全商品15%オフ',
  },
  {
    title: 'ゴールデンウィークセール',
    period: '2023年4月29日〜2023年5月7日',
    description: '期間中、対象のツールが20%オフ',
  },
];

const DiscountPage = () => {
  const toast = useToast();
  
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const handleCopy = (code: string, id: string) => {
    // クリップボードにコピー処理をシミュレート
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      toast({
        title: 'クーポンコードをコピーしました',
        description: `${code}がクリップボードにコピーされました`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      // 3秒後にアイコンを元に戻す
      setTimeout(() => {
        setCopiedId(null);
      }, 3000);
    }).catch(() => {
      toast({
        title: 'コピーに失敗しました',
        description: 'もう一度お試しください',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    });
  };

  return (
    <Layout>
      <Container maxW="container.lg" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center" mb={6}>
            <Heading as="h1" size="xl" mb={4}>割引情報</Heading>
            <Text fontSize="lg" color="gray.500">
              お得な割引クーポンや期間限定セール情報をご紹介します
            </Text>
          </Box>

          <Alert status="info" borderRadius="md" mb={6}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">クーポンのご利用方法</Text>
              <Text>
                クーポンコードをコピーし、お会計時に指定の入力欄に貼り付けてください。一部のクーポンには利用条件があります。
              </Text>
            </Box>
          </Alert>

          <Box>
            <Heading as="h2" size="lg" mb={6}>現在有効なクーポン</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {coupons.map((coupon) => (
                <Box 
                  key={coupon.id}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  p={5}
                  boxShadow="sm"
                  transition="transform 0.3s, box-shadow 0.3s"
                  _hover={{ transform: 'translateY(-5px)', boxShadow: 'md' }}
                >
                  <Flex justify="space-between" align="center" mb={3}>
                    <Badge colorScheme="green" fontSize="0.9em" px={2} py={1} borderRadius="md">
                      {coupon.discount}オフ
                    </Badge>
                    {coupon.isLimited && (
                      <Badge colorScheme="red" fontSize="0.8em">
                        数量限定
                      </Badge>
                    )}
                  </Flex>
                  
                  <Heading as="h3" size="md" mb={2}>
                    {coupon.description}
                  </Heading>
                  
                  <HStack spacing={2} mb={3}>
                    <Icon as={FaCalendar} color="gray.500" />
                    <Text fontSize="sm" color="gray.500">
                      有効期限: {coupon.expiry}
                    </Text>
                  </HStack>
                  
                  <Text fontSize="sm" mb={4} color="gray.600">
                    {coupon.terms}
                  </Text>
                  
                  <Flex 
                    bg="gray.50" 
                    p={3} 
                    borderRadius="md" 
                    justify="space-between"
                    align="center"
                    mb={3}
                  >
                    <Text fontWeight="bold" letterSpacing="wide">
                      {coupon.code}
                    </Text>
                    <Button
                      size="sm"
                      leftIcon={copiedId === coupon.id ? <FaClipboardCheck /> : <FaClipboard />}
                      onClick={() => handleCopy(coupon.code, coupon.id)}
                      colorScheme={copiedId === coupon.id ? "green" : "blue"}
                    >
                      {copiedId === coupon.id ? "コピー済み" : "コピー"}
                    </Button>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          <Divider my={10} />

          <Box>
            <Heading as="h2" size="lg" mb={6}>期間限定セール</Heading>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
              {seasonalDiscounts.map((discount, index) => (
                <Box 
                  key={index}
                  borderWidth="1px"
                  borderRadius="lg"
                  overflow="hidden"
                  p={5}
                  boxShadow="sm"
                  bg="blue.50"
                >
                  <Heading as="h3" size="md" mb={3} color="blue.700">
                    {discount.title}
                  </Heading>
                  
                  <HStack spacing={2} mb={3}>
                    <Icon as={FaCalendar} color="blue.600" />
                    <Text fontSize="sm" fontWeight="medium" color="blue.600">
                      {discount.period}
                    </Text>
                  </HStack>
                  
                  <Text>{discount.description}</Text>
                  
                  <Flex mt={4} justify="flex-end">
                    <Link href="/products" passHref>
                      <Button size="sm" colorScheme="blue" variant="outline">
                        商品を見る
                      </Button>
                    </Link>
                  </Flex>
                </Box>
              ))}
            </SimpleGrid>
          </Box>

          <Divider my={10} />

          <Box>
            <Heading as="h2" size="lg" mb={6}>ボリュームディスカウント</Heading>
            <Box 
              borderWidth="1px"
              borderRadius="lg"
              overflow="hidden"
              p={6}
              boxShadow="sm"
            >
              <Text mb={4}>複数のツールをまとめて購入すると、自動的に以下の割引が適用されます：</Text>
              
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={6}>
                <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
                  <Flex justify="center" mb={2}>
                    <Icon as={FaPercent} boxSize={6} color="green.500" />
                  </Flex>
                  <Text fontWeight="bold" mb={1}>3製品購入</Text>
                  <Text color="green.500" fontSize="xl" fontWeight="bold">10% オフ</Text>
                </Box>
                
                <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
                  <Flex justify="center" mb={2}>
                    <Icon as={FaPercent} boxSize={6} color="green.500" />
                  </Flex>
                  <Text fontWeight="bold" mb={1}>5製品購入</Text>
                  <Text color="green.500" fontSize="xl" fontWeight="bold">15% オフ</Text>
                </Box>
                
                <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
                  <Flex justify="center" mb={2}>
                    <Icon as={FaPercent} boxSize={6} color="green.500" />
                  </Flex>
                  <Text fontWeight="bold" mb={1}>10製品以上</Text>
                  <Text color="green.500" fontSize="xl" fontWeight="bold">20% オフ</Text>
                </Box>
              </SimpleGrid>
              
              <Flex align="center" mb={4}>
                <Icon as={FaInfoCircle} color="blue.500" mr={2} />
                <Text fontStyle="italic">ボリューム割引は自動的に適用され、他のクーポンと併用できません。</Text>
              </Flex>
              
              <Flex justify="center" mt={2}>
                <Link href="/products" passHref>
                  <Button colorScheme="blue">
                    商品を見る
                  </Button>
                </Link>
              </Flex>
            </Box>
          </Box>

          <Alert status="warning" borderRadius="md" mt={6}>
            <AlertIcon />
            <Box>
              <Text fontWeight="bold">ご注意</Text>
              <Text>
                割引の適用条件やクーポンの有効期限は予告なく変更される場合があります。
                最新の情報については定期的にこのページをご確認ください。
              </Text>
            </Box>
          </Alert>
        </VStack>
      </Container>
    </Layout>
  );
};

export default DiscountPage; 