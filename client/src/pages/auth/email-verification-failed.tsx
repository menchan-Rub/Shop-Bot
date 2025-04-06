import React from 'react';
import { 
  Box, Button, Container, Heading, Text, VStack,
  useColorModeValue, Alert, AlertIcon, Icon, Link as ChakraLink
} from '@chakra-ui/react';
import Layout from '@/components/Layout';
import { FaExclamationTriangle, FaEnvelope, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

export default function EmailVerificationFailed() {
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
          w="full"
          maxW="md"
          mx="auto"
        >
          <VStack spacing={6}>
            <Icon as={FaExclamationTriangle} boxSize={16} color="red.500" />
            
            <Heading as="h1" size="xl" textAlign="center">
              メール認証エラー
            </Heading>
            
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              メールアドレスの確認に失敗しました。
            </Alert>
            
            <Text textAlign="center">
              以下の理由により、メールアドレスの確認ができませんでした：
            </Text>
            
            <Box p={4} bg="gray.50" borderRadius="md" w="full" _dark={{ bg: 'gray.700' }}>
              <VStack spacing={3} align="flex-start">
                <Text fontSize="sm">
                  • 確認リンクの有効期限が切れている
                </Text>
                <Text fontSize="sm">
                  • 確認リンクがすでに使用されている
                </Text>
                <Text fontSize="sm">
                  • 確認リンクが無効または改ざんされている
                </Text>
              </VStack>
            </Box>
            
            <Text textAlign="center">
              新しい確認メールを送信するには、ログインページから「パスワードをお忘れですか？」を選択し、
              パスワードリセット手続きを行ってください。
            </Text>
            
            <VStack w="full" spacing={4}>
              <Button
                as={Link}
                href="/auth/forgot-password"
                colorScheme="blue"
                leftIcon={<FaEnvelope />}
                w="full"
              >
                パスワードリセットへ
              </Button>
              
              <Button
                as={Link}
                href="/auth/signin"
                variant="outline"
                leftIcon={<FaArrowLeft />}
                w="full"
              >
                ログインページへ戻る
              </Button>
              
              <Text fontSize="sm" textAlign="center">
                お問い合わせは
                <ChakraLink as={Link} href="/contact" color="blue.500" mx={1}>
                  こちら
                </ChakraLink>
                からお願いします。
              </Text>
            </VStack>
          </VStack>
        </Box>
      </Container>
    </Layout>
  );
} 