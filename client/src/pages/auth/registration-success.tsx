import React from 'react';
import { 
  Box, Button, Container, Heading, Text, VStack,
  useColorModeValue, Alert, AlertIcon, Icon
} from '@chakra-ui/react';
import Layout from '@/components/Layout';
import { FaCheckCircle, FaEnvelope } from 'react-icons/fa';
import Link from 'next/link';

export default function RegistrationSuccess() {
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
            <Icon as={FaCheckCircle} boxSize={16} color="green.500" />
            
            <Heading as="h1" size="xl" textAlign="center">
              登録完了
            </Heading>
            
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              アカウント登録が完了しました。
            </Alert>
            
            <VStack spacing={4}>
              <Text textAlign="center">
                ご登録いただいたメールアドレスに確認メールを送信しました。
                メール内のリンクをクリックして、アカウントを有効化してください。
              </Text>
              
              <Box p={4} bg="gray.50" borderRadius="md" w="full" _dark={{ bg: 'gray.700' }}>
                <VStack spacing={3} align="flex-start">
                  <Heading as="h3" size="sm">
                    次のステップ:
                  </Heading>
                  <Text fontSize="sm">
                    1. 確認メールを開く <Icon as={FaEnvelope} mx={1} />
                  </Text>
                  <Text fontSize="sm">
                    2. メール内のリンクをクリックしてアカウントを有効化
                  </Text>
                  <Text fontSize="sm">
                    3. 有効化後、ログインしてサービスをご利用いただけます
                  </Text>
                </VStack>
              </Box>
              
              <Text fontSize="sm" textAlign="center">
                メールが届かない場合は、迷惑メールフォルダをご確認いただくか、
                別のメールアドレスで再度登録をお試しください。
              </Text>
            </VStack>
            
            <Button
              as={Link}
              href="/auth/signin"
              colorScheme="blue"
              size="md"
              w="full"
              mt={4}
            >
              ログインページへ
            </Button>
            
            <Button
              as={Link}
              href="/"
              variant="ghost"
              size="sm"
              w="full"
            >
              トップページへ戻る
            </Button>
          </VStack>
        </Box>
      </Container>
    </Layout>
  );
} 