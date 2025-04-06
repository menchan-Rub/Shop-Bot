import React from 'react';
import { 
  Box, Button, Container, Heading, Text, VStack,
  useColorModeValue, Alert, AlertIcon, Icon
} from '@chakra-ui/react';
import Layout from '@/components/Layout';
import { FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function EmailVerificationSuccess() {
  const { data: session } = useSession();
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
              メール認証完了
            </Heading>
            
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              メールアドレスの確認が完了しました。
            </Alert>
            
            <Text textAlign="center">
              ご登録いただいたメールアドレスの確認が完了しました。
              これでアカウントが有効化され、すべての機能をご利用いただけます。
            </Text>
            
            {session ? (
              <VStack w="full" spacing={4}>
                <Button
                  as={Link}
                  href="/profile"
                  colorScheme="blue"
                  rightIcon={<FaArrowRight />}
                  w="full"
                >
                  マイページへ
                </Button>
                
                <Button
                  as={Link}
                  href="/"
                  variant="ghost"
                  size="sm"
                  w="full"
                >
                  トップページへ
                </Button>
              </VStack>
            ) : (
              <VStack w="full" spacing={4}>
                <Button
                  as={Link}
                  href="/auth/signin"
                  colorScheme="blue"
                  rightIcon={<FaArrowRight />}
                  w="full"
                >
                  ログインする
                </Button>
                
                <Button
                  as={Link}
                  href="/"
                  variant="ghost"
                  size="sm"
                  w="full"
                >
                  トップページへ
                </Button>
              </VStack>
            )}
          </VStack>
        </Box>
      </Container>
    </Layout>
  );
} 