import { useRouter } from 'next/router';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';
import Layout from '@/components/Layout';

const errors: Record<string, { title: string; message: string }> = {
  default: {
    title: '認証エラーが発生しました',
    message: 'ログイン処理中に問題が発生しました。もう一度お試しください。',
  },
  configuration: {
    title: '設定エラー',
    message: 'サーバー側の設定に問題があります。管理者にお問い合わせください。',
  },
  accessdenied: {
    title: 'アクセスが拒否されました',
    message: 'ログインが拒否されました。権限が不足している可能性があります。',
  },
  verification: {
    title: '認証エラー',
    message: 'ログインリンクが無効か期限切れです。もう一度ログインしてください。',
  },
};

export default function AuthError() {
  const router = useRouter();
  const { error } = router.query;
  const errorType = typeof error === 'string' ? error.toLowerCase() : 'default';
  
  const errorInfo = errors[errorType] || errors.default;
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  return (
    <Layout>
      <Container maxW="container.md" py={10}>
        <Box
          bg={bgColor}
          p={8}
          borderRadius="lg"
          shadow="md"
          borderWidth="1px"
          borderColor={borderColor}
          maxW="md"
          mx="auto"
        >
          <VStack spacing={6}>
            <Icon as={FaExclamationTriangle} color="red.500" boxSize={12} />
            <Heading as="h1" size="xl" textAlign="center">
              {errorInfo.title}
            </Heading>
            <Text textAlign="center">{errorInfo.message}</Text>
            <Button
              leftIcon={<Icon as={FaArrowLeft} />}
              onClick={() => router.push('/auth/signin')}
              colorScheme="blue"
            >
              ログイン画面に戻る
            </Button>
          </VStack>
        </Box>
      </Container>
    </Layout>
  );
} 